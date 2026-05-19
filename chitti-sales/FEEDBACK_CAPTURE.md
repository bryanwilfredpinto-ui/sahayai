# Chitti Sales — Feedback Capture

How Chitti Sales captures, stores, reads, and acts on customer feedback. The product is a coach; without a real feedback loop, the coach is just guessing.

## Why this matters more for Sales than for CA / Legal

Chitti CA and Chitti Legal are graded against an external, authoritative truth — the Income Tax Act, the Indian Penal Code, the relevant Section number. A bad answer can be caught by reading the section.

Chitti Sales has no such oracle. Whether a tactic actually works for an Indian MSME owner is **only knowable from the MSME owner's experience**. If we do not capture their experience, we have no idea whether the coaching is real or hallucinated. The feedback pipeline is therefore the **core safety mechanism** for this product, not a UX nicety.

---

## Three feedback mechanisms

### 1. In-product thumbs widget (existing — already built)

The widget is [../feedback-widget.js](../feedback-widget.js) at the repo root. It is already used by every other Chitti page. The Chitti Sales page (`chitti_sales.html`, not yet built — see [TODO.md](TODO.md)) will include it with:

```html
<script src="feedback-widget.js" data-page="chitti_sales"></script>
```

**What the widget collects.**

- **Thumbs-up** (`type: "thumbs_up"`) — per-page, anonymous.
- **Thumbs-down** (`type: "thumbs_down"`) — per-page, anonymous.
- **Suggestion** (`type: "suggestion"`) — free text, with optional email, with sticky `user_segment` (general / msme-owner / partner / other).

**Where it posts.** `POST {API}/api/feedback/collect` — the existing Chitti Vaani feedback endpoint (`https://chitti-vaani-api.up.railway.app` by default; override with `window.CHITTI_FEEDBACK_API` before the script loads).

**Why we reuse the Vaani endpoint.** The shared endpoint already has admin tooling, scheduler, and a dedupe layer. We do not need to build a Sales-specific intake — every Chitti shares this same feedback backbone.

### 2. Monthly NPS survey

Once the product has been live for **one full month**, the founder pushes a one-question NPS survey (Net Promoter Score, 0-10) to the page footer for one week per month. Plain question, vernacular: "Aap is Chitti ko apne dost ko recommend karenge?"

**Why monthly, not always-on.** An always-on NPS prompt becomes wallpaper. A one-week-per-month appearance preserves signal-to-noise.

**Where it goes.** Same endpoint, with `type: "nps"` and a 0-10 integer in the payload. The widget's `send()` function is generic enough that we do not need to fork it.

### 3. Quarterly Customer Advisory Board call

Once we have **20+ active monthly users**, the founder picks 5 of them — across geography, vertical, and language — and runs a one-hour video call (or voice call, for users who do not want to be on camera). The five users get:

