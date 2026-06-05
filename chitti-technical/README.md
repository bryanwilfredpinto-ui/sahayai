🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Chitti Technical

**Voice-first, risk-first, explainable technical-analysis companion for every NSE
trader — long-term investor to intraday trader, including blind, deaf, mute and
illiterate users, in their own language.**

> This is the **CEOS (Chitti Engineering Operating System)** rebuild of Chitti
> Technical, structured exactly like the platform's best products — Fashion,
> Mechanic, News AI. It supersedes the legacy `chitti_complete_technical.html`
> built inside `chitti-shares/`. The technical-indicator engine is **extracted
> from the existing scanner** ([indicators/INDICATORS.md](indicators/INDICATORS.md))
> and the **Roshan Indicator** ([indicators/ROSHAN.md](indicators/ROSHAN.md)) is
> Sire's custom composite, carried forward as a first-class layer.

## What I do

- **Scan any NSE stock / index / ETF** and return **BUY · SELL · HOLD** with a
  confidence band — never a bare verdict.
- **Multi-timeframe analysis** matched to the trade type: Long-term (Monthly →
  Weekly → Daily) · Positional (Weekly → Daily) · Swing (Daily → 4H) · Intraday
  (4H → 1H). Higher timeframe always governs.
- **Risk on every signal** — Entry zone (ideal / aggressive / conservative),
  Stop Loss (price · % · ATR · support-based), Targets 1-2-3, RR ratio, position size.
- **Roshan Indicator** — Sire's custom composite signal layer.
- **Configurable charts** — candlesticks with each oscillator (RSI, Williams %R,
  Stochastic, …) shown **in a separate pane or overlaid in the same window**, your choice.
- **Screener** across the full NSE universe by market-cap tier, sector, and any indicator.
- **Chitti Explain** — turns every number into plain language in your language;
  never says "buy," teaches you to decide.
- **Portfolio Mode** — your private trade ledger (open / closed / PnL / risk).

Full capability surface: [skills/FEATURES.md](skills/FEATURES.md).

## Who I serve (always the 4 users)

| User | Challenge | How Chitti Technical serves them |
|------|-----------|----------------------------------|
| 👁️ Blind | Cannot see the chart | Every box reads aloud; "Audio Trade Summary" narrates Trend→Entry→Stop→Target |
| 🦻 Deaf | Cannot hear | Large numbers + symbol/word labels + ISL panel on every response |
| 🤫 Mute | Cannot speak | Whole flow by tap; voice optional, never required |
| 📖 Illiterate | Cannot read | Voice-everything, icon menus, 2G-ready, in their language |

## Stock universe (full NSE, by market-cap tier)

| Tier | Market cap (₹) |
|---|---|
| **Nifty 50** | index constituents |
| **Large Cap** | above ₹1,00,000 crore |
| **Mid Cap** | ₹50,000 – ₹1,00,000 crore |
| **Small Cap** | ₹5,000 – ₹50,000 crore |
| **Micro Cap** | below ₹5,000 crore |

All NSE stocks are included; see [screeners/SCREENER.md](screeners/SCREENER.md).

## How it works

- **Interface:** reached through **Chitti Vaani** (sole user surface).
  `chitti_technical.html` is the dev/debug + parity page.
- **Reasoning:** **DeepSeek** only (Chitti Explain), via `chitti-vaani-api`.
- **Engine:** deterministic — indicators, multi-timeframe confluence, Roshan,
  entry/stop/target are pure computation; the LLM only *explains*, it never
  *invents* a signal (so a DeepSeek outage degrades phrasing, not correctness).
- **Refresh:** **manual only** (Sire's 2026-06-06 decision) — quotes update when
  the user taps Refresh, never on a timer.
- **Swarm:** 10 agents vote before any signal shows ([swarm/](swarm/)).

## Languages

Anchored to **Chitti Vaani's** language surface (per [CTO.md §5](../chitti-cto/CTO.md)):
**9 primary languages — native UI** (English · Hindi · Tamil · Telugu · Bengali ·
Marathi · Gujarati · Kannada · Malayalam), auto-enriching to the **26-language
Voice Factory substrate** for voice-out. **The whole UI re-renders in the selected
language** — pick Bangla and the screen is Bangla; pick Telugu and it is Telugu.
**No Hinglish** — one pure language per response; indicator names (RSI, MACD, EMA,
VWAP, ATR) stay in English per [CTO.md §6](../chitti-cto/CTO.md).

## Legal

**NOT SEBI REGISTERED.** Chitti Technical is **educational technical analysis,
never investment advice.** Sticky disclaimer bar + full legal modal on every page,
never demoted to a footer. See [guardrails/](guardrails/).

## Status

🟡 **CEOS doc set authored 2026-06-06** (this commit). Implementation extracts the
indicator engine from `chitti-shares` into this product, rebuilds the UI per
[ui/UI.md](ui/UI.md), and wires the swarm. **No accuracy number is claimed until the
eval harness runs** ([evals/RESULTS.md](evals/RESULTS.md)) — honest stubs over fake demos.

## Document map (CEOS)

| Level | File(s) |
|---|---|
| **Constitution / Role** | [ROLE.md](ROLE.md) (Chief Architect + Founder Rule) |
| **Vision** | [PRODUCT_VISION.md](PRODUCT_VISION.md) · [SUCCESS_METRICS.md](SUCCESS_METRICS.md) |
| **Users** | [PERSONAS.md](PERSONAS.md) (P1–P9) |
| **Spec** | [PRD.md](PRD.md) (F0–F9) · [ARCHITECTURE.md](ARCHITECTURE.md) |
| **Skills / SOPs** | [SKILLS.md](SKILLS.md) (9 skills) · [SOP.md](SOP.md) (6 SOPs) |
| **Engine** | [indicators/](indicators/) · [scanners/](scanners/) · [screeners/](screeners/) · [charts/](charts/) · [portfolio/](portfolio/) |
| **Swarm** | [swarm/](swarm/) (10 voting agents) |
| **Guardrails** | [guardrails/](guardrails/) |
| **Accessibility** | [accessibility/](accessibility/) (4 archetypes) |
| **Memory** | [memory/](memory/) |
| **Observability** | [observability/](observability/) |
| **Evals** | [evals/](evals/) |
| **Certification** | [certification/](certification/) |
| **UI** | [ui/UI.md](ui/UI.md) |
| **Feature surface** | [skills/FEATURES.md](skills/FEATURES.md) (Feature Discovery Box) |

## Live URL (post-deploy)

- Page: `https://sahayai.in/chitti_technical.html`
- Canonical: routed via `https://sahayai.in/chitti_vaani.html`
- Health: `https://chitti-shares-api-production.up.railway.app/health` (shared engine backend)

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
