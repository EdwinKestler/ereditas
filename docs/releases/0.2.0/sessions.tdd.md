# TDD evidence — isolated visitor sessions

Source: judging concurrency fix authorized by Edwin at 09:56 GT on 4 Nov
2026. Journeys and guarantees were derived during this TDD run; no plan file
was used.

## Journeys

- As a judge, I receive a private demo flow so another visitor cannot advance,
  pass, or reset my state.
- As the operator, I can bound idle in-memory sessions without multiplying Meta
  clients or SAM calls.
- As a visitor, I can use **Start fresh** from any tab and return only my own
  flow to Pulse/rest.

## RED

`EREDITAS_OFFLINE=1 .venv/bin/pytest -q tests/test_sessions.py tests/test_api.py`
failed during collection because `ereditas.sessions` and the companion
`sessions` store did not exist.

`node --experimental-strip-types --test src/app/session.test.ts` ran seven
tests: six passed and the new cookie-credentials test failed because fetch
received `credentials: undefined` instead of `same-origin`.

The follow-up concurrency RED
`EREDITAS_OFFLINE=1 .venv/bin/pytest -q tests/test_meta.py -k 'shared_stack or shared_sam'`
ran two tests and both failed: two lazy clients were constructed and two SAM
calls filled the same cache key.

## GREEN

| Guarantee | Test or command | Type | Result |
| --- | --- | --- | --- |
| Two clients keep separate state and reset affects only its caller | `tests/test_api.py::test_clients_have_isolated_sessions_and_reset_only_the_caller` | API | PASS |
| Health creates no session cookie | `tests/test_api.py::test_health_does_not_create_a_session_cookie` | API | PASS |
| First API request sets HttpOnly, Lax, Path `/`, six-hour and HTTPS Secure attributes | `tests/test_api.py::test_first_api_request_sets_a_private_six_hour_cookie` | API/security | PASS |
| Malformed and unknown SIDs are replaced, never adopted | `tests/test_api.py::test_malformed_and_unknown_session_cookies_are_replaced` | API/security | PASS |
| Injected time expires idle sessions and a small cap evicts LRU | `tests/test_sessions.py` | unit | PASS |
| All sessions use the same Meta stack; concurrent access creates one client and one SAM cache fill | `tests/test_sessions.py`, concurrency tests in `tests/test_meta.py` | unit/concurrency | PASS |
| Existing snapshot secret guard still passes | `tests/test_api.py::test_worked_case_then_passed`, voice snapshot test | API/security | PASS |
| React fetch explicitly carries same-origin cookies | `src/app/session.test.ts` | unit | 7 passed |
| Offline Python suite | `EREDITAS_OFFLINE=1 .venv/bin/pytest -q` | full suite | 51 passed |
| Python coverage | `EREDITAS_OFFLINE=1 .venv/bin/pytest -q --cov=ereditas --cov-report=term-missing` | coverage | 51 passed; 89% total; sessions 96% |
| TypeScript | `npm run typecheck` | compile | PASS |
| Production UI | `npm run build` | build | PASS |
| Header/reset UX at desktop and 390x844 | local Chrome: all tabs, Start fresh to Pulse, overflow and console checks | browser | PASS; no overflow or console errors |

Focused GREEN after implementation was 14 passing session/API tests; the two
concurrency tests also passed after the shared client/cache locks were added.

## Known gaps

The orchestrator still owns deployment and live acceptance. Local tests do not
prove that the deployed HTTPS response has `Secure` on `ereditas_sid`, that two
independent live browser jars remain isolated, or that a Fly process restart
returns both to fresh sessions. No commit, push, deploy, or live URL mutation
was performed in this run.
