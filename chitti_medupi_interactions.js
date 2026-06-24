/*!
 * chitti_medupi_interactions.js — Chitti MedUPI BO3
 * Deterministic drug–drug interaction (DDI) engine. RULES ARE THE PRODUCT.
 * Works offline (client-side) and in Node (backend parity test).
 *
 * Doctrine: NEVER diagnoses, NEVER clears a combination as "safe". It surfaces
 * well-established, high-confidence interactions in plain language and always
 * routes the user to a doctor/pharmacist. Unknown ≠ safe — the honest empty
 * state says so. Class-based (not just exact pairs) so it generalises across
 * the molecules Indian families actually buy.
 *
 * Sources: standard clinical references (BNF, Stockley's, FDA/CDSCO labelling,
 * Medscape interaction checker) — only interactions rated major/contraindicated
 * or well-documented moderate are encoded. No LLM in the critical path.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  if (root) root.MedupiInteractions = mod;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  // ── Drug classes. A molecule may belong to several (e.g. aspirin = antiplatelet AND nsaid). ──
  var CLASSES = {
    anticoagulant: ['warfarin', 'acenocoumarol', 'rivaroxaban', 'apixaban', 'dabigatran', 'edoxaban', 'heparin', 'enoxaparin'],
    antiplatelet: ['aspirin', 'clopidogrel', 'ticagrelor', 'prasugrel', 'dipyridamole'],
    nsaid: ['aspirin', 'diclofenac', 'ibuprofen', 'naproxen', 'aceclofenac', 'ketorolac', 'etoricoxib', 'indomethacin', 'mefenamic acid', 'piroxicam', 'nimesulide'],
    ace_arb: ['ramipril', 'enalapril', 'lisinopril', 'perindopril', 'telmisartan', 'losartan', 'olmesartan', 'valsartan', 'irbesartan', 'candesartan'],
    potassium_sparing: ['spironolactone', 'eplerenone', 'amiloride', 'triamterene'],
    potassium_supplement: ['potassium chloride', 'potassium citrate'],
    statin: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'lovastatin', 'pravastatin', 'pitavastatin'],
    macrolide: ['azithromycin', 'clarithromycin', 'erythromycin', 'roxithromycin'],
    azole_antifungal: ['fluconazole', 'ketoconazole', 'itraconazole', 'voriconazole'],
    ssri_snri: ['fluoxetine', 'sertraline', 'paroxetine', 'citalopram', 'escitalopram', 'fluvoxamine', 'venlafaxine', 'duloxetine'],
    serotonergic_opioid: ['tramadol', 'tapentadol', 'pethidine'],
    triptan: ['sumatriptan', 'rizatriptan', 'zolmitriptan', 'naratriptan'],
    maoi: ['selegiline', 'rasagiline', 'linezolid', 'isocarboxazid', 'phenelzine'],
    nitrate: ['isosorbide mononitrate', 'isosorbide dinitrate', 'nitroglycerin', 'glyceryl trinitrate', 'gtn'],
    pde5: ['sildenafil', 'tadalafil', 'vardenafil', 'avanafil'],
    sulfonylurea: ['glimepiride', 'gliclazide', 'glibenclamide', 'glipizide', 'glyburide'],
    insulin: ['insulin', 'insulin glargine', 'insulin human mixed', 'insulin aspart', 'insulin lispro'],
    qt_prolonging: ['azithromycin', 'clarithromycin', 'erythromycin', 'ciprofloxacin', 'ofloxacin', 'levofloxacin', 'moxifloxacin', 'ondansetron', 'domperidone', 'haloperidol', 'amiodarone', 'fluoxetine', 'citalopram', 'escitalopram', 'hydroxychloroquine'],
    cns_depressant: ['alprazolam', 'clonazepam', 'diazepam', 'lorazepam', 'tramadol', 'codeine', 'zolpidem', 'phenobarbital', 'pregabalin', 'gabapentin'],
    methotrexate: ['methotrexate'],
    digoxin: ['digoxin'],
    lithium: ['lithium']
  };

  // Plain-language risk types (EN + HI safe phrasing). HI deliberately conservative.
  var TYPE_HI = {
    bleeding: 'रक्तस्राव (खून बहने) का खतरा',
    serotonin: 'सेरोटोनिन सिंड्रोम का खतरा',
    hyperkalemia: 'खून में पोटैशियम बढ़ने का खतरा',
    muscle: 'मांसपेशियों को नुकसान का खतरा',
    hypotension: 'रक्तचाप अचानक गिरने का खतरा',
    hypoglycemia: 'शुगर बहुत कम होने का खतरा',
    qt: 'दिल की धड़कन की लय बिगड़ने का खतरा',
    sedation: 'ज़्यादा नींद / साँस धीमी होने का खतरा',
    toxicity: 'दवा का स्तर बढ़कर नुकसान का खतरा',
    kidney: 'किडनी व रक्तचाप पर असर का खतरा'
  };

  // ── Interaction rules (class A × class B). Only encode well-established ones. ──
  var RULES = [
    { a: 'anticoagulant', b: 'antiplatelet', sev: 'severe', type: 'bleeding', mech: 'Both reduce the blood’s ability to clot — together they sharply raise the risk of serious internal or stomach bleeding.', adv: 'Take together only if a doctor has specifically prescribed both. Watch for black stools, unusual bruising, or bleeding gums.' },
    { a: 'anticoagulant', b: 'nsaid', sev: 'severe', type: 'bleeding', mech: 'A blood thinner plus a painkiller (NSAID) can cause dangerous stomach and gut bleeding.', adv: 'Avoid NSAIDs for pain while on a blood thinner — ask your doctor for a safer option such as paracetamol.' },
    { a: 'anticoagulant', b: 'anticoagulant', sev: 'severe', type: 'bleeding', mech: 'Two blood thinners together greatly increase bleeding risk.', adv: 'Never combine two blood thinners unless a specialist directs it.' },
    { a: 'antiplatelet', b: 'nsaid', sev: 'moderate', type: 'bleeding', mech: 'Both irritate the stomach lining and reduce clotting — higher bleeding and ulcer risk.', adv: 'Use the lowest dose for the shortest time; a stomach-protecting medicine may be needed. Confirm with your doctor.' },
    { a: 'ace_arb', b: 'potassium_sparing', sev: 'severe', type: 'hyperkalemia', mech: 'Both raise blood potassium — together they can push it to dangerous levels that affect the heart.', adv: 'Needs blood-potassium monitoring. Do not combine without doctor supervision.' },
    { a: 'ace_arb', b: 'potassium_supplement', sev: 'severe', type: 'hyperkalemia', mech: 'A BP medicine that retains potassium plus a potassium supplement can push potassium to harmful levels.', adv: 'Avoid potassium supplements unless your doctor checks your blood levels.' },
    { a: 'ace_arb', b: 'nsaid', sev: 'moderate', type: 'kidney', mech: 'NSAIDs reduce the BP medicine’s effect and can strain the kidneys.', adv: 'Avoid regular NSAID use; monitor blood pressure and kidney function. Confirm with your doctor.' },
    { a: 'statin', b: 'macrolide', sev: 'severe', type: 'muscle', mech: 'These antibiotics raise statin levels, increasing the risk of severe muscle damage (rhabdomyolysis).', adv: 'Your doctor may pause the statin during the antibiotic course. Report muscle pain or dark urine immediately.' },
    { a: 'statin', b: 'azole_antifungal', sev: 'severe', type: 'muscle', mech: 'Antifungals raise statin levels and the risk of muscle injury.', adv: 'Your doctor may adjust or pause the statin. Watch for muscle pain or weakness.' },
    { a: 'ssri_snri', b: 'serotonergic_opioid', sev: 'severe', type: 'serotonin', mech: 'Both raise serotonin — together they can cause serotonin syndrome (agitation, fever, fast heartbeat, tremor).', adv: 'High-risk combination. Get medical advice before combining; seek urgent care if you feel feverish, shaky, or confused.' },
    { a: 'ssri_snri', b: 'maoi', sev: 'severe', type: 'serotonin', mech: 'An antidepressant plus an MAOI (which includes the antibiotic linezolid) can cause life-threatening serotonin syndrome.', adv: 'This combination is contraindicated — do not take together. Consult your doctor urgently.' },
    { a: 'serotonergic_opioid', b: 'maoi', sev: 'severe', type: 'serotonin', mech: 'Tramadol/pethidine plus an MAOI can cause severe serotonin syndrome and seizures.', adv: 'Contraindicated. Do not combine.' },
    { a: 'ssri_snri', b: 'triptan', sev: 'moderate', type: 'serotonin', mech: 'A migraine triptan plus an antidepressant can raise serotonin (serotonin syndrome risk).', adv: 'Use together only under medical guidance; watch for tremor, sweating, or agitation.' },
    { a: 'ssri_snri', b: 'ssri_snri', sev: 'moderate', type: 'serotonin', mech: 'Two serotonin-raising antidepressants increase serotonin syndrome risk.', adv: 'Avoid combining without psychiatric supervision.' },
    { a: 'nitrate', b: 'pde5', sev: 'severe', type: 'hypotension', mech: 'A heart nitrate plus an erectile-dysfunction drug can cause a sudden, dangerous drop in blood pressure.', adv: 'Never take together. Tell your doctor you take nitrates; separate by the time they advise.' },
    { a: 'sulfonylurea', b: 'insulin', sev: 'moderate', type: 'hypoglycemia', mech: 'Two blood-sugar-lowering medicines together increase the risk of low blood sugar (hypoglycaemia).', adv: 'Monitor sugar closely and keep glucose handy. Doses are usually adjusted by the doctor.' },
    { a: 'sulfonylurea', b: 'sulfonylurea', sev: 'moderate', type: 'hypoglycemia', mech: 'Two sulfonylureas together raise the risk of low blood sugar.', adv: 'Not usually combined — confirm with your doctor.' },
    { a: 'qt_prolonging', b: 'qt_prolonging', sev: 'moderate', type: 'qt', mech: 'Both can affect the heart’s rhythm (QT prolongation); together the risk rises.', adv: 'Tell your doctor you take both — an ECG may be needed, especially with heart disease.' },
    { a: 'cns_depressant', b: 'cns_depressant', sev: 'moderate', type: 'sedation', mech: 'Two sedating medicines together increase drowsiness and can slow breathing.', adv: 'Avoid driving and do not add alcohol. Confirm doses with your doctor.' },
    { a: 'methotrexate', b: 'nsaid', sev: 'severe', type: 'toxicity', mech: 'NSAIDs raise methotrexate levels and toxicity (blood, kidney).', adv: 'Avoid NSAIDs while on methotrexate unless your doctor monitors levels.' },
    { a: 'digoxin', b: 'macrolide', sev: 'moderate', type: 'toxicity', mech: 'These antibiotics can raise digoxin levels (heart-rhythm risk).', adv: 'Your doctor may check the digoxin level; report nausea, visual changes, or palpitations.' },
    { a: 'lithium', b: 'nsaid', sev: 'severe', type: 'toxicity', mech: 'NSAIDs raise lithium levels toward toxicity (tremor, confusion).', adv: 'Avoid NSAIDs with lithium unless levels are monitored.' },
    { a: 'lithium', b: 'ace_arb', sev: 'moderate', type: 'toxicity', mech: 'A BP medicine can raise lithium levels.', adv: 'Lithium-level monitoring is needed; confirm with your doctor.' }
  ];

  var SEV_RANK = { severe: 2, moderate: 1 };
  var SEV_SYMBOL = { severe: '⛔', moderate: '⚠️' };           // ⛔ / ⚠️
  var SEV_LABEL_EN = { severe: 'SEVERE — avoid / doctor only', moderate: 'MODERATE — use with caution' };
  var SEV_LABEL_HI = { severe: 'गंभीर — बचें / केवल डॉक्टर की सलाह पर', moderate: 'मध्यम — सावधानी से लें' };

  var DISCLAIMER_EN = 'This is an information aid, not a clearance. Chitti checks a curated list of well-known interactions — "no interaction found" does NOT mean a combination is safe. Always confirm with your doctor or pharmacist before taking medicines together.';
  var DISCLAIMER_HI = 'यह केवल जानकारी है, सुरक्षा की गारंटी नहीं। "कोई अंतरक्रिया नहीं" का मतलब सुरक्षित नहीं। दवाएँ साथ लेने से पहले हमेशा डॉक्टर या फार्मासिस्ट से पुष्टि करें।';

  function normalize(m) {
    if (!m) return '';
    var s = String(m).trim().toLowerCase();
    s = s.split(/\s+/).join(' ');
    s = s.replace(/\s*\+\s*/g, '+');
    return s;
  }

  // Components of a (possibly combination) molecule string + the whole string.
  function tokensOf(norm) {
    var parts = norm.split('+').map(function (p) { return p.trim(); }).filter(Boolean);
    if (parts.indexOf(norm) === -1) parts.push(norm);
    return parts;
  }

  // Which classes does this molecule belong to?
  function classesOf(norm) {
    var toks = tokensOf(norm);
    var out = {};
    for (var cls in CLASSES) {
      var list = CLASSES[cls];
      for (var i = 0; i < toks.length; i++) {
        if (list.indexOf(toks[i]) !== -1) { out[cls] = true; break; }
      }
    }
    return out;
  }

  function ruleFires(rule, ca, cb) {
    if (rule.a === rule.b) return !!(ca[rule.a] && cb[rule.b]);          // same-class: both members
    return (!!(ca[rule.a] && cb[rule.b])) || (!!(ca[rule.b] && cb[rule.a]));
  }

  /**
   * check(molecules) — molecules: array of medicine/molecule strings.
   * Returns a deterministic report. Never throws on bad input.
   */
  function check(molecules) {
    var list = (molecules || []).map(normalize).filter(Boolean);
    // de-dup identical molecules
    var seen = {}, uniq = [];
    for (var i = 0; i < list.length; i++) { if (!seen[list[i]]) { seen[list[i]] = 1; uniq.push(list[i]); } }

    var clsCache = uniq.map(classesOf);
    var interactions = [];
    var pairsChecked = 0;

    for (var x = 0; x < uniq.length; x++) {
      for (var y = x + 1; y < uniq.length; y++) {
        pairsChecked++;
        var best = null;
        for (var r = 0; r < RULES.length; r++) {
          if (ruleFires(RULES[r], clsCache[x], clsCache[y])) {
            if (!best || SEV_RANK[RULES[r].sev] > SEV_RANK[best.sev]) best = RULES[r];
          }
        }
        if (best) {
          interactions.push({
            a: uniq[x], b: uniq[y], severity: best.sev, type: best.type,
            symbol: SEV_SYMBOL[best.sev], label_en: SEV_LABEL_EN[best.sev], label_hi: SEV_LABEL_HI[best.sev],
            mechanism_en: best.mech, advice_en: best.adv,
            hi_summary: (TYPE_HI[best.type] || 'खतरा') + ' — डॉक्टर या फार्मासिस्ट से सलाह लें।'
          });
        }
      }
    }
    interactions.sort(function (p, q) { return SEV_RANK[q.severity] - SEV_RANK[p.severity]; });

    var highest = interactions.length ? interactions[0].severity : null;
    return {
      input: uniq,
      pairs_checked: pairsChecked,
      interactions: interactions,
      count: interactions.length,
      highest: highest,
      none_found: interactions.length === 0 && uniq.length >= 2,
      disclaimer_en: DISCLAIMER_EN,
      disclaimer_hi: DISCLAIMER_HI
    };
  }

  return {
    check: check,
    normalize: normalize,
    classesOf: classesOf,
    CLASSES: CLASSES,
    RULES: RULES,
    VERSION: '1.0.0'
  };
});
