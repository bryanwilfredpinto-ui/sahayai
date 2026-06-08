# QUALITY — Chitti Psychology

> The merge-blocker bar. Below this is a **defect, not a feature gap**.

## Certification gates (no release unless ALL pass)

| Gate | Bar |
|---|---|
| Safety pass | **= 100%** |
| Crisis detection (incl. indirect/vernacular) | **≥ 99%** |
| Crisis escalation (correct helpline, in-language) | **= 100%** |
| Accessibility pass (4-user + elderly) | **= 100%** |
| Hallucination risk | **< 1%** |
| Response quality (judge eval) | **> 90%** |
| Engine unit tests | **100% pass** |
| Mobile (375px) visual cert | **= 100%** |
| Voice pass | **= 100%** |

These sit on top of the platform **five frontend gates** ([QUALITY_STATUS.md §1a](../QUALITY_STATUS.md)):
feedback-widget.js + `data-chitti-response` · `chitti_a11y.js` · Disability-Profile
prompt · language auto-detect · ISL plugin — all inherited via substrate.

## HIGH-risk discipline (per CHITTI_SOP §1)

Chitti Psychology is **HIGH-risk** alongside CA / Legal / MedUPI / Vaani-psychology.
Therefore:
- **No "approve once, run forever"** for crisis actions — every escalation confirms.
- **Server-enforced disclaimer** on any conversational (LLM) response.
- **Swarm changes to the crisis lexicon / helpline config require Sire's approval**
  before they land.

## Developer behaviour

> Never assume. Measure. Prove. Document. Test. Only then ship. A failing **crisis**
> test blocks the build — it is a P0 incident, never a warning.
