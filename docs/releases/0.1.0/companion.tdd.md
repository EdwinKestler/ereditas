# TDD evidence — companion 0.1.0

Source: `ideas/ereditas.md` and `docs/Ereditas-White-Paper.pdf`. No plan-canvas
file; journeys taken from the white paper algorithms.

## Journeys

- As a judge, I advance quiet days and the watch index moves while the vault stays locked.
- As the system, I refuse to open the confirmation tree on silence alone (mountain case).
- As Ana, I can answer well / unsure / passed; only passed mints scoped links.
- As an heir, I never receive a password dump in WhatsApp.

## Results

`.venv/bin/pytest -v --cov=ereditas --cov-report=term-missing`

28 passed. Coverage 89% on `src/ereditas` (live Meta API branches in `meta.py`
stay behind `EREDITAS_OFFLINE=1` in pytest). Companion live check on
2026-11-03: `meta_configured` true, SAM 3.1 boxed candle/ribbon/lilies,
Muse Spark wrote the heir narrative, Chrome pass of Pulse → Circle → Vault
→ Wishes plus five themes.

| # | Guarantee | Test | Type | Result |
| --- | --- | --- | --- | --- |
| 1 | Table 4 posterior reaches 39.9% only after the obituary | `test_worked_case_table_4` | unit | PASS |
| 2 | Mountain case does not open the tree | `test_mountain_case_does_not_open_the_tree` | unit | PASS |
| 3 | Watch index rest is 11 | `test_watch_index_rest_is_eleven` | unit | PASS |
| 4 | Release refused until passed | `test_release_refused_until_passed` | unit | PASS |
| 5 | Ordinary scopes only for a single primary | `test_primary_passed_releases_ordinary_scopes_only` | unit | PASS |
| 6 | WhatsApp body has no password | `test_worked_case_opens_tree_and_passed_releases_scope` | unit | PASS |
| 7 | `/` and `/api/worked-case` then passed | `test_worked_case_then_passed` | API | PASS |
| 8 | SAM 3.1 wire grammar normalizes inclusive boxes | `test_parse_sam_grammar_normalizes_inclusive_box` | unit | PASS |
| 9 | Offline segment uses mock boxes | `test_offline_segment_uses_mock_box` | unit | PASS |
