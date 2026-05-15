"""
lib/swarm.py — Swarm Intelligence v1 (SAHAYAI_MASTER.md §2f).

Every Chitti of the same type learns from every other. This module ships the
minimal-viable mechanism:

  1. `extract_patterns(engine, chitti)` — reads quality_audit + quality_feedback
     joined on request_id, clusters by a coarse `user_text` stem (lowercased
     first 60 chars), and returns clusters that meet the locked thresholds:
        - confirmations >= CONFIRMATION_THRESHOLD (default 100, per §2f).
        - thumbs-up ratio >= THUMBS_UP_RATIO (default 0.70).

  2. `push_to_skills(chitti, patterns, repo_root)` — appends accepted
     patterns to `<chitti>/skills/SWARM_LEARNED.md` with a verbatim
     provenance line `<!-- swarm: YYYY-MM-DD, N confirmations -->`. HIGH-risk
     Chittis (legal, ca, medupi, vaani) DO NOT auto-push — they write to
     `SWARM_PROPOSED.md` and wait for Sire's review.

  3. `weekly_swarm_pass(...)` — convenience cron entry-point: walks every
     Chitti's local DB, extracts patterns, pushes per the risk policy, and
     returns a report dict for the Founder email.

Threshold + risk policy are LOCKED via SAHAYAI_MASTER.md §2f and the §6
Chitti Quality v2 risk levels. Override per-environment via env vars only,
never hardcoded values inside individual Chittis:

    SWARM_MIN_CONFIRMATIONS  (default 100)
    SWARM_THUMBS_UP_RATIO    (default 0.70)
    SWARM_ENABLED            (default "1" — set "0" to disable cron entirely)

The job is best-effort. It logs and continues on any per-Chitti error —
never breaks the chitti-founder process.
"""
from __future__ import annotations

import datetime as _dt
import json
import logging
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from sqlalchemy import text


log = logging.getLogger("swarm")


# ---------- Locked thresholds (env-overridable) ---------------------------

CONFIRMATION_THRESHOLD = int(os.environ.get("SWARM_MIN_CONFIRMATIONS", "100"))
THUMBS_UP_RATIO = float(os.environ.get("SWARM_THUMBS_UP_RATIO", "0.70"))

# §6 risk levels: HIGH-risk Chittis never auto-push — Sire reviews first.
HIGH_RISK_CHITTIS = {
    "chitti-legal",
    "chitti-ca",
    "chitti-medupi",
    "chitti-vaani",  # emergency protocol + health flags
}


# ---------- Public types --------------------------------------------------


@dataclass
class Pattern:
    """A clustered user-text stem that has cleared the swarm thresholds."""

    stem: str
    confirmations: int
    thumbs_up: int
    thumbs_down: int
    sample_user_text: str = ""
    sample_model_output: str = ""

    @property
    def ratio(self) -> float:
        total = self.thumbs_up + self.thumbs_down
        return (self.thumbs_up / total) if total else 0.0


@dataclass
class SwarmReport:
    """What weekly_swarm_pass returns for the Founder email."""

    started_at: str = ""
    finished_at: str = ""
    per_chitti: dict[str, dict[str, Any]] = field(default_factory=dict)
    pushed_files: list[str] = field(default_factory=list)
    proposed_files: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    # Top patterns per Chitti — surface a handful in the weekly email so Sire
    # can see *what intelligence was shared Chitti-to-Chitti* this week, not
    # just the count. Capped at SAMPLE_PATTERNS_PER_CHITTI per Chitti.
    sample_patterns_per_chitti: dict[str, list[dict[str, Any]]] = field(default_factory=dict)


SAMPLE_PATTERNS_PER_CHITTI = int(os.environ.get("SWARM_SAMPLE_PATTERNS_PER_CHITTI", "3"))


# ---------- Pattern extraction --------------------------------------------


