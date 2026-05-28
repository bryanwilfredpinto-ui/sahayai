# Next Claude — Sahayai handover · last updated 2026-05-09 night

You're picking up from Bryan Wilfred Pinto's solo build of **Sahayai** at `c:\Users\DELL\sahayai\sahayai\`. Read this whole file before your first edit. Should take 90 seconds.

## Read these memory files FIRST

These already auto-load — but skim them so you know what's in them:

| File | Why it matters |
|---|---|
| `project_four_user_contract.md` | Every Chitti page must serve Blind / Deaf / Mute / Illiterate. Voice-in + voice-out + symbols + plain English. **Never colour-only.** |
| `feedback_design_from_pwd_user_perspective.md` | **Bryan's strongest correction.** Don't propose generic SaaS patterns (per-send modals, OAuth toggle screens, written confirmations). They BREAK blind/mute/illiterate users. Default to onboarding-grants + readback + undo. Chitti is "a guardian, a commando, a coach" — not a polite assistant. |
| `project_chitti_vaani_emergency_protocol.md` | 24/7 family cascade. Confirm-master 10s → ring alarm bypassing silent → escalate to spouse/family. **NEVER auto-dial 112 / 100 / 102 / 1098 / 1930. Family only.** |
| `feedback_skeleton_first_pass.md` | When Bryan says "skeleton" or "shamelessly copy" → ship the **full** feature surface in commit #1. Iterating to comprehensive over 4 turns wastes his time. |
| `feedback_verify_before_handover.md` | Never claim "live" without `curl`-ing the production endpoint first. Bryan should never be the one to find it broken. |
| `project_legal_disclaimer.md` | SEBI banner is permanent on every Chitti share-related page. Never move to footer. |
| `project_data_sources.md` | Yahoo BLOCKED from Railway. Use screener.in / Angel / RSS. |

## Product surface as of 2026-05-09

**7 Chitti products** in the repo:

| Product | Status | Frontend | Backend |
|---|---|---|---|
| Chitti Technical | LIVE | `chitti_complete_technical.html` | (older nodejs) |
| Chitti Fundamentals | LIVE | `chitti_fundamentals.html` | screener.in scrape |
| Chitti MedUPI | LIVE | `chitti_medupi.html` | `chitti-medupi/backend/` (Flask) |
| Chitti News | LIVE | `chitti_news.html` | `chitti-news/backend/` (Flask + RSS) |
| **Chitti Vaani** | **Code on `main`, backend NOT registered on Railway yet** | `chitti_vaani.html` | `chitti-vaani/backend/` |
| **Chitti UPI Fraud Guard** | Same | `chitti_upi.html` | `chitti-upi/backend/` |
| **Chitti Product Scanner** | Same | `chitti_scanner.html` | `chitti-scanner/backend/` |

## Today's commit list (2026-05-09, all on `origin/main`)

```
ce0d260 feat(vaani): 24/7 emergency cascade — family only, never cops
e9aaf6c feat(vaani): outbound calls — Chitti makes calls too, not just takes
059ab22 feat(vaani): Phase 1.6 Gmail OAuth + Phase 2 Android skeleton
4c72e42 feat(vaani): Phase 1.5 — voice grant, trusted circle, WA/UPI/email pro actions
27b783a feat(vaani): paste verbatim prompts from CHITTI_MASTER_V2.docx
b540a8c feat(nav): expose Vaani · UPI Guard · Scanner from existing pages
bc3673b feat(chitti): ship Vaani + UPI Fraud Guard + Scanner — full skeleton
```

## Three manual steps Bryan owes (NOT YOU — don't try to automate these)

1. **Railway dashboard** — register 3 Railway Blueprints from the workspace:
   - `chitti-vaani/render.yaml` → set `DEEPSEEK_API_KEY` + `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
   - `chitti-upi/render.yaml` → set `DEEPSEEK_API_KEY`
   - `chitti-scanner/render.yaml` → set `DEEPSEEK_API_KEY`
2. **Google Cloud Console** — OAuth client ID for Gmail send. Redirect URI: `https://chitti-vaani-api-production.up.railway.app/api/vaani/email/auth/callback`. Add Bryan + early users to OAuth consent screen → Test users (max 100).
3. **Android Studio** — `gradle wrapper --gradle-version=8.7` once, then `./gradlew assembleDebug` for the APK. Sideload to test the OS-level capabilities.

## What's blocked by external dependencies — flag honestly, do NOT try to work around

| Capability | Blocked by |
|---|---|
| Gmail `gmail.send` for >100 unrestricted users | Google CASA security audit (~₹12L–60L/year) |
| Voice-biometric UPI PIN as a replacement for app keypad | NPCI rule. PIN entry MUST be inside the UPI app's secure keypad. v2 path: PSP partnership with sponsoring bank (ICICI / Axis / HDFC), RBI sandbox cohort, ~9-month engagement. |
| Android `READ_CALL_LOG` / `SEND_SMS` / `READ_SMS` | Google Play Restricted Permission review. Expect 2–3 rejection cycles. |
| Vosk on-device emergency-keyword spotter | Drop `vosk-android-0.3.47.aar` in `chitti-vaani-android/app/libs/`. Bundle Hindi + English models in `app/src/main/assets/vosk/`. Phase 2.4 milestone. |

