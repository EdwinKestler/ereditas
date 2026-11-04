---
name: palimnex
description: Consult and maintain this repository's Palimnex source cache and durable historical-memory ledger for non-trivial repository work.
---

# Palimnex workflow (ereditas)

Use Palimnex to find methods, examples, tools, and guidelines in this repo
instead of reading every file from scratch.

Run commands from the repository root, or set `PALIMNEX_ROOT` to that root.
The CLI is `palimnex` (pipx, 2.9.0). Recreate the local cache with
`./scripts/palimnex-setup.sh`.

1. Run `palimnex status`.
2. If the cache is missing or stale, run `palimnex index --incremental`.
3. Run `palimnex validate --deep`.
4. Search with exact implementation vocabulary (`palimnex search "…" --limit 8`)
   and open the returned source. Repository files are the current authority.
5. After indexed-file changes, reindex. There is no frozen evaluation fixture
   in this repository yet.
6. Run `palimnex ledger-status` for handoffs.

Redis is optional and disposable; SQLite is durable historical context. Never
treat either as current authorization. If Redis is unavailable, continue from
files and disclose `cache_consulted: false`. Never flush shared Redis.

Never commit `.palimnex/`, `.ecc/`, `*.pmem`, or key files. Retention, erasure, pack
activation, Git writes, and network actions need explicit human authorization.

ECC workflow skills (search-first, plan, TDD, security) live beside this
directory. They do not replace Palimnex. Operator notes: `docs/ecc.md`.
