/* Chitti Mechanic 2 Wheeler — Deterministic Ownership Engine
 * Frontend for chitti-mechanic-2w/  (Chitti Mechanic 2W CEOS v1.0, built 2026-06-13)
 *
 * RULES ARE THE PRODUCT. THE LLM (DeepSeek) IS AN ENHANCEMENT, NEVER A DEPENDENCY.
 * Every rupee, date, score and verdict shown to a user is computed HERE from the
 * user's own numbers + a VERSIONED rule table — never invented by an LLM. The LLM
 * only narrates. Works with the internet down and DeepSeek 429. Pure, dependency-free,
 * node-testable.
 *
 * Every result object carries { confidence, risks:[], sources:[] }  (CONSTITUTION Art.9/12,
 * ROLE non-negotiables: never guarantee a price/saving; never recommend unsafe DIY;
 * always show free alternatives first; always show scam alerts).
 *
 * Indian 2-wheeler market first (Art.11): Hero, Honda, Bajaj, TVS, Suzuki, Yamaha,
 * Royal Enfield, Ola, Ather. No-OBD reality: Indian bikes rarely have OBD2 — diagnosis
 * is symptom-Q&A + plain-language code lookup, OBD dongle is an optional power-feature.
 *
 * Spec: chitti-mechanic-2w/ceos/ARCHITECTURE.md · EVALS.md · guardrails/hallucination.md
 */
