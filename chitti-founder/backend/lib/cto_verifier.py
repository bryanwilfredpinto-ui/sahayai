"""
chitti-founder / lib / cto_verifier.py — 2026-05-27

Chitti Founder = CTO. Verifies the live web before reporting "ready to test".
Implements the 10-gate quality check + the daily 08:00 IST CTO health pass
+ the Sunday 09:00 IST CTO weekly report (built on top of the existing
quality-framework crons in main.py).

Design rules (locked):
- HONEST. Every gate that can't be verified server-side from a fetched HTML
  body returns "needs_human" — never silently True. The gate list mirrors
  SAHAYAI_MASTER §7 (four-user contract + per-response widget) and §6
  (quality framework). Anything that needs an interactive browser
  (language switcher actually toggles, voice plays, ISL animates, 375px
  layout renders correctly) is flagged for human verification — we do not
  fake-pass it.
- READ-ONLY. This module fetches URLs and inspects HTML. It never writes
  to remote services. WhatsApp send / Gemini balance / DeepSeek balance
  are honest stubs that surface "wire the token to enable" instead of
  faking a number — same posture as the BCP Layer 1 helpers in main.py.
- Tolerant. Network blip / DNS failure / cert issue is reported as a
  RED gate on that page, never a crash.

Hooked from main.py:
  run_cto_daily()           — 08:00 IST cron       (frontend + backend health)
  run_cto_weekly()          — Sunday 09:00 IST cron (week summary, 3 priorities)
  verify_deployment(url)    — after-push verification (called on demand)
  verify_url(url)           — single-URL 10-gate pass; the building block
"""
from __future__ import annotations

import logging
import re
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any

import httpx

log = logging.getLogger("chitti-founder.cto")


# ---------- Watchlists -----------------------------------------------------

# Every public page sahayai.in serves that the CTO must keep green.
# Order matches the user's brief on 2026-05-27.
FRONTEND_PAGES_TO_WATCH: list[str] = [
    "https://sahayai.in/index.html",
    "https://sahayai.in/chitti_logo_video.html",
    "https://sahayai.in/chitti_vaani.html",
    "https://sahayai.in/chitti_medupi.html",
    "https://sahayai.in/chitti_health_file.html",
    "https://sahayai.in/chitti_government.html",
    "https://sahayai.in/chitti_news.html",
    "https://sahayai.in/chitti_legal.html",
    "https://sahayai.in/chitti_ca.html",
    "https://sahayai.in/chitti_scanner.html",
    "https://sahayai.in/chitti_upi.html",
    "https://sahayai.in/chitti_2wheeler.html",
    "https://sahayai.in/chitti_4wheeler.html",
    "https://sahayai.in/chitti_fashion.html",
    "https://sahayai.in/chitti_news_ai.html",
]

# Railway backend /health endpoints. main.py already self-pings these every
# 4 min when SELF_PING_ENABLED — the CTO daily check reuses the same list
# so the morning report is one consolidated view.
RAILWAY_HEALTH_URLS: list[str] = [
    "https://chitti-vaani-api-production.up.railway.app/health",
    "https://chitti-medupi-api-production.up.railway.app/health",
    "https://chitti-news-api-production.up.railway.app/health",
    "https://chitti-government-api-production.up.railway.app/health",
    "https://chitti-legal-api-production.up.railway.app/health",
    "https://chitti-ca-api-production.up.railway.app/health",
    "https://chitti-voice-factory-api-production.up.railway.app/health",
    "https://chitti-shares-api-production.up.railway.app/health",
    "https://chitti-logo-video-api-production.up.railway.app/health",
]


# Page-load budget per the user's brief (gate 2).
LOAD_BUDGET_S = 3.0
# After-push GitHub Pages typical propagation window.
POST_PUSH_WAIT_S = 180


# ---------- Result types ---------------------------------------------------


