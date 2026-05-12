/**
 * CHITTI A11Y KIT
 *
 * Single-file accessibility substrate every Chitti page should load:
 *
 *   <script src="chitti_a11y.js"></script>
 *   <script>Chitti.a11y.init({ voiceRequired: true });</script>
 *
 * What it ships:
 *   1. Language selector wired to Chitti Voice Factory (Bhashini today,
 *      pluggable via VOICE_FACTORY_URL — see chitti-voice-factory).
 *   2. "Voice Required" prominent marker for pages where voice IN/OUT
 *      is part of the contract (Vaani, MedUPI scan, Shares scanner, Sales coach).
 *   3. Braille-friendly mode toggle: strips emojis from spoken text,
 *      simplifies layout to single column, raises font, routes every
 *      dynamic update through an aria-live=polite region so a refreshable
 *      braille display (e.g. BrailleBack on Android) gets every change.
 *   4. Speak helper that defers to the page's existing chitti.speak if
 *      present, else falls back to browser SpeechSynthesis with the
 *      selected language.
 *
 * The voice provider is intentionally abstracted at one URL:
 *
 *   window.Chitti.a11y.VOICE_FACTORY_URL
 *
 * To swap Bhashini for any future provider, change the URL or the
 * backend's supplier — frontend stays identical.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'chitti_a11y_v1';
  const VOICE_FACTORY_URL = 'https://chitti-voice-factory.onrender.com';

  // 26 languages — must match Chitti Voice Factory registry.
  // Code, English label, native label.
  const LANGUAGES = [
    ['en',  'English',    'English'],
    ['hi',  'Hindi',      'हिन्दी'],
    ['bn',  'Bengali',    'বাংলা'],
    ['te',  'Telugu',     'తెలుగు'],
    ['mr',  'Marathi',    'मराठी'],
    ['ta',  'Tamil',      'தமிழ்'],
    ['gu',  'Gujarati',   'ગુજરાતી'],
    ['kn',  'Kannada',    'ಕನ್ನಡ'],
    ['ml',  'Malayalam',  'മലയാളം'],
    ['or',  'Odia',       'ଓଡ଼ିଆ'],
    ['pa',  'Punjabi',    'ਪੰਜਾਬੀ'],
    ['ur',  'Urdu',       'اردو'],
    ['as',  'Assamese',   'অসমীয়া'],
    ['sa',  'Sanskrit',   'संस्कृतम्'],
    ['ne',  'Nepali',     'नेपाली'],
    ['ks',  'Kashmiri',   'كٲشُر'],
    ['sd',  'Sindhi',     'سنڌي'],
    ['mai', 'Maithili',   'मैथिली'],
    ['mni', 'Manipuri',   'ꯃꯩꯇꯩ'],
    ['kok', 'Konkani',    'कोंकणी'],
    ['doi', 'Dogri',      'डोगरी'],
    ['brx', 'Bodo',       'बड़ो'],
    ['sat', 'Santhali',   'ᱥᱟᱱᱛᱟᱲᱤ'],
    ['bho', 'Bhojpuri',   'भोजपुरी'],
    ['hne', 'Chhattisgarhi','छत्तीसगढ़ी'],
    ['tcy', 'Tulu',       'ತುಳು'],
  ];

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }

  function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  }

  // ── ARIA-LIVE REGION FOR BRAILLE DISPLAYS ────────────────────
  // Single polite region. Page code calls Chitti.a11y.announce(text)
  // for every dynamic update. Braille displays mirror this region.
  function ensureLiveRegion() {
    let r = document.getElementById('chitti-aria-live');
    if (r) return r;
    r = document.createElement('div');
    r.id = 'chitti-aria-live';
    r.setAttribute('role', 'status');
    r.setAttribute('aria-live', 'polite');
    r.setAttribute('aria-atomic', 'true');
    r.style.cssText =
      'position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;';
    document.body.appendChild(r);
    return r;
  }

  function announce(text) {
    const r = ensureLiveRegion();
    // Toggle to force re-announcement on identical text.
    r.textContent = '';
    setTimeout(() => { r.textContent = String(text || ''); }, 30);
  }

  // ── SPEECH ───────────────────────────────────────────────────
  // Defer to chitti.speak / Chitti.Speech.sp if the page already wired
  // one, else use SpeechSynthesis directly. Strips emojis when braille
  // mode is on so a screen reader doesn't say "grinning face".
  function speak(text, langCode) {
    const state = loadState();
    let t = String(text || '');
    if (state.braille) t = stripEmojis(t);
    langCode = langCode || state.lang || 'en';
    if (global.chitti && typeof global.chitti.speak === 'function') {
      return global.chitti.speak(t, langCode);
    }
    if (global.Chitti && global.Chitti.Speech && global.Chitti.Speech.sp) {
      return global.Chitti.Speech.sp(t, langCode);
    }
    if (!global.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = bcpFor(langCode);
    u.rate = 0.88;
    u.pitch = 1.05;
    speechSynthesis.speak(u);
  }

  function bcpFor(code) {
    const map = { en: 'en-IN', hi: 'hi-IN', ur: 'ur-IN', bn: 'bn-IN',
      ta: 'ta-IN', te: 'te-IN', ml: 'ml-IN', kn: 'kn-IN',
      gu: 'gu-IN', mr: 'mr-IN', pa: 'pa-IN', or: 'or-IN', as: 'as-IN' };
    return map[code] || 'en-IN';
  }

  function stripEmojis(s) {
    return s.replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu,
      ''
    ).replace(/\s{2,}/g, ' ').trim();
  }

  // ── VOICE FACTORY (PROVIDER-AGNOSTIC) ────────────────────────
  // Bhashini today, swappable to any future provider by changing the
  // backend's supplier — frontend hits the same URL.
  async function synthesize(text, langCode) {
    try {
      const r = await fetch(`${VOICE_FACTORY_URL}/api/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: langCode || 'en' }),
      });
      if (!r.ok) throw new Error('voice-factory-error');
      return await r.json();
    } catch (e) {
      return { ok: false, error: String(e), fallback: 'web-speech-api' };
    }
  }

  // ── BRAILLE MODE ─────────────────────────────────────────────
  // Adds a body class. Pages declare braille-aware CSS that:
  //   - collapses multi-column layouts to one column
  //   - raises body font-size to 18px
  //   - hides emoji-only decorative spans (class="emoji-decor")
  //   - increases focus ring thickness
  // We also route announcements through aria-live (already always on).
  function setBrailleMode(on) {
    document.body.classList.toggle('chitti-braille', !!on);
    const state = loadState();
    state.braille = !!on;
    saveState(state);
    announce(on ? 'Braille mode on' : 'Braille mode off');
  }

  // ── LANGUAGE PICKER ──────────────────────────────────────────
  function setLanguage(code) {
    const state = loadState();
    state.lang = code;
    saveState(state);
    document.documentElement.setAttribute('lang', code);
    document.documentElement.setAttribute('data-chitti-lang', code);
    // Pages listen to this event to re-render any translatable text.
    document.dispatchEvent(new CustomEvent('chitti:lang', { detail: { code } }));
    announce('Language changed to ' + (LANGUAGES.find(l => l[0] === code) || [code, code])[1]);
  }

  // ── INIT: INJECT BAR INTO PAGE ───────────────────────────────
  // Adds a sticky top bar with: language picker, Voice Required marker
  // (if requested), braille-mode toggle. Below any existing legal banner.
  function init(opts) {
    opts = opts || {};
    const state = loadState();
    if (state.lang) setLanguage(state.lang); // restore
    if (state.braille) setBrailleMode(true);

    ensureLiveRegion();
    injectBar(opts);
    injectBaseStyles();
  }

  function injectBaseStyles() {
    if (document.getElementById('chitti-a11y-css')) return;
    const css = document.createElement('style');
    css.id = 'chitti-a11y-css';
    css.textContent = `
      .chitti-a11y-bar {
        display:flex; align-items:center; gap:10px; flex-wrap:wrap;
        padding:6px 12px; background:#0E2344; color:#fff;
        font:13px/1.4 system-ui,-apple-system,sans-serif;
        position:sticky; top:0; z-index:9998;
      }
      .chitti-a11y-bar select, .chitti-a11y-bar button {
        background:rgba(255,255,255,.12); color:#fff;
        border:1px solid rgba(255,255,255,.25);
        border-radius:6px; padding:4px 10px;
        font:inherit; cursor:pointer;
      }
      .chitti-a11y-bar button:focus, .chitti-a11y-bar select:focus,
      .chitti-a11y-bar button:focus-visible {
        outline:3px solid #D4AF37; outline-offset:2px;
      }
      .chitti-voice-required {
        background:#E86A17; color:#fff; border-radius:6px;
        padding:3px 10px; font-weight:700; letter-spacing:.3px;
      }
      /* Chitti brand badge — sits next to every speaker / voice button.
         Bryan: "Chitti icon next to every speaker button." 2026-05-13. */
      .chitti-mini-logo {
        display:inline-flex; align-items:center; justify-content:center;
        width:18px; height:18px; border-radius:5px; margin-right:6px;
        background:linear-gradient(135deg,#E86A17,#D4AF37);
        color:#fff; font-weight:900; font-size:11px; line-height:1;
        box-shadow:0 1px 3px rgba(232,106,23,.45);
        flex-shrink:0; vertical-align:middle;
      }
      .chitti-voice-required[aria-disabled="true"] {
        background:#6b7280;
      }
      /* Braille mode: simplifies layout for screen-reader/braille users */
      body.chitti-braille {
        font-size:18px !important;
        line-height:1.6 !important;
      }
      body.chitti-braille .chitti-braille-hide,
      body.chitti-braille .emoji-decor { display:none !important; }
      body.chitti-braille *:focus,
      body.chitti-braille *:focus-visible {
        outline:4px solid #D4AF37 !important; outline-offset:3px !important;
      }
      body.chitti-braille [aria-hidden="true"] { display:none !important; }
      /* Collapse multi-column grids in braille mode */
      body.chitti-braille .grid,
      body.chitti-braille [style*="grid-template-columns"] {
        display:block !important;
      }
    `;
    document.head.appendChild(css);
  }

  function injectBar(opts) {
    if (document.getElementById('chitti-a11y-bar')) return;
    const state = loadState();
    const bar = document.createElement('nav');
    bar.id = 'chitti-a11y-bar';
    bar.className = 'chitti-a11y-bar';
    bar.setAttribute('aria-label', 'Accessibility and language controls');

    const opts_html = LANGUAGES.map(([c, en, native]) =>
      `<option value="${c}"${c === (state.lang || 'en') ? ' selected' : ''}>${native} (${en})</option>`
    ).join('');

    const voiceTag = opts.voiceRequired
      ? `<span class="chitti-voice-required" role="note" aria-label="Voice IN and voice OUT are required on this page">🎤 Voice Required</span>`
      : '';

    bar.innerHTML = `
      <label for="chitti-lang" style="font-weight:600">🌐 Language:</label>
      <select id="chitti-lang" aria-label="Choose your language (voice and text)">
        ${opts_html}
      </select>
      ${voiceTag}
      <button id="chitti-braille-toggle" type="button"
        aria-pressed="${!!state.braille}"
        title="Toggle Braille-friendly mode">
        ⠿ Braille mode${state.braille ? ': ON' : ''}
      </button>
      <button id="chitti-speak-page" type="button"
        title="Read the main heading aloud"
        aria-label="Chitti — read this page aloud">
        <span class="chitti-mini-logo" aria-hidden="true">C</span>🔊 Read page
      </button>
      <span style="margin-left:auto;opacity:.75;font-size:11px">
        Powered by <a href="https://bhashini.gov.in/" target="_blank" rel="noopener" style="color:#fff;text-decoration:underline">Bhashini</a> · provider-swappable
      </span>
    `;

    document.body.insertBefore(bar, document.body.firstChild);

    bar.querySelector('#chitti-lang').addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
    bar.querySelector('#chitti-braille-toggle').addEventListener('click', (e) => {
      const next = !document.body.classList.contains('chitti-braille');
      setBrailleMode(next);
      e.currentTarget.setAttribute('aria-pressed', String(next));
      e.currentTarget.textContent = '⠿ Braille mode' + (next ? ': ON' : '');
    });
    bar.querySelector('#chitti-speak-page').addEventListener('click', () => {
      const h1 = document.querySelector('h1, [role=heading]');
      const text = (h1 && h1.textContent) || document.title || 'Chitti';
      speak(text, loadState().lang || 'en');
    });
  }

  // ── PUBLIC API ───────────────────────────────────────────────
  const api = {
    init,
    speak,
    synthesize,
    announce,
    setLanguage,
    setBrailleMode,
    getState: loadState,
    LANGUAGES,
    VOICE_FACTORY_URL,
  };

  global.Chitti = global.Chitti || {};
  global.Chitti.a11y = api;
})(window);
