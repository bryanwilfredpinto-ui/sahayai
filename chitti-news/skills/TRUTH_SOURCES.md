# TRUTH_SOURCES — Chitti News

The full RSS feed registry lives in [data/sources.json](../backend/data/sources.json). This file is the curated narrative view of it.

## Refresh cadence

- **APScheduler** runs `rss_poll` every `RSS_POLL_MINUTES` (default **30 min**) — see [news_scheduler.py](../backend/services/news_scheduler.py).
- **Daily breaking** recomputes the breaking-news ribbon at **06:00 IST**.
- Per-source: 50-entry cap per poll; idempotent on `link` so duplicates are dropped.
- 90-day auto-prune to bound DB growth.

## Active feeds — English (national)

Times of India (Top, India, Business, Sports, Tech, Entertainment), The Hindu (National, Top Stories, Business, Sport), BBC News India, NDTV (Top, Business), Moneycontrol (Markets, Technology), Hindustan Times (India, Business), News18 India, MyGov India.

## Active feeds — Hindi (national)

दैनिक भास्कर (राष्ट्रीय, 1061, बिज़नेस, खेल), राष्ट्र भारत, दैनिक जागरण (राष्ट्रीय, बिज़नेस), NDTV हिंदी, BBC News हिंदी.

## Active feeds — BBC vernacular (national language slices)

BBC News in Hindi, Tamil, Bengali, Marathi, Gujarati, Telugu, Punjabi, Urdu.

## Active feeds — state

- **Karnataka** — Deccan Herald (National, Bangalore), ವಿಜಯ ಕರ್ನಾಟಕ.
- **Andhra / Telangana** — Deccan Chronicle, News18 తెలుగు AP + TG.
- **UP** — TOI Lucknow, अमर उजाला उत्तर प्रदेश.
- **Bihar** — TOI Patna, अमर उजाला बिहार.
- **MP / RJ / PB** — अमर उजाला regional, TOI city slices, navabharat.
- **Punjab** — PTC News × 5 regions, अमर उजाला पंजाब.
- **TN** — Hindu (TN, Chennai), TOI Chennai, News18 தமிழ்.
- **WB** — TOI Kolkata, News18 বাংলা, সংবাদ প্রতিদিন.
- **MH** — TOI Mumbai, Indian Express Mumbai, लोकमत, पुढारी, News18 मराठी.
- **GJ** — TOI Ahmedabad, ગુજરાત સમાચાર, News18 ગુજરાતી.
- **KL** — Hindu Kerala, DC Kerala, Asianet Newsable, ഏഷ്യാനെറ്റ്, News18 മലയാളം, കൈരളി, ജനം ടിവി, മംഗളം, ദീപിക.
- **OR / AS / JK / NG** — New Indian Express slices, ଧରିତ୍ରୀ, Greater Kashmir, Kashmir Reader, Nagaland Post.

Total enabled feeds: **25+** and growing. The exhaustive list is the source of truth in [data/sources.json](../backend/data/sources.json).

## Disabled with rationale

Per Bryan's policy, broken feeds stay in the registry with `enabled:0` and a `note` field explaining why: Tribune Punjab (Cloudflare 403), Mathrubhumi (404), Manorama (404), Anandabazar (404), Patrika (SPA), Prabhat Khabar (SPA), Jagran UP (404), LiveHindustan Bihar (503), Punjabi Tribune (403). Each has a documented functional replacement.

## Fallback policy

If a feed returns ≥ 2h of empty polls or HTTP errors:

1. Drop it from rotation for the current cycle.
2. Surface a **"source unavailable"** tag on the picker so the user knows the gap is real, not silently absorbed.
3. Log to per-feed health (see [OBSERVABILITY.md](OBSERVABILITY.md)).
4. Auto-retry on the next cycle — never permanently disabled by the runtime; only Bryan toggles `enabled:0` after re-probing.

## What is NOT a truth source

Social platforms (X, Reddit, WhatsApp). Anonymous blogs. Press releases not carried by ≥ 1 outlet in the registry. AI-generated commentary. Chitti's own historical Takes (the Take is generated fresh per call, never cited as a source).
