# Sahay AI / Chitti Family — Master Context

Last updated 2026-05-12.

This is the single highest-level document for the Sahay AI repository. Read this first. Per-product detail lives in each `chitti-*/` folder's own [CONTEXT.md](#per-product-context). Per-session decisions and policy live in [auto-memory](C:/Users/DELL/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/MEMORY.md).

---

## 1. What Sahay AI is

Sahay AI ("sahay" = Hindi for "help") is a family of small, voice-first AI products for Bharat — the half of India that mainstream SaaS forgets. The user we design for is one of these four, and the product must work for them **before** any AI feature lands:

| User | Cannot | Must still be able to |
|---|---|---|
| **Blind** | See the screen | Navigate by voice, hear every answer, never depend on a colour cue |
| **Deaf** | Hear TTS / phone calls | Read subtitles for every spoken turn, take the same action visually |
| **Mute** | Speak the wake word or dictate | Type, tap, gesture; pre-record voice samples for replay |
| **Illiterate / first-time smartphone** | Read instructions or 16-char UPI handles | Hear plain Hindi/regional explanations, get one-tap confirmations |

Elderly users are a fifth common case who benefit from the same accessibility surface (large touch targets, high contrast, voice-first). This is recorded as the canonical **Four-User Contract**; it is non-negotiable and lives at the top of every product's [CONTEXT.md](chitti-medupi/CONTEXT.md) and in [auto-memory](C:/Users/DELL/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/project_four_user_contract.md).

The implementation rule is simple: **accessibility before AI**. If a feature works only because it has an LLM behind it, it does not ship. The LLM is the cherry on top of a usable product.

---

## 2. The Chitti Family

"Chitti" (from the Tamil film of the same name) is the brand for an individual AI assistant in the family. Each Chitti is an independent product with its own backend, frontend, deploy lifecycle, and skills/ folder. They share three things: the Four-User Contract, the [Voice Factory](chitti-voice-factory/) substrate, and the SahayAI homepage.

| Chitti | What it does | Status (2026-05-12) |
|---|---|---|
| [chitti-medupi](chitti-medupi/) | Medicine cost intelligence — strict same-composition matching, Jan Aushadhi pricing, family wallet | **Live** on Neon Postgres (migrating to Turso) |
| [chitti-shares](chitti-shares/) | Indian equities — fundamentals (Buffett/Lynch/Graham/Greenblatt lens) + technicals (Roshan Indicator + 43 signals) | **Live** on Supabase |
| [chitti-news](chitti-news/) | State × language news aggregator, Chitti's Take 3-bullet summary, fact-checker | Render service exists, deploy parked on placeholder DB |
| [chitti-government](chitti-government/) | Voice-first guide to Indian govt schemes (PM-Kisan, Ayushman, 30+ seeded) | Render service exists, deploy parked on placeholder DB |
| [chitti-vaani](chitti-vaani/) | Voice conversational layer + Gmail "send as Chitti" + emergency relay | Not yet deployed; render.yaml ready |
| [chitti-vaani-android](chitti-vaani-android/) | Native Android client for Vaani Phase 2 — always-on listener + emergency cascade | Skeleton in place (3 commits) |
| [chitti-ca](chitti-ca/) | Chartered Accountant Q&A — server-enforced disclaimer; honest stub | Not yet deployed |
| [chitti-legal](chitti-legal/) | Indian law Q&A — server-enforced legal disclaimer | Not yet deployed |
| [chitti-voice-factory](chitti-voice-factory/) | Shared voice substrate: 26 languages, 4-supplier cascade (ElevenLabs → AI4Bharat → Google → Bhashini), community contest, Hall of Fame | Not yet deployed |
| [chitti-scanner](chitti-scanner/) | Document/object scanner with PII masking (Aadhaar/PAN) | Not yet deployed |
| [chitti-upi](chitti-upi/) | UPI fraud-text classifier (NOT a payment intent parser — see scope clarification memory) | Not yet deployed |
| [chitti-logo-video](chitti-logo-video/) | SVG monogram + queued mock video for small-business branding (honest stub until provider keys) | Not yet deployed |
| [chitti-sales](chitti-sales/) | In-house sales coach for MSME owners — distilled from top 10 sales books | New |

