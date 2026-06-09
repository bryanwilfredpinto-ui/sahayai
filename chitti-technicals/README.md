🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Chitti Technicals — the honest, voice-first market read for every Indian

> **Status:** CEOS v1.0 skeleton (2026-06-10). Doc set mirrors the Chitti Fashion CFOS structure.
> **Frontend (dev/cert surface):** `chitti_technical_ai.html` at repo root. **Canonical user path:** Chitti Vaani (sole interface — SAHAYAI_MASTER §2 row 1).
> **Engine (reused, not rebuilt):** `chitti_technical_engine.js` (39 indicators + the Roshan composite).
> **Backend data:** `chitti-shares-api` → Angel One SmartAPI (NSE/BSE candles, multi-timeframe).

---

## What Chitti Technicals is

A **zero-exclusion technical-analysis companion** for the ~15 crore Indians who already hold shares — or are being *pitched* a stock tip on WhatsApp — and cannot use any existing chart tool because they are **blind, deaf, mute, or illiterate**, or simply don't read English finance jargon.

It is **not** a day-trading signal machine. It is an **honest read + a guardian**:
- It tells you, in your language, by voice, what the chart is *actually* saying.
- It says **"I am not telling you to buy"** and **"most short-term traders lose money (SEBI)"** on every verdict.
- It checks a tip you were sent for **scam patterns**.
- It never places an order. Ever. (Paper journaling only.)

## What it explicitly is NOT

- ❌ A broker — it never places, holds, or routes a real order (CEOS §4.2).
- ❌ SEBI-registered advice — sticky `NOT SEBI REGISTERED` bar + modal on every surface (never demoted).
- ❌ A profit promise — no fabricated accuracy %; confidence is banded and honest.
- ❌ A scalper's edge engine — high-frequency speculation is *de-emphasised*, not glorified (see [PRODUCT_JUSTIFICATION.md](PRODUCT_JUSTIFICATION.md)).

## Who it serves (the four-user floor + the real buyer)

| User | What Chitti Technicals does that no other app does |
|---|---|
| 👁️ Blind | Speaks the verdict + sonifies the price line + offers a data table — no app on earth does this for stocks |
| 🦻 Deaf | Text + non-colour icon/shape + ISL panel mirror of every spoken cue |
| 🤫 Mute | Tap/type instead of voice; Chitti drafts → you approve (`chittiConfirmAndDo`) |
| 📖 Illiterate | Voice-in/voice-out in dialect; icons reinforce, audio carries meaning |
| 🧑 Real buyer | The semi-literate, vernacular, first-time investor + his senior-citizen parent being cold-called with tips |

## How it works

1. **Engine decides, LLM only phrases.** The deterministic `chitti_technical_engine.js` computes RSI/MACD/ATR/Roshan/confluence. DeepSeek narrates it in the user's language at the user's literacy level — it **never originates a number or a buy/sell call** (CEOS Art. 8; validated by Danelfin / QuantConnect / Bloomberg in [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md)).
2. **Every verdict is 4-channel.** Voice · text · icon+shape · ISL — *remove sight OR sound and the verdict is still 100% recoverable*. Never colour-only.
3. **Confirm before anything.** Side-effects (set a reminder, log a paper trade) gate through `chittiConfirmAndDo()` — Golden Rule (SAHAYAI_MASTER §2g).

## Document map

| Layer | Docs |
|---|---|
| **Law** | [CONSTITUTION.md](CONSTITUTION.md) · [PRODUCT_JUSTIFICATION.md](PRODUCT_JUSTIFICATION.md) (Build Score 82/100) |
| **Vision** | [ROLE.md](ROLE.md) · [PRODUCT_VISION.md](PRODUCT_VISION.md) · [VISION.md](VISION.md) · [SUCCESS_METRICS.md](SUCCESS_METRICS.md) |
| **Users** | [PERSONAS.md](PERSONAS.md) · [accessibility/](accessibility/) (blind/deaf/mute/illiterate/elderly/low-vision/cognitive/motor/rural) |
| **Product** | [PRD.md](PRD.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [SKILLS.md](SKILLS.md) · [skills/](skills/) · [SOP.md](SOP.md) · [ROADMAP.md](ROADMAP.md) |
| **Research** | [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md) (20 TA + 20 AI apps) |
| **Build** | [BUILD_ORDER.md](BUILD_ORDER.md) ← the modified BO with research pointers folded in |
| **Safety** | [GUARDRAILS.md](GUARDRAILS.md) · [guardrails/](guardrails/) |
| **Quality** | [EVALS.md](EVALS.md) · [evals/](evals/) · [OBSERVABILITY.md](OBSERVABILITY.md) · [observability/](observability/) · [QUALITY.md](QUALITY.md) · [QUALITY_GATES.md](QUALITY_GATES.md) · [CERTIFICATION.md](CERTIFICATION.md) |
| **Intelligence** | [SWARM.md](SWARM.md) · [swarm/](swarm/) · [MEMORY.md](MEMORY.md) · [memory/](memory/) |
| **Delivery** | [handover/](handover/) |

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
