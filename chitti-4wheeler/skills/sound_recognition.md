🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Sound Recognition Domain

Diagnosis by ear — the hardest, most-hedged domain. Takes an unusual sound (described
in plain words today; recorded-clip auto-classification = roadmap) and returns a
**ranked** set of candidates with **honest, usually-Medium/Low confidence**. COSDF L3
sets sound recognition **>85%** as a *target* pending the audio model + dataset (MECH-4).
The discipline here is to rank and hedge, never to bluff. Sister of
[sound-doctor.md](sound-doctor.md) (the live surface). Aligns with COSDF F1/F12.

## Domain principles
- **When + where it happens narrows it more than the noise itself** — idle vs accel vs
  braking vs over-a-bump vs full-lock turn vs cold-start. Always ask this first.
- **Ambiguous metallic noise → Low confidence + recommend inspection.** Never a confident
  "it's your wheel bearing" — overconfidence on an ambiguous sound fails the sound eval
  ([../evals/sound_eval.md](../evals/sound_eval.md)).
- **A safety sound jumps the queue** — a brake grind or suspension knock escalates to
  [safety.md](safety.md) before any cost/DIY talk.
- **Deaf-user reality** — never tell a deaf driver to "record the sound." Offer a
  **visual symptom picker** + photo/video of the part ([accessibility.md](accessibility.md)).

## Sound → likely-component map (Indian cars)
| Sound | When | Top candidates (ranked) | Domain / severity |
|---|---|---|---|
| Chrr-chrr / squeal | cold start, idle | drive/alternator belt → tensioner → pulley | [engine.md](engine.md)/[electrical.md](electrical.md) 🟠 |
| Tick-tick, grows with revs | accel | tappet/valve clearance → exhaust-manifold leak | [engine](engine.md)/[exhaust](exhaust.md) 🟡–🟠 |
| Deep knock | accel/load | pre-ignition/low octane → bearing (serious) | [engine.md](engine.md) 🟠–🔴 |
| Grind / scrape | braking | pads gone, metal-on-metal | [brakes.md](brakes.md) 🔴 STOP |
| Hum rising with speed | cruising | wheel bearing (shifts on turns) | [tyres.md](tyres.md) 🟠 |
| Clunk over bumps | speed-breakers | suspension bush / link / ball joint | [tyres.md](tyres.md) 🟠 |
| Click-click on turns | full lock | CV joint | [tyres.md](tyres.md) 🟠 |
| Whine | accel | power-steering pump / CVT / diff | mixed 🟡–🟠 |
| Hiss | engine off/on | vacuum / coolant / AC leak | [cooling](cooling.md)/[exhaust](exhaust.md) 🟡 |

## Symptom → cause reasoning
- *Squeal on cold start* → belt (likely) > tensioner > pulley. Likely/Medium. 🟠.
- *Grind only when braking* → pads gone. Likely/High. 🔴 STOP (safety).
- *Hum that changes pitch on a turn* → wheel bearing on the loaded side. Likely/Medium.
- *Knock under load* → fuel/timing if mild; bearing if deep+oil-pressure light. Possible.
- *Anything genuinely ambiguous* → top-3 ranked, **Low confidence, get it heard live.**

## Outputs this skill must emit
- **Top-3 ranked candidates** — each with what it would mean and which domain owns it.
- **Confidence band** — usually `Possible × Medium/Low`; honest "awaaz se pakka nahi" /
  "can't be sure by sound — a mechanic should listen" when ambiguous.
- **Can-I-drive** — brake grind / suspension knock escalates to Safety 🔴/🟠.
- **DIY-safety tier + cost band** per candidate.

## Swarm agents fed
Feeds whichever fault agent the sound implicates — [Engine](../swarm/engine-agent.md)
(knock/belt/tappet), [Electrical](../swarm/electrical-agent.md) (alternator bearing),
or the drive/suspension path. Brake/suspension sounds escalate to the supreme
[Safety Agent](../swarm/safety-agent.md). [Trust](../swarm/trust-agent.md) **forces Low
confidence** on ambiguous sounds — its single most important job here.

## Roadmap (honest stubs — COSDF §3)
- Raw-audio ML classification of a 10-second clip (knock/tick/grind/whine/rattle/hiss +
  severity) = roadmap (audio model + 2-wheeler/4-wheeler sound dataset, funding-gated §8).
  Vibration-from-accelerometer misfire/imbalance = roadmap. The **deterministic
  sound-picker + ranked candidate map is LIVE** today and never fabricates a clip result.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
