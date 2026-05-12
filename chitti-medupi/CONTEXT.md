# Context — Why Chitti MedUPI Exists

> A *personal medicine bill bodyguard* — turning confusion and overpayment into transparency, control, and repeated savings.

---

## 1. The problem in one paragraph

In India, **medicines are 50–70% of out-of-pocket healthcare spend**. A typical chronic-illness family (diabetes / BP / thyroid) burns **₹8,000–₹15,000/year on medicines alone**. Branded vs generic vs Jan Aushadhi pricing can vary by **5x** for the *same molecule + same strength + same dosage form*. Most people don't know equivalent options exist, or where the nearest Jan Aushadhi store is, or that the NPPA-notified ceiling price exists at all. The result is skipped doses, financial stress, and decisions taken on a chemist's word at the counter.

Tier-2/3 city families in Bhopal, Indore, Pune, Lucknow — middle / lower-middle class, elderly parents, daily-wage earners — pay the highest price for this information asymmetry. **Chitti MedUPI's job is to close it in one scan.**

---

## 2. What the product IS — and is NOT

| IS | IS NOT |
|---|---|
| Neutral price + composition intelligence | A doctor |
| Same-composition equivalent finder | A pharmacist |
| Jan Aushadhi store locator | A prescription engine |
| Family wallet + savings tracker | An e-pharmacy / cart / checkout |
| Risk-banded alternative surfacer | A drug-interaction checker |
| Voice-first, Hindi-first | A symptom checker |

If Chitti recommends a switch, suggests a dosage, or offers therapeutic alternatives across molecules — **that is a bug, file an issue**. The non-negotiable guardrails are repeated three times in [CHITTI_MEDUPI_MASTER_SPEC.md](../CHITTI_MEDUPI_MASTER_SPEC.md) §5, §7, §14 because they are the single point on which the entire product's legal + ethical posture hangs.

---

## 3. The four-user accessibility contract

Every control in MedUPI must be usable by **all four** of these users — no exceptions:

| User | What they need | What MedUPI gives them |
|---|---|---|
| **Blind** | Voice IN + voice OUT, no visual-only signal | 🔊 speak buttons on every result · `speak_en` / `speak_hi` in every API response · 🎤 mic for medicine search · auto-speak risk banner |
| **Deaf** | Visible captions + symbols, never audio-only | `caption_en` / `caption_hi` printed next to every speak · symbols `⛔ ⚠️ ✅` on risk · freshness pills with emoji + colour + text |
| **Mute** | Buttons + sliders + Next/Skip, no voice required | Demo mode advances by button · search by typed text · upload by file picker · QR by photo |
| **Illiterate / Low-literacy** | Plain-language symbols + large fonts + Hindi UI | `_chittiLang` toggle (EN ↔ हिं) · large-font Settings option · pictograms over numbers wherever possible · purpose_hi on every medicine |

**Never colour-only.** Every signal carries either a symbol OR text OR voice — usually all three. From the global memory: *"never colour-only"*.

---

## 4. The strict-match guardrail (non-negotiable)

```
Show alternatives ONLY when:
  same molecule  AND  same strength  AND  same dosage form

NO therapeutic alternatives.
NO different molecules.
NO different strengths.
NO different dosage forms.
EVER.
```

### Why this rule is absolute

| If we relaxed it | What would happen |
|---|---|
| Suggest a different molecule | "Aspirin → Paracetamol" suggestion in cardiac patient → catastrophic |
| Suggest a different strength | "Telmisartan 40 → Telmisartan 80" recommendation → hypotensive crash |
| Suggest a different form | "Insulin pen → insulin vial" → dosing error |
| Suggest a "therapeutic alternative" | Crosses the line from price comparison to prescribing → CDSCO violation |

The matcher implementation in [`services/medupi_alternatives.py`](backend/services/medupi_alternatives.py) and the DB query in [`services/medupi_database.py`](backend/services/medupi_database.py) → `search_by_composition()` both enforce the rule. The DB-level composite index `ix_medicines_strict_match` on `(salt_composition, strength, dosage_form)` is the hot path.

### Risk-band gating layered on top of strict match

Even within a strict same-composition set, some categories warrant a stop-and-think gate. The risk engine in [`services/medupi_risk.py`](backend/services/medupi_risk.py) tags every molecule:

| Class | Examples | UI treatment |
|---|---|---|
| **H (HIGH)** | Antibiotics · Cardiac · Diabetes · BP · Psychiatric · Anti-cancer · Thyroid · Anticoagulants | Red banner · symbol ⛔ · *"Always ask your doctor before switching"* |
| **M (MEDIUM)** | Painkillers · Fever · Antacids · NSAIDs · PPIs | Amber banner · symbol ⚠️ · *"Confirm with pharmacist"* |
| **L (LOW)** | Paracetamol · Antihistamines · Vitamins · ORS · Calcium | Green banner · symbol ✅ · *"Same composition, save money"* |