The full live-vs-pending audit is in [auto-memory project_render_deploy_status_2026_05_10.md](C:/Users/DELL/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/project_render_deploy_status_2026_05_10.md).

---

## 3. Architecture at a glance

Each Chitti is a separate process, separately deployed. They share **nothing in code** except:

- **Voice Factory** — the TTS/STT layer at [chitti-voice-factory/](chitti-voice-factory/). Every voice-IN / voice-OUT goes through it. 4-supplier cascade prevents lock-in; Tier C (low-availability languages) never silently falls back.
- **DeepSeek** — the sole LLM provider for all Chittis (decided 2026-05-11). OpenAI-compatible API at `https://api.deepseek.com`. Old Anthropic call sites are tracked for migration in each Chitti's TODO.md.
- **Sahay AI homepage** — the static landing at [index.html](index.html) and per-product HTML pages at repo root.

Stack patterns (variations are tracked in each Chitti's [ARCHITECTURE.md](chitti-medupi/ARCHITECTURE.md)):

- **Backend**: Flask + SQLAlchemy + APScheduler + DeepSeek (except chitti-shares which is FastAPI).
- **Frontend**: vanilla HTML/JS at the repo root for each product (e.g. [chitti_medupi.html](chitti_medupi.html)). No SPA framework — every page is a single file the user can open with the address bar.
- **Persistence**: Turso libSQL with one database per Chitti (in migration as of 2026-05-12). Previously: Neon Postgres for chitti-medupi, Supabase for chitti-shares.
- **Deploy**: Render free tier, auto-deploy from `main`, UptimeRobot @ 5-minute interval on every `/health`.

---

## 4. Database strategy

**Decision (2026-05-12):** Migrate every Chitti from Postgres (Neon/Supabase) to **Turso libSQL** with one database per product. Rationale: cost, simplicity, and Turso's per-product isolation matches the existing per-product backend boundary cleanly.

Migration cost per backend:

1. Swap `psycopg2-binary` → `sqlalchemy-libsql` in requirements.txt.
2. Replace `DATABASE_URL=postgresql://...` with `libsql://<db>-<org>.turso.io?authToken=...`.
3. Remove every `CREATE SCHEMA IF NOT EXISTS …` call — libSQL is SQLite, no schemas.
4. Drop schema prefixes from table names (`news.articles` → `news_articles` or just `articles`, since each Chitti has its own DB now).
5. Re-test type compatibility — no `DOUBLE PRECISION`, no JSONB, no schema-qualified indexes.

The migration is tracked in each Chitti's TODO.md under "DB migration: Postgres → Turso".

---

## 5. LLM strategy

**Decision (2026-05-11):** DeepSeek is the sole LLM provider for every Chitti. Rationale: cost, single-provider simplicity.

- **Endpoint**: `https://api.deepseek.com` (OpenAI-compatible).
- **Default model**: `deepseek-chat`.
- **Vision (MedUPI medicine-strip scan)**: DeepSeek-VL when GA; until then the recognition flow returns the graceful "unconfigured" fallback.
- **Client pattern**: `from openai import OpenAI; OpenAI(api_key=..., base_url="https://api.deepseek.com")`.

Anthropic call sites still exist in code (`services/medupi_recognition.py`, `chitti-shares/backend/`, `chitti-news/backend/services/`) — tracked for migration in each Chitti's TODO.md.

---

## 6. Hard rules — same across every Chitti

| Rule | Where enforced | Why |
|---|---|---|
| **Accessibility before AI** | Every CONTEXT.md "Accessibility Requirements (Non-Negotiable)" section | The four user types must be able to use the product before any LLM is layered on. |
| **Voice IN and voice OUT** | [chitti-voice-factory/](chitti-voice-factory/) substrate | Blind and illiterate users cannot read; deaf and mute users still need a path. |
| **SEBI: NOT REGISTERED banner is permanent** | All chitti-shares and chitti-medupi pages | We do not give SEBI-regulated advice. The sticky banner stays at top of every page; never the footer. |
| **Family cascade, never cops** | [chitti-vaani](chitti-vaani/) + [chitti-vaani-android](chitti-vaani-android/) emergency protocol | Auto-dialling 112/100/102/108/1098/1930/139 endangers users (e.g. domestic-abuse case). Family-cascade only. |
| **MedUPI strict-match** | [chitti-medupi/services/medupi_alternatives.py](chitti-medupi/backend/services/medupi_alternatives.py) | Never recommend a different salt/strength/form. The whole product depends on this guarantee. |
| **chitti-upi NEVER moves money** | [chitti-upi/CONTEXT.md §0](chitti-upi/CONTEXT.md) | v1 is a fraud-text classifier. It does not generate `upi://pay?...` intents. v2 is research, not shipped. |
| **chitti-vaani-android hard refusals are code-level** | [chitti-vaani-android/CONTEXT.md §0](chitti-vaani-android/CONTEXT.md) | No cop autodial, no unlock surface, PIN-shape filtering, scoped WhatsApp tap. Security features, not policy. |
| **chitti-news fact-check ≥2 sources** | [chitti-news/services/](chitti-news/backend/services/) | We cross-reference any "is this true" query against at least 2 trusted RSS feeds. No single-source verdicts. |
| **Government scheme disclaimer** | [chitti-government/](chitti-government/) | Server-injected disclaimer on every reply. We point users at the partner-only DigiLocker flow + local-upload fallback. |
| **chitti-logo-video is an intentional stub** | [chitti-logo-video/CONTEXT.md](chitti-logo-video/CONTEXT.md) | Real provider hookup is future work. Today returns SVG + queued mock video. Don't silently swap in a real provider without Bryan's go-ahead. |

---

## 7. Per-product context

For each Chitti, the eight reference docs live in its folder:

| File | What it answers |
|---|---|
| [README.md](chitti-medupi/README.md) | What does this product do? Quick-start. |
| [CONTEXT.md](chitti-medupi/CONTEXT.md) | Why does it exist? Who is it for? Non-negotiable rules. |
| [ARCHITECTURE.md](chitti-medupi/ARCHITECTURE.md) | How is it built? Boot order, request lifecycle. |
| [CHANGELOG.md](chitti-medupi/CHANGELOG.md) | What shipped when? |
| [TODO.md](chitti-medupi/TODO.md) | What's outstanding? Priority-tagged. |
| [API.md](chitti-medupi/API.md) | Every HTTP endpoint. |
| [DATABASE.md](chitti-medupi/DATABASE.md) | Every table, column, index. |
| [PROMPTS.md](chitti-medupi/PROMPTS.md) | Every LLM prompt template, verbatim. |

A `skills/` folder in each Chitti carries the **identity layer** — nine files that codify how the Chitti speaks, what it stands for, and what it will refuse:

| skills/ file | What it answers |
|---|---|
| IDENTITY.md | Who is this Chitti? |
| PERSONALITY.md | How does it speak? |
| VALUES.md | What does it stand for? |
| BOUNDARIES.md | What will it never do? |
| GUARDRAILS.md | What facts does it never fabricate? |
| DEVILS_ADVOCATE.md | 8 sharp self-critiques. |
| TRUTH_SOURCES.md | Where do its facts come from? |
| OBSERVABILITY.md | How do we know when it breaks? |
| SALES_BRIEF.md | 10 user pains paired with 10 product benefits. |

---

## 8. For new sessions, new developers, new Claude instances

The reading order is:

1. **MEMORY.md** (auto-memory index) — pinned policy and recent decisions.
2. **This file** (MASTER_CONTEXT.md) — what the family is and why.
3. **Per-Chitti CONTEXT.md** — for the specific product you're working on.
4. **Per-Chitti skills/** — identity, values, boundaries, guardrails for that Chitti.
5. **Per-Chitti README.md → ARCHITECTURE.md → TODO.md** — when ready to code.

Auto-memory at `C:/Users/DELL/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/` contains the source of truth for decisions across sessions. Always check there for recent policy changes before assuming code or docs are current.