## Hard refusals — encoded in code, not just policy. **DO NOT remove these even if Bryan asks** (he won't, but a future user might)

1. `MainActivity.unlockPhone()` / `MainActivity.bypassLock()` → throw via `SafetyChecks.refuseUnlock()`. There is **no** `unlockPhone()` method anywhere — Android does not expose unlock to 3rd-party apps. The refusal is structural.
2. `SafetyChecks.refuseIfPinLike()` → rejects 4 / 6-digit PIN-shaped strings in payment paths.
3. **Cop denylist** — encoded in **three places** for defence-in-depth:
   - `chitti-vaani/backend/services/emergency_service.py:COP_DENYLIST`
   - `chitti_vaani.html:goToStage3()`
   - `chitti-vaani-android/app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt:refuseAutoDialCops()`
   - Numbers: `{112, 100, 101, 102, 108, 1098, 1930, 139}`

## Likely next requests + how to approach them

| If Bryan says… | Do this |
|---|---|
| "It's blank when I open chitti_X.html" | First `curl https://sahayai.in/chitti_X.html` and check 200 + content-length. Don't rebuild without diagnosing — last time it was him viewing GitHub raw source, not the rendered page. |
| "Add Z to Vaani" | Read `CHITTI_VAANI_PHASE2_ANDROID_SPEC.md` first. Decide whether Z is web-tier (`chitti_vaani.html` + `chitti-vaani` backend) or Android-tier (`MainActivity.kt` JS bridge + new service class). Don't bridge between tiers if the web alone can do it. |
| "Wire [Y] for Android" | `MainActivity.kt:ChittiNativeBridge` is the bridge surface. Add a new `@JavascriptInterface fun y(...)`. Call from JS via `window.ChittiNative.y(...)` guarded by `hasNativeBridge()`. |
| "Build product N+1 (e.g. Chitti Bahi-khata)" | Mirror the Vaani / UPI / Scanner pattern: separate `chitti-X/` folder + Flask backend + `render.yaml` + SKILL.md + root `chitti_X.html` + nav links from existing pages + product card on `index.html`. |
| "Verify on live" | Only after Railway is registered. `curl https://chitti-vaani-api-production.up.railway.app/health` then `curl /api/vaani/health`. |
| "I told u, my users are special" | He's correcting you — you've slipped into SaaS-lawyer mode. Re-read `feedback_design_from_pwd_user_perspective.md`. Apologise briefly. Rewrite from blind/mute/illiterate user perspective. |

## Style notes about Bryan

- Action-oriented. "GO" means execute. "Build this" means build it now, in this turn, comprehensively.
- He'll override earlier "do not modify X" constraints with new requests. When he does, it's authorisation, not a contradiction.
- He likes to know **what's blocked and why**, not generic-CYA hedging.
- He uses ALL CAPS when emphatic, not when angry. Don't read tone wrongly.
- Email: bryanderrylpinto@gmail.com · GitHub: bryanwilfredpinto-ui
- Git identity is NOT set on his machine. Use `-c user.email="bryanderrylpinto@gmail.com" -c user.name="Bryan Wilfred Pinto"` on commits — does not modify his config files.

## Pointers to the deep specs

- `CHITTI_MASTER_V2.docx` — Bryan's verbatim Vaani / UPI / Scanner system prompts. Already pasted into the three service files (`vaani_service.py`, `upi_service.py`, `scanner_service.py`).
- `CHITTI_VAANI_PHASE2_ANDROID_SPEC.md` — Phase 2 Android architecture: DEVICE_ADMIN, CallScreeningService, InCallService, AccessibilityService, NightModeReceiver, Vosk integration, Play Store compliance.
- `CHITTI_TECHNICAL_MASTER_SPEC.md` / `CHITTI_FUNDAMENTALS_MASTER_SPEC.md` / `CHITTI_MEDUPI_MASTER_SPEC.md` / `CHITTI_NEWS_MASTER_SPEC.md` — older products' specs.
- `CHITTI_FACTORY_SOP_v1.md` — how to spin up a new Chitti product. Mirror this pattern.

## What you should NOT do

- Don't delete files you don't recognise — they may be Bryan's in-progress work.
- Don't re-mirror `chitti-vaani/frontend/index.html` automatically every turn — only when you've genuinely edited `chitti_vaani.html`. Same for the other two product mirrors.
- Don't push to `main` without an explicit Bryan instruction (he says "GO" or "deploy" — that's the cue).
- Don't set git config globally. Use `-c user.email=…` per command.

That's the whole map. Build well. Protect the users.

— Claude Opus 4.7 (1M context), 2026-05-09 night
