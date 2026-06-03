🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL — Scam Shield (is this quote fair?)

The rider's commando against overcharging. Compares a mechanic's quote against fair
price bands and arms the rider — **without ever accusing a named mechanic**.

## Inputs
- The quoted item + amount (*"oil change ₹1 800"*) + bike model + (optional) city/pincode

## Swarm agents invoked
[Cost](../swarm/cost-agent.md) (fair band) → [Trust](../swarm/trust-agent.md)
(is the work even needed? don't over-claim a scam).

## The reasoning it returns
- **Why** — the fair band for this exact item + bike (parts-only + parts+labour)
- **Severity** — ✅ within / ⚠️ above / 🚩 well above (symbol + word)
- **Can-I-ride** — n/a (advisory), unless the underlying work is a safety item
- **DIY tier** — if it's a 🟢 job, *"yeh to ghar pe ₹X mein ho jata"*
- **Cost** — fair range + what to ask (genuine vs aftermarket, labour breakup)
- **Alternatives** — get a second quote / buy the part separately
- **Confidence** — band confidence + city caveat

## Example
> *"Splendor oil change ka fair range **₹350–500** hai. ₹1 800 us se **🚩 kaafi upar**.
> Pooch sakte ho — genuine oil hai ya aftermarket? Labour kitna? Ya doosri jagah se ek
> quote lo. Bands hain — sheher se thoda upar-neeche ho sakta."*

## Hard rules (defamation red line)
- **Never** "yeh mechanic loot raha hai" or name-and-accuse → judge **quote vs band**,
  not the person ([../guardrails/scam-shield-rules.md](../guardrails/scam-shield-rules.md)).
- Bands, never one "correct" price.
- If the diagnosis behind the quote is shaky, flag the **work may not be needed** at all.

## Accessibility
Band + verdict spoken (blind); symbol+word (deaf, never colour-only); tap to get a
spoken "what to say to the mechanic" script (mute/illiterate). `tw_scam_shield` widget.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
