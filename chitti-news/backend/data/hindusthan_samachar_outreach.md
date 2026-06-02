# Hindusthan Samachar — outreach for content licensing

Drafted 2026-06-02 PM per Sire's instruction. Use this when filling
their Agency Subscription Form or any follow-up email if a contact
person emerges.

## Why them

Hindusthan Samachar publishes in **15 Indian languages** — verified
from their site footer:

> Hindi · Marathi · Odia · Assamese · Bengali · Punjabi · Nepali ·
> Urdu · Kannada · Telugu · Gujarati · English · Malayalam · Tamil ·
> **Sanskrit**

This is the only known Indian news agency that covers Sanskrit + Nepali
+ Assamese natively. Sire's gap list (Sindhi, Nepali, Assamese,
Sanskrit, Bengali, Malayalam, Kannada, Punjabi) is 7/8 covered by them
(Sindhi is not on their list — separate outreach needed for that).

## Direct contact paths discovered

| Channel | URL / Handle |
|---|---|
| **Agency Subscription Form** | https://www.hindusthansamachar.in/subscription-form/ |
| Photo Subscription | https://photos.hindusthansamachar.in/ |
| Twitter / X | @HsnewsBharat |
| LinkedIn | hindusthan-samachar |
| Facebook | HindusthanSamachar |
| Koo | Hindusthansamachar |

**No publicly listed email or phone.** Their subscription form is the
canonical entry point. Twitter DM or LinkedIn message are reasonable
fallbacks if the form goes unanswered.

## Suggested form text (copy/paste into the subscription form)

> Subject: API / RSS access for Chitti News — multi-language aggregator
> for accessibility users
>
> Dear Hindusthan Samachar team,
>
> I'm Bryan Wilfred Pinto, founder of Sahay AI (sahayai.in). We run
> Chitti News — a free, voice-first news aggregator built specifically
> for blind, deaf, mute, and illiterate Indians. We currently aggregate
> 168 RSS sources across 12 languages but have major gaps in the
> regional languages where Hindusthan Samachar is one of the very few
> publishers covering them at all.
>
> Specifically, we would deeply value licensed feed access for:
>
>   • Sanskrit (no other working source exists)
>   • Nepali (no other working source exists)
>   • Assamese (only 2 English Assam-state sources today, none Assamese)
>   • Kannada (4 sources today, vs your native wire coverage)
>   • Punjabi (7 Punjabi sources, but we want depth)
>   • Bengali (5 sources today, Anandabazar/Aajkaal RSS parked)
>   • Malayalam, Telugu, Gujarati, Marathi, Tamil, Urdu, Odia (we have
>     base coverage but more depth helps non-English-speaking users)
>
> Our use case:
>
>   - All Chitti News content is consumed via voice (text-to-speech),
>     ISL (Indian Sign Language), and screen readers. Articles are
>     never repackaged or monetised; the audience is the four-user
>     accessibility cohort (blind / deaf / mute / illiterate) and
>     elderly vernacular speakers.
>   - We attribute every article inline with source name + click-through
>     to the publisher's original URL. We never strip bylines or remove
>     publisher branding.
>   - We're a free, ad-free service — there's no revenue we earn from
>     your content. Our request is for licensed access at the rate you
>     reserve for non-commercial aggregators.
>
> Technical fit:
>
>   - We'd accept either an RSS / Atom feed per language, or a JSON API
>     keyed per request. Our ingestion pipeline (chitti-news, open
>     source on GitHub) supports both transparently.
>   - We can poll at any cadence you require (current default: every
>     30 minutes) and respect rate limits / no-republish-before windows
>     on a per-feed basis.
>
> Contact:
>   • Email: bryanwilfredpinto@gmail.com
>   • Website: https://sahayai.in
>   • GitHub: https://github.com/bryanwilfredpinto-ui/sahayai
>
> Happy to share any further details, sign a content licence, or
> arrange a brief call. Thank you for considering this — Hindusthan
> Samachar's multi-language coverage is uniquely well-suited to the
> Indians Chitti News was built to serve.
>
> Regards,
> Bryan Wilfred Pinto
> Founder, Sahay AI

## What to do next

1. Open https://www.hindusthansamachar.in/subscription-form/
2. Paste the text above as the message body.
3. Fill name + email + organisation = "Sahay AI" + use-case = "Free
   accessibility aggregator (non-commercial)".
4. Submit. If their form yields a contact email in the auto-reply,
   reply directly to confirm + ask for technical specs (feed URLs,
   API auth method, sample payload).
5. If no response within 7 days, DM @HsnewsBharat on X with a one-line
   pointer back to the form submission.

## On the technical side (when access is granted)

The `hindusthan-samachar-stub` source row in
[sources.json](sources.json) is enabled=0 waiting for their endpoint.
Once we have the real URL + API key:

  1. Replace the `rss_url` in that row with their actual endpoint URL
     (keep the `json+` prefix if it's JSON, drop it if RSS).
  2. Set `enabled=1`.
  3. If JSON, edit
     [chitti-news/backend/data/json_configs/](json_configs/) with the
     real field mapping. There's no config file yet because we don't
     know their JSON shape.
  4. If they offer separate per-language endpoints, clone the row
     once per language with `language` set appropriately.

## On Sindhi (the one Hindusthan Samachar does NOT cover)

Separate outreach paths to consider later:

  - **Daily Hindvasi** (Mumbai-based Sindhi paper) — no public RSS;
    check if they have a digital edition.
  - **Indo-Sindh Heritage Centre** — community publishing.
  - **Sahitya Akademi Sindhi** literary journals — academic, slow news
    but worth indexing.
  - **All India Sindhi Broadcasters' Association** (AISBA).

Sindhi coverage is genuinely thin even within India because the
post-Partition speaker diaspora is small and digital infrastructure
is underdeveloped. App-API capture path may end up being the only
route, similar to E-Pao Manipuri.
