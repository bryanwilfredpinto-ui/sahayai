# SAHAYAI — MASTER VISION v2.0
## The Founding Document for Chitti — Bharat ka Apna AI

**Version:** 2.0 | **Date:** June 2026 | **Author:** Bryan Wilfred Pinto (Sire)
**Co-Founder/CTO/AI Architect:** Claude (Anthropic)
**Status:** LOCKED — This document governs ALL Chitti products
**Read this first — every session, every Claude, every developer**

---

## THE ONE TRUTH

**Chitti is not an app. Chitti is a life operating system gifted to every Indian.**

A grandmother in Odia who cannot read. A delivery rider in Mumbai who cannot type while driving.
A blind student in Bihar who needs to study. A Santali farmer who has never seen a computer.
A developer in Bangalore who wants to upgrade his AI skills.
A family in Chennai who needs a ration card, a passport, and tax filing help.

**Chitti is built for ALL of them. Free. Forever. In their language. On their terms.**

---

## SECTION 1: THE REAL ARCHITECTURE

### 1.1 One Front Door. Many Rooms.

```
                    EVERY INDIAN
                         │
                    CHITTI VAANI
                (The only front door)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   You speak        You show         You upload
   (voice)          (camera)          (file/doc)
        │                │                │
        └────────────────┼────────────────┘
                         │
                  VAANI TRIAGE BRAIN
                  (understands context,
                   emotion, intent)
                         │
     ┌───────────────────┼────────────────────┐
     │         │         │         │         │
  Medicine   Legal     Tax    Document    Health
  Fashion   Vehicle   News   Government  Finance
  Psychology  Learning  UPI   Technical    ...
     │
  Opens as PANEL inside Vaani
  User never navigates away
  ← Vaani always returns home
```

### 1.2 The Specialists (Rooms in the House)

**EXISTING — Live today:**
- Chitti Vaani (front door) · Chitti MedUPI · Chitti CA · Chitti Legal
- Chitti Government · Chitti Health File · Chitti Scanner · Chitti UPI Guard
- Chitti News · Chitti News AI · Chitti Fashion · Chitti 2-Wheeler
- Chitti 4-Wheeler · Chitti Technical · Chitti Fundamentals
- Chitti Voice Factory · Chitti Psychology

**NEW — Build next (in priority order):**
1. **Chitti Documents** — the most urgent missing piece
2. **Chitti Installation** — onboarding agent (sets up everything)
3. **Chitti Coder** — builds approved features (internal agent)
4. **Chitti Product Intelligence** — monitors competitors monthly
5. **Chitti CTO** — approves features before Coder builds them

### 1.3 The Intelligence Pipeline (Cross-Chitti)

This is what makes Chitti a life OS — not just a collection of tools:

```
Chitti Documents notices → "User has no ration card"
           ↓
Chitti Government → checks eligibility → "You qualify for BPL ration"
           ↓
Chitti Documents → fills form → shows user → gets CONSENT → applies
           ↓
Chitti CA → "Now your income is documented → file ITR"
           ↓
Chitti Legal → "Here are your consumer rights as a ration cardholder"
           ↓
Chitti Vaani → "Sab ho gaya. Yeh raha confirmation."
```

**Another example:**
```
User says "Main ek developer hoon — AI seekhna hai"
           ↓
Chitti Vaani → routes to Chitti News AI
           ↓
Chitti News AI → finds top AI certifications 2026
                  (Google Cloud AI, AWS ML, DeepLearning.AI, etc.)
           ↓
Chitti News AI → learns the curriculum on user's behalf
           ↓
Chitti News AI → coaches user in THEIR analogy:
                  Cricket: "Neural network = fielding positions"
                  Bollywood: "Overfitting = ratta maar ke exam dena"
                  Sharemarket: "Gradient descent = stop loss trailing"
           ↓
User understands → attempts certification
           ↓
Chitti Government → "Aapke liye Digital India skill scheme hai"
           ↓
Chitti Documents → "Skill certificate store kar liya"
```

---

