**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Chitti Health Scanner — Product Requirements Document (PRD)

> **COSDF v1.0 · Level 4 — Product Requirements**
> Part of the **Chitti MedUPI** family · Chitti = Bharat Premium AI · sahayai.in
> Founder: Bryan Wilfred Pinto ("Sire")

---

## Golden Line (read before everything)

> **"Chitti helps you notice — doctors help you heal."**

Chitti Health Scanner **DETECTS / NOTICES patterns and ESCALATES to professionals.**
It **NEVER diagnoses.** Every analysis output carries four mandatory elements:

1. **Confidence level** (honest %, or `___%` while the vision model is an unbuilt stub)
2. **Plain-language explanation** (illiterate-safe, voice-read)
3. **Suggested action** — one of: 🟢 **monitor** / 🟡 **consider consult** / 🔴 **seek care**
4. **The disclaimer:** *"This is not a medical diagnosis."*

No prescriptions. No "you have <disease>". No certainty. No fear-mongering. No shaming.

---

## Brand & Platform Contract (locked — do not relitigate)

- **Palette:** Saffron `#FF9933` · Navy `#000080` · Green `#138808`.
- **LLM:** **DeepSeek ONLY** (`api.deepseek.com`, OpenAI-compatible). Vision via **DeepSeek-vision**, disclaimer-guarded. No other provider.
- **Four-user accessibility:** Blind / Deaf / Mute / Illiterate. Voice IN + Voice OUT + icons/symbols + plain language. **NEVER colour-only** — every status pairs colour **+ icon + text** (🟢 normal / 🟡 monitor / 🔴 seek care).
- **Multilingual** via the shared substrate (`chitti_lang.js` + `T` dictionary), same as Chitti Vaani: 9 primary (en/hi/ta/te/bn/mr/gu/kn/ml) + 26-language substrate. **No Hinglish** (one pure language per render). Technical/brand terms stay English: Chitti, DeepSeek, UPI, AI, DPDP, ABDM, AES-256-GCM.
- **Golden Rule — Chitti NEVER acts on its own.** Opening camera / capturing / saving / sharing / setting a reminder passes through a **confirm gate** ("Sire, shall I open the camera? Haan / Nahi") — voice + tap, mute-safe, never default-to-yes, silence = wait.
- **Per-response widget:** every response box carries `data-chitti-response` + 🔊 / 🤖 / 👍 / 👎 (`feedback-widget.js`).
- **Privacy:** health images **AES-256-GCM** encrypted at rest, user-owned, never sold, anonymised before any aggregate. **"Chitti forget"** deletes all. **DPDP 2023 + ABDM-aware.**
- **Backend:** extends `chitti-medupi-api` with `/api/health-scanner/*`; feeds the **Chitti Health File** timeline; cross-links to **MedUPI** (Jan Aushadhi) + **Government** (PMJAY).

---

## HONEST STATUS BANNER (top of product, top of this doc)

> ⚠️ **The AI vision models are NOT built or clinically validated yet.**
> All accuracy figures in this document are **research benchmarks / TARGETS from the published literature** — they are **NOT achieved by Chitti** and must never be shown to a user as Chitti's own measured accuracy.
> Backend analysis endpoints return an **honest `501 coming_soon`**. Certification scores stay **BLANK (`___%`)** until Chitti measures them itself.
> Where DeepSeek-vision is wired, it returns a **pattern description with disclaimers — never a diagnosis.**
> **Skin-tone bias is real:** AI dermatology/visual models are documented to be **less accurate on darker skin (Fitzpatrick IV–VI)**. This limitation is stated on every relevant feature and surfaced to the user in plain language.

---

## Mandatory Output Template (applies to F0–F12)

Every feature, when (eventually) analysing, MUST emit this shape inside a `data-chitti-response` box:

