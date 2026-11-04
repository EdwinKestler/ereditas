# Ereditas 0.2.0 — public live companion

Live product: **https://ereditas.fly.dev/**

The root serves the Grok Pure Minimal React shell. Caddy keeps `/api/*` and
`/static/*` on the same origin and proxies them to FastAPI. Fly runs one
always-on shared machine in `dfw`; `DemoSession` remains in memory. The first
deploy intentionally has no Meta secret, so health reports
`meta_configured: false` and SAM/Muse use their mock paths.

## Live acceptance — 4 Nov 2026

Commands exercised against the HTTPS URL:

```bash
BASE=https://ereditas.fly.dev
curl -fsS "$BASE/api/health"
curl -fsS -X POST "$BASE/api/reset"
curl -fsS -X POST -H 'Content-Type: application/json' -d '{"days":2}' "$BASE/api/advance"
curl -fsS -X POST "$BASE/api/scan"
curl -fsS -X POST "$BASE/api/worked-case"
curl -fsS -X POST "$BASE/api/message"
curl -fsS -X POST -H 'Content-Type: application/json' -d '{"who":"Ana","answer":"passed"}' "$BASE/api/answer"
curl -fsS -X POST "$BASE/api/reset"
```

| Check | Live result |
| --- | --- |
| HTTPS root | `200`, React shell rendered |
| Health | `ok: true`; Muse `muse-spark-1.3`; SAM `sam-3.1`; Meta not configured |
| Rest | Ring `11`, tree closed, Elena Reyes, zero released grants |
| Two-day scan | Posterior `6.9457%`, three mock SAM boxes, tree closed |
| Worked case | Posterior `95.9816%`, tree open |
| Ana `passed` | Drive + Facebook released; wallet + bank held |
| Final reset | Ring `11`, tree closed, confirmation silent, zero released grants |
| Fly | One `dfw` machine, started, one health check passing |

## Headless Chrome evidence

Captured with `google-chrome --headless=new --screenshot` against the public
URL:

- [`live/01-rest.png`](live/01-rest.png) — Pulse `11`, tree closed
- [`live/02-two-day-scan.png`](live/02-two-day-scan.png) — `6.95%`, tree closed
- [`live/03-worked-case-open.png`](live/03-worked-case-open.png) — `95.98%`, tree open
- [`live/04-passed-release.png`](live/04-passed-release.png) — confirmation complete

## TDD and build evidence

Source plan: [`../../plans/live-url.plan.md`](../../plans/live-url.plan.md).

User journey: a local run stays bound to loopback, while an explicitly
configured container can bind FastAPI to all interfaces and expose the full
companion through one HTTPS origin.

| Guarantee | Command | Result |
| --- | --- | --- |
| Host override was missing before implementation | `EREDITAS_OFFLINE=1 .venv/bin/pytest -q tests/test_run_companion.py` | RED: override expected `0.0.0.0`, got `127.0.0.1` |
| Local default and container override both work | same focused pytest command after implementation | GREEN: `2 passed` |
| Python behavior remains green | `EREDITAS_OFFLINE=1 .venv/bin/pytest -q` | `33 passed` |
| App-specific UI gates and secret snapshot guard | `node --experimental-strip-types --test src/app/session.test.ts` | `5 passed` |
| Production UI compiles | `npm run build` | PASS |
| UI types compile | `npm run typecheck` | PASS |
| Container starts all three processes and routes one origin | `docker build -t ereditas-live:local .` plus local root/health curl | PASS |
| Public machine health | `~/.fly/bin/flyctl status -a ereditas` | one machine; one check passing |

Known inherited gaps: the broad Grok template `npm test` run reports 189
passing and eight failing branding-fixture tests because this workspace has a
baked Ereditas identity. `npm audit --omit=dev --audit-level=high` reports five
production dependency advisories (including the auth-off Better Auth adapters
and Zod); dependency upgrades were outside this deployment plan and were not
applied.

## Meta key handoff

Edwin can enable live Meta calls without storing the value in Git:

```bash
~/.fly/bin/flyctl secrets set META_API_KEY=... -a ereditas
```
