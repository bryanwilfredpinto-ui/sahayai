# DEVILS_ADVOCATE — Chitti News

Eight sharp critiques. Every one of them is at least partly true. We answer each in the open and use that answer to set the next quarter's roadmap.

## 1. "Neutral coverage is itself a position when one side is lying."

Yes. The fact-checker partially mitigates by surfacing single-source / divergent-headline stories as `disputed` or `unverified` — but a coordinated multi-outlet falsehood would clear the `verified` bar. We mitigate by treating "verified" as "outlets agree", not "true", and saying so in the rationale. The v2 fact-checker ([TODO.md §P3](../TODO.md)) adds entity-verb extraction so paraphrased falsehoods don't accumulate as agreement.

## 2. "The 12-language picker is performative when only English and Hindi feeds are populated."

True today. Bangla, Telugu, Tamil, Odia have *partial* coverage — and most regional vernacular outlets ship broken RSS, no RSS, or geoblocked RSS ([CONTEXT.md §3](../CONTEXT.md)). v1.1 builds an HTML-scrape worker for the top regional outlets. Until then, the picker is honest about partial coverage by surfacing fewer cards — it does not fake density.

## 3. "The fact-checker is RSS-only and misses social-platform misinformation."

True. A claim trending on Twitter/Reddit/WhatsApp won't appear in our trusted-source database. Chitti News is **not** a misinformation tracker. It is a cross-RSS agreement-checker. We say so explicitly in the verdict rationale.

## 4. "RSS feeds are dying — major outlets shut them down or restrict them."

Real risk. Tribune, Anandabazar, Mathrubhumi, Manorama all currently disabled per [sources.json](../backend/data/sources.json) `enabled:0` rows with rationale notes. The Bryan-supplied fallback policy: surface a "source unavailable" tag and never silently drop a feed.

## 5. "Title-similarity fact-check (rapidfuzz ≥ 70) is fragile."

Yes — paraphrased headlines like "RBI cuts repo rate" vs "Central bank lowers benchmark" miss. The fix is on the v2 roadmap ([TODO.md §P3](../TODO.md)): entity + verb extraction via LLM, then sentence-embedding similarity as a second signal.

## 6. "The summarizer can hallucinate even with strict prompt rules."

Yes. The 3-bullet structure ([PROMPTS.md §1](../PROMPTS.md)) ships a prompt-level guardrail but no post-hoc fact-verification. Mitigation: bullets ≤ 20 words, max_tokens=400, fallback to verbatim RSS summary on any error. Acceptable risk because the original source link is one tap away.

## 7. "Equal coverage across parties = false balance."

Sometimes. The politics agent ([chitti-news-politics/SKILL.md](chitti-news-politics/SKILL.md)) summarises what each named party said, in equal length. If only one party has spoken, only that party gets covered — we don't manufacture quotes for balance. That's the only form of "balance" Chitti News supports.

## 8. "DeepSeek cost will dominate as feed volume grows."

Mitigated by design. The Take is generated **on demand** (per article tap), not at ingest, and the fact-check rationale is template-rendered in v1 to avoid multiplying the LLM cost ([PROMPTS.md §5](../PROMPTS.md)). DeepSeek's pricing — locked as the sole provider ([MEMORY.md](../../MEMORY.md)) — is the cost-anchor; caching on `news.fact_checks` at 6h further dampens spend.
