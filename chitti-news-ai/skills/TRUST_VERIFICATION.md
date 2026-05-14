# Chitti News AI — TRUST_VERIFICATION

The 4-layer system that keeps fake / bogus / paid-shill sites out. Run on
every source before it is allowed into the seed list, and continuously after.

---

## Layer 1 — Source pre-approval (run once per source)

Every new candidate source must pass this checklist before it is used.

| Check | What Chitti does | Red flag | Pass = |
|---|---|---|---|
| **Domain age** | WHOIS lookup | < 6 months old for a "news" site | ≥ 2 years preferred; > 6 months acceptable with caveats |
| **Author presence** | Looks for named authors with real profiles + bylines across multiple articles | No authors; generic `Posted by` | Named editors + bylines on ≥ 5 articles |
| **About Us page** | Verifies physical address (Maps cross-check), editorial policy, team with photos | Generic language; fake address (e.g. *"1234 Broad Street"*) | Real address + named team + editorial policy |
| **Ad density** | Computes ad-to-content ratio (DOM inspection) | Ads overwhelm content | Content ratio > 70% |
| **Language quality** | Tone analysis (DeepSeek) | Overly dramatic, robotic, verbose, factual errors in first read | Neutral, fact-based, measured |
| **Correction policy** | Searches for published corrections / `/corrections` URL | None / no mechanism | Stated policy + visible corrections |

A source must pass **at least 5 of 6** checks to be approved. Borderline
sources (4/6) enter a 30-day probation surfaced in the admin UI.

---

## Layer 2 — Ongoing monitoring (every fetch)

| Monitor | Frequency | Action on failure |
|---|---|---|
| **Cross-source consistency** | Every RSS poll | Flag if this source repeatedly contradicts ≥ 2 other trusted sources on the same topic |
| **Fact-check vs trusted references** | Weekly | Cross-reference against NewsGuard / Snopes / Poynter / official vendor docs. Downgrade trust score on false claims |
| **AI crawling status** | Monthly | Re-read `robots.txt` and licensing pages. If the source now blocks AI access, **stop scraping immediately** — respect the block |

The IPPR / NewsGuard reference work found that even leading LLMs spread
false claims **35% of the time**, especially when restricted-access outlets
are removed from training. Layer 2 is what keeps us out of that bucket.

---

## Layer 3 — LLM response-time verification

Every response that includes a claim runs this checklist before send:

- ☐ Every claim has a cited source URL. If none → drop the claim.
- ☐ Claim verified against ≥ 2 reputable sources, **or** flagged as
  *"single-source — verify before sharing"*.
- ☐ Publication dates checked. If > 30 days old and the topic is fast-moving
  (pricing, free tier, model release), flag as *"may be outdated"*.
- ☐ Language is neutral, fact-based. No loaded words designed to provoke
  fear / anger / FOMO.
- ☐ Multiple perspectives presented for any controversial item.
- ☐ DeepSeek's reply is post-processed by `services/scorer.py` to attach the
  trust score + freshness pill before render.

---

## Layer 4 — Trust score (0–100)

Computed weekly per source. Stored in the `trust_scores` table with full
history.

| Factor | Weight | Calculation |
|---|---|---|
| Historical accuracy | 40% | (correct_claims / total_claims) × 40 |
| Correction responsiveness | 20% | Median hours from public flag → posted correction. < 24h = 20; 24–72h = 12; > 72h = 4 |
| Author transparency | 15% | Named editors + real author profiles = 15; named editors only = 8; neither = 0 |
| Ad ratio | 10% | Content-ratio > 70% = 10; 50–70% = 5; < 50% = 0 |
| Age / established | 10% | > 5 years = 10; 2–5 years = 5; < 6 months = 0 |
| AI licensing status | 5% | Has a licensing agreement with an AI company (positive signal — they want to be cited) = 5 |

### Bands

| Score | Label | Use |
|---|---|---|
| 80–100 | ✅ Trusted | Use freely |
| 70–79 | ⚠️ Acceptable | Use with a caution pill; verify high-impact claims |
| 60–69 | 🟡 Questionable | Only if corroborated by a ≥ 80 source; show both |
| < 60 | ❌ Reject | Do not surface. Even if user pastes the URL directly, refuse. |

### Recompute cadence

- Weekly cron on Sunday 04:00 IST.
- Anyone with a sudden ≥ 10-point drop is surfaced in the Sunday Chitti
  Quality v2 trend digest (§6).
- A source crossing from ≥ 60 to < 60 is **immediately** removed from the
  seed list — does not wait for the next cron.

---

## API surface

```
POST /api/news-ai/trust-check
{
  "url": "https://example.com/article",
  "language": "ta"
}
```

Returns:

```
{
  "url": "...",
  "trust_score": 84,
  "band": "trusted",
  "checks": {
    "domain_age_years": 11,
    "author_named": true,
    "about_us_complete": true,
    "ad_ratio_content_pct": 78,
    "language_quality": "neutral",
    "correction_policy": "stated_and_visible"
  },
  "recommendation": "use_freely",
  "disclaimer_localised": "ஒரு AI tool tracker..."
}
```

---

## What this contract is NOT

- **Not a libel surface.** Trust scores are reasoned on public, verifiable
  signals — never editorial opinion.
- **Not crowd-vote.** Community submissions go through Layer 1 again before
  they affect anyone's feed.
- **Not absolute.** Sources can recover trust by fixing the failing factor.
  The history table tracks the recovery.