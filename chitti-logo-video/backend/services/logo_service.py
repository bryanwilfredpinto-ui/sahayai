"""Logo generation service.

Stub mode (default): returns a deterministic, hand-crafted SVG monogram in the
caller's chosen palette. This is honest — we tell the caller `supplier="mock"`
so the frontend can show the right disclaimer.

Real mode (when REPLICATE_API_TOKEN set): calls Replicate's official-model
endpoint with Flux 1.1 Pro (or whichever model env-var overrides to). The
prompt is engineered to match the CAYUZ.jpg reference quality — photorealistic
3D glass/metal monogram with the chosen palette, heartbeat line through the
initial, soft glow, no extraneous text. Wired 2026-05-27.
"""

from __future__ import annotations

import html
import logging
import time

import requests

from config import settings

log = logging.getLogger("chitti.logo")


# Indian-flag palette is the new default per Sire's Priority-1 spec
# (2026-05-27). Other palettes preserved for backward compat.
PALETTES = {
    "bharat":   {"primary": "#FF9933", "secondary": "#000080", "accent": "#138808", "ink": "#FFFFFF",
                 "name_en": "Indian Flag", "name_hi": "तिरंगा"},
    "modern":   {"primary": "#6366F1", "secondary": "#0F172A", "accent": "#22D3EE", "ink": "#FFFFFF",
                 "name_en": "Modern", "name_hi": "आधुनिक"},
    "classic":  {"primary": "#1F2937", "secondary": "#F3F4F6", "accent": "#B45309", "ink": "#FFFFFF",
                 "name_en": "Classic", "name_hi": "क्लासिक"},
    "festive":  {"primary": "#DC2626", "secondary": "#15803D", "accent": "#FACC15", "ink": "#FFFFFF",
                 "name_en": "Festive", "name_hi": "त्योहार"},
    "calm":     {"primary": "#0F766E", "secondary": "#0C4A6E", "accent": "#67E8F9", "ink": "#FFFFFF",
                 "name_en": "Calm", "name_hi": "शांत"},
}


def _initials(name: str) -> str:
    parts = [p for p in (name or "").strip().split() if p]
    if not parts:
        return "C"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _mock_svg(brand_name: str, tagline: str, palette: dict, style: str) -> str:
    initials = _initials(brand_name)
    name_e = html.escape(brand_name or "Brand")
    tag_e = html.escape(tagline or "")
    p, s, a, ink = palette["primary"], palette["secondary"], palette["accent"], palette["ink"]

    if style == "wordmark":
        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 160" role="img" aria-label="{name_e} logo">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{p}"/>
      <stop offset="100%" stop-color="{a}"/>
    </linearGradient>
  </defs>
  <rect width="480" height="160" rx="20" fill="{s}"/>
  <text x="240" y="92" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="56" fill="url(#g)">{name_e}</text>
  <text x="240" y="126" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="500" font-size="16" fill="{ink}" opacity="0.85">{tag_e}</text>
</svg>"""

    if style == "shield":
        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-label="{name_e} logo">
  <defs>
    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{p}"/>
      <stop offset="100%" stop-color="{s}"/>
    </linearGradient>
  </defs>
  <path d="M160 16 L296 64 V176 C296 240 232 290 160 304 C88 290 24 240 24 176 V64 Z" fill="url(#sg)" stroke="{a}" stroke-width="6"/>
  <text x="160" y="180" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="84" fill="{ink}">{html.escape(initials)}</text>
  <text x="160" y="240" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="18" fill="{ink}" opacity="0.92">{name_e}</text>
  <text x="160" y="266" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="500" font-size="13" fill="{ink}" opacity="0.75">{tag_e}</text>
</svg>"""

    # default: monogram circle (style == 'monogram' or anything else)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-label="{name_e} logo">
  <defs>
    <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{p}"/>
      <stop offset="100%" stop-color="{a}"/>
    </linearGradient>
  </defs>
  <rect width="320" height="320" rx="36" fill="{s}"/>
  <circle cx="160" cy="140" r="92" fill="url(#cg)"/>
  <text x="160" y="168" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="72" fill="{ink}">{html.escape(initials)}</text>
  <text x="160" y="240" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="22" fill="{ink}">{name_e}</text>
  <text x="160" y="264" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="500" font-size="13" fill="{ink}" opacity="0.78">{tag_e}</text>
