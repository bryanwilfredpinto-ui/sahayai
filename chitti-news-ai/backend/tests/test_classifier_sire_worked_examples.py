"""
test_classifier_sire_worked_examples.py
---------------------------------------
CNAIOS SKILLS Skill 1 + SOP-002 compliance:

  > **Hard rule:** Sire's 4 worked examples MUST pass (CUDA → SD ·
  > Oncology AI → oncologist · Precision Agri → farmer ·
  > ATS → talent-acquisition). Locked in
  > `test_classifier_sire_worked_examples`.

Every commit touching profession_classifier.py or profession_registry.json
must keep all 4 green. If any fails -> block merge.

Run:
    python -m pytest backend/tests/test_classifier_sire_worked_examples.py
"""
from __future__ import annotations

import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from services.profession_classifier import classify  # noqa: E402


def _slugs(tags):
    return {t["profession_slug"] for t in tags}


def test_cuda_routes_to_software_developer() -> None:
    """NVIDIA CUDA C/C++ course must tag software-developer."""
    tags = classify(
        title="NVIDIA CUDA C/C++ — Programming Massively Parallel Processors",
        summary="Hands-on GPU programming with CUDA, kernel optimisation, "
                "memory hierarchies, and tensor cores for deep-learning workloads.",
        topics="cuda,c++,gpu,parallel,kernel,tensorrt",
        source_slug=None, url=None,
    )
    slugs = _slugs(tags)
    assert "software-developer" in slugs, (
        f"CUDA must classify as software-developer; got {slugs}")


def test_oncology_ai_conference_routes_to_oncologist() -> None:
    """Oncology AI Conference must tag oncologist (primary)."""
    tags = classify(
        title="ESMO 2026 Oncology AI Conference — NCCN guidelines + biomarker discovery",
        summary="Tumour board AI tools, immunotherapy, TNM staging automation, "
                "chemotherapy response prediction, Tata Memorial collaboration.",
        topics="oncology,cancer,immunotherapy,NCCN,tata memorial,chemotherapy",
        source_slug=None, url=None,
    )
    slugs = _slugs(tags)
    assert "oncologist" in slugs, (
        f"Oncology AI must classify as oncologist; got {slugs}")


def test_precision_agriculture_routes_to_farmer() -> None:
    """Precision Agriculture Drone Training must tag farmer."""
    tags = classify(
        title="Precision Agriculture Drone Training — KVK ICAR certification",
        summary="Variable-rate fertiliser application, soil health card "
                "interpretation, agritech sensors, drone spray for cotton + paddy.",
        topics="precision-agriculture,agritech,soil health,KVK,ICAR",
        source_slug=None, url=None,
    )
    slugs = _slugs(tags)
    assert "farmer" in slugs, (
        f"Precision Agriculture must classify as farmer; got {slugs}")


def test_ats_optimization_routes_to_talent_acquisition() -> None:
    """ATS Optimization course must tag talent-acquisition."""
    tags = classify(
        title="SHRM India — ATS Optimization & Boolean Search for Talent Acquisition",
        summary="Applicant tracking system best practices, LinkedIn Recruiter "
                "boolean search, candidate pipeline scoring, talent intelligence.",
        topics="applicant tracking system,ATS,boolean search,talent acquisition,LinkedIn recruiter",
        source_slug=None, url=None,
    )
    slugs = _slugs(tags)
    assert "talent-acquisition" in slugs, (
        f"ATS Optimization must classify as talent-acquisition; got {slugs}")
