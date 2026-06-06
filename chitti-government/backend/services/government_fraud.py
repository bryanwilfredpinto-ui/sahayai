"""
services/government_fraud.py
----------------------------
Government Fraud Shield — deterministic, offline classifier (CEOS Feature 6).
No LLM in the critical path: rules are the product (chitti-news-ai / fashion
doctrine). Mirrors the client-side checkFraud() in chitti_government.html so a
Vaani-routed answer and the standalone page agree.

Verdict vocabulary: likely_fraud | suspicious | likely_genuine.
NEVER auto-dials police — always returns the official report channels.
Honest both ways: a genuine government message must not be over-flagged
(see ../guardrails/fraud_honesty.md).
"""
from __future__ import annotations

import re

REPORT_CHANNELS = [
    {"label": "Call 1930 (cyber-fraud helpline)", "value": "tel:1930"},
    {"label": "cybercrime.gov.in", "value": "https://www.cybercrime.gov.in/"},
    {"label": "Sanchar Saathi / Chakshu", "value": "https://sancharsaathi.gov.in/"},
]

GOVERNMENT_NEVER = (
    "Government NEVER asks for OTP/PIN/CVV, never charges a fee for a free scheme, "
    "and only uses .gov.in / .nic.in links. Real benefits arrive directly in your "
    "Aadhaar-seeded bank account — never via a link."
)

_URL_RE = re.compile(r"https?://[^\s]+", re.I)


def _has(t: str, *words: str) -> bool:
    return any(w in t for w in words)


def classify(text: str) -> dict:
    raw = text or ""
    t = raw.lower()
    flags: list[dict] = []

    if _has(t, "otp", "pin", "cvv", "one time password", "ओटीपी"):
        flags.append({"sev": 3, "reason": "Asks for OTP / PIN / CVV — government NEVER asks for these."})
    if _has(t, ".apk", "download the app", "install the app", "anydesk", "teamviewer", "quicksupport"):
        flags.append({"sev": 3, "reason": "Asks to install an app / APK / remote-access tool — account-takeover scam."})
    if _has(t, "digital arrest", "arrest", "cbi", "police case", "ed case", "customs case"):
        flags.append({"sev": 3, "reason": 'Threatens arrest / "digital arrest" — this does not exist in Indian law; police never arrest over a call.'})
    if _has(t, "processing fee", "registration fee", "release fee", "pay ₹", "pay rs", "pay to release", "shulk", "फीस"):
        flags.append({"sev": 3, "reason": "Asks for a fee to release a benefit — free government schemes never charge a fee."})
    if _has(t, "kyc") and _has(t, "pending", "update", "block", "suspend", "expire"):
        flags.append({"sev": 2, "reason": '"KYC pending / account will be blocked" pressure — a common phishing hook.'})
    if _has(t, "electricity", "bijli", "power") and _has(t, "disconnect", "cut", "katne", "बंद"):
        flags.append({"sev": 2, "reason": "Electricity-disconnection threat with a pay-now link — known scam."})
    if _has(t, "customs", "courier", "parcel", "fedex", "dtdc", "blue dart") and _has(t, "fee", "hold", "held", "clear"):
        flags.append({"sev": 2, "reason": "Courier/customs parcel-held fee — common scam, often leads to digital arrest."})
    if _has(t, "lottery", "prize", "you have won", "jeeta", "won ₹", "lucky"):
        flags.append({"sev": 3, "reason": "Lottery/prize claim — government does not run prize lotteries via SMS."})

    bad_domain = good_domain = False
    urls = _URL_RE.findall(raw)
    for u in urls:
        host = re.sub(r"^https?://", "", u, flags=re.I).split("/")[0].split("?")[0].lower()
        if re.search(r"\.gov\.in$|\.nic\.in$", host):
            good_domain = True
        else:
            bad_domain = True
    if bad_domain:
        flags.append({"sev": 2, "reason": "Link is NOT an official .gov.in / .nic.in address — likely a look-alike phishing site."})

    score = sum(f["sev"] for f in flags)
    if score >= 3:
        verdict, conf = "likely_fraud", min(96, 70 + score * 4)
    elif score >= 1:
        verdict, conf = "suspicious", 60 + score * 5
    elif good_domain and urls:
        verdict, conf = "likely_genuine", 75
    else:
        verdict, conf = "suspicious", 50
        flags.append({"sev": 1, "reason": "Not enough signal to judge. Never share OTP/fees. Confirm only via the official .gov.in portal."})

    return {
        "ok": True,
        "verdict": verdict,
        "confidence": conf,
        "flags": flags,
        "government_never": GOVERNMENT_NEVER,
        "report_to": REPORT_CHANNELS,
        "disclaimer": "Chitti helps you spot scams — it never calls the police for you. Report using the channels above.",
    }
