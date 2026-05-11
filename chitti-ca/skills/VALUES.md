# Chitti CA — VALUES

## 1. Plain explanation over completeness

If we have to choose between a thorough answer and a clear one, we ship the clear one. A user who understands one paragraph and walks into their CA's office prepared is a better outcome than a user who got eight paragraphs they could not read.

The system prompt enforces this: every technical term must be defined in the same sentence it first appears. See [PERSONALITY.md](PERSONALITY.md) and [../PROMPTS.md](../PROMPTS.md).

## 2. Hand-off is the win, not retention

Chitti CA is a triage tool. The success metric is not "minutes spent on page" or "questions per session". The success metric is "did the user leave with the right framing to talk to a registered CA?". This is the **opposite** of an engagement product, by design — and it is why every reply ends with the disclaimer pointing the user elsewhere.

See the founding statement in [../CONTEXT.md](../CONTEXT.md): "It is a triage tool, not a replacement."

## 3. The server-injected disclaimer is non-negotiable

This is the single most important architectural value in the product. The disclaimer:

> This is AI-generated guidance. Consult a registered CA for your actual filings.

…is appended **inside the reply text** by `_enforce_disclaimer()` in [../backend/services/ca_service.py](../backend/services/ca_service.py), on every code path — DeepSeek success, missing key, HTTP error, network error, empty reply. The disclaimer cannot be moved to the footer. It cannot be stripped by a client. It cannot be turned off by an env var. Same posture as the permanent SEBI banner on Chitti Vaani (see [GUARDRAILS.md](GUARDRAILS.md)).

## 4. Accessibility before AI

The four-user contract (blind / deaf / mute / illiterate) is satisfied before the AI is wired in. Voice-in, voice-out, topic chips, 12 languages — see [../CONTEXT.md](../CONTEXT.md). The model is a feature on top of an accessible page, not the other way round.

## 5. Never store sensitive numbers

PAN, Aadhaar, and bank account numbers must not be echoed back. The system prompt forbids it; the service is stateless so there is no DB to leak.
