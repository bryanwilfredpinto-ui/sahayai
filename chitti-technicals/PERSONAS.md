🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# PERSONAS — who Chitti Technicals is actually for

> Level: Users. Subordinate to [CONSTITUTION.md](CONSTITUTION.md) Article 1 (Access First, Trading Second).
> The four-user floor (blind/deaf/mute/illiterate) is **law**, not a market segment. But the
> *buyer* is the semi-literate first-time investor and his cold-called senior parent. Both truths
> hold at once. This doc names all nine accessibility archetypes **and** the real-world people who
> will actually open Vaani and ask "is this stock good?"

---

## The nine accessibility archetypes (the floor — Article 1)

Population figures are India estimates (Census 2011 disability data scaled to 2026 + NSSO/NFHS).
Each archetype has a dedicated review doc under [accessibility/](accessibility/).

| Archetype | India population (approx) | Primary need on a chart tool | What Chitti Technicals does that no other app does |
|---|---|---|---|
| 👁️ **Blind** | ~5 crore (50 lakh fully blind + many more) | The chart is a wall of pixels — it is dead to a screen reader | Speaks the verdict in one sentence · sonifies the price line (pitch L→R) · earcons at RSI 30/70 + MACD cross · **"Show data as table"** · event-only `aria-live` — [accessibility/blind_user.md](accessibility/blind_user.md) |
| 🦻 **Deaf** | ~6 crore (hearing impaired) | Voice-only finance apps lock them out; ISL is their first language | Text + non-colour **icon+shape** verdict (▲▲/▲/■/▼/▼▼) · ISL panel via `chitti_isl.js` (fingerspell RSI/MACD — never fake a sign) — [accessibility/deaf_user.md](accessibility/deaf_user.md) |
| 🤫 **Mute** | ~2 crore (speech impaired) | Voice-command UIs assume everyone can speak | Tap/type twin for every mic · **Chitti-drafts-you-approve** via `chittiConfirmAndDo()` — [accessibility/mute_user.md](accessibility/mute_user.md) |
| 📖 **Illiterate** | ~25 crore (non-readers, 15+) | Cannot read English jargon, cannot read Hindi either | Voice-in/voice-out **in dialect** · icons reinforce only, **audio carries meaning** · zero-reading flow — [accessibility/illiterate_user.md](accessibility/illiterate_user.md) |
| 🧓 **Elderly** | ~15 crore (60+, rising fast) | The exact person cold-called with "guaranteed double your money" tips | Large type · slow speech · repeat-on-demand · **Tip Shield as the hero feature** — [accessibility/elderly_user.md](accessibility/elderly_user.md) |
| 🔍 **Low-vision** | ~5 crore (partial sight, cataract, diabetic retinopathy) | Tiny candlesticks + colour-only red/green are unreadable | 200% zoom-safe · high-contrast · **never colour-only** (shape + word + voice) · reflow at 320px — [accessibility/low_vision_user.md](accessibility/low_vision_user.md) |
| 🧠 **Cognitive** | ~2 crore (learning disability, dementia, low numeracy) | Number overload + urgency = panic decisions | One idea per screen · plain words · no countdown timers · "no rush, Sire" — [accessibility/cognitive_user.md](accessibility/cognitive_user.md) |
| ✋ **Motor** | ~1.5 crore (limited hand use, tremor, one-handed) | Tiny tap targets + drag-to-zoom charts are unusable | ≥48px targets · full keyboard path · no drag-required gesture · voice as alternative — [accessibility/motor_user.md](accessibility/motor_user.md) |
| 🌾 **Rural** | ~90 crore (rural India) | 2G, feature-phone-grade devices, dialect, low trust, scam-targeted | Offline service-worker cache · low-data · dialect voice · Tip Shield against village-WhatsApp pump groups — [accessibility/rural_user.md](accessibility/rural_user.md) |

> These nine overlap massively (an elderly rural illiterate user is one person). The product
> serves the **union**, not nine separate builds. The four-channel verdict (Article 2) is the
> single mechanism that covers all nine at once.

---

## The real buyer (who actually pays attention)

### Buyer persona — **Suresh, 34, semi-literate first-time investor (Nagpur)**
- Auto-driver turned small shopkeeper. Reads Hindi slowly, no English finance words. Has a Demat
  account opened during the 2021 boom because "everyone was doing it."
- Holds 4 stocks bought on a friend's tip. Has **never** seen a chart he could understand. Down 30%
  on two of them, won't sell because "it will come back."
- **Primary need:** someone to tell him, in Marathi, by voice, what the chart is *actually* saying —
  without selling him a trade.
- **Chitti's job:** speak the honest read ("RSI is high, this has run up fast, be careful"), show the
  **"most short-term traders lose — SEBI"** rail, and **never** push him to buy or sell.
- **What would betray him:** a confident "Strong Buy" with a fake 92% accuracy badge. That is exactly
  what we refuse (Article 4).

### Senior-parent persona — **Kamala-amma, 68, retired teacher (Madurai), being pitched tips**
- Pension + FD income. Hard of hearing in one ear, cataract in both eyes (low-vision + elderly).
- Gets daily WhatsApp forwards from a "SEBI-registered advisor" group her nephew added her to:
  *"₹50,000 → ₹2,00,000 in 30 days, GUARANTEED, only 4 seats left."*
- **Primary need:** a safe second opinion before she sends money. Large type, slow Tamil voice,
  repeat-on-demand.
