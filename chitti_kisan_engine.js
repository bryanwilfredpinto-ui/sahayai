/* chitti_kisan_engine.js — Chitti Kisan deterministic engine (CEOS v1.0)
 *
 * RULES ARE THE PRODUCT. Every answer here is computed from a transparent,
 * auditable table — no LLM call in the critical path, works fully offline.
 *
 * Covers the HIGH-priority Build Orders (CEOS §25):
 *   BO3  NBSS&LUP soil-type by district          → soilForDistrict()
 *   BO4  Crop advisor (season + soil → crops)     → cropAdvice()
 *   BO5  Irrigation advisor (when/how-much water) → irrigationAdvice()
 *   BO6  Organic alternatives (ICAR-grounded)     → organicAlternative()
 *   BO7  Pashu Helpline 1962 (always one tap)     → PASHU_HELPLINE
 *   BO8  Livestock daily manager                  → livestockDaily()
 *   BO9  Livestock symptom checker → 1962         → symptomCheck()
 *
 * BO1 (live IMD 7-day) + BO2 (live Agmarknet price) require the backend +
 * API keys. Per CEOS Art-3 (NEVER fabricate prices) and the platform
 * "honest stubs over fake demos" rule, those return {status:'coming_soon'}
 * with an honest message + a deterministic, clearly-labelled SEASONAL
 * advisory that is never presented as a live forecast or a live price.
 *
 * Global: window.ChittiKisan
 * Stateless + pure (except localStorage for the farm/livestock log).
 */
