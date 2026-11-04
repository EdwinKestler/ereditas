"""In-memory hackathon demo session. Fictional owner, labeled as demo."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from ereditas.confirmation import Answer, ConfirmationTree
from ereditas.liveness import WatchSignals, run_watch_day
from ereditas.meta import MEMORIAL_VOCAB, MetaStack
from ereditas.settings import Settings
from ereditas.vault import Action, Grant, Role, Vault

STATIC = Path(__file__).resolve().parents[2] / "apps" / "companion" / "static"

REPLIES = {
    "well": "She is with me. All is well.",
    "unsure": "I have not heard. I will call her sister.",
    "passed": "She passed this morning. Please take care of the rest.",
}

CIRCLE = [
    {
        "author": "Ana",
        "role": "Primary heir",
        "object": "candle",
        "caption": "For you. Always.",
        "image": "/static/memorial/candle.jpg",
        "path": STATIC / "memorial" / "candle.jpg",
    },
    {
        "author": "Daniel",
        "role": "Secondary",
        "object": "ribbon",
        "caption": "We lit this at the door.",
        "image": "/static/memorial/ribbon.jpg",
        "path": STATIC / "memorial" / "ribbon.jpg",
    },
    {
        "author": "Sofía",
        "role": "Secondary",
        "object": "lilies",
        "caption": "White lilies, as you liked.",
        "image": "/static/memorial/lilies.jpg",
        "path": STATIC / "memorial" / "lilies.jpg",
    },
]


def _fresh_vault() -> Vault:
    vault = Vault()
    vault.add_grant(
        Grant(
            id="drive",
            asset="Google Drive — family photos",
            heir="Ana",
            role=Role.PRIMARY_HEIR,
            action=Action.SHARE,
            high_value=False,
        )
    )
    vault.add_grant(
        Grant(
            id="facebook",
            asset="Facebook memorialization",
            heir="Ana",
            role=Role.PRIMARY_HEIR,
            action=Action.MEMORIALIZE,
            high_value=False,
        )
    )
    vault.add_grant(
        Grant(
            id="wallet",
            asset="Hardware wallet (view-only until counsel)",
            heir="Ana",
            role=Role.PRIMARY_HEIR,
            action=Action.VIEW,
            high_value=True,
        )
    )
    vault.add_grant(
        Grant(
            id="bank",
            asset="Bank login (held for counsel)",
            heir="Counsel",
            role=Role.EXECUTOR,
            action=Action.HOLD,
            high_value=True,
        )
    )
    return vault


class DemoSession:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or Settings()
        self.meta = MetaStack(self.settings)
        self.theme = "midnight"
        self.reset()

    def reset(self) -> None:
        self.device_silent_days = 0
        self.meta_silent_days = 0
        self.heartbeat_misses = 0
        self.news: str = "none"
        self.scanned = False
        self.messaged = False
        self.confirmation = "silent"
        self.tree = ConfirmationTree(["Ana", "Daniel", "Counsel"])
        self.next_contact = "Ana"
        self.vault = _fresh_vault()
        self.posts: list[dict[str, Any]] = []
        self.packet: dict[str, Any] | None = None
        self.narrative = ""
        self.wishes = [
            {"id": "drive", "label": "Share family Drive with Ana", "done": False},
            {"id": "facebook", "label": "Request Facebook memorialization", "done": False},
            {"id": "note", "label": "Deliver the letter she wrote", "done": False},
        ]
        self.thread: list[dict[str, str]] = []

    def _signals(self) -> WatchSignals:
        return WatchSignals(
            device_silent_days=self.device_silent_days,
            meta_silent_days=self.meta_silent_days,
            heartbeat_misses=self.heartbeat_misses,
            news=self.news,  # type: ignore[arg-type]
            memorial_posts=len(self.posts),
            scanned=self.scanned,
            confirmation=self.confirmation,  # type: ignore[arg-type]
        )

    def advance(self, days: int = 1) -> dict[str, Any]:
        self.device_silent_days += days
        self.meta_silent_days += days
        if self.device_silent_days >= 8 and self.heartbeat_misses == 0:
            self.heartbeat_misses = 1
        return self.snapshot()

    def scan(self) -> dict[str, Any]:
        self.scanned = True
        if self.device_silent_days >= 2 and not self.posts:
            for post in CIRCLE:
                result = self.meta.segment_image(post["path"], post["object"])
                self.posts.append(
                    {
                        "author": post["author"],
                        "role": post["role"],
                        "caption": post["caption"],
                        "image": post["image"],
                        "object": post["object"],
                        "boxes": result["boxes"],
                        "source": result["source"],
                    }
                )
        if self.device_silent_days >= 10:
            self.news = "obituary"
        elif self.device_silent_days >= 6:
            self.news = "name"
        return self.snapshot()

    def message(self) -> dict[str, Any]:
        day = run_watch_day(self._signals())
        if not day.tree_open:
            return self.snapshot(error="Tree is closed. Posterior is under the 20% bar.")
        if not self.messaged:
            self.messaged = True
            self.thread.append(
                {
                    "from": "Ereditas",
                    "side": "out",
                    "text": (
                        "Ereditas watch for Elena Reyes is elevated. "
                        "Have you seen her in the last day? Reply well, unsure, or passed."
                    ),
                }
            )
        return self.snapshot()

    def worked_case(self) -> dict[str, Any]:
        """White paper Table 4 episode, so the tree can open in a live demo."""
        self.device_silent_days = 10
        self.meta_silent_days = 10
        self.heartbeat_misses = 1
        self.news = "obituary"
        self.confirmation = "silent"
        self.packet = None
        self.narrative = ""
        self.thread = []
        self.messaged = False
        self.next_contact = "Ana"
        self.tree = ConfirmationTree(["Ana", "Daniel", "Counsel"])
        self.vault = _fresh_vault()
        for wish in self.wishes:
            wish["done"] = False
        self.posts = []
        self.scanned = False
        return self.scan()

    def answer(self, who: str, answer: str) -> dict[str, Any]:
        day = run_watch_day(self._signals())
        if not day.tree_open and answer != "well":
            return self.snapshot(error="Tree is closed. Posterior is under the 20% bar.")
        result = self.tree.answer(who, Answer(answer))
        self.thread.append(
            {
                "from": who,
                "side": "in",
                "text": REPLIES.get(answer, answer),
            }
        )
        if result.state == "reset":
            self.reset()
            self.confirmation = "well"
            return self.snapshot()
        if result.state == "escalate":
            self.confirmation = "unsure"
            self.next_contact = result.next_contact or who
            self.thread.append(
                {
                    "from": "Ereditas",
                    "side": "out",
                    "text": f"{who} is unsure. Escalating to {self.next_contact}.",
                }
            )
            return self.snapshot()
        self.confirmation = "passed"
        packet = self.vault.release(
            confirmer=who, confirmer_role=Role.PRIMARY_HEIR, passed=True
        )
        self.packet = {
            "confirmer": packet.confirmer,
            "whatsapp_body": packet.whatsapp_body,
            "items": [
                {
                    "grant_id": item.grant_id,
                    "asset": item.asset,
                    "heir": item.heir,
                    "action": item.action.value,
                    "link": item.link,
                    "ttl_minutes": item.ttl_minutes,
                }
                for item in packet.items
            ],
        }
        assets = [item.asset for item in packet.items]
        self.narrative = self.meta.heir_narrative(who, assets)
        self.thread.append(
            {"from": "Ereditas", "side": "out", "text": packet.whatsapp_body}
        )
        for wish in self.wishes:
            if wish["id"] in {item.grant_id for item in packet.items} or wish["id"] == "note":
                wish["done"] = True
        return self.snapshot()

    def snapshot(self, error: str | None = None) -> dict[str, Any]:
        day = run_watch_day(self._signals())
        chips = {
            "device": self.device_silent_days == 0,
            "meta": self.meta_silent_days == 0,
            "heartbeat": self.heartbeat_misses == 0,
        }
        ring = round(day.watch_index * 100)
        return {
            "demo": True,
            "owner": "Elena Reyes (demo persona)",
            "theme": self.theme,
            "error": error,
            "days": self.device_silent_days,
            "chips": chips,
            "news": self.news,
            "scanned": self.scanned,
            "messaged": self.messaged,
            "confirmation": self.confirmation,
            "next_contact": self.next_contact,
            "tree_open": day.tree_open,
            "may_release": day.may_release,
            "posterior": round(day.posterior * 100, 4),
            "posterior_label": f"{day.posterior * 100:.2f}%",
            "watch_index": day.watch_index,
            "ring": ring,
            "band": day.band,
            "likelihoods": [{"name": n, "lr": lr} for n, lr in day.likelihoods],
            "posts": self.posts,
            "packet": self.packet,
            "narrative": self.narrative,
            "wishes": self.wishes,
            "thread": self.thread,
            "audit": self.vault.audit,
            "grants": [
                {
                    "id": g.id,
                    "asset": g.asset,
                    "heir": g.heir,
                    "role": g.role.value,
                    "action": g.action.value,
                    "high_value": g.high_value,
                    "released": g.released,
                }
                for g in self.vault.grants.values()
            ],
            "meta": {
                "configured": self.meta.configured,
                "muse_model": self.settings.muse_model,
                "sam_model": self.settings.sam_model,
                "vocab": list(MEMORIAL_VOCAB),
            },
            "index_note": "The ring is a watch index, not P(Z=1|x).",
        }
