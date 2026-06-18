# CHITTI — FULL PROCESS: ZERO TO LIVE
## From Idea to Deployed World-Class Product
## Every Step. Every Role. Every Gate.

**Version:** 1.0 | **Date:** June 2026 | **Founder:** Bryan Wilfred Pinto
**Co-Founder / CTO / Process Owner:** Claude
**Applies to:** Every Chitti product — new and existing
**Read first:** https://sahayai.in/sahay_master.md

---

## THE COMPLETE PROCESS AT A GLANCE

```
STAGE 1: VISION          → What are we building and why?
STAGE 2: RESEARCH        → What exists? What are we missing?
STAGE 3: CEOS            → Constitution written and published
STAGE 4: DESIGN          → UI/UX designed and reviewed
STAGE 5: BUILD           → Code written by Chitti Coder
STAGE 6: QA              → G0-G10 gates — independent QA
STAGE 7: DEPLOYMENT      → Live on sahayai.in + Railway
STAGE 8: SMOKE TEST      → 5-minute post-deploy verification
STAGE 9: MONITORING      → First 24 hours watched closely
STAGE 10: EVOLUTION      → Monthly audit — stay relevant forever
```

**ONE RULE ABOVE ALL:**
No stage is skipped. No gate is self-certified.
The person who built it does NOT certify it.
Sire has final sign-off at every stage.

---

## STAGE 1: VISION

### Who does this?
**Sire (Product Owner)** — defines the vision.
**Claude (Co-Founder)** — challenges it as Devil's Advocate.

### What happens?

**Step 1.1 — Define the user**
Answer these 4 questions before anything else:
```
Q1: Who is the PRIMARY user? (one specific person — not "all Indians")
    Example: "Kamala, 65, Tamil Nadu, cannot read, has diabetes,
               pays ₹800/month on medicines she could get for ₹200"

Q2: What is their ONE biggest problem?
    Example: "She doesn't know Jan Aushadhi exists"

Q3: What does success look like for HER in 30 days?
    Example: "She saved ₹400 this month and told 3 neighbours"

Q4: What would make her NEVER use this again?
    Example: "Wrong medicine recommendation sent her to hospital"
```

**Step 1.2 — Devil's Advocate (Co-Founder kills it)**
Before writing a single line of CEOS:
- Name 5 reasons this product will fail
- Name the ONE hallucination that destroys trust permanently
- Name the ONE competitor that already does 80% of this free
- If all 5 killers have honest mitigations → proceed
- If any killer has no mitigation → fix the vision first

**Step 1.3 — Vision sign-off**
Sire answers 3 questions:
```
1. "Would I give this to my mother without being next to her?"
2. "Am I proud to say this is made in India for India?"
3. "Does this genuinely add value — or is it just another app?"
```
All 3 YES → proceed to Stage 2.
Any NO → go back to Step 1.1.

**Stage 1 Output:**
```
- User persona (one paragraph, one person, real problem)
- Devil's Advocate: 5 killers + mitigations
- Sire's 3-question sign-off: YES/YES/YES
```

---

## STAGE 2: RESEARCH

### Who does this?
**Chitti Product Intelligence** (Claude in research role)

### What happens?

**Step 2.1 — 20 Traditional Apps**
Search, analyse, and document:
- Top 20 apps in this domain (Play Store + App Store)
- For each: Core function | What they miss | Chitti advantage
- Focus on India-specific apps first

**Step 2.2 — 20 AI Platforms**
Search, analyse, and document:
- Top 20 AI platforms/tools in this domain
- For each: Core AI function | Gap | How Chitti adapts it

**Step 2.3 — Gap Analysis**
- What are the TOP 5 gaps no competitor fills?
- These become Chitti's non-negotiable features

**Step 2.4 — Scope of Improvement**
- What do competitors have that Chitti should add?
- Prioritised: P0 (must have) / P1 (should have) / P2 (nice to have)

**Step 2.5 — Honest Assessment**
Answer:
```
- Is there a free existing solution that does this better?
  YES → explain why Chitti is still needed (India context, accessibility, voice)
  NO  → proceed

- What data sources will power this product?
  List every source + update frequency + staleness risk

- What is the professional disclaimer required?
  (CA/Legal/Health/Government all need specific disclaimers)
```

