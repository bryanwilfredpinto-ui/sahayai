"""
services/upi_service.py
-----------------------
Chitti UPI Fraud Guard — text-input fraud risk classifier.

Public surface:
  - check(text, language) -> dict
      Send a payment description / SMS / "what the caller said" → get
      back HIGH / MEDIUM / LOW risk + a one-line reason + the spoken
      warning the frontend MUST read aloud.

The model is asked for a strict JSON shape. We then defensively parse
and clamp it, so the frontend can rely on the schema.

System prompt CHITTI_UPI_FRAUD_PROMPT lives in this file as a single
constant — replace verbatim with the Master Spec doc text.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Optional

import httpx

from config import settings

log = logging.getLogger("upi_service")


# ─────────────────────────────────────────────────────
# Canonical system prompt (CHITTI_UPI_FRAUD_PROMPT)
# ─────────────────────────────────────────────────────

CHITTI_UPI_FRAUD_PROMPT = """You are Chitti UPI Fraud Guard -- an AI-powered fraud awareness and warning tool for Indian UPI users. You are built by Bryan Wilfred Pinto at Sahayai. You are NOT a bank, NOT a payment processor, and NOT a government service.

YOUR PERSONALITY:
You are like a protective older sibling who has seen every UPI scam that exists
You are direct and urgent when needed, but never cause panic
You speak in simple Hindi or English matching the user language
You never accuse the user -- you educate and warn with evidence

WHEN ANALYZING A PAYMENT REQUEST:
Check: Is this a collect request disguised as a send? Warn: Yeh aapke account se paisa jaayega -- bhejne se nahi aayega
Check: Is the merchant name unfamiliar or suspicious? Ask: Kya aap [merchant name] ko personally jaante hain?
Check: Is the amount unusually large? Warn: Itna bada amount unusual hai. Pehle confirm karo.
Check: Is this a processing fee for a prize or reward? Always warn: Koi prize ke liye pehle paisa nahi maangta. Yeh fraud hai.
Check: Was the user asked for OTP on a phone call? Always warn: Bank ya police kabhi OTP phone pe nahi maangti. Ruko.

RISK LEVELS:
HIGH RISK -- red warning: Stop the transaction. Speak warning loudly. Say: Ruko! Yeh fraud ho sakta hai. Mat bhejo.
MEDIUM RISK -- orange warning: Caution. Ask the user to verify before proceeding.
LOW RISK -- green: Looks safe. Remind: Hamesha merchant ka naam check karo pehle.

LEGAL DISCLAIMERS -- always end every response with both lines:
Fraud hone par turant 1930 pe call karo ya cybercrime.gov.in pe report karo.
Chitti ek AI warning tool hai -- yeh payment block nahi kar sakta.

OUTPUT FORMAT (this is in addition to the personality and analysis above -- the API expects strict JSON so the frontend can render colour-coded bands):
Return ONLY a JSON object, no markdown fences, no preamble:
{
  "risk":   "HIGH" | "MEDIUM" | "LOW",
  "reason": "<one short Hinglish line>",
  "warning":"<the exact words the phone should read aloud>",
  "indicators": ["<short flag>", "..."],
  "actions":   ["<safe step>", "..."]
}
"""

LEGAL_LINES = [
    "Fraud hone par turant 1930 pe call karo ya cybercrime.gov.in pe report karo.",
    "Chitti ek AI warning tool hai — yeh payment block nahi kar sakta.",
]


_LANG_NAMES = {
    "hi": "Hindi", "en": "English", "ta": "Tamil", "te": "Telugu",
    "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati",
    "kn": "Kannada", "ml": "Malayalam",
}


def _safe_parse(raw: str) -> dict:
    """Pull a JSON object out of the model's reply, even if surrounded by junk."""
    if not raw:
        return {}
    raw = raw.strip()
    # Strip ``` fences if model added them despite instructions
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        m = re.search(r"\{[\s\S]*\}", raw)
        if not m:
            return {}
        try:
            return json.loads(m.group(0))
        except (TypeError, ValueError):
            return {}


_VALID_RISK = {"HIGH", "MEDIUM", "LOW"}


