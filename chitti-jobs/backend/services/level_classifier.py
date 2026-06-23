"""
services/level_classifier.py  —  BO3
------------------------------------
Pure, deterministic classifier: experience (+ optional title/role signal)
→ one of fresher | junior | mid | senior | cxo.

Bands (CEOS §23B Step 2 / §1.3):
  fresher : 0–1 yr      junior : 1–5 yr      mid : 5–12 yr
  senior  : 12–20 yr    cxo    : 20+ yr

A fresher career_situation forces 'fresher' regardless of years. A clear
C-suite / board title (CEO, CHRO, CTO, MD, "VP", "Chief ...") with
substantial experience promotes to 'cxo' even just under 20 yrs, because
the role — not only the tenure — defines that tier.

No LLM, no I/O — trivially unit-testable.
"""
from __future__ import annotations

USER_LEVELS = ("fresher", "junior", "mid", "senior", "cxo")

_CXO_TITLE_HINTS = (
    "ceo", "cfo", "cto", "coo", "chro", "cmo", "ciso", "cio",
    "chief ", "managing director", " md ", "board member",
    "president", "vice president", " vp ", "vp ", " evp", "svp",
)


def _has_cxo_title(role: str) -> bool:
    r = f" {(role or '').lower().strip()} "
    return any(h in r for h in _CXO_TITLE_HINTS)


def classify(experience_years, current_role: str = "", career_situation: str = "") -> str:
    """Return the user level. Robust to None / strings / negatives."""
    if (career_situation or "").lower() == "fresher":
        return "fresher"

    try:
        yrs = float(experience_years) if experience_years is not None else 0.0
    except (TypeError, ValueError):
        yrs = 0.0
    yrs = max(0.0, yrs)

    if yrs < 1:
        level = "fresher"
    elif yrs < 5:
        level = "junior"
    elif yrs < 12:
        level = "mid"
    elif yrs < 20:
        level = "senior"
    else:
        level = "cxo"

    # Role-based promotion: a genuine C-suite/board title with 15+ yrs is CXO.
    if level == "senior" and yrs >= 15 and _has_cxo_title(current_role):
        level = "cxo"

    return level