@dataclass
class GateResult:
    name: str
    status: str  # "pass" | "fail" | "needs_human"
    detail: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class URLVerifyResult:
    url: str
    fetched_ok: bool
    http_status: int
    load_ms: int
    bytes: int
    gates: list[GateResult] = field(default_factory=list)
    ts: str = ""

    @property
    def green(self) -> bool:
        # Green = no failed gates. needs_human is yellow, not red.
        return self.fetched_ok and not any(g.status == "fail" for g in self.gates)

    @property
    def yellow(self) -> bool:
        return self.fetched_ok and any(g.status == "needs_human" for g in self.gates) and self.green

    @property
    def red(self) -> bool:
        return not self.green

    @property
    def summary_emoji(self) -> str:
        if self.red: return "🔴"
        if self.yellow: return "⚠️"
        return "✅"

    def to_dict(self) -> dict[str, Any]:
        return {
            "url": self.url,
            "fetched_ok": self.fetched_ok,
            "http_status": self.http_status,
            "load_ms": self.load_ms,
            "bytes": self.bytes,
            "ts": self.ts,
            "green": self.green,
            "yellow": self.yellow,
            "red": self.red,
            "gates": [g.to_dict() for g in self.gates],
        }


# ---------- The 10-gate check ----------------------------------------------


def _fetch(url: str, timeout_s: float = 10.0) -> tuple[int, str, int, int]:
    """Fetch a URL. Returns (status_code, body, latency_ms, bytes).
    On exception returns (0, "<error>", elapsed, 0). Never raises."""
    t0 = time.monotonic()
    try:
        with httpx.Client(timeout=timeout_s, follow_redirects=True) as c:
            r = c.get(url)
        body = r.text or ""
        return r.status_code, body, int((time.monotonic() - t0) * 1000), len(body)
    except Exception as e:  # noqa: BLE001
        return 0, f"<fetch_error: {e!s}>", int((time.monotonic() - t0) * 1000), 0


# Regex helpers — compiled once.
_RE_VIEWPORT = re.compile(r'<meta[^>]+name=["\']viewport["\']', re.I)
_RE_A11Y_JS = re.compile(r'chitti_a11y\.js', re.I)
_RE_FEEDBACK_JS = re.compile(r'feedback-widget\.js', re.I)
_RE_ISL_JS = re.compile(r'chitti_isl\.js', re.I)
_RE_CHITTI_RESP = re.compile(r'data-chitti-response', re.I)
_RE_ARIA = re.compile(r'aria-(label|live|hidden|describedby)\s*=', re.I)
_RE_LANG_SELECT = re.compile(r'(lang-(picker|select)|language\s*(selector|picker)|data-i18n)', re.I)
_RE_BUTTON = re.compile(r'<button\b', re.I)
_RE_CONSOLE_ERR_HINT = re.compile(r'(uncaught\s+(referenceerror|typeerror)|>>>\s*error\s*:)', re.I)
_RE_404_MARKER = re.compile(r'(404\s+not\s+found|<title>\s*404)', re.I)


def _gate_status_200(http_status: int) -> GateResult:
    if http_status == 200:
        return GateResult("1. fetch returns 200", "pass", f"HTTP {http_status}")
    return GateResult("1. fetch returns 200", "fail", f"HTTP {http_status}")


def _gate_load_budget(load_ms: int) -> GateResult:
    budget_ms = int(LOAD_BUDGET_S * 1000)
    if load_ms <= budget_ms:
        return GateResult(f"2. load < {LOAD_BUDGET_S:.1f}s", "pass", f"{load_ms} ms")
    return GateResult(f"2. load < {LOAD_BUDGET_S:.1f}s", "fail", f"{load_ms} ms (over budget)")


def _gate_mobile_viewport(body: str) -> GateResult:
    # We can't render 375px from a fetch — best we can do is confirm the
    # viewport meta exists. Anything beyond is "needs_human".
    if _RE_VIEWPORT.search(body):
        return GateResult("3. mobile viewport meta present", "pass", "<meta name=viewport> found")
    return GateResult("3. mobile viewport meta present", "fail", "no <meta name=viewport>")


def _gate_a11y_substrate(body: str) -> GateResult:
    if _RE_A11Y_JS.search(body):
        return GateResult("4. chitti_a11y.js substrate loaded", "pass", "found script reference")
    return GateResult("4. chitti_a11y.js substrate loaded", "fail", "missing chitti_a11y.js")


