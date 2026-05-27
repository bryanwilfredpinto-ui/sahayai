// chitti_a11y.js — vaani-only i18n supplement, rebuilt 2026-05-21.
// =====================================================================
// PURPOSE
//   chitti_lang.js (551 lines, baked 993×26 translation T-table) already
//   covers the main visible English strings on chitti_vaani.html. This
//   supplement closes the residual gaps — strings that appear AFTER the
//   substrate's initial paint (feedback-widget.js per-box bars + page-
//   footer wrap, QR block, a few page-level labels that were missing
//   from the original corpus).
//
// CONTRACT (Bryan, 2026-05-21)
//   * One dropdown. Wire to chitti_vaani.html's existing <select id="lang-select">.
//   * Hardcoded translations. No APIs. No language bar injection.
//   * 100% language flip per language: Telugu → 100% Telugu, Bangla → 100%
//     Bangla, Gujarati → 100% Gujarati, and so on for all 26 supported langs.
//   * Vaani-only. Does NOT load on other Chitti pages (per the rebuild-
//     one-at-a-time directive from the 2026-05-21 FULL DISMANTLE commit).
//
// HOW IT WORKS
//   1. Listens for chitti_lang.js's `chitti:langchange` event AND for the
//      page's own `change` event on #lang-select (defensive — works even
//      if chitti_lang.js fails to load).
//   2. Maintains its own focused W table (this file) with translations for
//      ~35 widget/QR/page-residue strings. Each entry has 12 primary Indian
//      languages explicitly; the 14 cousin languages fall back to Hindi
//      (matching the chitti_lang.js T-table convention for raj/bho/kru/hoc).
//   3. Walks `.chitti-fb-box-bar`, `.chitti-fb-wrap`, `.chitti-qr-block`,
//      and a few known vaani section containers via TreeWalker; replaces
//      text nodes whose trimmed value matches a W key.
//   4. Also rewrites `aria-label` / `title` / `placeholder` / `alt`
//      attributes when they match a W key — important for the per-box
//      button aria-labels ("Read X aloud" / "Ask Chitti to explain X
//      further" / "X was helpful" / "Something was wrong with X").
//   5. Re-runs on every DOM mutation (throttled to once per animation
//      frame), so dynamically-attached widget bars get translated on
//      attach. The observer is disconnected during our own writes to
//      avoid an infinite mutation loop.
//
// COVERAGE
//   The 35 strings below were collected via tools/dump_vaani_residue.mjs
//   (which runs chitti_vaani.html under Playwright, switches to Telugu,
//   and dumps every Latin-letter run left on screen). Run that script
//   again any time chitti_vaani.html grows new visible text — anything
//   that shows up there must be added here or to chitti_lang.js's T-table.
// =====================================================================

