"""Confirmation tree: well resets, unsure escalates, passed is the gate."""

from ereditas.confirmation import Answer, ConfirmationTree
from ereditas.liveness import PRIOR_14D, WatchSignals, run_watch_day


def test_well_resets_posterior_and_closes_tree():
    tree = ConfirmationTree(contacts=["Ana", "Daniel", "Counsel"])
    result = tree.answer("Ana", Answer.WELL)
    assert result.state == "reset"
    assert result.next_contact is None
    assert result.passed is False


def test_unsure_escalates_without_release():
    tree = ConfirmationTree(contacts=["Ana", "Daniel", "Counsel"])
    result = tree.answer("Ana", Answer.UNSURE)
    assert result.state == "escalate"
    assert result.next_contact == "Daniel"
    assert result.passed is False


def test_passed_from_primary_is_the_gate():
    tree = ConfirmationTree(contacts=["Ana", "Daniel", "Counsel"])
    result = tree.answer("Ana", Answer.PASSED)
    assert result.passed is True
    assert result.state == "passed"


def test_day_plus_passed_allows_release_flag():
    signals = WatchSignals(
        device_silent_days=10,
        meta_silent_days=10,
        heartbeat_misses=1,
        news="obituary",
        memorial_posts=1,
        scanned=True,
        confirmation="passed",
    )
    day = run_watch_day(signals)
    assert day.tree_open is True
    assert day.may_release is True
    assert day.watch_index == 0.97
    assert day.posterior == PRIOR_14D or day.posterior > 0.2
