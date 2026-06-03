# CNOS — Accessibility

> *"Everything must work via Speaker / Chitti / Like / Dislike / Feedback. No hidden functionality."*

---

## The 5 mandatory elements on EVERY box

| Element | Glyph | Purpose | Inherited from |
|---|---|---|---|
| Speaker | 🔊 | Read aloud — for blind users | `feedback-widget.js` auto-attach to `[data-chitti-response]` |
| Chitti | 🤖 | Explain in user's language + analogy | `feedback-widget.js` |
| Like | 👍 | Instant feedback | `feedback-widget.js` |
| Dislike | 👎 | Instant feedback | `feedback-widget.js` |
| Feedback widget | ✏️ + 🎙️ | Speak → LLM writes → reads back | `feedback-widget.js` per-box panel |

Plus the 6th: 🌐 Language selector (page-level via `chitti_a11y.js`).

---

## Four-user contract

| User | How CNOS honors it |
|---|---|
| 👁️ **Blind** | 🔊 on every card (`data-chitti-speak-handler`); blind-user auto-read of disclaimer on first visit; voice-only navigation across tabs |
| 🦻 **Deaf** | ISL panel auto-on (if Disability Profile `isl: true`); large text version of every audio; trust-strip readable without audio |
| 🤫 **Mute** | Every input is text-first; voice optional via 🎙️ on Ask + feedback |
| 📖 **Illiterate** | Emoji glyphs on every tab; voice-first onboarding; coverage payload narrated by voice; "Cancelled" + "Read Later" iconography |

---

## Live cert

| Test | Result |
|---|---|
| Mobile cert ([`cert_chitti_news_v2.mjs`](../../tools/cert_chitti_news_v2.mjs)) | 13/14 PASS |
| Per-card `data-chitti-response` present | ✅ verified live (49+ articles) |
| ARIA on language picker | ✅ |
| Disclaimer bar present | ✅ |
| Multi-language render (en/mr/hi/ta) | ✅ |
| Trust Strip readable in <2 s | ✅ |
| Coverage payload narrates gaps | ✅ |

---

## What's missing

| Gap | Plan |
|---|---|
| 219 small tap targets (header chips at 34 px) | Global header restyle to ≥ 48 px tap targets — out of news-only scope |
| Blind-user auto-read of full feed on first visit | Currently only disclaimer auto-reads; expand to top-3 stories |
| ISL panel coverage report | Sample 100 cards, confirm ISL panel renders per card |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
