🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SOP-004 — Exhaust Smoke Colour (colour table → cause → severity)

**COSDF L7 SOP-004.** Trigger: *"silencer se dhuaan nikal raha hai"* / a photo or video
of the exhaust → Engine Agent + Safety Agent. Smoke **colour** is the fastest read on a
hidden engine problem. The key safety split: thin white on a cold morning is harmless;
**thick sweet white** is a head-gasket emergency.

> COSDF L7 SOP-004 colour table: thin-white = condensation (none) · thick-sweet-white =
> head-gasket/coolant burning (HIGH) · blue = oil burning (MEDIUM) · black = running
> rich/over-fuelling (LOW). Diesel adds a black-soot-under-load nuance.

## Step 1 — Capture + classify (the colour table)
Photo/video of the tailpipe under load (or describe it). Ask **when** it appears
(cold start / acceleration / constant) and **smell** (sweet / oily / fuel).

| Colour | Smell / when | Likely cause | Severity | Can-I-drive |
|---|---|---|---|---|
| **Thin white** (wispy), clears in a minute | cold morning, no smell | **condensation** — normal | 🟢 none | yes |
| **Thick white**, sweet smell, doesn't clear | sweet, + overheating / coolant dropping | **head gasket / cracked head — coolant burning** | 🔴 **HIGH** | **NO — do not drive** |
| **Blue / blue-grey** | oily smell, on accel or after idle | **oil burning** — valve seals / rings / PCV / (turbo seals on diesel/turbo) | 🟠 **MEDIUM** | short distances; worsens |
| **Black** | fuel smell, on acceleration | **running rich** — over-fuelling: air filter, MAF, injector, fuel pressure | 🟡 **LOW** | yes, but fix (mileage + emissions) |
| **Black** (diesel) heavy under hard load | sooty | injectors / EGR / DPF / overfuelling | 🟠 (DPF/EGR) | get scanned |
| **Grey**, fluctuating | varies | could be oil **or** transmission-fluid (auto) burning, or turbo | 🟠 confirm | confirm before driving |

## Step 2 — Confirm the dangerous one (head gasket)
If **thick sweet white** is suspected, cross-check before declaring 🔴:
- Coolant level dropping with no external leak? ([./overheating.md](./overheating.md))
- "Mayonnaise" cream under the oil-filler cap? (oil + coolant mixing)
- Overheating + bubbling in the expansion tank?
- Two or more → head-gasket HIGH confidence → **DO NOT DRIVE** (driving warps the head /
  hydrolocks). One only → "possible head gasket — let's confirm" (confidence band).

## Step 3 — Verdict (swarm-synthesised)
Six fields: **Why · Severity · Can-I-drive · DIY-or-not · Cost band · Alternatives.**
- **Black/rich** → often a 🟢 air-filter or 🟡 sensor → DIY air-filter coachable
  ([./diy-repair-coach.md](./diy-repair-coach.md)); a clogged filter is a cheap first check.
- **Blue/oil** → 🟠 mechanic (valve seals/rings); meanwhile monitor oil level so it
  doesn't run dry (which is itself a 🔴 engine risk).
- **White/head-gasket** → 🔴 mechanic/tow; never DIY; high cost band → Scam Shield so the
  buyer isn't pushed into a full rebuild when a head-gasket job suffices
  ([./scam-quote-check.md](./scam-quote-check.md)).

## Hard rules (LOCKED)
- **Thick sweet white + any coolant/overheat sign = 🔴 do not drive** — pair with
  [./overheating.md](./overheating.md). Never downgrade it to "thoda dhuaan hai."
- Thin white on a cold start is **normal** — never alarm the driver or upsell a repair.
- Blue smoke means watch the **oil level** — a low oil level is a separate 🔴.
- Confidence band always; a single photo can mislead → "confirm by smell + coolant
  level" ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).
- Never invent a cause the symptoms don't support
  ([../evals/hallucination_eval.md](../evals/hallucination_eval.md)).

## Accessibility
Works from a single **photo/video** so a mute driver needs no speech. Colour is **never
the sole signal** — each row is spoken with its word + symbol + an ISL caption (deaf).
The 🔴 head-gasket verdict is spoken first (blind). `fw_smoke_color` widget carries
🔊/🤖/👍/👎.

## Cross-links
[../skills/engine.md](../skills/engine.md) · [./overheating.md](./overheating.md) (SOP-003) ·
[../swarm/engine-agent.md](../swarm/engine-agent.md) · [../swarm/fuel-agent.md](../swarm/fuel-agent.md) ·
[./dashboard-warning-light.md](./dashboard-warning-light.md) (DPF/check-engine) ·
[../skills/diy-coach.md](../skills/diy-coach.md).

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
