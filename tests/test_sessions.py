"""Bounded, expiring visitor sessions around the unchanged demo state machine."""

from ereditas.meta import MetaStack
from ereditas.sessions import SessionStore
from ereditas.settings import Settings


class Clock:
    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now


def make_store(*, clock: Clock, ttl: float = 10.0, cap: int = 3):
    settings = Settings()
    meta = MetaStack(settings)
    return (
        SessionStore(
            settings=settings,
            meta=meta,
            idle_ttl_seconds=ttl,
            max_sessions=cap,
            clock=clock,
        ),
        meta,
    )


def test_known_sid_reuses_session_and_every_session_shares_meta_stack():
    clock = Clock()
    store, meta = make_store(clock=clock)

    first = store.resolve(None)
    second = store.resolve(None)
    same = store.resolve(first.sid)

    assert first.created is True
    assert second.created is True
    assert same.created is False
    assert same.sid == first.sid
    assert same.session is first.session
    assert first.session.meta is meta
    assert second.session.meta is meta


def test_idle_ttl_expires_session_with_injected_clock():
    clock = Clock()
    store, _ = make_store(clock=clock, ttl=10.0)
    first = store.resolve(None)

    clock.now = 9.0
    assert store.resolve(first.sid).session is first.session

    clock.now = 19.0
    expired = store.resolve(first.sid)

    assert expired.created is True
    assert expired.sid != first.sid
    assert expired.session is not first.session


def test_hard_cap_evicts_least_recently_used_session():
    clock = Clock()
    store, _ = make_store(clock=clock, cap=2)
    oldest = store.resolve(None)
    clock.now = 1.0
    newer = store.resolve(None)
    clock.now = 2.0
    store.resolve(oldest.sid)
    clock.now = 3.0

    newest = store.resolve(None)

    assert len(store) == 2
    assert oldest.sid in store
    assert newer.sid not in store
    assert newest.sid in store
