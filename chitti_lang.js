
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
    // RELIABILITY FIX (lang-switch race): if this pack belongs to the language the user is
    // currently on, re-apply the moment its data arrives — don't rely on <script> onload
    // timing. Safe from looping because _applyTranslate disconnects the observer while it runs.
    try {
      if (lang === currentLang && !_applying && typeof _applyTranslate === 'function' && document.body) _applyTranslate(lang);
    } catch (e) {}
  }
  window.__chittiLangRegister = register;
  // RELIABILITY FIX (lang-switch race): capture-phase delegated listener attached the moment
  // this substrate runs, so a language change is ALWAYS caught synchronously — even on heavy
  // pages where wireDropdown()'s direct onchange attaches late or the observer is busy.
  try {
    document.addEventListener('change', function (e) {
      var t = e && e.target;
      if (!t || t.tagName !== 'SELECT') return;
      var al = t.getAttribute && t.getAttribute('aria-label');
      if (t.id === 'lang-select' || t.id === 'lang' || t.id === 'hdr-lang' || t.id === 'pick-lang' || t.id === 'onb-lang' ||
          al === 'Language' || al === 'Choose language' || al === 'Change language') {
        try { translateAll(t.value); } catch (err) {}
      }
    }, true);
  } catch (e) {}
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
  var _observer = null;  // module-scoped so _applyTranslate can pause it (loop-safety)

  // Public entry — sets the language immediately, loads its pack if needed, then applies.
  function translateAll(lang) {
    currentLang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    // RELIABILITY FIX (lang-switch race): reflect the chosen language SYNCHRONOUSLY —
    // set html[lang] + RTL dir + a brief loading flag immediately, so the UI never
    // appears stuck in English while the per-language pack is still downloading.
    try {
      if (document.documentElement) {
        document.documentElement.lang = lang;
        document.documentElement.dir = RTL_LANGS[lang] ? 'rtl' : 'ltr';
        if (lang !== 'en' && !_loaded[lang]) document.documentElement.setAttribute('data-chitti-lang-loading', lang);
        else document.documentElement.removeAttribute('data-chitti-lang-loading');
      }
    } catch (e) {}
    ensureLang(lang, function () {
      // Only apply if this is still the language the user wants (avoids a stale
      // late-arriving pack overwriting a newer switch).
      if (currentLang === lang) _applyTranslate(lang);
    });
  }

  function _applyTranslate(lang) {
    _applying = true;
    // LOOP-SAFETY: pause the MutationObserver while WE mutate the DOM. MutationObserver
    // delivers records asynchronously — the `_applying` flag is already false by the time
    // they arrive — so an in-flag guard cannot stop our own translations from re-triggering
    // a rescan→translate loop. Disconnecting around the apply is the only reliable guard.
    try { if (_observer) _observer.disconnect(); } catch (e) {}
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
      // value-diff before assign: never write an identical value (avoids spurious mutations)
      while ((node = w.nextNode())) {
        var orig = node._chittiOrig;
        var nv = (lang === 'en') ? orig : ((lookup(orig, lang) !== null) ? lookup(orig, lang) : orig);
        if (node.nodeValue !== nv) node.nodeValue = nv;
      }
      function setAttrDiff(el, attr, origKey) {
        var orig = el.dataset[origKey] || el.getAttribute(attr) || '';
        var nv = (lang === 'en') ? orig : ((lookup(orig, lang) !== null) ? lookup(orig, lang) : orig);
        if (el.getAttribute(attr) !== nv) el.setAttribute(attr, nv);
      }
      document.querySelectorAll('[placeholder]').forEach(function (el) { setAttrDiff(el, 'placeholder', 'chittiPhOrig'); });
      document.querySelectorAll('[aria-label]').forEach(function (el) { setAttrDiff(el, 'aria-label', 'chittiAriaOrig'); });
      document.querySelectorAll('[title]').forEach(function (el) { setAttrDiff(el, 'title', 'chittiTitleOrig'); });
      document.querySelectorAll('[alt]').forEach(function (el) { setAttrDiff(el, 'alt', 'chittiAltOrig'); });

      try {
        document.dispatchEvent(new CustomEvent('chitti:langchange', { detail: { lang: lang }, bubbles: true }));
      } catch (e) {}
    } finally {
      _applying = false;
      try { if (document.documentElement) document.documentElement.removeAttribute('data-chitti-lang-loading'); } catch (e) {}
      // reconnect the observer (records queued during apply were dropped by disconnect)
      try { if (_observer && document.body) _observer.observe(document.body, { childList: true, subtree: true, characterData: true }); } catch (e) {}
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
      _observer = new MutationObserver(function (muts) {
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

  // ── G2 — Verdict NLG (vernacular content templates) ──────────────────
  // Template-based vernacular verdict for when DeepSeek (BO12) is Sire-blocked.
  // Each entry is a set of SHORT, hand-verified phrases (no Hinglish). Proper
  // nouns (symbol · RSI · ₹ · %) are interpolated as translate="no" spans and
  // NEVER translated. Languages not in this table fall back to English
  // honestly (filled by DeepSeek / community packs when unlocked) — we never
  // ship a fabricated or Hinglish translation. Swappable by design: when
  // BO12 lands, app.js prefers DeepSeek's fluent narration over these.
  var VERDICT_NLG = {
    en: { strongBuy: 'strong buy signal', buy: 'buy signal', sell: 'sell signal', strongSell: 'strong sell signal', wait: 'no clear signal — wait', trendUp: 'trend is up', trendDown: 'trend is down', trendFlat: 'trend is sideways', stop: 'Stop-loss', advice: 'This is technical analysis, not advice.', demo: 'DEMO data — live data coming soon.' },
    hi: { strongBuy: 'मज़बूत ख़रीद संकेत', buy: 'ख़रीद संकेत', sell: 'बिक्री संकेत', strongSell: 'मज़बूत बिक्री संकेत', wait: 'कोई स्पष्ट संकेत नहीं — प्रतीक्षा करें', trendUp: 'रुझान ऊपर है', trendDown: 'रुझान नीचे है', trendFlat: 'रुझान सपाट है', stop: 'स्टॉप-लॉस', advice: 'यह तकनीकी विश्लेषण है, सलाह नहीं।', demo: 'डेमो डेटा — लाइव डेटा जल्द आएगा।' },
    bn: { strongBuy: 'শক্তিশালী কেনার সংকেত', buy: 'কেনার সংকেত', sell: 'বিক্রির সংকেত', strongSell: 'শক্তিশালী বিক্রির সংকেত', wait: 'স্পষ্ট সংকেত নেই — অপেক্ষা করুন', trendUp: 'প্রবণতা ঊর্ধ্বমুখী', trendDown: 'প্রবণতা নিম্নমুখী', trendFlat: 'প্রবণতা স্থির', stop: 'স্টপ-লস', advice: 'এটি প্রযুক্তিগত বিশ্লেষণ, পরামর্শ নয়।', demo: 'ডেমো ডেটা — লাইভ ডেটা শীঘ্রই আসছে।' },
    te: { strongBuy: 'బలమైన కొనుగోలు సంకేతం', buy: 'కొనుగోలు సంకేతం', sell: 'అమ్మకం సంకేతం', strongSell: 'బలమైన అమ్మకం సంకేతం', wait: 'స్పష్టమైన సంకేతం లేదు — వేచి ఉండండి', trendUp: 'ధోరణి పైకి ఉంది', trendDown: 'ధోరణి కిందికి ఉంది', trendFlat: 'ధోరణి సమతలంగా ఉంది', stop: 'స్టాప్-లాస్', advice: 'ఇది సాంకేతిక విశ్లేషణ, సలహా కాదు.', demo: 'డెమో డేటా — లైవ్ డేటా త్వరలో వస్తుంది.' },
    ta: { strongBuy: 'வலுவான வாங்கல் சமிக்ஞை', buy: 'வாங்கல் சமிக்ஞை', sell: 'விற்பனை சமிக்ஞை', strongSell: 'வலுவான விற்பனை சமிக்ஞை', wait: 'தெளிவான சமிக்ஞை இல்லை — காத்திருங்கள்', trendUp: 'போக்கு மேல்நோக்கி உள்ளது', trendDown: 'போக்கு கீழ்நோக்கி உள்ளது', trendFlat: 'போக்கு பக்கவாட்டில் உள்ளது', stop: 'ஸ்டாப்-லாஸ்', advice: 'இது தொழில்நுட்ப பகுப்பாய்வு, ஆலோசனை அல்ல.', demo: 'டெமோ தரவு — நேரடி தரவு விரைவில் வரும்.' },
    mr: { strongBuy: 'मजबूत खरेदी संकेत', buy: 'खरेदी संकेत', sell: 'विक्री संकेत', strongSell: 'मजबूत विक्री संकेत', wait: 'स्पष्ट संकेत नाही — प्रतीक्षा करा', trendUp: 'कल वरच्या दिशेने आहे', trendDown: 'कल खालच्या दिशेने आहे', trendFlat: 'कल स्थिर आहे', stop: 'स्टॉप-लॉस', advice: 'हे तांत्रिक विश्लेषण आहे, सल्ला नाही.', demo: 'डेमो डेटा — थेट डेटा लवकरच येईल.' },
    gu: { strongBuy: 'મજબૂત ખરીદ સંકેત', buy: 'ખરીદ સંકેત', sell: 'વેચાણ સંકેત', strongSell: 'મજબૂત વેચાણ સંકેત', wait: 'સ્પષ્ટ સંકેત નથી — રાહ જુઓ', trendUp: 'વલણ ઉપર તરફ છે', trendDown: 'વલણ નીચે તરફ છે', trendFlat: 'વલણ સ્થિર છે', stop: 'સ્ટોપ-લોસ', advice: 'આ ટેકનિકલ વિશ્લેષણ છે, સલાહ નથી.', demo: 'ડેમો ડેટા — લાઇવ ડેટા જલ્દી આવશે.' },
    kn: { strongBuy: 'ಬಲವಾದ ಖರೀದಿ ಸಂಕೇತ', buy: 'ಖರೀದಿ ಸಂಕೇತ', sell: 'ಮಾರಾಟ ಸಂಕೇತ', strongSell: 'ಬಲವಾದ ಮಾರಾಟ ಸಂಕೇತ', wait: 'ಸ್ಪಷ್ಟ ಸಂಕೇತವಿಲ್ಲ — ಕಾಯಿರಿ', trendUp: 'ಪ್ರವೃತ್ತಿ ಮೇಲ್ಮುಖವಾಗಿದೆ', trendDown: 'ಪ್ರವೃತ್ತಿ ಕೆಳಮುಖವಾಗಿದೆ', trendFlat: 'ಪ್ರವೃತ್ತಿ ಸಮತಲವಾಗಿದೆ', stop: 'ಸ್ಟಾಪ್-ಲಾಸ್', advice: 'ಇದು ತಾಂತ್ರಿಕ ವಿಶ್ಲೇಷಣೆ, ಸಲಹೆ ಅಲ್ಲ.', demo: 'ಡೆಮೋ ಡೇಟಾ — ಲೈವ್ ಡೇಟಾ ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ.' },
    ml: { strongBuy: 'ശക്തമായ വാങ്ങൽ സൂചന', buy: 'വാങ്ങൽ സൂചന', sell: 'വിൽപന സൂചന', strongSell: 'ശക്തമായ വിൽപന സൂചന', wait: 'വ്യക്തമായ സൂചനയില്ല — കാത്തിരിക്കുക', trendUp: 'പ്രവണത മുകളിലേക്കാണ്', trendDown: 'പ്രവണത താഴേക്കാണ്', trendFlat: 'പ്രവണത സ്ഥിരമാണ്', stop: 'സ്റ്റോപ്പ്-ലോസ്', advice: 'ഇത് സാങ്കേതിക വിശകലനമാണ്, ഉപദേശമല്ല.', demo: 'ഡെമോ ഡാറ്റ — ലൈവ് ഡാറ്റ ഉടൻ വരും.' },
    pa: { strongBuy: 'ਮਜ਼ਬੂਤ ਖਰੀਦ ਸੰਕੇਤ', buy: 'ਖਰੀਦ ਸੰਕੇਤ', sell: 'ਵਿਕਰੀ ਸੰਕੇਤ', strongSell: 'ਮਜ਼ਬੂਤ ਵਿਕਰੀ ਸੰਕੇਤ', wait: 'ਕੋਈ ਸਪਸ਼ਟ ਸੰਕੇਤ ਨਹੀਂ — ਉਡੀਕ ਕਰੋ', trendUp: 'ਰੁਝਾਨ ਉੱਪਰ ਵੱਲ ਹੈ', trendDown: 'ਰੁਝਾਨ ਹੇਠਾਂ ਵੱਲ ਹੈ', trendFlat: 'ਰੁਝਾਨ ਸਥਿਰ ਹੈ', stop: 'ਸਟਾਪ-ਲਾਸ', advice: 'ਇਹ ਤਕਨੀਕੀ ਵਿਸ਼ਲੇਸ਼ਣ ਹੈ, ਸਲਾਹ ਨਹੀਂ।', demo: 'ਡੈਮੋ ਡਾਟਾ — ਲਾਈਵ ਡਾਟਾ ਜਲਦੀ ਆਵੇਗਾ।' },
    or: { strongBuy: 'ଶକ୍ତିଶାଳୀ କିଣିବା ସଙ୍କେତ', buy: 'କିଣିବା ସଙ୍କେତ', sell: 'ବିକ୍ରି ସଙ୍କେତ', strongSell: 'ଶକ୍ତିଶାଳୀ ବିକ୍ରି ସଙ୍କେତ', wait: 'ସ୍ପଷ୍ଟ ସଙ୍କେତ ନାହିଁ — ଅପେକ୍ଷା କରନ୍ତୁ', trendUp: 'ଧାରା ଉପରକୁ ଅଛି', trendDown: 'ଧାରା ତଳକୁ ଅଛି', trendFlat: 'ଧାରା ସ୍ଥିର ଅଛି', stop: 'ଷ୍ଟପ୍-ଲସ୍', advice: 'ଏହା ଯାନ୍ତ୍ରିକ ବିଶ୍ଳେଷଣ, ପରାମର୍ଶ ନୁହେଁ।', demo: 'ଡେମୋ ଡାଟା — ଲାଇଭ୍ ଡାଟା ଶୀଘ୍ର ଆସିବ।' },
    as: { strongBuy: 'শক্তিশালী ক্ৰয় সংকেত', buy: 'ক্ৰয় সংকেত', sell: 'বিক্ৰী সংকেত', strongSell: 'শক্তিশালী বিক্ৰী সংকেত', wait: 'স্পষ্ট সংকেত নাই — অপেক্ষা কৰক', trendUp: 'ধাৰা ওপৰমুৱা', trendDown: 'ধাৰা তলমুৱা', trendFlat: 'ধাৰা স্থিৰ', stop: 'ষ্টপ-লছ', advice: 'এইটো কাৰিকৰী বিশ্লেষণ, পৰামৰ্শ নহয়।', demo: 'ডেমো ডেটা — লাইভ ডেটা সোনকালে আহিব।' },
    ur: { strongBuy: 'مضبوط خریداری کا اشارہ', buy: 'خریداری کا اشارہ', sell: 'فروخت کا اشارہ', strongSell: 'مضبوط فروخت کا اشارہ', wait: 'کوئی واضح اشارہ نہیں — انتظار کریں', trendUp: 'رجحان اوپر کی طرف ہے', trendDown: 'رجحان نیچے کی طرف ہے', trendFlat: 'رجحان مستحکم ہے', stop: 'اسٹاپ لاس', advice: 'یہ تکنیکی تجزیہ ہے، مشورہ نہیں۔', demo: 'ڈیمو ڈیٹا — لائیو ڈیٹا جلد آئے گا۔' },
    ne: { strongBuy: 'बलियो किन्ने संकेत', buy: 'किन्ने संकेत', sell: 'बेच्ने संकेत', strongSell: 'बलियो बेच्ने संकेत', wait: 'स्पष्ट संकेत छैन — पर्खनुहोस्', trendUp: 'प्रवृत्ति माथितिर छ', trendDown: 'प्रवृत्ति तलतिर छ', trendFlat: 'प्रवृत्ति स्थिर छ', stop: 'स्टप-लस', advice: 'यो प्राविधिक विश्लेषण हो, सल्लाह होइन।', demo: 'डेमो डाटा — लाइभ डाटा चाँडै आउँछ।' },
    sa: { strongBuy: 'दृढः क्रयसङ्केतः', buy: 'क्रयसङ्केतः', sell: 'विक्रयसङ्केतः', strongSell: 'दृढः विक्रयसङ्केतः', wait: 'स्पष्टः सङ्केतः नास्ति — प्रतीक्षस्व', trendUp: 'प्रवृत्तिः ऊर्ध्वगा', trendDown: 'प्रवृत्तिः अधोगा', trendFlat: 'प्रवृत्तिः समा', stop: 'स्टॉप्-लॉस्', advice: 'इदं प्राविधिकविश्लेषणम्, न तु परामर्शः।', demo: 'डेमो-दत्तांशः — सद्यः सजीवदत्तांशः आगमिष्यति।' }
  };
  function _tno(s) { return '<span translate="no" class="tno">' + s + '</span>'; }
  function verdictNLG(o) {
    o = o || {};
    var lang = o.lang || currentLang || 'en';
    var t = VERDICT_NLG[lang] || VERDICT_NLG.en;
    var dec = o.decision, strong = !!o.strong;
    var sigP = dec === 'BUY' ? (strong ? t.strongBuy : t.buy)
      : dec === 'SELL' ? (strong ? t.strongSell : t.sell) : t.wait;
    var parts = [_tno(o.symbol || '') + ': ' + sigP + '.'];
    if (dec !== 'WAIT' && o.trend) parts.push((o.trend === 'up' ? t.trendUp : o.trend === 'down' ? t.trendDown : t.trendFlat) + '.');
    if (o.rsi != null) parts.push(_tno('RSI') + ' ' + _tno(o.rsi) + '.');
    if (dec !== 'WAIT' && o.stopPrice != null) parts.push(t.stop + ': ' + _tno('₹' + o.stopPrice) + (o.stopPct != null ? ' (' + _tno(o.stopPct + '%') + ')' : '') + '.');
    var body = parts.join(' ');
    if (o.demo) body = _tno('DEMO') + ' — ' + t.demo + ' ' + body;
    return body + ' ' + t.advice;
  }

  window.Chitti = window.Chitti || {};
  window.Chitti.lang = {
    set: translateAll,
    current: function () { return currentLang; },
    list: LANGS.slice(),
    theme: THEME,
    // G2: vernacular verdict NLG. opts {decision,strong,symbol,rsi,trend,stopPrice,stopPct,demo,lang}.
    verdictNLG: verdictNLG,
    // Languages with hand-verified verdict templates (others fall back to English).
    verdictCovered: Object.keys(VERDICT_NLG),
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
