"""Bounded, per-visitor in-memory sessions for the public demo."""

from __future__ import annotations

import re
import secrets
import threading
import time
from collections import OrderedDict
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from ereditas.demo import DemoSession
from ereditas.meta import MetaStack
from ereditas.settings import Settings

SID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{24}$")


@dataclass(frozen=True)
class SessionHandle:
    sid: str
    session: DemoSession
    lock: Any
    created: bool


@dataclass
class _StoredSession:
    session: DemoSession
    lock: Any
    last_seen: float


class SessionStore:
    """Thread-safe idle-expiring LRU store backed by server-generated IDs."""

    def __init__(
        self,
        *,
        settings: Settings,
        meta: MetaStack,
        idle_ttl_seconds: float = 2 * 60 * 60,
        max_sessions: int = 300,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if idle_ttl_seconds <= 0:
            raise ValueError("idle_ttl_seconds must be positive")
        if max_sessions <= 0:
            raise ValueError("max_sessions must be positive")
        self._settings = settings
        self._meta = meta
        self._idle_ttl_seconds = idle_ttl_seconds
        self._max_sessions = max_sessions
        self._clock = clock
        self._lock = threading.Lock()
        self._sessions: OrderedDict[str, _StoredSession] = OrderedDict()

    def resolve(self, candidate_sid: str | None) -> SessionHandle:
        now = self._clock()
        with self._lock:
            self._expire_idle(now)
            if candidate_sid is not None and SID_PATTERN.fullmatch(candidate_sid):
                stored = self._sessions.get(candidate_sid)
                if stored is not None:
                    stored.last_seen = now
                    self._sessions.move_to_end(candidate_sid)
                    return SessionHandle(
                        sid=candidate_sid,
                        session=stored.session,
                        lock=stored.lock,
                        created=False,
                    )

            while len(self._sessions) >= self._max_sessions:
                self._sessions.popitem(last=False)

            sid = self._new_sid()
            stored = _StoredSession(
                session=DemoSession(self._settings, meta=self._meta),
                lock=threading.Lock(),
                last_seen=now,
            )
            self._sessions[sid] = stored
            return SessionHandle(
                sid=sid,
                session=stored.session,
                lock=stored.lock,
                created=True,
            )

    def clear(self) -> None:
        with self._lock:
            self._sessions.clear()

    def __len__(self) -> int:
        with self._lock:
            self._expire_idle(self._clock())
            return len(self._sessions)

    def __contains__(self, sid: object) -> bool:
        if not isinstance(sid, str):
            return False
        with self._lock:
            self._expire_idle(self._clock())
            return sid in self._sessions

    def _expire_idle(self, now: float) -> None:
        expired = [
            sid
            for sid, stored in self._sessions.items()
            if now - stored.last_seen >= self._idle_ttl_seconds
        ]
        for sid in expired:
            del self._sessions[sid]

    def _new_sid(self) -> str:
        while True:
            sid = secrets.token_urlsafe(18)
            if sid not in self._sessions:
                return sid
