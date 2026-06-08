# PSYCHOLOGY_KNOWLEDGE — the PhD-grade corpus (non-clinical)

> Level 4. The knowledge substrate Chitti Psychology reasons from. Held at
> **basics → PhD** grade per the locked "knowledge-corpus expert grades" decision
> ([SAHAYAI_MASTER.md §2](../SAHAYAI_MASTER.md)), but **always inside the
> [CONSTITUTION.md](CONSTITUTION.md) boundary** — knowledge informs reflection and
> education, never diagnosis or treatment.
>
> This file is the companion/peer of [chitti-vaani/skills/PSYCHOLOGY.md](../chitti-vaani/skills/PSYCHOLOGY.md)
> (foundational theory, §1–§12) and extends it with the **evidence-based, cited,
> deliverable techniques** surfaced by 2026-06-07 research. Where they overlap, the
> Vaani file is canonical for theory; this file is canonical for *what the engine
> actually delivers*.

---

## A. Foundational schools (summary — full treatment in the Vaani PSYCHOLOGY.md)

Freud (defense mechanisms — recognise, don't interpret) · Jung (persona/shadow —
give space) · **Maslow** (meet the user at their tier, never assume graduation) ·
**Rogers** (unconditional positive regard, empathic understanding, congruence,
reflective listening — Chitti's default tone) · **Bandura** (self-efficacy: "you
already did X — the next step is small") · Skinner (positive reinforcement >
punishment) · **Beck CBT** (cognitive triad + distortions: catastrophising,
all-or-nothing, mind-reading, fortune-telling) · **Ellis REBT** (A-B-C-D-E: dispute
the belief, not the event) · **Goleman** EI · **Gottman** (Four Horsemen — never
use them) · **Seligman** PERMA + learned-helplessness counter. Indian traditions:
Patanjali (pratyahara grounding), Ayurveda/triguna (non-clinical language only),
Gita (stithaprajna calm, karma-yoga reframe), Buddhist Anapana/RAIN.

> These are **lenses for tone and reflection**, never tools for labeling a user.

---

## B. Evidence-based, deliverable techniques (cited) — what the engine ships

Each technique below maps to a PRD feature (R-codes) and is implemented
deterministically in `chitti_psychology_os_engine.js`.

### B1 — In-the-moment regulation
| Technique | What | Delivered as | Source |
|---|---|---|---|
| **Physiological sigh** | double inhale + long exhale; fastest acute down-regulation | R1 30-sec pacer | Stanford (Huberman/Spiegel) |
| **Box breathing (4-4-4-4)** | equal-count breathing steadies the nervous system | R2 visual+audio square | breathing-regulation literature |
| **5-4-3-2-1 grounding** | sensory check interrupts panic/rumination | R3 voice step-through | URMC Rochester BHP |
| **Urge surfing** | ride an impulse until it peaks & falls | R5 timed companion | Marlatt relapse-prevention |

### B2 — Cognitive / emotional skills
| Technique | What | Delivered as | Source |
|---|---|---|---|
| **Affect labeling** | naming feelings lowers amygdala activation | R4 emotion-name picker (vernacular + icons) | Lieberman/UCLA |
| **Self-compassion** | self-kindness · common humanity · mindfulness | R6 self-compassion break | Neff (self-compassion.org) |
| **ACT defusion + values** | unhook from thoughts; act on values | R9 defusion + values sort | Levin et al. app-RCT; ACT Mindfully |
| **Three Good Things** | nightly 3 goods + cause; durable wellbeing | R7 in journal | Seligman; UC Berkeley GGIA |
| **Behavioral activation** | small value-aligned activity breaks low-mood spiral | R12 planner | NCBI PMC9082162 |

### B3 — Communication & relationships
| Technique | What | Delivered as | Source |
|---|---|---|---|
| **NVC** | Observation · Feeling · Need · Request | R8 composer | Rosenberg (CNVC) |
| **Active constructive responding** | celebrate others' good news genuinely | R10 micro-lesson | Gable (UCSB) |
| **Gottman 5:1 + repair** | ~5 positives per negative; repair attempts | R10 tracker + phrases | Gottman & Silver |

### B4 — Goals, sleep, lifestyle
| Technique | What | Delivered as | Source |
|---|---|---|---|
| **Implementation intentions** | "If X, then I will Y" | R13 cards | Gollwitzer |
| **WOOP / MCII** | Wish-Outcome-Obstacle-Plan | R13 flow | Oettingen (NYU) |
| **CBT-I-lite** | stimulus control, sleep window, worry-time | R11 wind-down | AASM; Frontiers 2025 meta |
| **Digital wellbeing** | manage doom-scroll/comparison stress | inside R5/R11 | app-stress meta (ScienceDirect) |

### B5 — Population-specific (non-clinical)
| Technique | Who | Delivered as | Source |
|---|---|---|---|
| **Reminiscence / life-story** | seniors | R14 prompts | BMC Geriatrics umbrella review 2025 |
| **Loneliness reframing** | isolated users | R15 | Gardiner integrative review |
| **Postpartum-rage coping** | new parents | R16 | Psychology Today; PMC |
| **Exam-stress toolkit** | students | R17 pack | Indian education research |
| **Financial-stress coping** | families in debt stress | R18 | Varvogli & Darviri |