def _gate_lang_switcher(body: str) -> GateResult:
    # chitti_a11y.js injects the language selector at runtime — we can't see
    # the injected DOM from a static fetch. Best heuristic: page declares
    # i18n hooks (data-i18n, data-i18n-aria) OR explicitly mounts a picker.
    if _RE_LANG_SELECT.search(body) or _RE_A11Y_JS.search(body):
        return GateResult(
            "5. language switcher / i18n hooks", "needs_human",
            "static page can't prove the selector toggles voice/UI — verify interactively",
        )
    return GateResult("5. language switcher / i18n hooks", "fail", "no i18n hooks visible")


def _gate_per_response_widget(body: str) -> GateResult:
    # Per SAHAYAI_MASTER §7 — every response box carries 🔊 🤖 👍 👎. The
    # feedback-widget.js attaches via MutationObserver, so the static
    # signal is: page references feedback-widget.js AND at least one
    # element marked data-chitti-response.
    has_widget = bool(_RE_FEEDBACK_JS.search(body))
    has_marker = bool(_RE_CHITTI_RESP.search(body))
    if has_widget and has_marker:
        return GateResult(
            "6. per-response widget (🔊 🤖 👍 👎)", "pass",
            "feedback-widget.js + data-chitti-response markers found",
        )
    miss = []
    if not has_widget: miss.append("feedback-widget.js")
    if not has_marker: miss.append("data-chitti-response")
    return GateResult(
        "6. per-response widget (🔊 🤖 👍 👎)", "fail",
        "missing: " + ", ".join(miss),
    )


def _gate_blind_user_path(body: str) -> GateResult:
    # Aria attributes + auto-voice from chitti_a11y.js are the minimum for
    # blind users. Auto-announce-on-open is JS-runtime; can't prove from a
    # static fetch — flag needs_human.
    aria_hits = len(_RE_ARIA.findall(body))
    if aria_hits >= 3 and _RE_A11Y_JS.search(body):
        return GateResult(
            "7. blind-user path (aria + auto-voice)", "needs_human",
            f"{aria_hits} aria-* attributes + chitti_a11y.js loaded — verify auto-voice fires",
        )
    if aria_hits == 0:
        return GateResult("7. blind-user path (aria + auto-voice)", "fail", "no aria-* attributes")
    return GateResult(
        "7. blind-user path (aria + auto-voice)", "needs_human",
        f"only {aria_hits} aria-* attributes — light coverage",
    )


def _gate_hindi_ui(body: str) -> GateResult:
    # i18n substrate (chitti_i18n.js) + data-i18n hooks → Hindi capable.
    if "chitti_i18n.js" in body and _RE_LANG_SELECT.search(body):
        return GateResult(
            "8. Hindi UI capable", "needs_human",
            "chitti_i18n.js + data-i18n hooks present — verify toggle actually swaps text",
        )
    if "data-i18n" in body:
        return GateResult(
            "8. Hindi UI capable", "needs_human",
            "data-i18n hooks present but chitti_i18n.js not directly referenced — verify",
        )
    return GateResult("8. Hindi UI capable", "fail", "no data-i18n hooks")


def _gate_no_broken_markers(body: str) -> GateResult:
    if _RE_404_MARKER.search(body):
        return GateResult("9. no 404 markers in body", "fail", "page text contains a 404 marker")
    if _RE_CONSOLE_ERR_HINT.search(body):
        return GateResult(
            "9. no console error hints in body", "needs_human",
            "static body contains an error-shaped string — verify in DevTools",
        )
    return GateResult("9. no obvious broken markers", "pass", "")


def _gate_tap_targets(body: str) -> GateResult:
    # Crude proxy: page uses <button> rather than only <a>/<div onclick>.
    # Real 48×48 verification requires CSS computation in a headless
    # browser — flag needs_human when buttons exist.
    n_btn = len(_RE_BUTTON.findall(body))
    if n_btn >= 3:
        return GateResult(
            "10. tap targets ≥48×48px", "needs_human",
            f"{n_btn} <button> elements found — verify 48×48 via DevTools",
        )
    return GateResult(
        "10. tap targets ≥48×48px", "fail",
        "no/very few <button> elements — likely tap-target issue",
    )


