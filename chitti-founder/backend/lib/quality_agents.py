"""
lib/quality_agents.py
---------------------
Chitti Quality — four orchestrated agents (2026-06-13).

Chitti Quality has always *audited*. This module gives it four named hands that
run on a schedule and feed the SAME two surfaces Chitti Quality already owns:

  • the 07:00 IST founder email  (lib/founder_report.render_email_html)
  • the public page              (chitti_quality.html)

It builds NO new infrastructure. Every agent is a thin orchestration over
helpers that already exist in this package:

  ┌───────────────┬──────────────────────────────────────────────────────────┐
  │ Agent         │ Reuses                                                     │
  ├───────────────┼──────────────────────────────────────────────────────────┤
  │ DevOps        │ cto_verifier.check_backend + RAILWAY_HEALTH_URLS           │
  │  06:00 daily  │ (+ honest Railway redeploy when RAILWAY_API_TOKEN is set)  │
  │ QA            │ cto_verifier.verify_url (the 10-gate "How To Use" test)    │
  │  after DevOps │ run against every FRONTEND_PAGES_TO_WATCH product          │
  │ Developer     │ chitti_quality.open_github_issue (fix-list → tickets)      │
  │  on QA bugs   │                                                            │
  │ UI            │ cto_verifier._fetch + sahayai_design_system.css palette    │
  │  Sundays      │                                                            │
  └───────────────┴──────────────────────────────────────────────────────────┘

Honest-stubs-over-fake-demos (SAHAYAI_MASTER.md §3 #4) holds throughout:

  • DevOps "fixes crashes" by calling the Railway redeploy API when a token is
    configured; with no token it logs what it WOULD redeploy and returns an
    honest no-op (Railway also auto-restarts crashed dynos on its own).
  • Developer files fix tickets; it never claims to have written code it didn't.
    Code fixes still land via a Claude/Sire PR — the agent only triages.
  • UI hard-fails only on a missing design stylesheet; off-palette colour is
    reported as drift (amber, needs human confirm), never silently rounded.

Module state is in-process (mirrors the existing _CTO_DAILY_RING pattern in
main.py). Survives the life of the dyno; the 06:00 run refills it daily.
"""
from __future__ import annotations

import json
import logging
import os
import re
from collections import deque
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from lib.cto_verifier import (
    FRONTEND_PAGES_TO_WATCH,
    RAILWAY_HEALTH_URLS,
    check_backend,
    verify_url,
    _fetch,  # read-only page fetch — reused by the UI agent
)
from lib.chitti_quality import open_github_issue

log = logging.getLogger("quality_agents")
_IST = ZoneInfo("Asia/Kolkata")

AGENTS = ["devops", "qa", "developer", "ui"]
AGENT_TITLES = {
    "devops":    "🚂 DevOps Agent",
    "qa":        "🧪 QA Agent",
    "developer": "🛠️ Developer Agent",
    "ui":        "🎨 UI Agent",
}
AGENT_SCHEDULE = {
    "devops":    "06:00 IST daily",
    "qa":        "after DevOps confirms online",
    "developer": "triggered when QA finds bugs",
    "ui":        "Sundays 06:30 IST",
}


def _now_iso() -> str:
    return datetime.now(_IST).isoformat(timespec="seconds")


def _slug(url: str) -> str:
    host = url.split("://", 1)[-1].split("/", 1)[0]
    return host.split(".", 1)[0].removesuffix("-api")


def _page_name(url: str) -> str:
    tail = url.rstrip("/").split("/")[-1] or url
    return tail.removesuffix(".html")


# =====================================================================
# Result model + in-process state
# =====================================================================


@dataclass
class AgentRun:
    agent: str                       # one of AGENTS
    ts: str
    status: str                      # "green" | "amber" | "red"
    headline: str
    detail: dict[str, Any] = field(default_factory=dict)

    @property
    def title(self) -> str:
        return AGENT_TITLES.get(self.agent, self.agent)

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["title"] = self.title
        d["schedule"] = AGENT_SCHEDULE.get(self.agent, "")
        return d


