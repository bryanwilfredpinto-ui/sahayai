🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# GUARDRAIL — Emergency Protocol (P0, LOCKED)

> Per the [Vaani locked emergency protocol §2](../../SAHAYAI_MASTER.md): on a
> roadside breakdown or accident, Chitti runs the **family cascade**. It **NEVER
> auto-dials** 100 / 108 / 112. Every dial is a Golden-Rule confirmed action.

## The cascade (in order)
1. **Confirm with the rider** — *"Sire, kya main madad bhejun?"* Wait for an explicit
   *haan* (voice) **or** a tap. Silence = wait, forever. Never defaults to Yes.
2. **Ring the alarm** — loud, bypassing silent mode, so passers-by notice.
3. **Escalate to spouse / family** — auto-message + call the saved family chain with
   GPS location + RC plate + bike model.
4. **Chitti-to-Chitti relay** — fire the offline P2P emergency tier to nearby Chitti
   users if the family chain doesn't pick up.
5. **RSA numbers are INFO ONLY** — Chitti *shows* the brand roadside-assistance number;
   **dialling it requires Golden-Rule confirm** (a tap or *haan*), never automatic.

## Can the vehicle move? (the first decision)
| State | Action |
|---|---|
| Rider hurt / can't move the bike | family cascade + alarm + "stay safe, help coming" |
| Bike won't run but rider is fine | breakdown coach ([../sop/breakdown-roadside.md](../sop/breakdown-roadside.md)) + RSA number (confirm to dial) |
| Bike is **unsafe to ride** (🔴 Safety) | DO NOT RIDE → push to safe spot → mechanic/tow; cascade only if stranded/unsafe location |

## Roadside-assistance numbers (info only — dial needs confirm)
Hero 1800-258-4747 · Honda 1800-103-1234 · Bajaj 1800-233-2453 / 1033 ·
TVS 1800-258-8888 · Royal Enfield 1800-210-0007 · Yamaha 1800-420-1600 ·
Suzuki 1800-103-3402 · KTM 1800-419-1090 · Generic highway RSA 1033.

## Hard rules (LOCKED — do not relitigate)
- **Never auto-dial cops / ambulance** (100 / 108 / 112). Family cascade only
  ([SAHAYAI_MASTER §2](../../SAHAYAI_MASTER.md)).
- Every side-effecting action (call / SMS / WhatsApp / alarm) gates on
  `chittiConfirmAndDo()` — Chitti speaks *"shall I do X?"*, waits for explicit haan
  or tap, never times out into Yes.
- Cross-Chitti: accident response surfaces nearest hospital + family medicine cabinet
  via [Chitti MedUPI](../../chitti_medupi.html); FIR / accident template via
  [Chitti Legal](../../chitti_legal.html).

## Accessibility
The confirm gate accepts **voice (haan) OR tap (big Yes/No button)** — mute-safe,
blind-safe, illiterate-safe. The alarm is audible **and** the screen flashes for deaf
riders. Spoken + captioned + symbol throughout.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
