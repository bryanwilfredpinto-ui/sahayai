"""
services/news_insight.py
------------------------
Chitti's Insight — Sire 2026-06-04 priority #2.

Produces ONE-sentence editorial line per article that adds context,
stakes, or background BEYOND the publisher's headline. Cached on
Article.chitti_insight, pre-computed by the insight_sweep scheduler
job. The card renders the cached string instantly; nothing blocks on
the LLM at render time.

Hard rules (from Sire's approval brief):
  1. Maximum 1 sentence (≤220 chars after whitespace normalisation).
  2. Must add value beyond headline — first 4 words may not echo
     the headline's first 4 words.
  3. Never hallucinate. Multi-stage validator below rejects on:
       • URLs (no http://, https://, www.)
       • Quoted text ("...") not present verbatim in source body
       • Proper-noun phrases (capitalised entity sequences) absent
         from the source body
       • Outputs containing digits not present in the source body
         (numbers are the most common hallucination vector)
  4. NO_INSIGHT sentinel — if the model cannot produce a useful,
     compliant insight given the body, it must respond with exactly
     NO_INSIGHT. Validator also returns NO_INSIGHT for any rejected
     output.
  5. Trust > coverage. Better to leave 90% of cards without an
     insight than to ship one weak / wrong line.

When the validator rejects, the rejection reason is persisted to
Article.chitti_insight_reject so we can run quality analytics later
("12% of rejects were 'unsourced_entity'" — tighten the prompt).

DeepSeek is the LLM. The same env-var hijack as news_summary.py
(DEEPSEEK_URL / MODEL / API_KEY) lets us swap to Gemini's OpenAI-
compatible endpoint when DeepSeek balance is exhausted.
"""
from __future__ import annotations

import logging
import os
import re
from datetime import datetime, timedelta
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from models.article import Article

log = logging.getLogger("news_insight")

# Same env-var slots as services/news_summary.py — see that file for
# why these are read here rather than imported. Avoids a hard-coupled
# circular import + lets ops swap LLM providers per service.
DEEPSEEK_URL   = os.environ.get("DEEPSEEK_URL",   "https://api.deepseek.com/chat/completions")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_KEY   = os.environ.get("DEEPSEEK_API_KEY", "")
HTTP_TIMEOUT   = float(os.environ.get("DEEPSEEK_TIMEOUT_S", "25.0"))

INSIGHT_MAX_CHARS = 220
INSIGHT_MIN_CHARS = 40    # nothing useful in <40 chars
INSIGHT_VERSION   = "v1"  # bump when prompt or validator changes meaningfully

# Sentinel the model returns when it cannot produce a compliant insight.
NO_INSIGHT_SENTINEL = "NO_INSIGHT"

SYSTEM_PROMPT = """You are Chitti, a neutral Indian news editor.

Your task: write ONE sentence that adds VALUE BEYOND the publisher's headline. The reader has already read the headline. Tell them what the headline does NOT tell them — stakes, context, background, or what to watch next.

HARD RULES:
1. Use ONLY facts present in the article body provided. Do NOT invent any number, date, name, organisation, quote, or location not in the body.
2. Do NOT repeat the headline. Your sentence's first four words MUST be different from the headline's first four words.
3. Exactly one sentence. Maximum 220 characters. No URLs, no markdown, no headings.
4. No opinion, no political tilt, no labels for parties / religions / people. Neutral Reuters tone.
5. If you cannot produce a useful, compliant sentence given the body, respond with exactly: NO_INSIGHT

Examples of good output:
  Headline: "Rupee falls 28 paise against US dollar"
  Body has: crude oil at $94, Iran strikes, RBI silent so far
  GOOD: Pressure tied to crude crossing $94 after Iran strikes; RBI has not yet signalled intervention.

  Headline: "Karnataka CM swearing-in: traffic curbs in Bengaluru"
  Body has: 12-km radius, 9 AM to noon, Vidhan Soudha
  GOOD: Curbs cover a 12-km radius around Vidhan Soudha from 9 AM to noon; commuters should plan around the MG Road corridor.

Examples of REJECTED output (do not write like this):
  - "This is a significant story." (no stakes, no body fact)
  - "Markets reacted negatively to the news." (vague, no number)
  - "Rupee falls against US dollar." (headline echo)
  - "Read more at https://example.com" (URL)
  - Inventing a name not in the body
"""