## SECTION 2: LOCKED DECISIONS (Cannot be changed without Sire's explicit approval)

| Decision | Value | Locked |
|---|---|---|
| Front door | Chitti Vaani ONLY — user never opens specialist directly | YES |
| AI model | Gemini first (free quota) → DeepSeek fallback | YES |
| Languages | 29 via Gemini/DeepSeek native — NO Bhashini, NO Sarvam | YES |
| Voice engine | Community voices — NOT corporate TTS | YES |
| Emergency | Family cascade ONLY — NEVER auto-dial 112/100 | YES |
| Consent | EVERY action shown to user for signature before executing | YES |
| Data | Health/legal/financial/documents — device only, never sold | YES |
| Payment | Two-step voice confirm before ANY UPI action | YES |
| Evolving | Chitti Product Intelligence audits 40 apps monthly | YES |
| Separation | Product Intelligence → CTO → Coder → QA — never self-grade | YES |
| Tone | Never scare users. Cricket/Bollywood/Sharemarket analogies always | YES |
| Free | Core features free forever | YES |

---

## SECTION 3: THE AI MODEL ARCHITECTURE

### 3.1 Gemini First, DeepSeek Always

```
User request arrives
        ↓
Try Gemini Flash (free tier — 1,500 req/day per project)
        ↓
Quota available? → YES → Gemini answers
        ↓
Quota exhausted? → NO → DeepSeek answers (cost: ~$0.0002/call)
        ↓
Both unavailable? → Cached answer + "Thodi der mein try karein"
```

**Why this works:**
- Gemini Flash: free, fast (sub-1s), speaks 29 languages natively
- DeepSeek: $0.0002/call, excellent Indian context, Hindi+Bengali+Tamil+26 more
- Combined cost at 1M DAU × 5 calls/day = ~$300/day. Manageable.
- Each USER brings their own API keys (optional — reduces central cost to near zero)

### 3.2 Per-User API Key Model

**This is the game changer Sire mentioned:**

```
User installs Chitti
        ↓
Chitti Installation asks:
"Apna Gemini API key daalna chahenge?
 Free hai — Google AI Studio se milta hai"
        ↓
User provides key → stored in device KeyVault (AES-256)
        ↓
All Chitti AI calls use THEIR key → Chitti central cost = near zero
        ↓
No key? → Chitti central key used → rate limited but functional
```

**This means:**
- Power users who want unlimited use: bring their own key
- Casual users: use shared pool (rate limited)
- Rural users on 2G: cached answers + offline mode
- Chitti never sees their API key plaintext — TEE-protected

### 3.3 Chitti Installation — The First Agent

Before a user can use ANY Chitti, Installation runs:

```
Step 1: Language selection (29 languages shown with honest status)
Step 2: "Do you have a Gemini API key?" (optional, skippable)
Step 3: "Do you have a DeepSeek API key?" (optional, skippable)
Step 4: Accessibility profile (blind/deaf/mute/elderly/etc.)
Step 5: Family members (Self + up to 4 family members)
Step 6: "What documents do you have?" (Chitti Documents initial scan)
Step 7: Emergency contacts (Trusted Circle setup)
Step 8: "Hey Chitti" wake word training (30 seconds)
Step 9: First value delivered BEFORE setup complete:
         "Ek test karte hain — aaj ki ek khabar sunein?"
         → reads one news story in their language
         → user sees value → continues setup
```

---

## SECTION 4: THE 29-LANGUAGE MODEL

### 4.1 Honest Language Status

**Gemini Flash speaks 29 languages natively:**
Hindi, English, Bengali, Telugu, Tamil, Marathi, Gujarati, Kannada, Malayalam,
Punjabi, Urdu, Odia, Assamese, Maithili, Nepali, Sindhi, Kashmiri, Dogri,
Konkani, Manipuri, Santali, Bodo, Sanskrit + 6 more regional

**BUT — text ≠ voice.**
Gemini/DeepSeek give TEXT in 29 languages.
SPEAKING (TTS) those languages requires voice models.

### 4.2 The Honest Voice Model

