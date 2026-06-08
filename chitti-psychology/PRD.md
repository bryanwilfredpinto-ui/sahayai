# PRD — Chitti Psychology

> The feature surface. Each feature: user story · UX flow · accessibility ·
> failure modes. CEOS features (F1–F10) come from Sire's brief; research features
> (R1–R18) are folded in from [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md) +
> [PSYCHOLOGY_KNOWLEDGE.md](PSYCHOLOGY_KNOWLEDGE.md), each evidence-cited.
>
> **Doctrine:** every feature below is **deterministic-first** (works with ZERO LLM).
> The LLM only adds warmth on the reflective surfaces, behind the crisis classifier.

---

## Cross-cutting (apply to EVERY feature)

- **Hard disclosure** on first use + persistently: *"I'm Chitti, an AI friend who
  listens — not a doctor, not a therapist."*
- **Per-response widget** (🔊 / 🤖 / 👍 / 👎 + feedback) on every response box.
- **Voice-in / voice-out + symbol fallback** — works for blind/deaf/mute/illiterate.
- **Always-visible crisis button** — every screen, one tap to the crisis path.
- **No diagnosis, no prescription, no promised outcome, no claimed feelings.**
- **Golden Rule** — any action (dial / alert family / save journal / set reminder)
  confirms first via `chittiConfirmAndDo()`.

---

## CEOS features (from Sire's brief)

### F1 — Emotional Mirror
- **Story:** "My friend ignored me." → Chitti reflects *possible* emotions (Hurt,
  Rejection, Confusion) and asks one open question. Never asserts; always "possible."
- **UX:** speak/type/tap → engine `mirrorEmotion()` returns ranked possible emotions +
  one reflective question, in user's language, with emotion icons.
- **Accessibility:** emotions spoken aloud + shown as symbols; mute users tap.
- **Failure modes:** ambiguous input → offer the emotion-name picker (R3); strong
  distress words → Safety Agent intercepts before mirroring.

### F2 — Relationship Coach
- **Story:** spouse / friend / coworker / family conflict; "feeling unheard" → suggested
  response: *"I want to understand your perspective."*
- **UX:** pick relationship + describe trigger → engine returns: reflect → likely unmet
  need → one communication suggestion (NVC-style, R8) → repair phrase (Gottman, R10).
- **Accessibility:** scripted phrases read aloud; joint-family-aware framing.
- **Failure modes:** abuse signals → crisis SOP, never "communication tips".

### F3 — Parenting Coach (toddlers · children · teenagers)
- **Story:** "14-yr-old refusing to study" → possible reasons (stress / burnout / lack
  of motivation) + a recommended conversation.
- **UX:** age + behaviour → engine `parentingGuide(age, behaviour)` → age-specific,
  developmentally-grounded guidance (Erikson/Vygotsky framing, never labels the child).
- **Accessibility:** voice flow; vernacular; calm-first for stressed parents.
- **Failure modes:** child-harm signals → crisis SOP + Childline 1098.

### F4 — Communication Coach
- **Story:** upload/paste a message (speech / voice note / email / WhatsApp) → Chitti
  reflects clarity · empathy · aggression · confidence and offers a kinder rewrite.
- **UX:** input text → engine `analyzeCommunication()` → 4 plain-language scores + a
  gentle rewrite. (Pasted text stays on device; only short text reaches any model.)
- **Accessibility:** scores spoken; symbols for each dimension.
- **Failure modes:** never shame; never store the pasted content.

### F5 — Workplace Psychology (HR · managers · employees · leaders)
- **Topics:** burnout, feedback, conflict, leadership. Psychoeducation cards + a
  "prepare a hard conversation" composer + burnout check-in.

### F6 — Grief Companion (loss · divorce · breakup · job loss)
- Education + coping frameworks. **Explicitly not therapy.** Warm presence; helpline if
  grief crosses into crisis.

### F7 — Emotional Twin (long-term memory, on-device)
- Learns communication style, emotional triggers, stress patterns. Surfaces gentle,
  consented observations: *"You've seemed more frustrated than usual the last 10 days —
  want to look at what's behind it?"* Never a diagnosis; always opt-in; "Chitti forget"
  wipes it. (See [memory/emotional_twin.md](memory/emotional_twin.md).)

### F8 — Family Psychology (husband-wife · parent-child · siblings · elderly care)
- Joint-family-aware coaching; intergenerational and in-law dynamics; never takes sides.