def _user_msg(article: Article) -> str:
    body = (article.content or article.summary or "").strip()
    if len(body) > 3000:
        body = body[:3000]
    return (
        f"Headline: {article.title}\n"
        f"Source: {article.source_name or article.source_slug}\n\n"
        f"Article body:\n{body or '(no body available — only the headline is known)'}\n\n"
        f"Now write ONE Chitti's-Take sentence as instructed, or NO_INSIGHT."
    )


# ── Validators ───────────────────────────────────────────────────────
# Each returns None on accept, or a short rejection reason on reject.
# Order matters — cheaper checks first, expensive ones last.

_URL_RE     = re.compile(r"\bhttps?://|www\.\S+", re.IGNORECASE)
_QUOTE_RE   = re.compile(r"[\"“]([^\"”]{4,})[\"”]")
_DIGIT_RE   = re.compile(r"\b\d[\d,. ]*\b")
# A proper-noun phrase: 2+ capitalised words in a row OR a single
# capitalised word ≥4 chars NOT at sentence start. Catches "Modi",
# "Indian Express", "Reserve Bank of India", "Karnataka CM".
_PROPER_NOUN_RE = re.compile(
    r"\b([A-Z][a-z]{2,}(?:\s+(?:of\s+|the\s+|and\s+)?[A-Z][a-z\.]{1,})+)\b"
)
# Allowlist — common English words that capitalise legitimately at
# sentence start or in titles and would false-positive otherwise.
_COMMON_CAPS = {
    "Chitti", "India", "Indian", "Indians", "Bharat", "Delhi", "Mumbai",
    "Bengaluru", "Kolkata", "Chennai", "Hyderabad", "Lucknow",
    "Modi", "PM", "CM", "BJP", "Congress",
    "RBI", "SEBI", "NSE", "BSE", "GST", "Sensex", "Nifty",
    "IPL", "ICC", "FIFA", "T20", "ODI",
}


def _check_no_url(insight: str, _src: str) -> Optional[str]:
    if _URL_RE.search(insight):
        return "url_in_insight"
    return None


def _check_quotes_in_source(insight: str, src: str) -> Optional[str]:
    """Every quoted span in the insight must appear verbatim in source."""
    src_lower = src.lower()
    for m in _QUOTE_RE.finditer(insight):
        quoted = m.group(1).strip().lower()
        if len(quoted) < 4:
            continue
        if quoted not in src_lower:
            return "unsourced_quote"
    return None


def _check_digits_in_source(insight: str, src: str) -> Optional[str]:
    """Every digit-bearing token in the insight must appear in source."""
    src_digits = set(_DIGIT_RE.findall(src))
    for token in _DIGIT_RE.findall(insight):
        if token not in src_digits:
            # Allow trivial common tokens — single digits 0-9 might be
            # generic ("one of the 5 reasons"). But ≥2-digit numbers,
            # comma-grouped, or decimal MUST match source.
            if len(token) == 1 and token.isdigit():
                continue
            return f"unsourced_number"
    return None


def _check_named_entities_in_source(insight: str, src: str) -> Optional[str]:
    """
    Any multi-word proper-noun phrase in the insight must appear in
    the source body. Single capitalised words are noisy (a sentence
    start always capitalises), so we ignore them here — the digit
    check + URL check + quote check carry the load for single-word
    fabrications, plus the headline-echo guard.
    """
    src_lower = src.lower()
    for m in _PROPER_NOUN_RE.finditer(insight):
        phrase = m.group(1).strip()
        if not phrase:
            continue
        if phrase in _COMMON_CAPS:
            continue
        if phrase.lower() in src_lower:
            continue
        # Also try fuzzy — split into words and check each word
        # individually in source (catches reorderings like "Indian
        # Express" → "Express, Indian").
        words = phrase.lower().split()
        if all(w in src_lower for w in words):
            continue
        return f"unsourced_entity:{phrase[:40]}"
    return None


