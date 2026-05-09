"""Video-generation queue (mock).

Stub mode: in-memory job queue. enqueue() returns a job_id; status() returns
'queued' for ~3 seconds (so the frontend can show a real polling spinner),
then 'VIDEO_READY' with a placeholder URL.

Real mode (when VIDEO_PROVIDER + VIDEO_PROVIDER_KEY set): we will hand the
script + voice + duration to Remotion / Pika / Runway and stream the real
job state.
"""

from __future__ import annotations

import threading
import time
import uuid
from dataclasses import dataclass, field

from config import settings


@dataclass
class _Job:
    job_id: str
    script: str
    language: str
    duration_s: int
    enqueued_at: float
    state: str = "queued"            # queued | rendering | VIDEO_READY | failed
    url: str | None = None
    notes: str = ""
    log: list[str] = field(default_factory=list)


_LOCK = threading.Lock()
_JOBS: dict[str, _Job] = {}

# How long the mock pretends to render before flipping to VIDEO_READY.
_MOCK_RENDER_S = 3.0


def _placeholder_url(job_id: str) -> str:
    # Honest: not a real CDN. We return a data: URL pointing at a tiny SVG card
    # so the frontend can render *something* in an <img>/<a download>.
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'>"
        "<rect width='640' height='360' fill='#0E2344'/>"
        "<text x='320' y='170' text-anchor='middle' font-family='sans-serif' "
        "font-weight='900' font-size='32' fill='#E86A17'>Mock video</text>"
        f"<text x='320' y='210' text-anchor='middle' font-family='sans-serif' "
        f"font-weight='600' font-size='14' fill='#fff' opacity='0.85'>job {job_id[:8]}</text>"
        "<text x='320' y='250' text-anchor='middle' font-family='sans-serif' "
        "font-weight='400' font-size='12' fill='#fff' opacity='0.7'>Real renderer wires in when VIDEO_PROVIDER is set</text>"
        "</svg>"
    )
    import urllib.parse
    return "data:image/svg+xml;utf8," + urllib.parse.quote(svg)


def enqueue(*, script: str, language: str = "en", duration_s: int = 30) -> dict:
    if not script or not script.strip():
        return {"ok": False, "error": "missing_script"}
    duration_s = max(5, min(int(duration_s or 30), 120))
    job = _Job(
        job_id=uuid.uuid4().hex,
        script=script.strip(),
        language=language or "en",
        duration_s=duration_s,
        enqueued_at=time.time(),
    )
    job.log.append(f"enqueued at {time.strftime('%H:%M:%S')}")
    if settings.VIDEO_PROVIDER and settings.VIDEO_PROVIDER_KEY:
        job.notes = (
            f"Real provider '{settings.VIDEO_PROVIDER}' configured but the wire-up "
            "is not yet implemented. Falling through to mock."
        )
    with _LOCK:
        _JOBS[job.job_id] = job
    return {
        "ok": True,
        "job_id": job.job_id,
        "state": job.state,
        "supplier": "mock" if not settings.VIDEO_PROVIDER else "mock_pending_real_wireup",
        "duration_s": job.duration_s,
        "language": job.language,
        "disclaimer": (
            "Mock video generator. Real video synthesis (Remotion / Pika / Runway) "
            "wires in when VIDEO_PROVIDER + VIDEO_PROVIDER_KEY env vars are set."
        ),
    }


def status(job_id: str) -> dict:
    with _LOCK:
        job = _JOBS.get(job_id)
        if job is None:
            return {"ok": False, "error": "unknown_job_id", "job_id": job_id}
        elapsed = time.time() - job.enqueued_at
        if job.state in ("queued", "rendering") and elapsed >= _MOCK_RENDER_S:
            job.state = "VIDEO_READY"
            job.url = _placeholder_url(job_id)
            job.log.append(f"VIDEO_READY at {time.strftime('%H:%M:%S')} (mock, {elapsed:.1f}s)")
        elif job.state == "queued" and elapsed >= 1.0:
            job.state = "rendering"
            job.log.append(f"rendering at {time.strftime('%H:%M:%S')}")
        return {
            "ok": True,
            "job_id": job.job_id,
            "state": job.state,
            "url": job.url,
            "notes": job.notes,
            "log": list(job.log),
            "elapsed_s": round(elapsed, 2),
        }


def health() -> dict:
    with _LOCK:
        n = len(_JOBS)
    return {
        "ok": True,
        "service": "video",
        "supplier": settings.VIDEO_PROVIDER or "mock",
        "provider_configured": bool(settings.VIDEO_PROVIDER and settings.VIDEO_PROVIDER_KEY),
        "jobs_in_memory": n,
    }
