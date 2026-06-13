🎖️ World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.

# MEMORY — Rule-table versioning (stale-data rule)

Every data table in `chitti_mechanic_2w_engine.js` (`window.ChittiMech2W`) carries
`version` + `effective_from` + a data vintage shown to the user and spoken, so an answer is
never silently stale. **When a number changes, only the table changes — engine logic is
untouched.**

| Table | Refresh cadence |
|---|---|
| Oil grades / specs per model | On manufacturer spec change |
| Service intervals (km / months) | On manufacturer schedule change |
| Insurer CSR / premium bands | Per IRDAI release (annual) + market diff |
| Tyre catalogue + fair-price bands | Quarterly market diff |
| Part fair-cost bands (genuine/OE/local) | Quarterly market diff |
| OBD / fault-code dictionary | On standard/model addition |
| PUC / registration / challan rules | Per RTO/mParivahan change |
| Battery health/replacement bands | On spec change |

- A result computed under an older table is **re-flagged on next open** if the table moved.
- Mechanic 2W is **HIGH-risk** (safety + money): Sire approves any safety- or
  money-affecting table change before it ships (per
  [SAHAYAI_MASTER §2f](../../../SAHAYAI_MASTER.md)).
- A figure with no current table → "I'm not sure" (see
  [../guardrails/hallucination.md](../guardrails/hallucination.md)), never a guess.

---
> **World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.**
