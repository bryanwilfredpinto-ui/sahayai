"""
services/category_classifier.py
-------------------------------
Content-based re-classifier.  The RSS layer at services/news_ingest.py
trusts each source's declared category (e.g. NDTV's Business RSS
gets category="business" wholesale). That worked while the corpus was
small but Sire 2026-06-03 caught the exact failure mode that breaks
trust in the information architecture:

    Click "Business" → first card is "West Indies vs Sri Lanka:
    Schedule, WI vs SL Live Streaming Details, Match Timings (IST)"

That cricket article was tagged business because NDTV's /business
RSS feed dumps political ceremonies, weather alerts, foreign-affairs
explainers and cricket schedules into the same firehose.  Sire said:
"If I clicked Business and immediately saw a cricket match article,
that alone would stop me from calling the experience world-class,
because it undermines trust in the information architecture."

This module re-classifies an article by inspecting title+summary
against a curated keyword bank per category.  It is intentionally
high-precision: when the signal is weak, we trust the source and
keep its declared category.  We only override when the content has
unambiguous evidence of a different category.

Wired in two places:
  • At ingest time (news_ingest.py) — every NEW article gets the
    refined category before the row is committed.
  • One-shot retroactive endpoint (/api/news/admin/reclassify) —
    walks the existing 7000+ articles and updates rows where the
    refined category differs from the stored one.

No ML, no LLM, no remote calls. Keyword precision + ordering.  When
we eventually add an LLM tier it slots in via classify_with_llm()
below as a confirmation step on the borderline rows.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

# ── Category keyword banks ──────────────────────────────────────────
# Each bank is a list of compiled regex patterns. They use word
# boundaries to avoid e.g. "cricketer" matching "rocket".  Order
# inside the bank does not matter; order ACROSS banks matters and is
# governed by CATEGORY_PRIORITY below.

def _w(pattern: str) -> re.Pattern:
    """Compile a case-insensitive whole-word pattern."""
    return re.compile(r"\b(?:" + pattern + r")\b", re.IGNORECASE)


_SPORTS = [
    _w(r"cricket|cricketer|t20|odi|ipl 20\d\d|ipl\s*-?\s*\d+|wickets?|batsman|batsmen|bowler|bowlers|innings|test match|test series|test cricket|fielding"),
    _w(r"world cup|asia cup|champions trophy|asian games|olympics?|olympic games|paralympics?|commonwealth games|cwg|world athletics"),
    _w(r"fifa|messi|ronaldo|premier league|epl|la liga|serie a|champions league|football match|football team|footballers?"),
    _w(r"tennis|wimbledon|us open|french open|australian open|atp|wta|grand slam|federer|nadal|djokovic|sinner|alcaraz"),
    _w(r"hockey league|hockey match|hockey india|hockey team|fih"),
    _w(r"badminton|pv sindhu|saina nehwal|chirag shetty|satwiksairaj"),
    _w(r"wrestling|wrestler|kabaddi|pro kabaddi|pkl|boxing match|boxers? defeat|boxers? beat|olympic boxer"),
    _w(r"chess|gukesh|magnus carlsen|fide|grandmaster"),
    _w(r"formula 1|formula one|f1 grand prix|verstappen|hamilton|red bull racing|moto gp|motogp"),
    _w(r"esports|gaming championship|valorant|dota 2|league of legends"),
    # India-specific cricket figures
    _w(r"virat kohli|rohit sharma|jasprit bumrah|ms dhoni|ravindra jadeja|hardik pandya|surya ?kumar|kl rahul|gautam gambhir|rahul dravid"),
    # Sports teams + tournaments
    _w(r"india vs (?:australia|england|pakistan|south africa|new zealand|sri lanka|west indies|bangladesh|afghanistan)"),
    _w(r"(?:csk|mi|rcb|kkr|srh|dc|pbks|gt|lsg|rr)\s+(?:beat|defeat|vs|win|lose|chase|innings|squad)"),
]

_ENTERTAINMENT = [
    _w(r"bollywood|tollywood|kollywood|mollywood|sandalwood|pollywood"),
    _w(r"movie|film|movies|cinema|theatres?|theaters?|box office|trailer launch|teaser launch|first look|movie release|film release"),
    _w(r"web series|netflix|amazon prime video|hotstar|jio cinema|sony liv|zee5|disney\+? hotstar|prime video|ott platform|ott release"),
    _w(r"actor|actress|filmmaker|director|producer|cinematographer|playback singer|item song"),
    _w(r"song release|song launch|song teaser|music video|music album|lyric video|jukebox"),
    _w(r"red carpet|award show|filmfare|iifa|oscars?|academy awards?|cannes festival|venice film festival"),
    _w(r"shahrukh khan|shah rukh khan|salman khan|aamir khan|amitabh bachchan|deepika padukone|alia bhatt|ranbir kapoor|ranveer singh|kareena kapoor|priyanka chopra|katrina kaif"),
    _w(r"rajinikanth|kamal haasan|vijay|ajith|surya|allu arjun|mahesh babu|ram charan|prabhas|jr ntr"),
    _w(r"taylor swift|beyonc[eé]|justin bieber|bts|blackpink|coldplay|ed sheeran"),
    _w(r"tv show|reality show|bigg boss|kbc|kaun banega crorepati|dance plus|indian idol"),
    # Hollywood actors + iconic franchise names — common gossip fodder
    # in NDTV / TOI national feeds that ought to be entertainment.
    _w(r"robert pattinson|robert downey|tom cruise|tom hanks|leonardo dicaprio|brad pitt|angelina jolie|jennifer lawrence|scarlett johansson|chris evans|chris hemsworth|chris pratt|emma stone|emma watson|margot robbie|ryan gosling|ryan reynolds|denzel washington|will smith|kevin hart"),
    _w(r"harry potter|lord of the rings|game of thrones|stranger things|the witcher|breaking bad|marvel cinematic|mcu\b|dceu\b|james bond|mission impossible|fast and furious|jurassic world|jurassic park|star wars|avengers?|black panther|spider[-\s]?man|iron man|batman movie|wonder woman"),
]

_POLITICS = [
    _w(r"prime minister|pm modi|narendra modi|amit shah|rahul gandhi|sonia gandhi|home minister|defence minister|finance minister|external affairs minister"),
    _w(r"chief minister|deputy cm|cm\s+\w+|governor|lieutenant governor|cabinet minister|cabinet expansion|cabinet reshuffle"),
    _w(r"bjp|congress party|inc|aap|tmc|dmk|aiadmk|trs|brs|jd\(u\)|jdu|jds|sp|samajwadi party|bsp|shiv sena|ncp|cpi\(m\)|cpm|akali dal|biju janata dal|bjd|rjd"),
    _w(r"general elections?|loksabha elections?|lok sabha elections?|assembly elections?|state polls?|by-?elections?|by-?polls?|by\s*election|panchayat elections?"),
    _w(r"swearing-in|swearing in|oath ceremony|portfolio allocation|cabinet meeting|all-party meeting|opposition meeting"),
    _w(r"parliament session|monsoon session|budget session|winter session|lok sabha|rajya sabha|parliament passes|parliament rejects"),
    _w(r"manifesto|alliance|seat-sharing|seat sharing|candidate list|nomination"),
    _w(r"vote share|exit poll|opinion poll|electoral commission|election commission|ecil|eci"),
    _w(r"president of india|droupadi murmu|venkaiah naidu|ram nath kovind"),
    _w(r"diplomat|ambassador|foreign secretary|external affairs|jaishankar|s jaishankar|mea\b|external affairs ministry"),
    # Diplomatic appointments — the IFS officer / ambassador-to pattern
    # surfaces in NDTV's business RSS. One match is enough alongside
    # any other politics signal; the smoking-gun line below catches
    # the unambiguous "appoints ambassador to X" / "IFS officer" forms.
    _w(r"ifs officer|appoints? (?:next )?ambassador to|new ambassador to|consul[\s-]?general"),
]

_BUSINESS = [
    _w(r"stock|stocks|share market|sharemarket|share price|stock market|equities?|nifty|sensex|bse\b|nse\b|nasdaq|dow jones|s&p 500"),
    _w(r"rupee|dollar|forex|exchange rate|currency|currency reserves|forex reserves"),
    _w(r"gdp|inflation|cpi|wpi|repo rate|reverse repo|monetary policy|mpc meeting|rbi\b|sebi\b|finance ministry|fiscal deficit"),
    _w(r"ipo|fpo|qip|preferential issue|rights issue|listing day|fund(?:-|\s)?raise|fundraising|valuation|unicorn|decacorn"),
    _w(r"merger|acquisition|m&a|takeover|stake sale|equity stake|joint venture|jv\b"),
    _w(r"earnings|profit|revenue|topline|bottom\s*line|operating margin|ebitda|net profit|quarterly results|q1 results|q2 results|q3 results|q4 results"),
    _w(r"ceo|cfo|coo|cto|chairman|managing director|md\b|board of directors"),
    _w(r"tariff|trade deal|trade war|wto|gst|gst council|income tax|corporate tax|tax slab"),
    _w(r"investor|fund manager|portfolio|aum|mutual fund|sip|systematic investment plan|fii|dii|fpis?"),
    _w(r"adani|ambani|reliance industries|tata group|tcs|infosys|wipro|hcl|hdfc|icici|kotak mahindra|axis bank|sbi\b|state bank of india|bajaj finance|bajaj finserv"),
    _w(r"start[\s-]?up|venture capital|vc funding|series [a-z] funding|seed funding|angel investor|founder"),
    _w(r"gold price|silver price|crude oil price|brent crude|nymex|commodity"),
    _w(r"goldman sachs|morgan stanley|jp morgan|nomura|citi(?:group)?|deutsche bank|barclays|hsbc|standard chartered"),
]

_TECH = [
    _w(r"artificial intelligence|machine learning|deep learning|neural network|llm\b|large language model|generative ai|gen ai|chatgpt|gemini|claude|grok|openai|open ai|anthropic|deepseek|gpt-?4|gpt-?5|copilot|microsoft copilot|ai models?|new ai model"),
    _w(r"smartphone|smartphones|android phone|iphone|ios|samsung galaxy|oneplus|xiaomi|redmi|realme|vivo|oppo|nothing phone"),
    _w(r"laptop launch|tablet launch|smartwatch|wearable"),
    _w(r"semiconductor|chipmaker|chip(?:-|\s)?making|nvidia|amd\b|intel chip|tsmc|asml"),
    _w(r"cybersecurity|data breach|hacked|ransomware|phishing|malware|spyware"),
    _w(r"cloud computing|aws\b|azure cloud|google cloud|gcp\b"),
    _w(r"app launch|app update|software update|firmware update"),
    _w(r"5g\b|6g\b|fibre internet|broadband|wifi 7|spectrum auction"),
    _w(r"social media|twitter|x\.com|facebook|instagram|reddit|youtube|tiktok"),
    _w(r"cryptocurrency|bitcoin|ethereum|crypto exchange|blockchain"),
    _w(r"electric vehicle|ev maker|tesla|byd\b|battery technology|autonomous vehicle|self-?driving"),
    _w(r"satellite launch|isro\b|spacex|starlink"),
    # Microsoft / Google / Apple as headline subjects (proprietary models /
    # OS launches) — second match boosts confidence past threshold.
    _w(r"microsoft (?:unveils|launches|announces|releases)|google (?:unveils|launches|announces|releases)|apple (?:unveils|launches|announces|releases)"),
]

# State-mapping isn't a content tag; states are inferred separately
# from the source.  We don't classify INTO 'state' here.

_BANKS = {
    "sports":        _SPORTS,
    "entertainment": _ENTERTAINMENT,
    "politics":      _POLITICS,
    "business":      _BUSINESS,
    "tech":          _TECH,
}

# Confidence threshold: count of distinct keyword patterns that
# matched.  At 2+ we're confident; at 1 we're not (single keyword
# can appear spuriously). High-precision over high-recall.
MIN_MATCHES_TO_OVERRIDE = 2

# Single-bank "smoking gun" patterns — when these match, ONE hit is
# enough to override.  These are unambiguous: "innings" or "wickets"
# in a headline is never about anything but cricket.
_SMOKING_GUN = {
    "sports": _w(
        r"wickets?|innings|batsman|batsmen|bowler|odi|t20|test match|ranji trophy|ipl 20\d\d|"
        r"world cup|asia cup|premier league|champions league|grand slam|olympic medal|"
        r"india vs (?:australia|england|pakistan|south africa|new zealand|sri lanka|west indies|bangladesh|afghanistan)|"
        r"west indies vs (?:australia|england|pakistan|south africa|new zealand|sri lanka|bangladesh|afghanistan|india)"
    ),
    "entertainment": _w(
        r"box office|trailer launch|first look|web series|item song|bollywood|tollywood|"
        r"red carpet|filmfare|iifa|oscars?|academy awards?|"
        r"harry potter|marvel cinematic|james bond|mission impossible|star wars|"
        r"robert pattinson|tom cruise|leonardo dicaprio|brad pitt|"
        r"shahrukh khan|salman khan|aamir khan|amitabh bachchan|deepika padukone|alia bhatt"
    ),
    "politics": _w(
        r"swearing-in|swearing in|cabinet reshuffle|cabinet expansion|by-?elections?|"
        r"loksabha elections?|lok sabha elections?|assembly elections?|exit poll|opinion poll|"
        r"election commission|nomination filed|prime minister modi|home minister amit shah|"
        r"appoints? (?:next )?ambassador to|new ambassador to|ifs officer"
    ),
    "business": _w(
        r"stock market crash|stock market rally|nifty hits|sensex hits|ipo opens|ipo closes|"
        r"quarterly results|q[1-4] results|repo rate|monetary policy|inflation rises|inflation falls|"
        r"target price|brokerage call|gdp grows|gdp contracts"
    ),
    "tech": _w(
        r"chatgpt|openai|open ai|llm|gpt-?\d|microsoft copilot|copilot\?|google gemini|"
        r"anthropic claude|deepseek|data breach|ransomware|spacex starlink|satellite launch|"
        r"cryptocurrency|new ai models?|microsoft (?:unveils|launches|announces|releases) "
        r"(?:its|new|proprietary|own)"
    ),
}

# When two banks disagree, this ordering picks the winner. Sports
# first because cricket headlines are the most often miscategorised
# pattern Sire flagged (cricket → business via NDTV business RSS).
CATEGORY_PRIORITY = ["sports", "entertainment", "politics", "tech", "business"]


@dataclass
class ClassificationResult:
    category: str            # final category
    overridden: bool         # was the source's category replaced?
    reason: str              # short audit trail (for logs / debugging)
    scores: dict             # {bank: match_count}


def classify(text: str, source_category: str) -> ClassificationResult:
    """
    Decide the final category for an article given its title+summary
    text and the source's declared category.

    Returns a ClassificationResult with the chosen category and an
    audit trail.  The caller is expected to write the result.category
    into article.category and log the reason on every override.

    Decision rules (in order):
      1. Score every bank by counting distinct pattern matches.
      2. If a SMOKING_GUN regex matches a single bank, override.
      3. Else if any bank scores >= MIN_MATCHES_TO_OVERRIDE AND beats
         the source's score by at least 1, override to that bank.
      4. Else keep the source's category.

    The source's category is never overridden when (a) confidence is
    weak, (b) the leading bank is the same as the source, or (c) the
    text is empty (under 20 chars).
    """
    txt = (text or "").strip()
    if len(txt) < 20:
        return ClassificationResult(
            category=source_category,
            overridden=False,
            reason="text-too-short",
            scores={},
        )

    src = (source_category or "national").lower()

    # Smoking-gun pass — these are unambiguous category signals.
    sg_hits = []
    for bank, pat in _SMOKING_GUN.items():
        if pat.search(txt):
            sg_hits.append(bank)
    # Resolve a smoking-gun by CATEGORY_PRIORITY so cricket beats biz
    # if both fire (extremely rare).
    if sg_hits:
        for cand in CATEGORY_PRIORITY:
            if cand in sg_hits and cand != src:
                return ClassificationResult(
                    category=cand,
                    overridden=True,
                    reason=f"smoking-gun:{cand}",
                    scores={"sg": sg_hits},
                )

    # Score every bank by distinct-pattern match count.
    scores: dict[str, int] = {}
    for bank_name, patterns in _BANKS.items():
        hits = sum(1 for p in patterns if p.search(txt))
        if hits:
            scores[bank_name] = hits

    if not scores:
        return ClassificationResult(
            category=src, overridden=False,
            reason="no-bank-matched", scores=scores,
        )

    # Pick the bank with the most distinct-pattern matches (resolve
    # ties via CATEGORY_PRIORITY).  If it beats source score by enough
    # and clears MIN_MATCHES_TO_OVERRIDE, override.
    top_bank = max(scores.keys(), key=lambda b: (scores[b], -CATEGORY_PRIORITY.index(b)
                                                  if b in CATEGORY_PRIORITY else 99))
    top_score = scores[top_bank]
    src_score = scores.get(src, 0)

    if top_bank != src and top_score >= MIN_MATCHES_TO_OVERRIDE and top_score > src_score:
        return ClassificationResult(
            category=top_bank, overridden=True,
            reason=f"banks:top={top_bank}({top_score})>src={src}({src_score})",
            scores=scores,
        )

    return ClassificationResult(
        category=src, overridden=False,
        reason=f"banks:top={top_bank}({top_score})~src={src}({src_score})-keep",
        scores=scores,
    )


def classify_article(title: str, summary: Optional[str], source_category: str) -> str:
    """
    Convenience entry point — most callers just want the final
    category string. Combines title + summary into the classification
    text. Falls through to source_category on any error so an
    ingestion bug here never kills the pipeline.
    """
    try:
        text = (title or "") + " . " + (summary or "")
        return classify(text, source_category).category
    except Exception:  # noqa: BLE001
        return source_category or "national"


# Placeholder for the eventual LLM confirmation tier — when DeepSeek
# is funded we'll wire this to confirm borderline classifications
# (score 1 or score 2 ties).  Right now it's a no-op.
def classify_with_llm(text: str, candidate: str) -> str:  # pragma: no cover
    return candidate
