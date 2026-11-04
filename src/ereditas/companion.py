"""FastAPI companion for the hackathon demo."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from ereditas.demo import DemoSession
from ereditas.settings import Settings

ROOT = Path(__file__).resolve().parents[2]
STATIC = ROOT / "apps" / "companion" / "static"

settings = Settings()
session = DemoSession(settings)

app = FastAPI(title="Ereditas companion", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=(
        "http://127.0.0.1:8080",
        "http://localhost:8080",
    ),
    allow_methods=("GET", "POST", "OPTIONS"),
    allow_headers=("Content-Type",),
)
app.mount("/static", StaticFiles(directory=STATIC), name="static")

THEMES = ("midnight", "heritage", "forest", "minimal", "stone")


class AnswerBody(BaseModel):
    who: str = "Ana"
    answer: str = Field(pattern="^(well|unsure|passed)$")


class VoiceAnswerBody(BaseModel):
    who: str = Field(default="Ana", min_length=1, max_length=80)
    clip: Literal["ana-passed", "ana-unsure"]


class ThemeBody(BaseModel):
    theme: str


class AdvanceBody(BaseModel):
    days: int = Field(default=1, ge=1, le=14)


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC / "index.html")


@app.get("/api/health")
def health() -> dict:
    return {
        "ok": True,
        "meta_configured": settings.meta_configured,
        "hf_configured": settings.hf_configured,
        "modal_configured": settings.modal_configured,
        "muse_model": settings.muse_model,
        "muse_voice_model": settings.muse_voice_model,
        "sam_model": settings.sam_model,
    }


@app.get("/api/state")
def state() -> dict:
    return session.snapshot()


@app.post("/api/reset")
def reset() -> dict:
    session.reset()
    return session.snapshot()


@app.post("/api/advance")
def advance(body: AdvanceBody | None = None) -> dict:
    days = body.days if body else 1
    return session.advance(days)


@app.post("/api/scan")
def scan() -> dict:
    return session.scan()


@app.post("/api/message")
def message() -> dict:
    return session.message()


@app.post("/api/worked-case")
def worked_case() -> dict:
    return session.worked_case()


@app.post("/api/answer")
def answer(body: AnswerBody) -> dict:
    return session.answer(body.who, body.answer)


@app.post("/api/voice-answer")
def voice_answer(body: VoiceAnswerBody) -> dict:
    return session.voice_answer(body.who, body.clip)


@app.post("/api/theme")
def theme(body: ThemeBody) -> dict:
    if body.theme not in THEMES:
        raise HTTPException(status_code=400, detail="unknown theme")
    session.theme = body.theme
    return session.snapshot()


def main() -> None:
    import uvicorn

    uvicorn.run("ereditas.companion:app", host="127.0.0.1", port=8765, reload=False)


if __name__ == "__main__":
    main()