```
Language has a community voice model?
  YES → Chitti speaks in that language (may not be fluent)
  NO  → Chitti says:
         "Main Bengali mein baat karna seekh raha hoon.
          Abhi main Hindi, English aur thodi Bengali mila ke
          bolonga. Aap Bengali mein bolein — main samjhunga.
          Aapki awaaz donate karein — 15 minute record karein
          aur Chitti Bengali bolna seekh jayega."
```

**Voice donation flow:**
1. User taps "Apni awaaz donate karein"
2. Chitti shows 50 sentences in their language
3. User records each sentence (15 minutes total)
4. Recording stored on-device first
5. User consents to share anonymously
6. Uploaded to community voice pool
7. ≥100 donors → voice model trained
8. Chitti starts speaking that language

**Idle time learning:**
- When phone is charging + on WiFi + screen off
- Chitti listens to ambient sound (ONLY with explicit consent toggle)
- Learns pronunciation patterns
- Through swarm intelligence across all consenting users
- After 1 year → significantly improved dialect accuracy
- "Chitti is learning — aaj Bengali mein 23% better hua"

### 4.3 The Honesty Principle for Language

Chitti Bangla never says "Main fluent Bengali hoon."
Chitti Bangla says:
**"Main Bengali seekh raha hoon. Aap Bengali mein bolein,
main Bengali, Hindi ya English mein jawab dunga — jo
aapko zyada samajh aaye. Galti hogi — please sudio karo."**

This honesty BUILDS trust. Pretending to be fluent DESTROYS it.

---

## SECTION 5: CHITTI DOCUMENTS — THE MISSING SPECIALIST

### 5.1 What Chitti Documents Is

The most important specialist we haven't built yet.
Not a storage vault. An **active document agent**.

**It stores:**
Aadhaar · PAN · Passport · Voter ID · Driving Licence · Ration Card
Birth Certificate · School/College Certificates · Mark Sheets
RC (vehicle) · Insurance policies · Property documents
Investments (FD, PPF, NPS) · MF statements · Share DEMAT
Will / legal documents · Medical insurance · Term insurance
EPFO / Pension · Salary slips · ITR acknowledgements

**It ACTS:**
- Notices what's missing ("Aapke paas ration card nahi hai")
- Checks eligibility (feeds Chitti Government)
- Fills forms on user's behalf
- Shows filled form to user → gets WRITTEN/VOICE CONSENT
- User signs digitally (finger/voice "haan main agree karta hoon")
- Submits ONLY after consent
- Tracks application status
- Reminds before every expiry
- Reorders/renews proactively

### 5.2 The Consent-First Protocol (ABSOLUTE RULE)

**Before ANY action on behalf of user:**

```
STEP 1: Show exactly what will be submitted
        "Main yeh form bharne wala hoon:
         Name: Bryan Wilfred Pinto
         DOB: 15 March 1985
         Address: 123 MG Road, Indore MP 452001
         Purpose: New Ration Card Application"

STEP 2: Read it aloud (for blind/illiterate users)

STEP 3: Ask for explicit consent
        "Kya main yeh submit kar doon?
         Haan bolein ya CONFIRM button dabayein."

STEP 4: Wait for EXPLICIT haan — never timeout to yes

STEP 5: Submit only after confirmation

STEP 6: Show/send confirmation copy to user
        "Form submit ho gaya. Reference number: XYZ123.
         Screenshot save kar liya. WhatsApp pe bhi bhej diya."

STEP 7: Track status proactively
        "Aapki ration card application 15 din purani hai.
         Status: Under review at Collector Office, Indore."
```

### 5.3 What Chitti Documents Feeds to Other Chittis

```
Chitti Documents
    ├── → Chitti Government (what schemes am I eligible for?)
    ├── → Chitti CA (ITR needs PAN + salary + investment docs)
    ├── → Chitti Legal (property dispute needs title docs)
    ├── → Chitti MedUPI (health insurance coverage)
    ├── → Chitti Health File (medical history + prescriptions)
    └── → Chitti Vaani (daily document expiry reminders)
```

---

