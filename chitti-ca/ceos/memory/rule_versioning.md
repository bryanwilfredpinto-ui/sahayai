🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# MEMORY — Rule-table versioning (stale-data rule)

Every rule table in `chitti_ca_os_engine.js` carries `version` + `fy` + `effective_from`.
The active FY is shown to the user and spoken, so an answer is never silently stale.

| Table | Refresh cadence |
|---|---|
| Income-tax slabs / rebate / surcharge / cess | Annual — Budget (Feb), per FY |
| GST rates / thresholds / ITC blocked list | On each GST-Council notification (monthly diff) |
| Compliance due dates | Per statutory revision; verified each FY before season |
| Scheme criteria + ₹ bands | Quarterly diff vs MyScheme/Udyam/state portals |
| GSTIN checksum algorithm | Stable (only changes on a GSTN spec change) |

When a number changes, **only the table changes** — engine logic is untouched. A
result computed under an older table is re-flagged on next open if the active FY moved.
Sire approves any HIGH-risk table change (CA OS is HIGH-risk per [SAHAYAI_MASTER §2f](../../../SAHAYAI_MASTER.md)).

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
