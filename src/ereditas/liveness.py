"""Liveness watch: posterior, watch index, Algorithm 1 (white paper §§4–5)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

ANNUAL_Q = 0.002
WINDOW_DAYS = 14
# Paper states 0.000077 (0.0077%). The closed form 1-(1-q)^(w/365) is that value.
PRIOR_14D = 1.0 - (1.0 - ANNUAL_Q) ** (WINDOW_DAYS / 365.0)
CALL_THRESHOLD = 0.20

NewsKind = Literal["none", "name", "obituary"]
ConfirmationKind = Literal["silent", "well", "unsure", "passed"] | None


def posterior(p: float, lr: float) -> float:
    if lr == 1.0:
        return p
    p = min(max(p, 0.0), 1.0 - 1e-15)
    odds = p / (1.0 - p)
    odds *= lr
    return odds / (1.0 + odds)


def device_lr(days: int) -> float:
    d = max(int(days), 0)
    if d <= 1:
        return 1.0
    if d <= 3:
        return 1.5
    if d <= 7:
        return 3.0
    if d <= 14:
        return 8.0
    return 20.0


def meta_lr(meta_silent_days: int) -> float:
    return 3.0 if meta_silent_days >= 2 else 1.0


def heartbeat_lr(misses: int) -> float:
    m = max(int(misses), 0)
    if m <= 0:
        return 1.0
    if m == 1:
        return 4.0
    return 12.0


def memorial_lr(posts: int, from_circle: bool = True) -> float:
    if not from_circle or posts <= 0:
        return 1.0
    n = min(int(posts), 3)
    return 6.0 ** n


def news_lr(kind: str) -> float:
    if kind == "obituary":
        return 15.0
    if kind == "name":
        return 2.0
    return 1.0


def watch_index(
    d: int,
    scanned: bool = False,
    memorial: bool = False,
    unsure: bool = False,
    confirmation: ConfirmationKind = None,
) -> float:
    if confirmation == "well":
        return 0.06
    if confirmation == "passed":
        return 0.97
    s = 0.11 + 0.08 * min(max(int(d), 0), 8)
    if scanned:
        s += 0.08
    if memorial:
        s += 0.14
    if unsure:
        s += 0.05
    return min(s, 0.92)


@dataclass(frozen=True)
class WatchSignals:
    device_silent_days: int = 0
    meta_silent_days: int = 0
    heartbeat_misses: int = 0
    news: NewsKind = "none"
    memorial_posts: int = 0
    scanned: bool = False
    confirmation: ConfirmationKind = "silent"


@dataclass
class WatchDay:
    posterior: float
    watch_index: float
    tree_open: bool
    may_release: bool
    likelihoods: list[tuple[str, float]] = field(default_factory=list)
    band: str = "steady"


def _likelihoods(signals: WatchSignals) -> list[tuple[str, float]]:
    rows = [
        ("device", device_lr(signals.device_silent_days)),
        ("meta", meta_lr(signals.meta_silent_days)),
        ("heartbeat", heartbeat_lr(signals.heartbeat_misses)),
        ("memorial", memorial_lr(signals.memorial_posts)),
        ("news", news_lr(signals.news)),
    ]
    return rows


def run_watch_day(signals: WatchSignals) -> WatchDay:
    """Algorithm 1. Release is never a function of the score alone."""
    rows = _likelihoods(signals)
    p = PRIOR_14D
    if signals.confirmation != "well":
        for _, lr in rows:
            p = posterior(p, lr)
    else:
        p = PRIOR_14D

    idx = watch_index(
        signals.device_silent_days,
        scanned=signals.scanned,
        memorial=signals.memorial_posts > 0,
        unsure=signals.confirmation == "unsure",
        confirmation=signals.confirmation
        if signals.confirmation in ("well", "passed")
        else None,
    )

    if signals.device_silent_days <= 1 and not signals.scanned:
        band = "steady"
    elif idx < 0.50:
        band = "quiet"
    else:
        band = "elevated"

    external = signals.news != "none" or signals.memorial_posts > 0
    tree_open = False
    if signals.confirmation == "passed":
        tree_open = True
    elif signals.confirmation == "well":
        tree_open = False
        p = PRIOR_14D
    elif signals.scanned and signals.device_silent_days >= 2:
        tree_open = p >= CALL_THRESHOLD and external

    may_release = signals.confirmation == "passed"
    return WatchDay(
        posterior=p,
        watch_index=idx,
        tree_open=tree_open,
        may_release=may_release,
        likelihoods=rows,
        band=band,
    )