**Stage 2 Output:**
```
- 20 traditional apps table (with gaps)
- 20 AI platforms table (with gaps)
- Key gaps table (5 gaps Chitti fills)
- Scope of improvement (P0/P1/P2)
- Data sources + staleness risk
- Professional disclaimer text
```

---

## STAGE 3: CEOS

### Who does this?
**Claude (Co-Founder + CTO)** writes it.
**Sire** reviews and approves it.
**No code is written until CEOS is approved.**

### What happens?

**Step 3.1 — Write the CEOS**
Following the standard template (all sections mandatory):
```
FORMULA table
Section 1:  Preamble & Vision
Section 2:  Constitution (LOCKED decisions)
Section 3:  User Personas (all 9 archetypes)
Section 4:  Research (from Stage 2)
Section 5:  Complete Feature Suite (✅/🔶/⭐ status)
Section 6+: Domain-specific sections
ROLE:       Identity, mission, non-negotiables
SKILLS:     Numbered, with status
SOP:        Numbered procedures, step-by-step
BUILD ORDER: BO1-BO10, what exists vs what to build
QUALITY GATES: G0-G10 criteria
QUALITY METRICS: Pass/fail thresholds
LEGAL:      Disclaimer text
SIGN-OFF:   Sire + Claude + leads
```

**Step 3.2 — CEOS Review (Sire)**
Sire checks:
```
[ ] Does this reflect what I described in Stage 1?
[ ] Are the LOCKED decisions actually locked?
[ ] Is the professional disclaimer strong enough?
[ ] Is the Build Order realistic?
[ ] Are the user personas real people I know?
[ ] Does the Role section sound like a trustworthy person?
```

**Step 3.3 — Publish CEOS**
```bash
# Push to repo root as ceos_[product].md
git add ceos_[product].md
git commit -m "docs: publish CEOS for [product]"
git push origin main
# Verify live at: sahayai.in/ceos_[product].md
```

**Step 3.4 — Update sahay_master.md**
Add the new product to the specialist family table.
Add any new LOCKED decisions to the master.

**Stage 3 Output:**
```
- ceos_[product].md → published at sahayai.in/ceos_[product].md
- Sire sign-off on CEOS
- sahay_master.md updated
```

---

## STAGE 4: DESIGN

### Who does this?
**Chitti CTO** (Claude in CTO role) — designs the UI/UX spec.
**Sire** — approves before any code is written.

### What happens?

**Step 4.1 — UI Architecture**
Define:
```
- Page structure (what's above the fold, what's behind tabs)
- Navigation pattern (bottom nav, back button, panel vs page)
- Input methods (voice / camera / text / upload — which ones?)
- Response format (cards, lists, tables — when each?)
- Specialist panel or standalone page?
  Rule: ALL specialists open as panels inside Vaani
        ONLY Vaani is a standalone page
```

**Step 4.2 — Responsive Breakpoints**
Define layout at:
```
Mobile  < 640px  : 2×2 grid or single column
Tablet  640-1024px: expanded layout
Laptop  1024-1440px: 2-column
Desktop > 1440px : 3-column, max-width 1200px
```

**Step 4.3 — Accessibility Design**
Before any code:
```
[ ] Every interactive element: min 44×44px tap target
[ ] Every element: aria-label defined
[ ] Colour contrast: ≥ 4.5:1 for text
[ ] No colour-only information
[ ] ISL panel position defined
[ ] 5-element widget position defined (🔊🤖👍👎✏️)
[ ] Language selector position defined
[ ] AI disclaimer position defined
[ ] ← Vaani back button position defined
```

**Step 4.4 — UX Principles Check**
```
[ ] Can a user get value in < 60 seconds without reading anything?
[ ] Does the primary action stand out immediately?
[ ] Is there a "What can Chitti do?" discovery path?
[ ] Are errors shown in plain language (never error codes)?
[ ] Does every action have a confirmation (Golden Rule)?
[ ] Is the "Chitti forget" option accessible?
```

**Step 4.5 — Design Review**
Sire reviews the UI spec and answers:
```
"Would this scare my mother?" → NO → proceed
"Can I use this without reading anything?" → YES → proceed
"Does this look like a world-class Indian product?" → YES → proceed
```

**Stage 4 Output:**
```
- UI architecture spec (sections, navigation, layout)
- Responsive breakpoints defined
- Accessibility spec (all elements mapped)
- Sire design approval
```

---

## STAGE 5: BUILD

