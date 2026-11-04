# License choice

Original Ereditas code is **PolyForm Noncommercial 1.0.0**. Vendored ECC
skills stay **MIT** (Affaan Mustafa). Full texts: `LICENSE` and
`.agents/skills/NOTICE.md`.

This is operator notes, not legal advice.

## Hackathon rules (MIT is not required)

Checked 3 Nov 2026 against the public event page, the Application and Event
Waiver summaries, and the participant guide (public repo must be public).

| Requirement | Source | MIT required? |
| --- | --- | --- |
| Public GitHub repository | Participant guide: “Open source: Repositories must be public.” Submission checklist: repository accessible publicly. | No. Public is enough. |
| Named OSI license (MIT/Apache/GPL) | Not stated on the event page, waiver, or participant guide. | No. |
| Own the submission; follow third-party licences | Waiver: original work you own; open-source components allowed if you follow their licences. | No. ECC MIT is compatible. |
| Organizer licence on the submission | Waiver: you keep ownership; organizers get a perpetual, irrevocable, worldwide, royalty-free, non-exclusive licence to use, reproduce, adapt, modify, publish, distribute, display, perform, and make derivatives for any purpose, including marketing. Materials shared during the event are not confidential. | The GitHub `LICENSE` does not cancel that grant. |

A non-commercial GitHub licence still lets judges clone and run the demo. It
does not stop Meta or Cerebral Valley from using the submitted materials under
the waiver.

## Options considered

| Licence | Blocks commercial use on GitHub? | Fits software? | GitHub / SPDX | Verdict |
| --- | --- | --- | --- | --- |
| MIT | No (sell, SaaS, proprietary forks) | Yes | Yes | Rejected. Not required by the hackathon. |
| PolyForm Noncommercial 1.0.0 | Yes, except personal, research, hobby, charity, school, research org, government | Written for software | `PolyForm-Noncommercial-1.0.0` | **Chosen** |
| CC-BY-NC-4.0 | Yes | Creative Commons discourages it for code | Yes | Skip |
| MIT + Commons Clause | Sells / hosted service | Bolt-on, not a full NC grant | Poor detection | Skip |

## What PolyForm Noncommercial allows

Permitted without a separate commercial grant: personal study, hobby, research,
private entertainment, and use by charitable, educational, public-research,
public-safety, health, environmental, or government institutions (any funding
source).

Not permitted: using the original Ereditas code for a commercial product,
paid client work, or a hosted service, unless Edwin Kestler grants a separate
licence.

## Mixed tree

| Path | Licence |
| --- | --- |
| Original Ereditas code, docs, app, Grok shell | PolyForm Noncommercial 1.0.0 |
| `.agents/skills/` vendored from affaan-m/ECC | MIT © 2026 Affaan Mustafa |

Do not relicense the ECC files. MIT already allows commercial use of those
skill texts.
