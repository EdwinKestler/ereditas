# Ereditas — project overlay for this App Builder workspace

This workspace is the **Pure Minimal judge UI** for Ereditas. It is a thin
client of the Python companion.

- Product idea: `../../../ideas/ereditas.md`
- Operator notes: `../../../docs/companion.md`
- Repo agent rules: `../../../AGENTS.md` (Palimnex, secrets, no invented scope)
- `DemoSession` on FastAPI `:8765` is the source of truth
- Vite must proxy `/api` and `/static` to `http://127.0.0.1:8765`
- Auth and database stay **off**
- Demo owner is Elena Reyes. Ana is the primary confirmer.
- Do not dump credentials. High-value grants (wallet, bank) stay Hold after
  one primary `passed`
- Palimnex lives at the repository root. Index from there, not this folder
- Nested `AGENTS.md` in this folder is the App Builder sandbox contract
