"""
services/daily_tip.py
---------------------

AI Daily Tip engine — LOCKED 2026-05-15 per SAHAYAI_MASTER.md §2a and
[CHITTI_NEWS_AI_MASTER_SPEC.md §10a](../../CHITTI_NEWS_AI_MASTER_SPEC.md).

Generates ONE actionable AI tip per (profession, lang, date) tuple by:

  1. Selecting articles ingested in the last 24 h whose source carries
     trust_score >= 70 (Acceptable ⚠️ tier or higher per
     skills/TRUST_VERIFICATION.md).
  2. Asking DeepSeek to pick the most relevant article for the given
     profession and write a single class-5-simplicity actionable tip IN
     the user's language (no translate-from-English — matches the
     no-default-language contract in skills/LANGUAGE_BEHAVIOR.md).
  3. Caching the result in the `daily_tips` table so repeated calls
     (Chitti PA + individual masters with the same profession+lang+date)
     hit cache instead of re-billing DeepSeek.

Honest stubs (§3 SAHAYAI_MASTER.md):

  | reason                          | when                                       |
  |---------------------------------|--------------------------------------------|
  | `deepseek_not_configured`       | DEEPSEEK_API_KEY missing                   |
  | `no_high_trust_article_today`   | 0 articles >= trust 70 ingested in 24 h    |
  | `no_relevant_article`           | DeepSeek replied SKIP                      |
  | `upstream_error` / `upstream_http_<code>` | DeepSeek network or non-200      |
  | `malformed_response`            | DeepSeek reply did not parse               |
  | `empty_response`                | DeepSeek returned empty content            |

The route layer (routes.news_ai.daily_tip_endpoint) maps any non-ok
result to HTTP 503 with the honest reason — never a fake tip on a
low-trust source.

Voice rendering (LOCKED §2 voice strategy — Bhashini is temporary,
substrate is swappable at one URL):

  audio_url is set to the public Voice Factory `/api/voice/speak`
  endpoint. Because Voice Factory v1 is POST-only, the response also
  carries `audio_speak_payload` (the JSON body to POST). When Voice
  Factory v2 ships pre-rendered cache, audio_url collapses to a single
  GET URL with no payload — the response shape stays the same.
"""
from __future__ import annotations

import logging
import os
import re
from datetime import date as date_cls
from datetime import datetime, timedelta
from typing import Optional

import httpx
from sqlalchemy import desc

from config import settings
from database import SessionLocal
from models.articles import Article
from models.daily_tips import DailyTip
from models.sources import Source

log = logging.getLogger("chitti-news-ai.daily_tip")

# Voice Factory cascade — the LOCKED §2 voice substrate. Swappable at one
# URL (matches project_chitti_voice_factory_spec — the contract Bhashini
# will exit through unchanged).
VOICE_FACTORY_URL = os.getenv(
    "VOICE_FACTORY_URL",
    "https://chitti-voice-factory-api.onrender.com/api/voice/speak",
)

# Pre-warmed by the 06:45 IST cron so Chitti PA's 07:00 IST brief almost
# always hits cache for the most common masters. Free-form professions
# fall through to on-demand generation (still cached after first hit).
COMMON_PROFESSIONS_EN = [
    "teacher",
    "student",
    "shopkeeper",
    "farmer",
    "homemaker",
    "driver",
    "small business owner",
]

MIN_SOURCE_TRUST_SCORE = 70.0
ARTICLES_FOR_PROMPT_CAP = 25
DEEPSEEK_TIMEOUT = 45.0
DEEPSEEK_TEMPERATURE = 0.4
DEEPSEEK_MAX_TOKENS = 200


_SYSTEM_PROMPT = (
    "You are Chitti News AI's daily-tip writer. You speak directly to one Indian "
    "master at a time. Your job: read a list of articles published in the last "
    "24 hours and write ONE actionable AI tip relevant to that master's "
    "profession.\n"
    "\n"
    "Hard rules:\n"
    "- Write IN the master's language. Do NOT translate from English afterwards. "
    "Tool names (Cursor, Groq, Llama 3.1, ChatGPT) stay in their original Latin "
    "form.\n"
    "- Class-5 Indian school simplicity. Short sentences. No jargon. No hype.\n"
    "- ONE tip only. 25 to 35 words.\n"
    "- Actionable: tell the master ONE thing to do today.\n"
    "- Ground the tip in ONE of the supplied articles. Return its 0-based index "
    "on a second line as `SOURCE: <idx>` so the system can attach the source URL.\n"
    "- If no article is relevant to this profession, reply exactly `SKIP` and "
    "nothing else.\n"
    "- Never invent tools or prices not present in the supplied articles.\n"
    "- No emojis. No markdown. Plain text.\n"
)


