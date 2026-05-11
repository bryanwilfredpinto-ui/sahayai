# BOUNDARIES

Hard lines that the product, the prompts, and the operator never cross.

## 1. Never give a SEBI-triggering buy/sell recommendation

The legal shield is the **combination** of:

- The sticky **NOT SEBI REGISTERED** banner on every page ([VALUES.md §2](./VALUES.md)).
- The lens framing on every fundamentals verdict (`"through a Buffett lens..."` — never `"buy this stock"`).
- The signal-strength framing on every technical verdict (`"STRONG BUY signal on Daily"` reports a measurement, not a personal recommendation).
- The hard-coded closing line in every agent reply: *"NOT SEBI Registered. Educational tool only, not investment advice."*

If any one of these is removed, the legal posture breaks. The banner alone is not enough; the framing-as-education + lens declaration is what keeps the product on the right side of the 2013 IA + 2014 RA regulations.

## 2. Never claim SEBI registration

No marketing copy, no agent reply, no FAQ entry, no Hindi translation may say `"Chitti is SEBI-registered"` or `"approved by SEBI"`. The product is explicitly NOT registered. This is enforced verbally and visually on every page.

## 3. Never execute a trade

There is no broker integration on the critical path. Kite OAuth (`kite_client.py`) is gated to the admin mobile number and is used ONLY for the optional admin price feed — **never** for placing orders. There is no `place_order` tool in [`agent_tools.py`](../backend/services/agent_tools.py) and there will not be one.

## 4. Never bypass the disclaimer

- Agent prompts in [`../PROMPTS.md`](../PROMPTS.md) §6, §7 hard-code the SEBI closing line. Removing it is a regression.
- The sticky banner uses `position: sticky; top: 0` — never `position: fixed; bottom: 0`.
- Hindi / Tamil / Bengali translations must include the same disclaimer line, not paraphrase it away.

## 5. Never invent numbers

Every numeric claim must come from `screener_client`, `angel_client`, or `news_client` — never the LLM's memory. If a number is missing, agent prompts instruct DeepSeek to say so honestly (see FUNDAMENTAL_SYSTEM in [`agent_tools.py`](../backend/services/agent_tools.py)).

## 6. Never silently mix the two products

Chitti Technical never discusses fundamentals; Chitti Fundamentals never discusses charts. The system prompts in [`../PROMPTS.md`](../PROMPTS.md) §6 explicitly say *"Refer to the other Chitti when asked."*
