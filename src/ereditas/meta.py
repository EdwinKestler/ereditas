"""Meta Model API client. Keys stay in process env; they are never logged."""

from __future__ import annotations

import base64
import json
import logging
import os
import re
import unicodedata
from pathlib import Path
from typing import Any

import httpx

from ereditas.settings import Settings

log = logging.getLogger("ereditas.meta")

MEMORIAL_VOCAB = ("candle", "ribbon", "lilies", "cross")

MOCK_TRANSCRIPTS = {
    "ana-passed": (
        "Hola, soy Ana. Con mucho dolor les confirmo que Elena falleció anoche."
    ),
    "ana-unsure": "No sé, no he podido hablar con ella desde el martes.",
}

_HEDGES = (
    "no se",
    "no estoy segura",
    "no estoy seguro",
    "no he podido",
    "tal vez",
    "quizas",
    "creo que",
    "parece que",
    "puede que",
    "aparentemente",
    "segun me dijeron",
    "me dijeron que",
    "maybe",
    "might",
    "not sure",
    "i think",
    "possibly",
    "probably",
    "apparently",
    "i heard",
)
_PASSED_MARKERS = (
    "fallecio",
    "ha fallecido",
    "murio",
    "passed away",
    "has passed",
    "died",
)
_WELL_MARKERS = (
    "esta bien",
    "esta conmigo",
    "hable con ella",
    "la vi hoy",
    "she is well",
    "she is alive",
    "she is with me",
)

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


def _plain(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text.casefold())
    return " ".join(
        "".join(char for char in normalized if not unicodedata.combining(char)).split()
    )


def _has_hedge(text: str) -> bool:
    value = _plain(text)
    return any(marker in value for marker in _HEDGES)


def _mock_interpretation(transcript: str) -> str:
    value = _plain(transcript)
    if _has_hedge(transcript):
        return "unsure"
    if any(marker in value for marker in _PASSED_MARKERS):
        return "passed"
    if any(marker in value for marker in _WELL_MARKERS):
        return "well"
    return "unsure"