# Most-recent run per agent — read by the 07:00 email + the public page.
_LAST_RUNS: dict[str, AgentRun] = {}
# Rolling history for the weekly view / debugging.
_HISTORY: deque[AgentRun] = deque(maxlen=64)


def record_run(run: AgentRun) -> AgentRun:
    _LAST_RUNS[run.agent] = run
    _HISTORY.append(run)
    return run


def last_run(agent: str) -> AgentRun | None:
    return _LAST_RUNS.get(agent)


# =====================================================================
# 1. DevOps Agent — 06:00 daily — Railway health + crash fixes
# =====================================================================


def _railway_service_ids() -> dict[str, str]:
    """slug → Railway serviceId map, from RAILWAY_SERVICE_IDS env (JSON).
    Empty when unset — DevOps then runs in honest no-op fix mode."""
    raw = os.environ.get("RAILWAY_SERVICE_IDS", "")
    if not raw:
        return {}
    try:
        m = json.loads(raw)
        return {str(k): str(v) for k, v in m.items()} if isinstance(m, dict) else {}
    except (json.JSONDecodeError, TypeError):
        log.warning("[devops] RAILWAY_SERVICE_IDS is not valid JSON — ignoring")
        return {}


def _attempt_railway_restart(url: str) -> dict[str, Any]:
    """Try to redeploy a crashed Railway service. Honest no-op when the
    RAILWAY_API_TOKEN / service-id map is not configured — Railway also
    auto-restarts crashed dynos, and Sire (founder = CTO) redeploys from
    origin/main if a crash persists."""
    slug = _slug(url)
    token = os.environ.get("RAILWAY_API_TOKEN", "")
    svc_id = _railway_service_ids().get(slug, "")
    if not (token and svc_id):
        log.info("[devops] would redeploy %s — no RAILWAY_API_TOKEN/service-id; honest no-op", slug)
        return {
            "slug": slug, "attempted": False, "ok": False, "method": "none",
            "detail": ("RAILWAY_API_TOKEN or service-id not configured. Railway "
                       "auto-restarts crashed dynos; Sire redeploys from origin/main "
                       "if the crash persists."),
        }
    try:
        import httpx
        query = ("mutation redeploy($id: String!) { "
                 "serviceInstanceRedeploy(serviceId: $id) }")
        with httpx.Client(timeout=20) as c:
            r = c.post(
                "https://backboard.railway.app/graphql/v2",
                headers={"Authorization": f"Bearer {token}",
                         "Content-Type": "application/json"},
                json={"query": query, "variables": {"id": svc_id}},
            )
        ok = r.status_code == 200 and "errors" not in (r.json() if r.content else {})
        log.info("[devops] redeploy %s → http=%s ok=%s", slug, r.status_code, ok)
        return {"slug": slug, "attempted": True, "ok": ok, "method": "railway_graphql",
                "detail": f"serviceInstanceRedeploy → HTTP {r.status_code}"}
    except Exception as e:  # noqa: BLE001
        log.warning("[devops] redeploy %s failed: %s", slug, e)
        return {"slug": slug, "attempted": True, "ok": False, "method": "railway_graphql",
                "detail": f"exception: {str(e)[:160]}"}


def run_devops_agent(backends: list[str] | None = None) -> AgentRun:
    """06:00 IST. Check every Railway service; attempt a redeploy on any that
    is down; report to the founder rails."""
    urls = backends or RAILWAY_HEALTH_URLS
    results = [check_backend(u) for u in urls]
    down = [r for r in results if not r.ok]
    fixes = [_attempt_railway_restart(r.url) for r in down]

    online = not down
    if online:
        status = "green"
    elif len(down) < len(urls):
        status = "amber"
    else:
        status = "red"

    headline = (
        f"All {len(urls)} Railway services online"
        if online else
        f"{len(down)}/{len(urls)} down — "
        f"{sum(1 for f in fixes if f['attempted'])} redeploy(s) attempted"
    )
    detail = {
        "online": online,
        "total": len(urls),
        "down_count": len(down),
        "services": [
            {"slug": _slug(r.url), "url": r.url, "ok": r.ok,
             "http_status": r.http_status, "load_ms": r.load_ms, "error": r.error}
            for r in results
        ],
        "fixes": fixes,
    }
    return record_run(AgentRun("devops", _now_iso(), status, headline, detail))


