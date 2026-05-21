#!/usr/bin/env python3
"""
fix_chitti_pages.py — restore the 3 blocking gaps the inspector found:

1. chitti_vaani.html — missing feedback-widget.js script tag. Add it.
2. chitti_voice_factory.html — no language selector. Add a simple <select>.
3. All 14 pages — no QR code. Inject a base64 PNG QR pointing to that page
   on sahayai.in, with a small caption block ("Open on phone:") so it is
   accessible to blind users via the read-page button.

Each step is idempotent — re-running the script is a no-op once applied.
"""
from __future__ import annotations

import base64
import io
import re
import sys
from pathlib import Path

try:
    import qrcode
except ImportError:  # pragma: no cover
    print("ERROR: pip install qrcode[pil] first", file=sys.stderr)
    raise

ROOT = Path(__file__).resolve().parent.parent

TARGET_PAGES = [
    "chitti_vaani.html",
    "chitti_medupi.html",
    "chitti_news.html",
    "chitti_upi.html",
    "chitti_ca.html",
    "chitti_legal.html",
    "chitti_government.html",
    "chitti_scanner.html",
    "chitti_fundamentals.html",
    "chitti_complete_technical.html",
    "chitti_news_ai.html",
    "chitti_voice_factory.html",
    "chitti_2wheeler.html",
    "chitti_4wheeler.html",
]

BASE_URL = "https://sahayai.in/"


def qr_data_uri(url: str) -> str:
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=4, border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0E2344", back_color="#FFFFFF")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


# ── snippets ────────────────────────────────────────────────────────────
VAANI_WIDGET_TAG = '<!-- Chitti feedback widget (locked SAHAYAI §7) -->\n<script src="feedback-widget.js" data-page="chitti_vaani"></script>\n'

VOICE_FACTORY_LANG_SELECT = """\
<!-- Chitti language selector (single dropdown, locked 2026-05-21) -->
<div id="chitti-lang-bar" style="display:flex;align-items:center;gap:8px;justify-content:flex-end;padding:8px 16px;background:#0E2344;color:#fff;font-family:Inter,system-ui,sans-serif;font-size:13px">
  <label for="lang-select" style="font-weight:600">🌐 Language:</label>
  <select id="lang-select" data-chitti-lang style="background:#fff;color:#0E2344;border:1px solid #D4AF37;border-radius:6px;padding:5px 9px;font-weight:600;font-size:13px;cursor:pointer">
    <option value="en">English</option>
    <option value="hi">हिन्दी</option>
    <option value="bn">বাংলা</option>
    <option value="ta">தமிழ்</option>
    <option value="te">తెలుగు</option>
    <option value="kn">ಕನ್ನಡ</option>
    <option value="ml">മലയാളം</option>
    <option value="mr">मराठी</option>
    <option value="gu">ગુજરાતી</option>
    <option value="pa">ਪੰਜਾਬੀ</option>
    <option value="or">ଓଡ଼ିଆ</option>
    <option value="as">অসমীয়া</option>
    <option value="ur">اردو</option>
    <option value="sa">संस्कृतम्</option>
  </select>
</div>
<script>
  (function () {
    try {
      var sel = document.getElementById('lang-select');
      if (!sel) return;
      var saved = localStorage.getItem('chitti_lang') || (navigator.language || 'en').split('-')[0];
      if ([].slice.call(sel.options).some(function (o) { return o.value === saved; })) sel.value = saved;
      document.documentElement.setAttribute('lang', saved);
      sel.addEventListener('change', function () {
        var v = sel.value;
        try { localStorage.setItem('chitti_lang', v); } catch (e) {}
        document.documentElement.setAttribute('lang', v);
        if (window.Chitti && window.Chitti.a11y && typeof window.Chitti.a11y.setLang === 'function') {
          try { window.Chitti.a11y.setLang(v); } catch (e) {}
        }
        // The Voice Factory ledger is language-agnostic at v1; flip the
        // <html lang> attribute so screen-readers + Voice Factory pick the
        // right voice on the existing read-page flow.
      });
    } catch (e) {}
  })();
</script>
"""


