# MEMORY — rule versioning (change the table, never the logic)

The engine's legal facts live in **versioned rule tables** (`RULES` in
[chitti_legal_os_engine.js](../../../chitti_legal_os_engine.js)): limitation periods,
the cheque-138 cascade, consumer pecuniary thresholds, helplines, and the knowledge
bases (RIGHTS, NOTICES, CHECKLISTS, CASE_STAGES, AID_CATEGORIES, scam/contract flags).

- `RULES.version` + `RULES.asOfLaw` stamp every result's `sources[]` for provenance.
- A law change = **a table edit + a new version**, never a logic change. The gold test
  (`tools/legal_os_engine_test.mjs`) re-validates after every edit.
- Stale-data cadence (per [CHITTI_SOP.md](../../../CHITTI_SOP.md)): landmark SC/HC
  judgments monthly; statutory amendments on commencement; helplines re-verified quarterly;
  consumer/limitation thresholds on notification.
- Codes: BNS/BNSS/BSA 2023 (effective 1-Jul-2024) replaced IPC/CrPC/Evidence Act — the
  table cites the new sections; never revert to repealed IPC/CrPC numbering.