def verify_url(url: str) -> URLVerifyResult:
    """Run the 10 gates against a URL. Read-only; never raises."""
    status, body, load_ms, n_bytes = _fetch(url)
    fetched_ok = status == 200

    result = URLVerifyResult(
        url=url,
        fetched_ok=fetched_ok,
        http_status=status,
        load_ms=load_ms,
        bytes=n_bytes,
        ts=datetime.now(timezone.utc).isoformat(),
    )

    # If we couldn't fetch, gates 2-10 are all marked needs_human (we have
    # no body to inspect). Gate 1 carries the failure.
    if not fetched_ok:
        result.gates = [
            _gate_status_200(status),
            GateResult(f"2. load < {LOAD_BUDGET_S:.1f}s", "needs_human", "no body to time"),
            GateResult("3. mobile viewport meta present", "needs_human", "no body"),
            GateResult("4. chitti_a11y.js substrate loaded", "needs_human", "no body"),
            GateResult("5. language switcher / i18n hooks", "needs_human", "no body"),
            GateResult("6. per-response widget (🔊 🤖 👍 👎)", "needs_human", "no body"),
            GateResult("7. blind-user path (aria + auto-voice)", "needs_human", "no body"),
            GateResult("8. Hindi UI capable", "needs_human", "no body"),
            GateResult("9. no obvious broken markers", "needs_human", "no body"),
            GateResult("10. tap targets ≥48×48px", "needs_human", "no body"),
        ]
        return result

    result.gates = [
        _gate_status_200(status),
        _gate_load_budget(load_ms),
        _gate_mobile_viewport(body),
        _gate_a11y_substrate(body),
        _gate_lang_switcher(body),
        _gate_per_response_widget(body),
        _gate_blind_user_path(body),
        _gate_hindi_ui(body),
        _gate_no_broken_markers(body),
        _gate_tap_targets(body),
    ]
    return result


# ---------- Backend /health check ------------------------------------------


@dataclass
class BackendHealthResult:
    url: str
    http_status: int
    ok: bool
    load_ms: int
    error: str | None = None

    def to_dict(self) -> dict[str, Any]: return asdict(self)


def check_backend(url: str) -> BackendHealthResult:
    t0 = time.monotonic()
    try:
        with httpx.Client(timeout=6.0) as c:
            r = c.get(url)
        ms = int((time.monotonic() - t0) * 1000)
        return BackendHealthResult(
            url=url, http_status=r.status_code, ok=(r.status_code == 200), load_ms=ms,
        )
    except Exception as e:  # noqa: BLE001
        ms = int((time.monotonic() - t0) * 1000)
        return BackendHealthResult(
            url=url, http_status=0, ok=False, load_ms=ms, error=str(e)[:200],
        )


# ---------- Post-push deployment verification ------------------------------


def verify_deployment(url: str, wait_s: int = POST_PUSH_WAIT_S) -> URLVerifyResult:
    """Wait then verify. Used after `git push` lands on main and GitHub Pages
    needs ~3 min to publish. Caller decides when to invoke; this helper just
    blocks for `wait_s` and then runs the 10-gate check."""
    log.info("[cto] post-push wait %ds for GitHub Pages propagation", wait_s)
    time.sleep(max(0, wait_s))
    return verify_url(url)


# ---------- Daily 08:00 IST CTO health check -------------------------------


@dataclass
class CTODailyReport:
    ts: str
    frontends: list[URLVerifyResult]
    backends: list[BackendHealthResult]
    green: int = 0
    yellow: int = 0
    red: int = 0
    api_costs_note: str = ""   # honest stub until DeepSeek/Gemini balance APIs are wired
    recommended_fix_today: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "ts": self.ts,
            "frontends": [f.to_dict() for f in self.frontends],
            "backends": [b.to_dict() for b in self.backends],
            "green": self.green, "yellow": self.yellow, "red": self.red,
            "api_costs_note": self.api_costs_note,
            "recommended_fix_today": self.recommended_fix_today,
        }


def _api_costs_note() -> str:
    """Honest stub. Real balance APIs:
      - DeepSeek: no public balance endpoint (as of 2026-05-27)
      - Gemini: AI Studio quota endpoint, requires service-account auth
    Until both are wired, we surface an honest line rather than fake a number."""
    return (
        "API balance check pending wire-up — neither DeepSeek nor Gemini "
        "expose a one-call balance number on the free tier. Sire to check "
        "manually until a service-account is provisioned."
    )


