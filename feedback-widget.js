// feedback-widget.js
// Tap-to-rate footer widget for every Chitti product page.
// Include with: <script src="feedback-widget.js" data-page="chitti_government"></script>
// The data-page attribute is the page key sent to the backend. If omitted,
// the widget infers it from the filename (e.g. "chitti_government.html" → "chitti_government").
//
// Backend endpoint:  POST {API}/api/feedback/collect
// Override base URL with window.CHITTI_FEEDBACK_API before this script loads.

(function () {
  if (window.__chittiFeedbackWidgetLoaded) return;
  window.__chittiFeedbackWidgetLoaded = true;

  // ── config ───────────────────────────────────────────────────────────
  var API_BASE =
    (typeof window !== 'undefined' && window.CHITTI_FEEDBACK_API) ||
    'https://chitti-vaani-api.onrender.com';

  function pageKey() {
    var s = document.currentScript;
    if (s && s.dataset && s.dataset.page) return String(s.dataset.page);
    try {
      var f = (location.pathname.split('/').pop() || '').toLowerCase();
      f = f.replace(/\.html?$/, '') || 'unknown';
      return f;
    } catch (e) { return 'unknown'; }
  }

  // user_segment is sticky per-device. The Have-A-Suggestion modal asks once;
  // 👍/👎 just send "general" until the user has self-identified.
  function getSegment() {
    try { return localStorage.getItem('chitti_user_segment') || 'general'; }
    catch (e) { return 'general'; }
  }
  function setSegment(seg) {
    try { localStorage.setItem('chitti_user_segment', seg); } catch (e) {}
  }

  // ── styles ───────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('chitti-feedback-widget-styles')) return;
    var css = ''
      + '.chitti-fb-wrap{margin:32px auto 24px;max-width:720px;padding:0 16px;font-family:Inter,"Segoe UI",system-ui,sans-serif;}'
      + '.chitti-fb-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:18px 20px;box-shadow:0 2px 8px rgba(14,35,68,.06);}'
      + '.chitti-fb-title{font-size:15px;font-weight:600;color:#0E2344;margin:0 0 12px;display:flex;align-items:center;gap:8px;}'
      + '.chitti-fb-row{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px;}'
      + '.chitti-fb-btn{appearance:none;border:1px solid #e5e7eb;background:#f9fafb;color:#0E2344;padding:10px 14px;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;min-width:64px;transition:transform .08s ease,background .12s ease;}'
      + '.chitti-fb-btn:hover{background:#f1f5f9;}'
      + '.chitti-fb-btn:active{transform:scale(.97);}'
      + '.chitti-fb-btn.up.active{background:#dcfce7;border-color:#86efac;color:#14532d;}'
      + '.chitti-fb-btn.down.active{background:#fee2e2;border-color:#fca5a5;color:#7f1d1d;}'
      + '.chitti-fb-btn.suggest{background:#fff8e1;border-color:#ffe082;color:#92400e;flex:1;min-width:200px;text-align:left;}'
      + '.chitti-fb-help{font-size:13px;color:#475569;line-height:1.55;margin:6px 0 0;}'
      + '.chitti-fb-help b{color:#0E2344;}'
      + '.chitti-fb-toast{position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#0E2344;color:#fff;padding:10px 16px;border-radius:10px;font-size:14px;box-shadow:0 6px 24px rgba(14,35,68,.25);z-index:99999;opacity:0;transition:opacity .2s ease;}'
      + '.chitti-fb-toast.show{opacity:1;}'
      + '.chitti-fb-modal-bg{position:fixed;inset:0;background:rgba(14,35,68,.55);display:none;align-items:center;justify-content:center;z-index:99998;padding:16px;}'
      + '.chitti-fb-modal-bg.show{display:flex;}'
      + '.chitti-fb-modal{background:#fff;border-radius:14px;padding:22px;width:100%;max-width:480px;box-shadow:0 16px 40px rgba(14,35,68,.25);}'
      + '.chitti-fb-modal h3{margin:0 0 6px;color:#0E2344;font-size:18px;}'
      + '.chitti-fb-modal p{margin:0 0 14px;font-size:13px;color:#475569;}'
      + '.chitti-fb-modal label{display:block;font-size:12px;font-weight:600;color:#334155;margin:10px 0 4px;}'
      + '.chitti-fb-modal textarea,.chitti-fb-modal input[type=email],.chitti-fb-modal select{width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:10px;font-size:14px;font-family:inherit;box-sizing:border-box;}'
      + '.chitti-fb-modal textarea{min-height:96px;resize:vertical;}'
      + '.chitti-fb-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;}'
      + '.chitti-fb-cancel{background:#f1f5f9;color:#0E2344;border:none;padding:10px 16px;border-radius:8px;font-weight:600;cursor:pointer;}'
      + '.chitti-fb-submit{background:#0E2344;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-weight:600;cursor:pointer;}'
      + '.chitti-fb-submit:disabled{opacity:.6;cursor:not-allowed;}'
      + '@media (max-width:520px){.chitti-fb-btn.suggest{min-width:0;width:100%;}.chitti-fb-row{gap:8px;}}';
    var s = document.createElement('style');
    s.id = 'chitti-feedback-widget-styles';
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  // ── DOM ──────────────────────────────────────────────────────────────
  function buildWidget() {
    var wrap = document.createElement('section');
    wrap.className = 'chitti-fb-wrap';
    wrap.setAttribute('aria-label', 'Help us build better Chitti');
    wrap.innerHTML =
      '<div class="chitti-fb-card">' +
      '  <div class="chitti-fb-title">💬 Help us build better Chitti</div>' +
      '  <div class="chitti-fb-row">' +
      '    <button type="button" class="chitti-fb-btn up" data-vote="thumbs_up" aria-label="This page was helpful">👍</button>' +
      '    <button type="button" class="chitti-fb-btn down" data-vote="thumbs_down" aria-label="Something did not work">👎</button>' +
      '    <button type="button" class="chitti-fb-btn suggest" data-vote="suggestion">💡 Have a suggestion?</button>' +
      '  </div>' +
      '  <p class="chitti-fb-help">' +
      '    Tap <b>👍</b> if this page was helpful. ' +
      '    Tap <b>👎</b> if something didn\'t work. ' +
      '    Tap <b>💡</b> to share your idea.' +
      '  </p>' +
      '</div>';
    document.body.appendChild(wrap);

    var modalBg = document.createElement('div');
    modalBg.className = 'chitti-fb-modal-bg';
    modalBg.innerHTML =
      '<div class="chitti-fb-modal" role="dialog" aria-modal="true" aria-labelledby="chitti-fb-modal-title">' +
      '  <h3 id="chitti-fb-modal-title">💡 What would make Chitti better?</h3>' +
      '  <p>Type your idea below. We read every one — pre-launch, every line counts.</p>' +
      '  <label for="chitti-fb-text">Your suggestion</label>' +
      '  <textarea id="chitti-fb-text" placeholder="e.g. Add a way to read schemes aloud in Marathi..."></textarea>' +
      '  <label for="chitti-fb-email">Email (optional — only if you want a reply)</label>' +
      '  <input id="chitti-fb-email" type="email" placeholder="you@example.com" />' +
      '  <label for="chitti-fb-segment">Who is using Chitti? (optional)</label>' +
      '  <select id="chitti-fb-segment">' +
      '    <option value="general">Prefer not to say</option>' +
      '    <option value="blind">Blind / low-vision</option>' +
      '    <option value="deaf">Deaf / hard-of-hearing</option>' +
      '    <option value="mute">Mute / non-speaking</option>' +
      '    <option value="illiterate">Cannot read / write</option>' +
      '    <option value="elderly">Elderly</option>' +
      '  </select>' +
      '  <div class="chitti-fb-modal-actions">' +
      '    <button type="button" class="chitti-fb-cancel">Cancel</button>' +
      '    <button type="button" class="chitti-fb-submit">Submit</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(modalBg);
    return { wrap: wrap, modalBg: modalBg };
  }

  // ── toast ────────────────────────────────────────────────────────────
  var _toastTimer = null;
  function toast(msg) {
    var t = document.getElementById('chitti-fb-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'chitti-fb-toast';
      t.className = 'chitti-fb-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(function () { t.classList.add('show'); });
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  // ── network ──────────────────────────────────────────────────────────
  function send(payload) {
    payload.timestamp = new Date().toISOString();
    payload.page = payload.page || pageKey();
    payload.user_segment = payload.user_segment || getSegment();
    var url = API_BASE.replace(/\/+$/, '') + '/api/feedback/collect';
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // keepalive lets the request survive a page-unload, useful since the
      // widget sits in the footer and users may close the tab right after tapping.
      keepalive: true,
    });
  }

  // ── wire up ──────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    var els = buildWidget();
    var wrap = els.wrap;
    var modalBg = els.modalBg;
    var page = pageKey();

    // 👍 / 👎
    wrap.querySelectorAll('.chitti-fb-btn[data-vote="thumbs_up"], .chitti-fb-btn[data-vote="thumbs_down"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var vote = btn.getAttribute('data-vote');
        // visual lock — once tapped, the row settles on the chosen vote
        wrap.querySelectorAll('.chitti-fb-btn.up, .chitti-fb-btn.down').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        send({ page: page, type: vote, text: '', email: '' })
          .then(function () { toast('Thanks for your feedback!'); })
          .catch(function () { toast('Saved locally — we\'ll retry when you\'re back online.'); });
      });
    });

    // 💡 suggestion
    var suggestBtn = wrap.querySelector('.chitti-fb-btn.suggest');
    var modalText = modalBg.querySelector('#chitti-fb-text');
    var modalEmail = modalBg.querySelector('#chitti-fb-email');
    var modalSeg = modalBg.querySelector('#chitti-fb-segment');
    var cancelBtn = modalBg.querySelector('.chitti-fb-cancel');
    var submitBtn = modalBg.querySelector('.chitti-fb-submit');

    function openModal() {
      modalText.value = '';
      modalEmail.value = '';
      modalSeg.value = getSegment();
      modalBg.classList.add('show');
      setTimeout(function () { modalText.focus(); }, 50);
    }
    function closeModal() {
      modalBg.classList.remove('show');
    }
    suggestBtn.addEventListener('click', openModal);
    cancelBtn.addEventListener('click', closeModal);
    modalBg.addEventListener('click', function (ev) {
      if (ev.target === modalBg) closeModal();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && modalBg.classList.contains('show')) closeModal();
    });

    submitBtn.addEventListener('click', function () {
      var text = (modalText.value || '').trim();
      if (text.length < 3) {
        toast('Please type a few words about your idea.');
        modalText.focus();
        return;
      }
      var email = (modalEmail.value || '').trim();
      var seg = modalSeg.value || 'general';
      setSegment(seg);
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      send({ page: page, type: 'suggestion', text: text, email: email, user_segment: seg })
        .then(function () {
          closeModal();
          toast('Thanks — your idea is in!');
        })
        .catch(function () {
          closeModal();
          toast('Couldn\'t reach the server — please try again later.');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