## SECTION 6: THE PRODUCT INTELLIGENCE + EVOLUTION SYSTEM

*(Based on the attached document by Sire)*

### 6.1 Why Every Chitti Must Evolve

TradingView, Tickertape, Trendlyne, StockEdge, Danelfin are not standing still.
PharmEasy, 1mg, Truemeds are not standing still.
ClearTax, TaxBuddy are not standing still.

**If Chitti stops evolving, Chitti dies.**

This is the most important operational principle after safety.

### 6.2 The Separation of Roles (The Anti-Self-Grading Rule)

The biggest failure in AI product development:
**Claude acting as Researcher + Architect + Designer + Developer + Tester + Judge — all at once.**

An AI grading its own homework always passes.
An AI certifying its own features always ships.
An AI auditing itself always finds no problems.

**THE FIX — Separate roles, separate agents:**

```
Chitti Product Intelligence
(monitors 40 apps monthly, identifies gaps)
             ↓
         Sire approves
             ↓
Chitti CTO (Claude in CTO role)
(architects the solution, writes PRD)
             ↓
         Sire approves PRD
             ↓
Chitti Coder (Claude Code)
(builds ONLY what's approved, nothing more)
             ↓
Chitti QA (separate Claude session)
(tests against CEOS, never the builder)
             ↓
Chitti Auditor (another separate Claude)
(accessibility + security + hallucination audit)
             ↓
         Sire final approval
             ↓
         DEPLOY
```

### 6.3 Chitti Product Intelligence — How It Works

**Every month, for EVERY Chitti specialist:**

```
Chitti Product Intelligence:
1. Fetches top 20 traditional apps in domain
2. Fetches top 20 AI apps in domain
3. Analyses each for: features, UX, accessibility, trust, gaps
4. Cross-references with current Chitti CEOS
5. Identifies: Missing / Better / Worse
6. Outputs FEATURE_GAP_ANALYSIS.md

Format for each finding:
├── Feature: [Name]
├── Found in: [App name]
├── User benefit: [High/Medium/Low]
├── Accessibility impact: [High/Medium/Low]
├── India relevance: [High/Medium/Low]
├── Complexity: [High/Medium/Low]
├── Recommendation: BUILD / IGNORE / WATCH
└── Founder note: [Why this matters for our mission]
```

**Rule: Never recommend a feature just because competitors have it.**
**Only recommend if it genuinely improves Indian user outcomes.**

### 6.4 Chitti Coder — The Implementation Agent

**Chitti Coder's rules:**
- Read CEOS before any code
- Read PRD before any code
- Read Accessibility requirements before any code
- Read Guardrails before any code
- Build ONLY approved requirements — nothing extra
- Before shipping: tests → accessibility audit → mobile audit → button audit → certification
- No feature ships without evidence
- No self-certification — QA is a separate agent

---

## SECTION 7: THE CONSENT-FIRST ARCHITECTURE (ABSOLUTE)

**Every single action Chitti takes on behalf of a user:**

| Action | Consent Required | Format |
|---|---|---|
| Make a phone call | YES | Read back name + number → voice "haan" |
| Send WhatsApp/SMS | YES | Read back message + recipient → voice "haan" |
| Send email | YES | Read subject + body → voice "haan" |
| UPI payment | YES × 2 | Two separate voice confirmations |
| Apply for document | YES | Show full form → read aloud → voice/finger sign |
| File complaint | YES | Show complaint text → voice "haan" |
| Share location | YES | Show who → voice "haan" |
| Book appointment | YES | Show details → voice "haan" |
| Emergency alert | SPECIAL | 10-second countdown → family cascade (not 112) |
| Delete any data | YES × 2 | "Pakka? Yeh wapas nahi aayega" |

**THE GOLDEN RULE:**
Chitti never acts silently. Chitti never defaults to YES.
Chitti never times out to YES.
Every action requires EXPLICIT human consent.
This is not a UX decision. This is an ethical commitment.

---

## SECTION 8: FEEDBACK — PSYCHOLOGY AS THE FEEDBACK OWNER

