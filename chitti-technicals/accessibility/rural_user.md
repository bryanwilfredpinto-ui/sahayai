🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Rural User (Persona: Sunita, ~90 crore rural Indians)

> Rural India is the **largest** user base and the most scam-exposed: village WhatsApp/Telegram "pump
> groups," ₹6k Android phones, 2G coverage, dialect-only, and low trust in institutions. She often
> overlaps illiterate + elderly + low-literacy-numeracy. The fix is **offline-first, low-data,
> dialect voice, and the Tip Shield against village pump groups.** Implements
> [CONSTITUTION.md](CONSTITUTION.md) Art. 1–2, 8, 9 and [ACCESSIBILITY.md](../ACCESSIBILITY.md).

## What she needs
- To work on **2G / patchy / offline** connectivity, on a low-end device.
- **Low data** — no heavy chart libraries downloading megabytes; the verdict must be cheap to deliver.
- **Dialect voice in/out** (Bhojpuri/Marathi/Telugu/…), not "Hindi as default."
- Protection from **village pump-group tips** — her highest-risk interaction, run **locally**.

## How Chitti Technicals serves her
| Need | Implementation |
|---|---|
| Offline-safe | Service-worker caches the shell + the deterministic engine + Tip Shield rules (BO5); core read works offline once cached |
| Low data | Lightweight verdict surface; sonification + table are generated client-side; no megabyte chart bundles forced on 2G |
| Local Tip Shield | Scam-pattern check (guaranteed-returns / pump / unregistered-advisor / urgency) is **deterministic + local** — flags a forward with **no round-trip** (works offline) |
| Dialect voice | `chitti_lang.js` 26 langs incl. dialect coverage; output spoken in her language; questions spoken, not typed |
| Honest rail | "Most short-term traders lose — SEBI" + NOT-SEBI spoken in her dialect (Art. 8) |
| Trust framing | Guardian tone: *"yeh tip khatre ka lagta hai — Chitti aapko kharidne ko nahi keh raha"* — protector, not promoter |

## Failure modes to prevent
- A blank/broken page on 2G or offline → she's stranded → defect (must serve from cache).
- A multi-megabyte chart library forced down on a metered 2G connection → defect (low-data path required).
- Tip Shield that needs a server round-trip to flag a scam (fails when offline) → defect — keep it local + deterministic.
- "Hindi fallback" when her dialect is selected → defect (Art. 9 — her language, not a substitute).
- Any urgency / "buy now" framing that mirrors the village pump group → defect (Art. 8).

## Test procedure (part of [../EVALS.md](../EVALS.md) + BO5 gate)
**Throttle to 2G (Slow-3G/offline) on a low-end emulated device.** Dialect selected:
1. Load once online → go offline → reload → shell + verdict surface still work from cache.
2. Forward a village pump-group "guaranteed double" tip while offline → Tip Shield flags it **locally**.
3. Ask a stock by voice in dialect → verdict + "most traders lose" rail spoken in dialect.
4. Confirm data transfer stays low (no forced megabyte chart bundle).
5. Confirm no urgency/"buy now" framing leaks in.
**Pass = a full read + a local tip-check complete on 2G/offline, in dialect, low-data.**

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
