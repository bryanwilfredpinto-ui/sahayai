🎖️ World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.

# OBSERVABILITY — Metrics

What we watch to know Chitti Mechanic 2W is actually helping (and not harming). All
metrics are device-local / anonymised aggregates — no PII (see
[../guardrails/privacy.md](../guardrails/privacy.md)).

| Metric | What it tells us | Alert trigger |
|---|---|---|
| **Reminder CTR** | are renewal/PUC/service nudges acted on? | drops below baseline |
| **Insurance saving** | ₹ saved vs prior premium / market | trends to ~0 |
| **Scam detection rate** | scams flagged vs eval baseline | falls below 80% |
| **DIY completion rate** | 🟢/🟡 jobs the user finished safely | sudden drop = UX issue |
| **Error rate** | failed/blank/withheld results | exceeds threshold |
| **Response time** | time to first spoken result | exceeds p95 budget |
| **Savings Tracker progress** | toward the ₹10k+ goal | flat for too long |
| **Safety-veto count** | how often the coordinator vetoed | spike = upstream bug |

- Targets / baselines are filled by the cert run — **never fabricated** here.
- A spike in safety-vetoes or error rate pages immediately; a drop in reminder CTR or
  scam detection is reviewed weekly.

---
> **World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.**