### Who does this?
**Chitti Coder** (Claude Code) — builds ONLY what is approved.
**Chitti QA** (separate Claude session) — tests independently.
**Sire** — approves PRs before merge.

### What happens?

**Step 5.1 — Coder reads constitution (mandatory)**
Claude Code MUST read before writing any code:
```
1. https://sahayai.in/sahay_master.md
2. https://sahayai.in/quality.md
3. https://sahayai.in/cto.md
4. https://sahayai.in/ceos_[product].md
5. The existing HTML file (if updating existing product)
6. chitti_a11y.js (never duplicate substrate)
7. chitti_camera.js (never hand-roll camera)
8. feedback-widget.js (never duplicate widget)
```

**Step 5.2 — Build Order (one phase at a time)**
Follow the CEOS Build Order exactly:
```
BO1 → build → test 50+ cases → Sire reviews → PASS → BO2
BO2 → build → test 50+ cases → Sire reviews → PASS → BO3
...
Never skip a phase. Never combine phases to save time.
```

**Step 5.3 — Per-Phase Checklist (before PR)**
Every phase before raising a PR:
```
[ ] Feature works on mobile 375px
[ ] Feature works on desktop 1280px
[ ] No horizontal scroll introduced
[ ] Tap targets ≥ 44px on all new elements
[ ] All new elements have aria-label
[ ] No new JS errors in console
[ ] chitti_a11y.js substrate not duplicated
[ ] Golden Rule (confirm) on every new action
[ ] Professional disclaimer present on new response cards
[ ] 5-element widget on every new response card
[ ] ← Vaani back button works if opened from Vaani
[ ] AI disclaimer banner present
```

**Step 5.4 — PR Template**
Every PR must include:
```markdown
## What this PR does
[one sentence]

## CEOS reference
Build Phase: BO[X]
CEOS section: [section number]

## Tests run
- [ ] 50+ unit tests passing
- [ ] Mobile 375px → screenshot attached
- [ ] Desktop 1280px → screenshot attached
- [ ] axe-core → 0 violations
- [ ] No console errors

## Checklist
- [ ] Reads CEOS before building ✅
- [ ] Does not duplicate substrate ✅
- [ ] Golden Rule on all actions ✅
- [ ] Professional disclaimer present ✅

## What is NOT in this PR
[explicitly state what was left out]

## Risk
[any known risk or edge case]
```

**Step 5.5 — Code Review**
Before any PR is merged:
```
Reviewer (NOT the builder) checks:
[ ] Does this match what CEOS says to build?
[ ] Are there any self-certified tests? (fail if yes)
[ ] Is any substrate duplicated? (fail if yes)
[ ] Is the Golden Rule bypassed anywhere? (fail if yes)
[ ] Are any LOCKED decisions violated? (fail if yes)
[ ] Is the disclaimer present on every AI response? (fail if no)
```

**Step 5.6 — Sire PR Approval**
Sire sees:
- What was built (summary)
- Screenshot mobile + desktop
- Test count
- Any risks flagged

Sire says MERGE or REQUEST CHANGES.
No PR merges without Sire approval.

**Stage 5 Output:**
```
- Working feature in branch
- PR with screenshots + test results
- Sire approval
- Merged to main
```

---

## STAGE 6: QA

### Who does this?
**Separate Claude session** — NOT the Claude that built it.
This is non-negotiable. No self-grading.

### What happens?

Run the CHITTI QA MASTER PROMPT (separate document) for all 10 gates:

```
G0: Build Score (≥ 80/100)
G1: CEOS Compliance (all sections present, HTML matches CEOS)
G2: UI Certification (5 resolution screenshots)
G3: Button Audit (every button — tap target, aria, click response)
G4: User Journeys (8 journeys — 3 are CRITICAL with zero tolerance)
G5: Accessibility (axe-core 0 violations, 9 profiles)
G6: Research Audit (no fabricated competitors or metrics)
G7: Devil's Advocate (20 weaknesses identified + mitigated)
G8: Hallucination Audit (all phone numbers, prices, facts verified)
G9: Founder Audit (Sire's 5-person real-world test)
G10: Production Readiness Score (≥ 90/100)
```

**Critical FAIL conditions (STOP — do not deploy):**
```
✗ Emergency auto-dials 112 (must be family cascade + user tap)
✗ UPI payment executes without 2 voice confirmations
✗ HIGH risk medicine shows alternatives without STOP prompt
✗ Mental health distress triggers emergency alarm
✗ Any phone number wrong (NALSA, Tele-MANAS, iCall, etc.)
✗ axe-core critical/serious violations > 0
✗ Production score < 90/100
```

