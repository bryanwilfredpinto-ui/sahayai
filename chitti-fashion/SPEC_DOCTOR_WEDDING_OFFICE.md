🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# TECH SPEC — Clothing Doctor · Wedding Planner · Office Week Planner (CFOS v2.0, deterministic)

> No API. No LLM. Pure rule logic on the existing engine + on-device wardrobe.
> Governed by [CONSTITUTION.md](CONSTITUTION.md) (Founder Rule) and [QUALITY.md](QUALITY.md).

## 0. Foundations to reuse (existing 🟢 modules)

**Engine** (`chitti_fashion_engine.js`, UMD, browser+Node):
```
classifyOccasion(items) -> {occasion, band, confidence}
colorHarmony(items)     -> {score, type, why}        // uses item.hex if present
seasonalSuitability(items, season) -> {fit, score, why}
analyseColour(hex, name)-> {family, undertone, value, chroma, hsl}
paletteFor(season) / deriveSeason(items)
fabricSeason(item) / patternOf(item) / patternRule(items)
fitNote(items, profile) / judge(items, ctx) / confidence(checks)
buildOutfits(items, {occasion, max, liked}) -> {count, outfits:[{items,score,harmony,occasion,occFit}], possible}
wardrobeROI(items, candidate) / recommend(items, ctx)
```

**Wardrobe item schema** (IndexedDB `chitti_fashion_almari` / store `items`):
```
{ id, photo, category, colour, hex, fabric, pattern, cost, wears,
  occasions[], last_worn, wearer, added_at }
```
New fields this spec adds: `condition`, `damage[]` (Doctor).

**Page helpers:** `faAllItems()` (active wearer), `faAllItemsRaw()` (all wearers),
`faPutItem(item)`, `faEngine()`, `faDyn()`, `faRenderOutfitCard(rec)`, `faWearers()`,
`faCurrentWearer()`, `faMoreT(key,vars)` (9-lang dynamic), `faSpeak()`, `faFeedback()`.

**i18n:** static labels → `data-vai-i18n` keys in `strings.js` + bundle; dynamic text →
`FashionDyn`/`FashionDyn.more` (9 langs). **Gates:** each card carries `data-chitti-response`
+ the feedback-widget bar; accessibility via the a11y substrate.

---

## 1. CLOTHING DOCTOR — repair-not-buy (Founder Rule step 4)

### 1.1 Data structures

Item gains:
```
condition: 'new' | 'good' | 'worn' | 'needs_repair'   // default 'good'
damage: [ 'button_missing', 'hem_loose', ... ]         // damage codes, empty if none
```

Repair knowledge (engine constant `REPAIR_RULES`, language-neutral codes):
```
REPAIR_RULES = {
  tear_small:   { tools:['needle','thread','scissors'], stitch:'running/backstitch', difficulty:'easy',   minutes:15, diy:true,  tailor:false },
  tear_large:   { tools:['needle','thread','patch','iron'], stitch:'patch+backstitch', difficulty:'medium', minutes:30, diy:true,  tailor:true  },
  button_missing:{ tools:['needle','thread','spare button'], stitch:'shank-button', difficulty:'easy',   minutes:10, diy:true,  tailor:false },
  hem_loose:    { tools:['needle','thread','pins','iron'], stitch:'blind-hem',     difficulty:'easy',   minutes:20, diy:true,  tailor:false },
  seam_open:    { tools:['needle','thread'],              stitch:'backstitch',     difficulty:'easy',   minutes:15, diy:true,  tailor:false },
  zip_broken:   { tools:['new zip','seam-ripper','needle'], stitch:'replace',      difficulty:'hard',   minutes:60, diy:false, tailor:true  },
  hole_knit:    { tools:['darning needle','yarn'],        stitch:'darning',        difficulty:'medium', minutes:30, diy:true,  tailor:false },
  stain_oil:    { tools:['dish soap','warm water'],       method:'blot+soap',      difficulty:'easy',   minutes:10, diy:true,  tailor:false },
  stain_ink:    { tools:['rubbing alcohol','cotton'],     method:'dab',            difficulty:'medium', minutes:15, diy:true,  tailor:false },
  too_tight:    { tools:['tailor'],                       method:'let-out seam',   difficulty:'hard',   minutes:0,  diy:false, tailor:true  },
  too_loose:    { tools:['tailor'],                       method:'take-in seam',   difficulty:'hard',   minutes:0,  diy:false, tailor:true  },
  fade:         { tools:['fabric dye'],                   method:'redye',          difficulty:'medium', minutes:60, diy:true,  tailor:false }
}
```

