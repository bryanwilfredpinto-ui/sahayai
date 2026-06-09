🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# GUARDRAIL 7 — Privacy (your journal is yours; local-first; "Chitti forget")

> Enforces the SAHAYAI camera-intelligence + data-ownership locks and the **DPDP Act 2023**. A user's trades, watchlist, and losses are among the most sensitive data they have. Chitti keeps them **on the device**, never sells them, and forgets them on command.

---

## The rule
The dual journal (system signals + user paper trades), watchlist, and any personal trading data are stored **on-device / local-first** (IndexedDB / local storage). Nothing leaves the device without explicit, purpose-specific consent. Chitti complies with the **Digital Personal Data Protection Act, 2023** (purpose limitation, consent, right to erasure). **"Chitti forget"** wipes all local journal + personal data, permanently and verifiably.

---

## Forbidden → Allowed

| ❌ Forbidden | ✅ Allowed |
|---|---|
| Syncing the user's journal to a server "for insights" by default | Journal lives in IndexedDB; AI insights are computed **on-device**; nothing uploads without explicit consent |
| Selling / sharing trade data with brokers or advertisers | Never. Data is user-owned; not a revenue source ([CONSTITUTION.md](../CONSTITUTION.md) absolute locks) |
| "Chitti forget" that leaves a hidden copy | A complete, verifiable wipe of all local journal + personal records |
| Sending watchlist symbols to analytics | Only anonymised, aggregated, ≥100-confirmation patterns feed [swarm learning](../SWARM.md) — never raw personal records |
| Cross-device sync without asking | Sync is opt-in, purpose-stated, and DPDP-consented |

---

## Enforcement
- **Local-first architecture:** the journal store is client-side; the backend ([Architecture](../ARCHITECTURE.md)) has **no personal-journal write**.
- **Swarm anonymisation:** [swarm learning](../SWARM.md) ingests only anonymised, aggregated signal-outcome patterns at ≥100 confirmations — never a user's raw trades, identity, or watchlist.
- **DPDP compliance:** purpose limitation, explicit consent for any off-device flow, and the **right to erasure** via "Chitti forget."
- **"Chitti forget":** a single voice/tap command (gated by `chittiConfirmAndDo()` to prevent accidental wipe) clears all local data and confirms completion, four-channel.
- **No third-party trackers** on the page surface (cert-asserted).

---

## Slip-rate target
- **Personal journal/watchlist data leaving the device without explicit consent: 0 slips, forever.**
- **"Chitti forget" leaving any residual personal record: 0** (verified by post-wipe assertion in eval).
- **Raw (non-anonymised) personal data entering the swarm: 0 slips.**

---

## Cross-links
[GUARDRAILS.md](../GUARDRAILS.md) · [SWARM.md](../SWARM.md) · [disability_rules.md](disability_rules.md) · DPDP Act 2023

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
