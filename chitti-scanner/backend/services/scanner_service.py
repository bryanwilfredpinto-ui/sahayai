"""
services/scanner_service.py
---------------------------
Chitti Product Scanner — analyse a product label / medicine strip /
bill / document and return product type, key findings, warnings, and
savings suggestions.

v1 design choice: text-fallback first.
  - The frontend tries to OCR the image client-side (or the user types
    out what the label says when the camera fails).
  - We send that TEXT to DeepSeek and get a strict JSON verdict.
  - When/if a vision model is wired up (DEEPSEEK_VISION_MODEL), the
    `analyze_image()` path uses it; otherwise we politely fall back.

Detected `type`s drive the legal disclaimer the frontend appends:
  food            → FSSAI line
  medicine        → label/doctor line
  legal_doc       → AI-summary line
  bill / mrp      → consumer helpline line
  insurance       → premium-safety line (we suggest UPI Guard cross-link)
  other           → generic line

CHITTI_SCANNER_PROMPT lives here as a single constant for verbatim
replacement from the Master Spec doc.
"""
from __future__ import annotations

import base64
import json
import logging
import re
from typing import Optional

import httpx

from config import settings

log = logging.getLogger("scanner_service")


# ─────────────────────────────────────────────────────
# Canonical system prompt (CHITTI_SCANNER_PROMPT)
# ─────────────────────────────────────────────────────

CHITTI_SCANNER_PROMPT = """You are Chitti Product Scanner -- an AI that reads product labels, food packaging, medicines, legal documents, and bills, and explains them in simple Hindi or English to ordinary Indian consumers. You are built by Bryan Wilfred Pinto at Sahayai.

YOUR PERSONALITY:
You are like a smart, honest friend standing next to the user in the shop or at home
You speak in 3 to 4 simple sentences maximum -- never longer
You always put the ONE most important finding first
You are never preachy or lecturing -- just helpful and direct

FOR FOOD PRODUCTS:
Start with what this product is and who should be careful about it
Flag any misleading claims like Sugar Free or 100 Percent Natural against FSSAI rules
Show actual sugar, salt, and fat in simple words. Example: 3 teaspoons of sugar per serving
Check if the MRP on the pack matches what the shop is charging
Always end with: Yeh information FSSAI label se hai. Doctor ya nutritionist se confirm karo.

FOR LEGAL DOCUMENTS AND TERMS AND CONDITIONS:
Find the top 3 risky clauses and explain each one in plain Hindi in one sentence
Tell the user exactly what they are agreeing to
Flag these red flags: data sharing with third parties, auto-renewal, difficult cancellation, mandatory arbitration
Always end with: Yeh AI ka summary hai. Sign karne se pehle poora document zaroor padho.

MANDATORY LEGAL DISCLAIMERS -- include the correct one at the end of every response:
For food products: Yeh FSSAI label ki information hai. Dietary advice ke liye nutritionist se milo.
For medicine: Yeh sirf label ki information hai. Doctor se confirm karo pehle.
For legal documents: Yeh AI summary hai. Final decision apne aap lo ya vakeel se lo.
For MRP overcharging: Agar overcharging hai toh consumer helpline 1800-11-4000 pe call karo.

OUTPUT FORMAT (the API renders facts, findings, warnings, savings as separate UI sections, so respond as STRICT JSON only -- no markdown fences, no preamble. Keep summary, speak_hi, speak_en within the 3-4-sentences personality rule above):
{
  "type": "food" | "medicine" | "legal_doc" | "bill" | "mrp" | "insurance" | "other",
  "summary": "<one Hinglish line>",
  "facts":   { "key": "value" },
  "key_findings": ["<line>"],
  "warnings":     ["<line>"],
  "savings":      ["<line>"],
  "speak_hi":     "<Hindi read-aloud line>",
  "speak_en":     "<English read-aloud line>"
}
"""

