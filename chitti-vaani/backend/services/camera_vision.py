"""
services/camera_vision.py
-------------------------
Universal Camera analyzer — routes captured images from chitti_camera_universal.js
to the active LLM (Gemini Vision via the OpenAI-compatible endpoint while
DeepSeek balance is exhausted; DeepSeek Vision when restored). Same env var
hijack as every other LLM call site: settings.DEEPSEEK_URL / _MODEL / _API_KEY.

Sire's 10 camera modes (spec 2026-05-27):
  medicine · food_label · fashion_outfit · document_read · bill_check ·
  legal_notice · crop_plant · prescription · qr_payment · product_authentic

Plus one multi-frame mode added 2026-05-27 for Sire's Fashion 10s video flow:
  fashion_video — 2-6 keyframes from a short outfit-rating clip.

Each mode has its own system prompt that frames the model's response for the
target user (consumer / farmer / patient / shopper). Every prompt ends with
the four-user contract: plain language, voice-friendly, no jargon, honest
"can't tell" when the image is unclear.

Public surface:
  analyze(image_b64=..., mode=..., lang=..., user_token=..., page=...,
          image_b64_frames=None) -> dict
    image_b64 OR image_b64_frames is required (frames wins if both passed).
    Returns { ok, text, mode, lang, capture_id, frames? }  on success
            { ok=False, error, mode, lang }                on honest failure
"""
from __future__ import annotations

import base64
import logging
import re
import secrets
import time
from typing import Any

import httpx

from config import settings

log = logging.getLogger("camera_vision")

# 10 priority languages per Sire's spec (others fall back to Hindi).
LANG_NAMES = {
    "hi": "Hindi", "en": "English", "bn": "Bengali",
    "te": "Telugu", "ta": "Tamil", "mr": "Marathi",
    "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam",
    "pa": "Punjabi",
}


