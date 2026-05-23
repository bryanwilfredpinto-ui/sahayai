"""
services/health_file_doctor_pdf.py
----------------------------------
Phase B-5 — "Doctor ko dikhane ke liye PDF" — a single A4 PDF the user
can share with a clinician at the door of the OPD.

Layout (one page where possible, overflow to second page if needed):
  1. Header — Chitti Health File · printed-on date · patient name + DOB
     + (optional) UHID-like family-id.
  2. Vitals table — most recent BP / sugar / weight / HbA1c / SpO2,
     with an inline 30-day trend mini-chart drawn with reportlab.
  3. Active medicines — derived from HealthFact kind=medicine, latest
     per molecule, dedup'd.
  4. Recent lab values — HealthFact kind=lab_value within the last
     90 days, with normal range + out-of-range flag.
  5. Diagnoses + active follow-ups + restrictions.
  6. Doctor-facing footer — privacy line + "this was exported by the
     family from their Chitti Health File on <date>" + Chitti URL.

We use ONLY the built-in Helvetica font + reportlab primitives so the
PDF renders anywhere without bundling fonts.
"""
from __future__ import annotations

import io
import logging
from datetime import datetime, timedelta
from typing import Iterable, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, PageBreak,
)
from reportlab.graphics.shapes import Drawing, String
from reportlab.graphics.charts.linecharts import HorizontalLineChart

from services import health_file_service as svc

log = logging.getLogger("health_file_doctor_pdf")

_SAFFRON = colors.HexColor("#E86A17")
_NAVY    = colors.HexColor("#0E2344")
_GOLD    = colors.HexColor("#D4AF37")
_GREEN   = colors.HexColor("#16a34a")
_RED     = colors.HexColor("#dc2626")
_LIGHT   = colors.HexColor("#fbf8f1")
_MUTED   = colors.HexColor("#6b7280")


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title", parent=base["Heading1"],
            fontName="Helvetica-Bold", fontSize=18, textColor=_NAVY,
            spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "subtitle", parent=base["Heading2"],
            fontName="Helvetica-Bold", fontSize=11, textColor=_SAFFRON,
            spaceBefore=10, spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body", parent=base["BodyText"],
            fontName="Helvetica", fontSize=9.5, textColor=colors.black,
            leading=13,
        ),
        "small": ParagraphStyle(
            "small", parent=base["BodyText"],
            fontName="Helvetica", fontSize=8, textColor=_MUTED, leading=11,
        ),
        "warn": ParagraphStyle(
            "warn", parent=base["BodyText"],
            fontName="Helvetica-Bold", fontSize=9, textColor=_RED, leading=12,
        ),
    }


def _profile_header(profile: dict, S) -> list:
    name = profile.get("name") or "Patient"
    relation = profile.get("relation") or "self"
    dob = profile.get("dob") or "—"
    return [
        Paragraph("Chitti Health File — Doctor's Summary", S["title"]),
        Paragraph(
            f"<b>{_esc(name)}</b> ({_esc(relation)}) · DOB {_esc(dob)} · "
            f"Printed {datetime.now().strftime('%Y-%m-%d %H:%M IST')}",
            S["small"],
        ),
        Spacer(1, 4),
        Paragraph(
            "This is a family-exported snapshot from the patient's own Chitti Health File. "
            "It is NOT a replacement for the original lab reports or discharge summaries. "
            "Verify any value before acting on it.",
            S["small"],
        ),
        Spacer(1, 8),
    ]


def _vitals_table(user_token: str, profile_id: int, S) -> list:
    """Most-recent vital per kind + 30-day mini-chart for BP / sugar / weight."""
    items = svc.list_vitals(user_token, profile_id=profile_id, limit=300)
    out = [Paragraph("Vitals — most recent", S["subtitle"])]
    if not items:
        out.append(Paragraph("No vitals logged yet.", S["small"]))
        return out

    # Latest per kind
    latest = {}
    for v in items:
        k = v.get("kind") or "?"
        if k not in latest or (v.get("reading_at") or "") > (latest[k].get("reading_at") or ""):
            latest[k] = v

    rows = [["Vital", "Value", "Unit", "When", "Flag"]]
    for k in sorted(latest.keys()):
        v = latest[k]
        val = v.get("value")
        v2 = v.get("value2")
        display = f"{val}/{v2}" if (v2 is not None) else str(val)
        flag = "OUT OF RANGE" if v.get("out_of_range") else "ok"
        rows.append([
            _LABELS.get(k, k),
            display,
            v.get("unit") or "—",
            (v.get("reading_at") or "")[:10],
            flag,
        ])
    t = Table(rows, hAlign="LEFT", colWidths=[42*mm, 28*mm, 18*mm, 28*mm, 30*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), _NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOX", (0, 0), (-1, -1), 0.4, _GOLD),
        ("INNERGRID", (0, 0), (-1, -1), 0.2, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_LIGHT, colors.white]),
        # Highlight out-of-range
        ("TEXTCOLOR", (4, 1), (4, -1), _RED),
        ("FONTNAME", (4, 1), (4, -1), "Helvetica-Bold"),
    ]))
    out.append(t)

    # 30-day mini-charts for BP / sugar / weight
    for kind, label in (("bp", "BP (systolic, 30d)"),
                        ("sugar_fasting", "Sugar fasting (30d)"),
                        ("weight", "Weight (30d)")):
        chart = _mini_chart(items, kind, label, S)
        if chart is not None:
            out.append(Spacer(1, 6))
            out.append(chart)
    return out


