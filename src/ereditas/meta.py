"""Meta Model API client. Keys stay in process env; they are never logged."""

from __future__ import annotations

import base64
import json
import logging
import os
import re
from pathlib import Path
from typing import Any

from ereditas.settings import Settings

log = logging.getLogger("ereditas.meta")

MEMORIAL_VOCAB = ("candle", "ribbon", "lilies", "cross")

MOCK_BOXES: dict[str, dict[str, float | str]] = {
    "candle": {"label": "candle", "x": 0.30, "y": 0.12, "w": 0.40, "h": 0.70},
    "ribbon": {"label": "ribbon", "x": 0.22, "y": 0.18, "w": 0.56, "h": 0.55},
    "lilies": {"label": "lilies", "x": 0.18, "y": 0.10, "w": 0.64, "h": 0.78},
    "cross": {"label": "cross", "x": 0.34, "y": 0.16, "w": 0.32, "h": 0.62},
}

# SAM 3.1 wire: <|box;x1=..;y1=..;x2=..;y2=..;w=..;h=..|>  (x2,y2 inclusive pixels)
_SAM_BOX = re.compile(
    r"<\|box;x1=(?P<x1>[\d.]+);y1=(?P<y1>[\d.]+);x2=(?P<x2>[\d.]+);"
    r"y2=(?P<y2>[\d.]+);w=(?P<w>[\d.]+);h=(?P<h>[\d.]+)"
)


def _data_url(path: Path) -> str:
    raw = path.read_bytes()
    mime = "image/jpeg" if path.suffix.lower() in {".jpg", ".jpeg"} else "image/png"
    return f"data:{mime};base64,{base64.b64encode(raw).decode('ascii')}"


def _parse_sam_grammar(text: str, fallback_label: str) -> list[dict[str, Any]]:
    boxes: list[dict[str, Any]] = []
    for match in _SAM_BOX.finditer(text):
        x1 = float(match.group("x1"))
        y1 = float(match.group("y1"))
        x2 = float(match.group("x2"))
        y2 = float(match.group("y2"))
        width = float(match.group("w")) or 1.0
        height = float(match.group("h")) or 1.0
        boxes.append(
            {
                "label": fallback_label,
                "x": x1 / width,
                "y": y1 / height,
                "w": (x2 - x1 + 1.0) / width,
                "h": (y2 - y1 + 1.0) / height,
            }
        )
    return boxes


def _parse_boxes(text: str, fallback_label: str) -> list[dict[str, Any]]:
    if not text:
        return [dict(MOCK_BOXES[fallback_label])]
    sam = _parse_sam_grammar(text, fallback_label)
    if sam:
        return sam
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}|\[.*\]", text, re.S)
        if not match:
            return [dict(MOCK_BOXES[fallback_label])]
        try:
            data = json.loads(match.group(0))
        except json.JSONDecodeError:
            return [dict(MOCK_BOXES[fallback_label])]
    boxes: list[dict[str, Any]] = []
    items = data if isinstance(data, list) else data.get("objects") or data.get("boxes") or [data]
    for item in items:
        if not isinstance(item, dict):
            continue
        label = str(item.get("label") or item.get("name") or fallback_label).lower()
        box = item.get("box") or item.get("bbox") or item
        x = box.get("x", box.get("xmin", 0.2))
        y = box.get("y", box.get("ymin", 0.2))
        w = box.get("w", box.get("width", box.get("xmax", 0.8) - float(x)))
        h = box.get("h", box.get("height", box.get("ymax", 0.8) - float(y)))
        boxes.append(
            {
                "label": label,
                "x": float(x) if float(x) <= 1.5 else float(x) / 1000.0,
                "y": float(y) if float(y) <= 1.5 else float(y) / 1000.0,
                "w": float(w) if float(w) <= 1.5 else float(w) / 1000.0,
                "h": float(h) if float(h) <= 1.5 else float(h) / 1000.0,
            }
        )
    return boxes or [dict(MOCK_BOXES[fallback_label])]


class MetaStack:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or Settings()
        self._client = None
        self._segment_cache: dict[tuple[str, str], dict[str, Any]] = {}

    @property
    def configured(self) -> bool:
        return self.settings.meta_configured

    def client(self):
        if not self.configured:
            return None
        if self._client is None:
            from openai import OpenAI

            self._client = OpenAI(
                base_url=self.settings.model_api_base_url,
                api_key=self.settings.api_key,
                timeout=30.0,
            )
        return self._client

    def segment_image(self, image_path: Path, label: str) -> dict[str, Any]:
        """SAM 3.1 if a key is present; otherwise the mock box for the label."""
        label = label.lower()
        cache_key = (str(image_path), label)
        if cache_key in self._segment_cache:
            return self._segment_cache[cache_key]
        fallback = [dict(MOCK_BOXES.get(label, MOCK_BOXES["candle"]))]
        client = self.client()
        if (
            os.environ.get("EREDITAS_OFFLINE") == "1"
            or client is None
            or not image_path.exists()
        ):
            result = {"source": "mock", "boxes": fallback, "model": None}
            self._segment_cache[cache_key] = result
            return result
        try:
            response = client.responses.create(
                model=self.settings.sam_model,
                input=[
                    {
                        "type": "message",
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                # SAM 3.1 concept prompt: a noun phrase, never a command.
                                "text": label,
                            },
                            {
                                "type": "input_image",
                                "image_url": _data_url(image_path),
                            },
                        ],
                    }
                ],
            )
            text = getattr(response, "output_text", None) or ""
            boxes = _parse_boxes(text, label)
            result = {
                "source": "sam-3.1",
                "boxes": boxes,
                "model": self.settings.sam_model,
            }
            self._segment_cache[cache_key] = result
            return result
        except Exception as exc:  # noqa: BLE001 — demo must survive API errors
            log.warning("SAM fallback to mock boxes (%s)", type(exc).__name__)
            result = {"source": "mock", "boxes": fallback, "model": self.settings.sam_model}
            self._segment_cache[cache_key] = result
            return result

    def heir_narrative(self, confirmer: str, assets: list[str]) -> str:
        names = ", ".join(assets) if assets else "the classified grants"
        fallback = (
            f"After {confirmer} answered passed, Ereditas minted time-limited "
            f"links for: {names}. Secrets stay in the vault. WhatsApp carries "
            "the notice, not the keys."
        )
        client = self.client()
        if os.environ.get("EREDITAS_OFFLINE") == "1" or client is None:
            return fallback
        try:
            response = client.responses.create(
                model=self.settings.muse_model,
                input=(
                    "You are the Ereditas last-wishes executor. Write 3 short "
                    "sentences for a hackathon demo: scoped heir package after "
                    f"a human confirmation of death by {confirmer}. Assets: {names}. "
                    "Never invent passwords or seed phrases. No medical advice."
                ),
            )
            text = (getattr(response, "output_text", None) or "").strip()
            return text or fallback
        except Exception as exc:  # noqa: BLE001
            log.warning("Muse fallback to canned narrative (%s)", type(exc).__name__)
            return fallback
