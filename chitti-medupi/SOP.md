🎖️ **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti MedUPI — Standard Operating Procedure

## Objective
Find the cheapest same-composition generic for any prescribed medicine, with Jan Aushadhi + NPPA-ceiling cross-check and a family medicine wallet.

## Primary User
Family caregiver buying medicines on a fixed budget — Tier-2/3, elderly parents, vernacular.

## Success Metric
(a) ₹ saved per cart vs. branded equivalent · (b) same-composition match rate · (c) expiry-reminder follow-through rate.

## Quality Standard
- **STRICT same-composition** (molecule + strength + form) — never approximate, never inferred from brand name
- NPPA ceiling enforced as a hard cap, not a hint
- HIGH-risk Swarm gate — human review before any skill update lands
- Camera-intelligence contract on every strip scan ([SAHAYAI_MASTER.md §2b](../SAHAYAI_MASTER.md))
- Per-response widget on every response box (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️)
- Sticky amber medical disclaimer + Gold Standard modal on every page

## Operating Rules
1. **Risk class BEFORE alternatives.** Every response carries `risk: {class, symbol, label_en, label_hi}`. Frontend gates UI: red banner for HIGH, amber for MEDIUM, green for LOW.
2. **STRICT matcher only.** `services/medupi_alternatives.py` returns same-molecule + same-strength + same-dosage-form matches only. No therapeutic substitutions. EVER.
3. **Disclaimer always visible.** Sticky amber banner on every page. Hindi version auto-rendered when `_chittiLang === 'hi'`.
4. **Camera capture per scan.** what / where / when / result / user / satisfaction — anonymised before aggregation; "Chitti forget" deletes all (tombstone preserved).
5. **No pharmacy site scraping.** Brave Search snippets only. Never visit 1mg/PharmEasy/NetMeds/Apollo URLs programmatically.
6. **Golden Rule on every action.** Refill reminders, price alerts, family-wallet entries — all confirm before fire.

## Error Handling
- DeepSeek vision unavailable → manual entry fallback with honest *"vision service unavailable, please type"*
- Brave Search rate-limited → fall back to local DB; never silently return stale prices
- Jan Aushadhi store geo lookup fails → by-state fallback; never claim "no Jan Aushadhi" when only nearest-store query failed
- Risk classification confidence low → ALWAYS surface as HIGH (precautionary), never silently downgraded

## Escalation to CTO
- Same-composition match rate drops below 95% on judge eval
- HIGH-risk pattern surfaces in Swarm review (e.g. wrong dosage form match)
- Jan Aushadhi catalog refresh fails > 7 days
- NPPA ceiling violation detected in any response
- Camera capture write-rate drops (could mean Turso sync broken)

## Stale Data Rule
Jan Aushadhi price catalog: weekly refresh. NPPA NLEM ceiling list: monthly. Brand-to-molecule mapping: monthly diff against drug regulator updates. Medicine composition itself is treated as immutable (matched on master DB, never inferred).

## Evolution Owner
[chitti-medupi/skills/FEATURES.md](skills/FEATURES.md) + Swarm Intelligence (HIGH-risk → Sire approves before push to `skills/*.md`).

---

> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
