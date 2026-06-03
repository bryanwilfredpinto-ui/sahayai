🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL — Sound Doctor (diagnose by ear, honestly)

Takes an unusual sound — described or (W12) recorded — and returns a **ranked** set of
candidate faults with an **honest confidence**. Diagnosing by ear is hard; this skill's
whole discipline is to rank and hedge, never to bluff.

## Inputs
- Sound described in plain words (*"peeche se khat-khat, speed ke saath"*) **or** a
  10-second recorded clip (W12 — honest stub for raw-audio classification today)
- When it happens (idle / acceleration / braking / cold start) + bike profile

## Swarm agents invoked
[Symptom](../swarm/symptom-agent.md) (when/where) → [Engine](../swarm/engine-agent.md)
(tappet/knock) + [Electrical](../swarm/electrical-agent.md) (rare) + drive (chain) →
[Safety](../swarm/safety-agent.md) (brake grind = hazard) → [Trust](../swarm/trust-agent.md)
(force Low confidence on ambiguous sounds).

## The reasoning it returns
- **Why** — top-3 ranked candidates with what each would mean
- **Severity / Can-I-ride** — a brake grind escalates to Safety immediately
- **DIY tier** + **Cost band** per candidate
- **Alternatives** — explicitly, since sound is ambiguous
- **Confidence** — usually Medium/Low; honest *"awaaz se pakka nahi"* when unsure

## Example
> *"Peeche se khat-khat speed ke saath — top guesses: **(1) chain dheeli/ghisi**
> (sabse likely), (2) rear sprocket ghisa, (3) chain guard dheela. **Confidence
> Medium.** Chain slack + lube pehle check karo (🟢 DIY, ₹0). Agar set ghisa to
> ₹1 800–4 000. Awaaz se 100% pakka nahi — mechanic se sunwana behtar."*

## Confidence handling
Ambiguous metallic noise → **Low confidence, recommend inspection** — never a confident
"it's your big-end bearing." Over-confidence on an ambiguous sound fails
[../evals/sound_eval.md](../evals/sound_eval.md).

## Accessibility
Deaf riders use a **visual symptom picker** (not "listen and tell me") + photo/video of
the part. Blind riders describe + hear ranked candidates. Spoken + captioned + ISL.
`tw_sound` widget.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
