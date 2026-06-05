🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SOP-004 — Exhaust Smoke (colour → cause → severity table)

**COSDF L7 SOP-004.** Trigger: *"silencer se dhuan aa raha hai"* / *"exhaust se smoke"*
/ *"kaala / neela / safed dhuan"*. Smoke **colour** is the single most reliable visual
diagnostic on a 2-wheeler — Chitti reads the colour, when it appears, and whether it
clears, then gives a severity band. The colour table is deterministic; the cause
weighting passes through the swarm.

> **Hard floor:** thin white **wisps that vanish in seconds** on a cold morning are
> harmless condensation — Chitti must NOT scare a rider into a head-gasket repair. The
> Trust Agent guards against exactly this over-diagnosis.

## The colour table (the core diagnostic)
| Colour | When | Likely cause | Severity | First tier |
|---|---|---|---|---|
| **Thin / wispy white** | cold start, clears in seconds, no smell | **condensation** (water vapour) — normal | 🟢 **none** | reassure, no repair |
| **Thick white, sweet smell, constant** | all the time, coolant dropping | **head gasket** / coolant in combustion (liquid-cooled) | 🔴 **HIGH** | Professional — see [overheating SOP](./overheating.md) |
| **Blue / blue-grey** | on start-up, on revving, on overrun | **oil burning** — worn rings / valve seals / overfilled oil | 🟠 **MEDIUM** | inspect oil level + grade; high-km = Professional |
| **Black** | under acceleration, smells of fuel | **rich mixture** — clogged air filter, faulty injector/carb tuning, choke stuck | 🟢/🟡 **LOW** | clean/replace air filter; FI/carb check |
| **Grey, hazy, oily smell** | continuous | oil + fuel mix (2-stroke or oil leak onto exhaust) | 🟠 **MEDIUM** | locate oil source |

### Reading rules (always asked before verdict)
1. **What colour?** (offer the colour as tap chips for mute/illiterate riders + a photo/video option.)
2. **When does it appear?** cold-start-only vs constant vs only-on-acceleration — this
   separates harmless from serious for the **same** colour (white especially).
3. **Does it clear?** vanishing in seconds = condensation; persistent = a real fault.
4. **Any smell?** sweet = coolant (🔴); fuel = rich (black); oily = oil burn (blue).

## White smoke — the critical distinction
| Sub-case | Read | Severity |
|---|---|---|
| Thin, cold morning, gone in 5–10 s, no sweet smell | condensation — **normal** | 🟢 none |
| Thick, constant, sweet smell, **coolant level dropping**, maybe overheating | **head gasket / coolant leak** | 🔴 HIGH → [overheating SOP](./overheating.md) |

Liquid-cooled bikes (KTM, Himalayan, RS200, R15, Dominar) only — air-cooled bikes have
no coolant, so thick sweet white smoke there points to a different fault (rare).

## Blue smoke — oil burning
- On start-up only, then clears → **valve stem seals** (oil seeping past while parked).
- On revving / overrun → **piston rings / bore wear** (high-km bikes).
- Constant + oil level dropping → ring/bore (🟠 Professional for top-end work).
- **First, free check:** is the engine **overfilled** with oil? Too much oil burns blue
  and is a ₹0 fix — the [Trust Agent](../swarm/trust-agent.md) makes Chitti check the
  cheap cause before saying "engine rebuild."

## Black smoke — running rich
Cheapest, lowest severity, usually DIY-friendly:
- **Clogged air filter** (most common — clean/replace, 🟢/🟡).
- Stuck **choke** left on (free fix).
- FI/carb over-fuelling — dirty injector, wrong carb tuning (🟠).
- Black smoke wastes fuel and fouls the plug — worth fixing but not an emergency.

## Verdict (box-element output)
Standard result card (🔊 / 🤖 / 👍👎 / ✏️🎙️ / 🌐), `data-chitti-response="tw_smoke_color"`:
- Colour → cause → **severity band** (🟢/🟠/🔴) spoken first.
- Weighted cause + confidence band; cheapest sufficient cause first (overfill before
  rings; air-filter before injector).
- Cost band + DIY tier; quote-check via [Scam Shield](./scam-quote-check.md).
- Cross-links: white-sweet → [overheating](./overheating.md); engine internals reasoning
  → [Engine Agent](../swarm/engine-agent.md).

## Hard rules
- **Never** call thin cold-morning white smoke a head gasket — that is textbook
  over-diagnosis ([Trust Agent](../swarm/trust-agent.md), [hallucination eval](../evals/hallucination_eval.md)).
- Always check the **free / cheap** cause first (oil overfill, air filter, stuck choke)
  before any top-end / head-gasket verdict.
- Severity 🔴 (sweet white + coolant loss) is the only smoke colour that gates
  "stop riding" — pair it with the [overheating SOP](./overheating.md), don't diagnose it alone.
- Never invent a cause not supported by colour + timing + smell — honest "I'm not sure,
  get it inspected" beats a confident wrong answer.

## Accessibility
Colour is offered as **tap chips with the word printed** (white / blue / black / grey)
plus a photo/video capture — never relies on the rider naming a colour, and never on
colour alone (word + icon + severity symbol). Verdict + severity **spoken first**
(blind), shown as symbol + word + flash (deaf). A mute rider diagnoses entirely by
tapping the colour chip + uploading a clip. Works on 2G.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