def _system_prompt(mode: str, lang: str) -> str:
    """Per-mode system prompt. Always closes with the four-user contract."""
    lang_name = LANG_NAMES.get((lang or "hi").lower(), "Hindi")
    common_tail = (
        f"Reply ENTIRELY in {lang_name}. "
        "Plain, conversational language a non-expert can understand. "
        "Voice-friendly: 3–6 short sentences, no markdown, no bullet points, "
        "no English words when the target language has a clear equivalent. "
        "If the image is unclear, blurry, or you cannot identify the subject, "
        "say so honestly — never guess. Never invent prices or brand claims. "
        "End with one practical next step the user can take today."
    )
    prompts = {
        "medicine": (
            "You are Chitti MedUPI looking at a medicine package. Identify the brand name, "
            "the molecule/composition, and the strength visible on the strip. If you can read "
            "those three, suggest the SAME-composition Jan Aushadhi alternative (PMBJP scheme) "
            "with its typical price band, and the rupee savings vs the branded equivalent. "
            "Do NOT claim a specific Jan Aushadhi stock-keeping unit you cannot read on the package. "
            "If composition or strength is illegible, say so and ask the user to scan a clearer photo. "
        ),
        "food_label": (
            "You are Chitti Scanner looking at a packaged food label. Read whatever is visible: "
            "brand, FSSAI license number (14-digit), sugar per serving, salt/sodium per serving, "
            "saturated fat, trans fat, additives. Issue a warning if sugar > 22.5 g/100 g, "
            "salt > 1.5 g/100 g, or trans fat > 0.2 g. If FSSAI number is missing or malformed, "
            "say so plainly — that is a red flag worth raising. Do not invent values the label "
            "does not show. "
        ),
        "fashion_outfit": (
            "You are Chitti Fashion looking at an outfit. Rate occasion fit "
            "(office / wedding / casual / festive), colour pairing for typical Indian skin tones, "
            "and current 2026 India trend match. Suggest ONE practical accessory or swap that "
            "would lift the look (under ₹1,500 budget). Be kind — affirm what works before naming "
            "what could improve. Never comment on body shape, weight, or age. "
        ),
        "document_read": (
            "You are Chitti Vaani reading a printed document for someone who may be blind or "
            "low-literacy. Read the document aloud (as if spoken), in order, faithfully. "
            "Summarise long paragraphs into one or two sentences each. Flag any deadline, "
            "amount, account number, or signature line the user must act on. Do not interpret "
            "legal or medical content — that is a separate Chitti's job. "
        ),
        "bill_check": (
            "You are Chitti CA looking at a bill / invoice / receipt. List each line item and "
            "rupee amount. Verify the math (line totals → subtotal → GST → grand total). "
            "Flag any line that looks like an unusual charge (service-charge over 10%, "
            "duplicated entry, GST mis-applied, rounding above ₹2). If the bill is for "
            "restaurant / electricity / hospital, name the typical overcharges users see in "
            "that category. Never assert fraud — only flag what looks worth questioning. "
        ),
        "legal_notice": (
            "You are Chitti Legal looking at a legal notice or court paper. Explain in plain Hindi "
            "(or the user's language): who is sending it, what they want, what the deadline is, "
            "and what happens if the user ignores it. List up to 3 concrete actions the user "
            "should take in the next 7 days. ALWAYS end with the disclaimer: "
            "'Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo.' "
            "Never give procedural legal advice that requires a lawyer's judgement. "
        ),
        "crop_plant": (
            "You are Chitti Krishi looking at a crop, leaf, or plant. Identify the plant if "
            "you can, name any disease / pest / nutrient deficiency visible (yellow spots, "
            "powdery mildew, leaf curl, holes from larvae, etc.), and recommend ONE low-cost "
            "treatment a small farmer can apply today (neem oil, cow-urine spray, copper "
            "sulphate, etc.) before suggesting a chemical pesticide. If you cannot identify "
            "the issue confidently, say so and recommend visiting the nearest Krishi Vigyan "
            "Kendra (KVK). "
        ),
        "prescription": (
            "You are Chitti Vaani reading a doctor's prescription. Extract every medicine: "
            "name, strength, dose-frequency (e.g. 1-0-1 = morning-noon-evening), and duration. "
            "If the handwriting is unclear for any line, say so for that line specifically — do "
            "NOT guess medicine names. Ask the user to confirm with the pharmacist before "
            "buying. Suggest the user set a reminder for each medicine (Chitti can do this if "
            "the user says yes). "
        ),
        "qr_payment": (
            "You are Chitti UPI looking at a UPI QR code or payment screen. Read out the "
            "payee VPA (the @upi handle), the amount if visible, and any UPI-tag (verified "
            "merchant / individual). Warn if: amount is suspiciously large, VPA looks "
            "look-alike (e.g. 'paytm-kyc@*' vs the real 'paytm@*'), the payee name does not "
            "match the merchant the user expects, or the QR is on a sticker pasted over "
            "another QR. Never proceed-payment for the user — confirmation is always the "
            "user's job. "
        ),
        "product_authentic": (
            "You are Chitti Scanner looking at a product package. Check the brand spelling, "
            "the MRP / pack size label, the manufacturing-and-expiry block, the batch number "
            "format, and the holographic / BIS mark if applicable for that category (electronics, "
            "helmets, gold). Flag what looks off — misspelt brand, mismatched font, faded ink, "
            "missing batch number, expiry already crossed. Be specific about what you see; do "
            "NOT declare 'fake' or 'genuine' with certainty unless multiple red flags align. "
            "If unclear, say 'unclear' — never coerce to safe (per camera-intelligence honest "
            "empty-state rule). "
        ),
        "fashion_video": (
            "You are Chitti Fashion looking at MULTIPLE FRAMES from a ~10-second outfit clip. "
            "The frames are sequential (frame 1 → 2 → 3 …) so you can judge fit-in-motion, "
            "drape, fabric flow, and how the outfit moves on the wearer's body. Rate four things: "
            "(1) FIT — does the garment sit right on the wearer (loose / tight / well-fitted), "
            "(2) COLOUR — does the palette work for typical Indian skin tones, (3) OCCASION — "
            "what does this outfit suit (office / wedding / casual / festive / date), "
            "(4) MOVEMENT — does the fabric hang and move gracefully across the frames. "
            "Then suggest ONE practical add or swap under ₹1,500 that would lift the look. "
            "Be kind — affirm what works before naming what could improve. Never comment on "
            "body shape, weight, or age. If the frames are blurry / dark / not of an outfit, "
            "say so honestly. "
        ),
    }
    base = prompts.get(mode, prompts["product_authentic"])
    return base + "\n\n" + common_tail


def _make_capture_id() -> str:
    return "cam-" + secrets.token_urlsafe(8)


def _strip_data_url(b64: str) -> str:
    """Accept either a raw base64 string or a 'data:image/jpeg;base64,...' URL."""
    if not b64:
        return ""
    m = re.match(r"^data:[\w/+\-.]+;base64,(.+)$", b64, re.IGNORECASE)
    return m.group(1) if m else b64


