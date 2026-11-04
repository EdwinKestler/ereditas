"""FastAPI companion for the hackathon demo."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from ereditas.meta import MetaStack
from ereditas.sessions import SessionHandle, SessionStore
from ereditas.settings import Settings

ROOT = Path(__file__).resolve().parents[2]
STATIC = ROOT / "apps" / "companion" / "static"

settings = Settings()
meta = MetaStack(settings)
sessions = SessionStore(settings=settings, meta=meta)

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


def _is_https(request: Request) -> bool:
    forwarded = request.headers.get("fly-forwarded-proto") or request.headers.get(
        "x-forwarded-proto"
    )
    if forwarded and forwarded.split(",", 1)[0].strip().lower() == "https":
        return True
    return request.url.scheme == "https"


def visitor_session(request: Request, response: Response) -> SessionHandle:
    handle = sessions.resolve(request.cookies.get("ereditas_sid"))
    if handle.created:
        response.set_cookie(
            key="ereditas_sid",
            value=handle.sid,
            max_age=6 * 60 * 60,
            path="/",
            secure=_is_https(request),
            httponly=True,
            samesite="lax",
        )
    return handle


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
def state(handle: SessionHandle = Depends(visitor_session)) -> dict:
    with handle.lock:
        return handle.session.snapshot()


@app.post("/api/reset")
def reset(handle: SessionHandle = Depends(visitor_session)) -> dict:
    with handle.lock:
        handle.session.reset()
        return handle.session.snapshot()


@app.post("/api/advance")
def advance(
    body: AdvanceBody | None = None,
    handle: SessionHandle = Depends(visitor_session),
) -> dict:
    days = body.days if body else 1
    with handle.lock:
        return handle.session.advance(days)


@app.post("/api/scan")
def scan(handle: SessionHandle = Depends(visitor_session)) -> dict:
    with handle.lock:
        return handle.session.scan()


@app.post("/api/message")
def message(handle: SessionHandle = Depends(visitor_session)) -> dict:
    with handle.lock:
        return handle.session.message()


@app.post("/api/worked-case")
def worked_case(handle: SessionHandle = Depends(visitor_session)) -> dict:
    with handle.lock:
        return handle.session.worked_case()


@app.post("/api/answer")
def answer(
    body: AnswerBody,
    handle: SessionHandle = Depends(visitor_session),
) -> dict:
    with handle.lock:
        return handle.session.answer(body.who, body.answer)


@app.post("/api/voice-answer")
def voice_answer(
    body: VoiceAnswerBody,
    handle: SessionHandle = Depends(visitor_session),
) -> dict:
    with handle.lock:
        return handle.session.voice_answer(body.who, body.clip)


@app.post("/api/theme")
def theme(
    body: ThemeBody,
    handle: SessionHandle = Depends(visitor_session),
) -> dict:
    if body.theme not in THEMES:
        raise HTTPException(status_code=400, detail="unknown theme")
    with handle.lock:
        handle.session.theme = body.theme
        return handle.session.snapshot()


def main() -> None:
    import uvicorn

    uvicorn.run("ereditas.companion:app", host="127.0.0.1", port=8765, reload=False)


if __name__ == "__main__":
    main()
