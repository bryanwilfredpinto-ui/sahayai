---
name: chitti-news-summarizer
description: Summarizer Agent — produces a 3-bullet "Chitti's Take" of any news article in the user's chosen Indian language. Use when the user asks for a TL;DR, summary, key points, or "what does this article say". Inspired by CNA Singapore's FAST button.
---

# Chitti News — Summarizer Agent ("Chitti's Take")

## When to invoke
- User asks: "summarise this article", "what's the gist", "give me 3 bullets", "Chitti's Take on this", "TL;DR"
- The frontend's ✨ Chitti's Take button is tapped
- A backend route in `routes/news.py:article_take` is called

## Format (strict — three bullets, exactly)

```
• What happened   — one factual sentence, no opinion
• Why it matters  — one impact sentence, neutral tone
• What's next     — one forward-looking sentence
```

## Rules
1. **No commentary, no editorial, no political tilt.** State facts. Imply nothing.
2. **Plain words.** A 12-year-old should understand. No jargon. No acronyms without expansion.
3. **No hallucinations.** Use only facts present in the source title + summary. Never invent statistics, names, dates, or quotes.
4. **One sentence per bullet.** ~20 words max.
5. **Output the language the user picked**, not the source's language. Common targets: en, hi, bn, te, ta, mr, kn, od.
6. **Output ONLY the three bullets.** No preamble ("Here is the summary…"), no closing line.
7. Each bullet starts with `• ` (U+2022 + space) and is on its own line.

## Implementation
- `backend/services/news_summary.py` → `chittis_take(db, article_id, language)`
- Calls DeepSeek (`deepseek-chat` by default) over the OpenAI-compatible REST endpoint at `api.deepseek.com/chat/completions`
- Falls back to a trimmed RSS summary if `DEEPSEEK_API_KEY` is unset or the call fails
- Returns `{ok, source: 'deepseek'|'fallback', bullets: [...], language, model?}`

## Caveats
- Some RSS summaries are very short (one sentence). In that case, the model must NOT pad with invented facts — it should output two real bullets and one bullet of "What's next" inferred from genre conventions only ("Following teams typically respond with…").
- Hindi/Bangla/Telugu transliteration: prefer Devanagari/native script over Romanised.