### 1.2 Rule logic — `engine.diagnoseRepair(damageCode)`

```
function diagnoseRepair(code) {
  var r = REPAIR_RULES[code]; if (!r) return null;
  return {
    code: code,
    tools: r.tools, steps: STEP_SEQUENCES[code],   // ordered step codes, localized in page
    stitch: r.stitch || r.method,
    difficulty: r.difficulty,           // easy | medium | hard
    minutes: r.minutes,
    diy: r.diy,                         // can the user do it?
    tailor: r.tailor,                  // recommend a tailor (deep-link)
    ladderStep: 4                       // Founder Rule: repair, before borrow/rent/buy
  };
}
```
`STEP_SEQUENCES[code]` = ordered array of step codes (e.g. `['thread_needle','knot','stitch_back','knot_off']`); the page localizes each step + speaks it.

### 1.3 User flow

`More tab → 🩺 Clothing Doctor card`:
1. Pick item (dropdown of wardrobe) **or** "describe" (skip item).
2. Pick damage via **icon chips** (🔘 button · ✂️ tear · 〰️ hem · 🤐 zip · 🟤 stain · …) — illiterate-safe.
3. `diagnoseRepair(code)` → render **repair plan card**: difficulty badge · time · tools list · numbered steps (each with 🔊) · DIY-vs-tailor verdict · if `tailor` → `🔎 Find a tailor near me` (Maps search deep-link, reuses the shop-link pattern).
4. Buttons: **"Mark needs repair"** (sets item.condition='needs_repair', adds code to item.damage, `faPutItem`) · **"Mark repaired"** (condition='good', clears damage).

### 1.4 Integration with 🟢 modules