```
🔎 What Chitti noticed: <plain-language pattern description, no disease name>
📊 Confidence: <NN>%  (or ___%  — model not yet built/validated)
🎚️ How sure is this: 🟢 high / 🟡 moderate / 🔴 low — and WHY
✅ Suggested action: 🟢 monitor at home  /  🟡 consider seeing a professional  /  🔴 seek care soon
🌗 Skin-tone note (visual features): accuracy may be lower on darker skin tones (Fitzpatrick IV–VI)
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

Voice-out reads this top-to-bottom. Icons accompany every line for illiterate + deaf users.

---

# FEATURES F0 – F12

Each feature lists: **Input**, **Detectable patterns**, an **Honest example output** (always confidence % + suggested action + "not a diagnosis"), **Research-validation note** (benchmarks labelled as TARGETS), and **Build status**.

---

## F0 — Skin Scanner

**Input:** One or more photos of a skin area (rash, patch, discoloration, dryness, redness). Optional voice note: "itchy for 3 days". Good-light guidance prompt before capture.

**Detectable patterns (notice, not name):** colour change, texture/scaling, redness/inflammation pattern, spread vs. previous photo, dryness/flaking, raised vs. flat, symmetry, border regularity.

**Honest example output:**
```
🔎 What Chitti noticed: A red, slightly scaly patch with an uneven border, larger than in your last photo.
📊 Confidence: ___%   (vision model not yet built/validated — DeepSeek-vision gave a pattern description only)
🎚️ How sure is this: 🔴 low — single photo, lighting varied, and accuracy is reduced on darker skin tones.
✅ Suggested action: 🟡 consider seeing a skin doctor (dermatologist) if it spreads, itches more, or doesn't improve in a week.
🌗 Skin-tone note: visual skin models are documented to be less accurate on Fitzpatrick IV–VI skin.
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

**Research-validation note (TARGETS, not achieved):** Published dermatology AI research reports up to **~95%** image-classification accuracy on benchmark datasets. **This is a research TARGET, not Chitti's measured accuracy.** Those datasets under-represent darker skin; real-world accuracy on Fitzpatrick IV–VI is known to be **materially lower**. Chitti states this bias to the user explicitly.

**Build status:** **SKELETON / COMING SOON.** Honest stub — DeepSeek-vision returns a guarded pattern description with disclaimers; no diagnosis. Backend `/api/health-scanner/skin/analyze` → `501 coming_soon`.

---

## F1 — Eye Scanner

**Input:** Photo of the eye / surrounding area (redness, yellowing of the white, swelling, discharge, droop). Optional voice symptom note.

**Detectable patterns:** redness pattern, yellow tint of sclera, visible swelling/puffiness, discharge presence, asymmetry between eyes, pupil-size difference (qualitative).

**Honest example output:**
```
🔎 What Chitti noticed: The white of the right eye looks more yellow than the left.
📊 Confidence: ___%   (model not yet built/validated)
🎚️ How sure is this: 🔴 low — phone cameras distort eye colour under indoor light.
✅ Suggested action: 🟡 consider seeing a doctor, especially if yellowing also shows on your skin.
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

**Research-validation note (TARGETS, not achieved):** Retinal/eye AI research (e.g. diabetic-retinopathy screening) reports high benchmark accuracy on specialised fundus cameras. **Phone-camera surface-eye photos are NOT equivalent** — Chitti only notices surface patterns and never claims screening-grade accuracy. Figures are research TARGETS only.

**Build status:** **SKELETON / COMING SOON.** DeepSeek-vision pattern description with disclaimers; `501 coming_soon`.

---

## F2 — Wound Monitoring

**Input:** Repeat photos of the same wound/cut over days. Voice note: "day 4, hurts less". Chitti aligns to the same framing for comparison.

**Detectable patterns:** size change over time, redness spread around the wound, colour of the wound bed, discharge/oozing, swelling, signs that warrant urgency (spreading redness, pus).

**Honest example output:**
```
🔎 What Chitti noticed: The redness around the cut has spread wider than in your day-2 photo.
📊 Confidence: ___%   (model not yet built/validated)
🎚️ How sure is this: 🟡 moderate — same framing, but lighting changed between photos.
✅ Suggested action: 🔴 seek care soon — spreading redness, warmth, or pus can mean infection.
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

**Research-validation note (TARGETS, not achieved):** Wound-assessment AI research targets reliable area-measurement and redness-tracking; reported benchmark figures are TARGETS, not Chitti's results. Chitti's value is **consistent same-framing comparison over time**, not absolute classification.

**Build status:** **SKELETON / COMING SOON.** Stub returns change-description with disclaimers; `501 coming_soon`.

---

## F3 — Tooth Scanner (high-value)

**Input:** Photo(s) of teeth/gums (front + sides), or a guided intra-oral capture. Voice note: "this tooth hurts when cold".

**Detectable patterns:** visible discoloration spots, gum redness/swelling, visible cavities/dark spots, plaque/tartar build-up, chipped/cracked surfaces, recession of the gum line.

