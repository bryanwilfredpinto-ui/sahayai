🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# MEMORY — User preferences (on-device first)

Chitti Technical remembers how each trader likes to work, so the experience
personalises without re-asking. Stored **on-device first** (`localStorage`/
IndexedDB); user-owned; never sold; "Chitti forget" wipes it.

## Shape
```json
{
  "favorite_indicators": ["RSI", "Roshan Indicator", "Supertrend"],
  "risk_profile": "moderate",
  "preferred_trade_type": "swing",
  "favorite_stocks": ["RELIANCE", "TCS", "HDFCBANK"],
  "chart_pane_layout": {
    "RSI": "separate",
    "Williams %R": "separate",
    "Stochastic": "overlay",
    "Roshan Indicator": "separate"
  },
  "risk_per_trade_budget": 2000,
  "language": "bn",
  "disability_profile_ref": "shared chitti_a11y.js key"
}
```

## What each field drives
| Field | Effect |
|---|---|
| `favorite_indicators` | shown first in the picker; Roshan favourited by default |
| `risk_profile` | conservative/moderate/aggressive → entry style + position sizing |
| `preferred_trade_type` | default timeframe ladder (long/positional/swing/intraday) |
| `favorite_stocks` | quick-scan tiles on the home surface |
| `chart_pane_layout` | per-indicator overlay-vs-separate-pane, remembered ([../charts/CHARTS.md](../charts/CHARTS.md)) |
| `risk_per_trade_budget` | position-size math (rupee risk cap) |
| `language` | the **whole UI** renders in this language; voice-out picks the voice |
| `disability_profile_ref` | inherits the shared User Disability Profile (blind/deaf/mute/illiterate/…) |

## Rules
- **Synced across Chittis on the same device** via the shared `chitti_a11y.js`
  keys (language + disability profile are platform-shared, not per-product).
- **Never re-ask** what's already remembered.
- **Roshan favourited by default** — Sire's custom indicator leads.
- "Chitti forget" tombstones the record.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
