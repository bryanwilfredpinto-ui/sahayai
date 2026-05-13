# PROMPTS — Chitti News

Every LLM prompt template used by the Chitti News backend, quoted verbatim where possible. Each prompt is paired with its caller location, model, and parsing rules.

The full set today consists of:

1. **Chitti's Take** — the 3-bullet summary in [`services/news_summary.py`](backend/services/news_summary.py).
2. **Fact-check rationale** — template-generated in v1, not LLM-generated. Lives in [`services/news_factcheck.py`](backend/services/news_factcheck.py).

The per-category sub-agents (politics / sports / business / tech / entertainment) have **prompt-shaping `SKILL.md` files** in [`skills/`](skills/) that are consumed by Claude Code at runtime, not embedded in the backend services. Those are also listed below.

---

## 1. Chitti's Take prompt

### Caller

[`services/news_summary.py:chittis_take(db, article_id, language)`](backend/services/news_summary.py) — prompt is built inline (system prompt + user message), no `_build_prompt` helper.

### Model

`deepseek-chat` (configurable via `DEEPSEEK_MODEL` env var). Max tokens: `400`. Temperature: `0.3`. Called over the OpenAI-compatible REST endpoint `https://api.deepseek.com/chat/completions` (override via `DEEPSEEK_URL`).

### Language-name lookup

The `{lang_name}` placeholder is resolved from the user's picked `language` code:

| Code | Name passed to the prompt |
|---|---|
| `en` | `English` |
| `hi` | `Hindi` |
| `bn` | `Bangla` |
| `te` | `Telugu` |
| `ta` | `Tamil` |
| `mr` | `Marathi` |
| `kn` | `Kannada` |
| `od` | `Odia` |
| (any other) | (the raw code — fallback) |

### Verbatim template

System prompt (`SYSTEM_PROMPT` in [news_summary.py](backend/services/news_summary.py)):

```text
You are Chitti — a neutral Indian news assistant. Produce exactly 3 bullets summarising an article.

Format (each bullet on its own line, starting with "• " — U+2022 + space):
  • What happened (one factual sentence, no opinion)
  • Why it matters (one impact sentence, neutral)
  • What's next (one forward-looking sentence — only if the article itself says so)

RULES (HARD):
- No commentary, no editorialising, no political tilt, no labels for parties / religions / people.
- Plain words. A 12-year-old should understand.
- Do NOT make up facts not present in the source.
- Output ONLY the 3 bullets — no preamble, no closing line, no markdown headings.
```

User message:

```text
Summarise this article in {lang_name}.

Title: {article.title}
Source: {article.source_name or article.source_slug}
Summary: {(article.summary or '')[:1500]}
```

### Parsing

```python
data = r.json()
text = (data["choices"][0]["message"]["content"] or "").strip()
bullets = [b.lstrip("•").strip() for b in text.splitlines() if b.strip().startswith("•")]
if not bullets:
    bullets = [s.strip() for s in text.split("\n") if s.strip()][:3]
return {..., "bullets": bullets[:3], "model": DEEPSEEK_MODEL}
```

The parser:
1. Reads the OpenAI-compatible `choices[0].message.content` field.
2. Selects only lines that start with `•`.
3. Falls back to splitting on newlines if zero bullets parsed.
4. Clamps to 3 bullets max.

### Fallback (when DeepSeek is unconfigured or fails)

```python
def _fallback(article, language):
    summary = (article.summary or article.title or "").strip()
    bullets = [s.strip() for s in summary.split(".") if s.strip()][:3]
    return {
        "ok": True,
        "source": "fallback",
        "bullets": bullets or [summary[:200]],
        "language": language,
        "note_en": "Chitti's Take is unavailable (no DEEPSEEK_API_KEY configured) — showing the source's own summary instead.",
        "note_hi": "चिट्टी की टेक उपलब्ध नहीं (DEEPSEEK कुंजी सेट नहीं) — मूल स्रोत का सारांश दिखा रहा हूँ।",
    }
```

The fallback is reached in three cases: `DEEPSEEK_API_KEY` empty, the HTTP request raises (`httpx.RequestError` / non-2xx via `HTTPStatusError`), or the JSON body is missing `choices[0].message.content`.

---

## 2. Fact-check rationale (template, not LLM)

### Caller

[`services/news_factcheck.py:_build_rationale(article, matched_sources, matched, verdict, lang)`](backend/services/news_factcheck.py).

v1's implementation uses **hard-coded fixed templates** in two languages — the matching step is deterministic so a templated rationale stays explainable. The DeepSeek upgrade for ambiguous-score rationale is on the v2 roadmap (see [TODO.md](TODO.md) P3).

### Verbatim templates

**English (lang = "en")**

| Verdict | Rendered string |
|---|---|
| `verified` | `f"{n} other trusted sources are running this story; key facts agree."` |
| `partial` | `f"{n} other sources cover this; the broad facts match but details differ."` |
| `disputed` | `"Only 1 other source found and the headline diverges. Check the source link before sharing."` |
| `unverified` | `"No cross-source corroboration yet. Single-source story — may be hyperlocal or just-breaking."` |

