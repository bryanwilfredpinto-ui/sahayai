/* chitti_health_score.js — COSDF F10 "Vehicle Health Score" (OFFLINE, deterministic).
 * Self-contained IIFE. Renders an in-page overlay = a 0–100 health score, like a
 * credit score for your vehicle, computed from the user's own 1-tap self-check
 * across 6 weighted components:
 *   Engine 30% · Brakes 20% · Tyres 15% · Electrical 15% · Fluids 10% · Body 10%.
 *
 * HONEST CONTRACT: this is a SELF-CHECK, never an inspection. The number is a
 * pure deterministic weighted sum of what the user told me — no AI verdict, no
 * network, no LLM. Per-rating points: Good=100, Fair=60, Poor=20, Not-sure=70.
 * Band: GREEN ≥80 (healthy) / YELLOW 60–79 (watch) / RED <60 (needs attention),
 * shown as colour AND word (never colour alone). Top 2–3 weakest components →
 * plain-English recommendations. 🔊 speaks the score + recommendations.
 *
 * Every visible string is a 9-language inline bag (en, hi, ta, te, bn, mr, gu,
 * kn, ml) in pure native script via L(o). §6 keep-in-English terms (AI, EV, OBD,
 * km, ₹, the % weights, the number) stay English by contract. Re-renders on the
 * `chitti:langchange` window event. Mirrors chitti_ai_scanners.js conventions.
 *
 * Persists the last score to localStorage (chitti_health_score_2w / _4w) so the
 * next visit can show "last score" + a trend hint.
 *
 * Public API: window.ChittiHealthScore.open('2w'|'4w'), .close(), .isOpen(),
 *             .renderLaunchCard(elId), .renderAllLaunchCards().
 */