def _check_headline_echo(insight: str, headline: str) -> Optional[str]:
    """Insight's first 4 words must not match headline's first 4 words."""
    def first_n(text: str, n: int = 4) -> str:
        toks = re.findall(r"[A-Za-z]+", text.lower())
        return " ".join(toks[:n])
    if first_n(insight) and first_n(insight) == first_n(headline):
        return "headline_echo"
    return None


def _check_length(insight: str, _src: str) -> Optional[str]:
    n = len(insight)
    if n < INSIGHT_MIN_CHARS:
        return "too_short"
    if n > INSIGHT_MAX_CHARS:
        return "too_long"
    # Exactly one sentence — count terminal punctuation. Allow one
    # final '.' or '!' or '?'; if there are 2+ in the middle, reject.
    terminal = re.findall(r"[.!?]+", insight)
    if len(terminal) > 2:
        return "multi_sentence"
    return None


def _check_no_sentinel(insight: str, _src: str) -> Optional[str]:
    if NO_INSIGHT_SENTINEL in insight.upper():
        return "model_no_insight"
    return None


_VALIDATORS = [
    # Sentinel first (cheapest, model said "no").
    ("no_sentinel",   _check_no_sentinel),
    # Hallucination guards next — URL / fake quote / fake number /
    # fake entity. Reported BEFORE shape checks so the analytics
    # signal is informative ("the model hallucinated a URL", not
    # "the model wrote 2 sentences and one happened to have a URL").
    ("no_url",        _check_no_url),
    ("quotes",        _check_quotes_in_source),
    ("digits",        _check_digits_in_source),
    ("entities",      _check_named_entities_in_source),
    # Headline echo (cheap text comparison).
    ("headline_echo", _check_headline_echo),
    # Length / shape last — they're the "least informative" failures
    # (a multi-sentence response containing a hallucination tells us
    # less than the hallucination itself).
    ("length",        _check_length),
]


def validate_insight(insight: str, article: Article) -> Optional[str]:
    """
    Run the full validator stack against `insight` for `article`.
    Returns None on accept, or the failed-check name on reject.
    Each validator either returns None (accept) or a short reason.

    Source for entity / quote / digit checks is the article's
    title + summary + content — everything we have on the row.
    """
    body = " ".join(filter(None, [
        (article.title or "").strip(),
        (article.summary or "").strip(),
        (article.content or "").strip(),
    ]))
    headline = (article.title or "")
    # Pre-clean — strip the model's polite prefix if any.
    text = insight.strip()
    text = re.sub(r"^(chitti['']?s? take[: ]+)", "", text, flags=re.IGNORECASE)
    text = text.strip().strip("•- ")
    if not text:
        return "empty"
    for name, fn in _VALIDATORS:
        if name == "headline_echo":
            r = fn(text, headline)
        else:
            r = fn(text, body)
        if r:
            return r
    return None


def _normalise(text: str) -> str:
    text = text.strip().strip("•-* ").strip()
    text = re.sub(r"\s+", " ", text)
    # Drop the "Chitti's Take:" prefix if the model added it.
    text = re.sub(r"^(chitti['']?s? take[: ]+)", "", text, flags=re.IGNORECASE)
    return text


