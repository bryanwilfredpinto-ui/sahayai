# Safety Agent (SUPREME)

Runs **first** on every turn via the deterministic `detectCrisis()` — the out-of-band
classifier, independent of any LLM. Detects self-harm signals, harm-to-others, abuse,
psychosis indicators, and acute panic — including **indirect** and **vernacular**
euphemisms, aggregated across turns.

**Powers:** can **veto** any other agent and short-circuit straight to
[../sop/crisis-escalation.md](../sop/crisis-escalation.md). Engagement never precedes
safety. Escalates to **Tele-MANAS 14416** + family cascade; **never** auto-dials,
**never** diagnoses, **never** gives means. This agent's logic is testable and
auditable — a miss is a P0 incident.
