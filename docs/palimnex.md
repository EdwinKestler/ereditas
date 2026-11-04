# Palimnex in this repository

Palimnex is the lookup layer for humans and coding agents. Search it for
methods, examples, tools, and guidelines. Do not start by reading the whole
tree.

Installed as **2.9.0** (`pipx`, extras `crypto` and `mcp`). Runtime state
lives in `.palimnex/` (gitignored). Agent skill:
`.agents/skills/source-cache/SKILL.md` (the directory is not named
`palimnex/` because Palimnex skips any path segment with that name).

## Stores

| Role | Engine | Where | Access check |
| --- | --- | --- | --- |
| Short-term discovery cache + hot projection | Redis 7 (owner-only Unix socket, no TCP) | `.palimnex/redis/redis.sock` | `palimnex redis status` |
| Long-term historical ledger | SQLite (`project-memory:ledger:v1`) | `.palimnex/memory.sqlite3` | `palimnex ledger-status` |

## First time, or after a clone

```bash
./scripts/palimnex-setup.sh
```

That starts this repo's owner-only Redis, builds the source cache, creates
the durable ledger if missing, and runs `palimnex doctor`.

## Everyday use

Before a non-trivial prompt, from the repository root:

```bash
palimnex status
palimnex search "ereditas companion FastAPI" --limit 8
```

Open the returned files. Cache hits and ledger recall locate evidence; they
never authorize commits or network calls.

After changing indexed files:

```bash
palimnex index --incremental
palimnex validate --deep
```

There is no `evaluation_fixture` in `.palimnex.json`. Skip `evaluate`. Handoff:

```bash
palimnex ledger-status
```

Optional MCP (stdio, read-only by default):

```bash
palimnex-mcp --root /media/kestl/andor/github/ereditas
```

## What is indexed

Configured in `.palimnex.json` (`project_slug`: `ereditas`).

- Root markdown and JSON
- `docs/`, `ideas/`, `scripts/`
- `src/`, `app/`, `apps/` source as it appears
- `.agents/skills/**/*.md`

`grok_mvp/` is **not** in `include_patterns`. Search from this folder fails
with “no `.palimnex.json`”. Keep architecture for the Grok shell in
`docs/companion.md` so the cache can see it. Index from the repository root.

Workflow skills (search, plan, TDD, security) are a separate ECC thin slice.
See `docs/ecc.md`. Palimnex stays the memory layer.