(function () {
  'use strict';

  var STYLE_ID = 'chitti-hscore-style';
  var ROOT_ID = 'chitti-hscore-overlay';

  // ── active-language resolver (safe fallback to en) ────────────────────────
  function L(o) {
    if (o == null) return '';
    if (typeof o === 'string') return o;
    var lang = String(window.CURRENT_LANG || 'en').toLowerCase().split('-')[0];
    return o[lang] || o.en || '';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ── voice ──────────────────────────────────────────────────────────────────
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

  // ── i18n: chrome / shared labels ──────────────────────────────────────────
  var T = {
    title:   { en: '🩺 Vehicle Health Score', hi: '🩺 वाहन हेल्थ स्कोर', ta: '🩺 வாகன ஆரோக்கிய மதிப்பெண்', te: '🩺 వాహన ఆరోగ్య స్కోర్', bn: '🩺 যানবাহন স্বাস্থ্য স্কোর', mr: '🩺 वाहन हेल्थ स्कोर', gu: '🩺 વાહન હેલ્થ સ્કોર', kn: '🩺 ವಾಹನ ಆರೋಗ್ಯ ಸ್ಕೋರ್', ml: '🩺 വാഹന ഹെൽത്ത് സ്കോർ' },
    subBike: { en: 'Like a credit score for your bike — based on your answers', hi: 'आपकी बाइक के लिए क्रेडिट स्कोर जैसा — आपके जवाबों पर आधारित', ta: 'உங்கள் பைக்கிற்கு கிரெடிட் ஸ்கோர் போல — உங்கள் பதில்களின் அடிப்படையில்', te: 'మీ బైక్‌కు క్రెడిట్ స్కోర్ లాగా — మీ సమాధానాల ఆధారంగా', bn: 'আপনার বাইকের জন্য ক্রেডিট স্কোরের মতো — আপনার উত্তরের ভিত্তিতে', mr: 'तुमच्या बाईकसाठी क्रेडिट स्कोरसारखा — तुमच्या उत्तरांवर आधारित', gu: 'તમારી બાઇક માટે ક્રેડિટ સ્કોર જેવો — તમારા જવાબો પર આધારિત', kn: 'ನಿಮ್ಮ ಬೈಕ್‌ಗೆ ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್‌ನಂತೆ — ನಿಮ್ಮ ಉತ್ತರಗಳ ಆಧಾರದ ಮೇಲೆ', ml: 'നിങ്ങളുടെ ബൈക്കിന് ഒരു ക്രെഡിറ്റ് സ്കോർ പോലെ — നിങ്ങളുടെ ഉത്തരങ്ങളെ അടിസ്ഥാനമാക്കി' },
    subCar:  { en: 'Like a credit score for your car — based on your answers', hi: 'आपकी कार के लिए क्रेडिट स्कोर जैसा — आपके जवाबों पर आधारित', ta: 'உங்கள் காருக்கு கிரெடிட் ஸ்கோர் போல — உங்கள் பதில்களின் அடிப்படையில்', te: 'మీ కారుకు క్రెడిట్ స్కోర్ లాగా — మీ సమాధానాల ఆధారంగా', bn: 'আপনার গাড়ির জন্য ক্রেডিট স্কোরের মতো — আপনার উত্তরের ভিত্তিতে', mr: 'तुमच्या कारसाठी क्रेडिट स्कोरसारखा — तुमच्या उत्तरांवर आधारित', gu: 'તમારી કાર માટે ક્રેડિટ સ્કોર જેવો — તમારા જવાબો પર આધારિત', kn: 'ನಿಮ್ಮ ಕಾರಿಗೆ ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್‌ನಂತೆ — ನಿಮ್ಮ ಉತ್ತರಗಳ ಆಧಾರದ ಮೇಲೆ', ml: 'നിങ്ങളുടെ കാറിന് ഒരു ക്രെഡിറ്റ് സ്കോർ പോലെ — നിങ്ങളുടെ ഉത്തരങ്ങളെ അടിസ്ഥാനമാക്കി' },
    intro:   { en: 'For each part, tap how it feels right now. Takes under a minute.', hi: 'हर हिस्से के लिए, अभी जैसा लगता है वैसा चुनें। एक मिनट से कम लगता है।', ta: 'ஒவ்வொரு பகுதிக்கும், இப்போது எப்படி இருக்கிறது என்பதைத் தட்டவும். ஒரு நிமிடத்திற்குள் முடியும்.', te: 'ప్రతి భాగానికి, ఇప్పుడు ఎలా ఉందో నొక్కండి. ఒక నిమిషం లోపే.', bn: 'প্রতিটি অংশের জন্য, এখন কেমন লাগছে তা ট্যাপ করুন। এক মিনিটের কম সময় লাগে।', mr: 'प्रत्येक भागासाठी, आत्ता कसे वाटते ते निवडा. एका मिनिटापेक्षा कमी वेळ.', gu: 'દરેક ભાગ માટે, અત્યારે કેવું લાગે છે તે પસંદ કરો. એક મિનિટથી ઓછો સમય.', kn: 'ಪ್ರತಿ ಭಾಗಕ್ಕೆ, ಈಗ ಹೇಗಿದೆ ಎಂದು ಒತ್ತಿ. ಒಂದು ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ.', ml: 'ഓരോ ഭാഗത്തിനും, ഇപ്പോൾ എങ്ങനെ തോന്നുന്നു എന്ന് ടാപ്പ് ചെയ്യൂ. ഒരു മിനിറ്റിൽ താഴെ.' },
    weight:  { en: 'weight', hi: 'भार', ta: 'எடை', te: 'బరువు', bn: 'ওজন', mr: 'वजन', gu: 'વજન', kn: 'ತೂಕ', ml: 'വെയിറ്റ്' },
    good:    { en: 'Good', hi: 'अच्छा', ta: 'நல்லது', te: 'మంచిది', bn: 'ভালো', mr: 'चांगले', gu: 'સારું', kn: 'ಚೆನ್ನಾಗಿದೆ', ml: 'നല്ലത്' },
    fair:    { en: 'Fair', hi: 'ठीक-ठाक', ta: 'சுமார்', te: 'మధ్యస్థం', bn: 'মোটামুটি', mr: 'बरे', gu: 'ઠીક', kn: 'ಪರವಾಗಿಲ್ಲ', ml: 'സാമാന്യം' },
    poor:    { en: 'Poor', hi: 'खराब', ta: 'மோசம்', te: 'చెడు', bn: 'খারাপ', mr: 'वाईट', gu: 'ખરાબ', kn: 'ಕೆಟ್ಟದು', ml: 'മോശം' },
    unsure:  { en: 'Not sure', hi: 'पता नहीं', ta: 'தெரியவில்லை', te: 'తెలియదు', bn: 'নিশ্চিত নই', mr: 'माहित नाही', gu: 'ખબર નથી', kn: 'ಗೊತ್ತಿಲ್ಲ', ml: 'ഉറപ്പില്ല' },
    seeScore: { en: 'See my score', hi: 'मेरा स्कोर देखें', ta: 'என் மதிப்பெண்ணைப் பார்', te: 'నా స్కోర్ చూడండి', bn: 'আমার স্কোর দেখুন', mr: 'माझा स्कोर पाहा', gu: 'મારો સ્કોર જુઓ', kn: 'ನನ್ನ ಸ್ಕೋರ್ ನೋಡಿ', ml: 'എന്റെ സ്കോർ കാണൂ' },
    answerAll: { en: 'Rate all 6 parts to get your score.', hi: 'स्कोर पाने के लिए सभी 6 हिस्से चुनें।', ta: 'மதிப்பெண் பெற 6 பகுதிகளையும் மதிப்பிடுங்கள்.', te: 'స్కోర్ పొందడానికి 6 భాగాలను రేట్ చేయండి.', bn: 'স্কোর পেতে সব ৬টি অংশ রেট করুন।', mr: 'स्कोर मिळवण्यासाठी सर्व 6 भाग रेट करा.', gu: 'સ્કોર મેળવવા બધા 6 ભાગ રેટ કરો.', kn: 'ಸ್ಕೋರ್ ಪಡೆಯಲು ಎಲ್ಲಾ 6 ಭಾಗಗಳನ್ನು ರೇಟ್ ಮಾಡಿ.', ml: 'സ്കോർ ലഭിക്കാൻ 6 ഭാഗങ്ങളും റേറ്റ് ചെയ്യൂ.' },
    bandGreen: { en: 'Healthy', hi: 'स्वस्थ', ta: 'ஆரோக்கியம்', te: 'ఆరోగ్యం', bn: 'সুস্থ', mr: 'निरोगी', gu: 'સ્વસ્થ', kn: 'ಆರೋಗ್ಯಕರ', ml: 'ആരോഗ്യകരം' },
    bandYellow: { en: 'Watch', hi: 'ध्यान दें', ta: 'கவனியுங்கள்', te: 'గమనించండి', bn: 'খেয়াল রাখুন', mr: 'लक्ष ठेवा', gu: 'ધ્યાન રાખો', kn: 'ಗಮನಿಸಿ', ml: 'ശ്രദ്ധിക്കൂ' },
    bandRed: { en: 'Needs attention', hi: 'ध्यान चाहिए', ta: 'கவனம் தேவை', te: 'శ్రద్ధ అవసరం', bn: 'মনোযোগ দরকার', mr: 'लक्ष देणे आवश्यक', gu: 'ધ્યાન જરૂરી', kn: 'ಗಮನ ಬೇಕು', ml: 'ശ്രദ്ധ വേണം' },
    breakdown: { en: 'Part-by-part', hi: 'हिस्सेवार', ta: 'பகுதி வாரியாக', te: 'భాగం వారీగా', bn: 'অংশ অনুযায়ী', mr: 'भागानुसार', gu: 'ભાગવાર', kn: 'ಭಾಗವಾರು', ml: 'ഭാഗം തിരിച്ച്' },
    recs:    { en: 'What to look at first', hi: 'पहले क्या देखें', ta: 'முதலில் எதைப் பார்க்க வேண்டும்', te: 'ముందుగా ఏం చూడాలి', bn: 'প্রথমে কী দেখবেন', mr: 'आधी काय पाहावे', gu: 'પહેલા શું જોવું', kn: 'ಮೊದಲು ಏನು ನೋಡಬೇಕು', ml: 'ആദ്യം എന്ത് നോക്കണം' },
    allGood: { en: 'All parts look good — keep up the regular checks!', hi: 'सभी हिस्से अच्छे लगते हैं — नियमित जाँच जारी रखें!', ta: 'அனைத்து பகுதிகளும் நன்றாக உள்ளன — வழக்கமான சோதனைகளைத் தொடருங்கள்!', te: 'అన్ని భాగాలు బాగున్నాయి — క్రమం తప్పకుండా తనిఖీ చేస్తూ ఉండండి!', bn: 'সব অংশ ভালো — নিয়মিত পরীক্ষা চালিয়ে যান!', mr: 'सर्व भाग चांगले आहेत — नियमित तपासणी सुरू ठेवा!', gu: 'બધા ભાગ સારા છે — નિયમિત તપાસ ચાલુ રાખો!', kn: 'ಎಲ್ಲಾ ಭಾಗಗಳು ಚೆನ್ನಾಗಿವೆ — ನಿಯಮಿತ ಪರಿಶೀಲನೆ ಮುಂದುವರಿಸಿ!', ml: 'എല്ലാ ഭാഗങ്ങളും നല്ലതാണ് — പതിവ് പരിശോധന തുടരൂ!' },
    honest:  { en: 'Based on your self-check — not an inspection.', hi: 'आपकी खुद-जाँच पर आधारित — यह जाँच (इंस्पेक्शन) नहीं है।', ta: 'உங்கள் சுய-சோதனையின் அடிப்படையில் — இது ஆய்வு அல்ல.', te: 'మీ స్వీయ-తనిఖీ ఆధారంగా — ఇది ఇన్‌స్పెక్షన్ కాదు.', bn: 'আপনার স্ব-পরীক্ষার ভিত্তিতে — এটি কোনো ইনস্পেকশন নয়।', mr: 'तुमच्या स्व-तपासणीवर आधारित — हे इन्स्पेक्शन नाही.', gu: 'તમારી સ્વ-તપાસ પર આધારિત — આ ઇન્સ્પેક્શન નથી.', kn: 'ನಿಮ್ಮ ಸ್ವಯಂ-ಪರಿಶೀಲನೆಯ ಆಧಾರದ ಮೇಲೆ — ಇದು ಇನ್ಸ್‌ಪೆಕ್ಷನ್ ಅಲ್ಲ.', ml: 'നിങ്ങളുടെ സ്വയം-പരിശോധനയെ അടിസ്ഥാനമാക്കി — ഇത് ഒരു ഇൻസ്പെക്ഷൻ അല്ല.' },
    lastScore: { en: 'Last score', hi: 'पिछला स्कोर', ta: 'கடைசி மதிப்பெண்', te: 'చివరి స్కోర్', bn: 'গত স্কোর', mr: 'मागील स्कोर', gu: 'છેલ્લો સ્કોર', kn: 'ಕೊನೆಯ ಸ್ಕೋರ್', ml: 'അവസാന സ്കോർ' },
    trendUp: { en: 'Up from last time 👍', hi: 'पिछली बार से बेहतर 👍', ta: 'கடந்த முறையை விட அதிகம் 👍', te: 'గత సారి కంటే ఎక్కువ 👍', bn: 'গতবারের চেয়ে বেশি 👍', mr: 'मागील वेळेपेक्षा जास्त 👍', gu: 'ગયા વખત કરતાં વધુ 👍', kn: 'ಕಳೆದ ಬಾರಿಗಿಂತ ಹೆಚ್ಚು 👍', ml: 'കഴിഞ്ഞ തവണത്തേക്കാൾ കൂടുതൽ 👍' },
    trendDown: { en: 'Down from last time — check the weak parts', hi: 'पिछली बार से कम — कमज़ोर हिस्से जाँचें', ta: 'கடந்த முறையை விட குறைவு — பலவீனமான பகுதிகளைச் சரிபார்க்கவும்', te: 'గత సారి కంటే తక్కువ — బలహీన భాగాలను తనిఖీ చేయండి', bn: 'গতবারের চেয়ে কম — দুর্বল অংশগুলো দেখুন', mr: 'मागील वेळेपेक्षा कमी — कमकुवत भाग तपासा', gu: 'ગયા વખત કરતાં ઓછું — નબળા ભાગ તપાસો', kn: 'ಕಳೆದ ಬಾರಿಗಿಂತ ಕಡಿಮೆ — ದುರ್ಬಲ ಭಾಗಗಳನ್ನು ಪರಿಶೀಲಿಸಿ', ml: 'കഴിഞ്ഞ തവണത്തേക്കാൾ കുറവ് — ദുർബല ഭാഗങ്ങൾ പരിശോധിക്കൂ' },
    trendSame: { en: 'Same as last time', hi: 'पिछली बार जैसा ही', ta: 'கடந்த முறையைப் போலவே', te: 'గత సారిలాగే', bn: 'গতবারের মতোই', mr: 'मागील वेळेसारखेच', gu: 'ગયા વખત જેવું જ', kn: 'ಕಳೆದ ಬಾರಿಯಂತೆಯೇ', ml: 'കഴിഞ്ഞ തവണത്തേത് പോലെ തന്നെ' },
    again:   { en: 'Check again', hi: 'फिर जाँचें', ta: 'மீண்டும் சரிபார்', te: 'మళ్లీ తనిఖీ', bn: 'আবার দেখুন', mr: 'पुन्हा तपासा', gu: 'ફરી તપાસો', kn: 'ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ', ml: 'വീണ്ടും പരിശോധിക്കൂ' },
    speak:   { en: 'Read aloud', hi: 'ज़ोर से पढ़ें', ta: 'உரக்கப் படி', te: 'బిగ్గరగా చదవండి', bn: 'জোরে পড়ুন', mr: 'मोठ्याने वाचा', gu: 'મોટેથી વાંચો', kn: 'ಗಟ್ಟಿಯಾಗಿ ಓದಿ', ml: 'ഉറക്കെ വായിക്കൂ' },
    scoreWord: { en: 'Your score is', hi: 'आपका स्कोर है', ta: 'உங்கள் மதிப்பெண்', te: 'మీ స్కోర్', bn: 'আপনার স্কোর', mr: 'तुमचा स्कोर आहे', gu: 'તમારો સ્કોર છે', kn: 'ನಿಮ್ಮ ಸ್ಕೋರ್', ml: 'നിങ്ങളുടെ സ്കോർ' },
    back:    { en: 'Back', hi: 'पीछे', ta: 'பின்னால்', te: 'వెనుకకు', bn: 'পিছনে', mr: 'मागे', gu: 'પાછળ', kn: 'ಹಿಂದೆ', ml: 'പിന്നോട്ട്' },
    close:   { en: 'Close', hi: 'बंद करें', ta: 'மூடு', te: 'మూసివేయి', bn: 'বন্ধ করুন', mr: 'बंद करा', gu: 'બંધ કરો', kn: 'ಮುಚ್ಚಿ', ml: 'അടയ്ക്കൂ' },
    outOf:   { en: 'out of 100', hi: '100 में से', ta: '100-ல்', te: '100లో', bn: '100-এর মধ্যে', mr: '100 पैकी', gu: '100 માંથી', kn: '100 ರಲ್ಲಿ', ml: '100-ൽ' }
  };

  // ── the 6 weighted components (per COSDF F10) ─────────────────────────────
  // weight is the % share of the score. hints are bike/car tailored at render.
  function components(vehicle) {
    var is4w = vehicle === '4w';
    return [
      { id: 'engine', icon: '⚙️', weight: 30,
        name: { en: 'Engine', hi: 'इंजन', ta: 'இன்ஜின்', te: 'ఇంజిన్', bn: 'ইঞ্জিন', mr: 'इंजिन', gu: 'એન્જિન', kn: 'ಇಂಜಿನ್', ml: 'എഞ്ചിൻ' },
        hint: is4w
          ? { en: 'Starts easily, no smoke, no odd sound, smooth gear/transmission feel.', hi: 'आसानी से चालू हो, धुआँ नहीं, अजीब आवाज़ नहीं, गियर/ट्रांसमिशन स्मूद लगे।', ta: 'எளிதாக ஸ்டார்ட் ஆகும், புகை இல்லை, விசித்திர ஒலி இல்லை, கியர்/டிரான்ஸ்மிஷன் சீராக உள்ளது.', te: 'సులభంగా స్టార్ట్ అవుతుంది, పొగ లేదు, విచిత్ర శబ్దం లేదు, గేర్/ట్రాన్స్‌మిషన్ స్మూత్‌గా ఉంది.', bn: 'সহজে চালু হয়, ধোঁয়া নেই, অদ্ভুত শব্দ নেই, গিয়ার/ট্রান্সমিশন মসৃণ।', mr: 'सहज सुरू होते, धूर नाही, विचित्र आवाज नाही, गियर/ट्रान्समिशन स्मूद वाटते.', gu: 'સરળતાથી ચાલુ થાય, ધુમાડો નહીં, વિચિત્ર અવાજ નહીં, ગિયર/ટ્રાન્સમિશન સ્મૂધ લાગે.', kn: 'ಸುಲಭವಾಗಿ ಸ್ಟಾರ್ಟ್ ಆಗುತ್ತದೆ, ಹೊಗೆ ಇಲ್ಲ, ವಿಚಿತ್ರ ಶಬ್ದ ಇಲ್ಲ, ಗೇರ್/ಟ್ರಾನ್ಸ್‌ಮಿಷನ್ ಸ್ಮೂತ್.', ml: 'എളുപ്പത്തിൽ സ്റ്റാർട്ടാകുന്നു, പുകയില്ല, വിചിത്ര ശബ്ദമില്ല, ഗിയർ/ട്രാൻസ്മിഷൻ സ്മൂത്ത്.' }
          : { en: 'Starts easily, no smoke, no odd sound, chain runs smooth & oiled.', hi: 'आसानी से चालू हो, धुआँ नहीं, अजीब आवाज़ नहीं, चेन स्मूद और तेल लगी हो।', ta: 'எளிதாக ஸ்டார்ட் ஆகும், புகை இல்லை, விசித்திர ஒலி இல்லை, செயின் சீராக ஓடுகிறது & எண்ணெய் உள்ளது.', te: 'సులభంగా స్టార్ట్ అవుతుంది, పొగ లేదు, విచిత్ర శబ్దం లేదు, చైన్ స్మూత్‌గా ఆయిల్‌తో ఉంది.', bn: 'সহজে চালু হয়, ধোঁয়া নেই, অদ্ভুত শব্দ নেই, চেইন মসৃণ ও তেল দেওয়া।', mr: 'सहज सुरू होते, धूर नाही, विचित्र आवाज नाही, चेन स्मूद व तेल लावलेली.', gu: 'સરળતાથી ચાલુ થાય, ધુમાડો નહીં, વિચિત્ર અવાજ નહીં, ચેઇન સ્મૂધ અને તેલવાળી.', kn: 'ಸುಲಭವಾಗಿ ಸ್ಟಾರ್ಟ್ ಆಗುತ್ತದೆ, ಹೊಗೆ ಇಲ್ಲ, ವಿಚಿತ್ರ ಶಬ್ದ ಇಲ್ಲ, ಚೈನ್ ಸ್ಮೂತ್ & ಎಣ್ಣೆ.', ml: 'എളുപ്പത്തിൽ സ്റ്റാർട്ടാകുന്നു, പുകയില്ല, വിചിത്ര ശബ്ദമില്ല, ചെയിൻ സ്മൂത്തായി ഓയിലിട്ടത്.' },
        rec: { en: 'Get the engine checked by a mechanic.', hi: 'इंजन मैकेनिक से जँचवाएँ।', ta: 'இன்ஜினை மெக்கானிக்கிடம் பரிசோதிக்கவும்.', te: 'ఇంజిన్‌ను మెకానిక్‌తో తనిఖీ చేయించండి.', bn: 'ইঞ্জিন মেকানিককে দিয়ে দেখান।', mr: 'इंजिन मेकॅनिककडून तपासून घ्या.', gu: 'એન્જિન મેકેનિક પાસે તપાસાવો.', kn: 'ಇಂಜಿನ್ ಅನ್ನು ಮೆಕ್ಯಾನಿಕ್‌ನಿಂದ ಪರಿಶೀಲಿಸಿ.', ml: 'എഞ്ചിൻ ഒരു മെക്കാനിക്കിനെക്കൊണ്ട് പരിശോധിപ്പിക്കൂ.' } },
      { id: 'brakes', icon: '🛑', weight: 20,
        name: { en: 'Brakes', hi: 'ब्रेक', ta: 'பிரேக்', te: 'బ్రేకులు', bn: 'ব্রেক', mr: 'ब्रेक', gu: 'બ્રેક', kn: 'ಬ್ರೇಕ್', ml: 'ബ്രേക്ക്' },
        hint: { en: 'Firm pedal/lever, no grinding or squeal, stops straight.', hi: 'पेडल/लीवर मज़बूत, घिसने या चूँ-चूँ की आवाज़ नहीं, सीधा रुके।', ta: 'பெடல்/லீவர் உறுதியாக உள்ளது, தேய்மானம் அல்லது சத்தம் இல்லை, நேராக நிற்கிறது.', te: 'పెడల్/లివర్ గట్టిగా ఉంది, రాపిడి లేదా శబ్దం లేదు, నేరుగా ఆగుతుంది.', bn: 'পেডাল/লিভার শক্ত, ঘষা বা শব্দ নেই, সোজা থামে।', mr: 'पेडल/लिव्हर घट्ट, घासणे किंवा कर्कश आवाज नाही, सरळ थांबते.', gu: 'પેડલ/લીવર મજબૂત, ઘસારો કે ચૂં-ચૂં અવાજ નહીં, સીધું રોકાય.', kn: 'ಪೆಡಲ್/ಲಿವರ್ ಗಟ್ಟಿ, ಉಜ್ಜುವಿಕೆ ಅಥವಾ ಕಿರಿಚುವ ಶಬ್ದ ಇಲ್ಲ, ನೇರವಾಗಿ ನಿಲ್ಲುತ್ತದೆ.', ml: 'പെഡൽ/ലിവർ ഉറപ്പ്, ഉരസലോ ശബ്ദമോ ഇല്ല, നേരെ നിർത്തുന്നു.' },
        rec: { en: 'Get your brakes inspected.', hi: 'अपने ब्रेक जँचवाएँ।', ta: 'உங்கள் பிரேக்கைப் பரிசோதிக்கவும்.', te: 'మీ బ్రేకులను తనిఖీ చేయించండి.', bn: 'আপনার ব্রেক পরীক্ষা করান।', mr: 'तुमचे ब्रेक तपासून घ्या.', gu: 'તમારા બ્રેક તપાસાવો.', kn: 'ನಿಮ್ಮ ಬ್ರೇಕ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.', ml: 'നിങ്ങളുടെ ബ്രേക്ക് പരിശോധിപ്പിക്കൂ.' } },
      { id: 'tyres', icon: '🛞', weight: 15,
        name: { en: 'Tyres', hi: 'टायर', ta: 'டயர்', te: 'టైర్లు', bn: 'টায়ার', mr: 'टायर', gu: 'ટાયર', kn: 'ಟೈರ್', ml: 'ടയർ' },
        hint: { en: 'Tread OK, no cracks or bulge, even wear, air pressure right.', hi: 'ट्रेड ठीक, दरार या उभार नहीं, समान घिसाव, हवा सही।', ta: 'ட்ரெட் சரி, விரிசல் அல்லது வீக்கம் இல்லை, சீரான தேய்மானம், காற்று சரி.', te: 'ట్రెడ్ సరి, పగుళ్లు లేదా ఉబ్బు లేదు, సమాన అరుగుదల, గాలి సరిగ్గా ఉంది.', bn: 'ট্রেড ঠিক, ফাটল বা ফোলা নেই, সমান ক্ষয়, হাওয়া ঠিক।', mr: 'ट्रेड ठीक, भेग किंवा फुगवटा नाही, समान झीज, हवा बरोबर.', gu: 'ટ્રેડ ઠીક, તિરાડ કે ઉભાર નહીં, સમાન ઘસારો, હવા બરાબર.', kn: 'ಟ್ರೆಡ್ ಸರಿ, ಬಿರುಕು ಅಥವಾ ಉಬ್ಬು ಇಲ್ಲ, ಸಮ ಸವೆತ, ಗಾಳಿ ಸರಿ.', ml: 'ട്രെഡ് ശരി, വിള്ളലോ വീക്കമോ ഇല്ല, സമമായ തേയ്മാനം, കാറ്റ് ശരി.' },
        rec: { en: 'Get a tyre shop to check the tyres.', hi: 'टायर दुकान से टायर जँचवाएँ।', ta: 'டயர் கடையில் டயர்களைச் சரிபார்க்கவும்.', te: 'టైర్ షాపులో టైర్లను తనిఖీ చేయించండి.', bn: 'টায়ার দোকানে টায়ার দেখান।', mr: 'टायर दुकानात टायर तपासून घ्या.', gu: 'ટાયર દુકાનમાં ટાયર તપાસાવો.', kn: 'ಟೈರ್ ಅಂಗಡಿಯಲ್ಲಿ ಟೈರ್ ಪರಿಶೀಲಿಸಿ.', ml: 'ടയർ കടയിൽ ടയറുകൾ പരിശോധിപ്പിക്കൂ.' } },
      { id: 'electrical', icon: '🔋', weight: 15,
        name: { en: 'Electrical', hi: 'इलेक्ट्रिकल', ta: 'மின்சாரம்', te: 'ఎలక్ట్రికల్', bn: 'বৈদ্যুতিক', mr: 'इलेक्ट्रिकल', gu: 'ઇલેક્ટ્રિકલ', kn: 'ಎಲೆಕ್ಟ್ರಿಕಲ್', ml: 'ഇലക്ട്രിക്കൽ' },
        hint: { en: 'Lights bright, horn strong, battery starts well, no flicker.', hi: 'लाइट तेज़, हॉर्न मज़बूत, बैटरी अच्छे से चालू करे, टिमटिमाहट नहीं।', ta: 'விளக்குகள் பிரகாசம், ஹார்ன் வலிமை, பேட்டரி நன்றாக ஸ்டார்ட் செய்கிறது, மினுக்கம் இல்லை.', te: 'లైట్లు ప్రకాశం, హార్న్ బలంగా, బ్యాటరీ బాగా స్టార్ట్ చేస్తుంది, మెరుపు లేదు.', bn: 'আলো উজ্জ্বল, হর্ন জোরালো, ব্যাটারি ভালো চালু করে, ঝিকমিক নেই।', mr: 'दिवे तेजस्वी, हॉर्न मजबूत, बॅटरी चांगली सुरू करते, लुकलुक नाही.', gu: 'લાઇટ તેજ, હોર્ન મજબૂત, બેટરી સારી રીતે ચાલુ કરે, ઝબકારો નહીં.', kn: 'ಲೈಟ್ ಪ್ರಕಾಶ, ಹಾರ್ನ್ ಬಲ, ಬ್ಯಾಟರಿ ಚೆನ್ನಾಗಿ ಸ್ಟಾರ್ಟ್ ಮಾಡುತ್ತದೆ, ಮಿನುಗುವಿಕೆ ಇಲ್ಲ.', ml: 'ലൈറ്റ് തെളിച്ചം, ഹോൺ ശക്തം, ബാറ്ററി നന്നായി സ്റ്റാർട്ടാക്കുന്നു, മിന്നലില്ല.' },
        rec: { en: 'Get the battery & wiring checked.', hi: 'बैटरी और वायरिंग जँचवाएँ।', ta: 'பேட்டரி & வயரிங்கைப் பரிசோதிக்கவும்.', te: 'బ్యాటరీ & వైరింగ్ తనిఖీ చేయించండి.', bn: 'ব্যাটারি ও ওয়্যারিং দেখান।', mr: 'बॅटरी व वायरिंग तपासून घ्या.', gu: 'બેટરી અને વાયરિંગ તપાસાવો.', kn: 'ಬ್ಯಾಟರಿ & ವೈರಿಂಗ್ ಪರಿಶೀಲಿಸಿ.', ml: 'ബാറ്ററിയും വയറിങ്ങും പരിശോധിപ്പിക്കൂ.' } },
      { id: 'fluids', icon: '🛢️', weight: 10,
        name: { en: 'Fluids', hi: 'फ्लूइड (तेल/पानी)', ta: 'திரவங்கள்', te: 'ద్రవాలు', bn: 'ফ্লুইড', mr: 'फ्लूइड', gu: 'ફ્લુઇડ', kn: 'ದ್ರವಗಳು', ml: 'ഫ്ലൂയിഡുകൾ' },
        hint: is4w
          ? { en: 'Oil, coolant & transmission fluid at right level, no leaks under the car.', hi: 'ऑयल, कूलेंट और ट्रांसमिशन फ्लूइड सही स्तर पर, कार के नीचे रिसाव नहीं।', ta: 'எண்ணெய், குளிரூட்டி & டிரான்ஸ்மிஷன் திரவம் சரியான அளவில், காரின் கீழ் கசிவு இல்லை.', te: 'ఆయిల్, కూలెంట్ & ట్రాన్స్‌మిషన్ ద్రవం సరైన స్థాయిలో, కారు కింద లీక్ లేదు.', bn: 'তেল, কুল্যান্ট ও ট্রান্সমিশন ফ্লুইড সঠিক স্তরে, গাড়ির নিচে লিক নেই।', mr: 'तेल, कूलंट व ट्रान्समिशन फ्लूइड योग्य पातळीवर, कारखाली गळती नाही.', gu: 'તેલ, કૂલન્ટ અને ટ્રાન્સમિશન ફ્લુઇડ યોગ્ય સ્તરે, કાર નીચે લીક નહીં.', kn: 'ಆಯಿಲ್, ಕೂಲೆಂಟ್ & ಟ್ರಾನ್ಸ್‌ಮಿಷನ್ ದ್ರವ ಸರಿಯಾದ ಮಟ್ಟದಲ್ಲಿ, ಕಾರಿನ ಕೆಳಗೆ ಸೋರಿಕೆ ಇಲ್ಲ.', ml: 'ഓയിൽ, കൂളന്റ് & ട്രാൻസ്മിഷൻ ഫ്ലൂയിഡ് ശരിയായ നിലയിൽ, കാറിന് താഴെ ലീക്ക് ഇല്ല.' }
          : { en: 'Engine oil & coolant at right level, no oil leak under the bike.', hi: 'इंजन ऑयल और कूलेंट सही स्तर पर, बाइक के नीचे ऑयल रिसाव नहीं।', ta: 'இன்ஜின் எண்ணெய் & குளிரூட்டி சரியான அளவில், பைக்கின் கீழ் எண்ணெய் கசிவு இல்லை.', te: 'ఇంజిన్ ఆయిల్ & కూలెంట్ సరైన స్థాయిలో, బైక్ కింద ఆయిల్ లీక్ లేదు.', bn: 'ইঞ্জিন তেল ও কুল্যান্ট সঠিক স্তরে, বাইকের নিচে তেল লিক নেই।', mr: 'इंजिन तेल व कूलंट योग्य पातळीवर, बाईकखाली तेल गळती नाही.', gu: 'એન્જિન તેલ અને કૂલન્ટ યોગ્ય સ્તરે, બાઇક નીચે તેલ લીક નહીં.', kn: 'ಇಂಜಿನ್ ಆಯಿಲ್ & ಕೂಲೆಂಟ್ ಸರಿಯಾದ ಮಟ್ಟದಲ್ಲಿ, ಬೈಕಿನ ಕೆಳಗೆ ಆಯಿಲ್ ಸೋರಿಕೆ ಇಲ್ಲ.', ml: 'എഞ്ചിൻ ഓയിലും കൂളന്റും ശരിയായ നിലയിൽ, ബൈക്കിന് താഴെ ഓയിൽ ലീക്ക് ഇല്ല.' },
        rec: { en: 'Top up / change oil & coolant; fix any leak.', hi: 'ऑयल और कूलेंट भरें/बदलें; रिसाव ठीक कराएँ।', ta: 'எண்ணெய் & குளிரூட்டியை நிரப்பவும்/மாற்றவும்; கசிவை சரிசெய்யவும்.', te: 'ఆయిల్ & కూలెంట్ నింపండి/మార్చండి; లీక్ సరిచేయండి.', bn: 'তেল ও কুল্যান্ট ভরুন/বদলান; লিক ঠিক করান।', mr: 'तेल व कूलंट भरा/बदला; गळती दुरुस्त करा.', gu: 'તેલ અને કૂલન્ટ ભરો/બદલો; લીક ઠીક કરાવો.', kn: 'ಆಯಿಲ್ & ಕೂಲೆಂಟ್ ತುಂಬಿಸಿ/ಬದಲಿಸಿ; ಸೋರಿಕೆ ಸರಿಪಡಿಸಿ.', ml: 'ഓയിലും കൂളന്റും നിറയ്ക്കൂ/മാറ്റൂ; ലീക്ക് ശരിയാക്കൂ.' } },
      { id: 'body', icon: '🚗', weight: 10,
        name: { en: 'Body', hi: 'बॉडी', ta: 'பாடி', te: 'బాడీ', bn: 'বডি', mr: 'बॉडी', gu: 'બોડી', kn: 'ಬಾಡಿ', ml: 'ബോഡി' },
        hint: { en: 'No major rust, no big dents/damage, mirrors & lights intact.', hi: 'बड़ी जंग नहीं, बड़े डेंट/नुकसान नहीं, शीशे और लाइट सही।', ta: 'பெரிய துரு இல்லை, பெரிய டென்ட்/சேதம் இல்லை, கண்ணாடிகள் & விளக்குகள் சரியாக உள்ளன.', te: 'పెద్ద తుప్పు లేదు, పెద్ద డెంట్/నష్టం లేదు, అద్దాలు & లైట్లు సరిగ్గా ఉన్నాయి.', bn: 'বড় মরচে নেই, বড় ডেন্ট/ক্ষতি নেই, আয়না ও আলো ঠিক।', mr: 'मोठा गंज नाही, मोठे डेंट/नुकसान नाही, आरसे व दिवे ठीक.', gu: 'મોટો કાટ નહીં, મોટા ડેન્ટ/નુકસાન નહીં, અરીસા અને લાઇટ સારા.', kn: 'ದೊಡ್ಡ ತುಕ್ಕು ಇಲ್ಲ, ದೊಡ್ಡ ಡೆಂಟ್/ಹಾನಿ ಇಲ್ಲ, ಕನ್ನಡಿ & ಲೈಟ್ ಸರಿ.', ml: 'വലിയ തുരുമ്പില്ല, വലിയ ഡെന്റ്/കേടില്ല, കണ്ണാടികളും ലൈറ്റും ശരി.' },
        rec: { en: 'Treat rust / repair body damage soon.', hi: 'जंग हटवाएँ / बॉडी की मरम्मत जल्द कराएँ।', ta: 'துருவை சரிசெய்யவும் / பாடி சேதத்தை விரைவில் சரிசெய்யவும்.', te: 'తుప్పు తీయించండి / బాడీ నష్టాన్ని త్వరగా బాగుచేయించండి.', bn: 'মরচে সরান / বডির ক্ষতি শীঘ্রই মেরামত করান।', mr: 'गंज काढा / बॉडीची दुरुस्ती लवकर करा.', gu: 'કાટ દૂર કરાવો / બોડી રિપેર જલ્દી કરાવો.', kn: 'ತುಕ್ಕು ತೆಗೆಸಿ / ಬಾಡಿ ಹಾನಿಯನ್ನು ಬೇಗ ಸರಿಪಡಿಸಿ.', ml: 'തുരുമ്പ് നീക്കൂ / ബോഡി കേട് ഉടൻ നന്നാക്കൂ.' } }
    ];
  }

  // ── rating scale → points (deterministic, COSDF F10) ──────────────────────
  var RATINGS = ['good', 'fair', 'poor', 'unsure'];
  var POINTS = { good: 100, fair: 60, poor: 20, unsure: 70 };
  var RATING_ICON = { good: '🟢', fair: '🟡', poor: '🔴', unsure: '❔' };

  // ── state ─────────────────────────────────────────────────────────────────
  var state = { open: false, vehicle: '2w', screen: 'quiz', answers: {}, result: null };

  // ── saved-vehicle (greet with make/model) ─────────────────────────────────
  function loadVehicle() {
    try {
      if (state.vehicle === '4w' && typeof window.loadCar === 'function') return window.loadCar() || null;
      if (state.vehicle === '2w' && typeof window.loadBike === 'function') return window.loadBike() || null;
    } catch (e) {}
    return null;
  }
  function vehicleName() {
    var v = loadVehicle();
    if (!v) return '';
    var mk = String(v.make || v.brand || '').trim();
    var md = String(v.model || '').trim();
    var nm = (mk + ' ' + md).trim();
    return nm;
  }
  function titleText() {
    var nm = vehicleName();
    return nm ? (L(T.title) + ' — ' + nm) : L(T.title);
  }
  function subText() {
    return L(state.vehicle === '4w' ? T.subCar : T.subBike);
  }

  // ── persistence (last score + trend) ──────────────────────────────────────
  function storeKey() { return 'chitti_health_score_' + (state.vehicle === '4w' ? '4w' : '2w'); }
  function loadLast() {
    try { return JSON.parse(localStorage.getItem(storeKey()) || 'null'); } catch (e) { return null; }
  }
  function saveLast(score, band) {
    try { localStorage.setItem(storeKey(), JSON.stringify({ score: score, band: band, at: Date.now() })); } catch (e) {}
  }

  // ── compute (deterministic weighted sum) ──────────────────────────────────
  function compute() {
    var comps = components(state.vehicle);
    var total = 0, wsum = 0, parts = [];
    comps.forEach(function (c) {
      var r = state.answers[c.id];
      var pts = POINTS[r];
      if (pts == null) return; // unanswered — shouldn't happen (gated)
      total += pts * c.weight;
      wsum += c.weight;
      parts.push({ id: c.id, comp: c, rating: r, pts: pts });
    });
    var score = wsum ? Math.round(total / wsum) : 0;
    var band = score >= 80 ? 'green' : (score >= 60 ? 'yellow' : 'red');
    // recommendations: weakest components first (lowest points), exclude Good,
    // take top 2–3. ties broken by higher weight (more impactful) then order.
    var weak = parts.filter(function (p) { return p.rating !== 'good'; })
      .sort(function (a, b) { return (a.pts - b.pts) || (b.comp.weight - a.comp.weight); });
    var recs = weak.slice(0, 3);
    return { score: score, band: band, parts: parts, recs: recs };
  }

  function bandLabel(band) { return band === 'green' ? L(T.bandGreen) : (band === 'yellow' ? L(T.bandYellow) : L(T.bandRed)); }
  function bandIcon(band) { return band === 'green' ? '🟢' : (band === 'yellow' ? '🟡' : '🔴'); }
  function bandColor(band) { return band === 'green' ? '#138808' : (band === 'yellow' ? '#9a5b00' : '#b00020'); }
  function answeredCount() {
    var n = 0; components(state.vehicle).forEach(function (c) { if (state.answers[c.id]) n++; }); return n;
  }

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
      '.chs-panel{max-width:560px;margin:0 auto;min-height:100%;background:#fff;box-shadow:0 0 32px rgba(0,0,0,.4);display:flex;flex-direction:column}',
      '.chs-head{position:sticky;top:0;z-index:2;background:' + navy + ';color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px}',
      '.chs-head .chs-ttl{flex:1;min-width:0}',
      '.chs-head .chs-ttl b{display:block;font-size:17px;line-height:1.25}',
      '.chs-head .chs-ttl small{display:block;font-size:12px;opacity:.9;font-weight:400;margin-top:2px}',
      '.chs-iconbtn{min-width:48px;min-height:48px;border:0;border-radius:12px;background:rgba(255,255,255,.16);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0 12px;font-weight:600}',
      '.chs-iconbtn:active{transform:scale(.96)}',
      '.chs-iconbtn .lbl{font-size:13px;margin-left:6px}',
      '.chs-body{padding:14px;flex:1}',
      '.chs-intro{font-size:14px;color:#444;line-height:1.45;margin:0 0 8px}',
      '.chs-lastpill{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:700;background:#f4f7ff;border:1px solid #d9e1f5;color:' + navy + ';border-radius:999px;padding:6px 12px;margin:0 0 12px}',
      '.chs-comp{border:2px solid #eee;border-radius:16px;padding:12px;margin-bottom:12px;background:#fff}',
      '.chs-comp.answered{border-color:' + green + ';background:#f8fdf8}',
      '.chs-comp-h{display:flex;align-items:center;gap:10px;margin-bottom:4px}',
      '.chs-comp-h .ci{font-size:30px;line-height:1}',
      '.chs-comp-h .cn{flex:1;min-width:0}',
      '.chs-comp-h .cn b{display:block;font-size:16px;font-weight:800;color:' + navy + ';line-height:1.2}',
      '.chs-comp-h .cw{font-size:11px;font-weight:700;color:#fff;background:' + saffron + ';border-radius:999px;padding:3px 9px;white-space:nowrap}',
      '.chs-hint{font-size:13px;color:#555;line-height:1.4;margin:2px 0 10px}',
      '.chs-rates{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}',
      '.chs-rate{min-height:60px;border:2px solid #ddd;border-radius:12px;background:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:6px 4px;font:inherit;text-align:center}',
      '.chs-rate:active{transform:scale(.96)}',
      '.chs-rate .re{font-size:22px;line-height:1}',
      '.chs-rate .rl{font-size:11px;font-weight:700;color:#333;line-height:1.15}',
      '.chs-rate.sel.good{border-color:' + green + ';background:#e6f5e6}',
      '.chs-rate.sel.fair{border-color:' + saffron + ';background:#fff1dd}',
      '.chs-rate.sel.poor{border-color:#b00020;background:#ffe3e3}',
      '.chs-rate.sel.unsure{border-color:' + navy + ';background:#eef2ff}',
      '.chs-cta{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;border:0;border-radius:14px;background:' + green + ';color:#fff;font-size:17px;font-weight:800;cursor:pointer;margin-top:6px}',
      '.chs-cta:disabled{background:#bbb;cursor:not-allowed}',
      '.chs-cta:not(:disabled):active{transform:scale(.98)}',
      '.chs-hint-cta{font-size:12px;color:#999;text-align:center;margin-top:8px}',
      // result screen
      '.chs-ring{width:170px;height:170px;margin:8px auto 6px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;box-shadow:0 6px 22px rgba(0,0,0,.18)}',
      '.chs-ring .num{font-size:54px;font-weight:900;line-height:1}',
      '.chs-ring .of{font-size:13px;font-weight:700;opacity:.92;margin-top:2px}',
      '.chs-bandrow{text-align:center;margin:0 0 4px}',
      '.chs-bandchip{display:inline-flex;align-items:center;gap:8px;font-size:17px;font-weight:800;border-radius:999px;padding:8px 18px;color:#fff}',
      '.chs-sec-h{font-size:14px;font-weight:800;color:' + navy + ';text-transform:uppercase;letter-spacing:.4px;margin:18px 0 8px}',
      '.chs-bar-row{margin-bottom:11px}',
      '.chs-bar-top{display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:4px}',
      '.chs-bar-top .bi{font-size:18px}',
      '.chs-bar-top .bn{flex:1;font-weight:700;color:#222}',
      '.chs-bar-top .bw{font-size:11px;color:#888;font-weight:700}',
      '.chs-bar-top .bp{font-weight:800}',
      '.chs-bar-track{height:12px;border-radius:999px;background:#eee;overflow:hidden}',
      '.chs-bar-fill{height:100%;border-radius:999px;transition:width .35s}',
      '.chs-recs{border:2px solid ' + saffron + ';background:#fff8ef;border-radius:14px;padding:13px}',
      '.chs-rec{display:flex;align-items:flex-start;gap:10px;font-size:15px;color:#5a3a00;line-height:1.4;padding:6px 0}',
      '.chs-rec .ri{flex:0 0 auto;font-size:18px}',
      '.chs-allgood{border:2px solid ' + green + ';background:#f0fbf0;border-radius:14px;padding:13px;font-size:15px;color:#0a5a0a;font-weight:700;line-height:1.4;display:flex;gap:9px}',
      '.chs-honest{font-size:13px;color:#666;font-style:italic;line-height:1.45;margin:16px 0 4px;text-align:center}',
      '.chs-readbtn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;border:0;border-radius:14px;background:' + green + ';color:#fff;font-size:16px;font-weight:700;cursor:pointer;margin-top:14px}',
      '.chs-readbtn:active{transform:scale(.98)}',
      '.chs-againbtn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:50px;border:2px solid ' + navy + ';border-radius:14px;background:#fff;color:' + navy + ';font-size:15px;font-weight:800;cursor:pointer;margin-top:10px}',
      '.chs-againbtn:active{transform:scale(.98)}',
      '.chs-trend{font-size:13px;font-weight:700;text-align:center;margin:8px 0 2px}',
      '@media(max-width:360px){.chs-rates{grid-template-columns:repeat(2,1fr)}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  // ── render: quiz ──────────────────────────────────────────────────────────
  function renderQuiz() {
    var comps = components(state.vehicle);
    var last = loadLast();
    var lastPill = (last && typeof last.score === 'number')
      ? '<div class="chs-lastpill">' + bandIcon(last.band) + ' ' + esc(L(T.lastScore)) + ': ' + esc(String(last.score)) + '/100</div>'
      : '';
    var rows = comps.map(function (c) {
      var sel = state.answers[c.id];
      var rates = RATINGS.map(function (r) {
        var on = sel === r ? (' sel ' + r) : '';
        return '<button class="chs-rate' + on + '" data-act="rate" data-cid="' + esc(c.id) + '" data-r="' + r + '" aria-pressed="' + (sel === r ? 'true' : 'false') + '" aria-label="' + esc(L(c.name) + ': ' + L(T[r])) + '">' +
          '<span class="re">' + RATING_ICON[r] + '</span><span class="rl">' + esc(L(T[r])) + '</span></button>';
      }).join('');
      return '<div class="chs-comp' + (sel ? ' answered' : '') + '" data-cid="' + esc(c.id) + '">' +
        '<div class="chs-comp-h"><span class="ci">' + c.icon + '</span>' +
          '<span class="cn"><b>' + esc(L(c.name)) + '</b></span>' +
          '<span class="cw">' + c.weight + '% ' + esc(L(T.weight)) + '</span></div>' +
        '<div class="chs-hint">' + esc(L(c.hint)) + '</div>' +
        '<div class="chs-rates">' + rates + '</div>' +
        '</div>';
    }).join('');
    var done = answeredCount() === comps.length;
    return '<div class="chs-body">' +
      lastPill +
      '<p class="chs-intro">' + esc(L(T.intro)) + '</p>' +
      rows +
      '<button class="chs-cta" data-act="compute"' + (done ? '' : ' disabled') + '>📊 ' + esc(L(T.seeScore)) + '</button>' +
      (done ? '' : '<div class="chs-hint-cta">' + esc(L(T.answerAll)) + '</div>') +
      '</div>';
  }

  // ── render: result ────────────────────────────────────────────────────────
  function renderResult() {
    var r = state.result;
    if (!r) { state.screen = 'quiz'; return renderQuiz(); }
    var col = bandColor(r.band);

    // trend vs last saved (compared in open(), stored on result as prevScore)
    var trendHtml = '';
    if (r.prevScore != null) {
      var t = r.score > r.prevScore ? L(T.trendUp) : (r.score < r.prevScore ? L(T.trendDown) : L(T.trendSame));
      trendHtml = '<div class="chs-trend" style="color:' + col + '">' + esc(t) + '</div>';
    }

    var ring = '<div class="chs-ring" style="background:' + col + '">' +
      '<span class="num">' + r.score + '</span><span class="of">' + esc(L(T.outOf)) + '</span></div>';
    var bandRow = '<div class="chs-bandrow"><span class="chs-bandchip" style="background:' + col + '">' +
      bandIcon(r.band) + ' ' + esc(bandLabel(r.band)) + '</span></div>';

    // per-component bars
    var bars = r.parts.map(function (p) {
      var bc = p.pts >= 80 ? '#138808' : (p.pts >= 60 ? '#9a5b00' : (p.pts === 70 ? '#000080' : '#b00020'));
      return '<div class="chs-bar-row">' +
        '<div class="chs-bar-top"><span class="bi">' + p.comp.icon + '</span>' +
          '<span class="bn">' + esc(L(p.comp.name)) + '</span>' +
          '<span class="bw">' + p.comp.weight + '%</span>' +
          '<span class="bp" style="color:' + bc + '">' + RATING_ICON[p.rating] + ' ' + p.pts + '</span></div>' +
        '<div class="chs-bar-track"><div class="chs-bar-fill" style="width:' + p.pts + '%;background:' + bc + '"></div></div>' +
        '</div>';
    }).join('');

    // recommendations (weakest first) OR all-good note
    var recHtml;
    if (r.recs.length) {
      recHtml = '<div class="chs-recs">' + r.recs.map(function (p) {
        return '<div class="chs-rec"><span class="ri">' + bandIcon(p.pts >= 60 ? 'yellow' : 'red') + '</span><span>' + esc(L(p.comp.rec)) + '</span></div>';
      }).join('') + '</div>';
    } else {
      recHtml = '<div class="chs-allgood"><span>✅</span><span>' + esc(L(T.allGood)) + '</span></div>';
    }

    return '<div class="chs-body">' +
      ring + bandRow + trendHtml +
      '<div class="chs-sec-h">' + esc(L(T.breakdown)) + '</div>' + bars +
      '<div class="chs-sec-h">' + esc(L(T.recs)) + '</div>' + recHtml +
      '<div class="chs-honest">ℹ️ ' + esc(L(T.honest)) + '</div>' +
      '<button class="chs-readbtn" data-act="speak">🔊 ' + esc(L(T.speak)) + '</button>' +
      '<button class="chs-againbtn" data-act="again">🔄 ' + esc(L(T.again)) + '</button>' +
      '</div>';
  }

  // spoken summary: score + band + top recommendations
  function resultSpeakText() {
    var r = state.result;
    if (!r) return '';
    var parts = [L(T.scoreWord) + ' ' + r.score + ' ' + L(T.outOf) + '. ' + bandLabel(r.band) + '.'];
    if (r.recs.length) {
      parts.push(L(T.recs) + ':');
      r.recs.forEach(function (p) { parts.push(L(p.comp.name) + ' — ' + L(p.comp.rec)); });
    } else {
      parts.push(L(T.allGood));
    }
    parts.push(L(T.honest));
    return parts.join(' ');
  }

  // ── header ────────────────────────────────────────────────────────────────
  function renderHead() {
    var backBtn = state.screen === 'result'
      ? '<button class="chs-iconbtn" data-act="back" aria-label="' + esc(L(T.back)) + '">← <span class="lbl">' + esc(L(T.back)) + '</span></button>'
      : '';
    return '<div class="chs-head">' + backBtn +
      '<div class="chs-ttl"><b>' + esc(titleText()) + '</b><small>' + esc(subText()) + '</small></div>' +
      '<button class="chs-iconbtn" data-act="close" aria-label="' + esc(L(T.close)) + '">✕ <span class="lbl">' + esc(L(T.close)) + '</span></button>' +
      '</div>';
  }

  function render() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    var body = state.screen === 'result' ? renderResult() : renderQuiz();
    root.innerHTML = '<div class="chs-panel" role="dialog" aria-modal="true" aria-label="' + esc(L(T.title)) + '">' +
      renderHead() + body + '</div>';
    root.scrollTop = 0;
  }

  // ── events ────────────────────────────────────────────────────────────────
  function onClick(e) {
    var act = e.target.closest && e.target.closest('[data-act]');
    if (!act) return;
    var a = act.getAttribute('data-act');
    if (a === 'close') { close(); return; }
    if (a === 'back') {
      if (state.screen === 'result') { state.screen = 'quiz'; render(); }
      return;
    }
    if (a === 'rate') {
      var cid = act.getAttribute('data-cid');
      var r = act.getAttribute('data-r');
      state.answers[cid] = r;
      // toggle selection within this component's row, then refresh CTA enablement
      var comp = act.closest('.chs-comp');
      if (comp) {
        var btns = comp.querySelectorAll('.chs-rate');
        for (var i = 0; i < btns.length; i++) {
          btns[i].classList.remove('sel', 'good', 'fair', 'poor', 'unsure');
          btns[i].setAttribute('aria-pressed', 'false');
        }
        act.classList.add('sel', r);
        act.setAttribute('aria-pressed', 'true');
        comp.classList.add('answered');
      }
      var cta = document.querySelector('.chs-cta');
      if (cta) {
        var done = answeredCount() === components(state.vehicle).length;
        cta.disabled = !done;
        var hintEl = document.querySelector('.chs-hint-cta');
        if (done && hintEl) hintEl.style.display = 'none';
      }
      return;
    }
    if (a === 'compute') {
      if (answeredCount() !== components(state.vehicle).length) return;
      var res = compute();
      var prev = loadLast();
      res.prevScore = (prev && typeof prev.score === 'number') ? prev.score : null;
      saveLast(res.score, res.band);
      state.result = res;
      state.screen = 'result';
      render();
      try { if (typeof window.logProductAction === 'function') window.logProductAction('health_score', res.score); } catch (e) {}
      speak(resultSpeakText());
      return;
    }
    if (a === 'speak') { speak(resultSpeakText()); return; }
    if (a === 'again') {
      state.answers = {}; state.result = null; state.screen = 'quiz'; render();
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
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    document.body.appendChild(root);
    return root;
  }

  function open(vehicle) {
    state.vehicle = (vehicle === '4w' || vehicle === 'car') ? '4w' : '2w';
    state.screen = 'quiz';
    state.answers = {};
    state.result = null;
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

  // ── launch card (on the HOME tab; auto-i18n) ──────────────────────────────
  function renderLaunchCard(elId) {
    var el = document.getElementById(elId);
    if (!el) return;
    var v = el.getAttribute('data-chs-vehicle') === '4w' ? '4w' : '2w';
    el.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<span style="font-size:38px;line-height:1">🩺</span>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:17px;font-weight:800;color:#000080;line-height:1.25">' + esc(L(T.title)) + '</div>' +
          '<div style="font-size:13px;color:#555;margin-top:3px;line-height:1.35">' + esc(L(v === '4w' ? T.subCar : T.subBike)) + '</div>' +
        '</div>' +
        '<span style="font-size:22px;color:#999">›</span>' +
      '</div>';
    if (!el.__chsWired) {
      el.__chsWired = true;
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (ev) {
        if (ev.target.closest && ev.target.closest('.chitti-fb-bar, .chitti-fb-wrap, [data-chitti-fb]')) return;
        open(v);
      });
    }
  }
  function renderAllLaunchCards() {
    var nodes = document.querySelectorAll('[data-chs-launch]');
    for (var i = 0; i < nodes.length; i++) renderLaunchCard(nodes[i].id);
  }

  window.addEventListener('chitti:langchange', function () {
    renderAllLaunchCards();
    if (state.open) render();
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAllLaunchCards);
  } else {
    renderAllLaunchCards();
  }

  window.ChittiHealthScore = {
    open: open,
    close: close,
    isOpen: function () { return state.open; },
    renderLaunchCard: renderLaunchCard,
    renderAllLaunchCards: renderAllLaunchCards
  };
})();
