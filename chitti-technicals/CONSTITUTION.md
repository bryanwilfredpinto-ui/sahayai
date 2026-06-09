🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# CONSTITUTION — the supreme law of Chitti Technicals

> Level 0. Nothing in any other doc, skill, agent, or line of code may contradict this file.
> If it does, this file wins. Derived from the founder's CEOS, reconciled with the SAHAYAI_MASTER §2 locked decisions and the CTO contract.

---

## The Founder Rule (the one inversion that defines us)

> **Most trading apps want you to trade more. Chitti Technicals wants you to lose less.**

Every existing platform's incentive is engagement → more trades → more brokerage. SEBI's own data is brutal: ~70% of intraday traders lose money; **9 of 10 F&O traders lose, average ₹1.1 lakh each.** A product that hands buy/sell signals to blind/illiterate/poor users and calls it "accessibility" is predatory. We invert it: **understanding first, protection always, trading never urged.** This single inversion is why Chitti Technicals deserves to exist (see [PRODUCT_JUSTIFICATION.md](PRODUCT_JUSTIFICATION.md), Build Score 82/100, conditional on this re-scope).

---

## The 12 Articles

### Article 1 — Access First, Trading Second
No indicator, signal, or AI feature ships unless it renders **accessibly for all nine archetypes** (blind, deaf, mute, illiterate, elderly, low-vision, cognitive, motor, rural). Accessibility is the floor, not a feature.

### Article 2 — Four-Channel by Default (never colour-only)
Every verdict (Strong Buy → Strong Sell, RSI state, MACD event, S/R level) is expressible in **four parallel channels**: **VOICE · TEXT · ICON+SHAPE · ISL/visual**. The gate: *remove either sight OR sound and the verdict must still be 100% recoverable.* Colour only decorates — shape/word/voice carry meaning (WCAG 1.4.1). [Research basis: every one of 40 audited apps fails this.]

### Article 3 — Analysis, Never Advice; Chitti Never Acts
Chitti Technicals is an **educational read**, not investment advice (NOT SEBI registered — sticky bar + modal, never demoted). It **never places, holds, or routes a real order** (paper journaling only, CEOS §4.2). Every side-effect (set a reminder, log a paper trade) gates through `chittiConfirmAndDo()` — speaks the question, waits for explicit *haan*, never defaults to yes, never times out into yes (SAHAYAI_MASTER §2g Golden Rule).

### Article 4 — Honest Limitations (no fabricated edge)
Every signal carries: **confidence score (0–100)**, **confluence score** (how many timeframes agree), and the disclaimer *"Past performance does not guarantee future results. Most short-term traders lose money. This is not advice."* **No accuracy percentage is ever stated that the engine cannot reproduce on demand.** [Anti-pattern: Tickeron "92%", Incite "95%" — rejected. Gold standard: Danelfin's probability framing + explicit "backtest ≠ future".]

### Article 5 — Stop-Loss Mandatory
No BUY/SELL read is presented without a calculated **ATR-based stop**. No stop → no signal. The risk number is shown *before* the reward number.

### Article 6 — Deterministic Safety Over LLM
The signal math is **rules, computed and reproducible** (`chitti_technical_engine.js`). DeepSeek **only phrases** the deterministic result, cites the indicator behind every claim, and is **never** on the path of a number, a stop-loss, a position size, or a crisis response. Crisis keywords (suicide/self-harm) → immediate Tele-MANAS 14416, no LLM. Loss-spiral (>5% in a day / 3 losing trades) → mandatory cool-down.

### Article 7 — Rules Are the Product, AI Is an Enhancement
Validated by the most-trusted apps audited (QuantConnect Mia = "a tight wrapper over LLM"; Composer; Danelfin; Fintool; Bloomberg). The engine carries the value with DeepSeek **down**. The LLM makes it *warm and vernacular*, not *correct*.

### Article 8 — Guardian, Not Croupier
Chitti **warns**. It surfaces the **"most traders lose"** rail, runs the **anti-scam Tip Shield** on any forwarded "tip", de-emphasises scalper/intraday churn, and frames every read as *"here is what the chart says — be careful, Sire."* It is a coach and a commando, never a gambling table.

### Article 9 — Indian Market First
NSE & BSE cash equity; Angel One SmartAPI data; IST trading hours (9:15–15:30) + Indian holiday calendar. Indicator/exchange proper-nouns (RSI, MACD, EMA, VWAP, ATR, NSE, BSE, Nifty, Sensex, Bank Nifty) stay **English** in every language; the prose around them translates (CTO UI Standard §6).

### Article 10 — Vaani is the Sole Interface
The user never "opens Chitti Technicals." They ask **Vaani**, which routes to this internal service. `chitti_technical_ai.html` is a **dev/cert + parity surface**, not the canonical user path (SAHAYAI_MASTER §2 row 1). Building the page is required for the four-user UI and certification; it is not the product's front door.

### Article 11 — Journal Everything
Every signal generated and every paper trade taken is logged (dual journal: system signals + user paper trades) for audit, honest performance reckoning, AI insight, and swarm learning. Outcomes are recorded truthfully — winners *and* losers.

### Article 12 — Every Box Carries the Widget; Every Page Passes the Gates
Every response box carries the per-response widget (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ via `feedback-widget.js` + `data-chitti-response`). No page ships GREEN without all **5 frontend gates** + the **CTO 8-gate** + a **375px screenshot** on all five devices (Desktop 1920×1080 · Laptop 1366×768 · iPad · iPhone · Android).

---

## Absolute guardrails (cannot be relitigated — SAHAYAI_MASTER §2 locks)
DeepSeek-only LLM · Voice Factory voice · family-cascade emergency (never cops) · four-user contract · ISL first-class · per-response widget · camera intelligence (user-owned) · Vaani-sole-interface · sticky NOT-SEBI bar. The CTO **enforces** these; it never softens them for convenience.

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
