// feedback-widget.js  ·  Chitti Quality v2 — 2026-05-13
// =====================================================================
// PER-BOX 4-icon widget + page-footer summary. Locked SAHAYAI_MASTER §7.
//
// Page footer (always rendered):
//   🔊 Speaker · 🎙️ Chitti · 👍 · 👎  — applies to the whole page.
//
// Per-response box (auto-attached to every [data-chitti-response] /
// .chitti-response on the page, plus any added later via MutationObserver):
//   🔊 reads THAT box · 🤖 asks Chitti to "explain further" about THAT box
//   · 👍 / 👎 votes tagged with the box ID and section name.
//   👎 opens a per-box modal titled "Feedback for: [section name]" with
//   both 🎙️ voice and ⌨️ text input — feedback is sent to /api/feedback,
//   tagged with box_id, and surfaces on the Founder daily report.
//
// PWD-user contract:
//   - All icons are big, labelled, and self-explanatory.
//   - The footer 👎 NEVER opens a textbox first — Chitti speaks an apology
//     in the user's language and listens. Text is the fallback.
//   - The per-box 👎 opens an explicit modal with both voice and text
//     because the user is already in a focused, scoped context.
//   - Voice OUT uses chitti_a11y.speak() if loaded, else SpeechSynthesis.
//   - Voice IN uses webkitSpeechRecognition. If unavailable, the modal
//     accepts text so the user is never trapped.
//
// Include with:
//   <script src="feedback-widget.js" data-page="chitti_government"></script>
//
// Page authors opt-in per-box widgets by marking response containers:
//   <section data-chitti-response data-chitti-section="Verdict">…</section>
//   <div class="chitti-response" data-chitti-section="Returns calculator">…</div>
//
// Backend:  POST {API}/api/feedback/collect    (legacy — for older Chittis)
//           POST {API}/api/feedback           (canonical — lib/feedback.py)
// Override base URL with  window.CHITTI_FEEDBACK_API  before this loads.
// Per-box events carry: { type: 'box_thumbs_down', box_id, section, text }.
// =====================================================================

