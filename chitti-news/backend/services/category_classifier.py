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
    _w(r"cricket|cricketer|t20i|odi series|ipl 20\d\d|ipl\s*-?\s*\d+|wickets?|batsmen|bowler|bowlers|innings|test match|test series|test cricket|fielding"),
    # "world cup" / "asia cup" alone are too generic — FIFA World Cup is
    # routinely mentioned in business/political context (e.g. Amazon
    # Prime Day moved BECAUSE of FIFA World Cup). Require a sport
    # qualifier here so we only fire on actual sports articles.
    _w(r"(?:fifa|icc|t20i?|cricket|football|hockey|kabaddi) world cup|asia cup [a-z0-9]+|champions trophy|asian games|olympic medals?|paralympics?|commonwealth games|cwg 20\d\d|world athletics"),
    _w(r"messi|ronaldo|premier league|epl\b|la liga|serie a|champions league fixture|football match|football team|footballers?"),
    _w(r"tennis|wimbledon|us open tennis|french open tennis|australian open tennis|atp tour|wta tour|grand slam|federer|nadal|djokovic|sinner|alcaraz"),
    _w(r"hockey league|hockey match|hockey india|hockey team|fih (?:pro|world)"),
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
    # Commerce / retail — Amazon, Flipkart, sale events, ecommerce
    # heading words must register so "Amazon Prime Day" or "Flipkart
    # Big Billion Days" stays in business rather than falling out.
    _w(r"amazon|flipkart|reliance retail|jiomart|meesho|nykaa|myntra|tata cliq|big bazaar|d-mart|dmart|future retail|walmart|costco|shoprite"),
    _w(r"prime day|big billion days|great indian sale|end of season sale|black friday sale|cyber monday|festive sale|wedding sale"),
    _w(r"ecommerce|e-commerce|online shopping|online retail|grocery delivery|quick commerce|q-commerce|10[\s-]?minute delivery|rapid delivery|last[\s-]?mile delivery"),
    _w(r"stock|stocks|share market|sharemarket|share price|stock market|equities?|nifty|sensex|bse\b|nse\b|nasdaq|dow jones|s&p 500"),
    _w(r"\brupee\b|\bdollar\b|\beuro\b|\byen\b"),
    _w(r"forex|exchange rate|currency reserves|forex reserves|currency basket"),
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

# Sire 2026-06-04 (pillar audit, news_quality) — new demotion banks
# for stories that the source RSS tagged as politics or business but
# are actually disaster wires or exam-result notices. These banks
# never PROMOTE an article INTO disaster/education (we don't expose
# those as user-facing tabs); they only fire as a TRIGGER to demote
# the source category back to "national" so the Politics tab stops
# being a Delhi-hotel-fire wire.
_DISASTER = [
    _w(r"hotel fire|building fire|industrial fire|kitchen fire|restaurant fire|massive blaze|"
       r"factory fire|forest fire|warehouse fire|shop fire"),
    _w(r"killed in fire|killed in blaze|dead in fire|charred to death|trapped in fire|burnt alive"),
    _w(r"earthquake|aftershock|magnitude \d|seismograph|tremors? felt"),
    _w(r"landslide|landslip|hillside collapse|debris flow|cloudburst"),
    _w(r"flash flood|flood waters|cyclone|tropical storm|tsunami|storm surge"),
    _w(r"building collapse|wall collapse|bridge collapse|under-?construction collapse"),
    _w(r"stampede|crushed in stampede|stampede at"),
    _w(r"hooch tragedy|spurious liquor|illicit liquor|methanol poisoning"),
    _w(r"train accident|train derailment|bus accident|road accident|killed in (?:road|train|bus) accident|"
       r"killed in crash|killed in collision"),
    _w(r"blast|explosion|killed in blast|cylinder blast|boiler blast|firecracker blast"),
    _w(r"\d+ dead|\d+ killed|\d+ injured|\d+ hospitalis|toll rises to|death toll"),
    _w(r"rescue (?:teams?|operation)|debris being cleared|search for missing|disaster relief|ndrf"),
]

