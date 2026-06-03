"""
test_news_insight.py
--------------------
Unit tests for the Chitti's Insight hallucination validators
(services/news_insight.py::validate_insight).

Each test case is a concrete (insight, source_body, expected_reject)
triple. expected_reject == None means the validator must ACCEPT.
A specific string means the validator must REJECT with that reason.

Anchored to the exact rejection rules Sire approved:
  • URLs in the output  → "url_in_insight"
  • Quoted text not in source  → "unsourced_quote"
  • Named entities not in source  → "unsourced_entity:…"
  • Numbers not in source  → "unsourced_number"
  • Headline echo (first 4 words match)  → "headline_echo"
  • Wrong length  → "too_short" / "too_long" / "multi_sentence"
  • NO_INSIGHT sentinel  → "model_no_insight"

Run from chitti-news/backend:
    python -X utf8 tests/test_news_insight.py
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.news_insight import validate_insight


class FakeArticle:
    def __init__(self, title: str, summary: str = "", content: str = ""):
        self.title   = title
        self.summary = summary
        self.content = content


# Each test: (insight_text, FakeArticle, expected_reject_or_None)
CASES = [
    # ── 1. NO_INSIGHT sentinel ────────────────────────────────────────
    (
        "NO_INSIGHT",
        FakeArticle("PM addresses parliament", summary="Modi spoke about reform."),
        "model_no_insight",
        "model NO_INSIGHT must reject",
    ),
    (
        "no_insight",
        FakeArticle("Headline", summary="body"),
        "model_no_insight",
        "lowercased sentinel still rejects (case-insensitive)",
    ),

    # ── 2. URLs ───────────────────────────────────────────────────────
    (
        "This is significant because reform follows up on last quarter's policy https://example.com.",
        FakeArticle("Headline", summary="reform follows last quarter's policy."),
        "url_in_insight",
        "https URL must reject",
    ),
    (
        "Background follows last quarter. See www.modi.in for details on the new policy direction.",
        FakeArticle("Headline", summary="Background follows last quarter."),
        "url_in_insight",
        "www. URL must reject",
    ),

    # ── 3. Unsourced quote ────────────────────────────────────────────
    (
        '"This is the biggest reform" was not in the source body anywhere as a quote.',
        FakeArticle("Big reform announced", summary="Modi announced a reform."),
        "unsourced_quote",
        "quoted span absent from body must reject",
    ),
    (
        'Modi said this is "a defining moment for India" during the speech today.',
        FakeArticle("Modi speech",
                    summary='Modi called the moment "a defining moment for India" in the speech.'),
        None,
        "quoted span present in body verbatim must accept",
    ),

    # ── 4. Unsourced numbers ──────────────────────────────────────────
    (
        "Pressure tied to crude rising to 117 dollars per barrel after the strikes.",
        FakeArticle("Crude rises",
                    summary="Brent crude rose to 94 dollars after Iran strikes."),
        "unsourced_number",
        "117 in insight not in body (94 is) must reject",
    ),
    (
        "Curbs cover a 12 km radius from 9 AM to noon affecting commuters on MG Road.",
        FakeArticle("Curbs in Bengaluru",
                    summary="Traffic curbs cover 12 km radius from 9 AM to noon near MG Road."),
        None,
        "all numbers present in body must accept",
    ),

    # ── 5. Unsourced named entities ───────────────────────────────────
    (
        "Pressure follows the recent move by Reserve Bank of India to tighten the monetary stance.",
        FakeArticle("RBI tightens",
                    summary="The Reserve Bank of India announced tightening yesterday."),
        None,
        "multi-word entity present in body must accept",
    ),
    (
        "European Central Bank also signalled a similar move last week according to analysts.",
        FakeArticle("RBI tightens",
                    summary="The Reserve Bank of India tightened. No mention of ECB."),
        "unsourced_entity:European Central Bank",
        "entity absent from body must reject",
    ),

    # ── 6. Headline echo ──────────────────────────────────────────────
    (
        "Pressure follows last week's coalition standoff that nearly broke the alliance.",
        FakeArticle("Modi addresses parliament on policy",
                    summary="Pressure follows last week's coalition standoff that nearly broke the alliance."),
        None,
        "different first-4-words must accept",
    ),
    (
        "Modi addresses parliament on policy in a wide-ranging speech that lasted forty minutes today.",
        FakeArticle("Modi addresses parliament on policy",
                    summary="A wide-ranging forty-minute speech."),
        "headline_echo",
        "same first-4-words as headline must reject",
    ),

    # ── 7. Length and shape ───────────────────────────────────────────
    (
        "Too short.",
        FakeArticle("H", summary="b"),
        "too_short",
        "<40 chars must reject",
    ),
    (
        ("Curbs cover a 12 km radius from 9 AM to noon affecting commuters on MG Road. "
         + "x" * 220),  # blow past 220 char limit
        FakeArticle("Curbs in Bengaluru",
                    summary="Traffic curbs cover 12 km radius from 9 AM to noon near MG Road."),
        "too_long",
        ">220 chars must reject",
    ),
    (
        "First sentence is here. Second sentence is here. Third sentence is here? "
        "Fourth sentence too.",
        FakeArticle("Headline different words",
                    summary="body words different headline body words."),
        "multi_sentence",
        "3+ terminal punctuation marks must reject as multi-sentence",
    ),

    # ── 8. Happy path ─────────────────────────────────────────────────
    (
        "Pressure tied to crude crossing 94 dollars after Iran strikes; "
        "RBI has not yet signalled intervention as of the body's last update.",
        FakeArticle("Rupee falls 28 paise against dollar",
                    summary=("Rupee fell 28 paise to 95.64 against the dollar. "
                             "Brent crude rose to 94 dollars after Iran strikes. "
                             "RBI has not commented on intervention.")),
        None,
        "canonical good insight: stake + source-grounded numbers + neutral",
    ),
    (
        "Background context: the move follows last week's coalition standoff.",
        FakeArticle("MLA expelled from TMC",
                    summary="The expulsion follows last week's coalition standoff between TMC and Congress."),
        None,
        "background-context insight with grounded multi-word entity (TMC) must accept",
    ),

    # ── 9. Edge case: prefix "Chitti's Take:" must be stripped before
    #    validation (the model sometimes adds it back even when told not to).
    (
        "Chitti's Take: Background follows last week's coalition standoff and signals tightening discipline.",
        FakeArticle("MLA expelled from TMC",
                    summary="Last week's coalition standoff signals tightening discipline."),
        None,
        "model's 'Chitti's Take:' prefix is stripped before validation",
    ),
]


def run_all() -> int:
    print(f"Running {len(CASES)} validator cases…\n")
    fails = 0
    for insight, article, expected, why in CASES:
        got = validate_insight(insight, article)
        ok = (got == expected) or (
            expected is not None and got is not None
            and got.split(":")[0] == expected.split(":")[0]
        )
        icon = "✅" if ok else "❌"
        snip = insight[:70].replace("\n", " ")
        print(f"  {icon}  expected={expected!s:30}  got={got!s}")
        print(f"          {snip}")
        if not ok:
            print(f"          WHY: {why}")
            fails += 1
        print()
    print(f"\nResult: {len(CASES) - fails}/{len(CASES)} passing")
    return fails


if __name__ == "__main__":
    sys.exit(0 if run_all() == 0 else 1)
