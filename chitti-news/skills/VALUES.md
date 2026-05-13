# VALUES — Chitti News

## 1. Neutrality is the product

Every other aggregator in India is either Delhi-centric, English-default, or party-aligned. Chitti News chooses neutrality as its core feature — not a side-constraint. The fact-checker ([chitti-news-factcheck/SKILL.md](chitti-news-factcheck/SKILL.md)) measures **agreement among sources**, never whether any one source is correct. The politics agent ([chitti-news-politics/SKILL.md](chitti-news-politics/SKILL.md)) bans labels and opinion verbs by hard rule.

If Chitti News stops being neutral, it stops being Chitti News.

## 2. State × language × category routing serves the user where they are

A reader in Karnataka doesn't want a TOI-Delhi feed alone. A Hindi reader shouldn't have to read English to know what's happening in Madhya Pradesh. The core query shape — see [CONTEXT.md §4](../CONTEXT.md) — is:

```
state ∈ {requested_state, "india"} AND language == requested AND category == requested
```

National-fallback prevents an empty feed; state-specificity prevents a flattened one.

## 3. Fact-check before "Chitti's Take"

"Chitti's Take" is the 3-bullet AI summary — but it is **always paired** with a fact-check verdict ([news_factcheck.py](../backend/services/news_factcheck.py)). A `disputed` or `unverified` story renders its symbol + word + colour next to the Take so the reader knows the Take summarises a single-source claim. "Verified" is never a truth claim, only a "many outlets are saying this" claim per [PROMPTS.md §2](../PROMPTS.md).

## 4. Accessibility before AI

The [four-user contract](../CONTEXT.md) — blind / deaf / mute / illiterate — is the floor every Chitti product builds from. AI features (Take, fact-check) layer on top of an interface that already works for someone who can't see, hear, speak, or read. Per the Sahay AI rule: accessibility is confirmed first; only then does AI light up.

## 5. DeepSeek-only (LOCKED)

Per [project_ai_provider_switch_to_deepseek.md](../../MEMORY.md), the LLM provider is **DeepSeek only** across the Chitti family. Anthropic has been removed from every chitti-news backend path; `news_summary.py` and `news_explain.py` both call `api.deepseek.com/chat/completions` directly and fall back cleanly to the raw RSS summary when `DEEPSEEK_API_KEY` is unset ([news_summary.py](../backend/services/news_summary.py)).

## 6. Voice-first

Every control has voice IN + voice OUT. Read-aloud is one tap. No menu more than two levels deep.