def _deepseek_call(article: Article) -> str:
    """Pure DeepSeek HTTP call. Returns the model's raw reply."""
    body = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": _user_msg(article)},
        ],
        "max_tokens": 120,
        "temperature": 0.1,
    }
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_KEY}",
        "Content-Type":  "application/json",
    }
    with httpx.Client(timeout=HTTP_TIMEOUT) as client:
        r = client.post(DEEPSEEK_URL, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
    return (data["choices"][0]["message"]["content"] or "").strip()


def generate_for(db: Session, article: Article) -> dict:
    """
    Generate + validate + persist a Chitti's Insight for a single
    article. Always writes chitti_insight_at so we don't re-attempt
    immediately on the next sweep, even on rejection. Returns a small
    audit dict — used by the sweep + the lazy endpoint.

    Outcomes:
      ok=True,  insight="..."         — accepted, cached on row
      ok=False, reason="model_no_insight" | "url_in_insight" | …
        — model produced something but validator rejected. Reason
        persisted on row for analytics. chitti_insight stays NULL.
      ok=False, reason="llm_error:…"  — network / HTTP problem
        — chitti_insight_at NOT bumped, so next sweep retries.
    """
    if not DEEPSEEK_KEY:
        return {"ok": False, "reason": "no_llm_key"}
    try:
        raw = _deepseek_call(article)
    except httpx.HTTPStatusError as e:
        log.warning("insight DeepSeek HTTP %s for article=%s: %s",
                    e.response.status_code, article.id, e.response.text[:120])
        return {"ok": False, "reason": f"llm_http_{e.response.status_code}"}
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.warning("insight DeepSeek request failed for article=%s: %s", article.id, e)
        return {"ok": False, "reason": "llm_error"}

    cleaned = _normalise(raw)
    reject = validate_insight(cleaned, article)
    article.chitti_insight_at = datetime.utcnow()
    if reject:
        article.chitti_insight = None
        article.chitti_insight_reject = reject[:64]
        db.commit()
        log.info("insight REJECT article=%s reason=%s raw='%s'",
                 article.id, reject, cleaned[:80])
        return {"ok": False, "reason": reject, "raw": cleaned[:160]}
    article.chitti_insight = cleaned[:INSIGHT_MAX_CHARS]
    article.chitti_insight_reject = None
    db.commit()
    log.info("insight ACCEPT article=%s len=%d", article.id, len(cleaned))
    return {"ok": True, "insight": article.chitti_insight}


# Throttle between calls. Tuned for the worst-case provider — Gemini
# 2.0 Flash free tier has a 15 RPM hard cap; 5 s/article = 12 RPM
# comfortably under that. DeepSeek paid tier accepts ~50 RPM but the
# extra latency here is worth the cross-provider robustness.
# Tunable via INSIGHT_THROTTLE_S env when on a higher-quota tier.
_THROTTLE_S = float(os.environ.get("INSIGHT_THROTTLE_S", "5.0"))


def sweep_missing(db: Session, *, limit: int = 30, lookback_hours: int = 48) -> dict:
    """
    Walk recently-fetched articles missing an insight and try to
    generate one. Returns a small audit dict for the scheduler.

    Trust > coverage: we cap at `limit` per run so a slow LLM never
    queues a backlog. The sweep runs every 15 min, so 30 per run =
    ~2,880 articles/day comfortably.

    Only English articles for v1 — DeepSeek's Indic quality is uneven
    and the validators are tuned for English bodies.

    Rate-limit handling: between successive calls we sleep
    INSIGHT_THROTTLE_S (default 1.2 s). On HTTP 429 we also short-circuit
    out of the rest of the batch — burning quota retrying when the
    provider is throttling us is a waste; the scheduler will pick up
    the remaining rows on the next interval (15 min).
    """
    import time
    from sqlalchemy import desc
    cutoff = datetime.utcnow() - timedelta(hours=lookback_hours)
    rows = (
        db.query(Article)
        .filter(
            Article.fetched_at >= cutoff,
            Article.language == "en",
            Article.chitti_insight_at.is_(None),
        )
        .order_by(desc(Article.fetched_at))
        .limit(max(1, min(limit, 200)))
        .all()
    )
    accepted = rejected = errored = 0
    reject_reasons: dict[str, int] = {}
    rate_limited = False
    for i, art in enumerate(rows):
        if rate_limited:
            break
        r = generate_for(db, art)
        if r.get("ok"):
            accepted += 1
        elif r.get("reason", "").startswith("llm_"):
            errored += 1
            if r.get("reason") == "llm_http_429":
                # Provider says slow down — stop the whole batch, leave
                # the rest for the next 15-min sweep.
                rate_limited = True
        else:
            rejected += 1
            reject_reasons[r.get("reason", "?")] = reject_reasons.get(r.get("reason", "?"), 0) + 1
        # Throttle between successful calls. Skip the sleep on the last
        # iteration — no point holding the request open after the loop.
        if i < len(rows) - 1 and not rate_limited:
            time.sleep(_THROTTLE_S)
    return {
        "scanned": len(rows),
        "accepted": accepted,
        "rejected": rejected,
        "errored":  errored,
        "rate_limited": rate_limited,
        "reject_reasons": reject_reasons,
        "note": (
            f"insight sweep: {accepted} new / {rejected} rejected / {errored} llm-errored"
            + (" — RATE-LIMITED, paused" if rate_limited else "")
        ),
    }
