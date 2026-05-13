"""
Inject chitti_a11y.js + feedback-widget.js into every chitti_*.html page.

Two passes, both idempotent:
  Pass 1 — chitti_a11y.js  : language selector + Braille + ISL + a11y init.
  Pass 2 — feedback-widget.js : page-footer + per-box 4-icon widget
                                (🔊 / 🤖 / 👍 / 👎 + per-box modal).

Adjusts the relative path for the voice-factory frontend mirror
(`chitti-voice-factory/frontend/chitti_<lang>.html`).

Locked by Bryan 2026-05-13 (SAHAYAI_MASTER §7):
- Every Chitti page MUST load the a11y substrate.
- Every Chitti page MUST load the feedback widget — no page ships without
  the per-box 🔊 / 🤖 / 👍 / 👎 row on every [data-chitti-response].
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
ROOT_GLOB = sorted(ROOT.glob("chitti_*.html"))
MIRROR_GLOB = sorted((ROOT / "chitti-voice-factory" / "frontend").glob("chitti_*.html"))

# Non-product pages or fully hand-wired pages — leave alone.
SKIP_NAMES = {
    "chitti_complete.html",
    "chitti_quality.html",
}

A11Y_SNIPPET = """
<!-- Chitti accessibility substrate (locked) — dropdown + auto-detect + Braille + ISL. 2026-05-13 -->
<script src="{path}"></script>
<script>if(window.Chitti&&Chitti.a11y){{try{{Chitti.a11y.init({{}});}}catch(e){{console.warn('a11y init failed',e);}}}}</script>
"""

FBW_SNIPPET = """
<!-- Chitti feedback widget (locked) — per-box 🔊 🤖 👍 👎 + per-box feedback modal. 2026-05-13 -->
<script src="{path}" data-page="{page}"></script>
"""

BODY_CLOSE = re.compile(r"</body>", re.IGNORECASE)


def inject(file: Path, marker: str, snippet: str) -> str:
    if file.name in SKIP_NAMES:
        return "skip-known"
    text = file.read_text(encoding="utf-8")
    if marker in text:
        return "skip-has"
    if not BODY_CLOSE.search(text):
        return "skip-no-body"
    new_text = BODY_CLOSE.sub(snippet + "</body>", text, count=1)
    file.write_text(new_text, encoding="utf-8")
    return "injected"


def process(file: Path, rel_a11y: str, rel_fbw: str) -> tuple[str, str]:
    page = file.stem  # chitti_ta.html -> chitti_ta
    r1 = inject(file, "chitti_a11y.js", A11Y_SNIPPET.format(path=rel_a11y))
    r2 = inject(file, "feedback-widget.js", FBW_SNIPPET.format(path=rel_fbw, page=page))
    return r1, r2


def main() -> int:
    counts: dict[str, int] = {}

    def bump(key: str) -> None:
        counts[key] = counts.get(key, 0) + 1

    for f in ROOT_GLOB:
        r1, r2 = process(f, "chitti_a11y.js", "feedback-widget.js")
        bump("a11y:" + r1)
        bump("fbw:" + r2)
        print(f"  [a11y:{r1:>10}] [fbw:{r2:>10}] {f.name}")

    for f in MIRROR_GLOB:
        r1, r2 = process(f, "../../chitti_a11y.js", "../../feedback-widget.js")
        bump("a11y:" + r1)
        bump("fbw:" + r2)
        print(f"  [a11y:{r1:>10}] [fbw:{r2:>10}] chitti-voice-factory/frontend/{f.name}")

    print()
    print("Summary:", counts)
    return 0


if __name__ == "__main__":
    sys.exit(main())
