"""
lib/quadrails.py
----------------
Four rails that gate every Chitti response.

The rails are evaluated in this order on every model interaction:

  1. SafetyRail       — block hate speech, violence, self-harm content
                        (regex + wordlist; LLM-based double-check is optional
                        and off by default to keep per-request cost flat).
  2. RelevanceRail    — keep the user on-topic for this Chitti. Each Chitti
                        has a topic config (e.g. medupi = medicines only).
                        Off-topic requests get a polite redirect, not a block.
  3. TruthRail        — runs only AFTER the model. Compares the model's
                        claims against a "ground-truth" source bundle when
                        the calling code provides one (e.g. for MedUPI the
                        ground truth is the medicines row from Turso).
  4. ComplianceRail   — enforces the per-domain disclaimer is in the response.
                        Injects it if missing. Different verbatim text per Chitti:
                          medupi  -> "Not medical advice. Consult your doctor."
                          legal   -> "Not legal advice. Consult an advocate."
                          ca      -> "Not financial advice. Consult a CA."
                          news    -> "Verify with the source — Chitti aggregates, not editorialises."

Every rail returns a CheckResult; aggregate verdict drives the response.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Any, Sequence


# ---------- Public types --------------------------------------------------


class Action(str, Enum):
    PASS = "pass"               # nothing to do
    WARN = "warn"               # log + add a soft note to response
    REDIRECT = "redirect"       # gently steer user back on topic
    INJECT = "inject"           # add missing content (e.g. disclaimer)
    BLOCK = "block"             # refuse + audit-log


@dataclass
class CheckResult:
    rail: str
    action: Action
    reason: str = ""
    payload: dict | None = None  # extra structured data the hook may use

    @property
    def passed(self) -> bool:
        return self.action == Action.PASS


# ---------- Rail interface ------------------------------------------------


class Quadrail:
    """Base class. Subclasses implement check_input and/or check_output."""

    name = "unknown"

    def check_input(self, text: str, ctx: dict) -> CheckResult:
        return CheckResult(self.name, Action.PASS)

    def check_output(self, user_input: str, model_output: str, ctx: dict) -> CheckResult:
        return CheckResult(self.name, Action.PASS)


# ---------- 1. SafetyRail -------------------------------------------------


# Conservative word-list. Single matches trigger BLOCK; this is for catastrophic
# patterns only. Soft language ("I hate Mondays") MUST NOT match.
# Patterns are case-insensitive whole-word boundaries with phrase support.
_HATE_PATTERNS = [
    # ethnic / religious slur stems (excerpted; expand via config when needed)
    r"\bkill (all|every) (the )?(muslim|hindu|sikh|christian|jew|dalit|brahmin)s?\b",
    r"\bgenocide (the|all|every)\b",
    r"\bgas the\b",
    r"\bexterminate (the|all|every)\b",
]
_VIOLENCE_PATTERNS = [
    r"\bhow (do|can) i (build|make) (a )?(bomb|ied|pipe bomb|nail bomb)\b",
    r"\bsynthesi[zs]e (sarin|ricin|vx|anthrax|cyanide gas)\b",
    r"\b(make|build) (a )?(gun|silencer|suppressor) (at|from) home\b",
]
_SELF_HARM_PATTERNS = [
    # Detect requests for HOW; passive references ("I'm sad" / "I want to die")
    # are handled as care-pathway, not a block. See SelfHarmCarePath below.
    r"\bhow (do|can|to) (i )?(kill myself|commit suicide|hang myself|overdose)\b",
    r"\bbest way to (kill myself|end (it|my life)|overdose)\b",
    r"\bpainless suicide method\b",
]
# Soft-distress phrases: do NOT block; surface a care-pathway nudge.
_DISTRESS_PHRASES = [
    r"\bi (want to|wanna) die\b",
    r"\bi (can't|cannot|don't want to) (go on|live)\b",
    r"\b(life is|i am) hopeless\b",
    r"\bi feel like (ending it|giving up)\b",
]


def _matches_any(text: str, patterns: Sequence[str]) -> str | None:
    """Return the first matching pattern or None. Case-insensitive."""
    t = text.lower()
    for pat in patterns:
        if re.search(pat, t):
            return pat
    return None


class SafetyRail(Quadrail):
    """Block hate / violence / self-harm-method requests.

    Soft distress phrases ("I want to die") are NOT blocked — they trigger a
    care-pathway WARN that asks the calling code to attach a Vaani / KIRAN
    helpline pointer (1800-599-0019) instead of refusing the user.
    """

    name = "safety"

    def check_input(self, text: str, ctx: dict) -> CheckResult:
        if (hit := _matches_any(text, _HATE_PATTERNS)):
            return CheckResult(self.name, Action.BLOCK,
                               reason="hate_speech",
                               payload={"pattern": hit})
        if (hit := _matches_any(text, _VIOLENCE_PATTERNS)):
            return CheckResult(self.name, Action.BLOCK,
                               reason="violence_howto",
                               payload={"pattern": hit})
        if (hit := _matches_any(text, _SELF_HARM_PATTERNS)):
            return CheckResult(self.name, Action.BLOCK,
                               reason="self_harm_method_request",
                               payload={"pattern": hit, "care_path": True})
        if (hit := _matches_any(text, _DISTRESS_PHRASES)):
            return CheckResult(self.name, Action.WARN,
                               reason="distress_signal",
                               payload={"care_path": True})
        return CheckResult(self.name, Action.PASS)


# ---------- 2. RelevanceRail ----------------------------------------------


# Per-Chitti topic config: keywords that suggest the user IS on-topic. If the
# input has zero overlap with the topic vocabulary AND is more than ~6 words
# long (i.e. a real query, not a greeting), surface a redirect.
# This is intentionally lenient — we'd rather answer than refuse.
_RELEVANCE_TOPICS = {
    "chitti-medupi":   ["medicine", "medicines", "drug", "pill", "tablet", "syrup",
                        "doctor", "prescription", "pharmacy", "chemist", "generic",
                        "jan aushadhi", "mrp", "salt", "composition", "strength",
                        "dosage", "reminder", "refill", "wallet", "insurance",
                        "दवा", "दवाई", "गोली", "केमिस्ट"],
    "chitti-news":     ["news", "headline", "story", "today", "breaking",
                        "politics", "sports", "business", "tech", "entertainment",
                        "state", "national", "world", "election", "court",
                        "खबर", "समाचार"],
    "chitti-government": ["scheme", "yojana", "subsidy", "benefit", "eligibility",
                          "pm-kisan", "ayushman", "ration", "aadhaar", "pan",
                          "voter id", "passport", "license", "license", "form",
                          "application", "document", "digilocker", "csc",
                          "योजना", "सरकारी", "लाभ", "आवेदन"],
    "chitti-vaani":    ["call", "email", "message", "send", "speak", "voice",
                        "whatsapp", "gmail", "emergency", "remind", "schedule",
                        "बात", "बोल", "भेज", "ईमेल", "वॉइस"],
    "chitti-ca":       ["tax", "gst", "itr", "return", "form 16", "section",
                        "deduction", "exemption", "audit", "tds", "advance tax",
                        "pan", "salary", "freelancer", "msme", "income",
                        "ca", "chartered accountant", "tax saving",
                        "टैक्स", "जीएसटी", "आयकर"],
    "chitti-legal":    ["law", "legal", "fir", "notice", "court", "advocate",
                        "lawyer", "section", "ipc", "crpc", "bns", "rent",
                        "tenant", "landlord", "deposit", "cheque", "138",
                        "divorce", "marriage", "property", "consumer",
                        "कानून", "अधिवक्ता", "वकील", "अदालत"],
    "chitti-shares":   ["stock", "share", "equity", "nifty", "sensex", "bse",
                        "nse", "fundamental", "technical", "chart", "indicator",
                        "p/e", "p/b", "roe", "dividend", "ipo", "buy", "sell",
                        "portfolio", "watchlist", "screener", "angel",
                        "शेयर", "बाजार"],
    "chitti-scanner":  ["scan", "photo", "image", "document", "card", "aadhaar",
                        "pan", "passport", "bill", "receipt", "medicine strip",
                        "स्कैन", "फोटो", "दस्तावेज़"],
    "chitti-upi":      ["upi", "payment", "phonepe", "paytm", "gpay", "scam",
                        "fraud", "kyc", "otp", "vpa", "fishy", "suspicious",
                        "fake", "warning", "blackmail", "lottery", "kbc",
                        "धोखा", "फ्रॉड", "स्कैम"],
    "chitti-logo-video": ["logo", "video", "brand", "business name", "design",
                          "monogram", "reel", "shop board", "signage",
                          "लोगो", "वीडियो", "ब्रांड"],
    "chitti-voice-factory": ["voice", "tts", "stt", "speech", "donate", "donor",
                             "language", "sanskrit", "bhojpuri", "oraon",
                             "hindi", "tamil", "telugu", "kannada", "malayalam",
                             "bengali", "marathi", "gujarati", "punjabi",
                             "आवाज़", "भाषा"],
    "chitti-sales":    ["sale", "sell", "customer", "lead", "pitch", "follow up",
                        "objection", "close", "discount", "price", "negotiate",
                        "carnegie", "cialdini", "spin", "challenger",
                        "बिक्री", "ग्राहक"],
}


class RelevanceRail(Quadrail):
    """Soft redirect when the user is clearly off-topic for this Chitti."""

    name = "relevance"

    def __init__(self, chitti: str, custom_topics: list[str] | None = None):
        self.chitti = chitti
        self.topics = custom_topics or _RELEVANCE_TOPICS.get(chitti, [])

    def check_input(self, text: str, ctx: dict) -> CheckResult:
        # Empty / short greetings — pass. We don't want to bounce a "hello".
        words = re.findall(r"\w+", text.lower())
        if len(words) < 7:
            return CheckResult(self.name, Action.PASS)
        if not self.topics:
            # No vocabulary configured — never redirect. Useful for new Chittis.
            return CheckResult(self.name, Action.PASS)
        lowered = text.lower()
        hit_count = sum(1 for kw in self.topics if kw in lowered)
        if hit_count == 0:
            return CheckResult(self.name, Action.REDIRECT,
                               reason="off_topic",
                               payload={"chitti": self.chitti,
                                        "expected_topics": self.topics[:5]})
        return CheckResult(self.name, Action.PASS)


# ---------- 3. TruthRail --------------------------------------------------


class TruthRail(Quadrail):
    """Detect blatant hallucinations against a provided source bundle.

    Call sites that have ground-truth data (e.g. MedUPI's medicines row) put
    it into `ctx["truth_sources"]` as a list of strings before invoking
    after_model. We check that any numeric / brand-name claim in the output
    appears in at least one source string. This is a heuristic — not a proof.

    If ctx["truth_sources"] is missing or empty, this rail passes (we have
    nothing to compare against).
    """

    name = "truth"

    # Things that are easy to hallucinate and easy to verify literally:
    # - numbers (prices, dosages, percentages)
    # - rupee amounts
    # - section numbers ("Section 80C", "IPC 420")
    _NUMERIC_CLAIM = re.compile(
        r"(₹\s*[\d,]+(?:\.\d+)?|\bRs\.?\s*[\d,]+(?:\.\d+)?"
        r"|\bSection\s*\d+[A-Z]?\b"
        r"|\b\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g|%|crore|lakh|kg|km|kmpl)\b)",
        re.IGNORECASE,
    )

    def check_output(self, user_input: str, model_output: str, ctx: dict) -> CheckResult:
        sources: list[str] = ctx.get("truth_sources") or []
        if not sources:
            return CheckResult(self.name, Action.PASS, reason="no_sources_provided")

        joined = " || ".join(sources).lower()
        unverified: list[str] = []
        for m in self._NUMERIC_CLAIM.finditer(model_output):
            claim = m.group(0).strip()
            # Strip ₹/Rs/spaces for a looser comparison
            needle = re.sub(r"[₹\s,]|Rs\.?", "", claim, flags=re.IGNORECASE).lower()
            if needle and needle not in joined:
                unverified.append(claim)

        if unverified:
            return CheckResult(
                self.name, Action.WARN,
                reason="unverified_numeric_claim",
                payload={"claims": unverified[:5]},
            )
        return CheckResult(self.name, Action.PASS)


# ---------- 4. ComplianceRail ---------------------------------------------


_DISCLAIMERS = {
    "chitti-medupi":   "Not medical advice. Consult your doctor or pharmacist.",
    "chitti-legal":    "Not legal advice. Consult a licensed advocate.",
    "chitti-ca":       "Not financial advice. Consult a registered CA.",
    "chitti-news":     "Verify with the source — Chitti aggregates, not editorialises.",
    "chitti-government": "Verify scheme eligibility on MyScheme / DigiLocker before applying.",
    "chitti-shares":   "Chitti is NOT SEBI REGISTERED. Educational content only — not investment advice.",
    "chitti-upi":      "Chitti is a warning tool — does not block payments. Decide with your bank app.",
    "chitti-scanner":  "Scanner reads what you show. Verify with the issuing authority.",
    "chitti-vaani":    "Chitti acts on your behalf only after readback. Review actions in the audit log.",
    "chitti-logo-video": "Honest stub: SVG monogram + mock video until provider keys land.",
    "chitti-voice-factory": "Tier C languages may use mock_bhashini until ULCA creds arrive — surfaced in the response.",
    "chitti-sales":    "Coaching only — not a guarantee of outcomes.",
}


class ComplianceRail(Quadrail):
    """Inject the per-Chitti disclaimer into responses that lack it."""

    name = "compliance"

    def __init__(self, chitti: str, disclaimer: str | None = None):
        self.chitti = chitti
        self.disclaimer = disclaimer or _DISCLAIMERS.get(chitti, "")

    def check_output(self, user_input: str, model_output: str, ctx: dict) -> CheckResult:
        if not self.disclaimer:
            return CheckResult(self.name, Action.PASS, reason="no_disclaimer_configured")
        if self.disclaimer in model_output:
            return CheckResult(self.name, Action.PASS, reason="disclaimer_present")
        # Heuristic: if the model already wrote a "consult X" line, the spirit
        # of the disclaimer is there. Don't double-inject — log instead.
        soft_signals = ("consult", "verify", "not advice", "not a substitute",
                        "doctor", "advocate", "ca ", "lawyer")
        if any(s in model_output.lower() for s in soft_signals):
            return CheckResult(self.name, Action.WARN, reason="soft_disclaimer_only",
                               payload={"want": self.disclaimer})
        return CheckResult(self.name, Action.INJECT,
                           reason="disclaimer_missing",
                           payload={"text": self.disclaimer})


# ---------- Factory -------------------------------------------------------


def build_default_quadrails(chitti: str) -> list[Quadrail]:
    """Standard 4-rail set wired for a given Chitti.

    Order is meaningful — input rails (safety, relevance) run first; output
    rails (truth, compliance) run on the model's reply.
    """
    return [
        SafetyRail(),
        RelevanceRail(chitti=chitti),
        TruthRail(),
        ComplianceRail(chitti=chitti),
    ]
