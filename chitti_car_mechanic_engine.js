/* Chitti Car Mechanic — Deterministic 4-Wheeler Ownership Engine
 * Frontend for chitti-car-mechanic/  (CEOS v1.0, built 2026-06-13)
 *
 * RULES ARE THE PRODUCT. THE LLM (DeepSeek) IS AN ENHANCEMENT, NEVER A DEPENDENCY.
 * Every verdict, rupee band, date, score and triage colour shown to a user is computed
 * HERE from the user's own inputs + VERSIONED rule tables — never invented by an LLM.
 * Works with the internet down, DeepSeek 429 and Turso blocked. Pure, dependency-free,
 * node-testable. The LLM only *phrases/explains*; it never produces a number or a verdict.
 *
 * SAFETY IS SUPREME. Calibrated honesty is a hard gate:
 *   - Every diagnostic carries { confidence, canDrive, risks[], sources[] }.
 *   - Safety-critical systems (airbag/SRS, ABS, brakes, fuel rail, EV HV/orange, AC refrigerant,
 *     steering, suspension, timing belt) are NEVER classified Safe-DIY. Ever.
 *   - When confidence is low or data is unverifiable → say "I'm not sure — see a mechanic".
 *     Never fabricate. (CEOS §25 hallucination rule.)
 *   - Emergency = FAMILY CASCADE, never auto-dial cops/ambulance (SAHAYAI_MASTER §2 lock).
 *
 * Spec: chitti-car-mechanic/ARCHITECTURE.md · EVALS.md · GUARDRAILS.md · BUILD_ORDER.md
 */