def _stem(user_text: str) -> str:
    """Coarse cluster key — lowercased, whitespace-collapsed, first 60 chars.

    Intentionally simple so the v1 cron has zero ML dependencies. A future
    pass can replace this with an embedding cluster — the rest of the
    pipeline doesn't change.
    """
    if not user_text:
        return ""
    s = re.sub(r"\s+", " ", user_text.strip().lower())
    return s[:60]


def extract_patterns(engine, chitti: str,
                     min_confirmations: int = CONFIRMATION_THRESHOLD,
                     thumbs_up_ratio: float = THUMBS_UP_RATIO) -> list[Pattern]:
    """Join quality_audit (kind='request' / kind='response') with
    quality_feedback on request_id, cluster by stemmed user_text, and
    return clusters above the locked thresholds.

    Returns an empty list (never raises) if either table is missing or
    empty — first-deploy honesty.
    """
    sql = text("""
        SELECT
            qa.payload_json AS payload_json,
            qf.thumbs       AS thumbs
        FROM quality_audit qa
        LEFT JOIN quality_feedback qf
          ON qf.request_id = qa.request_id
        WHERE qa.kind = 'request'
          AND qa.chitti = :chitti
    """)
    try:
        with engine.connect() as conn:
            rows = list(conn.execute(sql, {"chitti": chitti}))
    except Exception as e:  # noqa: BLE001
        log.info("swarm.extract_patterns(%s) skipped — %s", chitti, e)
        return []

    bucket: dict[str, Pattern] = {}
    for row in rows:
        payload_json = row[0]
        thumbs = row[1]
        try:
            payload = json.loads(payload_json) if payload_json else {}
        except Exception:  # noqa: BLE001
            payload = {}
        user_text = payload.get("user_text", "")
        stem = _stem(user_text)
        if not stem:
            continue
        p = bucket.get(stem) or Pattern(stem=stem, confirmations=0,
                                        thumbs_up=0, thumbs_down=0,
                                        sample_user_text=user_text)
        p.confirmations += 1
        if thumbs == 1 or thumbs == "up" or thumbs == "1":
            p.thumbs_up += 1
        elif thumbs == -1 or thumbs == "down" or thumbs == "0":
            p.thumbs_down += 1
        bucket[stem] = p

    accepted: list[Pattern] = []
    for p in bucket.values():
        if p.confirmations < min_confirmations:
            continue
        if p.ratio < thumbs_up_ratio:
            continue
        accepted.append(p)
    accepted.sort(key=lambda x: (-x.confirmations, -x.ratio))
    return accepted


# ---------- Skills-file writer --------------------------------------------


_HEADER = (
    "# Swarm-learned patterns — {chitti}\n\n"
    "Patterns below were extracted automatically from anonymised user\n"
    "interactions (≥{n} confirmations, ≥{pct}% thumbs-up) per SAHAYAI_MASTER.md §2f.\n"
    "Each entry carries a verbatim `<!-- swarm: date, N confirmations -->`\n"
    "comment so future readers (Claude included) can distinguish swarm-added\n"
    "lines from founder-authored content.\n\n"
    "Locked decisions in SAHAYAI_MASTER.md §2 are NEVER learnable — the swarm\n"
    "can only propose new capabilities, never override locks.\n\n"
)


def _file_for(chitti: str, repo_root: Path) -> Path:
    risk = chitti in HIGH_RISK_CHITTIS
    suffix = "SWARM_PROPOSED.md" if risk else "SWARM_LEARNED.md"
    folder = repo_root / chitti / "skills"
    folder.mkdir(parents=True, exist_ok=True)
    return folder / suffix