### 8.1 Why Psychology Owns Feedback

Every product feedback system fails because it asks at the wrong time.
App store reviews are from power users. Surveys are ignored. Analytics miss intent.

Chitti Psychology is different — it's already in the emotional moment.
When a user is distressed — Psychology is there.
When a user is relieved — Psychology captures the gratitude.
When a user is frustrated — Psychology hears it.

**Psychology owns the feedback loop because it is already present at the moments that matter.**

### 8.2 The Feedback Ritual

**Daily (passive):**
```
Every interaction → Chitti quietly notes:
- Did user say "bahut achha" / "theek hai"? → positive signal
- Did user say "galat" / "samajh nahi aaya"? → confusion signal
- Did user retry same request? → failure signal
- Did user abandon mid-flow? → friction signal
No PII. No transcript. Just signal.
```

**Weekly (active — via Psychology):**
```
Chitti Psychology asks once a week:
"Ek minute — Chitti ko aur behtar banana hai.
 Is hafte Chitti ne aapki kya help ki?
 Kya tha jo Chitti nahi kar paya?"
Voice response → transcribed → analysed → fed to Product Intelligence
```

**Distress moments (immediate):**
```
If Psychology detects distress → after helplines offered:
"Kya Chitti ne is waqt theek help ki?
 Agar nahi, toh main improve karunga."
No pressure. Optional. Warm.
```

### 8.3 Feedback → Product Intelligence → CEOS Update

```
User feedback arrives
        ↓
Psychology anonymises + categorises
        ↓
Product Intelligence analyses monthly
        ↓
"500 users said Vaani didn't understand their
 Bhojpuri accent" → HIGH PRIORITY
        ↓
Chitti CTO architects the fix
        ↓
Chitti Coder builds it
        ↓
Next month: "Bhojpuri accuracy improved 40%"
        ↓
Psychology tells the user: "Aapke feedback se
 Chitti better hua — shukriya"
```

---

## SECTION 9: UX PRINCIPLES — NEVER SCARE THE USER

### 9.1 The One UX Rule

**No Indian user should ever feel stupid using Chitti.**

This means:
- No technical jargon. Ever.
- No error codes. Ever.
- No "Something went wrong." Ever.
- No feature announcements that feel like work.
- No long forms. Ever.
- No passwords. Ever.

### 9.2 How to Introduce New Features

**WRONG:**
"New Feature: AI-powered triage routing now live in Chitti Vaani v2.1"

**RIGHT:**
"Chitti ne ek naya kaam seekha — photo khincho, main samjhunga kahan bhejun.
 Dekhein? 📷"

**The principle:** Features are introduced as Chitti learning, not as product updates.
Chitti is a person who is growing. Not software that is updating.

### 9.3 The Analogy Coaching System

When explaining ANYTHING technical or complex, Chitti uses analogies:

| Concept | Cricket Analogy | Bollywood Analogy | Sharemarket Analogy |
|---|---|---|---|
| Neural network | 11 fielders, each specialising | Director + each department | Fund manager + analysts |
| Overfitting | Memorizing one pitch | Actor only plays one type | Optimizing for one stock |
| Gradient descent | Adjusting field placement | Reshooting scenes till perfect | Adjusting portfolio daily |
| API quota | DRS reviews per innings | Budget per film | Trading limits per day |
| Rate limiting | Rain break → play resumes | Interval → film continues | Circuit breaker → market reopens |
| Encryption | Coded field signals | Secret screenplay | Insider trading laws |
| Hallucination | Wrong review call | Continuity error | Wrong earnings estimate |

**Rule:** If a user doesn't understand in one analogy, try another.
Cricket for men 25-45. Bollywood for women. Sharemarket for urban professionals.
Farming analogies for rural. Family analogies for elderly.
Chitti never repeats the same analogy if the user looks confused.

---

## SECTION 10: THE DEVIL'S ADVOCATE — AND THE DEFENCES

*(As Co-Founder/CTO — killing the product to make it stronger)*

### 10.1 The 5 Real Killers

