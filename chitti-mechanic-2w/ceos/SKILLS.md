🎖️ World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.

# SKILLS — Chitti Mechanic 2 Wheeler

> The 12 CEOS skills. Each skill is engine-backed (deterministic), four-user
> accessible, and returns `{confidence, risks[], sources[]}`. DeepSeek narrates only.
> A skill that can't serve blind/deaf/mute/illiterate users is redesigned, not shipped.

## 1. Document Vault Keeper

Stores insurance · PUC · RC · service · tyre · battery · chain documents **on-device**.
OCR where a vision key exists; manual entry otherwise. "Chitti forget" wipes it.
Engine: `ChittiMech2W.vault.*`.

## 2. Reminder Sentinel (24/7/365)

Computes every due date deterministically (insurance 30/15/7/1d, PUC 30/7/1d, service
km-OR-months, RC, tyre 20k km / 3yr, battery 24mo, chain 500 km, tyre-pressure monthly)
and fires via voice/SMS/WhatsApp/push after Golden-Rule confirmation. Target: 100%
accuracy. Engine: `ChittiMech2W.reminders.*`.

## 3. Pre-Purchase Inspector & Buy Assistant

Buy Score /100, expected price, negotiation range, accident/odometer/flood flags as
**honest probability** (never "guaranteed clean"). Engine: `ChittiMech2W.buy.*`.

## 4. Insurance Analyst

Compares 8+ insurers with CSR, shows savings within ±5% (target). Engine:
`ChittiMech2W.insure.*`.

## 5. Service & Parts Scheduler

km/months scheduler + oil/parts recommendation from deterministic make/model tables.
Engine: `ChittiMech2W.service.*`.

## 6. Tyre & Battery Advisor

Best tyre by usage + price (≥90% expert agreement target); battery age + replacement at
24-month rule. Engine: `ChittiMech2W.tyre.*`, `ChittiMech2W.battery.*`.

## 7. Fuel & EV Economist

Petrol → EV total-cost-of-ownership and break-even ROI from fuel price, km/yr, EV cost.
Engine: `ChittiMech2W.fuel.evRoi`.

## 8. Vehicle Educator

8 voice + video learning modules in 26 languages. Engine:
`ChittiMech2W.education.modules`.

## 9. Diagnostics & OBD Doctor

Symptom → likely cause + confidence; OBD code → plain language (100% from the code
table). OBD optional (Indian 2-wheelers rarely have OBD2); symptom path primary.
Safety-critical → mechanic. Engine: `ChittiMech2W.diagnose.*`.

## 10. Scam Detector

Quote vs expected range; >30% above → alert (≥80% detection target). Engine:
`ChittiMech2W.scam.check`.

## 11. DIY-vs-Mechanic Triage Coach

🟢/🟡/🔴 classification; safety-critical always 🔴 mechanic; ≥70% DIY-success target on
🟢. Engine: `ChittiMech2W.triage.classify`.

## 12. Sell, Savings & Twin Keeper

Sell value + listing; Savings Tracker toward ₹10k+ goal; Vehicle Twin (full history,
resale-readiness score) + Ownership Scores (Buy/Maintenance/Safety/Resale). Engine:
`ChittiMech2W.sell.*`, `ChittiMech2W.savings.*`, `ChittiMech2W.twin.*`,
`ChittiMech2W.scores.*`.

---

## Cross-cutting skill rules

- **AI Coach layer** sits over diagnostics/triage: symptom → likely cause + confidence
  + DIY/mechanic verdict. Engine first; DeepSeek narrates only.
- **Golden Rule** gates every side-effect (channel send, listing share, export).
- **Honest stub** on 429/offline — engine plain-language strings, never an invented
  number or diagnosis.

---
> **World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.**
