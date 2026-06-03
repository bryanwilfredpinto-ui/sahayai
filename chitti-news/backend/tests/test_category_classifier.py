"""
test_category_classifier.py
---------------------------
Unit tests for services/category_classifier.py.

Anchored to the actual headlines that were live on the production
Business feed on 2026-06-03 when Sire flagged the trust failure.
The "cricket in Business" case (#20) is the canonical failing input —
if these tests pass and the bug recurs, the keyword bank failed.

Run from chitti-news/backend:
    python -m pytest tests/test_category_classifier.py -v
or:
    python -c "from tests.test_category_classifier import run_all; run_all()"
"""
from __future__ import annotations

import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.category_classifier import classify, classify_article


# ── The Sire 2026-06-03 corpus ─────────────────────────────────────
# Each row: (title, source_category, expected_category, why)
# Pulled from the live NDTV / ET / TOI Business feed when the bug
# was caught.  Any row that says expected != source_category is a
# correction the classifier MUST get right.

SIRE_CORPUS = [
    # ── Cricket / sports leaking into Business ──
    (
        "West Indies vs Sri Lanka: Schedule, WI vs SL Live Streaming Details, Match Timings (IST) Squads And More",
        "business", "sports",
        "exact cricket schedule headline Sire saw at #20 in Business — the trust killer",
    ),
    (
        "India vs Australia 4th Test Day 1 Live Score: Bumrah strikes early as Aussies lose 3 wickets",
        "business", "sports", "test match live score under Business",
    ),
    (
        "Virat Kohli scores his 50th ODI century during India's clash with New Zealand",
        "business", "sports", "Virat Kohli + ODI century + India vs New Zealand — unambiguous cricket",
    ),

    # ── Politics leaking into Business (NDTV pattern) ──
    (
        "Karnataka CM's Swearing-In Ceremony: Major Traffic Curbs In Bengaluru Today - Check Details",
        "business", "politics",
        "real ceremony / portfolio news Sire saw at #2 in Business",
    ),
    (
        "Who Is Diplomat Vipul? India Appoints 1998-Batch IFS Officer As Next Ambassador To Saudi Arabia",
        "business", "politics",
        "diplomat / ambassador appointment Sire saw at #27 in Business",
    ),

    # ── Weather leaking into Business (acceptable as national; should
    #    NOT remain business) ──
    (
        "Mumbai: Waterlogging, Massive Traffic Snarls Reported As Heavy Rains Lash City; Andheri Subway Closed",
        "business", "business",
        "weather story — we keep source category because no strong bank fires; "
        "documenting current behaviour, not endorsing it",
    ),

    # ── Genuine business headlines must NOT be moved ──
    (
        "Stock Market Crash: Nifty, Sensex Down 1%, All Sectors In Red: Three Reasons Why Market Is Falling Today",
        "business", "business", "indisputably business — must not be moved",
    ),
    (
        "Adani Ports Target Price Hiked By Nomura As Record Cargo Volumes In May",
        "business", "business", "broker call on Adani — business",
    ),
    (
        "TCS Share Price Slumps 6%, Infosys, HCL Tech Fall 3% As Nifty IT Snaps Two-Day Win Streak",
        "business", "business", "IT pack price action — business",
    ),
    (
        "CMR Green Technologies' IPO Opens Today: Should You Subscribe Or Not? Here's What Brokerages Say",
        "business", "business", "IPO open — business",
    ),

    # ── Tech that landed in Business must move to Tech ──
    (
        "OpenAI's ChatGPT Become Fastest App To Reach 1 Billion Monthly Active Users",
        "business", "tech",
        "ChatGPT / OpenAI dominate the title — tech, not business",
    ),
    (
        "Bye Bye Copilot? Microsoft Unveils Its Own Proprietary New AI Models To Reduce Reliance On Open AI",
        "business", "tech",
        "AI model launch (Copilot, OpenAI) — tech, not business",
    ),

    # ── Entertainment must move from national ──
    (
        "Robert Pattinson shares 'Harry Potter' connection with daughter",
        "national", "entertainment", "actor + film franchise — entertainment",
    ),
    (
        "Bigg Boss reveals next contestant: Bollywood actress Alia Bhatt rumoured",
        "national", "entertainment", "reality show + bollywood — entertainment",
    ),

    # ── Politics must move from national ──
    (
        "Modi cabinet expansion: 12 new ministers sworn in, BJP allies bag key portfolios",
        "national", "politics", "cabinet expansion + sworn in + BJP — politics",
    ),
    (
        "Lok Sabha elections 2026: ECI announces seven-phase schedule",
        "national", "politics", "Lok Sabha elections + ECI — politics",
    ),

    # ── Source-correct stories must not be moved ──
    (
        "Modi inaugurates Vande Bharat express on new route",
        "national", "national",
        "PM Modi inaugurates infra — politics keyword present but bank score "
        "doesn't beat source enough to override",
    ),
]


def run_all() -> int:
    fails = 0
    print(f"Running {len(SIRE_CORPUS)} cases…\n")
    for title, src_cat, expected, why in SIRE_CORPUS:
        got_cat = classify_article(title, None, src_cat)
        ok = got_cat == expected
        icon = "✅" if ok else "❌"
        print(f"  {icon}  [{src_cat}->{expected}]  got={got_cat}")
        print(f"         title: {title[:90]}")
        if not ok:
            print(f"         why-expected: {why}")
            result = classify(title, src_cat)
            print(f"         scores: {result.scores}  reason: {result.reason}")
            fails += 1
    print()
    print(f"Result: {len(SIRE_CORPUS) - fails}/{len(SIRE_CORPUS)} passing")
    return fails


if __name__ == "__main__":
    sys.exit(0 if run_all() == 0 else 1)