(function (root) {
  'use strict';

  // ───────────────────────────────────────────────────────────────────────────
  // VERSIONED RULE TABLES  (change the table, never the logic — memory/rule_versioning.md)
  // ───────────────────────────────────────────────────────────────────────────
  var RULES = {
    version: '1.0.0',
    updated: '2026-06-13',
    market_year: 2026,

    // Vehicle classes Chitti reasons about (Art.11 — Indian 2W market).
    classes: {
      commuter:    { label: 'Commuter motorcycle', egs: 'Splendor, HF Deluxe, Shine, Platina', oil: 'oil_20w40_mineral' },
      performance: { label: 'Performance motorcycle', egs: 'Pulsar, Apache, FZ, R15, Classic 350', oil: 'oil_10w30_synth' },
      scooter:     { label: 'Scooter', egs: 'Activa, Jupiter, Access, Ntorq', oil: 'oil_10w30_scooter' },
      ev:          { label: 'Electric (EV)', egs: 'Ola S1, Ather 450, iQube, Chetak', oil: 'none' }
    },

    // Engine-oil grades by class (deterministic — NEVER LLM-guessed). Servo as the public
    // reference brand from the CEOS; equivalents shown so we are not a single-brand seller.
    oils: {
      oil_20w40_mineral: { grade: '20W-40 (mineral, JASO MA2)', brandRef: 'Servo Hyper Sport 4T', equiv: 'Motul/Shell/Castrol 20W-40 4T', interval_km: 3000, qty_l: '0.8–1.0', price: '₹350–550' },
      oil_10w30_synth:   { grade: '10W-30 (semi/fully-synthetic, JASO MA2)', brandRef: 'Servo Hyper Sport fully-synthetic', equiv: 'Motul 7100/Shell Advance 10W-30', interval_km: 6000, qty_l: '1.0–1.2', price: '₹550–900' },
      oil_10w30_scooter: { grade: '10W-30 scooter (JASO MB)', brandRef: 'Servo Hyper Sport Scooter', equiv: 'Motul Scooter Power/Shell AX7 Scooter', interval_km: 4000, qty_l: '0.7–0.9', price: '₹350–600' },
      none:              { grade: 'No engine oil (EV)', brandRef: '—', equiv: '—', interval_km: 0, qty_l: '0', price: '₹0' }
    },

    // Service catalogue (frequency + who should do it + fair cost band). DIY tier is the
    // GUARDRAIL: safety-critical items are 🔴 mechanic-only (guardrails/safety.md).
    service: [
      { item: 'Engine oil change',     km: 3000,  months: 4,  tier: 'caution',  who: 'Mechanic/DIY', cost: '₹500–1,000' },
      { item: 'Oil filter',            km: 6000,  months: 8,  tier: 'caution',  who: 'Mechanic',     cost: '₹200–300' },
      { item: 'Air filter clean',      km: 3000,  months: 4,  tier: 'safe',     who: 'DIY',          cost: '₹0' },
      { item: 'Air filter replace',    km: 12000, months: 18, tier: 'safe',     who: 'DIY',          cost: '₹200–400' },
      { item: 'Spark plug',            km: 10000, months: 12, tier: 'safe',     who: 'DIY',          cost: '₹150–300' },
      { item: 'Brake shoes/pads',      km: 15000, months: 24, tier: 'mechanic', who: 'Mechanic',     cost: '₹800–1,500' },
      { item: 'Chain clean + lube',    km: 500,   months: 1,  tier: 'safe',     who: 'DIY',          cost: '₹100' },
      { item: 'Chain + sprocket set',  km: 15000, months: 30, tier: 'mechanic', who: 'Mechanic',     cost: '₹2,000–3,500' },
      { item: 'CVT belt (scooter)',    km: 15000, months: 36, tier: 'mechanic', who: 'Mechanic',     cost: '₹1,500–2,500' }
    ],

    // Tyre catalogue (CEOS §12) — for recommendation by usage. Prices are bands, not promises.
    tyres: [
      { name: 'CEAT EnergyRide', best: 'EV scooters, low rolling resistance (range)', usage: ['ev', 'mileage'], price: '₹1,800–2,200' },
      { name: 'Eurogrip ETORQ',  best: 'Performance EVs / scooters',                   usage: ['ev', 'performance'], price: '₹1,700–2,000' },
      { name: 'Michelin City Extra', best: 'Durability / long life',                   usage: ['durability', 'highway'], price: '₹2,200–2,800' },
      { name: 'MRF Zapper',      best: 'All-rounder grip',                             usage: ['allround', 'commuter', 'performance'], price: '₹1,600–2,000' },
      { name: 'Apollo WAV',      best: 'Value + wet grip',                             usage: ['value', 'commuter', 'mileage'], price: '₹1,500–1,900' }
    ],
    tyre_life_km: 20000, tyre_life_years: 3,

    // Battery (CEOS §13).
    batteries: {
      scooter:    { spec: '12V 5Ah',      life_months: 27, cost: '₹1,500–2,000' },
      motorcycle: { spec: '12V 3Ah',      life_months: 30, cost: '₹1,200–1,800' },
      ev:         { spec: 'Lithium-ion',  life_months: 48, cost: '₹8,000–15,000' }
    },

    // Insurance — top 2W insurers with public claim-settlement-ratio bands (CEOS §9).
    // CSR figures are indicative reference bands; live premiums require a partner API
    // (PLANNED) — until then we compare on the user-entered premium + published CSR.
    insurers: [
      { name: 'ACKO',           csr: 98.4, bestFor: 'Urban riders, fast digital claims' },
      { name: 'HDFC ERGO',      csr: 98.1, bestFor: 'EV owners' },
      { name: 'Bajaj Allianz',  csr: 98.0, bestFor: 'Low-mileage riders' },
      { name: 'Royal Sundaram', csr: 97.2, bestFor: 'Value' },
      { name: 'ICICI Lombard',  csr: 96.8, bestFor: 'Tech-savvy' },
      { name: 'TATA AIG',       csr: 96.5, bestFor: 'Add-on cover' },
      { name: 'SBI General',    csr: 96.0, bestFor: 'Branch support' },
      { name: 'Reliance General', csr: 95.5, bestFor: 'Budget third-party' }
    ],
    insurance_late_fee: 1000,

    // OBD / fault-code plain-language library (CEOS §16). Indian 2W rarely expose OBD2;
    // this powers the "what does this code/light mean" explainer + DIY triage.
    obd: {
      P0300: { meaning: 'Random/multiple cylinder misfire', tier: 'mechanic', cost: '₹500–2,000' },
      P0171: { meaning: 'Fuel system too lean (FI bikes)',  tier: 'mechanic', cost: '₹500–1,500' },
      P0562: { meaning: 'System voltage low — weak battery/charging', tier: 'caution', cost: '₹1,500–2,500' },
      P0563: { meaning: 'System voltage high — regulator/rectifier', tier: 'mechanic', cost: '₹800–1,500' },
      P0130: { meaning: 'O2 sensor circuit (bank 1)',       tier: 'mechanic', cost: '₹800–1,800' },
      P0107: { meaning: 'MAP sensor low input',             tier: 'mechanic', cost: '₹600–1,400' }
    },

    // Symptom → likely-cause map for the AI Coach (deterministic triage; DeepSeek narrates).
    // confidence is a band, never a promise. Safety-critical symptoms force 🔴.
    symptoms: [
      { id: 'no_start_crank', q: 'Bike does not start, makes clicking/weak sound', causes: ['Weak/old battery', 'Loose battery terminal', 'Starter motor'], tier: 'caution', conf: 'medium', diy: 'Check battery terminals + try kick-start. If kick-start works → battery weak.' },
      { id: 'no_start_silent', q: 'Bike fully dead, no lights', causes: ['Dead battery', 'Blown main fuse', 'Kill-switch/ignition'], tier: 'caution', conf: 'medium', diy: 'Check kill-switch, main fuse, battery charge.' },
      { id: 'noise_start', q: 'Noise when starting', causes: ['Weak battery', 'Self-start motor/Bendix'], tier: 'caution', conf: 'medium', diy: 'Measure battery (12.5V+). Low → charge/replace.' },
      { id: 'brake_soft', q: 'Brakes feel soft / spongy / not stopping', causes: ['Worn brake shoes/pads', 'Air in hydraulic line', 'Low brake fluid'], tier: 'mechanic', conf: 'high', diy: 'DO NOT ride. Brakes are safety-critical — mechanic only.' },
      { id: 'overheat', q: 'Engine overheating / smell', causes: ['Low coolant (LC engines)', 'Low/old oil', 'Blocked airflow'], tier: 'mechanic', conf: 'medium', diy: 'Stop, let cool. Check oil level. If coolant low/leaking → mechanic.' },
      { id: 'low_mileage', q: 'Mileage suddenly dropped', causes: ['Dirty air filter', 'Low tyre pressure', 'Spark plug worn', 'Choke/FI issue'], tier: 'safe', conf: 'medium', diy: 'Clean air filter, set tyre pressure, check spark plug.' },
      { id: 'chain_noise', q: 'Sluggish acceleration / chain noise', causes: ['Loose/dry chain'], tier: 'safe', conf: 'high', diy: 'Clean + lube + adjust chain (15 min DIY).' },
      { id: 'smoke', q: 'White/blue smoke from exhaust', causes: ['Burning oil (worn rings/valve seals)', 'Overfilled oil'], tier: 'mechanic', conf: 'medium', diy: 'Check oil level. Persistent blue smoke → mechanic.' },
      { id: 'ev_range_drop', q: 'EV range dropped a lot', causes: ['Battery ageing/degradation', 'Cold weather', 'Tyre pressure', 'Aggressive mode'], tier: 'caution', conf: 'medium', diy: 'Check tyre pressure + eco mode. Persistent drop → battery health check.' }
    ],

    // DIY-vs-Mechanic triage classification (CEOS §18).
    triage: {
      safe:     { sym: '🟢', word: 'Safe DIY',      egs: ['Chain clean/lube', 'Bulb change', 'Tyre inflate', 'Air-filter clean', 'Battery top-up'] },
      caution:  { sym: '🟡', word: 'Caution',       egs: ['Brake adjustment', 'Chain adjustment', 'Oil change', 'Spark plug'] },
      mechanic: { sym: '🔴', word: 'Mechanic only', egs: ['Engine work', 'Brake shoes/pads', 'Electrical/wiring', 'CVT belt', 'Fuel system'] }
    },

    // Education modules (CEOS §15) — REAL step-by-step content (voice + pictures).
    education: [
      { id: 'chain', title: 'Clean & lube the chain', mins: 15, tier: 'safe', a11y: 'voice + video', steps: [
        'Put the bike on its centre/main stand so the rear wheel spins free.',
        'Spray chain cleaner (or brush kerosene) on the chain while slowly rotating the wheel.',
        'Scrub the links with a soft brush, then wipe the chain dry with a cloth.',
        'Apply chain lube on the INNER side of the chain while rotating the wheel one full turn.',
        'Wipe off the excess lube so it does not fling onto the tyre. Done.'] },
      { id: 'airfilter', title: 'Clean the air filter', mins: 5, tier: 'safe', a11y: 'voice + pictures', steps: [
        'Open the side panel / air-box cover (usually a few clips or screws).',
        'Take out the air filter element.',
        'Paper filter: tap out dust + blow from the clean (inside) side out. Foam filter: wash in mild soap, dry fully, then apply a little filter oil.',
        'Refit the filter the same way it came out and close the box.'] },
      { id: 'sparkplug', title: 'Change the spark plug', mins: 10, tier: 'safe', a11y: 'voice + video', steps: [
        'Engine cold. Pull off the rubber spark-plug cap.',
        'Use the plug spanner from your tool kit to unscrew the plug anticlockwise.',
        'Check the gap (0.6–0.8 mm typical) or fit a new plug of the SAME code from your manual.',
        'Screw it in by hand first (do not cross-thread), then snug with the spanner ~half a turn.',
        'Push the cap back firmly and start the bike to test.'] },
      { id: 'tyre', title: 'Check tyre pressure', mins: 3, tier: 'safe', a11y: 'voice', steps: [
        'Check when tyres are COLD (not after a long ride).',
        'Read the recommended PSI on the sticker (swingarm/under seat) or your manual.',
        'At a pump, use the gauge; typical 28–32 PSI front, 32–36 PSI rear (follow YOUR sticker).',
        'Refit the valve caps. Correct pressure = better mileage + grip + tyre life.'] },
      { id: 'battery', title: 'Battery top-up & terminals', mins: 8, tier: 'safe', a11y: 'voice + pictures', steps: [
        'Locate the battery (under seat / side panel).',
        'Lead-acid type: check the electrolyte level; top up ONLY with distilled water to the MAX line.',
        'Maintenance-free / lithium: do NOT open — just check the terminals.',
        'Clean any white powder off the terminals and make sure both are tight.'] },
      { id: 'lights', title: 'Change a bulb', mins: 10, tier: 'safe', a11y: 'voice + video', steps: [
        'Switch the bike off.',
        'Open the headlamp/indicator housing (clips or 1–2 screws).',
        'Remove the old bulb (push-and-twist, or pull the bayonet).',
        'Fit a new bulb of the SAME wattage; do not touch halogen glass with bare fingers.',
        'Refit the housing and test the light.'] },
      { id: 'brakes', title: 'Understand your brakes (no DIY)', mins: 0, tier: 'mechanic', a11y: 'voice', steps: [
        'Brake shoes/pads wear out — a squeal or longer stopping distance means worn friction material.',
        'Hydraulic disc brakes need the right fluid level; a spongy lever can mean air in the line.',
        'Brakes are SAFETY-CRITICAL. Do not DIY — get a mechanic to inspect/replace.'] },
      { id: 'engine', title: 'Understand your engine (no DIY)', mins: 0, tier: 'mechanic', a11y: 'voice + animation', steps: [
        'The engine needs clean oil at the right level + grade, and clean air + fuel.',
        'Knocking, heavy smoke, or overheating point to internal issues.',
        'Internal engine work is MECHANIC-ONLY — Chitti teaches you what it means, not how to open it.'] }
    ],

    // Deterministic insurance premium model (CEOS §9) — IDV-based estimate, NOT a live quote.
    // OD ≈ IDV × base-rate × age factor; TP is the IRDAI-fixed band by class; per-insurer factor
    // spreads the market. Reproducible numbers, labelled an ESTIMATE (a real computed estimate,
    // never "coming soon"). Confirm the exact premium on the insurer site before buying.
    insurance_model: {
      od_base_rate: 0.0145,                              // share of IDV for own-damage, comprehensive 2W
      tp_by_class: { commuter: 752, performance: 1193, scooter: 752, ev: 538 }, // IRDAI TP bands (indicative)
      age_factor: [ { upTo: 1, f: 1.0 }, { upTo: 3, f: 0.92 }, { upTo: 5, f: 0.80 }, { upTo: 99, f: 0.68 } ],
      default_idv: { commuter: 55000, performance: 95000, scooter: 60000, ev: 110000 }
    },

    // Nearest-centre search (CEOS §10/§11) — real Google Maps deep-link, works on any device.
    maps_base: 'https://www.google.com/maps/search/',

    scam_threshold_pct: 30,           // quote > expected*1.30 → scam alert (CEOS §17/SOP6)
    savings_goal: 10000,              // ₹10k+ honest annual goal (Art.9)
    emergency: { numbers: ['108 (ambulance)', '112 (national emergency)'], note: 'Chitti NEVER auto-dials. It shows the number and asks before any call (Golden Rule).' }
  };

  // ── small helpers ───────────────────────────────────────────────────────────
  function inr(x) { return '₹' + Number(x || 0).toLocaleString('en-IN'); }
  function band(lo, hi) { return '₹' + Number(lo).toLocaleString('en-IN') + '–' + Number(hi).toLocaleString('en-IN'); }
  function num(x) { return Number(x) || 0; }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function src() { return ['Chitti Mechanic 2W rule table v' + RULES.version + ' (' + RULES.updated + ')']; }
  function classOf(v) { return RULES.classes[v] ? v : 'commuter'; }
  // Days between two ISO/Date — calendar-safe, UTC midnight (leap-safe).
  function daysUntil(iso, today) {
    if (!iso) return null;
    var d = new Date(iso); if (isNaN(d)) return null;
    var t = today ? new Date(today) : new Date();
    var a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    var b = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
    return Math.round((a - b) / 86400000);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 1. DOCUMENT VAULT  (local-only; Art.4 — "Chitti forget" deletes all)
  // ───────────────────────────────────────────────────────────────────────────
  var VAULT_KEY = 'chitti_mech2w_vault_v1';
  function vaultLoad() {
    try { return JSON.parse((root.localStorage && root.localStorage.getItem(VAULT_KEY)) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function vaultSave(v) {
    try { root.localStorage && root.localStorage.setItem(VAULT_KEY, JSON.stringify(v || {})); } catch (e) {}
    return v;
  }
  function vaultSet(patch) { var v = vaultLoad(); for (var k in patch) v[k] = patch[k]; return vaultSave(v); }
  function vaultForget() { try { root.localStorage && root.localStorage.removeItem(VAULT_KEY); } catch (e) {} return {}; }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. SMART REMINDER ENGINE 24/7/365  (Art.5)
  // input: vault {insuranceExpiry, pucExpiry, rcExpiry, odoKm, lastServiceKm, lastServiceDate,
  //               tyreKm, tyreYears, batteryMonths, chainKmSinceLube, dailyKm}
  // ───────────────────────────────────────────────────────────────────────────
  function reminders(v, today) {
    v = v || {}; var out = []; var dailyKm = num(v.dailyKm) || 40;
    function add(kind, urgent, msg, due) { out.push({ kind: kind, urgent: urgent, due: due, msg: msg }); }

    var di = daysUntil(v.insuranceExpiry, today);
    if (di !== null) { if (di <= 30) add('Insurance', di <= 7, 'Insurance expires in ' + di + ' day(s). Renewing late risks a fine + break in cover. Compare insurers to save before you renew.', di); }
    var dp = daysUntil(v.pucExpiry, today);
    if (dp !== null) { if (dp <= 30) add('PUC', dp <= 7, 'PUC expires in ' + dp + ' day(s). Riding without a valid PUC is a fine — get it at the nearest centre.', dp); }
    var dr = daysUntil(v.rcExpiry, today);
    if (dr !== null) { if (dr <= 365) add('RC', dr <= 90, 'RC expires in ' + dr + ' day(s). Renew at the RTO (RC validity is 15 years for new vehicles).', dr); }

    // Service — km OR months, whichever comes first.
    var sinceKm = num(v.odoKm) - num(v.lastServiceKm);
    var sinceMonths = v.lastServiceDate ? Math.floor((-(daysUntil(v.lastServiceDate, today) || 0)) / 30) : null;
    var kmToService = 3000 - sinceKm;
    var monthsToService = sinceMonths === null ? null : (6 - sinceMonths);
    if ((sinceKm >= 2500) || (sinceMonths !== null && sinceMonths >= 5)) {
      var etaKm = Math.max(0, kmToService);
      add('Service', sinceKm >= 3000 || (sinceMonths !== null && sinceMonths >= 6), 'Service due ' + (etaKm <= 0 ? 'now' : 'in about ' + etaKm + ' km') + (monthsToService !== null ? ' / ' + Math.max(0, monthsToService) + ' month(s)' : '') + ' (whichever first). Estimated ₹2,500.', etaKm);
    }
    // Tyre — 20,000 km OR 3 years.
    if (num(v.tyreKm) >= RULES.tyre_life_km - 2000 || num(v.tyreYears) >= RULES.tyre_life_years) {
      add('Tyre', num(v.tyreKm) >= RULES.tyre_life_km || num(v.tyreYears) >= RULES.tyre_life_years, 'Tyres are near/at end of life (worn tyres raise accident risk ~3×). Replace soon — expected ' + band(1500, 2800) + '.', null);
    }
    // Battery — 24 months.
    if (num(v.batteryMonths) >= 22) add('Battery', num(v.batteryMonths) >= 24, 'Battery is ' + num(v.batteryMonths) + ' months old. Get it tested before it fails you on a bad day.', null);
    // Chain — every 500 km.
    if (num(v.chainKmSinceLube) >= 450) add('Chain', num(v.chainKmSinceLube) >= 500, 'Chain cleaning + lube due (every 500 km). 15-min safe DIY.', null);
    // Tyre pressure — monthly nudge (always on).
    add('Tyre pressure', false, 'Monthly: check tyre pressure (typical 28–32 PSI front, 32–36 PSI rear — see your sticker).', null);

    out.sort(function (a, b) { return (b.urgent - a.urgent) || ((a.due == null ? 999 : a.due) - (b.due == null ? 999 : b.due)); });
    return {
      module: 'reminders', count: out.length, urgentCount: out.filter(function (r) { return r.urgent; }).length,
      items: out,
      summary: out.length ? (out.filter(function (r) { return r.urgent; }).length + ' urgent, ' + out.length + ' total reminder(s).') : 'Nothing urgent right now — Chitti is watching.',
      confidence: 'high (deterministic date/km math)',
      risks: ['Reminders use the dates/km you entered — keep them current.', 'Chitti shows reminders; it never renews or pays on its own without your Yes (Golden Rule).'],
      sources: src()
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. PRE-PURCHASE INSPECTION & BUY ASSISTANT  (CEOS §8)
  // Honest probability, NEVER "guaranteed clean" (Cars24 doctrine). Combines a
  // deterministic checklist score + risk flags. input: {asking, expectedMarket, owners,
  // serviceHistory(bool), accidentSigns(bool), floodSigns(bool), odoSuspect(bool),
  // batteryMonths, tyreKm, rcClear(bool), insuranceValid(bool)}
  // ───────────────────────────────────────────────────────────────────────────
  function inspect(inp) {
    inp = inp || {}; var score = 100; var good = [], check = [], risk = [];
    if (inp.serviceHistory) good.push('Complete service history'); else { score -= 12; check.push('No/partial service history — ask for bills'); }
    if (num(inp.owners) <= 1) good.push('Single owner'); else { score -= 6 * (num(inp.owners) - 1); check.push(num(inp.owners) + ' previous owners'); }
    if (inp.rcClear) good.push('RC clear (no hypothecation pending)'); else { score -= 8; check.push('Verify RC + hypothecation/loan closure on mParivahan'); }
    if (inp.insuranceValid) good.push('Insurance valid'); else { score -= 4; check.push('Insurance lapsed — factor renewal cost'); }
    if (num(inp.batteryMonths) >= 24) { score -= 4; check.push('Battery ' + num(inp.batteryMonths) + ' months old (~₹1,500)'); }
    if (num(inp.tyreKm) >= RULES.tyre_life_km - 4000) { score -= 4; check.push('Tyres near end of life (~₹1,800)'); }
    // Hard risk flags — these CAP the score and are surfaced loudly.
    if (inp.accidentSigns) { score -= 25; risk.push('Signs of a major accident (misaligned panels/welds/repaint) — walk away or get a workshop inspection'); }
    if (inp.floodSigns) { score -= 30; risk.push('Possible flood damage (rust in odd places, water-line, musty smell, silt) — high failure risk'); }
    if (inp.odoSuspect) { score -= 20; risk.push('Odometer looks tampered (km too low for age/wear) — cross-check service bills + insurance history. A high suspicion is NOT proof; a low one is NOT a guarantee.'); }
    score = clamp(Math.round(score), 0, 100);

    var market = num(inp.expectedMarket);
    var negLo = market ? Math.round(market * 0.90) : null, negHi = market ? Math.round(market * 0.96) : null;
    var asking = num(inp.asking);
    var verdict = score >= 80 ? 'Good buy' : score >= 60 ? 'Buy with caution — negotiate hard' : 'Avoid / inspect at a workshop first';
    var status = score >= 80 ? 'ok' : score >= 60 ? 'warning' : 'bad';
    var offer = null;
    if (market) { offer = Math.round(market * (score >= 80 ? 0.93 : score >= 60 ? 0.88 : 0.82)); }

    return {
      module: 'inspect', score: score, verdict: verdict, status: status,
      expectedMarket: market || null, negotiationRange: market ? band(negLo, negHi) : null,
      asking: asking || null, suggestedOffer: offer,
      good: good, check: check, risk: risk,
      summary: 'Buy Score ' + score + '/100 — ' + verdict + '.' + (market ? ' Expected ' + inr(market) + (asking ? '; seller asking ' + inr(asking) + ' → offer around ' + inr(offer) + '.' : '.') : ''),
      confidence: (inp.accidentSigns || inp.floodSigns || inp.odoSuspect) ? 'medium — visible-signs based; a physical/workshop inspection is the final word' : 'medium — checklist based, not a workshop teardown',
      risks: ['This is a guided checklist, NOT a workshop inspection. A high score is not a guarantee; a low score is not proof of fraud.',
              'Accident/flood/odometer history is not in any public API — verify with service bills, insurance claim history, and a trusted mechanic.',
              'Always get a road test + a mechanic to inspect before paying.'].concat(risk.length ? [] : []),
      sources: src()
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. INSURANCE INTELLIGENCE  (Art.7 — compare 8+ insurers, show savings)
  // input: {current:{name, premium}}  → ranked cheaper/better options.
  // We compare on the user-entered premium vs published CSR; live premiums = partner API (PLANNED).
  // ───────────────────────────────────────────────────────────────────────────
  function ageFactor(years) {
    var t = RULES.insurance_model.age_factor;
    for (var i = 0; i < t.length; i++) { if (years <= t[i].upTo) return t[i].f; }
    return t[t.length - 1].f;
  }
  // Deterministic per-insurer premium estimate from IDV + vehicle age + class.
  function estimatePremium(insurerIndex, idv, years, vclass) {
    var m = RULES.insurance_model;
    var od = idv * m.od_base_rate * ageFactor(years);
    var tp = m.tp_by_class[classOf(vclass)] || m.tp_by_class.commuter;
    // per-insurer spread: index 0 (highest CSR) priced a touch higher; cheaper down the list. ±10%.
    var factor = 1.08 - (insurerIndex * 0.022);
    return Math.round((od * factor) + tp);
  }
  function insuranceCompare(inp) {
    inp = inp || {}; var cur = inp.current || {}; var curPrem = num(cur.premium);
    var vclass = classOf(inp.vclass || (vaultLoad().vclass));
    var idv = num(inp.idv) || RULES.insurance_model.default_idv[vclass];
    var years = num(inp.vehicleAgeYears);
    var ranked = RULES.insurers.slice().sort(function (a, b) { return b.csr - a.csr; });
    var options = ranked.map(function (o, i) {
      var est = estimatePremium(i, idv, years, vclass);     // ALWAYS a real computed number
      return { name: o.name, csr: o.csr, bestFor: o.bestFor, estPremium: est, estSaving: curPrem ? Math.max(0, curPrem - est) : null };
    });
    // cheapest estimated option = best value (tie-break: higher CSR)
    var cheapest = options.slice().sort(function (a, b) { return (a.estPremium - b.estPremium) || (b.csr - a.csr); })[0];
    var best = curPrem ? options.filter(function (o) { return o.estSaving > 0; }).sort(function (a, b) { return b.estSaving - a.estSaving; })[0] || cheapest : cheapest;
    return {
      module: 'insurance', current: cur.name ? (cur.name + (curPrem ? ' ' + inr(curPrem) : '')) : 'not set',
      idv: idv, vclass: vclass, options: options, best: best,
      summary: curPrem && best.estSaving > 0
        ? ('Best value: ' + best.name + ' — est. ' + inr(best.estPremium) + ' (save ~' + inr(best.estSaving) + ' vs your ' + inr(curPrem) + '), CSR ' + best.csr + '%.')
        : ('Cheapest estimate: ' + cheapest.name + ' ~' + inr(cheapest.estPremium) + ' at IDV ' + inr(idv) + '. Pick on CSR + cover, not price alone.'),
      lateFee: RULES.insurance_late_fee,
      confidence: 'medium — IDV-based ESTIMATE (own-damage + IRDAI third-party), reproducible; confirm exact premium on the insurer site',
      risks: ['Premiums are computed ESTIMATES from IDV + age, not binding quotes — confirm on the insurer site before buying.',
              'Pick on Claim-Settlement-Ratio + cover, not price alone — a cheap policy that does not pay is no saving.',
              'Chitti never buys a policy without your explicit Yes (Golden Rule).'],
      sources: src().concat(['IRDAI third-party 2W rate bands + own-damage IDV model; insurer CSRs (IRDAI annual, indicative)'])
    };
  }
  // Real DIY step content for an education module.
  function educationSteps(id) {
    var m = RULES.education.filter(function (e) { return e.id === id; })[0];
    if (!m) return { module: 'education_steps', found: false, summary: 'Pick a topic to learn.', confidence: 'n/a', risks: [], sources: src() };
    var tri = RULES.triage[m.tier];
    return { module: 'education_steps', found: true, id: m.id, title: m.title, mins: m.mins, tier: m.tier, tierSym: tri.sym, tierWord: tri.word, steps: m.steps,
      summary: tri.sym + ' ' + m.title + (m.mins ? ' (~' + m.mins + ' min)' : '') + ': ' + m.steps.length + ' steps.',
      confidence: 'high (curated DIY steps)',
      risks: m.tier === 'mechanic' ? ['Understand-only — this repair is mechanic-only, do not attempt it.'] : ['Stop if anything feels unsafe and ask a mechanic.'],
      sources: src().concat(['DIY steps: Haynes-style 2W maintenance + OEM owner manuals']) };
  }
  // Real Google-Maps deep-link for the nearest centre (works on any device, no API key).
  function nearestQuery(kind, area) {
    var what = { puc: 'PUC pollution check centre', mechanic: '2 wheeler mechanic', tyre: 'two wheeler tyre shop', service: 'two wheeler service centre', petrol: 'petrol pump', rto: 'RTO office' }[kind] || (kind + ' near me');
    var q = encodeURIComponent(what + (area ? ' near ' + area : ' near me'));
    return { module: 'nearest', kind: kind, url: RULES.maps_base + q, label: 'Open Maps: ' + what,
      summary: 'Tap to find the nearest ' + what + ' on Maps.', confidence: 'high', risks: ['Opens your maps app — Chitti does not share your location anywhere.'], sources: src() };
  }
  // Real outbound deep-links (work on any device, no API key) — Buy Now / Find deals /
  // Watch video / List for sale. Chitti opens them on a tap; it never transacts itself.
  function links() {
    return {
      insurer: function (name) { return 'https://www.google.com/search?q=' + encodeURIComponent('buy ' + (name || '') + ' two wheeler insurance renew online'); },
      tyreDeals: RULES.maps_base + encodeURIComponent('two wheeler tyre shop near me'),
      mechanic: RULES.maps_base + encodeURIComponent('2 wheeler mechanic near me'),
      video: function (q) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent((q || 'two wheeler') + ' two wheeler DIY how to'); },
      sell: function (make) { return 'https://www.olx.in/items/q-' + encodeURIComponent(make || 'bike'); }
    };
  }
  // Real .ics calendar file for a reminder — a working, offline reminder mechanism
  // (no SMS gateway needed). Dates are computed from the vault; user taps to add to their calendar.
  function icsForReminder(title, isoDate) {
    if (!isoDate) return null;
    var d = new Date(isoDate); if (isNaN(d)) return null;
    var dt = isoDate.replace(/-/g, '');
    var stamp = dt + 'T090000';
    var uid = 'mech2w-' + dt + '-' + (title || 'reminder').replace(/\W+/g, '').slice(0, 16);
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chitti Mechanic 2W//EN', 'BEGIN:VEVENT',
      'UID:' + uid, 'DTSTART;VALUE=DATE:' + dt, 'SUMMARY:' + (title || 'Chitti reminder'),
      'DESCRIPTION:Chitti Mechanic 2 Wheeler reminder', 'BEGIN:VALARM', 'TRIGGER:-P7D', 'ACTION:DISPLAY',
      'DESCRIPTION:' + (title || 'Chitti reminder'), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. PUC INTELLIGENCE  (CEOS §10)
  // ───────────────────────────────────────────────────────────────────────────
  function pucStatus(v, today) {
    v = v || {}; var d = daysUntil(v.pucExpiry, today);
    var status = d === null ? 'info' : d < 0 ? 'bad' : d <= 7 ? 'warning' : d <= 30 ? 'warning' : 'ok';
    return {
      module: 'puc', daysLeft: d,
      summary: d === null ? 'Add your PUC expiry date so Chitti can remind you.' : d < 0 ? 'PUC EXPIRED ' + (-d) + ' day(s) ago — riding now risks a fine. Renew today.' : 'PUC valid for ' + d + ' more day(s).' + (d <= 30 ? ' Renew soon at the nearest centre.' : ''),
      status: status,
      nearest: 'Use Maps for the nearest PUC centre (most petrol pumps issue PUC). Live centre lookup = location service (PLANNED).',
      confidence: 'high (deterministic date math)',
      risks: ['Fine for no valid PUC. Chitti reminds; it does not pay the fine for you.'],
      sources: src()
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. SERVICE INTELLIGENCE — schedule + oil/parts  (Art.6, CEOS §11)
  // ───────────────────────────────────────────────────────────────────────────
  function serviceSchedule(v) {
    v = v || {}; var odo = num(v.odoKm), lastKm = num(v.lastServiceKm), since = odo - lastKm;
    var due = RULES.service.filter(function (s) { return (since % s.km) >= (s.km - 600) || since >= s.km; })
      .map(function (s) { return s.item + ' (' + s.who + ', ' + s.cost + ') ' + RULES.triage[s.tier].sym; });
    var oilKey = RULES.classes[classOf(v.vclass)].oil; var oil = RULES.oils[oilKey];
    return {
      module: 'service', kmSinceService: since,
      dueItems: due.length ? due : ['Nothing overdue — next oil change at ~' + oil.interval_km + ' km intervals.'],
      oil: oilKey === 'none' ? null : { grade: oil.grade, brandRef: oil.brandRef, equiv: oil.equiv, interval_km: oil.interval_km, qty_l: oil.qty_l, price: oil.price },
      summary: oilKey === 'none' ? 'EV — no engine oil. Focus on brake fluid, tyres, battery health.' : 'Recommended oil: ' + oil.grade + ' (e.g. ' + oil.brandRef + ' or ' + oil.equiv + '), ~' + oil.qty_l + ' L every ' + oil.interval_km + ' km. ' + oil.price + '.',
      confidence: 'high (manufacturer-class service table)',
      risks: ['Always confirm the exact grade in YOUR owner\'s manual — engine damage from a wrong grade is on you.',
              'Use the right JASO spec (MA2 for wet-clutch bikes, MB for scooters) or the clutch can slip.'],
      sources: src().concat(['Oil-grade references: Servo/Motul/Shell/Castrol India product guides'])
    };
  }
  function oilRecommend(vclass) { var k = RULES.classes[classOf(vclass)].oil; var o = RULES.oils[k]; return { vclass: classOf(vclass), oil: o, confidence: 'high', risks: ['Confirm grade in owner\'s manual.'], sources: src() }; }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. TYRE INTELLIGENCE  (CEOS §12)
  // ───────────────────────────────────────────────────────────────────────────
  function tyreStatus(v) {
    v = v || {}; var km = num(v.tyreKm), yrs = num(v.tyreYears);
    var wornKm = km >= RULES.tyre_life_km, wornYr = yrs >= RULES.tyre_life_years;
    var status = (wornKm || wornYr) ? 'bad' : (km >= RULES.tyre_life_km - 4000) ? 'warning' : 'ok';
    return {
      module: 'tyre', status: status, km: km, years: yrs,
      replace: wornKm || wornYr,
      summary: (wornKm || wornYr) ? 'REPLACE NOW — tyres past ' + (wornKm ? RULES.tyre_life_km + ' km' : RULES.tyre_life_years + ' yrs') + '. Worn tyres raise accident risk ~3×.' : status === 'warning' ? 'Tyres getting close to end of life — plan a replacement.' : 'Tyres OK. Keep pressure correct for life + mileage.',
      confidence: 'high (km/age rule)',
      risks: ['Also replace on visible cracks, cuts, or tread below the wear indicator — not just km.'],
      sources: src()
    };
  }
  function tyreRecommend(usage) {
    usage = (usage || 'allround').toLowerCase();
    var picks = RULES.tyres.filter(function (t) { return t.usage.indexOf(usage) > -1; });
    if (!picks.length) picks = RULES.tyres.filter(function (t) { return t.usage.indexOf('allround') > -1; });
    return {
      module: 'tyre_reco', usage: usage,
      options: picks.map(function (t) { return { name: t.name, best: t.best, price: t.price }; }),
      summary: 'For "' + usage + '": ' + picks.map(function (t) { return t.name + ' (' + t.price + ')'; }).join(', ') + '.',
      confidence: 'medium — by usage pattern; confirm the correct SIZE on your tyre sidewall',
      risks: ['Fit the OEM size printed on your current tyre sidewall (e.g. 90/90-12). Wrong size affects handling.'],
      sources: src().concat(['Tyre catalogue: CEAT/Eurogrip/Michelin/MRF/Apollo India 2026'])
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 8. BATTERY INTELLIGENCE  (CEOS §13)
  // ───────────────────────────────────────────────────────────────────────────
  function batteryStatus(v) {
    v = v || {}; var type = RULES.batteries[v.vclass === 'scooter' ? 'scooter' : v.vclass === 'ev' ? 'ev' : 'motorcycle'];
    var age = num(v.batteryMonths); var life = type.life_months;
    var status = age >= life ? 'bad' : age >= life - 4 ? 'warning' : 'ok';
    return {
      module: 'battery', spec: type.spec, ageMonths: age, expectedLifeMonths: life, cost: type.cost, status: status,
      summary: age >= life ? 'Battery past typical life (' + life + ' mo). Get it tested/replaced (' + type.cost + ').' : age >= life - 4 ? 'Battery nearing end of life — test it before it strands you.' : 'Battery healthy (' + age + '/' + life + ' months).',
      confidence: 'medium — age-based; a load test is the real check',
      risks: ['Heat + short trips shorten battery life. A multimeter reading <12.4V (rest) means weak.'],
      sources: src()
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 9. FUEL INTELLIGENCE — petrol→EV ROI  (CEOS §14)
  // input: {monthlyKm, mileageKmpl, petrolPrice, evCostPerMonth, evNetPrice}
  // ───────────────────────────────────────────────────────────────────────────
  function fuelEvRoi(inp) {
    inp = inp || {};
    var monthlyKm = num(inp.monthlyKm) || 1000, kmpl = num(inp.mileageKmpl) || 45, petrol = num(inp.petrolPrice) || 105;
    var petrolMonthly = Math.round((monthlyKm / kmpl) * petrol);
    var evMonthly = num(inp.evCostPerMonth) || 1200;
    var monthlySaving = petrolMonthly - evMonthly;
    var net = num(inp.evNetPrice) || 95000;
    var payback = monthlySaving > 0 ? Math.ceil(net / monthlySaving) : null;
    return {
      module: 'fuel_ev', petrolMonthly: petrolMonthly, petrolYearly: petrolMonthly * 12, evMonthly: evMonthly,
      monthlySaving: monthlySaving, yearlySaving: monthlySaving * 12, netSwitchCost: net, paybackMonths: payback,
      summary: monthlySaving > 0 ? ('Petrol ~' + inr(petrolMonthly) + '/mo vs EV ~' + inr(evMonthly) + '/mo → save ~' + inr(monthlySaving) + '/mo (' + inr(monthlySaving * 12) + '/yr). Payback on ' + inr(net) + ' ≈ ' + payback + ' months.') : 'At your usage, an EV switch does not clearly pay back yet — petrol is cheaper for now.',
      confidence: 'medium — depends on your real km, electricity tariff & resale value',
      risks: ['Battery replacement cost, charging access, and resale value affect real ROI.',
              'Numbers are estimates from your inputs, not a guarantee.'],
      sources: src()
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 10. VEHICLE EDUCATION  (CEOS §15)
  // ───────────────────────────────────────────────────────────────────────────
  function educationList() { return { module: 'education', modules: RULES.education.slice(), confidence: 'high', risks: ['"Understand only" modules (engine/brakes) are knowledge, not DIY — those repairs are mechanic-only.'], sources: src() }; }

  // ───────────────────────────────────────────────────────────────────────────
  // 11. DIAGNOSTICS & OBD DOCTOR  (CEOS §16) — plain-language code lookup
  // ───────────────────────────────────────────────────────────────────────────
  function obdLookup(code) {
    code = (code || '').toUpperCase().trim();
    var hit = RULES.obd[code];
    if (!hit) return { module: 'obd', found: false, summary: 'Code "' + code + '" is not in Chitti\'s library. Most Indian 2-wheelers do not expose OBD2 — describe the SYMPTOM instead and Chitti will triage it. (Chitti never invents a meaning it does not know.)', confidence: 'n/a', risks: ['Unknown code — do not guess. Use symptom triage or a mechanic.'], sources: src() };
    var tri = RULES.triage[hit.tier];
    return {
      module: 'obd', found: true, code: code, meaning: hit.meaning, tier: hit.tier, tierSym: tri.sym, tierWord: tri.word, cost: hit.cost,
      summary: code + ': ' + hit.meaning + '. ' + tri.sym + ' ' + tri.word + '. Likely cost ' + hit.cost + '.',
      confidence: 'high (code → meaning is deterministic)',
      risks: ['A code points at a system, not the exact part — a mechanic confirms the root cause.'],
      sources: src()
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 12. SCAM DETECTOR & REPAIR-COST INTELLIGENCE  (CEOS §17, SOP6)
  // input: {item, quote, expectedLo, expectedHi}  — if expected omitted, uses service table.
  // ───────────────────────────────────────────────────────────────────────────
  function scamCheck(inp) {
    inp = inp || {}; var quote = num(inp.quote); var lo = num(inp.expectedLo), hi = num(inp.expectedHi);
    if (!lo && !hi && inp.item) {
      var match = RULES.service.filter(function (s) { return s.item.toLowerCase().indexOf((inp.item || '').toLowerCase()) > -1; })[0];
      if (match) { var m = match.cost.replace(/[₹,]/g, '').split('–'); lo = num(m[0]); hi = num(m[1]) || lo; }
    }
    if (!hi) hi = lo;
    var overPct = hi ? Math.round(((quote - hi) / hi) * 100) : null;
    var scam = overPct !== null && overPct > RULES.scam_threshold_pct;
    var status = scam ? 'bad' : (overPct !== null && overPct > 0) ? 'warning' : 'ok';
    return {
      module: 'scam', item: inp.item || 'repair', quote: quote, expected: (lo || hi) ? band(lo, hi) : null, overPct: overPct, scamAlert: scam,
      summary: (lo || hi) ? (scam ? '⚠️ Quote ' + inr(quote) + ' is ~' + overPct + '% above the fair range ' + band(lo, hi) + '. Negotiate, buy the part yourself, or get a second quote.' : overPct > 0 ? 'Quote ' + inr(quote) + ' is a bit above fair (' + band(lo, hi) + ') — mild, negotiable.' : 'Quote ' + inr(quote) + ' is within the fair range ' + band(lo, hi) + '.') : 'Tell Chitti the item so it can check the fair range.',
      confidence: (lo || hi) ? 'high (fair-range table)' : 'info',
      risks: ['Fair ranges are typical bands; genuine OEM parts + warranty can justify a higher price.',
              'Always ask for the OLD part back and a bill (GST) — that alone cuts scams.'],
      sources: src().concat(['Fair-price bands: service catalogue + GoMechanic/Apna Mechanic public package pricing'])
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 13. DIY-vs-MECHANIC TRIAGE  (Art.8, CEOS §18)
  // ───────────────────────────────────────────────────────────────────────────
  function triage(tier) {
    var t = RULES.triage[tier] || RULES.triage.mechanic;
    return { module: 'triage', tier: tier in RULES.triage ? tier : 'mechanic', sym: t.sym, word: t.word, examples: t.egs, all: RULES.triage,
      summary: t.sym + ' ' + t.word + (tier === 'mechanic' ? ' — do NOT attempt; take it to a mechanic (safety).' : tier === 'caution' ? ' — only if you are confident; follow the guide.' : ' — safe to do yourself with Chitti\'s coaching.'),
      confidence: 'high (safety classification)',
      risks: ['When unsure, treat it as 🔴 mechanic-only. Safety always wins (Founder Rule).'],
      sources: src() };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 14. SELL ASSISTANT & VALUATION  (CEOS §19)
  // input: {expectedMarket, condition('excellent'|'good'|'fair'), serviceHistory, insuranceValid, pucValid}
  // ───────────────────────────────────────────────────────────────────────────
  function sellAssistant(inp) {
    inp = inp || {}; var m = num(inp.expectedMarket);
    var condMul = inp.condition === 'excellent' ? 1.05 : inp.condition === 'fair' ? 0.88 : 0.97;
    var listing = m ? Math.round(m * condMul * 1.06) : null;     // list a bit above to leave negotiation room
    var likely = m ? Math.round(m * condMul * 0.97) : null;
    var checklist = [
      (inp.serviceHistory ? '✅' : '⬜') + ' Service history ready',
      (inp.insuranceValid ? '✅' : '⬜') + ' Insurance valid',
      (inp.pucValid ? '✅' : '⬜') + ' PUC valid',
      '⬜ Clean + minor fixes (wash, polish, bulb, chain) lift the price'
    ];
    return {
      module: 'sell', expectedMarket: m || null, idealListing: listing, likelySelling: likely, bestTime: 'Within ~2 months (older = lower)',
      checklist: checklist,
      summary: m ? ('Expected market ' + inr(m) + '. List around ' + inr(listing) + ', likely sell near ' + inr(likely) + '. Valid papers + service history fetch the most.') : 'Enter the expected market value for a listing-price suggestion.',
      confidence: 'medium — market value varies by city/condition/demand',
      risks: ['Transfer the RC + cancel/transfer insurance after sale, or you stay liable.',
              'Chitti suggests; it does not list or sell on your behalf without your Yes.'],
      sources: src().concat(['Used-2W valuation pattern: OBV / BikeWale / Droom (indicative)'])
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 15. SAVINGS TRACKER  (Art.9 — ₹10k+ honest goal)
  // input: array of {category, amount} OR pulls from vault.savings[]
  // ───────────────────────────────────────────────────────────────────────────
  function savings(entries) {
    entries = entries || (vaultLoad().savings) || [];
    var total = entries.reduce(function (s, e) { return s + num(e.amount); }, 0);
    var pct = clamp(Math.round((total / RULES.savings_goal) * 100), 0, 100);
    return {
      module: 'savings', total: total, goal: RULES.savings_goal, pct: pct, entries: entries,
      summary: 'Saved ' + inr(total) + ' so far (' + pct + '% of the ₹' + RULES.savings_goal.toLocaleString('en-IN') + ' annual goal). Every saving is logged transparently.',
      confidence: 'high (sum of logged savings)',
      risks: ['This is a TRACKER of savings you confirmed — not a guarantee of future savings (Art.9).'],
      sources: src()
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VEHICLE TWIN + OWNERSHIP SCORES + AI COACH
  // ───────────────────────────────────────────────────────────────────────────
  function twin(v) {
    v = v || vaultLoad();
    var have = ['make', 'serviceHistory', 'insuranceExpiry', 'pucExpiry', 'tyreKm', 'batteryMonths'].filter(function (k) { return v[k]; }).length;
    var resale = clamp(40 + have * 10, 0, 100);
    return { module: 'twin', timeline: ['Purchase', 'Service', 'Repairs', 'Insurance', 'PUC', 'Tyres', 'Battery', 'Chain', 'Accidents'], resaleReadiness: resale,
      summary: 'Vehicle Twin holds your full history on THIS device only. Resale readiness ' + resale + '/100 (more complete records = higher resale trust).',
      confidence: 'high', risks: ['Stored locally only (Art.4). "Chitti forget" wipes it.'], sources: src() };
  }
  function scores(v) {
    v = v || vaultLoad();
    var buy = num(v.buyScore) || null;
    var maint = clamp((v.serviceHistory ? 60 : 30) + (num(v.lastServiceKm) ? 30 : 0), 0, 100);
    var safety = clamp(100 - (num(v.tyreKm) >= RULES.tyre_life_km ? 30 : 0) - (num(v.batteryMonths) >= 24 ? 10 : 0), 0, 100);
    var resale = twin(v).resaleReadiness;
    return { module: 'scores', buy: buy, maintenance: maint, safety: safety, resale: resale,
      summary: 'Maintenance ' + maint + '/100 · Safety ' + safety + '/100 · Resale ' + resale + '/100' + (buy ? ' · last Buy score ' + buy + '/100' : '') + '.',
      confidence: 'medium — derived from the records you have entered', risks: ['Scores improve as you log more (services, papers, tyre/battery).'], sources: src() };
  }
  // AI Coach — deterministic symptom triage; DeepSeek narration is an optional enhancement.
  function coach(symptomId) {
    var s = RULES.symptoms.filter(function (x) { return x.id === symptomId; })[0];
    if (!s) return { module: 'coach', found: false, options: RULES.symptoms.map(function (x) { return { id: x.id, q: x.q }; }),
      summary: 'Describe what is happening (or pick a symptom). Chitti never guesses a cause it cannot reason about.',
      confidence: 'n/a', risks: ['If you cannot find your symptom, treat it as caution and ask a mechanic.'], sources: src() };
    var tri = RULES.triage[s.tier];
    return { module: 'coach', found: true, id: s.id, question: s.q, causes: s.causes, tier: s.tier, tierSym: tri.sym, tierWord: tri.word, diy: s.diy,
      summary: 'Likely: ' + s.causes.join(' OR ') + '. ' + tri.sym + ' ' + tri.word + '. ' + s.diy,
      confidence: s.conf + ' — symptom triage, not a certain diagnosis',
      risks: ['This is a starting point, not a definitive diagnosis — confirm with a mechanic.',
              s.tier === 'mechanic' ? 'Safety-critical — do not ride / do not DIY.' : 'Stop if anything feels unsafe.'],
      sources: src() };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EMERGENCY (Golden Rule — surface, never auto-dial)
  // ───────────────────────────────────────────────────────────────────────────
  function emergency() {
    return { module: 'emergency', numbers: RULES.emergency.numbers, note: RULES.emergency.note,
      summary: 'Accident or injury? ' + RULES.emergency.numbers.join(' · ') + '. Chitti will ask before calling — it never auto-dials.',
      confidence: 'high', risks: ['In a real emergency, call directly if you are able. Chitti confirms first by design (Golden Rule).'], sources: src() };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ───────────────────────────────────────────────────────────────────────────
  var API = {
    RULES: RULES,
    vault: { load: vaultLoad, save: vaultSave, set: vaultSet, forget: vaultForget, KEY: VAULT_KEY },
    reminders: reminders,
    inspect: inspect,
    insuranceCompare: insuranceCompare,
    pucStatus: pucStatus,
    serviceSchedule: serviceSchedule, oilRecommend: oilRecommend,
    tyreStatus: tyreStatus, tyreRecommend: tyreRecommend,
    batteryStatus: batteryStatus,
    fuelEvRoi: fuelEvRoi,
    educationList: educationList, educationSteps: educationSteps,
    nearestQuery: nearestQuery, icsForReminder: icsForReminder, links: links,
    obdLookup: obdLookup,
    scamCheck: scamCheck,
    triage: triage,
    sellAssistant: sellAssistant,
    savings: savings,
    twin: twin, scores: scores, coach: coach,
    emergency: emergency,
    // helpers exposed for the page renderer/tests
    _util: { inr: inr, band: band, daysUntil: daysUntil }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.ChittiMech2W = API;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
