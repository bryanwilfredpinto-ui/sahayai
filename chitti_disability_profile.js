/* chitti_disability_profile.js — User Disability Profile substrate.
 *
 * Locked per SAHAYAI_MASTER.md §7 + memory project_user_disability_profile_locked
 * (2026-05-13). Fires a one-time multi-select on first visit to ANY Chitti
 * page, saves to localStorage.disability_profile, never re-asks, syncs
 * across every Chitti page on the same device (localStorage is
 * per-origin, so the sync is automatic).
 *
 * 8 options from §7: blind · deaf · mute · ISL · illiterate · elderly ·
 * limited-mobility · cognitive. Plus language preselect (26 langs from
 * chitti_lang.js) and a rural / low-connectivity toggle per §5c.
 *
 * Contract:
 *   1. Show modal ONLY if localStorage has no `disability_profile` key.
 *   2. Modal is voice-out + tap-in (mute-user safe per CHITTI GOLDEN
 *      RULE §2g — Yes / No buttons always present, never voice-only).
 *   3. On Save → write JSON { blind, deaf, mute, isl, illiterate,
 *      elderly, limitedMobility, cognitive, rural, lang, skipped:false,
 *      ts: ISO8601 }.
 *   4. On Skip → write { skipped: true, ts: ISO8601 } so we never
 *      re-ask. Honest YELLOW for the user; we don't tailor for them but
 *      we don't pester.
 *   5. Indian-flag theme via chitti_theme.css tokens (--saffron /
 *      --green-flag / --navy).
 *   6. 375px-safe — modal max-width 360px, single column on phone.
 *   7. Auto-loaded from chitti_a11y.js; pages can opt out with
 *      <meta name="chitti-disability-profile" content="off">. The opt-out
 *      is intended for admin / dev pages, not user-facing Chittis.
 *
 * Public API: window.Chitti.disabilityProfile = {
 *   get(), set(), clear(), open()  // open() forces the modal even if saved
 * }
 */
