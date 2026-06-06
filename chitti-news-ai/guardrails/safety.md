# Safety — Chitti News AI

> Per [`../COSDF.md`](../COSDF.md) §LEVEL 7 (lines 333-355). The NEVER + ALWAYS
> contract enforced at every layer of the swarm. Rules-only, no LLM in the
> critical path. Fail-open semantics.

---

## The rules-only critical path

The product's reliability story is:

> **Every classification, ranking, modality, and trust decision is rules-only.
> No LLM is on the critical path. If DeepSeek / Claude / Gemini all go down,
> the product still serves correct, FREE-first, role-relevant content.**

This is enforced by CI: [`../backend/tests/test_fail_open.py`](../backend/tests/test_fail_open.py) boots the backend with ALL LLM environment variables stripped (`DEEPSEEK_API_KEY=`, `CLAUDE_API_KEY=`, `GEMINI_API_KEY=`) and asserts:

- `rss_fetcher` polls 8 sources and persists.
- `profession_classifier` returns non-empty mappings for 13/13 hubs.
- `streams_ingestor` writes ≥ 1 article per active stream.
- `/api/news-ai/feed/news` returns 200 with non-empty results.
- The Trust & Quality Agent's URL-host check passes.

This test must stay GREEN for any commit to ship.

---

## Where LLMs are allowed (the enhancement-only path)

LLMs may enhance but never gate:

| Allowed | Why it's safe |
|---|---|
| 🤖 "Chitti's Take" 3-bullet explainer | Extractive over the article; user explicitly tapped 🤖 to invoke; failure surfaces honest "explainer unavailable" |
| Language Agent translation for P1/P2/P3 langs | Curated table is the fallback; honest banner when LLM is the path |
| Salary intelligence enrichment | Only used for prose; numeric figures come from curated `data/salary_bands.json` |
| Mission card prose smoothing | Card structure is rules-only; LLM only varies the wording |

In every case, the LLM call has a 3 s timeout. If it fails, the rules-only output ships unchanged.

---

## Fail-open contract

When a downstream service (DeepSeek, Bhashini, Voice Factory tier A) is down:

1. Log the failure to `/api/health` per the [project_business_continuity_plan_locked](../../SAHAYAI_MASTER.md) Layer 5 cascade.
2. Continue serving the rules-only response.
3. Render an honest banner on the affected card:
   - *"Chitti's Take temporarily unavailable — refreshing soon"*
   - *"Voice in your language coming soon — using English"*
4. Never silently downgrade without telling the user.
5. Never return HTTP 500 to the frontend just because an enhancement layer failed — only return 500 when the rules-only path itself errors.

---

## What this product never claims to be

- ❌ Not medical advice. The Doctor / Nurse hubs surface clinical prompts and tools but EVERY clinical prompt carries: *"Never substitute for clinical judgement. Discuss with attending."*
- ❌ Not legal advice. The Lawyer hub surfaces drafting prompts but every output carries: *"Not a substitute for legal counsel. Verify with bar-registered attorney."*
- ❌ Not financial advice. The CA / Accountant hub surfaces analysis prompts but every output carries: *"Not investment / tax advice. Verify with your CA / registered advisor."*
- ❌ Not a job board. We surface jobs RADAR (signals), not listings. We never claim a job placement.
- ❌ Not a diagnosis tool. The Health-adjacent prompts are for clinician productivity, not patient self-diagnosis.

These disclaimers are rendered as the per-card warning field (see [`../swarm/prompt_agent.md`](../swarm/prompt_agent.md) §Rules item 4) and as a persistent footer on the Doctor / Lawyer / CA hubs.

---

## What this product never does

1. ❌ Never recommends a paid certification without surfacing the FREE alternative first (when one exists).
2. ❌ Never recommends a cert from an issuer on the deny-list (`data/fake_issuers_denylist.json`).
3. ❌ Never makes "X figure income" / "guaranteed job" / "double salary" claims (regex-scanned at ingest).
4. ❌ Never sends the User Disability Profile to the backend — localStorage only.
5. ❌ Never sends the chittiCoachProfile_v1 schema to the backend — localStorage only.
6. ❌ Never auto-plays audio without an explicit user gesture, EXCEPT when `disability_profile.blind` or `.illiterate` is set (in which case the welcome utterance plays).
7. ❌ Never uses color-only signals to convey importance.
8. ❌ Never uses an LLM to invent a course / cert / tool that doesn't exist.
9. ❌ Never recommends content from a deny-listed source.
10. ❌ Never silently degrades — every degradation has an honest user-visible banner.

---

## Sire-level overrides (locked decisions)

Per the project's locked decisions ([`../../SAHAYAI_MASTER.md`](../../SAHAYAI_MASTER.md) §2):

- **DeepSeek only** for all LLM operations. Anthropic / OpenAI direct calls are stripped from this codebase.
- **No autonomy** — the Chitti Golden Rule (LOCKED 2026-05-23) means Chitti never side-effects (call / SMS / WA / email / UPI) without explicit user confirmation. Chitti News AI is a read-only / advise-only product so this rule is satisfied by construction — but if we ever add "apply for this cert" flows, they MUST go through `chittiConfirmAndDo()`.
- **No emergency-keyword scanning** in this Chitti — that's Vaani's job (per the [emergency protocol](../../SAHAYAI_MASTER.md)).

---

## Verification

- CI: `test_fail_open.py` — runs on every PR.
- Monthly: manual disable of all LLM env vars in production for 10 minutes; verify product still serves; restore.
- Quarterly: Trust deny-list review with Sire's sign-off.

---

Last reviewed: 2026-06-06
