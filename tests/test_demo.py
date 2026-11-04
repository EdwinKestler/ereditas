from ereditas.demo import DemoSession
from ereditas.settings import Settings


def _session() -> DemoSession:
    return DemoSession(Settings(_env_file=None, meta_api_key="", model_api_key=""))


def test_two_days_scan_does_not_open_tree():
    s = _session()
    s.advance(2)
    snap = s.scan()
    assert snap["days"] == 2
    assert snap["chips"]["device"] is False
    assert len(snap["posts"]) == 3
    assert snap["tree_open"] is False
    assert snap["may_release"] is False


def test_worked_case_opens_tree_and_passed_releases_scope():
    s = _session()
    snap = s.worked_case()
    assert snap["tree_open"] is True
    assert snap["news"] == "obituary"
    assert snap["posterior"] > 20
    released = s.answer("Ana", "passed")
    assert released["may_release"] is True
    assert released["packet"] is not None
    assert "password" not in released["packet"]["whatsapp_body"].lower()
    assert all("ereditas://grant/" in item["link"] for item in released["packet"]["items"])
    assert any(w["done"] for w in released["wishes"])


def test_voice_answer_refused_while_tree_is_closed():
    s = _session()

    snap = s.voice_answer("Ana", "ana-passed")

    assert snap["tree_open"] is False
    assert snap["packet"] is None
    assert snap["voice"] is None
    assert snap["error"]


def test_unknown_voice_clip_is_refused_without_resolving_a_path():
    s = _session()
    s.worked_case()

    snap = s.voice_answer("Ana", "../../ana-passed")

    assert snap["packet"] is None
    assert snap["voice"] is None
    assert snap["error"] == "Unknown voice clip."


def test_passed_voice_releases_exactly_drive_and_facebook():
    s = _session()
    s.worked_case()
    s.message()

    snap = s.voice_answer("Ana", "ana-passed")

    assert snap["confirmation"] == "passed"
    assert {item["grant_id"] for item in snap["packet"]["items"]} == {
        "drive",
        "facebook",
    }
    assert snap["voice"]["clip_url"] == "/static/voice/ana-passed.wav"
    assert snap["voice"]["interpreted"] == "passed"
    assert snap["voice"]["models"] == {
        "transcribe": "muse-voice-transcribe-1.0",
        "interpret": "muse-spark-1.3",
    }