_SOURCE_RE = re.compile(r"SOURCE\s*:\s*(\d+)", re.I)


def _normalize_profession(text: str) -> str:
    s = re.sub(r"\s+", " ", (text or "").strip().lower())
    return s[:80]


def _ist_today() -> date_cls:
    # Asia/Kolkata is UTC+5:30; APScheduler crons use the same offset, so
    # cache lookups and cron generation always agree on "today IST".
    return (datetime.utcnow() + timedelta(hours=5, minutes=30)).date()


def _select_articles(db) -> list[tuple[Article, Source]]:
    since_utc = datetime.utcnow() - timedelta(hours=24)
    return (
        db.query(Article, Source)
        .join(Source, Source.id == Article.source_id)
        .filter(Article.ingested_utc >= since_utc)
        .filter(Source.trust_score >= MIN_SOURCE_TRUST_SCORE)
        .order_by(desc(Source.trust_score), desc(Article.ingested_utc))
        .limit(ARTICLES_FOR_PROMPT_CAP)
        .all()
    )


def _build_user_prompt(profession: str, lang: str, articles: list[tuple[Article, Source]]) -> str:
    bullets = []
    for i, (a, s) in enumerate(articles):
        title = (a.title or "").strip()
        summary = (a.summary or "").strip()[:240]
        bullets.append(
            f"[{i}] ({s.name}, trust={int(s.trust_score or 0)}) {title} — {summary}"
        )
    body = "\n".join(bullets) or "(no articles)"
    return (
        f"Master's profession: {profession}\n"
        f"Master's language code: {lang}\n"
        f"\n"
        f"Last 24h trusted articles:\n{body}\n"
        f"\n"
        f"Now write the tip per the hard rules above. Format:\n"
        f"<tip text in master's language, 25 to 35 words>\n"
        f"SOURCE: <index>\n"
    )


def _parse_tip_and_source(raw: str, n_articles: int) -> tuple[Optional[str], Optional[int]]:
    m = _SOURCE_RE.search(raw)
    if not m:
        return None, None
    try:
        idx = int(m.group(1))
    except Exception:  # noqa: BLE001
        return None, None
    if not (0 <= idx < n_articles):
        return None, None
    tip = _SOURCE_RE.sub("", raw).strip().strip("\"'").strip()
    if not tip:
        return None, None
    return tip, idx


