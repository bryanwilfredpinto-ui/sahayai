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
  var CACHE_PREFIX = 'chitti_xlate_v2_20260529i';
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
    // Brand / tech keywords that should stay in English everywhere
    var brands = /^(Chitti|Vaani|MedUPI|YouTube|WhatsApp|UPI|SMS|GST|RBI|SEBI|NPPA|FSSAI|RERA|DPDP|BNS|BNSS|BSA|GitHub|Railway|Turso|DeepSeek|Gemini|Claude|Bhashini|ISL|API|HTML|CSS|JS|JSON|PDF|QR|NSE|BSE|LIVE|HD|AI|HD|FII|DII)$/;
    if (brands.test(t)) return true;
    // Technical analysis indicator names (Chitti Technical · Sire's call: indicator
    // names stay English across all 26 languages — translation applies to descriptions/calls only)
    var indicators = /^(RSI|MACD|EMA|SMA|WMA|DEMA|TEMA|HMA|KAMA|TRIX|ATR|ADX|DMI|DI\+|DI-|CCI|ROC|Stoch|StochRSI|MFI|OBV|VWAP|VWMA|Bollinger|BB|Donchian|Keltner|Ichimoku|PSAR|SAR|Supertrend|Williams|Aroon|MOM|Heikin[ -]?Ashi|Pivot|Fibonacci|Fib|Camarilla|Woodie|Roshan|Story Mode|Buffett|Munger|Graham|Kedia|RKD|Nifty|Sensex|F&O)$/i;
    if (indicators.test(t)) return true;
    // Stock ticker pattern — 3-12 uppercase letters / digits
    if (/^[A-Z][A-Z0-9&-]{2,11}$/.test(t)) return true;
    // BUY / SELL / HOLD English commands (handled separately as full UI labels)
    if (/^(BUY|SELL|HOLD|LONG|SHORT|EXIT|ENTRY|SL|TP|TARGET|STOPLOSS)$/i.test(t)) return true;
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

  // Collect every visible text node that LOOKS like English in a non-English
  // session. Aggressive — doesn't rely on chitti_lang.js's _chittiOrig (some
  // pages like MedUPI have their own i18n that overwrites text via innerHTML,
  // so the original snapshot is lost). Returns a map of trimmed text → array
  // of text nodes that hold it (for direct nodeValue replacement later).
  function collectMisses(lang) {
    var found = {};   // text → true (for batching to backend)
    var nodes = {};   // text → [textNode, textNode, ...]  (for direct override)
    if (lang === 'en' || !document.body) return { strings: found, byText: nodes };
    var SKIP = {SCRIPT:1, STYLE:1, CODE:1, PRE:1, TEXTAREA:1, NOSCRIPT:1, INPUT:1};
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || SKIP[p.tagName]) return NodeFilter.FILTER_REJECT;
        var raw = n.nodeValue || '';
        var trimmed = raw.replace(/\s+/g, ' ').trim();
        if (shouldSkip(trimmed)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = w.nextNode())) {
      var trim = (node.nodeValue || '').replace(/\s+/g, ' ').trim();
      found[trim] = true;
      (nodes[trim] = nodes[trim] || []).push(node);
    }
    // Also harvest placeholder / aria-label / title attributes
    ['placeholder', 'aria-label', 'title', 'alt'].forEach(function (a) {
      document.querySelectorAll('[' + a + ']').forEach(function (el) {
        var current = (el.getAttribute(a) || '').replace(/\s+/g, ' ').trim();
        if (shouldSkip(current)) return;
        found[current] = true;
      });
    });
    return { strings: found, byText: nodes };
  }

  // Direct text-node override: set nodeValue without going through
  // Chitti.lang.extend (avoids fight with page-local i18n systems that
  // replace innerHTML and would otherwise overwrite our translation).
  function applyDirect(byText, pairs) {
    Object.keys(pairs).forEach(function (k) {
      var translated = pairs[k];
      if (!translated || translated === k) return;
      var list = byText[k] || [];
      list.forEach(function (n) {
        try {
          var raw = n.nodeValue || '';
          var prefix = (raw.match(/^\s*/) || [''])[0];
          var suffix = (raw.match(/\s*$/) || [''])[0];
          n.nodeValue = prefix + translated + suffix;
          n._chittiOrig = raw;   // mark so chitti_lang.js doesn't re-translate
        } catch (e) {}
      });
    });
    // Also patch attributes (placeholder / aria-label / title / alt)
    ['placeholder', 'aria-label', 'title', 'alt'].forEach(function (a) {
      document.querySelectorAll('[' + a + ']').forEach(function (el) {
        var current = (el.getAttribute(a) || '').replace(/\s+/g, ' ').trim();
        if (pairs[current]) {
          try { el.setAttribute(a, pairs[current]); } catch (e) {}
        }
      });
    });
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

  function processBatch(strings, lang, byText, done) {
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
        // Apply this batch's translations TWO ways:
        //  1. Direct nodeValue override (wins over page-local i18n)
        //  2. Chitti.lang.extend() so chitti_lang.js's own re-renders use it
        applyDirect(byText, pairs);
        applyExtensions(lang, pairs);
        setTimeout(next, BATCH_DELAY_MS);
      });
    }
    next();
  }

  function runFor(lang) {
    if (lang === 'en' || !lang) return;
    lastLang = lang;
    var miss = collectMisses(lang);
    var keys = Object.keys(miss.strings);
    if (keys.length === 0) return;
    // Apply cached translations immediately (zero-latency for return visits)
    var cachedPairs = {};
    var remainingKeys = [];
    keys.forEach(function (k) {
      var c = getCached(k, lang);
      if (c) cachedPairs[k] = c;
      else remainingKeys.push(k);
    });
    applyDirect(miss.byText, cachedPairs);
    applyExtensions(lang, cachedPairs);
    if (remainingKeys.length > 0) {
      processBatch(remainingKeys, lang, miss.byText, function () { /* done */ });
    }
  }

  // Listen on BOTH document AND window because pages have different
  // dispatch conventions:
  //  - chitti_lang.js  → document.dispatchEvent
  //  - chitti_medupi   → window.dispatchEvent
  // Also debounce so multiple i18n systems can finish their pass first.
  var debounceTimer = null;
  function onLangChange(e) {
    var lang = (e && e.detail && e.detail.lang) ||
               (window.Chitti && window.Chitti.lang && window.Chitti.lang.current && window.Chitti.lang.current()) ||
               'en';
    if (debounceTimer) clearTimeout(debounceTimer);
    // 300ms delay so page-local i18n (MedUPI's setChittiLang, etc.) finishes
    // resetting text to English-fallback BEFORE we override with backend xlate
    debounceTimer = setTimeout(function () { runFor(lang); }, 300);
  }
  document.addEventListener('chitti:langchange', onLangChange);
  window.addEventListener('chitti:langchange', onLangChange);

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
