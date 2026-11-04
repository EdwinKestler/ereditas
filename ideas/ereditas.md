# Ereditas — Post-Mortem Agent

Hackathon product for the Meta Global AI Developer Hackathon 2026.

- **Track:** Indie (solo).
- **Theme:** Build for Your World — digital estate after death, a problem the owner
  knows firsthand.
- **Sources:** `docs/Ereditas-White-Paper.pdf`, Grok project conversation, vault
  design notes, `app_concept/` theme frames.

Ereditas is a companion that watches, and an executor that does not run until a
person confirms the watch. It is not a password manager, a will, or a death
certificate.

## Four stages

| Stage | Inputs | Output | May release? |
| --- | --- | --- | --- |
| Watch | Phone unlock, Meta session, $1 heartbeat | Watch index (ring) | No |
| Evidence | News/obituaries, circle posts, SAM memorial objects | Posterior P(Z=1\|x) | No |
| Confirmation | WhatsApp tree: well / unsure / passed | Human fact | Only if **passed** |
| Release | Owner-classified grants | Short-lived scoped access | That scope only |

Silence does not open the vault. The ring is a **watch index**, not the
posterior. Algorithm 1 (white paper §4.2) binds the phone call to the posterior
and a 0.20 policy bar. Algorithm 2 binds release to a human “passed”.

## Vault (hybrid)

Google Password Manager (or similar) stays the living source of truth.
Ereditas stores classification and executes post-confirmation grants.

- Tags: Transfer to heir, Close account, Keep private, Business.
- Roles: Primary Heir, Secondary, Executor, View-only.
- WhatsApp is notification and confirmation only. Never a credential store.
- Meta Login is a secondary path for Meta-owned properties and memorialization.

MVP demo uses a **mock** password-manager sync. No real passwords in the repo.

## Meta AI tooling (Stage 1 + 25% score)

Orchestration in `app_concept/szV47.jpg`:

1. Companion signals → **Muse Spark 1.3** agent.
2. **SAM 3.1** segments memorial vocabulary (candle, ribbon, lilies, cross) on
   posts from the registered circle.
3. **Muse Voice Transcribe** for unread WhatsApp / voice fallback (optional in
   the live demo).
4. **Muse Image** for memorial-post analysis / generated notices (optional).
5. Likelihood-ratio update, then a human confirmation gate.
6. Scoped vault release + last-wishes execution, audited.

Open-weight path (optional): Muse Spark Open / Glimmer on Modal or Hugging Face.

## Playable companion (hackathon MVP)

Judge UI: Pure Minimal Grok shell (Pulse, Watch, Circle, Vault, Wishes) at
`http://127.0.0.1:8080`. Python FastAPI on `:8765` owns Algorithm 1,
Algorithm 2, SAM 3.1, and Muse Spark. Operator notes: `docs/companion.md`.

Demo owner: **Elena Reyes** (persona). Primary confirmer: **Ana**.

1. Pulse ring starts at **11, steady**. Tree closed.
2. Advance two quiet days; device, Meta, and $1 chips go dark. Scan. SAM boxes
   memorial posts from Ana, Daniel, Sofía. Posterior stays under the 20% bar.
   WhatsApp is refused while the tree is closed.
3. Worked case (white paper Table 4: 10 silent days, heartbeat miss, obituary,
   three memorial posts) opens the tree.
4. Circle: WhatsApp to Ana. Answers: well, unsure, passed.
5. **Passed** (Ana, PRIMARY) releases Drive + Facebook only
   (`ereditas://grant/` links, no credentials). Wallet and bank stay Hold
   until a second confirmer. Wishes check off the released scopes.

Themes in `app_concept/` (same Pulse composition, different template):

| Id | File | Read |
| --- | --- | --- |
| heritage | cream + antique gold, serif | Trust / legacy |
| midnight | `7kFQp.jpg` navy + gold | Stronger tech |
| forest | `egF22.jpg` sage + cream | Grounded |
| minimal | `EBHVB.jpg` black / gold | Highest clarity |
| stone | `o0KKn.jpg` terracotta | Softer human |

Five templates remain on the FastAPI static companion (`:8765`). Chosen live
demo chrome: **minimal** (black / white / gold) in the Grok shell.

## What we will not build in the MVP

- Real Google Password Manager OAuth.
- Real WhatsApp Cloud sends (UI simulates the thread).
- Medical advice, generic RAG, or a plaintext password dump.
- Treating the watch index as a death probability.

## Open questions resolved for the MVP

- Primary vault: **hybrid** — mock Google sync + Hereditas executor.
- Beneficiary permissions: **per-asset grants**, four roles.
- Meta memorialization is one last-wishes action.
- Confirmation → vault unlock → heir notification is the demo spine.