**Honest example output:**
```
🔎 What Chitti noticed: A dark spot on a lower-back tooth and some gum redness nearby.
📊 Confidence: ___%   (model not yet built/validated)
🎚️ How sure is this: 🟡 moderate — front teeth are clearer than back teeth in phone photos.
✅ Suggested action: 🟡 consider a dentist visit; book sooner if it hurts with cold/sweet food.
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

**Research-validation note (TARGETS, not achieved):** Dental-image AI research reports roughly **89–97%** accuracy ranges for caries/lesion detection on curated datasets. **These are research TARGETS, not Chitti's measured accuracy.** Phone-camera intra-oral images are harder than clinical radiographs; Chitti notices surface patterns only.

**Build status:** **SKELETON / COMING SOON** (flagged high-value). DeepSeek-vision pattern description with disclaimers; `501 coming_soon`.

---

## F4 — Hair & Scalp Scanner

**Input:** Photos of scalp/hairline/part-line over time. Voice note: "more hair falling lately".

**Detectable patterns:** thinning areas, widening part-line, bald-patch boundaries, scalp redness/flaking (dandruff-like), recession at temples — tracked against earlier photos.

**Honest example output:**
```
🔎 What Chitti noticed: The part-line looks a little wider than your photo from last month.
📊 Confidence: ___%   (model not yet built/validated)
🎚️ How sure is this: 🟡 moderate — hairstyle and lighting strongly affect this.
✅ Suggested action: 🟢 monitor; 🟡 consider a dermatologist if thinning continues or scalp is itchy/flaky.
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

**Research-validation note (TARGETS, not achieved):** Trichology/scalp AI research targets density and thinning-progression measurement; reported figures are benchmark TARGETS. Chitti tracks **change over time**, not a named hair-loss condition.

**Build status:** **SKELETON / COMING SOON.** Stub returns thinning/change description with disclaimers; `501 coming_soon`.

---

## F5 — Nail Scanner

**Input:** Photos of finger/toe nails. Voice note: "this nail changed colour".

**Detectable patterns:** colour change (pale/yellow/dark line/blue tint), ridges, brittleness/chipping, separation from nail bed, swelling/redness around the nail fold, dark streaks.

**Honest example output:**
```
🔎 What Chitti noticed: A dark vertical line on the thumbnail that wasn't in your earlier photo.
📊 Confidence: ___%   (model not yet built/validated)
🎚️ How sure is this: 🔴 low — nail colour shifts a lot with light and polish.
✅ Suggested action: 🟡 consider showing a doctor — new or changing dark nail lines are worth a professional look.
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

**Research-validation note (TARGETS, not achieved):** Nail-image AI research targets detection of discoloration/dystrophy patterns; reported accuracy figures are TARGETS, not Chitti results. Pale/blue/dark patterns can reflect whole-body signals, so Chitti escalates rather than labels.

**Build status:** **SKELETON / COMING SOON.** Stub returns colour/pattern change with disclaimers; `501 coming_soon`.

---

## F6 — Swelling Scanner (Left / Right compare)

**Input:** Paired photos of the same body part on both sides (e.g. both ankles, both hands), same angle. Voice note: "right ankle puffy".

**Detectable patterns:** size asymmetry between left and right, visible puffiness, redness over the swollen area, shininess of stretched skin — quantified as relative L/R difference.

**Honest example output:**
```
🔎 What Chitti noticed: The right ankle looks visibly larger than the left in this paired photo.
📊 Confidence: ___%   (model not yet built/validated)
🎚️ How sure is this: 🟡 moderate — the two sides were photographed at slightly different angles.
✅ Suggested action: 🟡 consider a doctor; 🔴 seek care soon if there's pain, warmth, or it came on suddenly.
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

**Research-validation note (TARGETS, not achieved):** Edema/asymmetry-measurement research targets reliable left-vs-right volume estimation; reported figures are TARGETS. Chitti's strength is the **side-by-side L/R comparison**, not naming a cause.

**Build status:** **SKELETON / COMING SOON.** Stub returns L/R asymmetry description with disclaimers; `501 coming_soon`.

---

## F7 — Mole & Spot Tracker (long-term)

**Input:** Same mole/spot photographed periodically (with a size reference if possible). Chitti stores an encrypted baseline and re-aligns each new photo.

**Detectable patterns (ABCDE-style, noticed not diagnosed):** **A**symmetry, **B**order irregularity, **C**olour variation, **D**iameter change, **E**volution over time — all framed as "what changed since baseline".