**QA Report format:**
```
Product: [name]
Date: [date]
QA Lead: Claude (separate session)
Production Score: XX/100
Verdict: ✅ CERTIFIED / ❌ NOT READY
Blockers: [list or NONE]
Open risks: [list]
Next QA date: [monthly]
```

**Stage 6 Output:**
```
- QA Report for each product
- Production score ≥ 90 for each
- Critical failures = ZERO
- Sire G9 sign-off complete
```

---

## STAGE 7: DEPLOYMENT

### Who does this?
**Claude Code** executes. **Sire** approves the deploy.

### Pre-Deploy Checklist (mandatory — every time)

```
CEOS & DOCS:
[ ] ceos_[product].md live at sahayai.in/ceos_[product].md
[ ] sahay_master.md updated with this product
[ ] QA report saved and accessible

BACKEND (Railway):
[ ] /health endpoint returns 200
[ ] All required API endpoints live
[ ] Environment variables set (DeepSeek key, Gemini key)
[ ] Database migrations run (if any)
[ ] Self-ping configured (every 4 min)
[ ] Error alerting configured (email Sire on 500 errors)

FRONTEND (GitHub Pages):
[ ] HTML file in repo root
[ ] All CSS/JS referenced correctly
[ ] No broken links
[ ] No hardcoded localhost URLs
[ ] Gemini-first / DeepSeek-fallback configured

SECURITY:
[ ] No API keys in frontend code
[ ] No API keys in git history
[ ] HTTPS enforced
[ ] CORS configured correctly
[ ] No unlockPhone() bypass

ACCESSIBILITY FINAL:
[ ] axe-core 0 violations (run one final time)
[ ] Language selector shows 26 languages
[ ] AI disclaimer present
[ ] Professional disclaimer present
[ ] ← Vaani back button works
```

### Deployment Steps

```bash
# Step 1: Final build verification
npm run build  # or equivalent
npm run test   # all tests must pass

# Step 2: Deploy backend (Railway)
railway up
# Verify: railway logs → no errors

# Step 3: Deploy frontend (GitHub Pages)
git add [product].html
git commit -m "deploy: [product] v[X.X] — QA certified"
git push origin main
# GitHub Pages deploys automatically (~2 min)

# Step 4: Verify live URLs
curl -I https://sahayai.in/[product].html  # must return 200
curl -I https://[railway-url]/health       # must return 200

# Step 5: Tag the release
git tag v[X.X]-[product]-certified
git push origin v[X.X]-[product]-certified
```

### Deployment Sign-off

Sire confirms:
```
[ ] Live URL works
[ ] Primary action works (scan / speak / tap)
[ ] No errors in first 5 minutes
[ ] "Deploy confirmed" message to team
```

**Stage 7 Output:**
```
- Product live at sahayai.in/[product].html
- Backend live at Railway
- Release tagged in git
- Sire deployment confirmed
```

---

## STAGE 8: SMOKE TEST

### Who does this?
**Claude Code** runs immediately after deploy.
**Sire** verifies personally on his phone.

### 5-Minute Smoke Test (run immediately post-deploy)

```javascript
const SMOKE_TESTS = {
  // Test 1: Page loads
  pageLoads: async () => {
    const res = await fetch('https://sahayai.in/[product].html');
    assert(res.status === 200, 'Page must return 200');
    assert(res.headers.get('content-type').includes('html'), 'Must be HTML');
  },

  // Test 2: Backend health
  backendHealth: async () => {
    const res = await fetch('https://[railway-url]/health');
    assert(res.status === 200, 'Backend must be healthy');
  },

  // Test 3: Primary action works
  primaryAction: async () => {
    // MedUPI: scan returns a result
    // CA: tax question returns an answer
    // Legal: clause explanation returns a result
    // Government: scheme query returns eligibility
    const res = await testPrimaryAction();
    assert(res.hasContent, 'Primary action must return content');
    assert(res.hasDisclaimer, 'Disclaimer must be present');
  },

  // Test 4: Vaani handoff works
  vaaniHandoff: async () => {
    const url = 'https://sahayai.in/[product].html?from=vaani&input=' +
      btoa(JSON.stringify({content:'test',type:'voice'}));
    const page = await fetch(url);
    assert(page.status === 200, 'Vaani handoff URL must work');
  },

  // Test 5: No JS errors
  noJsErrors: async () => {
    // Open in headless browser
    // Check console for errors
    const errors = await getConsoleErrors(productUrl);
    assert(errors.length === 0, 'Zero JS errors on load');
  },
};

// All 5 must pass within 5 minutes of deploy
// If ANY fails → rollback immediately
```