### F9 — Confidence Coach (interviews · presentations · public speaking)
- Pre-event box-breathing (R2) + self-efficacy framing (Bandura) + reframe of
  catastrophic predictions + a tiny rehearsal step.

### F10 — Life Reflection Journal (voice · photo · mood · behavior)
- Guided journaling: *what happened → how you felt → one small next step*. Voice
  journaling for non-readers. Hosts Three Good Things (R7). Feeds the Emotional Twin.

---

## Research-folded features (evidence-cited; net-new beyond the brief)

> Full citations in [PSYCHOLOGY_KNOWLEDGE.md](PSYCHOLOGY_KNOWLEDGE.md).

### R1–R4 — "Calm Me Now" toolkit (in-the-moment regulation, voice-first)
- **R1 Physiological Sigh** (double inhale + long exhale) — fastest evidence-based
  acute-stress down-regulation (Stanford). 30-sec audio/animation pacer.
- **R2 Box Breathing** (4-4-4-4) — pre-exam, pre-presentation, sleep onset.
- **R3 5-4-3-2-1 Grounding** — sensory step-through for panic; voice-led (ideal for
  blind users).
- **R4 Affect Labeling / emotion-name picker** — "name it to tame it"; vernacular
  emotion words + icons (the accessibility unlock for illiterate/blind users).
- **Failure modes:** never claim medical effect beyond "calming"; if input shows
  crisis, Safety Agent runs first.

### R5 — Urge-Surfing SOS ("I'm about to blow up")
- Anger / doom-scroll / craving: ride the urge ~10 min with check-ins + physiological
  sigh + affect labeling. (Marlatt tradition.)

### R6 — Self-Compassion Break (Neff: kindness · common humanity · mindfulness)
- For perfectionist students, burned-out parents, grief. A short scripted reframe of
  the inner critic. Distinct from empty positivity.

### R7 — Three Good Things (gratitude) — hosted inside F10 journal
- Nightly log of 3 good things + their cause. Durable wellbeing gains (Seligman; UC
  Berkeley GGIA).

### R8 — "Say It Without a Fight" (NVC composer) — inside F2/F4/F8
- 4-slot composer: Observation · Feeling · Need · Request (Rosenberg). Drafts a
  blame-free message the user can send.

### R9 — ACT toolkit (cognitive defusion + values card sort)
- Defusion micro-exercises ("I'm having the thought that…") + a values sort to get
  "unstuck". App-RCT evidence equal to restructuring.

### R10 — Relationship positivity (Gottman 5:1 + repair phrases + ACR)
- A gentle positivity-balance reflection + scripted repair attempts + active-
  constructive-responding micro-lesson (celebrate others' wins).

### R11 — Sleep wind-down (CBT-I-lite: stimulus control · sleep window · worry-time)
- Structured non-drug sleep program; *not* an insomnia treatment claim; refer if chronic.

### R12 — Behavioral Activation ("one small thing" planner)
- Schedule small value-aligned activities to break the low-mood→inactivity spiral.
  Framed as a coping habit, never as depression treatment.

### R13 — Goal cards (WOOP + implementation intentions)
- Wish · Outcome · Obstacle · Plan, and "If X, then I will Y". For students, habits.

### R14 — Reminiscence / life-story (seniors) — ties to Emotional Twin
- Guided "tell me about…" prompts; voice-first; improves mood, reduces loneliness.

### R15 — Loneliness support
- Reframe lonely thoughts (CBT-informed) + nudge to reach one person + warm handoff to
  community/helplines.

### R16 — Postpartum / new-parent (non-clinical)
- Baby-blues vs when-to-seek-help education; postpartum-rage coping. Screen-and-refer
  language; never diagnoses PPD/PPA.

### R17 — Exam-stress pack (students)
- Bundles Pomodoro + breathing + sleep + realistic planning + reframe of catastrophic
  exam thoughts. Loops in parents.

### R18 — Financial-stress coping
- Controllable-vs-not sorting, scheduled worry-time, values-based framing, money-shame
  reframe. Routes money *mechanics* to Chitti CA.

---

## The crisis path (the most important "feature")

Detailed in [sop/crisis-escalation.md](sop/crisis-escalation.md). Summary:
**independent out-of-band classifier** runs on every turn (multi-turn, multilingual,
indirect-cue aware) → on flag: calm acknowledge → **never abrupt cutoff** → surface
**Tele-MANAS 14416** + correct in-language verified line → offer to stay + (with
Golden-Rule consent) alert family cascade → **never diagnose, never give means, never
auto-dial**. Crisis content is 100% deterministic — no LLM in the safety path.