# =====================================================================
# 2. QA Agent — after DevOps online — "How To Use" test on every product
# =====================================================================


def run_qa_agent(pages: list[str] | None = None) -> AgentRun:
    """The 10-gate verify_url IS the 'How To Use' test: status, load budget,
    mobile viewport, a11y substrate, language switcher, per-response widget,
    blind-user path, Hindi UI, no broken markers, tap targets. Pass/Fail per
    product; failed gates become bugs for the Developer agent."""
    urls = pages or FRONTEND_PAGES_TO_WATCH
    results = [verify_url(u) for u in urls]

    products: list[dict[str, Any]] = []
    bugs: list[dict[str, Any]] = []
    n_pass = n_partial = n_fail = 0

    for r in results:
        page = _page_name(r.url)
        failed = [{"gate": g.name, "detail": g.detail} for g in r.gates if g.status == "fail"]
        needs_human = [{"gate": g.name, "detail": g.detail} for g in r.gates if g.status == "needs_human"]
        if r.red:
            verdict = "FAIL"; n_fail += 1
        elif r.yellow:
            verdict = "PARTIAL"; n_partial += 1
        else:
            verdict = "PASS"; n_pass += 1
        products.append({
            "product": page, "url": r.url, "verdict": verdict,
            "http_status": r.http_status, "load_ms": r.load_ms,
            "failed_gates": failed, "needs_human_gates": needs_human,
        })
        for fg in failed:
            bugs.append({"product": page, "url": r.url,
                         "gate": fg["gate"], "detail": fg["detail"]})

    status = "red" if n_fail else ("amber" if n_partial else "green")
    headline = (f"{n_pass} PASS · {n_partial} PARTIAL · {n_fail} FAIL "
                f"across {len(urls)} products")
    detail = {
        "total": len(urls), "pass": n_pass, "partial": n_partial, "fail": n_fail,
        "products": products, "bugs": bugs,
    }
    return record_run(AgentRun("qa", _now_iso(), status, headline, detail))


# =====================================================================
# 3. Developer Agent — on QA bugs — fix list + tickets
# =====================================================================

# gate name prefix → (proposed fix, effort S/M/L)
_GATE_FIX_HINTS: list[tuple[str, tuple[str, str]]] = [
    ("1.",  ("Page/backend returned non-200 — redeploy or fix the route", "S")),
    ("2.",  ("Trim payload / lazy-load assets to meet the load budget", "M")),
    ("3.",  ("Add <meta name=viewport content='width=device-width'>", "S")),
    ("4.",  ("Add <script src='chitti_a11y.js'> — inherits all 5 a11y gates", "S")),
    ("5.",  ("Wire chitti_lang.js to the page #lang-select", "M")),
    ("6.",  ("Add data-chitti-response + feedback-widget.js per response box", "M")),
    ("7.",  ("Add aria-live region + blind-user auto-voice onboarding", "M")),
    ("8.",  ("Add Hindi i18n bag / chitti_lang.js Hindi strings", "M")),
    ("9.",  ("Remove undefined/NaN/error markers leaking into render", "S")),
    ("10.", ("Bump tap targets to ≥48×48px via .sds- classes", "S")),
]


def _fix_for_gate(gate: str) -> tuple[str, str]:
    for prefix, hint in _GATE_FIX_HINTS:
        if gate.strip().startswith(prefix):
            return hint
    return ("Triage manually — gate has no fix hint yet", "M")