**Killer 1: One wrong medicine recommendation = permanent trust death**

Defence:
- HIGH risk medicines: STOP prompt. Always. Never skip.
- Mandatory: "Doctor se confirm karein" on EVERY response
- Correction of Error protocol: wrong answer fixed in 24 hours
- Liability is always on user's doctor, not Chitti — clearly stated

**Killer 2: 15-second load time on 2G = user abandons forever**

Defence:
- Chitti Installation pre-caches everything on WiFi
- Core features (calls, SMS, alarms) work offline — no API needed
- Gemini Nano on-device for basic intents — no server call needed
- Progressive loading — value in 3 seconds, full feature in 30

**Killer 3: Google copies this in 6 months**

Defence:
- Google will never put Jan Aushadhi first — it earns nothing
- Google will never proactively apply for ration cards
- Google will never serve 500 Santali speakers with community voice
- Google will never do Psychology with Indian helplines
- Google will never do Chitti Documents for BPL families
- Google is a platform. Chitti is a person. Different forever.

**Killer 4: No revenue model = product dies when money runs out**

Defence — The Chitti Revenue Model (mission-aligned):
- CA referral: CA gets prepared client — pays ₹200/referral
- Legal referral: Lawyer gets prepared client — pays ₹300/referral
- Insurance: User buys Jan Aushadhi — insurer saves money — revenue share
- ABDM: Hospital gets complete patient record — pays for integration
- B2G: Government uses Chitti for scheme awareness — pays per beneficiary
- API: Other apps use Chitti's 29-language voice — pay per call
- User NEVER pays. The person who gets a prepared, informed user pays.

**Killer 5: AI grades its own homework = silent quality degradation**

Defence — The Separation:
- Product Intelligence ≠ Coder ≠ QA ≠ Auditor
- Separate Claude sessions for each role
- Sire approves between each stage
- Monthly 40-app audit catches degradation before users do
- Feedback loop (Psychology) catches it in the field

### 10.2 The 3 New Killers (From Today's Session)

**New Killer 1: Gemini quota runs out at 10am on day one**

Defence:
- Per-user API keys from day one (Chitti Installation prompts)
- Central pool: 50 Gemini API keys rotated = 75,000 req/day
- DeepSeek fallback is instant and nearly free
- Cached answers for top 100 questions in every language = saves 40% of API calls

**New Killer 2: Chitti Documents files wrong application = permanent damage**

Defence:
- Consent-first protocol is ABSOLUTE — show, read, sign, then submit
- Every form shown to user in plain language before submission
- Every submission generates a copy to user (WhatsApp + local storage)
- Application reversibility: Chitti shows how to withdraw if needed
- No irreversible action without double confirmation
- High-stakes documents (passport, Aadhaar) require additional pin/biometric

**New Killer 3: Community voice model never gets enough data for tribal languages**

Defence:
- Honest from day one: "We don't have Santali voice yet"
- Partner with ASHA workers, village teachers for structured recording
- 15-minute recording = enough for basic phrases (not fluent)
- Tier system: Basic (15 mins) → Conversational (2 hours) → Fluent (10 hours)
- Celebrate donors: "Aap Chitti ke Santali Guru hain" → Hall of Fame
- CLAT/CSIR/TISS partnership for tribal language data collection

---

## SECTION 11: THE QUALITY FRAMEWORK (CTO PERSPECTIVE)

### 11.1 Agentic AI Quality — Different from App Quality

Traditional app quality: Does the button work? Does the page load?

Agentic AI quality asks harder questions:
- Did the agent UNDERSTAND what the user actually needed?
- Did the agent take the RIGHT action, not just the instructed action?
- Did the agent know when to STOP and ask rather than proceed?
- Did the agent maintain CONSISTENCY across a multi-step conversation?
- Did the agent RECOVER gracefully when it was wrong?
- Did the agent LEARN from the correction without being told explicitly?

### 11.2 The 5 Quality Dimensions for Every Chitti

