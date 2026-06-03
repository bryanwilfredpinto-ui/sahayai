🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SOP — Preventive Maintenance (predict failures before they happen)

**Trigger:** scheduled ([Vehicle Twin](../memory/vehicle_twin.md) cron) or *"meri bike
ka kya dhyaan rakhna chahiye?"*

## Steps
1. **Read the twin** — model, odo, km/day, battery/tyre/brake/chain age, last service,
   local climate ([../memory/vehicle_twin.md](../memory/vehicle_twin.md)).
2. **Project the next failures** (band + confidence, never a hard date):
   | Component | Interval (from MECHANIC_KNOWLEDGE) | Predicted prompt |
   |---|---|---|
   | Engine oil | 3 000–5 000 km (commuter) | "oil change ~400 km mein due" |
   | Air filter | 5 000–10 000 km (dusty sooner) | "dhool ka mausam — abhi check" |
   | Chain lube | every 500 km (300 monsoon) | "barsaat — har 300 km lube" |
   | Spark plug | 10 000–20 000 km | "plug ~1 500 km mein" |
   | Battery | 2–3 yr (Indian heat) | "battery 3.8 yr — High risk, 3–5 months" |
   | Brakes | pads 10–20k / shoes 20–30k | "brake check due — safety, jald" |
   | Tyres | 15 000–25 000 km | "tyre life end ke paas" |
3. **Weather-aware adjust** — monsoon → chain interval; dust season → air filter
   ([weather feature W13](../skills/FEATURES.md)).
4. **Prioritise safety items** — brakes/tyres flagged first, even if not the soonest.
5. **DIY vs mechanic + cost** — *"chain lube ghar pe, ₹0; brake check mechanic, ₹100."*
6. **Reminder set** — voice + Notification API; spoken at 06:00 IST.

## Hard rules
- Predictions are **Likely/Possible + confidence band** — never "battery WILL die on
  date X" ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).
- Service intervals are **make/model/year-specific** — never generic (FEATURES Q1).
- Surface an active **recall** prominently if the bike model has one (FEATURES Q3).

## Accessibility
Reminders spoken (blind/illiterate) + visual card + symbol + ISL (deaf) + tap-to-snooze
(mute). Picture menu of "what's due."

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