(function () {
  if (window.__chittiFeedbackWidgetLoaded) return;
  window.__chittiFeedbackWidgetLoaded = true;

  // ── config ───────────────────────────────────────────────────────────
  var API_BASE =
    (typeof window !== 'undefined' && window.CHITTI_FEEDBACK_API) ||
    'https://chitti-vaani-api-production.up.railway.app';

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
  // ── Shared i18n resolver (fleet substrate) ───────────────────────────
  // Resolve a UI string from the page's VAI_STRINGS bag in the active
  // language, with an English fallback so any page WITHOUT that key (or
  // without strings.js at all) keeps working unchanged. §5 No-Hinglish.
  function tLang() {
    var L = window.CURRENT_LANG || getLang() || 'en';
    return String(L).toLowerCase().split('-')[0];
  }
  function _tg(key, fb) {
    try {
      var L = tLang();
      var S = window.VAI_STRINGS;
      if (!S) return fb;
      var bag = S[L] || S.en;
      return (bag && bag[key]) || (S.en && S.en[key]) || fb;
    } catch (e) { return fb; }
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
      + '@media (max-width:520px){.chitti-fb-btn{flex:1;min-width:0;}.chitti-fb-row{gap:8px;}}'
      // ── per-box widget ────────────────────────────────────────────────
      + '.chitti-fb-box{position:relative;}'
      + '.chitti-fb-box-bar{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;align-items:center;margin:14px 0 0;padding-top:10px;border-top:1px dashed #e5e7eb;}'
      + '.chitti-fb-bbtn-label{margin-right:auto;font-size:12px;font-weight:600;color:#475569;display:inline-flex;align-items:center;gap:6px;}'
      + '.chitti-fb-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}'
      + '.chitti-fb-bbtn{appearance:none;border:1px solid #e5e7eb;background:#fff;color:#0E2344;padding:0 12px;border-radius:8px;font-size:18px;line-height:1;cursor:pointer;box-sizing:border-box;min-width:48px;width:auto;height:48px;min-height:48px;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:transform .08s ease,background .12s ease;}'
      + '.chitti-fb-bbtn:hover{background:#f1f5f9;}'
      + '.chitti-fb-bbtn:active{transform:scale(.96);}'
      + '.chitti-fb-bbtn:focus-visible{outline:3px solid #D4AF37;outline-offset:2px;}'
      + '.chitti-fb-bbtn.up.active{background:#dcfce7;border-color:#86efac;color:#14532d;}'
      + '.chitti-fb-bbtn.down.active{background:#fee2e2;border-color:#fca5a5;color:#7f1d1d;}'
      + '.chitti-fb-bbtn.speak.live{background:#dbeafe;border-color:#93c5fd;color:#1e3a8a;}'
      + '.chitti-fb-bbtn.ask.live{background:#fde68a;border-color:#fbbf24;color:#7c2d12;animation:chitti-pulse 1.2s ease-in-out infinite;}'
      // Demo button — saffron-tinted, lives on the LEFT of the box bar.
      + '.chitti-fb-bbtn.demo{background:linear-gradient(135deg,rgba(232,106,23,.10),rgba(212,175,55,.08));border-color:rgba(232,106,23,.45);color:#7c2d12;font-weight:700;padding:0 14px;font-size:13px;line-height:1;display:inline-flex;align-items:center;gap:5px;box-sizing:border-box;height:48px;min-height:48px;}'
      + '.chitti-fb-bbtn.demo .chitti-fb-bbtn-text{font-size:12px;letter-spacing:.02em;}'
      + '.chitti-fb-bbtn.demo:hover{background:linear-gradient(135deg,rgba(232,106,23,.20),rgba(212,175,55,.15));border-color:#E86A17;}'
      + '.chitti-fb-bbtn.demo.live{background:linear-gradient(135deg,rgba(232,106,23,.28),rgba(212,175,55,.22));border-color:#E86A17;color:#7c2d12;animation:chitti-pulse 1.2s ease-in-out infinite;}'
      + '.chitti-fb-box-mic{background:#fde68a;color:#7c2d12;border:1px solid #fbbf24;padding:10px 16px;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;}'
      + '.chitti-fb-box-mic:hover{background:#fcd34d;}'
      + '.chitti-fb-box-mic:disabled{opacity:.6;cursor:not-allowed;}'
      + '.chitti-fb-box-mic.live{animation:chitti-pulse 1.2s ease-in-out infinite;}'
      + '.chitti-fb-box-section{color:#E86A17;font-weight:700;}';
    var s = document.createElement('style');
    s.id = 'chitti-feedback-widget-styles';
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  // ── DOM ──────────────────────────────────────────────────────────────
  function buildWidget(page) {
    // idempotency: never render the global feedback panel twice (fixes duplicate
    // "Was this helpful?" when buildWidget is reached more than once). Fleet-wide.
    if (document.querySelector('.chitti-fb-wrap')) return;
    var risk = RISK_MAP[page] || 'LOW';
    var riskClass = 'risk-' + risk.toLowerCase();
    var lastAudit = (window.CHITTI_LAST_AUDIT || '2026-05-13');
    var helpedToday = (window.CHITTI_HELPED_TODAY != null) ? window.CHITTI_HELPED_TODAY : '—';
    var co2 = (window.CHITTI_CO2_G != null) ? window.CHITTI_CO2_G : DEFAULT_CO2_G;
    var co2Str = '🌿 ~' + Number(co2).toFixed(1) + 'g CO₂ ' + _tg('fb.co2_for_reply', 'for this reply');

    var wrap = document.createElement('section');
    wrap.className = 'chitti-fb-wrap';
    wrap.setAttribute('aria-label', 'Help us build better Chitti');
    wrap.innerHTML =
      '<div class="chitti-fb-card">' +
      '  <div class="chitti-fb-title">💬 <span data-vai-i18n="fb.was_helpful">' + escAttr(_tg('fb.was_helpful', 'Was this helpful?')) + '</span>' +
      '    <button type="button" class="chitti-fb-report" data-action="report" aria-label="Report a problem with this page">📣 <span data-vai-i18n="fb.report">' + escAttr(_tg('fb.report', 'Report a problem')) + '</span></button>' +
      '  </div>' +
      '  <div class="chitti-fb-row">' +
      '    <button type="button" class="chitti-fb-btn speak" data-vote="speak" aria-label="Chitti — read this page aloud"><span class="chitti-fb-mini-logo" aria-hidden="true">C</span><span aria-hidden="true">🔊</span><span class="lbl" data-vai-i18n="fb.speaker">' + escAttr(_tg('fb.speaker', 'Speaker')) + '</span></button>' +
      '    <button type="button" class="chitti-fb-btn mic" data-vote="mic" aria-label="Talk to Chitti"><span class="chitti-fb-mini-logo" aria-hidden="true">C</span><span aria-hidden="true">🎙️</span><span class="lbl">Chitti</span></button>' +
      '    <button type="button" class="chitti-fb-btn up" data-vote="thumbs_up" aria-label="This page was helpful"><span aria-hidden="true">👍</span><span class="lbl" data-vai-i18n="fb.helpful">' + escAttr(_tg('fb.helpful', 'Helpful')) + '</span></button>' +
      '    <button type="button" class="chitti-fb-btn down" data-vote="thumbs_down" aria-label="Something did not work"><span aria-hidden="true">👎</span><span class="lbl" data-vai-i18n="fb.notok">' + escAttr(_tg('fb.notok', 'Not OK')) + '</span></button>' +
      '  </div>' +
      '  <p class="chitti-fb-help">' + _tg('fb.help', 'Tap <b>🔊</b> to listen. Tap <b>🎙️</b> to talk to Chitti. Tap <b>👍</b> if helpful. Tap <b>👎</b> and tell Chitti — in your language — what was wrong.') + '</p>' +
      '  <div class="chitti-fb-trust" aria-label="Trust signals">' +
      '    <span class="chip ' + riskClass + '" title="Risk level for this Chitti">🛡️ ' + escAttr(_tg('fb.risk.' + risk.toLowerCase(), risk + ' RISK')) + '</span>' +
      '    <span class="chip" title="Carbon footprint of this reply">' + co2Str + '</span>' +
      '    <span class="chip" title="Last Chitti Quality audit">📅 ' + escAttr(_tg('fb.last_audit', 'Last audit:')) + ' ' + lastAudit + '</span>' +
      '    <span class="chip" title="Indians helped today by this Chitti">🇮🇳 ' + helpedToday + ' ' + escAttr(_tg('fb.helped_today', 'helped today')) + '</span>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(wrap);

    // Optional text-fallback modal for browsers without webkitSpeechRecognition.
    var modalBg = document.createElement('div');
    modalBg.className = 'chitti-fb-modal-bg';
    modalBg.innerHTML =
      '<div class="chitti-fb-modal" role="dialog" aria-modal="true" aria-labelledby="chitti-fb-modal-title">' +
      '  <h3 id="chitti-fb-modal-title">📣 ' + escAttr(_tg('fb.modal.title', 'Tell Chitti what was wrong')) + '</h3>' +
      '  <p>' + escAttr(_tg('fb.modal.body', 'Your microphone is not available. Please type instead — Chitti will still learn from this.')) + '</p>' +
      '  <label for="chitti-fb-text">' + escAttr(_tg('fb.modal.label', 'What went wrong?')) + '</label>' +
      '  <textarea id="chitti-fb-text" placeholder="' + escAttr(_tg('fb.modal.ph', 'e.g. the translation was wrong on this page...')) + '"></textarea>' +
      '  <div class="chitti-fb-modal-actions">' +
      '    <button type="button" class="chitti-fb-cancel">' + escAttr(_tg('ui.cancel', 'Cancel')) + '</button>' +
      '    <button type="button" class="chitti-fb-submit">' + escAttr(_tg('fb.submit', 'Submit')) + '</button>' +
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
    // Observability — Sire 2026-05-29. Carry the audit_id (CH-YYYYMMDD-XXXX)
    // so every 👍/👎/✏️/🎤 row in chitti-vaani's feedback table can be joined
    // to chitti-shares' observability.audits row for retrain aggregation.
    if (!payload.audit_id) {
      try {
        var raw = localStorage.getItem('chitti_audit_id');
        if (raw) { var p = JSON.parse(raw); if (p && p.id) payload.audit_id = p.id; }
      } catch (e) {}
    }
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
    document.addEventListener('keydown', function escAttr(ev) {
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

  // ── per-box widget ───────────────────────────────────────────────────
  // Locked SAHAYAI_MASTER §7: every response box on every Chitti page
  // carries its own 🔊 / 🤖 / 👍 / 👎 row + scoped feedback modal.
  //
  // Selector ladder:
  //   1. Explicit opt-in:  [data-chitti-response] / .chitti-response
  //   2. Heuristic IDs:    #reply, #response, #answer, #result, #output,
  //                        and their -card / -box / -container variants.
  //      Added 2026-05-20 (Bryan's "every box must have 4 icons — NO
  //      EXCEPTIONS" directive). Page authors should still prefer the
  //      explicit attribute — the heuristic is a safety net so a page
  //      that ships without the marker still gets the widget instead of
  //      silently dropping it.
  var BOX_SELECTOR = [
    '[data-chitti-response]',
    '.chitti-response',
    // 2026-05-23 Step-1 audit: data-chitti-section alone is a strong
    // intent signal — "this is an output box that should be feedback-able".
    // Many existing pages already carry data-chitti-section on cards but
    // were missing the data-chitti-response twin; this row picks them up.
    '[data-chitti-section]',
    '#reply', '#response', '#answer', '#result', '#output',
    '#reply-card', '#response-card', '#answer-card', '#result-card', '#output-card',
    '#reply-box',  '#response-box',  '#answer-box',  '#result-box',  '#output-box',
    '[id$="-reply"]', '[id$="-response"]', '[id$="-answer"]', '[id$="-result"]', '[id$="-output"]',
  ].join(', ');

  function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function boxIdFor(box) {
    if (box.id) return box.id;
    var existing = box.getAttribute('data-chitti-box-id');
    if (existing) return existing;
    var gen = 'chitti-box-' + Math.random().toString(36).slice(2, 9);
    box.setAttribute('data-chitti-box-id', gen);
    return gen;
  }
  function sectionNameFor(box) {
    var name = box.getAttribute('data-chitti-section');
    if (!name) {
      var h = box.querySelector('h1,h2,h3,h4,h5,h6,[role="heading"]');
      if (h && h.textContent) name = h.textContent;
    }
    if (!name) {
      var prev = box.previousElementSibling;
      if (prev && /^H[1-6]$/.test(prev.tagName)) name = prev.textContent;
    }
    if (!name) name = box.getAttribute('aria-label') || 'this section';
    return String(name).trim().replace(/\s+/g, ' ').slice(0, 80);
  }
  function boxText(box) {
    // Bar lives as a sibling AFTER the box, so innerText is clean.
    return (box.innerText || box.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 4000);
  }
  function attachBoxWidget(box, page) {
    if (!box || !box.parentNode) return;
    var boxId = boxIdFor(box);
    // DOM-based idempotency: did we already insert a bar bound to THIS box
    // right after it? (We do NOT use a JS flag — page re-renders that wipe
    // the bar must be allowed to re-attach.)
    var nextSib = box.nextElementSibling;
    if (nextSib && nextSib.classList && nextSib.classList.contains('chitti-fb-box-bar')
        && nextSib.getAttribute('data-for-box') === boxId) {
      return;
    }
    // Clean up any stale bar pointing at a different / removed box.
    if (nextSib && nextSib.classList && nextSib.classList.contains('chitti-fb-box-bar')
        && nextSib.getAttribute('data-for-box') !== boxId) {
      nextSib.parentNode.removeChild(nextSib);
    }
    var section = sectionNameFor(box);
    // §5 No-Hinglish: box-bar labels resolve from the active-language string bag
    // (data-vai-i18n keeps them in sync on every changeLang). Romanized "Suno"
    // was hardcoded here and showed on every box in every language fleet-wide.
    var _t = function (key, fb) {
      try {
        var L = getLang();
        var bag = window.VAI_STRINGS && (window.VAI_STRINGS[L] || window.VAI_STRINGS.en);
        return (bag && bag[key]) || (window.VAI_STRINGS && window.VAI_STRINGS.en && window.VAI_STRINGS.en[key]) || fb;
      } catch (e) { return fb; }
    };
    var sunoLbl = _t('ui.suno', 'Listen');
    var bar = document.createElement('div');
    bar.className = 'chitti-fb-box-bar';
    bar.setAttribute('data-for-box', boxId);
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Feedback for ' + section);
    bar.innerHTML =
      // LEFT — voice demo ("guided tour for this box"). 2026-05-22:
      // Bryan asked for a Demo button on the left of every box, with
      // the existing 🔊 🤖 👍 👎 feedback row on the right.
      // Sire 2026-05-23 — remove the visible "Feedback for: …" label.
      // The toolbar is icon-only now. The section name still lives in
      // aria-label on every button + the bar itself for screen readers.
      // Screen-reader context now lives entirely in the bar's aria-label and
      // each button's aria-label below (the section name is announced there).
      // The previously clipped sr-only <span> duplicated that text AND — because
      // clip:rect keeps it in the render tree — leaked the English section name
      // into the §5 No-Hinglish scan on every box. Removed (no a11y loss).
      '<button type="button" class="chitti-fb-bbtn demo"  data-act="demo"  aria-label="Play voice demo of ' + escAttr(section) + '"><span aria-hidden="true">▶</span> <span class="chitti-fb-bbtn-text">Chitti</span></button>' +
      '<button type="button" class="chitti-fb-bbtn speak" data-act="speak" aria-label="Read ' + escAttr(section) + ' aloud"><span aria-hidden="true">🔊</span> <span class="chitti-fb-bbtn-text" data-vai-i18n="ui.suno">' + escAttr(sunoLbl) + '</span></button>' +
      '<button type="button" class="chitti-fb-bbtn up"    data-act="up"    aria-label="' + escAttr(section) + ' was helpful">👍</button>' +
      '<button type="button" class="chitti-fb-bbtn down"  data-act="down"  aria-label="Something was wrong with ' + escAttr(section) + '">👎</button>';
    // Insert as a SIBLING after the box, not inside, so page re-renders
    // that set box.innerHTML don't wipe the bar.
    box.parentNode.insertBefore(bar, box.nextSibling);

    // ── Demo: short guided voice tour of this box ───────────────────
    // Priority for the script text:
    //   1. box's data-chitti-demo attribute (curated per box)
    //   2. .section-sub inside the box (existing one-line description)
    //   3. first paragraph of the box's visible text
    // Always prefixed with the section name so the user knows which box
    // they're hearing about; always suffixed with a one-line "tap … to
    // start" cue when the box has a clear primary action.
    bar.querySelector('[data-act="demo"]').addEventListener('click', function () {
      var btn = this; btn.classList.add('live');
      setTimeout(function () { btn.classList.remove('live'); }, 1500);
      var lang = getLang();
      // 1. Curated demo on the box.
      var demo = (box.getAttribute && box.getAttribute('data-chitti-demo')) || '';
      // 2. .section-sub (vaani / news / medupi pattern)
      if (!demo) {
        var sub = box.querySelector && box.querySelector('.section-sub, .sub, .desc');
        if (sub && (sub.innerText || '').trim()) demo = (sub.innerText || '').trim();
      }
      // 3. First paragraph of the box text — cap at 240 chars so the
      //    demo stays short.
      if (!demo) {
        var allText = (box.innerText || box.textContent || '').replace(/\s+/g, ' ').trim();
        // Trim off the chitti-fb-box-bar's own injected text if it bled in.
        allText = allText.replace(/💬\s*Feedback for:.*$/, '').trim();
        var firstSentence = allText.split(/(?<=[.?!।])\s/)[0] || allText;
        demo = firstSentence.slice(0, 240);
      }
      if (!demo) demo = section;
      // Add the section name prefix so the demo is self-locating.
      var prefix = section && demo.indexOf(section.slice(0, 20)) === -1
        ? section + '. '
        : '';
      // Optional "tap to start" cue derived from the first <button>.
      var primaryBtn = box.querySelector && (box.querySelector('button.go') || box.querySelector('button.quick-card, button.pro-card') || box.querySelector('button'));
      var cue = '';
      if (primaryBtn) {
        var btnLbl = (primaryBtn.innerText || primaryBtn.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
        if (btnLbl) cue = ' Tap ' + btnLbl + ' to start.';
      }
      speak(prefix + demo + cue, lang);
      send({ page: page, type: 'box_demo', box_id: boxId, section: section }).catch(function () {});
    });

    bar.querySelector('[data-act="speak"]').addEventListener('click', function () {
      var btn = this; btn.classList.add('live');
      setTimeout(function () { btn.classList.remove('live'); }, 1200);
      // Sire 2026-06-02 — delegate hook so per-page handlers can speak
      // content that lives in JS cache (not DOM). When a box carries
      //   data-chitti-speak-handler="myFn"
      //   data-chitti-speak-id="<id>"
      // the widget calls window.myFn(id) and treats that as the
      // canonical read action — skipping boxText() entirely. Used by
      // chitti_news.html so the speaker reads a.content (full RSS body
      // when publishers ship content:encoded) instead of just the
      // summary visible in DOM.
      var hName = box.getAttribute && box.getAttribute('data-chitti-speak-handler');
      var hId   = box.getAttribute && box.getAttribute('data-chitti-speak-id');
      if (hName && hId && typeof window[hName] === 'function') {
        try {
          window[hName](isNaN(+hId) ? hId : +hId);
          send({ page: page, type: 'box_listen', box_id: boxId, section: section,
                 delegated: hName }).catch(function () {});
          return;
        } catch (e) { /* fall through to default text grab */ }
      }
      var text = boxText(box);
      if (!text) text = section;
      speak(text, getLang());
      send({ page: page, type: 'box_listen', box_id: boxId, section: section }).catch(function () {});
    });

    // Sire 2026-05-23: the "ask" (🤖) button was removed when the toolbar
    // went icon-only ([🔊 Suno][▶ Demo][👍][👎]). Guard the lookup so the
    // page never throws on a missing selector.
    var askBtn = bar.querySelector('[data-act="ask"]');
    if (askBtn) askBtn.addEventListener('click', function () {
      var btn = this; btn.classList.add('live');
      setTimeout(function () { btn.classList.remove('live'); }, 1500);
      var lang = getLang();
      var ctx = boxText(box);
      speak("How can I explain further?", lang);
      setTimeout(function () {
        listenOnce(lang,
          function (q) {
            if (!q) return;
            if (typeof window.CHITTI_ON_BOX_QUERY === 'function') {
              try { window.CHITTI_ON_BOX_QUERY({ box_id: boxId, section: section, query: q, box_text: ctx, box: box }); } catch (e) {}
            } else {
              toast('Heard: "' + q.slice(0, 80) + '" — this page has no custom handler yet.');
            }
            send({ page: page, type: 'box_ask', box_id: boxId, section: section, text: q }).catch(function () {});
          },
          function (err) {
            if (err === 'unsupported') toast('Voice not available — tap 👎 to type instead.');
            else toast('Could not hear you — please try again.');
          }
        );
      }, 900);
    });

    bar.querySelector('[data-act="up"]').addEventListener('click', function () {
      bar.querySelectorAll('.chitti-fb-bbtn.up, .chitti-fb-bbtn.down').forEach(function (x) { x.classList.remove('active'); });
      this.classList.add('active');
      send({ page: page, type: 'box_thumbs_up', box_id: boxId, section: section })
        .then(function () { toast('Thanks!'); })
        .catch(function () { toast("Saved offline — we'll send when you're back online."); });
    });

    bar.querySelector('[data-act="down"]').addEventListener('click', function () {
      bar.querySelectorAll('.chitti-fb-bbtn.up, .chitti-fb-bbtn.down').forEach(function (x) { x.classList.remove('active'); });
      this.classList.add('active');
      // Sire 2026-05-23: open the shared accessible feedback PAGE (not a
      // modal). Voice + DeepSeek transcribe + readback flow works for
      // blind / mute / illiterate users.
      var q = '?product=' + encodeURIComponent(page) + '&card=' + encodeURIComponent(boxId) + '&section=' + encodeURIComponent(section);
      window.location.href = 'feedback.html' + q;
    });
  }

  function ensureBoxModal() {
    if (document.getElementById('chitti-fb-box-modal-bg')) return;
    var bg = document.createElement('div');
    bg.id = 'chitti-fb-box-modal-bg';
    bg.className = 'chitti-fb-modal-bg';
    bg.innerHTML =
      '<div class="chitti-fb-modal" role="dialog" aria-modal="true" aria-labelledby="chitti-fb-box-title">' +
      '  <h3 id="chitti-fb-box-title">📣 <span class="chitti-fb-box-section-target">…</span></h3>' +
      '  <p class="chitti-fb-box-prompt">' + escAttr(_tg('fb.box.prompt', 'What was wrong with this?')) + '</p>' +
      '  <label for="chitti-fb-box-text">' + escAttr(_tg('fb.box.label', 'Type or record:')) + '</label>' +
      '  <textarea id="chitti-fb-box-text" placeholder="' + escAttr(_tg('fb.box.ph', 'Tell Chitti — in any language — what was wrong with this box...')) + '"></textarea>' +
      '  <div class="chitti-fb-modal-actions">' +
      '    <button type="button" class="chitti-fb-cancel">' + escAttr(_tg('ui.cancel', 'Cancel')) + '</button>' +
      '    <button type="button" class="chitti-fb-box-mic" aria-label="Record voice feedback">🎙️ ' + escAttr(_tg('fb.box.record', 'Record voice')) + '</button>' +
      '    <button type="button" class="chitti-fb-submit chitti-fb-box-submit">' + escAttr(_tg('fb.submit', 'Submit')) + '</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(bg);
  }

  function openBoxFeedbackModal(page, boxId, section) {
    ensureBoxModal();
    var modalBg = document.getElementById('chitti-fb-box-modal-bg');
    var lang = getLang();
    modalBg.querySelector('.chitti-fb-box-section-target').textContent = section;
    modalBg.querySelector('.chitti-fb-box-prompt').textContent = tr(APOLOGY, lang);
    var textEl = modalBg.querySelector('#chitti-fb-box-text');
    var mic    = modalBg.querySelector('.chitti-fb-box-mic');
    var submit = modalBg.querySelector('.chitti-fb-box-submit');
    var cancel = modalBg.querySelector('.chitti-fb-cancel');
    textEl.value = '';
    mic.disabled = false;
    mic.classList.remove('live');
    mic.textContent = '🎙️ Record voice';
    submit.disabled = false;

    // Speak the apology so blind users know the modal is open and ready.
    speak(tr(APOLOGY, lang), lang);
    modalBg.classList.add('show');
    setTimeout(function () { textEl.focus(); }, 60);

    function close() {
      modalBg.classList.remove('show');
      mic.onclick = null; submit.onclick = null; cancel.onclick = null;
      modalBg.onclick = null;
    }
    function onMic() {
      mic.disabled = true;
      mic.classList.add('live');
      mic.textContent = '🎙️ Listening…';
      listenOnce(lang,
        function (text) {
          if (text) textEl.value = (textEl.value ? textEl.value + ' ' : '') + text;
          mic.disabled = false; mic.classList.remove('live');
          mic.textContent = '🎙️ Record voice';
        },
        function (err) {
          mic.disabled = false; mic.classList.remove('live');
          mic.textContent = '🎙️ Record voice';
          if (err === 'unsupported') toast('Voice not available — please type instead.');
          else toast('Could not hear you. Please type instead.');
        }
      );
    }
    function onSubmit() {
      var t = (textEl.value || '').trim();
      if (t.length < 3) { toast('Please tell us a few words.'); return; }
      submit.disabled = true;
      send({ page: page, type: 'box_thumbs_down', box_id: boxId, section: section, text: t, voice: false })
        .then(function () { close(); speak(tr(THANKS, lang), lang); toast('Thank you. Chitti will learn from this.'); })
        .catch(function () { close(); toast("Saved offline — we'll learn from this when you're back online."); })
        .finally(function () { submit.disabled = false; });
    }
    mic.onclick = onMic;
    submit.onclick = onSubmit;
    cancel.onclick = close;
    modalBg.onclick = function (ev) { if (ev.target === modalBg) close(); };
    document.addEventListener('keydown', function escAttr(ev) {
      if (ev.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
  }

  function scanAndAttachBoxes(page) {
    document.querySelectorAll(BOX_SELECTOR).forEach(function (b) {
      // Skip empty hosts (e.g. <div class="art-take-host"></div> before the
      // user clicks "Chitti's Take"). The observer will pick them up once
      // content lands.
      var text = (b.innerText || b.textContent || '').trim();
      if (!text) return;
      attachBoxWidget(b, page);
    });
  }
  var _boxRescanPending = false;
  function startBoxObserver(page) {
    if (!window.MutationObserver) return;
    var obs = new MutationObserver(function (mutations) {
      // Cheap throttle: at most one rescan per animation frame. The page
      // may flip many small DOM changes (article cards rendering, takes
      // loading, ISL animation panels) — one rescan covers them all.
      if (_boxRescanPending) return;
      var anyAdded = false;
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.addedNodes && m.addedNodes.length) { anyAdded = true; break; }
      }
      if (!anyAdded) return;
      _boxRescanPending = true;
      (window.requestAnimationFrame || function (fn) { setTimeout(fn, 16); })(function () {
        _boxRescanPending = false;
        scanAndAttachBoxes(page);
        // Newly-attached bars carry the build-time (often English) suno label —
        // re-resolve all box-bar labels in the active language.
        if (typeof window.__chittiFbRelocalize === 'function') window.__chittiFbRelocalize();
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
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

    // Per-box widget — attach 🔊 / 🤖 / 👍 / 👎 to every [data-chitti-response]
    // / .chitti-response on the page, and to any added later.
    ensureBoxModal();
    scanAndAttachBoxes(page);
    startBoxObserver(page);

    // §5 No-Hinglish: the footer bar + modals are built ONCE, so a later
    // changeLang() would leave them in the old language. Re-resolve their
    // labels from VAI_STRINGS whenever the active language changes (and once
    // now, in case strings.js finished loading after this bar was built).
    function relocalize() {
      try {
        var risk = (RISK_MAP[page] || 'LOW');
        var setTxt = function (sel, val) { var el = wrap.querySelector(sel); if (el) el.textContent = val; };
        // title keeps its 💬 emoji + the Report button as a child — set only the
        // leading text node so we don't wipe the nested button.
        var titleEl = wrap.querySelector('.chitti-fb-title');
        if (titleEl && titleEl.firstChild && titleEl.firstChild.nodeType === 3) {
          titleEl.firstChild.nodeValue = '💬 ';  // emoji only — the phrase lives in the <span> (avoids "Was this helpful? Was this helpful?")
        }
        var titleSpan = titleEl && titleEl.querySelector('[data-vai-i18n="fb.was_helpful"]');
        if (titleSpan) titleSpan.textContent = _tg('fb.was_helpful', 'Was this helpful?');
        var rep = wrap.querySelector('.chitti-fb-report'); if (rep) rep.textContent = '📣 ' + _tg('fb.report', 'Report a problem');
        setTxt('[data-vote="speak"] .lbl', _tg('fb.speaker', 'Speaker'));
        setTxt('[data-vote="thumbs_up"] .lbl', _tg('fb.helpful', 'Helpful'));
        setTxt('[data-vote="thumbs_down"] .lbl', _tg('fb.notok', 'Not OK'));
        var help = wrap.querySelector('.chitti-fb-help'); if (help) help.innerHTML = _tg('fb.help', help.innerHTML);
        var chips = wrap.querySelectorAll('.chitti-fb-trust .chip');
        if (chips[0]) chips[0].textContent = '🛡️ ' + _tg('fb.risk.' + risk.toLowerCase(), risk + ' RISK');
        if (chips[1]) { var co2v = (window.CHITTI_CO2_G != null) ? window.CHITTI_CO2_G : DEFAULT_CO2_G; chips[1].textContent = '🌿 ~' + Number(co2v).toFixed(1) + 'g CO₂ ' + _tg('fb.co2_for_reply', 'for this reply'); }
        // chips[2] = last audit; chips[3] = helped today
        var lastAudit = (window.CHITTI_LAST_AUDIT || '2026-05-13');
        var helpedToday = (window.CHITTI_HELPED_TODAY != null) ? window.CHITTI_HELPED_TODAY : '—';
        if (chips[2]) chips[2].textContent = '📅 ' + _tg('fb.last_audit', 'Last audit:') + ' ' + lastAudit;
        if (chips[3]) chips[3].textContent = '🇮🇳 ' + helpedToday + ' ' + _tg('fb.helped_today', 'helped today');
        // page-level text modal
        var mb = els.modalBg;
        if (mb) {
          var mt = mb.querySelector('#chitti-fb-modal-title'); if (mt) mt.textContent = '📣 ' + _tg('fb.modal.title', 'Tell Chitti what was wrong');
          var mp = mb.querySelector('p'); if (mp) mp.textContent = _tg('fb.modal.body', mp.textContent);
          var ml = mb.querySelector('label'); if (ml) ml.textContent = _tg('fb.modal.label', 'What went wrong?');
          var mta = mb.querySelector('textarea'); if (mta) mta.setAttribute('placeholder', _tg('fb.modal.ph', mta.getAttribute('placeholder') || ''));
          var mc = mb.querySelector('.chitti-fb-cancel'); if (mc) mc.textContent = _tg('ui.cancel', 'Cancel');
          var ms = mb.querySelector('.chitti-fb-submit'); if (ms) ms.textContent = _tg('fb.submit', 'Submit');
        }
        // Feature Discovery CTA (chitti_features.js) — injected English-only
        // and reset to English by chitti_lang.js on each langchange. We win
        // the final paint here. §5 No-Hinglish. The CTA text node keeps its
        // leading 💡 emoji; we only swap the words after it.
        document.querySelectorAll('.chitti-features-cta, #chitti-features-bar-btn').forEach(function (btn) {
          btn.childNodes.forEach(function (n) {
            if (n.nodeType !== 3) return;
            var t = (n.nodeValue || '').replace(/\s+/g, ' ').trim();
            // Snapshot the English baseline once (it has the words we key on);
            // re-resolve on every call so language flips work both ways.
            if (!n.__cfBase && /What can Chitti do/.test(t)) n.__cfBase = t;
            if (!n.__cfBase) return;
            var longForm = /for you/.test(n.__cfBase);
            var val = _tg(longForm ? 'cf.cta_long' : 'cf.cta_short', null);
            if (val) n.nodeValue = '💡 ' + val;
          });
        });
        // "Active" / status badge in the feature list.
        document.querySelectorAll('.chitti-features-status').forEach(function (el) {
          var t = (el.textContent || '').trim();
          if (t === 'Active' || el.__cfActive) { el.__cfActive = true; el.textContent = _tg('cf.active', 'Active'); }
        });
        // Per-box bars: the ▶ "Chitti" demo + 🔊 listen label. Bars attached
        // by the MutationObserver AFTER strings.js's updateAllStrings ran keep
        // the build-time English label, so re-resolve them here too.
        var sunoTxt = _tg('ui.suno', 'Listen');
        document.querySelectorAll('.chitti-fb-bbtn-text[data-vai-i18n="ui.suno"]').forEach(function (sp) { sp.textContent = sunoTxt; });
        // Box feedback modal (built once, hidden until opened)
        var bm = document.getElementById('chitti-fb-box-modal-bg');
        if (bm) {
          var bp = bm.querySelector('.chitti-fb-box-prompt'); if (bp) bp.textContent = _tg('fb.box.prompt', 'What was wrong with this?');
          var bl = bm.querySelector('label'); if (bl) bl.textContent = _tg('fb.box.label', 'Type or record:');
          var bta = bm.querySelector('textarea'); if (bta) bta.setAttribute('placeholder', _tg('fb.box.ph', bta.getAttribute('placeholder') || ''));
          var bc = bm.querySelector('.chitti-fb-cancel'); if (bc) bc.textContent = _tg('ui.cancel', 'Cancel');
          var brec = bm.querySelector('.chitti-fb-box-mic'); if (brec) brec.textContent = '🎙️ ' + _tg('fb.box.record', 'Record voice');
          var bs = bm.querySelector('.chitti-fb-box-submit'); if (bs) bs.textContent = _tg('fb.submit', 'Submit');
        }
      } catch (e) {}
    }
    window.__chittiFbRelocalize = relocalize;
    relocalize();
    setTimeout(relocalize, 600); // after strings.js + chitti_lang.js settle
    window.addEventListener('chitti:langchange', relocalize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
