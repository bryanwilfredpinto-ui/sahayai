export const meta = {
  name: 'chitti-health-scanner-cosdf',
  description: 'Build Chitti Health Scanner COSDF v1.0 doc set + product skeleton inside the Chitti MedUPI family',
  phases: [
    { title: 'Docs', detail: 'COSDF doc set under chitti-health-scanner/' },
    { title: 'Product', detail: 'frontend skeleton + honest backend stubs' },
    { title: 'Integration', detail: 'wire into MedUPI family + master docs' },
  ],
}

// ── Shared constraints handed to EVERY agent ────────────────────────────
const C = [
  'You are building docs/product for CHITTI HEALTH SCANNER — a NEW visual-health capability inside the',
  'Chitti MedUPI family (Chitti = Bharat Premium AI, sahayai.in, founder Bryan Wilfred Pinto / "Sire").',
  'It complements Chitti MedUPI (medicine cost) and Chitti Health File (records/timeline). Source of truth:',
  'the user-provided COSDF v1.0 framework (15 levels). Reproduce its content faithfully.',
  '',
  'NON-NEGOTIABLE RULES:',
  '',
  'SAFETY (medical product — top priority):',
  '- NEVER diagnose. Chitti DETECTS/NOTICES patterns and ESCALATES to professionals. Golden line:',
  '  "Chitti helps you notice — doctors help you heal."',
  '- Every analysis output must carry: confidence level + plain-language explanation + suggested action',
  '  (monitor / consider consult / seek care) + the disclaimer "This is not a medical diagnosis."',
  '- No prescriptions, no "you have <disease>", no certainty, no fear-mongering/panic, no shaming.',
  '- Acknowledge limitations honestly (e.g. AI is less accurate on darker / Fitzpatrick IV-VI skin tones).',
  '- HONEST STUBS: the AI vision models are NOT built or clinically validated yet. Frame ALL research',
  '  accuracy numbers (skin 95%, dental 89-97%, etc.) as TARGETS / research benchmarks, NEVER as achieved.',
  '  Backend analysis endpoints return honest 501 "coming_soon". Certification scores stay BLANK (___%).',
  '  Never fake a metric, never write "live"/"verified"/"GREEN" for anything not actually measured.',
  '',
  'LOCKED platform rules (never relitigate):',
  '- LLM = DeepSeek ONLY (api.deepseek.com, OpenAI-compatible); vision via DeepSeek-vision, disclaimer-guarded.',
  '- Four-user accessibility: Blind / Deaf / Mute / Illiterate. Voice IN + Voice OUT + icons/symbols + plain',
  '  language. NEVER colour-only — pair colour with icon + text (🟢 normal / 🟡 monitor / 🔴 seek care).',
  '- Multilingual via the shared substrate (chitti_lang.js + T dictionary), the SAME way Chitti Vaani does:',
  '  9 primary (en/hi/ta/te/bn/mr/gu/kn/ml) + 26-language substrate. NO Hinglish (one pure language per',
  '  render); technical/brand terms (Chitti, DeepSeek, UPI, AI, DPDP, ABDM, AES-256-GCM) stay English.',
  '- Golden Rule: Chitti NEVER acts on its own. Opening camera / capturing / saving / sharing / setting a',
  '  reminder goes through a confirm gate ("Sire, shall I open the camera? Haan / Nahi") — voice + tap,',
  '  mute-safe, never default-to-yes, silence = wait.',
  '- Per-response widget: every response box carries data-chitti-response + 🔊/🤖/👍/👎 (feedback-widget.js).',
  '- Camera-intelligence + privacy: health images AES-256-GCM encrypted at rest, user-owned, never sold,',
  '  anonymised before any aggregate, "Chitti forget" deletes all. DPDP 2023 + ABDM-aware.',
  '- Part of Chitti MedUPI: backend extends chitti-medupi-api with /api/health-scanner/*; feeds the Chitti',
  '  Health File timeline; cross-links to MedUPI (Jan Aushadhi) + Government (PMJAY).',
  '',
  'DOC COMPLIANCE (CTO.md):',
  '- Every .md file FIRST line MUST be exactly: **World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**',
  '- Brand palette: Saffron #FF9933 / Navy #000080 / Green #138808.',
  '- Preserve all safety templates / response templates / metric tables from the COSDF verbatim.',
  '',
  'Write each file with the Write tool to the EXACT path given (Write creates parent dirs).',
  'Return ONLY a one-line confirmation listing the path(s) you wrote.',
].join('\n')

