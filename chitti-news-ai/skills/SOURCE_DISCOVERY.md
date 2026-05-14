# Chitti News AI — SOURCE_DISCOVERY

How Chitti News AI finds **new free sources** without paying for any of them
and without trusting any of them blindly.

## Discovery cadence

Weekly cron: Sunday 03:00 IST. Runs immediately *before* the trust-score
recompute (Sunday 04:00) so newly accepted sources land with fresh scores.

## Methods

### 1. GitHub resource repositories

Monitor curated free-AI lists. Example seeds:

- `free-ai-bible` (700+ free AI APIs and tools, weekly updates)
- `awesome-llm`, `awesome-prompt-engineering`, `awesome-rag`
- `huggingface/open-source-ai-papers`

Method: pull README + extract URLs → push into the Layer 1 verification
queue. Never auto-add.

### 2. RSS feed discovery from existing sources

Parse the blogrolls + `Resources` pages + `Recommended reading` sections of
sources already at trust score ≥ 80. Extract outbound RSS links.

Reasoning: a trusted source's recommended reading is a high-prior signal.

### 3. Community submissions

`POST /api/news-ai/sources/submit` accepts a URL + a one-line description
from any user. The submission lands in the verification queue. Accepted
submissions are credited on the Chitti voice / community Hall of Fame
(same social-reward model as the [voice donation
strategy](../../SAHAYAI_MASTER.md#voice-strategy--locked)).

### 4. AI-powered search — 5-tier progressive discovery

Modelled on the News Llama 5-tier approach.

| Tier | Method | When to use |
|---|---|---|
| 1 | Predefined domain patterns | Fast lookup for known domains (openai.com, anthropic.com) |
| 2 | LLM topic matching (DeepSeek) | Find relevant sources by topic |
| 3 | Broad multi-source aggregator | Discovery across listed aggregators |
| 4 | Exact-match fallback | Last-known patterns for specific tools |
| 5 | Web search | Last resort — DuckDuckGo / Brave Search via free API |

Each tier escalates only if the previous tier returns 0 hits.

## Verification queue

Every discovered URL — regardless of method — enters
`discovery_queue` with status `pending_layer_1`. Nothing reaches the public
seed list until Layer 1 of [`TRUST_VERIFICATION.md`](TRUST_VERIFICATION.md)
passes.

## Hall of Fame

Accepted community-submitted sources surface the submitter's display name on
`chitti_voice_hall_of_fame.html` (shared Hall of Fame with voice donors and
ISL contributors). The submitter can opt out — submission alone does not
grant disclosure.

## What this surface refuses to do

- **No auto-add.** Even GitHub-list sourced URLs go through Layer 1.
- **No paid promo.** A vendor offering to pay for inclusion is auto-rejected
  and noted in the admin dashboard.
- **No fast-track.** Community submission does not skip checks.