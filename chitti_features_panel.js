/* chitti_features_panel.js — shared logic for chitti_*_features.html pages
 * Reads window.CHITTI_FEATURES = { slug, label, lifeline, features: [{name, desc, status, try}] }
 * Renders cards. Each card gets the mandatory 5-element widget + status pill + notes textarea.
 * Saves thumbs + notes to localStorage scoped to (slug, feature_index).
 * Speaker uses Chitti.lang current language (TTS), falls back to SpeechSynthesis.
 * No external dependencies beyond chitti_lang.js / chitti_a11y.js (both load before this).
 */
(function () {
  'use strict';

  var P = window.CHITTI_FEATURES;
  if (!P || !Array.isArray(P.features)) {
    console.warn('[features-panel] window.CHITTI_FEATURES missing or invalid');
    return;
  }
  var SLUG = P.slug || 'unknown';
  var STORAGE_KEY = 'chitti_features_' + SLUG;

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
  }
  var STATE = loadState();

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'data') Object.keys(attrs.data).forEach(function (d) { n.dataset[d] = attrs.data[d]; });
        else n.setAttribute(k, attrs[k]);
      });
    }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  function statusPill(status) {
    var label = status === 'green' ? '🟢 WORKING' : status === 'red' ? '🔴 BROKEN' : '🟡 PARTIAL';
    return el('span', { class: 'cf-pill ' + status }, label);
  }

  function speak(text) {
    var lang = (window.Chitti && window.Chitti.lang && window.Chitti.lang.current()) || 'en';
    if (window.Chitti && window.Chitti.a11y && typeof window.Chitti.a11y.speak === 'function') {
      try { window.Chitti.a11y.speak(text, lang); return; } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      try {
        var u = new SpeechSynthesisUtterance(text);
        var mapped = { sa: 'hi-IN', mai: 'hi-IN', bho: 'hi-IN', raj: 'hi-IN', kru: 'hi-IN', hoc: 'hi-IN',
                       doi: 'hi-IN', kok: 'hi-IN', ne: 'hi-IN', ks: 'ur-PK', sd: 'ur-PK',
                       mni: 'bn-IN', sat: 'hi-IN' };
        u.lang = mapped[lang] || (lang === 'en' ? 'en-IN' : lang + '-IN');
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch (e) {}
    }
  }

  function showModal(feat) {
    var modal = el('div', { class: 'cf-modal show', role: 'dialog' });
    var inner = el('div', { class: 'cf-modal-inner' });
    inner.appendChild(el('h3', null, feat.name));
    inner.appendChild(el('p', null, feat.desc));
    if (feat.try) {
      var tryBlock = el('p', null, '🧪 Test action: ' + feat.try);
      tryBlock.style.background = '#f1f5f9';
      tryBlock.style.padding = '10px 12px';
      tryBlock.style.borderRadius = '8px';
      tryBlock.style.fontSize = '13px';
      inner.appendChild(tryBlock);
    }
    if (feat.link) {
      var openBtn = el('button', { class: 'cf-btn cf-try' }, '↗ Open live');
      openBtn.onclick = function () { window.open(feat.link, '_blank', 'noopener'); };
      inner.appendChild(openBtn);
    }
    var closeWrap = el('div', { class: 'cf-modal-actions' });
    var closeBtn = el('button', { class: 'cf-btn' }, 'Close');
    closeBtn.onclick = function () { document.body.removeChild(modal); };
    closeWrap.appendChild(closeBtn);
    inner.appendChild(closeWrap);
    modal.appendChild(inner);
    modal.onclick = function (e) { if (e.target === modal) document.body.removeChild(modal); };
    document.body.appendChild(modal);
  }

  function renderCard(feat, idx) {
    var fState = STATE[idx] || {};
    var card = el('article', {
      class: 'cf-card',
      data: { status: feat.status || 'yellow', 'chitti-response': SLUG + '-feat-' + idx }
    });

    var head = el('div', { class: 'cf-card-head' });
    head.appendChild(el('h3', { class: 'cf-card-name' }, feat.name));
    head.appendChild(statusPill(feat.status || 'yellow'));
    card.appendChild(head);

    card.appendChild(el('p', { class: 'cf-card-desc' }, feat.desc));

    var widget = el('div', { class: 'cf-card-widget' });

    var speakerBtn = el('button', { class: 'cf-btn', 'aria-label': 'Read aloud', title: 'Read aloud' }, '🔊');
    speakerBtn.onclick = function () { speak(feat.name + '. ' + feat.desc); };
    widget.appendChild(speakerBtn);

    var thumbUp = el('button', { class: 'cf-btn cf-thumb-up' + (fState.vote === 'up' ? ' is-active' : ''), 'aria-label': 'Working' }, '👍');
    var thumbDown = el('button', { class: 'cf-btn cf-thumb-down' + (fState.vote === 'down' ? ' is-active' : ''), 'aria-label': 'Broken' }, '👎');
    thumbUp.onclick = function () {
      STATE[idx] = STATE[idx] || {};
      STATE[idx].vote = STATE[idx].vote === 'up' ? null : 'up';
      saveState(STATE);
      thumbUp.classList.toggle('is-active', STATE[idx].vote === 'up');
      thumbDown.classList.remove('is-active');
    };
    thumbDown.onclick = function () {
      STATE[idx] = STATE[idx] || {};
      STATE[idx].vote = STATE[idx].vote === 'down' ? null : 'down';
      saveState(STATE);
      thumbDown.classList.toggle('is-active', STATE[idx].vote === 'down');
      thumbUp.classList.remove('is-active');
    };
    widget.appendChild(thumbUp);
    widget.appendChild(thumbDown);

    var tryBtn = el('button', { class: 'cf-btn cf-try' }, 'Try This');
    tryBtn.onclick = function () { showModal(feat); };
    widget.appendChild(tryBtn);

    card.appendChild(widget);

    var notesWrap = el('div', { class: 'cf-card-notes' });
    notesWrap.appendChild(el('label', { for: 'note-' + SLUG + '-' + idx }, "✏️ Sire's notes"));
    var ta = el('textarea', {
      id: 'note-' + SLUG + '-' + idx,
      placeholder: 'Your notes…',
      rows: '2'
    });
    ta.value = fState.notes || '';
    var saveTimer;
    ta.addEventListener('input', function () {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        STATE[idx] = STATE[idx] || {};
        STATE[idx].notes = ta.value;
        saveState(STATE);
      }, 300);
    });
    notesWrap.appendChild(ta);
    card.appendChild(notesWrap);

    return card;
  }

  function updateCounts() {
    var counts = { green: 0, yellow: 0, red: 0 };
    P.features.forEach(function (f) {
      var s = f.status || 'yellow';
      counts[s] = (counts[s] || 0) + 1;
    });
    var cEl = document.getElementById('cf-counts');
    if (cEl) {
      cEl.innerHTML = '🟢 <strong>' + counts.green + '</strong> Working · 🟡 <strong>' +
        counts.yellow + '</strong> Partial · 🔴 <strong>' + counts.red + '</strong> Broken · 📋 <strong>' +
        P.features.length + '</strong> Total';
    }
  }

  function render() {
    var mount = document.getElementById('features-mount');
    if (!mount) { console.warn('[features-panel] #features-mount missing'); return; }
    mount.innerHTML = '';
    P.features.forEach(function (f, i) {
      mount.appendChild(renderCard(f, i));
    });
    updateCounts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