def _normalise(parsed: dict, text_in: str) -> dict:
    risk = (parsed.get("risk") or "").strip().upper()
    if risk not in _VALID_RISK:
        # Default cautious — never falsely reassure
        risk = "MEDIUM"
    reason = (parsed.get("reason") or "").strip()[:240]
    if not reason:
        reason = "Could not classify cleanly — proceeding cautiously."
    warning = (parsed.get("warning") or "").strip()[:300]
    if not warning:
        warning = {
            "HIGH":   "Ruko! Yeh fraud ho sakta hai. Pay mat karo.",
            "MEDIUM": "Dhyaan se! Pehle merchant ko confirm karo, fir pay karo.",
            "LOW":    "Theek lag raha hai, par phir bhi merchant se ek baar confirm karo.",
        }[risk]
    indicators = parsed.get("indicators") or []
    if not isinstance(indicators, list):
        indicators = [str(indicators)]
    indicators = [str(x).strip()[:120] for x in indicators if str(x).strip()][:6]
    actions = parsed.get("actions") or []
    if not isinstance(actions, list):
        actions = [str(actions)]
    actions = [str(x).strip()[:160] for x in actions if str(x).strip()][:5]
    return {
        "risk": risk,
        "reason": reason,
        "warning": warning,
        "indicators": indicators,
        "actions": actions,
    }


def _fallback(text_in: str, language: str, *, error: Optional[str] = None) -> dict:
    """Conservative fallback when DeepSeek is unconfigured / unreachable.

    We do NOT guess risk — we surface MEDIUM with a clear note that the
    AI was offline. That keeps the user safe (no false 'LOW') without
    blocking the page entirely.
    """
    out = _normalise({
        "risk":   "MEDIUM",
        "reason": "AI offline — defaulting to caution. Confirm with merchant.",
        "warning":"Dhyaan se! Chitti AI offline hai. Khud merchant se confirm karo.",
        "indicators": ["AI service unreachable"],
        "actions": [
            "Call the merchant on a number you already trust.",
            "Do NOT click any link in the SMS / WhatsApp.",
        ],
    }, text_in)
    out.update({
        "ok": True,
        "source": "fallback",
        "language": language,
        "legal_lines": LEGAL_LINES,
    })
    if error:
        out["error"] = error[:200]
    return out


