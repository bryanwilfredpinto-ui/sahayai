// Phase 2 — append the mandatory CEOS plugins (Monthly Relevance Review · DA Kill Shots · DPDP)
// to every CEOS that lacks them. Domain-tailored. Idempotent guard: skips if marker already present.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const MARKER = '<!-- ceos-plugin:3435 -->';

function review(domainLines) {
  return [
    '**Owner:** Chitti CTO (Claude Code) + Sire approval',
    '**Cadence:** 1st Monday every month',
    '**Trigger:** chitti-founder cron',
    '',
    '**Review Checklist:**',
    ...domainLines.map(l => `- [ ] ${l}`),
    '- [ ] Any competitor added voice/Hindi in this domain?',
    '- [ ] Any regulatory change affecting this Chitti?',
    '- [ ] Any DA Kill Shot now becoming real?',
    '- [ ] THE FORMULA — any app to add/remove?',
    '',
    '**Output:** CEOS version bump + updated THE FORMULA + Sire notified via Vaani',
  ].join('\n');
}
function killshots(rows) {
  return [
    '| Kill Shot | Threat Level | Solution Built In |',
    '|---|---|---|',
    ...rows.map(r => `| ${r[0]} | ${r[1]} | ${r[2]} |`),
  ].join('\n');
}
function dpdp(dataCollected, extra = []) {
  return [
    '- **Data Fiduciary:** Sahay AI (Bryan Wilfred Pinto, Founder)',
    '- **Grievance Officer:** sire@sahayai.in | 7 working days',
    `- **Data collected:** ${dataCollected}`,
    '- **Consent:** explicit opt-in per domain',
    '- **Storage:** device UUID + Turso (India region only)',
    '- **User rights:** access, correct, erase, grievance',
    '- **"Chitti forget":** ALL data deleted within 24 hours',
    '- **Tombstone:** count preserved, PII deleted',
    ...extra.map(e => `- ${e}`),
  ].join('\n');
}

function block(nums, note, reviewBody, ksBody, dpdpBody) {
  const [a, b, c] = nums;
  return [
    '',
    '---',
    '',
    MARKER,
    `## SECTION ${a}: MONTHLY RELEVANCE REVIEW`,
    note ? `\n_${note}_\n` : '',
    reviewBody,
    '',
    '---',
    '',
    `## SECTION ${b}: DA KILL SHOTS & SOLUTIONS`,
    '',
    ksBody,
    '',
    '---',
    '',
    `## SECTION ${c}: DPDP ACT 2023 COMPLIANCE`,
    '',
    dpdpBody,
    '',
  ].join('\n');
}