</svg>"""


def _build_prompt(brand_name: str, tagline: str, palette: dict, style: str) -> str:
    """Build a CAYUZ.jpg-grade prompt: photorealistic 3D glossy monogram,
    Indian-flag colors, ECG heartbeat line, soft golden glow, no extraneous text.

    The Flux family models respond best to descriptive English prompts; we keep
    the prompt deterministic per (brand, palette, style) so the same inputs
    yield consistent style across re-runs.
    """
    initials = _initials(brand_name)
    primary  = palette["primary"]
    secondary = palette["secondary"]
    accent   = palette["accent"]

    # Map hex to human color words so the model targets the right palette
    is_bharat = primary.upper() == "#FF9933"
    if is_bharat:
        ring_words = (
            "circular metallic ring framed in the Indian flag tricolor — saffron orange "
            "at the top arc, white in the middle, deep green at the bottom arc, with "
            "Ashoka navy blue accents"
        )
        letter_words = "rendered in glossy deep green (Indian flag green) with metallic chrome highlights"
    else:
        ring_words = f"circular metallic ring in {primary} with {accent} accents"
        letter_words = f"rendered in glossy {primary} with metallic chrome highlights"

    style_words = {
        "monogram": "premium 3D photorealistic monogram",
        "shield":   "premium 3D photorealistic shield emblem",
        "wordmark": "premium 3D photorealistic wordmark badge",
    }.get(style, "premium 3D photorealistic monogram")

    return (
        f"A {style_words} of the bold uppercase letter '{initials}' {letter_words}, "
        f"with a green ECG heartbeat line cutting horizontally through the letter, "
        f"framed by a {ring_words}, soft warm golden glow around the edges, "
        f"clean white background, ultra-detailed 3D render, premium logo design, "
        f"high resolution, photorealistic, glass and metal materials, subtle reflections, "
        f"centered composition, square aspect ratio, no extraneous text, no watermark, "
        f"no signature, brand identity for '{brand_name}'."
    )


def _replicate_generate(brand_name: str, tagline: str, palette: dict, style: str) -> dict:
    """Call Replicate's official-model predictions endpoint and return the image URL.

    Uses the synchronous `Prefer: wait` header so the call blocks until the
    prediction completes (Flux Schnell typically <5s, Flux 1.1 Pro 8–15s).
    For longer-running models the function falls back to polling.

    Env vars:
      REPLICATE_API_TOKEN  — required; Sire sets this once on Railway.
      REPLICATE_LOGO_MODEL — optional; defaults to black-forest-labs/flux-1.1-pro
                             (CAYUZ.jpg-grade quality). Set to
                             black-forest-labs/flux-schnell for faster/cheaper output.
    """
    token = settings.REPLICATE_API_TOKEN
    model = settings.REPLICATE_LOGO_MODEL or "black-forest-labs/flux-1.1-pro"
    if not token:
        return {
            "ok": False, "supplier": "replicate", "error": "missing_token",
            "message": (
                "REPLICATE_API_TOKEN env var is not set on the chitti-logo-video service. "
                "Sire: visit replicate.com → Account → API Tokens, create one, and add it "
                "to the Railway service env vars as REPLICATE_API_TOKEN."
            ),
        }

    prompt = _build_prompt(brand_name, tagline, palette, style)
    log.info("replicate: model=%s prompt_len=%d brand=%r style=%r", model, len(prompt), brand_name, style)

    # Replicate official-model predictions endpoint (no version SHA needed)
    url = f"https://api.replicate.com/v1/models/{model}/predictions"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        # Synchronous response — block up to 60s waiting for the prediction
        "Prefer": "wait=60",
    }
    payload = {
        "input": {
            "prompt": prompt,
            "aspect_ratio": "1:1",
            "output_format": "png",
            "output_quality": 95,
            "safety_tolerance": 2,
            "prompt_upsampling": True,
        },
    }
    t0 = time.time()
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=90)
    except requests.RequestException as e:
        log.warning("replicate: network error %s", e)
        return {
            "ok": False, "supplier": "replicate", "error": "network_error",
            "message": f"Could not reach Replicate: {e}",
        }
    elapsed_ms = int((time.time() - t0) * 1000)

    if r.status_code == 401:
        return {
            "ok": False, "supplier": "replicate", "error": "unauthorized",
            "message": "Replicate rejected the token. Verify REPLICATE_API_TOKEN on Railway.",
        }
    if r.status_code == 402:
        return {
            "ok": False, "supplier": "replicate", "error": "out_of_credits",
            "message": (
                "Replicate free trial credits are exhausted. Add billing at replicate.com → "
                "Account → Billing, or switch REPLICATE_LOGO_MODEL to "
                "black-forest-labs/flux-schnell (~$0.003/image)."
            ),
        }
    if r.status_code >= 400:
        log.warning("replicate: HTTP %d %s", r.status_code, r.text[:300])
        return {
            "ok": False, "supplier": "replicate",
            "error": f"http_{r.status_code}",
            "message": f"Replicate returned HTTP {r.status_code}: {r.text[:200]}",
        }

    body = r.json()
    status = body.get("status")
    pred_id = body.get("id")
    output = body.get("output")

    # If the prediction is still running (Prefer: wait timed out), poll briefly
    poll_url = (body.get("urls") or {}).get("get")
    while status in ("starting", "processing") and poll_url:
        time.sleep(2)
        if (time.time() - t0) > 90:
            return {
                "ok": False, "supplier": "replicate", "error": "timeout",
                "message": f"Replicate prediction {pred_id} still processing after 90s.",
            }
        try:
            pr = requests.get(poll_url, headers={"Authorization": f"Bearer {token}"}, timeout=20)
            pr.raise_for_status()
            body = pr.json()
            status = body.get("status")
            output = body.get("output")
        except requests.RequestException as e:
            return {"ok": False, "supplier": "replicate", "error": "poll_error", "message": str(e)}

    if status != "succeeded":
        return {
            "ok": False, "supplier": "replicate", "error": f"status_{status}",
            "message": f"Replicate prediction ended in status={status}: {body.get('error') or ''}",
        }

    # Flux models return either a single URL string or a list of URLs
    image_url = None
    if isinstance(output, str):
        image_url = output
    elif isinstance(output, list) and output:
        image_url = output[0]

    if not image_url:
        return {
            "ok": False, "supplier": "replicate", "error": "empty_output",
            "message": f"Replicate succeeded but returned no image: {body}",
        }

    return {
        "ok": True,
        "supplier": "replicate",
        "model": model,
        "prediction_id": pred_id,
        "image_url": image_url,
        "prompt": prompt,
        "brand_name": brand_name,
        "tagline": tagline,
        "palette_name": None,  # filled by caller
        "palette": palette,
        "style": style,
        "elapsed_ms": elapsed_ms,
        "disclaimer": "Generated by Replicate Flux. Image hosted on Replicate's CDN — download to save.",
    }


def generate_logo(*, brand_name: str, tagline: str = "", palette_name: str = "bharat",
                  style: str = "monogram") -> dict:
    palette = PALETTES.get(palette_name, PALETTES["bharat"])

    # If REPLICATE_API_TOKEN is set, attempt the real photoreal generator.
    # REPLICATE_LOGO_MODEL is OPTIONAL — defaults to flux-1.1-pro inside
    # _replicate_generate(). On failure, we DO NOT silently fall back to the
    # SVG mock — we surface the error so Sire knows the integration broke.
    # Honest stubs over fake demos (SAHAYAI_MASTER.md §3 #4).
    if settings.REPLICATE_API_TOKEN:
        result = _replicate_generate(brand_name, tagline, palette, style)
        result["palette_name"] = palette_name
        if result.get("ok"):
            return result
        # Replicate failed (network, quota, etc) — return the mock alongside the
        # error so the UI still has something to show, with full honesty.
        mock_payload = _mock_payload(brand_name, tagline, palette, palette_name, style)
        mock_payload["replicate_attempted"] = True
        mock_payload["replicate_error"] = result.get("error")
        mock_payload["replicate_message"] = result.get("message")
        return mock_payload

    # No token set — honest mock + clear instruction for Sire to wire the key.
    return _mock_payload(brand_name, tagline, palette, palette_name, style,
                         needs_token=True)


def _mock_payload(brand_name: str, tagline: str, palette: dict, palette_name: str,
                  style: str, needs_token: bool = False) -> dict:
    svg = _mock_svg(brand_name, tagline, palette, style)
    return {
        "ok": True,
        "supplier": "mock",
        "brand_name": brand_name,
        "tagline": tagline,
        "palette_name": palette_name,
        "palette": palette,
        "style": style,
        "svg": svg,
        "disclaimer": (
            "REPLICATE_API_TOKEN not set on chitti-logo-video service — showing SVG mock. "
            "Sire: visit replicate.com → Account → API Tokens, create one, and add it as "
            "REPLICATE_API_TOKEN in the Railway service env vars for photorealistic output."
            if needs_token
            else "Showing SVG mock — set REPLICATE_API_TOKEN for photorealistic logos."
        ),
        "needs_token": needs_token,
    }


def health() -> dict:
    return {
        "ok": True,
        "service": "logo",
        "supplier": "replicate" if settings.REPLICATE_API_TOKEN else "mock",
        "palettes": list(PALETTES.keys()),
        "styles": ["monogram", "wordmark", "shield"],
    }