def run_developer_agent(bugs: list[dict[str, Any]] | None) -> AgentRun:
    """Clusters QA bugs by failing gate, proposes a fix + effort per cluster,
    and files one GitHub issue per cluster (honest no-op without a token).
    Reports the fix list — never claims code it didn't write."""
    bugs = bugs or []
    if not bugs:
        return record_run(AgentRun(
            "developer", _now_iso(), "green",
            "No QA bugs — fix list empty",
            {"bug_count": 0, "fix_list": [], "issues_filed": [], "applied": []},
        ))

    clusters: dict[str, dict[str, Any]] = {}
    for b in bugs:
        c = clusters.setdefault(b["gate"], {"gate": b["gate"], "products": [], "count": 0})
        c["count"] += 1
        if b["product"] not in c["products"]:
            c["products"].append(b["product"])

    fix_list: list[dict[str, Any]] = []
    issues_filed: list[str] = []
    for gate, c in sorted(clusters.items(), key=lambda kv: -kv[1]["count"]):
        fix, effort = _fix_for_gate(gate)
        title = (f"[chitti-quality][dev-agent] {gate} failing on "
                 f"{', '.join(c['products'][:4])}"
                 + (" …" if len(c["products"]) > 4 else ""))
        body = (
            f"Auto-filed by Chitti Quality's Developer Agent.\n\n"
            f"**Failing gate:** {gate}\n"
            f"**Products:** {', '.join(c['products'])}\n"
            f"**Occurrences:** {c['count']}\n\n"
            f"**Proposed fix ({effort}):** {fix}\n\n"
            f"Source: QA Agent 10-gate pass (lib/cto_verifier.verify_url). "
            f"Code fix lands via a Claude/Sire PR — this ticket is the triage."
        )
        filed = open_github_issue(title, body, labels=["chitti-quality", "dev-agent", "auto"])
        if filed:
            issues_filed.append(title)
        fix_list.append({
            "gate": gate, "products": c["products"], "count": c["count"],
            "fix": fix, "effort": effort,
            "status": "ticket-filed" if filed else "queued",
        })

    status = "amber"  # bugs exist; the agent triages, it does not auto-merge code
    headline = (f"{len(fix_list)} fix item(s) created · "
                f"{len(issues_filed)} ticket(s) filed · "
                f"{len(bugs)} bug(s) from QA")
    detail = {
        "bug_count": len(bugs),
        "fix_list": fix_list,
        "issues_filed": issues_filed,
        "applied": [],  # honest: no autonomous code fixes; PRs land them
    }
    return record_run(AgentRun("developer", _now_iso(), status, headline, detail))


# =====================================================================
# 4. UI Agent — Sundays — design consistency vs sahayai_design_system.css
# =====================================================================

# The locked palette from sahayai_design_system.css :root tokens (2026-05-23).
APPROVED_HEXES: set[str] = {
    "#FF6913", "#FFFFFF", "#046A38", "#002366", "#F7F7F4", "#212121",
    "#555555", "#E0E0E0", "#BDBDBD", "#F59E0B", "#C62828", "#FFF8E1",
}
_HEX_RE = re.compile(r"#[0-9a-fA-F]{6}\b")
_DESIGN_SYSTEM_HREF = "sahayai_design_system.css"