const FILES = {
  'ceos_2wheeler.md': { nums: [33,34,35], note: '',
    review: review(['New 2-wheeler / EV-scooter brand needing DTC updates?', 'ARAI recall notices for 2-wheelers updated?', 'EV 2-wheeler market growth — features becoming P0?']),
    ks: killshots([
      ['GoMechanic / Bike Bazaar add 2W diagnosis', '🟡 MEDIUM', 'Chitti is free + voice + Hindi, buyer-side. They are booking/commerce-motivated'],
      ['OEM apps (Hero / Honda / TVS) add diagnosis', '🟡 MEDIUM', 'Brand-specific only. Chitti covers all brands'],
      ['Used-bike platforms add inspection', '🟡 MEDIUM', 'Seller-side inspection. Chitti is buyer-side'],
    ]),
    dpdp: dpdp('Vehicle profile (model/km/service/insurance/PUC dates), location rounded to city level') },

  'ceos_ca.md': { nums: [33,34,35], note: '',
    review: review(['Budget / Finance Act change affecting tax slabs?', 'GST rate or ITR form change?', 'ClearTax / Zoho add Hindi voice?']),
    ks: killshots([
      ['ClearTax / Zoho add Hindi voice', '🟡 MEDIUM', 'Chitti is free + voice-first + Govt-Benefits "money owed" moat'],
      ['Govt launches official AI tax assistant', '🟡 MEDIUM', 'B2G complex UI. Chitti is consumer-first, simple, voice'],
      ['LLM tax chatbots hallucinate numbers', '🔴 HIGH', 'Chitti money-math is deterministic — to the rupee, never hallucinated. Server-enforced disclaimer'],
    ]),
    dpdp: dpdp('Financial data (income, GST, transactions) — local-first; server-enforced disclaimer on every response', ['**Sensitive:** financial data treated as sensitive personal data; never sold, never used for ads']) },

  'ceos_empowerment.md': { nums: [33,34,35], note: '',
    review: review(['New book coaching content or seasonal festival wisdom to add?', 'Any quote mis-attributed — correctness audit?', 'Daily card freshness — repetition check?']),
    ks: killshots([
      ['Headspace / Calm add Hindi', '🟡 MEDIUM', 'Chitti is free + Indian wisdom (Ikigai / Gita / book coaching), not Western mindfulness only'],
      ['YouTube motivational creators in Hindi', '🟢 LOW', 'Chitti is a personalised daily card with memory + streak, not passive video'],
      ['Generic AI quote generators', '🟢 LOW', 'Chitti curates and attributes every quote; never fabricates a source'],
    ]),
    dpdp: dpdp('Daily-card preferences, streak, favourite themes — local only') },

  'ceos_fundamentals.md': { nums: [33,34,35], note: '',
    review: review(['SEBI rule change affecting disclosures?', 'screener.in schema / Nifty constituents changed?', 'Tickertape / Screener add Hindi voice?']),
    ks: killshots([
      ['Tickertape / Screener add Hindi voice', '🟡 MEDIUM', 'Chitti is voice-first + plain-Hindi + free, for non-English Tier-2/3 investors'],
      ['Broker apps add fundamental AI', '🟡 MEDIUM', 'Sell-motivated. Chitti is independent, no brokerage, no tips'],
      ['LLM stock chatbots hallucinate financials', '🔴 HIGH', 'Chitti is screener.in-grounded and cites the source; NOT SEBI REGISTERED banner always sticky'],
    ]),
    dpdp: dpdp('Watchlist + screening preferences — local only; no PII, no portfolio amounts stored', ['**Disclaimer:** NOT SEBI REGISTERED sticky bar + full legal modal on every page — never moved to footer']) },

  'ceos_government.md': { nums: [33,34,35], note: '',
    review: review(['New schemes from PIB poll to add?', 'Scheme deadline / eligibility changes?', 'MyScheme / UMANG add voice? DigiLocker partner status?']),
    ks: killshots([
      ['MyScheme / UMANG add voice', '🟡 MEDIUM', 'Govt complex UI. Chitti is simple voice + Readiness Score + Life-Event Engine'],
      ['State portals add AI scheme finder', '🟡 MEDIUM', 'Single-state. Chitti is all-India, offline-first deterministic'],
      ['Scheme-scam / fake-application sites', '🔴 HIGH', 'Chitti Fraud Shield flags scams; only official portal links surfaced'],
    ]),
    dpdp: dpdp('Eligibility profile (age, income, category, state, occupation) — local-first; DigiLocker partner-only flow') },

  'ceos_health_file.md': { nums: [33,34,35], note: '',
    review: review(['ABDM / ABHA record format or API change?', 'Practo / 1mg add personal health records?', 'New non-diagnostic health-vision capability ready?']),
    ks: killshots([
      ['ABDM / ABHA official app expands', '🟡 MEDIUM', 'Govt B2G. Chitti adds Guardian Memory + voice + four-user accessibility'],
      ['Practo / 1mg add health records', '🟡 MEDIUM', 'Commerce-motivated. Chitti is independent, no pharmacy/clinic selling'],
      ['AI symptom checkers claim diagnosis', '🔴 HIGH', 'Chitti NEVER diagnoses — always honest "doctor se milein". 501 coming_soon where vision unbuilt'],
    ]),
    dpdp: dpdp('Health records + scans (sensitive personal data) — on-device, never sold, never shared', ['**Sensitive:** health data under DPDP §2 — explicit per-record consent; raw images processed locally']) },

  'ceos_logo_video.md': { nums: [33,34,35], note: '',
    review: review(['Image/video generation API keys landed (un-stub)?', 'Canva / Looka add Hindi?', 'Video-gen models improved enough to ship real output?']),
    ks: killshots([
      ['Canva / Looka add Hindi', '🟡 MEDIUM', 'Chitti is free + voice for non-designer shopkeepers'],
      ['AI video tools flood the market', '🟡 MEDIUM', 'Chitti ships an honest stub until keys land, then community-powered — never fakes output'],
      ['Generic logo AI', '🟢 LOW', 'Chitti is India-context (shop names, festivals, vernacular)'],
    ]),
    dpdp: dpdp('Brand inputs (name, colours, tagline) — local only; intentional honest stub, no generation data retained') },

  'ceos_news.md': { nums: [33,34,35], note: '',
    review: review(['New RSS sources to add / source reliability change?', 'Inshorts / DailyHunt add fact-check?', 'New state × language coverage gap?']),
    ks: killshots([
      ['Inshorts / DailyHunt add fact-check', '🟡 MEDIUM', 'Chitti gives a cross-source verdict + Chitti\'s Take + hard neutrality guardrails'],
      ['Google News adds Hindi summaries', '🟡 MEDIUM', 'Chitti is state-aware + per-language + per-category, voice-read'],
      ['AI news summarisers hallucinate', '🔴 HIGH', 'Chitti links every source and never fabricates — fact-checker cross-references ≥2 sources'],
    ]),
    dpdp: dpdp('For You category profile (👍/👎) — localStorage only, NEVER synced to backend', ['**Privacy lock:** personalisation profile never leaves the device']) },

  'ceos_psychology.md': { nums: [33,34,35], note: '',
    review: review(['Helpline numbers still active (Tele-MANAS 14416 / iCall / Vandrevala / NIMHANS)?', 'Wysa / Woebot add Hindi?', 'Any crisis-routing edge case from feedback?']),
    ks: killshots([
      ['Wysa / Woebot add Hindi', '🟡 MEDIUM', 'Chitti is free + Indian context + helpline cascade, not a paywalled chatbot'],
      ['Generic AI "therapy" chatbots', '🔴 HIGH', 'Chitti holds a strict therapist-boundary + crisis cascade (Tele-MANAS 14416); never role-plays a clinician'],
      ['Influencer mental-health content', '🟡 MEDIUM', 'Chitti is grounded in a basics→PhD corpus with devil\'s-advocate + confidence scoring'],
    ]),
    dpdp: dpdp('Emotional / conversation data — on-device, never sold', ['**Crisis safety:** self-harm signals trigger helpline cascade, never ignored; no clinical record stored on server']) },

  'ceos_scanner.md': { nums: [33,34,35], note: '',
    review: review(['FSSAI rule / labelling change?', 'New barcode / packaging standards?', 'Google Lens adds FSSAI lookup?']),
    ks: killshots([
      ['Google Lens adds FSSAI lookup', '🟡 MEDIUM', 'Chitti is India-FSSAI + MedUPI deep-link + community fake-product alerts'],
      ['Brand apps add their own scanner', '🟡 MEDIUM', 'Single-brand. Chitti scans everything, independent'],
      ['Fake-product networks scale up', '🔴 HIGH', 'Chitti community-alert flywheel + annual FSSAI report + real-time nearby warnings'],
    ]),
    dpdp: dpdp('Scan data (what / where-pincode / when / result) — user-owned, anonymised before analysis, never sold', ['**Camera Intelligence contract:** face crops blurred, GPS rounded to pincode centroid; "Chitti forget" wipes all captures']) },

  'ceos_upi.md': { nums: [33,34,35], note: '',
    review: review(['RBI / NPCI rule change affecting fraud rules?', 'New scam vector / fraud pattern emerging?', 'GPay / PhonePe add fraud AI?']),
    ks: killshots([
      ['GPay / PhonePe add fraud warnings', '🟡 MEDIUM', 'Chitti is independent + RBI 2026 rule cards + voice explanation for the four users'],
      ['Banks add per-app fraud AI', '🟡 MEDIUM', 'Per-bank silos. Chitti is universal across any UPI app'],
      ['New scam vectors outpace rules', '🔴 HIGH', 'Chitti swarm learns new patterns; community alerts warn nearby users'],
    ]),
    dpdp: dpdp('Transaction screenshot / text — classified locally; NO payment data stored (fraud classifier only)', ['**Scope:** Chitti is a fraud classifier, never a payment-intent path; never moves money']) },

  'ceos_legal.md': { nums: [33,34,35], note: 'Mandatory cross-CEOS plugin appended to the named-section Legal OS doc set.',
    review: review(['New BNS / BNSS / BSA 2023 amendment to reflect?', 'Limitation Act / CPA-2019 threshold change?', 'LegalKart / Vakilsearch add Hindi voice?']),
    ks: killshots([
      ['LegalKart / Vakilsearch add Hindi voice', '🟡 MEDIUM', 'Chitti is free + deterministic deadline-math + the NALSA free-legal-aid (s.12) moat'],
      ['Govt e-Daakhil / Nyaya portals add AI', '🟡 MEDIUM', 'B2G complex. Chitti is consumer voice-first, offline-first deterministic engine'],
      ['LLM legal chatbots hallucinate sections / limitation', '🔴 HIGH', 'In law a DEADLINE is money-math — exact, never hallucinated. RAG cite-or-refuse; never substitutes a lawyer'],
    ]),
    dpdp: dpdp('Notices / contracts (camera), case profile + limitation dates — on-device, never sold', ['**Disclaimer:** supports, never replaces, a qualified advocate; server-enforced on every response']) },

  // ---- conflict files: renumbered to avoid collision ----
  'ceos_medupi.md': { nums: [34,35,36], note: 'Mandatory cross-CEOS plugin — numbered to avoid collision with existing §33 (Sign-off).',
    review: review(['NPPA price ceiling / DPCO revision?', 'New Jan Aushadhi generics added?', 'Tata 1mg / PharmEasy add same-composition match?']),
    ks: killshots([
      ['1mg / PharmEasy add generic finder', '🟡 MEDIUM', 'Commerce-motivated (they sell). Chitti is independent + Jan Aushadhi-first + no commission'],
      ['Govt Jan Aushadhi app adds search', '🟡 MEDIUM', 'Govt B2G. Chitti adds voice + Family Wallet + strict same-composition matching'],
      ['AI medicine bots suggest substitutes', '🔴 HIGH', 'Chitti shows SAME-composition only (never therapeutic); HIGH-risk never switched without doctor'],
    ]),
    dpdp: dpdp('Medicine strips / prescriptions (camera), Family Wallet entries — sensitive health data, on-device, never sold', ['**Sensitive:** medicine/prescription data under DPDP §2; consult-doctor disclaimer on every response']) },

  'ceos_vaani.md': { nums: [36,37,38], note: 'Mandatory cross-CEOS plugin — numbered to avoid collision with existing §33–35 (Certification / Deliverables / Success Metrics).',
    review: review(['New Chitti added that the intent-router must reach?', 'Siri / Google Assistant / Copilot feature worth copying?', 'Bhashini ULCA registration status — Voice Factory Phase 2 unblocked?']),
    ks: killshots([
      ['Google Assistant deepens Indian-language support', '🔴 HIGH', 'Chitti is four-user (blind/deaf/mute/illiterate) + emergency family-cascade + 15 specialists + Golden Rule'],
      ['Jio / Ola launch a consumer PA', '🔴 HIGH', 'Speed to market + community trust + accessibility moat that is hard to replicate'],
      ['OEM assistants bundle on-device', '🟡 MEDIUM', 'Generic. Chitti has SahayAI specialist depth + memory + confirm-before-every-action'],
    ]),
    dpdp: dpdp('Profile, memory, and contacts (for confirm-gated actions) — on-device; emergency-cascade contacts', ['**Golden Rule:** no side-effecting action without explicit Yes; **Emergency:** family cascade, never auto-dial cops']) },
};

let done = 0, skipped = 0;
for (const [file, cfg] of Object.entries(FILES)) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) { console.log(`MISSING ${file}`); continue; }
  let txt = fs.readFileSync(p, 'utf8');
  if (txt.includes(MARKER)) { console.log(`skip   ${file} (already plugged)`); skipped++; continue; }
  const b = block(cfg.nums, cfg.note, cfg.review, cfg.ks, cfg.dpdp);
  if (!txt.endsWith('\n')) txt += '\n';
  fs.writeFileSync(p, txt + b, 'utf8');
  console.log(`plug   ${file}  → §${cfg.nums.join('/')}`);
  done++;
}
console.log(`\n${done} plugged, ${skipped} skipped`);