QR_TEMPLATE = """\
<!-- Chitti QR (locked 2026-05-21) — open on phone, scan, hand off to mobile -->
<div class="chitti-qr-block" data-chitti-response data-chitti-section="QR — open on phone" aria-label="QR code — open this Chitti on your phone" style="margin:32px auto 24px;max-width:480px;padding:18px 20px;background:#F8F4EE;border:1px solid #D4AF37;border-radius:14px;font-family:Inter,system-ui,sans-serif;display:flex;align-items:center;gap:18px;box-shadow:0 2px 10px rgba(14,35,68,.08)">
  <img src="{src}" alt="QR code — opens {label} on your phone at {url}" width="120" height="120" style="border-radius:8px;background:#fff;padding:6px;flex-shrink:0">
  <div style="flex:1;min-width:0">
    <div style="font-weight:700;color:#0E2344;font-size:15px;margin-bottom:4px">📱 Open on phone</div>
    <div style="color:#475569;font-size:13px;line-height:1.5;margin-bottom:8px">Scan to open {label} on your phone. Voice-first. Free. Works in 26 Indian languages.</div>
    <code style="font-size:11px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:3px 8px;color:#0E2344;word-break:break-all">{url}</code>
  </div>
</div>
"""

# Marker comments make each insertion idempotent.
QR_MARKER = "<!-- Chitti QR (locked 2026-05-21)"
VAANI_WIDGET_MARKER = '<script src="feedback-widget.js" data-page="chitti_vaani"></script>'
VOICE_FACTORY_LANG_MARKER = 'id="chitti-lang-bar"'


def slug_for(page_name: str) -> str:
    return page_name.replace(".html", "").replace("chitti_", "").replace("_", " ").title()


def page_url(name: str) -> str:
    return BASE_URL + name


def inject_before_body_close(html: str, snippet: str) -> str:
    m = re.search(r"</body\s*>", html, re.IGNORECASE)
    if not m:
        return html + "\n" + snippet
    return html[:m.start()] + snippet + "\n" + html[m.start():]


def inject_after_body_open(html: str, snippet: str) -> str:
    m = re.search(r"<body[^>]*>", html, re.IGNORECASE)
    if not m:
        # fallback: after </head>
        m = re.search(r"</head\s*>", html, re.IGNORECASE)
        if not m:
            return snippet + "\n" + html
        return html[:m.end()] + "\n" + snippet + html[m.end():]
    return html[:m.end()] + "\n" + snippet + html[m.end():]


def fix_page(path: Path) -> dict:
    html = path.read_text(encoding="utf-8")
    actions: dict[str, str] = {}

    # 1. vaani: ensure feedback-widget.js script tag.
    if path.name == "chitti_vaani.html":
        if VAANI_WIDGET_MARKER not in html:
            html = inject_before_body_close(html, VAANI_WIDGET_TAG)
            actions["feedback_widget_tag"] = "added"
        else:
            actions["feedback_widget_tag"] = "already"

    # 2. voice_factory: ensure language <select>.
    if path.name == "chitti_voice_factory.html":
        if VOICE_FACTORY_LANG_MARKER not in html:
            html = inject_after_body_open(html, VOICE_FACTORY_LANG_SELECT)
            actions["lang_select"] = "added"
        else:
            actions["lang_select"] = "already"

    # 3. All 14: add a QR block.
    if QR_MARKER not in html:
        url = page_url(path.name)
        snippet = QR_TEMPLATE.format(src=qr_data_uri(url), label=slug_for(path.name), url=url)
        html = inject_before_body_close(html, snippet)
        actions["qr"] = "added"
    else:
        actions["qr"] = "already"

    path.write_text(html, encoding="utf-8")
    return actions


def main(argv):
    pages = argv[1:] or TARGET_PAGES
    print(f"{'page':<38} {'feedback_widget_tag':>20} {'lang_select':>14} {'qr':>8}")
    print("-" * 84)
    for name in pages:
        p = ROOT / name
        if not p.exists():
            print(f"SKIP missing: {name}")
            continue
        a = fix_page(p)
        print(f"{name:<38} {a.get('feedback_widget_tag', '-'):>20} {a.get('lang_select', '-'):>14} {a.get('qr', '-'):>8}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
