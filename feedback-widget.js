// feedback-widget.js  ·  Chitti Quality v2 — 2026-05-13
// =====================================================================
// 4-icon feedback footer on every Chitti response.
//   🔊 Speaker   — reads the page / last response aloud
//   🎙️ Chitti   — opens voice input to Chitti
//   👍           — quick thumbs up
//   👎           — "I'm sorry — what was wrong?" voice flow
//
// PWD-user contract:
//   - The four icons are big, labelled, and self-explanatory.
//   - 👎 NEVER opens a textbox first. Chitti speaks an apology in the user's
//     language, listens for the user's spoken feedback, then says
//     "Thank you. I will learn from this." Save to backend, end of flow.
//   - Voice OUT uses chitti_a11y.speak() if loaded, else SpeechSynthesis.
//   - Voice IN uses webkitSpeechRecognition. If unavailable, falls back to
//     a one-line textbox so the user is never trapped.
//   - Carbon footprint badge "🌿 ~0.2g CO2 for this reply" shown next to
//     the icons so trust signals stay visible.
//
// Include with:
//   <script src="feedback-widget.js" data-page="chitti_government"></script>
//
// Backend:  POST {API}/api/feedback/collect    (legacy — for older Chittis)
//           POST {API}/api/feedback           (canonical — lib/feedback.py)
// Override base URL with  window.CHITTI_FEEDBACK_API  before this loads.
//
// The widget detects 16 product pages from filename → risk level and
// shows the matching HIGH / MEDIUM / LOW badge. See lib/chitti_quality.py
// for the canonical risk map.
// =====================================================================

