"""Quick smoke test for youtube_learner add/list/duplicate/remove."""
from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from services import fluency_corpus, youtube_learner

lang_dir = fluency_corpus.lang_dir("hi")
vp = youtube_learner.videos_path(lang_dir)
if vp.exists():
    os.remove(vp)

rec1, _ = youtube_learner.add_video(lang_dir, "https://youtu.be/dQw4w9WgXcQ")
rec2, _ = youtube_learner.add_video(lang_dir, "https://www.youtube.com/watch?v=jNQXAC9IVRw")
print("Added two:", [v.video_id for v in youtube_learner.load_videos(lang_dir)])

try:
    youtube_learner.add_video(lang_dir, "https://youtu.be/dQw4w9WgXcQ")
    print("BUG: duplicate not rejected")
except youtube_learner.YouTubeProcessingError as e:
    print("Duplicate rejected:", e.code)

try:
    youtube_learner.add_video(lang_dir, "not a url")
except youtube_learner.YouTubeProcessingError as e:
    print("Bad URL rejected:", e.code)

youtube_learner.remove_video(lang_dir, "dQw4w9WgXcQ")
print("After remove:", [v.video_id for v in youtube_learner.load_videos(lang_dir)])

# Clean up so the test artifact doesn't ship
if vp.exists():
    os.remove(vp)
print("Test artifact cleaned.")