**Hindi (lang = "hi")**

| Verdict | Rendered string |
|---|---|
| `verified` | `f"{n} अन्य भरोसेमंद स्रोतों ने यही खबर दी है। ज़्यादातर ब्योरे मेल खाते हैं।"` |
| `partial` | `f"{n} अन्य स्रोतों ने यही खबर दी है — बड़े ब्योरे मेल खाते हैं पर कुछ अंतर हैं।"` |
| `disputed` | `f"केवल 1 अन्य स्रोत मिला और सुर्खियाँ अलग हैं। पुष्टि से पहले स्रोत पर जाएँ।"` |
| `unverified` | `"अभी किसी अन्य स्रोत पर यह खबर नहीं मिली। अकेला स्रोत — खबर पुरानी हो सकती है या क्षेत्रीय।"` |

`{n}` is `len(matched_sources)` — the count of distinct outlets that ran the same story within the last 48 hours.

### Critical guardrail (from spec section 5)

> "verified" is NOT a truth claim — it's a "many outlets are saying this" claim. Every fact-check panel must render with the disclaimer "verify on the original source link before sharing".

This is enforced in the rationale text itself for `disputed`. For the other verdicts, the disclaimer is rendered by the frontend.

---

## 3. Disclaimer text (returned in every feed response, not an LLM prompt but quoted here for completeness)

Lives in [`services/news_db.py:feed()`](backend/services/news_db.py).

**English**
> Chitti News aggregates headlines from public RSS feeds. We do not write the news — we deliver it. Verify with the source link before sharing.

**Hindi**
> चिट्टी न्यूज़ सार्वजनिक RSS फ़ीड से शीर्षक एकत्र करता है। हम खबरें नहीं लिखते — हम पहुँचाते हैं। शेयर करने से पहले मूल स्रोत पर पुष्टि करें।

**WhatsApp share footer (auto-appended by frontend)**
> — Shared via Chitti News. Verify on the original source before sharing further.
> — चिट्टी न्यूज़ के माध्यम से। मूल स्रोत पर पुष्टि करें।

---

## 4. Sub-agent skills (Claude Code runtime prompts)

These are not embedded in the backend — they're consumed by Claude Code when generating Takes / rationales in conversational flows. Each `SKILL.md` has a YAML frontmatter `description` that drives skill auto-selection.

### 4.1 Summarizer — [`skills/chitti-news-summarizer/SKILL.md`](skills/chitti-news-summarizer/SKILL.md)

Frontmatter:
> Summarizer Agent — produces a 3-bullet "Chitti's Take" of any news article in the user's chosen Indian language. Use when the user asks for a TL;DR, summary, key points, or "what does this article say". Inspired by CNA Singapore's FAST button.

Format rules (verbatim from the SKILL.md):

```
• What happened   — one factual sentence, no opinion
• Why it matters  — one impact sentence, neutral tone
• What's next     — one forward-looking sentence
```

Hard rules:

1. **No commentary, no editorial, no political tilt.** State facts. Imply nothing.
2. **Plain words.** A 12-year-old should understand. No jargon. No acronyms without expansion.
3. **No hallucinations.** Use only facts present in the source title + summary. Never invent statistics, names, dates, or quotes.
4. **One sentence per bullet.** ~20 words max.
5. **Output the language the user picked**, not the source's language. Common targets: en, hi, bn, te, ta, mr, kn, od.
6. **Output ONLY the three bullets.** No preamble ("Here is the summary…"), no closing line.
7. Each bullet starts with `• ` (U+2022 + space) and is on its own line.

### 4.2 Fact-checker — [`skills/chitti-news-factcheck/SKILL.md`](skills/chitti-news-factcheck/SKILL.md)

Frontmatter:
> Fact Checker Agent — cross-references a news article against ≥2 other trusted RSS sources in our DB and returns a verdict (verified / partial / disputed / unverified) with rationale. Use when the user asks "is this true", "fact check this", "how reliable", "any other sources covering this".

Verdict table (same 4 tiers as the implementation in `news_factcheck.py`). Trust assumption (verbatim):

> Every source we ingest from `data/sources.json` is treated as "trusted" (public RSS feeds from established Indian news outlets). The fact-check verdict is about **agreement among sources**, NOT about whether any one source is correct — Chitti News does not editorialise.

### 4.3 Politics — [`skills/chitti-news-politics/SKILL.md`](skills/chitti-news-politics/SKILL.md)

Frontmatter:
> Politics sub-agent for Chitti News. Use for any political-news query — elections, parliament, state politics, party announcements, policy debates. Has hard neutrality guardrails: no opinion, no labels, equal coverage across parties, factual reporting only.

Hard guardrails (verbatim):