- A direct line to the founder.
- A printed thank-you card and a small token (a Sahay AI t-shirt or a saree-blouse-set with the logo embroidered, founder's choice).
- The first look at any major product change for the next quarter.

**Output of the call.** A founder-written one-page memo to the [TODO.md](TODO.md), pinning the top 3 themes to the roadmap.

This is the **only feedback mechanism** that can hear what an illiterate user is saying — because for them the in-product widget and the NPS survey are inaccessible. The voice / video call is the four-user-contract escape hatch for feedback itself.

---

## Storage schema (proposed)

The shared Vaani feedback endpoint already persists feedback per its own schema. For Chitti Sales-specific analysis, the proposed view (on the existing `feedback` table, filtered to `page = 'chitti_sales'`) is:

```sql
-- This is a view, not a new table. The underlying table is owned by chitti-vaani.
CREATE VIEW chitti_sales_feedback AS
SELECT
    id,
    timestamp,
    page,                  -- always 'chitti_sales' in this view
    type,                  -- thumbs_up / thumbs_down / suggestion / nps
    text,                  -- free-text body (suggestions only)
    email,                 -- optional, opt-in only
    user_segment,          -- general / msme-owner / partner / other
    nps_score              -- 0-10 integer, NPS responses only
FROM feedback
WHERE page = 'chitti_sales';
```

No PII is stored beyond what the user explicitly types into the suggestion box. Email is opt-in. There is no IP correlation beyond what Render's edge already captures.

If Chitti Sales ever stores per-session outcome data (the "did the tactic work?" follow-up sketched in [DATABASE.md](DATABASE.md) `sales_outcomes`), that table is **separate** and lives in the Sales-specific Turso DB — not in the shared Vaani feedback DB.

---

## Who reads it, and when

| Mechanism                   | Who reads it          | How often       | SLA on response                  |
| --------------------------- | --------------------- | --------------- | -------------------------------- |
| Thumbs up / down            | Founder (aggregate)   | Daily glance    | None — aggregate only            |
| Suggestion box (text)       | Founder (every entry) | Daily           | 48 hours to reply if email given |
| Monthly NPS                 | Founder (aggregate)   | Monthly review  | None — aggregate only            |
| Quarterly Advisory call     | Founder (one-on-one)  | Quarterly       | One-page memo into TODO.md within 7 days of the call |

**The 48-hour SLA on suggestion-with-email is the only hard commitment.** Bryan (the founder) replies personally — not a templated auto-response. This is the same posture as Chitti Vaani's feedback handling: human-touch for any user who left an email, because they made themselves identifiable on purpose.

---

## Feedback → roadmap pipeline

The flow from a thumbs-down to a product change has four steps:

1. **Daily**: founder glances at the previous day's thumbs ratio. If thumbs-down rate exceeds 30% for two consecutive days, that is a **page-level signal** — something is wrong with the prompt or the page itself. Pause and read the recent suggestions.

2. **Weekly**: founder reads all suggestions from the past week. Tags each with one of: `prompt-fix`, `ux-fix`, `feature-request`, `bug`, `praise`, `other`. Saves the tagged list in a working file (not committed).

3. **Monthly**: founder writes a one-paragraph "what changed because of feedback this month" entry in [CHANGELOG.md](CHANGELOG.md). This is the **public commitment** that feedback drove a real change — and the user who suggested it can see their idea in the changelog.

4. **Quarterly**: the Customer Advisory Board call surfaces the top 3 themes. These become the next quarter's [TODO.md](TODO.md) priorities — added at the **top** of the file, not the bottom.

---

## Anti-patterns we deliberately avoid

- **Auto-replies** on suggestion submission. The toast already says "Thanks — your idea is in!" — no email auto-response.
- **Net-promoter-aggregator dashboards**. We are not running an enterprise-feedback platform. A spreadsheet and a founder's eyes are sufficient at our scale.
- **Trying to attribute revenue to feedback**. The product is free. Feedback is read because it is right to read it, not because it has a measurable LTV impact.
- **Asking users to "rate Chitti on Google"**. We do not chase reviews. We chase real conversations with real users.
- **Treating the thumbs-down as a "complaint" channel**. A thumbs-down is data, not a fire. The fire is when **thumbs-down rate > 30%** at the page level (see step 1 of the pipeline).

---

## What "feedback success" looks like for v1

After six months in production, the founder should be able to answer these five questions from feedback data alone — without guessing:

1. Which **language** has the highest thumbs-up rate? (Tells us where the prompt translation is working.)
2. Which **topic chip** has the highest thumbs-down rate? (Tells us where the system prompt is weakest.)
3. Which **of the 10 books** is most-cited in highly-rated replies? (Tells us which book the model handles best — and which we should consider replacing in a v2 canon.)
4. What is the **one most-requested feature** in the suggestion box? (Drives the next quarter's roadmap.)
5. Has any MSME owner reported a **closed sale** because of a Chitti tactic? (The single most important qualitative signal. We do not measure closing rates — see [skills/BOUNDARIES.md](skills/BOUNDARIES.md) — but if a user volunteers the story, we listen.)

If the answer to question 5 is "yes" after six months, the product has earned the right to exist. If it is "no", the canon needs revision and the Indian MSME reframing needs sharpening — see [skills/DEVILS_ADVOCATE.md](skills/DEVILS_ADVOCATE.md) item 1.