def run_ui_agent(pages: list[str] | None = None) -> AgentRun:
    """Every Sunday. Fetch each page and check design consistency against the
    locked design system: (1) the stylesheet is linked, (2) colours stay on the
    approved palette. Missing stylesheet = red. Off-palette colour = amber drift
    (reported, never silently passed)."""
    urls = pages or FRONTEND_PAGES_TO_WATCH
    checks: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []

    for u in urls:
        page = _page_name(u)
        status_code, body, _load_ms, _n = _fetch(u)
        if status_code != 200:
            checks.append({"product": page, "verdict": "needs_human",
                           "reason": f"HTTP {status_code} — could not fetch to audit"})
            continue

        has_link = _DESIGN_SYSTEM_HREF in body
        hexes = {h.upper() for h in _HEX_RE.findall(body)}
        off = sorted(h for h in hexes if h not in APPROVED_HEXES)

        if not has_link:
            verdict = "red"
            failures.append({"product": page, "problem": "missing design system stylesheet",
                             "off_palette": off[:12]})
        elif off:
            verdict = "amber"  # drift — off-palette colours present
            failures.append({"product": page,
                             "problem": f"{len(off)} off-palette colour(s)",
                             "off_palette": off[:12]})
        else:
            verdict = "green"

        checks.append({
            "product": page, "verdict": verdict,
            "has_design_system": has_link,
            "off_palette_count": len(off), "off_palette": off[:12],
        })

    n_red = sum(1 for c in checks if c.get("verdict") == "red")
    n_amber = sum(1 for c in checks if c.get("verdict") == "amber")
    n_green = sum(1 for c in checks if c.get("verdict") == "green")
    status = "red" if n_red else ("amber" if n_amber else "green")
    headline = (f"{n_green} consistent · {n_amber} drift · "
                f"{n_red} missing design system (of {len(urls)})")
    detail = {
        "total": len(urls), "consistent": n_green, "drift": n_amber, "missing": n_red,
        "checks": checks, "failures": failures,
        "approved_palette": sorted(APPROVED_HEXES),
    }
    return record_run(AgentRun("ui", _now_iso(), status, headline, detail))


# =====================================================================
# Orchestrator — DevOps → QA → Developer  (UI runs on its own Sunday cron)
# =====================================================================


def run_devops_qa_developer() -> dict[str, Any]:
    """The daily 06:00 chain. DevOps first; QA only once at least one service
    is online (per the spec — 'QA runs after DevOps confirms Online'); Developer
    only when QA found bugs. Returns a dict of the three runs for the caller to
    log / Vaani-notify."""
    devops = run_devops_agent()
    qa: AgentRun | None = None
    dev: AgentRun | None = None

    if devops.status == "red":
        log.info("[agents] DevOps: all services down — QA deferred until online")
    else:
        qa = run_qa_agent()
        dev = run_developer_agent(qa.detail.get("bugs", []))

    return {
        "devops": devops.to_dict(),
        "qa": qa.to_dict() if qa else None,
        "developer": dev.to_dict() if dev else None,
    }


# =====================================================================
# Surfaces — public JSON (chitti_quality.html) + email section (07:00)
# =====================================================================


def agents_public_state() -> dict[str, Any]:
    """Served at GET /api/quality/agents and rendered by chitti_quality.html.
    Honest empty state per agent until its first run."""
    return {
        "ok": True,
        "generated": _now_iso(),
        "agents": {a: (_LAST_RUNS[a].to_dict() if a in _LAST_RUNS else None) for a in AGENTS},
        "schedule": AGENT_SCHEDULE,
    }


_DOT = {"green": "🟢", "amber": "🟡", "red": "🔴"}