def _raw_upi_deepseek(lang_name: str, safe_text: str) -> tuple[str, dict]:
    user_msg = (
        f"User language: {lang_name}. Classify the fraud risk of this "
        f"payment / message / call description, and write the warning "
        f"in {lang_name}-flavoured Hinglish.\n\nINPUT:\n{safe_text}"
    )
    body = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": CHITTI_UPI_FRAUD_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
        "max_tokens": settings.MAX_TOKENS,
        "temperature": settings.TEMPERATURE,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=30.0) as client:
        r = client.post(settings.DEEPSEEK_URL, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
    return data["choices"][0]["message"]["content"], (data.get("usage") or {})


def check(text: str, language: str = "hi") -> dict:
    """Classify the supplied text into HIGH / MEDIUM / LOW risk.

    Goes through HookRegistry.wrap_llm when running inside a Flask app
    context (production path) so every call is gated by the four rails
    and audit-logged. Uses `compliance_inject=False` because the model is
    asked for a strict JSON object — appending a disclaimer would
    corrupt the JSON. The disclaimer rides in `legal_lines` instead.
    """
    text = (text or "").strip()
    if not text:
        return {"ok": False, "error": "text is required"}

    if not settings.DEEPSEEK_API_KEY:
        return _fallback(text, language)

    lang_name = _LANG_NAMES.get(language, "Hindi")
    usage_capture: dict = {}

    def _call(safe_text: str) -> str:
        raw, usage = _raw_upi_deepseek(lang_name, safe_text)
        usage_capture.update(usage)
        return raw

    try:
        from flask import current_app
        hooks = current_app.config.get("CHITTI_HOOKS")
    except Exception:  # noqa: BLE001
        hooks = None

    def _build_from_raw(raw: str, request_id=None, latency_ms=None) -> dict:
        parsed = _safe_parse(raw)
        out = _normalise(parsed, text)
        out.update({
            "ok": True,
            "source": "deepseek",
            "language": language,
            "model": settings.DEEPSEEK_MODEL,
            "legal_lines": LEGAL_LINES,
            "tokens": {
                "input":  usage_capture.get("prompt_tokens"),
                "output": usage_capture.get("completion_tokens"),
            },
        })
        if request_id is not None:
            out["request_id"] = request_id
        if latency_ms is not None:
            out["latency_ms"] = latency_ms
        return out

    if hooks is not None:
        try:
            wrapped = hooks.wrap_llm(_call, user_text=text, ctx={},
                                     compliance_inject=False)
        except httpx.HTTPStatusError as e:
            log.error("DeepSeek HTTP %s: %s", e.response.status_code, e.response.text[:200])
            return _fallback(text, language, error=f"deepseek_http_{e.response.status_code}")
        except (httpx.RequestError, KeyError, ValueError) as e:
            log.exception("DeepSeek call failed: %s", e)
            return _fallback(text, language, error=str(e))
        if wrapped.get("blocked"):
            return {
                "ok": False,
                "source": "blocked",
                "language": language,
                "warning": wrapped["reply"],
                "rail": wrapped.get("rail"),
                "reason": wrapped.get("reason"),
                "request_id": wrapped.get("request_id"),
                "legal_lines": LEGAL_LINES,
            }
        return _build_from_raw(
            wrapped.get("reply") or "",
            request_id=wrapped.get("request_id"),
            latency_ms=wrapped.get("latency_ms"),
        )

    try:
        raw, usage = _raw_upi_deepseek(lang_name, text)
        usage_capture.update(usage)
        return _build_from_raw(raw)
    except httpx.HTTPStatusError as e:
        log.error("DeepSeek HTTP %s: %s", e.response.status_code, e.response.text[:200])
        return _fallback(text, language, error=f"deepseek_http_{e.response.status_code}")
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("DeepSeek call failed: %s", e)
        return _fallback(text, language, error=str(e))


def rbi_2026_rules() -> dict:
    """Static educational cards — RBI 2026 framework. Frontend renders these."""
    return {
        "ok": True,
        "items": [
            {
                "key": "2fa",
                "icon": "🔐",
                "title_en": "Two-factor authentication",
                "title_hi": "दो-स्तरीय सुरक्षा",
                "body_en": "Every UPI debit needs PIN + device. No PIN, no payment.",
                "body_hi": "हर UPI डेबिट के लिए PIN और डिवाइस दोनों चाहिए।",
                "speak_hi": "हर UPI ट्रांज़ैक्शन के लिए दो-स्तरीय सुरक्षा ज़रूरी है। बिना PIN कोई पेमेंट नहीं हो सकता।",
            },
            {
                "key": "1hr_lag",
                "icon": "⏰",
                "title_en": "1-hour cooling lag (new payee)",
                "title_hi": "1 घंटे की रुकावट",
                "body_en": "Sending to a new UPI ID for the first time? RBI gives a 1-hour delay window for amounts above ₹2,000.",
                "body_hi": "नए UPI ID पर पहली बार ₹2,000 से ज़्यादा भेज रहे हैं? RBI एक घंटे की देरी देती है।",
                "speak_hi": "नई UPI आई-डी पर पहली बार दो हज़ार रुपए से ज़्यादा भेजने पर RBI एक घंटे की रुकावट लगाती है।",
            },
            {
                "key": "trusted_person",
                "icon": "👨‍👩‍👧",
                "title_en": "Trusted Person",
                "title_hi": "विश्वसनीय व्यक्ति",
                "body_en": "Add a relative as Trusted Person. Big payments need their approval too.",
                "body_hi": "एक रिश्तेदार को विश्वसनीय व्यक्ति बनाइए। बड़े पेमेंट उनकी मंज़ूरी भी मांगेंगे।",
                "speak_hi": "एक रिश्तेदार को विश्वसनीय व्यक्ति बनाइए। बड़े पेमेंट उनकी मंज़ूरी भी मांगेंगे।",
            },
            {
                "key": "kill_switch",
                "icon": "🛑",
                "title_en": "Kill Switch",
                "title_hi": "तुरंत बंद करें",
                "body_en": "If your phone is lost or you suspect fraud, hit Kill Switch in your bank app to freeze UPI instantly.",
                "body_hi": "अगर फ़ोन खो जाए या फ्रॉड का शक हो — बैंक ऐप में किल स्विच दबाइए, UPI तुरंत बंद हो जाएगा।",
                "speak_hi": "अगर फ़ोन खो जाए या फ्रॉड का शक हो, बैंक ऐप में किल स्विच दबाइए। UPI तुरंत बंद हो जाएगा।",
            },
        ],
    }


def health() -> dict:
    return {
        "ok": True,
        "service": "upi_fraud_guard",
        "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
        "model": settings.DEEPSEEK_MODEL,
    }
