# 06 — CEOS COMPLIANCE · Chitti MedUPI

**Date:** 2026-06-06 · **Build:** `f9ec517` · Machine-verified by a file/dir existence + minimum-count check (reproducible).

| Level | Document(s) | Required | Present | Status | Path |
|---|---|---|---|---|---|
| L0 | CONSTITUTION.md | ROLE + Founder Rule | 1 file (183 lines) | ✅ | `chitti-medupi/CONSTITUTION.md` |
| L1 | VISION.md | Mission + Vision | 1 file (100 lines) | ✅ | `chitti-medupi/VISION.md` |
| L2 | PERSONAS.md | ≥7 (4 a11y + 3 domain) | 1 file, **9 personas** | ✅ | `chitti-medupi/PERSONAS.md` |
| L3 | SUCCESS_METRICS.md | Business + AI + Accessibility | 1 file (115 lines) | ✅ | `chitti-medupi/SUCCESS_METRICS.md` |
| L4 | PRD.md | ≥8 features (F0–F7+) | 1 file, **F0–F9+** | ✅ | `chitti-medupi/PRD.md` |
| L5 | SKILLS.md (+ skills/) | ≥8 domain skills | SKILLS.md + skills/ (10 files) | ✅ | `chitti-medupi/SKILLS.md`, `chitti-medupi/skills/` |
| L6 | swarm/ | ≥6 agents + README | **6 agents + README** (7 files) | ✅ | `chitti-medupi/swarm/` |
| L7 | sop/ | ≥5 SOPs | **6 SOPs** | ✅ | `chitti-medupi/sop/` |
| L8 | guardrails/ | safety + hallucination + privacy | **3 files** (exact) | ✅ | `chitti-medupi/guardrails/` |
| L9 | memory/ | life_twin (or equiv) | life_twin.md + README | ✅ | `chitti-medupi/memory/` |
| L10 | observability/ | metrics + logs | metrics.md + logs.md | ✅ | `chitti-medupi/observability/` |
| L11 | evals/ | router_accuracy + accessibility_eval | both present | ✅ | `chitti-medupi/evals/` |
| L12 | accessibility/ | blind + deaf + mute + illiterate | **4 files** (exact) | ✅ | `chitti-medupi/accessibility/` |

**CEOS Compliance Verdict: ✅ PASS (L0–L12 all present, all minimum counts met).**

### Swarm agents (L6)
`composition_match_agent` (safety supreme — zero cross-molecule leakage) · `pricing_agent` (NPPA hard cap + Jan Aushadhi cheapest) · `risk_agent` (H/M/L molecule banding) · `savings_agent` (honest ₹/% vs branded) · `safety_disclaimer_agent` (server-enforced EN+HI disclaimer veto) · `trust_agent` (anti-overconfidence → "consult your pharmacist") · `README` (composition → ≥100-confirmation gate → HIGH-risk Sire approval → provenance).

### SOPs (L7)
`sop_add_medicine` · `sop_price_refresh` (JA weekly / NPPA monthly / brand→molecule monthly) · `sop_swarm_skill_update` (HIGH-risk Sire-approval gate) · `sop_incident_wrong_match` (P0 cross-molecule backstop + rollback) · `sop_camera_capture_and_forget` (§2b + tombstone) · `sop_deploy_and_verify` (Railway + /health + Turso write-read roundtrip + 5 frontend gates).

### Grounding note
All CEOS docs were authored grounded in the real repo (CONTEXT.md, ARCHITECTURE.md, the backend services, the seed) and the locked decisions (SAHAYAI_MASTER §2, CHITTI_SOP §2). No fabricated metrics: the only hard numbers cited inside the docs come from the real QA artifacts (`tools/test_medupi_samples_result.json`, `tools/medupi_lang26_result.json`, `tools/medupi_a11y_result.json`); everything else is labelled TARGET vs MEASURED.