def _safe_interpretation(transcript: str, raw: str) -> tuple[str, str]:
    fallback_quote = transcript.strip()
    if _has_hedge(transcript):
        return "unsure", fallback_quote
    try:
        parsed = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return "unsure", fallback_quote
    if not isinstance(parsed, dict):
        return "unsure", fallback_quote
    if set(parsed) != {"answer", "quote"}:
        return "unsure", fallback_quote
    answer = parsed.get("answer")
    quote = parsed.get("quote")
    if answer not in {"well", "unsure", "passed"} or not isinstance(quote, str):
        return "unsure", fallback_quote
    quote = quote.strip()
    if not quote or _plain(quote) not in _plain(transcript) or _has_hedge(quote):
        return "unsure", fallback_quote
    if answer in {"well", "passed"} and _mock_interpretation(quote) != answer:
        return "unsure", fallback_quote
    return answer, quote


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

    def _mock_transcript(self, audio_path: Path) -> str:
        return MOCK_TRANSCRIPTS.get(
            audio_path.stem,
            "No sé, no he podido confirmar qué ocurrió.",
        )

    def transcribe(self, audio_path: Path) -> dict[str, Any]:
        """Transcribe one bundled WAV with Meta's documented ASR file endpoint."""
        fallback = self._mock_transcript(audio_path)
        if (
            os.environ.get("EREDITAS_OFFLINE") == "1"
            or not self.configured
            or not audio_path.is_file()
        ):
            return {"text": fallback, "source": "mock", "model": None}

        request = {
            "mode": "PUSH_TO_TALK",
            "model": self.settings.muse_voice_model,
            "audioEncoding": "WAV",
            "languageBias": ["Spanish"],
            "keywords": ["Ana", "Elena", "Ereditas"],
        }
        endpoint = (
            f"{self.settings.model_api_base_url.rstrip('/')}/asr/transcribe"
        )
        try:
            with audio_path.open("rb") as audio, httpx.Client(timeout=30.0) as client:
                response = client.post(
                    endpoint,
                    headers={
                        "Authorization": f"Bearer {self.settings.api_key}",
                        "Accept": "application/json",
                    },
                    files={
                        "request": (
                            None,
                            json.dumps(request, ensure_ascii=False),
                            "application/json",
                        ),
                        "audio": (audio_path.name, audio, "audio/wav"),
                    },
                )
                response.raise_for_status()
                text = str(response.json().get("transcript") or "").strip()
                if not text:
                    return {
                        "text": fallback,
                        "source": "mock",
                        "model": self.settings.muse_voice_model,
                    }
                return {
                    "text": text,
                    "source": "meta",
                    "model": self.settings.muse_voice_model,
                }
        except httpx.HTTPStatusError as exc:
            log.warning(
                "Muse Voice Transcribe fallback after HTTP %s",
                exc.response.status_code,
            )
        except Exception as exc:  # noqa: BLE001 — demo must survive API errors
            log.warning(
                "Muse Voice Transcribe fallback (%s)", type(exc).__name__
            )
        return {
            "text": fallback,
            "source": "mock",
            "model": self.settings.muse_voice_model,
        }

    def interpret_confirmation(self, transcript: str, who: str) -> dict[str, Any]:
        """Classify a transcript; Python validation always fails closed."""
        client = self.client()
        if os.environ.get("EREDITAS_OFFLINE") == "1" or client is None:
            return {
                "answer": _mock_interpretation(transcript),
                "quote": transcript.strip(),
                "source": "mock",
                "model": None,
            }

        schema = {
            "type": "json_schema",
            "json_schema": {
                "name": "confirmation_interpretation",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "answer": {
                            "type": "string",
                            "enum": ["well", "unsure", "passed"],
                        },
                        "quote": {"type": "string"},
                    },
                    "required": ["answer", "quote"],
                    "additionalProperties": False,
                },
            },
        }
        try:
            response = client.chat.completions.create(
                model=self.settings.muse_model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Classify only the quoted confirmation transcript. "
                            "well means the person is clearly alive and well; passed "
                            "means death is explicitly confirmed; unsure covers every "
                            "ambiguous, indirect, or hedged statement. Return a direct "
                            "verbatim quote from the transcript. Never authorize or "
                            "describe release actions."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Speaker: {who}\nTranscript: {transcript}",
                    },
                ],
                response_format=schema,
            )
            raw = response.choices[0].message.content or ""
            answer, quote = _safe_interpretation(transcript, raw)
            return {
                "answer": answer,
                "quote": quote,
                "source": "meta",
                "model": self.settings.muse_model,
            }
        except Exception as exc:  # noqa: BLE001 — demo must survive API errors
            status = getattr(exc, "status_code", None)
            if status is not None:
                log.warning("Muse Spark interpretation fallback after HTTP %s", status)
            else:
                log.warning("Muse Spark interpretation fallback (%s)", type(exc).__name__)
            return {
                "answer": _mock_interpretation(transcript),
                "quote": transcript.strip(),
                "source": "mock",
                "model": self.settings.muse_model,
            }

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
                    "You are Ereditas, carrying out Elena Reyes's digital last "
                    f"wishes. {confirmer}, her primary heir, has just confirmed "
                    f"her passing. Write {confirmer} a short, warm letter in "
                    "plain English: 3 or 4 sentences, under 80 words. Open with "
                    "one sentence acknowledging the loss. Then say exactly what "
                    f"was released to {confirmer}: {names}, as time-limited links, "
                    "and that nothing else was released; the wallet and bank "
                    "wait for a second confirmation. Never include or invent "
                    "passwords, seed phrases or account numbers. No medical or "
                    "legal advice. Do not mention hackathons, demos or AI. "
                    "Sign it 'Ereditas, on Elena's behalf'."
                ),
            )
            text = (getattr(response, "output_text", None) or "").strip()
            return text or fallback
        except Exception as exc:  # noqa: BLE001
            log.warning("Muse fallback to canned narrative (%s)", type(exc).__name__)
            return fallback
