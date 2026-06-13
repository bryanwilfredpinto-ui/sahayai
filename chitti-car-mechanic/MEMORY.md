# MEMORY (State Management) — Chitti Car Mechanic

| Memory | Storage | Duration | Forget |
|---|---|---|---|
| Vehicle Twin (`twin`) | `localStorage` `chitti_carmech_twin_v1` | persistent | `twin.forget()` / "Chitti forget" |
| Document Vault (`vault`) | `localStorage` `chitti_carmech_vault_v1` | persistent | `vault.forget()` |
| Savings ledger | inside Twin (`twin.savings`) | persistent | with Twin |
| Language choice | `localStorage` `chitti_lang` (substrate) | persistent | settings |
| Disability profile | substrate (`chitti_a11y.js`) | persistent, synced across Chittis on device | settings |
| Session UI state (active tab) | in-memory | session | — |

## Rules
- **Local-only.** Nothing about the user's vehicle leaves the device by default (Article 4).
- **Rule tables are versioned, not memory.** `RULES.version='1.0.0'` — change the table, never the
  logic; bump version on any band/threshold change so results stay reproducible/auditable.
- **"Chitti forget"** wipes Vault + Twin (and removes the user's swarm contribution upstream — tombstone keeps counts honest).
- **Twin prefill on load** is best-effort and silent if absent (page `DOMContentLoaded` handler).