def analyze(image_b64: str = "", mode: str = "product_authentic", lang: str = "hi",
            user_token: str = "", page: str = "",
            image_b64_frames: list | None = None) -> dict:
    """Synchronous Gemini-Vision call via the OpenAI-compatible endpoint.

    Accepts EITHER a single image (image_b64) OR a list of 2-6 frames
    (image_b64_frames). When frames are passed, all are sent in one user-content
    block so the model can reason across them (used by the Fashion 10s video
    flow — see fashion_video mode).

    Routing: uses settings.DEEPSEEK_URL + settings.DEEPSEEK_MODEL + settings.DEEPSEEK_API_KEY,
    which are env-driven. While DeepSeek balance is exhausted, Sire sets:
      DEEPSEEK_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
      DEEPSEEK_MODEL=gemini-2.0-flash
      DEEPSEEK_API_KEY=<Gemini key>
    The OpenAI-compat shape lets us send vision content as image_url with a data: URL.
    """
    capture_id = _make_capture_id()
    lang = (lang or "hi").lower()
    mode = (mode or "product_authentic").lower()

    if not settings.DEEPSEEK_API_KEY:
        return {
            "ok": False,
            "error": "llm_not_configured",
            "text": "Server par LLM API key set nahi hai. Sire ko boliye configure karne ko.",
            "mode": mode, "lang": lang, "capture_id": capture_id,
        }

    # Decide single-frame vs multi-frame path.
    frames_raw: list[str] = []
    if image_b64_frames and isinstance(image_b64_frames, list):
        for f in image_b64_frames[:6]:  # hard cap 6 frames to control payload
            r = _strip_data_url(f or "")
            if r:
                frames_raw.append(r)
    elif image_b64:
        r = _strip_data_url(image_b64)
        if r:
            frames_raw.append(r)

    if not frames_raw:
        return {
            "ok": False, "error": "no_image",
            "text": "Photo nahi mili. Fir se khichein.",
            "mode": mode, "lang": lang, "capture_id": capture_id,
        }

    # Sanity-cap each frame so a 6-frame video stays under ~6 MB total.
    for r in frames_raw:
        if len(r) > 1_600_000:  # ~ 1.2 MB raw → 1.6 MB base64 per frame
            return {
                "ok": False, "error": "image_too_large",
                "text": "Photo / frame bahut bada hai. Camera se chhoti photo lein.",
                "mode": mode, "lang": lang, "capture_id": capture_id,
            }

    # Validate the first frame decodes as base64. Honest fail fast.
    try:
        base64.b64decode(frames_raw[0][:1024], validate=True)
    except Exception:
        return {
            "ok": False, "error": "invalid_image",
            "text": "Photo padh nahi paayi. Fir se khichein.",
            "mode": mode, "lang": lang, "capture_id": capture_id,
        }

    system = _system_prompt(mode, lang)

    user_content: list[dict] = []
    if len(frames_raw) == 1:
        user_content.append({"type": "text",
                             "text": "Look at this image and respond per the system instructions."})
        user_content.append({"type": "image_url",
                             "image_url": {"url": "data:image/jpeg;base64," + frames_raw[0]}})
    else:
        user_content.append({"type": "text",
                             "text": f"Look at these {len(frames_raw)} sequential frames "
                                     f"and respond per the system instructions."})
        for i, r in enumerate(frames_raw, 1):
            user_content.append({"type": "text", "text": f"Frame {i} of {len(frames_raw)}:"})
            user_content.append({"type": "image_url",
                                 "image_url": {"url": "data:image/jpeg;base64," + r}})

    # OpenAI-compatible multimodal payload — works for both Gemini (via its
    # /v1beta/openai endpoint) and DeepSeek vision models.
    body = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.3,
        "max_tokens": 800 if len(frames_raw) > 1 else 600,
    }
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }

    started = time.time()
    try:
        with httpx.Client(timeout=60.0) as client:
            r = client.post(settings.DEEPSEEK_URL, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
        text = (data["choices"][0]["message"]["content"] or "").strip()
        if not text:
            raise ValueError("empty_reply")
    except httpx.HTTPStatusError as e:
        log.error("camera vision HTTP %s: %s", e.response.status_code, e.response.text[:300])
        return {
            "ok": False,
            "error": f"upstream_http_{e.response.status_code}",
            "text": "Chitti ko abhi server se jawab nahi mila. Thodi der mein dobara try karein.",
            "mode": mode, "lang": lang, "capture_id": capture_id,
        }
    except (httpx.HTTPError, KeyError, ValueError) as e:
        log.exception("camera vision failed: %s", e)
        return {
            "ok": False, "error": str(e)[:160],
            "text": "Photo dekh nahi paayi. Fir se khichein.",
            "mode": mode, "lang": lang, "capture_id": capture_id,
        }

    elapsed_ms = int((time.time() - started) * 1000)
    log.info("camera vision mode=%s lang=%s user=%s page=%s frames=%d ms=%d",
             mode, lang, (user_token or "anon")[:8], page[:40], len(frames_raw), elapsed_ms)

    return {
        "ok": True,
        "text": text,
        "mode": mode,
        "lang": lang,
        "capture_id": capture_id,
        "frames": len(frames_raw),
        "elapsed_ms": elapsed_ms,
        "model": settings.DEEPSEEK_MODEL,
    }