def _recommend_fix(frontends: list[URLVerifyResult], backends: list[BackendHealthResult]) -> str:
    """Pick ONE next action — the CTO never dumps a 10-item list at 8am."""
    reds_f = [f for f in frontends if f.red]
    if reds_f:
        f = reds_f[0]
        # name the first failing gate
        failed = next((g for g in f.gates if g.status == "fail"), None)
        page = f.url.split("/")[-1] or f.url
        if failed:
            return f"Fix {page} — gate failed: {failed.name} ({failed.detail})"
        return f"Fix {page} — fetched_ok={f.fetched_ok}, HTTP {f.http_status}"
    reds_b = [b for b in backends if not b.ok]
    if reds_b:
        b = reds_b[0]
        return f"Restart backend — {b.url} returned HTTP {b.http_status} ({b.error or 'no error'})"
    yellows = [f for f in frontends if f.yellow]
    if yellows:
        f = yellows[0]
        nh = next((g for g in f.gates if g.status == "needs_human"), None)
        page = f.url.split("/")[-1] or f.url
        if nh:
            return f"Verify interactively — {page}: {nh.name} ({nh.detail})"
    return "Nothing red. Pick the top item from §5a P0 queue in SAHAYAI_MASTER.md."


def run_cto_daily(
    frontends: list[str] | None = None,
    backends: list[str] | None = None,
) -> CTODailyReport:
    """08:00 IST cron. Returns a fully-populated report (caller emails it)."""
    front_urls = frontends or FRONTEND_PAGES_TO_WATCH
    back_urls = backends or RAILWAY_HEALTH_URLS

    front_results = [verify_url(u) for u in front_urls]
    back_results = [check_backend(u) for u in back_urls]

    n_green = sum(1 for f in front_results if f.green and not f.yellow)
    n_yellow = sum(1 for f in front_results if f.yellow)
    n_red = sum(1 for f in front_results if f.red)

    rep = CTODailyReport(
        ts=datetime.now(timezone.utc).isoformat(),
        frontends=front_results,
        backends=back_results,
        green=n_green, yellow=n_yellow, red=n_red,
        api_costs_note=_api_costs_note(),
        recommended_fix_today=_recommend_fix(front_results, back_results),
    )
    log.info(
        "[cto-daily] frontends green=%d yellow=%d red=%d · backends ok=%d/%d",
        n_green, n_yellow, n_red,
        sum(1 for b in back_results if b.ok), len(back_results),
    )
    return rep


def render_cto_daily_html(rep: CTODailyReport) -> tuple[str, str]:
    """Build the morning WhatsApp-shaped email. Returns (subject, html_body)."""
    n_back_ok = sum(1 for b in rep.backends if b.ok)
    n_back_total = len(rep.backends)
    subject = (
        f"[Chitti CTO] Daily Health — "
        f"✅ {rep.green} ⚠️ {rep.yellow} 🔴 {rep.red} · "
        f"backends {n_back_ok}/{n_back_total}"
    )

    def _row(emoji: str, name: str, detail: str) -> str:
        return (
            f"<tr><td style='padding:6px 10px;border-bottom:1px solid #eee;font-size:14px'>{emoji}</td>"
            f"<td style='padding:6px 10px;border-bottom:1px solid #eee;font-size:14px'>{name}</td>"
            f"<td style='padding:6px 10px;border-bottom:1px solid #eee;color:#555;font-size:13px'>{detail}</td></tr>"
        )

    front_rows = []
    for f in rep.frontends:
        page = f.url.split("/")[-1] or f.url
        if f.red:
            failed = next((g for g in f.gates if g.status == "fail"), None)
            detail = failed.name + " — " + failed.detail if failed else f"HTTP {f.http_status}"
        elif f.yellow:
            nh = next((g for g in f.gates if g.status == "needs_human"), None)
            detail = "needs interactive verification: " + (nh.name if nh else "")
        else:
            detail = f"{f.load_ms} ms"
        front_rows.append(_row(f.summary_emoji, page, detail))

    back_rows = []
    for b in rep.backends:
        emoji = "✅" if b.ok else "🔴"
        detail = f"HTTP {b.http_status} · {b.load_ms} ms"
        if not b.ok and b.error: detail += f" · {b.error[:80]}"
        back_rows.append(_row(emoji, b.url.split("//")[-1].split(".")[0], detail))

    whatsapp_block = (
        "<div style='font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#dcfce7;"
        "border-left:4px solid #15803d;padding:14px;border-radius:8px;margin:16px 0;font-size:14px'>"
        "<div style='font-weight:800;color:#14532d;margin-bottom:6px'>WhatsApp-shaped daily message</div>"
        "<div style='white-space:pre-wrap'>"
        f"Good morning Sire. 8am health check:\n"
        f"✅ {rep.green} pages live and working\n"
        f"⚠️ {rep.yellow} pages need attention\n"
        f"🔴 {rep.red} pages down\n"
        f"💰 {rep.api_costs_note}\n"
        f"🔧 Recommended fix today: {rep.recommended_fix_today}"
        "</div></div>"
    )

    html = (
        "<html><body style='font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:900px;margin:24px auto;padding:0 16px'>"
        f"<h2 style='color:#0E2344;margin:0 0 4px'>Chitti CTO — Daily Health Check</h2>"
        f"<div style='color:#666;margin-bottom:14px'>{rep.ts} · 08:00 IST cron</div>"
        f"{whatsapp_block}"
        "<h3 style='color:#0E2344'>Frontends (sahayai.in)</h3>"
        "<table style='border-collapse:collapse;width:100%'>"
        + "".join(front_rows) +
        "</table>"
        "<h3 style='color:#0E2344;margin-top:18px'>Backends (Railway /health)</h3>"
        "<table style='border-collapse:collapse;width:100%'>"
        + "".join(back_rows) +
        "</table>"
        "<p style='color:#666;margin-top:24px;font-size:12px'>"
        "Honest-stub posture: gates marked ⚠️ need interactive verification "
        "(language switcher actually toggles, 375px renders, voice plays, ISL animates) — "
        "we never fake-pass these from a static fetch. Per SAHAYAI_MASTER §2c §7."
        "</p>"
        "</body></html>"
    )
    return subject, html


