"""
Inject chitti_a11y.js + Chitti.a11y.init() into every chitti_*.html page.

Idempotent: skips files that already reference chitti_a11y.js.
Adjusts the relative path for the voice-factory frontend mirror.

Locked by Bryan 2026-05-13: every chitti page must load the shared a11y
substrate so the dropdown + auto-detect + Braille + ISL toggles render.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
ROOT_GLOB = sorted(ROOT.glob("chitti_*.html"))
MIRROR_GLOB = sorted((ROOT / "chitti-voice-factory" / "frontend").glob("chitti_*.html"))

SKIP_NAMES = {
    # Already wired in earlier commits.
    "chitti_isl.html",
    "chitti_voice_hall_of_fame.html",
    "chitti_logo_video.html",
    "chitti_complete.html",
    "chitti_quality.html",
}

# Snippet inserted right before </body>. Uses a relative path so it works
# at repo root (chitti_a11y.js) and from the voice-factory mirror folder
# (../../chitti_a11y.js).
SNIPPET_TEMPLATE = """
<!-- Chitti accessibility substrate (locked) — dropdown + auto-detect + Braille + ISL. 2026-05-13 -->
<script src="{path}"></script>
<script>if(window.Chitti&&Chitti.a11y){{try{{Chitti.a11y.init({{}});}}catch(e){{console.warn('a11y init failed',e);}}}}</script>
"""

BODY_CLOSE = re.compile(r"</body>", re.IGNORECASE)


def process(file: Path, rel_path: str) -> str:
    if file.name in SKIP_NAMES:
        return "skip-already-known"
    text = file.read_text(encoding="utf-8")
    if "chitti_a11y.js" in text:
        return "skip-already-has"
    if not BODY_CLOSE.search(text):
        return "skip-no-body-close"
    snippet = SNIPPET_TEMPLATE.format(path=rel_path)
    new_text = BODY_CLOSE.sub(snippet + "</body>", text, count=1)
    file.write_text(new_text, encoding="utf-8")
    return "injected"


def main() -> int:
    counts: dict[str, int] = {}
    for f in ROOT_GLOB:
        result = process(f, "chitti_a11y.js")
        counts[result] = counts.get(result, 0) + 1
        print(f"  [{result:>20}] {f.name}")
    for f in MIRROR_GLOB:
        result = process(f, "../../chitti_a11y.js")
        counts[result] = counts.get(result, 0) + 1
        print(f"  [{result:>20}] chitti-voice-factory/frontend/{f.name}")
    print()
    print("Summary:", counts)
    return 0


if __name__ == "__main__":
    sys.exit(main())
