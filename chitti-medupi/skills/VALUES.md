# VALUES — Core Values Mapped to Product Behaviour

Five values. Each one maps to a concrete, shippable behaviour you can grep for in the codebase. If a value is not enforced by code, it is decoration — not a value.

---

## 1. User dignity over feature count
**The user is never made to feel poor for asking about prices.**

- No upsell. No "premium tier." No "unlock savings." Free for everyone.
- No moral framing of cost ("you've been overpaying" is banned copy).
- No requirement to create an account before seeing the first price comparison.
- The wallet view shows *savings*, not *poverty* — the headline is "₹4,800 saved this year," not "₹4,800 wasted last year."
- The disclaimer banner builds credibility for the user's *doctor conversation*, not for our liability — see [CONTEXT.md](../CONTEXT.md) §5.

**Code reflex:** Strip every line of copy that implies the user should have known better.

---

## 2. Strict same-composition matching is the product
**No fuzzy substitutions. Ever.**

- The matcher in [`services/medupi_alternatives.py`](../backend/services/medupi_alternatives.py) returns hits only when `salt_composition AND strength AND dosage_form` all match.
- The DB composite index `ix_medicines_strict_match` is the hot path; relaxing it is a schema-level violation, not a UI tweak.
- "Therapeutic alternatives" across molecules is a feature we will **never** ship. It crosses from price-comparison into prescribing — a CDSCO violation and a clinical risk. See [BOUNDARIES.md](BOUNDARIES.md).
- If the matcher returns zero rows, the answer is "no equivalent found" — not "here's something close."

**Code reflex:** Any PR loosening the strict-match query gets rejected at review.

---

## 3. Accessibility before AI
**The product works for Blind / Deaf / Mute / Illiterate users BEFORE any AI feature is layered on.**

Per the global Sahay AI contract: accessibility is the foundation, AI is the icing. If the vision scanner is down, the user can still type or speak the medicine name and get the same answer. If TTS is unavailable, captions carry the message. If the user is illiterate, symbols + Hindi voice carry the message.

- Every control has `aria-label` + on-screen caption + audio readback.
- Every API response carries `speak_en` / `speak_hi` / `caption_en` / `caption_hi`.
- Demo mode (8 steps) is operable by all four user types without modification.
- The fall-through when vision API is down (Anthropic key missing → soon DeepSeek-VL): Blind user uses voice search; Illiterate user uses Hindi voice search. The product never hard-fails on AI absence.

**Code reflex:** If a feature requires a working LLM key to function at all, it ships disabled until a non-AI fallback is wired.

---

## 4. Truth over confidence
**A null is better than a guess.**

The vision prompt in [PROMPTS.md](../PROMPTS.md) §1 ends with *"Do NOT hallucinate values"* — and the product enforces this end-to-end:

- Salt composition unreadable? Return `null`, route to typed/voice search.
- Jan Aushadhi store address not in the seed file? Show "no nearby store" — never invent one.
- NPPA ceiling price unknown? Show the MRP and Jan Aushadhi alone — never extrapolate.
- Brave Search snippet stale (>7 days)? Show the freshness pill in red — never present it as current.

**Code reflex:** Every uncertain field carries a `confidence` or `freshness` indicator and is gated in the UI.

---

## 5. Voice is the default channel, not an accessibility tax
**Voice IN + voice OUT is the primary interface, not a checkbox feature.**

- The mic button is the largest control on the search screen.
- The 🔊 speak button appears on every result card, not buried in a menu.
- Hindi voice is first-class, not a translation post-step.
- The strict-match warning is **always** spoken aloud when a HIGH-risk molecule is involved, never silent text-only.
- See the Chitti Voice Factory spec for the 26-language substrate; MedUPI lives on top of it.

**Code reflex:** Every new endpoint returns `speak_*` strings; no endpoint ships text-only.
