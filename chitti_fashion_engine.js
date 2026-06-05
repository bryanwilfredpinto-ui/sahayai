/* ════════════════════════════════════════════════════════════════════════
   chitti_fashion_engine.js — Chitti Fashion DETERMINISTIC intelligence engine.
   Works with ZERO LLM dependency (doctrine: rules are the product, LLM enhances).
   UMD: attaches to window.ChittiFashionEngine in the browser AND module.exports
   in Node so tools/fashion_gold_eval.mjs can score it.

   Layers implemented:
     1 classifyOccasion  — outfit -> occasion + confidence
       colorHarmony      — colour relationship score
       seasonalSuitability
     2 judge             — re-review (cultural / weather / age / accessibility)
     3 confidence        — % + reason breakdown
     4 explain           — teach WHY, deterministically
     5 buildOutfits      — combinatorial outfits from owned items (Outfit Simulator)
     6 wardrobeROI       — "buying X unlocks N new outfits"
   ════════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ChittiFashionEngine = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  // ---------- colour model (EN + Hindi) ----------
  var COLOUR = {
    neutral: ['black', 'white', 'grey', 'gray', 'beige', 'cream', 'navy', 'charcoal', 'tan', 'ivory', 'खाकी', 'काला', 'सफ़ेद', 'सफेद', 'ग्रे', 'क्रीम', 'नेवी'],
    warm: ['red', 'maroon', 'orange', 'yellow', 'mustard', 'rust', 'gold', 'pink', 'peach', 'brown', 'लाल', 'मरून', 'नारंगी', 'पीला', 'भूरा', 'गुलाबी', 'सुनहरा'],
    cool: ['blue', 'green', 'teal', 'purple', 'indigo', 'olive', 'mint', 'lavender', 'नीला', 'हरा', 'बैंगनी'],
  };
  function colourFamily(name) {
    var s = String(name || '').toLowerCase();
    for (var fam in COLOUR) if (COLOUR[fam].some(function (c) { return s.indexOf(c) >= 0; })) return fam;
    return 'neutral';
  }
  var BRIGHTS = ['red', 'orange', 'yellow', 'pink', 'green', 'purple', 'mustard', 'लाल', 'नारंगी', 'पीला', 'गुलाबी', 'हरा'];
  function isBright(name) { var s = String(name || '').toLowerCase(); return BRIGHTS.some(function (c) { return s.indexOf(c) >= 0; }); }

  // ════════ REAL COLOUR SCIENCE (gap P0#2) — works on actual hex from photo ════════
  function hexToHSL(hex) {
    if (!hex) return null; hex = String(hex).replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    if (hex.length < 6) return null;
    var r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0, s = 0, l = (mx + mn) / 2;
    if (d) { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)); else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
  // analyse a real colour -> undertone (warm/cool/neutral) · value (light/mid/dark) · chroma (muted/clear)
  function analyseColour(hex, name) {
    var hsl = hexToHSL(hex);
    if (!hsl) { return { family: colourFamily(name), undertone: (colourFamily(name) === 'warm' ? 'warm' : colourFamily(name) === 'cool' ? 'cool' : 'neutral'), value: 'mid', chroma: isBright(name) ? 'clear' : 'muted', hsl: null }; }
    var undertone = 'neutral';
    if (hsl.s >= 12) undertone = (hsl.h >= 45 && hsl.h <= 200) ? 'cool' : 'warm'; // green→blue range cool-ish, reds/oranges/yellows warm
    if (hsl.h >= 16 && hsl.h <= 45) undertone = 'warm';   // oranges/golds
    if (hsl.h > 200 && hsl.h < 320) undertone = 'cool';   // blue→violet
    var value = hsl.l >= 68 ? 'light' : (hsl.l <= 32 ? 'dark' : 'mid');
    var chroma = hsl.s >= 55 ? 'clear' : (hsl.s <= 20 ? 'muted' : 'soft');
    var family = hsl.s < 12 ? 'neutral' : undertone;
    return { family: family, undertone: undertone, value: value, chroma: chroma, hsl: hsl };
  }
  // personal palette: a "season" (warm/cool/clear/soft) -> guidance + scoring bias
  var PALETTES = {
    warm: { best: ['warm', 'neutral'], avoid: ['cool'], note: 'warm tones (mustard, rust, olive, cream, gold) glow on you' },
    cool: { best: ['cool', 'neutral'], avoid: ['warm'], note: 'cool tones (navy, teal, plum, grey, true white) suit you' },
    clear: { best: ['clear', 'neutral'], avoid: ['muted'], note: 'clear, saturated colours with crisp contrast suit you' },
    soft: { best: ['muted', 'neutral'], avoid: ['clear'], note: 'soft, muted tones and low contrast flatter you' },
    neutral: { best: ['neutral', 'warm', 'cool'], avoid: [], note: 'most tones work — anchor with neutrals' },
  };
  function paletteFor(season) { return PALETTES[season] || PALETTES.neutral; }
  // derive a likely season from the wardrobe's analysed colours
  function deriveSeason(items) {
    var warm = 0, cool = 0, clear = 0, muted = 0;
    (items || []).forEach(function (it) { var a = analyseColour(it.hex, it.colour); if (a.undertone === 'warm') warm++; else if (a.undertone === 'cool') cool++; if (a.chroma === 'clear') clear++; else if (a.chroma === 'muted') muted++; });
    var season = warm === cool ? 'neutral' : (warm > cool ? 'warm' : 'cool');
    return { season: season, warm: warm, cool: cool, clear: clear, muted: muted };
  }

  // ════════ FABRIC + PATTERN intelligence (gap P0#4) ════════
  function fabricSeason(it) {
    var hay = hayOf(it);
    if (/linen|cotton|chiffon|georgette|light|mul|khadi/.test(hay)) return 'summer';
    if (/wool|tweed|velvet|leather|denim|fleece|heavy|woolen|woollen/.test(hay)) return 'winter';
    if (/silk|satin|crepe|rayon|poly/.test(hay)) return 'all';
    return 'all';
  }
  function patternOf(it) { var hay = hayOf(it); if (/floral|print|polka|stripe|check|plaid|geometr|paisley|bandhej|ikat|block.?print/.test(hay)) return 'patterned'; return 'solid'; }
  function patternRule(items) {
    var patt = (items || []).filter(function (i) { return patternOf(i) === 'patterned'; }).length;
    if (patt >= 2) return { ok: false, code: 'two_patterns', note: 'two prints compete — keep one print, pair with solids' };
    return { ok: true, code: 'pattern_ok', note: '' };
  }

  // ════════ FIT / PROPORTION (gap P0#3) — garment terms only, never the body ════════
  function fitNote(items, profile) {
    profile = profile || {};
    var fit = profile.fit; // relaxed | structured | any
    var has = function (re) { return (items || []).some(function (i) { return re.test(hayOf(i)); }); };
    if (fit === 'structured') return { code: 'fit_structured', note: 'a structured cut + a defined waist reads sharp and intentional' };
    if (fit === 'relaxed') return { code: 'fit_relaxed', note: 'a relaxed, draped cut moves comfortably and reads easy' };
    if (has(/blazer|jacket|kurta/) ) return { code: 'fit_layer', note: 'an open layer adds a clean vertical line' };
    return { code: 'fit_any', note: 'tuck or roll once to define the line' };
  }

  // ---------- category formality (0 casual .. 5 grand) ----------
  // keyword -> formality. Higher = dressier.
  var FORMALITY = [
    [/sherwani|lehenga|gown|tuxedo|tux/i, 5],
    [/saree|sari|\bsuit\b|blazer|silk/i, 4],
    [/anarkali|formal shirt|dress shirt|oxford|\btrouser/i, 3],
    [/kurta|kurti|churidar|salwar|palazzo|skirt|jutti|sandal|heel|watch|sweater|jacket|loafer|chino|dupatta/i, 2],
    [/jeans|tee|t-shirt|tshirt|hoodie|sneaker|shorts|chappal|slipper|flip|track|gym|hood/i, 0],
  ];
  function hayOf(it) { return ((it.category || '') + ' ' + (it.colour || '') + ' ' + (it.fabric || '') + ' ' + (it.pattern || '') + ' ' + (it.desc || it.name || '')).toLowerCase(); }
  function itemFormality(it) {
    var hay = hayOf(it);
    if (it.category === 'outfit') { if (/sherwani|lehenga|gown/i.test(hay)) return 5; if (/saree|sari|\bsuit\b/i.test(hay)) return 4; if (/anarkali/i.test(hay)) return 3; return 3; }
    if (it.category === 'footwear') { if (/oxford|heel/i.test(hay)) return 3; if (/loafer|jutti|sandal/i.test(hay)) return 2; return 0; }
    if (it.category === 'jewellery' || it.category === 'dupatta') return 2;
    for (var i = 0; i < FORMALITY.length; i++) if (FORMALITY[i][0].test(hay)) return FORMALITY[i][1];
    if (it.category === 'top' || it.category === 'bottom') return 2;
    return 2;
  }
  var ETHNIC = /sherwani|lehenga|saree|sari|anarkali|kurta|kurti|churidar|salwar|dupatta|jhumka|temple|silk|jutti/i;
  var FESTIVE_COLOUR = /gold|maroon|\bred\b|सुनहरा|मरून|लाल/i;

  // ---------- Layer 1a: classify occasion ----------
  var BAND_TO_OCCASION = [
    [4.3, 'wedding'], [3.6, 'festive'], [2.9, 'formal'], [2.2, 'business-casual'], [1.4, 'smart-casual'], [-1, 'casual'],
  ];
  function classifyOccasion(items) {
    items = items || [];
    if (!items.length) return { occasion: 'casual', band: 0, confidence: 0, reason: 'empty' };
    var hay = items.map(hayOf).join(' ');
    var vals = items.map(itemFormality);
    var avg = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    var peak = Math.max.apply(null, vals);
    var spread = peak - Math.min.apply(null, vals);
    var ethnic = ETHNIC.test(hay);
    var hasJewel = items.some(function (it) { return it.category === 'jewellery' || it.category === 'dupatta'; });

    // ── Explicit ethnic occasion rules — garment defines the occasion ──
    if (ethnic) {
      if (/sherwani|lehenga/i.test(hay)) return { occasion: 'wedding', band: 5, confidence: 92, reason: 'sherwani/lehenga = wedding-grade' };
      if (/saree|sari/i.test(hay)) {
        var grand = hasJewel || /heel/i.test(hay);
        return { occasion: grand ? 'wedding' : 'festive', band: grand ? 4.5 : 3.8, confidence: 85, reason: 'saree' + (grand ? ' + jewellery/heels' : '') };
      }
      if (hasJewel || FESTIVE_COLOUR.test(hay)) return { occasion: 'festive', band: 3.8, confidence: 82, reason: 'ethnic + festive markers' };
      // plain ethnic daily wear (kurta/kurti/churidar, no festive markers)
      return { occasion: 'smart-casual', band: 1.8, confidence: 78, reason: 'ethnic daily wear' };
    }

    // ── Western wear — averaging lets a casual element dress down a formal piece ──
    var occ = 'casual';
    for (var i = 0; i < BAND_TO_OCCASION.length; i++) if (avg >= BAND_TO_OCCASION[i][0]) { occ = BAND_TO_OCCASION[i][1]; break; }
    var conf = Math.max(45, Math.round(100 - spread * 10));
    return { occasion: occ, band: Math.round(avg * 10) / 10, confidence: conf, reason: 'western avg ' + (Math.round(avg * 10) / 10) + ', spread ' + spread };
  }

  // ---------- Layer 1b: colour harmony ----------
  function colorHarmony(items) {
    var cols = (items || []).map(function (it) { return it.colour; }).filter(Boolean);
    if (cols.length < 2) return { score: 1, type: 'single', why: 'one colour — always safe' };
    var fams = {}; cols.forEach(function (c) { var f = colourFamily(c); fams[f] = (fams[f] || 0) + 1; });
    var brights = cols.filter(isBright).length;
    var neutrals = fams.neutral || 0;
    var distinctFams = Object.keys(fams).length;
    var score, type, why;
    if (brights >= 2 && neutrals === 0) { score = 0.45; type = 'competing'; why = 'two+ bright colours fight to be the hero — anchor with a neutral'; }
    else if (neutrals >= 1 && brights <= 1) { score = 0.95; type = 'neutral-anchored'; why = 'a neutral lets one colour lead — clean and intentional'; }
    else if (distinctFams === 1) { score = 0.85; type = 'monochrome'; why = 'one colour family reads cohesive'; }
    else if (distinctFams === 2) { score = 0.8; type = 'two-tone'; why = 'two families with contrast — balanced'; }
    else { score = 0.6; type = 'mixed'; why = 'several families — add a neutral anchor to calm it'; }
    // refine with REAL colour when hex present (additive — no hex => unchanged, gold-safe)
    var withHex = (items || []).filter(function (it) { return it.hex; });
    if (withHex.length >= 2) {
      var an = withHex.map(function (it) { return analyseColour(it.hex, it.colour); });
      var nonNeutral = an.filter(function (a) { return a.family !== 'neutral'; });
      var undertones = {}; nonNeutral.forEach(function (a) { undertones[a.undertone] = 1; });
      var values = an.map(function (a) { return a.value; });
      var clash = undertones.warm && undertones.cool && nonNeutral.length >= 2; // mixing warm+cool brights
      var valSpread = (values.indexOf('light') >= 0 && values.indexOf('dark') >= 0);
      if (clash) { score = Math.min(score, 0.5); type = 'undertone-clash'; why = 'warm and cool tones pull against each other — keep one temperature'; }
      else if (valSpread && type !== 'competing') { score = Math.max(score, 0.9); type = 'value-contrast'; why = 'light + dark gives clean, intentional contrast'; }
    }
    return { score: score, type: type, why: why };
  }

  // ---------- Layer 1c: seasonal suitability ----------
  function seasonalSuitability(items, season) {
    var hay = (items || []).map(function (it) { return ((it.category || '') + ' ' + (it.colour || '') + ' ' + (it.desc || '')).toLowerCase(); }).join(' ');
    var summer = /(linen|cotton|light|white|pastel|sandal|shorts|sleeveless)/.test(hay);
    var winter = /(wool|jacket|sweater|boot|dark|heavy|coat|layer)/.test(hay);
    var s = (season || 'all').toLowerCase();
    var fit = 'all';
    if (summer && !winter) fit = 'summer'; else if (winter && !summer) fit = 'winter';
    var ok = (s === 'all' || fit === 'all' || fit === s);
    return { fit: fit, season: s, score: ok ? 1 : 0.5, why: ok ? 'fabric suits the season' : 'fabric leans ' + fit + ' — adjust layers for ' + s };
  }

  // ---------- Layer 3: confidence ----------
  function confidence(checks) {
    // checks: {color:bool, occasion:bool, weather:bool, budget:bool, accessibility:bool}
    var weights = { occasion: 30, color: 25, weather: 20, budget: 15, accessibility: 10 };
    var total = 0, got = 0, reasons = [];
    for (var k in weights) { if (k in checks) { total += weights[k]; if (checks[k]) { got += weights[k]; reasons.push('✓ ' + k + ' match'); } else { reasons.push('✗ ' + k); } } }
    var pct = total ? Math.round((got / total) * 100) : 0;
    return { confidence: pct, reasons: reasons, checks: checks };
  }

  // ---------- Layer 2: AI Judge (deterministic re-review) ----------
  function judge(items, ctx) {
    ctx = ctx || {}; var flags = []; var hay = (items || []).map(function (it) { return ((it.colour || '') + ' ' + (it.category || '') + ' ' + (it.desc || it.name || '')).toLowerCase(); }).join(' ');
    var occ = (ctx.occasion || classifyOccasion(items).occasion);
    // cultural
    if (occ === 'funeral' && /(red|लाल|bright|maroon|मरून|gold)/.test(hay)) flags.push({ axis: 'cultural', code: 'funeral_bright', msg: 'bright/red reads festive — funerals call for white/muted', sev: 'major' });
    if (occ === 'wedding' && /\bwhite\b|सफ़ेद|सफेद/.test(hay) && (ctx.culture === 'hindu' || !ctx.culture)) flags.push({ axis: 'cultural', code: 'wedding_white', msg: 'all-white at a wedding can read as mourning in many Indian communities — confirm', sev: 'minor' });
    // weather
    var seas = seasonalSuitability(items, ctx.season);
    if (seas.score < 1) flags.push({ axis: 'weather', code: 'season_mismatch', msg: seas.why, sev: 'minor' });
    // age
    if (ctx.age_band === 'senior' && /(heel|stiff|tight)/.test(hay)) flags.push({ axis: 'age', code: 'senior_footwear', msg: 'prefer non-slip, easy-fasten footwear for comfort + safety', sev: 'minor' });
    if (ctx.age_band === 'child' && /(heel|sharp|choking)/.test(hay)) flags.push({ axis: 'age', code: 'child_safety', msg: 'keep it comfortable + safe for a child', sev: 'major' });
    // accessibility
    if (ctx.profile && (ctx.profile.limited_mobility || ctx.profile.elderly) && /(button-heavy|zip-back|tight)/.test(hay)) flags.push({ axis: 'accessibility', code: 'easy_fasten', msg: 'favour magnetic/velcro/front-open for independent dressing', sev: 'minor' });
    var blockers = flags.filter(function (f) { return f.sev === 'major'; });
    return { pass: blockers.length === 0, flags: flags, held: blockers.length > 0 };
  }

  // ---------- Layer 4: explainability ----------
  function explain(items, ctx) {
    var h = colorHarmony(items), o = classifyOccasion(items);
    var parts = [];
    parts.push('This reads ' + o.occasion + ' (formality ' + o.band + '/5).');
    parts.push('Colour: ' + h.why + '.');
    var seas = seasonalSuitability(items, (ctx || {}).season); if (seas.score < 1) parts.push('Season: ' + seas.why + '.');
    return parts.join(' ');
  }

  // ---------- Layer 5: build outfits (Outfit Simulator) ----------
  function buildOutfits(items, opts) {
    opts = opts || {}; var max = opts.max || 30; var targetOcc = opts.occasion || null;
    var byCat = { top: [], bottom: [], footwear: [], outfit: [], jewellery: [], dupatta: [], bag: [] };
    // Clothing Doctor guard: never style an item that needs repair (additive — items without
    // a condition field are unaffected, so gold/existing tests stay green). opts.includeRepair
    // bypasses the guard for the Doctor's own listing.
    (items || []).forEach(function (it) {
      if (!opts.includeRepair && it.condition === 'needs_repair') return;
      if (byCat[it.category]) byCat[it.category].push(it);
    });
    var combos = [];
    var liked = (opts.liked || {}); // learning loop: { colours:{family:n}, cats:{cat:n} }
    function likeBoost(set) {
      if (!liked.colours && !liked.cats) return 0; var b = 0;
      set.forEach(function (s) { var f = analyseColour(s.hex, s.colour).family; if (liked.colours && liked.colours[f]) b += 0.04; if (liked.cats && liked.cats[s.category]) b += 0.02; });
      return Math.min(0.15, b);
    }
    function rank(set) {
      var h = colorHarmony(set), o = classifyOccasion(set);
      var occFit = targetOcc ? (o.occasion === targetOcc ? 1 : (set.some(function (s) { return (s.occasions || []).indexOf(targetOcc) >= 0; }) ? 0.7 : 0.3)) : 0.8;
      var base = h.score * 0.5 + occFit * 0.5;
      return { items: set, score: Math.round(Math.min(1, base + likeBoost(set)) * 100), harmony: h.type, occasion: o.occasion, occFit: occFit };
    }
    // full outfits + footwear
    byCat.outfit.forEach(function (o) { (byCat.footwear.length ? byCat.footwear : [null]).forEach(function (f) { combos.push(rank([o].concat(f ? [f] : []))); }); });
    // top x bottom (x footwear)
    byCat.top.forEach(function (t) { byCat.bottom.forEach(function (b) {
      var foots = byCat.footwear.length ? byCat.footwear : [null];
      foots.forEach(function (f) { var set = [t, b].concat(f ? [f] : []); combos.push(rank(set)); });
    }); });
    // de-dup by item-id signature, filter target occasion if asked, sort by score
    var seen = {}; var out = [];
    combos.sort(function (a, b) { return b.score - a.score; });
    for (var i = 0; i < combos.length; i++) {
      var sig = combos[i].items.map(function (x) { return x.id; }).sort().join('|');
      if (seen[sig]) continue; seen[sig] = 1;
      if (targetOcc && combos[i].occFit < 0.3) continue;
      out.push(combos[i]); if (out.length >= max) break;
    }
    return { count: out.length, outfits: out, possible: combos.length };
  }

  // ---------- Layer 6: wardrobe ROI ----------
  function wardrobeROI(items, candidate) {
    var before = buildOutfits(items, { max: 1000 }).count;
    var after = buildOutfits((items || []).concat([candidate]), { max: 1000 }).count;
    var unlocked = Math.max(0, after - before);
    return { before: before, after: after, unlocked: unlocked, candidate: candidate, why: 'adding ' + (candidate.colour || '') + ' ' + (candidate.category || 'item') + ' unlocks ' + unlocked + ' new outfit' + (unlocked === 1 ? '' : 's') + ' from clothes you already own' };
  }

  // ---------- recommend: full pipeline (build -> judge -> confidence -> explain) ----------
  function recommend(items, ctx) {
    ctx = ctx || {};
    var built = buildOutfits(items, { occasion: ctx.occasion, max: ctx.max || 3 });
    return built.outfits.map(function (o) {
      var j = judge(o.items, ctx);
      var h = colorHarmony(o.items);
      var seas = seasonalSuitability(o.items, ctx.season);
      var conf = confidence({ occasion: o.occFit >= 0.7, color: h.score >= 0.7, weather: seas.score >= 1, budget: true, accessibility: j.pass });
      var band = classifyOccasion(o.items).band;
      return { items: o.items, occasion: o.occasion, band: band, confidence: conf.confidence, reasons: conf.reasons, checks: conf.checks, judge: j, explain: explain(o.items, ctx), harmony: h.type, season: seas };
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  CFOS v2.1 — DETERMINISTIC FEATURES (no LLM, no API). Spec:
  //  chitti-fashion/SPEC_DOCTOR_WEDDING_OFFICE.md
  // ════════════════════════════════════════════════════════════════════════

  // ---------- 1. CLOTHING DOCTOR (repair-not-buy — Founder Rule step 4) ----------
  // Language-neutral repair knowledge. Page localizes via FashionDyn.repair.
  var REPAIR_RULES = {
    tear_small:    { tools: ['needle', 'thread', 'scissors'],          stitch: 'running/backstitch', difficulty: 'easy',   minutes: 15, diy: true,  tailor: false },
    tear_large:    { tools: ['needle', 'thread', 'patch', 'iron'],     stitch: 'patch+backstitch',   difficulty: 'medium', minutes: 30, diy: true,  tailor: true },
    button_missing:{ tools: ['needle', 'thread', 'spare button'],      stitch: 'shank-button',       difficulty: 'easy',   minutes: 10, diy: true,  tailor: false },
    hem_loose:     { tools: ['needle', 'thread', 'pins', 'iron'],      stitch: 'blind-hem',          difficulty: 'easy',   minutes: 20, diy: true,  tailor: false },
    seam_open:     { tools: ['needle', 'thread'],                      stitch: 'backstitch',         difficulty: 'easy',   minutes: 15, diy: true,  tailor: false },
    zip_broken:    { tools: ['new zip', 'seam-ripper', 'needle'],      stitch: 'replace',            difficulty: 'hard',   minutes: 60, diy: false, tailor: true },
    hole_knit:     { tools: ['darning needle', 'yarn'],                stitch: 'darning',            difficulty: 'medium', minutes: 30, diy: true,  tailor: false },
    stain_oil:     { tools: ['dish soap', 'warm water'],               stitch: 'blot+soap',          difficulty: 'easy',   minutes: 10, diy: true,  tailor: false },
    stain_ink:     { tools: ['rubbing alcohol', 'cotton'],             stitch: 'dab',                difficulty: 'medium', minutes: 15, diy: true,  tailor: false },
    too_tight:     { tools: ['tailor'],                                stitch: 'let-out seam',       difficulty: 'hard',   minutes: 0,  diy: false, tailor: true },
    too_loose:     { tools: ['tailor'],                                stitch: 'take-in seam',       difficulty: 'hard',   minutes: 0,  diy: false, tailor: true },
    fade:          { tools: ['fabric dye'],                            stitch: 'redye',              difficulty: 'medium', minutes: 60, diy: true,  tailor: false }
  };
  // Ordered step-codes per damage; the page localizes + speaks each step (FashionDyn.repair.step).
  var STEP_SEQUENCES = {
    tear_small:    ['turn_inside', 'align_edges', 'thread_needle', 'stitch_back', 'knot_off'],
    tear_large:    ['turn_inside', 'cut_patch', 'pin_patch', 'stitch_around', 'press_iron'],
    button_missing:['position_button', 'thread_needle', 'sew_xcross', 'wrap_shank', 'knot_off'],
    hem_loose:     ['fold_hem', 'pin_hem', 'press_iron', 'blind_stitch', 'knot_off'],
    seam_open:     ['turn_inside', 'align_seam', 'thread_needle', 'stitch_back', 'knot_off'],
    zip_broken:    ['unpick_old', 'pin_newzip', 'tailor_recommend'],
    hole_knit:     ['turn_inside', 'span_hole', 'darn_warp', 'darn_weft', 'knot_off'],
    stain_oil:     ['blot_excess', 'apply_soap', 'rub_gentle', 'rinse_warm', 'air_dry'],
    stain_ink:     ['blot_excess', 'apply_alcohol', 'dab_lift', 'rinse_cool', 'air_dry'],
    too_tight:     ['tailor_recommend'],
    too_loose:     ['tailor_recommend'],
    fade:          ['wash_clean', 'mix_dye', 'soak_even', 'rinse_clear', 'air_dry']
  };
  function diagnoseRepair(code) {
    var r = REPAIR_RULES[code]; if (!r) return null;
    return {
      code: code, tools: r.tools.slice(), steps: (STEP_SEQUENCES[code] || []).slice(),
      stitch: r.stitch, difficulty: r.difficulty, minutes: r.minutes,
      diy: r.diy, tailor: r.tailor, ladderStep: 4
    };
  }
  function repairCodes() { return Object.keys(REPAIR_RULES); }

  // ---------- 2. WEDDING PLANNER (coordinated, wardrobe-first) ----------
  var FUNCTION_BAND = { mehendi: 'festive', sangeet: 'festive', wedding: 'wedding', reception: 'formal' };
  // one step down when the wearer is not the couple (don't outshine)
  var BAND_LADDER = ['casual', 'smart-casual', 'business-casual', 'formal', 'festive', 'wedding'];
  function stepBandDown(band) { var i = BAND_LADDER.indexOf(band); return i > 0 ? BAND_LADDER[i - 1] : band; }
  function isFestiveItem(it) {
    return ETHNIC.test(hayOf(it)) || FESTIVE_COLOUR.test(hayOf(it)) ||
      (it.occasions || []).some(function (o) { return /festive|wedding|sangeet|mehendi|reception/.test(o); });
  }
  // wardrobesByWearer: { wearer_id: [items...] }
  function planWedding(input, wardrobesByWearer) {
    input = input || {}; wardrobesByWearer = wardrobesByWearer || {};
    var members = input.members || [];
    var targetBand = FUNCTION_BAND[input.function] || 'festive';
    if (input.role && input.role !== 'own') targetBand = stepBandDown(targetBand);

    // family palette: tally undertone across everyone's festive pieces
    var warm = 0, cool = 0, famTally = {};
    members.forEach(function (m) {
      (wardrobesByWearer[m.wearer_id] || []).filter(isFestiveItem).forEach(function (it) {
        var a = analyseColour(it.hex, it.colour);
        if (a.undertone === 'warm') warm++; else if (a.undertone === 'cool') cool++;
        if (a.family !== 'neutral') famTally[a.family] = (famTally[a.family] || 0) + 1;
      });
    });
    var undertone = cool > warm ? 'cool' : 'warm'; // festive default warm on ties
    var anchorFamily = undertone; // family in our model IS the undertone for non-neutrals
    var palette = {
      undertone: undertone,
      anchor: undertone === 'warm' ? 'maroon + gold' : 'navy + teal',
      note: undertone === 'warm'
        ? 'warm family theme — maroon, gold, rust, mustard read as one set'
        : 'cool family theme — navy, teal, plum, emerald read as one set'
    };

    // assign one anchor (boldest festive piece), rest accents with varied value
    var scored = members.map(function (m) {
      var items = (wardrobesByWearer[m.wearer_id] || []);
      var rec = recommend(items, {
        occasion: targetBand, season: input.season, age_band: m.ageBand, max: 1,
        liked: m.liked
      });
      var outfit = rec[0] || null;
      var festiveStrength = items.filter(isFestiveItem).reduce(function (a, it) { return a + itemFormality(it); }, 0);
      return { m: m, outfit: outfit, items: items, festiveStrength: festiveStrength };
    });
    var anchorIdx = -1, best = -1;
    scored.forEach(function (s, i) { if (s.outfit && s.festiveStrength > best) { best = s.festiveStrength; anchorIdx = i; } });

    var matched = 0, planned = 0;
    var perMember = scored.map(function (s, i) {
      var role = i === anchorIdx ? 'anchor' : 'accent';
      var gaps = [], shopLinks = [];
      if (!s.outfit) {
        // Founder Rule ladder: borrow within family -> rent -> buy
        var lender = members.find(function (mm) {
          return mm.wearer_id !== s.m.wearer_id &&
            (wardrobesByWearer[mm.wearer_id] || []).some(isFestiveItem);
        });
        gaps.push({
          code: 'no_festive', ladder: lender
            ? ['borrow', 'rent', 'buy'] : ['rent', 'buy'],
          borrowFrom: lender ? lender.wearer_id : null
        });
        shopLinks.push({ tier: 'budget', q: (input.culture || '') + ' festive wear' });
      } else {
        planned++;
        var ut = s.outfit.items.map(function (it) { return analyseColour(it.hex, it.colour); })
          .filter(function (a) { return a.family !== 'neutral'; })
          .some(function (a) { return a.undertone === undertone; });
        if (ut) matched++;
      }
      return {
        wearer_id: s.m.wearer_id, relation: s.m.relation, role: role,
        outfit: s.outfit, gaps: gaps, shopLinks: shopLinks,
        paletteMatch: !!(s.outfit && s.outfit.items.some(function (it) {
          var a = analyseColour(it.hex, it.colour); return a.family !== 'neutral' && a.undertone === undertone;
        }))
      };
    });
    var coordinationScore = planned ? Math.round((matched / planned) * 100) : 0;
    return {
      function: input.function, role: input.role || 'own', targetBand: targetBand,
      familyPalette: palette, perMember: perMember, coordinationScore: coordinationScore
    };
  }

  // ---------- 3. OFFICE WEEK PLANNER (5 days, no repeats) ----------
  var DRESSCODE_BAND = { casual: 'casual', smart: 'business-casual', formal: 'formal' };
  var WEATHER_SEASON = { hot: 'summer', cold: 'winter', mod: 'all' };
  function weatherOK(items, season) {
    if (!season || season === 'all') return true;
    // an item is fine if its fabric suits the season or is all-season; reject clear opposite
    return !(items || []).some(function (it) {
      var fs = fabricSeason(it); return fs !== 'all' && fs !== season;
    });
  }
  function countUsed(items, usedSet) {
    return (items || []).reduce(function (n, it) { return n + (usedSet[it.id] ? 1 : 0); }, 0);
  }
  function planWeek(items, days) {
    days = days || [];
    var officeItems = (items || []);
    var used = {}, distinct = {}, totalUses = 0, reuseCount = 0;
    var out = days.map(function (d) {
      var target = DRESSCODE_BAND[d.dressCode] || 'business-casual';
      var season = WEATHER_SEASON[d.weather] || 'all';
      var pool = buildOutfits(officeItems, { occasion: target, max: 30 }).outfits;
      var fit = pool.filter(function (o) { return weatherOK(o.items, season); });
      var search = fit.length ? fit : pool; // weather is a preference, not a hard block
      var ranked = search.map(function (o) {
        return { o: o, adj: o.score - 25 * countUsed(o.items, used) };
      }).sort(function (a, b) { return b.adj - a.adj; });
      var pick = ranked[0] ? ranked[0].o : null;
      var reused = false, note = '';
      if (pick && countUsed(pick.items, used) > 0) {
        reused = true; reuseCount++;
        note = 'small wardrobe — same pieces, fresh pairing';
      }
      if (pick) pick.items.forEach(function (it) { used[it.id] = 1; distinct[it.id] = 1; totalUses++; });
      return { day: d.day, dressCode: d.dressCode, weather: d.weather, outfit: pick, reused: reused, note: note };
    });
    var distinctCount = Object.keys(distinct).length;
    // variety = distinct items / total item-wears across the week. 100% = nothing repeats.
    var variety = totalUses ? Math.round((distinctCount / totalUses) * 100) : 0;
    var honest = '';
    if (reuseCount > 0) honest = 'Add 1-2 bottoms to unlock a no-repeat week';
    return { days: out, variety: variety, reuseCount: reuseCount, honest: honest };
  }

  // ---------- 4. SENIOR / KIDS MODE (adaptive dressing — garment terms only, never body) ----------
  // Deterministic guidance codes; the page localizes via FashionDyn.mode. Maps to the
  // four-user accessibility contract + judge age/accessibility axes.
  var MODE_TIPS = {
    senior: ['easy_fasten', 'non_slip', 'layer_warmth', 'light_fabric', 'wide_neck'],
    child:  ['comfort_move', 'safe_fasten', 'room_grow', 'wash_easy', 'weather_ready'],
    teen:   ['express_self', 'school_ok', 'comfort_move'],
    adult:  []
  };
  // profile flags (limited_mobility / low_vision) add a tip regardless of age band
  function modeGuidance(band, profile) {
    profile = profile || {};
    var tips = (MODE_TIPS[band] || []).slice();
    if (profile.limited_mobility && tips.indexOf('easy_fasten') < 0) tips.unshift('easy_fasten');
    if (profile.low_vision && tips.indexOf('high_contrast') < 0) tips.push('high_contrast');
    return { band: band || 'adult', tips: tips };
  }

  return {
    colourFamily: colourFamily, itemFormality: itemFormality,
    classifyOccasion: classifyOccasion, colorHarmony: colorHarmony, seasonalSuitability: seasonalSuitability,
    confidence: confidence, judge: judge, explain: explain,
    buildOutfits: buildOutfits, wardrobeROI: wardrobeROI, recommend: recommend,
    // craft upgrades (gaps P0#2/#3/#4): real colour science, palette, fabric/pattern, fit
    hexToHSL: hexToHSL, analyseColour: analyseColour, paletteFor: paletteFor, deriveSeason: deriveSeason,
    fabricSeason: fabricSeason, patternOf: patternOf, patternRule: patternRule, fitNote: fitNote,
    // CFOS v2.1 deterministic features
    REPAIR_RULES: REPAIR_RULES, diagnoseRepair: diagnoseRepair, repairCodes: repairCodes,
    planWedding: planWedding, planWeek: planWeek, modeGuidance: modeGuidance, MODE_TIPS: MODE_TIPS,
    FUNCTION_BAND: FUNCTION_BAND, DRESSCODE_BAND: DRESSCODE_BAND, WEATHER_SEASON: WEATHER_SEASON,
    version: 'fashion-engine-2.1',
  };
});
