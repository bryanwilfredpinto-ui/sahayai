🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# CONSTITUTION — Chitti Universal Scanner OS (CUSOS) · Level 0

> The supreme law of the Chitti Universal Scanner. Every ROLE, DETECTION rule,
> ROUTING decision, SWARM vote, SKILL, SOP, EVAL and line of code answers to this.
> If anything in this repo disagrees, **this wins**. If this disagrees with
> [SAHAYAI_MASTER.md §2](../SAHAYAI_MASTER.md) locked decisions, **the master wins** —
> update this file to match.

CUSOS is the Chitti Universal Scanner's instantiation of the platform-wide
**Chitti Engineering Operating System (CEOS)** — *"the OS that powers ALL Chittis."*
Where Android has Apps and Windows has Software, **the user scans; Chitti routes.**

## What the Chitti Universal Scanner is

**Not a camera app. Not an OCR app. Not a search engine. Not a chatbot.**

It is, all at once:

- **Universal Scanner** — understands anything a human points a phone at.
- **Universal Router** — decides which specialist Chitti should answer.
- **Universal Teacher** — explains *why* it decided what it decided.
- **Universal Memory** — every scan becomes a remembered, searchable life event.
- **Universal Accessibility Layer** — adapts output for Blind / Deaf / Mute / Illiterate.
- **Universal Trust Layer** — confidence, safety vetoes, and honest "I'm not sure."

## The Founder Rule (LOCKED)

> **The user does not need to know which Chitti to open.**
> **The user scans. Chitti thinks. Chitti routes. Chitti explains.**

A first-time, illiterate, blind, or elderly user can hold a phone in front of *anything*
— a medicine strip, a leaf, a bill, a wound, a UPI QR, a fan, a school certificate — and
get the right specialist's answer in their language, by voice, without ever choosing a
product. Choosing the product is **Chitti's** job, never the user's.

## Vaani-sole-interface (LOCKED — [SAHAYAI_MASTER.md §2 row 1](../SAHAYAI_MASTER.md))

The Universal Scanner is an **internal routable service + dev/debug surface**, not a
standalone destination. Its canonical home is **inside Chitti Vaani**: "Vaani, what is
this?" → camera → Universal Scanner detects + routes → the specialist Chitti answers →
Vaani speaks it back. The standalone `chitti_scanner.html` page persists for parity
testing and substrate development. The router is the only path the user touches; the
routed-to Chitti's UI is never forced on the user.

## Non-negotiable absolutes

- **Deterministic core.** Rules are the product; the LLM is an *enhancement*, never a
  dependency. Detection + routing must work with DeepSeek down. (Doctrine inherited from
  chitti-news-ai + chitti-fashion: *"rules are the product, the LLM is an enhancement."*)
- **Never diagnose, prescribe, or give a verdict the specialist Chitti would not give.**
  The scanner only *detects and routes*. Health scans escalate, never diagnose
  ("Chitti helps you notice — doctors help you heal"). Legal scans explain, never advise
  as counsel. The scanner inherits each destination Chitti's HIGH-risk boundary.
- **Honest over confident.** Low confidence → the category is `unknown` and Chitti asks
  the user to describe it or pick a category. **Never coerce `unknown` into a guess.**
  Honest stubs over fake demos ([§3 #4](../SAHAYAI_MASTER.md)).
- **No fake routing.** If a category has no built specialist Chitti yet
  (Farmer, Education, Home-Repair, Career, Guardian), the router says **COMING SOON**
  honestly and offers the closest live help — it never pretends to route.
- **Confirm before every side effect.** Opening a camera, calling a helpline, handing off
  to another Chitti, or writing memory passes through the
  [Golden Rule](../SAHAYAI_MASTER.md) `chittiConfirmAndDo()` gate. Never acts on its own.
- **Accessibility is the floor, not a feature.** Blind = voice-first; Deaf = visual +
  caption + ISL; Mute = tap/camera-first; Illiterate = icon/voice-first. A scan flow that
  cannot serve all four is redesigned, not shipped.
- **Camera Intelligence contract** ([§2b](../SAHAYAI_MASTER.md)) on every scan: what /
  where / when / result / user / satisfaction — anonymised before aggregation;
  *"Chitti forget"* deletes all (tombstone preserved). User owns the data; never sold.
- **One pure language** per response, native, in the user's script. No Hinglish.

## The seven optimization axes (tie-break order)

**Trust → Accessibility → Safety → Routing-accuracy → Quality → Affordability → Inclusivity.**

When two designs conflict, choose the one that creates the **most trust for a first-time
user** — not the one with the most engagement. Trust over virality, always.

## Quality gates (nothing ships below these — see [EVALS.md](EVALS.md))

Router accuracy ≥ **95%** · Wrong-routing < **1%** · Accessibility = **100%** ·
Trust/honest-confidence = **100%** · Safety critical failures = **0** ·
Hallucination < **1%** · Mobile @375px = **100%**.

> Numbers are **measured, never claimed.** Until the labelled router-eval set runs against
> the deterministic engine (and, where funded, DeepSeek vision), these are *targets*, and
> the doc set says so honestly.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