_EDUCATION = [
    _w(r"answer key|provisional answer key|final answer key|merit list|cut[-\s]?off marks?|"
       r"cut[-\s]?off list|rank list|qualifying marks?|tie[-\s]?break(?:er|ing) rules?"),
    _w(r"jee main|jee advanced|neet ug|neet pg|cuet|cuet ug|clat|jee main result|neet result"),
    _w(r"ssc cgl|ssc chsl|ssc mts|ssc gd|ssc je|ssc cpo"),
    _w(r"upsc|civil services exam|prelims result|mains result|interview list|reserve list"),
    _w(r"rrb (?:ntpc|group d|alp|je)|rrb result|railway recruitment|recruitment notification"),
    _w(r"uppsc|bpsc|mppsc|tnpsc|kpsc|appsc|tspsc|wbpsc|rpsc|hpsc|gpsc"),
    _w(r"afcat|cds|nda exam|tes recruitment|territorial army|sainik school"),
    _w(r"ctet|state tet|stet|kvs tet|nvs tet|tgt|pgt|prt"),
    _w(r"icse result|cbse result|board exam result|class 10 result|class 12 result|hsc result|ssc result"),
    _w(r"admit card|hall ticket|exam date|exam city|exam centre|window opens?"),
    _w(r"answer key released|result declared|merit list released|notification released|notification out"),
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
    # Demotion-only banks (Sire 2026-06-04). Never used as a destination
    # category — they exist purely so a disaster wire tagged as politics
    # by NDTV gets pulled back to "national". See _maybe_demote() below
    # and the override hook in classify().
    "_disaster":     _DISASTER,
    "_education":    _EDUCATION,
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
        # All entries here must be unambiguously sports — words that can
        # appear in business/national summaries as context (e.g. "FIFA
        # World Cup" mentioned in an Amazon Prime Day article) DO NOT
        # belong. Generic "world cup" / "asia cup" was demoted out of
        # smoking-gun after a live false positive 2026-06-03 — they now
        # need 2+ other sports patterns to fire via the bank route.
        r"wickets?|innings|batsmen|bowler|odi series|odi century|odi double century|t20i|test match|test series|test century|test double century|ranji trophy|"
        r"ipl 20\d\d|champions trophy|grand slam|olympic medal|"
        r"(?:icc|fifa|fih|hockey india league|hil) (?:world cup|t20i?|champions trophy)|"
        # Cricket figures whose mere mention in a headline is unambiguous.
        r"virat kohli|rohit sharma|jasprit bumrah|ms dhoni|ravindra jadeja|hardik pandya|sachin tendulkar|"
        r"india vs (?:australia|england|pakistan|south africa|new zealand|sri lanka|west indies|bangladesh|afghanistan)|"
        r"india(?:['']s)? clash with (?:australia|england|pakistan|south africa|new zealand|sri lanka|west indies|bangladesh|afghanistan)|"
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
      2. Run the smoking-gun pass to identify "strong" category signals.
      3. If a smoking gun fires AND no OTHER bank scores >= 2, override
         to the smoking-gun's bank. (Context check: an Amazon Prime Day
         article mentioning FIFA World Cup in passing should not become
         a sports article when its business signals are obviously
         dominant.)
      4. Else, if any bank scores >= MIN_MATCHES_TO_OVERRIDE AND beats
         the source's score, override to that bank.
      5. National-source nuance: when src == "national" (the catch-all
         default), MIN_MATCHES drops to 1 — a single forex pattern
         hit ("Rupee falls against dollar") is enough to move it to
         business.
      6. Else keep the source's category.

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

    # Score every bank by distinct-pattern match count.
    scores: dict[str, int] = {}
    for bank_name, patterns in _BANKS.items():
        hits = sum(1 for p in patterns if p.search(txt))
        if hits:
            scores[bank_name] = hits

    # Sire 2026-06-04 — disaster + education demotion check.  When the
    # source category is politics or business (the two tabs that were
    # leaking 43% and 27% in the pillar audit) AND either demotion
    # bank scores >= 2 distinct patterns, demote to "national".  Two
    # patterns is the trust threshold: a single mention of "fire" or
    # "exam" is not enough; "hotel fire" + "killed in fire" + "death
    # toll" together is.
    if src in ("politics", "business"):
        disaster_score = scores.get("_disaster", 0)
        education_score = scores.get("_education", 0)
        if disaster_score >= 2 or education_score >= 2:
            label = "disaster" if disaster_score >= education_score else "education"
            return ClassificationResult(
                category="national", overridden=True,
                reason=f"demote:{label}({disaster_score if label == 'disaster' else education_score})|src={src}",
                scores=scores,
            )

    # Smoking-gun pass.
    sg_hits: list[str] = []
    for bank, pat in _SMOKING_GUN.items():
        if pat.search(txt):
            sg_hits.append(bank)

    # Smoking gun fires AND no competing bank scores >= 2 → override.
    # If another bank scores >= 2, the smoking gun is most likely a
    # passing mention (Amazon Prime Day cites FIFA World Cup), so the
    # bank-scoring pass below should decide.
    if sg_hits:
        for cand in CATEGORY_PRIORITY:
            if cand not in sg_hits:
                continue
            if cand == src:
                continue
            # Any OTHER bank scoring >= 2 vetoes the smoking gun unless
            # the smoking gun's own bank also scores >= 2 (i.e. it has
            # both a smoking gun AND clear bank evidence).
            competing = [b for b, s in scores.items()
                         if b != cand and b != src and s >= 2]
            sg_bank_score = scores.get(cand, 0)
            if competing and sg_bank_score < 2:
                continue
            return ClassificationResult(
                category=cand, overridden=True,
                reason=f"smoking-gun:{cand}|bankScore={sg_bank_score}|competing={competing}",
                scores=scores | {"sg": sg_hits},
            )

    if not scores:
        return ClassificationResult(
            category=src, overridden=False,
            reason="no-bank-matched", scores=scores,
        )

    # Pick the bank with the most distinct-pattern matches, ignoring
    # demotion-only banks (prefixed with "_") which are never user-
    # facing destination categories. Resolve ties via CATEGORY_PRIORITY.
    user_facing = {b: s for b, s in scores.items() if not b.startswith("_")}
    if not user_facing:
        return ClassificationResult(
            category=src, overridden=False,
            reason="no-user-facing-bank-matched", scores=scores,
        )
    top_bank = max(user_facing.keys(), key=lambda b: (user_facing[b], -CATEGORY_PRIORITY.index(b)
                                                       if b in CATEGORY_PRIORITY else 99))
    top_score = user_facing[top_bank]
    src_score = user_facing.get(src, 0)

    # National is the catch-all default — most "national" articles
    # would be better classified as something specific. Lower the
    # threshold there so single strong signals (one forex pattern,
    # one entertainment pattern) can pull articles out of the bucket.
    min_matches = 1 if src == "national" else MIN_MATCHES_TO_OVERRIDE

    if top_bank != src and top_score >= min_matches and top_score > src_score:
        return ClassificationResult(
            category=top_bank, overridden=True,
            reason=f"banks:top={top_bank}({top_score})>src={src}({src_score})|minMatches={min_matches}",
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
