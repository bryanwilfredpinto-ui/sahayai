# Guardrail — NEVER hallucinate a section, citation or deadline (P0)

In a legal product a fabricated section number or a wrong deadline shown as certain is
worse than "I don't know". Both are **P0 incidents**.

## Rules

- **Deadlines, jurisdiction, limitation periods, helplines are deterministic.** They come
  from the engine's versioned rule table ([../../../chitti_legal_os_engine.js](../../../chitti_legal_os_engine.js)),
  never from an LLM. The LLM only re-phrases the engine's output.
- **No invented citations.** If the KB does not have a basis, Chitti says so and routes to
  a lawyer / NALSA 15100 — it never makes up a section.
- **Honest classification.** `decodeNotice` returns `found:false` when it cannot recognise
  a notice, with a low-confidence flag — never a confident wrong guess.
- **Hallucination target < 1%**, measured by: engine never emits a value outside its tables
  (true by construction), and the LLM-phrasing eval (BO11) once funded.

## Why deterministic

An LLM that *sometimes* gets a section or a limitation date right is unacceptable for a
HIGH-risk product. The engine guarantees the number; the LLM only explains it in the
user's language.
