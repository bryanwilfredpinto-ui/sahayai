🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# QUALITY_GATES — the explicit checklist no release skips

> Subordinate to [QUALITY.md](QUALITY.md) and [CONSTITUTION.md](CONSTITUTION.md) Article 12. This is the **ordered gate sequence** every change runs before it is called "done". No GREEN without proof (curl / screenshot / log).
> **Status: 🔵 PENDING** — no gate has been run on this skeleton. Results land in [CERTIFICATION.md](CERTIFICATION.md) and [evals/RESULTS.md](evals/RESULTS.md).

---

## The gate sequence (in order — a gate failing blocks every gate after it)

### Gate 0 — Code + unit
- [ ] 🔵 Engine unit gold passes: `node tools/test_technical_engine.mjs` — **100% deterministic** ([evals/indicator_accuracy.md](evals/indicator_accuracy.md))
- [ ] 🔵 Confluence gold passes: `node tools/test_confluence.mjs` — **100%** ([evals/confluence_accuracy.md](evals/confluence_accuracy.md))
- [ ] 🔵 Tip Shield gold passes: `node tools/test_tip_shield.mjs` — **0 misses / 0 false positives** ([evals/tip_shield_eval.md](evals/tip_shield_eval.md))
- [ ] 🔵 Journals deterministic: `node tools/test_journals.mjs`

### Gate 1 — Integration (accessibility profiles)
- [ ] 🔵 `node tools/test_accessibility.mjs --profile=blind` — verdict recoverable, screen off
- [ ] 🔵 `--profile=deaf` — verdict recoverable, sound off
- [ ] 🔵 `--profile=mute` — full flow, zero voice
- [ ] 🔵 `--profile=illiterate` — usable, zero reading, 2G
- [ ] 🔵 `node tools/test_languages.mjs` — **26/26**, no Hinglish, EN proper-nouns

### Gate 2 — Deploy
- [ ] 🔵 Deployed to the live backend (`chitti-shares-api`) — no "live" claim without a real deploy ([feedback_verify_before_handover])

### Gate 3 — /health
- [ ] 🔵 `/health` (and `/rag/health` if applicable) returns 200 on production

### Gate 4 — curl (end-to-end on prod)
- [ ] 🔵 curl a real verdict endpoint → deterministic verdict + ATR stop + NOT-SEBI + "most traders lose" rail present
- [ ] 🔵 curl a crisis probe → Tele-MANAS 14416, no LLM ([evals/safety_eval.md](evals/safety_eval.md))
- [ ] 🔵 curl a scam tip → SCAM verdict + "not telling you to buy"

### Gate 5 — 375px screenshot × 5 devices
- [ ] 🔵 Desktop 1920×1080 — screenshot saved per box
- [ ] 🔵 Laptop 1366×768 — screenshot saved per box
- [ ] 🔵 iPad — screenshot saved per box
- [ ] 🔵 iPhone — screenshot saved per box
- [ ] 🔵 Android — screenshot saved per box
- [ ] 🔵 axe-core **0 serious/critical** on each device ([evals/accessibility_eval.md](evals/accessibility_eval.md))

> Visual-cert rule: cert validates **rendered output** (canvas/animation/post-click), not DOM existence ([cto_must_visual_cert] · [cto_visual_screenshot_mandatory]).

### Gate 6 — 5 frontend elements (platform 5-gate)
- [ ] 🔵 `feedback-widget.js` + `data-chitti-response` on every box
- [ ] 🔵 `chitti_a11y.js` injected
- [ ] 🔵 User Disability Profile prompt on first visit
- [ ] 🔵 Language auto-detect + `#lang-select` re-render
- [ ] 🔵 ISL plugin (`chitti_isl.js`) present

### Gate 7 — CTO 8-gate (the four-user + UI floor)
- [ ] 🔵 blind · deaf · mute · illiterate journeys pass
- [ ] 🔵 every box widget · 26 langs · 375px · ≥48px taps

### Gate 8 — Daily report
- [ ] 🔵 Result rolled into the daily Founder report (07:00 IST) → Vaani / CTO inbox ([chitti_cto_autonomous_mode])

## Full cert command

```
node tools/cert_chitti_technical_ai.mjs        # full: 9 archetypes × 5 devices + axe + verdict + screenshots
```

## Honest status

**Every box above is 🔵 unchecked.** No gate has run on this skeleton. The cert report is a PENDING skeleton — see **[CERTIFICATION.md](CERTIFICATION.md)**. A box flips to ✅ only when the named command emits proof (curl output / screenshot file / log line) and that proof is pasted into [CERTIFICATION.md](CERTIFICATION.md) + [evals/RESULTS.md](evals/RESULTS.md).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
