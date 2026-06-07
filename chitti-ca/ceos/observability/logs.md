🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# OBSERVABILITY — Logs

- **Per-request audit** (backend `chitti-ca-api`): `x-chitti-response-time-ms` +
  12-hex `x-chitti-request-id` on every response (SLA-timing already GREEN).
- **Quality audit rows** (`lib/observability.py`) for every LLM-explain turn: latency,
  rail decisions, disclaimer-inject, judge scores.
- **Provenance log** — every user-visible rupee figure carries an engine source tag; a
  figure without provenance is logged as a defect (anti-hallucination, target <1%).
- **Honest-fallback log** — DeepSeek 429/down → engine strings ship; the fallback event
  is logged (never silent), per BCP Layer 5.
- **Feedback log** — per-box 👍/👎 + voice/text → Founder daily 07:00 IST (see
  [feedback.md](feedback.md)).
- **On-device only** for the Financial Twin — no PAN/GSTIN in any server log
  (see [../guardrails/privacy.md](../guardrails/privacy.md)).

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