const root = 'chitti-health-scanner'

phase('Docs')
const docAgents = [
  {
    label: 'ROLE+VISION+PERSONAS',
    p: `${C}

Write THREE files:
1) ${root}/constitution/ROLE.md — COSDF Level 0. Identity: "Chitti Health Scanner — the world's most trusted visual health assistant." It is NOT a diagnostic tool / telemedicine / symptom checker / doctor replacement. It is: Visual Health Assistant + Early Detection System + Health Monitor + Prevention Guide + Health Educator + Accessibility Bridge + Health Timeline Tracker. Include the optimization priority table (1 Safety, 2 Accuracy, 3 Accessibility, 4 Early Detection, 5 Prevention, 6 Affordability, 7 Human Dignity). Founder Rule block: "Safety > Accuracy > Features"; flow "Detection → Explanation → Monitoring → Escalation" NOT "Diagnosis → Treatment → Prescription → Cure"; the Never/Always lists; Golden Rule "Chitti helps you notice — doctors help you heal."
2) ${root}/vision/VISION.md — COSDF Level 1. Mission, Vision, and "The Shift" before/after table (notice→ignore→worse vs scan→detect→monitor→escalate; no memory vs Digital Health Twin; rural 50km vs first screen at home; diabetic foot tracking; blind self-exam).
3) ${root}/personas/PERSONAS.md — COSDF Level 2. The 9 personas P1–P9 (Rural Farmer, Parent/Child, Elderly 65+, Diabetic, Cancer Survivor, Blind, Deaf, Illiterate, General Public) each with region (where given) + needs bullets exactly as in the framework. Tie each to the four-user accessibility contract.`,
  },
  {
    label: 'PRD',
    p: `${C}

Write ${root}/prd/PRD.md — COSDF Level 4 (Product Requirements). Document features F0–F12 EXACTLY:
F0 Skin Scanner, F1 Eye Scanner, F2 Wound Monitoring, F3 Tooth Scanner (high-value), F4 Hair & Scalp, F5 Nail, F6 Swelling (L/R compare), F7 Mole & Spot Tracker (long-term), F8 Post-Surgery Monitoring, F9 Burn Monitoring, F10 Child Health Growth Journal, F11 Diabetic Foot Monitor, F12 Health Change Detection ("what's different from last month?" — the differentiator).
For each: Input, detectable patterns, and an honest example output that ALWAYS includes a confidence % + suggested action + "This is not a diagnosis" disclaimer. Preserve the research-validation notes BUT label every accuracy figure as a TARGET / research benchmark (not achieved by Chitti yet) and state the skin-tone-bias limitation explicitly. Add a short "Build status" note per feature = SKELETON / COMING SOON (honest stubs; DeepSeek-vision gives pattern description with disclaimers, no diagnosis).`,
  },
  {
    label: 'SKILLS',
    p: `${C}

Write NINE skill files under ${root}/skills/ (COSDF Level 5), one per skill, each a short focused markdown:
skin_assessment.md (Visual Dermatology: ABCD rule, rash morphology, darker-skin limitation), wound_assessment.md (size/colour/healing-trend/infection indicators), dental_assessment.md (caries white-spot→cavitated, tooth segmentation, gum/plaque), eye_assessment.md (redness/swelling/jaundice/discharge), mole_tracking.md (ABCD evolution, growth rate mm/month), longitudinal_tracking.md (image registration, pixel change, growth calc), risk_communication.md (confidence score, urgency monitor/consider/seek-care, plain language, uncertainty quantification), accessibility.md (voice-guided capture, visual-only, icon nav, haptic patterns), medical_safety.md (red-flag detection, never-diagnose enforcement, escalation determination, false-positive minimisation).
Each skill file: state inputs, method, outputs, and the safety/limitation note. These describe AI CAPABILITIES (targets), not shipped accuracy.`,
  },
  {
    label: 'SOPs',
    p: `${C}

Write SIX SOP files under ${root}/sop/ (COSDF Level 7), each a numbered step list exactly per the framework:
skin_check.md (SOP-001), wound_monitoring.md (SOP-002, baseline + scale ref + healing-rate + diabetic infection screen), tooth_check.md (SOP-003, front/left/right + segmentation + white-spot vs cavitated), mole_tracking.md (SOP-004, scale ref + body-location mapping + alignment + growth rate), emergency_escalation.md (SOP-005, trigger conditions + actions; ALWAYS "This is not an emergency service. If this is a medical emergency, call your local emergency number." NEVER say "this is cancer" → always "this pattern requires professional evaluation"), doctor_referral.md (SOP-006, when-to-refer + the referral language template).
Every SOP must include the Golden-Rule camera confirm step and a voice-guided variant for blind users.`,
  },
  {
    label: 'GUARDRAILS+SWARM',
    p: `${C}

Write TWO files:
1) ${root}/guardrails/GUARDRAILS.md — COSDF Level 8. Reproduce VERBATIM the P0 NEVER list, P0 ALWAYS list, P1 NEVER list, P2 REQUIRED list, and the STANDARD RESPONSE TEMPLATES table (Normal / Minor / Concerning / Uncertain-low-confidence / Emergency-red-flag with their exact response text). Render the NEVER/ALWAYS blocks as fenced code blocks.
2) ${root}/swarm/agents.yaml — COSDF Level 6. A YAML manifest of the 9-agent pipeline every scan passes through, in order: 1 Visual Dermatology, 2 Dental, 3 Wound Assessment, 4 Longitudinal Tracking, 5 Oncology Safety (CAN VETO), 6 Medical Safety (CAN VETO ALL — never-diagnose enforcement, disclaimer/referral check), 7 Accessibility (adapt modality blind/deaf/illiterate), 8 Hallucination Detector, 9 Quality Assurance. For each agent: id, role, inputs, outputs, can_veto (bool). Add a top YAML comment with the Commando line. (YAML can't carry markdown bold on line 1, so put the Commando statement as the first "# comment" line.)`,
  },
  {
    label: 'MEMORY+OBSERVABILITY',
    p: `${C}

Write TWO files:
1) ${root}/memory/health_twin_schema.json — COSDF Level 9 Personal Health Twin. Valid JSON: user_id, health_timeline{ skin[], wounds[], dental[] } with the example fields from the framework (date, body_location, image_reference encrypted, findings, ai_confidence, recommendation; wound size_mm2, color_analysis, healing_trend, percent_change_7d; dental affected_teeth, caries_type, confidence), risk_factors{diabetic, cancer_survivor, high_uv_exposure, family_history_skin_cancer}, preferences{language, accessibility_mode, reminder_frequency}. Add a top-level "_commando": "World Class Chitti Health Scanner — Commando Discipline. Zero Excuses." and "_privacy": "AES-256-GCM at rest; user-owned; Chitti forget deletes all; DPDP 2023 + ABDM-aware". (JSON file — no markdown header; use the _commando key.)
2) ${root}/observability/metrics.yaml — COSDF Level 10. YAML with the safety / accuracy / accessibility / health_impact / quality metric groups from the framework, plus an event-log example schema (timestamp, user_persona, scan_type, body_location, ai_finding, confidence, safety_check, escalation_level, output_mode, user_feedback, latency_ms, image_quality_score). First line = "# World Class Chitti Health Scanner — Commando Discipline. Zero Excuses."`,
  },
  {
    label: 'EVALS',
    p: `${C}

Write ${root}/evals/EVALS.md (COSDF Level 11) plus ${root}/evals/gold_dataset/README.md and ${root}/evals/tests/README.md.
EVALS.md: the gold-dataset requirements table (10,000+ samples across skin/dental/wounds/moles/eye/nail-hair/pediatric/accessibility with targets + sources), the 7 critical evaluation tests (Safety Compliance, Skin Cancer Detection Accuracy, Dental Caries Detection, Wound Healing Trend, Accessibility, Hallucination Detection, Skin Tone Bias) with method/target/reporting cadence, and the Human-in-the-Loop validation rule (confidence<70% OR escalated → clinical review). Label all targets as not-yet-achieved. gold_dataset/README.md + tests/README.md: honest placeholders explaining the dataset is not yet collected and tests are scaffolds (COMING SOON), with the dir's purpose.`,
  },
  {
    label: 'ACCESSIBILITY',
    p: `${C}

Write ${root}/accessibility/ACCESSIBILITY.md — COSDF Level 12. Include: the User Modality Matrix table (Blind/Deaf/Mute/Illiterate/Blind+Deaf/Elderly × primary input/output/fallback); the 4 interface modes (Voice-First voice-guided capture script + haptic feedback; Visual-First captions + colour-coded urgency with icons; Icon-First the 📷/📖/🔊/👍/👎/🚨/🤖 menu; Haptic Mode buzz patterns); the Language Support table (map P0/P1/P2 to Chitti's reality: 9 primary + 26-substrate via chitti_lang.js, Voice Factory for voice-out, honest "translation pending" for stub langs — do NOT claim Yoruba/Swahili/etc. are live; frame non-Indian languages as FUTURE); and the accessibility testing protocol (blind/deaf/illiterate, 10 users × 30 tasks, >99% completion target). Tie everything to the four-user contract + the eight gates.`,
  },
  {
    label: 'QUALITY+CERT',
    p: `${C}

Write TWO files:
1) ${root}/quality/QUALITY.md — COSDF Level 13. The 10 quality gates (Functional, Safety-CRITICAL, Accuracy, Accessibility, Swarm Review, Observability, Privacy, Evals, Documentation, Founder Review) each as a checklist with PASS/FAIL boxes, all currently UNCHECKED (honest — nothing ships GREEN yet). Add a line mapping these onto Chitti's existing "eight gates" (blind/deaf/mute/illiterate × per-box widget × 10 languages × 375px × 48px taps) and the 5 frontend cert gates.
2) ${root}/certification/CERTIFICATION.md — COSDF Level 14. The pre-release certification table (domains × passing score × "Chitti Score = ___%" all BLANK), the GREEN/YELLOW/RED grade bands, the Medical Advisory Board requirement (dermatologist + dentist + wound-care specialist sign-off before GREEN), and post-release monitoring cadence. State current status: RED / NOT CERTIFIED — skeleton only, no clinical validation yet.`,
  },
  {
    label: 'README+FEATURES',
    p: `${C}

Write TWO files:
1) ${root}/README.md — overview of the COSDF v1.0 framework + the final architecture tree (constitution/ vision/ personas/ prd/ skills/ sop/ swarm/ guardrails/ memory/ observability/ evals/ accessibility/ quality/ certification/). State plainly: this is a SKELETON/FRAMEWORK; AI analysis is COMING SOON (honest stubs); part of the Chitti MedUPI family (backend /api/health-scanner/* on chitti-medupi-api; frontend chitti_health_scanner.html; feeds Chitti Health File). Include the full Medical Disclaimer from the framework footer.
2) ${root}/skills/FEATURES.md — the Feature Discovery Box surface (parsed live by chitti_features.js). Use the same 3-section contract as other Chittis: "## 1. Built and working" (only honest items: the page skeleton, camera-capture via chitti_camera_universal.js, voice-guided/icon-first accessibility, multilingual substrate, per-response widget, disclaimer banner, Health-File timeline link), "## 2. Planned — COMING SOON" (F0–F12 AI analysis: Skin/Eye/Tooth/Wound/Mole/Nail/Hair/Swelling/Post-surgery/Burn/Child-journal/Diabetic-foot/Change-detection, each as a row), "## 3. Future — partnership / regulator gated" (clinical validation, Medical Advisory Board, on-device offline models, ABDM link, diverse-skin-tone dataset). Mark every AI-analysis feature COMING SOON — never claim it works.`,
  },
]
const docResults = await parallel(docAgents.map((a) => () => agent(a.p, { label: a.label, phase: 'Docs' })))

