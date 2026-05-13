# Chitti Kirana — Feature surface

Per the [new-products-process locked decision](../../SAHAYAI_MASTER.md), every product ships its **full feature surface as skeleton on day one**. Unbuilt features carry a visible `COMING SOON` badge. Reference apps studied before this list: **Khatabook, Vyapar, BharatPe Vyapar, myBillBook, JioSaavn-for-business, DotPe**.

---

## 1. Billing — three input modes

| Mode | How it works | Status |
|---|---|---|
| **Voice billing** | Master speaks items ("2 kg atta, 1 Maggi, 6 eggs") → STT via Voice Factory → DeepSeek parses SKU + qty → Chitti reads back → master confirms → bill generated | SKELETON |
| **Camera billing** | Master photographs barcode(s) through WhatsApp camera → barcode lookup → price + GST + supplier auto-populated → bill | SKELETON |
| **Video billing** | Master shows the shelf in a short video → Chitti reads visible items (vision LLM via DeepSeek) → list shown for confirmation → bill | COMING SOON |
| Bill delivery | Sent to customer via **WhatsApp** (preferred) or **SMS link** fallback | SKELETON |
| GST breakup | 0 / 5 / 12 / 18 / 28% slabs auto-applied | SKELETON |
| Readback before commit | Voice-billed items are read back to the master *before* the bill is finalised — prevents transcription errors | SKELETON |

**Honest-stub rule:** if vision-billing is not yet trained for a SKU class, return `COMING SOON — please use barcode for this item` rather than guessing.

---

## 2. Bill-link flywheel — every bill acquires customers

When the customer taps the WhatsApp/SMS bill link, the landing page (`chitti_kirana.html` → `/bill/<id>`) runs the **5-step flywheel**:

| Step | Behaviour | Status |
|---|---|---|
| 1. **Greet by name in customer's language** | Auto-detect customer language from phone locale + past msg history → speak the greeting via Voice Factory ("Namaste Priya ji…") | SKELETON |
| 2. **Feedback** | 4-icon row 🔊 / 🎙️ / 👍 / 👎 (shared `feedback-widget.js`). 👎 fires the voice-first apology flow. | SKELETON |
| 3. **WhatsApp-order upsell** | "Next time order on WhatsApp — bhej dijiye, hum prepare kar denge" + a CTA that opens WhatsApp to the shop's number with a pre-filled message | SKELETON |
| 4. **Chitti PA offer** | "Main aapka personal assistant bhi ban sakta hoon — bilkul FREE" with a 1-tap onboarding link into [Chitti PA](../../CHITTI_PA_MASTER.md) | SKELETON |
| 5. **Acquisition event** | If the customer accepts, a new PA user is provisioned and the master is credited as the referrer (counts toward shop's reach metric — never monetised) | COMING SOON |

The flywheel is **always opt-in** for the customer. Per the [Postman Principle](../../CHITTI_PA_MASTER.md), no message between master and customer is read or stored beyond delivery.

---

## 3. Language strategy

| Rule | Implementation | Status |
|---|---|---|
| Auto-detect customer language | Phone-locale + past-message inference + Voice Factory language router | SKELETON |
| 80% customer language, 20% Hindi filler | Prompt template enforces this ratio in the system prompt for the bill-link greeter | SKELETON |
| Address by **name + respect term** | "Priya ji" / "Ravi bhai" / "Aunty ji" based on inferred age + relationship | SKELETON |
| Never force English | Hard guardrail — refuse to fall back to English even if STT confidence is low; ask master to repeat | SKELETON |
| Bhashini → community voices migration | Per the [locked voice strategy](../../SAHAYAI_MASTER.md), Bhashini is temporary; donated voices replace per-language | COMING SOON |

---

## 4. Throughput & honest queueing

| Rule | Behaviour | Status |
|---|---|---|
| **Target response: < 20s** end-to-end (item entry → bill ready) | Measured per request; trip-wire alarms if p95 > 20s | SKELETON |
| **Queue management for peak load** | Evening rush, festival days — requests buffered, not dropped | SKELETON |
| **Honest wait message** | "Bhai, abhi 3 customers ka bill bana raha hoon — aapka 15 second mein" — voiced and shown | SKELETON |
| **DeepSeek fallback queue** | If primary DeepSeek slot is saturated, request enters a secondary queue (still DeepSeek, different rate-limit pool) — never falls back to a different LLM per the [locked decision](../../SAHAYAI_MASTER.md) | SKELETON |
| **Never silently slow down** | If queue depth > 5, the master sees the wait length up front — never silent | SKELETON |
| Carbon tracking | Each billing request counted toward the shop's CO₂/reply per [Chitti Quality v2](../../chitti-quality/CONTEXT.md) | SKELETON |

---

## 5. Inventory + expiry (inherits Chitti Business)

| Surface | Status |
|---|---|
| Stock tracking + low-stock alerts | COMING SOON (parent Chitti Business spec §3) |
| Expiry cascade (30 / 15 / 7 / 3 / 0 days) | COMING SOON |
| Out-of-stock customer memory ("Limca aaya hai") | COMING SOON |
| Demand prediction (Saturday spike, festival, rain) | COMING SOON |
| Supplier reorder + price comparison | COMING SOON |

Full spec lives in the parent [Chitti Business Master §3, §6](../../CHITTI_BUSINESS_MASTER.md).

---

## 6. Customer chatbot — 24/7 front desk

| Surface | Status |
|---|---|
| Stock check / price query / order placement | COMING SOON |
| Repeat order ("same as last time") | COMING SOON |
| Substitute when out-of-stock | COMING SOON |
| Combo / bundle suggestions | COMING SOON |
| Monthly ration auto-prepare | COMING SOON |

See parent §5.

---

## 7. Cross-cutting

- **Risk level:** MEDIUM (financial — bills/GST — but not health/legal critical). See [Chitti Quality v2 §1](../../chitti-quality/CONTEXT.md).
- **Disability profile aware:** if the master selected `BLIND` or `ILLITERATE` in [SAHAYAI_MASTER §7](../../SAHAYAI_MASTER.md), voice billing is **default-on**, picture menus replace text.
- **Legal disclaimer:** sticky bar on `chitti_kirana.html` — same contract as every Chitti page.
- **Honest stubs over fake demos** — if a surface above is `COMING SOON`, it shows that badge; we never fake the result.
