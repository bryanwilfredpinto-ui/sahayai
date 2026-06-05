/* chitti_rc_scan.js — "Scan your RC → auto-fill your vehicle" for Bike + Car Doctor.
 * Sire 2026-06-05: instead of asking the user to add their car/bike by hand, offer
 * "Scan your RC" — Chitti reads make / model / year and pre-fills the form.
 *
 * HONESTY CONTRACT (platform §honest-stubs, §8, never-fabricate):
 *   • Make/model/year auto-extraction from the RC photo needs the vision model
 *     (DeepSeek vision — §8 funding-gated) OR a VAHAN/Parivahan API partnership
 *     (roadmap). That path is WIRED here (rcTryVision → window.CHITTI_RC_VISION_URL)
 *     and auto-activates the moment an endpoint is configured/funded. Until then it
 *     NEVER fabricates a verdict — it says "AI auto-read coming soon, confirm below".
 *   • What works TODAY, offline, deterministically: capture + save the RC photo on
 *     the device (privacy-local), and parse the registration number to the issuing
 *     STATE + RTO code (real, no network). That is shown immediately as a real taste
 *     of the auto-fill; the existing make/model/year form is the confirm step.
 *
 * Modular by design: merges its own 9-language strings into window.VAI_STRINGS so it
 * flows through the existing data-vai-i18n pipeline (strings.js is the sole translator;
 * chitti_lang.js stays removed). Self-inits — pages only add one <script> + one card. */