def _esc(s: Any) -> str:
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def render_agents_email_section() -> str:
    """HTML block appended into the 07:00 founder email. Honest empty state if
    no agent has run yet (e.g. before the first 06:00 pass on a fresh dyno)."""
    if not _LAST_RUNS:
        return (
            "<hr style='margin-top:24px'/>"
            "<h3>Chitti Quality — four agents</h3>"
            "<p style='color:#888'>No agent run yet on this dyno. DevOps fires "
            "06:00 IST (→ QA → Developer); UI fires Sundays 06:30 IST. "
            "On-demand: <code>POST /admin/founder/agents/run</code>.</p>"
        )

    # Summary table — one row per agent.
    rows = []
    for a in AGENTS:
        run = _LAST_RUNS.get(a)
        if run is None:
            rows.append(
                f"<tr><td><b>{_esc(AGENT_TITLES[a])}</b></td>"
                f"<td>⚪ not yet run</td><td style='color:#888'>—</td>"
                f"<td style='font-size:11px;color:#888'>{_esc(AGENT_SCHEDULE[a])}</td></tr>"
            )
            continue
        rows.append(
            f"<tr><td><b>{_esc(run.title)}</b></td>"
            f"<td style='white-space:nowrap'>{_DOT.get(run.status, '⚪')} {run.status}</td>"
            f"<td style='font-size:12px'>{_esc(run.headline)}</td>"
            f"<td style='font-size:11px;color:#888'>{_esc(run.ts)}</td></tr>"
        )

    summary = (
        "<hr style='margin-top:24px'/>"
        "<h3 style='margin-bottom:6px'>Chitti Quality — four agents</h3>"
        "<p style='margin:0 0 8px;color:#666;font-size:12px'>"
        "DevOps 06:00 → QA → Developer · UI Sundays · "
        "all reusing the existing CTO 10-gate + Railway health rails.</p>"
        "<table border='1' cellpadding='6' style='border-collapse:collapse;font-size:13px;width:100%'>"
        "<thead style='background:#f0f0f0'><tr>"
        "<th>Agent</th><th>Status</th><th>Headline</th><th>Last run (IST)</th>"
        "</tr></thead><tbody>" + "".join(rows) + "</tbody></table>"
    )

    # QA per-product detail (only the not-PASS rows, to keep the email tight).
    qa = _LAST_RUNS.get("qa")
    qa_block = ""
    if qa and qa.detail.get("products"):
        bad = [p for p in qa.detail["products"] if p["verdict"] != "PASS"]
        if bad:
            qa_rows = "".join(
                f"<tr><td><b>{_esc(p['product'])}</b></td>"
                f"<td>{'🔴 FAIL' if p['verdict'] == 'FAIL' else '🟡 PARTIAL'}</td>"
                f"<td style='font-size:11px'>"
                + _esc("; ".join(g["gate"] for g in (p["failed_gates"] or p["needs_human_gates"]))[:160])
                + "</td></tr>"
                for p in bad
            )
            qa_block = (
                "<h4 style='margin:14px 0 4px'>QA — products needing attention</h4>"
                "<table border='1' cellpadding='5' style='border-collapse:collapse;font-size:12px;width:100%'>"
                "<thead style='background:#f6f6f6'><tr><th>Product</th><th>Verdict</th><th>Gates</th></tr></thead>"
                f"<tbody>{qa_rows}</tbody></table>"
            )

    # Developer fix list.
    dev = _LAST_RUNS.get("developer")
    dev_block = ""
    if dev and dev.detail.get("fix_list"):
        dev_rows = "".join(
            f"<li><b>{_esc(item['gate'])}</b> · {item['count']} hit(s) · "
            f"{_esc(', '.join(item['products'][:4]))} · "
            f"fix [{_esc(item['effort'])}]: {_esc(item['fix'])} "
            f"<i>({_esc(item['status'])})</i></li>"
            for item in dev.detail["fix_list"]
        )
        dev_block = ("<h4 style='margin:14px 0 4px'>Developer — fix list</h4>"
                     f"<ol style='margin:0;padding-left:20px;font-size:12px'>{dev_rows}</ol>")

    # UI failures.
    ui = _LAST_RUNS.get("ui")
    ui_block = ""
    if ui and ui.detail.get("failures"):
        ui_rows = "".join(
            f"<li><b>{_esc(f['product'])}</b> — {_esc(f['problem'])}"
            + (f" · {_esc(', '.join(f.get('off_palette', [])))}" if f.get("off_palette") else "")
            + "</li>"
            for f in ui.detail["failures"]
        )
        ui_block = ("<h4 style='margin:14px 0 4px'>UI — design drift</h4>"
                    f"<ul style='margin:0;padding-left:20px;font-size:12px'>{ui_rows}</ul>")

    return summary + qa_block + dev_block + ui_block


__all__ = [
    "AGENTS", "AGENT_TITLES", "AGENT_SCHEDULE", "AgentRun",
    "record_run", "last_run",
    "run_devops_agent", "run_qa_agent", "run_developer_agent", "run_ui_agent",
    "run_devops_qa_developer",
    "agents_public_state", "render_agents_email_section",
]
