# QUALITY — Chitti News AI

> **Level 10** of the COSDF stack — the eight quality gates.
> Sourced from [`COSDF.md`](COSDF.md) §LEVEL 10 (lines 450-509).
> A feature is "shippable" only when **all eight gates** are PASS.
> A feature that PASSES seven gates and FAILS one is RED — it does not ship.

---

## The eight quality gates

Each gate is a checklist. Every checkbox must be ✓ before the gate is PASS.

---

### Gate 1 — FUNCTIONAL

The product runs and the critical paths work end-to-end.

- [ ] ANY role the user types works (dynamic mapping, no 404).
- [ ] No hardcoded role lists block ANY role.
- [ ] Every recommendation link resolves to a real course / cert page (HTTP 200, on `official_domain`).
- [ ] Tab-render latency < 3 s on a mid-range Android (375 px viewport).
- [ ] `chitti_coach.js` boots without errors on Chrome / Firefox / Safari / Android Chrome.
- [ ] Boot ingest writes ≥ 1 article per active stream within 30 s of backend boot.

**Owners:** Frontend (chitti_news_ai.html) + Backend (rss_fetcher, streams_ingestor).
**Evidence:** `backend/tests/test_feed_endpoints.py` + manual 375 px screenshot in `tools/cert_screenshots/`.

---

### Gate 2 — LANGUAGE

The product speaks the user's language without leaking another.

- [ ] 12 Indian + 9 global P0 languages render correctly (script + direction).
- [ ] All output is in the user's selected language (`chitti_lang` in localStorage).
- [ ] No mixed-language strings (Hindi + English) unless the user explicitly chose Hinglish.
- [ ] Voice-Factory TTS produces audible output in the selected language (or honest "voice unavailable" announcement).
- [ ] Date / number formatting follows the user's locale.

**Owners:** `chitti_lang.js` substrate + Voice Factory.
**Evidence:** `tools/qa_medupi_health.mjs`-style multilingual screenshot pass (10 languages × 375 px).

---

### Gate 3 — ACCESSIBILITY

The four user-types all complete the same journey.

- [ ] **Blind path:** Voice-First Mode auto-activates from `disability_profile.blind`; 5 voice commands (tour / news / hub / help / stop) all route. See [`accessibility/blind_user.md`](accessibility/blind_user.md).
- [ ] **Deaf path:** ISL panel attaches to every `[data-chitti-response]`; relevance is color + emoji, never audio-only. See [`accessibility/deaf_user.md`](accessibility/deaf_user.md).
- [ ] **Mute path:** Tap-only navigation; 6 quick-pick role buttons; no typing required for the first journey. See [`accessibility/mute_user.md`](accessibility/mute_user.md).
- [ ] **Illiterate path:** Voice-First Mode auto-activates from `disability_profile.illiterate`; every label has an emoji prefix. See [`accessibility/illiterate_user.md`](accessibility/illiterate_user.md).
- [ ] axe-core WCAG 2.1 AA scan: zero v1.1-introduced violations (pre-existing substrate violations tracked as BUG-009).

**Owners:** `chitti_a11y.js` substrate + per-page `data-chitti-response` markup.
**Evidence:** [`evals/accessibility_eval.md`](evals/accessibility_eval.md).

---

### Gate 4 — TRUST

No fake certs, no inflated claims, FREE-first.

- [ ] Every certification is verified-real (no LLM-hallucinated entries).
- [ ] FREE option shown first when a FREE option exists.
- [ ] No "guaranteed job" / "double your salary" / "X-figure income" language.
- [ ] Every recommendation has a source link (no orphan claims).
- [ ] Salary intelligence cites a source date ("as of 2026-Q1") — never "current".
- [ ] Affiliate links disclosed; never used as a ranking signal.

**Owners:** Swarm Agent 7 — [`swarm/trust_quality_agent.md`](swarm/trust_quality_agent.md).
**Evidence:** monthly broken-link sweep + Trust Strip render audit.

---

### Gate 5 — ACCURACY