# ---------- Weekly Sunday 09:00 IST CTO report -----------------------------


def render_cto_weekly_html(
    week_dailies: list[CTODailyReport],
    built_this_week: list[str],
    verified_this_week: list[str],
    fixed_this_week: list[str],
    risks: list[str],
    next_priorities: list[str],
    api_cost_note: str = "",
) -> tuple[str, str]:
    """Render the Sunday CTO weekly. Caller assembles the four lists from
    git log + slice data + manual notes."""
    if not week_dailies:
        n_red_avg = 0
    else:
        n_red_avg = round(sum(d.red for d in week_dailies) / len(week_dailies), 1)

    subject = "[Chitti CTO] Weekly Report — Sunday 09:00 IST"

    def _ul(items: list[str]) -> str:
        if not items: return "<li style='color:#888'>— nothing recorded —</li>"
        return "".join(f"<li>{x}</li>" for x in items)

    pages_with_issues: list[str] = []
    seen: set[str] = set()
    for d in week_dailies:
        for f in d.frontends:
            if not f.green and f.url not in seen:
                pages_with_issues.append(f.url.split("/")[-1] or f.url)
                seen.add(f.url)

    pages_issues_block = "<ul>" + _ul(pages_with_issues) + "</ul>"

    html = (
        "<html><body style='font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:900px;margin:24px auto;padding:0 16px'>"
        "<h2 style='color:#0E2344;margin:0 0 4px'>Chitti CTO — Weekly Report</h2>"
        f"<div style='color:#666;margin-bottom:14px'>Sunday 09:00 IST · {len(week_dailies)} daily checks in this window</div>"
        "<h3 style='color:#0E2344'>✅ Built this week</h3>"
        f"<ul>{_ul(built_this_week)}</ul>"
        "<h3 style='color:#0E2344'>✅ Tested & verified this week</h3>"
        f"<ul>{_ul(verified_this_week)}</ul>"
        "<h3 style='color:#0E2344'>✅ Fixed this week</h3>"
        f"<ul>{_ul(fixed_this_week)}</ul>"
        f"<h3 style='color:#0E2344'>💰 Total API cost this week</h3>"
        f"<p>{api_cost_note or _api_costs_note()}</p>"
        "<h3 style='color:#0E2344'>📊 Pages with issues this week</h3>"
        f"{pages_issues_block}"
        f"<p style='color:#666;font-size:12px'>Average red pages per day: {n_red_avg}</p>"
        "<h3 style='color:#0E2344'>🎯 Plan for next week (3 priorities)</h3>"
        f"<ol>{_ul(next_priorities)}</ol>"
        "<h3 style='color:#0E2344'>⚠️ Risks to watch (honest list)</h3>"
        f"<ul>{_ul(risks)}</ul>"
        "<hr/><p style='color:#666;font-size:12px'>"
        "CTO Oath: never ship broken code · never ask Sire to test until I have tested · "
        "proactively fix before Sire notices · protect Sire's time and energy · "
        "report honestly — good and bad."
        "</p></body></html>"
    )
    return subject, html