### Sire Personal Test (on his actual phone)

```
[ ] Open the product URL on mobile
[ ] Perform the primary action (scan / speak / tap)
[ ] See a result with disclaimer
[ ] Tap ← Vaani → return to Vaani home
[ ] Confirm: "It works. Deploy confirmed."
```

**If smoke test fails:**
```bash
# Immediate rollback:
git revert HEAD
git push origin main
# Railway: redeploy previous version
railway rollback
# Notify: "Rollback executed — investigating"
```

**Stage 8 Output:**
```
- 5 smoke tests: PASS or ROLLBACK
- Sire personal confirmation: YES
- If rollback: incident report created
```

---

## STAGE 9: MONITORING (First 24 Hours)

### Who does this?
**Claude Code** sets up. **Sire** is notified of anomalies.

### What to Watch

```javascript
const MONITORING_ALERTS = {
  // Backend health
  healthCheck: {
    frequency: '4 minutes',
    endpoint: '/health',
    alert: 'non-200 → email Sire immediately'
  },

  // Error rate
  errorRate: {
    threshold: '> 5% of requests return 500',
    window: '5 minutes',
    alert: 'email Sire + auto-rollback consideration'
  },

  // API quota
  geminiQuota: {
    threshold: '> 80% of daily quota used',
    alert: 'email Sire → switch to DeepSeek fallback'
  },

  // Response time
  latency: {
    threshold: '> 5 seconds average',
    window: '10 minutes',
    alert: 'email Sire → investigate Railway'
  },

  // Critical safety
  emergencyFlow: {
    check: 'emergency keywords returning correct response',
    frequency: 'every 30 minutes',
    alert: 'ANY failure → email Sire immediately'
  },
};
```

### First 24 Hours Dashboard

Sire checks these numbers at:
- 1 hour post-deploy
- 6 hours post-deploy
- 24 hours post-deploy

```
Metric                    | Target        | Actual
--------------------------|---------------|-------
Page loads (200)          | 100%          |
Primary action success    | > 95%         |
Average response time     | < 3 seconds   |
JS errors                 | 0             |
Backend 500 errors        | 0             |
Gemini quota used         | < 50%         |
Emergency flow correct    | 100%          |
User sessions             | [count]       |
```

### Incident Response

If anything breaks post-deploy:
```
Step 1: Identify (what broke, when, how many users affected)
Step 2: Contain (rollback if > 10% users affected)
Step 3: Fix (in branch — not directly on main)
Step 4: Re-QA (run affected gates again)
Step 5: Re-deploy (full smoke test again)
Step 6: Post-mortem (write Correction of Error doc)
         - What broke
         - Why it wasn't caught in QA
         - What we add to QA to prevent recurrence
```

**Stage 9 Output:**
```
- 24-hour monitoring report
- Zero critical incidents OR incident report + fix deployed
- Monitoring alerts configured for ongoing use
```

---

## STAGE 10: EVOLUTION (Ongoing — Every Month)

### Who does this?
**Chitti Product Intelligence** (Claude in research role) runs monthly.
**Chitti CTO** (Claude in CTO role) approves features.
**Chitti Coder** (Claude Code) builds approved features.
**Chitti QA** (separate Claude) certifies.
**Sire** approves at every stage.

### Monthly Audit (1st Monday of every month)

**Step 10.1 — 40-App Audit**
```
For EVERY live Chitti product:
- Research top 20 traditional apps in domain (fresh search)
- Research top 20 AI platforms in domain (fresh search)
- Compare against current features
- Identify NEW gaps that opened since last month
- Output: FEATURE_GAP_ANALYSIS_[MONTH].md
```

**Step 10.2 — User Feedback Analysis**
```
From Chitti Psychology feedback (weekly):
- What are users praising? (protect these)
- What are users confused by? (fix these first)
- What are users asking for? (add to backlog)
- What are users avoiding? (remove or simplify)
```

