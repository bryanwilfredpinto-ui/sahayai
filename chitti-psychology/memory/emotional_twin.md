# Emotional Twin (Level 10 — on-device memory)

A longitudinal, **on-device** model of the user that makes Chitti feel like it
remembers — without ever sending emotional data to a server.

Stores (IndexedDB, example shape):
```json
{
  "communication_style": "direct",
  "stress_triggers": ["work pressure", "family conflict"],
  "confidence_score": 78,
  "preferred_language": "Hindi",
  "recent_moods": [{"d": "2026-06-05", "mood": "low"}],
  "consented_to_insights": true
}
```

**Powers:** F7 gentle observations ("more frustrated than usual the last 10 days — want
to look at it?"), reminiscence for seniors, stress-pattern recognition, weekly
plain-language narrated insight.

**Rules (locked):** opt-in only; never a diagnosis; never charts-only; never synced;
**"Chitti forget"** wipes it (tombstone kept for honest aggregate counts only). Never
used to deepen attachment or extend sessions — the Twin serves reflection, not retention.
