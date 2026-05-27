# Chitti CTO Oath

**Locked 2026-05-27** · **rev 2 same day** (Vaani-only notification rails).

The CTO is the Solution Architect + Quality Auditor for every feature Claude
Code builds. Sire never sees uncertified work, and Sire never has to ask —
the CTO reports first, every time, **through Chitti Vaani only**.

## The seven rules

1. **Sire never sees uncertified work.** If the page Claude Code touched is
   not green per the CTO 10-gate, Sire is told the feature is *being fixed* —
   not told it is ready.
2. **Sire never has to ask.** Every certification fires Vaani proactively.
   Silent success is a defect.
3. **All CTO notifications go through Chitti Vaani only.** Vaani uses its
   existing rails:
   - **speakText()** — speaks the message aloud
   - **wa.me deep link** — opens WhatsApp app with the message pre-filled
   - **sms: deep link** — opens SMS app (Sire's second SIM) with the message
4. **No Twilio. No Meta Cloud. No MSG91. No new APIs.** Vaani is enough.
5. **Verdict is one of three.** No fudge category.
   - **CERTIFIED** — every changed page passed; first-time pass for this feature.
     Message: *"Sire, [page] certified and ready."*
   - **CONDITIONAL** — green but ≥1 gate is `needs_human`.
     Message: *"Sire, [page] certified. N items need your eyes."*
   - **REJECTED** — at least one page red. **Sire is not notified.** Claude
     Code stops the handover, fixes silently, and re-certifies. When the fix
     lands the recovery message fires:
     *"Sire, [page] had issues. Fixed now."*
6. **The 10-gate floor never moves.** Feature-specific tests *add* to the
   gates; they don't replace them. Honest stubs over fake-pass.
7. **Recovery is detectable.** The certificate ring remembers prior verdicts
   per `feature_name`. If the last cert for X was REJECTED and this one is
   CERTIFIED, the message format flips to "had issues. Fixed now."

## How it works mechanically

```
Claude Code builds something
   ↓
git commit + git push
   ↓
GitHub Action (.github/workflows/cto-verify.yml) fires:
   1. waits 180s for GitHub Pages to publish
   2. POST /admin/founder/cto-verify-deployment   (per changed HTML)
   3. POST /admin/founder/cto-certify             (one call, all pages)
   ↓
Chitti Founder runs the 10-gate verifier on each changed page.
Verdict + recovery flag → message text per the table above.
   ↓
If verdict ≠ REJECTED, queue a notification payload for Vaani:
   { id, ts, kind, verdict, feature_name, spoken_text, message,
     sire_whatsapp, sire_sms, recovery }
   ↓
Chitti Vaani frontend (chitti_vaani.html) polls
GET /api/cto/notifications/pending every 60s (visible tabs only):
   • speakText(spoken_text)                        — speaks the message
   • window.open(`https://wa.me/${sire_whatsapp}?text=…`)  — WhatsApp app
   • location.href = `sms:${sire_sms}?body=…`      — SMS app
   ↓
After each utterance, POST /api/cto/notifications/ack
so the queue empties. localStorage prevents replay on reload.
```

## What Claude Code does before claiming "done"

1. Build it.
2. Run a local verification (puppeteer / curl / sanity import).
3. Commit + push.
4. Wait for the GH Action's CTO verify step to land.
5. If verdict is `REJECTED` → fix and push again. Do **not** claim done.
6. Only after the verdict is `CERTIFIED` or `CONDITIONAL` (with human-eyes
   list relayed to Sire) is the work reportable.

When the GH Action can't run (out-of-band changes), call certify directly:

```bash
curl -X POST https://chitti-founder-api.up.railway.app/admin/founder/cto-certify \
  -H "Authorization: Bearer $ADMIN_SECRET" -H "Content-Type: application/json" \
  -d '{
    "feature_name":  "S Heartbeat Emblem Generator",
    "commit_sha":    "abc1234",
    "changed_files": ["chitti_logo_video.html","tools/chitti_superhero_mascot.svg"],
    "test_plan_summary": "Animates · 3 speeds × 3 colors · PNG + WebM"
  }'
```

The response carries the certificate; the Vaani queue has been updated by
the time the HTTP response returns.

## Env vars for the Vaani rail (set on chitti-founder Railway service)

```
SIRE_PHONE_NUMBER=+91XXXXXXXXXX      # single SIM — used for both WhatsApp + SMS
# OR split if Sire's WhatsApp number differs from SMS SIM:
SIRE_WHATSAPP_NUMBER=+91XXXXXXXXXX
SIRE_SMS_NUMBER=+91YYYYYYYYYY
```

If neither set, the Vaani frontend still speaks the message; the deep links
just won't have a target number and silently no-op. Honest stub posture.

## Honest-stub posture

The CTO never fakes a green and never fakes a notification.

- WhatsApp/SMS without Sire's number env var: Vaani speaks the message but
  the deep links no-op. Sire still hears the verdict.
- Vaani without an open tab: queue holds the message (up to 50); first time
  Sire opens `chitti_vaani.html` the messages are spoken in order and the
  deep links fire then.
- Pop-up blocker eats `window.open`: a tap-to-send card appears at the
  bottom of Vaani with WA + SMS buttons. One tap, both apps open.

## Doctrine, in one line

> **Sire's job is to use the platform, not to audit the platform. The CTO audits — through Vaani's voice.**

— pinned 2026-05-27 by Bryan Wilfred Pinto
