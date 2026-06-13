🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Logs — every verdict auditable, every narration traceable

> Subordinate to [../OBSERVABILITY.md](../OBSERVABILITY.md) and [../CONSTITUTION.md](../CONSTITUTION.md) Article 11 ("Journal Everything").
> **Status: 🔵 PENDING** — logging schema is defined; no production traces exist until BO11/BO12 ship.

---

## What gets logged (and why)

Article 11: every signal generated and every paper trade taken is logged for **audit, honest performance reckoning, AI insight, and swarm learning.** A hallucination must be traceable back to the exact turn that produced it ([hallucination_eval.md](../evals/hallucination_eval.md)).

## Log records

### 1. Signal record (deterministic engine output)
```
{
  "ts": "<IST timestamp>",
  "symbol": "<NSE/BSE symbol>",
  "timeframes": {"15m": <vote>, "1h": <vote>, "1D": <vote>, "1W": <vote>},
  "verdict": "Strong Buy | Buy | Neutral | Sell | Strong Sell",
  "confluence_score": <int>,
  "indicators": {"rsi": <n>, "roshan": "Strong|Weak|Neutral", "macd": {...}, "atr": <n>},
  "stop": <n | null>,          // null here is a SEV-1 on Buy/Sell (Article 5)
  "engine_version": "<hash>"
}
```

### 2. Narration record (LLM phrasing — for the hallucination diff)
```
{
  "signal_ref": "<signal id>",
  "lang": "<one of 26>",
  "narration": "<DeepSeek output>",
  "extracted_tokens": [...],     // numbers/levels/calls pulled from narration
  "drift": [...],                // tokens NOT traceable to the signal record -> hallucination
  "disclaimer_present": true|false,
  "not_sebi_present": true|false
}
```

### 3. Safety-event record (pages loudly)
```
{ "ts": "...", "type": "stopless_signal | crisis_redirect | crisis_llm_leak | loss_spiral_cooldown | not_sebi_missing", "detail": "...", "sev": 1 }
```

### 4. Tip-Shield record
```
{ "ts": "...", "verdict": "SCAM | LIKELY_SCAM | CLEAN", "patterns": [...], "lang": "...", "routed_to": "upi|legal|none" }
```

### 5. Paper-trade record (user journal — Article 11)
```
{ "ts": "...", "symbol": "...", "side": "...", "entry": <n>, "stop": <n>, "exit": <n|null>, "outcome": "win|loss|open" }
```

## Privacy rules (locks)

- No raw audio retained beyond the turn.
- Journal/paper-trade data is **user-owned**, anonymised before any swarm aggregation, and **"Chitti forget" purges all records for that user**.
- No PII in safety/crisis logs beyond what is needed to fire the 14416 redirect.

## Retention & access

- Safety + narration logs retained for audit; surfaced to the CTO inbox / Vaani, never mid-session chat.
- Swarm learning consumes only anonymised, aggregated records (≥100 confirmations before any skill change — swarm lock).

Cross-links: [metrics.md](metrics.md) (aggregates these) · [feedback.md](feedback.md) · [../evals/safety_eval.md](../evals/safety_eval.md).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