phase('Product')
const productAgents = [
  {
    label: 'frontend-html',
    p: `${C}

Write the frontend skeleton: chitti_health_scanner.html (at the REPO ROOT — GitHub Pages serves root; add an HTML comment line 2 "<!-- Frontend for ${root}/ -->").
FIRST Read chitti_scanner.html and chitti_health_file.html to mirror their <head> script set + structure EXACTLY, so this page inherits every substrate gate. It MUST load (same versions as those pages): feedback-widget.js, chitti_warmup.js, chitti_a11y.js (with version query), chitti_isl.js, chitti_lang.js (with version query), and have a <select id="lang-select"> the substrate wires. Include chitti_camera_universal.js if those pages do.
Page surface (full, honest skeleton):
- Sticky medical-disclaimer bar (NOT a doctor / "This is not a medical diagnosis" / link to full disclaimer) — analogous to the SEBI bar pattern.
- Hero: "Chitti Health Scanner — Chitti helps you notice, doctors help you heal."
- A grid of scan-type CARDS for F0–F12 (Skin/Eye/Tooth/Wound/Hair-Scalp/Nail/Swelling/Mole/Post-surgery/Burn/Child-journal/Diabetic-foot/Change-detection), each card: emoji + name + one-line plain description + a visible "COMING SOON" badge + a 📷 Scan button that (honestly) opens the camera via the Golden-Rule confirm and shows an honest "AI analysis coming soon — your photo can be saved to your Health File timeline" result box.
- Each result/output area is a box with data-chitti-response (so the per-response widget attaches) and data-chitti-section.
- Colour-coded urgency legend with ICON+TEXT (never colour alone): 🟢 normal / 🟡 monitor / 🔴 seek care.
- Accessibility: icon-first nav row (📷 Scan / 📖 Timeline / 🔊 Listen / 👍 / 👎 / 🚨 Help / 🤖 Chitti), large tap targets ≥48px, voice-guided note for blind users.
- Brand palette Saffron #FF9933 / Navy #000080 / Green #138808; mobile-first, NO horizontal scroll at 375px; all visible strings plain English (substrate translates), NO Hinglish.
- Cross-links: "Open in Chitti Health File timeline" and "Find affordable medicines in Chitti MedUPI".
Keep it a static, honest skeleton — no fake AI results, no fake accuracy numbers.`,
  },
  {
    label: 'backend-stubs',
    p: `${C}

Add honest backend stub routes for the scanner inside chitti-medupi-api.
FIRST Read chitti-medupi/backend/routes/health_file.py and chitti-medupi/backend/main.py to mirror the Blueprint + registration pattern EXACTLY.
Create chitti-medupi/backend/routes/health_scanner.py:
- Flask Blueprint "health_scanner_bp" with url_prefix "/api/health-scanner".
- GET /health → 200 {"ok": true, "product": "chitti-health-scanner", "status": "skeleton"}.
- POST /analyze (body: scan_type, image_b64, body_location, profile_id) → honest 501 JSON {"status":"coming_soon","message":"AI visual analysis is not yet clinically validated. Chitti can store this image to your Health File timeline. This is not a medical diagnosis.","disclaimer":"Chitti helps you notice — doctors help you heal."}. NEVER return a diagnosis.
- POST /save-to-timeline (scan_type, image_b64, body_location, profile_id) → honest stub that, if the Health File doc endpoint exists, references it; else 501 coming_soon. (Do NOT invent storage you can't back; honest stub is fine.)
- GET /scan-types → 200 list of the F0–F12 scan types with id/emoji/label/status="coming_soon".
Every analysis-ish response carries the medical disclaimer and a confidence/uncertainty note. Add module docstring with the Commando line.
THEN edit chitti-medupi/backend/main.py to import and register the blueprint exactly like health_file_bp (import near line 31, register near the other register_blueprint calls). Do not touch other routes.`,
  },
]
const productResults = await parallel(productAgents.map((a) => () => agent(a.p, { label: a.label, phase: 'Product' })))

