# Agent 1 — Router Agent

> Swarm Agent 1 of 6 for Chitti Vaani. Runs first on every user request.
> Rules-only classification — no LLM in the critical path.
> Per COSDF v1.1 L6 / SAHAYAI_MASTER.md §2 (Vaani sole interface).

---

## Purpose

Classify the user's intent and route it to exactly one of the 14 internal
Chitti targets (or keep it as a Vaani-direct answer).  Emit a confidence score
on every decision so downstream agents and the trust strip can surface it.

---

## Input

```json
{
  "text": "Meri Paracetamol kitne ki milegi generic mein?",
  "lang_hint": "hi",
  "disability_profile": { "blind": true, "illiterate": true },
  "session_context": { "last_intent": null }
}
```

---

## Output

```json
{
  "intent_slug": "medicine-cost",
  "target_chitti": "chitti-medupi",
  "route_confidence": 0.93,
  "matched_keywords": ["paracetamol", "generic", "kitne ki"],
  "source_signals": ["keyword:generic", "keyword:medicine-price", "source_default:medupi"],
  "rule_version": "router-v1.4.2",
  "fallthrough": false,
  "confirm_before_route": false
}
```

If `route_confidence < 0.70`:
```json
{
  "confirm_before_route": true,
  "confirm_question": "Yeh CA se related sawal lagta hai — kya main Chitti CA ko bhejun?"
}
```

If `route_confidence < 0.50` (no usable match):
```json
{
  "fallthrough": true,
  "target_chitti": "chitti-vaani-direct",
  "confirm_before_route": false
}
```

---

## Classification Rules

### Keyword tiers

| Tier | Description | Confidence contribution |
|---|---|---|
| T1 | Exact domain term (e.g. "paracetamol", "ITR", "FIR", "NIFTY50") | +0.40 |
| T2 | Strong contextual phrase (e.g. "generic medicine", "tax filing", "police complaint") | +0.25 |
| T3 | Weak contextual signal (e.g. "price", "help", "kab milega") | +0.10 |
| NEG | Negative keyword — veto this category | hard veto |

### Routing table (excerpt — full table in `data/intent_routing_table.json`)

| Intent slug | Target | T1 keywords | NEG keywords |
|---|---|---|---|
| `medicine-cost` | chitti-medupi | paracetamol, generic, jan aushadhi, dawai kitni | — |
| `tax-advice` | chitti-ca | ITR, GST, TDS, advance tax, income tax | — |
| `legal-advice` | chitti-legal | FIR, legal notice, consumer court, vakeel | — |
| `news` | chitti-news | news, khabar, today's headlines | stock price |
| `bike-problem` | chitti-2wheeler | bike, scooter, engine, mileage, tyre | car, truck |
| `car-problem` | chitti-4wheeler | car, engine, oil change, tyre pressure | bike, scooter |
| `government-scheme` | chitti-government | PM scheme, ration card, DigiLocker, Aadhaar | — |
| `upi-fraud` | chitti-upi | UPI fraud, OTP scam, paisa gaya, phishing | — |
| `food-order` | chitti-vaani-local | khana mangao, food order, restaurant | — |
| `emergency` | SAFETY_AGENT_VETO | bachao, madad, hospital, ambulance, help me | (not routed — Safety Agent handles) |
| `psychology` | chitti-vaani-direct | stress, depression, sad, lonely, mujhe akela | (stays in Vaani, Empathy Agent activates) |

### Fallthrough rule

If no T1 keyword fires and the combined T2+T3 score is < 0.50, `fallthrough = true`.
Vaani answers from its own DeepSeek corpus.  The user never sees "I don't know which
Chitti to use" — they see Vaani's direct answer.

---

## Guardrails

- **No LLM** in the classification critical path. The entire routing decision is made
  from the keyword-tier table and session context. DeepSeek may be called AFTER routing
  (by the target Chitti) but never BY the Router to decide the route.
- **Emergency keywords bypass routing entirely.** The Router detects emergency signals
  and hands the full request to Safety Agent (Agent 4) without emitting a target_chitti.
  See `safety_agent.md` for the supreme-veto path.
- **`confirm_before_route`** fires at confidence < 0.70 to prevent mis-routing a
  HIGH-risk query (e.g. a medical question routed to Legal). Vaani speaks the confirm
  question before forwarding.
- **Session context.** If the previous intent was `medicine-cost`, an ambiguous follow-up
  ("aur ek aur dose?") inherits the prior intent. Context is reset after a topic change or
  after 5 turns of silence.

---

## Voting / Escalation

The Router's output feeds every downstream agent.  The Router does not vote in the
final quality decision — it is the first gatekeeper, not the last.

Downstream agents may **override** the route:
- Safety Agent (Agent 4) can VETO any intent.
- Action Agent (Agent 5) can block an action even if the Router approved the route.
- Trust Agent (Agent 6) can downgrade `route_confidence` if the assembled response
  shows overconfidence.

---

## Swarm Learning

The Router is a candidate for swarm improvement.  Patterns the swarm CAN learn:
- New regional phrasing for existing intents.
- Better negative-keyword vetoes.
- Confidence-band calibration per language.

Patterns the swarm CANNOT change:
- The emergency-keyword bypass (locked in Safety Agent).
- The HIGH-risk confirm-before-route threshold (locked in Golden Rule §2g).

---

## Test

`backend/tests/test_router_agent.py`:
- `test_medicine_routes_to_medupi` — Paracetamol query -> chitti-medupi, confidence > 0.85.
- `test_emergency_exits_routing` — "bachao" -> fallthrough = false, SAFETY_AGENT_VETO.
- `test_low_confidence_triggers_confirm` — ambiguous query -> confirm_before_route = true.
- `test_fallthrough_stays_in_vaani` — "hello" -> fallthrough = true.

---

Last reviewed: 2026-06-06