The role mapping and content classification are right.

- [ ] Profession classifier F1 ≥ 0.85 per profession (13/13 baseline; software-developer 0.857).
- [ ] No hallucinated courses / certs / tools.
- [ ] No cross-profession bleed (e.g. cricket news in Business tab — historical bug, regression-tested).
- [ ] Per-card relevance verdict (IGNORE / PAY-ATTENTION / VERY-IMPORTANT / CRITICAL) computed deterministically.

**Owners:** `backend/services/profession_classifier.py` + `COSDF_IMPACT_DATA.json`.
**Evidence:** [`evals/router_accuracy.md`](evals/router_accuracy.md) + `backend/tests/test_classifier_sire_worked_examples.py`.

---

### Gate 6 — SWARM REVIEW

All 8 swarm agents executed and signed off.

- [ ] Agent 1 — Role Mapping: ANY-role input produces a non-empty mapped domain.
- [ ] Agent 2 — Certification: FREE-first; verified URLs.
- [ ] Agent 3 — Course: difficulty-tagged; FREE-first.
- [ ] Agent 4 — Tool: use-case examples present.
- [ ] Agent 5 — Prompt: copy-paste-ready; tested in ≥ 1 LLM.
- [ ] Agent 6 — Accessibility: modality adapted per `disability_profile`.
- [ ] Agent 7 — Trust & Quality: no fake cert; FREE-first verified; URLs live.
- [ ] Agent 8 — Language: all output in `chitti_lang`.

**Owners:** swarm folder (`swarm/*_agent.md`).
**Evidence:** swarm-trace log entry per user request.

---

### Gate 7 — OBSERVABILITY

The product reports its own health.

- [ ] Unknown-role tracking captures every input that produced an empty Hub (drives Phase 2 coverage).
- [ ] Per-card 👍 / 👎 captured anonymously and sent to `/api/feedback/collect`.
- [ ] Broken-link detection runs nightly; results in `streams_refresh` job log.
- [ ] Language-coverage analytics: which langs have empty tabs.
- [ ] Per-source ingestion success rate dashboards (RSS poll log).

**Owners:** `chitti-founder/` backend + per-Chitti `/api/feedback/collect`.
**Evidence:** [`observability/metrics.md`](observability/metrics.md) + [`observability/logs.md`](observability/logs.md).

---

### Gate 8 — FOUNDER REVIEW

The Founder Rule is provably honoured.

- [ ] "ANY role" principle verified by trying ≥ 3 non-hub roles (Veterinarian, Welder, Pilot) and seeing a working Hub.
- [ ] "ALL languages" principle verified on ≥ 5 P0 languages.
- [ ] "ALL disabilities" principle verified via the 4 accessibility journeys.
- [ ] Sire's sign-off captured (Vaani-routed surface per `CTO_autonomous_mode` rule).

**Owners:** Sire (founder) + chitti-cto handover docs in [`HANDOVER/`](HANDOVER/).
**Evidence:** [`HANDOVER/05_SIGN_OFF.md`](HANDOVER/05_SIGN_OFF.md).

---

## Certification grades

```
████████████████████████████████████████ 90-100%
GREEN — RELEASE READY
ANY role works. ALL languages. ALL disabilities.

████████████████████████████████████░░░░ 75-89%
YELLOW — CONDITIONAL
Some roles or languages missing. Ship with caveats.

████████████████████████████░░░░░░░░░░░░ <75%
RED — DO NOT RELEASE
Hardcoded roles or missing accessibility.
```

A grade is the lowest of any individual gate's pass rate. A single FAIL on Gate 3 drops the whole feature to RED no matter how green the other gates are.

---

## How a quality run is logged

Each quality run writes to `chitti-founder/quality_runs.db`:

```
run_id · feature · gate_1..gate_8 · grade · sire_signoff · timestamp
```

Daily 07:00 IST cron runs the full pass; weekly Sun 08:00 IST aggregates trend.

---

Last reviewed: 2026-06-06
