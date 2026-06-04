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
    danger:   { en: 'Danger — do not attempt this yourself', hi: 'खतरा — इसे खुद ठीक न करें', ta: 'ஆபத்து — இதை நீங்களே செய்ய வேண்டாம்', te: 'ప్రమాదం — దీన్ని మీరే చేయవద్దు', bn: 'বিপদ — এটি নিজে করবেন না', mr: 'धोका — हे स्वतः करू नका', gu: 'ભય — આ જાતે ન કરો', kn: 'ಅಪಾಯ — ಇದನ್ನು ಸ್ವತಃ ಮಾಡಬೇಡಿ', ml: 'അപകടം — ഇത് സ്വയം ചെയ്യരുത്' },

    // ── new labels (features 1–7) ───────────────────────────────────────────
    triage:   { en: 'Check these first', hi: 'पहले ये जाँचें', ta: 'முதலில் இவற்றைச் சரிபார்க்கவும்', te: 'ముందుగా వీటిని తనిఖీ చేయండి', bn: 'আগে এগুলো দেখুন', mr: 'आधी हे तपासा', gu: 'પહેલા આ તપાસો', kn: 'ಮೊದಲು ಇವುಗಳನ್ನು ಪರಿಶೀಲಿಸಿ', ml: 'ആദ്യം ഇവ പരിശോധിക്കൂ' },
    lessLikely: { en: 'less likely for your', hi: 'आपकी के लिए कम संभावना', ta: 'உங்கள் வாகனத்திற்கு குறைவான வாய்ப்பு', te: 'మీ వాహనానికి తక్కువ అవకాశం', bn: 'আপনার জন্য কম সম্ভাবনা', mr: 'तुमच्यासाठी कमी शक्यता', gu: 'તમારા માટે ઓછી શક્યતા', kn: 'ನಿಮ್ಮದಕ್ಕೆ ಕಡಿಮೆ ಸಾಧ್ಯತೆ', ml: 'നിങ്ങളുടേതിന് സാധ്യത കുറവ്' },
    vehBike:  { en: 'bike', hi: 'बाइक', ta: 'பைக்', te: 'బైక్', bn: 'বাইক', mr: 'बाईक', gu: 'બાઇક', kn: 'ಬೈಕ್', ml: 'ബൈക്ക്' },
    vehCar:   { en: 'car', hi: 'कार', ta: 'கார்', te: 'కారు', bn: 'গাড়ি', mr: 'कार', gu: 'કાર', kn: 'ಕಾರು', ml: 'കാർ' },

    // disclaimer gate
    disclTitle: { en: 'Before you start — please read', hi: 'शुरू करने से पहले — ज़रूर पढ़ें', ta: 'தொடங்கும் முன் — தயவுசெய்து படியுங்கள்', te: 'ప్రారంభించే ముందు — దయచేసి చదవండి', bn: 'শুরু করার আগে — অনুগ্রহ করে পড়ুন', mr: 'सुरू करण्यापूर्वी — कृपया वाचा', gu: 'શરૂ કરતા પહેલા — કૃપા કરી વાંચો', kn: 'ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು — ದಯವಿಟ್ಟು ಓದಿ', ml: 'തുടങ്ങുന്നതിന് മുമ്പ് — ദയവായി വായിക്കൂ' },
    disclOk:  { en: 'I understand', hi: 'मैं समझ गया', ta: 'எனக்குப் புரிந்தது', te: 'నాకు అర్థమైంది', bn: 'আমি বুঝেছি', mr: 'मला समजले', gu: 'હું સમજી ગયો', kn: 'ನನಗೆ ಅರ್ಥವಾಯಿತು', ml: 'എനിക്ക് മനസ്സിലായി' },

    // safety drill strip
    safetyTitle: { en: 'Safety first', hi: 'पहले सुरक्षा', ta: 'முதலில் பாதுகாப்பு', te: 'మొదట భద్రత', bn: 'আগে নিরাপত্তা', mr: 'आधी सुरक्षा', gu: 'પહેલા સલામતી', kn: 'ಮೊದಲು ಸುರಕ್ಷತೆ', ml: 'ആദ്യം സുരക്ഷ' },
    safety1:  { en: 'Move fully off the road; turn hazard lights ON.', hi: 'गाड़ी पूरी सड़क से हटाएँ; हज़ार्ड लाइट ON करें।', ta: 'வாகனத்தை சாலையிலிருந்து முழுவதும் விலக்குங்கள்; ஹேசர்ட் விளக்குகளை ON செய்யுங்கள்.', te: 'వాహనాన్ని రోడ్డు నుండి పూర్తిగా పక్కకు తీయండి; హజార్డ్ లైట్లు ON చేయండి.', bn: 'গাড়ি পুরোপুরি রাস্তা থেকে সরান; হ্যাজার্ড লাইট ON করুন।', mr: 'गाडी पूर्णपणे रस्त्याबाहेर घ्या; हॅझार्ड लाइट ON करा.', gu: 'વાહન સંપૂર્ણ રસ્તાથી દૂર કરો; હેઝાર્ડ લાઇટ ON કરો.', kn: 'ವಾಹನವನ್ನು ರಸ್ತೆಯಿಂದ ಪೂರ್ತಿ ಪಕ್ಕಕ್ಕೆ ತೆಗೆಯಿರಿ; ಹಜಾರ್ಡ್ ಲೈಟ್ ON ಮಾಡಿ.', ml: 'വാഹനം പൂർണമായി റോഡിൽ നിന്ന് മാറ്റുക; ഹസാർഡ് ലൈറ്റ് ON ആക്കുക.' },
    safety2:  { en: 'At night: stand BEHIND the barrier, never on the road.', hi: 'रात में: बैरियर के पीछे खड़े हों, सड़क पर कभी नहीं।', ta: 'இரவில்: தடுப்புக்கு பின்னால் நிற்கவும், சாலையில் ஒருபோதும் வேண்டாம்.', te: 'రాత్రి: బారియర్ వెనుక నిలబడండి, రోడ్డుపై ఎప్పుడూ వద్దు.', bn: 'রাতে: ব্যারিয়ারের পিছনে দাঁড়ান, কখনও রাস্তায় নয়।', mr: 'रात्री: बॅरियरच्या मागे उभे राहा, रस्त्यावर कधीही नको.', gu: 'રાત્રે: બેરિયરની પાછળ ઊભા રહો, રસ્તા પર ક્યારેય નહીં.', kn: 'ರಾತ್ರಿ: ಬ್ಯಾರಿಯರ್ ಹಿಂದೆ ನಿಲ್ಲಿ, ರಸ್ತೆ ಮೇಲೆ ಎಂದಿಗೂ ಬೇಡ.', ml: 'രാത്രി: ബാരിയറിന് പിന്നിൽ നിൽക്കുക, ഒരിക്കലും റോഡിൽ വേണ്ട.' },
    safety3:  { en: 'Place a reflective triangle ~15 m behind (car) / wave traffic (bike).', hi: 'पीछे ~15 m पर रिफ्लेक्टिव त्रिकोण रखें (कार) / ट्रैफ़िक को हाथ से रोकें (बाइक)।', ta: '~15 m பின்னால் பிரதிபலிப்பு முக்கோணம் வைக்கவும் (கார்) / போக்குவரத்தை கையால் காட்டவும் (பைக்).', te: 'వెనుక ~15 m దూరంలో రిఫ్లెక్టివ్ త్రిభుజం ఉంచండి (కారు) / ట్రాఫిక్‌ను చేతితో సూచించండి (బైక్).', bn: 'পিছনে ~15 m দূরে রিফ্লেক্টিভ ত্রিভুজ রাখুন (গাড়ি) / হাত নেড়ে ট্রাফিক সতর্ক করুন (বাইক)।', mr: 'मागे ~15 m अंतरावर रिफ्लेक्टिव्ह त्रिकोण ठेवा (कार) / हाताने वाहतूक थांबवा (बाईक).', gu: 'પાછળ ~15 m દૂર રિફ્લેક્ટિવ ત્રિકોણ મૂકો (કાર) / હાથથી ટ્રાફિક રોકો (બાઇક).', kn: 'ಹಿಂದೆ ~15 m ದೂರದಲ್ಲಿ ರಿಫ್ಲೆಕ್ಟಿವ್ ತ್ರಿಕೋನ ಇಡಿ (ಕಾರು) / ಕೈಯಿಂದ ಸಂಚಾರ ಎಚ್ಚರಿಸಿ (ಬೈಕ್).', ml: 'പിന്നിൽ ~15 m അകലെ റിഫ്ലെക്ടീവ് ത്രികോണം വയ്ക്കുക (കാർ) / കൈ വീശി ഗതാഗതം നിയന്ത്രിക്കുക (ബൈക്ക്).' },

    // find help nearby
    findHelp: { en: "Couldn't fix it? Find help nearby", hi: 'ठीक नहीं हुआ? पास में मदद ढूँढें', ta: 'சரிசெய்ய முடியவில்லையா? அருகில் உதவி தேடுங்கள்', te: 'బాగుచేయలేకపోయారా? దగ్గర్లో సహాయం వెతకండి', bn: 'ঠিক হলো না? কাছে সাহায্য খুঁজুন', mr: 'दुरुस्त झाले नाही? जवळ मदत शोधा', gu: 'ઠીક ન થયું? નજીકમાં મદદ શોધો', kn: 'ಸರಿಯಾಗಲಿಲ್ಲವೇ? ಹತ್ತಿರ ಸಹಾಯ ಹುಡುಕಿ', ml: 'ശരിയാക്കാനായില്ലേ? അടുത്ത് സഹായം കണ്ടെത്തൂ' },
    helpTitle: { en: 'Find help nearby', hi: 'पास में मदद ढूँढें', ta: 'அருகில் உதவி தேடுங்கள்', te: 'దగ్గర్లో సహాయం వెతకండి', bn: 'কাছে সাহায্য খুঁজুন', mr: 'जवळ मदत शोधा', gu: 'નજીકમાં મદદ શોધો', kn: 'ಹತ್ತಿರ ಸಹಾಯ ಹುಡುಕಿ', ml: 'അടുത്ത് സഹായം കണ്ടെത്തൂ' },
    helpPump: { en: 'Petrol pump', hi: 'पेट्रोल पंप', ta: 'பெட்ரோல் பங்க்', te: 'పెట్రోల్ పంప్', bn: 'পেট্রোল পাম্প', mr: 'पेट्रोल पंप', gu: 'પેટ્રોલ પંપ', kn: 'ಪೆಟ್ರೋಲ್ ಪಂಪ್', ml: 'പെട്രോൾ പമ്പ്' },
    helpPuncture: { en: 'Puncture shop', hi: 'पंक्चर की दुकान', ta: 'பஞ்சர் கடை', te: 'పంక్చర్ షాపు', bn: 'পাংচার দোকান', mr: 'पंक्चर दुकान', gu: 'પંક્ચર દુકાન', kn: 'ಪಂಕ್ಚರ್ ಅಂಗಡಿ', ml: 'പഞ്ചർ കട' },
    helpMech: { en: 'Mechanic', hi: 'मैकेनिक', ta: 'மெக்கானிக்', te: 'మెకానిక్', bn: 'মেকানিক', mr: 'मेकॅनिक', gu: 'મેકેનિક', kn: 'ಮೆಕ್ಯಾನಿಕ್', ml: 'മെക്കാനിക്' },
    helpHospital: { en: 'Hospital', hi: 'अस्पताल', ta: 'மருத்துவமனை', te: 'ఆసుపత్రి', bn: 'হাসপাতাল', mr: 'रुग्णालय', gu: 'હોસ્પિટલ', kn: 'ಆಸ್ಪತ್ರೆ', ml: 'ആശുപത്രി' },
    rsaReminder: { en: 'Many cars / 2-wheelers have FREE roadside assistance through your insurance — check your policy or call the insurer.', hi: 'कई कार / 2-व्हीलर पर बीमे के साथ मुफ़्त रोडसाइड सहायता मिलती है — अपनी पॉलिसी देखें या बीमा कंपनी को कॉल करें।', ta: 'பல கார் / இருசக்கர வாகனங்களுக்கு உங்கள் காப்பீட்டின் மூலம் இலவச சாலையோர உதவி உண்டு — உங்கள் பாலிசியைப் பாருங்கள் அல்லது காப்பீட்டாளரை அழைக்கவும்.', te: 'చాలా కార్లు / 2-వీలర్లకు మీ బీమా ద్వారా ఉచిత రోడ్‌సైడ్ సహాయం ఉంటుంది — మీ పాలసీ చూడండి లేదా బీమా సంస్థకు కాల్ చేయండి.', bn: 'অনেক গাড়ি / 2-হুইলারে আপনার বীমার মাধ্যমে বিনামূল্যে রোডসাইড সহায়তা থাকে — আপনার পলিসি দেখুন বা বীমাকারীকে কল করুন।', mr: 'अनेक कार / 2-व्हीलरला तुमच्या विम्यासोबत मोफत रोडसाइड मदत मिळते — तुमची पॉलिसी पाहा किंवा विमा कंपनीला कॉल करा.', gu: 'ઘણી કાર / 2-વ્હીલર પર તમારા વીમા દ્વારા મફત રોડસાઇડ સહાય મળે છે — તમારી પોલિસી જુઓ અથવા વીમા કંપનીને કોલ કરો.', kn: 'ಹಲವು ಕಾರು / 2-ವೀಲರ್‌ಗಳಿಗೆ ನಿಮ್ಮ ವಿಮೆಯ ಮೂಲಕ ಉಚಿತ ರೋಡ್‌ಸೈಡ್ ಸಹಾಯ ಸಿಗುತ್ತದೆ — ನಿಮ್ಮ ಪಾಲಿಸಿ ನೋಡಿ ಅಥವಾ ವಿಮಾ ಸಂಸ್ಥೆಗೆ ಕರೆ ಮಾಡಿ.', ml: 'പല കാർ / 2-വീലറുകൾക്കും നിങ്ങളുടെ ഇൻഷുറൻസ് വഴി സൗജന്യ റോഡ്‌സൈഡ് സഹായം ഉണ്ട് — നിങ്ങളുടെ പോളിസി നോക്കുക അല്ലെങ്കിൽ ഇൻഷുറർക്ക് വിളിക്കുക.' },

    // outcome feedback
    didFix:   { en: 'Did this fix it?', hi: 'क्या यह ठीक हो गया?', ta: 'இது சரியாகிவிட்டதா?', te: 'ఇది బాగైందా?', bn: 'এটা কি ঠিক হলো?', mr: 'हे दुरुस्त झाले का?', gu: 'આ ઠીક થયું?', kn: 'ಇದು ಸರಿಯಾಯಿತೆ?', ml: 'ഇത് ശരിയായോ?' },
    fixYes:   { en: 'Yes', hi: 'हाँ', ta: 'ஆம்', te: 'అవును', bn: 'হ্যাঁ', mr: 'होय', gu: 'હા', kn: 'ಹೌದು', ml: 'അതെ' },
    fixNo:    { en: 'No', hi: 'नहीं', ta: 'இல்லை', te: 'లేదు', bn: 'না', mr: 'नाही', gu: 'ના', kn: 'ಇಲ್ಲ', ml: 'ഇല്ല' },
    rideSafe: { en: 'Great — ride / drive safe!', hi: 'बढ़िया — सुरक्षित चलाएँ!', ta: 'அருமை — பாதுகாப்பாக ஓட்டுங்கள்!', te: 'బాగుంది — జాగ్రత్తగా నడపండి!', bn: 'দারুণ — নিরাপদে চালান!', mr: 'छान — सुरक्षित चालवा!', gu: 'સરસ — સલામત ચલાવો!', kn: 'ಚೆನ್ನಾಗಿದೆ — ಸುರಕ್ಷಿತವಾಗಿ ಚಲಾಯಿಸಿ!', ml: 'കൊള്ളാം — സുരക്ഷിതമായി ഓടിക്കൂ!' },
    liveObd:  { en: 'Live OBD', hi: 'लाइव OBD', ta: 'லைவ் OBD', te: 'లైవ్ OBD', bn: 'লাইভ OBD', mr: 'लाइव्ह OBD', gu: 'લાઇવ OBD', kn: 'ಲೈವ್ OBD', ml: 'ലൈവ് OBD' }
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
      // safety drill strip (collapsible)
      '.csf-safety{border:2px solid ' + saffron + ';background:#fff8ef;border-radius:12px;margin-bottom:14px;overflow:hidden}',
      '.csf-safety-h{display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;font:inherit;padding:11px 12px;cursor:pointer;min-height:48px;text-align:left;color:#7a3a00;font-weight:800;font-size:14px}',
      '.csf-safety-h .csf-caret{margin-left:auto}',
      '.csf-safety-b{display:none;padding:0 12px 12px}',
      '.csf-safety.open .csf-safety-b{display:block}',
      '.csf-safety.open .csf-caret{transform:rotate(90deg)}',
      '.csf-safety-row{display:flex;align-items:flex-start;gap:9px;font-size:14px;color:#3a2a00;line-height:1.4;padding:6px 0}',
      '.csf-safety-row .si{flex:0 0 auto;font-size:18px;line-height:1.2}',
      // triage checklist
      '.csf-triage{border:2px solid ' + navy + ';background:#f4f7ff;border-radius:12px;padding:11px 13px;margin-bottom:14px}',
      '.csf-triage-h{font-size:14px;font-weight:800;color:' + navy + ';margin-bottom:7px}',
      '.csf-triage-row{display:flex;align-items:flex-start;gap:9px;font-size:14px;color:#1a2a44;line-height:1.4;padding:4px 0}',
      '.csf-triage-row .ck{flex:0 0 auto;color:' + navy + ';font-weight:800}',
      // de-emphasised (when-mismatch) cause
      '.csf-cause.dim{opacity:.62}',
      '.csf-cause.dim .csf-cause-h{background:#f4f4f4}',
      '.csf-cause.dim .cn{font-size:13.5px;color:#555}',
      '.csf-whennote{font-size:11px;color:#888;font-style:italic;margin-top:2px}',
      // step-locator diagram wrap
      '.csf-diawrap{background:#fafafa;border:1px solid #eee;border-radius:12px;padding:8px;margin:8px 0 4px;text-align:center}',
      '.csf-diawrap svg{margin:0 auto}',
      // find-help footer + panel
      '.csf-helpbtn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;border:2px solid ' + navy + ';border-radius:14px;background:#fff;color:' + navy + ';font-size:15px;font-weight:800;cursor:pointer;margin-top:14px}',
      '.csf-helpbtn:active{transform:scale(.98)}',
      '.csf-helppanel{border:2px solid ' + navy + ';border-radius:14px;padding:13px;margin-top:12px;background:#f7f9ff}',
      '.csf-helppanel.hidden{display:none}',
      '.csf-helpgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}',
      '.csf-mapbtn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:74px;border:2px solid #ddd;border-radius:12px;background:#fff;color:#222;font:inherit;font-size:13px;font-weight:700;cursor:pointer;text-align:center;text-decoration:none;padding:8px}',
      '.csf-mapbtn:active{transform:scale(.97)}',
      '.csf-mapbtn .mi{font-size:26px;line-height:1}',
      '.csf-rsa{font-size:13px;color:#5a3a00;background:#fff8ef;border-left:4px solid ' + saffron + ';border-radius:8px;padding:9px 11px;line-height:1.45;margin-bottom:12px}',
      // outcome feedback
      '.csf-outcome{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px;padding-top:12px;border-top:1px dashed #ddd}',
      '.csf-outcome .oq{font-size:14px;font-weight:700;color:#222;flex:1 1 auto;min-width:120px}',
      '.csf-ofb{min-width:56px;min-height:48px;border:2px solid #ddd;border-radius:12px;background:#fff;font-size:17px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px}',
      '.csf-ofb.yes{border-color:' + green + ';color:' + green + '}',
      '.csf-ofb.no{border-color:#b00020;color:#b00020}',
      '.csf-ofb:active{transform:scale(.95)}',
      '.csf-outcome-msg{flex-basis:100%;font-size:14px;font-weight:700;color:' + green + ';margin-top:6px}',
      // disclaimer gate
      '.csf-discl-wrap{padding:18px 16px;max-width:480px;margin:0 auto}',
      '.csf-discl-card{border:2px solid ' + saffron + ';background:#fff8ef;border-radius:16px;padding:18px}',
      '.csf-discl-card h3{font-size:18px;font-weight:800;color:#7a3a00;margin:0 0 12px;display:flex;align-items:center;gap:8px}',
      '.csf-discl-card p{font-size:15px;line-height:1.5;color:#3a2a00;margin:0 0 16px}',
      '.csf-discl-ok{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;border:0;border-radius:14px;background:' + navy + ';color:#fff;font-size:16px;font-weight:800;cursor:pointer}',
      '.csf-discl-ok:active{transform:scale(.98)}',
      '.csf-obdlink{display:block;text-align:center;font-size:13px;color:' + navy + ';margin-top:14px;cursor:pointer;text-decoration:underline;background:transparent;border:0;width:100%;font:inherit;font-weight:700}',
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
  var state = { open: false, vehicle: '2w', screen: 'grid', scenarioId: null, safetyOpen: false, helpOpen: false, geo: null };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function scenarios() { var kb = KB(); return kb ? kb.forVehicle(state.vehicle) : []; }
  function currentScenario() { return scenarios().filter(function (s) { return s.id === state.scenarioId; })[0] || null; }

  function tierLabel(tier) { return tier === 'red' ? t(L.tierRed) : (tier === 'amber' ? t(L.tierAmber) : t(L.tierGreen)); }
  function tierIcon(tier) { return tier === 'red' ? '🔴' : (tier === 'amber' ? '🟡' : '🟢'); }

  // ── saved-vehicle conditions (for make/model `when` filtering) ─────────────
  // Returns the set of condition tokens the current vehicle satisfies, OR null
  // for any condition we cannot determine (then we never de-emphasise on it).
  function loadVehicle() {
    try {
      if (state.vehicle === '4w' && typeof window.loadCar === 'function') return window.loadCar() || null;
      if (state.vehicle === '2w' && typeof window.loadBike === 'function') return window.loadBike() || null;
    } catch (e) {}
    return null;
  }
  // Evaluate a single `when` token against the saved vehicle.
  //   'yes'  → vehicle matches this condition
  //   'no'   → vehicle is known to NOT match (de-emphasise)
  //   null   → undeterminable (show normally)
  function whenVerdict(cond) {
    if (!cond) return 'yes';
    var v = loadVehicle();
    if (!v) return null;
    var fuel = String(v.fuel || v.fuelType || v.fuel_type || '').toLowerCase();
    var trans = String(v.transmission || v.gearbox || v.gear || '').toLowerCase();
    var hay = [v.variant, v.model, v.trim].map(function (x) { return String(x || '').toLowerCase(); }).join(' ');

    switch (cond) {
      case 'ev': {
        var isEv = /electric|\bev\b|battery/.test(fuel) || /\bev\b|electric/.test(hay);
        var nonEv = /petrol|diesel|cng|hybrid|gasoline/.test(fuel);
        if (isEv) return 'yes'; if (nonEv) return 'no'; return null;
      }
      case 'petrol': {
        if (!fuel) return null;
        if (/petrol|gasoline/.test(fuel)) return 'yes';
        if (/diesel|electric|\bev\b/.test(fuel)) return 'no';
        return null;
      }
      case 'diesel': {
        if (!fuel) return null;
        if (/diesel/.test(fuel)) return 'yes';
        if (/petrol|gasoline|electric|\bev\b|cng/.test(fuel)) return 'no';
        return null;
      }
      case 'auto': {
        if (!trans) return null;
        if (/auto|amt|cvt|dct|imt|\bat\b/.test(trans)) return 'yes';
        if (/manual|\bmt\b/.test(trans)) return 'no';
        return null;
      }
      case 'manual': {
        if (!trans) return null;
        if (/manual|\bmt\b/.test(trans)) return 'yes';
        if (/auto|amt|cvt|dct|imt|\bat\b/.test(trans)) return 'no';
        return null;
      }
      // carb / fi / tube / tubeless / aircool / liquidcool — not stored on the
      // saved profile today → always undeterminable (show normally).
      default: return null;
    }
  }
  function vehLabel() { return t(state.vehicle === '4w' ? L.vehCar : L.vehBike); }

  // ── injury disclaimer gate (one-time, localStorage) ───────────────────────
  var DISCL_KEY = 'chitti_selffix_disclaimer_v1';
  function disclaimerAcknowledged() {
    try { return localStorage.getItem(DISCL_KEY) === '1'; } catch (e) { return false; }
  }
  function acknowledgeDisclaimer() {
    try { localStorage.setItem(DISCL_KEY, '1'); } catch (e) {}
  }

  // ── step-locator diagram (graceful when key missing or module absent) ─────
  function renderDiagram(key) {
    if (!key) return '';
    var D = window.ChittiBreakdownDiagrams;
    if (!D || typeof D.render !== 'function') return '';
    var html;
    try { html = D.render(key, function (o) { return t(o); }); } catch (e) { html = ''; }
    if (!html) return '';
    return '<div class="csf-diawrap">' + html + '</div>';
  }

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
      '<div class="csf-diag-name"><span class="di">' + esc(s.icon || '🛠️') + '</span><span>' + esc(t(s.name)) + '</span></div>' +
      renderSafetyStrip();

    if (s.safety && s.safety.red) {
      // RED scenario — banner + tow only, NO diy steps.
      html += '<div class="csf-redbanner">' +
        '<div class="rb-t">⛔ ' + esc(t(L.danger)) + '</div>' +
        '<div class="rb-w">' + esc(t(s.safety.warn)) + '</div>' +
        '<div class="rb-tow">' + esc(t(s.towMsg)) + '</div>' +
        '<button class="csf-sosbtn" data-act="sos">🆘 ' + esc(t(L.sos)) + '</button>' +
        '</div>';
      html += renderFindHelp();
      html += '</div>';
      return html;
    }

    // Non-red: amber safety note + triage + expandable causes.
    if (s.safety && s.safety.warn) {
      html += '<div class="csf-amber">⚠️ ' + esc(t(s.safety.warn)) + '</div>';
    }

    // Triage — "check these first" checklist ABOVE the causes.
    if (s.triage && s.triage.length) {
      html += '<div class="csf-triage"><div class="csf-triage-h">🔎 ' + esc(t(L.triage)) + '</div>';
      s.triage.forEach(function (tr) {
        html += '<div class="csf-triage-row"><span class="ck">☐</span><span>' + esc(t(tr)) + '</span></div>';
      });
      html += '</div>';
    }

    html += '<h3 class="csf-sec-h" style="font-size:16px">' + esc(t(L.causes)) + '</h3>' +
      '<p class="csf-sec-s">' + esc(t(L.causesHint)) + '</p>';

    (s.causes || []).forEach(function (c, idx) {
      var tier = c.tier || 'green';
      // make/model filtering: de-emphasise causes whose `when` is known-not-matching,
      // but NEVER dim a red (safety) cause.
      var verdict = whenVerdict(c.when);
      var dim = (verdict === 'no' && tier !== 'red');
      var whenNote = dim
        ? '<div class="csf-whennote">' + esc(t(L.lessLikely) + ' ' + vehLabel()) + '</div>'
        : '';
      html += '<div class="csf-cause' + (dim ? ' dim' : '') + '" data-cidx="' + idx + '">' +
        '<button class="csf-cause-h" data-act="toggle" data-cidx="' + idx + '" aria-expanded="false">' +
          '<span class="csf-cause-n"><span class="cn">' + esc(t(c.name)) + '</span>' +
            '<span class="cmeta">' + esc(String(c.pct)) + '% ' + esc(t(L.likelihood)) + '</span>' + whenNote + '</span>' +
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

    // persistent "DIY failed → find help nearby" footer + panel
    html += renderFindHelp();

    // optional Live OBD link (car only)
    if (state.vehicle === '4w' && window.ChittiOBD && typeof window.ChittiOBD.open === 'function') {
      html += '<button class="csf-obdlink" data-act="obd">🔌 ' + esc(t(L.liveObd)) + '</button>';
    }

    html += '</div>';
    return html;
  }

  // Night / highway safety drill — always-visible collapsible strip.
  function renderSafetyStrip() {
    var openCls = state.safetyOpen ? ' open' : '';
    return '<div class="csf-safety' + openCls + '">' +
      '<button class="csf-safety-h" data-act="safetytoggle" aria-expanded="' + (state.safetyOpen ? 'true' : 'false') + '">' +
        '🛡️ <span>' + esc(t(L.safetyTitle)) + '</span><span class="csf-caret">▶</span>' +
      '</button>' +
      '<div class="csf-safety-b">' +
        '<div class="csf-safety-row"><span class="si">🚗</span><span>' + esc(t(L.safety1)) + '</span></div>' +
        '<div class="csf-safety-row"><span class="si">🌙</span><span>' + esc(t(L.safety2)) + '</span></div>' +
        '<div class="csf-safety-row"><span class="si">🔺</span><span>' + esc(t(L.safety3)) + '</span></div>' +
      '</div></div>';
  }

  // Ask once for geolocation to bias the maps search; on success refresh the
  // open help panel's links. Silent + offline-safe (just falls back to query).
  function requestGeo() {
    if (state.geo || state.geoTried) return;
    state.geoTried = true;
    try {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(function (pos) {
        if (!pos || !pos.coords) return;
        state.geo = { lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) };
        // refresh the visible map links in place (panel may still be open)
        var links = document.querySelectorAll('.csf-helppanel .csf-mapbtn');
        if (!links.length) return;
        var qs = [
          'petrol pump',
          (state.vehicle === '4w' ? 'car puncture tyre shop' : 'two wheeler puncture shop'),
          (state.vehicle === '4w' ? 'car mechanic' : 'two wheeler mechanic'),
          'hospital'
        ];
        for (var i = 0; i < links.length && i < qs.length; i++) links[i].setAttribute('href', mapUrl(qs[i]));
      }, function () {}, { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 });
    } catch (e) {}
  }

  // "Couldn't fix it? Find help nearby" — footer button + hidden panel.
  function mapUrl(q) {
    var query = encodeURIComponent(q);
    if (state.geo) query = encodeURIComponent(q + ' near ' + state.geo.lat + ',' + state.geo.lng);
    return 'https://www.google.com/maps/search/?api=1&query=' + query;
  }
  function renderFindHelp() {
    var mechLabel = t(L.helpMech) + ' (' + vehLabel() + ')';
    var pumpQ = 'petrol pump';
    var puncQ = (state.vehicle === '4w' ? 'car puncture tyre shop' : 'two wheeler puncture shop');
    var mechQ = (state.vehicle === '4w' ? 'car mechanic' : 'two wheeler mechanic');
    var hospQ = 'hospital';
    var sosBtn = (typeof window.mbSOS === 'function' || typeof window.mcSOS === 'function')
      ? '<button class="csf-sosbtn" data-act="sos" style="margin-top:0">🚨 ' + esc(t(L.sos)) + '</button>'
      : '';
    var panelCls = state.helpOpen ? '' : ' hidden';
    return '<button class="csf-helpbtn" data-act="findhelp" aria-expanded="' + (state.helpOpen ? 'true' : 'false') + '">' +
        '🧭 ' + esc(t(L.findHelp)) + '</button>' +
      '<div class="csf-helppanel' + panelCls + '">' +
        '<div class="csf-helpgrid">' +
          '<a class="csf-mapbtn" href="' + esc(mapUrl(pumpQ)) + '" target="_blank" rel="noopener"><span class="mi">⛽</span><span>' + esc(t(L.helpPump)) + '</span></a>' +
          '<a class="csf-mapbtn" href="' + esc(mapUrl(puncQ)) + '" target="_blank" rel="noopener"><span class="mi">🛞</span><span>' + esc(t(L.helpPuncture)) + '</span></a>' +
          '<a class="csf-mapbtn" href="' + esc(mapUrl(mechQ)) + '" target="_blank" rel="noopener"><span class="mi">🔧</span><span>' + esc(mechLabel) + '</span></a>' +
          '<a class="csf-mapbtn" href="' + esc(mapUrl(hospQ)) + '" target="_blank" rel="noopener"><span class="mi">🏥</span><span>' + esc(t(L.helpHospital)) + '</span></a>' +
        '</div>' +
        '<div class="csf-rsa">🛟 ' + esc(t(L.rsaReminder)) + '</div>' +
        sosBtn +
      '</div>';
  }

  // First-run injury disclaimer screen (its own step before the symptom grid).
  function renderDisclaimer() {
    var kb = KB();
    var msg = kb && kb.disclaimer ? t(kb.disclaimer) : '';
    return '<div class="csf-discl-wrap"><div class="csf-discl-card">' +
      '<h3>⚠️ ' + esc(t(L.disclTitle)) + '</h3>' +
      '<p>' + esc(msg) + '</p>' +
      '<button class="csf-discl-ok" data-act="disclok">✓ ' + esc(t(L.disclOk)) + '</button>' +
      '</div></div>';
  }

  function renderCauseBody(c, idx) {
    var h = '';
    // step-locator diagram FIRST so the user SEES where the part is.
    h += renderDiagram(c.dia);
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

    // outcome feedback — "Did this fix it? 👍 / 👎"
    h += '<div class="csf-outcome" data-cidx="' + idx + '">' +
      '<span class="oq">' + esc(t(L.didFix)) + '</span>' +
      '<button class="csf-ofb yes" data-act="fixyes" data-cidx="' + idx + '" aria-label="' + esc(t(L.fixYes)) + '">👍 ' + esc(t(L.fixYes)) + '</button>' +
      '<button class="csf-ofb no" data-act="fixno" data-cidx="' + idx + '" aria-label="' + esc(t(L.fixNo)) + '">👎 ' + esc(t(L.fixNo)) + '</button>' +
      '</div>';
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
    var body = state.screen === 'disclaimer' ? renderDisclaimer()
      : state.screen === 'diag' ? renderDiagnosis()
      : renderGrid();
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
    if (a === 'back') { state.screen = 'grid'; state.scenarioId = null; state.helpOpen = false; render(); return; }
    if (a === 'sos') { triggerSOS(); return; }
    if (a === 'disclok') {
      acknowledgeDisclaimer();
      state.screen = 'grid';
      render();
      return;
    }
    if (a === 'safetytoggle') {
      var strip = act.closest('.csf-safety');
      if (strip) {
        state.safetyOpen = !strip.classList.contains('open');
        strip.classList.toggle('open');
        act.setAttribute('aria-expanded', state.safetyOpen ? 'true' : 'false');
      }
      return;
    }
    if (a === 'findhelp') {
      state.helpOpen = !state.helpOpen;
      var panel = act.parentNode && act.parentNode.querySelector('.csf-helppanel');
      if (panel) {
        panel.classList.toggle('hidden', !state.helpOpen);
        act.setAttribute('aria-expanded', state.helpOpen ? 'true' : 'false');
        if (state.helpOpen) {
          requestGeo();
          try { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
        }
      }
      return;
    }
    if (a === 'obd') {
      try { if (window.ChittiOBD && typeof window.ChittiOBD.open === 'function') window.ChittiOBD.open({ vehicle: state.vehicle }); } catch (e) {}
      return;
    }
    if (a === 'fixyes') {
      var fy = act.closest('.csf-outcome');
      if (fy) {
        fy.innerHTML = '<div class="csf-outcome-msg">🎉 ' + esc(t(L.rideSafe)) + '</div>';
      }
      try { if (typeof window.logProductAction === 'function') window.logProductAction('selffix_fixed', 1); } catch (e) {}
      speak(t(L.rideSafe));
      return;
    }
    if (a === 'fixno') {
      try { if (typeof window.logProductAction === 'function') window.logProductAction('selffix_failed', 0); } catch (e) {}
      // jump focus to the next cause, else open + scroll to the find-help panel.
      var curCard = act.closest('.csf-cause');
      var nextCard = curCard && curCard.nextElementSibling;
      while (nextCard && !nextCard.classList.contains('csf-cause')) nextCard = nextCard.nextElementSibling;
      if (nextCard) {
        if (!nextCard.classList.contains('open')) {
          nextCard.classList.add('open');
          var nh = nextCard.querySelector('.csf-cause-h');
          if (nh) nh.setAttribute('aria-expanded', 'true');
        }
        try { nextCard.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
        var focusTarget = nextCard.querySelector('.csf-cause-h');
        if (focusTarget && focusTarget.focus) try { focusTarget.focus(); } catch (e) {}
      } else {
        state.helpOpen = true;
        var hp = document.querySelector('.csf-helppanel');
        var hb = document.querySelector('.csf-helpbtn');
        if (hp) { hp.classList.remove('hidden'); requestGeo(); try { hp.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }
        if (hb) hb.setAttribute('aria-expanded', 'true');
      }
      return;
    }
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
    // First-ever open → show the one-time injury disclaimer before the grid.
    state.screen = disclaimerAcknowledged() ? 'grid' : 'disclaimer';
    state.scenarioId = null;
    state.helpOpen = false;
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
