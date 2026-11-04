# Ereditas — Pure Minimal shell

TanStack Start + React 19 + Zustand + Tailwind v4. Preview on
**http://127.0.0.1:8080**. This folder is the judge UI only.

Algorithms, SAM 3.1, Muse Spark, and `DemoSession` live in the Python package
at the repository root. Canonical operator notes:

[`../../../docs/companion.md`](../../../docs/companion.md)

## Run (needs FastAPI too)

From the repository root:

```bash
./scripts/run-companion.sh
```

In this folder:

```bash
npm install
npm run dev
```

Vite proxies `/api` and `/static` to `http://127.0.0.1:8765`. Auth and database
stay off.

## Mapper tests

```bash
node --experimental-strip-types --test src/app/session.test.ts
```

Product rules for the whole repo: [`../../../AGENTS.md`](../../../AGENTS.md).
App Builder sandbox contract: [`AGENTS.md`](AGENTS.md). Project overlay:
[`AGENTS.project.md`](AGENTS.project.md).
