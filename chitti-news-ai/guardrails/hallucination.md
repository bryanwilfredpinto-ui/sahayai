# Hallucination Guardrails — Chitti News AI

> The contract for keeping the product factual: extractive over generative,
> deterministic classifier, LLM enhances but never gates, every recommendation
> has a source link.

---

## Principle 1 — Extractive summarization (never invent)

The 🤖 "Chitti's Take" feature on every news card invokes DeepSeek with a strict extractive prompt:

```
You are summarising the article below for a [profession] user.
Use ONLY information present in the article body.
Output exactly 3 bullets. Each bullet ≤ 25 words.
If the article does not address the user's profession, say so honestly.
Do NOT add facts not in the article.
Do NOT speculate.
Do NOT recommend.
[article body]
```

Implementation lives in `backend/services/news_explain.py`. The prompt is fixed; the user does not choose it. Output passes through a post-filter that rejects any bullet containing:
- A URL not in the source article.
- A statistic not in the source article (regex: `\b\d+(\.\d+)?\s?(%|percent|crore|lakh|billion|million|x)\b`).
- A named entity not in the source article (NER over the article body).

Rejected bullets are replaced with: *"Could not find this in the source — read original."* The user is never shown invented content.

---

## Principle 2 — Deterministic classifier (rules-only)

The profession classifier (`backend/services/profession_classifier.py`) is keyword-driven + source-default driven. Specifically:

1. **Keyword matching** — per profession, a hand-curated keyword set. Hit on a keyword adds to confidence.
2. **Source-default tagging** — articles from Medical-source RSS get a baseline doctor/nurse weight; articles from Inc42 / Moneycontrol get a baseline business/CA weight.
3. **Context check** — added 2026-05-23 (commit 7466a91): if an article appears in the Business RSS but mentions cricket / Premier League / "match", the business-classification is dropped (real bug fix: FIFA-in-Amazon-Prime-Day was leaking into Business; cricket was leaking into Business).

LLM is forbidden in this classifier. The CI check `test_no_llm_imports_in_classifier_critical_path` statically scans for forbidden imports (`from anthropic`, `from openai`, `import deepseek_client`).

---

## Principle 3 — LLM enhances, never gates

In every place an LLM call exists, the rules-only fallback ships if the LLM fails. There is no path where "LLM down → user sees error". Examples:

| Feature | LLM use | Rules-only fallback |
|---|---|---|
| 🤖 Chitti's Take | DeepSeek 3-bullet extractor | Honest "explainer unavailable — read original" |
| Salary intelligence prose | DeepSeek phrasing | Curated `data/salary_bands.json` numbers ship raw |
| Language translation (P1/P2/P3) | DeepSeek translation | Closest covered language + honest banner |
| Mission prose smoothing | DeepSeek phrasing | Curated mission card text |

Every LLM call has a 3 s timeout and a try/except that logs to `/api/health` and serves the rules-only output.

---

## Principle 4 — Every recommendation has a source link

The Trust & Quality Agent (Agent 7) blocks any item without a `url` or `source` field. This means:

- Every cert has a URL on `official_domain`.
- Every course has a provider URL.
- Every tool has a homepage URL.
- Every prompt has a `tested_at` + `tested_by` field.
- Every news card has the original article URL.
- Every project has a starter-repo URL (or honest "starter repo coming soon" stub).

If you see a recommendation in production without a source link, it is a P0 bug.

---

## Principle 5 — Honest empty states

When the rules-based pipeline finds zero results, we do NOT ask an LLM to "fill the gap". We render an honest empty state:

| Scenario | Honest message |
|---|---|
| Zero certs for role | *"No verified certs found for 'X'. Showing adjacent-domain options."* |
| Zero courses for role | *"No courses found for 'X'. Try adjacent skill 'Y'."* |
| Zero tools for role | *"No verified tools found for 'X' yet. Be the first to suggest one."* |
| Zero prompts for role | *"No curated prompts yet for 'X'. Be the first — submit one."* |
| Zero news matching profession in last 24 h | *"Quiet day for [profession] news. Try a broader tab."* |

---

## Principle 6 — Salary numbers are dated

Every salary card carries an "as of YYYY-MM" stamp. Never "current". Numbers come from `data/salary_bands.json`, refreshed quarterly with citations to Naukri Index / LinkedIn Talent Insights / NASSCOM AI Skills Premium / Glassdoor India. The LLM is allowed to phrase the surrounding sentence ("On average, an HR generalist with AI skills earns…") but the number is never LLM-generated.

---

## Principle 7 — Future Forecast is bounded

The Future Forecast™ (COSDF L22) is per-profession, 3-year. Forecasts are sourced from McKinsey GenAI Outlook + WEF Future of Jobs + Gartner Future of Work. Each forecast card carries:

- The source name.
- The publication date of the underlying report.
- A "verdict" derived deterministically from the risk + opportunity bands.

We never invent a forecast. If no source covers a profession, we show: *"Forecast coming soon — no covered industry report yet."*

---

## What's NOT a hallucination guardrail

This file does NOT cover trust / fake-cert / URL-host checks — see [`./safety.md`](./safety.md) §"What this product never does". It does NOT cover privacy — see [`./privacy.md`](./privacy.md).

---

## CI checks

- `test_no_llm_imports_in_classifier_critical_path` — static scan.
- `test_explainer_rejects_off_article_facts` — fixture article + planted hallucination → assert post-filter strips it.
- `test_salary_numbers_come_from_curated_file` — randomly sample 10 hubs; assert salary numbers byte-match `data/salary_bands.json`.

---

Last reviewed: 2026-06-06