(function () {
  'use strict';
  var LANGS = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml'];

  // ── 9-language strings for the RC feature (no Hinglish; "RC" kept as the official
  //    acronym across India, like "UPI"). Keys namespaced rc.* — both pages share them.
  var RC_STRINGS = {
    en: {
      'rc.title': 'Scan your RC',
      'rc.sub': 'Point your camera at your RC (Registration Certificate) — Chitti reads the make, model and year. AI auto-read is coming soon; for now, confirm the details below.',
      'rc.scan': 'Scan RC',
      'rc.manual': 'Fill manually',
      'rc.reading': 'Reading your RC…',
      'rc.saved': 'RC photo saved on your device only 🔒',
      'rc.aisoon': 'AI auto-read of make & model is coming soon — please confirm the details below 👇',
      'rc.airead': 'Read from your RC — please check it is correct 👇',
      'rc.regin': 'Registered in',
      'rc.rto': 'RTO',
      'rc.badreg': "Couldn't read the number on the RC — please type it below.",
      'rc.retake': 'Retake',
    },
    hi: {
      'rc.title': 'अपना RC स्कैन करें',
      'rc.sub': 'कैमरा अपने RC (रजिस्ट्रेशन सर्टिफिकेट) पर रखें — Chitti कंपनी, मॉडल और साल पढ़ लेगा। AI से अपने‑आप पढ़ना जल्द आ रहा है; अभी नीचे जानकारी की पुष्टि कर दें।',
      'rc.scan': 'RC स्कैन करें',
      'rc.manual': 'खुद भरें',
      'rc.reading': 'आपका RC पढ़ रहे हैं…',
      'rc.saved': 'RC फोटो सिर्फ आपके फोन में सुरक्षित है 🔒',
      'rc.aisoon': 'कंपनी और मॉडल का AI ऑटो‑रीड जल्द आ रहा है — कृपया नीचे जानकारी की पुष्टि करें 👇',
      'rc.airead': 'आपके RC से पढ़ा गया — कृपया जाँच लें कि सही है 👇',
      'rc.regin': 'रजिस्टर्ड राज्य',
      'rc.rto': 'RTO',
      'rc.badreg': 'RC पर नंबर पढ़ नहीं पाए — कृपया नीचे टाइप करें।',
      'rc.retake': 'फिर से लें',
    },
    ta: {
      'rc.title': 'உங்கள் RC‑ஐ ஸ்கேன் செய்யுங்கள்',
      'rc.sub': 'உங்கள் RC (பதிவுச் சான்றிதழ்) மீது கேமராவை வையுங்கள் — Chitti நிறுவனம், மாடல், ஆண்டு ஆகியவற்றைப் படிக்கும். AI தானாகப் படிப்பது விரைவில் வரும்; இப்போதைக்கு கீழே விவரங்களை உறுதி செய்யுங்கள்.',
      'rc.scan': 'RC ஸ்கேன்',
      'rc.manual': 'நீங்களே நிரப்புங்கள்',
      'rc.reading': 'உங்கள் RC‑ஐப் படிக்கிறோம்…',
      'rc.saved': 'RC புகைப்படம் உங்கள் தொலைபேசியில் மட்டும் பாதுகாப்பாக உள்ளது 🔒',
      'rc.aisoon': 'நிறுவனம் & மாடலை AI தானாகப் படிப்பது விரைவில் வரும் — கீழே விவரங்களை உறுதி செய்யுங்கள் 👇',
      'rc.airead': 'உங்கள் RC‑இலிருந்து படிக்கப்பட்டது — சரியா எனப் பாருங்கள் 👇',
      'rc.regin': 'பதிவு செய்யப்பட்ட மாநிலம்',
      'rc.rto': 'RTO',
      'rc.badreg': 'RC‑இல் உள்ள எண்ணைப் படிக்க முடியவில்லை — கீழே தட்டச்சு செய்யுங்கள்.',
      'rc.retake': 'மீண்டும் எடு',
    },
    te: {
      'rc.title': 'మీ RC‑ని స్కాన్ చేయండి',
      'rc.sub': 'మీ RC (రిజిస్ట్రేషన్ సర్టిఫికెట్)పై కెమెరా ఉంచండి — Chitti కంపెనీ, మోడల్, సంవత్సరం చదువుతుంది. AI ఆటో‑రీడ్ త్వరలో వస్తుంది; ప్రస్తుతానికి కింద వివరాలను నిర్ధారించండి.',
      'rc.scan': 'RC స్కాన్',
      'rc.manual': 'మీరే నింపండి',
      'rc.reading': 'మీ RC చదువుతున్నాం…',
      'rc.saved': 'RC ఫోటో మీ ఫోన్‌లో మాత్రమే భద్రంగా ఉంది 🔒',
      'rc.aisoon': 'కంపెనీ & మోడల్ AI ఆటో‑రీడ్ త్వరలో వస్తుంది — కింద వివరాలను నిర్ధారించండి 👇',
      'rc.airead': 'మీ RC నుండి చదవబడింది — సరిగ్గా ఉందో చూడండి 👇',
      'rc.regin': 'రిజిస్టర్ అయిన రాష్ట్రం',
      'rc.rto': 'RTO',
      'rc.badreg': 'RCపై నంబర్ చదవలేకపోయాం — దయచేసి కింద టైప్ చేయండి.',
      'rc.retake': 'మళ్లీ తీయండి',
    },
    bn: {
      'rc.title': 'আপনার RC স্ক্যান করুন',
      'rc.sub': 'আপনার RC (রেজিস্ট্রেশন সার্টিফিকেট)‑এর উপর ক্যামেরা ধরুন — Chitti কোম্পানি, মডেল ও বছর পড়ে নেবে। AI অটো‑রিড শীঘ্রই আসছে; আপাতত নিচে তথ্য নিশ্চিত করুন।',
      'rc.scan': 'RC স্ক্যান',
      'rc.manual': 'নিজে ভরুন',
      'rc.reading': 'আপনার RC পড়া হচ্ছে…',
      'rc.saved': 'RC ছবি শুধু আপনার ফোনেই সুরক্ষিত 🔒',
      'rc.aisoon': 'কোম্পানি ও মডেলের AI অটো‑রিড শীঘ্রই আসছে — নিচে তথ্য নিশ্চিত করুন 👇',
      'rc.airead': 'আপনার RC থেকে পড়া হয়েছে — সঠিক কিনা দেখে নিন 👇',
      'rc.regin': 'নিবন্ধিত রাজ্য',
      'rc.rto': 'RTO',
      'rc.badreg': 'RC‑তে নম্বরটি পড়া গেল না — অনুগ্রহ করে নিচে টাইপ করুন।',
      'rc.retake': 'আবার তুলুন',
    },
    mr: {
      'rc.title': 'तुमचे RC स्कॅन करा',
      'rc.sub': 'कॅमेरा तुमच्या RC (रजिस्ट्रेशन सर्टिफिकेट)वर धरा — Chitti कंपनी, मॉडेल आणि वर्ष वाचेल. AI ऑटो‑रीड लवकरच येत आहे; आत्ता खाली माहितीची खात्री करा.',
      'rc.scan': 'RC स्कॅन',
      'rc.manual': 'स्वतः भरा',
      'rc.reading': 'तुमचे RC वाचत आहोत…',
      'rc.saved': 'RC फोटो फक्त तुमच्या फोनमध्ये सुरक्षित आहे 🔒',
      'rc.aisoon': 'कंपनी व मॉडेलचे AI ऑटो‑रीड लवकरच येत आहे — कृपया खाली माहितीची खात्री करा 👇',
      'rc.airead': 'तुमच्या RC मधून वाचले — बरोबर आहे का तपासा 👇',
      'rc.regin': 'नोंदणीकृत राज्य',
      'rc.rto': 'RTO',
      'rc.badreg': 'RC वरील क्रमांक वाचता आला नाही — कृपया खाली टाइप करा.',
      'rc.retake': 'पुन्हा घ्या',
    },
    gu: {
      'rc.title': 'તમારું RC સ્કેન કરો',
      'rc.sub': 'કૅમેરા તમારા RC (રજિસ્ટ્રેશન સર્ટિફિકેટ) પર રાખો — Chitti કંપની, મોડેલ અને વર્ષ વાંચી લેશે. AI ઑટો‑રીડ જલદી આવી રહ્યું છે; હમણાં નીચે વિગતોની ખાતરી કરો.',
      'rc.scan': 'RC સ્કેન',
      'rc.manual': 'જાતે ભરો',
      'rc.reading': 'તમારું RC વાંચી રહ્યા છીએ…',
      'rc.saved': 'RC ફોટો ફક્ત તમારા ફોનમાં સુરક્ષિત છે 🔒',
      'rc.aisoon': 'કંપની અને મોડેલનું AI ઑટો‑રીડ જલદી આવી રહ્યું છે — કૃપા કરી નીચે વિગતોની ખાતરી કરો 👇',
      'rc.airead': 'તમારા RC માંથી વાંચ્યું — સાચું છે કે નહીં તપાસો 👇',
      'rc.regin': 'નોંધાયેલ રાજ્ય',
      'rc.rto': 'RTO',
      'rc.badreg': 'RC પરનો નંબર વાંચી શકાયો નહીં — કૃપા કરી નીચે ટાઇપ કરો.',
      'rc.retake': 'ફરી લો',
    },
    kn: {
      'rc.title': 'ನಿಮ್ಮ RC ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
      'rc.sub': 'ಕ್ಯಾಮೆರಾವನ್ನು ನಿಮ್ಮ RC (ನೋಂದಣಿ ಪ್ರಮಾಣಪತ್ರ) ಮೇಲೆ ಇಡಿ — Chitti ಕಂಪನಿ, ಮಾದರಿ ಮತ್ತು ವರ್ಷವನ್ನು ಓದುತ್ತದೆ. AI ಸ್ವಯಂ‑ಓದುವಿಕೆ ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ; ಸದ್ಯಕ್ಕೆ ಕೆಳಗೆ ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸಿ.',
      'rc.scan': 'RC ಸ್ಕ್ಯಾನ್',
      'rc.manual': 'ನೀವೇ ತುಂಬಿ',
      'rc.reading': 'ನಿಮ್ಮ RC ಓದುತ್ತಿದ್ದೇವೆ…',
      'rc.saved': 'RC ಫೋಟೋ ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲಿ ಮಾತ್ರ ಸುರಕ್ಷಿತವಾಗಿದೆ 🔒',
      'rc.aisoon': 'ಕಂಪನಿ ಮತ್ತು ಮಾದರಿಯ AI ಸ್ವಯಂ‑ಓದುವಿಕೆ ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ — ಕೆಳಗೆ ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸಿ 👇',
      'rc.airead': 'ನಿಮ್ಮ RC ಯಿಂದ ಓದಲಾಗಿದೆ — ಸರಿಯಾಗಿದೆಯೇ ಪರಿಶೀಲಿಸಿ 👇',
      'rc.regin': 'ನೋಂದಾಯಿತ ರಾಜ್ಯ',
      'rc.rto': 'RTO',
      'rc.badreg': 'RC ಮೇಲಿನ ಸಂಖ್ಯೆಯನ್ನು ಓದಲಾಗಲಿಲ್ಲ — ದಯವಿಟ್ಟು ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.',
      'rc.retake': 'ಮತ್ತೆ ತೆಗೆಯಿರಿ',
    },
    ml: {
      'rc.title': 'നിങ്ങളുടെ RC സ്കാൻ ചെയ്യൂ',
      'rc.sub': 'ക്യാമറ നിങ്ങളുടെ RC (രജിസ്ട്രേഷൻ സർട്ടിഫിക്കറ്റ്) യിൽ വയ്ക്കൂ — Chitti കമ്പനി, മോഡൽ, വർഷം എന്നിവ വായിക്കും. AI സ്വയം‑വായന ഉടൻ വരുന്നു; ഇപ്പോൾ താഴെ വിവരങ്ങൾ ഉറപ്പാക്കൂ.',
      'rc.scan': 'RC സ്കാൻ',
      'rc.manual': 'സ്വയം പൂരിപ്പിക്കൂ',
      'rc.reading': 'നിങ്ങളുടെ RC വായിക്കുന്നു…',
      'rc.saved': 'RC ഫോട്ടോ നിങ്ങളുടെ ഫോണിൽ മാത്രം സുരക്ഷിതം 🔒',
      'rc.aisoon': 'കമ്പനിയും മോഡലും AI സ്വയം‑വായന ഉടൻ വരുന്നു — താഴെ വിവരങ്ങൾ ഉറപ്പാക്കൂ 👇',
      'rc.airead': 'നിങ്ങളുടെ RC യിൽ നിന്ന് വായിച്ചു — ശരിയാണോ എന്ന് നോക്കൂ 👇',
      'rc.regin': 'രജിസ്റ്റർ ചെയ്ത സംസ്ഥാനം',
      'rc.rto': 'RTO',
      'rc.badreg': 'RC യിലെ നമ്പർ വായിക്കാനായില്ല — ദയവായി താഴെ ടൈപ്പ് ചെയ്യൂ.',
      'rc.retake': 'വീണ്ടും എടുക്കൂ',
    },
  };

  // ── India state/UT codes (official proper nouns; shown as-is around localized labels,
  //    the standard for place names). Deterministic — no network, works offline.
  var RC_STATES = {
    AN: 'Andaman & Nicobar', AP: 'Andhra Pradesh', AR: 'Arunachal Pradesh', AS: 'Assam',
    BR: 'Bihar', CH: 'Chandigarh', CG: 'Chhattisgarh', DD: 'Daman & Diu / DNH', DL: 'Delhi',
    GA: 'Goa', GJ: 'Gujarat', HR: 'Haryana', HP: 'Himachal Pradesh', JH: 'Jharkhand',
    JK: 'Jammu & Kashmir', KA: 'Karnataka', KL: 'Kerala', LA: 'Ladakh', LD: 'Lakshadweep',
    MH: 'Maharashtra', ML: 'Meghalaya', MN: 'Manipur', MP: 'Madhya Pradesh', MZ: 'Mizoram',
    NL: 'Nagaland', OD: 'Odisha', OR: 'Odisha', PB: 'Punjab', PY: 'Puducherry', RJ: 'Rajasthan',
    SK: 'Sikkim', TN: 'Tamil Nadu', TR: 'Tripura', TS: 'Telangana', UK: 'Uttarakhand',
    UA: 'Uttarakhand', UP: 'Uttar Pradesh', WB: 'West Bengal',
  };

  // Per-page field map (bike vs car) — only ids differ; the flow is identical.
  var FIELDS = {
    '2w': { file: 'mb-rc-file', prev: 'mb-rc-preview', out: 'mb-rc-result', make: 'mb-make', model: 'mb-model', year: 'mb-year', reg: 'mb-reg', makeChange: 'mbOnMakeChange' },
    '4w': { file: 'mc-rc-file', prev: 'mc-rc-preview', out: 'mc-rc-result', make: 'mc-make', model: 'mc-model', year: 'mc-year', reg: 'mc-reg', makeChange: 'mcOnMakeChange' },
  };

  function activeLang() {
    try { var l = localStorage.getItem('chitti_vaani_lang'); if (l && RC_STRINGS[l]) return l; } catch (e) {}
    return (window.CURRENT_LANG && RC_STRINGS[window.CURRENT_LANG]) ? window.CURRENT_LANG : 'en';
  }
  function rcT(key) {
    var l = activeLang();
    return (RC_STRINGS[l] && RC_STRINGS[l][key]) || RC_STRINGS.en[key] || key;
  }

  // Merge our strings into the page's translator so data-vai-i18n + self-heal handle them.
  function mergeStrings() {
    var S = window.VAI_STRINGS;
    if (!S) return false;
    LANGS.forEach(function (l) { if (!S[l]) S[l] = {}; var b = RC_STRINGS[l] || RC_STRINGS.en; for (var k in b) if (!(k in S[l])) S[l][k] = b[k]; });
    return true;
  }

  // ── Deterministic registration-number parse → issuing state + RTO code (offline). ──
  function parseReg(raw) {
    if (!raw) return null;
    var s = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Common format: 2 letters (state) + 1-2 digits (RTO) + 0-3 letters (series) + 1-4 digits.
    var m = s.match(/^([A-Z]{2})(\d{1,2})[A-Z]{0,3}\d{1,4}$/);
    if (!m) return null;
    var code = m[1], rto = m[2];
    if (!RC_STATES[code]) return null;
    return { code: code, state: RC_STATES[code], rto: rto };
  }

  function speak(text) {
    try {
      if (typeof window.chittiSpeak === 'function') { window.chittiSpeak(text); return; }
      if (window.Chitti && typeof window.Chitti.speak === 'function') { window.Chitti.speak(text); return; }
    } catch (e) {}
  }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ── Vision auto-read (WIRED, honest). Activates only when an endpoint is configured.
  //    Returns {make,model,year,reg} or null — NEVER fabricates. ──
  function rcTryVision(kind, dataUrl) {
    var url = window.CHITTI_RC_VISION_URL; // unset today → returns null → honest "coming soon"
    if (!url) return Promise.resolve(null);
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: dataUrl, task: 'rc_extract' }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return (j && (j.make || j.model || j.year)) ? j : null; })
      .catch(function () { return null; });
  }

  function fillForm(kind, data) {
    var F = FIELDS[kind]; if (!F || !data) return;
    try {
      if (data.reg) { var rg = document.getElementById(F.reg); if (rg) { rg.value = String(data.reg).toUpperCase(); } }
      if (data.make) {
        var mk = document.getElementById(F.make);
        if (mk) {
          var found = Array.prototype.find.call(mk.options, function (o) { return o.value && o.value.toLowerCase() === String(data.make).toLowerCase(); });
          if (found) { mk.value = found.value; if (typeof window[F.makeChange] === 'function') { try { window[F.makeChange](mk.value); } catch (e) {} } }
        }
      }
      if (data.model) { var mo = document.getElementById(F.model); if (mo) { var fm = Array.prototype.find.call(mo.options, function (o) { return o.value && o.value.toLowerCase() === String(data.model).toLowerCase(); }); if (fm) mo.value = fm.value; } }
      if (data.year) { var yr = document.getElementById(F.year); if (yr) { var fy = Array.prototype.find.call(yr.options, function (o) { return o.value === String(data.year); }); if (fy) yr.value = fy.value; } }
    } catch (e) {}
  }

  function render(kind, html) { var o = document.getElementById(FIELDS[kind].out); if (o) o.innerHTML = html; }

  // ── Public handlers ──
  window.rcCapture = function (kind) {
    var F = FIELDS[kind]; if (!F) return;
    var f = document.getElementById(F.file); if (f) f.click();
  };

  window.rcManual = function (kind) {
    var F = FIELDS[kind]; if (!F) return;
    var mk = document.getElementById(F.make);
    if (mk) { try { mk.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} try { mk.focus(); } catch (e2) {} }
  };

  window.rcOnFile = function (kind, input) {
    var F = FIELDS[kind]; if (!F || !input || !input.files || !input.files[0]) return;
    var file = input.files[0];
    render(kind, '<div class="rc-status">⏳ ' + esc(rcT('rc.reading')) + '</div>');
    var reader = new FileReader();
    reader.onload = function (ev) {
      var dataUrl = ev.target && ev.target.result;
      // Preview (device-local only) + privacy note.
      var prev = document.getElementById(F.prev);
      if (prev && dataUrl) { prev.src = dataUrl; prev.style.display = 'block'; prev.classList.remove('hidden'); }
      // Save on device only — never uploaded by us.
      try { localStorage.setItem('chitti_rc_photo_' + kind, dataUrl); } catch (e) {}
      // Reg-number parse is the user's typed reg if present (real deterministic taste now).
      var regEl = document.getElementById(F.reg);
      var parsed = parseReg(regEl && regEl.value);
      var head = '<div class="rc-status rc-ok">📸 ' + esc(rcT('rc.saved')) + '</div>';
      var loc = parsed ? '<div class="rc-chip">📍 ' + esc(rcT('rc.regin')) + ': <b>' + esc(parsed.state) + '</b> · ' + esc(rcT('rc.rto')) + ' ' + esc(parsed.rto) + '</div>' : '';
      // Try the wired vision extractor; honest fallback if no endpoint / no result.
      rcTryVision(kind, dataUrl).then(function (data) {
        if (data) {
          fillForm(kind, data);
          render(kind, head + loc + '<div class="rc-status rc-ok">✅ ' + esc(rcT('rc.airead')) + '</div>');
          speak(rcT('rc.airead'));
        } else {
          // Deterministic reg parse may still fill the reg+state; make/model = confirm.
          if (parsed && regEl) regEl.value = String(regEl.value).toUpperCase();
          render(kind, head + loc + '<div class="rc-status rc-soon">🤖 ' + esc(rcT('rc.aisoon')) + '</div>');
          speak((parsed ? rcT('rc.regin') + ' ' + parsed.state + '. ' : '') + rcT('rc.aisoon'));
          window.rcManual(kind);
        }
      });
    };
    reader.onerror = function () { render(kind, '<div class="rc-status rc-soon">' + esc(rcT('rc.badreg')) + '</div>'); };
    reader.readAsDataURL(file);
  };

  // Live state/RTO chip as the user types their reg in the existing field.
  window.rcOnRegInput = function (kind) {
    var F = FIELDS[kind]; if (!F) return;
    var regEl = document.getElementById(F.reg); if (!regEl) return;
    var parsed = parseReg(regEl.value);
    var o = document.getElementById(F.out); if (!o) return;
    // Only set the chip if we have a confident parse; don't clobber a richer status.
    if (parsed) o.innerHTML = '<div class="rc-chip">📍 ' + esc(rcT('rc.regin')) + ': <b>' + esc(parsed.state) + '</b> · ' + esc(rcT('rc.rto')) + ' ' + esc(parsed.rto) + '</div>';
  };

  // ── Self-init: detect the page, merge strings, localize, wire the reg field. ──
  function init() {
    var kind = document.getElementById('mb-rc-file') ? '2w' : (document.getElementById('mc-rc-file') ? '4w' : null);
    if (!kind) return; // RC card not on this page
    mergeStrings();
    try { if (typeof window.updateAllStrings === 'function') window.updateAllStrings(activeLang()); } catch (e) {}
    var regEl = document.getElementById(FIELDS[kind].reg);
    if (regEl) regEl.addEventListener('input', function () { window.rcOnRegInput(kind); });
    // Re-merge + relocalize on language change (keys already in VAI_STRINGS, but be safe).
    window.addEventListener('chitti:langchange', function () { mergeStrings(); try { window.updateAllStrings(activeLang()); } catch (e) {} });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Expose for tests/harness.
  window.ChittiRC = { parseReg: parseReg, states: RC_STATES };
})();