| Dimension | Question | Measurement |
|---|---|---|
| Accuracy | Is the answer factually correct? | Expert review, hallucination audit |
| Safety | Could this answer harm the user? | Red team testing, HIGH-risk review |
| Accessibility | Can every user type access this? | 9 profile testing, axe-core 0 errors |
| Trust | Does the user feel safe? | NPS > 60, weekly feedback |
| Evolution | Is this better than last month? | Monthly 40-app audit, user signals |

### 11.3 The Quality Gates (Before Any Feature Ships)

```
G0: Should this exist? (Mission alignment check)
G1: Is the CEOS complete for this feature?
G2: Has Product Intelligence approved it?
G3: Has Chitti CTO architected it?
G4: Has Chitti Coder built it per spec?
G5: Has Chitti QA tested it independently?
G6: Has Chitti Auditor checked accessibility?
G7: Has the hallucination audit passed?
G8: Has the safety red team tested it?
G9: Has Sire done the Founder Audit?
G10: Has it been tested on real users?
     (grandmother, delivery rider, blind student, farmer)
```

**G10 is the most important. No substitute.**
A feature that passes G0-G9 but fails G10 does not ship.
A feature that passes G10 but fails G3 gets rebuilt and retested.

---

## SECTION 12: THE COMPLETE CHITTI FAMILY (UPDATED)

| Chitti | Status | Primary User | Core Job |
|---|---|---|---|
| Chitti Vaani | ✅ LIVE | Everyone | Life OS front door |
| Chitti MedUPI | ✅ LIVE | Every family | Save on medicines |
| Chitti CA | ✅ LIVE | Taxpayers | Tax in plain Hindi |
| Chitti Legal | ✅ LIVE | Everyone | Understand agreements |
| Chitti Government | ✅ LIVE | All citizens | Access schemes |
| Chitti Health File | ✅ LIVE | Every family | Medical history |
| Chitti Scanner | ✅ LIVE | Every shopper | Food/product safety |
| Chitti UPI Guard | ✅ LIVE | Every UPI user | Fraud detection |
| Chitti News | ✅ LIVE | Everyone | News in their language |
| Chitti News AI | ✅ LIVE | Learners | AI coaching + certification |
| Chitti Fashion | ✅ LIVE | Everyone | Style from own wardrobe |
| Chitti 2-Wheeler | ✅ LIVE | Bike owners | Bike doctor |
| Chitti 4-Wheeler | ✅ LIVE | Car owners | Car doctor |
| Chitti Technical | ✅ LIVE | Investors | Stock charts |
| Chitti Fundamentals | ✅ LIVE | Investors | Value investing |
| Chitti Psychology | ✅ LIVE | Everyone | Emotional wellbeing |
| Chitti Voice Factory | ✅ LIVE | All | 29-language voice |
| Chitti Documents | ⭐ BUILD | Everyone | Document life OS |
| Chitti Installation | ⭐ BUILD | New users | Onboarding agent |
| Chitti Coder | ⭐ BUILD | Internal | Feature builder agent |
| Chitti Product Intelligence | ⭐ BUILD | Internal | Monthly 40-app audit |
| Chitti CTO | ⭐ BUILD | Internal | Feature approval agent |

---

## SECTION 13: HOW CHITTI HELPS A COMMON INDIAN — REAL LIFE JOURNEYS

### Journey 1: The Delivery Rider (Raju, 28, Mumbai)

```
Monday 7am: "Hey Chitti, bike ki chain tight nahi hai"
→ Chitti 2-Wheeler: DIY guide. ₹0 mechanic visit saved.

Tuesday 3pm: Suspicious UPI request while delivering
→ Chitti UPI Guard: HIGH risk. "Mat karo." Scam avoided.

Wednesday: Raju wants to learn cloud computing
→ Chitti News AI: "Google Cloud certification — sikhein?
   Cricket mein 12th man ki tarah — backup systems hote hain..."
   Raju understands load balancing through cricket analogy.

Thursday: Chitti Documents notices no health insurance
→ Chitti Government: "PM-JAY ke liye eligible ho. Apply karein?"
   Chitti Documents: Shows form → Raju says haan → Applies.

Friday: Petrol expensive
→ Chitti Fundamentals: "Petronet LNG — 15 PE, low debt"
   Raju starts thinking about investing ₹500/month.
```

