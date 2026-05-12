# CHECKLIST — Daily Quality Audit

> Chitti Quality runs this every day at 06:30 IST against every Chitti listed in [ACCOUNTABILITY.md](ACCOUNTABILITY.md). Output → [`../chitti_quality.html`](../chitti_quality.html) + the 07:00 IST founder email via [`../lib/founder_report.py`](../lib/founder_report.py).

Each item produces a verdict:

- ✅ **green** — passes cleanly
- ⚠️ **amber** — passes with concerns; needs follow-up this week
- ⛔ **red** — fails; escalate to founder within 1 hour

A Chitti's overall status is the worst verdict on its row.

---

## Section A — Liveness (Tier 1, every Chitti)

```
[ ] A1. /health returns 200 with {ok: true}
[ ] A2. /health JSON includes {version, last_audit, quadrails_active}
[ ] A3. UptimeRobot 5-min poll: zero misses in past 24h
[ ] A4. /admin/founder returns valid JSON conforming to lib/founder_report schema
[ ] A5. Production URL is the canonical one in MASTER_CONTEXT.md (no stale pointer)
```

---

## Section B — Quadrails (Tier 1, every Chitti)

```
[ ] B1. SafetyRail emitted ≥1 verdict in past 24h
[ ] B2. RelevanceRail emitted ≥1 verdict in past 24h
[ ] B3. TruthRail emitted ≥1 verdict in past 24h (for Chittis that bundle ground truth)
[ ] B4. ComplianceRail emitted ≥1 verdict in past 24h
[ ] B5. Per-Chitti disclaimer verbatim text matches STANDARDS.md §1 (no drift)
[ ] B6. Server-enforced disclaimer present in 5% random sample (target ≥99%)
[ ] B7. Quadrails latency p95 ≤ 200ms (offline rails) / ≤ 800ms (LLM-judge rails)
```

---

## Section C — Evaluators (Tier 1)

```
[ ] C1. Tone evaluator score (1% sample) ≥ 0.85 — guardian-commando-coach voice intact
[ ] C2. Truth evaluator hallucination rate ≤ 2% for high-stakes Chittis (medupi, shares, ca, legal)
[ ] C3. Truth evaluator hallucination rate ≤ 5% for all other Chittis
[ ] C4. Disclaimer evaluator pass rate = 100% (no exceptions)
[ ] C5. Refusal rate within bounds (no over-refusal; no under-refusal of out-of-scope queries)
```

---

## Section D — Feedback (Tier 1)

```
[ ] D1. Thumbs-up % over rolling 24h ≥ 70% per Chitti
[ ] D2. Comment volume (down-vote comments) read; new failure patterns flagged
[ ] D3. quality_issues table from "Report a quality issue" button — zero unread for > 4 hours
```

---

## Section E — Multi-language + Voice (Tier 1)

```
[ ] E1. chitti_a11y.js loaded on every public Chitti page
[ ] E2. Language selector renders all 26 languages
[ ] E3. Voice Factory /api/voice/speak returns < 2s for the 4 baseline languages (en/hi/ta/bn)
[ ] E4. Tier C language (e.g. Santali) returns honest "unsupported" — does NOT silently fall back
[ ] E5. Voice Required marker present on every voice-mandatory page (vaani, medupi scan, sales, government)
[ ] E6. Provider abstraction: VOICE_FACTORY_URL is the only voice endpoint; no direct Bhashini calls from frontend
```

---

## Section F — Accessibility + Braille (Tier 1 daily smoke + Tier 2 weekly full)

Daily smoke per Chitti:

```
[ ] F1. h1 present, exactly one
[ ] F2. main, nav, footer landmarks present
[ ] F3. SEBI / disclaimer banner is sticky top (per per-product CONTEXT.md), never footer
[ ] F4. Voice IN button has aria-label
[ ] F5. Voice OUT button has aria-label
[ ] F6. Braille mode toggle works (body.chitti-braille class added/removed)
[ ] F7. Read page button speaks the h1
```

Weekly full per Chitti — see [BRAILLE.md §4](../BRAILLE.md):

