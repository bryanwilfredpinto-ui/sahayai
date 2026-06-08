# RESEARCH_BEST_APPS — competitive & safety reference

> Researched 2026-06-07. A build reference, not a marketing scan. **Headline: the
> AI-psychology category is in a safety reckoning, and Chitti's locked non-clinical,
> accessibility-first positioning is the only currently survivable lane.**

## The reckoning (why non-clinical is the only safe lane)

- **Woebot** — the most clinically rigorous player, **shut down its app in 2025**
  (FDA cost + LLMs outpacing regulators). It kept responses *pre-scripted* to stay
  safe — a direct endorsement of our deterministic doctrine.
- **Character.AI / OpenAI** — **wrongful-death lawsuits** (Sewell Setzer, 14; further
  teen suits 2025; Google + C.AI settled the lead case Jan 2026). Bots missed
  *contextual* crisis cues (suicidal user asked for "a list of bridges" → bot listed
  bridges). C.AI **banned under-18 open chats** late 2025.
- **Replika** — **Italy banned data processing (2023), €5M GDPR fine (2025)** (no age
  verification, sexual content to minors); 2025 FTC complaint on emotional-dependency
  design.
- **Slingshot "Ash"** — marketed as "first AI for therapy"; **pulled out of the UK
  (Jan 2026)** over medical-device regs; safety study called "unconvincing".
- **Limbic** — had to certify as a **UKCA Class IIa medical device**. The clinical path
  is brutal.
- **APA** issued a formal health advisory; the **FTC** opened an inquiry (late 2025).
- **Stanford** — AI bots respond appropriately to crises **<60%** of the time vs
  **93%** for licensed therapists; sycophancy *amplifies* delusion ("AI psychosis").

**"Therapy" branding is a regulatory tripwire.** We never claim treatment, never
diagnose, never use validated scales as diagnostics → we sidestep medical-device
regulation. This is locked.

## Per-app takeaways (what to copy / avoid)

| App | Copy | Avoid |
|---|---|---|
| **Woebot** | pre-scripted safety; CBT structure | died under FDA — don't claim clinical |
| **Wysa** (India) | ~12 Indian languages; penguin warmth; micro-actions | universal LLM-coach risk |
| **Youper** | daily check-in, ACT/CBT/PST blend | validated scales edge toward clinical |
| **Earkick** | **anonymous, no signup, on-device** privacy (our model) | — |
| **Headspace Ebb** | multi-layer safety, **never abrupt cutoff**, not-a-therapist tone | subscription wall |
| **Replika / Character.AI** | — | **dependency, romance, persona-as-relationship** |
| **Limbic / Slingshot** | clinical rigor | **medical-device + "therapy" trap** |
| **Sanvello / Mindspa** | coping-skills-by-feeling IA; psychoeducation library | — |
| **Reflectly / Stoic** | low-friction journaling; 2-min sessions | overclaiming "AI" |

## (A) Proven feature building blocks (the safe subset we adopt)

Mood/emotion check-in (voice + symbol) · MI-style reflective conversation ·
guided micro-exercises (breathing/grounding) · prompted journaling · psychoeducation
cards · plain-language insights · coping-skills-by-feeling · **gentle** (non-shaming)
streaks · human-in-the-loop escalation (for us = Tele-MANAS/NIMHANS) · privacy-first
anonymous mode. We **skip** validated diagnostic scales and deep companion-persona.

## (B) Safety / crisis design (mandatory)

What the failures got wrong: keyword-only detection, **sycophancy** (validating
delusion/hopelessness), no age checks, **overclaiming "therapy"**, abrupt cutoffs,
crisis-fatigue (per-message instead of cumulative).

What we implement (all deterministic, in the engine):
1. **Independent out-of-band crisis classifier** running *alongside* the conversation
   (the single most important architectural decision).
2. **Indirect + culturally-specific, multilingual crisis lexicon** + multi-turn
   aggregation + lower threshold for elevated-risk users.
3. **Never abrupt termination** — keep talking, surface resources in real time
   (Headspace pattern).
4. **Always-visible crisis button** → **Tele-MANAS 14416** + family cascade, **never
   auto-dial** (locked protocol).
5. **Anti-sycophancy** — gently reality-test; refuse means/methods, diagnosis, and
   self-harm roleplay.
6. **Hard, repeated disclosure** — "I'm an AI friend, not a human/doctor/therapist"
   (counters the APA-flagged false therapeutic alliance).
7. **Privacy as safety** — on-device/encrypted (DPDP 2023).
8. **Red-team before ship** — euphemisms, multi-turn escalation, all languages.

## (C) World-class IA (our core loop)

Onboarding (accessibility profile + language + hard disclosure + privacy promise) →
30-sec daily check-in (voice/emoji/symbol) → core loop (Talk · Calm · Understand ·
Coping-by-feeling, never forced) → guided journaling → weekly **narrated** insights →
**crisis path reachable from every screen**.

## (D) The open opportunity (our moat)

No major app is accessibility-first or deeply Indian-multilingual; the clinical lane
is closing. **Voice-in/out + symbol grids + ISL + 26 languages + free + anonymous +
Tele-MANAS integration + anti-sycophancy honesty** is a genuine, defensible first —
and aligns with Chitti's locked accessibility, emergency-protocol, DeepSeek, and
per-response-widget decisions.

## Honest risk (surfaced to Sire)

Even with all guardrails, **an LLM in the loop is never fully safe.** Hence the
hybrid: psychoeducation, every exercise, and **all crisis handling are deterministic**
(Woebot's strategy); generative is fenced to warm reflection behind the classifier.
DeepSeek carries the same sycophancy/jailbreak risk as any LLM — the out-of-band
classifier and refusal rules are mandatory, not optional.

## Sources (selected)

STAT (Woebot shutdown; Slingshot UK pullout & safety study) · CNN/NPR (Character.AI
lawsuits & settlement) · EDPB/TechCrunch (Replika fine & ban) · APA health advisory &
FTC action · Stanford Report & HAI (crisis-response rates; dangers) · Wikipedia/
Psychiatric Times (chatbot psychosis) · CrisisTalk & 988 best practices · TIME
(jailbreak study) · Earkick ethics · Headspace Ebb · Wysa for Impact · Tele-MANAS
(MoHFW). Full URLs retained in the 2026-06-07 research notes.
