# skills/chitti_news_swarm.md

Chitti News Swarm — how the people train their own AI.
Frontend: `chitti_news.html` (Chai Stall Mode overlay).
Backend: `/api/feedback` with `kind: "swarm_contribution"` (Phase 1).
Phase-2 Turso shards: `chitti_<language>_swarm` (Bhojpuri, Tulu, etc.).

## The vision (Sire 2026-05-23)

Chitti News is where Bharat talks. Bhojpuri Chitti will not be built in
a data centre in San Francisco — it will be built at a chai stall in
Ara, Bihar, by the people who drink chai there. Give them the tools.
They will build it.

## Chai Stall Mode — privacy contract (non-negotiable)

When the user taps **☕ Chai Stall Mode**, Chitti opens a 6-step
overlay (`chitti_news.html` → `chai-overlay`):

1. **Consent** — shows the exact text: "Kya main sunna shuru karun?
   Main sirf aapki bhasha seekhunga. Koi bhi awaaz save nahi hogi
   server pe. Sab kuch aapke phone pe rehega." Six explicit rules
   (3 green ticks + 3 red crosses). User must tap "Haan, shuru karo".
2. **Listening** — `SpeechRecognition` with `continuous=true`,
   `interimResults=false`. Microphone access is local-only — the
   browser engine processes audio; no raw audio leaves the page.
3. **Review** — every captured word is shown with its full transcript
   context. User taps ✓ or ✗ per word. Only ✓ words progress.
4. **Share opt-in** — explicit "Haan, share karo" OR "Nahi, sirf mere
   liye". Default: do not share.
5. **Submit** — confirmed + shared words POST to `/api/feedback` with
   `kind: "swarm_contribution"`, the user's language code, and the
   words. **Never** transcripts. **Never** user identifier.
6. **Thanks** — explicit acknowledgement.

## What Chitti listens FOR

- Regional words and pronunciation
- Local political leader names (e.g. "Nitish ji", "MK ji")
- Local place names and dialect markers
- Conversation patterns
- Sentence structure in dialect

## What Chitti NEVER captures

The frontend privacy filter (`CHAI_PRIVACY_KEYS` in `chitti_news.html`)
runs `BEFORE` any storage and DROPS the ENTIRE utterance if any of
these tokens appear:

```
\d{4,}          digit sequences (phone, OTP, PAN, Aadhaar fragments)
rupees? / ₹    money references
account / balance / OTP / card / CVV
mother / father / beti / beta / didi / bhaiyya
gmail / email patterns / @handle
aadhaar / pan card / pan number
"ji ne" / "ji bola"  conversational naming patterns
```

The filter is intentionally over-aggressive (false-positives accepted)
to protect the user. A flagged utterance is discarded — never enters
the candidate vocabulary list.

After the privacy filter passes, only individual tokens of length ≥ 3
chars (no digits) are kept, and an in-code STOPWORD set drops common
fillers (the, and, that, kya, hai, etc.). Remaining tokens are
de-duplicated by exact match.

## Swarm contribution data shape

Sent to the founder backend on a successful share (POST `/api/feedback`):

```json
{
  "chitti": "chitti_news_swarm",
  "card":   "chai_stall",
  "kind":   "swarm_contribution",
  "language": "hi | bn | te | ta | mr | gu | kn | ml | en",
  "words":  ["<token1>", "<token2>", "..."],
  "message": "<token1, token2, ...>",
  "page":   "chitti_news"
}
```

No user_token. No device id. No transcript. No timestamps. No
location. The founder dashboard aggregates these by `language` +
`word` and counts confirmations + corrections.

## Validation threshold for adoption

A word enters Chitti's **active regional vocabulary** when:
- **10+ confirmations** from users self-identifying as speakers of
  the same language code, **AND**
- **Confidence score ≥ 0.7** (calculated from
  `confirmations / (confirmations + corrections)`), **AND**
- **No active dispute** — corrections < 30 % of total submissions.

If any of those fails, the word stays in the candidate pool and
keeps collecting confirmations from new users.

## Regional model emergence

Once a language code accumulates ≥ 1,000 adopted words across ≥ 200
unique contribution events, Chitti spawns a regional model:
- `chitti_bhojpuri`
- `chitti_chhattisgarhi`
- `chitti_marwari`
- `chitti_tulu`
- etc.

These models speak in the regional voice — not a call-centre accent,
not a studio voice — their own people's voice.

Phase 1 (today): Hindi · Bengali · Telugu · Tamil · Marathi ·
Gujarati · Kannada · Malayalam · English.
Phase 2 (swarm): Bhojpuri, Chhattisgarhi, Rajasthani, Haryanvi,
Magahi, Bundeli, Tulu, Marwari.

## Conflict resolution

If two users submit conflicting pronunciations for the same word:
- Both are tracked separately as variant A and variant B.
- The variant with the higher confirmation count wins by region.
- Below 5 confirmations on either, both remain in the candidate
  pool — neither is promoted to active vocabulary.
- No single user can corrupt the model. No moderator can override
  the swarm.

## Dialect vs language distinction

Hindi (`hi`) is a language. Bhojpuri (`bhj`) is a recognised language
by Indian census but typically tagged as a Hindi-belt dialect. Chitti
treats both as first-class: a Bhojpuri speaker tags their session as
`bhj` even though the global language picker only offers `hi`.

A future Phase-2 UI will surface dialect codes once a region's
adoption threshold is hit. Today the contribution carries `language`
as either the user-selected scheduled language code OR an
explicit dialect token (e.g. `bhojpuri`).

## Transparency & user rights (DPDP Act 2023)

The user can audit everything at any time via the "📚 Chitti aaj
kya seekha?" link on the Chai Stall card:
- See every word ever captured from them
- Mark `shared` vs `sirf aapke phone par`
- **Delete everything** at any time — wipes the local
  `chitti_news_swarm_local_v1` bucket
- For shared contributions, the founder dashboard supports a
  user-initiated delete by language + word combo (Phase 2).

No raw audio is ever stored.
No transcripts are ever stored.
No user identifier is ever transmitted.
Per DPDP Act 2023 §11(2) the user can withdraw consent at any time —
Chai Stall Mode toggle off + Delete-everything button satisfies this.

## What this means in 6 months

A Bhojpuri-speaking auto driver in Patna opens Chitti News, taps Chai
Stall Mode while three of his friends are talking about the upcoming
panchayat election. The 6-step flow runs. 12 confirmed Bhojpuri words
enter the candidate pool with his language tag.

Forty-three other chai-stall conversations across Patna, Ara, Buxar,
Chhapra contribute the same words in the same week. The threshold
fires. Chitti spawns the Bhojpuri model. The Patna auto driver opens
Chitti the next morning and the AI talks to him in his own dialect.

That is the future Sire described. This skill file is the contract
that makes it work.