(function () {
  'use strict';

  var PASHU_HELPLINE = '1962';   // National veterinary helpline — never changes (CEOS Art-1)
  var KVK_NOTE = 'Crop emergency? Apne nazdeeki KVK (Krishi Vigyan Kendra) se sampark karein.';

  /* ───────────────────────── BO3 — NBSS&LUP soil map ─────────────────────────
   * District → dominant soil type. District-level approximation of the
   * NBSS&LUP national soil map (8 major Indian soil groups). When a district is
   * unknown we fall back to the state's dominant soil; if state unknown → 'unknown'
   * and we say so honestly (never guess a soil type silently).
   */
  var SOIL_TYPES = {
    black:    { name: 'Black / Regur (kaali mitti)', hold: 'high',   crops: ['cotton', 'soybean', 'tur', 'jowar', 'sugarcane', 'wheat'] },
    alluvial: { name: 'Alluvial (domat / jalodh)',   hold: 'medium', crops: ['wheat', 'rice', 'sugarcane', 'maize', 'mustard', 'potato'] },
    red:      { name: 'Red (laal mitti)',            hold: 'low',    crops: ['groundnut', 'ragi', 'millets', 'pulses', 'tobacco'] },
    laterite: { name: 'Laterite',                    hold: 'low',    crops: ['cashew', 'coconut', 'tapioca', 'rubber', 'tea'] },
    arid:     { name: 'Arid / Desert (registan)',    hold: 'very_low', crops: ['bajra', 'guar', 'moth', 'mustard'] },
    saline:   { name: 'Saline / Alkaline (usar)',    hold: 'low',    crops: ['barley', 'dhaincha', 'salt-tolerant rice'] },
    mountain: { name: 'Mountain / Forest',           hold: 'medium', crops: ['apple', 'maize', 'rajma', 'potato', 'tea'] },
    peaty:    { name: 'Peaty / Marshy',              hold: 'high',   crops: ['rice', 'jute'] }
  };

  // State → dominant soil (fallback when district isn't in the table)
  var STATE_SOIL = {
    'maharashtra': 'black', 'madhya pradesh': 'black', 'gujarat': 'black', 'telangana': 'black', 'karnataka': 'red',
    'andhra pradesh': 'red', 'tamil nadu': 'red', 'uttar pradesh': 'alluvial', 'bihar': 'alluvial', 'punjab': 'alluvial',
    'haryana': 'alluvial', 'west bengal': 'alluvial', 'assam': 'alluvial', 'kerala': 'laterite', 'goa': 'laterite',
    'odisha': 'red', 'rajasthan': 'arid', 'jharkhand': 'red', 'chhattisgarh': 'red', 'himachal pradesh': 'mountain',
    'uttarakhand': 'mountain', 'jammu and kashmir': 'mountain', 'ladakh': 'mountain', 'sikkim': 'mountain', 'delhi': 'alluvial'
  };

  // A representative district override layer (NBSS&LUP district map sample).
  var DISTRICT_SOIL = {
    'nagpur': 'black', 'amravati': 'black', 'akola': 'black', 'yavatmal': 'black', 'wardha': 'black',
    'vidarbha': 'black', 'nashik': 'black', 'indore': 'black', 'bhopal': 'black', 'guntur': 'black',
    'ludhiana': 'alluvial', 'amritsar': 'alluvial', 'meerut': 'alluvial', 'kanpur': 'alluvial', 'patna': 'alluvial',
    'varanasi': 'alluvial', 'bardhaman': 'alluvial', 'karnal': 'alluvial', 'hisar': 'arid', 'bikaner': 'arid',
    'jodhpur': 'arid', 'jaisalmer': 'arid', 'barmer': 'arid', 'bengaluru': 'red', 'mysuru': 'red',
    'salem': 'red', 'anantapur': 'red', 'kolhapur': 'laterite', 'kozhikode': 'laterite', 'thrissur': 'laterite',
    'shimla': 'mountain', 'dehradun': 'mountain', 'cuttack': 'alluvial', 'thanjavur': 'alluvial', 'mumbai': 'laterite'
  };

  function norm(s) { return String(s || '').trim().toLowerCase(); }

  function soilForDistrict(district, state) {
    var d = norm(district), st = norm(state);
    var key = DISTRICT_SOIL[d] || STATE_SOIL[d] || STATE_SOIL[st] || null;
    if (!key) {
      return {
        status: 'unknown',
        message: 'Is jagah ke liye soil type abhi humare paas nahi hai. Apne nazdeeki KVK ya soil-health-card se confirm karein.',
        soil: null, source: 'NBSS&LUP (district map) — honest: location not found'
      };
    }
    var t = SOIL_TYPES[key];
    return {
      status: 'ok', key: key, soil: t.name, waterHolding: t.hold,
      suitedCrops: t.crops.slice(),
      source: 'NBSS&LUP national soil map (district-level approximation, not a soil test)'
    };
  }

  /* ───────────────────────── BO4 — Crop advisor ─────────────────────────
   * Season auto-detected from month (Kharif / Rabi / Zaid), intersected with
   * the soil's suited crops, returns variety + sowing window from an
   * ICAR-style crop calendar. monthIndex passed in (so the engine stays pure /
   * resume-safe — no Date.now() in the engine itself).
   */
  var CROP_CALENDAR = {
    // crop : { season, varieties[], sow, harvestDays }
    cotton:    { season: 'kharif', varieties: ['Bt Cotton (Bunny/RCH)', 'Suraj (desi)'], sow: 'Jun–Jul', harvestDays: 170 },
    soybean:   { season: 'kharif', varieties: ['JS 335', 'JS 9560'], sow: 'Jun–Jul', harvestDays: 100 },
    rice:      { season: 'kharif', varieties: ['Swarna', 'IR-64', 'Pusa Basmati 1121'], sow: 'Jun–Jul', harvestDays: 120 },
    maize:     { season: 'kharif', varieties: ['HQPM-1', 'Ganga-5'], sow: 'Jun–Jul', harvestDays: 95 },
    bajra:     { season: 'kharif', varieties: ['HHB-67', 'Pusa-23'], sow: 'Jun–Jul', harvestDays: 80 },
    tur:       { season: 'kharif', varieties: ['ICPL 87119 (Asha)', 'BSMR-736'], sow: 'Jun–Jul', harvestDays: 160 },
    jowar:     { season: 'kharif', varieties: ['CSH-16', 'Maldandi (rabi)'], sow: 'Jun–Jul', harvestDays: 110 },
    groundnut: { season: 'kharif', varieties: ['TAG-24', 'GG-20'], sow: 'Jun–Jul', harvestDays: 110 },
    wheat:     { season: 'rabi',   varieties: ['HD-2967', 'PBW-343', 'Lokwan'], sow: 'Oct–Nov', harvestDays: 130 },
    mustard:   { season: 'rabi',   varieties: ['Pusa Bold', 'RH-30'], sow: 'Oct–Nov', harvestDays: 130 },
    barley:    { season: 'rabi',   varieties: ['BH-902', 'RD-2552'], sow: 'Oct–Nov', harvestDays: 120 },
    potato:    { season: 'rabi',   varieties: ['Kufri Jyoti', 'Kufri Chandramukhi'], sow: 'Oct–Nov', harvestDays: 90 },
    sugarcane: { season: 'rabi',   varieties: ['Co-0238', 'Co-86032'], sow: 'Oct–Mar', harvestDays: 330 },
    ragi:      { season: 'kharif', varieties: ['GPU-28', 'ML-365'], sow: 'Jun–Jul', harvestDays: 110 },
    moth:      { season: 'kharif', varieties: ['RMO-435', 'CAZRI Moth-2'], sow: 'Jul', harvestDays: 75 },
    guar:      { season: 'kharif', varieties: ['RGC-936', 'HG-365'], sow: 'Jul', harvestDays: 90 }
  };

  function seasonForMonth(m) {  // m: 0=Jan .. 11=Dec
    if (m >= 5 && m <= 9) return 'kharif';   // Jun–Oct
    if (m === 10 || m === 11 || m <= 2) return 'rabi';   // Nov–Mar
    return 'zaid';   // Apr–May
  }

  function cropAdvice(district, state, monthIndex) {
    var soil = soilForDistrict(district, state);
    var season = seasonForMonth(typeof monthIndex === 'number' ? monthIndex : 6);
    var out = { status: 'ok', season: season, soil: soil, recommendations: [] };
    if (soil.status !== 'ok') { out.status = 'partial'; }
    var pool = soil.status === 'ok' ? soil.suitedCrops : Object.keys(CROP_CALENDAR);
    pool.forEach(function (c) {
      var cal = CROP_CALENDAR[c];
      if (!cal) return;
      if (season === 'zaid') return; // zaid = short fodder/veg; advise consult KVK below
      if (cal.season === season) {
        out.recommendations.push({
          crop: c, varieties: cal.varieties.slice(), sow: cal.sow,
          harvestDays: cal.harvestDays
        });
      }
    });
    if (season === 'zaid') {
      out.note = 'Zaid (Apr–May) = short summer season. Moong, watermelon, cucumber, fodder maize. Paani ki zarurat zyada — KVK se confirm.';
    }
    if (!out.recommendations.length && season !== 'zaid') {
      out.note = (out.note || '') + ' Is soil + season ke liye apne KVK se exact variety confirm karein.';
    }
    out.source = 'ICAR crop calendar + NBSS&LUP soil (advisory, not a guarantee). ' + KVK_NOTE;
    return out;
  }

  /* ───────────────────────── BO5 — Irrigation advisor ─────────────────────────
   * Inputs: crop, soil water-holding, rained-in-last-2-days?, soil-feels-dry?
   * Output: water now yes/no + reason + rough quantity guidance.
   * Deterministic decision tree — transparent, never "AI guess".
   */
  function irrigationAdvice(opts) {
    opts = opts || {};
    var crop = norm(opts.crop);
    var soil = soilForDistrict(opts.district, opts.state);
    var hold = soil.status === 'ok' ? soil.waterHolding : 'medium';
    var rained = !!opts.rainedRecently;
    var feelsDry = !!opts.soilDry;
    var hot = !!opts.hotSpell;

    var verdict, reason, klass;
    if (rained) {
      verdict = 'WAIT — abhi paani mat do';
      reason = 'Pichhle 1–2 din baarish hui hai. Mitti mein abhi nami hai — ab paani dena jadon ke liye nuksaandeh (root rot).';
      klass = 'ok';
    } else if (!feelsDry && (hold === 'high' || hold === 'medium')) {
      verdict = 'WAIT — 1–2 din baad check karo';
      reason = 'Mitti abhi sookhi nahi lag rahi aur ' + (soil.soil || 'aapki mitti') + ' nami pakad-ke rakhti hai. Faaltu paani = bimaari + bijli/diesel kharcha.';
      klass = 'ok';
    } else {
      verdict = 'HAAN — aaj paani do';
      reason = (feelsDry ? 'Mitti sookhi lag rahi hai. ' : '') + (hot ? 'Garmi tez hai, vaashpikaran zyada. ' : '') + 'Subah jaldi ya shaam ko paani do (dopahar nahi).';
      klass = 'warning';
    }
    // quantity guidance by soil water-holding
    var qty = ({ very_low: '2–3 din mein thoda-thoda (light, frequent) — registan mitti paani nahi pakadti',
                 low: 'Har 4–5 din halka paani', medium: 'Har 7–8 din, gehra paani',
                 high: 'Har 10–12 din, gehra paani — kaali mitti der tak nami rakhti hai' })[hold];
    return {
      status: 'ok', verdict: verdict, klass: klass, reason: reason,
      quantity: qty, crop: crop || null, soil: soil.soil || null,
      tip: 'Drip ya sprinkler se 40–60% paani bachta hai. Mulching (parali se dhakna) se nami der tak rukti hai.',
      source: 'Deterministic irrigation rule-tree (soil water-holding + recent rain + crop). Not a live soil-moisture sensor reading.'
    };
  }

  /* ───────────────────────── BO6 — Organic alternatives (ICAR) ─────────────────────────
   * Chemical input → organic/natural alternative. ICAR-grounded mapping.
   * CEOS Art-2: organic FIRST, always. Chemical only as documented last resort.
   */
  var ORGANIC_MAP = {
    'urea':        { for: 'Nitrogen (N)', organic: ['Jeevamrit / Ghan-jeevamrit', 'Vermicompost (kechua khaad)', 'Dhaincha green manure', 'Neem-coated FYM'], note: 'Daalon ki kheti (legumes) khet mein nitrogen khud banati hai.' },
    'dap':         { for: 'Phosphorus (P)', organic: ['Rock phosphate + compost', 'Bone meal (haddi powder)', 'PSB bio-fertiliser'], note: 'PSB culture mitti ka jama hua phosphorus khol-deta hai.' },
    'mop':         { for: 'Potash (K)', organic: ['Wood ash (lakdi ki raakh)', 'Banana-peel compost', 'Sulphate of potash (mineral)'], note: 'Raakh thodi-thodi — zyada se mitti kshariya (alkaline) ho jaati hai.' },
    'pesticide':   { for: 'Keet niyantran (pest control)', organic: ['Neem oil spray (5 ml/litre)', 'Dashparni ark', 'Garlic-chilli extract', 'Pheromone / sticky traps'], note: 'Pehle yellow sticky trap lagao — keet ka prakaar pata chalega.' },
    'insecticide': { for: 'Keet niyantran', organic: ['Neem oil + soap spray', 'Beauveria bassiana (bio-pesticide)', 'Bird perches (T-shape) for natural predators'], note: 'Trichogramma card sundi (borer) ke liye behtareen.' },
    'fungicide':   { for: 'Fungus / rog niyantran', organic: ['Bordeaux mixture (copper)', 'Trichoderma viride seed-treatment', 'Buttermilk (chaas) spray', 'Cow-urine (gomutra) 10%'], note: 'Beej ko bone se pehle Trichoderma se upchar karo.' },
    'weedicide':   { for: 'Kharpatwar (weed)', organic: ['Mulching (parali/plastic)', 'Hand/wheel-hoe weeding', 'Stale seedbed technique', 'Intercropping cover crops'], note: 'Mulch kharpatwar rokta hai aur nami bhi bachata hai.' },
    'herbicide':   { for: 'Kharpatwar', organic: ['Mulching', 'Manual nirai', 'Cover cropping'], note: 'Crop rotation se kharpatwar ka chakra tootta hai.' },
    'growth':      { for: 'Vriddhi (growth promoter)', organic: ['Panchgavya 3% spray', 'Seaweed extract', 'Jeevamrit'], note: 'Panchgavya 15 din mein ek baar — patte hare aur mazboot.' }
  };

  function organicAlternative(chemical) {
    var c = norm(chemical);
    // fuzzy: match on contained keyword
    var hit = null, key = null;
    Object.keys(ORGANIC_MAP).forEach(function (k) { if (!hit && (c === k || c.indexOf(k) >= 0)) { hit = ORGANIC_MAP[k]; key = k; } });
    if (!hit) {
      // common brand/molecule aliases
      var alias = { 'roundup': 'weedicide', 'glyphosate': 'weedicide', 'monocrotophos': 'insecticide',
        'imidacloprid': 'insecticide', 'mancozeb': 'fungicide', 'carbendazim': 'fungicide',
        'potash': 'mop', 'phosphate': 'dap', 'nitrogen': 'urea' };
      Object.keys(alias).forEach(function (a) { if (!hit && c.indexOf(a) >= 0) { key = alias[a]; hit = ORGANIC_MAP[key]; } });
    }
    if (!hit) {
      return { status: 'unknown', message: 'Is product ka organic vikalp abhi list mein nahi hai. Neem-aadharit upchar aur KVK salah behtareen shuruaat hai.',
        source: 'ICAR organic alternatives (honest: input not in table)' };
    }
    return {
      status: 'ok', chemical: chemical, replaces: hit.for,
      organic: hit.organic.slice(), tip: hit.note,
      principle: 'Chitti hamesha organic pehle batata hai. Chemical sirf aakhri vikalp — KVK ki salah se, sahi maatra mein.',
      source: 'ICAR / natural-farming organic alternatives database'
    };
  }

  /* ───────────────────────── BO8 — Livestock daily manager ─────────────────────────
   * Daily checklist by animal type + simple local log (localStorage).
   * No diagnosis. No server. Animal health data is LOCAL ONLY (CEOS §35).
   */
  var ANIMALS = {
    cattle:  { label: 'Gaay / Bhains (Cattle/Buffalo)', checklist: ['Aaj kitna doodh? (litre)', 'Chaara + paani diya?', 'Gobar normal hai?', 'Chalne mein dikkat to nahi?', 'Thaan (udder) garam/sooja to nahi?'], vaxNote: 'FMD + HS + BQ vaccine saal mein. Deworming har 3 mahine.' },
    poultry: { label: 'Murgi / Batak (Poultry)', checklist: ['Aaj kitne ande?', 'Daana + saaf paani?', 'Koi murgi sust/bemaar?', 'Bichaali (litter) sookhi hai?'], vaxNote: 'Ranikhet (ND) + Gumboro vaccine schedule par. Coop saaf rakho.' },
    goat:    { label: 'Bakri / Bhed (Goat/Sheep)', checklist: ['Wazan theek badh raha?', 'Chaara + paani?', 'Khaansi/naak behna to nahi?', 'Khur (hoof) theek hai?'], vaxNote: 'PPR + ET + FMD vaccine. Deworming har 3 mahine — PPR ghaatak hai.' },
    pig:     { label: 'Suar (Pig)', checklist: ['Daana (FCR) theek?', 'Paani saaf?', 'Bukhar/sust to nahi?', 'Baada saaf hai?'], vaxNote: 'Classical Swine Fever (CSF) vaccine zaroori. Baada sookha + saaf.' }
  };

  function livestockDaily(animal) {
    var a = ANIMALS[norm(animal)];
    if (!a) return { status: 'unknown', message: 'Animal type chuno: cattle / poultry / goat / pig.' };
    return {
      status: 'ok', animal: norm(animal), label: a.label,
      checklist: a.checklist.slice(), vaccination: a.vaxNote,
      reminder: 'Pashu Helpline ' + PASHU_HELPLINE + ' har waqt ek tap door hai.',
      source: 'Deterministic daily husbandry checklist (NABARD / animal-husbandry dept guidance). Local-only log.'
    };
  }

  function logLivestock(animal, field, value) {
    try {
      var k = 'chitti_kisan_livestock_v1';
      var db = JSON.parse(localStorage.getItem(k) || '{}');
      db[norm(animal)] = db[norm(animal)] || [];
      db[norm(animal)].push({ field: field, value: value });   // no timestamp in engine (resume-safe)
      if (db[norm(animal)].length > 200) db[norm(animal)] = db[norm(animal)].slice(-200);
      localStorage.setItem(k, JSON.stringify(db));
      return { status: 'ok', count: db[norm(animal)].length };
    } catch (e) { return { status: 'error', message: 'Local save fail — storage band hai.' }; }
  }

  /* ───────────────────────── BO9 — Symptom checker → 1962 ─────────────────────────
   * CEOS Art-1 (LOCKED): ANY disease symptom → IMMEDIATE 1962. Chitti NEVER
   * diagnoses or prescribes for animals. It triages to "call the vet" only.
   * Red-flag keywords escalate hard; everything else still recommends 1962.
   */
  var RED_FLAGS = [
    'blood', 'khoon', 'foam', 'jhaag', 'fit', 'aekthan', 'convuls', 'paralys', 'lakwa',
    'down', 'gir gaya', 'uth nahi', 'collapse', 'high fever', 'tez bukhar', 'bukhar',
    'not eating', 'khaana band', 'chaara band', 'no milk', 'doodh band', 'swelling', 'sujan', 'sooj',
    'limping', 'langda', 'wound', 'ghaav', 'maggot', 'keeda', 'diarrhea', 'dast', 'loose motion',
    'cough', 'khaansi', 'nasal', 'naak beh', 'breathing', 'saans', 'abort', 'garbhpaat',
    'mastitis', 'thaan', 'udder', 'bloat', 'aafra', 'pet phool', 'foot and mouth', 'khur', 'lameness'
  ];

  function symptomCheck(text) {
    var t = norm(text);
    var matched = RED_FLAGS.filter(function (f) { return t.indexOf(f) >= 0; });
    var urgent = matched.length > 0;
    return {
      status: 'ok',
      urgent: true,   // ALWAYS route to vet — Chitti never says "it's fine, don't call"
      escalate: PASHU_HELPLINE,
      matched: matched,
      headline: urgent
        ? '🚨 Yeh lakshan gambhir ho sakte hain. ABHI Pashu Helpline ' + PASHU_HELPLINE + ' par call karein.'
        : 'Pashu ki bimari ka ilaj sirf doctor batata hai. Pashu Helpline ' + PASHU_HELPLINE + ' par baat karein.',
      doNow: ['Pashu ko alag (isolate) karein, doosre janwaron se door', 'Saaf paani saamne rakhein', 'Apne aap koi dawai/injection mat dein', 'Pashu Helpline ' + PASHU_HELPLINE + ' ya nazdeeki pashu-chikitsalay'],
      disclaimer: 'Chitti kabhi bhi pashu ki bimari ka ilaj nahi batata — sirf doctor batata hai. (CEOS Art-1, LOCKED)',
      source: 'Deterministic triage — escalation only, never diagnosis.'
    };
  }

  /* ───────────────────────── BO1 — IMD weather (honest COMING SOON) ─────────────────────────
   * Live 7-day forecast needs the IMD API via the backend. Until wired we
   * return an honest coming-soon + a clearly-labelled SEASONAL advisory
   * (general, not a forecast). NEVER presented as a live prediction.
   */
  var SEASONAL = {
    kharif: 'Monsoon season (Jun–Oct): boवाई ka samay. Jal-nikaasi (drainage) ready rakho, fungal rog par nazar.',
    rabi:   'Winter season (Nov–Mar): pala (frost) se bachav — raat ko halki sinchai pala kam karti hai.',
    zaid:   'Summer (Apr–May): garmi tez, paani ki kami. Mulching + subah-shaam sinchai.'
  };
  function weatherAdvisory(monthIndex) {
    var s = seasonForMonth(typeof monthIndex === 'number' ? monthIndex : 6);
    return {
      status: 'coming_soon',
      message: 'Live 7-din IMD forecast jald aayega (backend + IMD API se). Abhi yeh general mausam salah hai — live prediction NAHI.',
      season: s, seasonalAdvisory: SEASONAL[s],
      source: 'IMD live forecast = COMING SOON. Seasonal advisory = deterministic (honest, not a forecast).'
    };
  }

  /* ───────────────────────── BO2 — Agmarknet mandi price (honest, NEVER fabricated) ─────────────────────────
   * CEOS Art-3 (LOCKED): mandi prices come from Agmarknet ONLY, never guessed.
   * Until the backend is wired we return an honest coming-soon. We NEVER
   * return a number here. The query is captured for the backend to answer.
   */
  function mandiPrice(crop, district, state) {
    return {
      status: 'coming_soon',
      query: { crop: norm(crop), district: norm(district), state: norm(state) },
      message: 'Aaj ka mandi bhav Agmarknet se aata hai (live backend). Chitti kabhi bhi bhav ANUMAAN se nahi batata (CEOS Art-3). Backend judte hi yahan asli bhav dikhega.',
      source: 'Agmarknet live API — COMING SOON. No price is ever fabricated.'
    };
  }

  window.ChittiKisan = {
    version: '1.0',
    PASHU_HELPLINE: PASHU_HELPLINE,
    SOIL_TYPES: SOIL_TYPES,
    ANIMALS: ANIMALS,
    soilForDistrict: soilForDistrict,
    seasonForMonth: seasonForMonth,
    cropAdvice: cropAdvice,
    irrigationAdvice: irrigationAdvice,
    organicAlternative: organicAlternative,
    livestockDaily: livestockDaily,
    logLivestock: logLivestock,
    symptomCheck: symptomCheck,
    weatherAdvisory: weatherAdvisory,
    mandiPrice: mandiPrice
  };
})();
