/* chitti_card_widget.js — universal in-card 5-element widget across ALL Chittis
 * ===================================================================
 * Sire 2026-05-29 — replaces the Vaani-inline copy with a substrate that
 * targets every Chitti page's card pattern. Inherits canonical English
 * box_id (stable across languages, via _chittiOrig OR data-i18n attribute)
 * so the founder dashboard groups same-card feedback across all langs.
 *
 * Default selector covers the conventions in the repo:
 *   .pro-card        (Vaani action buttons)
 *   .scan-action     (MedUPI scan tiles)
 *   .feature-card    (planned/used on news-ai, government)
 *   .action-card     (used on 2wheeler, 4wheeler, upi, scanner)
 *   [data-chitti-card] (explicit opt-in for any page)
 *
 * Per-page override:
 *   <meta name="chitti-card-selector" content=".my-card">
 *   <meta name="chitti-card-disable"  content="on">
 *
 * Each detected card MUST have a label-like child (.lbl / .label / .name /
 * .title / h3 / h4) — that prevents the widget from attaching to wrapper
 * .card containers (e.g. header bars).
 *
 * Auto-loaded by chitti_a11y.js. ===================================================================
 */
(function () {
  if (window.__chittiCardWidgetLoaded) return;
  window.__chittiCardWidgetLoaded = true;

  var disableMeta = document.querySelector('meta[name="chitti-card-disable"]');
  if (disableMeta && /^on$/i.test(disableMeta.getAttribute('content') || '')) return;

  // Universal selector — covers every known card pattern across all 18
  // Chitti pages (per CTO_CHITTI_AUDIT_2026-05-29.md survey).
  // Class fragments that legitimately mark a feature card. Children of cards
  // (.foo-card-lbl, .foo-card-title etc.) are filtered out by structural
  // check below — only the parent card gets the widget.
  var DEFAULT_SELECTOR = [
    '.pro-card', '.scan-action', '.feature-card', '.action-card',
    '[data-chitti-card]',
    '.scheme-card', '.act-card', '.kv-card', '.cat-card', '.med-card',
    '.art-card', '.section-card', '.rule-card', '.sample-card',
    '.cap-card', '.course-card',
    '.cv-card', '.ind-card', '.insight-card', '.learn-card', '.metric-card',
    '.scan-card', '.coming-soon-card',
    '.sds-card', '.sds-health-card', '.mb-soon-card', '.mc-soon-card',
    '.platform-tile', '.fa-tile', '.na-cert-card', '.try-card', '.success-card-preview'
  ].join(', ');
  // Page-level <meta name="chitti-card-selector"> is ADDITIVE — its content
  // is appended to the default selector, not replacing it. So a page that
  // adds <meta content=".card"> gets BOTH the universal defaults AND .card.
  var selectorMeta = document.querySelector('meta[name="chitti-card-selector"]');
  var SELECTOR = DEFAULT_SELECTOR;
  if (selectorMeta) {
    var extra = (selectorMeta.getAttribute('content') || '').trim();
    if (extra) SELECTOR = DEFAULT_SELECTOR + ', ' + extra;
  }

  // Structural filter — only attach to elements that ACT like a card:
  //   - has a heading-like child (h1-h6, .lbl, .title, .name, .label)
  //   - has enough text body (>= 12 chars combined text, excluding nav)
  //   - is NOT a child of another card (we only widget the OUTERMOST card)
  //   - is NOT itself a widget bar
  function isRealCard(el) {
    if (!el || el._cwBuilt) return false;
    if (el.classList && (el.classList.contains('pro-card-widget') ||
                          el.classList.contains('chitti-card-widget') ||
                          el.classList.contains('pro-card-fb') ||
                          el.classList.contains('chitti-card-fb'))) return false;
    var lbl = el.querySelector(LABEL_SELECTOR);
    if (!lbl) return false;
    var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    // Loosened from 12 → 6 chars (Sire 2026-05-29 — News / News AI / Shares
    // Tech use cards with short labels that 12 was rejecting)
    if (text.length < 6) return false;
    return true;
  }

  var LABEL_SELECTOR = '.lbl, .label, .name, .title, h3, h4';
  var DESC_SELECTOR  = '.sub, .desc, .description';

  var FB_URL =
    window.CHITTI_FEEDBACK_API ||
    'https://chitti-vaani-api-production.up.railway.app/api/feedback/collect';

  var PAGE = (function () {
    var p = (location.pathname.split('/').pop() || 'unknown');
    return p.replace(/\.html$/, '') || 'unknown';
  })();

  function getLang(){ return (document.documentElement.lang || 'en').split('-')[0]; }

  // Canonical box id — stable across language switches.
  // Priority: data-i18n attr on the label > _chittiOrig of the label text node
  //          > textContent of label.
  function getCanonical(card){
    var lbl = card.querySelector(LABEL_SELECTOR);
    if (!lbl) return 'unknown';
    if (lbl.dataset && lbl.dataset.i18n) return String(lbl.dataset.i18n).trim();
    var node = lbl.firstChild;
    if (node && node._chittiOrig) return node._chittiOrig.replace(/\s+/g, ' ').trim();
    return (lbl.textContent || '').replace(/\s+/g, ' ').trim() || 'unknown';
  }
  function getDisplay(card){
    var lbl = card.querySelector(LABEL_SELECTOR);
    return lbl ? (lbl.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }
  function getDesc(card){
    var sub = card.querySelector(DESC_SELECTOR);
    return sub ? (sub.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  function saveLocal(section, type, text){
    var key = 'chitti_card_fb_v1';
    var data = {};
    try { data = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) {}
    var k = PAGE + ':' + section;
    data[k] = data[k] || [];
    data[k].push({ type: type, text: text || '', lang: getLang(), t: Date.now() });
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  }
  function postBackend(section, type, text, display, desc){
    try {
      fetch(FB_URL, {
        method: 'POST', mode: 'cors', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          box_id: PAGE + '-card-' + section,
          section: section,
          display_label: display || section,
          description: desc || '',
          type: 'card_' + type,
          text: text || '',
          lang: getLang(),
          page: PAGE,
          ts_ms: Date.now()
        })
      }).catch(function () {});
    } catch (e) {}
  }
  function recordFb(card, type, text){
    var section = getCanonical(card);
    saveLocal(section, type, text);
    postBackend(section, type, text, getDisplay(card), getDesc(card));
  }

  function injectStyles(){
    if (document.getElementById('chitti-card-widget-style')) return;
    var st = document.createElement('style');
    st.id = 'chitti-card-widget-style';
    st.textContent = [
      '.chitti-card-widget{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:10px;padding-top:8px;border-top:1px dashed #e5e7eb;width:100%}',
      '.chitti-card-widget [role="button"]{cursor:pointer;padding:6px 10px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;line-height:1;display:inline-flex;align-items:center;min-width:36px;min-height:36px;justify-content:center;color:#0E2344;transition:transform .08s,background .12s}',
      '.chitti-card-widget [role="button"]:hover{background:#f1f5f9}',
      '.chitti-card-widget [role="button"]:active{transform:scale(.94)}',
      '.chitti-card-fb{display:block;margin-top:8px;padding:8px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;width:100%;text-align:left}',
      '.chitti-card-fb textarea{width:100%;padding:6px 8px;border:1px solid #e5e7eb;border-radius:6px;font-family:inherit;font-size:13px;min-height:50px;resize:vertical;color:#0f172a;background:#fff}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function icon(emoji, label){
    var s = document.createElement('span');
    s.setAttribute('role','button');
    s.setAttribute('tabindex','0');
    s.setAttribute('aria-label', label);
    s.textContent = emoji;
    function block(e){ e.stopPropagation(); }
    s.addEventListener('click', block, true);
    s.addEventListener('mousedown', block, true);
    s.addEventListener('touchstart', block, true);
    return s;
  }

  function openFb(card){
    if (card._fbOpen) return;
    card._fbOpen = true;
    var wrap = document.createElement('span');
    wrap.className = 'chitti-card-fb';
    wrap.addEventListener('click', function (e) { e.stopPropagation(); }, true);
    var head = document.createElement('div');
    head.style.cssText = 'font-size:12px;font-weight:600;color:#475569;margin-bottom:4px';
    head.textContent = '✏️ Sire, what is broken or what should change?';
    var ta = document.createElement('textarea');
    ta.placeholder = 'Type or tap 🎙️ to speak…';
    ta.addEventListener('click', function (e) { e.stopPropagation(); });
    ta.addEventListener('keydown', function (e) { e.stopPropagation(); });
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:6px;justify-content:flex-end;margin-top:6px';
    var mic = document.createElement('span');
    mic.textContent = '🎙️';
    mic.setAttribute('role','button');
    mic.setAttribute('tabindex','0');
    mic.style.cssText = 'cursor:pointer;padding:6px 10px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;font-size:14px';
    mic.addEventListener('click', function (e) {
      e.stopPropagation();
      var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Rec) { ta.placeholder = 'Voice not supported · type please'; return; }
      try {
        var r = new Rec();
        r.lang = getLang() + '-IN';
        r.onresult = function (ev) { ta.value = (ta.value ? ta.value + ' ' : '') + ev.results[0][0].transcript; };
        r.start();
      } catch (e2) {}
    });
    var ok = document.createElement('span');
    ok.textContent = 'Save';
    ok.setAttribute('role','button');
    ok.setAttribute('tabindex','0');
    ok.style.cssText = 'cursor:pointer;padding:6px 12px;background:#000080;color:#fff;border-radius:6px;font-weight:600;font-size:13px';
    ok.addEventListener('click', function (e) {
      e.stopPropagation();
      var v = ta.value.trim();
      if (!v) { ta.focus(); return; }
      recordFb(card, 'text', v);
      wrap.innerHTML = '<div style="font-size:13px;color:#138808;text-align:center;padding:4px">✓ Thanks Sire, saved</div>';
      setTimeout(function () { wrap.remove(); card._fbOpen = false; }, 1500);
    });
    row.appendChild(mic); row.appendChild(ok);
    wrap.appendChild(head); wrap.appendChild(ta); wrap.appendChild(row);
    card.appendChild(wrap);
    setTimeout(function () { ta.focus(); }, 50);
  }

  function buildWidget(card){
    if (card._cwBuilt) return;
    card._cwBuilt = true;
    // Skip if the card has no label-like child (prevents widget bars on
    // wrapper containers that happen to match the selector).
    if (!card.querySelector(LABEL_SELECTOR)) return;
    // Skip if feedback-widget.js already attached its own bar to this element
    // (data-chitti-response boxes get the per-response bar — don't double).
    if (card.querySelector('.chitti-feedback-bar, .pro-card-widget, .chitti-card-widget')) return;
    if (card.hasAttribute('data-chitti-response')) return;

    var bar = document.createElement('span');
    bar.className = 'chitti-card-widget';

    var sp = icon('🔊', 'Read aloud');
    sp.addEventListener('click', function () {
      if (!('speechSynthesis' in window)) return;
      var text = (getDisplay(card) || '') + '. ' + (getDesc(card) || '');
      var u = new SpeechSynthesisUtterance(text);
      u.lang = getLang() + '-IN';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    });

    var ex = icon('🤖', 'Ask Chitti to explain this card');
    ex.addEventListener('click', function () {
      var q = window.prompt('Ask Chitti about ' + getDisplay(card) + ':', '');
      if (q) recordFb(card, 'explain', q);
    });

    var up = icon('👍', 'Working');
    up.addEventListener('click', function () {
      up.style.background = '#dcfce7'; up.style.borderColor = '#138808';
      recordFb(card, 'up', '');
    });

    var dn = icon('👎', 'Broken');
    dn.addEventListener('click', function () {
      dn.style.background = '#fee2e2'; dn.style.borderColor = '#dc2626';
      recordFb(card, 'down', '');
      openFb(card);
    });

    var pe = icon('✏️', 'Sire — type or speak feedback');
    pe.addEventListener('click', function () { openFb(card); });

    bar.appendChild(sp); bar.appendChild(ex); bar.appendChild(up); bar.appendChild(dn); bar.appendChild(pe);
    card.appendChild(bar);
  }

  function scan(){
    var matched = document.querySelectorAll(SELECTOR);
    // First pass: filter to real cards
    var real = [];
    matched.forEach(function (el) { if (isRealCard(el)) real.push(el); });
    // Second pass: drop cards that contain other real cards (only attach to leafmost cards)
    var leafs = real.filter(function (el) {
      for (var i = 0; i < real.length; i++) {
        if (real[i] !== el && el.contains(real[i])) return false;
      }
      return true;
    });
    leafs.forEach(buildWidget);
  }

  function init(){
    injectStyles();
    scan();
    // Re-scan when DOM mutates (cards added by JS — e.g. dynamic tabs).
    if (typeof MutationObserver === 'function') {
      var pending = false;
      var obs = new MutationObserver(function () {
        if (pending) return;
        pending = true;
        (window.requestAnimationFrame || function (fn) { setTimeout(fn, 16); })(function () {
          pending = false;
          scan();
        });
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Expose for debug
  window.Chitti = window.Chitti || {};
  window.Chitti.cardWidget = { scan: scan, selector: SELECTOR, endpoint: FB_URL };
})();
