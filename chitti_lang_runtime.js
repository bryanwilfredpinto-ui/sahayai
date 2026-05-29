/* chitti_lang_runtime.js — runtime LLM translation fallback for chitti_lang.js
 * ===================================================================
 * Sire 2026-05-29 — every UI string on every Chitti page translates to the
 * user's selected language. If a string isn't in chitti_lang.js's baked
 * 3,681-key T-table, this substrate sends it to the backend translate
 * endpoint (Gemini 2.5 Flash-Lite via DeepSeek-compat client), caches the
 * result in localStorage, and merges it into the T-table via
 * Chitti.lang.extend() — which re-runs translateAll on the current lang.
 *
 * Result: a Bengali user sees every label on every page in Bengali,
 * including page-specific strings the baked table doesn't cover.
 *
 * Auto-loaded by chitti_a11y.js. Listens for chitti:langchange event.
 * Skips intentionally-untranslatable strings (URLs, code, brand names).
 * Throttled to avoid runaway LLM calls.
 * ===================================================================
 */
(function () {
  if (window.__chittiLangRuntimeLoaded) return;
  window.__chittiLangRuntimeLoaded = true;

  var ENDPOINT = (window.CHITTI_TRANSLATE_API ||
                  'https://chitti-medupi-api-production.up.railway.app/api/health-file/translate');
  var CACHE_PREFIX = 'chitti_xlate_v1';
  var SESSION_CAP = 200;         // hard cap per session to prevent runaway LLM calls
  var BATCH_SIZE = 8;            // strings per fetch round
  var BATCH_DELAY_MS = 250;      // wait between batches
  var MIN_LEN = 3, MAX_LEN = 400;
  var sessionCalls = 0;
  var inFlight = {};             // text → Promise
  var lastLang = 'en';

  // user_token required by /api/health-file/translate — mint a per-device UUID
  var USER_TOKEN = (function () {
    var k = 'chitti_user_token';
    try {
      var t = localStorage.getItem(k);
      if (t && t.length >= 8) return t;
    } catch (e) {}
    var tok = 'lr_' + Math.random().toString(36).slice(2, 10) +
              Date.now().toString(36);
    try { localStorage.setItem(k, tok); } catch (e) {}
    return tok;
  })();

  function cacheKey(text, lang) { return CACHE_PREFIX + ':' + lang + ':' + text; }

  function getCached(text, lang) {
    try { return localStorage.getItem(cacheKey(text, lang)); }
    catch (e) { return null; }
  }

  function setCached(text, lang, translated) {
    try { localStorage.setItem(cacheKey(text, lang), translated); } catch (e) {}
  }

  // Strings the runtime SHOULD NOT try to translate
  function shouldSkip(text) {
    if (!text) return true;
    var t = text.replace(/\s+/g, ' ').trim();
    if (t.length < MIN_LEN || t.length > MAX_LEN) return true;
    // Pure numbers / code / URLs / emoji-only
    if (/^[0-9\s\.\,\:\;\-\+\(\)\[\]\{\}\/\\\$%]+$/.test(t)) return true;
    if (/^https?:\/\//.test(t)) return true;
    if (/^[A-Z_]{2,}$/.test(t)) return true; // CONSTANT_LIKE
    if (/@/.test(t) && /\./.test(t)) return true; // email-ish
    // Brand / tech keywords that should stay
    var brands = /^(Chitti|Vaani|MedUPI|YouTube|WhatsApp|UPI|SMS|GST|RBI|SEBI|NPPA|FSSAI|RERA|DPDP|BNS|BNSS|BSA|GitHub|Railway|Turso|DeepSeek|Gemini|Claude|Bhashini|ISL|API|HTML|CSS|JS|JSON)$/;
    if (brands.test(t)) return true;
    // Contains mostly non-Latin (already in some Indian lang, or symbol-only)
    var latinChars = (t.match(/[A-Za-z]/g) || []).length;
    if (latinChars < 2) return true;
    return false;
  }

  function callBackend(text, lang) {
    if (inFlight[text + '|' + lang]) return inFlight[text + '|' + lang];
    if (sessionCalls >= SESSION_CAP) return Promise.resolve(null);
    sessionCalls++;
    var p = fetch(ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        user_token: USER_TOKEN,
        text: text,
        source_lang: 'en',
        target_lang: lang
      })
    }).then(function (r) {
      if (!r.ok) return null;
      return r.json();
    }).then(function (j) {
      if (!j || !j.ok || !j.translated) return null;
      var out = j.translated.toString().trim();
      if (!out || out === text) return null;
      setCached(text, lang, out);
      return out;
    }).catch(function () { return null; })
      .then(function (v) { delete inFlight[text + '|' + lang]; return v; });
    inFlight[text + '|' + lang] = p;
    return p;
  }

  // Collect every untranslated visible text node on the current page.
  // A node is "untranslated" if its current nodeValue equals its _chittiOrig
  // (meaning chitti_lang.js fell back to English on lookup miss).
  function collectMisses(lang) {
    var found = {};
    if (lang === 'en' || !document.body) return found;
    var SKIP = {SCRIPT:1, STYLE:1, CODE:1, PRE:1, TEXTAREA:1, NOSCRIPT:1, INPUT:1};
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || SKIP[p.tagName]) return NodeFilter.FILTER_REJECT;
        var orig = n._chittiOrig;
        if (orig === undefined) return NodeFilter.FILTER_REJECT;
        // If lookup found a translation, nodeValue !== orig. We want misses only.
        if (n.nodeValue !== orig) return NodeFilter.FILTER_REJECT;
        var trimmed = (orig || '').replace(/\s+/g, ' ').trim();
        if (shouldSkip(trimmed)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = w.nextNode())) {
      var trim = node._chittiOrig.replace(/\s+/g, ' ').trim();
      found[trim] = true;
    }
    // Also harvest placeholder / aria-label / title (chitti_lang.js handles them
    // when the original was in T-table; we only want misses).
    ['placeholder', 'aria-label', 'title', 'alt'].forEach(function (a) {
      document.querySelectorAll('[' + a + ']').forEach(function (el) {
        var orig = el.dataset['chitti' + a.replace(/-/g, '').replace(/^./, function (c) { return c.toUpperCase(); }) + 'Orig'] || '';
        if (!orig) return;
        var current = el.getAttribute(a) || '';
        if (current !== orig) return; // already translated
        var trim = orig.replace(/\s+/g, ' ').trim();
        if (shouldSkip(trim)) return;
        found[trim] = true;
      });
    });
    return found;
  }

  function applyExtensions(lang, pairs) {
    if (!window.Chitti || !window.Chitti.lang || !window.Chitti.lang.extend) return;
    var entries = {};
    Object.keys(pairs).forEach(function (k) {
      var v = pairs[k];
      if (!v) return;
      var existing = window.Chitti.lang.lookupText && window.Chitti.lang.lookupText(k, 'en');
      entries[k] = {en: existing || k};
      entries[k][lang] = v;
    });
    if (Object.keys(entries).length === 0) return;
    try { window.Chitti.lang.extend(entries); } catch (e) {}
  }

  function processBatch(strings, lang, done) {
    var pending = strings.slice();
    var pairs = {};
    function next() {
      if (pending.length === 0) return done(pairs);
      var slice = pending.splice(0, BATCH_SIZE);
      Promise.all(slice.map(function (s) {
        var c = getCached(s, lang);
        if (c) { pairs[s] = c; return Promise.resolve(); }
        return callBackend(s, lang).then(function (out) {
          if (out) pairs[s] = out;
        });
      })).then(function () {
        // Apply this batch's translations immediately so user sees progressive update
        applyExtensions(lang, pairs);
        setTimeout(next, BATCH_DELAY_MS);
      });
    }
    next();
  }

  function runFor(lang) {
    if (lang === 'en' || !lang) return;
    if (lang === lastLang) {
      // re-scan after DOM changes — only pick up NEW misses
    }
    lastLang = lang;
    var misses = collectMisses(lang);
    var keys = Object.keys(misses);
    if (keys.length === 0) return;
    // Apply cached translations immediately (zero-latency for return visits)
    var cachedPairs = {};
    var remainingKeys = [];
    keys.forEach(function (k) {
      var c = getCached(k, lang);
      if (c) cachedPairs[k] = c;
      else remainingKeys.push(k);
    });
    applyExtensions(lang, cachedPairs);
    if (remainingKeys.length > 0) {
      processBatch(remainingKeys, lang, function () { /* done */ });
    }
  }

  document.addEventListener('chitti:langchange', function (e) {
    var lang = (e && e.detail && e.detail.lang) ||
               (window.Chitti && window.Chitti.lang && window.Chitti.lang.current && window.Chitti.lang.current()) ||
               'en';
    // Defer to next frame so chitti_lang.js's own translateAll has finished
    requestAnimationFrame(function () { runFor(lang); });
  });

  // Also kick on initial load if a non-English language is already active
  function initialKick() {
    if (!window.Chitti || !window.Chitti.lang || !window.Chitti.lang.current) {
      return setTimeout(initialKick, 100);
    }
    var lang = window.Chitti.lang.current();
    if (lang && lang !== 'en') {
      requestAnimationFrame(function () { runFor(lang); });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialKick);
  } else {
    initialKick();
  }

  // Expose for debug / forced flush
  window.Chitti = window.Chitti || {};
  window.Chitti.langRuntime = {
    run: runFor,
    cacheKey: cacheKey,
    sessionCalls: function () { return sessionCalls; },
    endpoint: ENDPOINT
  };
})();
