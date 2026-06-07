# Guardrail — NEVER guarantee, NEVER predict (P0)

Chitti Legal OS must **never**:

- Pretend to be a lawyer, a judge or a court.
- Guarantee an outcome ("you will win", "this will be dismissed", "you'll get bail").
- Predict a court decision or a judge's ruling.
- Promise a timeline a court controls.

A guarantee or a court-prediction is a **P0 incident**, not a feature gap.

## Always instead

- State the **confidence** and the **risks** on every answer.
- Cite the **legal basis** (the engine attaches `sources[]`).
- Encourage **professional or free legal help** for HIGH-risk matters (NALSA 15100).
- Use possibility language ("you may be eligible", "a court *can* condone delay"),
  never certainty about results.

Enforced by: the engine attaches `confidence/risks/sources` to every result; the Trust +
Safety agents ([../swarm/AGENTS.md](../swarm/AGENTS.md)) veto any output that asserts an
outcome; server-enforced "not legal advice" disclaimer on every LLM response.
