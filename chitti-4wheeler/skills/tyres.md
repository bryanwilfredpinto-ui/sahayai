🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Tyres & Suspension Domain

Owns tyre wear, pressure, age (DOT date), alignment, balancing, and the suspension
chain (shocks/struts, bushes, ball joints, wheel bearings, CV joints) that shares
symptoms with brakes and tyres. A safety-relevant domain — a blowout or a failing
ball joint can be fatal. Aligns with COSDF F0/F8.

## Domain principles
- **Tread depth + age both matter.** India's legal minimum is 1.6 mm; replace by the
  ₹1-coin test. Tyres older than ~5–6 years (read the DOT week/year stamp) crack and
  fail even with tread left — a key used-car red flag (SOP-005, F8).
- **Pressure is the cheapest safety + mileage win.** Under-inflation → edge wear, blowout
  risk, poor mileage; over-inflation → centre wear, harsh ride. Check cold.
- **Wear pattern is a diagnosis.** Both edges = under-inflation · centre = over-inflation ·
  one edge = misalignment/camber · cupping/feathering = worn shocks or alignment.
- **A clunk over bumps is suspension, not tyre.** Knock = bush/ball-joint/link;
  clicking on turns = CV joint; humming that rises with speed = wheel bearing.

## Common failure patterns (Indian cars)
| Pattern | Typical on | Tell-tale | Cause band |
|---|---|---|---|
| Pulls left/right, uneven edge wear | Swift / Dzire / i20 | drifts, ragged shoulder | misalignment (pothole hit) |
| Steering shimmy at 60–80 km/h | Baleno / Verna | wheel vibrates at speed | imbalance / bent rim |
| Hum rising with speed, side-biased | Creta / Nexon | drone that changes on turns | wheel bearing |
| Clunk over speed-breakers | older Hyundai/Maruti | knock front-end | worn link/bush/ball joint |
| Click-click on full-lock turns | FWD hatchbacks | clicking while parking | CV joint |
| Bouncy/floaty + nose-dive on braking | high-km cars | poor rebound | worn shocks/struts |

## Symptom → cause mapping
- *Both shoulders worn* → chronic under-inflation. Likely/High. 🟢 inflate + monitor.
- *One edge worn, pulls* → misalignment. Likely/High. 🟠 wheel alignment.
- *Vibration at a speed band, smooths past it* → imbalance / bent rim. Likely/Medium. 🟠.
- *Speed-dependent hum that shifts on turns* → wheel bearing. Likely/Medium. 🟠.
- *Clunk on bumps* → suspension bush/joint. Possible/Medium. 🟠.
- *Sidewall bulge / crack / DOT >6 yr* → replace. Likely/High. 🔴 blowout risk.

## Outputs this skill must emit
- **Confidence band** — `Likely/Possible × High/Medium/Low`.
- **DIY-safety tier** — 🟢 (check pressure, ₹1-coin tread test, read DOT date, spare swap)
  / 🟡 (visual wear/sidewall inspection) / 🟠 (alignment, balancing, bearing, bush,
  ball joint — mechanic) / 🔴 (ball-joint/control-arm failure = do-not-drive).
- **Can-I-drive** — sidewall bulge, exposed cords, failing ball joint → Safety 🔴.
- **Cost band** — alignment ₹400–900 · balancing ₹300–600 · bearing ₹2,000–5,000 ·
  tyre (hatch) ₹3,500–6,000 each.

## Swarm agents fed
Feeds the supreme [Safety Agent](../swarm/safety-agent.md) (blowout / ball-joint = 🔴);
overlaps with [brakes.md](brakes.md) on "noise when braking vs turning" — Symptom Agent
disambiguates by *when* it happens. [DIY](../swarm/diy-agent.md) handles pressure/spare;
[Cost](../swarm/cost-agent.md) + [Trust](../swarm/trust-agent.md) guard against the classic
"all four tyres + full suspension" overcharge.

## Roadmap (honest stubs — COSDF §3)
- AI tread-depth + DOT-date read from a tyre photo = roadmap (vision). Deterministic
  ₹1-coin guide, DOT-decoder helper, and wear-pattern picker are LIVE.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
