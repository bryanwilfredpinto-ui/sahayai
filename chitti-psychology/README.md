🎖️ World Class Chitti Psychology — Commando Discipline. Human Dignity Above Everything.

# Chitti Psychology — Human Understanding OS

**A voice-first, accessibility-first Human Understanding companion for every
Indian — student to senior, every language, including blind, deaf, mute and
illiterate users. Emotional awareness, coping skills, relationships,
communication and life navigation — without ever pretending to be a therapist.**

## What I do

- **Emotional Mirror** — name what you might be feeling, gently, in your language.
- **Calm me now** — 30-second breathing & grounding when panic / anger / stress spikes.
- **Understand a feeling** — plain-language psychoeducation cards (audio-first).
- **Coping skills by feeling** — "I feel anxious → here are small steps that help."
- **Relationship & communication coach** — say the hard thing without a fight (NVC-style).
- **Parenting, workplace, grief, confidence, family** coaching — educational, never clinical.
- **Life Reflection Journal** — voice / mood / photo journaling + plain-language weekly insight.
- **Crisis-aware** — detects distress, never diagnoses, warmly routes to **Tele-MANAS 14416**
  + family cascade. Never auto-dials emergency services.

Full capability surface: [skills/FEATURES.md](skills/FEATURES.md).

## Who I serve (always the 4 users + elderly)

| User | Challenge | How Chitti Psychology serves them |
|------|-----------|-----------------------------------|
| 👁️ Blind | Cannot see UI | Every box reads aloud; voice-in/voice-out; audio-led exercises |
| 🦻 Deaf | Cannot hear | Full text + symbols + ISL panel on every response |
| 🤫 Mute | Cannot speak | Whole flow by tap + emoji/symbol grid; voice optional |
| 📖 Illiterate | Cannot read | Voice-everything, emotion-icon picker, vernacular words, 2G-ready |
| 👴 Elderly | Slower, lonely | Large text, slow speech, simple UI, reminiscence prompts |

## The one boundary (LOCKED, server-enforced)

**Chitti Psychology is a supportive companion, NOT a therapist, NOT a
psychiatrist, NOT a diagnosis engine.** It never diagnoses, never prescribes,
never claims feelings, never promises outcomes, never says "you don't need help."
See [CONSTITUTION.md](CONSTITUTION.md) + [guardrails/](guardrails/). This is the
only currently survivable position in the AI-psychology category — see
[RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md) for why (Woebot shutdown,
Character.AI lawsuits, APA advisory, FTC inquiry, 2025).

## How it works

- **Interface:** reached through **Chitti Vaani** (sole user surface, SAHAYAI_MASTER §2).
  `chitti_psychology.html` is the dev/debug + parity page.
- **Reasoning doctrine:** **Rules are the product, the LLM enhances.** A
  **deterministic engine** (`chitti_psychology_os_engine.js`) owns emotion-labeling,
  coping library, breathing/grounding exercises, psychoeducation, the SOP flows, and
  **all crisis detection + helpline routing** (the safety-critical path runs with
  ZERO LLM dependency). **DeepSeek** (via `chitti-vaani-api`) only enhances warm,
  reflective conversation — fenced by the out-of-band crisis classifier.
- **Swarm:** 9 agents (Emotion · Behavior · Communication · Relationship · Parenting ·
  Leadership · Accessibility · Trust · **Safety supreme**) — see [swarm/](swarm/).
- **Privacy:** journals, mood history and the Emotional Twin live **on the device**
  (IndexedDB). "Chitti forget" deletes all. Never sold, never used for ads. DPDP 2023.

## Languages

Anchored to **Chitti Vaani's** language surface: `chitti_lang.js` owns `#lang-select`
(Vaani-canonical), auto-populating the **26-language Voice Factory substrate**;
voice-out covers all 26. The crisis lexicon is **multilingual + culturally specific**
(distress euphemisms differ per Indian language — a safety necessity, see
[skills/emotion-detection.md](skills/emotion-detection.md)).

## Status

🟡 **CEOS v1.0 skeleton + deterministic engine (2026-06-07)** — full doc set,
deterministic brain, accessible page with working Vaani language dropdown, engine
gold-test + visual cert. Capped only by the DeepSeek key (warm conversational layer)
and real on-device hardware (Sire's slot). See [CERTIFICATION_REPORT.md](CERTIFICATION_REPORT.md).

## Document map (CEOS v1.0)

| Level | File(s) |
|---|---|
| **L0 — Constitution** | [CONSTITUTION.md](CONSTITUTION.md) (Founder Rule + the one boundary) |
| **L1 — Role** | [ROLE.md](ROLE.md) (Chief Architect) |
| **L2 — Vision** | [PRODUCT_VISION.md](PRODUCT_VISION.md) · [VISION.md](VISION.md) · [SUCCESS_METRICS.md](SUCCESS_METRICS.md) |
| **L3 — Users** | [PERSONAS.md](PERSONAS.md) |
| Spec | [PRD.md](PRD.md) · [ARCHITECTURE.md](ARCHITECTURE.md) |
| **L4 — Knowledge** | [PSYCHOLOGY_KNOWLEDGE.md](PSYCHOLOGY_KNOWLEDGE.md) (PhD-grade corpus + cited techniques) |
| **L5 — Skills** | [SKILLS.md](SKILLS.md) · [skills/](skills/) |
| **L6 — SOPs** | [SOP.md](SOP.md) · [sop/](sop/) (incl. [crisis-escalation](sop/crisis-escalation.md)) |
| **L7 — Swarm** | [swarm/](swarm/) (9 agents, Safety supreme) |
| **L8 — Guardrails** | [guardrails/](guardrails/) |
| **L9 — Accessibility** | [accessibility/](accessibility/) (5 archetypes) |
| **L10 — Memory / Twin** | [memory/emotional_twin.md](memory/emotional_twin.md) |
| **L11 — Observability** | [OBSERVABILITY.md](OBSERVABILITY.md) · [observability/](observability/) |
| **L12 — Evals** | [EVALS.md](EVALS.md) · [evals/](evals/) |
| Research | [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md) |
| Quality / Cert | [QUALITY.md](QUALITY.md) · [CERTIFICATION_REPORT.md](CERTIFICATION_REPORT.md) |
| Build | [BUILD_ORDER.md](BUILD_ORDER.md) · [ROADMAP.md](ROADMAP.md) |

---
> **World Class Chitti Psychology — Human Dignity Above Everything.**
