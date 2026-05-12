"""Live network test: fetch real transcripts for a handful of videos in
different Indian languages, exercising the human / auto-generated / translated
fallback paths in services.youtube_learner.fetch_transcript.
"""
from __future__ import annotations

import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from services.youtube_learner import (
    YouTubeProcessingError,
    extract_video_id,
    fetch_transcript,
)

# (label, URL, target language) — chosen because each tests a different code path:
#   1. Popular English TED talk — should have human-authored 'en' track + auto translations.
#   2. Indian PM Modi speech in Hindi — should have human Hindi track.
#   3. Random Hindi music — usually no transcript, exercises 'no_transcript_for_language'.
CASES = [
    ("TED-Ed (en, human)", "https://www.youtube.com/watch?v=arj7oStGLkU", "en"),
    ("TED-Ed (en→hi translation)", "https://www.youtube.com/watch?v=arj7oStGLkU", "hi"),
    ("Tamil tech channel (ta)",  "https://www.youtube.com/watch?v=eMlx5fFNoYc", "ta"),
]


def main() -> int:
    print("-" * 70)
    for label, url, lang in CASES:
        vid = extract_video_id(url)
        print(f"\n[{label}]  video_id={vid}  lang={lang}")
        try:
            text, auto_gen = fetch_transcript(vid, preferred_lang=lang)
            print(f"  OK{len(text)} chars  auto_generated={auto_gen}")
            preview = text[:200].replace("\n", " ")
            print(f"  preview: {preview}")
        except YouTubeProcessingError as e:
            print(f"  WARN graceful error → code={e.code}  detail={e.detail[:80]}")
        except Exception as e:  # noqa: BLE001
            print(f"  FAIL unexpected error: {type(e).__name__}: {e!s:.120}")
    print("\n" + "-" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(main())
