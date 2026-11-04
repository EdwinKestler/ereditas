"""Algorithm 2: scoped, audited release. Never a password dump."""

from __future__ import annotations

import secrets
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class VaultError(Exception):
    pass


class Role(str, Enum):
    PRIMARY_HEIR = "primary"
    SECONDARY = "secondary"
    EXECUTOR = "executor"
    VIEW_ONLY = "view"


class Action(str, Enum):
    SHARE = "share"
    MEMORIALIZE = "memorialize"
    VIEW = "view"
    HOLD = "hold"
    CLOSE = "close"


@dataclass
class Grant:
    id: str
    asset: str
    heir: str
    role: Role
    action: Action
    high_value: bool = False
    released: bool = False


@dataclass
class ReleaseItem:
    grant_id: str
    asset: str
    heir: str
    action: Action
    link: str
    secret: None = None
    ttl_minutes: int = 30


@dataclass
class HeirPacket:
    items: list[ReleaseItem]
    whatsapp_body: str
    confirmer: str


def _mint_link(grant_id: str) -> str:
    token = secrets.token_urlsafe(8)
    return f"ereditas://grant/{grant_id}/{token}"


class Vault:
    def __init__(self) -> None:
        self.grants: dict[str, Grant] = {}
        self.audit: list[dict[str, Any]] = []

    def add_grant(self, grant: Grant) -> None:
        self.grants[grant.id] = grant

    def _eligible(
        self,
        confirmer: str,
        confirmer_role: Role,
        *,
        second_confirmer: bool,
    ) -> list[Grant]:
        out: list[Grant] = []
        for grant in self.grants.values():
            if grant.released:
                continue
            if grant.high_value and not second_confirmer:
                continue
            if grant.high_value and second_confirmer:
                out.append(grant)
                continue
            if grant.heir == confirmer or grant.role == confirmer_role:
                out.append(grant)
        return out

    def release(
        self,
        confirmer: str,
        confirmer_role: Role,
        passed: bool,
        second_confirmer: bool = False,
    ) -> HeirPacket:
        if not passed:
            raise VaultError("gate closed: confirmation is not passed")

        chosen = self._eligible(
            confirmer, confirmer_role, second_confirmer=second_confirmer
        )
        items: list[ReleaseItem] = []
        for grant in chosen:
            grant.released = True
            items.append(
                ReleaseItem(
                    grant_id=grant.id,
                    asset=grant.asset,
                    heir=grant.heir,
                    action=grant.action,
                    link=_mint_link(grant.id),
                    secret=None,
                )
            )

        names = ", ".join(item.asset for item in items) or "no matching grants"
        body = (
            f"{confirmer}, a scoped Ereditas package is ready. "
            f"Open the time-limited links in the companion ({names}). "
            "This message carries links, not credentials."
        )
        packet = HeirPacket(items=items, whatsapp_body=body, confirmer=confirmer)
        self.audit.append(
            {
                "confirmer": confirmer,
                "role": confirmer_role.value,
                "grant_ids": [item.grant_id for item in items],
                "second_confirmer": second_confirmer,
            }
        )
        return packet
