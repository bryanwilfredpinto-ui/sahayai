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

  // ---------- category formality (0 casual .. 5 grand) ----------
  // keyword -> formality. Higher = dressier.
  var FORMALITY = [
    [/sherwani|lehenga|gown|tuxedo|tux/i, 5],
    [/saree|sari|\bsuit\b|blazer|silk/i, 4],
    [/anarkali|formal shirt|dress shirt|oxford|\btrouser/i, 3],
    [/kurta|kurti|churidar|salwar|palazzo|skirt|jutti|sandal|heel|watch|sweater|jacket|loafer|chino|dupatta/i, 2],
    [/jeans|tee|t-shirt|tshirt|hoodie|sneaker|shorts|chappal|slipper|flip|track|gym|hood/i, 0],
  ];
  function hayOf(it) { return ((it.category || '') + ' ' + (it.colour || '') + ' ' + (it.desc || it.name || '')).toLowerCase(); }
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
    return { confidence: pct, reasons: reasons };
  }

  // ---------- Layer 2: AI Judge (deterministic re-review) ----------
  function judge(items, ctx) {
    ctx = ctx || {}; var flags = []; var hay = (items || []).map(function (it) { return (it.colour + ' ' + it.category).toLowerCase(); }).join(' ');
    var occ = (ctx.occasion || classifyOccasion(items).occasion);
    // cultural
    if (occ === 'funeral' && /(red|लाल|bright|maroon|मरून|gold)/.test(hay)) flags.push({ axis: 'cultural', msg: 'bright/red reads festive — funerals call for white/muted', sev: 'major' });
    if (occ === 'wedding' && /\bwhite\b|सफ़ेद|सफेद/.test(hay) && (ctx.culture === 'hindu' || !ctx.culture)) flags.push({ axis: 'cultural', msg: 'all-white at a wedding can read as mourning in many Indian communities — confirm', sev: 'minor' });
    // weather
    var seas = seasonalSuitability(items, ctx.season);
    if (seas.score < 1) flags.push({ axis: 'weather', msg: seas.why, sev: 'minor' });
    // age
    if (ctx.age_band === 'senior' && /(heel|stiff|tight)/.test(hay)) flags.push({ axis: 'age', msg: 'prefer non-slip, easy-fasten footwear for comfort + safety', sev: 'minor' });
    if (ctx.age_band === 'child' && /(heel|sharp|choking)/.test(hay)) flags.push({ axis: 'age', msg: 'keep it comfortable + safe for a child', sev: 'major' });
    // accessibility
    if (ctx.profile && (ctx.profile.limited_mobility || ctx.profile.elderly) && /(button-heavy|zip-back|tight)/.test(hay)) flags.push({ axis: 'accessibility', msg: 'favour magnetic/velcro/front-open for independent dressing', sev: 'minor' });
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
    (items || []).forEach(function (it) { if (byCat[it.category]) byCat[it.category].push(it); });
    var combos = [];
    function rank(set) {
      var h = colorHarmony(set), o = classifyOccasion(set);
      var occFit = targetOcc ? (o.occasion === targetOcc ? 1 : (set.some(function (s) { return (s.occasions || []).indexOf(targetOcc) >= 0; }) ? 0.7 : 0.3)) : 0.8;
      return { items: set, score: Math.round((h.score * 0.5 + occFit * 0.5) * 100), harmony: h.type, occasion: o.occasion, occFit: occFit };
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
      return { items: o.items, occasion: o.occasion, confidence: conf.confidence, reasons: conf.reasons, judge: j, explain: explain(o.items, ctx), harmony: h.type };
    });
  }

  return {
    colourFamily: colourFamily, itemFormality: itemFormality,
    classifyOccasion: classifyOccasion, colorHarmony: colorHarmony, seasonalSuitability: seasonalSuitability,
    confidence: confidence, judge: judge, explain: explain,
    buildOutfits: buildOutfits, wardrobeROI: wardrobeROI, recommend: recommend,
    version: 'fashion-engine-1.0',
  };
});
