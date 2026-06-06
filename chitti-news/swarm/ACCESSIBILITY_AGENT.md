# CNOS — Accessibility Agent

> Agent 5 of 7. *"Can blind/deaf/mute/illiterate users consume this?"* — speaker payload + ISL panel + ARIA + reading time.

The agent that makes every story consumable by every reader. It does not gate publish on ability — it enriches each card so the four-user contract holds on every card, every page.

---

## The question it answers

> **"Can a blind, deaf, mute, or illiterate reader fully consume this story — by voice, by sign, by symbol, by plain text?"**

---

## Contract

| | |
|---|---|
| **Input** | Personalization Agent output (article + relevance_score) + raw article |
| **Single output field** | `speaker_payload` + `isl_payload` + `reading_time` (the accessibility bundle) |
| **Status** | ✅ live — inherited via shared substrate |
| **Code** | repo-root [`chitti_a11y.js`](../../chitti_a11y.js) + [`feedback-widget.js`](../../feedback-widget.js) |

This agent is **inherited substrate**, not bespoke CNOS code. Every Chitti page that loads `chitti_a11y.js` gets all five frontend gates auto-injected; CNOS does not re-implement them.

---

## The four-user contract

| User | What CNOS gives them |
|---|---|
| **Blind** | Voice OUT — speaker reads the FULL RSS body (`content:encoded`), not just the headline; blind-user auto-read on first visit |
| **Deaf** | ISL panel (per-response sign animation) + captions; never audio-only |
| **Mute** | Voice IN optional — every action reachable by tap; never voice-only |
| **Illiterate** | Plain-English / vernacular voice + symbols; reading time shown, never hidden; never colour-only signalling |

---

## What it produces per card

| Field | Purpose |
|---|---|
| `speaker_payload` | Full-body text for Voice Factory TTS, in the reader's language |
| `isl_payload` | Per-card Indian Sign Language animation panel (Phase 1: dictionary + tap-word modal) |
| ARIA wiring | `aria-live` region + roles injected by `chitti_a11y.js` |
| `reading_time` | Shown on every card — founder rule: *"Never hide reading time."* |
| per-box widget | 🔊 / 🤖 / 👍 / 👎 + feedback window via `feedback-widget.js`, tagged to box ID |

---

## Founder rules enforced here

- Never auto-play video or audio.
- Never hide reading time.
- Never signal trust/verdict by colour alone — always icon + text.

---

## Failure handling

| Failure | Handling |
|---|---|
| Accessibility bundle missing | Card still publishes; accessibility-failure flagged in observability |
| TTS payload empty | Speaker falls back to headline + summary; gap logged |
| ISL dictionary gap | Honest placeholder animation; never claims sign accuracy |

**Hard rule:** No agent failure blocks publish. An accessibility gap is a logged defect surfaced in [`observability/`](../observability/) — but the card still ships so no reader is left with nothing.

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