1. **No labels.** Never describe a party / leader as "right-wing", "left-wing", "communal", "secular", "populist", "fascist", "authoritarian", "liberal", "conservative". State facts. Let the user judge.
2. **No opinion verbs.** Avoid "claimed", "alleged", "boasted", "lashed out", "slammed". Use neutral verbs: "said", "announced", "stated".
3. **Equal coverage.** If a story mentions one party, summarise that party's position. If multiple parties are mentioned, summarise each in equal length.
4. **Quote attribution.** Direct quotes only when the source explicitly attributes them. Never invent or paraphrase as a quote.
5. **No predictions.** "X will win" is opinion. "Polls suggest X is leading by Y%" is reportable.
6. **Election period extra care** — within 48h of any state/national election, the agent MUST refuse to make predictions and MUST cite the Election Commission of India as the authoritative result source.

Politics-specific Take shape:
1. **What happened** — one factual sentence with named participants and the action.
2. **Context** — one neutral sentence locating this within recent events (no historical narrative).
3. **What's next** — one forward-looking sentence about the next procedural step (vote count, hearing, debate), not a prediction of outcome.

### 4.4 Sports — [`skills/chitti-news-sports/SKILL.md`](skills/chitti-news-sports/SKILL.md)

Frontmatter:
> Sports sub-agent for Chitti News. Cricket-first (India context), then football, kabaddi, hockey, badminton, athletics, chess. Use for match results, squad announcements, tournament news, player transfers, injury reports.

Coverage hierarchy: cricket-first; scoreboard format; no controversy framing; no salary speculation; live-scores defer to ESPN Cricinfo.

### 4.5 Business — [`skills/chitti-news-business/SKILL.md`](skills/chitti-news-business/SKILL.md)

Frontmatter:
> Business + markets sub-agent for Chitti News. Indian markets context (Sensex, Nifty, NSE, BSE, RBI), corporate announcements (results, M&A, IPOs), policy (GST, RBI rate, budget), economic data (GDP, inflation, jobs). Moneycontrol-style depth, neutral tone.

Hard rules: always cite the unit (`₹500 cr`, `11.4% YoY`); never recommend buy/sell; defer to Chitti Shares for investment analysis.

### 4.6 Tech — [`skills/chitti-news-tech/SKILL.md`](skills/chitti-news-tech/SKILL.md)

Frontmatter:
> Technology sub-agent for Chitti News. Indian startup ecosystem, global tech (Apple, Google, Microsoft, OpenAI, Anthropic), AI/ML developments, telecom (Jio, Airtel), digital policy (DPDP Act, Digital India). Skip celeb-gadget reviews unless news-worthy.

Hard rules: AI/Indian-startups focus; no fanboy tone; no "AI will replace [job]" speculation without sourced quote; neutral on crypto.

### 4.7 Entertainment — [`skills/chitti-news-entertainment/SKILL.md`](skills/chitti-news-entertainment/SKILL.md)

Frontmatter:
> Entertainment sub-agent for Chitti News. Bollywood, regional cinema (Telugu, Tamil, Malayalam, Bengali), streaming (Netflix, Prime, JioCinema, Hotstar), music releases, awards. Tasteful, no gossip — film news, not paparazzi.

Hard rules: tasteful celebration of artistic achievement; no paparazzi framing; no personal-life speculation; source-cited box-office figures only.

### 4.8 Product-level — [`skills/chitti-news/SKILL.md`](skills/chitti-news/SKILL.md)

Frontmatter:
> Chitti News — state-aware multi-language Indian news aggregator. Aggregates 25+ RSS feeds across English and Hindi (regional languages stubbed for v1.1), serves articles by state × language × category, renders DeepSeek-powered "Chitti's Take" 3-bullet summaries, runs a fact-checker that cross-references ≥2 sources, and offers Read Later / Cancelled folders per device.

This is the top-level skill that loads first when any Chitti News query lands.

---

## 5. Prompt-engineering notes

### Why bullets start with `• ` (U+2022 + space)

- It's a visually clean delimiter that survives copy-paste better than `-` or `*` (which Markdown renderers eat).
- It's the same glyph the frontend uses to render bullets, so the parser's `startswith("•")` filter matches both Claude's output and any fallback.
- A specific Unicode codepoint instead of an ASCII char means the parser is robust against Markdown-flavoured outputs that intersperse `*` or `-`.

### Why max-tokens is 400 (not more)

- 3 bullets × ~20 words × ~1.5 tokens/word ≈ 90 tokens of content.
- 400 leaves headroom for Hindi/Bangla/Tamil tokenisation (those scripts cost ~3x more tokens than English in current tokenisers).
- A short cap also prevents the model from drifting into a long-form essay even if it ignores the "only 3 bullets" instruction.

### Why the article summary is clamped to 1500 chars before being inserted

- Prompt size cost. Most RSS summaries are ≤300 chars anyway; the clamp catches the occasional outlet that ships the full article in the `description` field.

### Why fact-check rationale is template-only in v1

- The matching step (`rapidfuzz.fuzz.token_set_ratio`) is deterministic and explainable. The rationale is just a count + a fixed phrase.
- Generating the rationale via DeepSeek on every call would multiply the API cost without adding accuracy.
- v2 plan: only invoke LLM for the rationale when the matching is ambiguous (e.g. score in 65–75 range).