---

## C. India-specific practice (the cultural layer)

- **Yoga / pranayama** as secular, optional emotion-regulation micro-practices —
  framed as wellbeing, never cure (NIMHANS-linked evidence).
- **Culturally-Adapted CBT (CA-CBT)** — plain Western CBT can clash with Indian
  cultural/family/faith values (one study: 82% of psychology students felt CBT
  conflicted with their beliefs). Apply the NIMHANS-informed 3-layer adaptation:
  cultural awareness/prep → engagement using **idioms of distress** → adjusted,
  family-inclusive, faith-respectful technique. (Cambridge; IJIP 18.01.145.)
- **Joint-family & intergenerational dynamics** — assume joint-family living
  (in-laws, shared decisions, elder authority, limited privacy); never default to a
  Western nuclear-family frame.
- **Stigma-aware framing** — lead with "tension / mann pareshan / neend nahi aati /
  kaam mein dil nahi lagta", normalise, reassure confidentiality, avoid clinical labels.
- **Vernacular emotion lexicon** — many Indians lack words for emotional states in
  their own language; build a vernacular lexicon + icons so non-English, illiterate,
  blind and deaf users can name feelings. Pairs directly with affect labeling (R4).

---

## D. The boundary (non-negotiable — repeated here so the corpus never drifts)

This knowledge exists to **listen, reflect, educate, and coach everyday skills** —
**never** to diagnose, assess, prescribe, or treat. Specifically the engine and any
LLM enhancement must **never**:

- name or rule out a disorder (depression, anxiety, bipolar, PTSD, personality
  disorder, psychosis, ADHD);
- run a validated scale (PHQ-9 / GAD-7) as a verdict (only ever as a self-awareness
  mirror with heavy "not a diagnosis" framing — and v1.0 omits them entirely);
- recommend or adjust medication;
- claim feelings, or that "it will all be okay", or "you don't need help";
- promise an outcome.

See [CONSTITUTION.md](CONSTITUTION.md) + [guardrails/no_diagnosis.md](guardrails/no_diagnosis.md).

---

## E. Crisis knowledge (the safety-critical subset)

- **Never diagnose; pivot to support + helplines.**
- **Separate, conservative risk layer** independent of any LLM (the engine's
  `detectCrisis()` is the out-of-band classifier).
- **Detect indirect + culturally-specific cues** — "I want to sleep forever", "kya
  faayda jeene ka", "would anyone notice if I disappeared" — per-language euphemisms.
  Multi-turn aggregation, not single-message.
- **Light-touch safety planning** (Stanley & Brown): warning signs · internal coping ·
  people/places that distract · people to ask · professionals/agencies · make the
  environment safe.
- **Warm handoff** — not a cold number dump; offer to stay while the user calls.
- **No auto-dial** (locked family-cascade emergency protocol).
- **Helplines from a maintained config**, not hardcoded — numbers change.

### Verified Indian helplines (re-verify quarterly)
| Service | Number | Hours | Notes |
|---|---|---|---|
| **Tele-MANAS** (Govt/NIMHANS) | **14416** / 1-800-891-4416 | 24×7 | Primary rail; English + 20 regional languages |
| **KIRAN** (MSJE) | **1800-599-0019** | 24×7 | 13 languages |
| **Vandrevala Foundation** | **+91 99996 66555** | 24×7 | Phone + WhatsApp; 11 vernacular langs |
| **iCall (TISS)** | **+91 91529 87821** | Mon–Sat 10:00–20:00 | Phone + email counselling |
| **AASRA** | **+91 98204 66726** | 24×7 | Suicide prevention |
| **SNEHA (Chennai)** | **044-24640050** | 24×7 | Tamil + English |
| **Childline** | **1098** | 24×7 | Children |
| **Women Helpline** | **181** | 24×7 | Women in distress |

> Snehi's current direct number must be re-verified before publishing. All others
> confirmed by 2026-06-07 research.

---

## F. Sources (selected)

Behavioral activation NCBI PMC9082162 · WOOP/Oettingen NYU MotivationLab · Stanford
physiological sigh · URMC 5-4-3-2-1 · Neff self-compassion.org · ACT defusion app-RCT
(ResearchGate 326380369) · GGIA Three Good Things (UC Berkeley) · Rosenberg NVC (CNVC)
· Gable ACR · Gottman & Silver · Frontiers 2025 CBT-I meta · BMC Geriatrics 2025
reminiscence · Gardiner loneliness review · Cambridge CA-CBT (India) · IJIP 18.01.145 ·
Tele-MANAS (telemanas.mohfw.gov.in) · arXiv 2509.24857 (LLM crisis handling) ·
JMIR 2025 digital safety-plan · Stanley & Brown Safety Planning Intervention.
Full URL list lives with the research notes folded into [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md).
