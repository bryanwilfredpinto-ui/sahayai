🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Tip Shield 🚨 — the anti-scam tip checker (the moat)

> The feature none of the 40 audited apps have. Deterministic, no LLM on the decision path. Enforces CONSTITUTION Art. 8 (Guardian, not Croupier). Cross-links: [../PRD.md](../PRD.md) · [confluence_engine.md](confluence_engine.md) · [risk_engine.md](risk_engine.md).

---

## Why it exists

The real danger to the common Indian investor is not a bad RSI read — it is the **forwarded WhatsApp "tip"**: *"BUY XYZ, guaranteed 3x in 2 weeks, last chance, SEBI-registered guru!"* These are pump-and-dump and advisor-impersonation scams. Tip Shield lets a user **paste/forward that message** and get a blunt, deterministic verdict: *"this looks like a scam, Chitti is NOT telling you to buy."*

## How it decides (deterministic patterns — no LLM)

Tip Shield scans the pasted text for **scam signatures** and the engine's `BANNED` phrase list (`TechEngine.hasBannedPhrase()`). It flags, it does **not** trade:

| Pattern | Trigger examples | Why it's a red flag |
|---|---|---|
| **Guaranteed returns** | "guaranteed", "sure-shot", "100% accurate", "cannot lose", "risk-free", "fixed profit" | No one can guarantee a market return — illegal claim |
| **Pump language** | "to the moon", "multibagger guaranteed", "next Reliance", "will double", "operator buying" | Classic pump-and-dump priming |
| **Unregistered advisor** | "join my paid group", "DM for calls", "guru tips", claims of SEBI registration without a number | Unregistered investment advice is a SEBI offence |
| **Urgency / scarcity** | "last chance", "buy before 9:15", "only today", "limited seats", "act now" | Manufactured pressure to stop you thinking |
| **Banned phrase** | anything in `TechEngine.BANNED` | Caught by `hasBannedPhrase()` before any render |

Match one or more → verdict **SCAM-LIKELY**, every matched pattern named back to the user. (Note: a bare "100%" is allowed — confluence can legitimately be 100% — only **certainty/accuracy** claims are banned, per the engine comment.)

## What Chitti says

> *"This message shows 3 scam signs: guaranteed returns, urgency, and an unregistered advisor. This looks like a scam. **Chitti is NOT telling you to buy.** No one can guarantee a market return. If money was asked for, this may be fraud — see Chitti Legal / Chitti UPI."*

It then offers to run an **honest** technical read on the named stock instead — risk-first, stop-gated, with the "most traders lose" rail — so the user gets the real picture, not the pitch.

## Accessibility mapping (Art. 2)

| Channel | Rendering |
|---|---|
| 🔊 Voice | "This looks like a scam. Chitti is not telling you to buy." + the named signs |
| 🔡 Text | a checklist of matched patterns (word labels, never colour-only) |
| 🔺 Icon+shape | 🚨 + ⚠️ per matched pattern; a clear ✋ "do not act" shape |
| 🤟 ISL/visual | "SCAM" concept panel + each red flag listed; warning rendered as shape + word |
| 👁️ Blind | the verdict and every matched pattern read via `aria-live`; paste box is a labelled textarea |

## Cross-links (the guardian web)

- Money already sent / fraud → **Chitti Legal** + **Chitti UPI** (fraud classifier).
- Crisis language (self-harm) detected in the message → **Tele-MANAS 14416**, no LLM (`detectCrisis`).

## Honesty rail

Tip Shield flags **patterns**, not certainty — a clean message can still be a scam, and a clumsy message can be a friend's genuine note. It always ends with: *"Chitti checked the words, not the truth. Never trade on a tip. NOT SEBI REGISTERED."*

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
