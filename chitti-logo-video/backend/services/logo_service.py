"""Logo generation service.

Stub mode (default): returns a deterministic, hand-crafted SVG monogram in the
caller's chosen palette. This is honest — we tell the caller `supplier="mock"`
so the frontend can show the right disclaimer.

Real mode (when REPLICATE_API_TOKEN + REPLICATE_LOGO_MODEL set): not yet
implemented. The wire-up point is `_replicate_generate()` below.
"""

from __future__ import annotations

import html

from config import settings


PALETTES = {
    "bharat":   {"primary": "#E86A17", "secondary": "#0E2344", "accent": "#D4AF37", "ink": "#FFFFFF"},
    "modern":   {"primary": "#6366F1", "secondary": "#0F172A", "accent": "#22D3EE", "ink": "#FFFFFF"},
    "classic":  {"primary": "#1F2937", "secondary": "#F3F4F6", "accent": "#B45309", "ink": "#FFFFFF"},
    "festive":  {"primary": "#DC2626", "secondary": "#15803D", "accent": "#FACC15", "ink": "#FFFFFF"},
    "calm":     {"primary": "#0F766E", "secondary": "#0C4A6E", "accent": "#67E8F9", "ink": "#FFFFFF"},
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


def _replicate_generate(brand_name: str, tagline: str, palette: dict, style: str) -> dict:
    # Wire here when REPLICATE_API_TOKEN + REPLICATE_LOGO_MODEL are provided.
    return {
        "ok": False,
        "supplier": "replicate",
        "error": "not_implemented",
        "message": "Replicate logo generation not yet wired. Mock returned by stub instead.",
    }


def generate_logo(*, brand_name: str, tagline: str = "", palette_name: str = "bharat",
                  style: str = "monogram") -> dict:
    palette = PALETTES.get(palette_name, PALETTES["bharat"])

    if settings.REPLICATE_API_TOKEN and settings.REPLICATE_LOGO_MODEL:
        result = _replicate_generate(brand_name, tagline, palette, style)
        if result.get("ok"):
            return result
        # fall through to mock; stay honest about why
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
            "Mock logo generator. Real model (Replicate) wires in when REPLICATE_API_TOKEN "
            "+ REPLICATE_LOGO_MODEL env vars are set."
        ),
    }


def health() -> dict:
    return {
        "ok": True,
        "service": "logo",
        "supplier": "replicate" if settings.REPLICATE_API_TOKEN else "mock",
        "palettes": list(PALETTES.keys()),
        "styles": ["monogram", "wordmark", "shield"],
    }