(function () {
  if (window.__chittiFeedbackWidgetLoaded) return;
  window.__chittiFeedbackWidgetLoaded = true;

  // ── config ───────────────────────────────────────────────────────────
  var API_BASE =
    (typeof window !== 'undefined' && window.CHITTI_FEEDBACK_API) ||
    'https://chitti-vaani-api.onrender.com';

  // Risk level per product page. HIGH = money/health/legal. MEDIUM = daily
  // commerce + accessibility-critical. LOW = info / dashboards.
  var RISK_MAP = {
    'chitti_medupi':     'HIGH',
    'chitti_upi':        'HIGH',
    'chitti_legal':      'HIGH',
    'chitti_ca':         'HIGH',
    'chitti_government': 'HIGH',
    'chitti_vaani':      'MEDIUM',
    'chitti_kirana':     'MEDIUM',
    'chitti_pharmacy':   'MEDIUM',
    'chitti_saloon':     'MEDIUM',
    'chitti_complete':            'MEDIUM',
    'chitti_complete_technical':  'MEDIUM',
    'chitti_fundamentals':        'MEDIUM',
    'chitti_news':              'LOW',
    'chitti_scanner':           'LOW',
    'chitti_voice_factory':     'LOW',
    'chitti_tourism':           'LOW',
  };

  // Approximate CO2 per response (g). DeepSeek averages ~0.2g for a typical
  // 200-token reply on shared GPU infra. We surface this as a trust signal.
  // Real per-response number lives in the response payload as `co2_g`; this
  // is the fallback when the backend doesn't supply one yet.
  var DEFAULT_CO2_G = 0.2;
  var CO2_FLAG_THRESHOLD_G = 0.5;  // >0.5g → flag for DeepSeek prompt optimisation

  function pageKey() {
    var s = document.currentScript;
    if (s && s.dataset && s.dataset.page) return String(s.dataset.page);
    try {
      var f = (location.pathname.split('/').pop() || '').toLowerCase();
      f = f.replace(/\.html?$/, '') || 'unknown';
      return f;
    } catch (e) { return 'unknown'; }
  }

  function getSegment() {
    try { return localStorage.getItem('chitti_user_segment') || 'general'; }
    catch (e) { return 'general'; }
  }
  function setSegment(seg) {
    try { localStorage.setItem('chitti_user_segment', seg); } catch (e) {}
  }
  function getLang() {
    try {
      if (window.Chitti && window.Chitti.a11y && window.Chitti.a11y.lang) {
        return window.Chitti.a11y.lang();
      }
      return localStorage.getItem('chitti_lang') || 'en-IN';
    } catch (e) { return 'en-IN'; }
  }

  // ── i18n — apology + thank-you in 11 Indian languages + en ──────────
  // Kept short. Voice OUT will read these verbatim.
  var APOLOGY = {
    'en':    "I'm sorry. What was wrong? Please tell me in your language.",
    'hi':    "मुझे माफ़ करें। क्या गलत हुआ? कृपया अपनी भाषा में बताएं।",
    'bn':    "আমি দুঃখিত। কী ভুল হলো? দয়া করে আপনার ভাষায় বলুন।",
    'ta':    "மன்னிக்கவும். என்ன தவறு? உங்கள் மொழியில் சொல்லுங்கள்.",
    'te':    "క్షమించండి. ఏం తప్పు జరిగింది? మీ భాషలో చెప్పండి.",
    'mr':    "मला माफ करा. काय चूक झाली? कृपया तुमच्या भाषेत सांगा.",
    'gu':    "માફ કરશો. શું ખોટું થયું? કૃપા કરી તમારી ભાષામાં કહો.",
    'kn':    "ಕ್ಷಮಿಸಿ. ಏನು ತಪ್ಪಾಯಿತು? ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಹೇಳಿ.",
    'ml':    "ക്ഷമിക്കണം. എന്ത് തെറ്റി? ദയവായി നിങ്ങളുടെ ഭാഷയിൽ പറയൂ.",
    'pa':    "ਮਾਫ਼ ਕਰਨਾ। ਕੀ ਗ਼ਲਤ ਹੋਇਆ? ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਦੱਸੋ।",
    'or':    "କ୍ଷମା କରନ୍ତୁ। କଣ ଭୁଲ ହେଲା? ଦୟାକରି ଆପଣଙ୍କ ଭାଷାରେ କୁହନ୍ତୁ।",
    'as':    "ক্ষমা কৰিব। কি ভুল হ'ল? অনুগ্ৰহ কৰি আপোনাৰ ভাষাত কওক।",
  };
  var THANKS = {
    'en':  "Thank you. I will learn from this.",
    'hi':  "धन्यवाद। मैं इससे सीखूंगा।",
    'bn':  "ধন্যবাদ। আমি এ থেকে শিখব।",
    'ta':  "நன்றி. நான் இதிலிருந்து கற்றுக்கொள்வேன்.",
    'te':  "ధన్యవాదాలు. నేను దీని నుండి నేర్చుకుంటాను.",
    'mr':  "धन्यवाद. मी यातून शिकेन.",
    'gu':  "આભાર. હું તેમાંથી શીખીશ.",
    'kn':  "ಧನ್ಯವಾದಗಳು. ನಾನು ಇದರಿಂದ ಕಲಿಯುತ್ತೇನೆ.",
    'ml':  "നന്ദി. ഞാൻ ഇതിൽ നിന്ന് പഠിക്കും.",
    'pa':  "ਧੰਨਵਾਦ। ਮੈਂ ਇਸ ਤੋਂ ਸਿੱਖਾਂਗਾ।",
    'or':  "ଧନ୍ୟବାଦ। ମୁଁ ଏଥିରୁ ଶିଖିବି।",
    'as':  "ধন্যবাদ। মই ইয়াৰ পৰা শিকিম।",
  };
  function tr(map, lang) {
    var base = (lang || 'en').split('-')[0].toLowerCase();
    return map[base] || map['en'];
  }

  // ── voice helpers ───────────────────────────────────────────────────
  function speak(text, lang) {
    try {
      if (window.Chitti && window.Chitti.a11y && typeof window.Chitti.a11y.speak === 'function') {
        return window.Chitti.a11y.speak(text);
      }
      if (window.speechSynthesis) {
        var u = new SpeechSynthesisUtterance(text);
        if (lang) u.lang = lang;
        u.rate = 0.95;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  }
  function listenOnce(lang, onResult, onError) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { onError && onError('unsupported'); return null; }
    try {
      var r = new SR();
      r.lang = lang || 'en-IN';
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.continuous = false;
      r.onresult = function (ev) {
        var t = (ev.results && ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript) || '';
        onResult && onResult(t.trim());
      };
      r.onerror = function (ev) { onError && onError(ev.error || 'error'); };
      r.onend = function () { /* no-op */ };
      r.start();
      return r;
    } catch (e) { onError && onError('start_failed'); return null; }
  }

  // ── styles ───────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('chitti-feedback-widget-styles')) return;
    var css = ''
      + '.chitti-fb-wrap{margin:32px auto 24px;max-width:720px;padding:0 16px;font-family:Inter,"Segoe UI",system-ui,sans-serif;}'
      + '.chitti-fb-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:18px 20px;box-shadow:0 2px 8px rgba(14,35,68,.06);}'
      + '.chitti-fb-title{font-size:15px;font-weight:600;color:#0E2344;margin:0 0 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}'
      + '.chitti-fb-row{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px;}'
      + '.chitti-fb-btn{appearance:none;border:1px solid #e5e7eb;background:#f9fafb;color:#0E2344;padding:14px 18px;border-radius:10px;font-size:22px;line-height:1;cursor:pointer;min-width:56px;min-height:56px;transition:transform .08s ease,background .12s ease;display:inline-flex;align-items:center;justify-content:center;gap:8px;}'
      + '.chitti-fb-btn .lbl{font-size:13px;font-weight:600;}'
      + '.chitti-fb-btn:hover{background:#f1f5f9;}'
      + '.chitti-fb-btn:active{transform:scale(.97);}'
      + '.chitti-fb-btn:focus-visible{outline:3px solid #D4AF37;outline-offset:2px;}'
      + '.chitti-fb-mini-logo{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,#E86A17,#D4AF37);color:#fff;font-weight:900;font-size:13px;line-height:1;box-shadow:0 1px 3px rgba(232,106,23,.45);flex-shrink:0;margin-right:4px;}'
      + '.chitti-fb-btn.up.active{background:#dcfce7;border-color:#86efac;color:#14532d;}'
      + '.chitti-fb-btn.down.active{background:#fee2e2;border-color:#fca5a5;color:#7f1d1d;}'
      + '.chitti-fb-btn.speak.live{background:#dbeafe;border-color:#93c5fd;color:#1e3a8a;}'
      + '.chitti-fb-btn.mic.live{background:#fde68a;border-color:#fbbf24;color:#7c2d12;animation:chitti-pulse 1.2s ease-in-out infinite;}'
      + '@keyframes chitti-pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.04);}}'
      + '.chitti-fb-help{font-size:13px;color:#475569;line-height:1.55;margin:6px 0 0;}'
      + '.chitti-fb-help b{color:#0E2344;}'
      + '.chitti-fb-trust{display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:12px;color:#475569;margin-top:10px;border-top:1px dashed #e5e7eb;padding-top:10px;}'
      + '.chitti-fb-trust .chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;background:#f1f5f9;color:#0E2344;}'
      + '.chitti-fb-trust .chip.risk-high{background:#fee2e2;color:#7f1d1d;}'
      + '.chitti-fb-trust .chip.risk-medium{background:#fef3c7;color:#7c2d12;}'
      + '.chitti-fb-trust .chip.risk-low{background:#dcfce7;color:#14532d;}'
      + '.chitti-fb-toast{position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#0E2344;color:#fff;padding:10px 16px;border-radius:10px;font-size:14px;box-shadow:0 6px 24px rgba(14,35,68,.25);z-index:99999;opacity:0;transition:opacity .2s ease;max-width:88%;text-align:center;}'
      + '.chitti-fb-toast.show{opacity:1;}'
      + '.chitti-fb-modal-bg{position:fixed;inset:0;background:rgba(14,35,68,.55);display:none;align-items:center;justify-content:center;z-index:99998;padding:16px;}'
      + '.chitti-fb-modal-bg.show{display:flex;}'
      + '.chitti-fb-modal{background:#fff;border-radius:14px;padding:22px;width:100%;max-width:480px;box-shadow:0 16px 40px rgba(14,35,68,.25);}'
      + '.chitti-fb-modal h3{margin:0 0 6px;color:#0E2344;font-size:18px;}'
      + '.chitti-fb-modal p{margin:0 0 14px;font-size:13px;color:#475569;}'
      + '.chitti-fb-modal label{display:block;font-size:12px;font-weight:600;color:#334155;margin:10px 0 4px;}'
      + '.chitti-fb-modal textarea,.chitti-fb-modal input[type=text]{width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:10px;font-size:14px;font-family:inherit;box-sizing:border-box;}'
      + '.chitti-fb-modal textarea{min-height:96px;resize:vertical;}'
      + '.chitti-fb-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;}'
      + '.chitti-fb-cancel{background:#f1f5f9;color:#0E2344;border:none;padding:10px 16px;border-radius:8px;font-weight:600;cursor:pointer;}'
      + '.chitti-fb-submit{background:#0E2344;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-weight:600;cursor:pointer;}'
      + '.chitti-fb-submit:disabled{opacity:.6;cursor:not-allowed;}'
      + '.chitti-fb-report{margin-left:auto;font-size:12px;color:#7f1d1d;text-decoration:underline;background:none;border:none;cursor:pointer;}'
      + '@media (max-width:520px){.chitti-fb-btn{flex:1;min-width:0;}.chitti-fb-row{gap:8px;}}';
    var s = document.createElement('style');
    s.id = 'chitti-feedback-widget-styles';
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  // ── DOM ──────────────────────────────────────────────────────────────
  function buildWidget(page) {
    var risk = RISK_MAP[page] || 'LOW';
    var riskClass = 'risk-' + risk.toLowerCase();
    var lastAudit = (window.CHITTI_LAST_AUDIT || '2026-05-13');
    var helpedToday = (window.CHITTI_HELPED_TODAY != null) ? window.CHITTI_HELPED_TODAY : '—';
    var co2 = (window.CHITTI_CO2_G != null) ? window.CHITTI_CO2_G : DEFAULT_CO2_G;
    var co2Str = '🌿 ~' + Number(co2).toFixed(1) + 'g CO₂ for this reply';

    var wrap = document.createElement('section');
    wrap.className = 'chitti-fb-wrap';
    wrap.setAttribute('aria-label', 'Help us build better Chitti');
    wrap.innerHTML =
      '<div class="chitti-fb-card">' +
      '  <div class="chitti-fb-title">💬 Was this helpful?' +
      '    <button type="button" class="chitti-fb-report" data-action="report" aria-label="Report a problem with this page">📣 Report a problem</button>' +
      '  </div>' +
      '  <div class="chitti-fb-row">' +
      '    <button type="button" class="chitti-fb-btn speak" data-vote="speak" aria-label="Chitti — read this page aloud"><span class="chitti-fb-mini-logo" aria-hidden="true">C</span><span aria-hidden="true">🔊</span><span class="lbl">Speaker</span></button>' +
      '    <button type="button" class="chitti-fb-btn mic" data-vote="mic" aria-label="Talk to Chitti"><span class="chitti-fb-mini-logo" aria-hidden="true">C</span><span aria-hidden="true">🎙️</span><span class="lbl">Chitti</span></button>' +
      '    <button type="button" class="chitti-fb-btn up" data-vote="thumbs_up" aria-label="This page was helpful"><span aria-hidden="true">👍</span><span class="lbl">Helpful</span></button>' +
      '    <button type="button" class="chitti-fb-btn down" data-vote="thumbs_down" aria-label="Something did not work"><span aria-hidden="true">👎</span><span class="lbl">Not OK</span></button>' +
      '  </div>' +
      '  <p class="chitti-fb-help">Tap <b>🔊</b> to listen. Tap <b>🎙️</b> to talk to Chitti. Tap <b>👍</b> if helpful. Tap <b>👎</b> and tell Chitti — in your language — what was wrong.</p>' +
      '  <div class="chitti-fb-trust" aria-label="Trust signals">' +
      '    <span class="chip ' + riskClass + '" title="Risk level for this Chitti">🛡️ ' + risk + ' RISK</span>' +
      '    <span class="chip" title="Carbon footprint of this reply">' + co2Str + '</span>' +
      '    <span class="chip" title="Last Chitti Quality audit">📅 Last audit: ' + lastAudit + '</span>' +
      '    <span class="chip" title="Indians helped today by this Chitti">🇮🇳 ' + helpedToday + ' helped today</span>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(wrap);

    // Optional text-fallback modal for browsers without webkitSpeechRecognition.
    var modalBg = document.createElement('div');
    modalBg.className = 'chitti-fb-modal-bg';
    modalBg.innerHTML =
      '<div class="chitti-fb-modal" role="dialog" aria-modal="true" aria-labelledby="chitti-fb-modal-title">' +
      '  <h3 id="chitti-fb-modal-title">📣 Tell Chitti what was wrong</h3>' +
      '  <p>Your microphone is not available. Please type instead — Chitti will still learn from this.</p>' +
      '  <label for="chitti-fb-text">What went wrong?</label>' +
      '  <textarea id="chitti-fb-text" placeholder="e.g. The Hindi translation was wrong on the scheme page..."></textarea>' +
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
    _toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  // ── network ──────────────────────────────────────────────────────────
  function send(payload) {
    payload.timestamp = new Date().toISOString();
    payload.page = payload.page || pageKey();
    payload.user_segment = payload.user_segment || getSegment();
    payload.risk = RISK_MAP[payload.page] || 'LOW';
    payload.co2_g = (window.CHITTI_CO2_G != null) ? window.CHITTI_CO2_G : DEFAULT_CO2_G;
    payload.lang = payload.lang || getLang();
    var url = API_BASE.replace(/\/+$/, '') + '/api/feedback/collect';
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(function () {
      // Best-effort local queue so a flaky network never loses feedback.
      try {
        var q = JSON.parse(localStorage.getItem('chitti_fb_queue') || '[]');
        q.push(payload); localStorage.setItem('chitti_fb_queue', JSON.stringify(q.slice(-50)));
      } catch (e) {}
      throw new Error('offline');
    });
  }
  function flushQueue() {
    try {
      var q = JSON.parse(localStorage.getItem('chitti_fb_queue') || '[]');
      if (!q.length) return;
      localStorage.setItem('chitti_fb_queue', '[]');
      q.forEach(function (p) { send(p).catch(function () {}); });
    } catch (e) {}
  }

  // ── flows ────────────────────────────────────────────────────────────
  function speakPage() {
    // Prefer the page's last result aloud, fall back to the whole body.
    var src = document.querySelector('[data-chitti-last-response]') ||
              document.querySelector('main') || document.body;
    var text = (src.innerText || src.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 2000);
    if (!text) text = "This page has no readable text yet.";
    speak(text, getLang());
  }
  function openChittiMic() {
    var lang = getLang();
    speak("I'm listening.", lang);
    listenOnce(lang,
      function (text) {
        if (!text) return;
        // Honour an optional page-level handler so each Chitti can route the
        // utterance to its own backend (search, ask, etc.).
        if (window.CHITTI_ON_VOICE && typeof window.CHITTI_ON_VOICE === 'function') {
          try { window.CHITTI_ON_VOICE(text); } catch (e) {}
        } else {
          toast('Heard: "' + text.slice(0, 80) + '"');
        }
      },
      function (err) {
        if (err === 'unsupported') {
          toast('Voice input is not available in this browser. Tap 👎 to type instead.');
        } else {
          toast('Could not hear you — please try again.');
        }
      }
    );
  }
  function thumbsDownVoiceFlow(page) {
    var lang = getLang();
    var apology = tr(APOLOGY, lang);
    var thanks  = tr(THANKS, lang);
    speak(apology, lang);
    // Give the user ~1.2s before opening the mic so the apology is heard.
    setTimeout(function () {
      var sr = listenOnce(lang,
        function (text) {
          send({ page: page, type: 'thumbs_down', text: text || '', voice: true })
            .then(function () { speak(thanks, lang); toast('Thank you. Chitti will learn from this.'); })
            .catch(function () { toast("Saved offline — we'll learn from this when you're back online."); });
        },
        function (err) {
          if (err === 'unsupported') {
            openTextFallbackModal(page);
          } else {
            // Even on a recognition error, record the down-vote so the rate
            // metric is honest. Text just stays empty.
            send({ page: page, type: 'thumbs_down', text: '', voice: false })
              .catch(function () {});
            toast("Couldn't hear you — your 👎 is still recorded.");
          }
        }
      );
      // Hard cap: stop after 12s.
      setTimeout(function () { try { sr && sr.stop && sr.stop(); } catch (e) {} }, 12000);
    }, 1200);
  }
  function openTextFallbackModal(page) {
    var modalBg = document.querySelector('.chitti-fb-modal-bg');
    if (!modalBg) return;
    var textEl = modalBg.querySelector('#chitti-fb-text');
    var submit = modalBg.querySelector('.chitti-fb-submit');
    var cancel = modalBg.querySelector('.chitti-fb-cancel');
    textEl.value = '';
    modalBg.classList.add('show');
    setTimeout(function () { textEl.focus(); }, 60);

    function close() { modalBg.classList.remove('show'); }
    function onSubmit() {
      var t = (textEl.value || '').trim();
      if (t.length < 3) { toast('Please tell us a few words.'); return; }
      submit.disabled = true;
      send({ page: page, type: 'thumbs_down', text: t, voice: false })
        .then(function () { close(); toast('Thank you. Chitti will learn from this.'); })
        .catch(function () { close(); toast("Saved offline — we'll learn from this when you're back online."); })
        .finally(function () { submit.disabled = false; });
    }
    submit.onclick = onSubmit;
    cancel.onclick = close;
    modalBg.onclick = function (ev) { if (ev.target === modalBg) close(); };
    document.addEventListener('keydown', function esc(ev) {
      if (ev.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
  }
  function reportProblem(page) {
    // Quick mailto + backend log. The mailto opens the user's mail client
    // so Sire gets a copy within minutes; backend keeps a record for the
    // daily Defect Rate Report.
    var subj = encodeURIComponent('[Chitti Quality] Issue on ' + page);
    var body = encodeURIComponent('Page: ' + page + '\nWhat happened: \nExpected: \nDate/time: ' + new Date().toString() + '\nLanguage: ' + getLang());
    send({ page: page, type: 'incident', text: 'Reported via 📣 button' }).catch(function () {});
    try { window.open('mailto:bryanwilfredpinto@gmail.com?subject=' + subj + '&body=' + body, '_blank'); } catch (e) {}
    toast('Incident report sent to Sire.');
  }

  // ── wire up ──────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    var page = pageKey();
    var els = buildWidget(page);
    var wrap = els.wrap;
    flushQueue();

    wrap.querySelector('[data-vote="speak"]').addEventListener('click', function () {
      var btn = this; btn.classList.add('live');
      setTimeout(function () { btn.classList.remove('live'); }, 1200);
      speakPage();
      send({ page: page, type: 'listen' }).catch(function () {});
    });

    wrap.querySelector('[data-vote="mic"]').addEventListener('click', function () {
      var btn = this; btn.classList.add('live');
      setTimeout(function () { btn.classList.remove('live'); }, 1200);
      openChittiMic();
      send({ page: page, type: 'mic' }).catch(function () {});
    });

    wrap.querySelector('[data-vote="thumbs_up"]').addEventListener('click', function () {
      wrap.querySelectorAll('.chitti-fb-btn.up, .chitti-fb-btn.down').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      send({ page: page, type: 'thumbs_up' })
        .then(function () { toast('Thanks!'); })
        .catch(function () { toast("Saved offline — we'll send when you're back online."); });
    });

    wrap.querySelector('[data-vote="thumbs_down"]').addEventListener('click', function () {
      wrap.querySelectorAll('.chitti-fb-btn.up, .chitti-fb-btn.down').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      thumbsDownVoiceFlow(page);
    });

    wrap.querySelector('[data-action="report"]').addEventListener('click', function () {
      reportProblem(page);
    });

    // Carbon-budget guard. If a response exceeds 0.5g, flag it so the
    // chitti-founder escalation worker can pick it up via /api/feedback.
    if (DEFAULT_CO2_G > 0 && window.CHITTI_CO2_G != null && window.CHITTI_CO2_G > CO2_FLAG_THRESHOLD_G) {
      send({ page: page, type: 'carbon_flag', co2_g: window.CHITTI_CO2_G }).catch(function () {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
