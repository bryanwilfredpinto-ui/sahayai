🎖️ World Class Chitti Legal OS — Commando Discipline. Zero Excuses.

# SUCCESS_METRICS — Chitti Legal OS

| Metric | Target | How measured |
|---|---|---|
| Legal explanation accuracy | **≥ 95%** | Gold eval set (judge vs reference) — see [evals/legal_accuracy.md](evals/legal_accuracy.md) |
| Rights-mapping accuracy | **≥ 95%** | Deterministic KB vs reference rights set |
| Deadline / limitation accuracy | **= 100% (deterministic)** | `tools/legal_os_engine_test.mjs` gold assertions |
| Notice-classification accuracy | **≥ 90%** | Labelled notice corpus vs `classifyNotice` |
| Free-legal-aid match accuracy | **≥ 90%** | s.12 LSA Act category test set |
| Scam-detection accuracy | **≥ 90%** | Labelled scam/non-scam scenarios |
| Accessibility coverage | **= 100%** | axe-core 0 serious/critical + four-user journeys (`tools/cert_legal_os.mjs`) |
| Hallucination rate | **< 1%** | No fabricated section/citation; engine never emits a non-table value |
| Critical legal errors | **= 0** | Any wrong deadline/jurisdiction shown as certain = P0 |
| Compliance-reminder success | **≥ 95%** | Twin deadline reminders fired vs due |
| Citizen satisfaction | **≥ 90%** | Per-response 👍 (feedback-widget.js) |
| Language support | **26 (→ 100+ roadmap)** | chitti_lang.js dropdown coverage |
| Mobile @375px pass | **= 100%** | Responsive cert |

## Supporting telemetry (not the headline)

- Time from open → "panic to plan" (notice decoded / right understood).
- Free-legal-aid referrals surfaced (the moat — free help the user was owed).
- Scam-shield "money saved" (high-risk caught before payment).
- Deadline saves (matters flagged `closing-soon` before expiry).

## The one number Sire watches

**Trust** — measured as (per-response 👍 rate) × (zero critical legal errors). A single
fabricated section or wrong deadline shown as certain resets trust; it is a P0 incident,
never a "miss."

---
> **World Class Chitti Legal OS — Commando Discipline. Zero Excuses.**
