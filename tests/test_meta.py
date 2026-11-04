import json
import threading
import time
from pathlib import Path
from types import SimpleNamespace

import httpx
import openai

from ereditas.meta import MetaStack, _parse_boxes
from ereditas.settings import Settings


def _run_together(callable_):
    gate = threading.Barrier(3)
    results = []

    def worker():
        gate.wait()
        results.append(callable_())

    threads = [threading.Thread(target=worker) for _ in range(2)]
    for thread in threads:
        thread.start()
    gate.wait()
    for thread in threads:
        thread.join(timeout=2)
        assert not thread.is_alive()
    return results


def test_shared_stack_constructs_only_one_client_under_concurrency(monkeypatch):
    created = []

    def fake_openai(**_kwargs):
        time.sleep(0.05)
        client = object()
        created.append(client)
        return client

    monkeypatch.setattr(openai, "OpenAI", fake_openai)
    stack = MetaStack(
        Settings(_env_file=None, meta_api_key="test-key", model_api_key="")
    )

    clients = _run_together(stack.client)

    assert len(created) == 1
    assert clients == [created[0], created[0]]


def test_shared_sam_cache_makes_one_call_under_concurrency(
    tmp_path: Path, monkeypatch
):
    image = tmp_path / "candle.jpg"
    image.write_bytes(b"not-a-real-jpeg")

    class FakeResponses:
        def __init__(self):
            self.calls = 0

        def create(self, **_kwargs):
            self.calls += 1
            time.sleep(0.05)
            return SimpleNamespace(output_text="")

    responses = FakeResponses()
    fake_client = SimpleNamespace(responses=responses)
    monkeypatch.delenv("EREDITAS_OFFLINE", raising=False)
    stack = MetaStack(
        Settings(_env_file=None, meta_api_key="test-key", model_api_key="")
    )
    monkeypatch.setattr(stack, "client", lambda: fake_client)

    results = _run_together(lambda: stack.segment_image(image, "candle"))

    assert responses.calls == 1
    assert results[0] is results[1]


def test_parse_sam_grammar_normalizes_inclusive_box():
    wire = (
        "<0f>0<|box;x1=181;y1=365;x2=556;y2=486;w=1516;h=1600|>"
        "<|mask;x=0;y=0;data=122,376,~abc|>"
    )
    boxes = _parse_boxes(wire, "candle")
    assert len(boxes) == 1
    box = boxes[0]
    assert box["label"] == "candle"
    assert abs(box["x"] - 181 / 1516) < 1e-6
    assert abs(box["y"] - 365 / 1600) < 1e-6
    assert abs(box["w"] - (556 - 181 + 1) / 1516) < 1e-6
    assert abs(box["h"] - (486 - 365 + 1) / 1600) < 1e-6


def test_parse_sam_grammar_two_objects():
    wire = (
        "<0f>0<|box;x1=10;y1=20;x2=110;y2=220;w=1000;h=1000|>,"
        "1<|box;x1=200;y1=50;x2=400;y2=250;w=1000;h=1000|>"
    )
    boxes = _parse_boxes(wire, "ribbon")
    assert len(boxes) == 2
    assert boxes[0]["w"] == 0.101
    assert boxes[1]["x"] == 0.2


def test_parse_json_fallback_still_works():
    boxes = _parse_boxes(
        '[{"label":"lilies","x":0.18,"y":0.10,"w":0.64,"h":0.78}]',
        "lilies",
    )
    assert boxes[0]["label"] == "lilies"
    assert boxes[0]["x"] == 0.18


def test_offline_segment_uses_mock_box(tmp_path: Path):
    img = tmp_path / "candle.jpg"
    img.write_bytes(b"not-a-real-jpeg")
    stack = MetaStack(Settings(_env_file=None, meta_api_key="", model_api_key=""))
    result = stack.segment_image(img, "candle")
    assert result["source"] == "mock"
    assert result["boxes"][0]["label"] == "candle"


def test_offline_transcribe_uses_deterministic_spanish_mock(tmp_path: Path):
    audio = tmp_path / "ana-passed.wav"
    audio.write_bytes(b"not-real-audio")
    stack = MetaStack(Settings(_env_file=None, meta_api_key="", model_api_key=""))

    result = stack.transcribe(audio)

    assert result == {
        "text": "Hola, soy Ana. Con mucho dolor les confirmo que Elena falleció anoche.",
        "source": "mock",
        "model": None,
    }


def test_live_transcribe_uses_documented_meta_multipart_shape(
    tmp_path: Path, monkeypatch
):
    audio = tmp_path / "ana-passed.wav"
    audio.write_bytes(b"RIFF-fake")
    captured = {}

    class FakeResponse:
        status_code = 200

        def raise_for_status(self):
            return None

        def json(self):
            return {"transcript": "Elena falleció anoche."}

    class FakeClient:
        def __init__(self, **kwargs):
            captured["client"] = kwargs

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def post(self, url, **kwargs):
            captured["url"] = url
            captured["post"] = kwargs
            return FakeResponse()

    monkeypatch.delenv("EREDITAS_OFFLINE", raising=False)
    monkeypatch.setattr(httpx, "Client", FakeClient)
    stack = MetaStack(
        Settings(_env_file=None, meta_api_key="test-key", model_api_key="")
    )

    result = stack.transcribe(audio)

    assert captured["url"] == "https://api.meta.ai/v1/asr/transcribe"
    request_part = captured["post"]["files"]["request"]
    assert request_part[2] == "application/json"
    assert json.loads(request_part[1]) == {
        "mode": "PUSH_TO_TALK",
        "model": "muse-voice-transcribe-1.0",
        "audioEncoding": "WAV",
        "languageBias": ["Spanish"],
        "keywords": ["Ana", "Elena", "Ereditas"],
    }
    assert captured["post"]["files"]["audio"][2] == "audio/wav"
    assert result["text"] == "Elena falleció anoche."
    assert result["source"] == "meta"
    assert result["model"] == "muse-voice-transcribe-1.0"


def test_offline_interpretation_is_fail_closed_for_ambiguous_and_hedged_text():
    stack = MetaStack(Settings(_env_file=None, meta_api_key="", model_api_key=""))

    ambiguous = stack.interpret_confirmation(
        "No sé, no he podido hablar con ella desde el martes.", "Ana"
    )
    hedged = stack.interpret_confirmation("Creo que Elena falleció.", "Ana")
    clear = stack.interpret_confirmation(
        "Con mucho dolor les confirmo que Elena falleció anoche.", "Ana"
    )

    assert ambiguous["answer"] == "unsure"
    assert hedged["answer"] == "unsure"
    assert clear["answer"] == "passed"
    assert clear["source"] == "mock"


def test_interpretation_malformed_model_json_is_unsure(monkeypatch):
    class FakeCompletions:
        def create(self, **_kwargs):
            return SimpleNamespace(
                choices=[
                    SimpleNamespace(message=SimpleNamespace(content="not json"))
                ]
            )

    fake_client = SimpleNamespace(
        chat=SimpleNamespace(completions=FakeCompletions())
    )
    monkeypatch.delenv("EREDITAS_OFFLINE", raising=False)
    stack = MetaStack(
        Settings(_env_file=None, meta_api_key="test-key", model_api_key="")
    )
    monkeypatch.setattr(stack, "client", lambda: fake_client)

    result = stack.interpret_confirmation(
        "Elena falleció anoche.", "Ana"
    )

    assert result["answer"] == "unsure"
    assert result["quote"] == "Elena falleció anoche."
    assert result["model"] == "muse-spark-1.3"
