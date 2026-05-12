# ACCOUNTABILITY — Chitti Quality

> One named owner. One daily audit. One public page. No diffusion.

## What Chitti Quality is accountable for

Chitti Quality owns the **audit + publish loop** for every standard in [STANDARDS.md](STANDARDS.md), across all 12 Chittis:

| # | Chitti | Surface |
|---|---|---|
| 1 | chitti-medupi | [chitti_medupi.html](../chitti_medupi.html) |
| 2 | chitti-shares (fundamentals) | [chitti_fundamentals.html](../chitti_fundamentals.html) |
| 3 | chitti-shares (technical) | [chitti_complete_technical.html](../chitti_complete_technical.html) |
| 4 | chitti-news | [chitti_news.html](../chitti_news.html) |
| 5 | chitti-government | [chitti_government.html](../chitti_government.html) |
| 6 | chitti-vaani (web + android) | [chitti_vaani.html](../chitti_vaani.html) + [chitti-vaani-android/](../chitti-vaani-android/) |
| 7 | chitti-ca | [chitti_ca.html](../chitti_ca.html) |
| 8 | chitti-legal | [chitti_legal.html](../chitti_legal.html) |
| 9 | chitti-voice-factory | [chitti_voice_factory.html](../chitti_voice_factory.html) |
| 10 | chitti-scanner | [chitti_scanner.html](../chitti_scanner.html) |
| 11 | chitti-upi | [chitti_upi.html](../chitti_upi.html) |
| 12 | chitti-sales | (frontend pending — see [../chitti-sales/TODO.md](../chitti-sales/TODO.md)) |

*(chitti-logo-video is intentionally a stub — see [../chitti-logo-video/CONTEXT.md](../chitti-logo-video/CONTEXT.md). Audited as a stub, not a product.)*

## What "accountable" means in practice

Chitti Quality runs the [CHECKLIST.md](CHECKLIST.md) against every Chitti **every day**. The output of that checklist:

1. **Updates the per-Chitti status on [`../chitti_quality.html`](../chitti_quality.html).** Green / amber / red, with a one-line reason for any non-green.
2. **Posts a row into [`../lib/founder_report.py`](../lib/founder_report.py)** for the 07:00 IST email to Bryan.
3. **Escalates any red status** to the founder dashboard inside one hour, with a named root cause and a named owner inside the affected Chitti.

There is no second-opinion step. Chitti Quality calls the score and publishes it. Disputes go through GitHub Issues against the affected Chitti, not against Chitti Quality.

## Levels of accountability

### Tier 1 — daily, mandatory

| Check | Source | Failure consequence |
|---|---|---|
| `/health` returns 200 | Each Chitti `main.py` | Status → amber (red after 24h) |
| `/admin/founder` returns valid JSON | [`../lib/founder_report.py`](../lib/founder_report.py) | Status → amber |
| Quadrails verdict logs present for past 24h | [`../lib/quadrails.py`](../lib/quadrails.py) → `quality_audit` table | Status → amber |
| Server-enforced disclaimer present in random 5% sample | [`../lib/evaluators.py`](../lib/evaluators.py) disclaimer pass | Status → **red** |
| Hallucination rate < 5% on truth-evaluator sample | [`../lib/evaluators.py`](../lib/evaluators.py) | Status → amber (>2%), **red** (>5%) |
| Thumbs-up % > 70% over rolling 24h | [`../lib/feedback.py`](../lib/feedback.py) | Status → amber (<70%), red (<50%) |

### Tier 2 — weekly, mandatory

- Full braille audit per [BRAILLE.md §4](../BRAILLE.md) on every page.
- WCAG 2.1 AA spot-check on the highest-traffic page of each Chitti.
- Provider portability test: simulate Bhashini outage in voice-factory; confirm fall-through to next supplier; confirm Tier C does not silently fall back.
- Cross-language smoke: render every Chitti page in Hindi, Tamil, Bengali, Marathi at minimum.

### Tier 3 — monthly, mandatory

- Walk every CONTEXT.md "Global Best Practices" section against [GLOBAL_BEST_PRACTICES.md](../GLOBAL_BEST_PRACTICES.md) for drift.
- Re-confirm every Turso DB is reachable from its respective Chitti's `/admin/founder`.
- Re-confirm every CHANGELOG.md entry from the past 30 days has a corresponding TODO.md crossout.

## What Chitti Quality is NOT accountable for

- **Building features.** Roadmap items live in each Chitti's `TODO.md`.
- **Writing product copy.** Per-product voice is owned by that Chitti's `skills/PERSONALITY.md`.
- **Fixing red statuses.** Chitti Quality publishes; the affected Chitti's owner fixes.
- **Negotiating with founders, investors, or users.** Numbers are numbers. The page never reads like a press release.

## Escalation paths

| Severity | Who Chitti Quality pings | Within |
|---|---|---|
| **Red on a Tier-1 check** | Founder ([bryanwilfredpinto@gmail.com](mailto:bryanwilfredpinto@gmail.com)) + a placeholder Slack hook | 1 hour |
| **Red on a Tier-2 check** | Founder via daily 07:00 IST email | 24 hours |
| **Drift on Tier-3** | Founder via monthly digest | 30 days |
| **User-submitted quality issue via the public button** | Lands in `quality_issues` Turso table; founder dashboard surfaces unread count | Within minutes |

## Public commitment

The line at the top of [`../chitti_quality.html`](../chitti_quality.html) reads:

> *"This page is updated daily. No red status is hidden, no number is rounded up. Last audit: <date>. Next: <date+1>."*

That's the promise. The day Chitti Quality breaks it, Chitti Quality goes amber on itself.