Default-to-LOW for unknown molecules is **logged** so the map can be expanded — never silently treated as safe.

---

## 5. Legal firewall

The disclaimer block in [CHITTI_MEDUPI_MASTER_SPEC.md](../CHITTI_MEDUPI_MASTER_SPEC.md) §8 (Bryan's verbatim "gold standard" text) is rendered:

- As a **sticky amber banner** at the top of every page (matches the SEBI disclaimer pattern on Chitti Shares)
- As a **modal** opened from the banner → full Gold Standard text + section 8.4 HIGH-risk warning when relevant
- As a **short caption** under every alternative card
- In **Hindi** when `_chittiLang === 'hi'` (auto-translated equivalents bundled in [`services/medupi_alternatives.py`](backend/services/medupi_alternatives.py) → `_disclaimer_hi()`)

The disclaimer is, per Bryan, the *Legal Firewall + Trust Builder* — not just protection, it actively builds credibility with the doctor / pharmacist conversation users walk into.

---

## 6. Where MedUPI sits in the Chitti universe

```
Chitti (parent brand · "small/affordable helper")
├── Chitti Shares
│   ├── Chitti Technical    (chitti_complete_technical.html)
│   └── Chitti Fundamentals (chitti_fundamentals.html)
├── Chitti MedUPI           (chitti_medupi.html)        ← THIS PRODUCT
├── Chitti News             (chitti_news.html)
├── Chitti CA + Legal       (chitti_ca.html · chitti_legal.html)
├── Chitti Government       (chitti_government.html)
└── Chitti Vaani            (chitti_vaani.html — emergency cascade)
```

MedUPI uses the **same Bharat Premium theme** (saffron `#E86A17` · navy `#0E2344` · gold `#D4AF37` on cream `#f8f4ee` background) as its siblings, with green tinting for medical-safe semantics. Cross-product navigation chips in the header.


## Accessibility Requirements (Non-Negotiable)
Every Chitti app must be built accessibility first before AI features are added.

### Target Users
- Blind users: Full voice navigation, TalkBack compatible
- Deaf users: Full visual, no audio dependency
- Mute users: Text/gesture input only
- Elderly users: Large touch targets, high contrast

### Android Accessibility Compliance
- Every button must have a text label
- Every image must have alt text
- Logical tab and reading order
- High contrast mode support
- Large touch targets minimum 48x48dp
- Compatible with TalkBack screen reader
- Compatible with BrailleBack for Braille display users
- No image-only content, always have text alternative

### Accountability
Once accessibility is confirmed, AI powers the Chitti.
Chitti is then accountable for keeping all content fresh and updated daily.

### Founder Dashboard
All feature status visible at sahayai.in/founder


---

## Global Best Practices (China · Dubai · Singapore)

Bharat-first, not Bharat-only. The full discussion lives in [../GLOBAL_BEST_PRACTICES.md](../GLOBAL_BEST_PRACTICES.md). Headline rules adopted for every Chitti, including this one:

- **Elder mode as a system default** (China). Our braille-mode toggle in [chitti_a11y.js](../chitti_a11y.js) generalises this to braille + low-vision in a single switch.
- **Minimum 4 Indian languages at launch** (Dubai TAMM principle, 8-language min). The 26-language registry is in [chitti_a11y.js](../chitti_a11y.js). No product is "shipped" until 4 are wired.
- **Happiness meter on every transaction** (Dubai). Three-button voice-first feedback after key flows, aggregated weekly. Wired in chitti-sales; planned in [TODO.md](TODO.md) for the rest.
- **Inclusive Design Mark co-design** (Singapore SG Enable). Our four-user contract is the local equivalent.
- **WCAG 2.1 AA continuous audit** (Singapore Govtech). The [BRAILLE.md](../BRAILLE.md) checklist is the manual equivalent until axe-core CI lands.
- **Provider abstraction is non-negotiable.** Bhashini today, swappable at `chitti-voice-factory`. Frontend never names the supplier.

### What we explicitly refuse

- Super-app monoculture (China). Each Chitti is independently installable, deletable, auditable.
- Mandatory national-ID linking (Dubai UAE Pass). Aadhaar is opt-in everywhere.
- Centralised digital identity (Singapore Singpass). No Chitti-pass; no mandatory biometrics.
- Social-credit feedback aggregation. Happiness meter is anonymised and per-product.

This section is mirrored across every Chitti's CONTEXT.md from a single source — see [GLOBAL_BEST_PRACTICES.md](../GLOBAL_BEST_PRACTICES.md).
