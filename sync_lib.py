"""
sync_lib.py — copy lib/ from repo root into every Chitti backend.

Each backend deploys from its own rootDir on Render, so it can't import
from a sibling folder. We treat /lib/ at repo root as the SOURCE OF TRUTH
and replicate identical copies into each chitti-*/backend/lib/.

Run after any change to lib/:

    python sync_lib.py            # syncs all backends
    python sync_lib.py news       # syncs just chitti-news

Verifies copies are identical, prints a per-backend status. Safe to re-run
(idempotent).
"""
from __future__ import annotations

import filecmp
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "lib"

# Backends that should receive the lib. Pure-stateless ones (ca, legal)
# still benefit — the rails, hooks, and feedback widget are universally useful.
BACKENDS = [
    "chitti-news",
    "chitti-government",
    "chitti-vaani",
    "chitti-voice-factory",
    "chitti-medupi",
    "chitti-shares",
    "chitti-ca",
    "chitti-legal",
    "chitti-scanner",
    "chitti-upi",
    "chitti-logo-video",
    "chitti-sales",
]

LIB_FILES = [
    "__init__.py",
    "quadrails.py",
    "hooks.py",
    "observability.py",
    "evaluators.py",
    "feedback.py",
    "founder_report.py",
]


def sync_one(backend_slug: str) -> tuple[str, str]:
    backend_dir = ROOT / backend_slug / "backend"
    if not backend_dir.exists():
        return (backend_slug, "skipped — no backend/ dir")

    dest = backend_dir / "lib"
    dest.mkdir(exist_ok=True)

    copied = 0
    unchanged = 0
    for fname in LIB_FILES:
        src = SOURCE / fname
        dst = dest / fname
        if dst.exists() and filecmp.cmp(src, dst, shallow=False):
            unchanged += 1
            continue
        shutil.copy2(src, dst)
        copied += 1

    return (backend_slug, f"copied={copied}  unchanged={unchanged}")


def main():
    if not SOURCE.exists():
        print(f"ERROR: source {SOURCE} does not exist", file=sys.stderr)
        return 2

    targets = BACKENDS
    if len(sys.argv) > 1:
        only = sys.argv[1].lstrip("/").rstrip("/")
        if not only.startswith("chitti-"):
            only = "chitti-" + only
        targets = [only]

    print(f"Source: {SOURCE}")
    print(f"Files:  {LIB_FILES}")
    print()
    for backend in targets:
        slug, status = sync_one(backend)
        print(f"  {slug:30s}  {status}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
