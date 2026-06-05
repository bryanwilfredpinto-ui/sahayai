
(function () {
  'use strict';
  if (window.__chittiLangLoaded) return;
  window.__chittiLangLoaded = true;

  // ───────────────────────────────────────────────────────────────────────
  // Chitti language substrate — LAZY-LOADED (KI-01, 2026-06-05).
  // The 16 MB baked dictionary was split into per-language packs (lang/<code>.js,
  // tools/split_lang.mjs). This runtime loads ONLY the active language's pack
  // (~150–250 KB) on demand; English needs none. After the first translate it
  // background-preloads the rest so dropdown switching stays instant. The public
  // API (set/current/list/theme/lookupText/extend) and every behaviour
  // (snapshot, translate, attrs, RTL, MutationObserver, chitti:langchange) are
  // unchanged. Falls back to English (honest) if a pack fails to load.
  // ───────────────────────────────────────────────────────────────────────

  // Brand theme — Bryan's locked palette
  var THEME = { saffron: '#E86A17', navy: '#0E2344', gold: '#D4AF37' };
  var RTL_LANGS = { ur: 1, ks: 1, sd: 1 };

  // ── LANGS — 26 entries (en + 25 targets) ─────────────────────────────
  var LANGS = [
    { code: "en", label: "English", native: "English" },
    { code: "hi", label: "Hindi", native: "हिन्दी" },
    { code: "bn", label: "Bangla", native: "বাংলা" },
    { code: "te", label: "Telugu", native: "తెలుగు" },
    { code: "ta", label: "Tamil", native: "தமிழ்" },
    { code: "mr", label: "Marathi", native: "मराठी" },
    { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
    { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
    { code: "ml", label: "Malayalam", native: "മലയാളം" },
    { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
    { code: "or", label: "Odia", native: "ଓଡ଼ିଆ" },
    { code: "as", label: "Assamese", native: "অসমীয়া" },
    { code: "ur", label: "Urdu", native: "اردو" },
    { code: "sa", label: "Sanskrit", native: "संस्कृतम्" },
    { code: "mai", label: "Maithili", native: "मैथिली" },
    { code: "kok", label: "Konkani", native: "कोंकणी" },
    { code: "doi", label: "Dogri", native: "डोगरी" },
    { code: "ks", label: "Kashmiri", native: "کٲشُر" },
    { code: "ne", label: "Nepali", native: "नेपाली" },
    { code: "sd", label: "Sindhi", native: "سنڌي" },
    { code: "mni", label: "Manipuri", native: "মৈতৈলোন্" },
    { code: "sat", label: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ" },
    { code: "bho", label: "Bhojpuri", native: "भोजपुरी" },
    { code: "raj", label: "Rajasthani", native: "राजस्थानी" },
    { code: "kru", label: "Kurukh", native: "कुड़ुख़" },
    { code: "hoc", label: "Ho", native: "हो" }
  ];

  // ── Per-language data, lazy-loaded. LANGDATA[lang] = { "English": "translation" } ──
  var LANGDATA = {};
  var _loaded = { en: true };     // langs whose pack has finished loading (en = no pack)
  var _loadingCbs = {};           // lang -> [callbacks] while its pack is in flight

  // Resolve the directory this script was served from, so lang packs load from
  // the same place with the same ?v= cache-busting query.
  var BASE = '', VERQ = '';
  (function () {
    try {
      var cs = document.currentScript;
      if (!cs) { var ss = document.querySelectorAll('script[src*="chitti_lang.js"]'); cs = ss[ss.length - 1]; }
      if (cs && cs.src) {
        var m = cs.src.match(/^(.*\/)chitti_lang\.js(\?[^#]*)?/);
        if (m) { BASE = m[1]; VERQ = m[2] || ''; }
      }
    } catch (e) {}
  })();

  // Lang packs call this (window.__chittiLangRegister) to hand us their map.
  function register(lang, map) {
    if (!lang || !map) return;
    LANGDATA[lang] = LANGDATA[lang] || {};
    for (var k in map) { if (Object.prototype.hasOwnProperty.call(map, k)) LANGDATA[lang][k] = map[k]; }
  }
  window.__chittiLangRegister = register;
  // Drain anything that registered before this runtime was ready (defensive).
  try {
    var pend = window.__chittiLangPending;
    if (pend && pend.length) { pend.forEach(function (p) { register(p[0], p[1]); _loaded[p[0]] = true; }); window.__chittiLangPending = []; }
  } catch (e) {}

  // Ensure a language pack is available, then call cb(). 'en' + already-loaded
  // resolve synchronously (so switching to a loaded lang has NO async flash).
  function ensureLang(lang, cb) {
    if (lang === 'en' || _loaded[lang]) { if (cb) cb(); return; }
    if (_loadingCbs[lang]) { if (cb) _loadingCbs[lang].push(cb); return; }
    _loadingCbs[lang] = cb ? [cb] : [];
    var s = document.createElement('script');
    s.src = BASE + 'lang/' + lang + '.js' + VERQ;
    s.async = true;
    function done() {
      _loaded[lang] = true;
      var cbs = _loadingCbs[lang] || []; delete _loadingCbs[lang];
      cbs.forEach(function (f) { try { f(); } catch (e) {} });
    }
    s.onload = done;
    s.onerror = function () { /* honest fallback: untranslated strings stay English */ done(); };
    (document.head || document.documentElement).appendChild(s);
  }

  var LANG_KEY = 'chitti_lang';
  var currentLang = (function () {
    try { return localStorage.getItem(LANG_KEY) || 'en'; } catch (e) { return 'en'; }
  })();

  var SKIP_TAG_SET = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, TEXTAREA: 1, NOSCRIPT: 1, INPUT: 1 };

  function lookup(text, lang) {
    if (!text) return text;
    var trim = text.replace(/\s+/g, ' ').trim();
    if (!trim) return text;
    var map = LANGDATA[lang];
    if (!map) return null;
    var v = map[trim];
    if (!v || v === trim) return null;
    return text.replace(trim, v);
  }

  // Snapshot original English on every translatable node (once).
  function snapshotAll() {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAG_SET[p.tagName]) return NodeFilter.FILTER_REJECT;
        var t = (n.nodeValue || '').replace(/\s+/g, ' ').trim();
        if (!t) return NodeFilter.FILTER_REJECT;
        if (p.closest && (p.closest('[translate="no"]') || p.closest('[data-chitti-no-translate]'))) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = w.nextNode())) {
      if (node._chittiOrig === undefined) node._chittiOrig = node.nodeValue;
    }
    document.querySelectorAll('[placeholder]').forEach(function (el) {
      if (!el.dataset.chittiPhOrig) el.dataset.chittiPhOrig = el.getAttribute('placeholder') || '';
    });
    document.querySelectorAll('[aria-label]').forEach(function (el) {
      if (!el.dataset.chittiAriaOrig) el.dataset.chittiAriaOrig = el.getAttribute('aria-label') || '';
    });
    document.querySelectorAll('[title]').forEach(function (el) {
      if (!el.dataset.chittiTitleOrig) el.dataset.chittiTitleOrig = el.getAttribute('title') || '';
    });
    document.querySelectorAll('[alt]').forEach(function (el) {
      if (!el.dataset.chittiAltOrig) el.dataset.chittiAltOrig = el.getAttribute('alt') || '';
    });
  }

  var _applying = false;

  // Public entry — sets the language immediately, loads its pack if needed, then applies.
  function translateAll(lang) {
    currentLang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    ensureLang(lang, function () {
      // Only apply if this is still the language the user wants (avoids a stale
      // late-arriving pack overwriting a newer switch).
      if (currentLang === lang) _applyTranslate(lang);
    });
  }

  function _applyTranslate(lang) {
    _applying = true;
    try {
      snapshotAll();
      document.documentElement.lang = lang;
      document.documentElement.dir = RTL_LANGS[lang] ? 'rtl' : 'ltr';

      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          var p = n.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (SKIP_TAG_SET[p.tagName]) return NodeFilter.FILTER_REJECT;
          if (n._chittiOrig === undefined) return NodeFilter.FILTER_REJECT;
          if (p.closest && (p.closest('[translate="no"]') || p.closest('[data-chitti-no-translate]'))) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var node;
      while ((node = w.nextNode())) {
        var orig = node._chittiOrig;
        if (lang === 'en') { node.nodeValue = orig; continue; }
        var t = lookup(orig, lang);
        node.nodeValue = (t !== null) ? t : orig;
      }
      document.querySelectorAll('[placeholder]').forEach(function (el) {
        var orig = el.dataset.chittiPhOrig || el.getAttribute('placeholder') || '';
        if (lang === 'en') { el.setAttribute('placeholder', orig); return; }
        var t = lookup(orig, lang);
        el.setAttribute('placeholder', (t !== null) ? t : orig);
      });
      document.querySelectorAll('[aria-label]').forEach(function (el) {
        var orig = el.dataset.chittiAriaOrig || el.getAttribute('aria-label') || '';
        if (lang === 'en') { el.setAttribute('aria-label', orig); return; }
        var t = lookup(orig, lang);
        el.setAttribute('aria-label', (t !== null) ? t : orig);
      });
      document.querySelectorAll('[title]').forEach(function (el) {
        var orig = el.dataset.chittiTitleOrig || el.getAttribute('title') || '';
        if (lang === 'en') { el.setAttribute('title', orig); return; }
        var t = lookup(orig, lang);
        el.setAttribute('title', (t !== null) ? t : orig);
      });
      document.querySelectorAll('[alt]').forEach(function (el) {
        var orig = el.dataset.chittiAltOrig || el.getAttribute('alt') || '';
        if (lang === 'en') { el.setAttribute('alt', orig); return; }
        var t = lookup(orig, lang);
        el.setAttribute('alt', (t !== null) ? t : orig);
      });

      try {
        document.dispatchEvent(new CustomEvent('chitti:langchange', { detail: { lang: lang }, bubbles: true }));
      } catch (e) {}
    } finally {
      _applying = false;
    }
    schedulePreload();
  }

  // After the first real translate, background-preload the remaining packs so
  // dropdown switching is instant. Off the critical path (idle / 2.5 s).
  var _preloadScheduled = false;
  function schedulePreload() {
    if (_preloadScheduled) return;
    _preloadScheduled = true;
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 2500); };
    try {
      idle(function () {
        for (var i = 0; i < LANGS.length; i++) {
          var c = LANGS[i].code;
          if (c !== 'en' && !_loaded[c] && !_loadingCbs[c]) ensureLang(c, null);
        }
      });
    } catch (e) {}
  }

  function populateSelect(sel) {
    sel.innerHTML = '';
    for (var i = 0; i < LANGS.length; i++) {
      var l = LANGS[i];
      var opt = document.createElement('option');
      opt.value = l.code;
      opt.textContent = l.native;
      sel.appendChild(opt);
    }
  }

  function wireDropdown() {
    var sel = document.querySelector(
      'select#lang-select, select#lang, select#hdr-lang, ' +
      'select#pick-lang, select#onb-lang, ' +
      'select[name="lang"], select[name="language"], ' +
      'select[aria-label="Language"], select[aria-label="Choose language"], select[aria-label="Change language"]'
    );
    if (!sel) return;  // no existing dropdown — page is responsible per Bryan's contract
    populateSelect(sel);
    sel.value = currentLang;
    sel.onchange = function () { translateAll(this.value); };
    if (currentLang && currentLang !== 'en') {
      translateAll(currentLang);
    } else {
      snapshotAll();
    }
    if (typeof MutationObserver === 'function') {
      var _scanPending = false;
      var _observer = new MutationObserver(function (muts) {
        if (_applying) return;  // ignore our own substitutions (loop guard)
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          if ((m.addedNodes && m.addedNodes.length) || m.type === 'characterData') {
            var t = m.target;
            if (t && (t.parentElement || t).closest && (t.parentElement || t).closest('select#lang-select')) continue;
            rescan();
            return;
          }
        }
      });
      function rescan() {
        if (_scanPending) return;
        _scanPending = true;
        (window.requestAnimationFrame || function (fn) { setTimeout(fn, 16); })(function () {
          _scanPending = false;
          if (!_applying) { try { translateAll(currentLang); } catch (e) {} }
        });
      }
      _observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }

  window.Chitti = window.Chitti || {};
  window.Chitti.lang = {
    set: translateAll,
    current: function () { return currentLang; },
    list: LANGS.slice(),
    theme: THEME,
    // Single-string lookup. Returns null if the active-lang pack lacks the key
    // (or isn't loaded yet). Used by chitti_a11y.js for dynamic section names.
    lookupText: function (text, lang) { return lookup(text, lang || currentLang); },
    // Merge runtime strings. Accepts the legacy shape { "English": {en,hi,bn,…} }
    // (chitti_a11y.js widget/QR strings) and distributes each translation into the
    // matching per-language map — so they translate even before a pack loads.
    extend: function (entries) {
      if (!entries) return;
      Object.keys(entries).forEach(function (k) {
        var e = entries[k];
        if (!e || typeof e !== 'object') return;
        Object.keys(e).forEach(function (lg) {
          if (lg === 'en') return;
          var v = e[lg]; if (!v) return;
          LANGDATA[lg] = LANGDATA[lg] || {};
          LANGDATA[lg][k] = v;
        });
      });
      try { translateAll(currentLang); } catch (e) {}
    },
    // Expose the registrar so lang packs (and tooling) can hand us data.
    _register: register,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireDropdown);
  } else {
    wireDropdown();
  }
})();