(function (root) {
  'use strict';

  // ───────────────────────────────────────────────────────────────────────────
  // VERSIONED RULE TABLES  (change the table, never the logic — MEMORY.md)
  // Every band below is a published Indian-market reference range, not an LLM guess.
  // ───────────────────────────────────────────────────────────────────────────
  var RULES = {
    version: '1.0.0',
    market: 'IN',
    effective_from: '2026-06-13',
    diy_safe_only: ['bulb', 'fuse', 'wiper', 'tyre_pressure', 'battery_terminal_clean', 'air_filter', 'cabin_filter', 'coolant_level_check', 'oil_level_check', 'tyre_tread_check'],
    // systems that can NEVER be Safe-DIY (Safety supreme — diy-safety.md)
    never_diy: ['airbag', 'srs', 'abs', 'brake', 'brake_pad', 'brake_fluid', 'fuel', 'fuel_rail', 'ev_hv', 'high_voltage', 'ac_refrigerant', 'ac_gas', 'steering', 'suspension', 'timing_belt', 'transmission', 'engine_internal']
  };

  // ── Indian 4W brands (Article 11) ──
  var BRANDS = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota', 'Kia', 'MG', 'Renault', 'Nissan', 'Ford', 'Volkswagen', 'Skoda', 'BMW', 'Mercedes', 'Audi', 'Volvo', 'Jeep', 'Citroën'];

  // ── helpers ───────────────────────────────────────────────────────────────
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function round(n) { return Math.round(n); }
  // UTC day math — leap/DST safe (mirrors legal_os_engine limitation math)
  function toUTC(d) { var x = new Date(d); return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()); }
  function daysBetween(fromISO, toISO) {
    if (!fromISO || !toISO) return null;
    var a = toUTC(fromISO), b = toUTC(toISO);
    if (isNaN(a) || isNaN(b)) return null;
    return Math.round((b - a) / 86400000);
  }
  function todayISO(asOf) {
    if (asOf) return asOf;
    try { return new Date().toISOString().slice(0, 10); } catch (e) { return '1970-01-01'; }
  }
  function band(lo, hi) { return { lo: round(lo), hi: round(hi) }; }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. DOCUMENT VAULT  (BO1) — local-only; "Chitti forget" wipes everything.
  // ═══════════════════════════════════════════════════════════════════════════
  var VAULT_KEY = 'chitti_carmech_vault_v1';
  var DOC_TYPES = ['insurance', 'puc', 'rc', 'service', 'warranty', 'loan', 'tyre', 'battery', 'extended_warranty', 'invoice'];
  function vaultLoad() {
    try { if (root.localStorage) { var raw = root.localStorage.getItem(VAULT_KEY); return raw ? JSON.parse(raw) : {}; } } catch (e) {}
    return {};
  }
  function vaultSave(obj) {
    try { if (root.localStorage) { root.localStorage.setItem(VAULT_KEY, JSON.stringify(obj || {})); return true; } } catch (e) {}
    return false;
  }
  function vaultSet(key, value) { var v = vaultLoad(); v[key] = value; vaultSave(v); return v; }
  function vaultForget() { try { if (root.localStorage) root.localStorage.removeItem(VAULT_KEY); } catch (e) {} return {}; }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SMART REMINDER ENGINE (BO2) — 24/7/365, deterministic date+km math.
  // Returns every due/upcoming reminder with trigger window + channels + voice text.
  // ═══════════════════════════════════════════════════════════════════════════
  // [type, label, windows(days before expiry), channels, safetyCritical]
  var REMINDER_DATE_RULES = [
    { type: 'insurance', label: 'Insurance', windows: [30, 15, 7, 1], channels: ['Voice', 'SMS', 'WhatsApp', 'Push'], critical: false },
    { type: 'puc', label: 'PUC', windows: [30, 7, 1], channels: ['Voice', 'SMS', 'Push'], critical: false },
    { type: 'rc', label: 'RC', windows: [365, 180, 90, 30], channels: ['Voice', 'SMS'], critical: false },
    { type: 'warranty', label: 'Warranty', windows: [90, 30, 7], channels: ['Voice', 'SMS'], critical: false },
    { type: 'loan', label: 'EMI', windows: [7, 3, 1], channels: ['Voice', 'SMS', 'WhatsApp'], critical: false }
  ];
  // [key, label, everyKm, everyMonths, safetyCritical]
  var SERVICE_INTERVALS = [
    { key: 'engine_oil', label: 'Engine oil + filter', km: 10000, months: 12, critical: false },
    { key: 'air_filter', label: 'Air filter', km: 15000, months: 18, critical: false },
    { key: 'tyre_rotation', label: 'Tyre rotation', km: 10000, months: null, critical: false },
    { key: 'wheel_alignment', label: 'Wheel alignment', km: 10000, months: null, critical: false },
    { key: 'brake_fluid', label: 'Brake fluid', km: null, months: 24, critical: true },
    { key: 'coolant_flush', label: 'Coolant flush', km: null, months: 24, critical: false },
    { key: 'transmission_fluid', label: 'Transmission fluid (auto)', km: 50000, months: null, critical: false },
    { key: 'brake_pads', label: 'Brake pads', km: 35000, months: null, critical: true },
    { key: 'ac_gas', label: 'AC gas refill', km: null, months: 24, critical: false },
    { key: 'timing_belt', label: 'Timing belt', km: 80000, months: null, critical: true }
  ];

  // vehicle = { docs:{insurance:{expiry}, puc:{expiry}, ...}, odometerKm, kmPerMonth, service:{engine_oil:{lastKm,lastDate}, ...}, battery:{installedDate} }
  function reminders(vehicle, asOf) {
    vehicle = vehicle || {};
    var today = todayISO(asOf), out = [];
    REMINDER_DATE_RULES.forEach(function (r) {
      var d = vehicle.docs && vehicle.docs[r.type];
      if (!d || !d.expiry) return;
      var days = daysBetween(today, d.expiry);
      if (days === null) return;
      var fire = days < 0 || r.windows.some(function (w) { return days <= w; });
      if (!fire) return;
      out.push({
        kind: r.label, type: r.type, daysToExpiry: days,
        status: days < 0 ? 'overdue' : (days <= (r.windows[r.windows.length - 1]) ? 'urgent' : 'upcoming'),
        channels: r.channels, critical: r.critical,
        voice: r.label + (days < 0 ? ' expired ' + (-days) + ' days ago. Renew now to avoid penalty.' : ' expires in ' + days + ' days.')
      });
    });
    // km/month service items
    var odo = num(vehicle.odometerKm), kmpm = num(vehicle.kmPerMonth) || 1000;
    (vehicle.service ? SERVICE_INTERVALS : SERVICE_INTERVALS).forEach(function (s) {
      var rec = (vehicle.service && vehicle.service[s.key]) || {};
      var dueByKm = null, dueByDate = null, due = false, detail = [];
      if (s.km && (rec.lastKm != null)) {
        var sinceKm = odo - num(rec.lastKm);
        dueByKm = s.km - sinceKm; // km remaining
        if (dueByKm <= Math.max(500, s.km * 0.05)) { due = true; }
        detail.push(dueByKm <= 0 ? ('overdue by ' + (-dueByKm) + ' km') : ('in ' + dueByKm + ' km'));
      }
      if (s.months && rec.lastDate) {
        var elapsed = daysBetween(rec.lastDate, today);
        dueByDate = s.months * 30 - elapsed; // days remaining
        if (dueByDate <= 30) due = true;
        detail.push(dueByDate <= 0 ? ('overdue by ' + (-dueByDate) + ' days') : ('in ' + dueByDate + ' days'));
      }
      if (due) {
        out.push({
          kind: s.label, type: 'service:' + s.key, critical: s.critical,
          status: ((dueByKm != null && dueByKm <= 0) || (dueByDate != null && dueByDate <= 0)) ? 'overdue' : 'upcoming',
          channels: s.critical ? ['Voice', 'SMS', 'Push'] : ['Voice', 'Push'],
          voice: s.label + ' due ' + detail.join(' OR ') + '.' + (s.critical ? ' Safety-critical — do not delay.' : '')
        });
      }
    });
    // sort: overdue first, then by urgency
    var rank = { overdue: 0, urgent: 1, upcoming: 2 };
    out.sort(function (a, b) { return (rank[a.status] - rank[b.status]) || ((a.daysToExpiry || 0) - (b.daysToExpiry || 0)); });
    return { reminders: out, count: out.length, asOf: today, confidence: 'high', risks: out.length ? ['Reminders only fire for documents you have entered.'] : [], sources: ['CEOS §7 Smart Reminder Engine', 'manufacturer service intervals'] };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. INSURANCE INTELLIGENCE (BO3) — indicative comparison (never a guarantee).
  // Real premiums need a live quote; we rank by published CSR + a relative price index
  // and ALWAYS label the saving as indicative + tell the user to confirm. (§9, §41)
  // ═══════════════════════════════════════════════════════════════════════════
  var INSURERS = [
    { name: 'ACKO', csr: 98.40, idx: 0.86, feature: 'Instant digital claims, photo verification', bestFor: 'Urban' },
    { name: 'HDFC ERGO', csr: 98.10, idx: 0.92, feature: 'EV coverage, doorstep service', bestFor: 'EV owners' },
    { name: 'Royal Sundaram', csr: 97.20, idx: 0.83, feature: '4,500+ garages, 24/7 cashless', bestFor: 'Value' },
    { name: 'ICICI Lombard', csr: 96.80, idx: 1.00, feature: '6,900+ network garages, InstaSpect', bestFor: 'Tech-savvy' },
    { name: 'Bajaj Allianz', csr: 95.00, idx: 0.90, feature: 'Pay-as-you-drive, 4,500+ garages', bestFor: 'Low-mileage' },
    { name: 'SBI General', csr: 94.00, idx: 0.95, feature: 'Government-backed', bestFor: 'SBI customers' },
    { name: 'New India Assurance', csr: 93.00, idx: 0.97, feature: 'PSU, nationwide', bestFor: 'Govt employees' },
    { name: 'Tata AIG', csr: 90.00, idx: 0.94, feature: 'Return-to-invoice add-on', bestFor: 'Trusted brand' }
  ];
  var ADDONS = [
    { addon: 'Zero depreciation', forWhom: 'New cars (first 5 yrs)', impact: '+10-20% premium' },
    { addon: 'Engine cover', forWhom: 'Flood-prone areas', impact: '+5-10% premium' },
    { addon: 'Roadside assistance (RSA)', forWhom: 'All users', impact: '+₹500-1,000' },
    { addon: 'Return to invoice', forWhom: 'Cars > ₹10 lakh', impact: '+15-25% premium' },
    { addon: 'Consumables', forWhom: 'Older cars', impact: '+5-10% premium' },
    { addon: 'NCB protect', forWhom: 'High NCB (50%)', impact: '+5-10% premium' }
  ];
  function insuranceCompare(opts) {
    opts = opts || {};
    var current = num(opts.currentPremium);
    var currentName = opts.currentInsurer || 'your current insurer';
    var baseIdx = (function () { var c = INSURERS.filter(function (i) { return i.name === opts.currentInsurer; })[0]; return c ? c.idx : 1.00; })();
    var rows = INSURERS.map(function (i) {
      var indicative = current ? round(current * (i.idx / baseIdx)) : null;
      var save = (current && indicative != null) ? current - indicative : null;
      return { insurer: i.name, csr: i.csr, feature: i.feature, bestFor: i.bestFor, indicativePremium: indicative, indicativeSaving: save };
    }).sort(function (a, b) {
      if (a.indicativeSaving != null && b.indicativeSaving != null) return b.indicativeSaving - a.indicativeSaving;
      return b.csr - a.csr;
    });
    var best = rows[0];
    return {
      current: { insurer: currentName, premium: current || null },
      options: rows,
      topPick: best,
      addons: ADDONS,
      lateRenewalFee: 1000,
      confidence: 'medium',
      risks: ['Indicative only — premium depends on IDV, NCB, add-ons & city. Confirm the real quote on the insurer site before switching.', 'Never auto-renew without checking a fresh comparison.'],
      sources: ['CEOS §9 Insurance Intelligence', 'IRDAI public claim-settlement-ratio disclosures (FY refreshed annually)']
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. PUC INTELLIGENCE (BO4) — expiry + fine avoided.
  // ═══════════════════════════════════════════════════════════════════════════
  function pucStatus(expiry, asOf) {
    var days = daysBetween(todayISO(asOf), expiry);
    if (days === null) return { status: 'unknown', confidence: 'low', risks: ['No PUC expiry on file.'], sources: ['CEOS §10'] };
    var status = days < 0 ? 'expired' : (days <= 30 ? 'expiring' : 'valid');
    return {
      status: status, daysToExpiry: days,
      fineRisk: status === 'expired' ? band(1000, 10000) : band(0, 0),
      message: status === 'expired' ? ('PUC expired ' + (-days) + ' days ago. Driving without a valid PUC is a fineable offence — renew today at the nearest petrol-pump PUC centre.')
        : status === 'expiring' ? ('PUC expires in ' + days + ' days. Renew soon at the nearest centre.')
          : ('PUC valid for ' + days + ' more days.'),
      confidence: 'high', risks: ['Fine amount varies by state.'], sources: ['CEOS §10 PUC Intelligence', 'CMV Rules']
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SERVICE INTELLIGENCE (BO4) — schedule + oil grade + parts cost + mechanic.
  // ═══════════════════════════════════════════════════════════════════════════
  var SERVICE_COSTS = {
    engine_oil: { label: 'Engine oil + filter', diy: false, cost: band(3000, 6000) },
    air_filter: { label: 'Air filter', diy: true, cost: band(500, 1000) },
    cabin_filter: { label: 'Cabin filter', diy: true, cost: band(500, 1000) },
    brake_fluid: { label: 'Brake fluid', diy: false, cost: band(1500, 2500) },
    coolant_flush: { label: 'Coolant flush', diy: false, cost: band(2000, 3000) },
    transmission_fluid: { label: 'Transmission fluid (auto)', diy: false, cost: band(5000, 10000) },
    brake_pads: { label: 'Brake pads', diy: false, cost: band(3000, 6000) },
    sparkplugs: { label: 'Spark plugs (petrol)', diy: false, cost: band(2000, 5000) },
    fuel_filter: { label: 'Fuel filter (diesel)', diy: false, cost: band(1500, 3000) },
    timing_belt: { label: 'Timing belt', diy: false, cost: band(8000, 15000) },
    ac_gas: { label: 'AC gas refill', diy: false, cost: band(1500, 3000) },
    wheel_alignment: { label: 'Wheel alignment + balancing', diy: false, cost: band(500, 1000) },
    tyre_rotation: { label: 'Tyre rotation', diy: true, cost: band(200, 500) }
  };
  // oil by fuel/segment (§11.2)
  var OIL = {
    petrol: { oil: 'Shell Helix / Castrol Magnatec', grade: '5W-30', interval: '10,000 km' },
    diesel: { oil: 'Shell Rimula / Mobil Delvac', grade: '5W-40', interval: '7,500 km' },
    performance: { oil: 'Castrol Edge / Mobil 1', grade: '0W-40', interval: '15,000 km' },
    ev: { oil: 'No engine oil', grade: 'N/A', interval: 'N/A' }
  };
  function oilRecommendation(fuel, segment) {
    var f = (fuel || 'petrol').toLowerCase();
    if (f === 'ev' || f === 'electric') return Object.assign({ fuel: 'ev' }, OIL.ev, { confidence: 'high', risks: ['EVs use no engine oil — only coolant/brake fluid/reducer oil per OEM.'], sources: ['CEOS §11.2'] });
    if (segment === 'luxury' || segment === 'performance') return Object.assign({ fuel: f }, OIL.performance, { note: 'Always confirm the exact grade in your owner manual.', confidence: 'high', risks: ['Wrong grade can damage the engine — confirm against the manual / OEM spec for your exact model.'], sources: ['CEOS §11.2'] });
    var rec = OIL[f] || OIL.petrol;
    return Object.assign({ fuel: f }, rec, { confidence: 'high', risks: ['Wrong grade can damage the engine — confirm against the manual / OEM spec for your exact model.'], sources: ['CEOS §11.2'] });
  }
  function mechanicCompare() {
    return {
      options: [
        { type: 'Authorized service center', cost: band(5000, 5000), warranty: 'Warranty safe', convenience: 'Appointment needed' },
        { type: 'Local mechanic', cost: band(2500, 2500), warranty: 'No manufacturer warranty', convenience: 'Walk-in' },
        { type: 'Mobile mechanic', cost: band(3000, 3000), warranty: 'No manufacturer warranty', convenience: 'Comes to home' }
      ],
      note: 'During the warranty period, skipping authorised service can void warranty on some parts.',
      confidence: 'high', risks: ['Local/mobile cost is indicative.'], sources: ['CEOS §11.3']
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. TYRE INTELLIGENCE (BO5) — recommend by usage; tread + DOT-age check.
  // ═══════════════════════════════════════════════════════════════════════════
  var TYRES = [
    { name: 'Michelin Energy XM2', bestFor: 'durability, fuel efficiency', price: band(4500, 6000), lifeKm: 50000 },
    { name: 'Bridgestone Turanza', bestFor: 'comfort, low noise', price: band(4000, 5500), lifeKm: 45000 },
    { name: 'CEAT SecuraDrive', bestFor: 'value for money', price: band(3500, 4500), lifeKm: 40000 },
    { name: 'Apollo Alnac 4G', bestFor: 'wet grip, Indian roads', price: band(3800, 5000), lifeKm: 45000 },
    { name: 'MRF ZVTS', bestFor: 'all-rounder', price: band(3500, 4800), lifeKm: 40000 },
    { name: 'Continental UltraContact', bestFor: 'performance, safety', price: band(5000, 7000), lifeKm: 50000 },
    { name: 'Yokohama Earth-1', bestFor: 'fuel efficiency', price: band(4000, 5500), lifeKm: 45000 }
  ];
  function tyreRecommend(usage) {
    if (usage && typeof usage === 'object') usage = usage.usage || 'all';
    usage = ('' + (usage || 'all')).toLowerCase();
    var map = { wet: 'Apollo Alnac 4G', value: 'CEAT SecuraDrive', durability: 'Michelin Energy XM2', comfort: 'Bridgestone Turanza', performance: 'Continental UltraContact', mileage: 'Yokohama Earth-1' };
    var pick = map[usage];
    var ranked = TYRES.slice().sort(function (a, b) { return (a.name === pick ? -1 : 0) - (b.name === pick ? -1 : 0); });
    return { usage: usage, recommended: ranked.slice(0, 3), warning: 'Worn tyres increase accident risk ~3x. Replace when tread < 1.6mm or age > 5–6 years.', confidence: 'high', risks: ['Always match the exact size on your tyre sidewall / owner manual.'], sources: ['CEOS §12 Tyre Intelligence', 'tyre manufacturer fitment data'] };
  }
  // tread mm (or coin test) + DOT (WWYY) → status. Either condition forces replace.
  function tyreHealth(opts) {
    opts = opts || {};
    var treadMm = opts.treadMm != null ? num(opts.treadMm) : null;
    var ageYears = null;
    if (opts.dot && /^\d{4}$/.test('' + opts.dot)) {
      var wk = parseInt(('' + opts.dot).slice(0, 2), 10), yr = 2000 + parseInt(('' + opts.dot).slice(2), 10);
      var made = new Date(Date.UTC(yr, 0, 1 + (wk - 1) * 7));
      var d = daysBetween(made.toISOString().slice(0, 10), todayISO(opts.asOf));
      if (d != null) ageYears = Math.round(d / 365 * 10) / 10;
    } else if (opts.ageYears != null) { ageYears = num(opts.ageYears); }
    var reasons = [], replace = false, caution = false;
    if (treadMm != null) {
      if (treadMm <= 1.6) { replace = true; reasons.push('Tread ' + treadMm + 'mm is at/below the 1.6mm legal limit.'); }
      else if (treadMm <= 3) { caution = true; reasons.push('Tread ' + treadMm + 'mm is low — plan replacement.'); }
    }
    if (ageYears != null) {
      if (ageYears >= 6) { replace = true; reasons.push('Tyre is ' + ageYears + ' years old — rubber hardens; replace regardless of tread.'); }
      else if (ageYears >= 5) { caution = true; reasons.push('Tyre is ' + ageYears + ' years old — inspect for cracks.'); }
    }
    var verdict = replace ? 'replace_now' : (caution ? 'replace_soon' : (treadMm == null && ageYears == null ? 'unknown' : 'ok'));
    return {
      verdict: verdict, treadMm: treadMm, ageYears: ageYears, reasons: reasons,
      canDrive: !(replace && treadMm != null && treadMm <= 1.0),
      confidence: (treadMm == null && ageYears == null) ? 'low' : 'high',
      risks: verdict === 'unknown' ? ['Tell me tread depth (coin test) or the 4-digit DOT week/year to assess.'] : ['Bald/old tyres are a major accident cause in the rains.'],
      sources: ['CEOS §12', 'CMV tread-depth rule (1.6mm)', 'tyre DOT date code']
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. BATTERY INTELLIGENCE (BO5) — type by segment + age → replace reminder.
  // ═══════════════════════════════════════════════════════════════════════════
  var BATTERY = {
    small: { type: '12V 40Ah', lifeMonths: 42, cost: band(4000, 6000) },
    sedan: { type: '12V 60Ah', lifeMonths: 42, cost: band(5000, 8000) },
    suv: { type: '12V 80Ah', lifeMonths: 42, cost: band(7000, 10000) },
    luxury: { type: 'AGM', lifeMonths: 54, cost: band(15000, 25000) },
    ev: { type: 'Lithium-ion (traction)', lifeMonths: 78, cost: band(100000, 200000) }
  };
  function batteryStatus(opts) {
    opts = opts || {};
    var seg = (opts.segment || 'small').toLowerCase();
    var spec = BATTERY[seg] || BATTERY.small;
    var ageMonths = null;
    if (opts.installedDate) { var d = daysBetween(opts.installedDate, todayISO(opts.asOf)); if (d != null) ageMonths = Math.round(d / 30); }
    else if (opts.ageMonths != null) ageMonths = num(opts.ageMonths);
    var status = 'unknown', msg = 'Tell me the battery install date to track its life.';
    if (ageMonths != null) {
      if (ageMonths >= spec.lifeMonths) { status = 'replace_soon'; msg = 'Battery is ' + ageMonths + ' months old (typical life ' + spec.lifeMonths + '). Get it load-tested; replacement likely.'; }
      else if (ageMonths >= spec.lifeMonths - 6) { status = 'test'; msg = 'Battery is ' + ageMonths + ' months old. Get it tested before the next cold spell.'; }
      else { status = 'ok'; msg = 'Battery is ' + ageMonths + ' months old — within normal life.'; }
    }
    return { segment: seg, type: spec.type, ageMonths: ageMonths, status: status, replacementCost: spec.cost, message: msg, confidence: ageMonths == null ? 'low' : 'high', risks: ['A 3+ year battery can fail without warning in winter.'], sources: ['CEOS §13 Battery Intelligence'] };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. FUEL INTELLIGENCE (BO?) — running-cost compare + CNG/EV ROI (deterministic).
  // ═══════════════════════════════════════════════════════════════════════════
  var FUEL_RUN = { petrol: band(7, 9), diesel: band(5, 7), cng: band(3, 4), ev: band(1, 2), hybrid: band(3, 5) };
  function fuelCompare() {
    return {
      table: [
        { fuel: 'Petrol', run: FUEL_RUN.petrol, pro: 'Lower initial cost, smooth', con: 'Higher running cost' },
        { fuel: 'Diesel', run: FUEL_RUN.diesel, pro: 'Higher mileage, torque', con: 'Higher initial cost; 10-yr ban in NCR' },
        { fuel: 'CNG', run: FUEL_RUN.cng, pro: 'Lowest running cost', con: 'Lower power, limited range, boot space' },
        { fuel: 'EV', run: FUEL_RUN.ev, pro: 'Lowest running cost, smooth', con: 'Higher initial cost, charging time' },
        { fuel: 'Hybrid', run: FUEL_RUN.hybrid, pro: 'No range anxiety', con: 'Expensive, complex' }
      ], confidence: 'high', risks: ['₹/km bands are market averages; your actual cost depends on fuel price & driving.'], sources: ['CEOS §14 Fuel Intelligence']
    };
  }
  // CNG / EV conversion ROI — pure arithmetic from the user's own monthly spend.
  function fuelROI(opts) {
    opts = opts || {};
    var monthlyPetrol = num(opts.currentMonthlyFuel);
    var target = (opts.target || 'cng').toLowerCase();
    var conversionCost = num(opts.conversionCost) || (target === 'cng' ? 60000 : 0);
    var newMonthly = num(opts.newMonthlyFuel);
    if (!newMonthly && monthlyPetrol) {
      // estimate new monthly from running-cost ratio if not supplied
      var ratio = (FUEL_RUN[target] ? (FUEL_RUN[target].lo + FUEL_RUN[target].hi) / 2 : 4) / ((FUEL_RUN.petrol.lo + FUEL_RUN.petrol.hi) / 2);
      newMonthly = round(monthlyPetrol * ratio);
    }
    var monthlySave = monthlyPetrol - newMonthly;
    var annualSave = monthlySave * 12;
    var net = conversionCost - (num(opts.exchangeValue) || 0) + (num(opts.purchasePrice) || 0);
    var paybackMonths = monthlySave > 0 ? Math.round((conversionCost || net) / monthlySave) : null;
    var recommend = monthlySave > 0 && paybackMonths != null && paybackMonths <= (target === 'cng' ? 18 : 120);
    return {
      target: target, currentMonthly: monthlyPetrol, newMonthly: newMonthly,
      monthlySaving: monthlySave, annualSaving: annualSave, conversionCost: conversionCost,
      paybackMonths: paybackMonths, recommend: recommend,
      note: target === 'cng' ? 'CNG reduces boot space; needs >~1,500 km/month to be worth it.' : 'EV needs home charging and higher monthly running to pay back.',
      confidence: 'medium', risks: ['Savings depend on real fuel/electricity prices and your monthly running.', 'Never guaranteed.'], sources: ['CEOS §14.2/§14.3']
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. DIAGNOSTICS — OBD DOCTOR (BO7) — plain-language code lookup, drive verdict.
  // ═══════════════════════════════════════════════════════════════════════════
  var OBD = {
    P0300: { system: 'Engine', meaning: 'Random/multiple cylinder misfire', severity: 'critical', diy: false, canDrive: false, cost: band(2000, 8000), steps: ['Stop driving hard; misfire can destroy the catalytic converter.', 'Likely spark plugs, coils or fuel. See a mechanic.'] },
    P0171: { system: 'Fuel/Engine', meaning: 'System too lean (Bank 1)', severity: 'warn', diy: false, canDrive: true, cost: band(2000, 5000), steps: ['Often a vacuum leak or dirty MAF sensor.', 'Drive gently; get it checked soon.'] },
    P0420: { system: 'Emissions', meaning: 'Catalyst efficiency below threshold', severity: 'warn', diy: false, canDrive: true, cost: band(5000, 15000), steps: ['Usually the catalytic converter or an O2 sensor.', 'Not an immediate stop, but it will fail PUC.'] },
    P0135: { system: 'O2 sensor', meaning: 'O2 sensor heater circuit', severity: 'warn', diy: false, canDrive: true, cost: band(3000, 7000), steps: ['Replace the oxygen sensor.', 'Hurts mileage if ignored.'] },
    P0700: { system: 'Transmission', meaning: 'Transmission control fault', severity: 'critical', diy: false, canDrive: false, cost: band(5000, 20000), steps: ['Do not keep driving an automatic with a TCM fault.', 'See a transmission specialist.'] },
    C0200: { system: 'ABS', meaning: 'Wheel speed sensor fault', severity: 'critical', diy: false, canDrive: false, cost: band(3000, 8000), steps: ['ABS may be disabled — braking distance can change.', 'Safety-critical: get it fixed before hard driving.'] },
    B0100: { system: 'Airbag/SRS', meaning: 'Airbag (SRS) circuit fault', severity: 'critical', diy: false, canDrive: false, cost: band(5000, 15000), steps: ['Airbags may NOT deploy in a crash.', 'Urgent — see a mechanic. Never DIY airbag work.'] },
    P0562: { system: 'Battery/Charging', meaning: 'System voltage low — battery weak or alternator not charging', severity: 'warn', diy: true, canDrive: true, cost: band(4000, 15000), steps: ['Check battery terminals for corrosion; clean with a brush.', 'Battery should read 12.5V+ engine off, 13.5–14.5V running.', 'If low → replace battery; if still low running → alternator (mechanic).'] },
    P0A80: { system: 'EV', meaning: 'Replace hybrid/EV battery pack', severity: 'critical', diy: false, canDrive: false, cost: band(50000, 200000), steps: ['High-voltage system — NEVER DIY (orange cables = danger).', 'See an authorised EV technician.'] },
    P0128: { system: 'Cooling', meaning: 'Coolant thermostat below regulating temp', severity: 'warn', diy: false, canDrive: true, cost: band(1500, 4000), steps: ['Usually a stuck-open thermostat.', 'Hurts mileage; not an emergency.'] },
    P0301: { system: 'Engine', meaning: 'Cylinder 1 misfire', severity: 'warn', diy: false, canDrive: true, cost: band(2000, 6000), steps: ['Plug/coil/injector on cylinder 1.', 'Avoid hard acceleration until fixed.'] }
  };
  // Expanded explicit library (common Indian-market codes). Cyl-misfire P0302–P0306 share P0301's profile.
  Object.assign(OBD, {
    P0302: OBD.P0301, P0303: OBD.P0301, P0304: OBD.P0301, P0305: OBD.P0301, P0306: OBD.P0301,
    P0172: { system: 'Fuel/Engine', meaning: 'System too rich (Bank 1)', severity: 'warn', diy: false, canDrive: true, cost: band(2000, 6000), steps: ['Often a leaking injector or faulty MAF/O2 sensor.', 'Hurts mileage; get it checked.'] },
    P0101: { system: 'Air intake', meaning: 'MAF sensor range/performance', severity: 'warn', diy: true, canDrive: true, cost: band(800, 4000), steps: ['Try cleaning the MAF sensor with MAF cleaner (DIY).', 'If it returns, replace the sensor (mechanic).'] },
    P0113: { system: 'Air intake', meaning: 'Intake air temp sensor high', severity: 'info', diy: true, canDrive: true, cost: band(800, 2500), steps: ['Usually the IAT sensor or wiring.', 'Low urgency.'] },
    P0102: { system: 'Air intake', meaning: 'MAF sensor circuit low', severity: 'warn', diy: false, canDrive: true, cost: band(2000, 5000), steps: ['Check MAF wiring/connector.', 'Replace MAF if faulty.'] },
    P0133: { system: 'O2 sensor', meaning: 'O2 sensor slow response (Bank1 S1)', severity: 'warn', diy: false, canDrive: true, cost: band(3000, 7000), steps: ['Ageing oxygen sensor.', 'Replace to restore mileage.'] },
    P0137: { system: 'O2 sensor', meaning: 'O2 sensor low voltage (Bank1 S2)', severity: 'info', diy: false, canDrive: true, cost: band(3000, 7000), steps: ['Downstream O2 sensor.', 'Low urgency.'] },
    P0401: { system: 'Emissions', meaning: 'EGR flow insufficient', severity: 'warn', diy: false, canDrive: true, cost: band(2500, 8000), steps: ['Carbon-clogged EGR valve is common.', 'Clean or replace EGR.'] },
    P0430: { system: 'Emissions', meaning: 'Catalyst efficiency below threshold (Bank 2)', severity: 'warn', diy: false, canDrive: true, cost: band(5000, 15000), steps: ['Catalytic converter or O2 sensor.', 'Will fail PUC.'] },
    P0440: { system: 'Emissions', meaning: 'EVAP system fault', severity: 'info', diy: true, canDrive: true, cost: band(500, 4000), steps: ['Check the fuel cap is tight first (free DIY fix).', 'If it returns, EVAP leak — mechanic.'] },
    P0455: { system: 'Emissions', meaning: 'EVAP large leak (loose fuel cap)', severity: 'info', diy: true, canDrive: true, cost: band(0, 3000), steps: ['Tighten/replace the fuel cap — often fixes it free.', 'Clear code and recheck.'] },
    P0500: { system: 'Speed sensor', meaning: 'Vehicle speed sensor fault', severity: 'warn', diy: false, canDrive: true, cost: band(2000, 6000), steps: ['Speedo/ABS may misbehave.', 'Get the VSS checked.'] },
    P0505: { system: 'Idle control', meaning: 'Idle air control fault', severity: 'warn', diy: false, canDrive: true, cost: band(2000, 6000), steps: ['Rough/stalling idle.', 'Clean throttle body / IAC valve.'] },
    P0011: { system: 'Engine timing', meaning: 'Camshaft timing over-advanced (Bank1)', severity: 'warn', diy: false, canDrive: true, cost: band(3000, 12000), steps: ['VVT/oil-control valve or low oil.', 'Check oil level; see a mechanic.'] },
    P0016: { system: 'Engine timing', meaning: 'Crank/cam correlation', severity: 'critical', diy: false, canDrive: false, cost: band(5000, 20000), steps: ['Timing chain/belt issue possible — risky.', 'Do not drive hard; see a mechanic.'] },
    P0217: { system: 'Cooling', meaning: 'Engine over-temperature', severity: 'critical', diy: false, canDrive: false, cost: band(2000, 15000), steps: ['STOP — overheating destroys engines.', 'Let it cool; check coolant; see a mechanic.'] },
    P0480: { system: 'Cooling', meaning: 'Cooling fan relay 1 fault', severity: 'warn', diy: false, canDrive: true, cost: band(1500, 6000), steps: ['Fan may not run in traffic → overheating risk.', 'Get it checked soon.'] },
    P0606: { system: 'ECU', meaning: 'ECM/PCM processor fault', severity: 'critical', diy: false, canDrive: false, cost: band(8000, 30000), steps: ['Engine computer fault.', 'See a mechanic — do not rely on the car.'] },
    P0715: { system: 'Transmission', meaning: 'Input/turbine speed sensor', severity: 'critical', diy: false, canDrive: false, cost: band(4000, 15000), steps: ['Automatic gearbox sensor fault.', 'Avoid driving; transmission specialist.'] },
    P0730: { system: 'Transmission', meaning: 'Incorrect gear ratio', severity: 'critical', diy: false, canDrive: false, cost: band(8000, 40000), steps: ['Transmission slipping/internal fault.', 'Stop driving; specialist.'] },
    C0035: { system: 'ABS', meaning: 'Left front wheel speed sensor', severity: 'critical', diy: false, canDrive: false, cost: band(3000, 8000), steps: ['ABS affected — braking distance changes.', 'Safety-critical; mechanic.'] },
    C0040: { system: 'ABS', meaning: 'Right front wheel speed sensor', severity: 'critical', diy: false, canDrive: false, cost: band(3000, 8000), steps: ['ABS affected.', 'Safety-critical; mechanic.'] },
    C0110: { system: 'ABS', meaning: 'ABS pump motor fault', severity: 'critical', diy: false, canDrive: false, cost: band(8000, 30000), steps: ['ABS may be disabled.', 'Safety-critical; mechanic now.'] },
    B0010: { system: 'Airbag/SRS', meaning: 'Driver airbag deployment loop', severity: 'critical', diy: false, canDrive: false, cost: band(5000, 20000), steps: ['Airbag may not deploy.', 'Urgent; never DIY airbag.'] },
    B0020: { system: 'Airbag/SRS', meaning: 'Passenger airbag loop', severity: 'critical', diy: false, canDrive: false, cost: band(5000, 20000), steps: ['Airbag may not deploy.', 'Urgent; never DIY.'] },
    U0100: { system: 'Network', meaning: 'Lost communication with ECM/PCM', severity: 'critical', diy: false, canDrive: false, cost: band(3000, 20000), steps: ['Wiring/module communication fault.', 'See a mechanic.'] },
    U0121: { system: 'Network', meaning: 'Lost communication with ABS module', severity: 'critical', diy: false, canDrive: false, cost: band(3000, 15000), steps: ['ABS comms lost — safety affected.', 'Mechanic.'] },
    P0234: { system: 'Turbo', meaning: 'Turbo/super-charger overboost', severity: 'warn', diy: false, canDrive: false, cost: band(5000, 30000), steps: ['Boost control fault — can damage engine.', 'Drive gently to a mechanic.'] },
    P2002: { system: 'Emissions', meaning: 'DPF efficiency below threshold (diesel)', severity: 'warn', diy: false, canDrive: true, cost: band(5000, 40000), steps: ['Clogged diesel particulate filter.', 'A long highway run may regenerate it; else mechanic.'] },
    P0087: { system: 'Fuel', meaning: 'Fuel rail pressure too low', severity: 'warn', diy: false, canDrive: true, cost: band(3000, 20000), steps: ['Fuel filter/pump/regulator.', 'Never DIY the fuel rail.'] },
    P0191: { system: 'Fuel', meaning: 'Fuel rail pressure sensor', severity: 'warn', diy: false, canDrive: true, cost: band(2500, 8000), steps: ['Sensor or wiring.', 'Mechanic.'] }
  });
  // Structured SAE-J2012 decoder — for ANY well-formed code not in the explicit table.
  // Honest: gives the SYSTEM + generic category from the code STRUCTURE; never invents the exact fault.
  function decodeStructure(code) {
    if (!/^[PBCU][0-3][0-9A-F]{2,3}$/.test(code)) return null;
    var L = { P: 'Powertrain (engine/transmission)', B: 'Body (interior/comfort/airbag)', C: 'Chassis (brakes/ABS/steering/suspension)', U: 'Network (modules/wiring)' };
    var first = code[0];
    // P-code subsystem by 3rd char
    var pSys = { '0': 'fuel & air metering', '1': 'fuel & air metering', '2': 'fuel & air (injector circuit)', '3': 'ignition / misfire', '4': 'emissions / auxiliary', '5': 'vehicle speed / idle control', '6': 'computer / output circuit', '7': 'transmission', '8': 'transmission', '9': 'transmission', 'A': 'hybrid/EV propulsion', 'B': 'hybrid/EV propulsion', 'C': 'hybrid/EV propulsion' };
    var subsystem = first === 'P' ? (pSys[code[2]] || 'powertrain') : L[first];
    // safety systems → conservative no-drive; misfire/ignition → caution; else unknown severity
    var safetyFirst = (first === 'C') || (first === 'B' && /airbag|srs/i.test('')) || (first === 'B');
    var ignition = first === 'P' && code[2] === '3';
    var canDrive = safetyFirst ? false : (ignition ? false : null);
    var manufacturer = code[1] === '1' || code[1] === '2';
    return {
      code: code, found: true, structured: true, system: L[first], subsystem: subsystem,
      meaning: (manufacturer ? 'Manufacturer-specific ' : 'Generic ') + L[first].toLowerCase() + ' code — ' + subsystem + ' area',
      severity: safetyFirst ? 'critical' : (ignition ? 'warn' : 'unknown'),
      canDrive: canDrive, diy: false, cost: null,
      steps: [
        'I can read the SYSTEM from the code structure, but not the exact fault for this specific code.',
        first === 'C' ? 'This is a CHASSIS/brakes/ABS area code — treat as safety-critical; do not drive hard.' :
          first === 'B' ? 'This is a BODY/airbag area code — if it touches airbags, never DIY.' :
            ignition ? 'Ignition/misfire area — avoid hard acceleration until checked.' :
              'Get it read by a mechanic or a full OBD scanner for the exact fault.'
      ],
      message: (manufacturer ? 'Manufacturer-specific ' : 'Generic ') + 'code in the ' + subsystem + ' area' + (canDrive === false ? ' — do NOT keep driving; treat as safety-critical.' : ' — get it checked; I won\'t guess the exact fault.'),
      confidence: 'medium',
      risks: canDrive === false ? ['Decoded from code structure only; treat conservatively as safety-critical.'] : ['Decoded from code structure only — exact fault needs a scan. Do not assume it is minor.'],
      sources: ['SAE J2012 DTC structure (deterministic decode)', 'CEOS §16 OBD Doctor']
    };
  }
  function obdLookup(codeRaw, opts) {
    opts = opts || {};
    var code = ('' + codeRaw).toUpperCase().replace(/\s+/g, '');
    var e = OBD[code];
    if (!e) {
      var s = decodeStructure(code);
      if (s) return s;
      return {
        code: code, found: false, severity: 'unknown', canDrive: null,
        message: "That doesn't look like a valid OBD code (expected like P0300, C0035, B0010, U0100). I won't guess — get it read by an OBD scanner.",
        confidence: 'low', risks: ['Unrecognised code format.'], sources: ['CEOS §16', 'SAE J2012 DTC standard']
      };
    }
    return {
      code: code, found: true, system: e.system, meaning: e.meaning, severity: e.severity,
      canDrive: e.canDrive, diy: e.diy, cost: e.cost, steps: e.steps,
      message: e.meaning + (e.canDrive ? ' — you can drive gently, but get it checked.' : ' — do NOT keep driving. Safety-critical.'),
      confidence: 'high',
      risks: e.canDrive ? ['Driving worsens some faults.'] : ['Safety-critical: continued driving risks damage or a crash.'],
      sources: ['CEOS §16 OBD Doctor', 'SAE J2012 DTC standard']
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. REPAIR COST INTELLIGENCE & SCAM DETECTOR (BO7).
  // ═══════════════════════════════════════════════════════════════════════════
  // expected fair ranges for common jobs (₹) — versioned, India market
  var FAIR = {
    brake_pads: band(3500, 5000), battery: band(4000, 6000), engine_oil: band(3000, 6000),
    ac_gas: band(1500, 3000), clutch: band(8000, 15000), timing_belt: band(8000, 15000),
    alternator: band(8000, 15000), wheel_alignment: band(500, 1000), coolant_flush: band(2000, 3000),
    fuel_filter: band(1500, 3000), spark_plugs: band(2000, 5000)
  };
  function scamCheck(items) {
    // items = [{ job:'brake_pads', quote: 8500 }, ...]
    items = items || [];
    var lines = [], totalQuote = 0, fairLo = 0, fairHi = 0;
    items.forEach(function (it) {
      var fair = FAIR[it.job];
      var q = num(it.quote); totalQuote += q;
      if (!fair) { lines.push({ job: it.job, quote: q, verdict: 'unknown', note: "No fair-price reference for this job — can't judge. Don't assume." }); return; }
      fairLo += fair.lo; fairHi += fair.hi;
      var overPct = q > fair.hi ? Math.round((q - fair.hi) / fair.hi * 100) : 0;
      lines.push({ job: it.job, quote: q, fair: fair, verdict: overPct > 30 ? 'overpriced' : (overPct > 0 ? 'slightly_high' : 'fair'), overPct: overPct });
    });
    var overcharge = totalQuote - fairHi;
    var anyOver = lines.some(function (l) { return l.verdict === 'overpriced'; });
    return {
      lines: lines, totalQuote: totalQuote, fairTotal: band(fairLo, fairHi),
      overcharge: overcharge > 0 ? band(totalQuote - fairHi, totalQuote - fairLo) : band(0, 0),
      verdict: anyOver ? 'likely_overcharged' : 'fair',
      recommendation: anyOver ? 'Get a second opinion. Show this fair-range to the mechanic before agreeing.' : 'This quote is within the expected range.',
      confidence: 'medium', risks: ['Fair ranges are market averages; complex jobs/parts can justify more.', 'A genuine OEM part legitimately costs more than a fake.'], sources: ['CEOS §17 Scam Detector']
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. DIY vs MECHANIC TRIAGE (BO7) — SAFETY SUPREME.
  // ═══════════════════════════════════════════════════════════════════════════
  var TRIAGE = {
    bulb: 'green', fuse: 'green', wiper: 'green', tyre_pressure: 'green', air_filter: 'green', cabin_filter: 'green', battery_terminal_clean: 'green', tyre_tread_check: 'green',
    battery_replace: 'yellow', coolant_topup: 'yellow', oil_level_check: 'yellow', tyre_rotation: 'yellow',
    engine: 'red', engine_oil_change: 'red', transmission: 'red', brake_pads: 'red', brake_fluid: 'red', ac_gas: 'red', timing_belt: 'red', suspension: 'red', electrical_diagnosis: 'red', airbag: 'red', abs: 'red', fuel_rail: 'red', ev_hv: 'red', steering: 'red'
  };
  function diyTriage(task) {
    var key = ('' + task).toLowerCase().replace(/[^a-z]+/g, '_');
    // hard safety override: anything matching a never-diy system is RED, full stop.
    var unsafe = RULES.never_diy.some(function (s) { return key.indexOf(s) >= 0; });
    var level = unsafe ? 'red' : (TRIAGE[key] || (RULES.diy_safe_only.indexOf(key) >= 0 ? 'green' : 'red'));
    var label = level === 'green' ? 'Safe DIY' : level === 'yellow' ? 'Caution DIY' : 'Mechanic only';
    var action = level === 'green' ? 'Chitti can coach you step-by-step.' : level === 'yellow' ? 'Doable with care — Chitti will warn you at each step.' : 'Take to a mechanic. This is safety-critical or specialised.';
    return {
      task: task, level: level, symbol: level === 'green' ? '🟢' : level === 'yellow' ? '🟡' : '🔴', label: label, action: action,
      // colour is ALWAYS paired with a word + symbol (four-user contract, never colour-only)
      canDIY: level !== 'red',
      confidence: 'high',
      risks: level === 'red' ? ['Safety-critical: a wrong DIY here can cause injury or a crash. Chitti will not coach unsafe work.'] : [],
      sources: ['CEOS §18 DIY Triage', 'GUARDRAILS diy-safety.md']
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. PRE-PURCHASE INSPECTION & BUY ASSISTANT (BO6).
  // ═══════════════════════════════════════════════════════════════════════════
  // weighted checklist; a CRITICAL fail caps the score and flips to "avoid".
  var BUY_CHECKS = [
    { key: 'accident_free', label: 'No major accident / frame damage', weight: 25, critical: true },
    { key: 'service_history', label: 'Complete service history', weight: 15, critical: false },
    { key: 'odometer_genuine', label: 'Odometer genuine (wear matches km)', weight: 15, critical: true },
    { key: 'engine_ok', label: 'Engine: no smoke/leaks/odd noise', weight: 15, critical: true },
    { key: 'no_pending_loan', label: 'No pending loan / hypothecation', weight: 10, critical: true },
    { key: 'tyres_ok', label: 'Tyres have life left', weight: 5, critical: false },
    { key: 'brakes_ok', label: 'Brakes/suspension sound', weight: 8, critical: false },
    { key: 'papers_valid', label: 'RC/insurance/PUC valid & matching', weight: 7, critical: false }
  ];
  function buyScore(opts) {
    opts = opts || {}; var checks = opts.checks || {};
    var score = 0, criticalFail = false, good = [], concerns = [];
    BUY_CHECKS.forEach(function (c) {
      var pass = checks[c.key] === true;
      if (pass) { score += c.weight; good.push(c.label); }
      else { if (c.critical) criticalFail = true; concerns.push(c.label); }
    });
    var verdict = criticalFail ? 'avoid' : (score >= 80 ? 'good_buy' : (score >= 60 ? 'caution' : 'avoid'));
    // negotiation math from asking vs expected market value
    var expected = num(opts.expectedPrice), asking = num(opts.askingPrice), offer = null, negoLo = null, negoHi = null;
    if (expected) { negoLo = round(expected * 0.93); negoHi = round(expected * 0.97); offer = round(expected * 0.94); }
    return {
      score: criticalFail ? Math.min(score, 49) : score, verdict: verdict, criticalFail: criticalFail,
      good: good, concerns: concerns,
      expectedPrice: expected || null, negotiationRange: (negoLo != null) ? band(negoLo, negoHi) : null, suggestedOffer: offer,
      message: verdict === 'good_buy' ? 'Looks like a sound buy — negotiate to the suggested offer.' : verdict === 'caution' ? 'Buyable but fix the concerns / negotiate harder.' : (criticalFail ? 'A critical check failed (accident / odometer / loan / engine). Walk away unless independently verified.' : 'Too many concerns — avoid or inspect with a mechanic.'),
      confidence: 'high',
      risks: ['A used-car verdict is only as good as the inputs — get a mechanic + RTO/VAHAN history check before paying.', 'Accident & odometer fraud need physical + record verification, not just a checklist.'],
      sources: ['CEOS §8 Pre-Purchase Inspection', '50+ point checklist']
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. SELL ASSISTANT (BO6).
  // ═══════════════════════════════════════════════════════════════════════════
  function sellAssistant(opts) {
    opts = opts || {}; var market = num(opts.marketValue);
    var addable = 0, tips = [];
    if (!opts.fullServiceHistory) { tips.push('Complete the service history → +₹10,000'); addable += 10000; }
    if (opts.tyresWorn) { tips.push('Fit new tyres → +₹5,000'); addable += 5000; }
    tips.push('Professional photos → +₹3,000'); addable += 3000;
    return {
      marketValue: market || null,
      listingPrice: market ? round(market * 1.06) : null,
      likelyPrice: market ? round(market * 0.96) : null,
      potentialWithTips: market ? round(market * 0.96 + addable) : null,
      tips: tips,
      checklist: ['Service history', 'Insurance valid', 'PUC valid', 'No accident history', 'Loan closed'],
      confidence: 'medium', risks: ['Market value is indicative — confirm on OBV/Cars24/CarDekho.', 'Never guaranteed.'], sources: ['CEOS §19 Sell Assistant']
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. SYMPTOM / AI COACH (BO8) — ranked candidates + confidence + tier + cost.
  // Calibrated honesty: low confidence → "see a mechanic". Safety-critical → can't DIY.
  // ═══════════════════════════════════════════════════════════════════════════
  var SYMPTOMS = {
    ac_not_cooling: { causes: ['Low AC gas', 'Clogged cabin filter', 'Compressor issue'], confidence: 80, diy: 'Filter check = DIY; gas refill = mechanic', canDrive: true, cost: band(1500, 15000), first: ['Check the cabin filter (behind glovebox).', 'Set AC to recirculation.', 'Still warm → gas may be low (mechanic).'] },
    car_wont_start: { causes: ['Weak/dead battery', 'Loose terminals', 'Starter/alternator'], confidence: 75, diy: 'Terminal check = DIY; replacement = mechanic', canDrive: false, cost: band(4000, 15000), first: ['Listen: click = battery; crank-no-start = fuel/ignition.', 'Check & clean terminals.', 'Try a jump-start or call RSA.'] },
    overheating: { causes: ['Low coolant', 'Stuck thermostat', 'Radiator/fan fault'], confidence: 70, diy: 'Coolant level = DIY (engine COLD); rest = mechanic', canDrive: false, cost: band(1500, 8000), first: ['STOP driving — overheating destroys engines.', 'Let it cool fully, then check coolant level.', 'Do not open a hot radiator cap.'] },
    grinding_brakes: { causes: ['Worn brake pads', 'Damaged disc'], confidence: 85, diy: 'Mechanic only — safety-critical', canDrive: false, cost: band(3000, 8000), first: ['Grinding = metal-on-metal. Stop driving.', 'Brakes are never DIY here — go to a mechanic.'] },
    white_smoke: { causes: ['Coolant in combustion (head gasket)', 'On diesel: injector'], confidence: 60, diy: 'Mechanic only', canDrive: false, cost: band(5000, 40000), first: ['Could be a head gasket — serious.', 'Get it checked before driving far.'] },
    blue_smoke: { causes: ['Engine burning oil (rings/valve seals)'], confidence: 65, diy: 'Mechanic only', canDrive: true, cost: band(5000, 30000), first: ['Check oil level.', 'See a mechanic — engine wear.'] },
    pulling_one_side: { causes: ['Wheel alignment', 'Uneven tyre pressure', 'Brake drag'], confidence: 70, diy: 'Pressure = DIY; alignment = mechanic', canDrive: true, cost: band(500, 3000), first: ['Check tyre pressures first.', 'Then get wheel alignment.'] },
    vibration_at_speed: { causes: ['Wheel balancing', 'Bent rim', 'Worn suspension'], confidence: 65, diy: 'Mechanic', canDrive: true, cost: band(500, 5000), first: ['Usually wheel balancing.', 'If it worsens, check suspension.'] },
    battery_warning_light: { causes: ['Alternator not charging', 'Loose/worn belt'], confidence: 75, diy: 'Belt check = visual; rest = mechanic', canDrive: false, cost: band(4000, 15000), first: ['Charging fault — battery is running down.', 'Reduce electrical load; get to a mechanic soon.'] }
  };
  Object.assign(SYMPTOMS, {
    check_engine_light: { causes: ['Many — needs OBD scan', 'Loose fuel cap', 'O2/MAF sensor', 'Misfire'], confidence: 55, diy: 'Tighten fuel cap = DIY; rest = scan', canDrive: true, cost: band(0, 15000), first: ['If steady (not flashing) you can usually drive gently.', 'A FLASHING light = misfire → stop, do not drive.', 'Get the OBD code read (use the OBD tab).'] },
    flashing_engine_light: { causes: ['Active misfire (damaging the catalytic converter)'], confidence: 80, diy: 'Mechanic only', canDrive: false, cost: band(2000, 15000), first: ['A flashing engine light = serious misfire.', 'Stop driving; do not accelerate hard.'] },
    brake_pedal_soft: { causes: ['Air in brake lines', 'Brake fluid leak', 'Worn pads'], confidence: 80, diy: 'Mechanic only — safety-critical', canDrive: false, cost: band(2000, 10000), first: ['A soft/spongy pedal = unsafe. Do not drive.', 'Brakes are never DIY here — mechanic now.'] },
    brake_pedal_vibrates: { causes: ['Warped brake disc', 'ABS engaging'], confidence: 70, diy: 'Mechanic only', canDrive: true, cost: band(2000, 8000), first: ['Often warped discs.', 'Get brakes inspected soon.'] },
    steering_hard: { causes: ['Low power-steering fluid', 'Pump/belt fault', 'EPS fault'], confidence: 65, diy: 'Fluid check = DIY (hydraulic); EPS = mechanic', canDrive: true, cost: band(500, 12000), first: ['Check power-steering fluid if hydraulic.', 'If electric (EPS), see a mechanic.'] },
    steering_vibration: { causes: ['Wheel imbalance', 'Worn tie-rod/ball joint'], confidence: 65, diy: 'Mechanic', canDrive: true, cost: band(500, 6000), first: ['Start with wheel balancing.', 'If loose-feeling, suspension check.'] },
    clutch_slipping: { causes: ['Worn clutch plate'], confidence: 75, diy: 'Mechanic only', canDrive: true, cost: band(8000, 20000), first: ['Revs rise but speed lags = slipping clutch.', 'Avoid heavy loads; plan a clutch job.'] },
    gear_hard_to_shift: { causes: ['Clutch not disengaging', 'Low gearbox oil', 'Linkage'], confidence: 60, diy: 'Mechanic', canDrive: true, cost: band(2000, 15000), first: ['Manual: clutch/linkage. Auto: fluid/TCM.', 'Get it checked.'] },
    jerking_acceleration: { causes: ['Misfire', 'Dirty injectors/MAF', 'Transmission'], confidence: 60, diy: 'Mechanic', canDrive: true, cost: band(2000, 15000), first: ['Could be ignition or fuel.', 'Scan for codes (OBD tab).'] },
    rough_idle: { causes: ['Dirty throttle body/IAC', 'Vacuum leak', 'Spark plugs'], confidence: 65, diy: 'Throttle clean = caution-DIY; rest = mechanic', canDrive: true, cost: band(1000, 6000), first: ['Try a throttle-body clean.', 'Check for vacuum leaks.'] },
    stalling: { causes: ['Idle control', 'Fuel delivery', 'Sensor fault'], confidence: 55, diy: 'Mechanic', canDrive: false, cost: band(2000, 10000), first: ['Stalling in traffic is unsafe.', 'Get it diagnosed before relying on the car.'] },
    poor_mileage: { causes: ['Under-inflated tyres', 'Dirty air filter', 'O2 sensor', 'Dragging brakes'], confidence: 60, diy: 'Tyre pressure + air filter = DIY', canDrive: true, cost: band(500, 7000), first: ['Check tyre pressure (free).', 'Replace a dirty air filter.', 'Then scan for sensor codes.'] },
    smell_burning: { causes: ['Slipping clutch/belt', 'Oil on hot exhaust', 'Electrical short'], confidence: 50, diy: 'Mechanic — investigate', canDrive: false, cost: band(1000, 15000), first: ['A burning smell can mean fire risk.', 'Stop, switch off, and investigate before driving.'] },
    smell_fuel: { causes: ['Fuel leak'], confidence: 70, diy: 'Mechanic only — fire risk', canDrive: false, cost: band(1000, 15000), first: ['A fuel smell = fire hazard. Stop driving.', 'Never DIY the fuel system — mechanic now.'] },
    smell_sweet: { causes: ['Coolant leak'], confidence: 70, diy: 'Mechanic', canDrive: false, cost: band(1000, 10000), first: ['A sweet smell = coolant leak → overheating risk.', 'Check coolant; see a mechanic.'] },
    knocking_noise: { causes: ['Worn bearings / pre-ignition (knock)'], confidence: 60, diy: 'Mechanic only', canDrive: false, cost: band(8000, 60000), first: ['Deep engine knock can be serious.', 'Stop hard driving; mechanic.'] },
    squealing_belt: { causes: ['Worn/loose drive belt'], confidence: 75, diy: 'Mechanic (belt)', canDrive: true, cost: band(800, 4000), first: ['Squeal on start = belt.', 'Replace before it snaps.'] },
    smoke_black: { causes: ['Running rich (air/fuel)', 'Dirty air filter', 'Injector'], confidence: 65, diy: 'Air filter = DIY; rest = mechanic', canDrive: true, cost: band(500, 8000), first: ['Black smoke = too much fuel.', 'Check air filter; scan for codes.'] },
    ac_smell: { causes: ['Mould in evaporator/cabin filter'], confidence: 75, diy: 'Cabin filter = DIY', canDrive: true, cost: band(500, 3000), first: ['Replace the cabin filter.', 'Run AC on fresh air to dry it.'] },
    headlight_dim: { causes: ['Weak battery/alternator', 'Oxidised lens', 'Bad earth'], confidence: 60, diy: 'Lens clean/bulb = DIY', canDrive: true, cost: band(200, 6000), first: ['Clean the lens; check the bulb.', 'If dimming with revs, charging fault.'] },
    wipers_not_working: { causes: ['Blown fuse', 'Wiper motor', 'Linkage'], confidence: 70, diy: 'Fuse/blade = DIY', canDrive: true, cost: band(100, 4000), first: ['Check the wiper fuse (DIY).', 'Replace blades; else motor (mechanic).'] },
    tpms_light: { causes: ['Low tyre pressure', 'TPMS sensor'], confidence: 80, diy: 'Pressure check = DIY', canDrive: true, cost: band(0, 3000), first: ['Check & set all tyre pressures (free).', 'Light persists → TPMS sensor.'] }
  });
  function symptomCoach(symptomRaw) {
    var key = ('' + symptomRaw).toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_+|_+$/g, '');
    // light alias matching
    var alias = { ac: 'ac_not_cooling', no_start: 'car_wont_start', wont_start: 'car_wont_start', not_starting: 'car_wont_start', heating: 'overheating', brake_noise: 'grinding_brakes', smoke_white: 'white_smoke', smoke_blue: 'blue_smoke' };
    if (!SYMPTOMS[key] && alias[key]) key = alias[key];
    var s = SYMPTOMS[key];
    if (!s) {
      return { symptom: symptomRaw, found: false, confidence: 'low', message: "I'm not sure about this one yet — I won't guess on something that affects your safety. Describe it more, or see a mechanic.", canDrive: null, risks: ['Unknown symptom.'], sources: ['CEOS §23 AI Coach'] };
    }
    var critical = !s.canDrive;
    return {
      symptom: symptomRaw, found: true, causes: s.causes, confidencePct: s.confidence,
      confidence: s.confidence >= 75 ? 'high' : (s.confidence >= 60 ? 'medium' : 'low'),
      diy: s.diy, canDrive: s.canDrive, cost: s.cost, firstSteps: s.first,
      message: (critical ? '⚠️ ' : '') + s.causes[0] + (critical ? ' — do NOT keep driving; see a mechanic.' : ' — try the first steps; if it persists, see a mechanic.'),
      risks: critical ? ['Safety-critical — continued driving is unsafe.'] : ['AI-assisted — confirm with a mechanic. Diagnosis from a description is never certain.'],
      sources: ['CEOS §23 AI Coach', 'GUARDRAILS never-claim-certainty.md']
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. SAVINGS TRACKER (BO9) — ₹10k+ annual goal, transparent.
  // ═══════════════════════════════════════════════════════════════════════════
  function savingsTracker(entries) {
    entries = entries || [];
    var total = entries.reduce(function (a, e) { return a + num(e.amount); }, 0);
    var goal = 10000;
    return {
      entries: entries, total: total, goal: goal,
      goalMet: total >= goal, percentToGoal: clamp(round(total / goal * 100), 0, 999),
      confidence: 'high', risks: ['Only logged, realised savings count — never a projection.'], sources: ['CEOS §20 Savings Tracker']
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. OWNERSHIP SCORES + VEHICLE TWIN (BO9, BO?) — deterministic 0–100.
  // ═══════════════════════════════════════════════════════════════════════════
  function ownershipScores(twin) {
    twin = twin || {};
    var sv = twin.service || {}, docs = twin.docs || {};
    var maint = clamp(40 + (Object.keys(sv).length * 10), 0, 100);
    var safety = 70;
    if (docs.insurance && docs.insurance.expiry) safety += 10;
    if (docs.puc && docs.puc.expiry) safety += 10;
    if (twin.accidentFree) safety += 10; safety = clamp(safety, 0, 100);
    var resale = clamp(60 + (twin.fullServiceHistory ? 15 : 0) + (twin.accidentFree ? 15 : 0) + (twin.loanClosed ? 10 : 0), 0, 100);
    var buy = twin.lastBuyScore != null ? twin.lastBuyScore : null;
    return {
      maintenance: maint, safety: safety, resale: resale, buy: buy,
      confidence: 'high', risks: ['Scores reflect only what is recorded in your Vehicle Twin.'], sources: ['CEOS §21/§22 Vehicle Twin + Ownership Scores']
    };
  }
  var TWIN_KEY = 'chitti_carmech_twin_v1';
  function twinLoad() { try { if (root.localStorage) { var r = root.localStorage.getItem(TWIN_KEY); return r ? JSON.parse(r) : {}; } } catch (e) {} return {}; }
  function twinSave(o) { try { if (root.localStorage) { root.localStorage.setItem(TWIN_KEY, JSON.stringify(o || {})); return true; } } catch (e) {} return false; }
  function twinSet(k, v) { var t = twinLoad(); t[k] = v; twinSave(t); return t; }
  function twinForget() { try { if (root.localStorage) root.localStorage.removeItem(TWIN_KEY); } catch (e) {} return {}; }

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. CRISIS / EMERGENCY (BO?) — FAMILY CASCADE, never auto-dial (LOCKED §2).
  // Chitti SURFACES options; it never dials. Every dial is a user-confirmed action.
  // ═══════════════════════════════════════════════════════════════════════════
  var CRISIS_WORDS = ['accident', 'crash', 'injured', 'injury', 'hospital', 'emergency', 'collision', 'fire', 'smoke from engine'];
  function crisisCheck(text) {
    var t = ('' + text).toLowerCase();
    var hit = CRISIS_WORDS.some(function (w) { return t.indexOf(w) >= 0; });
    if (!hit) return { crisis: false };
    return {
      crisis: true,
      // FAMILY CASCADE FIRST. NEVER auto-dial. Options are user-initiated only.
      cascade: ['Confirm you are safe.', 'Alert your family / emergency contact.', 'If you choose, Chitti can help you call an ambulance (108) or police (100) — only when you say yes.'],
      autoDial: false,
      voice: 'I see this may be an emergency. Are you safe? I can alert your family, and if you want, help you call for help — I will never dial on my own.',
      confidence: 'high',
      risks: ['Chitti never auto-dials emergency services — you stay in control (SAHAYAI lock §2; CEOS reconciled in GUARDRAILS).'],
      sources: ['SAHAYAI_MASTER §2 emergency protocol', 'CEOS §24 (reconciled: surface, never auto-dial)']
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. PRE-PURCHASE INSPECTION CHECKLIST (BO6/§8) — full 50+ point, grouped.
  // Voice-guided DIY where safe; flags which points NEED a mechanic + which are CRITICAL.
  // ═══════════════════════════════════════════════════════════════════════════
  var INSPECTION = [
    { group: 'Engine', items: [
      { p: 'Cold-start (no rattle/long crank)', who: 'DIY', critical: true }, { p: 'Idle smooth, no surging', who: 'DIY', critical: false },
      { p: 'Exhaust smoke (blue/white/black)', who: 'DIY', critical: true }, { p: 'Oil condition & level (dipstick)', who: 'DIY', critical: false },
      { p: 'Oil leaks under engine', who: 'Mechanic', critical: true }, { p: 'Coolant clean, no oil mix', who: 'Mechanic', critical: true },
      { p: 'Engine bay wiring intact', who: 'DIY', critical: false }, { p: 'Timing belt/chain history', who: 'Read docs', critical: true } ] },
    { group: 'Transmission', items: [
      { p: 'Gear shifts smooth (manual/auto)', who: 'DIY', critical: true }, { p: 'Clutch bite point not too high', who: 'DIY', critical: false },
      { p: 'No slipping on acceleration', who: 'DIY', critical: true }, { p: 'No fluid leaks', who: 'Mechanic', critical: true } ] },
    { group: 'Brakes', items: [
      { p: 'Pedal firm, not spongy', who: 'DIY', critical: true }, { p: 'No pulling under braking', who: 'DIY', critical: true },
      { p: 'Pad thickness & disc condition', who: 'Mechanic', critical: true }, { p: 'Handbrake holds on slope', who: 'DIY', critical: true } ] },
    { group: 'Suspension & steering', items: [
      { p: 'Bounce test (no continued bounce)', who: 'DIY', critical: false }, { p: 'No clunks over bumps', who: 'DIY', critical: false },
      { p: 'Steering centred, no vibration', who: 'DIY', critical: true }, { p: 'No power-steering leak/noise', who: 'Mechanic', critical: false } ] },
    { group: 'Tyres & wheels', items: [
      { p: 'Tread ≥ 3mm all four + spare', who: 'DIY', critical: false }, { p: 'Even wear (no alignment issue)', who: 'DIY', critical: false },
      { p: 'Tyre age (DOT < 5 yrs)', who: 'DIY', critical: false }, { p: 'No alloy cracks/bends', who: 'DIY', critical: false } ] },
    { group: 'Electrical & AC', items: [
      { p: 'All lights/indicators work', who: 'DIY', critical: false }, { p: 'Windows/mirrors/wipers work', who: 'DIY', critical: false },
      { p: 'Infotainment & sensors', who: 'DIY', critical: false }, { p: 'AC cools fast, no smell', who: 'DIY', critical: false },
      { p: 'Battery age & terminals', who: 'DIY', critical: false }, { p: 'No dashboard warning lights', who: 'DIY', critical: true } ] },
    { group: 'Body & structure', items: [
      { p: 'Panel gaps even (accident sign)', who: 'DIY', critical: true }, { p: 'Paint match across panels', who: 'DIY', critical: true },
      { p: 'No rust (doors, sills, boot)', who: 'DIY', critical: false }, { p: 'Boot floor/spare well not repaired', who: 'DIY', critical: true },
      { p: 'Welding marks under bonnet/boot', who: 'Mechanic', critical: true }, { p: 'Doors/boot/bonnet close flush', who: 'DIY', critical: false } ] },
    { group: 'Underbody', items: [
      { p: 'No frame/chassis damage (lift)', who: 'Mechanic', critical: true }, { p: 'No fresh undercoat hiding rust', who: 'Mechanic', critical: false },
      { p: 'Exhaust intact, no leaks', who: 'Mechanic', critical: false } ] },
    { group: 'Interior', items: [
      { p: 'Odometer wear matches km', who: 'DIY', critical: true }, { p: 'Seats/pedals wear matches age', who: 'DIY', critical: false },
      { p: 'All keys present (incl. spare)', who: 'DIY', critical: false }, { p: 'Seatbelts retract & lock', who: 'DIY', critical: true } ] },
    { group: 'Documents (the trust core)', items: [
      { p: 'RC matches engine/chassis number', who: 'Read docs', critical: true }, { p: 'No pending loan / hypothecation', who: 'Read docs', critical: true },
      { p: 'Insurance + NCB history', who: 'Read docs', critical: false }, { p: 'Valid PUC', who: 'Read docs', critical: false },
      { p: 'Service history complete', who: 'Read docs', critical: false }, { p: 'No pending challans/court cases (VAHAN)', who: 'Read docs', critical: true },
      { p: 'Accident/insurance-claim history', who: 'Read docs', critical: true } ] },
    { group: 'Test drive', items: [
      { p: 'Pulls straight hands-off (safe road)', who: 'DIY', critical: true }, { p: 'Brakes straight, no noise', who: 'DIY', critical: true },
      { p: 'No warning lights after drive', who: 'DIY', critical: true }, { p: 'Gearbox/clutch fine when hot', who: 'DIY', critical: true } ] }
  ];
  function inspectionChecklist() {
    var total = 0, critical = 0;
    INSPECTION.forEach(function (g) { g.items.forEach(function (i) { total++; if (i.critical) critical++; }); });
    return { groups: INSPECTION, totalPoints: total, criticalPoints: critical, confidence: 'high', risks: ['A checklist is not a substitute for a trusted mechanic + a VAHAN/RTO history check before paying.'], sources: ['CEOS §8 Pre-Purchase Inspection (50+ points)'] };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. VEHICLE EDUCATION (BO8/§15) — 12 plain-language modules.
  // ═══════════════════════════════════════════════════════════════════════════
  var EDUCATION = [
    { topic: 'Engine', diy: 'Understand only', a11y: 'Voice + animation', plain: 'The engine burns fuel to turn the wheels. Strange noise, smoke or warning light = get it checked early.' },
    { topic: 'Engine oil', diy: 'Check level (DIY); change = mechanic', a11y: 'Voice + video', plain: 'Oil keeps the engine smooth. Check the dipstick monthly; change at the interval for your fuel type.' },
    { topic: 'Cooling system', diy: 'Check coolant (DIY, COLD); flush = mechanic', a11y: 'Voice + pictures', plain: 'Coolant stops the engine overheating. Never open the cap when hot. Low coolant or steam = stop.' },
    { topic: 'AC system', diy: 'Cabin filter (DIY); gas = mechanic', a11y: 'Voice + animation', plain: 'Weak cooling is often a dirty filter or low gas. A smell usually means the cabin filter.' },
    { topic: 'Transmission', diy: 'Understand only', a11y: 'Voice + animation', plain: 'Sends engine power to the wheels. Slipping or hard shifts = see a mechanic.' },
    { topic: 'Brakes', diy: 'Check pad wear (DIY); replace = mechanic', a11y: 'Voice + pictures', plain: 'Grinding or a soft pedal is unsafe — brakes are never a DIY repair.' },
    { topic: 'Tyres', diy: 'Pressure + tread (DIY)', a11y: 'Voice + video', plain: 'Check pressure monthly. Replace below 1.6mm tread or above 5–6 years. Worn tyres triple wet-road risk.' },
    { topic: 'Battery', diy: 'Terminals + voltage (DIY)', a11y: 'Voice + pictures', plain: 'Most last 3–4 years. Slow cranking or dim lights = get it tested.' },
    { topic: 'Lights & fuses', diy: 'Bulb/fuse swap (DIY)', a11y: 'Voice + video', plain: 'A dead light is often a bulb or fuse — a cheap DIY fix.' },
    { topic: 'Wipers', diy: 'Replace blades (DIY, 2 min)', a11y: 'Voice + video', plain: 'Streaky wipers = worn blades. Easy to swap yourself.' },
    { topic: 'Warning lights', diy: 'Understand only', a11y: 'Voice + images', plain: 'Red = stop now. Amber = get it checked soon. A flashing engine light = stop, do not drive.' },
    { topic: 'Fuel types', diy: 'Understand only', a11y: 'Voice + bar chart', plain: 'Petrol/diesel/CNG/EV/hybrid differ in running cost. Use the Fuel tab to see what suits your km.' }
  ];
  function educationModules() { return { modules: EDUCATION, count: EDUCATION.length, confidence: 'high', risks: [], sources: ['CEOS §15 Vehicle Education'] }; }

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. NEAREST CENTRE (BO4/§10) — deterministic Google-Maps deep-link (no API key).
  // Honest: opens a Maps search; Chitti does not fake a list of named shops.
  // ═══════════════════════════════════════════════════════════════════════════
  function nearestCentre(kind, opts) {
    opts = opts || {};
    var label = { puc: 'PUC pollution check centre', service: 'car service centre', tyre: 'tyre shop', mechanic: 'car mechanic', insurance: 'motor insurance office', rsa: 'roadside assistance' }[kind] || 'car service centre';
    var near = opts.pincode ? (' near ' + opts.pincode) : (opts.geo ? '' : ' near me');
    var q = encodeURIComponent(label + near);
    var url = (opts.geo && opts.geo.lat != null) ? ('https://www.google.com/maps/search/' + q + '/@' + opts.geo.lat + ',' + opts.geo.lng + ',14z') : ('https://www.google.com/maps/search/' + q);
    return { kind: kind, label: label, mapsUrl: url, voice: 'Opening a map of the nearest ' + label + '.', confidence: 'high', risks: ['Chitti opens a live map — it does not pre-judge which shop is best or honest.'], sources: ['CEOS §10 (nearest centre)', 'user-initiated map search'] };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────
  var API = {
    RULES: RULES, BRANDS: BRANDS, INSURERS: INSURERS, TYRES: TYRES, OBD: OBD, FAIR: FAIR,
    DOC_TYPES: DOC_TYPES, SERVICE_INTERVALS: SERVICE_INTERVALS,
    // helpers (exported for tests)
    daysBetween: daysBetween,
    // vault
    vault: { load: vaultLoad, save: vaultSave, set: vaultSet, forget: vaultForget, KEY: VAULT_KEY },
    // engines
    reminders: reminders,
    insuranceCompare: insuranceCompare,
    pucStatus: pucStatus,
    oilRecommendation: oilRecommendation, mechanicCompare: mechanicCompare, SERVICE_COSTS: SERVICE_COSTS,
    tyreRecommend: tyreRecommend, tyreHealth: tyreHealth,
    batteryStatus: batteryStatus,
    fuelCompare: fuelCompare, fuelROI: fuelROI,
    obdLookup: obdLookup,
    scamCheck: scamCheck,
    diyTriage: diyTriage,
    buyScore: buyScore, sellAssistant: sellAssistant, inspectionChecklist: inspectionChecklist,
    symptomCoach: symptomCoach, educationModules: educationModules, nearestCentre: nearestCentre,
    savingsTracker: savingsTracker,
    ownershipScores: ownershipScores,
    crisisCheck: crisisCheck,
    twin: { load: twinLoad, save: twinSave, set: twinSet, forget: twinForget, KEY: TWIN_KEY }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.ChittiCarMechanic = API;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
