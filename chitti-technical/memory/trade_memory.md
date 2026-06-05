🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# MEMORY — Trade memory (the learning loop)

The private record of signals the user took and how they turned out — the substrate
for SOP 5 (Trade Review) and SOP 6 (Risk Review), and the source of the user's own
win/loss honesty.

## Shape
```json
{
  "trades": [
    {
      "id": "t_001",
      "instrument": "RELIANCE",
      "trade_type": "swing",
      "side": "BUY",
      "entry": 2860, "stop": 2820, "targets": [2900, 2960],
      "rr_promised": "1:2",
      "qty": 50, "rupee_risk": 2000,
      "signal_id": "sig_123", "timeframe": "daily→4h",
      "opened_at": "...", "status": "closed",
      "exit": 2900, "exit_reason": "target1", "realised_pnl": 2000, "realised_rr": "1:1",
      "respected_stop": true
    }
  ]
}
```

## What it powers
- **Trade Review (SOP 5)** — promised vs realised; did target come before stop?
- **Risk Review (SOP 6)** — was the stop respected? over-exposure? revenge pattern?
- **Behaviour brakes** ([../guardrails/overconfidence.md](../guardrails/overconfidence.md)).
- **Accuracy eval** (consented, anonymised) — feeds [../evals/signal_accuracy.md](../evals/signal_accuracy.md).

## Teaching rule (Founder Rule #1)
A loss that **respected the stop** is recorded as a *good, disciplined* trade. A
win that **ignored the stop** is recorded as *lucky, not skilful*. The memory is
honest about process, not just outcome.

## Privacy
- On-device first; never a public leaderboard; never sold.
- Golden Rule: trades are logged/closed only on the user's explicit Yes.
- "Chitti forget" wipes the ledger (tombstone preserved so accuracy counts stay honest).

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
