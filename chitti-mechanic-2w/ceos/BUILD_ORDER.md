# BUILD_ORDER — Chitti Mechanic 2 Wheeler

**Version:** 1.0 · **Authored:** 2026-06-13 by Chitti CTO (Claude Opus 4.8) · **Status:** BO1–BO10 implemented this pass; live-API + vision items are honest COMING SOON.

This file takes the founder CEOS's **10-phase build order** and layers in **my own research + validation inputs** (the 40-app study in [`../../CHITTI_2W_MECHANIC_RESEARCH.md`](../../CHITTI_2W_MECHANIC_RESEARCH.md) and the BEFORE-CEOS gate in [`../../CHITTI_2W_MECHANIC_PRODUCT_JUSTIFICATION.md`](../../CHITTI_2W_MECHANIC_PRODUCT_JUSTIFICATION.md), Build Score **87/100 = BUILD**). The CTO additions are tagged **🔧 CTO-INPUT** so the founder can see exactly what I added beyond the CEOS.

---

## Doctrine that shapes every BO (🔧 CTO-INPUT, from the research)

1. **Rules are the product; DeepSeek is an enhancement.** Every rupee/date/score/verdict is computed in [`chitti_mechanic_2w_engine.js`](../../chitti_mechanic_2w_engine.js) from the user's own numbers + a versioned rule table — it works with the internet down and DeepSeek 429. *Source pattern: Wrenchly/RepairPal deterministic; matches our Fashion/News-AI doctrine.*
2. **No-OBD reality for Indian bikes.** Indian 2-wheelers rarely expose OBD2, so diagnosis is **symptom-Q&A + plain-language code lookup**, and the OBD dongle is an **optional power-feature**, never the primary path. *Source: FIXD/Carly/OBDeleven are car+dongle-centric — we copy the explanation pattern, not the dongle dependency.*
3. **Honesty banner on every diagnostic surface.** "A starting point, not a definitive answer — confirm with a mechanic," and Cars24's "high score ≠ proof, low score ≠ guarantee" for the used-bike checker. *Source: Wrenchly (honesty gold standard), Cars24 odometer tool.*
4. **Neutral by design = the moat.** Chitti never profits from a repair, a part, or a bike sale — so its advice can be trusted where Droom/Cars24/OEM apps/the corner mechanic structurally cannot. No transaction monetization; revenue is B2B fleet + government + *disclosed* insurance referral only.
5. **Honest stubs over fake demos.** Vision (damage CV, sound classification, fake-part fingerprint) and live government/insurer feeds (mParivahan/DigiLocker/insurer premium APIs) are **COMING SOON**, never faked. Deterministic value ships now.
6. **The commercial user IS the accessibility user.** The gig delivery rider is low-literacy, vernacular, hands-busy → voice-first + 5-element widget + 26-lang whole-UI switch are not extras, they are the product.

---

## BO1 — Document Vault ✅
- **CEOS:** local storage of Insurance/PUC/RC/Service/Tyre/Battery/Chain; OCR upload; 50+ tests.
- **Built:** `engine.vault.{load,save,set,forget}` (localStorage, Art.4 privacy-first, "Chitti forget" wipes all) + the **My Bike** tab in [`chitti_mechanic_2w.html`](../../chitti_mechanic_2w.html).
- **🔧 CTO-INPUT:** OCR document-extract is an **honest COMING SOON** (needs a vision model — *Inspektlabs-style OCR ≥95% is achievable later*). Manual entry ships now so the feature works offline today. *Source: AUTOsist receipt-OCR.*

## BO2 — Smart Reminder Engine (24/7/365) ✅
- **CEOS:** insurance/PUC/service/RC/tyre/battery/chain reminders; voice/SMS/WhatsApp/push.
- **Built:** `engine.reminders()` — date OR km, whichever first; urgency sort; the **Reminders** tab.
- **🔧 CTO-INPUT:** dual-trigger (date AND odometer) is the *Drivvo/Simply Auto* best-practice. SMS/WhatsApp/push **delivery** is a backend job (honest stub until the messaging provider is wired) — the **schedule + on-page voice** reminder is live now. Reminders **never** auto-renew/auto-pay (Golden Rule).

## BO3 — Insurance Intelligence ✅
- **CEOS:** compare 8+ insurers, show savings; claim assistance.
- **Built:** `engine.insuranceCompare()` — 8 insurers ranked by CSR + estimated saving band; the **Insurance** tab.
- **🔧 CTO-INPUT:** we compare on **published CSR + the user's entered premium**; live premium quotes need the **insurer partner API (COMING SOON)** — so savings are shown as an honest **estimate band**, never a fabricated exact quote. *Source: PolicyBazaar/ACKO; RepairPal "fair range" honesty.* Pick on CSR + cover, not price alone.

## BO4 — PUC + Service Intelligence ✅
- **CEOS:** PUC expiry + nearest centre; service scheduler (km/months); oil + parts recommendation.
- **Built:** `engine.pucStatus()`, `engine.serviceSchedule()` + `engine.oilRecommend()` (deterministic oil-grade table by vehicle class) + the **PUC** and **Service & Oil** tabs.
- **🔧 CTO-INPUT:** PUC/insurance **validity fetch from VAHAN by reg-number** and **nearest-centre map lookup** are **COMING SOON** (mParivahan/DigiLocker are partner/location-gated). Oil grade is a **deterministic table, never an LLM guess** — wrong grade damages the engine. *Source: mParivahan/DigiLocker; Castrol/Servo/Motul oil selectors.*

