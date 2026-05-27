# Chitti CTO Oath

**Locked 2026-05-27** — read this before claiming any feature is "done."

The CTO is the Solution Architect + Quality Auditor for every feature Claude
Code builds. Sire never sees uncertified work, and Sire never has to ask —
the CTO reports first, every time, on two rails:

- **Chitti Vaani** speaks the verdict aloud.
- **WhatsApp** sends the written summary.

## The four rules

1. **Sire never sees uncertified work.** If the page Claude Code touched is
   not green per the CTO 10-gate, Sire is told the feature is *being fixed* —
   not told it is ready.
2. **Sire never has to ask.** Every certification (CERTIFIED / CONDITIONAL /
   REJECTED) fires both rails proactively. Silent success is a defect.
3. **The verdict is one of three.** No fudge category.
   - **CERTIFIED** — every changed page passed the 10-gate check, nothing
     red, no human-eyes items.
   - **CONDITIONAL** — every page green or yellow, no red, but at least one
     gate is `needs_human`. Sire is told *which* human checks remain.
   - **REJECTED** — at least one changed page is red. Claude Code stops the
     handover, fixes, and re-certifies. Sire is told the fix is in flight.
4. **The 10-gate floor never moves.** Feature-specific tests *add* to the
   gates; they don't replace them. Honest stubs over fake-pass — the CTO
   never invents a green. Gates that need an interactive browser are flagged
   `needs_human`, never silently passed.

## How it works mechanically

```
Claude Code builds something
   ↓
git commit + git push
   ↓
GitHub Action (.github/workflows/cto-verify.yml) fires:
   1. waits 180s for GitHub Pages to publish
   2. POST /admin/founder/cto-verify-deployment  (per changed HTML)
   3. POST /admin/founder/cto-certify            (one call, all pages)
   ↓
Chitti Founder runs the 10-gate verifier on each changed page:
   - fetch returns 200
   - load < 3.0s
   - mobile viewport meta present
   - chitti_a11y.js substrate loaded
   - language switcher / i18n hooks            [needs_human]
   - per-response widget (🔊 🤖 👍 👎)
   - blind-user path (aria + auto-voice)        [needs_human]
   - Hindi UI capable                            [needs_human]
   - no obvious broken markers
   - tap targets ≥48×48px                        [needs_human]
   ↓
CTO assembles a Certificate:
   - verdict + reasons + human-eyes list
   - the exact spoken text Vaani will say
   - the exact WhatsApp markdown Sire will read
   ↓
Two rails fire in parallel:
   - whatsapp_send()                  → Twilio or Meta Cloud (honest stub if neither configured)
   - vaani queue                      → in-memory deque, polled by chitti_vaani.html
   ↓
Vaani frontend picks up the queue on next visit and speaks each item.
Spoken items are ack'd so Sire never hears the same line twice.
```

## What Claude Code does before claiming "done"

In every conversation where Claude Code is asked to ship something:

1. Build it.
2. Run a local verification (puppeteer / curl / sanity import).
3. Commit + push.
4. Wait for the GH Action's CTO verify step to land. If it's RED, fix and
   push again — do **not** claim done.
5. Only after the certificate verdict is `CERTIFIED` or `CONDITIONAL` (with
   the human-eyes list relayed to Sire) is the work reportable.

When the GH Action can't run (e.g. the change is backend-only or out-of-band),
Claude Code calls the certify endpoint directly:

```bash
curl -X POST https://chitti-founder-api.up.railway.app/admin/founder/cto-certify \
  -H "Authorization: Bearer $ADMIN_SECRET" -H "Content-Type: application/json" \
  -d '{
    "feature_name":  "S Heartbeat Emblem Generator",
    "commit_sha":    "b930792",
    "changed_files": ["chitti_logo_video.html","tools/chitti_superhero_mascot.svg"],
    "test_plan_summary": "S emblem animates · 3 speeds × 3 colors · PNG + WebM"
  }'
```

The response carries the certificate; the two notification rails have already
fired by the time the HTTP response returns.

## Honest-stub posture

The CTO never fakes a green and never fakes a notification.

- WhatsApp without creds: logs the exact text it would have sent, returns
  `{ok: false, reason: "honest_stub_no_creds"}`. The certificate still records
  the verdict; only the WhatsApp rail is silent until Sire wires Twilio or
  Meta Cloud env vars.
- Vaani without an open tab: queue holds the message; first time Sire opens
  `chitti_vaani.html` the messages are spoken in order. Spoken items are
  ack'd in `localStorage` so reloads don't replay them.

## Doctrine, in one line

> **Sire's job is to use the platform, not to audit the platform. The CTO audits.**

— pinned 2026-05-27 by Bryan Wilfred Pinto