```
[ ] F8. Every dynamic content swap calls Chitti.a11y.announce(text)
[ ] F9. Every icon-only button has aria-label
[ ] F10. Every img has alt; decorative ones alt=""
[ ] F11. Forms: every input has label or aria-labelledby
[ ] F12. Charts/canvases have a text alternative (table or summary)
[ ] F13. No tabindex > 0 anywhere
[ ] F14. Manual screen-off keyboard-only walkthrough of primary user flow PASSES
```

---

## Section G — Legal / Disclaimers (Tier 1)

```
[ ] G1. SEBI banner permanent + sticky on chitti-shares, chitti-medupi (per project_legal_disclaimer memory)
[ ] G2. Medical disclaimer permanent on chitti-medupi
[ ] G3. Legal disclaimer permanent on chitti-legal
[ ] G4. CA / tax disclaimer permanent on chitti-ca
[ ] G5. Government scheme disclaimer permanent on chitti-government
[ ] G6. Sales coaching disclaimer permanent on chitti-sales
[ ] G7. Server-enforced (not just frontend) — verified by removing banner DOM and confirming API still injects
```

---

## Section H — Provider Portability (Tier 2 weekly)

```
[ ] H1. Voice supplier outage simulated; cascade falls through; ledger records honest provider name
[ ] H2. DeepSeek LLM call instrumented with provider tag (so a future swap is observable)
[ ] H3. Turso connection failure simulated; embedded-replica local SQLite continues to serve reads
[ ] H4. No frontend code names a specific provider (no hardcoded "bhashini" / "deepseek" in HTML/JS)
```

---

## Section I — Privacy + Data (Tier 1)

```
[ ] I1. No raw PII in structured logs (PII guard at lib/pii_guard.js fires on every request)
[ ] I2. localStorage X-User-Token is a per-device UUID, not derived from user data
[ ] I3. No third-party analytics scripts on any Chitti page (verify Content-Security-Policy)
[ ] I4. Aadhaar / PAN / bank-account fields not present in any Chitti form
[ ] I5. DPDP-compliant audit log present on chitti-vaani-android, never auto-uploaded
```

---

## Section J — Global Best Practices Drift Check (Tier 3 monthly)

```
[ ] J1. Each CONTEXT.md "Global Best Practices" section matches GLOBAL_BEST_PRACTICES.md verbatim
[ ] J2. China GB/T 37668 mapping still accurate (Braille mode behaviour)
[ ] J3. Dubai AI Charter mapping still accurate (5 principles each have a quadrail or hook)
[ ] J4. Singapore Model AI Governance Framework v2 mapping still accurate (risk tier per Chitti)
[ ] J5. WCAG 2.1 AA spot-check on highest-traffic page of each Chitti passes
```

---

## Section K — Documentation Freshness (Tier 3 monthly)

```
[ ] K1. Each Chitti's CHANGELOG.md entries from past 30 days have matching TODO.md crossouts
[ ] K2. Each Chitti's README.md "Status" line reflects today's reality (live / stub / not deployed)
[ ] K3. MASTER_CONTEXT.md "live vs pending" table matches actual deploy status
[ ] K4. Memory files at C:/Users/DELL/.claude/projects/.../memory/ have no entries older than 90 days that aren't still load-bearing
```

---

## Output format

For each Chitti, the daily audit produces one row:

```
{
  "chitti": "chitti-medupi",
  "status": "green" | "amber" | "red",
  "reason": "one-line if not green",
  "last_audit": "2026-05-12T06:30:00+05:30",
  "checks": {
    "liveness": "green",
    "quadrails": "green",
    "evaluators": "amber: tone score 0.82",
    "feedback": "green: 78% thumbs up",
    "multilang_voice": "green",
    "accessibility": "green",
    "legal": "green",
    "privacy": "green"
  },
  "thumbs_up_pct": 78.0,
  "hallucination_rate_pct": 1.2,
  "open_quality_issues": 0
}
```

That row is what [`../chitti_quality.html`](../chitti_quality.html) renders, one per Chitti.

---

*Owner: Chitti Quality. Cadence: daily at 06:30 IST. Output: chitti_quality.html + lib/founder_report.py daily email.*