- **buildOutfits / recommend:** filter out `condition==='needs_repair'` items (don't style a torn shirt) — additive guard in `byCat` population. Honest note if it leaves too few.
- **Wardrobe Audit:** new tier "🩺 N items need repair — fix before you buy" (Founder Rule, above the shop link).
- **Sustainability:** repair is ladder step 4; the reuse-ladder string already lists it. Repairing instead of buying counts toward shopping-reduction %.
- **Family Mode:** condition/damage are per-item, so per-wearer.

### 1.5 i18n / a11y / tests

- Damage chips + step text: `FashionDyn.repair` group (9 langs) + step codes; tool names short native, garment-domain English allowlisted (§6).
- Every step has 🔊; whole flow icon-driven (illiterate); difficulty shown as badge **+ word** (deaf, no colour-only).
- Unit: `diagnoseRepair` returns correct tools/difficulty/diy per code; buildOutfits excludes needs_repair; audit counts. QA: tab+card+chips+plan render; cert: data-chitti-response + widget.

---

## 2. WEDDING PLANNER — coordinated, wardrobe-first

### 2.1 Data structures

```
WeddingInput = {
  function: 'mehendi'|'sangeet'|'wedding'|'reception',
  role: 'own'|'sibling'|'friend'|'colleague',     // closeness -> formality ceiling
  culture: 'north'|'south'|'bengali'|'punjabi'|'rajasthani'|'maharashtrian'|'other',
  season: 'summer'|'winter'|'all',
  budget: 'low'|'mid'|'flex',
  members: [ { wearer_id, relation, gender, ageBand } ]   // from Family wearers
}
WeddingPlan = {
  familyPalette: { anchor: 'maroon'|'navy'|..., undertone: 'warm'|'cool', note },
  perMember: [ { wearer_id, outfit:{items[],...}, role:'anchor'|'accent', gaps:[], shopLinks:[] } ],
  coordinationScore: 0..100
}
```

### 2.2 Rule logic

**Function → target band** (engine bands):
```
FUNCTION_BAND = { mehendi:'festive', sangeet:'festive', wedding:'wedding', reception:'formal' }
```
adjusted **down one** if `role!=='own'` (don't outshine the couple).

**Family-palette coordination (the deterministic core):**
```
1. Collect festive/wedding items across all members' wardrobes (faAllItemsRaw filtered by wearer).
2. analyseColour(hex) each -> tally undertones (warm/cool) and families.
3. familyPalette.undertone = majority undertone (ties -> 'warm' for festive default).
4. anchor = most common festive family in that undertone (e.g. maroon for warm).
5. Assign roles: ONE member = 'anchor' (wears the boldest festive piece),
   others = 'accent' (coordinate within the same undertone, vary VALUE so they
   don't all wear identical brights). This is colorHarmony's value-contrast rule
   applied across people, not within one outfit.
```

**Per member:**
```
recommend(memberItems, { occasion: targetBand, season, age_band, max:1,
                          liked: memberLiked })
-> if outfit found: tag role, run judge (wedding_white / funeral_bright), attach palette note.
-> if gap (no festive wear): Founder Rule ladder — borrow (from a family member whose
   wardrobe HAS a spare festive piece) -> rent -> buy (shop links, "last option", budget-tiered).
```

`coordinationScore` = % of members whose outfit undertone matches `familyPalette.undertone`
and whose value differs from the anchor (so the group reads coordinated, not clashing or uniform).

### 2.3 User flow

`🎉 Occasion tab → 💍 Wedding Planner` (or its own card):
1. Pick **function** chips · **role** · **culture** · **season** · **budget**.
2. Member selector = the Family wearers (multi-select).
3. "Plan the family" → **familyPalette banner** ("Theme: warm — maroon + gold") + one
   **card per member**: their outfit from their wardrobe (faRenderOutfitCard) + role label
   (anchor/accent) + palette note + gaps with borrow/rent/buy (shop links last).

### 2.4 Integration

- **Family Mode** wearers + per-wearer wardrobe (`faAllItemsRaw().filter(wearer)`).
- **recommend / buildOutfits / judge** per member; **Cultural agent** + judge flags.
- **Founder Rule:** borrow-within-family is checked *before* rent/buy — a deterministic
  cross-wearer lookup ("Maa's wardrobe has a spare gold dupatta").
- **Budget tiers** + **reuse ladder** for genuine gaps.

### 2.5 i18n / a11y / tests

- Function/role/culture chips localized; palette banner via `FashionDyn`.
- Per-member cards spoken (blind) + symbol+word role labels (deaf).
- Unit: FUNCTION_BAND mapping, role-down-shift, familyPalette derivation, borrow-before-buy.
  QA: chips + plan render per member; cert gates.

---

## 3. OFFICE WEEK PLANNER — 5 days, no repeats

### 3.1 Data structures

```
WeekInput = {
  city: string,
  days: [ { day:'Mon'..'Fri', dressCode:'casual'|'smart'|'formal', weather:'hot'|'cold'|'mod' } ]
}
WeekPlan = {
  days: [ { day, outfit:{items[],score,...}, reused:false, note } ],
  variety: 0..100,        // distinct items used / total slots
  honest: ''              // e.g. "wardrobe small — varied the pairing instead"
}
```

### 3.2 Rule logic

```
DRESSCODE_BAND = { casual:'casual', smart:'business-casual', formal:'formal' }
WEATHER_SEASON = { hot:'summer', cold:'winter', mod:'all' }

planWeek(items, days):
  used = Set()                          // item ids used this week
  for each day in days:
    target = DRESSCODE_BAND[day.dressCode]
    pool = buildOutfits(officeItems, { occasion: target, max: 30 }).outfits
    // filter by weather via fabricSeason, then rank by:
    //   score - repeatPenalty(outfit, used)   (penalty per already-used item)
    best = pool
      .filter(o => weatherOK(o.items, WEATHER_SEASON[day.weather]))
      .map(o => ({o, adj: o.score - 25*countUsed(o.items, used)}))
      .sort(by adj desc)[0]
    if !best: best = highest-score outfit (allow reuse), reused=true,
              note = "small wardrobe — same pieces, fresh pairing"
    mark best.items into used
    push { day, outfit:best.o, reused, note }
  variety = distinct(used) / (slots)        // honest signal
  if avg reuse high -> honest = "Add 1-2 bottoms to unlock a no-repeat week" (Wardrobe ROI hook)
```

`repeatPenalty` makes the greedy planner spread the wardrobe across the week; when the
wardrobe is too small it **degrades honestly** (varies pairing, says so) instead of pretending.

### 3.3 User flow

`💼 (Occasion/More) → 📅 Office Week Planner`:
1. Five day-rows prefilled (Mon–Fri) with **dress-code** + **weather** selects (defaults from city/season).
2. "Plan my week" → **5 outfit cards** (Mon→Fri), each `faRenderOutfitCard` + day label +
   "reused" honesty note where applicable + a closing **variety %** + a Wardrobe-ROI tip if small.

### 3.4 Integration

- **buildOutfits** (occasion + max) · **seasonalSuitability/fabricSeason** (per-day weather)
  · **confidence** · **classifyOccasion** (band match).
- **Wardrobe ROI**: if reuse is forced, surface the exact gap item that would unlock a
  no-repeat week (reuses `wardrobeROI`).
- **Founder Rule**: the planner's whole point is max combinations from existing clothes;
  shopping only appears as the ROI "if you ever buy" tip.

### 3.5 i18n / a11y / tests

- Day labels + dress-code/weather selects localized; outfit text via existing localized
  `faRenderOutfitCard`.
- Each day card spoken (blind); reuse shown as word+icon (deaf).
- Unit: DRESSCODE_BAND/WEATHER mapping, no-repeat greedy spreads items, honest-degrade when
  wardrobe < slots. QA: rows + 5 cards render; cert gates.

---

## 4. File / build plan (deterministic, testable)

| Module | File | New API |
|---|---|---|
| Repair rules + diagnose | `chitti_fashion_engine.js` (engine v2.1) | `diagnoseRepair`, `REPAIR_RULES`, condition guard in `buildOutfits` |
| Planners (pure logic) | `chitti_fashion_engine.js` | `planWedding(input, wardrobesByWearer)`, `planWeek(items, days)` |
| UI + i18n | `chitti_fashion.html` + `chitti_fashion_dyn.js` + `strings.js` | 3 cards, chips, `FashionDyn.repair/wedding/week` (9 langs) |
| Tests | `tools/fashion_engine_test.mjs` | diagnoseRepair · planWedding coordination · planWeek no-repeat |
| QA | `tools/fashion_qa.mjs` | 3 new buttons + tabs render |

**Gate contract (every card):** `data-chitti-response` + feedback-widget bar · 9-language
native · icon-first (illiterate) · 🔊 per result (blind) · word+symbol status (deaf) ·
48px taps · gold/QA/cert must stay green (additive, like all v2.0 craft).

**Effort:** engine logic ~1 batch; UI+i18n ~1 batch each; tests ~1 batch. All deterministic,
no API. Garment-VISION (auto-detecting the damage from a photo) is the only LLM-dependent
extension — out of scope here; the user picks the damage from icon chips instead.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
