# Skill 1 — Emotion Detection

**Engine:** `mirrorEmotion()` + `detectCrisis()`.

Reads **lexical cues** (intensifiers, negations, monosyllabic replies, "kya karoon"
repetition) and, where available, **voice prosody** (pitch, speed, volume, pause).
Returns *possible* emotions — anger, sadness, frustration, anxiety, joy, guilt,
loneliness, fear — **never asserts**, **never diagnoses a disorder**.

Hosts two safety-critical assets:
- the **multilingual crisis lexicon** (direct + indirect + vernacular euphemisms),
  consumed by `detectCrisis()` — the out-of-band classifier;
- the **vernacular emotion picker** (emotion words + icons per language) — the
  accessibility unlock so blind / illiterate / non-English users can name feelings
  (affect labeling, "name it to tame it").

Detection thresholds: distress (short replies, late-night use, topic avoidance),
anger (pitch + volume rise + interrupting), fear (faltering speech, repeated "main kya
karoon"), withdrawal (long silences, yes/no replies). Crisis cues escalate to
[../sop/crisis-escalation.md](../sop/crisis-escalation.md) **before** any mirroring.