(function (global) {
  'use strict';
  if (global.__chittiDisabilityProfileLoaded) return;
  global.__chittiDisabilityProfileLoaded = true;

  var STORAGE_KEY = 'disability_profile';
  var MODAL_ID = 'chitti-disability-profile-modal';

  // ── URL kill-switch (defense-in-depth; chitti_a11y.js also handles this
  //    earlier). `?dp_skip=1` → never show modal on this device.
  //    `?dp_reset=1` → wipe storage so the modal will show fresh next visit.
  try {
    var __qs = (global.location && global.location.search) || '';
    if (/[?&]dp_skip=1\b/i.test(__qs)) {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        skipped: true, closed_via: 'url_kill_switch', ts: new Date().toISOString(),
      }));
    } else if (/[?&]dp_reset=1\b/i.test(__qs)) {
      global.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) { /* honest skip */ }

  // 8 options + their labels in EN + HI (matching chitti_lang.js's primary
  // pair). Other 24 languages render the EN label; chitti_lang.js's
  // body-wide MutationObserver will translate them on the fly once it
  // reads the rendered text. Honest minimum-viable; expand the in-file
  // table later if Sire asks for native labels here too.
  var OPTIONS = [
    { key: 'blind',           emoji: '👁️',  en: 'Blind / low vision',         hi: 'अंधे / कम दृष्टि' },
    { key: 'deaf',            emoji: '🦻',  en: 'Deaf / hard of hearing',     hi: 'बहरे / कम सुनने वाले' },
    { key: 'mute',            emoji: '🤫',  en: 'Mute / non-speaking',        hi: 'गूंगे / बोल नहीं पाते' },
    { key: 'isl',             emoji: '🤟',  en: 'I use Indian Sign Language', hi: 'मैं इंडियन साइन लैंग्वेज इस्तेमाल करता/करती हूँ' },
    { key: 'illiterate',      emoji: '📖',  en: 'I prefer voice over reading',hi: 'मुझे पढ़ने से ज़्यादा सुनना पसंद है' },
    { key: 'elderly',         emoji: '🧓',  en: 'Elderly — please go slow',   hi: 'बुज़ुर्ग — धीरे बोलो' },
    { key: 'limitedMobility', emoji: '♿',  en: 'Limited mobility',           hi: 'चलने-फिरने में दिक्कत' },
    { key: 'cognitive',       emoji: '🧠',  en: 'Cognitive support helpful',  hi: 'समझाने में आसान भाषा चाहिए' },
  ];

  function isOptedOut() {
    var m = document.querySelector('meta[name="chitti-disability-profile"]');
    return m && /^off$/i.test(m.getAttribute('content') || '');
  }

  function readStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeStorage(obj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {}
  }

  function detectInitialLang() {
    // Mirror chitti_warmup.js detectLang priority order.
    try {
      var saved = localStorage.getItem('chitti_lang') || localStorage.getItem('lang');
      if (saved) return saved;
    } catch (e) {}
    var html = (document.documentElement.lang || '').toLowerCase().split('-')[0];
    if (html) return html;
    return (navigator.language || 'en').toLowerCase().split('-')[0] || 'en';
  }

  function langList() {
    // Read from chitti_lang.js if loaded. Fall back to a minimal EN-only
    // list so the modal still works on pages that don't yet load
    // chitti_lang.js.
    if (global.Chitti && global.Chitti.lang && Array.isArray(global.Chitti.lang.list)) {
      return global.Chitti.lang.list;
    }
    return [{ code: 'en', label: 'English', native: 'English' }];
  }

  function injectStyles() {
    if (document.getElementById('chitti-dp-styles')) return;
    var css =
      // Backdrop — clicking it closes the modal (save current state).
      '#' + MODAL_ID + '{position:fixed;inset:0;background:rgba(14,35,68,0.78);' +
      'z-index:99998;display:flex;align-items:center;justify-content:center;' +
      'padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
      'opacity:0;transition:opacity .2s ease;cursor:pointer}' +
      '#' + MODAL_ID + '.show{opacity:1}' +
      // Card is a flex column with sticky header + scrollable body + sticky
      // footer so X (top) and Skip/Save (bottom) are ALWAYS visible even
      // at 375×600px, regardless of how many options the user picks.
      '#' + MODAL_ID + ' .chitti-dp-card{background:#fff;max-width:380px;width:100%;' +
      'max-height:92vh;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.35);' +
      'display:flex;flex-direction:column;cursor:default;position:relative;overflow:hidden}' +
      // Sticky top: flag stripe + close button.
      '#' + MODAL_ID + ' .chitti-dp-flag{flex-shrink:0;height:6px;background:linear-gradient(to right,' +
      'var(--saffron,#FF9933) 33%, #ffffff 33%, #ffffff 66%, var(--green-flag,#138808) 66%)}' +
      '#' + MODAL_ID + ' .chitti-dp-close{position:absolute;top:10px;right:10px;z-index:5;' +
      'width:36px;height:36px;border-radius:50%;border:1.5px solid #cbd5e1;background:#fff;' +
      'color:var(--navy,#000080);font-size:18px;line-height:1;font-weight:900;cursor:pointer;' +
      'display:inline-flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.08);' +
      'transition:background .15s,border-color .15s,transform .1s}' +
      '#' + MODAL_ID + ' .chitti-dp-close:hover{background:#fef2f2;border-color:#fecaca;color:#b91c1c}' +
      '#' + MODAL_ID + ' .chitti-dp-close:active{transform:scale(.95)}' +
      // Scrollable body — only the middle scrolls, header + footer stay put.
      '#' + MODAL_ID + ' .chitti-dp-body{padding:18px 18px 10px;overflow-y:auto;flex:1;min-height:0;-webkit-overflow-scrolling:touch}' +
      '#' + MODAL_ID + ' .chitti-dp-title{margin:0 36px 4px 0;font-size:18px;font-weight:900;' +
      'color:var(--navy,#000080);line-height:1.3}' +
      '#' + MODAL_ID + ' .chitti-dp-sub{margin:0 0 14px;font-size:13.5px;color:#475569;line-height:1.45}' +
      '#' + MODAL_ID + ' .chitti-dp-lang{display:flex;gap:8px;align-items:center;' +
      'margin:0 0 14px;font-size:13px}' +
      '#' + MODAL_ID + ' .chitti-dp-lang select{flex:1;min-height:44px;padding:8px 10px;' +
      'border:1.5px solid #cbd5e1;border-radius:10px;font-size:14px;background:#fff}' +
      '#' + MODAL_ID + ' .chitti-dp-opts{display:flex;flex-direction:column;gap:8px;' +
      'margin:0 0 12px;padding:0;list-style:none}' +
      '#' + MODAL_ID + ' .chitti-dp-opts label{display:flex;align-items:center;gap:10px;' +
      'min-height:48px;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:10px;' +
      'cursor:pointer;font-size:14px;color:#0f172a;background:#f8fafc;transition:background .15s,border-color .15s}' +
      '#' + MODAL_ID + ' .chitti-dp-opts label:hover{background:#fff7ee;border-color:var(--saffron,#FF9933)}' +
      '#' + MODAL_ID + ' .chitti-dp-opts input{width:22px;height:22px;accent-color:var(--saffron,#FF9933);flex-shrink:0}' +
      '#' + MODAL_ID + ' .chitti-dp-opts .em{font-size:20px;flex-shrink:0;width:24px;text-align:center}' +
      '#' + MODAL_ID + ' .chitti-dp-rural{display:flex;align-items:center;gap:10px;' +
      'min-height:48px;padding:8px 10px;border:1.5px dashed #cbd5e1;border-radius:10px;' +
      'margin:0 0 14px;background:#fff;font-size:13.5px;color:#475569}' +
      '#' + MODAL_ID + ' .chitti-dp-rural input{width:22px;height:22px;accent-color:var(--green-flag,#138808)}' +
      // Sticky footer — Save + Skip always visible even if body scrolls.
      '#' + MODAL_ID + ' .chitti-dp-footer{flex-shrink:0;padding:12px 18px 16px;background:#fff;border-top:1px solid #e2e8f0;display:flex;flex-direction:column;gap:8px}' +
      '#' + MODAL_ID + ' .chitti-dp-actions{display:flex;flex-direction:column;gap:8px}' +
      '#' + MODAL_ID + ' .chitti-dp-actions button{min-height:48px;padding:10px 14px;' +
      'border:none;border-radius:10px;font-size:15px;font-weight:800;cursor:pointer}' +
      '#' + MODAL_ID + ' .chitti-dp-save{background:linear-gradient(135deg,var(--saffron,#FF9933),var(--green-flag,#138808));color:#fff}' +
      '#' + MODAL_ID + ' .chitti-dp-skip{background:#f1f5f9;color:#475569;font-weight:700}' +
      '#' + MODAL_ID + ' .chitti-dp-foot{margin:0;font-size:11px;color:#475569;text-align:center;line-height:1.35}' +
      // Tighter padding on narrow phones (375px and below).
      '@media(max-width:380px){#' + MODAL_ID + '{padding:8px}' +
      '#' + MODAL_ID + ' .chitti-dp-body{padding:14px 14px 8px}' +
      '#' + MODAL_ID + ' .chitti-dp-footer{padding:10px 14px 12px}' +
      '#' + MODAL_ID + ' .chitti-dp-title{font-size:17px}' +
      '#' + MODAL_ID + ' .chitti-dp-close{width:34px;height:34px;top:8px;right:8px}}';
    var s = document.createElement('style');
    s.id = 'chitti-dp-styles';
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  function buildModal() {
    injectStyles();
    var initialLang = detectInitialLang();
    var langs = langList();

    var bg = document.createElement('div');
    bg.id = MODAL_ID;
    bg.setAttribute('role', 'dialog');
    bg.setAttribute('aria-modal', 'true');
    bg.setAttribute('aria-labelledby', 'chitti-dp-title');

    var optsHtml = OPTIONS.map(function (o) {
      // Honest minimum: EN labels with HI when chitti_lang.js's MutationObserver
      // hasn't translated yet. We surface both so the multilingual user
      // sees something familiar even before translation kicks in.
      var label = o.en;
      if (initialLang === 'hi' && o.hi) label = o.hi;
      return (
        '<li><label>' +
        '<input type="checkbox" data-key="' + o.key + '" aria-label="' + o.en + '">' +
        '<span class="em" aria-hidden="true">' + o.emoji + '</span>' +
        '<span class="lbl">' + label + '</span>' +
        '</label></li>'
      );
    }).join('');

    var langOptsHtml = langs.map(function (l) {
      var sel = l.code === initialLang ? ' selected' : '';
      return '<option value="' + l.code + '"' + sel + '>' + l.native + ' · ' + l.label + '</option>';
    }).join('');

    bg.innerHTML =
      '<div class="chitti-dp-card">' +
      '  <div class="chitti-dp-flag" aria-hidden="true"></div>' +
      // ── X close button — top right, ALWAYS visible (sticky on card),
      //    tap closes the modal + saves current state so it never re-shows.
      '  <button type="button" class="chitti-dp-close" aria-label="' +
      (initialLang === 'hi' ? 'बंद करें' : 'Close') + '">✕</button>' +
      // ── Scrollable body: title, sub, lang, options, rural. Sticky
      //    footer below keeps Save + Skip always visible.
      '  <div class="chitti-dp-body">' +
      '    <h2 id="chitti-dp-title" class="chitti-dp-title">' +
      (initialLang === 'hi' ? 'चित्ती को आपके बारे में थोड़ा बताइए' : 'Help Chitti help you better') +
      '    </h2>' +
      '    <p class="chitti-dp-sub">' +
      (initialLang === 'hi'
        ? 'जो भी आप पर लागू हो उसे चुनिए। आप कभी भी ✕ टैप करके आगे बढ़ सकते हैं — सब कुछ इसी डिवाइस में रहता है।'
        : 'Tap anything that applies — or tap ✕ to skip. Saved on THIS device only, never on a server. Won’t ask again.') +
      '    </p>' +
      '    <div class="chitti-dp-lang">' +
      '      <label for="chitti-dp-lang-select">🗣️</label>' +
      '      <select id="chitti-dp-lang-select" aria-label="Language">' + langOptsHtml + '</select>' +
      '    </div>' +
      '    <ul class="chitti-dp-opts">' + optsHtml + '</ul>' +
      '    <label class="chitti-dp-rural">' +
      '      <input type="checkbox" data-key="rural">' +
      '      <span>📶 ' +
      (initialLang === 'hi' ? 'गाँव / धीमा इंटरनेट' : 'Rural / slow internet') +
      '      </span>' +
      '    </label>' +
      '  </div>' +
      // ── Sticky footer — Save + Skip ALWAYS visible regardless of body
      //    scroll height. Solves "Sire couldn’t see Skip" report.
      '  <div class="chitti-dp-footer">' +
      '    <div class="chitti-dp-actions">' +
      '      <button type="button" class="chitti-dp-save">' +
      (initialLang === 'hi' ? '✅ सहेजें' : '✅ Save my profile') +
      '      </button>' +
      '      <button type="button" class="chitti-dp-skip">' +
      (initialLang === 'hi' ? 'अभी नहीं — स्किप' : 'Skip — none of these') +
      '      </button>' +
      '    </div>' +
      '    <p class="chitti-dp-foot">SAHAYAI · ' +
      (initialLang === 'hi' ? 'आपकी प्रोफ़ाइल केवल इसी डिवाइस पर · कभी दोबारा नहीं पूछा जाएगा' : 'On-device only · won’t ask again') +
      '    </p>' +
      '  </div>' +
      '</div>';
    return bg;
  }

  function close(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(function () {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    }, 220);
  }

  function speak(text, lang) {
    try {
      if (!('speechSynthesis' in window)) return;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang || 'en-IN';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch (e) { /* honest skip */ }
  }

  function showModal() {
    if (document.getElementById(MODAL_ID)) return;
    var modal = buildModal();
    document.body.appendChild(modal);
    // Allow next paint, then fade in.
    requestAnimationFrame(function () { modal.classList.add('show'); });

    // Voice-out the heading once for blind / illiterate users. They
    // probably haven't ticked the option yet — so we always speak the
    // greeting at modest volume. Web Speech is the §2 voice substrate
    // (Voice Factory cascade will replace it once a TTS supplier is
    // wired through chitti_a11y.speak).
    var initialLang = detectInitialLang();
    var greet = initialLang === 'hi'
      ? 'चित्ती को आपके बारे में थोड़ा बताइए — जो आप पर लागू हो उसे टैप करें।'
      : 'Help Chitti help you better. Tap anything that applies to you, then tap Save.';
    setTimeout(function () { speak(greet, initialLang === 'hi' ? 'hi-IN' : 'en-IN'); }, 400);

    function collect() {
      var profile = { ts: new Date().toISOString(), skipped: false };
      var anyChecked = false;
      OPTIONS.forEach(function (o) {
        var box = modal.querySelector('input[data-key="' + o.key + '"]');
        profile[o.key] = !!(box && box.checked);
        if (profile[o.key]) anyChecked = true;
      });
      var ruralBox = modal.querySelector('input[data-key="rural"]');
      profile.rural = !!(ruralBox && ruralBox.checked);
      if (profile.rural) anyChecked = true;
      var sel = modal.querySelector('#chitti-dp-lang-select');
      profile.lang = sel ? sel.value : initialLang;
      // If the user did not tick anything but did pick a language,
      // that's still a meaningful choice — keep it as non-skipped so
      // chitti_warmup.js + chitti_a11y.js use the language.
      // If NOTHING was touched at all, mark skipped:true so the rest
      // of the platform knows the user opted out.
      if (!anyChecked && profile.lang === initialLang) {
        return { skipped: true, lang: profile.lang, ts: profile.ts };
      }
      return profile;
    }

    // Centralised close-and-save. Every path (Save button, Skip button,
    // X button, backdrop click, Esc key) routes through here so the
    // profile is ALWAYS written to localStorage before the modal goes
    // away. Locked invariant: once the modal closes, it NEVER re-shows
    // on this device (until Chitti.disabilityProfile.clear() is called
    // explicitly from a settings page).
    function commitAndClose(reason) {
      try {
        var p = collect();
        // Tag the close reason so the founder dashboard / cert can see
        // how users actually dismiss the prompt.
        p.closed_via = reason;
        writeStorage(p);
        // Sync lang into the legacy chitti_lang key so chitti_warmup.js
        // and any other consumer reads the user's choice without reload.
        if (p.lang) { try { localStorage.setItem('chitti_lang', p.lang); } catch (e) {} }
        if (p.lang && global.Chitti && global.Chitti.lang && typeof global.Chitti.lang.set === 'function') {
          try { global.Chitti.lang.set(p.lang); } catch (e) {}
        }
        try {
          document.dispatchEvent(new CustomEvent('chitti:disability_profile', { detail: p }));
        } catch (e) {}
      } catch (e) {
        // Even if collect/write throws, FALL THROUGH and force-store a
        // skipped record so the user is never blocked again. The whole
        // point of this fix is "Sire can always close the modal".
        try {
          writeStorage({ skipped: true, closed_via: reason || 'forced', ts: new Date().toISOString() });
        } catch (_) {}
      }
      close(modal);
    }

    // Save → explicit "save my picks"
    modal.querySelector('.chitti-dp-save').addEventListener('click', function (e) {
      e.stopPropagation();
      commitAndClose('save');
    });

    // Skip → explicit "none of these"
    modal.querySelector('.chitti-dp-skip').addEventListener('click', function (e) {
      e.stopPropagation();
      try {
        writeStorage({ skipped: true, closed_via: 'skip', ts: new Date().toISOString() });
        var sel = modal.querySelector('#chitti-dp-lang-select');
        if (sel) { try { localStorage.setItem('chitti_lang', sel.value); } catch (_) {} }
        document.dispatchEvent(new CustomEvent('chitti:disability_profile', { detail: { skipped: true } }));
      } catch (_) {}
      close(modal);
    });

    // X button — top right of the card. Same as Skip but more discoverable.
    modal.querySelector('.chitti-dp-close').addEventListener('click', function (e) {
      e.stopPropagation();
      commitAndClose('x-button');
    });

    // Backdrop click — tapping ANYWHERE outside the card closes the modal
    // and saves the current state. The card itself has cursor:default
    // and click-stops below so taps INSIDE the card don't close it.
    modal.addEventListener('click', function (e) {
      if (e.target === modal) commitAndClose('backdrop');
    });
    // Card swallows clicks so they don't bubble to the backdrop handler.
    var cardEl = modal.querySelector('.chitti-dp-card');
    if (cardEl) {
      cardEl.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    // Esc key — same as X (close + save). Mute-user safe (keyboard
    // tap counts as a tap; the X button is also tap-only via .click()).
    var escHandler = function (e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', escHandler);
        commitAndClose('esc');
      }
    };
    document.addEventListener('keydown', escHandler);

    // Focus the X button so a screen-reader user lands on the
    // "you can leave any time" affordance FIRST, before the option list.
    setTimeout(function () {
      var closeBtn = modal.querySelector('.chitti-dp-close');
      if (closeBtn) closeBtn.focus();
    }, 250);
  }

  function maybeShow() {
    if (isOptedOut()) return;
    if (readStorage()) return; // already set (or skipped)
    if (document.body) {
      showModal();
    } else {
      document.addEventListener('DOMContentLoaded', showModal);
    }
  }

  // Public API.
  global.Chitti = global.Chitti || {};
  global.Chitti.disabilityProfile = {
    get: readStorage,
    set: function (obj) { writeStorage(obj); },
    clear: function () { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} },
    open: showModal,            // force-open even if already saved (settings page)
    maybeShow: maybeShow,       // re-evaluate on demand
    STORAGE_KEY: STORAGE_KEY,
  };

  // Wait until chitti_lang.js has had a chance to load so the lang dropdown
  // gets its full 26-language list. If chitti_lang.js doesn't load (some
  // legacy page), the dropdown falls back to EN-only — modal still works.
  function init() {
    // Defer one tick so chitti_lang.js, which is often the LAST script
    // on the page, gets a chance to register window.Chitti.lang.list.
    setTimeout(maybeShow, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
