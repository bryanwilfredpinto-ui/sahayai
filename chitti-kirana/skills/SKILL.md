# Chitti Kirana — Skill

**Product:** Chitti Kirana — the kirana/grocery digital employee. First concrete instantiation of [Chitti Business](../../CHITTI_BUSINESS_MASTER.md).

**Frontend:** root `chitti_kirana.html` (TBD). **Backend:** `chitti-kirana-api`. **Voice:** Chitti Voice Factory cascade. **LLM:** DeepSeek (sole provider per locked decision).

---

## Use this skill when the user asks about

- Kirana / grocery shop billing, voice billing, barcode billing, video billing
- Bill links sent via WhatsApp / SMS — what they do when the customer taps them
- Acquiring Chitti PA users *through* the kirana flywheel
- Customer-language strategy (vernacular-first, name + respect address)
- Throughput / response time / queueing during peak load
- Anything matching the surfaces in [FEATURES.md](FEATURES.md)

## DO NOT use this skill for

- Stock / expiry / supplier / GST flows that aren't kirana-specific → use the parent **Chitti Business** spec
- Medicine same-composition matching → `chitti-medupi` skill
- Personal-life features (calls, reminders, schemes for the master himself) → `chitti-pa` (when it exists)

---

## Core stance

Chitti Kirana is **a digital employee that earns the shop more customers each time it bills one**. Every bill is an acquisition event for Chitti PA. Every customer leaves the transaction having heard Chitti in their own language, by their own name, with the option to make Chitti their personal assistant too — for free.

Three locked design rules:

1. **Billing must accept what the master can give** — voice, camera, video. Not forms.
2. **Every bill link is a flywheel** — feedback + WhatsApp upsell + Chitti PA offer.
3. **Honest under load** — queue, tell the truth about wait, never silently slow down.

See [FEATURES.md](FEATURES.md) for the full feature surface and `COMING SOON` markers.

---

## Anti-patterns to refuse

- Forcing English on a kirana customer who messaged in Marathi
- Silent slowness — if the system is queued, **say so**
- Shoving the Chitti PA offer in the customer's face before they've felt the kirana flywheel work for them
- Asking the master to type SKU codes (he won't — he'll speak or show)
- Adding fake confidence to a voice-billing transcription — readback before commit

---

## Voice + a11y contract

- Voice IN: master → voice billing through Voice Factory STT
- Voice OUT: customer-language voice on bill-link greeting (community-donated voices preferred; Bhashini fallback)
- Symbols + word labels on the bill link (✅ / ⚠️ / 🔊), never colour-only
- Inherits [chitti_a11y.js](../../chitti_a11y.js) — disability profile + ISL panel apply if the master is blind/deaf/etc.

---

## Cross-links

- Parent product: [Chitti Business Master](../../CHITTI_BUSINESS_MASTER.md)
- Personal-side counterpart: [Chitti PA Master](../../CHITTI_PA_MASTER.md)
- Voice substrate: [Chitti Voice Factory Master Spec](../../CHITTI_VOICE_FACTORY_MASTER_SPEC.md)
- Accessibility floor: [SAHAYAI_MASTER §7](../../SAHAYAI_MASTER.md)
