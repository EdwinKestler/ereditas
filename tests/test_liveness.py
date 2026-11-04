"""White paper §5: posterior, likelihood ratios, watch index, Algorithm 1."""

from ereditas.liveness import (
    CALL_THRESHOLD,
    PRIOR_14D,
    WatchSignals,
    device_lr,
    heartbeat_lr,
    memorial_lr,
    news_lr,
    posterior,
    run_watch_day,
    watch_index,
)


def test_prior_matches_worked_example():
    assert round(PRIOR_14D * 100, 4) == 0.0077


def test_device_likelihood_ratios_from_table_3():
    assert device_lr(0) == 1.0
    assert device_lr(1) == 1.0
    assert device_lr(2) == 1.5
    assert device_lr(3) == 1.5
    assert device_lr(4) == 3.0
    assert device_lr(7) == 3.0
    assert device_lr(8) == 8.0
    assert device_lr(10) == 8.0
    assert device_lr(14) == 8.0
    assert device_lr(15) == 20.0


def test_worked_case_table_4():
    p = PRIOR_14D
    p = posterior(p, device_lr(10))
    assert round(p * 100, 4) == 0.0614
    p = posterior(p, 3.0)  # Meta also silent
    assert round(p * 100, 3) == 0.184
    p = posterior(p, heartbeat_lr(1))
    assert round(p * 100, 3) == 0.732
    p = posterior(p, memorial_lr(1))
    assert round(p * 100, 1) == 4.2
    p = posterior(p, news_lr("obituary"))
    assert round(p * 100, 1) == 39.9
    assert p > CALL_THRESHOLD


def test_mountain_case_does_not_open_the_tree():
    """Ten-day silence, dollar still clearing, no external evidence."""
    signals = WatchSignals(
        device_silent_days=10,
        meta_silent_days=10,
        heartbeat_misses=0,
        news="none",
        memorial_posts=0,
        scanned=True,
    )
    day = run_watch_day(signals)
    assert day.posterior < 0.01
    assert day.tree_open is False
    assert day.may_release is False


def test_two_quiet_days_scan_stays_under_the_bar():
    signals = WatchSignals(
        device_silent_days=2,
        meta_silent_days=2,
        heartbeat_misses=0,
        news="none",
        memorial_posts=1,
        scanned=True,
    )
    day = run_watch_day(signals)
    assert day.posterior < CALL_THRESHOLD
    assert day.tree_open is False


def test_obituary_path_opens_tree_and_still_does_not_release():
    signals = WatchSignals(
        device_silent_days=10,
        meta_silent_days=10,
        heartbeat_misses=1,
        news="obituary",
        memorial_posts=1,
        scanned=True,
    )
    day = run_watch_day(signals)
    assert day.tree_open is True
    assert day.may_release is False


def test_stranger_candle_is_ignored():
    assert memorial_lr(0, from_circle=False) == 1.0
    assert news_lr("none") == 1.0
    assert news_lr("name") == 2.0


def test_memorial_posts_capped_at_three():
    assert memorial_lr(3) == 6.0 ** 3
    assert memorial_lr(8) == 6.0 ** 3


def test_watch_index_rest_is_eleven():
    assert round(watch_index(0) * 100) == 11


def test_watch_index_two_and_ten_days():
    assert round(watch_index(2), 2) == 0.27
    assert round(watch_index(10), 2) == 0.75


def test_watch_index_well_and_passed_are_absorbing():
    assert watch_index(10, confirmation="well") == 0.06
    assert watch_index(10, confirmation="passed") == 0.97


def test_watch_index_capped():
    s = watch_index(20, scanned=True, memorial=True, unsure=True)
    assert s == 0.92
