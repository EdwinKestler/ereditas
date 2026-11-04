# Plan: live product URL

Status: drafted 4 Nov 2026. Execute only after an explicit go.
Deadline: Cerebral Valley submit form **4 Nov 2026, 9:00 PM ET**.

This URL is the hackathon **live product**. It is separate from:

- GitHub Pages explainer: https://edwinkestler.github.io/ereditas/
- Local Grok shell: http://127.0.0.1:8080
- Local FastAPI: http://127.0.0.1:8765
- Public source: https://github.com/EdwinKestler/ereditas

Operator notes: `docs/companion.md`. Product: `ideas/ereditas.md`.
Hackathon: `docs/hackathon.md`.

## Goal

A public HTTPS page where a judge plays Pulse → Watch → Circle → Vault →
Wishes with live SAM 3.1 and Muse Spark 1.3. Same play path as the local
Chrome merge loop.

## Constraint

The Grok shell (`grok_mvp/Ereditas/grok-workspace`) fetches **relative**
`/api` and `/static` (`src/app/session.ts`). Vite proxies those paths only
in `npm run dev`. Production must keep those paths on **one public origin**.

`DemoSession` is in-memory. One machine. No autoscaling.

## Recommended shape

One host, one URL, two processes behind a reverse proxy.

| Public path | Process |
| --- | --- |
| `/` | Grok Pure Minimal shell |
| `/api/*` | FastAPI `DemoSession` |
| `/static/*` | FastAPI memorial images |

Host: **Fly.io or Railway**, one machine, HTTPS hostname
(example: `https://ereditas.fly.dev/`). Same-origin proxy means CORS can
stay unused.

Secrets as platform env only: `META_API_KEY` or `MODEL_API_KEY`, optional
`HF_TOKEN` / Modal tokens. Never copy `.env` into the image or Git. Do not
read `.env` while implementing.

## Hosts that do not fit this URL

| Option | Why it fails as the live product |
| --- | --- |
| GitHub Pages | Static. No FastAPI, no Meta API. Explainer only. |
| Vercel Grok app alone | Nitro Vercel preset exists; `/api` 404s unless rewrites hit Python and CORS widens. Two dashboards. |
| Laptop + tunnel | Dies when the machine sleeps. |
| FastAPI HTML only | Playable backup (five themes, live SAM). Chosen chrome is the Pure Minimal shell. |

## Grok UI production catch

`npm run build` in the Grok workspace is TanStack Start + Nitro **Vercel**,
then `db:migrate`. That is a serverless output. FastAPI cannot serve it as
a static folder.

Same-day options, in order:

1. **Preview in the container** — `npm run preview` (or
   `vite preview --host 0.0.0.0 --port 8080`) behind the proxy. Closest to
   local `:8080`. **Prefer this.**
2. **Vercel UI + Fly API** — Vercel rewrites `/api` and `/static` to the
   Python URL. Touch CORS. Two hosts.
3. **Last resort** — public FastAPI HTML companion on `/` of the same host.

## Code that must change (after go)

Leave algorithms, vault, and Meta stack as they are. Tests stay
`EREDITAS_OFFLINE=1`.

1. Bind uvicorn to `0.0.0.0` (`scripts/run-companion.sh` currently uses
   `127.0.0.1`).
2. Reverse-proxy timeouts 60–120s on `/api/scan` and `/api/worked-case`.
3. Dockerfile at repo root: Python 3.12, `pip install -e .`, Node for Grok
   preview, Caddy/nginx routing `/api` and `/static` to uvicorn and `/` to
   the UI.
4. Health check: `GET /api/health`.
5. Optional: `EREDITAS_PUBLIC_ORIGIN` for CORS if hosts are split.

TDD before production: health, `/api/state` owner Elena, proxy paths, no
secrets in snapshot dumps.

## Verify on the public URL

1. Pulse rest: ring 11, tree closed.
2. Two quiet days → Scan → SAM boxes, tree still closed.
3. Worked case → tree open ~96%.
4. WhatsApp → Ana **passed** → Drive + Facebook released, wallet/bank Hold.
5. Health JSON: `meta_configured` true, models `muse-spark-1.3` / `sam-3.1`.
6. Page dump has no keys, seed phrases, or token values.

Reset after the check so judges start at rest.

## Execution order (after go)

1. Dockerfile + Caddy + `0.0.0.0` bind.
2. Fly or Railway app, secrets as env, one machine, HTTPS hostname.
3. Browser play-loop on the public URL.
4. Put that hostname on the Cerebral Valley form as **live product URL**.
5. Record it in `docs/hackathon.md` as live product; keep Pages as explainer.

If Grok preview in the container slips, ship FastAPI HTML on the same host
first, then swap `/` to the Grok shell.