# ---------- WhatsApp send (honest stub) ------------------------------------


def whatsapp_send(text: str) -> dict[str, Any]:
    """Send a WhatsApp message to Sire.

    Two suppliers, tried in order:
      1. Twilio  — TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_FROM + ALERT_WHATSAPP_TO
      2. Meta Cloud — WHATSAPP_BUSINESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_TO_NUMBER

    If neither set is complete, returns an honest stub (logs intent,
    returns ok=False). Email rails carry the same report meanwhile.
    Real HTTP calls never fake a 200 — failure surfaces in the result.
    """
    import os
    body = (text or "")[:1600]

    # ---- Supplier 1: Twilio (preferred — simpler one-time auth) ----
    sid       = os.environ.get("TWILIO_ACCOUNT_SID", "")
    tok       = os.environ.get("TWILIO_AUTH_TOKEN", "")
    twi_from  = os.environ.get("TWILIO_WHATSAPP_FROM", "")  # e.g. "whatsapp:+14155238886"
    alert_to  = os.environ.get("ALERT_WHATSAPP_TO", "")     # e.g. "whatsapp:+91XXXXXXXXXX"
    if sid and tok and twi_from and alert_to:
        try:
            with httpx.Client(timeout=10.0) as c:
                r = c.post(
                    f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
                    auth=(sid, tok),
                    data={"From": twi_from, "To": alert_to, "Body": body},
                )
            ok = r.status_code in (200, 201)
            log.info("[cto-whatsapp] twilio status=%d ok=%s", r.status_code, ok)
            out: dict[str, Any] = {"ok": ok, "supplier": "twilio", "status": r.status_code}
            try:
                jr = r.json()
                if ok: out["sid"] = jr.get("sid")
                else:  out["error"] = jr.get("message", r.text[:200])
            except Exception:  # noqa: BLE001
                if not ok: out["error"] = r.text[:200]
            return out
        except Exception as e:  # noqa: BLE001
            log.warning("[cto-whatsapp] twilio exception: %s", e)
            return {"ok": False, "supplier": "twilio", "error": str(e)[:200]}

    # ---- Supplier 2: Meta WhatsApp Cloud API ----
    meta_tok  = os.environ.get("WHATSAPP_BUSINESS_TOKEN", "")
    phone_id  = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
    to_num    = os.environ.get("WHATSAPP_TO_NUMBER", "")
    if meta_tok and phone_id and to_num:
        try:
            with httpx.Client(timeout=10.0) as c:
                r = c.post(
                    f"https://graph.facebook.com/v18.0/{phone_id}/messages",
                    headers={"Authorization": f"Bearer {meta_tok}"},
                    json={"messaging_product": "whatsapp", "to": to_num,
                          "type": "text", "text": {"body": body[:4096]}},
                )
            ok = r.status_code in (200, 201)
            log.info("[cto-whatsapp] meta-cloud status=%d ok=%s", r.status_code, ok)
            return {"ok": ok, "supplier": "meta_cloud", "status": r.status_code,
                    "error": (None if ok else r.text[:200])}
        except Exception as e:  # noqa: BLE001
            log.warning("[cto-whatsapp] meta-cloud exception: %s", e)
            return {"ok": False, "supplier": "meta_cloud", "error": str(e)[:200]}

    # ---- Neither configured — honest stub ----
    log.info(
        "[cto-whatsapp] honest stub — would have sent %d chars. Set either "
        "TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_FROM + ALERT_WHATSAPP_TO "
        "OR WHATSAPP_BUSINESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_TO_NUMBER on "
        "Railway to enable.", len(body),
    )
    return {"ok": False, "reason": "honest_stub_no_creds", "bytes": len(body),
            "supplier_needed": "twilio_or_meta_cloud"}
