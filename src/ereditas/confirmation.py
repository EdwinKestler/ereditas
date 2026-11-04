"""Confirmation tree. A human answer is a gate, not a likelihood."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Answer(str, Enum):
    WELL = "well"
    UNSURE = "unsure"
    PASSED = "passed"


@dataclass(frozen=True)
class TreeResult:
    state: str
    next_contact: str | None
    passed: bool


class ConfirmationTree:
    def __init__(self, contacts: list[str]) -> None:
        if not contacts:
            raise ValueError("contacts required")
        self.contacts = list(contacts)

    def answer(self, who: str, answer: Answer) -> TreeResult:
        if answer is Answer.WELL:
            return TreeResult(state="reset", next_contact=None, passed=False)
        if answer is Answer.PASSED:
            return TreeResult(state="passed", next_contact=None, passed=True)
        try:
            idx = self.contacts.index(who)
        except ValueError:
            idx = 0
        nxt = self.contacts[idx + 1] if idx + 1 < len(self.contacts) else None
        return TreeResult(state="escalate", next_contact=nxt, passed=False)
