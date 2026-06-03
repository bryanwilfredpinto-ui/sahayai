🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SOP — Preventive Maintenance (predict failures before they happen)

**Trigger:** scheduled ([Vehicle Twin](../memory/vehicle_twin.md) cron / `GET
/api/4w/maintenance/next`) or *"meri gaadi ka kya dhyaan rakhna chahiye?"*

## Steps
1. **Read the twin + profile** — brand, model, fuel, odo, km/day, battery/tyre/brake
   age, last service, local climate ([../memory/vehicle_twin.md](../memory/vehicle_twin.md)).
   The brand schedule comes from `_BRAND_SCHEDULE` in [../backend/routes/wheels.py](../backend/routes/wheels.py).
2. **Project the next failures** (band + confidence, never a hard date):
   | Component | Interval (from MECHANIC_KNOWLEDGE) | Predicted prompt |
   |---|---|---|
   | Engine oil | 7 500–15 000 km (fuel/oil-grade) | "oil change ~600 km mein due" |
   | Air filter | 20 000–30 000 km (dusty sooner) | "dhool ka mausam — abhi check" |
   | AC cabin filter | 15 000–20 000 km | "AC cabin filter due — garmi se pehle" |
   | Coolant flush | 2–3 yr / 40 000 km | "coolant flush due — overheat se bacho" |
   | Spark plugs | 40 000–60 000 km | "plug set ~3 000 km mein" |
   | Brake pads | 30 000–50 000 km | "brake check due — safety, jald" |
   | Battery (12V) | 3–4 yr (Indian heat) | "battery 3.8 yr — High risk, 3–5 months" |
   | DPF (diesel) | short-trip ratio | "chhoti trips zyada — mahine mein ek lambi drive" |
   | Tyres | 40 000–60 000 km | "tyre life end ke paas" |
3. **Weather-aware adjust** — pre-monsoon → wipers/brakes/tyre-tread; pre-summer → AC
   gas/coolant; pre-winter → battery/coolant ([weather feature C13](../skills/FEATURES.md)).
4. **Prioritise safety items** — brakes/tyres flagged first, even if not the soonest.
5. **DIY vs mechanic + cost** — *"AC cabin filter ghar pe ₹350; coolant flush mechanic ₹1 500–3 000."*
6. **Reminder set** — voice + Notification API; spoken at 06:00 IST.

## Hard rules
- Predictions are **Likely/Possible + confidence band** — never "battery WILL die on
  date X" ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).
- Service intervals are **make/model/year/fuel-specific** — never generic (FEATURES Q1/C1).
- Surface an active **recall** prominently if the car model has one (FEATURES Q3).

## Accessibility
Reminders spoken (blind/illiterate) + visual card + symbol + ISL (deaf) + tap-to-snooze
(mute). Picture menu of "what's due." `fw_maintenance` widget.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
