# CONTEXT — Why Chitti Shares exists

## The gap we close

Indian retail investors live between three bad options:

1. **Brokers** (Zerodha Kite, Angel One, Groww) — strong charts, no opinion, no plain-English narrative, no accessibility.
2. **Paid platforms** (Tickertape, Trendlyne, Bloomberg, Refinitiv) — locked behind ₹3,000–₹50,000/year paywalls.
3. **YouTube tipsters** — opinionated, unregulated, no audit trail, no SEBI accountability.

Chitti Shares is the **only** Indian-equities surface that delivers all of:

- Plain-English BUY / SELL / WAIT verdict on every signal, on every timeframe.
- Voice IN + Voice OUT on every chip, every metric, every verdict.
- Investor lens parameter (Buffett / Lynch / Graham / Greenblatt / Munger / Pabrai / Marks / etc.) so the same numbers produce different verdicts.
- Free-tier-only data sources — no paid API in the critical path.
- Persistent **NOT SEBI REGISTERED** disclaimer so the user always knows what this tool is and is not.
- Audited DeepSeek bill — every utterance metered, capped at ₹50/day soft and ₹100/day hard.

One backend serves two front-ends because the underlying data and accessibility layer is identical; only the lens (fundamental vs. technical) differs.

## The Four-User Contract (non-negotiable)

Every feature on every page must serve all four users:

| User | Cannot | Solved by |
|---|---|---|
| **Blind** | See | `aria-label` everywhere · 🔊 button on every chip / verdict / row · verdict-first speech order |
| **Deaf** | Hear | ▲▼ ✅⚠️⛔ symbols + word labels (`up` / `down` / `flat`); colour never the only signal |
| **Mute** | Speak | All inputs are tap-or-dropdown; voice INPUT is optional, never required |
| **Illiterate** | Read | 🎤 voice INPUT mic on every text input; plain-English caption on every metric; page-wide Hindi toggle (`_chittiLang`) |

This contract is referenced in [`project_four_user_contract.md`](../memory) and is the single most important constraint on the codebase. A feature that breaks one of the four users is a regression even if it ships green tests.

## SEBI disclaimer — permanent banner

Both front-ends carry a sticky top banner: **NOT SEBI REGISTERED — Educational tool only**. Clicking opens a full-legal modal with:

- The 2013 Investment Adviser regulations non-registration clause
- The 2014 Research Analyst regulations non-registration clause
- Past-performance disclaimer
- Data-source disclaimer (screener.in, Angel SmartAPI, RSS)
- User-responsibility clause

The banner stays sticky at the top — it is **never** moved to the footer (see [`project_legal_disclaimer.md`](../memory)). Every agent prompt in [`PROMPTS.md`](./PROMPTS.md) ends with the same SEBI line so the verbal reply matches the banner.

## The Investor-Lens framework

Every fundamentals verdict declares which lens produced it. The lenses live in [`backend/services/fundamental_scanner.py`](backend/services/fundamental_scanner.py) as the `strategy` parameter to `/api/fundamental-scan`:

| Lens (slug) | Filter signature |
|---|---|
| `buffett` | Quality + moat: ROE > 15%, D/E < 0.5, steady earnings, P/E reasonable |
| `lynch` | Growth at a reasonable price: PEG < 1, earnings growth > 15% |
| `graham` | Deep value: P/B < 1.5, P/E < 15, current ratio > 2 |
| `greenblatt` | Magic Formula: high earnings yield + high ROCE |
| `munger` | Quality-only: ROE > 20%, low debt, durable economics |
| `fisher` | Scuttlebutt growth: high earnings growth + R&D-heavy sectors |
| `pabrai` | Spawner / low-risk-high-reward checklist |
| `marks` | Second-level thinking: contrarian + low downside |
| Indian-investor slugs | `rj`, `kedia`, `rkd`, `rmd`, `ns` |
| AMC slugs | `hdfc`, `mirae`, `motilal`, `jpm`, `gs`, `cs1`–`cs4` |
| Theme slugs | `pli`, `china1`, `infra`, `green`, `defence`, `digital`, `div-aristo`, `turnaround`, `insider`, `debt-free`, `hidden` |

Default lens when none supplied: `buffett` (matches FUNDAMENTAL_SYSTEM in [`agent_tools.py`](backend/services/agent_tools.py)).

## Why two front-ends, one backend

| Dimension | Fundamentals frontend | Technical frontend |
|---|---|---|
| **Persona** | Patient teacher | Fast trader / commando |
| **Time-horizon** | Long-term investor (Weekly / Monthly) | Short-term trader (Daily / 4H / 1H / 15m / 5m / 1m) |
| **Primary source** | screener.in (annual + quarterly P&L, BS, CF, shareholding) | Angel SmartAPI (live quotes + intraday candles) |
| **Headline signal** | Lens verdict: QUALITY-AT-FAIR-PRICE / EXPENSIVE / VALUE-TRAP / TURNAROUND | Roshan Indicator: BUY / SHORT / WAIT |
| **AI surface** | Story Mode (60-sec narrative), Ask Chitti Fundamentals, Pros/Cons | Chitti's View paragraph, Ask Chitti Technical, signal narrator |
| **Math** | Ratios + CAGR + 5D Snowflake + Confidence Dial + Risk-Fit Dial | 43 indicators + composite strength + multi-TF rating + ATR trade plan |

Shared substrate the backend gives both:
- Symbol resolver, stock universe (NIFTY 500 seed)
- News (Moneycontrol + LiveMint + BSE + NSE RSS)
- DeepSeek client + per-call quota tracking
- Authentication (when the technical frontend wires login; fundamentals frontend is unauthenticated for now)
- Persistent SEBI disclaimer string injected into every agent reply

## What this product is NOT

- Not a broker. We do not execute orders. (Zerodha / Angel / Groww do that.)
- Not a tipster. We never push "guaranteed multibagger" content.
- Not a paid newsletter. No subscription, no premium tier.
- Not SEBI-registered. The banner says so on every page.
- Not a Bloomberg replacement. We are good-enough free-tier intelligence, voice-first, in plain English and Hindi.


## Accessibility Requirements (Non-Negotiable)
Every Chitti app must be built accessibility first before AI features are added.

### Target Users
- Blind users: Full voice navigation, TalkBack compatible
- Deaf users: Full visual, no audio dependency
- Mute users: Text/gesture input only
- Elderly users: Large touch targets, high contrast

### Android Accessibility Compliance
- Every button must have a text label
- Every image must have alt text
- Logical tab and reading order
- High contrast mode support
- Large touch targets minimum 48x48dp
- Compatible with TalkBack screen reader
- Compatible with BrailleBack for Braille display users
- No image-only content, always have text alternative

### Accountability
Once accessibility is confirmed, AI powers the Chitti.
Chitti is then accountable for keeping all content fresh and updated daily.

### Founder Dashboard
All feature status visible at sahayai.in/founder