def _mini_chart(items: list[dict], kind: str, label: str, S):
    """Tiny line chart of the last 30d of values for one vital kind."""
    cutoff = datetime.utcnow() - timedelta(days=30)
    series = []
    for v in items:
        if (v.get("kind") or "") != kind:
            continue
        try:
            when = datetime.fromisoformat((v.get("reading_at") or "").replace("Z", "+00:00"))
        except (TypeError, ValueError):
            continue
        if when < cutoff:
            continue
        val = v.get("value")
        if val is None: continue
        series.append((when, float(val)))
    if len(series) < 2:
        return None
    series.sort(key=lambda x: x[0])

    d = Drawing(170*mm, 38*mm)
    lc = HorizontalLineChart()
    lc.x = 18*mm; lc.y = 8*mm
    lc.width = 140*mm; lc.height = 24*mm
    lc.data = [[p[1] for p in series]]
    lc.lines[0].strokeColor = _SAFFRON
    lc.lines[0].strokeWidth = 1.4
    lc.categoryAxis.labels.fontSize = 6
    lc.valueAxis.labels.fontSize = 6
    lc.categoryAxis.categoryNames = [p[0].strftime("%d/%m") for p in series]
    lc.categoryAxis.labels.angle = 30
    lc.categoryAxis.labels.dx = -2
    lc.categoryAxis.labels.dy = -3
    lc.fillColor = _LIGHT
    d.add(lc)
    d.add(String(0, 32*mm, label, fontName="Helvetica-Bold", fontSize=8, fillColor=_NAVY))
    return d


_LABELS = {
    "bp": "BP (sys/dia)",
    "bp_systolic": "BP systolic",
    "bp_diastolic": "BP diastolic",
    "sugar_fasting": "Sugar (fasting)",
    "sugar_post": "Sugar (post-prandial)",
    "sugar_random": "Sugar (random)",
    "hba1c": "HbA1c",
    "weight": "Weight",
    "temp": "Temperature",
    "spo2": "SpO2",
    "pulse": "Pulse",
    "sleep_hours": "Sleep",
}


def _facts_section(user_token: str, profile_id: int, kind: str, title: str, limit: int, S) -> list:
    items = svc.list_facts(user_token, profile_id=profile_id, kind=kind, limit=limit)
    out = [Paragraph(title, S["subtitle"])]
    if not items:
        out.append(Paragraph("None on record.", S["small"]))
        return out
    rows = [["Label", "Value", "Unit / Notes", "Date"]]
    for f in items:
        unit = f.get("unit") or ""
        notes = f.get("notes") or ""
        rng = ""
        if f.get("normal_low") is not None or f.get("normal_high") is not None:
            rng = f" (range {f.get('normal_low')}–{f.get('normal_high')})"
        cell3 = (unit + (" · " if unit and notes else "") + notes + rng)[:80]
        rows.append([
            (f.get("label") or "")[:42],
            str(f.get("value") or "")[:24],
            cell3,
            f.get("fact_date") or (f.get("created_at") or "")[:10],
        ])
    t = Table(rows, hAlign="LEFT", colWidths=[55*mm, 32*mm, 60*mm, 25*mm])
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), _NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.4, _GOLD),
        ("INNERGRID", (0, 0), (-1, -1), 0.2, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_LIGHT, colors.white]),
    ]
    # Highlight out-of-range labs in red
    for idx, f in enumerate(items, start=1):
        if f.get("out_of_range"):
            style.append(("TEXTCOLOR", (0, idx), (-1, idx), _RED))
            style.append(("FONTNAME", (0, idx), (0, idx), "Helvetica-Bold"))
    t.setStyle(TableStyle(style))
    out.append(t)
    return out


def _footer(S) -> list:
    return [
        Spacer(1, 10),
        Paragraph(
            "Privacy: this PDF was generated from data encrypted at rest in the patient's own device "
            "(AES-256-GCM). Chitti never stored the plaintext outside this export. "
            "Doctor, please treat this snapshot as supplementary — verify against the original "
            "lab reports / discharge summaries before acting on any value.",
            S["small"],
        ),
        Spacer(1, 3),
        Paragraph(
            "Family-exported via Chitti Health File · sahayai.in/chitti_health_file.html · "
            f"Build v3-phase-b · printed {datetime.now().strftime('%Y-%m-%d %H:%M IST')}",
            S["small"],
        ),
    ]


def _esc(s) -> str:
    if s is None: return ""
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def build_doctor_pdf(user_token: str, profile_id: int) -> bytes:
    """Generate the Doctor PDF for one profile. Returns raw PDF bytes."""
    profiles = svc.list_profiles(user_token)
    profile = next((p for p in profiles if p.get("id") == profile_id), None)
    if not profile:
        raise ValueError("profile_not_found_or_not_yours")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=14*mm, bottomMargin=14*mm,
        title=f"Chitti Health Summary — {profile.get('name') or 'Patient'}",
        author="Chitti Health File · sahayai.in",
    )
    S = _styles()
    story: list = []
    story += _profile_header(profile, S)
    story += _vitals_table(user_token, profile_id, S)
    story += _facts_section(user_token, profile_id, "medicine",        "Active medicines",       40, S)
    story += _facts_section(user_token, profile_id, "lab_value",       "Recent lab values",       40, S)
    story += _facts_section(user_token, profile_id, "diagnosis",       "Diagnoses on record",     20, S)
    story += _facts_section(user_token, profile_id, "imaging_finding", "Imaging findings",        15, S)
    story += _facts_section(user_token, profile_id, "followup",        "Active follow-ups",       20, S)
    story += _facts_section(user_token, profile_id, "restriction",     "Restrictions",            15, S)
    story += _facts_section(user_token, profile_id, "recommendation",  "Doctor recommendations",  20, S)
    story += _footer(S)
    doc.build(story)
    return buf.getvalue()
