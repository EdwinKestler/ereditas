from pathlib import Path

from ereditas.meta import MetaStack, _parse_boxes
from ereditas.settings import Settings


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
