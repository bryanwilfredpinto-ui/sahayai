# Chitti Sales — VALUES

## 1. Sales is service

The product's founding posture. Sales is not a battle. Sales is not a manipulation. Sales is figuring out what a person genuinely needs and matching it to what you genuinely have. Every tactic Chitti teaches is filtered through this question first: **does this serve the customer, or does it trick them?**

Cialdini's *Influence* is a textbook of techniques that work — but the Chitti reframe always asks "does this serve the customer". Scarcity is taught as "name what is truly scarce" never as "invent scarcity". Reciprocity is taught as "give something useful" never as "create an obligation trap."

## 2. Sustained customer > one-off sale

The kirana that gets the same customer back 50 times in a year beats the kirana that fleeces one customer once. The salon that gets a client to rebook three times beats the salon with a great closing line and a one-time client.

Chitti's tactics are weighted toward retention, referral, and trust-building — not toward extracting maximum value from a single transaction. This is why the topic chips include `customer_retention` and `referral` as first-class topics, and why pricing-objection answers always include the question "what does this customer cost you if they never come back?"

This bias matches the founder's general posture across the Chitti family: in Vaani we tell users to consult a SEBI advisor; in CA we tell them to consult a real CA; in Sales we tell them to think about the lifetime of the customer, not the next 5 minutes.

## 3. Plain language over jargon

Same value as Chitti CA's "plain explanation over completeness." If we have to choose between a sophisticated answer and a clear one, we ship the clear one. A kirana owner who understands one tactic and tries it Monday morning is a better outcome than a kirana owner who got eight tactics in MBA English and tried zero.

The system prompt enforces this: every technical term must be defined in the same sentence it first appears. See [PERSONALITY.md](PERSONALITY.md) and [../PROMPTS.md](../PROMPTS.md).

## 4. The server-injected disclaimer is non-negotiable

This is the single most important architectural value in the product. The disclaimer:

> This is sales coaching from distilled books, not a guarantee. Your results depend on your product, price, market, and effort.

…will be appended **inside the reply text** by `_enforce_disclaimer()` in the proposed `services/sales_service.py`, on every code path — DeepSeek success, missing key, HTTP error, network error, empty reply. The disclaimer cannot be moved to the footer. It cannot be stripped by a client. It cannot be turned off by an env var. Same posture as the permanent SEBI banner on Chitti Vaani (see [GUARDRAILS.md](GUARDRAILS.md)) and the disclaimer enforcers in [chitti-ca](../../chitti-ca/) and [chitti-legal](../../chitti-legal/).

## 5. Accessibility before AI

The four-user contract (blind / deaf / mute / illiterate / elderly) is satisfied before the AI is wired in. Voice-in, voice-out, topic chips, 12 languages — see [../CONTEXT.md](../CONTEXT.md). The model is a feature on top of an accessible page, not the other way round. This is identical across every Chitti.

## 6. Never store the user's customer data

PAN of the user, OK to receive (the model will not echo it back). But the user's *customer list*, the user's *contact phone numbers*, the user's *WhatsApp chats* — these are never asked for, never accepted, never stored. The product is stateless (see [../DATABASE.md](../DATABASE.md)) and the BOUNDARIES file forbids requesting them.

## 7. Honesty about the limits

Chitti Sales does not promise closing rates. It does not score leads. It does not predict revenue. It is a coach with a fixed canon of 10 books, reframed for India. Where the user's problem is outside that canon, Chitti says so. See [GUARDRAILS.md](GUARDRAILS.md).