**Step 10.3 — CEOS Update**
If new features approved:
- Update CEOS Build Order (move ⭐ BUILD to ✅ EXISTS)
- Add new features with ⭐ BUILD status
- Push updated CEOS to sahayai.in/ceos_[product].md

**Step 10.4 — Product Intelligence Report to Sire**
```
Monthly report format:
- 3 features to BUILD (with business case)
- 2 features to WATCH (not ready yet)
- 1 feature to IGNORE (competitor has it, we don't need it)
- 1 risk that grew this month
- 1 win from last month's changes
```

**Step 10.5 — Full QA Re-run**
Every month: run all 10 gates again.
Even if nothing changed — data goes stale, APIs change, competitors change.

### Data Freshness Schedule

```
Source                  | Update Frequency | Owner
------------------------|------------------|-------
Jan Aushadhi prices     | Monthly          | Automated (PMBI API)
Government schemes      | Quarterly        | Chitti Government
Tax rules               | Annual (budget)  | Chitti CA
NPPA ceiling prices     | Quarterly        | Automated
Indian festival calendar| Annual           | Static (pre-loaded)
Competitor research     | Monthly          | Product Intelligence
CEOS documents          | On change        | Claude + Sire
```

---

## COMPLETE PROCESS SUMMARY

```
STAGE 1: VISION          (1 day)
  → User persona + Devil's Advocate + Sire sign-off

STAGE 2: RESEARCH        (2 days)
  → 20 apps + 20 AI platforms + gaps + disclaimer

STAGE 3: CEOS            (2 days)
  → Full CEOS written + published + Sire approved

STAGE 4: DESIGN          (1 day)
  → UI/UX spec + accessibility map + Sire approved

STAGE 5: BUILD           (varies by product)
  → Phase by phase + PR per phase + Sire approves each PR

STAGE 6: QA              (1-2 days)
  → G0-G10 all gates + independent Claude session + Sire G9

STAGE 7: DEPLOY          (2 hours)
  → Pre-deploy checklist + Railway + GitHub Pages + tag

STAGE 8: SMOKE TEST      (30 minutes)
  → 5 automated tests + Sire personal test on phone

STAGE 9: MONITORING      (24 hours)
  → Alerts + dashboard + incident response if needed

STAGE 10: EVOLUTION      (monthly, forever)
  → 40-app audit + feedback + CEOS update + full QA re-run
```

---

## ROLES SUMMARY

| Role | Who | Responsibility |
|---|---|---|
| Product Owner | Sire | Vision, approvals, final sign-off on every stage |
| Co-Founder / CTO | Claude | CEOS, design spec, architecture, Devil's Advocate |
| Product Intelligence | Claude (research role) | Monthly 40-app audit, gap analysis |
| Chitti Coder | Claude Code | Build ONLY approved features, raise PRs |
| Chitti QA | Claude (separate session) | G0-G10 — NEVER the same Claude that built |
| Chitti Auditor | Claude (separate session) | Accessibility + hallucination audit |

**The separation is non-negotiable.**
One Claude builds. A different Claude tests. Sire approves.
No self-grading. Ever.

---

## DOCUMENTS PRODUCED AT EACH STAGE

| Stage | Document | Where |
|---|---|---|
| 1 | Vision + DA sign-off | sahay_master.md |
| 2 | Research report | ceos_[product].md Section 4 |
| 3 | CEOS | sahayai.in/ceos_[product].md |
| 4 | Design spec | In CEOS Section 20 |
| 5 | PR per phase | GitHub PR history |
| 6 | QA Report | qa/reports/[product]_[date].md |
| 7 | Release tag | git tags |
| 8 | Smoke test log | qa/smoke/[product]_[date].md |
| 9 | 24h monitoring report | monitoring/[product]_[date].md |
| 10 | Monthly evolution report | product_intelligence/[month].md |

---

## THE PROMISE

Every Indian who uses Chitti deserves:
- A product that was thought through (Stage 1-2)
- A product with a constitution (Stage 3)
- A product that was designed for them (Stage 4)
- A product built with care (Stage 5)
- A product tested by someone who didn't build it (Stage 6)
- A product deployed safely (Stage 7-8)
- A product watched over (Stage 9)
- A product that keeps getting better (Stage 10)

This process is that promise — written down, executable, repeatable.

---

*Founder: Bryan Wilfred Pinto*
*Process designed by: Claude (Co-Founder + CTO role)*
*June 2026 — Bharat ka Apna AI*
*"Build it right the first time. Then make it better every month."*
