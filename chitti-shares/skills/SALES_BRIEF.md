# SALES_BRIEF

Who this is for and why it wins.

## 10 pain points (the retail Indian investor today)

1. **Doesn't understand P/E** — sees "P/E 45" on Moneycontrol and has no idea if that is cheap, fair, or absurd for the sector.
2. **Can't read screener.in** — the page is dense, in English, and assumes the reader knows what ROCE, PEG, and DSO mean.
3. **Gets sold tips by Telegram groups** — "guaranteed multibagger, entry 250, target 800" with no rationale, no stop loss, no audit trail.
4. **Pays ₹3,000–₹50,000/year** to Tickertape / Trendlyne / Bloomberg / Refinitiv just for plain-English context.
5. **No accessibility on any broker app** — Zerodha Kite, Angel One, Groww all fail blind / illiterate / elderly users.
6. **Hindi-first users are invisible** — Moneycontrol Hindi is a translation, not a parallel product; numbers and verdicts are still English-only.
7. **No SEBI accountability on tipsters** — YouTube/Telegram callers face no consequence when a call blows up.
8. **Charts don't speak** — a TradingView chart has 200 indicators but zero plain-English narrative; the user sees lines without meaning.
9. **No lens diversity** — every screen feeds the same Buffett-clone filter; Lynch, Graham, Greenblatt, Indian masters (RJ / Kedia / RKD) are absent from free tools.
10. **Cold-start fatigue** — opening five different apps (Kite for price, screener for ratios, Moneycontrol for news, YouTube for opinion, Excel for returns) for every research session.

## 10 benefits (what Chitti Shares delivers)

1. **Plain-English ratio explainer** on every metric — *"P/E 45 is high for FMCG but normal for tech."*
2. **screener.in fundamentals + 30+ investor lenses** (Buffett / Lynch / Graham / Greenblatt / Munger / Pabrai / Marks + RJ / Kedia / RKD / RMD / NS + HDFC / Mirae / Motilal) on one page — see [`backend/services/fundamental_scanner.py`](../backend/services/fundamental_scanner.py).
3. **Roshan Indicator + 43 technical indicators** with composite signal strength on every timeframe — see [`services/strength.py`](../backend/services/strength.py).
4. **NOT SEBI REGISTERED banner + lens framing = honesty wins**: no tipster theatre.
5. **Voice IN + voice OUT** across both frontends — Four-User Contract (blind / deaf / mute / illiterate).
6. **Hindi page-wide toggle** — `_chittiLang = 'hi'` flips every chip; DeepSeek replies in Hindi when the user writes Devanagari.
7. **Free** — no subscription, no premium tier, no paid API in the critical path.
8. **5D Snowflake + Confidence Dial + Risk-Fit Dial** — Simply-Wall-St-style differentiators that never round-trip the LLM (see [GUARDRAILS.md](./GUARDRAILS.md)).
9. **Story Mode** — 60-second plain-language narrative of the company OR the technical signal.
10. **One backend, two surfaces** — fundamentals teacher + technicals commando — same auth, same disclaimer, same Hindi toggle.
