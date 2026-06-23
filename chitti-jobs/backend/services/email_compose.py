"""
services/email_compose.py  —  BO8 (email) + BO15-lite (calendar)
----------------------------------------------------------------
Founder-approved no-OAuth delivery (2026-06-23):

  EMAIL  — Chitti builds a `mailto:` deep link from the approved draft.
           The user taps it → their own mail app opens with To/Subject/Body
           pre-filled → the USER hits send. This honours Constitution
           Art 1 (user approves) AND Art 5 (no auto-send — Chitti never
           transmits anything itself). Zero OAuth, works on every device.

  CALENDAR — interview bookings are emitted as a downloadable .ics file
             the user adds to their own calendar. No Google Calendar API.

Gmail API + Google Calendar API are deferred to the BO15+ future phase.
Pure functions — no I/O, no network.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from urllib.parse import quote


def build_mailto(to: str, subject: str, body: str) -> str:
    """RFC 6068 mailto: link. `to` may be '' (user fills the recipient)."""
    to_part = quote(to or "", safe="@")
    q = f"subject={quote(subject or '')}&body={quote(body or '')}"
    return f"mailto:{to_part}?{q}"


def compose_application_email(*, to: str = "", subject: str, email_body: str,
                              cover_letter: str = "") -> dict:
    """Bundle the artefacts the frontend needs for the approve→send hand-off."""
    full_body = email_body
    if cover_letter:
        full_body = f"{email_body}\n\n---\n{cover_letter}"
    return {
        "to": to,
        "subject": subject,
        "body": full_body,
        "mailto": build_mailto(to, subject, full_body),
        # plain copy fields so the UI can offer a "copy" button for users
        # whose device has no default mail handler.
        "copy_text": f"To: {to}\nSubject: {subject}\n\n{full_body}",
        "delivery": "mailto_handoff",  # honest: user's own mail app sends it
    }


def _ics_escape(text: str) -> str:
    return (
        (text or "")
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")
    )


def _ics_dt(dt: datetime) -> str:
    # Floating local time (no Z) so it lands as the recruiter-proposed wall time.
    return dt.strftime("%Y%m%dT%H%M%S")


def build_ics(*, summary: str, start: datetime, end: datetime | None = None,
              description: str = "", location: str = "", uid: str = "") -> str:
    """A minimal RFC-5545 VEVENT the user imports into their own calendar."""
    end = end or (start + timedelta(hours=1))
    stamp = _ics_dt(start)
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Sahayai//Chitti Jobs//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:{_ics_escape(uid) or stamp}@sahayai.in",
        f"DTSTAMP:{stamp}",
        f"DTSTART:{_ics_dt(start)}",
        f"DTEND:{_ics_dt(end)}",
        f"SUMMARY:{_ics_escape(summary)}",
        f"DESCRIPTION:{_ics_escape(description)}",
        f"LOCATION:{_ics_escape(location)}",
        "BEGIN:VALARM",
        "TRIGGER:-PT60M",
        "ACTION:DISPLAY",
        f"DESCRIPTION:{_ics_escape('Reminder: ' + summary)}",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
    ]
    return "\r\n".join(lines) + "\r\n"
