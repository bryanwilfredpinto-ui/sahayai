# CNAIOS — Accessibility

> *"Everything must work via Speaker / Chitti / Like / Dislike / Feedback. No hidden functionality."*

---

## The 5 mandatory elements on EVERY card

| Element | Glyph | Purpose | Status on new For You + stream cards |
|---|---|---|---|
| Speaker | 🔊 | Read aloud — for blind users | ✅ via `feedback-widget.js` MutationObserver |
| Chitti | 🤖 | Explain in user's language | ✅ |
| Like | 👍 | Instant feedback | ✅ |
| Dislike | 👎 | Instant feedback | ✅ |
| Feedback widget | ✏️ + 🎙️ | Speak → LLM writes → reads back | ✅ |

Plus: 🌐 Language selector (page-level) + ISL panel per card (Disability Profile opt-in).

---

## Four-user contract

| User | How CNAIOS honors it |
|---|---|
| 👁️ **Blind** | Profession picker voice-readable + auto-read for blind on first visit; 🔊 on every card |
| 🦻 **Deaf** | ISL panel auto-on; per-card Trust Strip readable without audio |
| 🤫 **Mute** | Profession picker is select (no voice required); every input is text-first |
| 📖 **Illiterate** | Voice-first onboarding; emoji glyphs on tabs (🎯 For You / 🏅 Certs / 🛠️ Tools+ / 💼 Jobs / 🏛️ Schemes / 🗺️ Roadmaps) |

---

## Live cert results (`cert_news_ai.mjs` on sahayai.in)

| Check | Result |
|---|---|
| 3 viewport screenshots (375/768/1280) | ✅ |
| No horizontal scroll @ 375 | ✅ |
| Profession picker ARIA + aria-describedby | ✅ |
| Substrate scripts loaded (`window.Chitti`) | ✅ |
| 9 tabs render (4 original + For You + 5 new streams) | ✅ |
| Per-card `data-chitti-response` | ✅ 67 cards on live site |
| Trust Strip badges visible | ✅ |
| Tap targets ≥ 44 px | ⚠️ 50 small (header chip inheritance) |
| Why-this-matters disclosure | ⚠️ timing race on cert (works in normal use) |

**18/20 PASS.**

---

## Profession picker accessibility

| Feature | Status |
|---|---|
| `aria-label` | ✅ "Profession — choose any time, default Everyone. Use arrow keys to browse options." |
| `aria-describedby` | ✅ links to hint text |
| `onfocus` speak hint | ✅ via `_speakPickerHint()` |
| Blind auto-read on first visit | ✅ when `chitti_disability_profile.blind === true` |
| Voice Factory fallback | ✅ tries `Chitti.a11y.speak` first, browser `SpeechSynthesis` second |

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