LEGAL_BY_TYPE = {
    "food":       "Yeh FSSAI label ki information hai. Dietary advice ke liye nutritionist se milo.",
    "medicine":   "Yeh sirf label ki information hai. Doctor se confirm karo pehle.",
    "legal_doc":  "Yeh AI summary hai. Final decision apne aap lo ya vakeel se lo.",
    "bill":       "Agar overcharging hai toh consumer helpline 1800-11-4000 pe call karo.",
    "mrp":        "Agar overcharging hai toh consumer helpline 1800-11-4000 pe call karo.",
    "insurance":  "Premium pay karne se pehle UPI Fraud Guard mein check kar lo. Agent se policy number confirm karo.",
    "other":      "Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo.",
}


def _safe_parse(raw: str) -> dict:
    if not raw:
        return {}
    raw = raw.strip()
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


_VALID_TYPES = {"food", "medicine", "legal_doc", "bill", "mrp", "insurance", "other"}


def _normalise(parsed: dict) -> dict:
    t = (parsed.get("type") or "other").strip().lower()
    if t not in _VALID_TYPES:
        t = "other"
    out = {
        "type": t,
        "summary": (parsed.get("summary") or "").strip()[:240] or "Could not read the label clearly.",
        "facts":   {k: str(v)[:200] for k, v in (parsed.get("facts") or {}).items()} if isinstance(parsed.get("facts"), dict) else {},
        "key_findings": _clean_list(parsed.get("key_findings"), max_items=4, max_len=200),
        "warnings":     _clean_list(parsed.get("warnings"),     max_items=3, max_len=200),
        "savings":      _clean_list(parsed.get("savings"),      max_items=2, max_len=200),
        "speak_hi":     (parsed.get("speak_hi") or parsed.get("summary") or "").strip()[:300],
        "speak_en":     (parsed.get("speak_en") or parsed.get("summary") or "").strip()[:300],
    }
    out["legal_disclaimer"] = LEGAL_BY_TYPE.get(t, LEGAL_BY_TYPE["other"])
    out["cross_links"] = _cross_links(t, out)
    return out


def _clean_list(v, *, max_items: int, max_len: int) -> list:
    if v is None:
        return []
    if not isinstance(v, list):
        v = [v]
    out = []
    for x in v:
        s = str(x).strip()
        if not s:
            continue
        out.append(s[:max_len])
        if len(out) >= max_items:
            break
    return out


def _cross_links(t: str, out: dict) -> list:
    """Build the cross-product hand-offs for the frontend to surface."""
    links = []
    if t == "medicine":
        # Try to extract a brand / molecule from facts for the MedUPI deep link.
        f = out.get("facts") or {}
        brand = (f.get("brand") or f.get("name") or f.get("medicine") or "").strip()
        molecule = (f.get("composition") or f.get("salt") or f.get("molecule") or "").strip()
        link_to = brand or molecule or out.get("summary", "")
        links.append({
            "product": "medupi",
            "label_en": "💊 Find Jan-Aushadhi alternative",
            "label_hi": "💊 जन-औषधि विकल्प देखें",
            "kind": "medupi_lookup",
            "query": link_to,
        })
    if t in ("bill", "mrp"):
        links.append({
            "product": "consumer_helpline",
            "label_en": "📞 Consumer helpline 1800-11-4000",
            "label_hi": "📞 उपभोक्ता हेल्पलाइन 1800-11-4000",
            "kind": "tel",
            "query": "1800114000",
        })
    if t == "insurance":
        links.append({
            "product": "upi_guard",
            "label_en": "🛡️ Check premium-payment safety",
            "label_hi": "🛡️ प्रीमियम पेमेंट की सुरक्षा जाँचें",
            "kind": "upi_check",
            "query": out.get("summary", ""),
        })
    if t == "food":
        # Suggest reading aloud via Vaani for low-vision / low-literacy users.
        links.append({
            "product": "vaani",
            "label_en": "🔊 Have Chitti read this aloud",
            "label_hi": "🔊 चिट्टी से सुनिए",
            "kind": "vaani_read",
            "query": (out.get("speak_hi") or out.get("speak_en") or out.get("summary") or "")[:1000],
        })
    return links


