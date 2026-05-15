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
  const ISL_DICTIONARY_URL = 'chitti_isl_dictionary.json';
  // In-memory ISL dictionary — populated on first need. Honest placeholder
  // (emoji-hand keyframe sequences) until Phase 3 community videos land.
  let ISL_DICT = null;
  let ISL_DICT_LOADING = null;

  // 26 languages — must match Chitti Voice Factory registry.
  // Each entry: [code, English label, native label, flag icon].
  // "Flag" = a country-flag emoji where natural, otherwise a 1–2 char
  // native-script emblem rendered in a colored badge. The emblem is
  // visually distinct per language even for illiterate users — they
  // recognise the SHAPE of their own script. Bryan locked 2026-05-13:
  // flag icons only, no dropdowns, no text labels.
  const LANGUAGES = [
    ['en',  'English',      'English',       'A'],
    ['hi',  'Hindi',        'हिन्दी',         '🇮🇳'],
    ['bn',  'Bengali',      'বাংলা',         'বা'],
    ['te',  'Telugu',       'తెలుగు',        'తె'],
    ['mr',  'Marathi',      'मराठी',         'म'],
    ['ta',  'Tamil',        'தமிழ்',         'த'],
    ['gu',  'Gujarati',     'ગુજરાતી',       'ગુ'],
    ['kn',  'Kannada',      'ಕನ್ನಡ',          'ಕ'],
    ['ml',  'Malayalam',    'മലയാളം',         'മ'],
    ['or',  'Odia',         'ଓଡ଼ିଆ',          'ଓ'],
    ['pa',  'Punjabi',      'ਪੰਜਾਬੀ',         'ਪ'],
    ['ur',  'Urdu',         'اردو',          'ا'],
    ['as',  'Assamese',     'অসমীয়া',        'অ'],
    ['sa',  'Sanskrit',     'संस्कृतम्',      'सं'],
    ['ne',  'Nepali',       'नेपाली',         '🇳🇵'],
    ['ks',  'Kashmiri',     'كٲشُر',          'كٲ'],
    ['sd',  'Sindhi',       'سنڌي',          'سن'],
    ['mai', 'Maithili',     'मैथिली',         'मै'],
    ['mni', 'Manipuri',     'ꯃꯩꯇꯩ',         'ꯃ'],
    ['kok', 'Konkani',      'कोंकणी',         'को'],
    ['doi', 'Dogri',        'डोगरी',          'डो'],
    ['brx', 'Bodo',         'बड़ो',           'बो'],
    ['sat', 'Santhali',     'ᱥᱟᱱᱛᱟᱲᱤ',       'ᱥ'],
    ['bho', 'Bhojpuri',     'भोजपुरी',        'भो'],
    ['hne', 'Chhattisgarhi','छत्तीसगढ़ी',     'छ'],
    ['tcy', 'Tulu',         'ತುಳು',          'ತು'],
    ['kfa', 'Kodava',       'ಕೊಡವ',          'ಕೊ'],
    ['kru', 'Oraon',        'कुड़ुख़',         'कु'],
  ];

  // Four-user disability pill labels per language. The substrate finds
  // any `.four-user span` on the page and rewrites the trailing word
  // while preserving the emoji prefix (👁️‍🗨️ blind, 🦻 deaf, 🤫 mute,
  // 📖 illiterate). Bryan locked 2026-05-14: pills must show in the
  // page's language, not English. Smaller languages without a native
  // term fall back to their closest cousin script — better than English.
  const DISABILITY_LABELS = {
    en:  { blind: 'blind',         deaf: 'deaf',           mute: 'mute',         illiterate: 'illiterate' },
    hi:  { blind: 'अंधा',           deaf: 'बहरा',           mute: 'गूंगा',         illiterate: 'अनपढ़' },
    bn:  { blind: 'অন্ধ',           deaf: 'বধির',           mute: 'বোবা',         illiterate: 'নিরক্ষর' },
    te:  { blind: 'గుడ్డి',          deaf: 'చెవిటి',          mute: 'మూగ',          illiterate: 'నిరక్షరాస్యుడు' },
    mr:  { blind: 'अंध',            deaf: 'बहिरा',          mute: 'मुका',          illiterate: 'निरक्षर' },
    ta:  { blind: 'குருடு',          deaf: 'காது கேளாதவர்', mute: 'ஊமை',         illiterate: 'படிக்க தெரியாதவர்' },
    gu:  { blind: 'અંધ',            deaf: 'બહેરા',          mute: 'મૂંગા',         illiterate: 'નિરક્ષર' },
    kn:  { blind: 'ಕುರುಡು',         deaf: 'ಕಿವುಡು',         mute: 'ಮೂಗ',          illiterate: 'ಅನಕ್ಷರಸ್ಥ' },
    ml:  { blind: 'അന്ധൻ',          deaf: 'ബധിരൻ',          mute: 'മൂകൻ',         illiterate: 'നിരക്ഷരൻ' },
    or:  { blind: 'ଅନ୍ଧ',            deaf: 'ବଧିର',           mute: 'ବୋବା',         illiterate: 'ନିରକ୍ଷର' },
    pa:  { blind: 'ਅੰਨ੍ਹਾ',           deaf: 'ਬੋਲਾ',           mute: 'ਗੂੰਗਾ',         illiterate: 'ਅਨਪੜ੍ਹ' },
    ur:  { blind: 'اندھا',          deaf: 'بہرا',           mute: 'گونگا',        illiterate: 'ناخواندہ' },
    as:  { blind: 'অন্ধ',           deaf: 'বধিৰ',           mute: 'মূক',          illiterate: 'নিৰক্ষৰ' },
    sa:  { blind: 'अन्धः',           deaf: 'बधिरः',          mute: 'मूकः',          illiterate: 'निरक्षरः' },
    ne:  { blind: 'अन्धो',           deaf: 'बहिरो',          mute: 'लाटो',          illiterate: 'निरक्षर' },
    ks:  { blind: 'انٛدھ',           deaf: 'بَہرٕ',           mute: 'گونٛگ',         illiterate: 'ناخٔندٕ' },
    sd:  { blind: 'انڌو',            deaf: 'ٻوڙو',           mute: 'گونگو',        illiterate: 'اڻپڙهيل' },
    mai: { blind: 'अन्हर',           deaf: 'बहिर',           mute: 'गूँग',          illiterate: 'निरक्षर' },
    mni: { blind: 'ꯃꯤꯇ ꯇꯥꯡꯕ',     deaf: 'ꯅꯥ ꯇꯥꯗꯕ',      mute: 'ꯋꯥꯔꯣꯏ',       illiterate: 'ꯂꯥꯢꯔꯤꯛ ꯈꯪꯗꯕ' },
    kok: { blind: 'आंदळो',           deaf: 'बहिरो',          mute: 'मुको',          illiterate: 'निरक्षर' },
    doi: { blind: 'अन्ना',            deaf: 'बैह्रा',          mute: 'गूंगा',         illiterate: 'अनपढ़' },
    brx: { blind: 'मेगन गावनै',       deaf: 'खानानानै',       mute: 'गाबनानै',       illiterate: 'पठाय मोनै' },
    sat: { blind: 'ᱢᱮᱫ ᱵᱟᱝ ᱧᱮᱞ',     deaf: 'ᱞᱩᱛᱩᱨ ᱵᱟᱝ ᱟᱸᱡᱚᱢ', mute: 'ᱠᱟᱛᱷᱟ ᱵᱟᱝ ᱚᱲᱟᱜ', illiterate: 'ᱟᱨᱟᱪ ᱵᱟᱝ ᱢᱚᱱᱮᱭ' },
    bho: { blind: 'अन्हर',            deaf: 'बहिर',           mute: 'गूँग',          illiterate: 'अनपढ़' },
    hne: { blind: 'अंधा',             deaf: 'बहरा',           mute: 'गूंगा',         illiterate: 'अनपढ़' },
    tcy: { blind: 'ಕುರುಡು',          deaf: 'ಕೆಪ್ಪ',          mute: 'ಬುಲೆ',         illiterate: 'ಅಕ್ಷರ ಗೊತ್ತಿಲ್ಲ' },
    kfa: { blind: 'ಕುರುಡು',          deaf: 'ಕಿವುಡು',         mute: 'ಮೂಗ',          illiterate: 'ಅನಕ್ಷರಸ್ಥ' },
    kru: { blind: 'अन्धा',            deaf: 'बहिर',           mute: 'गूँगा',         illiterate: 'अनपढ़' },
  };

  // Unicode-script → default language map. Auto-detect runs against
  // typed text and speech transcripts. Devanagari, Bengali, and Arabic
  // are ambiguous (multiple languages share the script); default to the
  // most-spoken option in each block. User can flag-pick to override.
  const SCRIPT_RANGES = [
    [/[ऀ-ॿ]/, 'hi'], // Devanagari → Hindi (also Marathi, Sanskrit, Nepali, etc.)
    [/[ঀ-৿]/, 'bn'], // Bengali → Bengali (also Assamese)
    [/[਀-੿]/, 'pa'], // Gurmukhi → Punjabi
    [/[઀-૿]/, 'gu'], // Gujarati
    [/[଀-୿]/, 'or'], // Odia
    [/[஀-௿]/, 'ta'], // Tamil
    [/[ఀ-౿]/, 'te'], // Telugu
    [/[ಀ-೿]/, 'kn'], // Kannada
    [/[ഀ-ൿ]/, 'ml'], // Malayalam
    [/[؀-ۿݐ-ݿﭐ-﷿]/, 'ur'], // Arabic script → Urdu
    [/[ꯀ-꯿]/, 'mni'], // Meetei Mayek → Manipuri
    [/[᱐-᱿]/, 'sat'], // Ol Chiki → Santhali
    [/[A-Za-z]/, 'en'],
  ];

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }

  function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  }

  // ── LANGUAGE AUTO-DETECT ─────────────────────────────────────
  // Three sources, priority order (later overrides earlier IF the user
  // has NOT manually picked via the dropdown — manual is sticky):
  //   1. Browser locale          → detectFromBrowser()
  //   2. Typed text in any input → text observer (script ranges)
  //   3. Spoken-text transcript  → observeSpeechTranscript(text)
  //
  // Manual dropdown selection sets state.lang_manual=true and freezes
  // auto-detect. Bryan: "Auto-detect is default. Dropdown overrides."
  const SUPPORTED_CODES = new Set(LANGUAGES.map((l) => l[0]));

  function detectFromBrowser() {
    const candidates = [];
    if (navigator.language) candidates.push(navigator.language);
    if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
    for (const raw of candidates) {
      if (!raw) continue;
      const lower = String(raw).toLowerCase();
      const base = lower.split('-')[0];
      if (SUPPORTED_CODES.has(base)) return base;
      // Some browsers expose 3-letter ISO 639-3 codes (e.g. "bho").
      if (SUPPORTED_CODES.has(lower)) return lower;
    }
    return 'en';
  }

  function detectFromText(text) {
    const s = String(text || '');
    if (!s.trim()) return null;
    for (const [re, code] of SCRIPT_RANGES) {
      if (re.test(s) && SUPPORTED_CODES.has(code)) return code;
    }
    return null;
  }

  // ── DISABILITY PILLS — LOCALIZER ─────────────────────────────
  // Rewrites the four-user accessibility pills (👁️‍🗨️ blind, 🦻 deaf,
  // 🤫 mute, 📖 illiterate) so they show in the current language.
  // Detects which pill by emoji prefix (stable across pages); preserves
  // the emoji and overwrites only the trailing word. Falls back to
  // English when the current language has no entry.
  function localizeDisabilityPills(code) {
    const labels = DISABILITY_LABELS[code] || DISABILITY_LABELS.en;
    const pills = document.querySelectorAll('.four-user span, [data-chitti-disability-pill] span, [data-chitti-disability-pill]');
    pills.forEach((el) => {
      const original = (el.textContent || '').trim();
      if (!original) return;
      // Match by emoji prefix — robust whether the rest is English,
      // Hindi, or already localised to another language.
      let key = null;
      if (/^👁️?‍?🗨?️?|^👁/.test(original) || /^👀/.test(original)) key = 'blind';
      else if (/^🦻|^👂/.test(original)) key = 'deaf';
      else if (/^🤫|^🤐|^🙊/.test(original)) key = 'mute';
      else if (/^📖|^📚|^✏️|^✏/.test(original)) key = 'illiterate';
      if (!key) return;
      // Extract leading emoji cluster (everything up to first ASCII /
      // Latin / Indic letter) and rewrite the rest as the localised
      // word. This survives en→ta→hi→en cycles without drift.
      const m = original.match(/^([\s\S]*?)([A-Za-zÀ-ɏऀ-෿฀-࿿က-៿ᬀ-᭿ᰀ-᱿ꠀ-꯿].*)$/);
      const emoji = m ? m[1].trim() : original.split(' ')[0];
      el.textContent = (emoji ? emoji + ' ' : '') + labels[key];
      el.setAttribute('data-chitti-disability-pill', key);
      el.setAttribute('lang', code);
    });
  }

  // Public hook for page-side voice handlers — call with the recognised
  // transcript so we can route the language through the same observer.
  function observeSpeechTranscript(text) {
    const detected = detectFromText(text);
    if (detected) maybeAutoSetLanguage(detected, 'speech');
  }

  function maybeAutoSetLanguage(code, source) {
    if (!code || !SUPPORTED_CODES.has(code)) return;
    const state = loadState();
    if (state.lang_manual) return; // manual wins
    if (state.lang === code) return;
    setLanguage(code, { manual: false, source: source || 'auto' });
  }

  // Debounced typed-text observer on every input/textarea (and any
  // [contenteditable]) — global, lives for the lifetime of the page.
  let TEXT_DEBOUNCE = null;
  function attachTextDetector() {
    const handler = (e) => {
      const t = e.target;
      if (!t) return;
      const tag = (t.tagName || '').toUpperCase();
      const editable = t.isContentEditable;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !editable) return;
      const val = editable ? t.textContent : t.value;
      if (!val || val.length < 2) return;
      clearTimeout(TEXT_DEBOUNCE);
      TEXT_DEBOUNCE = setTimeout(() => {
        const detected = detectFromText(val);
        if (detected) maybeAutoSetLanguage(detected, 'text');
      }, 700);
    };
    document.addEventListener('input', handler, true);
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

  // ── ISL (INDIAN SIGN LANGUAGE) ───────────────────────────────
  // Phase 1: dictionary + per-response animation panel + tap-word modal.
  // Phase 2 (camera) + Phase 3 (community videos) are COMING SOON;
  // Phase 3 will replace frames[] with video[] without frontend change.
  // Animations below are HONEST PLACEHOLDERS — never claim accuracy.
  async function loadIslDictionary() {
    if (ISL_DICT) return ISL_DICT;
    if (ISL_DICT_LOADING) return ISL_DICT_LOADING;
    ISL_DICT_LOADING = (async () => {
      try {
        const r = await fetch(ISL_DICTIONARY_URL, { cache: 'force-cache' });
        if (!r.ok) throw new Error('isl-dict-' + r.status);
        ISL_DICT = await r.json();
      } catch (e) {
        // Minimal in-memory fallback so ISL never silently disappears.
        ISL_DICT = {
          schema: 'chitti-isl-dictionary/v1-fallback',
          frame_duration_ms_default: 500,
          entries: {
            chitti: { label_en: 'Chitti', frames: ['🤖', '🤝', '🤖'] },
            namaste: { label_en: 'Hello', frames: ['🙏', '🤝', '🙏'] },
            haan: { label_en: 'Yes', frames: ['👍', '✊', '👍'] },
            nahin: { label_en: 'No', frames: ['👎', '✋', '👎'] },
          },
          fingerspell_alphabet: {
            a: '✊', b: '🖐️', c: '👌', d: '☝️', e: '✋',
            f: '👌', g: '👉', h: '✌️', i: '🤙', j: '🤙',
            k: '✌️', l: '👆', m: '🤘', n: '✌️', o: '👌',
            p: '👇', q: '👌', r: '🤞', s: '✊', t: '👍',
            u: '✌️', v: '✌️', w: '🖖', x: '☝️', y: '🤙', z: '☝️',
          },
        };
      }
      return ISL_DICT;
    })();
    return ISL_DICT_LOADING;
  }

  function islNormalize(word) {
    return String(word || '')
      .toLowerCase()
      .replace(/[^a-zÀ-ɏऀ-ॿঀ-৿਀-૿଀-௿ఀ-೿ഀ-෿]/g, '');
  }

  function islLookup(word) {
    if (!ISL_DICT || !ISL_DICT.entries) return null;
    const norm = islNormalize(word);
    if (!norm) return null;
    if (ISL_DICT.entries[norm]) return { kind: 'word', key: norm, entry: ISL_DICT.entries[norm] };
    // Try Hindi label match — useful when DeepSeek replies in Hindi text.
    for (const [k, v] of Object.entries(ISL_DICT.entries)) {
      if (v.label_hi && islNormalize(v.label_hi) === norm) return { kind: 'word', key: k, entry: v };
    }
    return null;
  }

  function islFingerspellFrames(word) {
    const alpha = (ISL_DICT && ISL_DICT.fingerspell_alphabet) || {};
    const out = [];
    for (const ch of String(word || '').toLowerCase()) {
      if (alpha[ch]) out.push(alpha[ch]);
    }
    return out.length ? out : ['🤚'];
  }

  // Build a small inline animation node for a single word.
  // frames[] is rendered as a CSS step-animation cycling glyphs every
  // frame_duration_ms ms. Tap opens an enlarged modal.
  function islRenderWord(word, opts) {
    opts = opts || {};
    const lookup = islLookup(word);
    const frames = lookup ? lookup.entry.frames : islFingerspellFrames(word);
    const label = lookup
      ? (lookup.entry.label_en || word)
      : word + ' (fingerspell)';
    const duration =
      (ISL_DICT && ISL_DICT.frame_duration_ms_default) || 500;

    const span = document.createElement('button');
    span.type = 'button';
    span.className = 'chitti-isl-sign';
    span.setAttribute('data-isl-word', word);
    span.setAttribute('data-isl-known', lookup ? 'true' : 'false');
    span.setAttribute(
      'aria-label',
      'ISL sign for ' + label + ' — tap for larger view'
    );
    span.title = 'ISL: ' + label + ' (placeholder — tap for larger view)';

    const glyphs = frames
      .map((g, i) => `<span class="chitti-isl-frame" style="animation-delay:${i * duration}ms;animation-duration:${frames.length * duration}ms">${g}</span>`)
      .join('');
    span.innerHTML = `<span class="chitti-isl-frames" aria-hidden="true">${glyphs}</span><span class="chitti-isl-word-label">${label}</span>`;

    span.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      islOpenModal(word);
    });
    return span;
  }

  // Auto-build a panel that renders the ISL sequence for an entire
  // response text. Splits on whitespace, renders one sign per word.
  function islRenderPanel(text) {
    const wrap = document.createElement('div');
    wrap.className = 'chitti-isl-panel';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Indian Sign Language — placeholder animation');

    const header = document.createElement('div');
    header.className = 'chitti-isl-panel-header';
    header.innerHTML =
      '<span class="chitti-mini-logo" aria-hidden="true">C</span>' +
      '<span>ISL · placeholder · tap any word</span>';
    wrap.appendChild(header);

    const row = document.createElement('div');
    row.className = 'chitti-isl-row';
    const words = String(text || '').split(/\s+/).filter(Boolean).slice(0, 24);
    if (!words.length) {
      row.innerHTML = '<span class="chitti-isl-empty">No text to sign yet.</span>';
    } else {
      words.forEach((w) => row.appendChild(islRenderWord(w)));
    }
    wrap.appendChild(row);

    const foot = document.createElement('div');
    foot.className = 'chitti-isl-panel-foot';
    foot.innerHTML =
      'Real ISL videos coming soon — <a href="chitti_isl.html#contribute">contribute</a>';
    wrap.appendChild(foot);

    return wrap;
  }

  // Attach (or replace) an ISL panel as a sibling of `el`. Idempotent —
  // multiple calls on the same element keep only the latest panel.
  function attachSign(el) {
    if (!el || !el.parentNode) return;
    // Find or create the sibling panel.
    let panel = el.nextElementSibling;
    if (!panel || !panel.classList || !panel.classList.contains('chitti-isl-attached')) {
      panel = document.createElement('div');
      panel.className = 'chitti-isl-attached';
      el.parentNode.insertBefore(panel, el.nextSibling);
    }
    panel.innerHTML = '';
    panel.appendChild(islRenderPanel(el.textContent || ''));
  }

  // MutationObserver: any element marked [data-chitti-response] or
  // .chitti-response gets a panel automatically once ISL mode is on.
  let ISL_OBSERVER = null;
  function islStartObserver() {
    if (ISL_OBSERVER) return;
    const sweep = (root) => {
      const targets = root.querySelectorAll
        ? root.querySelectorAll('[data-chitti-response], .chitti-response')
        : [];
      targets.forEach((t) => attachSign(t));
    };
    sweep(document);
    ISL_OBSERVER = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          if (
            n.matches &&
            (n.matches('[data-chitti-response]') ||
              n.matches('.chitti-response'))
          ) {
            attachSign(n);
          } else {
            sweep(n);
          }
        });
        if (m.type === 'characterData' && m.target.parentElement) {
          const p = m.target.parentElement.closest('[data-chitti-response], .chitti-response');
          if (p) attachSign(p);
        }
      }
    });
    ISL_OBSERVER.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function islStopObserver() {
    if (ISL_OBSERVER) {
      ISL_OBSERVER.disconnect();
      ISL_OBSERVER = null;
    }
    document
      .querySelectorAll('.chitti-isl-attached')
      .forEach((n) => n.remove());
  }

  async function setIslMode(on) {
    document.body.classList.toggle('chitti-isl-on', !!on);
    const state = loadState();
    state.isl = !!on;
    saveState(state);
    if (on) {
      await loadIslDictionary();
      islStartObserver();
      announce('Sign language mode on. Indian Sign Language placeholders are showing next to every Chitti response.');
    } else {
      islStopObserver();
      announce('Sign language mode off.');
    }
  }

  // Tap-a-word modal — enlarged sign view + Hindi/English labels.
  function islOpenModal(word) {
    const lookup = islLookup(word);
    const frames = lookup ? lookup.entry.frames : islFingerspellFrames(word);
    const labelEn = lookup ? (lookup.entry.label_en || word) : word;
    const labelHi = lookup ? (lookup.entry.label_hi || '') : '';
    const duration =
      (ISL_DICT && ISL_DICT.frame_duration_ms_default) || 500;

    const old = document.getElementById('chitti-isl-modal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'chitti-isl-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Indian Sign Language for ' + labelEn);
    modal.innerHTML = `
      <div class="chitti-isl-modal-card">
        <button class="chitti-isl-modal-close" type="button" aria-label="Close">✕</button>
        <div class="chitti-isl-modal-big" aria-hidden="true">
          ${frames.map((g, i) => `<span class="chitti-isl-frame chitti-isl-frame-big" style="animation-delay:${i * duration}ms;animation-duration:${frames.length * duration}ms">${g}</span>`).join('')}
        </div>
        <div class="chitti-isl-modal-labels">
          <div class="chitti-isl-modal-en">${labelEn}</div>
          ${labelHi ? `<div class="chitti-isl-modal-hi" lang="hi">${labelHi}</div>` : ''}
          <div class="chitti-isl-modal-meta">${lookup ? 'Known word — placeholder animation' : 'Fingerspelled (word not in dictionary)'}</div>
        </div>
        <div class="chitti-isl-modal-foot">
          <strong>Placeholder ISL.</strong>
          <a href="chitti_isl.html#contribute">Contribute a real video</a>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('chitti-isl-modal-close')) {
        modal.remove();
      }
    });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        const m = document.getElementById('chitti-isl-modal');
        if (m) m.remove();
        document.removeEventListener('keydown', escHandler);
      }
    });
    speak(labelEn, loadState().lang || 'en');
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
  // setLanguage(code, opts) — opts.manual:
  //   true  → user picked from dropdown; freezes auto-detect.
  //   false → auto-detect (browser/text/speech); does not freeze.
  // Pages listen on 'chitti:lang' to re-render translatable text.
  function setLanguage(code, opts) {
    opts = opts || {};
    const state = loadState();
    state.lang = code;
    if (opts.manual === true) state.lang_manual = true;
    if (opts.manual === false && state.lang_manual === undefined) {
      state.lang_manual = false;
    }
    saveState(state);
    document.documentElement.setAttribute('lang', code);
    document.documentElement.setAttribute('data-chitti-lang', code);
    document.dispatchEvent(new CustomEvent('chitti:lang', {
      detail: { code, manual: !!opts.manual, source: opts.source || (opts.manual ? 'manual' : 'auto') },
    }));
    // Sync the dropdown if it already exists in the DOM.
    const sel = document.getElementById('chitti-lang');
    if (sel && sel.value !== code) sel.value = code;
    // Re-localise the four-user disability pills in the new language.
    try { localizeDisabilityPills(code); } catch (e) { /* defensive — page may not have pills */ }
    const lang = LANGUAGES.find((l) => l[0] === code) || [code, code, code, ''];
    announce(
      (opts.manual ? 'Language changed to ' : 'Language auto-detected: ') + lang[1]
    );
  }

  // ── DISABILITY PROFILE — LOCKED 2026-05-13 (SAHAYAI_MASTER §7) ──
  // One-time multi-select on first visit to ANY Chitti page. Saved
  // locally; never re-asked. Drives every per-profile adaptation in
  // §5c (blind auto-announce, elderly slow speech, illiterate picture
  // menus, ISL panel, rural 2G mode). Implemented here so every page
  // that loads chitti_a11y.js inherits the prompt automatically — the
  // §7 contract is "no page ships without this".
  //
  // Pages with their own opening modal (e.g. chitti_vaani.html's T&C
  // consent gate) opt out of the auto-prompt by setting
  // `data-chitti-skip-profile-prompt` on <body>; they call
  // Chitti.a11y.profile.prompt() explicitly once their consent flow
  // resolves.
  //
  // Storage shape: state.profile = { blind:true, deaf:true, ... } —
  // empty `{}` after a Skip click counts as "asked & answered" so we
  // don't re-prompt forever.
  const DISABILITY_OPTIONS = [
    { key: 'blind',      icon: '👁️‍🗨️', en: 'I am blind or have low vision',           hi: 'मैं अंधा हूँ या कम दिखाई देता है' },
    { key: 'deaf',       icon: '🦻',     en: 'I am deaf or hard of hearing',            hi: 'मैं बहरा हूँ या ऊँचा सुनता हूँ' },
    { key: 'mute',       icon: '🤫',     en: 'I am mute or have speech difficulty',     hi: 'मैं बोल नहीं सकता / बोलने में कठिनाई है' },
    { key: 'isl',        icon: '🤟',     en: 'I use sign language (ISL)',               hi: 'मैं संकेत भाषा (ISL) इस्तेमाल करता हूँ' },
    { key: 'illiterate', icon: '📖',     en: 'I have difficulty reading',               hi: 'मुझे पढ़ने में कठिनाई होती है' },
    { key: 'elderly',    icon: '👴',     en: 'I am elderly (65+)',                      hi: 'मैं वरिष्ठ नागरिक हूँ (65+)' },
    { key: 'mobility',   icon: '🦽',     en: 'I have limited mobility',                 hi: 'मेरी गतिशीलता सीमित है' },
    { key: 'cognitive',  icon: '🧠',     en: 'I have cognitive disability',             hi: 'मुझे संज्ञानात्मक कठिनाई है' },
    { key: 'rural',      icon: '📡',     en: 'I am in a rural area / low connectivity', hi: 'मैं ग्रामीण क्षेत्र में हूँ / नेट धीमा है' },
    { key: 'none',       icon: '✓',      en: 'None of the above',                       hi: 'इनमें से कोई नहीं' },
  ];
  const PROFILE_HEADING = {
    en: 'How can Chitti help you better?',
    hi: 'चिट्टी आपकी बेहतर सहायता कैसे करे?',
    ta: 'சிட்டி உங்களுக்கு எப்படி நன்றாக உதவ முடியும்?',
    te: 'చిట్టి మిమ్మల్ని ఎలా బాగా సహాయం చేయగలదు?',
    bn: 'চিট্টি কীভাবে আপনাকে আরও ভালো সাহায্য করতে পারে?',
    mr: 'चिट्टी तुमची चांगली मदत कशी करू शकते?',
    gu: 'ચિટ્ટી તમને કેવી રીતે વધુ સારી મદદ કરી શકે?',
    kn: 'ಚಿಟ್ಟಿ ನಿಮಗೆ ಹೇಗೆ ಉತ್ತಮವಾಗಿ ಸಹಾಯ ಮಾಡಬಲ್ಲದು?',
    ml: 'ചിട്ടി നിങ്ങളെ എങ്ങനെ മികച്ച രീതിയിൽ സഹായിക്കും?',
  };
  const PROFILE_HINT = {
    en: 'Pick all that apply. You can change this anytime in Settings.',
    hi: 'जो भी लागू हो, चुनें। आप इसे कभी भी सेटिंग्स में बदल सकते हैं।',
  };
  const PROFILE_SAVE = { en: 'Save', hi: 'सहेजें' };
  const PROFILE_SKIP = { en: 'Skip for now', hi: 'अभी रहने दें' };

  function getProfile() {
    const s = loadState() || {};
    return s.profile || null;
  }
  function setProfile(p) {
    const s = loadState() || {};
    s.profile = p || {};
    s.profile_set_at = Math.floor(Date.now() / 1000);
    saveState(s);
    document.dispatchEvent(new CustomEvent('chitti:profile', { detail: { profile: s.profile } }));
  }
  function hasProfile() {
    const p = getProfile();
    return !!p; // {} after a Skip click counts as set; only null/undefined is "never asked"
  }
  function _profileEsc(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
    ));
  }

  let _profileModalEl = null;
  function showProfilePrompt(opts) {
    opts = opts || {};
    if (_profileModalEl) return; // already showing
    injectProfileStyles();
    const lang = (loadState() || {}).lang || 'en';
    const heading = PROFILE_HEADING[lang] || PROFILE_HEADING.en;
    const hint = PROFILE_HINT[lang] || PROFILE_HINT.en;
    const saveLabel = PROFILE_SAVE[lang] || PROFILE_SAVE.en;
    const skipLabel = PROFILE_SKIP[lang] || PROFILE_SKIP.en;
    const existing = getProfile() || {};

    const overlay = document.createElement('div');
    overlay.className = 'chitti-profile-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'chitti-profile-heading');
    overlay.innerHTML =
      '<div class="chitti-profile-panel">' +
        '<h2 id="chitti-profile-heading">' + _profileEsc(heading) + '</h2>' +
        '<p class="chitti-profile-hint">' + _profileEsc(hint) + '</p>' +
        '<ul class="chitti-profile-opts" role="group" aria-label="' + _profileEsc(heading) + '">' +
          DISABILITY_OPTIONS.map((o) => {
            const checked = !!existing[o.key];
            const label = o[lang] || o.en;
            return '<li><label>' +
              '<input type="checkbox" data-key="' + o.key + '"' + (checked ? ' checked' : '') + '>' +
              '<span class="ico" aria-hidden="true">' + o.icon + '</span>' +
              '<span class="lbl">' + _profileEsc(label) + '</span>' +
            '</label></li>';
          }).join('') +
        '</ul>' +
        '<div class="chitti-profile-actions">' +
          '<button type="button" class="chitti-profile-save">' + _profileEsc(saveLabel) + '</button>' +
          '<button type="button" class="chitti-profile-skip">' + _profileEsc(skipLabel) + '</button>' +
        '</div>' +
        '<p class="chitti-profile-note">SAHAYAI_MASTER §7 · Disability Profile</p>' +
      '</div>';

    document.body.appendChild(overlay);
    _profileModalEl = overlay;

    function _close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      _profileModalEl = null;
    }

    overlay.querySelector('.chitti-profile-save').addEventListener('click', () => {
      const profile = {};
      overlay.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        if (cb.checked) profile[cb.getAttribute('data-key')] = true;
      });
      setProfile(profile);
      // If ISL is selected, turn ISL mode on so the user sees it immediately.
      if (profile.isl) { try { setIslMode(true); } catch (_) {} }
      if (typeof opts.onSave === 'function') opts.onSave(profile);
      _close();
      announce('Profile saved');
    });

    overlay.querySelector('.chitti-profile-skip').addEventListener('click', () => {
      setProfile({}); // empty {} marks "asked, no selections" so we don't re-ask
      if (typeof opts.onSkip === 'function') opts.onSkip();
      _close();
    });

    // Voice-guide: read the heading + hint aloud on open. The profile
    // doesn't yet exist, so we always speak — first-time blind users
    // would otherwise see nothing. opts.silent suppresses for tests.
    if (opts.silent !== true) {
      try { speak(heading + '. ' + hint, lang); } catch (_) {}
    }
    // Set initial focus to the first checkbox for keyboard / SR users.
    setTimeout(() => {
      const cb = overlay.querySelector('input[type="checkbox"]');
      if (cb) try { cb.focus(); } catch (_) {}
    }, 50);
  }

  function _maybeAutoPromptProfile() {
    if (hasProfile()) return;
    if (document.body && document.body.hasAttribute('data-chitti-skip-profile-prompt')) return;
    // Defer slightly so any page-level overlay (T&C, consent) renders first.
    // If one is detected as visible, we silently bow out — the page is
    // expected to call Chitti.a11y.profile.prompt() once its own modal closes.
    setTimeout(() => {
      if (hasProfile()) return;
      if (document.body.hasAttribute('data-chitti-skip-profile-prompt')) return;
      const otherModal = document.querySelector(
        '[role="dialog"][aria-modal="true"]:not(.chitti-profile-overlay), .consent-overlay:not(.hidden)'
      );
      if (otherModal) {
        // Visible? bow out. Hidden via .hidden / display:none? proceed.
        const cs = otherModal.classList && otherModal.classList.contains('hidden');
        const styleHidden = otherModal.style && otherModal.style.display === 'none';
        if (!cs && !styleHidden) return;
      }
      showProfilePrompt({});
    }, 800);
  }

  function injectProfileStyles() {
    if (document.getElementById('chitti-profile-styles')) return;
    const s = document.createElement('style');
    s.id = 'chitti-profile-styles';
    s.textContent =
      '.chitti-profile-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9500;' +
      'display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;' +
      "font-family:-apple-system,'Segoe UI',Inter,sans-serif}" +
      '.chitti-profile-panel{background:#fff;border:2px solid #D4AF37;border-radius:14px;' +
      'padding:20px;max-width:540px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.4)}' +
      '.chitti-profile-panel h2{margin:0 0 6px;color:#E86A17;font-size:20px;font-weight:900}' +
      '.chitti-profile-hint{margin:0 0 14px;color:#555;font-size:13px;line-height:1.5}' +
      '.chitti-profile-opts{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}' +
      '.chitti-profile-opts li{background:#fbf8f1;border:1px solid #e5e7eb;border-radius:10px}' +
      '.chitti-profile-opts label{display:flex;align-items:center;gap:10px;padding:10px 12px;' +
      'cursor:pointer;min-height:44px;font-size:14px;color:#17202a;line-height:1.4}' +
      '.chitti-profile-opts input[type="checkbox"]{width:20px;height:20px;flex-shrink:0;cursor:pointer}' +
      '.chitti-profile-opts .ico{font-size:20px;flex-shrink:0;width:24px;text-align:center}' +
      '.chitti-profile-opts .lbl{flex:1}' +
      '.chitti-profile-opts label:focus-within{outline:2px solid #D4AF37;outline-offset:2px}' +
      '.chitti-profile-actions{display:flex;gap:8px;margin-top:14px;padding-top:12px;' +
      'border-top:1px solid #e5e7eb;flex-wrap:wrap}' +
      '.chitti-profile-actions button{border:none;border-radius:10px;padding:12px 18px;' +
      'font-size:14px;font-weight:800;cursor:pointer;min-height:46px;flex:1;min-width:140px;font-family:inherit}' +
      '.chitti-profile-save{background:linear-gradient(135deg,#E86A17,#ff9b4a);color:#fff;' +
      'box-shadow:0 6px 18px rgba(232,106,23,.3)}' +
      '.chitti-profile-save:hover{filter:brightness(1.05)}' +
      '.chitti-profile-skip{background:transparent;color:#6b7280;border:1px solid #e5e7eb !important}' +
      '.chitti-profile-note{margin:10px 0 0;font-size:10px;color:#888;text-align:right;' +
      "font-family:'JetBrains Mono','Menlo',monospace}";
    document.head.appendChild(s);
  }

  // ── INIT: INJECT BAR INTO PAGE ───────────────────────────────
  // Adds a sticky top bar with: language picker, Voice Required marker
  // (if requested), braille-mode toggle. Below any existing legal banner.
  function init(opts) {
    opts = opts || {};
    const state = loadState();

    ensureLiveRegion();
    injectBaseStyles();
    injectBar(opts);

    // Language priority on init:
    //   1. Restore saved lang (manual or last auto)
    //   2. Otherwise auto-detect from browser locale
    if (state.lang) {
      setLanguage(state.lang, { manual: !!state.lang_manual, source: 'restore' });
    } else {
      const detected = detectFromBrowser();
      setLanguage(detected, { manual: false, source: 'browser' });
    }

    // Listen for typed text in any input/textarea; auto-switch unless
    // user has manually picked from the dropdown.
    attachTextDetector();

    // Restore other a11y modes after bar exists so toggles reflect state.
    if (state.braille) setBrailleMode(true);
    if (state.isl) setIslMode(true);

    // Disability Profile prompt on first visit (SAHAYAI_MASTER §7).
    // Pages with their own opening modal opt out via
    // <body data-chitti-skip-profile-prompt> and call
    // Chitti.a11y.profile.prompt() once their flow resolves.
    _maybeAutoPromptProfile();

    // Feature Discovery — LOCKED 2026-05-14, SAHAYAI_MASTER §2 / §2d.
    // "What can Chitti do for you?" loads on every Chitti page by piggy-
    // backing on the a11y substrate (same contract as the ISL plugin —
    // the dictionary is the contract, the substrate is the loader).
    // Idempotent: re-init is a no-op once the script is in the DOM.
    ensureFeaturesSubstrate();

    // Camera intelligence — LOCKED 2026-05-13, SAHAYAI_MASTER §2b.
    // Single capture path for every Chitti that has camera access. The
    // substrate is loaded on every page (even on Chittis with no camera
    // yet) so an honest local queue is always available; the actual
    // POST surface is `/api/camera/capture`, configured via
    // `window.CHITTI_CAMERA_API` and consumed by the per-Chitti router.
    ensureCameraSubstrate();

    // Offline / 2G mode — P1 from SAHAYAI_MASTER §5b + §5c. Registers
    // the service worker (chitti_offline_sw.js) and surfaces a
    // connectivity badge. Honest contract: /api/* is never served from
    // cache, cached responses are visibly tagged.
    ensureOfflineSubstrate();

    // Blind-user gesture navigation — P1 from SAHAYAI_MASTER §5c.
    // Activates on every page; only does anything when the User
    // Disability Profile has `blind: true`. Swipe left/right between
    // sections, two-finger tap to read current section, both honoured
    // by `Chitti.a11y.navigate(direction)` so callers can wire to any
    // gesture/key/voice command.
    attachBlindGestureNav();
  }

  // ── BLIND GESTURE NAVIGATION ─────────────────────────────────
  // SAHAYAI_MASTER §5c: "swipe left/right to move between sections" for
  // BLIND users. Idempotent — re-init is a no-op (a `_navAttached` flag
  // on document.body guards the listeners). The actual navigation API
  // is exposed on `Chitti.a11y.navigate(dir)` so the same logic works
  // for swipes, keyboard shortcuts, and voice commands.
  //
  // Honest defaults — if the page doesn't structure itself into sections
  // (no <section>, no [role=region], no .section-card / .card.panel /
  // .panel), the helper speaks an honest empty: "No sections to navigate
  // on this page. Tap or speak to interact." rather than silently
  // failing.

  const NAV_SELECTOR =
    'main section, main [role="region"], main .section-card, main .panel, ' +
    'main .card[role="tabpanel"], main .art-card';

  function _profile() { return (loadState() || {}).profile || {}; }
  function _isBlind() { return !!_profile().blind; }
  function _isEnabledForNav() {
    // Also honour an explicit override + the existing braille mode
    // (braille users are typically blind-equivalent for gesture purposes).
    const s = loadState();
    return _isBlind() || !!s.braille || !!s.nav_force_on;
  }

  function _navTargets() {
    const list = Array.from(document.querySelectorAll(NAV_SELECTOR));
    // Filter out hidden / 0-height nodes so we don't focus invisible panels.
    return list.filter((el) => {
      const cs = el.getBoundingClientRect();
      const hidden = el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true';
      return !hidden && cs.height > 4 && cs.width > 4;
    });
  }

  function _currentNavIndex(targets) {
    // Active = the section whose top is nearest the viewport top but ≤ 1/3 down.
    const cutoff = window.innerHeight / 3;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    targets.forEach((el, i) => {
      const top = el.getBoundingClientRect().top;
      const dist = top < cutoff ? cutoff - top : top - cutoff;
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    return best;
  }

  function _focusAndAnnounce(el) {
    if (!el) return;
    // Make it focusable transiently for keyboard / screen-reader users.
    const hadTabindex = el.hasAttribute('tabindex');
    if (!hadTabindex) el.setAttribute('tabindex', '-1');
    try { el.focus({ preventScroll: false }); } catch (_) {}
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!hadTabindex) {
      setTimeout(() => {
        try { el.removeAttribute('tabindex'); } catch (_) {}
      }, 1500);
    }
    // Speak the heading + a short body preview. aria-label > aria-labelledby
    // > first heading > truncated text content.
    let label = el.getAttribute('aria-label') || '';
    if (!label) {
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        const ref = document.getElementById(labelledBy);
        if (ref) label = (ref.textContent || '').trim();
      }
    }
    if (!label) {
      const heading = el.querySelector('h1, h2, h3, h4, [role="heading"]');
      if (heading) label = (heading.textContent || '').trim();
    }
    if (!label) label = (el.textContent || '').trim().slice(0, 80);
    if (label) {
      speak(label, loadState().lang || 'en');
      announce('Section: ' + label);
    } else {
      announce('Section (no heading).');
    }
  }

  function navigate(direction) {
    const targets = _navTargets();
    if (!targets.length) {
      speak('No sections to navigate on this page. Tap or speak to interact.', loadState().lang || 'en');
      return null;
    }
    const cur = _currentNavIndex(targets);
    let next = cur;
    if (direction === 'next' || direction === 'right' || direction === 'down' || direction === 1) {
      next = Math.min(cur + 1, targets.length - 1);
    } else if (direction === 'prev' || direction === 'previous' || direction === 'left' || direction === 'up' || direction === -1) {
      next = Math.max(cur - 1, 0);
    } else if (direction === 'first') {
      next = 0;
    } else if (direction === 'last') {
      next = targets.length - 1;
    } else if (direction === 'read') {
      // Re-announce the current section without moving.
      _focusAndAnnounce(targets[cur]);
      return cur;
    }
    if (next === cur && (direction === 'next' || direction === 'right')) {
      speak('End of page.', loadState().lang || 'en');
    } else if (next === cur && (direction === 'prev' || direction === 'left')) {
      speak('Start of page.', loadState().lang || 'en');
    }
    _focusAndAnnounce(targets[next]);
    return next;
  }

  function attachBlindGestureNav() {
    if (document.body.dataset.chittiNavAttached === '1') return;
    document.body.dataset.chittiNavAttached = '1';

    // Touch swipe handlers. Threshold tuned for thumb swipes — 50 px is
    // the standard mobile touch slop minimum.
    const SWIPE_THRESHOLD_PX = 50;
    const SWIPE_MAX_DURATION_MS = 700;
    let sx = 0, sy = 0, st = 0, tracking = false;

    document.addEventListener('touchstart', (e) => {
      if (!_isEnabledForNav()) return;
      if (!e.touches || e.touches.length !== 1) { tracking = false; return; }
      const t = e.touches[0];
      sx = t.clientX; sy = t.clientY; st = Date.now();
      tracking = true;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (!tracking || !_isEnabledForNav()) { tracking = false; return; }
      tracking = false;
      const t = (e.changedTouches && e.changedTouches[0]) || null;
      if (!t) return;
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const dt = Date.now() - st;
      if (dt > SWIPE_MAX_DURATION_MS) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(dy) > Math.abs(dx) * 0.8) return;       // mostly horizontal
      // Avoid hijacking native UI: ignore swipes that started on an
      // input / textarea / select / scrollable element with horizontal
      // overflow.
      const target = e.target;
      if (target && target.closest && target.closest('input, textarea, select, [contenteditable], [data-no-nav-swipe]')) return;
      navigate(dx < 0 ? 'next' : 'prev');
    }, { passive: true });

    // Two-finger tap → read current section. Quick and universal.
    document.addEventListener('touchstart', (e) => {
      if (!_isEnabledForNav()) return;
      if (e.touches && e.touches.length === 2) {
        navigate('read');
      }
    }, { passive: true });

    // Keyboard shortcuts (useful for braille-display users too).
    //   Alt + ArrowRight / ArrowDown   → next section
    //   Alt + ArrowLeft  / ArrowUp     → prev section
    //   Alt + Home / End               → first / last
    //   Alt + Enter / Alt + Space      → re-read current
    document.addEventListener('keydown', (e) => {
      if (!_isEnabledForNav()) return;
      if (!e.altKey) return;
      const key = e.key;
      if (key === 'ArrowRight' || key === 'ArrowDown') { e.preventDefault(); navigate('next'); }
      else if (key === 'ArrowLeft' || key === 'ArrowUp') { e.preventDefault(); navigate('prev'); }
      else if (key === 'Home') { e.preventDefault(); navigate('first'); }
      else if (key === 'End') { e.preventDefault(); navigate('last'); }
      else if (key === 'Enter' || key === ' ') { e.preventDefault(); navigate('read'); }
    });

    // Announce availability the first time the profile turns blind on
    // this device, so blind users know the gestures exist.
    const seenKey = 'chitti_a11y_nav_announced';
    if (_isEnabledForNav() && !sessionStorage.getItem(seenKey)) {
      try { sessionStorage.setItem(seenKey, '1'); } catch (_) {}
      setTimeout(() => {
        speak(
          'Gesture navigation is on. Swipe left or right between sections. Two-finger tap reads the current section.',
          loadState().lang || 'en',
        );
      }, 1200);
    }
  }

  function ensureFeaturesSubstrate() {
    if (global.Chitti && global.Chitti.features) return;
    if (document.getElementById('chitti-features-script')) return;
    const s = document.createElement('script');
    s.id = 'chitti-features-script';
    s.src = sibScriptUrl('chitti_features.js');
    s.async = true;
    s.defer = true;
    s.onerror = () => {
      // Honest stub — never silently disappear. Surface a one-line note
      // in the aria-live region so blind users hear that the feature
      // list could not load (e.g. when offline).
      announce(
        'Feature list could not load. Speak to Chitti to ask what it can do.'
      );
    };
    document.head.appendChild(s);
  }

  function ensureCameraSubstrate() {
    if (global.Chitti && global.Chitti.camera) return;
    if (document.getElementById('chitti-camera-script')) return;
    const s = document.createElement('script');
    s.id = 'chitti-camera-script';
    s.src = sibScriptUrl('chitti_camera.js');
    s.async = true;
    s.defer = true;
    // No `onerror` announce — pages without camera flows would hear an
    // unnecessary message. The substrate is best-effort; the per-Chitti
    // camera flow checks `window.Chitti.camera` before using it.
    document.head.appendChild(s);
  }

  function ensureOfflineSubstrate() {
    if (global.Chitti && global.Chitti.offline) return;
    if (document.getElementById('chitti-offline-script')) return;
    // Service workers require https / localhost. Skip silently on file://
    // or http:// previews so the substrate doesn't error.
    const proto = (location && location.protocol) || '';
    if (proto !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    const s = document.createElement('script');
    s.id = 'chitti-offline-script';
    s.src = sibScriptUrl('chitti_offline.js');
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  function sibScriptUrl(name) {
    // Resolve relative to whichever path chitti_a11y.js itself was
    // loaded from. Works whether the page is at repo root (sahayai.in
    // GitHub Pages) or inside a product subfolder (when previewing
    // chitti-voice-factory/frontend/*.html locally).
    const tags = document.getElementsByTagName('script');
    for (const t of tags) {
      const src = t.src || '';
      if (/chitti_a11y\.js(\?|$)/.test(src)) {
        return src.replace(/chitti_a11y\.js(\?[^#]*)?$/, name);
      }
    }
    return name;
  }

  // Back-compat alias — the original name was used by callers in tests.
  function featuresScriptUrl() { return sibScriptUrl('chitti_features.js'); }

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

      /* ── ISL (Indian Sign Language) ───────────────────────── */
      .chitti-isl-attached {
        margin:8px 0 12px 0;
      }
      .chitti-isl-panel {
        background:#FFF7E8;
        border:1px solid #E86A17;
        border-left:4px solid #E86A17;
        border-radius:8px;
        padding:8px 10px;
        font:13px/1.4 system-ui,-apple-system,sans-serif;
        color:#0E2344;
      }
      .chitti-isl-panel-header {
        display:flex; align-items:center; gap:4px;
        font-weight:700; font-size:12px;
        color:#0E2344; margin-bottom:6px;
      }
      .chitti-isl-row {
        display:flex; flex-wrap:wrap; gap:6px;
        align-items:flex-end;
      }
      .chitti-isl-empty { color:#6b7280; font-style:italic; }
      .chitti-isl-sign {
        background:#fff;
        border:1px solid #d4b274;
        border-radius:6px;
        padding:4px 6px 2px;
        min-width:48px;
        display:inline-flex; flex-direction:column;
        align-items:center; gap:2px;
        cursor:pointer; font:inherit;
      }
      .chitti-isl-sign:hover, .chitti-isl-sign:focus {
        outline:2px solid #E86A17; outline-offset:1px;
      }
      .chitti-isl-sign[data-isl-known="false"] {
        border-style:dashed; opacity:.85;
      }
      .chitti-isl-frames {
        position:relative;
        width:28px; height:28px;
        font-size:22px; line-height:28px;
      }
      .chitti-isl-frame {
        position:absolute; left:0; top:0;
        width:100%; text-align:center;
        opacity:0;
        animation-name: chittiIslFrame;
        animation-iteration-count: infinite;
        animation-timing-function: steps(1,end);
      }
      .chitti-isl-word-label {
        font-size:10px; color:#0E2344; max-width:90px;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      }
      @keyframes chittiIslFrame {
        0%, 33% { opacity:1; }
        34%, 100% { opacity:0; }
      }
      .chitti-isl-panel-foot {
        margin-top:6px; font-size:11px; color:#6b7280;
      }
      .chitti-isl-panel-foot a {
        color:#E86A17; text-decoration:underline;
      }

      /* Hide ISL panels when ISL mode is OFF (defensive — observer also
         removes them on toggle, but this catches any race). */
      body:not(.chitti-isl-on) .chitti-isl-attached { display:none; }

      /* ── ISL Modal ───────────────────────────────────────── */
      #chitti-isl-modal {
        position:fixed; inset:0; z-index:10001;
        background:rgba(14,35,68,.78);
        display:flex; align-items:center; justify-content:center;
        padding:16px;
      }
      .chitti-isl-modal-card {
        background:#fff; color:#0E2344;
        border-radius:14px; max-width:420px; width:100%;
        padding:18px 18px 14px;
        box-shadow:0 12px 40px rgba(0,0,0,.35);
        position:relative;
        font:14px/1.5 system-ui,-apple-system,sans-serif;
      }
      .chitti-isl-modal-close {
        position:absolute; right:8px; top:8px;
        background:transparent; border:0; font-size:18px;
        cursor:pointer; color:#0E2344;
      }
      .chitti-isl-modal-big {
        position:relative;
        height:140px;
        margin:8px auto 12px;
      }
      .chitti-isl-frame-big {
        font-size:110px; line-height:140px;
      }
      .chitti-isl-modal-labels {
        text-align:center;
      }
      .chitti-isl-modal-en {
        font-size:22px; font-weight:800; color:#0E2344;
      }
      .chitti-isl-modal-hi {
        font-size:18px; color:#E86A17; margin-top:2px;
      }
      .chitti-isl-modal-meta {
        font-size:11px; color:#6b7280; margin-top:4px;
      }
      .chitti-isl-modal-foot {
        margin-top:12px; text-align:center;
        font-size:12px; color:#6b7280;
        border-top:1px solid #eee; padding-top:10px;
      }
      .chitti-isl-modal-foot a {
        color:#E86A17; text-decoration:underline; margin-left:6px;
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

    // Each option shows the language emblem (flag emoji or native-script
    // letter) alongside the native + English names so even illiterate
    // users can spot their language by its script shape.
    const opts_html = LANGUAGES.map(([c, en, native, flag]) =>
      `<option value="${c}"${c === (state.lang || 'en') ? ' selected' : ''}>${flag || ''} ${native} (${en})</option>`
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
      <button id="chitti-isl-toggle" type="button"
        aria-pressed="${!!state.isl}"
        title="Toggle Indian Sign Language mode — placeholder animations next to every Chitti response">
        🤟 ISL${state.isl ? ': ON' : ''}
      </button>
      <button id="chitti-speak-page" type="button"
        title="Read the main heading aloud"
        aria-label="Chitti — read this page aloud">
        <span class="chitti-mini-logo" aria-hidden="true">C</span>🔊 Read page
      </button>
      <button id="chitti-explain-simply" type="button"
        title="Re-render the page in plain English — short sentences, no jargon"
        aria-label="Explain this page simply">
        💡 Explain simply
      </button>
      <button id="chitti-demo-btn" type="button"
        title="Load a sample request so you can see Chitti respond"
        aria-label="Try a demo request">
        🎬 Demo
      </button>
      <span style="margin-left:auto;opacity:.75;font-size:11px">
        Powered by <a href="https://bhashini.gov.in/" target="_blank" rel="noopener" style="color:#fff;text-decoration:underline">Bhashini</a> · provider-swappable
      </span>
    `;

    document.body.insertBefore(bar, document.body.firstChild);

    bar.querySelector('#chitti-lang').addEventListener('change', (e) => {
      // Manual dropdown selection — freezes auto-detect from here on.
      setLanguage(e.target.value, { manual: true, source: 'dropdown' });
    });
    bar.querySelector('#chitti-braille-toggle').addEventListener('click', (e) => {
      const next = !document.body.classList.contains('chitti-braille');
      setBrailleMode(next);
      e.currentTarget.setAttribute('aria-pressed', String(next));
      e.currentTarget.textContent = '⠿ Braille mode' + (next ? ': ON' : '');
    });
    bar.querySelector('#chitti-isl-toggle').addEventListener('click', async (e) => {
      const next = !document.body.classList.contains('chitti-isl-on');
      e.currentTarget.disabled = true;
      try { await setIslMode(next); }
      finally {
        e.currentTarget.disabled = false;
        e.currentTarget.setAttribute('aria-pressed', String(next));
        e.currentTarget.textContent = '🤟 ISL' + (next ? ': ON' : '');
      }
    });
    bar.querySelector('#chitti-speak-page').addEventListener('click', () => {
      const h1 = document.querySelector('h1, [role=heading]');
      const text = (h1 && h1.textContent) || document.title || 'Chitti';
      speak(text, loadState().lang || 'en');
    });
    bar.querySelector('#chitti-explain-simply').addEventListener('click', () => {
      explainSimply();
    });
    bar.querySelector('#chitti-demo-btn').addEventListener('click', () => {
      runDemo();
    });
  }

  // ── DEMO ─────────────────────────────────────────────────────
  // Pages opt in via <meta name="chitti-demo-sample" content="text…">.
  // If meta is absent, fall back to first visible input/textarea + the
  // page's title as a sample query — honest, never silently fake.
  function runDemo() {
    const meta = document.querySelector('meta[name="chitti-demo-sample"]');
    const sample = (meta && meta.content) ||
      'Show me how Chitti ' + (document.title || 'works').replace(/·.*$/, '').trim();
    const target =
      document.querySelector('[data-chitti-demo-target]') ||
      document.querySelector('main textarea, main input[type="text"], main input[type="search"]') ||
      document.querySelector('textarea, input[type="text"], input[type="search"]');
    if (target) {
      target.value = sample;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      target.focus();
      announce('Demo loaded. Press the submit button or speak to Chitti.');
    } else {
      announce('Demo: this page has no input. Use the speaker button to hear the live data aloud.');
    }
    document.body.classList.add('chitti-demo-on');
  }

  // ── EXPLAIN SIMPLY ───────────────────────────────────────────
  // Re-renders the page's main content in short, plain English sentences.
  // Splits long sentences (> 14 words) and strips parenthetical asides.
  // Idempotent — clicking again restores the original DOM.
  function explainSimply() {
    if (document.body.classList.contains('chitti-explain-on')) {
      restoreOriginalText();
      document.body.classList.remove('chitti-explain-on');
      announce('Restored full page.');
      return;
    }
    const targets = document.querySelectorAll(
      'main p, main li, article p, article li, ' +
      'section p, section li, .card p, .card li, ' +
      '.explanation, .narr, .plain-english'
    );
    let touched = 0;
    targets.forEach((el) => {
      if (el.dataset.chittiOriginal != null) return;
      const orig = el.innerHTML;
      const simple = simplifyText(el.textContent || '');
      if (!simple) return;
      el.dataset.chittiOriginal = orig;
      el.textContent = simple;
      touched++;
    });
    document.body.classList.add('chitti-explain-on');
    announce(
      touched > 0
        ? 'Page rewritten in plain English. Tap the button again to restore.'
        : 'Nothing to simplify on this page yet.'
    );
  }

  function restoreOriginalText() {
    document.querySelectorAll('[data-chitti-original]').forEach((el) => {
      el.innerHTML = el.dataset.chittiOriginal;
      delete el.dataset.chittiOriginal;
    });
  }

  function simplifyText(s) {
    if (!s) return '';
    let t = String(s);
    // Strip parentheticals.
    t = t.replace(/\([^)]{0,120}\)/g, '');
    t = t.replace(/\s{2,}/g, ' ').trim();
    // Split into sentences; break any over 14 words by clauses.
    const out = [];
    t.split(/(?<=[.!?])\s+/).forEach((sentence) => {
      const words = sentence.trim().split(/\s+/);
      if (words.length <= 14) { out.push(sentence.trim()); return; }
      // Break by commas / semicolons / 'and' / 'but'.
      sentence
        .split(/[,;]\s*|\s+(?:and|but|because|so that|which)\s+/i)
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((p) => out.push(p.endsWith('.') ? p : p + '.'));
    });
    return out.join(' ');
  }

  // ── PUBLIC API ───────────────────────────────────────────────
  const api = {
    init,
    speak,
    synthesize,
    announce,
    setLanguage,
    setBrailleMode,
    setIslMode,
    attachSign,
    islRenderPanel,
    islRenderWord,
    islOpenModal,
    loadIslDictionary,
    detectFromBrowser,
    detectFromText,
    observeSpeechTranscript,
    localizeDisabilityPills,
    DISABILITY_LABELS,
    explainSimply,
    runDemo,
    navigate,
    getState: loadState,
    LANGUAGES,
    VOICE_FACTORY_URL,
    // Disability Profile (§7) — prompted once on first visit, never re-asked.
    profile: {
      prompt: (opts) => showProfilePrompt(opts || {}),
      get: getProfile,
      set: setProfile,
      has: hasProfile,
    },
  };
  // lang.current — required by the §1c G4 verification protocol
  //   (`window.Chitti.a11y.lang.current`). Read-only getter so it always
  //   reflects whatever setLanguage() most recently wrote.
  const langApi = { set: setLanguage, detectFromBrowser, detectFromText };
  Object.defineProperty(langApi, 'current', {
    get: () => (loadState() || {}).lang || 'en',
    enumerable: true,
  });
  api.lang = langApi;

  global.Chitti = global.Chitti || {};
  global.Chitti.a11y = api;

  // ──────────────────────────────────────────────────────────────
  // Chitti.location — shared GPS / pincode capture
  // ──────────────────────────────────────────────────────────────
  // Powers the local-Chitti-first directory in every product page.
  // Single source of truth so future Chittis (Mechanic / Salon /
  // Kirana) inherit the same capture flow without re-implementing.
  //
  // Public API (window.Chitti.location):
  //   get({ prompt, allow_stale_ms })  → Promise<{lat,lng,pincode,source,age_s}>
  //   set({ lat?, lng?, pincode? })    → persist manually (e.g. settings)
  //   clear()                          → forget cached location
  //
  // Storage: per-device localStorage key `chitti_location_v1`. Never
  // sent to a server by this helper — the consuming page decides when
  // to attach it to a request. (Privacy-first: location stays local
  // unless the user explicitly invokes a feature that needs it.)
  //
  // GPS path: navigator.geolocation.getCurrentPosition with a soft
  // 8 s timeout. If the user denies the permission once, we DO NOT
  // re-prompt on every call — we fall through to pincode input.
  //
  // Pincode path: prompt() with a 6-digit validator. No reverse-geocode
  // round-trip — the server can map pincode → lat/lng via its own
  // chitti-pincode-tier.json lookup table (server-side, not client).
  // Honest: we don't currently bundle a client-side pincode→latlng
  // table; we just store the pincode and let the server interpret.
  // ──────────────────────────────────────────────────────────────

  const LOC_KEY = 'chitti_location_v1';

  function _loadLoc() {
    try {
      const raw = localStorage.getItem(LOC_KEY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (!o || (o.lat == null && !o.pincode)) return null;
      return o;
    } catch (_) { return null; }
  }

  function _saveLoc(obj) {
    try { localStorage.setItem(LOC_KEY, JSON.stringify(obj)); } catch (_) {}
  }

  function _now() { return Math.floor(Date.now() / 1000); }

  function _validPincode(s) {
    return /^[1-9]\d{5}$/.test(String(s || '').trim());
  }

  async function _tryGPS(timeoutMs) {
    return new Promise((resolve) => {
      if (!navigator || !navigator.geolocation) return resolve(null);
      const opts = { enableHighAccuracy: false, timeout: timeoutMs || 8000, maximumAge: 60000 };
      let settled = false;
      const done = (v) => { if (!settled) { settled = true; resolve(v); } };
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c = pos && pos.coords;
            if (!c) return done(null);
            done({ lat: c.latitude, lng: c.longitude, accuracy_m: c.accuracy, source: 'gps' });
          },
          (_err) => done(null),
          opts,
        );
      } catch (_) { done(null); }
      // Hard fallback so we never hang the caller if the browser
      // silently swallows both callbacks.
      setTimeout(() => done(null), (timeoutMs || 8000) + 500);
    });
  }

  function _promptPincode(message) {
    const m = message || 'Enter your 6-digit pincode (so Chitti can show businesses near you):';
    let p = '';
    try { p = window.prompt(m, '') || ''; } catch (_) { return null; }
    p = p.trim();
    if (!_validPincode(p)) return null;
    return p;
  }

  /**
   * Get the user's location. Returns the cached value if `allow_stale_ms`
   * permits (default: 6 hours). Otherwise attempts GPS, then pincode prompt.
   *
   * Never throws — resolves with `null` if the user declines everything.
   * Callers should treat `null` as "fall back to directory-wide search".
   */
  async function locGet(opts) {
    opts = opts || {};
    const allowStale = opts.allow_stale_ms != null ? opts.allow_stale_ms : 6 * 3600 * 1000;
    const cached = _loadLoc();
    if (cached && cached.captured_at && (Date.now() - cached.captured_at * 1000) < allowStale) {
      return Object.assign({}, cached, { age_s: _now() - cached.captured_at });
    }

    // GPS first.
    const gps = await _tryGPS(opts.timeout_ms);
    if (gps) {
      const out = Object.assign({}, gps, { captured_at: _now() });
      _saveLoc(out);
      return out;
    }

    // GPS denied / unavailable — pincode fallback. Only prompt when the
    // caller said it's OK to interrupt the user.
    if (opts.prompt) {
      const pin = _promptPincode(opts.prompt_message);
      if (pin) {
        const out = { pincode: pin, source: 'pincode', captured_at: _now() };
        _saveLoc(out);
        return out;
      }
    }

    return null;
  }

  function locSet(obj) {
    const cur = _loadLoc() || {};
    const next = Object.assign({}, cur, obj || {}, { captured_at: _now() });
    if (next.pincode && !_validPincode(next.pincode)) {
      throw new Error('invalid pincode');
    }
    _saveLoc(next);
    return next;
  }

  function locClear() {
    try { localStorage.removeItem(LOC_KEY); } catch (_) {}
  }

  global.Chitti.location = {
    get: locGet,
    set: locSet,
    clear: locClear,
    cached: _loadLoc,
    isValidPincode: _validPincode,
  };
})(window);