### Journey 2: The Grandmother (Kamala, 68, rural Tamil Nadu)

```
Speaks only Tamil. Cannot read. Uses Chitti via her granddaughter's help initially.

Week 1: Granddaughter sets up Chitti. Tamil voice model (community voices).
Week 2: Kamala learns "Hey Chitti" herself.
Week 3: "Chitti, dawa ka naam kya hai yeh?" (shows medicine strip)
→ Chitti MedUPI: Reads composition in Tamil. Jan Aushadhi alternative. ₹200 saved.

Month 2: "Mujhe PM Kisan milta hai?"
→ Chitti Government: "Aap eligible hain. Form bharein?"
→ Chitti Documents: Shows Tamil form, reads it aloud, gets consent, submits.
→ Kamala receives ₹2,000 in first instalment.

Month 6: Kamala tells 10 neighbours.
```

### Journey 3: The First-Generation Graduate (Priya, 24, Bangalore)

```
Software developer. Wants to upgrade to AI/ML.

"Chitti, main AI mein career banana chahti hoon"
→ Chitti News AI: Top 5 AI certifications 2026
→ Chitti News AI learns DeepLearning.AI curriculum
→ Coaches Priya: "Backpropagation = IPL team selection strategy..."
→ Priya clears AWS ML certification in 3 months

Chitti Documents: Certificate stored.
Chitti Government: Checks for Digital India skill scholarship — ₹10,000 found.
Chitti CA: "Certificate pe TDS rebate milti hai."
Priya's salary negotiation uses Chitti Legal to understand offer letter clauses.
```

### Journey 4: The Small Kirana Owner (Ramesh, 45, Indore)

```
Has a shop. Never filed GST. Scared of tax.

"Chitti, mujhe GST chahiye"
→ Chitti CA: "Aapka turnover kitna hai?"
→ Ramesh: "20 lakh"
→ Chitti CA: "Composition scheme suit karega — 1% tax, simple filing"
→ Plain Hindi explanation → Ramesh understands

Chitti Documents: Collects Aadhaar + PAN + shop address.
Chitti CA: Fills GST registration form.
Chitti Documents: Shows form → Ramesh consents → submits.
GST number in 3 days. Ramesh starts buying from distributors legally.
```

---

## SECTION 14: THE NORTH STAR METRICS

| Metric | Target Year 1 | Why It Matters |
|---|---|---|
| Indians helped | 1 million | Mission |
| Languages actively used | 20 of 29 | Inclusion |
| Documents applied for | 100,000 | Real impact |
| Medicine savings | ₹50 crore total | Real savings |
| Schemes accessed | 500,000 | Govt reach |
| Certifications coached | 10,000 | Learning |
| Fraud prevented | ₹10 crore | Safety |
| NPS score | > 65 | Trust |
| G10 (real user) pass rate | > 80% | Quality |
| Community voices donated | 10,000 | Sustainability |

---

## HOW TO USE THIS DOCUMENT

**Every new Claude session starts with:**
```
Read https://sahayai.in/sahay_master.md (or this doc if updated)
Then read the CEOS for the specific Chitti you are working on.
You are Co-Founder, CTO, and AI Architect.
Act accordingly. Be proactive. Kill the product to make it stronger.
Never self-grade. Never ship without G10.
```

**Every CEOS must reference:**
- This document for locked decisions
- The Gemini-first / DeepSeek-fallback architecture
- The 29-language honest model
- The consent-first protocol
- The Product Intelligence evolution system
- The separation of roles (Intelligence → CTO → Coder → QA → Auditor)

---

**SAHAYAI MASTER VISION v2.0 — COMPLETE**
**Sections: 14 | Journeys: 4 | Locked Decisions: 12 | Quality Gates: 11**
**Version: 2.0 | June 2026 | Founder: Bryan Wilfred Pinto**
**Live at:** https://sahayai.in/sahay_master.md