## BO5 — Tyre + Battery Intelligence ✅
- **CEOS:** best tyre (CEAT/Michelin/MRF/Apollo); battery age + replacement.
- **Built:** `engine.tyreStatus()` + `engine.tyreRecommend()` (by usage) + `engine.batteryStatus()` + the **Tyres** and **Battery** tabs.
- **🔧 CTO-INPUT:** tyre rec is **usage-based with a hard "fit the OEM size on your sidewall" guardrail**. Tread/age/crack rule, not just km. Photo-of-tread wear = **COMING SOON** (vision). *Source: CEAT/MRF catalogues; Pitstop component-life concept (framed as rules, no ML-accuracy claim).*

## BO6 — Buy + Sell Assistant ✅
- **CEOS:** pre-purchase inspection (buy score + negotiation price); sell assistant (market value + listing).
- **Built:** `engine.inspect()` (Buy Score /100 + negotiation range + accident/flood/odometer risk flags) + `engine.sellAssistant()` + the **Buy** and **Sell** tabs.
- **🔧 CTO-INPUT — the headline differentiator:** the used-bike checker is a **guided checklist + honest risk score**, explicitly **not a workshop teardown and not a guarantee** (Cars24 doctrine baked into every result's `risks[]`). Guided 360° photo capture + per-part damage CV + reg-based history lookup are **COMING SOON** (vision + VAHAN). *Source: Droom 121-pt, Spinny 200-pt, CredR, Ravin/Inspektlabs/Click-Ins, Cars24.*

## BO7 — Diagnostics + Scam Detection ✅
- **CEOS:** OBD code lookup (100+ codes); scam detector (quote → expected range); DIY triage 🟢/🟡/🔴.
- **Built:** `engine.obdLookup()` (plain-language library; refuses unknown codes — never invents), `engine.scamCheck()` (>30% above fair range = alert), `engine.triage()` + the **Doctor** and **Scam check** tabs.
- **🔧 CTO-INPUT:** OBD library is **honest-by-omission** (unknown code → "not in my library, describe the symptom" — never a fabricated meaning, per the hallucination guardrail). Scam fair-ranges come from the service catalogue + public package pricing. *Source: Car Scanner DTC DB; RepairPal fair-price; GoMechanic/Apna Mechanic packages.*

## BO8 — Vehicle Education + AI Coach ✅
- **CEOS:** 8 education modules; symptom diagnosis (20+ symptoms).
- **Built:** `engine.educationList()` (8 modules with safety tier) + `engine.coach()` (symptom → likely causes + confidence band + DIY/mechanic verdict) + the **Learn** tab and the **Doctor** symptom box.
- **🔧 CTO-INPUT:** every coach result carries a **confidence band + "starting point, not a diagnosis"** and **safety-critical symptoms force 🔴 mechanic-only** (brakes/electrical/engine). DeepSeek narration of the symptom is an **enhancement (COMING SOON when funded)** — the triage itself is deterministic. *Source: Wrenchly guided Q&A + honesty; FIXD "safe to drive?"; Mercedes-style context kept separate from the safety verdict.*

## BO9 — Vehicle Twin + Savings Tracker ✅
- **CEOS:** full vehicle history; ₹10k+ annual savings tracker; ownership scores (Buy/Maintenance/Safety/Resale).
- **Built:** `engine.twin()` (local timeline + resale-readiness), `engine.savings()` (₹10k goal, honest **tracker not guarantee**), `engine.scores()` + the **Savings** tab.
- **🔧 CTO-INPUT:** savings is a **log of confirmed savings**, never a promised number (Art.9). Resale-readiness rises as records are completed (Carfax/Vehicle-Twin pattern, India-specific).

## BO10 — Accessibility + Certification ✅ (this pass)
- **CEOS:** 26 languages + RTL; 9 profiles; 5-element widget on every card; product audit; real-device sign-off.
- **Built:** whole-UI language switch via **Vaani `chitti_lang.js` `#lang-select`** (26 langs, RTL for ur/ks/sd); `chitti_a11y.js` substrate (disability profile, ISL, features, read-page); **`feedback-widget.js` 5-element widget (🔊/🤖/👍/👎/✏️) on every `[data-chitti-response]` card**; `tools/cert_mechanic_2w.mjs` (Playwright + axe-core + lang-switch proof + cross-device screenshots) + `tools/test_mechanic_2w.mjs` (engine gold assertions).
- **🔧 CTO-INPUT:** cross-device screenshots cover the founder's 5 targets — **desktop 1920×1080, laptop 1366×768, iPad, iPhone, Android** — written to `tools/cert_screenshots/`. **Real-device (physical iPhone/Android) sign-off remains Sire's slot** (CTO automates everything else).

---

## Standing COMING SOON (honest, not hidden)
| Capability | Why blocked | Unblocks when |
|---|---|---|
| Live PUC/insurance/challan fetch (mParivahan/DigiLocker) | No 3rd-party partner API; user-initiated only | partner approval / user DigiLocker link |
| Live insurer premium quotes | insurer partner API | partnership |
| Document/strip OCR · damage-photo CV · sound triage · fake-part fingerprint | needs a funded vision/audio model | DeepSeek vision key / model |
| DeepSeek symptom narration in 26 langs | DeepSeek funding + Vaani relevance-rail allowlist for mechanic intent | same standing fleet blocker as Fashion/CA/Legal |
| SMS/WhatsApp/push reminder delivery | messaging provider not wired | provider creds |
| Turso persistence of Vehicle Twin server-side | org-wide Turso read-block (2026-06-13) | Turso quota decision (Sire) |

Every one of these is surfaced to the user as COMING SOON; **none is faked**. The deterministic core delivers value with all of them off.
