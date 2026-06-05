🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SOP-002 — Brake Noise (when does it happen → which part)

**COSDF L7 SOP-002.** Trigger: *"brake dabaane par awaaz aati hai"* / *"chuun-chuun /
gharr-gharr"* / a recorded brake sound → Sound Doctor + Safety Agent. Brakes are the
single highest-stakes system in the car: **safety accuracy must be 100%**
([../evals/safety_eval.md](../evals/safety_eval.md)). When in doubt, the verdict is
*do not drive* — never the optimistic guess.

> COSDF L7 SOP-002 keys the diagnosis off **WHEN** the noise happens: braking-only =
> pads/rotor · constant (even off-brake) = wheel bearing / debris · only-while-turning =
> suspension / CV. **Metal-on-metal grinding → STOP DRIVING.**

## Step 0 — Safety gate first (spoken first, always)
"Brake dabaane par pedal **neeche tak jaata hai / soft** lagta hai? Gaadi ek taraf
**kheechti** hai? Pedal **vibrate / kampan** karta hai?" — any *yes* is a 🔴 red line →
**DO NOT DRIVE**, go straight to the Safety verdict below. Noise without these is still
diagnosed, but the Safety Agent owns the final can-I-drive call.

## Step 1 — WHEN does the noise happen? (the splitting question)
| When | Likely part | Severity |
|---|---|---|
| **Only while braking** — high squeal/*chuun* | brake pads worn to the wear-indicator | 🟡 service soon |
| **Only while braking** — grinding/*gharr* metal-on-metal | pads gone, **metal on rotor** | 🔴 **STOP DRIVING** |
| **Only while braking** — pulsing/judder through pedal | warped rotor / disc run-out | 🟠 unsafe at speed; service |
| **Constant** — present even off the brake, changes with speed | **wheel bearing** OR a stone/debris in the dust shield | 🟠 (bearing) |
| **Constant** — rhythmic, ticks with wheel rotation | stone in shield / loose backing plate | 🟢/🟡 inspect |
| **Only while turning** — clicking/knocking on lock | CV joint (FWD) / suspension | 🟠 service |
| **First few stops in the morning**, then clears | surface rust on rotors overnight | 🟢 normal |
| Squeal **after a car wash / rain**, clears in a few stops | wet pads | 🟢 normal |

## Step 2 — Visual confirm (free, DIY-safe to look)
- **Pad thickness** — through the wheel spokes: < ~3 mm friction material = replace; a
  metal tab touching the rotor = the wear indicator (designed squeal).
- **Rotor face** — a deep lip at the edge, blue heat marks, or visible scoring = rotor
  service. Even scoring from grinding = both pads + rotor.
- **Wheel bearing test** (jacked on stands — see hard rules): spin the wheel by hand —
  rumble/roughness = bearing; rock the wheel at 12-and-6 — play = bearing/suspension.

## Step 3 — Severity → verdict
| Finding | Verdict | DIY tier |
|---|---|---|
| Squeal, pad ≥ wear-indicator, no safety symptom | 🟡 plan a pad change | DIY 🟡 if competent + proper tools |
| **Grinding metal-on-metal** | 🔴 **DO NOT DRIVE** — pads + likely rotor now | 🔴 mechanic — driving destroys the rotor + risks brake loss |
| Soft pedal / pedal to floor / fluid low | 🔴 **DO NOT DRIVE** — hydraulic/brake-fluid fault | 🔴 mechanic — never DIY brake hydraulics |
| Pulsing/judder | 🟠 unsafe at highway speed | 🟠 mechanic (rotor machine/replace) |
| Bearing rumble | 🟠 worsens — replace soon | 🟠 mechanic |
| Stone in shield / wet-pad / morning rust | 🟢 monitor | 🟢 self-clear |

## Step 4 — Cost band + scam check
Pad set + labour bands by segment → [./scam-quote-check.md](./scam-quote-check.md) /
[../skills/scam-shield.md](../skills/scam-shield.md). Common overcharge: "rotor bhi
badalna padega" when the rotor is within spec and only needs skimming — Chitti asks for
the **measured rotor thickness** before agreeing to a rotor replacement.

## Hard rules (LOCKED — Safety is supreme)
- **Metal-on-metal grinding = STOP DRIVING.** No "thoda aur chala lo." Brake loss kills.
- **Soft / sinking pedal or low fluid = 🔴, never DIY** — brake hydraulics, master
  cylinder, ABS are Professional-only ([../guardrails/diy-safety.md](../guardrails/diy-safety.md),
  [../guardrails/safety-rules.md](../guardrails/safety-rules.md)).
- DIY pad change is 🟡 **only** for a competent user with stands (never jack alone),
  torqued to spec, and a brake-bed-in afterward — otherwise mechanic.
- The DIY Agent may **never** override a Safety 🔴 ([../swarm/safety-agent.md](../swarm/safety-agent.md)).
- Confidence band on every read; never claim a rotor is dead without a measurement
  ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).

## Accessibility
Sound Doctor shows the brake noise as a **waveform + label** (deaf-safe, never
audio-only); the WHEN question is answered by voice or tap (mute). Safety verdict is
**spoken first** (blind) and shown as symbol + word + red flash (deaf). `fw_brake_noise`
widget carries 🔊/🤖/👍/👎.

## Cross-links
[../skills/brakes.md](../skills/brakes.md) · [../skills/sound-doctor.md](../skills/sound-doctor.md) ·
[../swarm/safety-agent.md](../swarm/safety-agent.md) ·
[./dashboard-warning-light.md](./dashboard-warning-light.md) (ABS/brake lamp) ·
[./diy-repair-coach.md](./diy-repair-coach.md).

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