phase('Integration')
const integrationAgents = [
  {
    label: 'sahayai-master',
    p: `${C}

Edit SAHAYAI_MASTER.md to register Chitti Health Scanner (do NOT rewrite the file; make surgical additions):
- In the §4a "Frontend ↔ folder map" Product-pages table, add a row: \`chitti_health_scanner.html\` → \`chitti-health-scanner/\` (note: part of the Chitti MedUPI family; backend chitti-medupi-api /api/health-scanner/*).
- In §5 "What's planned — next wave" (or §5a per-Chitti planned wave), add Chitti Health Scanner as a SKELETON shipped item: visual health assistant (skin/eye/tooth/wound/mole/nail/hair/swelling/post-surgery/burn/child/diabetic-foot/change-detection), honest COMING SOON AI analysis, four-user accessible, multilingual via substrate, golden-rule camera confirm, feeds Chitti Health File. Reference COSDF v1.0 + the chitti-health-scanner/ doc set. Keep the "never diagnose" framing.
Make ONLY these additions; preserve everything else byte-for-byte.`,
  },
  {
    label: 'quality-status',
    p: `${C}

Edit QUALITY_STATUS.md to add Chitti Health Scanner. FIRST Read the file to learn its exact table format (the §1 product matrix + §1a frontend-gate matrix). Add a row for chitti_health_scanner.html mirroring how a freshly-skeletoned page is recorded: the 5 frontend gates marked 🟡 PENDING/UNVERIFIED (feedback-widget+data-chitti-response, chitti_a11y.js, Disability Profile prompt, language auto-detect, ISL plugin) and BACKEND = honest stub (/api/health-scanner/* returns coming_soon). Do not mark anything GREEN. Make only additive edits; preserve the rest.`,
  },
  {
    label: 'medupi-spec+features',
    p: `${C}

Two surgical edits:
1) CHITTI_MEDUPI_MASTER_SPEC.md — add a section noting Chitti Health Scanner is a new sibling capability in the MedUPI family (backend /api/health-scanner/* on chitti-medupi-api; frontend chitti_health_scanner.html; COSDF v1.0 doc set under chitti-health-scanner/; honest skeleton, AI analysis COMING SOON, never diagnoses; feeds Chitti Health File timeline + cross-links Jan Aushadhi).
2) chitti-medupi/skills/FEATURES.md — add a short cross-product hooks note that Chitti Health Scanner shares this backend + feeds the Health File timeline, with AI analysis COMING SOON.
Make only additive edits; preserve existing content.`,
  },
  {
    label: 'features-map',
    p: `${C}

Edit chitti_features.js so the Feature Discovery Box maps the new page to its FEATURES.md. FIRST Read chitti_features.js to find the FOLDER_MAP object (e.g. 'chitti_scanner': 'chitti-scanner') and the ALL_CHITTIS routing manifest array.
- Add to FOLDER_MAP: 'chitti_health_scanner': 'chitti-health-scanner'.
- Add an ALL_CHITTIS entry for it: { slug: 'chitti_health_scanner', folder: 'chitti-health-scanner', emoji: '🩺', label: 'Chitti Health Scanner' } (match the exact object shape used by the other entries).
Make only these two additive edits; change nothing else.`,
  },
]
const integrationResults = await parallel(integrationAgents.map((a) => () => agent(a.p, { label: a.label, phase: 'Integration' })))

return {
  docs: docResults.filter(Boolean).length + '/' + docAgents.length,
  product: productResults.filter(Boolean).length + '/' + productAgents.length,
  integration: integrationResults.filter(Boolean).length + '/' + integrationAgents.length,
}