def push_to_skills(chitti: str, patterns: list[Pattern],
                   repo_root: Path | str,
                   now: _dt.date | None = None) -> tuple[Path | None, int]:
    """Append accepted patterns to <chitti>/skills/SWARM_{LEARNED,PROPOSED}.md.

    Returns (file_path, n_appended). file_path is None when no patterns met
    the bar (we don't touch the file in that case).

    HIGH-risk Chittis (HIGH_RISK_CHITTIS) write to SWARM_PROPOSED.md and
    require Sire's review before promotion to SWARM_LEARNED.md. Auto-push
    for HIGH-risk would violate the §6 quality contract.
    """
    if not patterns:
        return (None, 0)
    repo_root = Path(repo_root)
    target = _file_for(chitti, repo_root)
    today = (now or _dt.date.today()).isoformat()

    if not target.exists():
        target.write_text(
            _HEADER.format(chitti=chitti,
                           n=CONFIRMATION_THRESHOLD,
                           pct=int(THUMBS_UP_RATIO * 100)),
            encoding="utf-8",
        )

    existing_stems = set()
    for line in target.read_text(encoding="utf-8").splitlines():
        m = re.search(r"^### stem: `(.+)`$", line)
        if m:
            existing_stems.add(m.group(1))

    appended = 0
    with target.open("a", encoding="utf-8") as fh:
        for p in patterns:
            if p.stem in existing_stems:
                continue  # already learned — don't double-write
            block = (
                f"\n### stem: `{p.stem}`\n"
                f"<!-- swarm: {today}, {p.confirmations} confirmations -->\n"
                f"- Confirmations: **{p.confirmations}**\n"
                f"- Thumbs-up ratio: **{p.ratio:.0%}** ({p.thumbs_up}↑ / {p.thumbs_down}↓)\n"
                f"- Sample user input: {(p.sample_user_text or '').strip()[:200]}\n"
            )
            fh.write(block)
            appended += 1
    return (target, appended)


# ---------- Cron entry-point ----------------------------------------------


def weekly_swarm_pass(chittis: list[tuple[str, Any]],
                      repo_root: Path | str,
                      *,
                      min_confirmations: int = CONFIRMATION_THRESHOLD,
                      thumbs_up_ratio: float = THUMBS_UP_RATIO) -> SwarmReport:
    """Walk every (chitti_slug, engine) pair and run the full swarm pass.

    Intended to be called from chitti-founder's Sunday weekly cron. Returns
    a SwarmReport for the Founder email body.

    Errors per Chitti are caught and logged — never abort the whole pass.
    """
    if os.environ.get("SWARM_ENABLED", "1") != "1":
        log.info("swarm pass skipped — SWARM_ENABLED=0")
        return SwarmReport(started_at=_dt.datetime.utcnow().isoformat(),
                           finished_at=_dt.datetime.utcnow().isoformat())

    report = SwarmReport(started_at=_dt.datetime.utcnow().isoformat())
    for chitti, engine in chittis:
        try:
            patterns = extract_patterns(engine, chitti,
                                        min_confirmations=min_confirmations,
                                        thumbs_up_ratio=thumbs_up_ratio)
            target, n = push_to_skills(chitti, patterns, repo_root)
            report.per_chitti[chitti] = {
                "patterns_found": len(patterns),
                "patterns_appended": n,
                "file": str(target) if target else None,
                "risk": "high" if chitti in HIGH_RISK_CHITTIS else "normal",
            }
            # Capture top-N pattern snippets so the weekly Founder email can
            # name *what* was shared Chitti-to-Chitti, not just *how many*.
            if patterns:
                report.sample_patterns_per_chitti[chitti] = [
                    {
                        "stem": p.stem,
                        "confirmations": p.confirmations,
                        "thumbs_up_pct": int(p.ratio * 100),
                        "sample_user_text": (p.sample_user_text or "").strip()[:160],
                    }
                    for p in patterns[:SAMPLE_PATTERNS_PER_CHITTI]
                ]
            if target:
                if chitti in HIGH_RISK_CHITTIS:
                    report.proposed_files.append(str(target))
                else:
                    report.pushed_files.append(str(target))
        except Exception as e:  # noqa: BLE001
            err = f"{chitti}: {e}"
            log.warning("swarm pass error — %s", err)
            report.errors.append(err)
    report.finished_at = _dt.datetime.utcnow().isoformat()
    return report