- **Chitti's job:** run the **Tip Shield** on the forward → "This has the words *guaranteed* and *only 4
  seats left*. Real advisors never guarantee returns. This looks like a scam, amma. Chitti is not
  telling you to buy." Cross-link Chitti Legal / Chitti UPI to report it.

### Worried-tip-recipient persona — **Farhan, 27, gig-worker (Hyderabad), got a forward**
- Reads English. Got a stock tip forwarded in a 200-person Telegram "trading group." Tempted because
  the group keeps posting screenshots of "profits."
- **Primary need:** a 10-second sanity check. *Is this a real signal or a pump-and-dump?*
- **Chitti's job:** Tip Shield flags pump/urgency/unregistered-advisor patterns, shows the honest
  technical read of the named stock (often: already pumped, RSI overbought, volume spike = the dump
  setup), and frames it as a guardian: *"Here is what the chart says — be careful."*

> All three buyers share one thing: **they are being sold a trade, and no existing tool protects
> them.** Chitti Technicals' reason to exist is to stand between them and a predatory signal —
> understanding first, protection always, trading never urged (CONSTITUTION Founder Rule).

---

## User journey — BLIND user analyses a stock by voice

> Persona: **Ravi, 29, fully blind, uses TalkBack daily.** Screen is off. Headphones on. 4G.

1. **Open via Vaani.** Ravi: *"Chitti, dekho Reliance ka chart kaisa hai."* Vaani routes to the
   `technical` intent (Article 10 — Vaani is the door).
2. **Page auto-announces.** On load, one spoken line: *"Chitti Technicals. Reliance. Daily chart
   loading."* (`aria-live` host, event-only — not every tick.)
3. **One-sentence verdict first** (the highest-leverage blind win): *"Reliance, daily: Neutral,
   leaning Sell. RSI 68 — getting high. Be careful, Sire — most short-term traders lose money."*
4. **Sonify on demand.** Ravi: *"Sunao price line."* → 6 months of price sonified as pitch L→R
   (220–880 Hz), with an **earcon** when RSI crossed 70 and a distinct earcon at the MACD cross. He
   *hears* the run-up.
5. **Table on demand.** Ravi: *"Table dikhao."* → "Show data as table" — a real screen-reader table
   of date/close/RSI he can arrow through. Nothing is locked in a picture.
6. **Tap-to-explain, spoken.** *"RSI kya hai?"* → DeepSeek phrases the deterministic value in Hindi,
   cites the indicator (Article 6), stays jargon-honest (RSI stays "RSI").
7. **No order, ever.** If Ravi says "buy," Chitti: *"Main order nahi laga sakta — yeh sirf padhne ke
   liye hai. Chahein toh paper trade likh doon?"* → `chittiConfirmAndDo()` gates the paper-journal
   entry. Completes with **zero** sighted assistance.

## User journey — ILLITERATE user checks a tip

> Persona: **Lakshmi, 41, cannot read, speaks Telugu, on a ₹6k Android phone, 2G in the village.**

1. **Icon-grid home.** Big icons, 2-column, ≥48px. **Every icon speaks when focused** — she never
   has to read. She taps the 🛡️ "check a tip" icon; it says *"oka tip ni check cheyyandi"* (Telugu).
2. **Paste/forward the WhatsApp message.** She long-presses the forward and shares it into Chitti
   (no typing). The message: *"గ్యారెంటీ లాభం, రేపే కొనండి"* ("guaranteed profit, buy tomorrow").
3. **Tip Shield speaks the verdict** (no reading): *"Idi scam laaga undi. 'Guarantee' ani cheppe
   evaroo nijam advisor kaadu. Chitti ninnu konamani cheppatledu."* ("This looks like a scam.
   Anyone saying 'guarantee' is not a real advisor. Chitti is not telling you to buy.")
4. **Icons reinforce, audio carries.** A 🛡️ + ⚠️ icon appear, but they only *back up* the spoken
   verdict (field evidence: non-readers misread composite/arrow icons — so audio is the source of
   truth, Article 2).
5. **Offline-safe.** On 2G the page works from the service-worker cache; the Tip Shield scam-pattern
   check is **deterministic and local** — no round-trip needed to flag *guarantee / only-N-seats /
   urgency*. She gets her answer in her dialect, having read nothing.

---

## Persona → priority → doc map

| Code | Persona | Build-order home | Review doc |
|---|---|---|---|
| BLIND | Screen-off, TalkBack | BO1–BO2 | [accessibility/blind_user.md](accessibility/blind_user.md) |
| DEAF | ISL-first, sound-off | BO3 | [accessibility/deaf_user.md](accessibility/deaf_user.md) |
| MUTE | Tap/type only | BO4 | [accessibility/mute_user.md](accessibility/mute_user.md) |
| ILLITERATE | Zero-reading, dialect | BO5 | [accessibility/illiterate_user.md](accessibility/illiterate_user.md) |
| ELDERLY | Large/slow, tip-target | BO5 | [accessibility/elderly_user.md](accessibility/elderly_user.md) |
| LOW_VISION | Zoom/contrast | BO5 | [accessibility/low_vision_user.md](accessibility/low_vision_user.md) |
| COGNITIVE | One-idea, no-rush | BO5 | [accessibility/cognitive_user.md](accessibility/cognitive_user.md) |
| MOTOR | Big-target, keyboard | BO1, BO5 | [accessibility/motor_user.md](accessibility/motor_user.md) |
| RURAL | Offline, low-data | BO5 | [accessibility/rural_user.md](accessibility/rural_user.md) |

See [ACCESSIBILITY.md](ACCESSIBILITY.md) for the four-channel verdict contract that serves all nine.

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