def _fallback(text_in: str, language: str, *, error: Optional[str] = None) -> dict:
    out = _normalise({
        "type": "other",
        "summary": "AI offline — could not analyse this label right now.",
        "facts": {},
        "key_findings": ["AI service unreachable. Please retry, or read the label yourself."],
        "warnings": [],
        "savings": [],
        "speak_hi": "चिट्टी अभी ऑफलाइन है। कुछ देर बाद कोशिश कीजिए।",
        "speak_en": "Chitti is offline right now. Please try again in a moment.",
    })
    out.update({
        "ok": True,
        "source": "fallback",
        "language": language,
    })
    if error:
        out["error"] = error[:200]
    return out


def _raw_scanner_text_deepseek(language: str, safe_text: str) -> tuple[str, dict]:
    body = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": CHITTI_SCANNER_PROMPT},
            {"role": "user",   "content": f"User language: {language}. Label / bill / document text:\n{safe_text}"},
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


def analyze_text(text: str, language: str = "hi") -> dict:
    """Primary v1 path — caller has OCR'd or typed the label.

    Goes through HookRegistry.wrap_llm when running inside a Flask app
    context. `compliance_inject=False` because the model is asked for
    strict JSON — disclaimer rides in `legal_disclaimer` field.
    """
    text = (text or "").strip()
    if not text:
        return {"ok": False, "error": "text is required"}

    if not settings.DEEPSEEK_API_KEY:
        return _fallback(text, language)

    usage_capture: dict = {}

    def _call(safe_text: str) -> str:
        raw, usage = _raw_scanner_text_deepseek(language, safe_text)
        usage_capture.update(usage)
        return raw

    try:
        from flask import current_app
        hooks = current_app.config.get("CHITTI_HOOKS")
    except Exception:  # noqa: BLE001
        hooks = None

    def _build_from_raw(raw: str, request_id=None, latency_ms=None) -> dict:
        parsed = _safe_parse(raw)
        out = _normalise(parsed)
        out.update({
            "ok": True,
            "source": "deepseek",
            "language": language,
            "model": settings.DEEPSEEK_MODEL,
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
                "summary": wrapped["reply"],
                "rail": wrapped.get("rail"),
                "reason": wrapped.get("reason"),
                "request_id": wrapped.get("request_id"),
            }
        return _build_from_raw(
            wrapped.get("reply") or "",
            request_id=wrapped.get("request_id"),
            latency_ms=wrapped.get("latency_ms"),
        )

    try:
        raw, usage = _raw_scanner_text_deepseek(language, text)
        usage_capture.update(usage)
        return _build_from_raw(raw)
    except httpx.HTTPStatusError as e:
        log.error("DeepSeek HTTP %s: %s", e.response.status_code, e.response.text[:200])
        return _fallback(text, language, error=f"deepseek_http_{e.response.status_code}")
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("DeepSeek call failed: %s", e)
        return _fallback(text, language, error=str(e))


def analyze_image(image_bytes: bytes, content_type: str, language: str = "hi") -> dict:
    """Vision path. v1 stub: we acknowledge the image but ask the user
    for a text fallback if a vision model is not configured.

    Wire DEEPSEEK_VISION_MODEL when a vision-capable endpoint is
    available — the message format below is OpenAI-compatible.
    """
    if not image_bytes:
        return {"ok": False, "error": "empty image"}
    if len(image_bytes) > 8 * 1024 * 1024:
        return {"ok": False, "error": "image too large (max 8 MB)"}
    if not settings.DEEPSEEK_API_KEY:
        return _fallback("[image input]", language)

    # Without a confirmed vision endpoint we return a graceful "type the
    # label" prompt rather than fabricate a reading.
    if not settings.DEEPSEEK_VISION_MODEL or settings.DEEPSEEK_VISION_MODEL.lower() in ("none", "off"):
        return _normalise({
            "type": "other",
            "summary": "Vision model not configured on the server. Please type out what the label says, or paste the OCR text.",
            "facts": {},
            "key_findings": ["Server vision is off — use the text fallback box below."],
            "warnings": [],
            "savings": [],
            "speak_hi": "इमेज सपोर्ट अभी बंद है। कृपया लेबल का टेक्स्ट टाइप कीजिए।",
            "speak_en": "Image support is off. Please type out what the label says.",
        }) | {"ok": True, "source": "fallback_no_vision", "language": language}

    b64 = base64.b64encode(image_bytes).decode("ascii")
    mime = content_type or "image/jpeg"

    def _raw_vision(_safe_text: str) -> str:
        body = {
            "model": settings.DEEPSEEK_VISION_MODEL,
            "messages": [
                {"role": "system", "content": CHITTI_SCANNER_PROMPT},
                {"role": "user", "content": [
                    {"type": "text", "text": f"User language: {language}. Read this product label / bill / document image and respond with the strict JSON described."},
                    {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
                ]},
            ],
            "max_tokens": settings.MAX_TOKENS,
            "temperature": settings.TEMPERATURE,
        }
        headers = {
            "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
            "Content-Type": "application/json",
        }
        with httpx.Client(timeout=60.0) as client:
            r = client.post(settings.DEEPSEEK_URL, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
        usage_capture.update(data.get("usage") or {})
        return data["choices"][0]["message"]["content"]

    usage_capture: dict = {}

    try:
        from flask import current_app
        hooks = current_app.config.get("CHITTI_HOOKS")
    except Exception:  # noqa: BLE001
        hooks = None

    def _build_vision_from_raw(raw: str, request_id=None, latency_ms=None) -> dict:
        parsed = _safe_parse(raw)
        out = _normalise(parsed)
        out.update({
            "ok": True,
            "source": "deepseek_vision",
            "language": language,
            "model": settings.DEEPSEEK_VISION_MODEL,
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
            wrapped = hooks.wrap_llm(_raw_vision,
                                     user_text="[scanner vision input]",
                                     ctx={"vision": True},
                                     compliance_inject=False)
        except httpx.HTTPStatusError as e:
            log.error("Vision HTTP %s: %s", e.response.status_code, e.response.text[:200])
            return _fallback("[image input]", language, error=f"vision_http_{e.response.status_code}")
        except (httpx.RequestError, KeyError, ValueError) as e:
            log.exception("Vision call failed: %s", e)
            return _fallback("[image input]", language, error=str(e))
        if wrapped.get("blocked"):
            return {
                "ok": False,
                "source": "blocked",
                "language": language,
                "summary": wrapped["reply"],
                "rail": wrapped.get("rail"),
                "reason": wrapped.get("reason"),
                "request_id": wrapped.get("request_id"),
            }
        return _build_vision_from_raw(
            wrapped.get("reply") or "",
            request_id=wrapped.get("request_id"),
            latency_ms=wrapped.get("latency_ms"),
        )

    try:
        raw = _raw_vision("[scanner vision input]")
        return _build_vision_from_raw(raw)
    except httpx.HTTPStatusError as e:
        log.error("Vision HTTP %s: %s", e.response.status_code, e.response.text[:200])
        return _fallback("[image input]", language, error=f"vision_http_{e.response.status_code}")
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("Vision call failed: %s", e)
        return _fallback("[image input]", language, error=str(e))


def health() -> dict:
    return {
        "ok": True,
        "service": "scanner",
        "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
        "model": settings.DEEPSEEK_MODEL,
        "vision_model": settings.DEEPSEEK_VISION_MODEL,
        "medupi_api_base": settings.MEDUPI_API_BASE,
    }
