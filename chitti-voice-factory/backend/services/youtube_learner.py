"""
services/youtube_learner.py — Teach Chitti from any YouTube video in the
target language.

Flow
----
1. User submits a YouTube URL on a language page.
2. We extract the video ID with a regex (no API key required).
3. We pull the transcript with `youtube-transcript-api` — preferring the
   target language's track; falling back to auto-generated tracks if a
   human-authored track isn't available.
4. The transcript text is chunked and merged into the language's fluency
   corpus, tagged with `textbook_source="community"` and
   `source="youtube:<video_id>"`.
5. The video record persists at `data/fluency/<lang>/videos.json` so
   subsequent ingest runs see what has been added by users.

Honesty contract
----------------
- Every chunk records the exact YouTube URL — auditable.
- Auto-generated transcripts are flagged with `auto_generated=True` in the
  video record (translation/asr quality may be lower).
- A per-language cap of MAX_VIDEOS_PER_LANG prevents abuse.
- A YouTubeProcessingError carries a machine-readable error code so the UI
  can present a user-friendly message (no silent failures).
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

log = logging.getLogger("youtube_learner")

# Optional import — endpoints downgrade gracefully when the lib isn't installed.
# Targets youtube-transcript-api >= 1.0 (post-API-rewrite). The 0.6.x line is
# broken against current YouTube responses; do not pin below 1.0.
try:
    from youtube_transcript_api import (  # type: ignore
        NoTranscriptFound,
        TranscriptsDisabled,
        VideoUnavailable,
        YouTubeTranscriptApi,
    )
    HAS_YT = True
except Exception:  # noqa: BLE001
    HAS_YT = False
    log.warning("youtube-transcript-api not installed — /videos endpoints will return 503")


MAX_VIDEOS_PER_LANG = 10
MIN_TRANSCRIPT_CHARS = 200   # below this we treat as empty


@dataclass
class YouTubeProcessingError(Exception):
    code: str
    detail: str = ""

    def __str__(self) -> str:
        return f"{self.code}: {self.detail}" if self.detail else self.code


@dataclass
class VideoRecord:
    url: str
    video_id: str
    added_at: str
    processed_at: Optional[str] = None
    auto_generated: Optional[bool] = None
    transcript_chars: int = 0
    transcript_chunks: int = 0
    error: Optional[str] = None
    title: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


# ── Video ID extraction ──

_YT_PATTERNS = [
    re.compile(r"(?:youtube\.com/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})"),
    re.compile(r"(?:youtu\.be/)([A-Za-z0-9_-]{11})"),
    re.compile(r"(?:youtube\.com/embed/)([A-Za-z0-9_-]{11})"),
    re.compile(r"(?:youtube\.com/shorts/)([A-Za-z0-9_-]{11})"),
    re.compile(r"^([A-Za-z0-9_-]{11})$"),  # bare ID
]


def extract_video_id(url: str) -> Optional[str]:
    """Return the 11-char YouTube video ID, or None."""
    url = (url or "").strip()
    for pat in _YT_PATTERNS:
        m = pat.search(url)
        if m:
            return m.group(1)
    return None


# ── Per-language video store ──

def videos_path(lang_dir: Path) -> Path:
    return lang_dir / "videos.json"


def load_videos(lang_dir: Path) -> list[VideoRecord]:
    p = videos_path(lang_dir)
    if not p.exists():
        return []
    try:
        raw = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        log.warning("videos.json corrupt at %s: %s", p, e)
        return []
    return [VideoRecord(**d) for d in raw]


def save_videos(lang_dir: Path, videos: list[VideoRecord]) -> None:
    p = videos_path(lang_dir)
    p.write_text(
        json.dumps([v.to_dict() for v in videos], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def add_video(lang_dir: Path, url: str) -> tuple[VideoRecord, list[VideoRecord]]:
    """
    Validate URL → extract video_id → append to videos.json (if not duplicate
    and under MAX_VIDEOS_PER_LANG). Raises YouTubeProcessingError on rejection.
    """
    video_id = extract_video_id(url)
    if not video_id:
        raise YouTubeProcessingError("invalid_youtube_url", url[:80])

    videos = load_videos(lang_dir)
    if any(v.video_id == video_id for v in videos):
        raise YouTubeProcessingError("duplicate", video_id)
    if len(videos) >= MAX_VIDEOS_PER_LANG:
        raise YouTubeProcessingError("rate_limit_exceeded",
                                     f"max {MAX_VIDEOS_PER_LANG} videos per language")

    record = VideoRecord(
        url=url.strip(),
        video_id=video_id,
        added_at=datetime.now(timezone.utc).isoformat(),
    )
    videos.append(record)
    save_videos(lang_dir, videos)
    return record, videos


def remove_video(lang_dir: Path, video_id: str) -> list[VideoRecord]:
    videos = load_videos(lang_dir)
    videos = [v for v in videos if v.video_id != video_id]
    save_videos(lang_dir, videos)
    return videos


# ── Transcript fetch ──

def fetch_transcript(video_id: str, *, preferred_lang: str) -> tuple[str, bool]:
    """
    Fetch a video's transcript using youtube-transcript-api ≥ 1.0.

    Returns (text, auto_generated).
    Raises YouTubeProcessingError on any failure with a machine-readable code.

    Priority order:
      1. Human-authored transcript in preferred_lang.
      2. Auto-generated transcript in preferred_lang.
      3. Any track translated into preferred_lang (auto_generated=True).
    """
    if not HAS_YT:
        raise YouTubeProcessingError("library_not_installed",
                                     "pip install youtube-transcript-api>=1.0")

    api = YouTubeTranscriptApi()
    try:
        transcript_list = api.list(video_id)
    except VideoUnavailable as e:
        raise YouTubeProcessingError("video_unavailable", str(e)[:120]) from e
    except TranscriptsDisabled as e:
        raise YouTubeProcessingError("transcripts_disabled", str(e)[:120]) from e
    except Exception as e:  # noqa: BLE001
        raise YouTubeProcessingError("list_transcripts_failed", str(e)[:120]) from e

    target_codes = [preferred_lang, preferred_lang.split("-")[0]]
    auto_generated = False
    chosen = None

    try:
        chosen = transcript_list.find_manually_created_transcript(target_codes)
    except (NoTranscriptFound, Exception):  # noqa: BLE001
        try:
            chosen = transcript_list.find_generated_transcript(target_codes)
            auto_generated = True
        except (NoTranscriptFound, Exception):  # noqa: BLE001
            # No transcript in target language — find any translatable one.
            translatable = None
            for t in transcript_list:
                if getattr(t, "is_translatable", False):
                    translatable = t
                    break
            if translatable is None:
                raise YouTubeProcessingError(
                    "no_transcript_for_language",
                    f"{video_id}: no track translatable into {preferred_lang}",
                )
            try:
                chosen = translatable.translate(target_codes[0])
                auto_generated = True
            except Exception as e:  # noqa: BLE001
                raise YouTubeProcessingError(
                    "no_transcript_for_language", str(e)[:120]
                ) from e

    try:
        fetched = chosen.fetch()
    except Exception as e:  # noqa: BLE001
        raise YouTubeProcessingError("transcript_fetch_failed", str(e)[:120]) from e

    # FetchedTranscript exposes .snippets (≥1.0); older returns a plain list.
    snippets = getattr(fetched, "snippets", fetched)
    parts: list[str] = []
    for snip in snippets:
        text = getattr(snip, "text", None) or (
            snip.get("text") if isinstance(snip, dict) else ""
        )
        if text:
            parts.append(text.strip())
    full = "\n".join(parts).strip()

    if len(full) < MIN_TRANSCRIPT_CHARS:
        raise YouTubeProcessingError(
            "transcript_too_short", f"{len(full)} chars < {MIN_TRANSCRIPT_CHARS}"
        )

    return full, auto_generated