def _call_deepseek(
    profession: str, lang: str, articles: list[tuple[Article, Source]]
) -> tuple[Optional[str], Optional[int], Optional[str]]:
    """Returns (tip_text, source_idx, error_reason). On any error, tip and idx are None."""
    if not settings.deepseek_api_key:
        return None, None, "deepseek_not_configured"

    payload = {
        "model": settings.deepseek_model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(profession, lang, articles)},
        ],
        "temperature": DEEPSEEK_TEMPERATURE,
        "max_tokens": DEEPSEEK_MAX_TOKENS,
    }
    headers = {
        "Authorization": f"Bearer {settings.deepseek_api_key}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=DEEPSEEK_TIMEOUT) as client:
            r = client.post(settings.deepseek_url, json=payload, headers=headers)
    except Exception as e:  # noqa: BLE001
        log.warning("daily_tip deepseek network error: %s", e)
        return None, None, "upstream_error"

    if r.status_code != 200:
        log.warning("daily_tip deepseek http %s: %s", r.status_code, r.text[:200])
        return None, None, f"upstream_http_{r.status_code}"

    data = r.json()
    raw = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()
    if not raw:
        return None, None, "empty_response"
    if raw.upper().startswith("SKIP"):
        return None, None, "no_relevant_article"

    tip, idx = _parse_tip_and_source(raw, n_articles=len(articles))
    if tip is None or idx is None:
        return None, None, "malformed_response"
    return tip, idx, None


def _build_audio_payload(tip_text: str, lang: str) -> dict:
    return {
        "audio_url": VOICE_FACTORY_URL,
        "audio_method": "POST",
        "audio_speak_payload": {"text": tip_text, "language": lang},
        "audio_note": (
            "Voice Factory /api/voice/speak is POST-only in v1. Render audio "
            "by POSTing audio_speak_payload to audio_url. When Voice Factory "
            "ships pre-rendered cache, audio_url becomes a single GET URL — "
            "response shape is unchanged."
        ),
    }


def get_or_generate(
    profession: str, lang: str, on_date: Optional[date_cls] = None
) -> dict:
    """Public entry point used by the daily-tip endpoint and the 06:45 IST cron.

    Returns a dict shaped per CHITTI_NEWS_AI_MASTER_SPEC.md §10a on success,
    or `{"ok": False, "reason": "<honest-reason>"}` when no tip can be
    honestly produced. The route layer maps the latter to HTTP 503.
    """
    prof_norm = _normalize_profession(profession)
    if not prof_norm:
        return {"ok": False, "reason": "profession_required"}
    if not lang:
        return {"ok": False, "reason": "lang_required"}

    target_date = on_date or _ist_today()
    iso = target_date.isoformat()

    with SessionLocal() as db:
        cached = (
            db.query(DailyTip)
            .filter(DailyTip.profession_norm == prof_norm)
            .filter(DailyTip.lang == lang)
            .filter(DailyTip.date_ist == iso)
            .first()
        )
        if cached:
            return {
                "ok": True,
                "tip_text": cached.tip_text,
                "source_article": cached.source_article_url,
                "trust_score": cached.source_trust_score,
                "generated_at": cached.generated_at_utc.isoformat() + "Z",
                "profession": profession,
                "profession_norm": prof_norm,
                "lang": lang,
                "date_ist": iso,
                "cached": True,
                **_build_audio_payload(cached.tip_text, lang),
            }

        articles = _select_articles(db)
        if not articles:
            return {"ok": False, "reason": "no_high_trust_article_today"}

        tip_text, idx, err = _call_deepseek(profession, lang, articles)
        if err is not None:
            return {"ok": False, "reason": err}
        assert tip_text is not None and idx is not None  # for the type checker

        a, s = articles[idx]
        now_utc = datetime.utcnow()
        row = DailyTip(
            profession_norm=prof_norm,
            lang=lang,
            date_ist=iso,
            tip_text=tip_text,
            source_article_url=a.url,
            source_trust_score=float(s.trust_score or 0.0),
            generated_at_utc=now_utc,
        )
        try:
            db.add(row)
            db.commit()
        except Exception as e:  # noqa: BLE001
            db.rollback()
            log.warning("daily_tip cache write failed: %s", e)

        return {
            "ok": True,
            "tip_text": tip_text,
            "source_article": a.url,
            "trust_score": float(s.trust_score or 0.0),
            "generated_at": now_utc.isoformat() + "Z",
            "profession": profession,
            "profession_norm": prof_norm,
            "lang": lang,
            "date_ist": iso,
            "cached": False,
            **_build_audio_payload(tip_text, lang),
        }


def prewarm_common(lang: str = "hi") -> dict:
    """06:45 IST cron job. Pre-generates tips for the common-professions list
    in `lang` so the 07:00 IST Chitti PA brief almost always hits cache.

    Honest about gaps — sources that have not yet ingested any
    trusted-tier article in the last 24 h surface as `skipped`. The next
    cron tick retries; never a fake tip.
    """
    stats: dict = {
        "started_utc": datetime.utcnow().isoformat() + "Z",
        "lang": lang,
        "prewarmed": 0,
        "cache_hit": 0,
        "skipped": 0,
        "errors": [],
    }
    for prof in COMMON_PROFESSIONS_EN:
        result = get_or_generate(prof, lang)
        if not result.get("ok"):
            stats["skipped"] += 1
            stats["errors"].append({"profession": prof, "reason": result.get("reason")})
            continue
        if result.get("cached"):
            stats["cache_hit"] += 1
        else:
            stats["prewarmed"] += 1
    stats["finished_utc"] = datetime.utcnow().isoformat() + "Z"
    log.info("daily_tip prewarm: %s", stats)
    return stats
