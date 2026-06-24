/*!
 * chitti_isl_grammar.js — Chitti ISL BO1
 * Deterministic English → Indian Sign Language gloss (SOV) converter.
 *
 * ISL is NOT English-on-the-hands. Its grammar is largely Subject–Object–Verb,
 * topicalises TIME first, places WH-questions and NEGATION at the end, and drops
 * articles + the copula. This engine reorders an English sentence into an ISL
 * GLOSS sequence so the fingerspell/sign panel signs in the right order.
 *
 * HONESTY CONTRACT (locked, ceos_isl.md): this is a RULE-BASED APPROXIMATION,
 * NOT certified ISL. It never claims accuracy. A certified ISL interpreter is the
 * authority. The note rides on every output.
 *
 * Works in browser (window.ChittiISLGrammar + window.Chitti.isl.gloss) and Node.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  if (root) {
    root.ChittiISLGrammar = mod;
    try { root.Chitti = root.Chitti || {}; root.Chitti.isl = root.Chitti.isl || {}; if (!root.Chitti.isl.gloss) root.Chitti.isl.gloss = mod.gloss; } catch (e) {}
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  var NOTE = 'Rule-based ISL gloss (SOV) — an approximation, not certified ISL. A certified interpreter is the authority.';

  // Time words → topicalised to the FRONT in ISL.
  var TIME = ['yesterday', 'today', 'tomorrow', 'now', 'tonight', 'morning', 'afternoon', 'evening', 'night', 'daily', 'always', 'sometimes', 'later', 'soon', 'before', 'after', 'everyday'];
  // WH words → moved to the END in ISL.
  var WH = ['what', 'where', 'when', 'who', 'whom', 'why', 'how', 'which', 'whose'];
  // Function words ISL omits.
  var DROP = ['a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'of', 'do', 'does', 'did', 'to'];
  // Negation markers → single NOT moved to the END.
  var NEG = ['not', 'no', 'never', 'cannot'];
  // Pronoun → ISL gloss.
  var PRON = { i: 'ME', me: 'ME', my: 'MY', mine: 'MY', you: 'YOU', your: 'YOUR', yours: 'YOUR', he: 'HE', him: 'HE', his: 'HE', she: 'SHE', her: 'HER', we: 'WE', us: 'WE', our: 'OUR', they: 'THEY', them: 'THEY', their: 'THEIR', it: 'IT' };
  // Common verbs (base forms). Used to find the verb so we can move it last.
  var VERBS = ['go', 'come', 'eat', 'drink', 'want', 'need', 'like', 'love', 'see', 'look', 'give', 'take', 'make', 'help', 'learn', 'teach', 'read', 'write', 'work', 'play', 'sleep', 'buy', 'sell', 'know', 'understand', 'feel', 'think', 'say', 'tell', 'ask', 'call', 'meet', 'live', 'study', 'finish', 'start', 'stop', 'open', 'close', 'sit', 'stand', 'walk', 'run', 'drive', 'cook', 'clean', 'wash', 'watch', 'wait', 'bring', 'send', 'pay', 'sign', 'speak', 'hear', 'remember', 'forget', 'win', 'lose', 'fall', 'sick', 'hungry', 'happy', 'sad'];

  function expand(s) {
    return String(s || '').toLowerCase()
      .replace(/won['’]t/g, 'will not').replace(/can['’]t/g, 'can not').replace(/n['’]t/g, ' not')
      .replace(/i['’]m/g, 'i am').replace(/it['’]s/g, 'it is').replace(/['’]re/g, ' are').replace(/['’]ll/g, ' will').replace(/['’]ve/g, ' have')
      .replace(/[.,!?;:]/g, ' ');
  }

  function lemmatizeVerb(w) {
    if (w.length > 4 && /ing$/.test(w)) { var base = w.slice(0, -3); return VERBS.indexOf(base) !== -1 ? base : (VERBS.indexOf(base + 'e') !== -1 ? base + 'e' : base); }
    if (w.length > 3 && /ed$/.test(w)) { var b2 = w.slice(0, -2); return VERBS.indexOf(b2) !== -1 ? b2 : (VERBS.indexOf(b2 + 'e') !== -1 ? b2 + 'e' : b2); }
    if (w.length > 3 && /es$/.test(w) && VERBS.indexOf(w.slice(0, -2)) !== -1) return w.slice(0, -2);
    if (w.length > 2 && /s$/.test(w) && VERBS.indexOf(w.slice(0, -1)) !== -1) return w.slice(0, -1);
    return w;
  }
  function isVerb(w) { return VERBS.indexOf(lemmatizeVerb(w)) !== -1; }

  function toGloss(w) {
    if (PRON[w]) return PRON[w];
    if (isVerb(w)) return lemmatizeVerb(w).toUpperCase();
    return w.toUpperCase();
  }

  /**
   * gloss(text) → { input, gloss:[...], glossString, order:'SOV', note }
   * Deterministic, never throws.
   */
  function gloss(text) {
    var raw = expand(text).split(/\s+/).filter(Boolean);
    var time = [], wh = [], core = [], neg = false;
    for (var i = 0; i < raw.length; i++) {
      var w = raw[i];
      if (NEG.indexOf(w) !== -1) { neg = true; if (w === 'cannot') core.push('can'); continue; }
      if (TIME.indexOf(w) !== -1) { time.push(w); continue; }
      if (WH.indexOf(w) !== -1) { wh.push(w); continue; }
      if (DROP.indexOf(w) !== -1) continue;
      core.push(w);
    }

    // Reorder core to SOV: find first verb → [before=subject+object stay] move verb to end.
    var verbIdx = -1;
    for (var j = 0; j < core.length; j++) { if (isVerb(core[j])) { verbIdx = j; break; } }
    var ordered;
    if (verbIdx !== -1) {
      var verb = core[verbIdx];
      var rest = core.slice(0, verbIdx).concat(core.slice(verbIdx + 1)); // subject + object, order kept
      ordered = rest.concat([verb]);                                     // SOV: subject, object, VERB
    } else {
      ordered = core.slice();
    }

    var out = time.concat(ordered).map(toGloss);
    if (neg) out.push('NOT');
    if (wh.length) out = out.concat(wh.map(function (x) { return x.toUpperCase(); }));

    return {
      input: String(text || ''),
      gloss: out,
      glossString: out.join(' '),
      order: 'SOV',
      note: NOTE
    };
  }

  return { gloss: gloss, NOTE: NOTE, VERBS: VERBS, VERSION: '1.0.0' };
});