**Honest example output:**
```
🔎 What Chitti noticed: This mole's border looks more uneven and it appears slightly larger than your baseline 3 months ago.
📊 Confidence: ___%   (model not yet built/validated)
🎚️ How sure is this: 🟡 moderate on the size change, 🔴 low on colour (lighting differed).
✅ Suggested action: 🟡 consider a dermatologist — changing moles are worth a professional check.
🌗 Skin-tone note: visual mole models are less accurate on darker skin tones (Fitzpatrick IV–VI).
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

**Research-validation note (TARGETS, not achieved):** Melanoma/skin-lesion AI research reports high benchmark accuracy (often quoted alongside the ~95% skin figure). **These are research TARGETS, not Chitti's measured accuracy, and are documented to drop on darker skin.** Chitti tracks **change vs. baseline** and always escalates uncertain changes.

**Build status:** **SKELETON / COMING SOON.** Stub stores baseline + returns change-since-baseline with disclaimers; `501 coming_soon`.

---

## F8 — Post-Surgery Monitoring

**Input:** Repeat photos of a surgical site / stitches over the recovery window. Voice note: "day 6, some yellow fluid".

**Detectable patterns:** redness spreading from the incision, gaping of the wound edges, discharge/colour, swelling, signs warranting urgent review — tracked day by day.

**Honest example output:**
```
🔎 What Chitti noticed: The incision edge looks redder and slightly more open than your day-4 photo.
📊 Confidence: ___%   (model not yet built/validated)
🎚️ How sure is this: 🟡 moderate — same site, but lighting changed.
✅ Suggested action: 🔴 seek care soon — spreading redness, opening, or discharge after surgery should be reviewed by your surgeon/clinic.
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

**Research-validation note (TARGETS, not achieved):** Surgical-site-infection monitoring research targets early redness/discharge detection; reported figures are TARGETS. Chitti supports **consistent daily comparison** for patients recovering at home, and escalates concerning change to the treating team.

**Build status:** **SKELETON / COMING SOON.** Stub returns daily change description with disclaimers; `501 coming_soon`.

---

## F9 — Burn Monitoring

**Input:** Photos of a burn over time. Voice note: "scald from hot oil, 2 days ago".

**Detectable patterns:** redness extent, blistering, colour of the burn bed, signs of infection (increasing redness/pus), healing vs. worsening trend. Chitti does **not** grade burn depth as a clinical degree.

**Honest example output:**
```
🔎 What Chitti noticed: New blistering and more redness around the burn compared with yesterday.
📊 Confidence: ___%   (model not yet built/validated)
🎚️ How sure is this: 🟡 moderate.
✅ Suggested action: 🔴 seek care soon for burns that blister, spread, or are on the face/hands/joints, or if a child.
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

**Research-validation note (TARGETS, not achieved):** Burn-depth AI research targets degree-classification on clinical datasets; reported figures are TARGETS. Chitti deliberately **does not grade depth** — it tracks change and escalates, because mis-grading a burn is dangerous.

**Build status:** **SKELETON / COMING SOON.** Stub returns redness/blister change with disclaimers; `501 coming_soon`.

---

## F10 — Child Health Growth Journal

**Input:** Periodic photos + parent voice notes about a child (rashes, growth, milestones-as-noticed). Optional height/weight typed/voiced entries. **Guardian-consent gated.**

**Detectable patterns:** rash appearance/spread, visible skin changes, swelling, and a **journal** of parent-logged observations over time (not a clinical growth-chart diagnosis).

**Honest example output:**
```
🔎 What Chitti noticed: The rash on your child's arm has spread since your photo two days ago.
📊 Confidence: ___%   (model not yet built/validated)
🎚️ How sure is this: 🔴 low — children's skin varies a lot and photos differ.
✅ Suggested action: 🟡 consider a paediatrician; 🔴 seek care soon if the child has fever, is unwell, or the rash spreads fast.
🌗 Skin-tone note: visual models are less accurate on darker skin tones (Fitzpatrick IV–VI).
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

**Research-validation note (TARGETS, not achieved):** Paediatric visual-health research figures are benchmark TARGETS. Children are a sensitive group; Chitti is **extra-conservative** — more "seek care", fewer reassurances — and never replaces routine paediatric checks/immunisation visits.

**Build status:** **SKELETON / COMING SOON.** Guardian-consent gate + journal stub; analysis `501 coming_soon`.

---

## F11 — Diabetic Foot Monitor

**Input:** Routine photos of the soles/toes/heels (especially for people with diabetes, who may have reduced foot sensation). Voice note: "can't feel a cut on left sole".

**Detectable patterns:** new cuts/ulcers, colour change, redness, swelling, callus/pressure spots, signs of an ulcer worsening — tracked routinely because diabetic users may not feel injuries.

