# TDD evidence — Grok UI + Python algorithms merge

Source: `ideas/ereditas.md`. Operator notes: `docs/companion.md`. Journeys
written in this run.

## Journeys

- As a judge, I play the Pure Minimal Grok shell while Algorithm 1 owns the tree.
- As the system, a two-day scan paints SAM boxes and keeps the tree closed (posterior under 20%).
- As Ana, WhatsApp is refused until the worked case opens the tree.
- As an heir, a single primary `passed` releases Drive and Facebook only; wallet and bank stay held.

## Results

RED: `tests/test_api.py` failed on missing CORS, `messaged`, and `POST /api/message`.
GREEN: `.venv/bin/pytest -q --cov=ereditas` — 31 passed, 88% on `src/ereditas`
(`companion.py` omitted from coverage by `pyproject.toml`; live Meta branches
stay behind `EREDITAS_OFFLINE=1`).

Grok mapper: `node --experimental-strip-types --test src/app/session.test.ts` — 5 passed.

Chrome on 2026-11-03 against `http://127.0.0.1:8080` proxying `/api` and
`/static` to FastAPI `:8765`. Live health `meta_configured` true. Watch
labeled **SAM 3.1**. Worked-case posterior **95.98%**. Vault packet used
`ereditas://grant/` links with no credentials.

| # | Guarantee | Test | Type | Result |
| --- | --- | --- | --- | --- |
| 1 | CORS allows the Grok origin | `test_cors_allows_grok_origin` | API | PASS |
| 2 | Two-day scan keeps the tree closed | `test_two_day_scan_keeps_tree_closed` | API | PASS |
| 3 | Message and passed refused under the bar | `test_message_and_passed_refused_while_tree_closed` | API | PASS |
| 4 | Worked case then passed releases drive+facebook only | `test_worked_case_then_passed` | API | PASS |
| 5 | Snapshot dump has no secrets | `test_worked_case_then_passed` | API | PASS |
| 6 | Box fractions become CSS percents | `session.test.ts` `boxStyle` | unit | PASS |
| 7 | High-value grants stay Hold after one primary | `session.test.ts` `grantBadge` | unit | PASS |
