🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# ARCHITECTURE — Chitti Fashion

## Topology

```
User ──► Chitti Vaani (sole interface)         chitti_fashion.html (dev/debug + parity)
            │  intent: "fashion"                      │
            └──────────────┬───────────────────────────┘
                           ▼
                  chitti-vaani-api  (Railway)   ◄── DeepSeek (sole LLM)
                  POST /api/vaani/ask  mode=ask
                  POST /api/feedback
                           │
              wrap_llm (quadrails + observability + Compliance)
                           │
                  Turso libSQL (via turso_http.py shim) — anonymised aggregates only
```

- **No dedicated backend.** Per [§2 Vaani-sole-interface](../SAHAYAI_MASTER.md),
  Fashion is a routed capability on `chitti-vaani-api`. The HTML page is the
  parity/dev surface. This is deliberate — a fashion-specific backend would
  duplicate the Vaani pipeline for no gain.
- **DeepSeek only** ([§2](../SAHAYAI_MASTER.md)). The 7-agent swarm is realised as a
  single structured DeepSeek prompt that returns per-agent scores (one round-trip,
  not seven) — see "Swarm execution" below.

## Data residency (privacy by construction)

| Data | Where it lives | Ever sent to server? |
|---|---|---|
| Wardrobe photos (base64) | Browser **IndexedDB** `chitti_fashion_almari` | **Never** |
| Item metadata (category, colour name, occasions) | IndexedDB | Only as short **text** (e.g. "blue cotton kurta, office") |
| User profile (gender, disability, language) | `localStorage` (shared via chitti_a11y.js) | Never as identity; only language token rides requests |
| Per-card feedback (👍/👎 + text) | POST `/api/feedback` | Card name + text only — never images |
| Anonymised styling patterns | Turso aggregate (swarm) | Anonymised, ≥100 confirmations, tombstoned on forget |

DPDP Act 2023 compliant. The privacy banner states this in 9 languages on first visit.

## Swarm execution (7 agents, 1 round-trip)

The seven-agent vote ([swarm/](swarm/)) is sent to DeepSeek as ONE prompt that
demands a strict JSON object:

```json
{
  "overall": 8.4,
  "agents": {
    "fashion": {"score": 8, "why": "..."},
    "color":   {"score": 9, "why": "..."},
    "occasion":{"score": 8, "why": "..."},
    "comfort": {"score": 9, "why": "..."},
    "accessibility": {"score": 10, "why": "..."},
    "budget":  {"score": 10, "why": "from your own wardrobe — ₹0"},
    "confidence": {"score": 8, "why": "..."}
  },
  "teach": {"why":"...","benefits":"...","tradeoffs":"...","alternatives":"..."},
  "tiers": {"free":"...","budget":"...","premium":"..."},
  "trend_note": "advisory only — does not change overall"
}
```

- `overall` = mean of the 7 agent scores. The Trend Agent's note is attached but
  **excluded** from the mean (ROLE.md: trend never raises a score).
- If DeepSeek returns malformed JSON, the frontend shows an honest "Chitti could
  not score this — try again," never a fabricated score.
- The system prompt opens with the **body-positivity** + **inclusivity** guardrails
  ([guardrails/](guardrails/)) and closes by repeating "rate clothing, never the body."

## Frontend substrate (gate-compliant)

| Substrate | Gate | Role |
|---|---|---|
| `feedback-widget.js` + `data-chitti-response` | G1 | per-box 🔊/🤖/👍/👎 + feedback |
| `chitti_a11y.js` | G2 | lang selector, Voice Required, Braille, read-page, auto-injects the rest |
| Disability Profile prompt (via a11y) | G3 | first-visit multi-select |
| Language auto-detect (via a11y) | G4 | `<html lang>` from profile/navigator |
| `chitti_isl.js` (via a11y) | G5 | ISL panel per response |
| `chitti_features.js` + `<meta name="chitti-features">` | discovery | reads [skills/FEATURES.md](skills/FEATURES.md) |
| `chitti_theme.css` | brand | Saffron/Navy/Green tricolour palette |

## Performance budget

- First paint < 1.5 s on 2G simulation; total page < 250 KB excluding shared substrate.
- Wardrobe images lazy-loaded; collages render owned thumbnails, not re-fetched.
- One DeepSeek round-trip per advice request (swarm batched).

## Failure modes & honest degradation

| Failure | Behaviour |
|---|---|
| DeepSeek 5xx | Honest "Chitti is busy — try again"; Layer-5 fallback surfaces the provider switch, never silent |
| Location denied | Ask city by text/voice; never guess weather |
| Empty wardrobe | Guide to add items; never invent an outfit |
| Phantom item ID from model | Drop tile, log `phantom_item`, recompute collage |
| Malformed swarm JSON | Honest retry prompt; no fabricated scores |
| Offline | Service-worker serves last advice + "offline" badge (cross-cutting [§5b](../SAHAYAI_MASTER.md)) |

## Rollback plan

- Every feature behind a `cf_*` flag read at boot from a static config; flipping a
  flag off reverts to the prior stable surface with no deploy.
- HTML is a single static file on GitHub Pages → rollback = `git revert` of the page commit.
- No DB migration owned by Fashion (rides Vaani's), so no schema rollback risk.

## Security

- No secrets in the page. No PII transmitted. No third-party trackers.
- All network calls go to the one `API_BASE` (chitti-vaani-api) over HTTPS.
- Camera/photo access gated by the browser permission prompt + the Golden Rule for any action.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
