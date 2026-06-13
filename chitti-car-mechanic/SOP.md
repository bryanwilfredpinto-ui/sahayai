# SOP — Standard Operating Procedures (10)

| # | SOP | Rule (enforced where) |
|---|---|---|
| 1 | Document intake | Extract → store **locally** (`vault.set`); OCR upload 🟡 (DeepSeek vision). Never upload to a server. |
| 2 | Reminder escalation | Push → SMS → Voice; date+km windows in `reminders()`. Critical service adds Voice+SMS+Push. |
| 3 | Insurance comparison | Always show CSR + indicative saving + "confirm the real quote"; never auto-renew (`insuranceCompare`). |
| 4 | Service scheduling | km OR months, whichever is earlier (`reminders()` service loop). |
| 5 | Tyre recommendation | Based on usage; always "match the size on your sidewall" (`tyreRecommend`/`tyreHealth`). |
| 6 | Scam detection | Quote > 30% above expected → flag overpriced (`scamCheck`). |
| 7 | DIY triage | 🟢/🟡/🔴; safety-critical → 🔴 always, hard override (`diyTriage`, `RULES.never_diy`). |
| 8 | Crisis handling | Family cascade; **Chitti never auto-dials** (`crisisCheck` autoDial=false). User-confirmed only. |
| 9 | Savings tracking | Log realised savings only; track to ₹10k (`savingsTracker`). Never project. |
| 10 | Accessibility | Every card carries the 5-element widget; whole-UI language switch; 🔊 on every result. |

**Cross-cutting:** every result must carry `{confidence, risks[], sources[]}`; when unsure → "see a
mechanic" (never guess); every side-effect confirmed via Golden Rule `chittiConfirmAndDo()`.
