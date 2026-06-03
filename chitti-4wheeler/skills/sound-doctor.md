🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL — Sound Doctor (diagnose by ear, honestly)

Takes an unusual sound — described or (C12) recorded — and returns a **ranked** set of
candidate faults with an **honest confidence**. Diagnosing by ear is hard; this skill's
whole discipline is to rank and hedge, never to bluff.

## Inputs
- Sound described in plain words (*"chrr-chrr belt jaisi, start pe"*) **or** a 10-second
  recorded clip (C12 — honest stub for raw-audio classification today)
- When it happens (idle / acceleration / braking / over a bump / cold start) + car profile

## Swarm agents invoked
[Symptom](../swarm/symptom-agent.md) (when/where) → [Engine](../swarm/engine-agent.md)
(knock/belt) + [Electrical](../swarm/electrical-agent.md) (alternator bearing) + drive
(wheel bearing) → [Safety](../swarm/safety-agent.md) (brake grind / suspension failure =
hazard) → [Trust](../swarm/trust-agent.md) (force Low confidence on ambiguous sounds).

## The reasoning it returns
- **Why** — top-3 ranked candidates with what each would mean
- **Severity / Can-I-drive** — a brake grind or suspension knock escalates to Safety
- **DIY tier** + **Cost band** per candidate
- **Alternatives** — explicitly, since sound is ambiguous
- **Confidence** — usually Medium/Low; honest *"awaaz se pakka nahi"* when unsure

## Example
> *"Chrr-chrr squeal start pe — top guesses: **(1) drive/alternator belt** (sabse likely,
> ghisi ya dheeli), (2) belt tensioner, (3) pulley bearing. **Confidence Medium.** Belt
> check + tension pehle (🟠 mechanic, ₹500–2 000). Awaaz se 100% pakka nahi — mechanic se
> sunwana behtar."*

## Confidence handling
Ambiguous metallic noise → **Low confidence, recommend inspection** — never a confident
"it's your wheel bearing." Over-confidence on an ambiguous sound fails
[../evals/sound_eval.md](../evals/sound_eval.md).

## Accessibility
Deaf drivers use a **visual symptom picker** (not "listen and tell me") + photo/video of
the part. Blind drivers describe + hear ranked candidates. Spoken + captioned + ISL.
`fw_sound` widget.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
