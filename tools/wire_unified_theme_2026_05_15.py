"""
Wire chitti_theme.css + chitti_isl.js into every Chitti HTML at repo root
per the 2026-05-15 directive. Idempotent — re-running is a no-op once
each tag is present.

- chitti_theme.css inserted just before </head> so it overrides any
  inline <style> block via cascade (later-in-cascade wins).
- chitti_isl.js inserted just before </body>, after existing
  feedback-widget.js / chitti_a11y.js script tags. The shim self-loads
  the actual ISL implementation by polling for Chitti.a11y; this <script>
  tag is here so the §1c G5 grep returns a hit AND callers can rely on
  window.Chitti.isl being defined synchronously after the file parses.
- chitti_i18n.js — substrate auto-loads it via ensureI18nSubstrate(),
  but we also add the explicit <script> tag for parity with the literal
  directive wording ("entire UI switches to that language" requires the
  i18n substrate to be on the page).
"""
from pathlib import Path
import re

REPO = Path(__file__).resolve().parents[1]

PAGES = [
    "chitti_vaani.html",
    "chitti_medupi.html",
    "chitti_ca.html",
    "chitti_legal.html",
    "chitti_government.html",
    "chitti_news.html",
    "chitti_news_ai.html",
    "chitti_upi.html",
    "chitti_scanner.html",
    "chitti_complete_technical.html",
    "chitti_fundamentals.html",
    "chitti_voice_factory.html",
    "chitti_2wheeler.html",
    "chitti_4wheeler.html",
    "chitti_logo_video.html",
    # Extras — same substrate contract applies (per QUALITY_STATUS.md §1b)
    "index.html",
    "chitti_isl.html",
    "chitti_voice_hall_of_fame.html",
    "chitti_quality.html",
    "chitti_complete.html",
    "chitti_claude_complete.html",
]

THEME_LINK = '<link rel="stylesheet" href="chitti_theme.css"><!-- chitti_theme.css 2026-05-15 unified palette -->'
ISL_SCRIPT = '<script src="chitti_isl.js"></script>'
I18N_SCRIPT = '<script src="chitti_i18n.js"></script>'


def wire(page_path: Path):
    if not page_path.exists():
        return {"status": "MISSING", "changes": []}
    src = page_path.read_text(encoding="utf-8", errors="ignore")
    changes = []

    # 1. chitti_theme.css — insert before </head> if not already present
    if "chitti_theme.css" not in src:
        if "</head>" not in src:
            # Page lacks </head> — rare; surface as a warning
            return {"status": "SKIP", "changes": ["no </head> tag"], "reason": "malformed"}
        src = src.replace("</head>", THEME_LINK + "\n</head>", 1)
        changes.append("+chitti_theme.css")

    # 2. chitti_isl.js — insert before </body> if not already present
    if "chitti_isl.js" not in src:
        if "</body>" not in src:
            return {"status": "SKIP", "changes": changes + ["no </body> tag"], "reason": "malformed"}
        src = src.replace("</body>", ISL_SCRIPT + "\n</body>", 1)
        changes.append("+chitti_isl.js")

    # 3. chitti_i18n.js — insert before </body> if not already present
    if "chitti_i18n.js" not in src:
        if "</body>" not in src:
            return {"status": "SKIP", "changes": changes + ["no </body> tag"], "reason": "malformed"}
        src = src.replace("</body>", I18N_SCRIPT + "\n</body>", 1)
        changes.append("+chitti_i18n.js")

    if changes:
        page_path.write_text(src, encoding="utf-8")
        return {"status": "WIRED", "changes": changes}
    return {"status": "OK", "changes": []}


print(f"{'page':<40} {'status':<10} changes")
print("-" * 80)
total_wired = 0
for f in PAGES:
    r = wire(REPO / f)
    chg = ", ".join(r.get("changes", []))
    status = r["status"]
    if status == "WIRED":
        total_wired += 1
    print(f"{f:<40} {status:<10} {chg}")
print()
print(f"Wired {total_wired} page(s).")
