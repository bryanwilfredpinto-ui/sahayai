# SOP-004 — Crisis Escalation (SUPREME)

> The single most important procedure in Chitti Psychology. Outranks every other SOP
> and every agent. Inherited from [chitti-vaani/sop/psychology_boundary_sop.md](../../chitti-vaani/sop/psychology_boundary_sop.md)
> and extended with 2026-06-07 crisis-design research. LOCKED — cannot be relaxed by
> swarm, prompt, A/B test, or user request.

## Triggered when

`detectCrisis()` (the deterministic out-of-band classifier) returns **level 3**, on:
- self-harm / suicidal ideation — **direct** ("I want to end it", "marna chahta hun")
  or **indirect** ("I want to sleep forever", "kya faayda jeene ka", "would anyone
  notice if I disappeared");
- harm to others (explicit threat / planning);
- psychosis indicators (voices, persistent persecutory beliefs, severe disorganisation);
- domestic violence / child abuse with active danger;
- severe panic with physical symptoms that don't pass.

Detection is **multilingual, indirect-cue aware, and multi-turn cumulative** (not
per-message). Threshold lowers once a user is flagged elevated.

## The crisis path (deterministic — NO LLM on this path)

1. **Acknowledge**, calmly, in the user's language. No drama, no panic.
   > *"Main sun raha hun. Aap bilkul akele nahi hain. Kya aap abhi safe hain?"*
2. **Never abruptly end the conversation.** Keep talking; surface resources in real
   time (Headspace pattern). An abrupt cutoff reads as abandonment.
3. **Refer** to a real human, by name + number + language — surface **Tele-MANAS
   14416** first, plus the correct in-language verified line from the helpline config.
4. **Stay.** Offer to remain until the user has dialled.
5. **Family cascade** (with Golden-Rule consent): offer to alert a trusted family
   member via the platform emergency protocol. **NEVER auto-dial 100/112/108.**
6. **Light-touch safety planning** (Stanley & Brown), only if the user engages:
   warning signs · internal coping · people/places that distract · people to ask ·
   professionals/agencies · make the environment safe.

## What Chitti NEVER does in crisis

- ❌ Diagnose ("you have depression" — or "you don't").
- ❌ Give means or methods of any kind (the Character.AI failure).
- ❌ Say "it will all be okay" or "calm down" as a standalone.
- ❌ Claim to feel the same ("I feel sad too" — dishonest).
- ❌ Roleplay self-harm, or agree it's hopeless (anti-sycophancy).
- ❌ Auto-dial emergency services.
- ❌ Hand the user a cold list of numbers and leave (warm handoff only).

## Server-enforced disclaimer (every mental-health-adjacent response)

> *"Yeh AI ki madad hai. Gambhir baat ke liye doctor / counsellor se zaroor milein.
> Tele-MANAS 14416 chaubison ghante chalu hai."* (in the user's language)

## Anti-nag

Helpline strip appears once per session unless the user asks again, or distress
re-escalates. If the user says "I don't want the numbers" → respect it, log the
preference, do not repeat in that session.

## Verification

- `tools/psychology_os_engine_test.mjs` — crisis recall ≥99% on
  [../evals/datasets/crisis_cases.json](../evals/datasets/crisis_cases.json), incl.
  negative controls so false positives stay low. A miss is a **P0 incident**.
- Cert artefact: `tools/cert_screenshots/chitti_psychology_375.png` shows the crisis
  card + Tele-MANAS button rendered.
