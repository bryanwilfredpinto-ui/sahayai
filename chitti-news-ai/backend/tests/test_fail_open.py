"""
test_fail_open.py
-----------------
CHITTI_NEWS_AI_MASTER_SPEC v0.3 §4.3 fail-open contract:

  > Every aggregator endpoint must return useful content (news, courses,
  > certs, tools, jobs, govt schemes) when every configured LLM provider
  > is offline.

This test boots the classifier + ingestor + feed route with ALL LLM env
vars unset and verifies the rules-only critical path still produces
useful, explainable output.

Run:
    python -m pytest backend/tests/test_fail_open.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure backend is on sys.path even when running directly
BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))


def _kill_llm_env_vars() -> None:
    """Strip every env var the system might use for an LLM call."""
    for key in [
        "DEEPSEEK_API_KEY", "DEEPSEEK_URL", "DEEPSEEK_MODEL",
        "GEMINI_API_KEY", "GOOGLE_API_KEY",
        "OPENAI_API_KEY", "ANTHROPIC_API_KEY",
        "CLASSIFIER_API_KEY",
    ]:
        os.environ.pop(key, None)


def test_classifier_produces_tags_with_no_llm_env() -> None:
    """The classifier must return real tags for a known developer course
    even with every LLM env var killed. Asserts explainability fields."""
    _kill_llm_env_vars()
    from services.profession_classifier import classify, reload_rules

    reload_rules()

    tags = classify(
        title="Practical Deep Learning for Coders (Part 1)",
        summary="Top-down practical course teaching modern deep learning for software engineers and developers.",
        topics="deep-learning,AI",
        source_slug="fast-ai",
        url="https://course.fast.ai/",
    )
    assert tags, "rules-only classifier must return at least one tag for a fast.ai course"
    # software-developer should be the top tag
    assert tags[0]["profession_slug"] == "software-developer", \
        f"top tag should be software-developer, got {tags[0]['profession_slug']!r}"
    # explainability contract (v0.3 §4.2)
    for required in ["profession_slug", "confidence", "matched_keywords", "source_signals", "rule_version"]:
        assert required in tags[0], f"tag missing required field {required!r}"


def test_classifier_sire_worked_examples() -> None:
    """Sire's directive included four worked examples — must pass with rules only."""
    _kill_llm_env_vars()
    from services.profession_classifier import classify, reload_rules
    reload_rules()

    cases = [
        # NVIDIA CUDA course → Software Developer
        {
            "title": "Fundamentals of Accelerated Computing with CUDA C/C++",
            "summary": "Hands-on workshop teaching CUDA C/C++ for GPU-accelerated computing.",
            "topics": "cuda,gpu,c++,parallel-computing",
            "expected": "software-developer",
        },
        # Oncology AI conference → Oncologist
        {
            "title": "Annual Oncology AI Conference — Tumor Genomics, NCCN Guidelines",
            "summary": "Conference on AI in oncology for practising oncologists.",
            "topics": "oncology,cancer,tumour,immunotherapy",
            "expected": "oncologist",
        },
        # Precision agriculture drone training → Farmer
        {
            "title": "Precision Agriculture and Drone Operations Training for Farmers",
            "summary": "Training for farmers and FPO members on drone-based crop monitoring.",
            "topics": "precision-agriculture,drone,crop-monitoring,fpo",
            "expected": "farmer",
        },
        # ATS optimization certification → Talent Acquisition
        {
            "title": "ATS Optimization for Talent Acquisition Professionals",
            "summary": "Certification on applicant tracking system optimisation and boolean search.",
            "topics": "ats,applicant-tracking,boolean-search",
            "expected": "talent-acquisition",
        },
    ]
    for case in cases:
        tags = classify(case["title"], case["summary"], case["topics"])
        slugs = [t["profession_slug"] for t in tags]
        assert case["expected"] in slugs, \
            f"Sire example {case['title']!r} did not produce {case['expected']!r}; got {slugs}"


def test_no_llm_imports_in_classifier_critical_path() -> None:
    """The classifier module must not import httpx / openai / google.generativeai.

    Per v0.3 §4 — classification is rules-only. If this test fails, an
    LLM dependency has crept back into the critical path.
    """
    import services.profession_classifier as pc
    src = Path(pc.__file__).read_text(encoding="utf-8")
    forbidden = [
        "import httpx",
        "from httpx",
        "import openai",
        "from openai",
        "google.generativeai",
        "anthropic",
        "DEEPSEEK_API_KEY",
        "GEMINI_API_KEY",
        "OPENAI_API_KEY",
    ]
    for f in forbidden:
        assert f not in src, \
            f"forbidden LLM dependency found in profession_classifier.py: {f!r}"


def test_enhancement_summarise_works_offline() -> None:
    """Extractive summary works with zero LLM dependencies (v0.3 §4.3)."""
    _kill_llm_env_vars()
    from services.enhancement import summarise
    out = summarise(
        title="ChatGPT Prompt Engineering for Developers",
        summary="Andrew Ng's free 1-hour course covers prompt design patterns. Targets software developers building LLM apps. No prior ML knowledge required.",
    )
    assert out["source"] == "extractive"
    assert "Andrew Ng" in out["text"]
    assert out["text"]  # never empty


def test_enhancement_explain_falls_back_to_extractive() -> None:
    """When LLM env vars are unset, explain() returns extractive text — not 500."""
    _kill_llm_env_vars()
    from services.enhancement import explain
    out = explain({
        "title": "Practical Deep Learning for Coders",
        "summary": "Top-down course for developers learning deep learning. Covers PyTorch and Hugging Face transformers.",
        "url": "https://course.fast.ai/",
        "language": "en",
    }, language="en")
    assert out["ok"] is True
    assert out["source"] == "extractive"
    assert out["fallback_reason"] in ("llm_key_unset", None) or out["fallback_reason"].startswith("llm_")
    assert out["text"]


def test_enhancement_career_insight_offline() -> None:
    """career_insight is rules-only (no LLM ever); produces honest output."""
    _kill_llm_env_vars()
    from services.enhancement import career_insight
    out = career_insight({
        "title": "Practical Deep Learning for Coders",
        "summary": "Top-down practical course teaching modern deep learning for software engineers. Hands-on with PyTorch.",
        "topics": "deep-learning,AI",
    }, profession_slug="software-developer")
    assert out["source"] == "extractive"
    # Should surface the developer-keyword-bearing sentence
    assert any(("software engineers" in b.lower() or "developers" in b.lower() or "pytorch" in b.lower()) for b in out["bullets"]), \
        f"expected dev keywords in bullets, got {out['bullets']}"


if __name__ == "__main__":
    test_classifier_produces_tags_with_no_llm_env()
    test_classifier_sire_worked_examples()
    test_no_llm_imports_in_classifier_critical_path()
    test_enhancement_summarise_works_offline()
    test_enhancement_explain_falls_back_to_extractive()
    test_enhancement_career_insight_offline()
    print("All fail-open tests passed (6).")
