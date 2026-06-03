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

    # ── Real false positives from the live dry-run pass ──
    # Sire 2026-06-03 — these surfaced when the live ?apply=0 pass ran
    # against ~200 articles. Adding them locks the fix.
    (
        "Amazon has preponed its biggest sale event of the year, Prime Day. "
        "Amazon's annual Prime Day sale is moving to June 23-26 in the US, a first "
        "since 2021, influenced by the FIFA World Cup and US Independence Day. "
        "This four-day event aims to boost online spending, with a significant focus "
        "on groceries and household essentials as Amazon expands its rapid delivery "
        "services to compete with rivals.",
        "national", "business",
        "Amazon Prime Day — title+summary mentions FIFA World Cup in passing but "
        "the article IS about commerce. Must NOT classify as sports.",
    ),
    (
        "Rupee falls 28 paise to 95.64 against U.S. dollar in early trade",
        "national", "business", "Forex story — bank pattern fires; from national.",
    ),
    (
        "Sensex, Nifty tank in early trade over crude oil price rise; TCS falls 6%",
        "national", "business", "Market story — bank pattern fires.",
    ),
    (
        "Microsoft unveils AI models in push for independence from OpenAI",
        "national", "tech",
        "Microsoft + AI Models + OpenAI — clearly tech, was being missed by the "
        "first pass before smoking-gun tightening.",
    ),
    (
        "Ranveer Singh sues film body a week after 'ban' amid Don 3 row",
        "national", "entertainment", "Bollywood actor + film body — entertainment.",
    ),

    # ── Sire 2026-06-04 (pillar audit) — Delhi-hotel-fire disaster wires
    #    that were flooding the Politics tab. Each must demote to national. ──
    (
        "\"We Can't Recognise Them\": Families Search For Loved Ones After Delhi Fire. "
        "21 killed in massive hotel fire near New Delhi Railway Station. Death toll "
        "rises as foreign medical tourists trapped on upper floors burnt alive. "
        "Rescue teams continue search for missing persons; NDRF deployed.",
        "politics", "national",
        "Delhi hotel fire — multi-pattern disaster bank fire (hotel fire + killed in fire + death toll + rescue teams). Must demote politics → national.",
    ),
    (
        "Delhi Hotel Fire: Killer Lapses? Permission For 6 Rooms, Operated 25. "
        "Massive blaze killed 21 charred to death; fire safety violations under probe. "
        "Toll rises to 23.",
        "politics", "national",
        "Same Delhi fire wire, different angle — disaster patterns score well above threshold.",
    ),
    (
        "Foreign Medical Tourists Were Staying At Delhi Hotel Where Fire Killed 21. "
        "Building collapse feared; rescue operation underway. NDRF deployed.",
        "business", "national",
        "Disaster wire that NDTV business filed as business — demote.",
    ),

    # ── Education / exam-result notices that NDTV / India Today filed under
    #    politics. Each must demote to national. ──
    (
        "AFCAT 1 2026 answer key released at afcat.cdac.in — cut-off marks expected next week. "
        "Provisional answer key window opens for objections; final answer key in July. "
        "Merit list to follow after objection resolution.",
        "politics", "national",
        "AFCAT exam result wire — answer key + cut-off marks + merit list. Demote.",
    ),
    (
        "RRB NTPC result declared at rrbcdg.gov.in — check merit list, cut-off marks. "
        "Recruitment notification for next phase released; admit card download window opens.",
        "politics", "national",
        "RRB recruitment result — multi-pattern education bank. Demote.",
    ),
    (
        "UPPSC PCS prelims result declared — mains result expected by end of month. "
        "Interview list to follow. Reserve list for OBC candidates released separately.",
        "politics", "national",
        "UPPSC result + mains result + interview list. Demote.",
    ),
    (
        "CBSE Class 10 board exam result declared at cbseresults.nic.in — merit list released. "
        "Tie-break rules clarified for candidates seeking re-evaluation.",
        "politics", "national",
        "CBSE board result + merit list. Demote.",
    ),

    # ── Genuine politics that contains a fire/exam keyword in passing.
    #    Must NOT demote — single keyword hits below the 2-pattern threshold. ──
    (
        "Modi announces fire-safety policy reform during cabinet meeting; "
        "BJP, Congress agree on parliamentary committee setup",
        "politics", "politics",
        "Politics about fire policy — only one disaster word, no death toll, no rescue. Stays politics.",
    ),
    (
        "Amit Shah inaugurates engineering exam centre at IIT Delhi during state visit",
        "politics", "politics",
        "Single 'exam' mention without merit list / answer key / result. Stays politics.",
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
