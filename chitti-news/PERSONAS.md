# Chitti News — PERSONAS

Every product decision is checked against these personas. **If a feature does not serve at least 2 of them well, it does not ship.**

---

## Primary personas (the readers we build for)

### P1 — Sire's mother, 65, Mumbai
- **Reads in:** Marathi + English (slow)
- **Phone:** mid-range Android, WiFi at home, never installs anything
- **Daily ritual:** Morning chai + 10 minutes of news on her son's tablet
- **What she wants:** "What happened in Maharashtra today? Is the news real? Can I hear it in Marathi if my eyes get tired?"
- **What she hates:** Pop-ups, login prompts, English headlines, autoplay video
- **Success metric:** Reads Chitti News for 7 consecutive days without help

### P2 — Sundari, retired teacher, 71, Coimbatore
- **Reads in:** Tamil; voice-first user
- **Phone:** entry Android, sometimes 2G in evenings
- **What she wants:** "Tamil Nadu state news, then sports + entertainment. Read it to me. Tell me if it is verified or just a rumour."
- **What she hates:** Translated-from-English Tamil that reads awkwardly
- **Success metric:** Uses Chitti every morning without asking grandchildren for help

### P3 — Aakash, college student, 20, Patna
- **Reads in:** Hindi + English
- **Phone:** budget Android, college 4G
- **What he wants:** "National + politics + tech in 60 seconds; Chitti's Take so I don't have to read 1500 words; fact-check verdict on viral WhatsApp claims before I forward"
- **What he hates:** Doom-scroll, click-bait headlines, vague verdicts
- **Success metric:** Forwards a Chitti fact-check to family WhatsApp ≥1/week

### P4 — Priya, working mother, 38, Pune
- **Reads in:** Marathi (state news) + English (tech for her work)
- **Phone:** mid-range, juggles between work + kids
- **What she wants:** "Maharashtra news + my kids' Bombay HC court rulings + 3-bullet summaries because I have 7 minutes between dropoffs"
- **What she hates:** Articles longer than 200 words. Outrage. Politically loaded headlines.
- **Success metric:** Closes Chitti feeling informed, not anxious

### P5 — Ramesh, farmer, 52, Vidarbha (Maharashtra)
- **Reads in:** Marathi only; voice-first user
- **Phone:** entry Android, 2G most of the time
- **What he wants:** "PM-Kisan instalment news, MSP changes for cotton/soybean, Vidarbha state news, agricultural extension notices. Read it to me."
- **What he hates:** Anything not in Marathi. Anything requiring tap-tap-tap. Anything that loads slow on 2G.
- **Success metric:** Hears one agriculture-policy item per day; acts on a scheme once a month

### P6 — Anushka, Bengali student, 22, Kolkata
- **Reads in:** Bengali first, English second
- **Phone:** mid-range, college WiFi
- **What she wants:** "West Bengal state news in Bengali; politics with the Trust Strip verdict; Bengali music/cinema entertainment"
- **What she hates:** When Bengali stories fall back to English without explanation. Wants the `coverage` payload to say *"only 4 Bengali stories in politics today; fallback to national"*.

### P7 — Shahid, accountant, 36, Lucknow
- **Reads in:** Urdu + Hindi + English
- **Phone:** mid-range
- **What he wants:** "GST + ITR + RBI news in Hindi/Urdu; business + national; verified before share"
- **What he hates:** Tax news in casual language. Wants precise terminology.

### P8 — Visually-impaired reader (any age, any state)
- **Reads via:** Voice + ISL (some users)
- **Phone:** any
- **What they want:** "Auto-read on first visit. Voice navigation between tabs. Trust Strip read aloud. No silent UI elements."
- **What they hate:** Pop-ups without ARIA. Buttons with icon-only labels.
- **Success metric:** Can complete a full reading session voice-only

### P9 — Deaf reader
- **Reads:** Text only; ISL panel for video content
- **What they want:** "Plain text version of every audio element. ISL panel for any explainer video. Reading time visible."

### P10 — Mute reader
- **Reads:** Text; types feedback
- **What they want:** "Every input is text-first. Voice optional via 🎙️ mic icon."

### P11 — Illiterate reader (any age, rural)
- **Reads via:** Voice only
- **What they want:** "Voice-first onboarding. Emoji glyphs on every tab. Numbers + colour-coded pills for verified/unverified — never colour-only."

---

## Operational personas

### P12 — Sire (Bryan), Founder
- Needs: State-aware coverage data, vernacular completeness reports, fact-check verdict logs, Trust Strip surface audits.

### P13 — Chitti CTO (this agent)
- Needs: Locked decisions documented, spec parity between repo + production, CI guardrails for ingest + classification + fact-check.

---

## Anti-personas (we will not optimise for these)

| | We do NOT serve |
|---|---|
| **The doom-scroller** | Wants infinite feed of outrage. Chitti shows "reading time" and a "Cancelled" folder. |
| **The political-bias reader** | Wants their party glorified. Chitti is neutral; equal coverage across parties (hard rule). |
| **The viral-WhatsApp forwarder** | Wants unverified shock content. Chitti shows fact-check verdict before share. |
| **The advertiser** | No display ads, no advertorials, no paid placement, ever. |
| **The clickbait writer** | Headlines come from publishers; we don't rewrite for clicks. |

---

## How a persona check works in practice

Before any feature ships:

> *"Sundari (P2) opens Chitti on her morning chai. Does this feature help her — voice-first, in Tamil, with state news first?"*

If 2 of the 13 personas can't be served, it doesn't ship.

---

**World Class Chitti News — Commando Discipline. Zero Excuses.**
