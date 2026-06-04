/* chitti_breakdown_ui.js — Roadside Self-Fix wizard UI (OFFLINE, deterministic).
 * Self-contained IIFE. Renders an in-page overlay 100% from window.ChittiBreakdownKB.
 * No fetch, no network, no LLM. Loaded by chitti_2wheeler.html (2w) + chitti_4wheeler.html (4w).
 * Spec: ROADSIDE_SELF_FIX_SPEC.md. Every static label is a 9-language KB.t({...}) bag so the
 * panel is auto-i18n and re-renders on the `chitti:langchange` window event. §6 terms
 * (SOS, OBD, km, ₹) stay English by contract.
 *
 * Public API: window.ChittiSelfFix.open('2w'|'4w'), .close(), .isOpen(), .renderLaunchCard(elId).
 */
(function () {
  'use strict';

  var STYLE_ID = 'chitti-selffix-style';
  var ROOT_ID = 'chitti-selffix-overlay';

  function KB() { return window.ChittiBreakdownKB || null; }

  // KB.t with a safe local fallback so labels still resolve if the KB is mid-load.
  function t(obj) {
    var kb = KB();
    if (kb && typeof kb.t === 'function') return kb.t(obj);
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    var L = (window.CURRENT_LANG || 'en');
    L = String(L).toLowerCase().split('-')[0];
    return obj[L] || obj.en || '';
  }

  // ── i18n label bags (all 9 langs inline; native script; §6 terms in English) ─────────
  var L = {
    title:    { en: 'Roadside Self-Fix', hi: 'सड़क किनारे खुद ठीक करें', ta: 'சாலையோர சுய-சரிசெய்தல்', te: 'రోడ్డుపై మీరే బాగుచేయండి', bn: 'রাস্তায় নিজেই ঠিক করুন', mr: 'रस्त्यावर स्वतः दुरुस्त करा', gu: 'રસ્તા પર જાતે ઠીક કરો', kn: 'ರಸ್ತೆಬದಿ ಸ್ವತಃ ಸರಿಪಡಿಸಿ', ml: 'റോഡരികിൽ സ്വയം ശരിയാക്കൂ' },
    subtitle: { en: 'Breakdown? Fix it yourself — works with no network.', hi: 'गाड़ी बंद? खुद ठीक करें — बिना नेटवर्क के चलता है।', ta: 'பழுது? நீங்களே சரிசெய்யுங்கள் — இணையம் தேவையில்லை.', te: 'బ్రేక్‌డౌన్? మీరే బాగుచేయండి — నెట్‌వర్క్ అవసరం లేదు.', bn: 'গাড়ি খারাপ? নিজেই ঠিক করুন — নেটওয়ার্ক ছাড়াই চলে।', mr: 'गाडी बंद? स्वतः दुरुस्त करा — नेटवर्कशिवाय चालते.', gu: 'ગાડી બંધ? જાતે ઠીક કરો — નેટવર્ક વગર ચાલે છે.', kn: 'ಕೆಟ್ಟುಹೋಯಿತೆ? ಸ್ವತಃ ಸರಿಪಡಿಸಿ — ನೆಟ್‌ವರ್ಕ್ ಬೇಡ.', ml: 'വണ്ടി കേടായോ? സ്വയം ശരിയാക്കൂ — നെറ്റ്‌വർക്ക് വേണ്ട.' },
    pickProblem: { en: 'What is the problem?', hi: 'क्या समस्या है?', ta: 'என்ன பிரச்சனை?', te: 'సమస్య ఏమిటి?', bn: 'সমস্যা কী?', mr: 'समस्या काय आहे?', gu: 'સમસ્યા શું છે?', kn: 'ಸಮಸ್ಯೆ ಏನು?', ml: 'എന്താണ് പ്രശ്നം?' },
    pickHint: { en: 'Tap the closest match. No internet needed.', hi: 'सबसे मिलती-जुलती चुनें। इंटरनेट की ज़रूरत नहीं।', ta: 'மிக நெருக்கமானதைத் தட்டவும். இணையம் தேவையில்லை.', te: 'దగ్గరగా ఉన్నదాన్ని నొక్కండి. ఇంటర్నెట్ అవసరం లేదు.', bn: 'নিকটতমটি ট্যাপ করুন। ইন্টারনেট লাগবে না।', mr: 'जवळचा पर्याय निवडा. इंटरनेट लागत नाही.', gu: 'નજીકનો વિકલ્પ પસંદ કરો. ઇન્ટરનેટ જરૂરી નથી.', kn: 'ಹತ್ತಿರದ್ದನ್ನು ಒತ್ತಿ. ಇಂಟರ್ನೆಟ್ ಬೇಡ.', ml: 'ഏറ്റവും അടുത്തത് ടാപ്പ് ചെയ്യൂ. ഇന്റർനെറ്റ് വേണ്ട.' },
    causes:   { en: 'Likely causes', hi: 'संभावित कारण', ta: 'சாத்தியமான காரணங்கள்', te: 'సంభావ్య కారణాలు', bn: 'সম্ভাব্য কারণ', mr: 'संभाव्य कारणे', gu: 'સંભવિત કારણો', kn: 'ಸಂಭವನೀಯ ಕಾರಣಗಳು', ml: 'സാധ്യതയുള്ള കാരണങ്ങൾ' },
    causesHint: { en: 'Most likely first. Tap a card to open the fix.', hi: 'सबसे संभावित पहले। ठीक करने के लिए कार्ड खोलें।', ta: 'அதிகம் சாத்தியமானது முதலில். சரிசெய்ய அட்டையைத் தட்டவும்.', te: 'ఎక్కువ సంభావ్యత మొదట. ఫిక్స్ తెరవడానికి కార్డు నొక్కండి.', bn: 'সবচেয়ে সম্ভাব্যটি আগে। সমাধান খুলতে কার্ড ট্যাপ করুন।', mr: 'सर्वाधिक शक्यता आधी. दुरुस्ती उघडण्यासाठी कार्ड टॅप करा.', gu: 'સૌથી સંભવિત પહેલા. ઠીક કરવા કાર્ડ ખોલો.', kn: 'ಹೆಚ್ಚು ಸಂಭವನೀಯವಾದದ್ದು ಮೊದಲು. ಸರಿಪಡಿಸಲು ಕಾರ್ಡ್ ಒತ್ತಿ.', ml: 'ഏറ്റവും സാധ്യതയുള്ളത് ആദ്യം. പരിഹാരം തുറക്കാൻ കാർഡ് ടാപ്പ് ചെയ്യൂ.' },
    check:    { en: 'Check first', hi: 'पहले जाँचें', ta: 'முதலில் சரிபார்க்கவும்', te: 'ముందుగా తనిఖీ చేయండి', bn: 'আগে দেখুন', mr: 'आधी तपासा', gu: 'પહેલા તપાસો', kn: 'ಮೊದಲು ಪರಿಶೀಲಿಸಿ', ml: 'ആദ്യം പരിശോധിക്കൂ' },
    steps:    { en: 'Steps', hi: 'चरण', ta: 'படிகள்', te: 'దశలు', bn: 'ধাপ', mr: 'पायऱ्या', gu: 'પગલાં', kn: 'ಹಂತಗಳು', ml: 'ഘട്ടങ്ങൾ' },
    tools:    { en: 'Tools', hi: 'औज़ार', ta: 'கருவிகள்', te: 'పనిముట్లు', bn: 'যন্ত্রপাতি', mr: 'साधने', gu: 'ઓજારો', kn: 'ಸಾಧನಗಳು', ml: 'ഉപകരണങ്ങൾ' },
    time:     { en: 'Time', hi: 'समय', ta: 'நேரம்', te: 'సమయం', bn: 'সময়', mr: 'वेळ', gu: 'સમય', kn: 'ಸಮಯ', ml: 'സമയം' },
    min:      { en: 'min', hi: 'मिनट', ta: 'நிமிடம்', te: 'నిమి', bn: 'মিনিট', mr: 'मिनिटे', gu: 'મિનિટ', kn: 'ನಿಮಿಷ', ml: 'മിനിറ്റ്' },
    diff:     { en: 'Difficulty', hi: 'कठिनाई', ta: 'கடினம்', te: 'కష్టం', bn: 'কঠিনতা', mr: 'कठीणता', gu: 'મુશ્કેલી', kn: 'ಕಷ್ಟ', ml: 'ബുദ്ധിമുട്ട്' },
    ifFails:  { en: "If this doesn't work", hi: 'अगर यह काम न करे', ta: 'இது வேலை செய்யாவிட்டால்', te: 'ఇది పనిచేయకపోతే', bn: 'এটি কাজ না করলে', mr: 'हे काम न झाल्यास', gu: 'આ કામ ન કરે તો', kn: 'ಇದು ಕೆಲಸ ಮಾಡದಿದ್ದರೆ', ml: 'ഇത് ഫലിച്ചില്ലെങ്കിൽ' },
    fairPrice:{ en: 'Fair shop price', hi: 'दुकान का सही दाम', ta: 'நியாயமான கடை விலை', te: 'న్యాయమైన షాపు ధర', bn: 'দোকানের ন্যায্য দাম', mr: 'दुकानाची योग्य किंमत', gu: 'દુકાનનો વાજબી ભાવ', kn: 'ಅಂಗಡಿಯ ನ್ಯಾಯ ಬೆಲೆ', ml: 'കടയിലെ ന്യായവില' },
    readAloud:{ en: 'Read this fix aloud', hi: 'यह तरीका ज़ोर से पढ़ें', ta: 'இந்தச் சரிசெய்தலை உரக்கப் படிக்கவும்', te: 'ఈ ఫిక్స్‌ను బిగ్గరగా చదవండి', bn: 'এই সমাধানটি জোরে পড়ুন', mr: 'ही दुरुस्ती मोठ्याने वाचा', gu: 'આ રીત મોટેથી વાંચો', kn: 'ಈ ಪರಿಹಾರವನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ', ml: 'ഈ പരിഹാരം ഉറക്കെ വായിക്കൂ' },
    speakStep:{ en: 'Speak this step', hi: 'यह चरण बोलें', ta: 'இந்தப் படியைச் சொல்லவும்', te: 'ఈ దశను చదవండి', bn: 'এই ধাপটি বলুন', mr: 'ही पायरी बोला', gu: 'આ પગલું બોલો', kn: 'ಈ ಹಂತವನ್ನು ಹೇಳಿ', ml: 'ഈ ഘട്ടം പറയൂ' },
    sos:      { en: 'SOS family', hi: 'परिवार को SOS', ta: 'குடும்பத்திற்கு SOS', te: 'కుటుంబానికి SOS', bn: 'পরিবারকে SOS', mr: 'कुटुंबाला SOS', gu: 'પરિવારને SOS', kn: 'ಕುಟುಂಬಕ್ಕೆ SOS', ml: 'കുടുംബത്തിന് SOS' },
    tow:      { en: 'Tow / get help', hi: 'टो / मदद लें', ta: 'இழுத்துச் செல் / உதவி', te: 'టో / సహాయం', bn: 'টো / সাহায্য নিন', mr: 'टो / मदत घ्या', gu: 'ટો / મદદ લો', kn: 'ಟೋ / ಸಹಾಯ ಪಡೆಯಿರಿ', ml: 'ടോ / സഹായം തേടൂ' },
    back:     { en: 'Back', hi: 'पीछे', ta: 'பின்னால்', te: 'వెనుకకు', bn: 'পিছনে', mr: 'मागे', gu: 'પાછળ', kn: 'ಹಿಂದೆ', ml: 'പിന്നോട്ട്' },
    close:    { en: 'Close', hi: 'बंद करें', ta: 'மூடு', te: 'మూసివేయి', bn: 'বন্ধ করুন', mr: 'बंद करा', gu: 'બંધ કરો', kn: 'ಮುಚ್ಚಿ', ml: 'അടയ്ക്കൂ' },
    tierGreen:{ en: 'DIY now', hi: 'खुद करें', ta: 'நீங்களே செய்க', te: 'మీరే చేయండి', bn: 'নিজে করুন', mr: 'स्वतः करा', gu: 'જાતે કરો', kn: 'ಸ್ವತಃ ಮಾಡಿ', ml: 'സ്വയം ചെയ്യൂ' },
    tierAmber:{ en: 'DIY with care', hi: 'सावधानी से करें', ta: 'கவனமாகச் செய்க', te: 'జాగ్రత్తగా చేయండి', bn: 'সাবধানে করুন', mr: 'काळजीपूर्वक करा', gu: 'સાવધાનીથી કરો', kn: 'ಎಚ್ಚರಿಕೆಯಿಂದ ಮಾಡಿ', ml: 'ശ്രദ്ധയോടെ ചെയ്യൂ' },
    tierRed:  { en: "Don't attempt", hi: 'कोशिश न करें', ta: 'முயற்சிக்க வேண்டாம்', te: 'ప్రయత్నించవద్దు', bn: 'চেষ্টা করবেন না', mr: 'प्रयत्न करू नका', gu: 'પ્રયાસ ન કરો', kn: 'ಪ್ರಯತ್ನಿಸಬೇಡಿ', ml: 'ശ്രമിക്കരുത്' },
    likelihood:{ en: 'chance', hi: 'संभावना', ta: 'வாய்ப்பு', te: 'అవకాశం', bn: 'সম্ভাবনা', mr: 'शक्यता', gu: 'શક્યતા', kn: 'ಸಾಧ್ಯತೆ', ml: 'സാധ്യത' },
    danger:   { en: 'Danger — do not attempt this yourself', hi: 'खतरा — इसे खुद ठीक न करें', ta: 'ஆபத்து — இதை நீங்களே செய்ய வேண்டாம்', te: 'ప్రమాదం — దీన్ని మీరే చేయవద్దు', bn: 'বিপদ — এটি নিজে করবেন না', mr: 'धोका — हे स्वतः करू नका', gu: 'ભય — આ જાતે ન કરો', kn: 'ಅಪಾಯ — ಇದನ್ನು ಸ್ವತಃ ಮಾಡಬೇಡಿ', ml: 'അപകടം — ഇത് സ്വയം ചെയ്യരുത്' }
  };

  // ── scoped CSS ────────────────────────────────────────────────────────────
  function palette(prop, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var saffron = palette('--sds-saffron', '#FF9933');
    var navy = palette('--sds-navy', '#000080');
    var green = palette('--sds-green', '#138808');
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = [
      '#' + ROOT_ID + '{position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.55);display:none;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:inherit}',
      '#' + ROOT_ID + '.open{display:block}',
      '.csf-panel{max-width:560px;margin:0 auto;min-height:100%;background:#fff;box-shadow:0 0 32px rgba(0,0,0,.4);display:flex;flex-direction:column}',
      '.csf-head{position:sticky;top:0;z-index:2;background:' + navy + ';color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px}',
      '.csf-head .csf-ttl{flex:1;min-width:0}',
      '.csf-head .csf-ttl b{display:block;font-size:17px;line-height:1.25}',
      '.csf-head .csf-ttl small{display:block;font-size:12px;opacity:.9;font-weight:400;margin-top:2px}',
      '.csf-iconbtn{min-width:48px;min-height:48px;border:0;border-radius:12px;background:rgba(255,255,255,.16);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0 12px;font-weight:600}',
      '.csf-iconbtn:active{transform:scale(.96)}',
      '.csf-iconbtn .lbl{font-size:13px;margin-left:6px}',
      '.csf-body{padding:14px;flex:1}',
      '.csf-sec-h{font-size:18px;font-weight:800;color:' + navy + ';margin:0 0 2px}',
      '.csf-sec-s{font-size:13px;color:#555;margin:0 0 12px}',
      '.csf-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}',
      '.csf-tile{min-height:120px;border:2px solid #eee;border-radius:16px;background:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:14px 10px;text-align:center;font:inherit}',
      '.csf-tile:active{transform:scale(.97)}',
      '.csf-tile .ti{font-size:40px;line-height:1}',
      '.csf-tile .tn{font-size:14px;font-weight:700;color:#222;line-height:1.25}',
      '.csf-tile.red{border-color:' + saffron + ';background:#fff6ee}',
      '.csf-tile.red .tn{color:#b00020}',
      '.csf-diag-name{font-size:20px;font-weight:800;color:' + navy + ';margin:0 0 12px;display:flex;align-items:center;gap:10px}',
      '.csf-diag-name .di{font-size:30px}',
      '.csf-redbanner{border:3px solid #b00020;background:#fff0f0;border-radius:16px;padding:14px;margin-bottom:14px}',
      '.csf-redbanner .rb-t{font-size:17px;font-weight:800;color:#b00020;margin-bottom:8px;display:flex;align-items:center;gap:8px}',
      '.csf-redbanner .rb-w{font-size:15px;color:#3a0000;line-height:1.45;margin-bottom:8px}',
      '.csf-redbanner .rb-tow{font-size:14px;color:#444;line-height:1.45;margin-bottom:12px}',
      '.csf-amber{border-left:5px solid ' + saffron + ';background:#fff8ef;border-radius:10px;padding:11px 12px;font-size:14px;color:#5a3a00;line-height:1.45;margin-bottom:14px}',
      '.csf-cause{border:2px solid #eee;border-radius:14px;margin-bottom:12px;overflow:hidden;background:#fff}',
      '.csf-cause-h{display:flex;align-items:center;gap:10px;padding:13px 12px;cursor:pointer;min-height:48px;background:#fafafa;font:inherit;width:100%;border:0;text-align:left}',
      '.csf-cause-h:active{background:#f0f0f0}',
      '.csf-cause-n{flex:1;min-width:0}',
      '.csf-cause-n .cn{font-size:15px;font-weight:700;color:#222;line-height:1.3}',
      '.csf-cause-n .cmeta{font-size:12px;color:#666;margin-top:3px}',
      '.csf-tier{font-size:11px;font-weight:700;padding:4px 8px;border-radius:999px;white-space:nowrap;line-height:1.1}',
      '.csf-tier.green{background:#e6f5e6;color:' + green + '}',
      '.csf-tier.amber{background:#fff1dd;color:#9a5b00}',
      '.csf-tier.red{background:#ffe3e3;color:#b00020}',
      '.csf-caret{font-size:14px;color:#999;transition:transform .15s}',
      '.csf-cause.open .csf-caret{transform:rotate(90deg)}',
      '.csf-cause-body{display:none;padding:0 12px 14px;border-top:1px solid #eee}',
      '.csf-cause.open .csf-cause-body{display:block}',
      '.csf-block-h{font-size:13px;font-weight:800;color:' + navy + ';text-transform:uppercase;letter-spacing:.4px;margin:14px 0 6px}',
      '.csf-check{font-size:15px;color:#222;line-height:1.45;background:#f4f7ff;border-radius:10px;padding:10px 12px}',
      '.csf-step{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px dashed #eee}',
      '.csf-step:last-child{border-bottom:0}',
      '.csf-step .sn{flex:0 0 28px;height:28px;border-radius:50%;background:' + navy + ';color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}',
      '.csf-step .stext{flex:1;font-size:15px;line-height:1.45;color:#222}',
      '.csf-step .sspk{flex:0 0 auto;min-width:44px;min-height:44px;border:0;background:#eef;border-radius:10px;font-size:16px;cursor:pointer}',
      '.csf-metarow{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}',
      '.csf-chip{font-size:12px;background:#f2f2f2;border-radius:8px;padding:6px 9px;color:#333;line-height:1.3}',
      '.csf-chip b{color:#111}',
      '.csf-iffails{font-size:13px;color:#7a3a00;background:#fff8ef;border-radius:10px;padding:9px 11px;line-height:1.4;margin-top:10px}',
      '.csf-cost{font-size:13px;color:' + green + ';font-weight:700;margin-top:10px}',
      '.csf-readbtn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;border:0;border-radius:14px;background:' + green + ';color:#fff;font-size:16px;font-weight:700;cursor:pointer;margin-top:14px}',
      '.csf-readbtn:active{transform:scale(.98)}',
      '.csf-sosbtn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;border:0;border-radius:14px;background:#b00020;color:#fff;font-size:17px;font-weight:800;cursor:pointer;margin-top:6px}',
      '.csf-sosbtn:active{transform:scale(.98)}',
      '.csf-back{margin-top:10px}',
      '@media(max-width:360px){.csf-grid{grid-template-columns:1fr}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  // ── voice ─────────────────────────────────────────────────────────────────
  function speak(text) {
    if (!text) return;
    try {
      if (typeof window.speakText === 'function') { window.speakText(text, window.CURRENT_LANG); return; }
      if (window.Chitti && window.Chitti.a11y && typeof window.Chitti.a11y.speak === 'function') { window.Chitti.a11y.speak(text); return; }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = window.CURRENT_LANG || 'en';
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  }
  function triggerSOS() {
    try {
      if (typeof window.mbSOS === 'function') return window.mbSOS();
      if (typeof window.mcSOS === 'function') return window.mcSOS();
    } catch (e) {}
    speak(t(L.sos));
  }

  // ── state ─────────────────────────────────────────────────────────────────
  var state = { open: false, vehicle: '2w', screen: 'grid', scenarioId: null };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function scenarios() { var kb = KB(); return kb ? kb.forVehicle(state.vehicle) : []; }
  function currentScenario() { return scenarios().filter(function (s) { return s.id === state.scenarioId; })[0] || null; }

  function tierLabel(tier) { return tier === 'red' ? t(L.tierRed) : (tier === 'amber' ? t(L.tierAmber) : t(L.tierGreen)); }
  function tierIcon(tier) { return tier === 'red' ? '🔴' : (tier === 'amber' ? '🟡' : '🟢'); }

  // ── render: grid ──────────────────────────────────────────────────────────
  function renderGrid() {
    var sc = scenarios();
    var tiles = sc.map(function (s) {
      var redCls = s.safety && s.safety.red ? ' red' : '';
      return '<button class="csf-tile' + redCls + '" data-sid="' + esc(s.id) + '" aria-label="' + esc(t(s.name)) + '">' +
        '<span class="ti">' + esc(s.icon || '🛠️') + '</span>' +
        '<span class="tn">' + esc(t(s.name)) + '</span></button>';
    }).join('');
    return '<div class="csf-body">' +
      '<h2 class="csf-sec-h">' + esc(t(L.pickProblem)) + '</h2>' +
      '<p class="csf-sec-s">' + esc(t(L.pickHint)) + '</p>' +
      '<div class="csf-grid">' + tiles + '</div></div>';
  }

  // ── render: diagnosis ─────────────────────────────────────────────────────
  function renderDiagnosis() {
    var s = currentScenario();
    if (!s) return renderGrid();
    var html = '<div class="csf-body">' +
      '<div class="csf-diag-name"><span class="di">' + esc(s.icon || '🛠️') + '</span><span>' + esc(t(s.name)) + '</span></div>';

    if (s.safety && s.safety.red) {
      // RED scenario — banner + tow only, NO diy steps.
      html += '<div class="csf-redbanner">' +
        '<div class="rb-t">⛔ ' + esc(t(L.danger)) + '</div>' +
        '<div class="rb-w">' + esc(t(s.safety.warn)) + '</div>' +
        '<div class="rb-tow">' + esc(t(s.towMsg)) + '</div>' +
        '<button class="csf-sosbtn" data-act="sos">🆘 ' + esc(t(L.sos)) + '</button>' +
        '</div>';
      html += '</div>';
      return html;
    }

    // Non-red: amber safety note + expandable causes.
    if (s.safety && s.safety.warn) {
      html += '<div class="csf-amber">⚠️ ' + esc(t(s.safety.warn)) + '</div>';
    }
    html += '<h3 class="csf-sec-h" style="font-size:16px">' + esc(t(L.causes)) + '</h3>' +
      '<p class="csf-sec-s">' + esc(t(L.causesHint)) + '</p>';

    (s.causes || []).forEach(function (c, idx) {
      var tier = c.tier || 'green';
      html += '<div class="csf-cause" data-cidx="' + idx + '">' +
        '<button class="csf-cause-h" data-act="toggle" data-cidx="' + idx + '" aria-expanded="false">' +
          '<span class="csf-cause-n"><span class="cn">' + esc(t(c.name)) + '</span>' +
            '<span class="cmeta">' + esc(String(c.pct)) + '% ' + esc(t(L.likelihood)) + '</span></span>' +
          '<span class="csf-tier ' + tier + '">' + tierIcon(tier) + ' ' + esc(tierLabel(tier)) + '</span>' +
          '<span class="csf-caret">▶</span>' +
        '</button>' +
        '<div class="csf-cause-body">' + renderCauseBody(c, idx) + '</div>' +
      '</div>';
    });

    // tow exit
    if (s.towMsg) {
      html += '<div class="csf-iffails" style="margin-top:14px"><b>' + esc(t(L.tow)) + ':</b> ' + esc(t(s.towMsg)) + '</div>';
      html += '<button class="csf-sosbtn" data-act="sos">🆘 ' + esc(t(L.sos)) + '</button>';
    }
    html += '</div>';
    return html;
  }

  function renderCauseBody(c, idx) {
    var h = '';
    if (c.check) {
      h += '<div class="csf-block-h">' + esc(t(L.check)) + '</div>' +
        '<div class="csf-check">' + esc(t(c.check)) + '</div>';
    }
    var steps = c.steps || [];
    if (steps.length) {
      h += '<div class="csf-block-h">' + esc(t(L.steps)) + '</div>';
      steps.forEach(function (st, i) {
        var txt = t(st);
        h += '<div class="csf-step"><span class="sn">' + (i + 1) + '</span>' +
          '<span class="stext">' + esc(txt) + '</span>' +
          '<button class="sspk" data-act="speakstep" data-cidx="' + idx + '" data-sidx="' + i + '" aria-label="' + esc(t(L.speakStep)) + '">🔊</button></div>';
      });
    }
    // meta chips
    var chips = [];
    if (c.tools) chips.push('<span class="csf-chip"><b>' + esc(t(L.tools)) + ':</b> ' + esc(t(c.tools)) + '</span>');
    if (c.timeMin != null) chips.push('<span class="csf-chip"><b>' + esc(t(L.time)) + ':</b> ' + esc(String(c.timeMin)) + ' ' + esc(t(L.min)) + '</span>');
    if (c.diff != null) chips.push('<span class="csf-chip"><b>' + esc(t(L.diff)) + ':</b> ' + esc(String(c.diff)) + '/10</span>');
    if (chips.length) h += '<div class="csf-metarow">' + chips.join('') + '</div>';

    if (c.ifFails && t(c.ifFails)) h += '<div class="csf-iffails"><b>' + esc(t(L.ifFails)) + ':</b> ' + esc(t(c.ifFails)) + '</div>';
    if (c.mechCost) h += '<div class="csf-cost">💰 ' + esc(t(L.fairPrice)) + ': ' + esc(c.mechCost) + '</div>';

    if (steps.length) {
      h += '<button class="csf-readbtn" data-act="readall" data-cidx="' + idx + '">🔊 ' + esc(t(L.readAloud)) + '</button>';
    }
    return h;
  }

  // ── header (Back appears only on diagnosis) ───────────────────────────────
  function renderHead() {
    var backBtn = state.screen === 'diag'
      ? '<button class="csf-iconbtn" data-act="back" aria-label="' + esc(t(L.back)) + '">← <span class="lbl">' + esc(t(L.back)) + '</span></button>'
      : '';
    return '<div class="csf-head">' + backBtn +
      '<div class="csf-ttl"><b>🆘 ' + esc(t(L.title)) + '</b><small>' + esc(t(L.subtitle)) + '</small></div>' +
      '<button class="csf-iconbtn" data-act="close" aria-label="' + esc(t(L.close)) + '">✕ <span class="lbl">' + esc(t(L.close)) + '</span></button>' +
      '</div>';
  }

  function render() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    var body = state.screen === 'diag' ? renderDiagnosis() : renderGrid();
    root.innerHTML = '<div class="csf-panel" role="dialog" aria-modal="true" aria-label="' + esc(t(L.title)) + '">' +
      renderHead() + body + '</div>';
    root.scrollTop = 0;
  }

  // ── event delegation ──────────────────────────────────────────────────────
  function onClick(e) {
    var tile = e.target.closest && e.target.closest('.csf-tile');
    if (tile && tile.getAttribute('data-sid')) {
      state.scenarioId = tile.getAttribute('data-sid');
      state.screen = 'diag';
      render();
      // auto-read the safety note aloud for the diagnosis (voice-first)
      var s = currentScenario();
      if (s && s.safety && s.safety.warn) speak(t(s.safety.warn));
      return;
    }
    var act = e.target.closest && e.target.closest('[data-act]');
    if (!act) return;
    var a = act.getAttribute('data-act');
    if (a === 'close') { close(); return; }
    if (a === 'back') { state.screen = 'grid'; state.scenarioId = null; render(); return; }
    if (a === 'sos') { triggerSOS(); return; }
    if (a === 'toggle') {
      var card = act.closest('.csf-cause');
      if (card) {
        var willOpen = !card.classList.contains('open');
        card.classList.toggle('open');
        act.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      }
      return;
    }
    if (a === 'speakstep') {
      var s2 = currentScenario(); if (!s2) return;
      var c = (s2.causes || [])[+act.getAttribute('data-cidx')];
      var step = c && (c.steps || [])[+act.getAttribute('data-sidx')];
      if (step) speak(t(step));
      return;
    }
    if (a === 'readall') {
      var s3 = currentScenario(); if (!s3) return;
      var c3 = (s3.causes || [])[+act.getAttribute('data-cidx')];
      if (!c3) return;
      var parts = [];
      if (c3.check) parts.push(t(c3.check));
      (c3.steps || []).forEach(function (st) { parts.push(t(st)); });
      if (c3.ifFails && t(c3.ifFails)) parts.push(t(L.ifFails) + '. ' + t(c3.ifFails));
      speak(parts.join('. '));
      return;
    }
  }

  // ── open / close ──────────────────────────────────────────────────────────
  function ensureRoot() {
    var root = document.getElementById(ROOT_ID);
    if (root) return root;
    injectStyle();
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.addEventListener('click', onClick);
    // tap on dim backdrop (outside the panel) closes
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    document.body.appendChild(root);
    return root;
  }

  function open(vehicle) {
    state.vehicle = (vehicle === '4w' || vehicle === 'car') ? '4w' : '2w';
    state.screen = 'grid';
    state.scenarioId = null;
    state.open = true;
    var root = ensureRoot();
    render();
    root.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
  }

  function close() {
    state.open = false;
    var root = document.getElementById(ROOT_ID);
    if (root) root.classList.remove('open');
    document.documentElement.style.overflow = '';
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  }

  // ── launch card (rendered on the HOME tab; auto-i18n) ─────────────────────
  function renderLaunchCard(elId) {
    var el = document.getElementById(elId);
    if (!el) return;
    var v = el.getAttribute('data-csf-vehicle') === '4w' ? '4w' : '2w';
    el.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<span style="font-size:38px;line-height:1">🆘</span>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:17px;font-weight:800;color:#000080;line-height:1.25">' + esc(t(L.title)) + '</div>' +
          '<div style="font-size:13px;color:#555;margin-top:3px;line-height:1.35">' + esc(t(L.subtitle)) + '</div>' +
        '</div>' +
        '<span style="font-size:22px;color:#999">›</span>' +
      '</div>';
    if (!el.__csfWired) {
      el.__csfWired = true;
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (ev) {
        if (ev.target.closest && ev.target.closest('.chitti-fb-bar, .chitti-fb-wrap, [data-chitti-fb]')) return;
        open(v);
      });
    }
  }

  function renderAllLaunchCards() {
    var nodes = document.querySelectorAll('[data-csf-launch]');
    for (var i = 0; i < nodes.length; i++) renderLaunchCard(nodes[i].id);
  }

  // re-render open panel + launch cards on language change
  window.addEventListener('chitti:langchange', function () {
    renderAllLaunchCards();
    if (state.open) render();
  });
  // initial paint of any launch cards once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAllLaunchCards);
  } else {
    renderAllLaunchCards();
  }

  window.ChittiSelfFix = {
    open: open,
    close: close,
    isOpen: function () { return state.open; },
    renderLaunchCard: renderLaunchCard,
    renderAllLaunchCards: renderAllLaunchCards
  };
})();
