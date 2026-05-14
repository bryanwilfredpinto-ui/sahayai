# Chitti News AI — TRUTH_SOURCES

Where Chitti looks before claiming anything is true.

## Tier 1 — Vendor primary

| Domain | Why |
|---|---|
| `openai.com/news/rss.xml` | Source of truth for OpenAI model / pricing / quota changes |
| `anthropic.com/news/rss.xml` | Source of truth for Claude (Opus / Sonnet / Haiku) |
| `ai.googleblog.com/feeds/posts/default` | Google AI announcements |
| `deepmind.com/blog/feed/basic` | DeepMind research releases |
| `ai.meta.com/blog/feed` | Llama family + Meta AI |
| `blogs.microsoft.com/ai/feed` | Copilot family, Azure AI |
| `huggingface.co/blog/feed.xml` | Open-model launches |
| `api.deepseek.com` (pricing JSON, when published) | DeepSeek's own |

## Tier 2 — Independent tech press

| Domain | Why |
|---|---|
| `techcrunch.com/tag/artificial-intelligence/feed` | Aggregated launch coverage |
| `thegradient.pub/feed` | Quality long-form, low noise |
| `technologyreview.com/tag/artificial-intelligence/feed` | MIT Tech Review |
| `arstechnica.com` (AI tag) | Editorial rigour |

## Tier 3 — Community signal

| Source | Mode |
|---|---|
| Hacker News RSS | `news.ycombinator.com/rss` |
| Reddit `r/LocalLLaMA`, `r/MachineLearning`, `r/ChatGPTPro` | `.rss` per sub |
| GitHub Trending (AI) | HTML scrape |
| Hugging Face new models | RSS |

## Tier 4 — Fact-check references

| Source | Use |
|---|---|
| NewsGuard | Source-trust calibration (Layer 4) |
| Snopes | Specific claim verification |
| Poynter | Media literacy reference |

## What is NOT a source

- Anonymous Twitter / X threads.
- LinkedIn opinion posts.
- Affiliate blog reviews.
- Crypto / pump-style newsletters.
- Any vendor's owned "comparison" page about its own tool.

## Source-of-truth conflicts

When two Tier-1 sources contradict each other (e.g. vendor blog vs vendor
docs), Chitti **shows both** with their timestamps and lets the user pick.
Never picks a winner. Same rule as [Chitti News](../../chitti-news/)
political coverage.

## Where the truth sources live

Seeded into `backend/data/sources.json`. The list is auditable — every
source has a trust score, a last-verified date, and a public reason for its
inclusion.