(function () {
  'use strict';
  if (window.__chittiA11yLoaded) return;
  window.__chittiA11yLoaded = true;

  // ── URL kill-switch for the Disability Profile modal ──
  // Runs BEFORE any substrate loads. Lets Sire (or any user) unblock
  // themselves with one URL: https://sahayai.in/<any-chitti>.html?dp_skip=1
  // → writes a skipped:true record, modal will never appear on this
  // device. `?dp_reset=1` wipes the record so a fresh modal shows next visit.
  try {
    var __dpQS = (location.search || '').toLowerCase();
    if (/[?&]dp_skip=1\b/.test(__dpQS)) {
      localStorage.setItem('disability_profile', JSON.stringify({
        skipped: true, closed_via: 'url_kill_switch', ts: new Date().toISOString(),
      }));
    } else if (/[?&]dp_reset=1\b/.test(__dpQS)) {
      localStorage.removeItem('disability_profile');
    }
  } catch (e) { /* honest skip — non-blocking */ }

  // ── Bottom-nav substrate auto-loader (Sire 2026-05-23 Priority-2) ──
  // Every page that loads chitti_a11y.js also gets the unified Bharat
  // bottom nav (Vaani · Karo · Vault · Parivaar · Settings). One script
  // injection, zero per-page edits. Opt-out per page via:
  //   <meta name="chitti-bottom-nav" content="off">
  // Skip-self-check: if a page already has a <script src="chitti_bottom_nav.js">
  // tag, don't double-inject.
  (function injectBottomNav() {
    try {
      if (document.querySelector('script[src*="chitti_bottom_nav.js"]')) return;
      // Resolve relative to this file's <script> src so it works whether
      // the page lives at /, /chitti_X.html, or under a sub-path.
      var thisScript = document.currentScript ||
        document.querySelector('script[src*="chitti_a11y.js"]');
      var srcBase = '';
      if (thisScript && thisScript.src) {
        srcBase = thisScript.src.replace(/chitti_a11y\.js.*$/, '');
      }
      var s = document.createElement('script');
      s.src = (srcBase || '') + 'chitti_bottom_nav.js';
      s.defer = true;
      s.setAttribute('data-injected-by', 'chitti_a11y');
      document.head.appendChild(s);
    } catch (e) { /* honest skip — non-blocking */ }
  })();

  // ── Universal Camera substrate auto-loader (Sire 2026-05-27) ──
  // Every page that loads chitti_a11y.js also gets the floating 📷 Scan
  // button + 10-mode picker (Medicine / Food / Fashion / Document / Bill
  // / Legal / Crop / Prescription / QR / Product). One substrate, every
  // Chitti, one tap. Opt-out per page via:
  //   <meta name="chitti-camera-universal" content="off">
  // Mirrors the bottom-nav injection pattern.
  (function injectCameraUniversal() {
    try {
      var opt = document.querySelector('meta[name="chitti-camera-universal"]');
      if (opt && /^off$/i.test(opt.getAttribute('content') || '')) return;
      if (document.querySelector('script[src*="chitti_camera_universal.js"]')) return;
      var thisScript = document.currentScript ||
        document.querySelector('script[src*="chitti_a11y.js"]');
      var srcBase = '';
      if (thisScript && thisScript.src) {
        srcBase = thisScript.src.replace(/chitti_a11y\.js.*$/, '');
      }
      var s = document.createElement('script');
      s.src = (srcBase || '') + 'chitti_camera_universal.js';
      s.defer = true;
      s.setAttribute('data-injected-by', 'chitti_a11y');
      document.head.appendChild(s);
    } catch (e) { /* honest skip — non-blocking */ }
  })();

  // ── feedback-widget.js auto-loader (Sire 2026-05-27, fixes batch-cert
  //    finding on chitti_offline.html) ──
  // The per-response widget (4 icons + per-box feedback) is the locked
  // §7 contract. Most pages already include the script explicitly; the
  // auto-loader catches pages (chitti_offline) that load a11y but not
  // the widget. Opt-out per page via:
  //   <meta name="chitti-feedback-widget" content="off">
  (function injectFeedbackWidget() {
    try {
      var opt = document.querySelector('meta[name="chitti-feedback-widget"]');
      if (opt && /^off$/i.test(opt.getAttribute('content') || '')) return;
      if (document.querySelector('script[src*="feedback-widget.js"]')) return;
      var thisScript = document.currentScript ||
        document.querySelector('script[src*="chitti_a11y.js"]');
      var srcBase = '';
      if (thisScript && thisScript.src) {
        srcBase = thisScript.src.replace(/chitti_a11y\.js.*$/, '');
      }
      var s = document.createElement('script');
      s.src = (srcBase || '') + 'feedback-widget.js';
      s.defer = true;
      s.setAttribute('data-injected-by', 'chitti_a11y');
      document.head.appendChild(s);
    } catch (e) { /* honest skip */ }
  })();

  // ── chitti_lang.js auto-loader (Sire 2026-05-27, fixes batch-cert
  //    findings) ──
  // Some legacy pages (chitti_isl, chitti_offline, chitti_quality,
  // chitti_complete, chitti_voice_hall_of_fame, index) loaded a11y
  // without lang — leaving G4 (Chitti.lang.current) RED on every cert
  // run + breaking a11y's own init (it calls Chitti.lang.extend()).
  // Auto-inject lang BEFORE a11y init runs, so the dependency is met
  // for every page that loads a11y. Opt-out per page via:
  //   <meta name="chitti-lang" content="off">
  (function injectChittiLang() {
    try {
      var opt = document.querySelector('meta[name="chitti-lang"]');
      if (opt && /^off$/i.test(opt.getAttribute('content') || '')) return;
      if (document.querySelector('script[src*="chitti_lang.js"]')) return;
      var thisScript = document.currentScript ||
        document.querySelector('script[src*="chitti_a11y.js"]');
      var srcBase = '';
      if (thisScript && thisScript.src) {
        srcBase = thisScript.src.replace(/chitti_a11y\.js.*$/, '');
      }
      var s = document.createElement('script');
      s.src = (srcBase || '') + 'chitti_lang.js';
      s.setAttribute('data-injected-by', 'chitti_a11y');
      // Synchronous (no defer) — a11y's init() at the bottom of this
      // file calls Chitti.lang.extend(), so lang MUST land first.
      document.head.appendChild(s);
    } catch (e) { /* honest skip */ }
  })();

  // ── chitti_isl.js auto-loader (Sire 2026-05-27, fixes batch-cert) ──
  // chitti_2wheeler, chitti_4wheeler, chitti_fashion + a few admin pages
  // load a11y + feedback-widget but not chitti_isl.js. ISL plugin is one
  // of the five locked frontend gates (G5 per QUALITY_STATUS.md §1a) —
  // auto-load matches the camera_universal / disability_profile /
  // features pattern. Opt-out per page via:
  //   <meta name="chitti-isl" content="off">
  (function injectChittiIsl() {
    try {
      var opt = document.querySelector('meta[name="chitti-isl"]');
      if (opt && /^off$/i.test(opt.getAttribute('content') || '')) return;
      if (document.querySelector('script[src*="chitti_isl.js"]')) return;
      var thisScript = document.currentScript ||
        document.querySelector('script[src*="chitti_a11y.js"]');
      var srcBase = '';
      if (thisScript && thisScript.src) {
        srcBase = thisScript.src.replace(/chitti_a11y\.js.*$/, '');
      }
      var s = document.createElement('script');
      s.src = (srcBase || '') + 'chitti_isl.js';
      s.defer = true;
      s.setAttribute('data-injected-by', 'chitti_a11y');
      document.head.appendChild(s);
    } catch (e) { /* honest skip */ }
  })();

  // ── Language <select id="lang-select"> auto-inject (Sire 2026-05-27,
  //    fixes batch-cert S2) ──
  // chitti_lang.js's wireDropdown looks for an existing #lang-select on
  // the page and populates it with the 26-lang list. Pages that don't
  // ship the element silently miss the language dropdown. Inject a
  // floating Indian-flag-themed wrapper if no compatible select is found,
  // matching the chitti_logo_video pattern.
  (function injectLangSelectIfMissing() {
    function attempt() {
      try {
        var meta = document.querySelector('meta[name="chitti-lang-select"]');
        if (meta && /^off$/i.test(meta.getAttribute('content') || '')) return;
        // Match all the selectors chitti_lang.js's wireDropdown looks at.
        var existing = document.querySelector(
          'select#lang-select, select#lang, select#hdr-lang, ' +
          'select#pick-lang, select#onb-lang, ' +
          'select[name="lang"], select[name="language"], ' +
          'select[aria-label="Language"]'
        );
        if (existing) return;
        if (document.querySelector('[data-chitti-lang-select-injected]')) return;
        if (!document.body) {
          document.addEventListener('DOMContentLoaded', attempt, { once: true });
          return;
        }
        // Style block once.
        if (!document.getElementById('chitti-langsel-styles')) {
          var st = document.createElement('style');
          st.id = 'chitti-langsel-styles';
          st.appendChild(document.createTextNode(
            '[data-chitti-lang-select-injected]{position:fixed;top:8px;right:8px;z-index:9001;' +
            'display:inline-flex;align-items:center;gap:6px;background:var(--navy,#000080);color:#fff;' +
            'border:2px solid var(--saffron,#FF9933);border-radius:10px;padding:6px 10px;' +
            'font-family:Inter,system-ui,sans-serif;font-size:12px;box-shadow:0 4px 14px rgba(0,0,128,.30)}' +
            '[data-chitti-lang-select-injected] label{color:#fff;font-size:14px;font-weight:700;margin:0}' +
            '[data-chitti-lang-select-injected] select{background:#fff;color:var(--navy,#000080);' +
            'border:1px solid var(--saffron,#FF9933);border-radius:8px;padding:6px 26px 6px 10px;' +
            'font-weight:700;font-size:13px;min-height:36px;cursor:pointer}' +
            '@media(max-width:640px){[data-chitti-lang-select-injected]{top:auto;bottom:14px;right:auto;left:14px}}'
          ));
          document.head.appendChild(st);
        }
        var wrap = document.createElement('div');
        wrap.setAttribute('data-chitti-lang-select-injected', '1');
        wrap.innerHTML =
          '<label for="lang-select" aria-hidden="true">🌐</label>' +
          '<select id="lang-select" aria-label="Language"><option value="en">English</option></select>';
        document.body.appendChild(wrap);
        // If chitti_lang.js already finished wiring (page loaded after
        // DOMContentLoaded), populate now by triggering wireDropdown
        // via Chitti.lang.set on the same value.
        if (window.Chitti && window.Chitti.lang && typeof window.Chitti.lang.set === 'function') {
          var sel = wrap.querySelector('#lang-select');
          if (sel && window.Chitti.lang.list) {
            // Populate options manually so chitti_lang.js doesn't have to.
            sel.innerHTML = '';
            window.Chitti.lang.list.forEach(function (l) {
              var o = document.createElement('option');
              o.value = l.code;
              o.textContent = l.native + ' · ' + l.label;
              sel.appendChild(o);
            });
            try { sel.value = window.Chitti.lang.current(); } catch (e) {}
            sel.onchange = function () { window.Chitti.lang.set(this.value); };
          }
        }
      } catch (e) { /* honest skip */ }
    }
    // Try once now; also re-try after DOMContentLoaded in case the
    // page injects its own #lang-select in a late init script.
    attempt();
    if (document.readyState !== 'complete') {
      document.addEventListener('DOMContentLoaded', function () {
        // Late-attempt: only inject if STILL no real lang select exists.
        setTimeout(attempt, 300);
      });
    }
  })();

  // ── User Disability Profile substrate auto-loader (Sire 2026-05-27,
  //    fixes SAHAYAI_MASTER.md §7 + project_user_disability_profile_locked
  //    contract gap — modal was never built; every page was 🔴 RED on
  //    QUALITY_STATUS.md §1a Gate G3 because the substrate didn't exist).
  // Every page that loads chitti_a11y.js also gets the one-time multi-select
  // Disability Profile prompt — saves locally, never re-asks, syncs across
  // every Chitti page on the device. Opt-out per page via:
  //   <meta name="chitti-disability-profile" content="off">
  // Intended for admin / dev pages only.
  (function injectDisabilityProfile() {
    try {
      var opt = document.querySelector('meta[name="chitti-disability-profile"]');
      if (opt && /^off$/i.test(opt.getAttribute('content') || '')) return;
      if (document.querySelector('script[src*="chitti_disability_profile.js"]')) return;
      var thisScript = document.currentScript ||
        document.querySelector('script[src*="chitti_a11y.js"]');
      var srcBase = '';
      if (thisScript && thisScript.src) {
        srcBase = thisScript.src.replace(/chitti_a11y\.js.*$/, '');
      }
      var s = document.createElement('script');
      // Cache-bust: GitHub Pages serves substrate JS with Cache-Control:
      // max-age=600. Bumping the ?v= query forces the browser to fetch the
      // latest copy on the very next page-load, instead of waiting 10 min
      // for the cache entry to expire. Bump this version any time
      // chitti_disability_profile.js changes and users need it RIGHT NOW.
      s.src = (srcBase || '') + 'chitti_disability_profile.js?v=20260527.2';
      s.defer = true;
      s.setAttribute('data-injected-by', 'chitti_a11y');
      document.head.appendChild(s);
    } catch (e) { /* honest skip — non-blocking */ }
  })();

  // ── Feature Discovery substrate auto-loader (Sire 2026-05-27, fixes
  //    SAHAYAI_MASTER.md §2d contract gap) ──
  // Every page that loads chitti_a11y.js also gets the 💡 What can Chitti
  // do for you? button — floating CTA + a11y-bar mirror — driven by
  // chitti_features.js parsing each Chitti's skills/FEATURES.md live.
  // Per §2d the substrate is supposed to be auto-loaded by chitti_a11y.js
  // so every page inherits without per-page edits. The previous build
  // shipped chitti_features.js at repo root but never wired the
  // auto-injection — every Chitti page was missing the Discovery Box.
  // Opt-out per page via: <meta name="chitti-features" content="off">
  // (separate from the spec's content="path/to/FEATURES.md" override,
  // which chitti_features.js itself reads).
  (function injectFeaturesDiscovery() {
    try {
      var opt = document.querySelector('meta[name="chitti-features"]');
      if (opt && /^off$/i.test(opt.getAttribute('content') || '')) return;
      if (document.querySelector('script[src*="chitti_features.js"]')) return;
      var thisScript = document.currentScript ||
        document.querySelector('script[src*="chitti_a11y.js"]');
      var srcBase = '';
      if (thisScript && thisScript.src) {
        srcBase = thisScript.src.replace(/chitti_a11y\.js.*$/, '');
      }
      var s = document.createElement('script');
      s.src = (srcBase || '') + 'chitti_features.js';
      s.defer = true;
      s.setAttribute('data-injected-by', 'chitti_a11y');
      document.head.appendChild(s);
    } catch (e) { /* honest skip — non-blocking */ }
  })();

  // RTL languages — match chitti_lang.js convention.
  var RTL_LANGS = { ur: 1, ks: 1, sd: 1 };

  // ── W table — supplement to chitti_lang.js's T table ───────────────
  // Keys are the canonical English form (NO leading/trailing whitespace,
  // collapsed inner whitespace). Per-language values mirror chitti_lang.js
  // convention. Cousin languages (mai, kok, doi, ks, ne, sd, mni, sat, bho,
  // raj, kru, hoc) fall back to Hindi when their script is unsupported.
  var W = {
    // ── Feedback widget — per-box bar ───────────────────────────────
    'Feedback for': {
      en:'Feedback for', hi:'इस पर प्रतिक्रिया', bn:'এটির জন্য মতামত',
      te:'దీని కోసం అభిప్రాయం', ta:'இதற்கான கருத்து', mr:'याबद्दल अभिप्राय',
      gu:'આના માટે પ્રતિસાદ', kn:'ಇದರ ಬಗ್ಗೆ ಪ್ರತಿಕ್ರಿಯೆ',
      ml:'ഇതിനുള്ള പ്രതികരണം', pa:'ਇਸ ਲਈ ਫੀਡਬੈਕ', or:'ଏହା ପାଇଁ ମତାମତ',
      as:'ইয়াৰ বাবে মতামত', ur:'اس کے لیے رائے', sa:'अस्य कृते प्रतिक्रिया',
    },
    '💬 Feedback for:': {
      en:'💬 Feedback for:', hi:'💬 इस पर प्रतिक्रिया:',
      bn:'💬 এটির জন্য মতামত:', te:'💬 దీని కోసం అభిప్రాయం:',
      ta:'💬 இதற்கான கருத்து:', mr:'💬 याबद्दल अभिप्राय:',
      gu:'💬 આના માટે પ્રતિસાદ:', kn:'💬 ಇದರ ಬಗ್ಗೆ ಪ್ರತಿಕ್ರಿಯೆ:',
      ml:'💬 ഇതിനുള്ള പ്രതികരണം:', pa:'💬 ਇਸ ਲਈ ਫੀਡਬੈਕ:',
      or:'💬 ଏହା ପାଇଁ ମତାମତ:', as:'💬 ইয়াৰ বাবে মতামত:',
      ur:'💬 اس کے لیے رائے:', sa:'💬 अस्य कृते प्रतिक्रिया:',
    },
    'this section': {
      en:'this section', hi:'यह अनुभाग', bn:'এই বিভাগ',
      te:'ఈ విభాగం', ta:'இந்த பகுதி', mr:'हा विभाग',
      gu:'આ વિભાગ', kn:'ಈ ವಿಭಾಗ', ml:'ഈ വിഭാഗം',
      pa:'ਇਹ ਭਾਗ', or:'ଏହି ବିଭାଗ', as:'এই বিভাগ',
      ur:'یہ سیکشن', sa:'अयं खण्डः',
    },
    'Was this helpful?': {
      en:'Was this helpful?', hi:'क्या यह उपयोगी था?',
      bn:'এটি সহায়ক ছিল?', te:'ఇది ఉపయోగపడిందా?',
      ta:'இது உதவியாக இருந்ததா?', mr:'हे उपयोगी होते का?',
      gu:'શું આ ઉપયોગી હતું?', kn:'ಇದು ಸಹಾಯಕವಾಗಿತ್ತೇ?',
      ml:'ഇത് സഹായകമായിരുന്നോ?', pa:'ਕੀ ਇਹ ਮਦਦਗਾਰ ਸੀ?',
      or:'ଏହା ସହାୟକ ଥିଲା କି?', as:'এইটো সহায়ক আছিল নে?',
      ur:'کیا یہ مددگار تھا؟', sa:'किम् एतत् उपयोगि आसीत्?',
    },
    '📣 Report a problem': {
      en:'📣 Report a problem', hi:'📣 समस्या बताएं',
      bn:'📣 সমস্যা জানান', te:'📣 సమస్యను తెలియజేయండి',
      ta:'📣 பிரச்சனையை தெரிவிக்கவும்', mr:'📣 समस्या कळवा',
      gu:'📣 સમસ્યા જણાવો', kn:'📣 ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ',
      ml:'📣 പ്രശ്നം അറിയിക്കുക', pa:'📣 ਸਮੱਸਿਆ ਦੱਸੋ',
      or:'📣 ସମସ୍ୟା ଜଣାନ୍ତୁ', as:'📣 সমস্যা জনাওক',
      ur:'📣 مسئلہ بتائیں', sa:'📣 समस्यां वदतु',
    },
    'Speaker': {
      en:'Speaker', hi:'स्पीकर', bn:'স্পিকার', te:'స్పీకర్',
      ta:'ஸ்பீக்கர்', mr:'स्पीकर', gu:'સ્પીકર', kn:'ಸ್ಪೀಕರ್',
      ml:'സ്പീക്കർ', pa:'ਸਪੀਕਰ', or:'ସ୍ପିକର', as:'স্পিকাৰ',
      ur:'اسپیکر', sa:'वक्ता',
    },
    'Helpful': {
      en:'Helpful', hi:'उपयोगी', bn:'সহায়ক', te:'ఉపయోగకరం',
      ta:'பயனுள்ளது', mr:'उपयुक्त', gu:'મદદરૂપ', kn:'ಸಹಾಯಕ',
      ml:'സഹായകം', pa:'ਮਦਦਗਾਰ', or:'ସହାୟକ', as:'সহায়ক',
      ur:'مددگار', sa:'उपयोगि',
    },
    'Not OK': {
      en:'Not OK', hi:'ठीक नहीं', bn:'ঠিক নয়', te:'సరిగ్గా లేదు',
      ta:'சரியில்லை', mr:'ठीक नाही', gu:'બરાબર નથી', kn:'ಸರಿಯಿಲ್ಲ',
      ml:'ശരിയല്ല', pa:'ਠੀਕ ਨਹੀਂ', or:'ଠିକ୍ ନୁହେଁ', as:'ঠিক নহয়',
      ur:'ٹھیک نہیں', sa:'न समीचीनम्',
    },
    'HIGH RISK': {
      en:'HIGH RISK', hi:'उच्च जोखिम', bn:'উচ্চ ঝুঁকি', te:'అధిక ప్రమాదం',
      ta:'அதிக ஆபத்து', mr:'उच्च जोखीम', gu:'ઉચ્ચ જોખમ', kn:'ಹೆಚ್ಚಿನ ಅಪಾಯ',
      ml:'ഉയർന്ന അപകടം', pa:'ਉੱਚ ਜੋਖਮ', or:'ଉଚ୍ଚ ବିପଦ', as:'উচ্চ বিপদ',
      ur:'زیادہ خطرہ', sa:'अधिकं जोखिमम्',
    },
    'MEDIUM RISK': {
      en:'MEDIUM RISK', hi:'मध्यम जोखिम', bn:'মাঝারি ঝুঁকি', te:'మధ్యస్థ ప్రమాదం',
      ta:'நடுத்தர ஆபத்து', mr:'मध्यम जोखीम', gu:'મધ્યમ જોખમ', kn:'ಮಧ್ಯಮ ಅಪಾಯ',
      ml:'ഇടത്തരം അപകടം', pa:'ਦਰਮਿਆਨਾ ਜੋਖਮ', or:'ମଧ୍ୟମ ବିପଦ',
      as:'মধ্যমীয়া বিপদ', ur:'درمیانہ خطرہ', sa:'मध्यमं जोखिमम्',
    },
    'LOW RISK': {
      en:'LOW RISK', hi:'कम जोखिम', bn:'কম ঝুঁকি', te:'తక్కువ ప్రమాదం',
      ta:'குறைந்த ஆபத்து', mr:'कमी जोखीम', gu:'ઓછું જોખમ', kn:'ಕಡಿಮೆ ಅಪಾಯ',
      ml:'കുറഞ്ഞ അപകടം', pa:'ਘੱਟ ਜੋਖਮ', or:'କମ୍ ବିପଦ', as:'কম বিপদ',
      ur:'کم خطرہ', sa:'न्यूनं जोखिमम्',
    },
    'helped today': {
      en:'helped today', hi:'आज मदद की', bn:'আজ সাহায্য করেছে',
      te:'నేడు సహాయం చేసింది', ta:'இன்று உதவியது', mr:'आज मदत केली',
      gu:'આજે મદદ કરી', kn:'ಇಂದು ಸಹಾಯ ಮಾಡಿದೆ', ml:'ഇന്ന് സഹായിച്ചു',
      pa:'ਅੱਜ ਮਦਦ ਕੀਤੀ', or:'ଆଜି ସାହାଯ୍ୟ କଲା', as:'আজি সহায় কৰিলে',
      ur:'آج مدد کی', sa:'अद्य साहाय्यं कृतम्',
    },
    'Last audit:': {
      en:'Last audit:', hi:'अंतिम ऑडिट:', bn:'শেষ অডিট:',
      te:'చివరి ఆడిట్:', ta:'கடைசி தணிக்கை:', mr:'शेवटचे ऑडिट:',
      gu:'છેલ્લું ઓડિટ:', kn:'ಕೊನೆಯ ಪರಿಶೋಧನೆ:',
      ml:'അവസാന ഓഡിറ്റ്:', pa:'ਆਖਰੀ ਆਡਿਟ:', or:'ଶେଷ ଅଡିଟ୍:',
      as:'শেষৰ অডিট:', ur:'آخری آڈٹ:', sa:'अन्तिम-परीक्षणम्:',
    },
    // ── Feedback widget — modal body ────────────────────────────────
    '📣 Tell Chitti what was wrong': {
      en:'📣 Tell Chitti what was wrong', hi:'📣 चिट्टी को बताएं क्या गलत था',
      bn:'📣 চিট্টিকে বলুন কী ভুল ছিল', te:'📣 ఏం తప్పు జరిగిందో చిట్టికి చెప్పండి',
      ta:'📣 என்ன தவறு என்று சிட்டியிடம் சொல்லுங்கள்',
      mr:'📣 चिट्टीला सांगा काय चूक होती', gu:'📣 ચિટ્ટીને કહો શું ખોટું હતું',
      kn:'📣 ಏನು ತಪ್ಪಾಯಿತು ಎಂದು ಚಿಟ್ಟಿಗೆ ಹೇಳಿ',
      ml:'📣 എന്ത് തെറ്റിയെന്ന് ചിട്ടിയോട് പറയൂ',
      pa:'📣 ਚਿੱਟੀ ਨੂੰ ਦੱਸੋ ਕੀ ਗ਼ਲਤ ਸੀ', or:'📣 ଚିଟ୍ଟିଙ୍କୁ କୁହନ୍ତୁ କଣ ଭୁଲ ଥିଲା',
      as:'📣 চিট্টিক কওক কি ভুল হৈছিল', ur:'📣 چٹی کو بتائیں کیا غلط تھا',
      sa:'📣 चिट्टिं वदतु किम् अशुद्धम् आसीत्',
    },
    'What was wrong with this?': {
      en:'What was wrong with this?', hi:'इसमें क्या गलत था?',
      bn:'এটিতে কী ভুল ছিল?', te:'దీనిలో ఏం తప్పు ఉంది?',
      ta:'இதில் என்ன தவறு?', mr:'यात काय चूक होती?',
      gu:'આમાં શું ખોટું હતું?', kn:'ಇದರಲ್ಲಿ ಏನು ತಪ್ಪಿತ್ತು?',
      ml:'ഇതിൽ എന്താണ് തെറ്റ്?', pa:'ਇਸ ਵਿੱਚ ਕੀ ਗ਼ਲਤ ਸੀ?',
      or:'ଏଥିରେ କଣ ଭୁଲ ଥିଲା?', as:'ইয়াত কি ভুল আছিল?',
      ur:'اس میں کیا غلط تھا؟', sa:'अस्मिन् किम् अशुद्धम् आसीत्?',
    },
    'What went wrong?': {
      en:'What went wrong?', hi:'क्या गलत हुआ?', bn:'কী ভুল হল?',
      te:'ఏం తప్పు జరిగింది?', ta:'என்ன தவறு நடந்தது?',
      mr:'काय चूक झाली?', gu:'શું ખોટું થયું?', kn:'ಏನು ತಪ್ಪಾಯಿತು?',
      ml:'എന്ത് സംഭവിച്ചു?', pa:'ਕੀ ਗ਼ਲਤ ਹੋਇਆ?',
      or:'କଣ ଭୁଲ ହେଲା?', as:'কি ভুল হ\'ল?',
      ur:'کیا غلط ہوا؟', sa:'किम् अशुद्धम् अभवत्?',
    },
    'Type or record:': {
      en:'Type or record:', hi:'टाइप करें या रिकॉर्ड करें:',
      bn:'টাইপ বা রেকর্ড করুন:', te:'టైప్ చేయండి లేదా రికార్డ్ చేయండి:',
      ta:'தட்டச்சு செய்யவும் அல்லது பதிவு செய்யவும்:',
      mr:'टाइप करा किंवा रेकॉर्ड करा:', gu:'ટાઈપ કરો અથવા રેકોર્ડ કરો:',
      kn:'ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ರೆಕಾರ್ಡ್ ಮಾಡಿ:',
      ml:'ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ റെക്കോർഡ് ചെയ്യുക:',
      pa:'ਟਾਈਪ ਕਰੋ ਜਾਂ ਰਿਕਾਰਡ ਕਰੋ:', or:'ଟାଇପ୍ କରନ୍ତୁ କିମ୍ବା ରେକର୍ଡ କରନ୍ତୁ:',
      as:'টাইপ কৰক বা ৰেকৰ্ড কৰক:', ur:'ٹائپ کریں یا ریکارڈ کریں:',
      sa:'टंकयतु अथवा अभिलेखयतु:',
    },
    '🎙️ Record voice': {
      en:'🎙️ Record voice', hi:'🎙️ आवाज़ रिकॉर्ड करें', bn:'🎙️ ভয়েস রেকর্ড করুন',
      te:'🎙️ వాయిస్ రికార్డ్ చేయండి', ta:'🎙️ குரல் பதிவு செய்யவும்',
      mr:'🎙️ आवाज रेकॉर्ड करा', gu:'🎙️ અવાજ રેકોર્ડ કરો',
      kn:'🎙️ ಧ್ವನಿಯನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ', ml:'🎙️ ശബ്ദം റെക്കോർഡ് ചെയ്യുക',
      pa:'🎙️ ਆਵਾਜ਼ ਰਿਕਾਰਡ ਕਰੋ', or:'🎙️ ସ୍ୱର ରେକର୍ଡ କରନ୍ତୁ',
      as:'🎙️ মাত ৰেকৰ্ড কৰক', ur:'🎙️ آواز ریکارڈ کریں',
      sa:'🎙️ शब्दम् अभिलेखयतु',
    },
    '🎙️ Listening…': {
      en:'🎙️ Listening…', hi:'🎙️ सुन रहा हूं…', bn:'🎙️ শুনছি…',
      te:'🎙️ వింటున్నాను…', ta:'🎙️ கேட்கிறேன்…', mr:'🎙️ ऐकत आहे…',
      gu:'🎙️ સાંભળું છું…', kn:'🎙️ ಕೇಳುತ್ತಿದ್ದೇನೆ…',
      ml:'🎙️ കേൾക്കുന്നു…', pa:'🎙️ ਸੁਣ ਰਿਹਾ ਹਾਂ…', or:'🎙️ ଶୁଣୁଛି…',
      as:'🎙️ শুনি আছোঁ…', ur:'🎙️ سن رہا ہوں…', sa:'🎙️ शृणोमि…',
    },
    'Cancel': {
      en:'Cancel', hi:'रद्द करें', bn:'বাতিল', te:'రద్దు చేయండి',
      ta:'ரத்து செய்', mr:'रद्द करा', gu:'રદ કરો', kn:'ರದ್ದು ಮಾಡಿ',
      ml:'റദ്ദാക്കുക', pa:'ਰੱਦ ਕਰੋ', or:'ବାତିଲ', as:'বাতিল',
      ur:'منسوخ کریں', sa:'निरस्तं कुर्वतु',
    },
    'Submit': {
      en:'Submit', hi:'भेजें', bn:'জমা দিন', te:'సమర్పించండి',
      ta:'சமர்ப்பி', mr:'सबमिट करा', gu:'સબમિટ કરો', kn:'ಸಲ್ಲಿಸಿ',
      ml:'സമർപ്പിക്കുക', pa:'ਜਮ੍ਹਾਂ ਕਰੋ', or:'ଦାଖଲ କରନ୍ତୁ',
      as:'জমা দিয়ক', ur:'جمع کریں', sa:'समर्पयतु',
    },

    // ── QR block ────────────────────────────────────────────────────
    '📱 Open on phone': {
      en:'📱 Open on phone', hi:'📱 फ़ोन पर खोलें', bn:'📱 ফোনে খুলুন',
      te:'📱 ఫోన్‌లో తెరవండి', ta:'📱 ஃபோனில் திற', mr:'📱 फोनवर उघडा',
      gu:'📱 ફોન પર ખોલો', kn:'📱 ಫೋನ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ',
      ml:'📱 ഫോണിൽ തുറക്കുക', pa:'📱 ਫ਼ੋਨ \'ਤੇ ਖੋਲ੍ਹੋ',
      or:'📱 ଫୋନରେ ଖୋଲନ୍ତୁ', as:'📱 ফোনত খোলক',
      ur:'📱 فون پر کھولیں', sa:'📱 दूरभाष्ये उद्घाटयतु',
    },
    'Scan to open Vaani on your phone. Voice-first. Free. Works in 26 Indian languages.': {
      en:'Scan to open Vaani on your phone. Voice-first. Free. Works in 26 Indian languages.',
      hi:'अपने फोन पर वाणी खोलने के लिए स्कैन करें। वॉइस-फर्स्ट। मुफ़्त। 26 भारतीय भाषाओं में काम करता है।',
      bn:'আপনার ফোনে বানী খুলতে স্ক্যান করুন। ভয়েস-ফার্স্ট। বিনামূল্যে। ২৬টি ভারতীয় ভাষায় কাজ করে।',
      te:'మీ ఫోన్‌లో వాణిని తెరవడానికి స్కాన్ చేయండి. వాయిస్-ఫస్ట్. ఉచితం. 26 భారతీయ భాషల్లో పనిచేస్తుంది.',
      ta:'உங்கள் ஃபோனில் வாணியை திறக்க ஸ்கேன் செய்யவும். குரல்-முதல். இலவசம். 26 இந்திய மொழிகளில் வேலை செய்கிறது.',
      mr:'तुमच्या फोनवर वाणी उघडण्यासाठी स्कॅन करा. आवाज-प्रथम. विनामूल्य. 26 भारतीय भाषांमध्ये काम करते.',
      gu:'તમારા ફોન પર વાણી ખોલવા માટે સ્કેન કરો. વૉઇસ-ફર્સ્ટ. મફત. 26 ભારતીય ભાષાઓમાં કામ કરે છે.',
      kn:'ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲಿ ವಾಣಿಯನ್ನು ತೆರೆಯಲು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ. ಧ್ವನಿ-ಮೊದಲು. ಉಚಿತ. 26 ಭಾರತೀಯ ಭಾಷೆಗಳಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ.',
      ml:'നിങ്ങളുടെ ഫോണിൽ വാണി തുറക്കാൻ സ്കാൻ ചെയ്യുക. വോയ്സ്-ഫസ്റ്റ്. സൗജന്യം. 26 ഇന്ത്യൻ ഭാഷകളിൽ പ്രവർത്തിക്കുന്നു.',
      pa:'ਆਪਣੇ ਫ਼ੋਨ \'ਤੇ ਵਾਣੀ ਖੋਲ੍ਹਣ ਲਈ ਸਕੈਨ ਕਰੋ। ਆਵਾਜ਼-ਪਹਿਲਾਂ। ਮੁਫ਼ਤ। 26 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਕੰਮ ਕਰਦਾ ਹੈ।',
      or:'ଆପଣଙ୍କ ଫୋନରେ ବାଣୀ ଖୋଲିବାକୁ ସ୍କାନ୍ କରନ୍ତୁ। ସ୍ୱର-ପ୍ରଥମ। ମାଗଣା। 26ଟି ଭାରତୀୟ ଭାଷାରେ କାର୍ଯ୍ୟ କରେ।',
      as:'আপোনাৰ ফোনত বাণী খুলিবলৈ স্কেন কৰক। ভইচ-প্ৰথম। বিনামূলীয়া। 26টা ভাৰতীয় ভাষাত কাম কৰে।',
      ur:'اپنے فون پر وانی کھولنے کے لیے سکین کریں۔ آواز-پہلے۔ مفت۔ 26 ہندوستانی زبانوں میں کام کرتا ہے۔',
      sa:'भवतः दूरभाष्ये वाणीम् उद्घाटयितुं स्कैन् कुर्वतु। शब्दः प्रथमः। निःशुल्कम्। 26 भारतीय-भाषासु कार्यं करोति।',
    },
    // Page-footer feedback wrap — aria-labels.
    'Help us build better Chitti': {
      en:'Help us build better Chitti', hi:'चिट्टी को बेहतर बनाने में हमारी मदद करें',
      bn:'চিট্টিকে আরও ভালো করতে আমাদের সাহায্য করুন',
      te:'చిట్టిని మెరుగుపరచడంలో మాకు సహాయపడండి',
      ta:'சிட்டியை மேம்படுத்த எங்களுக்கு உதவுங்கள்',
      mr:'चिट्टीला अधिक चांगले बनवण्यास मदत करा',
      gu:'ચિટ્ટીને વધુ સારી બનાવવામાં મદદ કરો',
      kn:'ಚಿಟ್ಟಿಯನ್ನು ಉತ್ತಮಗೊಳಿಸಲು ನಮಗೆ ಸಹಾಯ ಮಾಡಿ',
      ml:'ചിട്ടിയെ മികച്ചതാക്കാൻ സഹായിക്കൂ',
      pa:'ਚਿੱਟੀ ਨੂੰ ਬਿਹਤਰ ਬਣਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰੋ',
      or:'ଚିଟ୍ଟିକୁ ଅଧିକ ଭଲ କରିବାରେ ସାହାଯ୍ୟ କରନ୍ତୁ',
      as:'চিট্টিক উন্নত কৰাত সহায় কৰক',
      ur:'چٹی کو بہتر بنانے میں ہماری مدد کریں',
      sa:'चिट्टिं अधिकं श्रेष्ठां कर्तुं अस्मान् साहाय्यं कुरुत',
    },
    'Chitti — read this page aloud': {
      en:'Chitti — read this page aloud', hi:'चिट्टी — इस पन्ने को ज़ोर से पढ़ें',
      bn:'চিট্টি — এই পেজ জোরে পড়ুন',
      te:'చిట్టి — ఈ పేజీని బిగ్గరగా చదవండి',
      ta:'சிட்டி — இந்த பக்கத்தை சத்தமாக படிக்கவும்',
      mr:'चिट्टी — हा पृष्ठ मोठ्याने वाचा',
      gu:'ચિટ્ટી — આ પેજ મોટેથી વાંચો',
      kn:'ಚಿಟ್ಟಿ — ಈ ಪುಟವನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ',
      ml:'ചിട്ടി — ഈ പേജ് ഉറക്കെ വായിക്കുക',
      pa:'ਚਿੱਟੀ — ਇਸ ਪੰਨੇ ਨੂੰ ਉੱਚੀ ਆਵਾਜ਼ ਵਿੱਚ ਪੜ੍ਹੋ',
      or:'ଚିଟ୍ଟି — ଏହି ପୃଷ୍ଠାକୁ ଉଚ୍ଚ ସ୍ୱରରେ ପଢ଼ନ୍ତୁ',
      as:'চিট্টি — এই পৃষ্ঠাটো উচ্চস্বৰে পঢ়ক',
      ur:'چٹی — اس صفحے کو بلند آواز سے پڑھیں',
      sa:'चिट्टि — एतत् पृष्ठम् उच्चैः पठतु',
    },
    'Talk to Chitti': {
      en:'Talk to Chitti', hi:'चिट्टी से बात करें', bn:'চিট্টির সাথে কথা বলুন',
      te:'చిట్టితో మాట్లాడండి', ta:'சிட்டியுடன் பேசுங்கள்',
      mr:'चिट्टीशी बोला', gu:'ચિટ્ટી સાથે વાત કરો',
      kn:'ಚಿಟ್ಟಿಯೊಂದಿಗೆ ಮಾತನಾಡಿ', ml:'ചിട്ടിയോട് സംസാരിക്കുക',
      pa:'ਚਿੱਟੀ ਨਾਲ ਗੱਲ ਕਰੋ', or:'ଚିଟ୍ଟି ସହିତ କଥା ହୁଅନ୍ତୁ',
      as:'চিট্টিৰ লগত কথা পাতক', ur:'چٹی سے بات کریں',
      sa:'चिट्टिना सह वार्तां कुरुत',
    },
    'This page was helpful': {
      en:'This page was helpful', hi:'यह पन्ना उपयोगी था',
      bn:'এই পেজ সহায়ক ছিল', te:'ఈ పేజీ ఉపయోగపడింది',
      ta:'இந்த பக்கம் உதவியாக இருந்தது', mr:'हा पृष्ठ उपयुक्त होता',
      gu:'આ પેજ મદદરૂપ હતું', kn:'ಈ ಪುಟ ಸಹಾಯಕವಾಗಿತ್ತು',
      ml:'ഈ പേജ് സഹായകമായിരുന്നു', pa:'ਇਹ ਪੰਨਾ ਮਦਦਗਾਰ ਸੀ',
      or:'ଏହି ପୃଷ୍ଠା ସହାୟକ ଥିଲା', as:'এই পৃষ্ঠাটো সহায়ক আছিল',
      ur:'یہ صفحہ مددگار تھا', sa:'एतत् पृष्ठम् उपयोगि आसीत्',
    },
    'Something did not work': {
      en:'Something did not work', hi:'कुछ काम नहीं किया',
      bn:'কিছু কাজ করেনি', te:'ఏదో పనిచేయలేదు',
      ta:'எதோ வேலை செய்யவில்லை', mr:'काहीतरी काम केले नाही',
      gu:'કંઈક કામ ન કર્યું', kn:'ಏನೋ ಕೆಲಸ ಮಾಡಲಿಲ್ಲ',
      ml:'എന്തോ പ്രവർത്തിച്ചില്ല', pa:'ਕੁਝ ਕੰਮ ਨਹੀਂ ਕੀਤਾ',
      or:'କିଛି କାମ କଲା ନାହିଁ', as:'কিবা কাম নকৰিলে',
      ur:'کچھ کام نہیں ہوا', sa:'किमपि कार्यं नाकरोत्',
    },
    'Report a problem with this page': {
      en:'Report a problem with this page',
      hi:'इस पन्ने की समस्या बताएं',
      bn:'এই পেজের সমস্যা জানান',
      te:'ఈ పేజీ సమస్యను తెలియజేయండి',
      ta:'இந்த பக்கத்தின் பிரச்சனையை தெரிவிக்கவும்',
      mr:'या पृष्ठाची समस्या कळवा',
      gu:'આ પેજની સમસ્યા જણાવો',
      kn:'ಈ ಪುಟದ ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ',
      ml:'ഈ പേജിന്റെ പ്രശ്നം അറിയിക്കുക',
      pa:'ਇਸ ਪੰਨੇ ਦੀ ਸਮੱਸਿਆ ਦੱਸੋ',
      or:'ଏହି ପୃଷ୍ଠାର ସମସ୍ୟା ଜଣାନ୍ତୁ',
      as:'এই পৃষ্ঠাটোৰ সমস্যা জনাওক',
      ur:'اس صفحے کا مسئلہ بتائیں',
      sa:'एतस्य पृष्ठस्य समस्यां वदतु',
    },
    'Trust signals': {
      en:'Trust signals', hi:'विश्वास संकेत', bn:'বিশ্বাসের সংকেত',
      te:'విశ్వాస సూచనలు', ta:'நம்பிக்கை சமிக்ஞைகள்',
      mr:'विश्वास संकेत', gu:'વિશ્વાસ સંકેતો',
      kn:'ವಿಶ್ವಾಸ ಸಂಕೇತಗಳು', ml:'വിശ്വാസ സൂചനകൾ',
      pa:'ਭਰੋਸੇ ਦੇ ਸੰਕੇਤ', or:'ବିଶ୍ୱାସ ସଙ୍କେତ',
      as:'বিশ্বাসৰ সংকেত', ur:'بھروسے کے اشارے',
      sa:'विश्वास-सङ्केताः',
    },
    'Record voice feedback': {
      en:'Record voice feedback', hi:'आवाज़ में प्रतिक्रिया रिकॉर्ड करें',
      bn:'ভয়েস মতামত রেকর্ড করুন', te:'వాయిస్ అభిప్రాయాన్ని రికార్డ్ చేయండి',
      ta:'குரல் கருத்தை பதிவு செய்யவும்', mr:'आवाज अभिप्राय रेकॉर्ड करा',
      gu:'અવાજ પ્રતિસાદ રેકોર્ડ કરો', kn:'ಧ್ವನಿ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ',
      ml:'ശബ്ദ പ്രതികരണം റെക്കോർഡ് ചെയ്യുക', pa:'ਆਵਾਜ਼ ਫੀਡਬੈਕ ਰਿਕਾਰਡ ਕਰੋ',
      or:'ସ୍ୱର ମତାମତ ରେକର୍ଡ କରନ୍ତୁ', as:'মাতৰ মতামত ৰেকৰ্ড কৰক',
      ur:'آواز رائے ریکارڈ کریں', sa:'शब्द-प्रतिक्रियाम् अभिलेखयतु',
    },
    'Risk level for this Chitti': {
      en:'Risk level for this Chitti', hi:'इस चिट्टी का जोखिम स्तर',
      bn:'এই চিট্টির ঝুঁকির স্তর', te:'ఈ చిట్టి ప్రమాద స్థాయి',
      ta:'இந்த சிட்டியின் ஆபத்து நிலை', mr:'या चिट्टीची जोखीम पातळी',
      gu:'આ ચિટ્ટીનું જોખમ સ્તર', kn:'ಈ ಚಿಟ್ಟಿಯ ಅಪಾಯ ಮಟ್ಟ',
      ml:'ഈ ചിട്ടിയുടെ അപകട നില', pa:'ਇਸ ਚਿੱਟੀ ਦਾ ਜੋਖਮ ਪੱਧਰ',
      or:'ଏହି ଚିଟ୍ଟିର ବିପଦ ସ୍ତର', as:'এই চিট্টিৰ বিপদৰ স্তৰ',
      ur:'اس چٹی کا خطرے کا درجہ', sa:'अस्याः चिट्ट्याः जोखिम-स्तरः',
    },
    'Carbon footprint of this reply': {
      en:'Carbon footprint of this reply', hi:'इस उत्तर का कार्बन प्रभाव',
      bn:'এই উত্তরের কার্বন ফুটপ্রিন্ট', te:'ఈ సమాధానం యొక్క కార్బన్ ఫుట్‌ప్రింట్',
      ta:'இந்த பதிலின் கார்பன் தடம்', mr:'या उत्तराचा कार्बन प्रभाव',
      gu:'આ જવાબનો કાર્બન પ્રભાવ', kn:'ಈ ಉತ್ತರದ ಕಾರ್ಬನ್ ಹೆಜ್ಜೆಗುರುತು',
      ml:'ഈ മറുപടിയുടെ കാർബൺ കാൽപ്പാട്', pa:'ਇਸ ਜਵਾਬ ਦਾ ਕਾਰਬਨ ਪ੍ਰਭਾਵ',
      or:'ଏହି ଉତ୍ତରର କାର୍ବନ ପ୍ରଭାବ',
      as:'এই উত্তৰৰ কাৰ্বন প্ৰভাৱ', ur:'اس جواب کا کاربن اثر',
      sa:'अस्य प्रत्युत्तरस्य कार्बन-प्रभावः',
    },
    'Last Chitti Quality audit': {
      en:'Last Chitti Quality audit', hi:'अंतिम चिट्टी क्वालिटी ऑडिट',
      bn:'শেষ চিট্টি কোয়ালিটি অডিট', te:'చివరి చిట్టి క్వాలిటీ ఆడిట్',
      ta:'கடைசி சிட்டி தர தணிக்கை', mr:'शेवटचे चिट्टी क्वालिटी ऑडिट',
      gu:'છેલ્લું ચિટ્ટી ક્વોલિટી ઓડિટ', kn:'ಕೊನೆಯ ಚಿಟ್ಟಿ ಕ್ವಾಲಿಟಿ ಪರಿಶೋಧನೆ',
      ml:'അവസാന ചിട്ടി ക്വാളിറ്റി ഓഡിറ്റ്', pa:'ਆਖਰੀ ਚਿੱਟੀ ਕੁਆਲਿਟੀ ਆਡਿਟ',
      or:'ଶେଷ ଚିଟ୍ଟି କ୍ୱାଲିଟି ଅଡିଟ୍',
      as:'শেহতীয়া চিট্টি কোৱালিটি অডিট',
      ur:'آخری چٹی کوالٹی آڈٹ', sa:'अन्तिमम् चिट्टि-गुण-परीक्षणम्',
    },
    'Indians helped today by this Chitti': {
      en:'Indians helped today by this Chitti',
      hi:'इस चिट्टी ने आज जिन भारतीयों की मदद की',
      bn:'এই চিট্টি আজ যেসব ভারতীয়ের সাহায্য করেছে',
      te:'ఈ చిట్టి నేడు సహాయం చేసిన భారతీయులు',
      ta:'இந்த சிட்டி இன்று உதவிய இந்தியர்கள்',
      mr:'या चिट्टीने आज मदत केलेले भारतीय',
      gu:'આ ચિટ્ટીએ આજે મદદ કરેલા ભારતીયો',
      kn:'ಇಂದು ಈ ಚಿಟ್ಟಿ ಸಹಾಯ ಮಾಡಿದ ಭಾರತೀಯರು',
      ml:'ഇന്ന് ഈ ചിട്ടി സഹായിച്ച ഇന്ത്യക്കാർ',
      pa:'ਅੱਜ ਇਸ ਚਿੱਟੀ ਨੇ ਜਿਨ੍ਹਾਂ ਭਾਰਤੀਆਂ ਦੀ ਮਦਦ ਕੀਤੀ',
      or:'ଆଜି ଏହି ଚିଟ୍ଟି ଯେତିକି ଭାରତୀୟଙ୍କୁ ସାହାଯ୍ୟ କଲା',
      as:'আজি এই চিট্টিয়ে সহায় কৰা ভাৰতীয়সকল',
      ur:'آج اس چٹی نے جن ہندوستانیوں کی مدد کی',
      sa:'अद्य अस्याः चिट्ट्याः साहाय्यं प्राप्तवन्तः भारतीयाः',
    },
    'Per-response feedback': {
      en:'Per-response feedback', hi:'प्रति-उत्तर प्रतिक्रिया',
      bn:'প্রতি-উত্তর মতামত', te:'ప్రతి-సమాధాన అభిప్రాయం',
      ta:'ஒவ்வொரு பதிலுக்கும் கருத்து', mr:'प्रति-उत्तर अभिप्राय',
      gu:'દરેક પ્રતિસાદ માટે અભિપ્રાય', kn:'ಪ್ರತಿ-ಪ್ರತಿಕ್ರಿಯೆ ಅಭಿಪ್ರಾಯ',
      ml:'ഓരോ പ്രതികരണത്തിനും ഫീഡ്ബാക്ക്', pa:'ਹਰ ਜਵਾਬ ਲਈ ਫੀਡਬੈਕ',
      or:'ପ୍ରତି-ଉତ୍ତର ମତାମତ', as:'প্ৰতি-উত্তৰ মতামত',
      ur:'ہر جواب کے لیے رائے', sa:'प्रति-प्रत्युत्तर-प्रतिक्रिया',
    },
    'QR code — open this Chitti on your phone': {
      en:'QR code — open this Chitti on your phone',
      hi:'QR कोड — इस चिट्टी को अपने फ़ोन पर खोलें',
      bn:'QR কোড — এই চিট্টিকে আপনার ফোনে খুলুন',
      te:'QR కోడ్ — ఈ చిట్టిని మీ ఫోన్‌లో తెరవండి',
      ta:'QR குறியீடு — இந்த சிட்டியை உங்கள் ஃபோனில் திற',
      mr:'QR कोड — हा चिट्टी तुमच्या फोनवर उघडा',
      gu:'QR કોડ — આ ચિટ્ટીને તમારા ફોન પર ખોલો',
      kn:'QR ಕೋಡ್ — ಈ ಚಿಟ್ಟಿಯನ್ನು ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ',
      ml:'QR കോഡ് — ഈ ചിട്ടി നിങ്ങളുടെ ഫോണിൽ തുറക്കുക',
      pa:'QR ਕੋਡ — ਇਸ ਚਿੱਟੀ ਨੂੰ ਆਪਣੇ ਫ਼ੋਨ \'ਤੇ ਖੋਲ੍ਹੋ',
      or:'QR କୋଡ — ଏହି ଚିଟ୍ଟିକୁ ଆପଣଙ୍କ ଫୋନରେ ଖୋଲନ୍ତୁ',
      as:'QR ক\'ড — এই চিট্টিক আপোনাৰ ফোনত খোলক',
      ur:'QR کوڈ — اس چٹی کو اپنے فون پر کھولیں',
      sa:'QR सङ्केतः — एताम् चिट्टिं भवतः दूरभाष्ये उद्घाटयतु',
    },
    'QR — open on phone': {
      en:'QR — open on phone', hi:'QR — फ़ोन पर खोलें', bn:'QR — ফোনে খুলুন',
      te:'QR — ఫోన్‌లో తెరవండి', ta:'QR — ஃபோனில் திற', mr:'QR — फोनवर उघडा',
      gu:'QR — ફોન પર ખોલો', kn:'QR — ಫೋನ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ',
      ml:'QR — ഫോണിൽ തുറക്കുക', pa:'QR — ਫ਼ੋਨ \'ਤੇ ਖੋਲ੍ਹੋ',
      or:'QR — ଫୋନରେ ଖୋଲନ୍ତୁ', as:'QR — ফোনত খোলক',
      ur:'QR — فون پر کھولیں', sa:'QR — दूरभाष्ये उद्घाटयतु',
    },

    // ── Vaani page residue ──────────────────────────────────────────
    '🛡️ Chitti can act for you': {
      en:'🛡️ Chitti can act for you', hi:'🛡️ चिट्टी आपके लिए कार्य कर सकता है',
      bn:'🛡️ চিট্টি আপনার জন্য কাজ করতে পারে',
      te:'🛡️ చిట్టి మీ కోసం పనిచేయగలదు', ta:'🛡️ சிட்டி உங்களுக்காக செயல்பட முடியும்',
      mr:'🛡️ चिट्टी तुमच्यासाठी कार्य करू शकते',
      gu:'🛡️ ચિટ્ટી તમારા માટે કાર્ય કરી શકે છે',
      kn:'🛡️ ಚಿಟ್ಟಿ ನಿಮ್ಮ ಪರವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸಬಲ್ಲದು',
      ml:'🛡️ ചിട്ടി നിങ്ങൾക്കായി പ്രവർത്തിക്കാൻ കഴിയും',
      pa:'🛡️ ਚਿੱਟੀ ਤੁਹਾਡੇ ਲਈ ਕੰਮ ਕਰ ਸਕਦੀ ਹੈ',
      or:'🛡️ ଚିଟ୍ଟି ଆପଣଙ୍କ ପାଇଁ କାର୍ଯ୍ୟ କରିପାରେ',
      as:'🛡️ চিট্টিয়ে আপোনাৰ বাবে কাম কৰিব পাৰে',
      ur:'🛡️ چٹی آپ کے لیے کام کر سکتی ہے',
      sa:'🛡️ चिट्टिः भवतः कृते कार्यं कर्तुं शक्नोति',
    },
    '📱 some need Android Phase 2': {
      en:'📱 some need Android Phase 2', hi:'📱 कुछ को Android Phase 2 चाहिए',
      bn:'📱 কিছুর জন্য Android Phase 2 দরকার',
      te:'📱 కొన్నింటికి Android Phase 2 అవసరం',
      ta:'📱 சிலவற்றுக்கு Android Phase 2 தேவை',
      mr:'📱 काहींना Android Phase 2 आवश्यक',
      gu:'📱 કેટલીકને Android Phase 2 જરૂરી',
      kn:'📱 ಕೆಲವಕ್ಕೆ Android Phase 2 ಅಗತ್ಯ',
      ml:'📱 ചിലത് Android Phase 2 ആവശ്യം',
      pa:'📱 ਕੁਝ ਲਈ Android Phase 2 ਚਾਹੀਦਾ',
      or:'📱 କେତେକ ପାଇଁ Android Phase 2 ଦରକାର',
      as:'📱 কিছুমানৰ Android Phase 2 দৰকাৰ',
      ur:'📱 کچھ کے لیے Android Phase 2 ضروری',
      sa:'📱 केषाञ्चित् Android Phase 2 आवश्यकम्',
    },
    'Talk to Chitti': {
      en:'Talk to Chitti', hi:'चिट्टी से बात करें', bn:'চিট্টির সাথে কথা বলুন',
      te:'చిట్టితో మాట్లాడండి', ta:'சிட்டியுடன் பேசுங்கள்',
      mr:'चिट्टीशी बोला', gu:'ચિટ્ટી સાથે વાત કરો',
      kn:'ಚಿಟ್ಟಿಯೊಂದಿಗೆ ಮಾತನಾಡಿ', ml:'ചിട്ടിയോട് സംസാരിക്കുക',
      pa:'ਚਿੱਟੀ ਨਾਲ ਗੱਲ ਕਰੋ', or:'ଚିଟ୍ଟି ସହିତ କଥା ହୁଅନ୍ତୁ',
      as:'চিট্টিৰ লগত কথা পাতক', ur:'چٹی سے بات کریں',
      sa:'चिट्टिना सह वार्तां कुरुत',
    },
    '⚡ Quick actions': {
      en:'⚡ Quick actions', hi:'⚡ त्वरित कार्य', bn:'⚡ দ্রুত পদক্ষেপ',
      te:'⚡ త్వరిత చర్యలు', ta:'⚡ விரைவான செயல்கள்',
      mr:'⚡ झटपट क्रिया', gu:'⚡ ઝડપી ક્રિયાઓ',
      kn:'⚡ ತ್ವರಿತ ಕ್ರಮಗಳು', ml:'⚡ ദ്രുത പ്രവർത്തനങ്ങൾ',
      pa:'⚡ ਤੁਰੰਤ ਕਾਰਵਾਈਆਂ', or:'⚡ ତ୍ୱରିତ କାର୍ଯ୍ୟଗୁଡ଼ିକ',
      as:'⚡ দ্ৰুত কাৰ্য', ur:'⚡ فوری اعمال',
      sa:'⚡ शीघ्र-कार्याणि',
    },
    '🕘 Recent': {
      en:'🕘 Recent', hi:'🕘 हाल ही में', bn:'🕘 সাম্প্রতিক',
      te:'🕘 ఇటీవలి', ta:'🕘 சமீபத்திய', mr:'🕘 अलीकडील',
      gu:'🕘 તાજેતરના', kn:'🕘 ಇತ್ತೀಚಿನ', ml:'🕘 സമീപകാല',
      pa:'🕘 ਹਾਲੀਆ', or:'🕘 ସମ୍ପ୍ରତିକ', as:'🕘 শেহতীয়া',
      ur:'🕘 حالیہ', sa:'🕘 साम्प्रतिकम्',
    },
    '👨‍👩‍👧 Trusted Circle': {
      en:'👨‍👩‍👧 Trusted Circle', hi:'👨‍👩‍👧 भरोसेमंद घेरा',
      bn:'👨‍👩‍👧 বিশ্বস্ত বৃত্ত', te:'👨‍👩‍👧 విశ్వసనీయ వలయం',
      ta:'👨‍👩‍👧 நம்பகமான வட்டம்', mr:'👨‍👩‍👧 विश्वासू वर्तुळ',
      gu:'👨‍👩‍👧 વિશ્વસનીય વર્તુળ', kn:'👨‍👩‍👧 ವಿಶ್ವಾಸಾರ್ಹ ವಲಯ',
      ml:'👨‍👩‍👧 വിശ്വസ്ത വൃത്തം', pa:'👨‍👩‍👧 ਭਰੋਸੇਮੰਦ ਘੇਰਾ',
      or:'👨‍👩‍👧 ବିଶ୍ୱାସଯୋଗ୍ୟ ବୃତ୍ତ', as:'👨‍👩‍👧 বিশ্বাসী চক্ৰ',
      ur:'👨‍👩‍👧 قابل بھروسہ حلقہ', sa:'👨‍👩‍👧 विश्वसनीय-वलयम्',
    },
    '🔗 Chitti-to-Chitti emergency pairs': {
      en:'🔗 Chitti-to-Chitti emergency pairs', hi:'🔗 चिट्टी-से-चिट्टी आपातकालीन जोड़े',
      bn:'🔗 চিট্টি-থেকে-চিট্টি জরুরি জুটি',
      te:'🔗 చిట్టి-నుండి-చిట్టి అత్యవసర జతలు',
      ta:'🔗 சிட்டி-முதல்-சிட்டி அவசர ஜோடிகள்',
      mr:'🔗 चिट्टी-ते-चिट्टी आपत्कालीन जोड्या',
      gu:'🔗 ચિટ્ટી-થી-ચિટ્ટી કટોકટી જોડીઓ',
      kn:'🔗 ಚಿಟ್ಟಿ-ಯಿಂದ-ಚಿಟ್ಟಿ ತುರ್ತು ಜೋಡಿಗಳು',
      ml:'🔗 ചിട്ടി-ടു-ചിട്ടി അടിയന്തര ജോഡികൾ',
      pa:'🔗 ਚਿੱਟੀ-ਤੋਂ-ਚਿੱਟੀ ਐਮਰਜੈਂਸੀ ਜੋੜੇ',
      or:'🔗 ଚିଟ୍ଟି-ରୁ-ଚିଟ୍ଟି ଜରୁରୀ ଯୋଡ଼ି',
      as:'🔗 চিট্টি-ৰ পৰা-চিট্টি জৰুৰীকালীন যোৰ',
      ur:'🔗 چٹی-سے-چٹی ہنگامی جوڑے',
      sa:'🔗 चिट्टि-तः-चिट्टि-आपातकालीन-युगलानि',
    },
    '📜 What Chitti did for you': {
      en:'📜 What Chitti did for you', hi:'📜 चिट्टी ने आपके लिए क्या किया',
      bn:'📜 চিট্টি আপনার জন্য কী করেছে',
      te:'📜 చిట్టి మీ కోసం ఏం చేసింది', ta:'📜 சிட்டி உங்களுக்காக என்ன செய்தது',
      mr:'📜 चिट्टीने तुमच्यासाठी काय केले',
      gu:'📜 ચિટ્ટીએ તમારા માટે શું કર્યું',
      kn:'📜 ಚಿಟ್ಟಿ ನಿಮಗಾಗಿ ಏನು ಮಾಡಿತು',
      ml:'📜 ചിട്ടി നിങ്ങൾക്കായി എന്ത് ചെയ്തു',
      pa:'📜 ਚਿੱਟੀ ਨੇ ਤੁਹਾਡੇ ਲਈ ਕੀ ਕੀਤਾ',
      or:'📜 ଚିଟ୍ଟି ଆପଣଙ୍କ ପାଇଁ କଣ କଲା',
      as:'📜 চিট্টিয়ে আপোনাৰ বাবে কি কৰিলে',
      ur:'📜 چٹی نے آپ کے لیے کیا کیا',
      sa:'📜 चिट्टिः भवतः कृते किं कृतवती',
    },

    // ── Tap-to-X help strip on the page-footer widget ────────────────
    'Tap': {
      en:'Tap', hi:'टैप करें', bn:'ট্যাপ করুন', te:'ట్యాప్ చేయండి',
      ta:'தட்டவும்', mr:'टॅप करा', gu:'ટેપ કરો', kn:'ಟ್ಯಾಪ್ ಮಾಡಿ',
      ml:'ടാപ്പ് ചെയ്യുക', pa:'ਟੈਪ ਕਰੋ', or:'ଟ୍ୟାପ୍ କରନ୍ତୁ', as:'টেপ কৰক',
      ur:'ٹیپ کریں', sa:'स्पृशतु',
    },
    'to listen': {
      en:'to listen', hi:'सुनने के लिए', bn:'শুনতে', te:'వినడానికి',
      ta:'கேட்க', mr:'ऐकण्यासाठी', gu:'સાંભળવા માટે', kn:'ಕೇಳಲು',
      ml:'കേൾക്കാൻ', pa:'ਸੁਣਨ ਲਈ', or:'ଶୁଣିବାକୁ', as:'শুনিবলৈ',
      ur:'سننے کے لیے', sa:'श्रोतुम्',
    },
    'to talk to Chitti': {
      en:'to talk to Chitti', hi:'चिट्टी से बात करने के लिए',
      bn:'চিট্টির সাথে কথা বলতে', te:'చిట్టితో మాట్లాడడానికి',
      ta:'சிட்டியுடன் பேச', mr:'चिट्टीशी बोलण्यासाठी',
      gu:'ચિટ્ટી સાથે વાત કરવા માટે', kn:'ಚಿಟ್ಟಿಯೊಂದಿಗೆ ಮಾತನಾಡಲು',
      ml:'ചിട്ടിയോട് സംസാരിക്കാൻ', pa:'ਚਿੱਟੀ ਨਾਲ ਗੱਲ ਕਰਨ ਲਈ',
      or:'ଚିଟ୍ଟି ସହିତ କଥା ହେବାକୁ', as:'চিট্টিৰ লগত কথা পাতিবলৈ',
      ur:'چٹی سے بات کرنے کے لیے', sa:'चिट्टिना सह संभाषितुम्',
    },
    'if helpful': {
      en:'if helpful', hi:'अगर उपयोगी हो', bn:'যদি সহায়ক হয়',
      te:'ఉపయోగపడితే', ta:'பயனுள்ளதாக இருந்தால்',
      mr:'उपयुक्त असल्यास', gu:'ઉપયોગી હોય તો',
      kn:'ಸಹಾಯಕವಾಗಿದ್ದರೆ', ml:'സഹായകമെങ്കിൽ',
      pa:'ਜੇ ਮਦਦਗਾਰ ਹੈ', or:'ଯଦି ସହାୟକ', as:'যদি সহায়ক',
      ur:'اگر مددگار', sa:'यदि उपयोगि',
    },
    'and tell Chitti': {
      en:'and tell Chitti', hi:'और चिट्टी को बताएं',
      bn:'এবং চিট্টিকে বলুন', te:'మరియు చిట్టికి చెప్పండి',
      ta:'மற்றும் சிட்டியிடம் சொல்லுங்கள்', mr:'आणि चिट्टीला सांगा',
      gu:'અને ચિટ્ટીને કહો', kn:'ಮತ್ತು ಚಿಟ್ಟಿಗೆ ಹೇಳಿ',
      ml:'കൂടാതെ ചിട്ടിയോട് പറയൂ', pa:'ਅਤੇ ਚਿੱਟੀ ਨੂੰ ਦੱਸੋ',
      or:'ଏବଂ ଚିଟ୍ଟିଙ୍କୁ କୁହନ୍ତୁ', as:'আৰু চিট্টিক কওক',
      ur:'اور چٹی کو بتائیں', sa:'चिट्टिं वदतु च',
    },
    'in your language': {
      en:'in your language', hi:'अपनी भाषा में',
      bn:'আপনার ভাষায়', te:'మీ భాషలో', ta:'உங்கள் மொழியில்',
      mr:'तुमच्या भाषेत', gu:'તમારી ભાષામાં', kn:'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ',
      ml:'നിങ്ങളുടെ ഭാഷയിൽ', pa:'ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ',
      or:'ଆପଣଙ୍କ ଭାଷାରେ', as:'আপোনাৰ ভাষাত',
      ur:'اپنی زبان میں', sa:'भवतः भाषायाम्',
    },
    'what was wrong': {
      en:'what was wrong', hi:'क्या गलत था',
      bn:'কী ভুল ছিল', te:'ఏం తప్పుగా ఉంది',
      ta:'என்ன தவறு', mr:'काय चूक होती',
      gu:'શું ખોટું હતું', kn:'ಏನು ತಪ್ಪಿತ್ತು',
      ml:'എന്താണ് തെറ്റ്', pa:'ਕੀ ਗ਼ਲਤ ਸੀ',
      or:'କଣ ଭୁଲ ଥିଲା', as:'কি ভুল আছিল',
      ur:'کیا غلط تھا', sa:'किम् अशुद्धम् आसीत्',
    },
    // ── Page-footer feedback wrap — hard-coded compound runs ─────────
    // feedback-widget.js renders the help text with each emoji in its own
    // <b> tag, so the text nodes split mid-sentence. Each compound below
    // is exactly one text node value as seen in the DOM.
    'to listen. Tap': {
      en:'to listen. Tap', hi:'सुनने के लिए। टैप करें',
      bn:'শুনতে। ট্যাপ', te:'వినడానికి. ట్యాప్',
      ta:'கேட்க. தட்டவும்', mr:'ऐकण्यासाठी. टॅप करा',
      gu:'સાંભળવા માટે. ટેપ', kn:'ಕೇಳಲು. ಟ್ಯಾಪ್',
      ml:'കേൾക്കാൻ. ടാപ്പ്', pa:'ਸੁਣਨ ਲਈ। ਟੈਪ',
      or:'ଶୁଣିବାକୁ। ଟ୍ୟାପ୍', as:'শুনিবলৈ। টেপ',
      ur:'سننے کے لیے۔ ٹیپ', sa:'श्रोतुम्। स्पृशतु',
    },
    'to talk to Chitti. Tap': {
      en:'to talk to Chitti. Tap', hi:'चिट्टी से बात करने के लिए। टैप करें',
      bn:'চিট্টির সাথে কথা বলতে। ট্যাপ',
      te:'చిట్టితో మాట్లాడడానికి. ట్యాప్',
      ta:'சிட்டியுடன் பேச. தட்டவும்',
      mr:'चिट्टीशी बोलण्यासाठी. टॅप करा',
      gu:'ચિટ્ટી સાથે વાત કરવા માટે. ટેપ',
      kn:'ಚಿಟ್ಟಿಯೊಂದಿಗೆ ಮಾತನಾಡಲು. ಟ್ಯಾಪ್',
      ml:'ചിട്ടിയോട് സംസാരിക്കാൻ. ടാപ്പ്',
      pa:'ਚਿੱਟੀ ਨਾਲ ਗੱਲ ਕਰਨ ਲਈ। ਟੈਪ',
      or:'ଚିଟ୍ଟି ସହିତ କଥା ହେବାକୁ। ଟ୍ୟାପ୍',
      as:'চিট্টিৰ লগত কথা পাতিবলৈ। টেপ',
      ur:'چٹی سے بات کرنے کے لیے۔ ٹیپ',
      sa:'चिट्टिना सह संभाषितुम्। स्पृशतु',
    },
    'if helpful. Tap': {
      en:'if helpful. Tap', hi:'अगर उपयोगी हो। टैप करें',
      bn:'যদি সহায়ক হয়। ট্যাপ', te:'ఉపయోగపడితే. ట్యాప్',
      ta:'பயனுள்ளதாக இருந்தால். தட்டவும்',
      mr:'उपयुक्त असल्यास. टॅप करा',
      gu:'ઉપયોગી હોય તો. ટેપ', kn:'ಸಹಾಯಕವಾಗಿದ್ದರೆ. ಟ್ಯಾಪ್',
      ml:'സഹായകമെങ്കിൽ. ടാപ്പ്', pa:'ਜੇ ਮਦਦਗਾਰ। ਟੈਪ',
      or:'ଯଦି ସହାୟକ। ଟ୍ୟାପ୍', as:'যদি সহায়ক। টেপ',
      ur:'اگر مددگار۔ ٹیپ', sa:'यदि उपयोगि। स्पृशतु',
    },
    'and tell Chitti — in your language — what was wrong.': {
      en:'and tell Chitti — in your language — what was wrong.',
      hi:'और चिट्टी को अपनी भाषा में बताएं क्या गलत था।',
      bn:'এবং চিট্টিকে আপনার ভাষায় বলুন কী ভুল ছিল।',
      te:'మరియు చిట్టికి మీ భాషలో ఏం తప్పుగా ఉందో చెప్పండి.',
      ta:'மற்றும் சிட்டியிடம் உங்கள் மொழியில் சொல்லுங்கள் என்ன தவறு என்று.',
      mr:'आणि चिट्टीला तुमच्या भाषेत सांगा काय चूक होती.',
      gu:'અને ચિટ્ટીને તમારી ભાષામાં કહો શું ખોટું હતું.',
      kn:'ಮತ್ತು ಚಿಟ್ಟಿಗೆ ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಏನು ತಪ್ಪಿತ್ತು ಎಂದು ಹೇಳಿ.',
      ml:'കൂടാതെ ചിട്ടിയോട് നിങ്ങളുടെ ഭാഷയിൽ പറയൂ എന്താണ് തെറ്റ്.',
      pa:'ਅਤੇ ਚਿੱਟੀ ਨੂੰ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਦੱਸੋ ਕੀ ਗ਼ਲਤ ਸੀ।',
      or:'ଏବଂ ଚିଟ୍ଟିଙ୍କୁ ଆପଣଙ୍କ ଭାଷାରେ କୁହନ୍ତୁ କଣ ଭୁଲ ଥିଲା।',
      as:'আৰু চিট্টিক আপোনাৰ ভাষাত কওক কি ভুল আছিল।',
      ur:'اور چٹی کو اپنی زبان میں بتائیں کیا غلط تھا۔',
      sa:'चिट्टिं भवतः भाषायां वदतु किम् अशुद्धम् आसीत्।',
    },
    '💬 Was this helpful?': {
      en:'💬 Was this helpful?', hi:'💬 क्या यह उपयोगी था?',
      bn:'💬 এটি সহায়ক ছিল?', te:'💬 ఇది ఉపయోగపడిందా?',
      ta:'💬 இது உதவியாக இருந்ததா?', mr:'💬 हे उपयोगी होते का?',
      gu:'💬 શું આ ઉપયોગી હતું?', kn:'💬 ಇದು ಸಹಾಯಕವಾಗಿತ್ತೇ?',
      ml:'💬 ഇത് സഹായകമായിരുന്നോ?', pa:'💬 ਕੀ ਇਹ ਮਦਦਗਾਰ ਸੀ?',
      or:'💬 ଏହା ସହାୟକ ଥିଲା କି?', as:'💬 এইটো সহায়ক আছিল নে?',
      ur:'💬 کیا یہ مددگار تھا؟', sa:'💬 किम् एतत् उपयोगि आसीत्?',
    },
    '🛡️ HIGH RISK': {
      en:'🛡️ HIGH RISK', hi:'🛡️ उच्च जोखिम', bn:'🛡️ উচ্চ ঝুঁকি',
      te:'🛡️ అధిక ప్రమాదం', ta:'🛡️ அதிக ஆபத்து', mr:'🛡️ उच्च जोखीम',
      gu:'🛡️ ઉચ્ચ જોખમ', kn:'🛡️ ಹೆಚ್ಚಿನ ಅಪಾಯ',
      ml:'🛡️ ഉയർന്ന അപകടം', pa:'🛡️ ਉੱਚ ਜੋਖਮ',
      or:'🛡️ ଉଚ୍ଚ ବିପଦ', as:'🛡️ উচ্চ বিপদ',
      ur:'🛡️ زیادہ خطرہ', sa:'🛡️ अधिकं जोखिमम्',
    },
    '🛡️ MEDIUM RISK': {
      en:'🛡️ MEDIUM RISK', hi:'🛡️ मध्यम जोखिम', bn:'🛡️ মাঝারি ঝুঁকি',
      te:'🛡️ మధ్యస్థ ప్రమాదం', ta:'🛡️ நடுத்தர ஆபத்து',
      mr:'🛡️ मध्यम जोखीम', gu:'🛡️ મધ્યમ જોખમ',
      kn:'🛡️ ಮಧ್ಯಮ ಅಪಾಯ', ml:'🛡️ ഇടത്തരം അപകടം',
      pa:'🛡️ ਦਰਮਿਆਨਾ ਜੋਖਮ', or:'🛡️ ମଧ୍ୟମ ବିପଦ',
      as:'🛡️ মধ্যমীয়া বিপদ', ur:'🛡️ درمیانہ خطرہ',
      sa:'🛡️ मध्यमं जोखिमम्',
    },
    '🛡️ LOW RISK': {
      en:'🛡️ LOW RISK', hi:'🛡️ कम जोखिम', bn:'🛡️ কম ঝুঁকি',
      te:'🛡️ తక్కువ ప్రమాదం', ta:'🛡️ குறைந்த ஆபத்து',
      mr:'🛡️ कमी जोखीम', gu:'🛡️ ઓછું જોખમ', kn:'🛡️ ಕಡಿಮೆ ಅಪಾಯ',
      ml:'🛡️ കുറഞ്ഞ അപകടം', pa:'🛡️ ਘੱਟ ਜੋਖਮ',
      or:'🛡️ କମ୍ ବିପଦ', as:'🛡️ কম বিপদ',
      ur:'🛡️ کم خطرہ', sa:'🛡️ न्यूनं जोखिमम्',
    },
    // ── chitti-fb-box-section copies of vaani section headings ───────
    '🎙️ Talk to Chitti': {
      en:'🎙️ Talk to Chitti', hi:'🎙️ चिट्टी से बात करें',
      bn:'🎙️ চিট্টির সাথে কথা বলুন', te:'🎙️ చిట్టితో మాట్లాడండి',
      ta:'🎙️ சிட்டியுடன் பேசுங்கள்', mr:'🎙️ चिट्टीशी बोला',
      gu:'🎙️ ચિટ્ટી સાથે વાત કરો', kn:'🎙️ ಚಿಟ್ಟಿಯೊಂದಿಗೆ ಮಾತನಾಡಿ',
      ml:'🎙️ ചിട്ടിയോട് സംസാരിക്കുക', pa:'🎙️ ਚਿੱਟੀ ਨਾਲ ਗੱਲ ਕਰੋ',
      or:'🎙️ ଚିଟ୍ଟି ସହିତ କଥା ହୁଅନ୍ତୁ', as:'🎙️ চিট্টিৰ লগত কথা পাতক',
      ur:'🎙️ چٹی سے بات کریں', sa:'🎙️ चिट्टिना सह वार्तां कुरुत',
    },
    '🛡️ Chitti can act for you 📱 some need Android Phase 2': {
      en:'🛡️ Chitti can act for you 📱 some need Android Phase 2',
      hi:'🛡️ चिट्टी आपके लिए कार्य कर सकता है 📱 कुछ को Android Phase 2 चाहिए',
      bn:'🛡️ চিট্টি আপনার জন্য কাজ করতে পারে 📱 কিছুর জন্য Android Phase 2 দরকার',
      te:'🛡️ చిట్టి మీ కోసం పనిచేయగలదు 📱 కొన్నింటికి Android Phase 2 అవసరం',
      ta:'🛡️ சிட்டி உங்களுக்காக செயல்பட முடியும் 📱 சிலவற்றுக்கு Android Phase 2 தேவை',
      mr:'🛡️ चिट्टी तुमच्यासाठी कार्य करू शकते 📱 काहींना Android Phase 2 आवश्यक',
      gu:'🛡️ ચિટ્ટી તમારા માટે કાર્ય કરી શકે છે 📱 કેટલીકને Android Phase 2 જરૂરી',
      kn:'🛡️ ಚಿಟ್ಟಿ ನಿಮ್ಮ ಪರವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸಬಲ್ಲದು 📱 ಕೆಲವಕ್ಕೆ Android Phase 2 ಅಗತ್ಯ',
      ml:'🛡️ ചിട്ടി നിങ്ങൾക്കായി പ്രവർത്തിക്കാൻ കഴിയും 📱 ചിലത് Android Phase 2 ആവശ്യം',
      pa:'🛡️ ਚਿੱਟੀ ਤੁਹਾਡੇ ਲਈ ਕੰਮ ਕਰ ਸਕਦੀ ਹੈ 📱 ਕੁਝ ਲਈ Android Phase 2 ਚਾਹੀਦਾ',
      or:'🛡️ ଚିଟ୍ଟି ଆପଣଙ୍କ ପାଇଁ କାର୍ଯ୍ୟ କରିପାରେ 📱 କେତେକ ପାଇଁ Android Phase 2 ଦରକାର',
      as:'🛡️ চিট্টিয়ে আপোনাৰ বাবে কাম কৰিব পাৰে 📱 কিছুমানৰ Android Phase 2 দৰকাৰ',
      ur:'🛡️ چٹی آپ کے لیے کام کر سکتی ہے 📱 کچھ کے لیے Android Phase 2 ضروری',
      sa:'🛡️ चिट्टिः भवतः कृते कार्यं कर्तुं शक्नोति 📱 केषाञ्चित् Android Phase 2 आवश्यकम्',
    },
  };

  // ── pattern-aware fallbacks ───────────────────────────────────────
  // Some chips include a variable (date, number, gram weight). Some
  // aria-labels include the section name. Use regex capture + per-language
  // template so e.g. "📅 Last audit: 2026-05-13" becomes
  // "📅 अंतिम ऑडिट: 2026-05-13" in Hindi.
  var PATTERNS = [
    // chitti_news_ai uses its own per-box aria-label format.
    {
      re: /^Per-box feedback for (.+)$/,
      tmpl: {
        en:'Per-box feedback for $1', hi:'$1 के लिए प्रति-बॉक्स प्रतिक्रिया',
        bn:'$1 এর জন্য প্রতি-বাক্স মতামত', te:'$1 కోసం ప్రతి-బాక్స్ అభిప్రాయం',
        ta:'$1 க்கான ஒவ்வொரு-பெட்டிக்கான கருத்து',
        mr:'$1 साठी प्रति-बॉक्स अभिप्राय',
        gu:'$1 માટે પ્રતિ-બોક્સ પ્રતિસાદ',
        kn:'$1 ಗಾಗಿ ಪ್ರತಿ-ಬಾಕ್ಸ್ ಪ್ರತಿಕ್ರಿಯೆ',
        ml:'$1 നുള്ള ഓരോ-ബോക്സ് പ്രതികരണം',
        pa:'$1 ਲਈ ਪ੍ਰਤੀ-ਬਾਕਸ ਫੀਡਬੈਕ', or:'$1 ପାଇଁ ପ୍ରତି-ବାକ୍ସ ମତାମତ',
        as:'$1 ৰ বাবে প্ৰতি-বাকচ মতামত', ur:'$1 کے لیے ہر باکس پر رائے',
        sa:'$1 कृते प्रति-पेटिका-प्रतिक्रिया',
      },
    },
    // Aria-label patterns from feedback-widget.js per-box bar.
    {
      re: /^Read (.+) aloud$/,
      tmpl: {
        en:'Read $1 aloud', hi:'$1 को ज़ोर से पढ़ें',
        bn:'$1 জোরে পড়ুন', te:'$1 ను బిగ్గరగా చదవండి',
        ta:'$1 ஐ சத்தமாக படிக்கவும்', mr:'$1 मोठ्याने वाचा',
        gu:'$1 ને મોટેથી વાંચો', kn:'$1 ಅನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ',
        ml:'$1 ഉറക്കെ വായിക്കുക', pa:'$1 ਨੂੰ ਉੱਚੀ ਆਵਾਜ਼ ਵਿੱਚ ਪੜ੍ਹੋ',
        or:'$1 କୁ ଉଚ୍ଚ ସ୍ୱରରେ ପଢ଼ନ୍ତୁ', as:'$1 উচ্চস্বৰে পঢ়ক',
        ur:'$1 کو بلند آواز سے پڑھیں', sa:'$1 उच्चैः पठतु',
      },
    },
    {
      re: /^Ask Chitti to explain (.+) further$/,
      tmpl: {
        en:'Ask Chitti to explain $1 further',
        hi:'चिट्टी से $1 को और विस्तार से समझाने के लिए कहें',
        bn:'চিট্টিকে $1 আরও বিস্তারিত ব্যাখ্যা করতে বলুন',
        te:'$1 ను మరింత వివరించమని చిట్టిని అడగండి',
        ta:'$1 ஐ மேலும் விளக்க சிட்டியிடம் கேளுங்கள்',
        mr:'चिट्टीला $1 अधिक तपशीलवार समजावून सांगायला सांगा',
        gu:'ચિટ્ટીને $1 વધુ સમજાવવા કહો',
        kn:'$1 ಅನ್ನು ಹೆಚ್ಚು ವಿವರಿಸಲು ಚಿಟ್ಟಿಯನ್ನು ಕೇಳಿ',
        ml:'$1 കൂടുതൽ വിശദീകരിക്കാൻ ചിട്ടിയോട് ആവശ്യപ്പെടുക',
        pa:'ਚਿੱਟੀ ਨੂੰ $1 ਹੋਰ ਵਿਸਥਾਰ ਨਾਲ ਸਮਝਾਉਣ ਲਈ ਕਹੋ',
        or:'ଚିଟ୍ଟିଙ୍କୁ $1 ଅଧିକ ବର୍ଣ୍ଣନା କରିବାକୁ କୁହନ୍ତୁ',
        as:'চিট্টিক $1 অধিক বিতংভাৱে ব্যাখ্যা কৰিবলৈ কওক',
        ur:'چٹی سے $1 کی مزید وضاحت کرنے کو کہیں',
        sa:'चिट्टिं $1 अधिकं विशदीकर्तुं वदतु',
      },
    },
    {
      re: /^(.+) was helpful$/,
      tmpl: {
        en:'$1 was helpful', hi:'$1 उपयोगी था',
        bn:'$1 সহায়ক ছিল', te:'$1 ఉపయోగపడింది',
        ta:'$1 உதவியாக இருந்தது', mr:'$1 उपयुक्त होते',
        gu:'$1 મદદરૂપ હતું', kn:'$1 ಸಹಾಯಕವಾಗಿತ್ತು',
        ml:'$1 സഹായകമായിരുന്നു', pa:'$1 ਮਦਦਗਾਰ ਸੀ',
        or:'$1 ସହାୟକ ଥିଲା', as:'$1 সহায়ক আছিল',
        ur:'$1 مددگار تھا', sa:'$1 उपयोगि आसीत्',
      },
    },
    {
      re: /^Something was wrong with (.+)$/,
      tmpl: {
        en:'Something was wrong with $1', hi:'$1 में कुछ गलत था',
        bn:'$1 এ কিছু ভুল ছিল', te:'$1 లో ఏదో తప్పుగా ఉంది',
        ta:'$1 இல் ஏதோ தவறு', mr:'$1 मध्ये काहीतरी चूक होती',
        gu:'$1 માં કંઈક ખોટું હતું', kn:'$1 ರಲ್ಲಿ ಏನೋ ತಪ್ಪಿತ್ತು',
        ml:'$1 ൽ എന്തോ തെറ്റിയിരുന്നു', pa:'$1 ਵਿੱਚ ਕੁਝ ਗ਼ਲਤ ਸੀ',
        or:'$1 ରେ କିଛି ଭୁଲ ଥିଲା', as:'$1 ত কিবা ভুল আছিল',
        ur:'$1 میں کچھ غلط تھا', sa:'$1 मध्ये किमपि अशुद्धम् आसीत्',
      },
    },
    {
      re: /^Feedback for ([^\n]+)$/,
      tmpl: {
        en:'Feedback for $1', hi:'$1 के लिए प्रतिक्रिया',
        bn:'$1 এর জন্য মতামত', te:'$1 కోసం అభిప్రాయం',
        ta:'$1 க்கான கருத்து', mr:'$1 साठी अभिप्राय',
        gu:'$1 માટે પ્રતિસાદ', kn:'$1 ಗಾಗಿ ಪ್ರತಿಕ್ರಿಯೆ',
        ml:'$1 നുള്ള പ്രതികരണം', pa:'$1 ਲਈ ਫੀਡਬੈਕ',
        or:'$1 ପାଇଁ ମତାମତ', as:'$1 ৰ বাবে মতামত',
        ur:'$1 کے لیے رائے', sa:'$1 कृते प्रतिक्रिया',
      },
    },
    // Modal placeholders / textarea fallback.
    {
      re: /^e\.g\.\s+The Hindi translation was wrong on the scheme page\.\.\.$/,
      tmpl: {
        en:'e.g. The Hindi translation was wrong on the scheme page...',
        hi:'उदा. योजना पृष्ठ पर हिंदी अनुवाद ग़लत था...',
        bn:'উদা. স্কিম পৃষ্ঠায় হিন্দি অনুবাদ ভুল ছিল...',
        te:'ఉదా. స్కీమ్ పేజీలో హిందీ అనువాదం తప్పుగా ఉంది...',
        ta:'எ.கா. திட்ட பக்கத்தில் இந்தி மொழிபெயர்ப்பு தவறு...',
        mr:'उदा. योजना पानावर हिंदी भाषांतर चुकीचे होते...',
        gu:'દા.ત. યોજના પેજ પર હિન્દી અનુવાદ ખોટો હતો...',
        kn:'ಉದಾ. ಯೋಜನೆ ಪುಟದಲ್ಲಿ ಹಿಂದಿ ಅನುವಾದ ತಪ್ಪಾಗಿತ್ತು...',
        ml:'ഉദാ. പദ്ധതി പേജിൽ ഹിന്ദി വിവർത്തനം തെറ്റായിരുന്നു...',
        pa:'ਉਦਾ. ਯੋਜਨਾ ਪੰਨੇ \'ਤੇ ਹਿੰਦੀ ਅਨੁਵਾਦ ਗ਼ਲਤ ਸੀ...',
        or:'ଉଦା. ଯୋଜନା ପୃଷ୍ଠାରେ ହିନ୍ଦୀ ଅନୁବାଦ ଭୁଲ ଥିଲା...',
        as:'উদা. আঁচনি পৃষ্ঠাত হিন্দী অনুবাদ ভুল আছিল...',
        ur:'مثلاً اسکیم پیج پر ہندی ترجمہ غلط تھا...',
        sa:'यथा। योजना-पृष्ठे हिन्दी-अनुवादः अशुद्धः आसीत्...',
      },
    },
    {
      re: /^Tell Chitti — in any language — what was wrong with this box\.\.\.$/,
      tmpl: {
        en:'Tell Chitti — in any language — what was wrong with this box...',
        hi:'चिट्टी को बताएं — किसी भी भाषा में — इस बॉक्स में क्या गलत था...',
        bn:'চিট্টিকে বলুন — যেকোনো ভাষায় — এই বাক্সে কী ভুল ছিল...',
        te:'చిట్టికి చెప్పండి — ఏ భాషలోనైనా — ఈ బాక్స్‌లో ఏం తప్పుగా ఉంది...',
        ta:'சிட்டியிடம் சொல்லுங்கள் — எந்த மொழியிலும் — இந்த பெட்டியில் என்ன தவறு...',
        mr:'चिट्टीला सांगा — कोणत्याही भाषेत — या बॉक्समध्ये काय चूक होती...',
        gu:'ચિટ્ટીને કહો — કોઈપણ ભાષામાં — આ બોક્સમાં શું ખોટું હતું...',
        kn:'ಚಿಟ್ಟಿಗೆ ಹೇಳಿ — ಯಾವುದೇ ಭಾಷೆಯಲ್ಲಿ — ಈ ಬಾಕ್ಸ್‌ನಲ್ಲಿ ಏನು ತಪ್ಪಿತ್ತು...',
        ml:'ചിട്ടിയോട് പറയൂ — ഏത് ഭാഷയിലും — ഈ ബോക്സിൽ എന്താണ് തെറ്റ്...',
        pa:'ਚਿੱਟੀ ਨੂੰ ਦੱਸੋ — ਕਿਸੇ ਵੀ ਭਾਸ਼ਾ ਵਿੱਚ — ਇਸ ਬਾਕਸ ਵਿੱਚ ਕੀ ਗ਼ਲਤ ਸੀ...',
        or:'ଚିଟ୍ଟିଙ୍କୁ କୁହନ୍ତୁ — ଯେକୌଣସି ଭାଷାରେ — ଏହି ବାକ୍ସରେ କଣ ଭୁଲ ଥିଲା...',
        as:'চিট্টিক কওক — যিকোনো ভাষাত — এই বাকচত কি ভুল আছিল...',
        ur:'چٹی کو بتائیں — کسی بھی زبان میں — اس باکس میں کیا غلط تھا...',
        sa:'चिट्टिं वदतु — कस्याम् अपि भाषायाम् — अस्मिन् पेटिकायां किम् अशुद्धम् आसीत्...',
      },
    },
    {
      re: /^📅\s*Last audit:\s*(.+)$/,
      tmpl: {
        en:'📅 Last audit: $1', hi:'📅 अंतिम ऑडिट: $1', bn:'📅 শেষ অডিট: $1',
        te:'📅 చివరి ఆడిట్: $1', ta:'📅 கடைசி தணிக்கை: $1',
        mr:'📅 शेवटचे ऑडिट: $1', gu:'📅 છેલ્લું ઓડિટ: $1',
        kn:'📅 ಕೊನೆಯ ಪರಿಶೋಧನೆ: $1', ml:'📅 അവസാന ഓഡിറ്റ്: $1',
        pa:'📅 ਆਖਰੀ ਆਡਿਟ: $1', or:'📅 ଶେଷ ଅଡିଟ୍: $1',
        as:'📅 শেষৰ অডিট: $1', ur:'📅 آخری آڈٹ: $1',
        sa:'📅 अन्तिम-परीक्षणम्: $1',
      },
    },
    {
      re: /^🇮🇳\s*(\S+)\s*helped today$/,
      tmpl: {
        en:'🇮🇳 $1 helped today', hi:'🇮🇳 आज $1 की मदद की',
        bn:'🇮🇳 আজ $1 জনকে সাহায্য করেছে',
        te:'🇮🇳 నేడు $1 మందికి సహాయం చేసింది',
        ta:'🇮🇳 இன்று $1 பேருக்கு உதவியது',
        mr:'🇮🇳 आज $1 जणांना मदत केली',
        gu:'🇮🇳 આજે $1 ને મદદ કરી',
        kn:'🇮🇳 ಇಂದು $1 ಜನರಿಗೆ ಸಹಾಯ ಮಾಡಿದೆ',
        ml:'🇮🇳 ഇന്ന് $1 പേർക്ക് സഹായിച്ചു',
        pa:'🇮🇳 ਅੱਜ $1 ਦੀ ਮਦਦ ਕੀਤੀ',
        or:'🇮🇳 ଆଜି $1 ଜଣଙ୍କୁ ସାହାଯ୍ୟ କଲା',
        as:'🇮🇳 আজি $1 জনক সহায় কৰিলে',
        ur:'🇮🇳 آج $1 کی مدد کی',
        sa:'🇮🇳 अद्य $1 जनेभ्यः साहाय्यं कृतम्',
      },
    },
    {
      re: /^🌿\s*~?\s*([\d.]+)\s*g\s*CO[2₂]\s*for this reply$/,
      tmpl: {
        en:'🌿 ~$1g CO₂ for this reply',
        hi:'🌿 इस उत्तर के लिए ~$1g CO₂',
        bn:'🌿 এই উত্তরের জন্য ~$1g CO₂',
        te:'🌿 ఈ సమాధానం కోసం ~$1g CO₂',
        ta:'🌿 இந்த பதிலுக்கு ~$1g CO₂',
        mr:'🌿 या उत्तरासाठी ~$1g CO₂',
        gu:'🌿 આ જવાબ માટે ~$1g CO₂',
        kn:'🌿 ಈ ಉತ್ತರಕ್ಕಾಗಿ ~$1g CO₂',
        ml:'🌿 ഈ മറുപടിക്ക് ~$1g CO₂',
        pa:'🌿 ਇਸ ਜਵਾਬ ਲਈ ~$1g CO₂',
        or:'🌿 ଏହି ଉତ୍ତର ପାଇଁ ~$1g CO₂',
        as:'🌿 এই উত্তৰৰ বাবে ~$1g CO₂',
        ur:'🌿 اس جواب کے لیے ~$1g CO₂',
        sa:'🌿 अस्य प्रत्युत्तरस्य कृते ~$1g CO₂',
      },
    },
  ];

  // Cousin languages — fall back to Hindi (matches the chitti_lang.js
  // convention for raj/bho/kru/hoc rows that are kept in Devanagari).
  var COUSIN_FALLBACK = {
    mai:'hi', kok:'hi', doi:'hi', bho:'hi', raj:'hi', kru:'hi', hoc:'hi', ne:'hi',
    ks:'ur', sd:'ur', mni:'bn', sat:'hi',
  };
  function resolve(entry, lang) {
    if (!entry) return null;
    if (entry[lang]) return entry[lang];
    var fb = COUSIN_FALLBACK[lang];
    if (fb && entry[fb]) return entry[fb];
    return null;
  }

  // ── selectors we walk ──────────────────────────────────────────────
  // Limit the TreeWalker to surfaces where the residue lives, so we don't
  // double-translate the body content that chitti_lang.js already
  // handles via its baked T-table. Touching vaani's button labels /
  // section headings from here would fight chitti_lang.js (e.g. cause
  // "Read text aloud" → false-positive pattern match → "text" residue
  // inside a Telugu sentence).
  var WALK_ROOTS = [
    '.chitti-fb-box-bar',      // per-box feedback widget bar
    '.chitti-fb-wrap',         // page-footer widget card
    '.chitti-fb-modal-bg',     // page-footer feedback modal
    '#chitti-fb-box-modal-bg', // per-box feedback modal
    '.chitti-qr-block',        // QR block (page footer)
  ];

  var SKIP_TAGS = { SCRIPT:1, STYLE:1, NOSCRIPT:1, CODE:1, PRE:1, TEXTAREA:1, OPTION:1 };

  function getCurrentLang() {
    try {
      if (window.Chitti && window.Chitti.lang && typeof window.Chitti.lang.current === 'function') {
        return window.Chitti.lang.current();
      }
      return localStorage.getItem('chitti_lang') || 'en';
    } catch (e) { return 'en'; }
  }

  function translateTextNodes(root, lang) {
    if (!root) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || SKIP_TAGS[p.tagName]) return NodeFilter.FILTER_REJECT;
        var t = (n.nodeValue || '').replace(/\s+/g, ' ').trim();
        if (!t) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var node;
    while ((node = w.nextNode())) {
      var orig = node._chittiA11yOrig != null ? node._chittiA11yOrig : node.nodeValue;
      var trim = (orig || '').replace(/\s+/g, ' ').trim();
      if (!trim) continue;
      // Snapshot the English baseline so we can flip cleanly between langs.
      if (node._chittiA11yOrig == null) node._chittiA11yOrig = orig;
      if (lang === 'en') {
        node.nodeValue = orig;
        continue;
      }
      var entry = W[trim];
      var v = null;
      if (entry) {
        v = resolve(entry, lang);
      } else {
        v = matchPattern(trim, lang);
      }
      if (!v) continue;
      // Preserve leading/trailing whitespace from the original node value.
      node.nodeValue = (orig || '').replace(trim, v);
    }
  }

  // Translate aria-label / title / placeholder / alt attributes that
  // exactly match a W key. The per-box widget button aria-labels are the
  // main reason — "Read X aloud" etc. don't appear as text nodes.
  // Try W exact match, then PATTERNS, recursively translating the
  // captured group ($1) so that "Read this section aloud" → the language's
  // template AND "this section" inside it is itself translated.
  function matchPattern(trim, lang) {
    for (var i = 0; i < PATTERNS.length; i++) {
      var pm = trim.match(PATTERNS[i].re);
      if (!pm) continue;
      var tmpl = PATTERNS[i].tmpl[lang] || PATTERNS[i].tmpl[COUSIN_FALLBACK[lang] || 'hi'];
      if (!tmpl) continue;
      var captured = pm[1] || '';
      // Recursively translate the captured section name. Fall back to
      // the raw capture if no translation found.
      var capTrans = capturedTranslate(captured, lang);
      return tmpl.replace(/\$1/g, capTrans);
    }
    return null;
  }
  function capturedTranslate(s, lang) {
    var trim = (s || '').replace(/\s+/g, ' ').trim();
    var entry = W[trim];
    if (entry) {
      var v = resolve(entry, lang);
      if (v) return v;
    }
    // Defer to chitti_lang.js's main T-table for section names baked
    // there (📞 Make a call, 📲 Send WhatsApp, etc.). Returns null if
    // the string isn't in the baked corpus either.
    if (window.Chitti && window.Chitti.lang && typeof window.Chitti.lang.lookupText === 'function') {
      try {
        var v2 = window.Chitti.lang.lookupText(s, lang);
        if (v2 != null) return v2;
      } catch (e) {}
    }
    return s;
  }

  function translateOneAttr(el, a, lang) {
    var origKey = '_chittiA11yOrig_' + a.replace(/-/g, '_');
    var orig = el[origKey] != null ? el[origKey] : el.getAttribute(a);
    if (el[origKey] == null) el[origKey] = orig;
    if (lang === 'en') { el.setAttribute(a, orig); return; }
    var trim = (orig || '').replace(/\s+/g, ' ').trim();
    var v = null;
    var entry = W[trim];
    if (entry) v = resolve(entry, lang);
    // Try chitti_lang.js's baked T-table BEFORE falling back to pattern
    // substitution — exact-match wins over template substitution so we
    // don't clobber properly-translated aria-labels like
    // "Read the answer aloud" with a $1-substituted version where
    // "the answer" stays English inside the wrapper template.
    if (!v && window.Chitti && window.Chitti.lang && typeof window.Chitti.lang.lookupText === 'function') {
      try {
        var v2 = window.Chitti.lang.lookupText(orig, lang);
        if (v2 != null) v = v2;
      } catch (e) {}
    }
    if (!v) v = matchPattern(trim, lang);
    if (!v) return;
    el.setAttribute(a, v);
  }

  function translateAttrs(root, lang) {
    if (!root) return;
    var attrs = ['aria-label', 'title', 'placeholder', 'alt'];
    attrs.forEach(function (a) {
      // Process the root element itself if it carries the attribute
      // (e.g. .chitti-fb-box-bar has its own aria-label="Feedback for X").
      if (root.nodeType === 1 && root.hasAttribute && root.hasAttribute(a)) {
        translateOneAttr(root, a, lang);
      }
      root.querySelectorAll('[' + a + ']').forEach(function (el) {
        translateOneAttr(el, a, lang);
      });
    });
  }

  function translatePage(lang) {
    if (!lang) lang = getCurrentLang();
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS[lang] ? 'rtl' : 'ltr';
    WALK_ROOTS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (root) {
        translateTextNodes(root, lang);
        translateAttrs(root, lang);
      });
    });
    // Aria-label / placeholder / title sweep across the WHOLE body —
    // chitti_news_ai's box-fb wrappers (and any future page-specific
    // feedback containers) aren't in WALK_ROOTS but their aria-labels
    // still need to localise via the W table or PATTERNS (e.g.
    // "Per-box feedback for Daily AI Briefing").
    translateAttrs(document.body, lang);
  }

  // Register every W entry that has a simple language map into
  // chitti_lang.js's T-table so they ride the existing translateAll pass.
  // This stops the no-match-reset-to-English logic in chitti_lang.js from
  // overwriting our widget bar / QR translations on every re-paint.
  function registerWithChittiLang() {
    if (!window.Chitti || !window.Chitti.lang || typeof window.Chitti.lang.extend !== 'function') return;
    var merged = {};
    Object.keys(W).forEach(function (k) {
      // chitti_lang.js's T-table expects { en, hi, ... } maps with a defined
      // 'en' baseline. Our W entries already follow that shape.
      var entry = W[k];
      if (!entry || !entry.en) return;
      // Backfill the cousin languages so chitti_lang.js doesn't reset
      // them to English when they're missing.
      Object.keys(COUSIN_FALLBACK).forEach(function (lang) {
        if (!entry[lang]) entry[lang] = entry[COUSIN_FALLBACK[lang]] || entry.hi || entry.en;
      });
      merged[k] = entry;
    });
    window.Chitti.lang.extend(merged);
  }

  function init() {
    // Register our widget+QR strings into chitti_lang.js's T-table so
    // the two scripts cooperate instead of fighting on every mutation.
    registerWithChittiLang();
    translatePage();
    // Listen for chitti_lang.js's lang change event.
    document.addEventListener('chitti:langchange', function (ev) {
      var lang = (ev && ev.detail && ev.detail.lang) || getCurrentLang();
      translatePage(lang);
    });
    // Defensive — also listen for the dropdown directly.
    var sel = document.getElementById('lang-select');
    if (sel) {
      sel.addEventListener('change', function () {
        translatePage(sel.value);
      });
    }
    // Observe DOM mutations — widget bars attach LATE.
    if (typeof MutationObserver === 'function') {
      var pending = false;
      var obs = new MutationObserver(function (muts) {
        var anyAdded = false;
        for (var i = 0; i < muts.length; i++) {
          if (muts[i].addedNodes && muts[i].addedNodes.length) { anyAdded = true; break; }
        }
        if (!anyAdded || pending) return;
        pending = true;
        (window.requestAnimationFrame || function (fn) { setTimeout(fn, 16); })(function () {
          pending = false;
          obs.disconnect();
          try { translatePage(); } finally {
            obs.observe(document.body, { childList: true, subtree: true });
          }
        });
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Expose minimal API (mirrors window.Chitti.lang from chitti_lang.js).
  window.Chitti = window.Chitti || {};
  window.Chitti.a11y = window.Chitti.a11y || {};
  window.Chitti.a11y.translate = translatePage;
  window.Chitti.a11y.W = W;

  // Public init() shim — many legacy pages carry an inline
  //   <script>if(window.Chitti&&Chitti.a11y){try{Chitti.a11y.init({});}catch(e){...}}</script>
  // that was a no-op against an earlier API shape. The CTO cert (2026-05-27)
  // surfaced `Chitti.a11y.init is not a function` pageerrors on chitti_isl,
  // chitti_quality, and index. Expose a safe no-op so those legacy inline
  // calls succeed instead of erroring. The real init runs from
  // DOMContentLoaded below; the shim is for backwards compatibility with
  // the inline call pattern.
  if (typeof window.Chitti.a11y.init !== 'function') {
    window.Chitti.a11y.init = function (_opts) {
      // The IIFE's own DOMContentLoaded handler already wired everything.
      // If the page calls init() before that fires (very early inline
      // script), force the wiring now.
      try { if (typeof init === 'function') init(); } catch (e) {}
      return true;
    };
  }
  // Additional public-API shims surfaced by CTO batch cert (2026-05-27).
  // chitti_isl.html called Chitti.a11y.setIslMode(bool); chitti_quality.html
  // called Chitti.a11y.announce(msg). Neither existed on the substrate,
  // so both pages threw pageerrors on load. Add no-op shims that do the
  // honest minimal behaviour so the call-sites stop erroring; richer
  // behaviour can be added later without page-side changes.
  if (typeof window.Chitti.a11y.setIslMode !== 'function') {
    window.Chitti.a11y.setIslMode = function (enabled) {
      try {
        if (window.Chitti.isl && typeof window.Chitti.isl.setEnabled === 'function') {
          window.Chitti.isl.setEnabled(!!enabled);
        }
        document.documentElement.setAttribute('data-chitti-isl', enabled ? 'on' : 'off');
      } catch (e) {}
      return !!enabled;
    };
  }
  if (typeof window.Chitti.a11y.announce !== 'function') {
    window.Chitti.a11y.announce = function (message, priority) {
      try {
        // aria-live region: reuse existing one if present, else create.
        var live = document.getElementById('chitti-a11y-live');
        if (!live) {
          live = document.createElement('div');
          live.id = 'chitti-a11y-live';
          live.setAttribute('role', 'status');
          live.setAttribute('aria-live', priority === 'assertive' ? 'assertive' : 'polite');
          live.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
          (document.body || document.documentElement).appendChild(live);
        }
        live.textContent = String(message || '');
      } catch (e) {}
      return true;
    };
  }
  // speak() shim — Voice Factory cascade hook. Many pages call
  // Chitti.a11y.speak(text, lang). Honest fallback uses Web Speech API
  // until Voice Factory is wired at window.Chitti.a11y.VOICE_FACTORY_URL.
  if (typeof window.Chitti.a11y.speak !== 'function') {
    window.Chitti.a11y.speak = function (text, lang) {
      try {
        if (!text) return false;
        if (!('speechSynthesis' in window)) return false;
        var u = new SpeechSynthesisUtterance(String(text));
        if (lang) u.lang = lang.indexOf('-') === -1 ? lang + '-IN' : lang;
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
        return true;
      } catch (e) { return false; }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
