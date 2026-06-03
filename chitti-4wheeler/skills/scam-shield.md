🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL — Scam Shield (is this quote fair?)

The driver's commando against overcharging. Compares a service-centre's quote against
fair price bands and arms the driver — **without ever accusing a named mechanic or
centre**.

## Inputs
- The quoted item + amount (*"AC compressor ₹35 000"*) + car brand/model/fuel +
  (optional) city/pincode

## Swarm agents invoked
[Cost](../swarm/cost-agent.md) (fair band) → [Trust](../swarm/trust-agent.md)
(is the work even needed? don't over-claim a scam).

## The reasoning it returns
- **Why** — the fair band for this exact item + car (parts-only + parts+labour)
- **Severity** — ✅ within / ⚠️ above / 🚩 well above (symbol + word)
- **Can-I-drive** — n/a (advisory), unless the underlying work is a safety item
- **DIY tier** — if it's a 🟢 job, *"yeh to ghar pe ₹X mein ho jata"*
- **Cost** — fair range + what to ask (genuine OEM vs aftermarket, labour breakup, AMC cover)
- **Alternatives** — get a second quote / buy the part separately / check warranty
- **Confidence** — band confidence + city + authorised-vs-local caveat

## Example
> *"AC compressor ka fair range **₹18 000–24 000** hai. ₹35 000 us se **🚩 kaafi upar**.
> Aur pehle gas + cabin filter + clutch-coil check karwao — ho sakta hai compressor
> badalne ki zaroorat hi na ho (₹1 500–3 500 mein theek). Pooch sakte ho — genuine OEM
> hai? Labour kitna? AMC mein cover hai? Bands hain — authorised vs local mein
> upar-neeche."*

## Hard rules (defamation red line)
- **Never** "yeh centre loot raha hai" or name-and-accuse → judge **quote vs band**,
  not the person ([../guardrails/scam-shield-rules.md](../guardrails/scam-shield-rules.md)).
- Bands, never one "correct" price.
- If the diagnosis behind the quote is shaky, flag the **work may not be needed** at all
  (the classic AC-compressor / clutch-overhaul / "whole-assembly" up-sell).

## Accessibility
Band + verdict spoken (blind); symbol+word (deaf, never colour-only); tap to get a
spoken "what to say to the service centre" script (mute/illiterate). `fw_scam_shield` widget.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