**Honest example output:**
```
🔎 What Chitti noticed: A small open spot on the left sole that wasn't in last week's photo.
📊 Confidence: ___%   (model not yet built/validated)
🎚️ How sure is this: 🟡 moderate.
✅ Suggested action: 🔴 seek care soon — for someone with diabetes, any new foot wound should be checked promptly to prevent complications.
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

**Research-validation note (TARGETS, not achieved):** Diabetic-foot-ulcer detection research targets early-ulcer identification; reported figures are TARGETS. Because undetected foot wounds are high-risk for diabetic users, Chitti **biases toward escalation** here.

**Build status:** **SKELETON / COMING SOON.** Routine-reminder + change-detection stub; analysis `501 coming_soon`.

---

## F12 — Health Change Detection ("what's different from last month?") — THE DIFFERENTIATOR

**Input:** Chitti's own encrypted history of a user's earlier scans across F0–F11. The user asks (voice or tap): **"Chitti, what's different from last month?"**

**Detectable patterns (cross-feature, longitudinal):** new spots/moles that appeared, areas that grew or spread, colour shifts over weeks, swelling that increased, wounds healing vs. worsening — a **personalised before/after digest** across every body area the user has scanned.

**Honest example output:**
```
🔎 What Chitti noticed since last month:
   • A mole on your back looks slightly larger than your baseline (F7).
   • The right-ankle swelling has reduced — good trend (F6).
   • A new dark nail line appeared on the right thumb (F5).
📊 Confidence: ___%   (change-detection model not yet built/validated)
🎚️ How sure is this: 🟡 moderate on size trends, 🔴 low on colour (lighting varies month to month).
✅ Suggested action: 🟡 consider showing the mole and the nail change to a professional; 🟢 keep monitoring the ankle.
🌗 Skin-tone note: visual change-detection is less accurate on darker skin tones (Fitzpatrick IV–VI).
🩺 This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

**Why this is the differentiator:** single-photo apps guess at a label; Chitti owns the **encrypted longitudinal record** and answers the question people actually have — *"is this getting better or worse?"* — feeding the **Chitti Health File** timeline. No competitor does month-over-month, cross-body change for the Bharat user in their own language with four-user accessibility.

**Research-validation note (TARGETS, not achieved):** Longitudinal change-detection accuracy is even more sensitive to lighting/framing than single-shot classification; any future figure is a TARGET. Chitti enforces same-framing capture guidance to make comparisons fair, and is honest when a comparison is unreliable.

**Build status:** **SKELETON / COMING SOON** (flagship differentiator). Stub assembles a change-digest from stored encrypted history with disclaimers; analysis `501 coming_soon`.

---

## Cross-Feature Requirements (all of F0–F12)

- **Confirm gate** before camera open / capture / save / share / reminder (Golden Rule).
- **Per-response widget** (`data-chitti-response` + 🔊/🤖/👍/👎) on every output box.
- **Voice IN + Voice OUT + icons + plain language**; status is colour **+ icon + text**, never colour alone.
- **Multilingual** render via `chitti_lang.js` + `T`; no Hinglish; brand/technical terms stay English.
- **AES-256-GCM** at-rest encryption; user-owned; **"Chitti forget"** deletes all; anonymise before any aggregate; **DPDP 2023 + ABDM-aware**.
- **Cross-links:** feeds the **Chitti Health File** timeline; links to **MedUPI** (Jan Aushadhi medicine cost) and **Government** (PMJAY) where relevant.
- **Skin-tone bias disclosure** surfaced on every visual feature (F0, F4, F5, F7, F10, F12 especially).
- **Backend:** `/api/health-scanner/*` on `chitti-medupi-api`; analysis endpoints return **honest `501 coming_soon`** until vision models are built **and** Chitti-measured.

---

## Build-Status Summary

| Feature | Name | Build status |
|---|---|---|
| F0 | Skin Scanner | SKELETON / COMING SOON |
| F1 | Eye Scanner | SKELETON / COMING SOON |
| F2 | Wound Monitoring | SKELETON / COMING SOON |
| F3 | Tooth Scanner (high-value) | SKELETON / COMING SOON |
| F4 | Hair & Scalp | SKELETON / COMING SOON |
| F5 | Nail | SKELETON / COMING SOON |
| F6 | Swelling (L/R compare) | SKELETON / COMING SOON |
| F7 | Mole & Spot Tracker (long-term) | SKELETON / COMING SOON |
| F8 | Post-Surgery Monitoring | SKELETON / COMING SOON |
| F9 | Burn Monitoring | SKELETON / COMING SOON |
| F10 | Child Health Growth Journal | SKELETON / COMING SOON |
| F11 | Diabetic Foot Monitor | SKELETON / COMING SOON |
| F12 | Health Change Detection (differentiator) | SKELETON / COMING SOON |

**Certification scores:** `___%` (BLANK) — Chitti has not measured any accuracy yet. Nothing here is "live", "verified", or "GREEN".

---

*Chitti helps you notice — doctors help you heal.*
