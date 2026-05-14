// chitti_wheels_i18n.js  ·  shared UI translation substrate for both
// chitti_2wheeler.html and chitti_4wheeler.html.
// =======================================================================
// Listens to the `chitti:lang` event dispatched by chitti_a11y.js and
// translates every element marked with `data-i18n="key"` into the user's
// chosen language. Mirrors the Chitti MedUPI i18n pattern (single
// TRANSLATIONS map + applyI18n() function).
//
// SUPPORTED LANGUAGES (UI fully translated):
//   en  English
//   hi  Hindi (हिन्दी)
//   bn  Bengali (বাংলা)
//   te  Telugu (తెలుగు)
//   ta  Tamil (தமிழ்)
//   kn  Kannada (ಕನ್ನಡ)
//   ml  Malayalam (മലയാളം)
//   mr  Marathi (मराठी)
//   gu  Gujarati (ગુજરાતી)
//   or  Odia (ଓଡ଼ିଆ)
//   pa  Punjabi (ਪੰਜਾਬੀ)
//   ur  Urdu (اردو)
//   as  Assamese (অসমীয়া)
//
// For the remaining 14 cousin / tribal languages from the Voice Factory
// roster (sa, ks, sd, mai, mni, kok, doi, brx, sat, bho, hne, tcy, kfa,
// kru, ne), the UI surfaces an HONEST notice and renders in Hindi —
// matching the Voice Factory cascade rule "never silently morph; always
// say so" (SAHAYAI_MASTER §3 #5). Voice IO still works in those langs.
//
// API:
//   ChittiWheelsI18n.apply(lang)  — re-renders the page in `lang`
//   ChittiWheelsI18n.t(key, lang) — returns the translated string
//
// Page author contract:
//   <h2 data-i18n="home.title">Aapki bike ka haal</h2>
//   <button data-i18n-aria="cta.ask">🎙️</button>
//   <input  data-i18n-placeholder="ask.placeholder">
// =======================================================================

(function () {
  if (window.__chittiWheelsI18nLoaded) return;
  window.__chittiWheelsI18nLoaded = true;

  // The 13 Indian languages we provide a full UI translation for.
  // For the remaining Voice Factory langs we fall through to Hindi with
  // an honest banner ("UI translation coming for <lang>; voice supported").
  // 19 supported langs — 13 first-wave (Schedule 8 majors) +
  // 6 Devanagari-script sisters added 2026-05-14:
  //   sa  Sanskrit   · ne  Nepali   · mai Maithili
  //   bho Bhojpuri   · hne Chhattisgarhi · kok Konkani
  // The remaining 9 (ks, sd, mni, doi, brx, sat, tcy, kfa, kru) stay
  // on the honest fallback. Translating into Ol-Chiki / Meitei /
  // Perso-Arabic without a verified native speaker would violate the
  // [Honest stubs over fake demos] rule — they get the queued banner
  // until community translations land via Hall of Fame contributions.
  var SUPPORTED = [
    'en','hi','bn','te','ta','kn','ml','mr','gu','or','pa','ur','as',
    'sa','ne','mai','bho','hne','kok'
  ];
  var FALLBACK_FOR_UNSUPPORTED = 'hi';

  // The bilingual MedUPI map was {key: {en, hi}}; we extend to 13 langs.
  // Each entry is {key: {en: ..., hi: ..., bn: ..., ...}}. If a lang is
  // missing for a specific key, we fall back en -> hi -> the key itself.
  var T = {
    // ── HEADER ──────────────────────────────────────────────────────────
    'hdr.bike.tagline': {
      en:"Bharat's voice-first bike companion · predict · restart · save",
      hi:'भारत का आवाज़-पहला बाइक साथी · पहले से बताए · फिर से चालू करे · बचाए',
      bn:"ভারতের ভয়েস-প্রথম বাইক সঙ্গী · আগে থেকে জানে · আবার চালু করে · সাশ্রয় করে",
      te:'భారత్ యొక్క వాయిస్-ఫస్ట్ బైక్ సహచరుడు · ముందుగానే తెలుసుకుంటాడు · తిరిగి స్టార్ట్ చేస్తాడు · ఆదా చేస్తాడు',
      ta:'பாரதின் குரல்-முதல் பைக் தோழன் · முன்கூட்டியே சொல்கிறது · மீண்டும் தொடங்குகிறது · சேமிக்கிறது',
      kn:'ಭಾರತದ ಧ್ವನಿ-ಮೊದಲ ಬೈಕ್ ಸಂಗಾತಿ · ಮೊದಲೇ ಊಹಿಸುತ್ತದೆ · ಮತ್ತೆ ಪ್ರಾರಂಭಿಸುತ್ತದೆ · ಉಳಿಸುತ್ತದೆ',
      ml:'ഭാരതത്തിന്റെ ശബ്ദ-ആദ്യ ബൈക്ക് സഹായി · മുൻകൂട്ടി പറയും · വീണ്ടും തുടങ്ങും · പണം ലാഭിക്കും',
      mr:'भारताचा आवाज-प्रथम बाईक सोबती · आधीच सांगतो · पुन्हा सुरू करतो · पैसे वाचवतो',
      gu:'ભારતનો અવાજ-પ્રથમ બાઇક સાથી · પહેલેથી જણાવે · ફરી શરૂ કરે · બચાવે',
      or:'ଭାରତର ସ୍ୱର-ପ୍ରଥମ ବାଇକ ସାଥୀ · ପୂର୍ବରୁ କୁହେ · ପୁନଃ ଆରମ୍ଭ କରେ · ସଞ୍ଚୟ କରେ',
      pa:'ਭਾਰਤ ਦਾ ਅਵਾਜ਼-ਪਹਿਲਾ ਬਾਈਕ ਸਾਥੀ · ਪਹਿਲਾਂ ਹੀ ਦੱਸੇ · ਫਿਰ ਚਾਲੂ ਕਰੇ · ਬਚਾਏ',
      ur:'بھارت کا آواز پہلے بائیک ساتھی · پہلے سے بتائے · دوبارہ شروع کرے · بچائے',
      as:'ভাৰতৰ মাত-প্ৰথম বাইক সঙ্গী · আগতীয়াকৈ কয় · পুনৰ আৰম্ভ কৰে · সঞ্চয় কৰে',
    },
    'hdr.car.tagline': {
      en:"Bharat's voice-first car companion · predict · decode · save",
      hi:'भारत का आवाज़-पहला कार साथी · पहले से बताए · कोड समझाए · बचाए',
      bn:'ভারতের ভয়েস-প্রথম গাড়ি সঙ্গী · আগে থেকে জানে · কোড বোঝায় · সাশ্রয় করে',
      te:'భారత్ యొక్క వాయిస్-ఫస్ట్ కార్ సహచరుడు · ముందుగానే తెలుసుకుంటాడు · కోడ్‌లను డీకోడ్ చేస్తాడు · ఆదా చేస్తాడు',
      ta:'பாரதின் குரல்-முதல் கார் தோழன் · முன்கூட்டியே சொல்கிறது · குறியீடுகளை விளக்குகிறது · சேமிக்கிறது',
      kn:'ಭಾರತದ ಧ್ವನಿ-ಮೊದಲ ಕಾರ್ ಸಂಗಾತಿ · ಮೊದಲೇ ಊಹಿಸುತ್ತದೆ · ಕೋಡ್‌ಗಳನ್ನು ವಿವರಿಸುತ್ತದೆ · ಉಳಿಸುತ್ತದೆ',
      ml:'ഭാരതത്തിന്റെ ശബ്ദ-ആദ്യ കാർ സഹായി · മുൻകൂട്ടി പറയും · കോഡുകൾ വിശദീകരിക്കും · പണം ലാഭിക്കും',
      mr:'भारताचा आवाज-प्रथम कार सोबती · आधीच सांगतो · कोड समजावतो · पैसे वाचवतो',
      gu:'ભારતનો અવાજ-પ્રથમ કાર સાથી · પહેલેથી જણાવે · કોડ સમજાવે · બચાવે',
      or:'ଭାରତର ସ୍ୱର-ପ୍ରଥମ କାର ସାଥୀ · ପୂର୍ବରୁ କୁହେ · କୋଡ ବୁଝାଏ · ସଞ୍ଚୟ କରେ',
      pa:'ਭਾਰਤ ਦਾ ਅਵਾਜ਼-ਪਹਿਲਾ ਕਾਰ ਸਾਥੀ · ਪਹਿਲਾਂ ਹੀ ਦੱਸੇ · ਕੋਡ ਸਮਝਾਏ · ਬਚਾਏ',
      ur:'بھارت کا آواز پہلے کار ساتھی · پہلے سے بتائے · کوڈ سمجھائے · بچائے',
      as:"ভাৰতৰ মাত-প্ৰথম কাৰ সঙ্গী · আগতীয়াকৈ কয় · কোড বুজাই দিয়ে · সঞ্চয় কৰে",
    },

    // ── DISCLAIMER BAR ──────────────────────────────────────────────────
    'disc.notmech': {
      en:'NOT A MECHANIC.', hi:'मैकेनिक नहीं हूँ।', bn:'মেকানিক নই।',
      te:'మెకానిక్ కాదు.', ta:'மெக்கானிக் இல்லை.', kn:'ಮೆಕ್ಯಾನಿಕ್ ಅಲ್ಲ.',
      ml:'മെക്കാനിക് അല്ല.', mr:'मेकॅनिक नाही.', gu:'મિકેનિક નથી.',
      or:'ମେକାନିକ ନୁହେଁ।', pa:'ਮਕੈਨਿਕ ਨਹੀਂ ਹਾਂ।', ur:'مکینک نہیں ہوں۔', as:'মেকানিক নহওঁ।',
    },
    'disc.body': {
      en:'For guidance only. Major problems → see a trained mechanic in person. In an emergency Chitti calls family — never the cops (Vaani protocol).',
      hi:'सिर्फ़ मार्गदर्शन के लिए। बड़ी समस्या → प्रशिक्षित मैकेनिक से मिलें। आपात स्थिति में चिट्टी परिवार को फ़ोन करेगा — पुलिस को नहीं (वाणी प्रोटोकॉल)।',
      bn:'শুধু গাইডের জন্য। বড় সমস্যা → প্রশিক্ষিত মেকানিকের সাথে দেখা করুন। জরুরী অবস্থায় চিট্টি পরিবারকে ফোন করবে — পুলিশকে নয় (বাণী প্রোটোকল)।',
      te:'మార్గదర్శనం కోసం మాత్రమే. పెద్ద సమస్యలకు → శిక్షణ పొందిన మెకానిక్‌ను కలవండి. అత్యవసర సమయంలో చిట్టి కుటుంబాన్ని పిలుస్తుంది — పోలీసులను కాదు (వాణి ప్రోటోకాల్).',
      ta:'வழிகாட்டுதலுக்கு மட்டுமே. பெரிய பிரச்சினைகளுக்கு → பயிற்சி பெற்ற மெக்கானிக்கைப் பாருங்கள். அவசரத்தில் சிட்டி குடும்பத்தை அழைக்கும் — காவலரை அல்ல (வாணி நெறிமுறை).',
      kn:'ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಮಾತ್ರ. ದೊಡ್ಡ ಸಮಸ್ಯೆಗಳಿಗೆ → ತರಬೇತಿ ಪಡೆದ ಮೆಕ್ಯಾನಿಕ್ ಅನ್ನು ಭೇಟಿಯಾಗಿ. ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ ಚಿಟ್ಟಿ ಕುಟುಂಬವನ್ನು ಕರೆಯುತ್ತದೆ — ಪೊಲೀಸರನ್ನು ಅಲ್ಲ (ವಾಣಿ ಪ್ರೋಟೋಕಾಲ್).',
      ml:'വഴികാട്ടലിന് മാത്രം. വലിയ പ്രശ്നങ്ങൾക്ക് → പരിശീലനം നേടിയ മെക്കാനിക്കിനെ കാണുക. അടിയന്തരാവസ്ഥയിൽ ചിട്ടി കുടുംബത്തെ വിളിക്കും — പോലീസിനെ അല്ല (വാണി പ്രോട്ടോകോൾ).',
      mr:'फक्त मार्गदर्शनासाठी. मोठ्या समस्यांसाठी → प्रशिक्षित मेकॅनिकला भेटा. आपत्कालीन परिस्थितीत चिट्टी कुटुंबाला फोन करेल — पोलिसांना नाही (वाणी प्रोटोकॉल).',
      gu:'માત્ર માર્ગદર્શન માટે. મોટી સમસ્યાઓ → પ્રશિક્ષિત મિકેનિકને મળો. કટોકટીમાં ચિટ્ટી પરિવારને ફોન કરશે — પોલીસને નહીં (વાણી પ્રોટોકોલ).',
      or:'କେବଳ ମାର୍ଗଦର୍ଶନ ପାଇଁ। ବଡ଼ ସମସ୍ୟା → ତାଲିମପ୍ରାପ୍ତ ମେକାନିକଙ୍କୁ ଭେଟନ୍ତୁ। ଜରୁରୀ ସ୍ଥିତିରେ ଚିଟି ପରିବାରକୁ ଡାକିବ — ପୋଲିସକୁ ନୁହେଁ (ବାଣୀ ପ୍ରୋଟୋକଲ)।',
      pa:'ਸਿਰਫ਼ ਮਾਰਗਦਰਸ਼ਨ ਲਈ। ਵੱਡੀ ਸਮੱਸਿਆ → ਸਿਖਲਾਈ ਪ੍ਰਾਪਤ ਮਕੈਨਿਕ ਨੂੰ ਮਿਲੋ। ਐਮਰਜੈਂਸੀ ਵਿੱਚ ਚਿੱਟੀ ਪਰਿਵਾਰ ਨੂੰ ਫ਼ੋਨ ਕਰੇਗੀ — ਪੁਲਿਸ ਨੂੰ ਨਹੀਂ (ਵਾਣੀ ਪ੍ਰੋਟੋਕੋਲ)।',
      ur:'صرف رہنمائی کے لیے۔ بڑے مسائل کے لیے → تربیت یافتہ مکینک سے ملیں۔ ہنگامی صورتحال میں چِٹی خاندان کو فون کرے گی — پولیس کو نہیں (وانی پروٹوکول)۔',
      as:'কেৱল পথ প্ৰদৰ্শনৰ বাবে। ডাঙৰ সমস্যাৰ বাবে → প্ৰশিক্ষিত মেকানিকক লগ পাওক। জৰুৰীকালীন সময়ত চিট্টিয়ে পৰিয়ালক ফোন কৰিব — আৰক্ষীক নহয় (বাণী প্ৰটোকল)।',
    },
    'disc.full': {
      en:'Full text', hi:'पूरा पाठ', bn:'সম্পূর্ণ পাঠ্য', te:'పూర్తి వచనం',
      ta:'முழு உரை', kn:'ಪೂರ್ಣ ಪಠ್ಯ', ml:'പൂർണ്ണ വാചകം', mr:'पूर्ण मजकूर',
      gu:'સંપૂર્ણ લખાણ', or:'ସମ୍ପୂର୍ଣ୍ଣ ପାଠ', pa:'ਪੂਰਾ ਪਾਠ', ur:'مکمل متن', as:'সম্পূৰ্ণ পাঠ',
    },

    // ── HEADER BUTTONS ──────────────────────────────────────────────────
    'cta.ask':    {en:'🎙️ Ask Chitti', hi:'🎙️ चिट्टी से पूछें', bn:'🎙️ চিট্টিকে জিজ্ঞেস করুন', te:'🎙️ చిట్టిని అడగండి', ta:'🎙️ சிட்டியிடம் கேளுங்கள்', kn:'🎙️ ಚಿಟ್ಟಿಯನ್ನು ಕೇಳಿ', ml:'🎙️ ചിട്ടിയോട് ചോദിക്കൂ', mr:'🎙️ चिट्टीला विचारा', gu:'🎙️ ચિટ્ટીને પૂછો', or:'🎙️ ଚିଟିଙ୍କୁ ପଚାରନ୍ତୁ', pa:'🎙️ ਚਿੱਟੀ ਨੂੰ ਪੁੱਛੋ', ur:'🎙️ چِٹی سے پوچھیں', as:'🎙️ চিট্টিক সুধক'},
    'cta.what':   {en:'💡 What can Chitti do?', hi:'💡 चिट्टी क्या कर सकती है?', bn:'💡 চিট্টি কী করতে পারে?', te:'💡 చిట్టి ఏం చేయగలదు?', ta:'💡 சிட்டி என்ன செய்ய முடியும்?', kn:'💡 ಚಿಟ್ಟಿ ಏನು ಮಾಡಬಲ್ಲದು?', ml:'💡 ചിട്ടി എന്ത് ചെയ്യാൻ കഴിയും?', mr:'💡 चिट्टी काय करू शकते?', gu:'💡 ચિટ્ટી શું કરી શકે?', or:'💡 ଚିଟି କ\'ଣ କରିପାରେ?', pa:'💡 ਚਿੱਟੀ ਕੀ ਕਰ ਸਕਦੀ ਹੈ?', ur:'💡 چِٹی کیا کر سکتی ہے؟', as:'💡 চিট্টিয়ে কি কৰিব পাৰে?'},
    'cta.bike':   {en:'🛠️ My Bike', hi:'🛠️ मेरी बाइक', bn:'🛠️ আমার বাইক', te:'🛠️ నా బైక్', ta:'🛠️ என் பைக்', kn:'🛠️ ನನ್ನ ಬೈಕ್', ml:'🛠️ എന്റെ ബൈക്ക്', mr:'🛠️ माझी बाईक', gu:'🛠️ મારી બાઇક', or:'🛠️ ମୋର ବାଇକ', pa:'🛠️ ਮੇਰੀ ਬਾਈਕ', ur:'🛠️ میری بائیک', as:'🛠️ মোৰ বাইক'},
    'cta.car':    {en:'🛠️ My Car', hi:'🛠️ मेरी कार', bn:'🛠️ আমার গাড়ি', te:'🛠️ నా కారు', ta:'🛠️ என் கார்', kn:'🛠️ ನನ್ನ ಕಾರು', ml:'🛠️ എന്റെ കാർ', mr:'🛠️ माझी कार', gu:'🛠️ મારી કાર', or:'🛠️ ମୋର କାର', pa:'🛠️ ਮੇਰੀ ਕਾਰ', ur:'🛠️ میری کار', as:'🛠️ মোৰ কাৰ'},
    'cta.sos':    {en:'🆘 SOS', hi:'🆘 आपदा', bn:'🆘 জরুরী', te:'🆘 ఎస్‌ఓఎస్', ta:'🆘 அவசரம்', kn:'🆘 ತುರ್ತು', ml:'🆘 അടിയന്തരം', mr:'🆘 आपत्कालीन', gu:'🆘 ઇમરજન્સી', or:'🆘 ଜରୁରୀ', pa:'🆘 ਐਮਰਜੈਂਸੀ', ur:'🆘 ایمرجنسی', as:'🆘 জৰুৰী'},

    // ── TABS (shared 2W ↔ 4W where possible) ─────────────────────────────
    'tab.home':        {en:'🏠 Home', hi:'🏠 होम', bn:'🏠 হোম', te:'🏠 హోమ్', ta:'🏠 முகப்பு', kn:'🏠 ಮುಖಪುಟ', ml:'🏠 ഹോം', mr:'🏠 होम', gu:'🏠 હોમ', or:'🏠 ହୋମ', pa:'🏠 ਹੋਮ', ur:'🏠 ہوم', as:'🏠 হ\'ম'},
    'tab.profile.bike':{en:'🛠️ My Bike', hi:'🛠️ मेरी बाइक', bn:'🛠️ আমার বাইক', te:'🛠️ నా బైక్', ta:'🛠️ என் பைக்', kn:'🛠️ ನನ್ನ ಬೈಕ್', ml:'🛠️ എന്റെ ബൈക്ക്', mr:'🛠️ माझी बाईक', gu:'🛠️ મારી બાઇક', or:'🛠️ ମୋର ବାଇକ', pa:'🛠️ ਮੇਰੀ ਬਾਈਕ', ur:'🛠️ میری بائیک', as:'🛠️ মোৰ বাইক'},
    'tab.profile.car': {en:'🛠️ My Car',  hi:'🛠️ मेरी कार',  bn:'🛠️ আমার গাড়ি', te:'🛠️ నా కారు', ta:'🛠️ என் கார்', kn:'🛠️ ನನ್ನ ಕಾರು', ml:'🛠️ എന്റെ കാർ', mr:'🛠️ माझी कार', gu:'🛠️ મારી કાર', or:'🛠️ ମୋର କାର', pa:'🛠️ ਮੇਰੀ ਕਾਰ', ur:'🛠️ میری کار', as:'🛠️ মোৰ কাৰ'},
    'tab.health':      {en:'❤️ Health', hi:'❤️ स्वास्थ्य', bn:'❤️ স্বাস্থ্য', te:'❤️ ఆరోగ్యం', ta:'❤️ உடல்நலம்', kn:'❤️ ಆರೋಗ್ಯ', ml:'❤️ ആരോഗ്യം', mr:'❤️ आरोग्य', gu:'❤️ આરોગ્ય', or:'❤️ ସ୍ୱାସ୍ଥ୍ୟ', pa:'❤️ ਸਿਹਤ', ur:'❤️ صحت', as:'❤️ স্বাস্থ্য'},
    'tab.maint':       {en:'🔧 Maintenance', hi:'🔧 रखरखाव', bn:'🔧 রক্ষণাবেক্ষণ', te:'🔧 నిర్వహణ', ta:'🔧 பராமரிப்பு', kn:'🔧 ನಿರ್ವಹಣೆ', ml:'🔧 പരിപാലനം', mr:'🔧 देखभाल', gu:'🔧 જાળવણી', or:'🔧 ରକ୍ଷଣାବେକ୍ଷଣ', pa:'🔧 ਰੱਖ-ਰਖਾਅ', ur:'🔧 دیکھ بھال', as:'🔧 ৰক্ষণাবেক্ষণ'},
    'tab.breakdown':   {en:'🛣️ Breakdown', hi:'🛣️ ख़राबी', bn:'🛣️ ব্রেকডাউন', te:'🛣️ ఆగిపోయింది', ta:'🛣️ பழுது', kn:'🛣️ ಬ್ರೇಕ್‌ಡೌನ್', ml:'🛣️ ബ്രേക്ക്ഡൗൺ', mr:'🛣️ बिघाड', gu:'🛣️ બંધ પડી', or:'🛣️ ଅଚଳ', pa:'🛣️ ਖ਼ਰਾਬੀ', ur:'🛣️ خرابی', as:'🛣️ অচল'},
    'tab.sos':         {en:'🆘 SOS / Theft', hi:'🆘 आपात / चोरी', bn:'🆘 জরুরী / চুরি', te:'🆘 ఎస్‌ఓఎస్ / దొంగతనం', ta:'🆘 அவசரம் / திருட்டு', kn:'🆘 ತುರ್ತು / ಕಳ್ಳತನ', ml:'🆘 അടിയന്തരം / മോഷണം', mr:'🆘 आपत्कालीन / चोरी', gu:'🆘 ઇમરજન્સી / ચોરી', or:'🆘 ଜରୁରୀ / ଚୋରୀ', pa:'🆘 ਐਮਰਜੈਂਸੀ / ਚੋਰੀ', ur:'🆘 ایمرجنسی / چوری', as:'🆘 জৰুৰী / চুৰি'},
    'tab.docs':        {en:'📄 Documents', hi:'📄 दस्तावेज़', bn:'📄 কাগজপত্র', te:'📄 పత్రాలు', ta:'📄 ஆவணங்கள்', kn:'📄 ದಾಖಲೆಗಳು', ml:'📄 രേഖകൾ', mr:'📄 कागदपत्रे', gu:'📄 દસ્તાવેજો', or:'📄 ଦଲିଲ', pa:'📄 ਦਸਤਾਵੇਜ਼', ur:'📄 دستاویزات', as:'📄 কাগজ-পত্ৰ'},
    'tab.fuel':        {en:'⛽ Fuel', hi:'⛽ ईंधन', bn:'⛽ জ্বালানি', te:'⛽ ఇంధనం', ta:'⛽ எரிபொருள்', kn:'⛽ ಇಂಧನ', ml:'⛽ ഇന്ധനം', mr:'⛽ इंधन', gu:'⛽ ઇંધણ', or:'⛽ ତେଲ', pa:'⛽ ਬਾਲਣ', ur:'⛽ ایندھن', as:'⛽ ইন্ধন'},
    'tab.mech':        {en:'🧰 Mechanic', hi:'🧰 मैकेनिक', bn:'🧰 মেকানিক', te:'🧰 మెకానిక్', ta:'🧰 மெக்கானிக்', kn:'🧰 ಮೆಕ್ಯಾನಿಕ್', ml:'🧰 മെക്കാനിക്', mr:'🧰 मेकॅनिक', gu:'🧰 મિકેનિક', or:'🧰 ମେକାନିକ', pa:'🧰 ਮਕੈਨਿਕ', ur:'🧰 مکینک', as:'🧰 মেকানিক'},
    'tab.parts':       {en:'⚙️ Parts', hi:'⚙️ पुर्ज़े', bn:'⚙️ যন্ত্রাংশ', te:'⚙️ విడిభాగాలు', ta:'⚙️ உதிரிபாகங்கள்', kn:'⚙️ ಬಿಡಿಭಾಗಗಳು', ml:'⚙️ പാർട്സ്', mr:'⚙️ सुटे भाग', gu:'⚙️ સ્પેર પાર્ટ્સ', or:'⚙️ ଯନ୍ତ୍ରାଂଶ', pa:'⚙️ ਪੁਰਜ਼ੇ', ur:'⚙️ پرزے', as:'⚙️ যন্ত্ৰাংশ'},
    'tab.community':   {en:'👥 Community', hi:'👥 समुदाय', bn:'👥 সম্প্রদায়', te:'👥 సమాజం', ta:'👥 சமூகம்', kn:'👥 ಸಮುದಾಯ', ml:'👥 സമൂഹം', mr:'👥 समुदाय', gu:'👥 સમુદાય', or:'👥 ସମ୍ପ୍ରଦାୟ', pa:'👥 ਭਾਈਚਾਰਾ', ur:'👥 برادری', as:'👥 সম্প্ৰদায়'},
    'tab.resale':      {en:'💰 Resale', hi:'💰 पुनर्विक्रय', bn:'💰 পুনর্বিক্রয়', te:'💰 పునఃవిక్రయం', ta:'💰 மறுவிற்பனை', kn:'💰 ಮರುಮಾರಾಟ', ml:'💰 പുനർവിൽപ്പന', mr:'💰 पुनर्विक्री', gu:'💰 પુનઃવેચાણ', or:'💰 ପୁନଃବିକ୍ରୟ', pa:'💰 ਮੁੜ-ਵਿਕਰੀ', ur:'💰 دوبارہ فروخت', as:'💰 পুনৰ বিক্ৰী'},
    'tab.ins':         {en:'🛡️ Insurance / Loan', hi:'🛡️ बीमा / लोन', bn:'🛡️ বীমা / ঋণ', te:'🛡️ బీమా / రుణం', ta:'🛡️ காப்பீடு / கடன்', kn:'🛡️ ವಿಮೆ / ಸಾಲ', ml:'🛡️ ഇൻഷുറൻസ് / ലോൺ', mr:'🛡️ विमा / कर्ज', gu:'🛡️ વીમો / લોન', or:'🛡️ ବୀମା / ଋଣ', pa:'🛡️ ਬੀਮਾ / ਕਰਜ਼ਾ', ur:'🛡️ بیمہ / قرض', as:'🛡️ বীমা / ঋণ'},
    'tab.drive':       {en:'🎯 Drive Score', hi:'🎯 ड्राइव स्कोर', bn:'🎯 ড্রাইভ স্কোর', te:'🎯 డ్రైవ్ స్కోర్', ta:'🎯 ஓட்டுதல் மதிப்பெண்', kn:'🎯 ಡ್ರೈವ್ ಸ್ಕೋರ್', ml:'🎯 ഡ്രൈവ് സ്കോർ', mr:'🎯 ड्राइव्ह स्कोर', gu:'🎯 ડ્રાઇવ સ્કોર', or:'🎯 ଡ୍ରାଇଭ ସ୍କୋର', pa:'🎯 ਡਰਾਈਵ ਸਕੋਰ', ur:'🎯 ڈرائیو سکور', as:'🎯 ড্ৰাইভ স্ক\'ৰ'},
    'tab.ask':         {en:'🎙️ Ask Chitti', hi:'🎙️ चिट्टी से पूछें', bn:'🎙️ চিট্টিকে জিজ্ঞেস করুন', te:'🎙️ చిట్టిని అడగండి', ta:'🎙️ சிட்டியிடம் கேளுங்கள்', kn:'🎙️ ಚಿಟ್ಟಿಯನ್ನು ಕೇಳಿ', ml:'🎙️ ചിട്ടിയോട് ചോദിക്കൂ', mr:'🎙️ चिट्टीला विचारा', gu:'🎙️ ચિટ્ટીને પૂછો', or:'🎙️ ଚିଟିଙ୍କୁ ପଚାରନ୍ତୁ', pa:'🎙️ ਚਿੱਟੀ ਨੂੰ ਪੁੱਛੋ', ur:'🎙️ چِٹی سے پوچھیں', as:'🎙️ চিট্টিক সুধক'},

    // ── HOME STATUS LABELS ──────────────────────────────────────────────
    'home.title.bike':  {en:"Your bike's status", hi:'आपकी बाइक का हाल', bn:'আপনার বাইকের অবস্থা', te:'మీ బైక్ స్థితి', ta:'உங்கள் பைக் நிலை', kn:'ನಿಮ್ಮ ಬೈಕ್ ಸ್ಥಿತಿ', ml:'നിങ്ങളുടെ ബൈക്കിന്റെ അവസ്ഥ', mr:'तुमच्या बाईकची स्थिती', gu:'તમારી બાઇકની સ્થિતિ', or:'ଆପଣଙ୍କ ବାଇକର ସ୍ଥିତି', pa:'ਤੁਹਾਡੀ ਬਾਈਕ ਦੀ ਸਥਿਤੀ', ur:'آپ کی بائیک کی حالت', as:'আপোনাৰ বাইকৰ অৱস্থা'},
    'home.title.car':   {en:"Your car's status", hi:'आपकी कार का हाल', bn:'আপনার গাড়ির অবস্থা', te:'మీ కారు స్థితి', ta:'உங்கள் கார் நிலை', kn:'ನಿಮ್ಮ ಕಾರಿನ ಸ್ಥಿತಿ', ml:'നിങ്ങളുടെ കാറിന്റെ അവസ്ഥ', mr:'तुमच्या कारची स्थिती', gu:'તમારી કારની સ્થિતિ', or:'ଆପଣଙ୍କ କାରର ସ୍ଥିତି', pa:'ਤੁਹਾਡੀ ਕਾਰ ਦੀ ਸਥਿਤੀ', ur:'آپ کی کار کی حالت', as:'আপোনাৰ কাৰৰ অৱস্থা'},
    'home.lbl.bike':    {en:'Bike', hi:'बाइक', bn:'বাইক', te:'బైక్', ta:'பைக்', kn:'ಬೈಕ್', ml:'ബൈക്ക്', mr:'बाईक', gu:'બાઇક', or:'ବାଇକ', pa:'ਬਾਈਕ', ur:'بائیک', as:'বাইক'},
    'home.lbl.car':     {en:'Car', hi:'कार', bn:'গাড়ি', te:'కారు', ta:'கார்', kn:'ಕಾರು', ml:'കാർ', mr:'कार', gu:'કાર', or:'କାର', pa:'ਕਾਰ', ur:'کار', as:'কাৰ'},
    'home.lbl.odo':     {en:'Odometer', hi:'ओडोमीटर (किमी)', bn:'ওডোমিটার', te:'ఓడోమీటర్', ta:'ஓடோமீட்டர்', kn:'ಓಡೋಮೀಟರ್', ml:'ഓഡോമീറ്റർ', mr:'ओडोमीटर', gu:'ઓડોમીટર', or:'ଓଡୋମିଟର', pa:'ਓਡੋਮੀਟਰ', ur:'اوڈومیٹر', as:'অ\'ড\'মিটাৰ'},
    'home.lbl.next':    {en:'Next service', hi:'अगली सेवा', bn:'পরবর্তী সার্ভিস', te:'తదుపరి సర్వీస్', ta:'அடுத்த சேவை', kn:'ಮುಂದಿನ ಸೇವೆ', ml:'അടുത്ത സർവീസ്', mr:'पुढील सेवा', gu:'આગલી સર્વિસ', or:'ପରବର୍ତ୍ତୀ ସେବା', pa:'ਅਗਲੀ ਸੇਵਾ', ur:'اگلی سروس', as:'পৰৱৰ্তী সেৱা'},
    'home.lbl.docs':    {en:'Docs expiring', hi:'दस्तावेज़ ख़त्म', bn:'কাগজ মেয়াদ', te:'పత్రాలు ముగుస్తాయి', ta:'ஆவணங்கள் முடிகின்றன', kn:'ದಾಖಲೆಗಳು ಮುಗಿಯುತ್ತಿವೆ', ml:'രേഖകൾ കാലഹരണപ്പെടുന്നു', mr:'कागदपत्रे संपणार', gu:'દસ્તાવેજો સમાપ્ત થાય', or:'ଦଲିଲର ସମୟ ସରୁଛି', pa:'ਦਸਤਾਵੇਜ਼ ਖ਼ਤਮ ਹੋ ਰਹੇ', ur:'دستاویزات ختم ہو رہی', as:'কাগজৰ অৱধি শেষ'},
    'home.lbl.alerts':  {en:'Open alerts', hi:'खुले अलर्ट', bn:'খোলা সতর্কতা', te:'తెరిచిన హెచ్చరికలు', ta:'திறந்த எச்சரிக்கைகள்', kn:'ತೆರೆದ ಎಚ್ಚರಿಕೆಗಳು', ml:'തുറന്ന അലേർട്ടുകൾ', mr:'खुले इशारे', gu:'ખુલ્લા એલર્ટ', or:'ଖୋଲା ସତର୍କତା', pa:'ਖੁੱਲ੍ਹੀਆਂ ਚੇਤਾਵਨੀਆਂ', ur:'کھلے الرٹس', as:'মুকলি সতৰ্কবাণী'},

    // ── BADGES ──────────────────────────────────────────────────────────
    'badge.live':  {en:'Live', hi:'लाइव', bn:'লাইভ', te:'లైవ్', ta:'நேரடி', kn:'ಲೈವ್', ml:'ലൈവ്', mr:'लाइव्ह', gu:'લાઇવ', or:'ଲାଇଭ', pa:'ਲਾਈਵ', ur:'لائیو', as:'লাইভ'},
    'badge.cs':    {en:'Coming Soon', hi:'जल्द आ रहा है', bn:'শীঘ্রই আসছে', te:'త్వరలో వస్తోంది', ta:'விரைவில் வரும்', kn:'ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ', ml:'ഉടൻ വരുന്നു', mr:'लवकरच येणार', gu:'જલ્દી આવી રહ્યું', or:'ଶୀଘ୍ର ଆସୁଛି', pa:'ਜਲਦੀ ਆ ਰਿਹਾ', ur:'جلد آ رہا', as:'সোনকালে আহিব'},
    'badge.future':{en:'Future', hi:'भविष्य', bn:'ভবিষ্যৎ', te:'భవిష్యత్తు', ta:'எதிர்காலம்', kn:'ಭವಿಷ್ಯ', ml:'ഭാവി', mr:'भविष्य', gu:'ભવિષ્ય', or:'ଭବିଷ୍ୟତ', pa:'ਭਵਿੱਖ', ur:'مستقبل', as:'ভৱিষ্যত'},
    'badge.p0':    {en:'P0', hi:'P0', bn:'P0', te:'P0', ta:'P0', kn:'P0', ml:'P0', mr:'P0', gu:'P0', or:'P0', pa:'P0', ur:'P0', as:'P0'},
    'badge.chitti':{en:'Chitti Special', hi:'चिट्टी ख़ास', bn:'চিট্টি স্পেশাল', te:'చిట్టి ప్రత్యేకం', ta:'சிட்டி சிறப்பு', kn:'ಚಿಟ್ಟಿ ವಿಶೇಷ', ml:'ചിട്ടി പ്രത്യേകം', mr:'चिट्टी विशेष', gu:'ચિટ્ટી ખાસ', or:'ଚିଟି ବିଶେଷ', pa:'ਚਿੱਟੀ ਖ਼ਾਸ', ur:'چِٹی خاص', as:'চিট্টি বিশেষ'},

    // ── COMMON CTAs ─────────────────────────────────────────────────────
    'btn.save':   {en:'💾 Save', hi:'💾 सहेजें', bn:'💾 সংরক্ষণ', te:'💾 సేవ్', ta:'💾 சேமி', kn:'💾 ಉಳಿಸಿ', ml:'💾 സേവ് ചെയ്യൂ', mr:'💾 जतन करा', gu:'💾 સાચવો', or:'💾 ସଞ୍ଚୟ', pa:'💾 ਸੁਰੱਖਿਅਤ ਕਰੋ', ur:'💾 محفوظ کریں', as:'💾 ৰক্ষা কৰক'},
    'btn.load':   {en:'📥 Load', hi:'📥 लोड करें', bn:'📥 লোড', te:'📥 లోడ్', ta:'📥 ஏற்று', kn:'📥 ಲೋಡ್', ml:'📥 ലോഡ് ചെയ്യൂ', mr:'📥 लोड', gu:'📥 લોડ કરો', or:'📥 ଲୋଡ', pa:'📥 ਲੋਡ ਕਰੋ', ur:'📥 لوڈ کریں', as:'📥 লোড কৰক'},
    'btn.ok':     {en:'OK · Theek hai', hi:'ठीक है', bn:'ঠিক আছে', te:'సరే', ta:'சரி', kn:'ಸರಿ', ml:'ശരി', mr:'ठीक आहे', gu:'બરાબર', or:'ଠିକ୍', pa:'ਠੀਕ ਹੈ', ur:'ٹھیک ہے', as:'ঠিক আছে'},

    // ── FOOTER ──────────────────────────────────────────────────────────
    'foot.spec': {en:'Spec at FEATURES.md', hi:'FEATURES.md पर विवरण', bn:'FEATURES.md এ স্পেক', te:'FEATURES.md లో స్పెక్', ta:'FEATURES.md இல் விவரக்குறிப்பு', kn:'FEATURES.md ನಲ್ಲಿ ವಿವರಣೆ', ml:'FEATURES.md ൽ വിശദാംശങ്ങൾ', mr:'FEATURES.md वर तपशील', gu:'FEATURES.md પર સ્પેક', or:'FEATURES.md ରେ ସ୍ପେକ', pa:'FEATURES.md ਤੇ ਵੇਰਵਾ', ur:'FEATURES.md پر تفصیل', as:'FEATURES.md ত স্পেক'},

    // ── ASK CHITTI ──────────────────────────────────────────────────────
    'ask.title': {en:'🎙️ Ask Chitti', hi:'🎙️ चिट्टी से पूछें', bn:'🎙️ চিট্টিকে জিজ্ঞেস করুন', te:'🎙️ చిట్టిని అడగండి', ta:'🎙️ சிட்டியிடம் கேளுங்கள்', kn:'🎙️ ಚಿಟ್ಟಿಯನ್ನು ಕೇಳಿ', ml:'🎙️ ചിട്ടിയോട് ചോദിക്കൂ', mr:'🎙️ चिट्टीला विचारा', gu:'🎙️ ચિટ્ટીને પૂછો', or:'🎙️ ଚିଟିଙ୍କୁ ପଚାରନ୍ତୁ', pa:'🎙️ ਚਿੱਟੀ ਨੂੰ ਪੁੱਛੋ', ur:'🎙️ چِٹی سے پوچھیں', as:'🎙️ চিট্টিক সুধক'},
    'ask.sub':   {en:'DeepSeek-powered. Plain Hinglish (or your language). Server-enforced disclaimer attached.', hi:'DeepSeek-संचालित। आसान हिंग्लिश (या आपकी भाषा)। सर्वर-लागू डिस्क्लेमर शामिल।', bn:'DeepSeek-চালিত। সহজ হিংলিশ (বা আপনার ভাষা)। সার্ভার-প্রয়োগ ডিসক্লেমার সংযুক্ত।', te:'DeepSeek-ఆధారిత. సాదా హింగ్లిష్ (లేదా మీ భాష). సర్వర్-అమలు డిస్‌క్లైమర్ జతచేయబడింది.', ta:'DeepSeek-இயக்கப்படுகிறது. எளிய இங்க்லீஷ் (அல்லது உங்கள் மொழி). சர்வர்-நடைமுறை மறுப்பு இணைக்கப்பட்டது.', kn:'DeepSeek-ಚಾಲಿತ. ಸರಳ ಹಿಂಗ್ಲಿಷ್ (ಅಥವಾ ನಿಮ್ಮ ಭಾಷೆ). ಸರ್ವರ್-ಜಾರಿ ಹಕ್ಕುತ್ಯಾಗ ಲಗತ್ತಿಸಲಾಗಿದೆ.', ml:'DeepSeek-പവേർഡ്. ലളിതമായ ഹിംഗ്ലിഷ് (അല്ലെങ്കിൽ നിങ്ങളുടെ ഭാഷ). സെർവർ-എൻഫോഴ്സ്ഡ് ഡിസ്ക്ലെയിമർ അറ്റാച്ച് ചെയ്തിരിക്കുന്നു.', mr:'DeepSeek-चालित. साधी हिंग्लिश (किंवा तुमची भाषा). सर्व्हर-लागू अस्वीकरण जोडले आहे.', gu:'DeepSeek-સંચાલિત. સરળ હિંગ્લિશ (અથવા તમારી ભાષા). સર્વર-લાગુ ડિસ્ક્લેમર જોડાયેલ.', or:'DeepSeek-ଚାଳିତ। ସରଳ ହିଂଲିଶ୍ (କିମ୍ବା ଆପଣଙ୍କ ଭାଷା)। ସର୍ଭର-ଲାଗୁ ଡିସ୍କ୍ଲେମର ସଂଲଗ୍ନ।', pa:'DeepSeek-ਚਾਲਿਤ। ਸਾਦੀ ਹਿੰਗਲਿਸ਼ (ਜਾਂ ਤੁਹਾਡੀ ਭਾਸ਼ਾ)। ਸਰਵਰ-ਲਾਗੂ ਡਿਸਕਲੇਮਰ ਨੱਥੀ।', ur:'DeepSeek سے چلتا ہے۔ سادہ ہنگلش (یا آپ کی زبان)۔ سرور پر نافذ کردہ ڈسکلیمر منسلک ہے۔', as:'DeepSeek-চালিত। সৰল হিংলিছ (বা আপোনাৰ ভাষা)। চাৰ্ভাৰ-প্ৰযোজ্য ডিছক্লেইমাৰ সংযুক্ত।'},
    'ask.placeholder':{en:'Type your question…', hi:'अपना सवाल लिखें…', bn:'আপনার প্রশ্ন লিখুন…', te:'మీ ప్రశ్నను టైప్ చేయండి…', ta:'உங்கள் கேள்வியை தட்டச்சு செய்க…', kn:'ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ…', ml:'നിങ്ങളുടെ ചോദ്യം ടൈപ്പ് ചെയ്യൂ…', mr:'तुमचा प्रश्न टाइप करा…', gu:'તમારો પ્રશ્ન લખો…', or:'ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ…', pa:'ਆਪਣਾ ਸਵਾਲ ਲਿਖੋ…', ur:'اپنا سوال لکھیں…', as:'আপোনাৰ প্ৰশ্ন টাইপ কৰক…'},

    // ── UNSUPPORTED LANG NOTICE ────────────────────────────────────────
    // Shown when the user picks a Voice Factory language outside the 13
    // we've fully translated. Honest stub: voice + content already work,
    // chrome UI translation is queued.
    'unsupp.notice': {
      en:'UI translation for "{lang}" is queued — falling back to Hindi for buttons + labels. Your voice + Chitti answers are already in {lang}.',
      hi:'"{lang}" के लिए यूआई अनुवाद कतार में है — बटन + लेबल हिंदी में रहेंगे। आपकी आवाज़ और चिट्टी के जवाब पहले से ही {lang} में हैं।',
    },
  };

  // ── T_EXTRA: sister-Devanagari language translations (2026-05-14) ─────
  // Merged into T at module init. Keys mirror the main T map exactly so
  // a missing key here = fall through to the main-T en/hi (same logic
  // as before). Community refinements welcome via the Voice Hall of Fame.
  // Translation provenance: drafted by Chitti maintainers against the
  // primary T entries; pending native-speaker QA from each language
  // community (especially Bhojpuri, Maithili, Konkani regional dialects).
  var T_EXTRA = {
    'hdr.bike.tagline': {
      sa:'भारतस्य प्रथमवाणी-बाइक-सहचरः · पूर्वज्ञानम् · पुनरारम्भः · रक्षा',
      ne:'भारतको आवाज-पहिलो बाइक साथी · पहिले नै बताउने · पुनः सुरु गर्ने · बचाउने',
      mai:'भारतक आवाज-पहिल बाइक संगी · पहिनहि कहैत · फेर शुरू करैत · बचबैत',
      bho:'भारत के आवाज-पहिले बाइक साथी · पहिलहीं बतावे · फेर चालू करे · बचावे',
      hne:'भारत के आवाज-पहिली बाइक संगवारी · पहिली बतावे · फेर चालू करे · बचाये',
      kok:'भारताचो आवाज-पयलो बाइक संगाती · आदींच सांगता · परत सुरू करता · वाटयता',
    },
    'hdr.car.tagline': {
      sa:'भारतस्य प्रथमवाणी-कार-सहचरः · पूर्वज्ञानम् · संकेतविवरणम् · रक्षा',
      ne:'भारतको आवाज-पहिलो कार साथी · पहिले नै बताउने · कोड बुझाउने · बचाउने',
      mai:'भारतक आवाज-पहिल कार संगी · पहिनहि कहैत · कोड बुझबैत · बचबैत',
      bho:'भारत के आवाज-पहिले कार साथी · पहिलहीं बतावे · कोड समझावे · बचावे',
      hne:'भारत के आवाज-पहिली कार संगवारी · पहिली बतावे · कोड समझाये · बचाये',
      kok:'भारताचो आवाज-पयलो कार संगाती · आदींच सांगता · कोड समजायता · वाटयता',
    },
    'disc.notmech': {
      sa:'मेकानिकः न अस्मि।', ne:'म मेकानिक होइन।', mai:'हम मेकानिक नहि छी।',
      bho:'हम मेकानिक नइखीं।', hne:'मैं मेकानिक नइ अंव।', kok:'हांव मेकानिक न्हय।',
    },
    'disc.body': {
      sa:'मार्गदर्शनमात्रम्। महत्त्वपूर्णसमस्यासु → प्रशिक्षितमेकानिकं मिल। आपत्काले चिट्टी कुटुम्बम् आह्वयति — आरक्षकान् न (वाणी-प्रोटोकॉल)।',
      ne:'मार्गदर्शनको लागि मात्र। ठूला समस्याहरूका लागि → प्रशिक्षित मेकानिकसँग भेट्नुहोस्। आपत्कालमा चिट्टीले परिवारलाई फोन गर्छ — प्रहरीलाई होइन (वाणी प्रोटोकल)।',
      mai:'मात्र मार्गदर्शन लेल। पैघ समस्या लेल → प्रशिक्षित मेकानिक सँ भेट करू। आपत्काल मे चिट्टी परिवार के फोन करत — पुलिस के नहि (वाणी प्रोटोकोल)।',
      bho:'सिर्फ रास्ता देखावे खातिर। बड़ समस्या में → प्रशिक्षित मेकानिक से मिलीं। आपात में चिट्टी परिवार के फोन करी — पुलिस के ना (वाणी प्रोटोकॉल)।',
      hne:'सिरिफ मारगदरसन बर। बड़े समस्या बर → प्रसिकछित मेकानिक ले मिलव। आपात मा चिट्टी परिवार ल फोन करही — पुलिस ल नइ (वाणी प्रोटोकॉल)।',
      kok:'फकत मार्गदर्शनाक लागून। व्हडल्या समस्यांक लागून → प्रशिक्षित मेकानिकाक मेळव। आपत्काळांत चिट्टी कुटुंबाक फोन करता — पोलिसाक न्हय (वाणी प्रोटोकोल)।',
    },
    'disc.full': {
      sa:'पूर्णपाठः', ne:'पूरै पाठ', mai:'पूरा पाठ',
      bho:'पूरा पाठ', hne:'पूरा पाठ', kok:'पूर्ण मजकूर',
    },
    'cta.ask': {
      sa:'🎙️ चिट्टीतः पृच्छ', ne:'🎙️ चिट्टीलाई सोध्नुहोस्', mai:'🎙️ चिट्टी सँ पूछू',
      bho:'🎙️ चिट्टी से पूछीं', hne:'🎙️ चिट्टी ल पूछ', kok:'🎙️ चिट्टीक विचार',
    },
    'cta.what': {
      sa:'💡 चिट्टी किं कर्तुं शक्नोति?', ne:'💡 चिट्टीले के गर्न सक्छ?', mai:'💡 चिट्टी की कऽ सकय छै?',
      bho:'💡 चिट्टी का कऽ सकेला?', hne:'💡 चिट्टी का कर सकत हे?', kok:'💡 चिट्टी कितें करूंक शकता?',
    },
    'cta.bike': {
      sa:'🛠️ मम बाइकः', ne:'🛠️ मेरो बाइक', mai:'🛠️ हमर बाइक',
      bho:'🛠️ हमार बाइक', hne:'🛠️ मोर बाइक', kok:'🛠️ म्हजी बाइक',
    },
    'cta.car': {
      sa:'🛠️ मम कारः', ne:'🛠️ मेरो कार', mai:'🛠️ हमर कार',
      bho:'🛠️ हमार कार', hne:'🛠️ मोर कार', kok:'🛠️ म्हजी कार',
    },
    'cta.sos': {
      sa:'🆘 आपत्कालः', ne:'🆘 आपत्', mai:'🆘 आपात',
      bho:'🆘 आपात', hne:'🆘 आपात', kok:'🆘 आपत्काळ',
    },
    'tab.home': {
      sa:'🏠 गृहम्', ne:'🏠 गृहपृष्ठ', mai:'🏠 घर',
      bho:'🏠 घर', hne:'🏠 घर', kok:'🏠 घर',
    },
    'tab.profile.bike': {
      sa:'🛠️ मम बाइकः', ne:'🛠️ मेरो बाइक', mai:'🛠️ हमर बाइक',
      bho:'🛠️ हमार बाइक', hne:'🛠️ मोर बाइक', kok:'🛠️ म्हजी बाइक',
    },
    'tab.profile.car': {
      sa:'🛠️ मम कारः', ne:'🛠️ मेरो कार', mai:'🛠️ हमर कार',
      bho:'🛠️ हमार कार', hne:'🛠️ मोर कार', kok:'🛠️ म्हजी कार',
    },
    'tab.health': {
      sa:'❤️ स्वास्थ्यम्', ne:'❤️ स्वास्थ्य', mai:'❤️ स्वास्थ्य',
      bho:'❤️ स्वास्थ्य', hne:'❤️ सेहत', kok:'❤️ भलायकी',
    },
    'tab.maint': {
      sa:'🔧 परिरक्षणम्', ne:'🔧 रखरखाव', mai:'🔧 देखभाल',
      bho:'🔧 देखभाल', hne:'🔧 देखरेख', kok:'🔧 निगा',
    },
    'tab.breakdown': {
      sa:'🛣️ विकलता', ne:'🛣️ बिग्रिएको', mai:'🛣️ खराब',
      bho:'🛣️ खराबी', hne:'🛣️ बिगड़ना', kok:'🛣️ मोडकोड',
    },
    'tab.sos': {
      sa:'🆘 आपत् / चौर्यम्', ne:'🆘 आपत् / चोरी', mai:'🆘 आपात / चोरी',
      bho:'🆘 आपात / चोरी', hne:'🆘 आपात / चोरी', kok:'🆘 आपत्काळ / चोरी',
    },
    'tab.docs': {
      sa:'📄 दस्तावेजाः', ne:'📄 कागजात', mai:'📄 कागजात',
      bho:'📄 कागजात', hne:'📄 कागजात', kok:'📄 दस्तावेज',
    },
    'tab.fuel': {
      sa:'⛽ इन्धनम्', ne:'⛽ इन्धन', mai:'⛽ ईंधन',
      bho:'⛽ तेल', hne:'⛽ ईंधन', kok:'⛽ इंधन',
    },
    'tab.mech': {
      sa:'🧰 मेकानिकः', ne:'🧰 मेकानिक', mai:'🧰 मेकानिक',
      bho:'🧰 मेकानिक', hne:'🧰 मेकानिक', kok:'🧰 मेकानिक',
    },
    'tab.parts': {
      sa:'⚙️ भागाः', ne:'⚙️ पार्ट्स', mai:'⚙️ पुर्जा',
      bho:'⚙️ पुर्जा', hne:'⚙️ पुर्जा', kok:'⚙️ पार्ट्स',
    },
    'tab.community': {
      sa:'👥 समुदायः', ne:'👥 समुदाय', mai:'👥 समुदाय',
      bho:'👥 समुदाय', hne:'👥 समुदाय', kok:'👥 समाज',
    },
    'tab.resale': {
      sa:'💰 पुनर्विक्रयम्', ne:'💰 पुनर्बिक्री', mai:'💰 पुनर्बिक्री',
      bho:'💰 दोबारा बिक्री', hne:'💰 फेर बिक्री', kok:'💰 पुनर्विक्री',
    },
    'tab.ins': {
      sa:'🛡️ बीमा / ऋणम्', ne:'🛡️ बीमा / ऋण', mai:'🛡️ बीमा / लोन',
      bho:'🛡️ बीमा / लोन', hne:'🛡️ बीमा / लोन', kok:'🛡️ विमो / कर्ज',
    },
    'tab.drive': {
      sa:'🎯 चालन-अंकः', ne:'🎯 ड्राइभ स्कोर', mai:'🎯 ड्राइव स्कोर',
      bho:'🎯 ड्राइव स्कोर', hne:'🎯 ड्राइव स्कोर', kok:'🎯 ड्राइव्ह स्कोर',
    },
    'tab.ask': {
      sa:'🎙️ चिट्टीतः पृच्छ', ne:'🎙️ चिट्टीलाई सोध्नुहोस्', mai:'🎙️ चिट्टी सँ पूछू',
      bho:'🎙️ चिट्टी से पूछीं', hne:'🎙️ चिट्टी ल पूछ', kok:'🎙️ चिट्टीक विचार',
    },
    'home.title.bike': {
      sa:'तव बाइकस्य स्थितिः', ne:'तपाईंको बाइकको अवस्था', mai:'अपनेक बाइक के स्थिति',
      bho:'रउरा बाइक के हाल', hne:'तोर बाइक के हाल', kok:'तुजे बाइकेची स्थिती',
    },
    'home.title.car': {
      sa:'तव कारस्य स्थितिः', ne:'तपाईंको कारको अवस्था', mai:'अपनेक कार के स्थिति',
      bho:'रउरा कार के हाल', hne:'तोर कार के हाल', kok:'तुजे कारेची स्थिती',
    },
    'home.lbl.bike': {
      sa:'बाइकः', ne:'बाइक', mai:'बाइक', bho:'बाइक', hne:'बाइक', kok:'बाइक',
    },
    'home.lbl.car': {
      sa:'कारः', ne:'कार', mai:'कार', bho:'कार', hne:'कार', kok:'कार',
    },
    'home.lbl.odo': {
      sa:'ओडोमीटरम्', ne:'ओडोमिटर', mai:'ओडोमीटर',
      bho:'ओडोमीटर', hne:'ओडोमीटर', kok:'ओडोमीटर',
    },
    'home.lbl.next': {
      sa:'अग्रिमसेवा', ne:'अर्को सेवा', mai:'अगिला सेवा',
      bho:'अगिला सर्विस', hne:'अगला सर्विस', kok:'फुडली सेवा',
    },
    'home.lbl.docs': {
      sa:'दस्तावेजसमाप्तिः', ne:'कागज सकिने', mai:'कागज समाप्त',
      bho:'कागज खतम', hne:'कागज खतम होही', kok:'कागद संपता',
    },
    'home.lbl.alerts': {
      sa:'सतर्कताः', ne:'खुला सतर्कता', mai:'खुजल सतर्कता',
      bho:'खुलल अलर्ट', hne:'खुले चेतावनी', kok:'उगडलेले सूचना',
    },
    'badge.live': {
      sa:'जीवन्तम्', ne:'लाइभ', mai:'लाइव', bho:'लाइव', hne:'लाइव', kok:'लाइव्ह',
    },
    'badge.cs': {
      sa:'शीघ्रम् आगच्छति', ne:'चाँडै आउँदै', mai:'जल्दिए आबि रहल',
      bho:'जल्दी आ रहल', hne:'जल्दी आही', kok:'बेगिन येता',
    },
    'badge.future': {
      sa:'भविष्यम्', ne:'भविष्य', mai:'भविष्य',
      bho:'भविष्य', hne:'भविष्य', kok:'फुडारी',
    },
    'badge.p0': { sa:'P0', ne:'P0', mai:'P0', bho:'P0', hne:'P0', kok:'P0' },
    'badge.chitti': {
      sa:'चिट्टी-विशेषम्', ne:'चिट्टी विशेष', mai:'चिट्टी विशेष',
      bho:'चिट्टी ख़ास', hne:'चिट्टी ख़ास', kok:'चिट्टी विशेष',
    },
    'btn.save': {
      sa:'💾 रक्ष', ne:'💾 सुरक्षित गर्नुहोस्', mai:'💾 सहेजू',
      bho:'💾 सेव करीं', hne:'💾 सहेजव', kok:'💾 जतनाय करा',
    },
    'btn.load': {
      sa:'📥 आरोप', ne:'📥 लोड गर्नुहोस्', mai:'📥 लोड करू',
      bho:'📥 लोड करीं', hne:'📥 लोड करव', kok:'📥 लोड करा',
    },
    'btn.ok': {
      sa:'ठीक अस्ति', ne:'ठीक छ', mai:'ठीक अछि',
      bho:'ठीक बा', hne:'ठीक हे', kok:'बरें',
    },
    'foot.spec': {
      sa:'FEATURES.md इति निर्देशनम्', ne:'FEATURES.md मा विवरण',
      mai:'FEATURES.md मे विवरण', bho:'FEATURES.md पर विवरण',
      hne:'FEATURES.md मा विवरण', kok:'FEATURES.md वयल तपशील',
    },
    'ask.title': {
      sa:'🎙️ चिट्टीतः पृच्छ', ne:'🎙️ चिट्टीलाई सोध्नुहोस्', mai:'🎙️ चिट्टी सँ पूछू',
      bho:'🎙️ चिट्टी से पूछीं', hne:'🎙️ चिट्टी ल पूछ', kok:'🎙️ चिट्टीक विचार',
    },
    'ask.sub': {
      sa:'डीप-सीक-चालितम्। सरल हिंगलिश (वा भवतः भाषा)। सर्वर-निर्धारित-अस्वीकरणं सहैव।',
      ne:'डिपसीक-संचालित। साधारण हिङ्ग्लिस (वा तपाईंको भाषा)। सर्भर-लागू अस्वीकरण समावेश।',
      mai:'डीपसीक-संचालित। सरल हिंगलिश (वा अपनेक भाषा)। सर्वर-लागू अस्वीकरण संग।',
      bho:'डीपसीक से चलेला। सरल हिंगलिश (या रउरा भाषा)। सर्वर-लागू अस्वीकरण साथ में।',
      hne:'डीपसीक ले चले हे। सरल हिंगलिश (या तोर भाषा)। सर्वर-लागू अस्वीकरण साथ मा।',
      kok:'डीपसीक-चालित। साधी हिंगलिश (वा तुजी भास)। सर्व्हर-लागू अस्वीकरण जोडलें।',
    },
    'ask.placeholder': {
      sa:'स्वप्रश्नं लिख…', ne:'आफ्नो प्रश्न टाइप गर्नुहोस्…',
      mai:'अपन प्रश्न लिखू…', bho:'रउरा सवाल लिखीं…',
      hne:'अपन सवाल लिखव…', kok:'तुजो प्रश्न लिख…',
    },
    'unsupp.notice': {
      sa:'"{lang}" इति-कृते UI-अनुवादः पंक्तौ अस्ति — बटन्-लेबल्-कृते हिन्दी-भाषायाम्। भवतः ध्वनिः उत्तरम् च {lang}-भाषायाम् एव।',
      ne:'"{lang}" का लागि UI अनुवाद पंक्तिमा छ — बटन र लेबलहरू हिन्दीमा। तपाईंको आवाज र चिट्टीको जवाफ पहिले नै {lang} मा।',
      mai:'"{lang}" लेल UI अनुवाद कतार मे अछि — बटन + लेबल हिन्दी मे। अपनेक आवाज + चिट्टीक जवाब पहिले सँ {lang} मे।',
      bho:'"{lang}" खातिर UI अनुवाद कतार में बा — बटन + लेबल हिन्दी में। रउरा आवाज + चिट्टी के जवाब पहिले से {lang} में बा।',
      hne:'"{lang}" खातिर UI अनुवाद कतार मा हे — बटन + लेबल हिन्दी मा। तोर आवाज + चिट्टी के जवाब पहिली ले {lang} मा हे।',
      kok:'"{lang}" खातीर UI तर्जुमा रांगेरांगे — बटन + लेबल हिन्दींत। तुजो आवाज + चिट्टीचो जवाब आदींच {lang}-त आसा।',
    },
  };

  // Merge T_EXTRA into T (T entries win for shared en/hi keys; new lang
  // keys land alongside). Runs once at module load.
  Object.keys(T_EXTRA).forEach(function (k) {
    if (!T[k]) T[k] = {};
    var src = T_EXTRA[k];
    Object.keys(src).forEach(function (lang) {
      if (T[k][lang] == null) T[k][lang] = src[lang];
    });
  });

  function langName(code) {
    var L = (window.Chitti && window.Chitti.a11y && window.Chitti.a11y.languages) || [];
    var hit = L.find && L.find(function (r) { return r[0] === code; });
    return hit ? hit[1] : code;
  }

  function t(key, lang) {
    var e = T[key];
    if (!e) return null;
    if (e[lang]) return e[lang];
    if (e.hi)    return e.hi;
    if (e.en)    return e.en;
    return null;
  }

  function apply(lang) {
    lang = lang || (document.documentElement.getAttribute('data-chitti-lang') || 'en');
    var effective = SUPPORTED.indexOf(lang) >= 0 ? lang : FALLBACK_FOR_UNSUPPORTED;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var v = t(key, effective);
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      var v = t(key, effective);
      if (v != null) el.setAttribute('aria-label', v);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var v = t(key, effective);
      if (v != null) el.placeholder = v;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      var v = t(key, effective);
      if (v != null) el.title = v;
    });

    document.documentElement.lang = effective;
    document.documentElement.setAttribute('data-chitti-lang', lang);

    // Honest banner for the 14 Voice Factory languages we have not yet
    // translated the chrome UI into.
    showUnsupportedNotice(lang, effective);
  }

  function showUnsupportedNotice(actual, effective) {
    var bar = document.getElementById('chitti-wheels-unsupp');
    if (actual === effective) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'chitti-wheels-unsupp';
      bar.setAttribute('role', 'status');
      bar.style.cssText =
        'position:fixed;left:14px;right:14px;bottom:14px;max-width:680px;margin:0 auto;' +
        'background:linear-gradient(135deg,#0E2344,#16376a);color:#fff;padding:11px 14px;' +
        'border-radius:12px;font-size:12px;line-height:1.5;z-index:120;' +
        'box-shadow:0 8px 22px rgba(0,0,0,.32);display:flex;align-items:flex-start;gap:10px';
      bar.innerHTML =
        '<span style="font-size:16px;flex-shrink:0">🌐</span>' +
        '<span style="flex:1" id="chitti-wheels-unsupp-text"></span>' +
        '<button aria-label="Dismiss" style="background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:6px;padding:4px 8px;cursor:pointer;flex-shrink:0">✕</button>';
      bar.lastElementChild.addEventListener('click', function () { bar.remove(); });
      document.body.appendChild(bar);
    }
    var nm = langName(actual);
    var notice = (t('unsupp.notice', effective) || T['unsupp.notice'].en).replace(/\{lang\}/g, nm);
    document.getElementById('chitti-wheels-unsupp-text').textContent = notice;
  }

  // ── Listen for the global language change event ──
  document.addEventListener('chitti:lang', function (e) {
    apply(e && e.detail && e.detail.code);
  });

  // ── Apply once on load (in case a11y substrate dispatched before we loaded) ──
  function bootApply() {
    var lang =
      document.documentElement.getAttribute('data-chitti-lang') ||
      (window.localStorage && JSON.parse(localStorage.getItem('chitti_a11y_state_v2') || '{}').lang) ||
      'en';
    apply(lang);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApply);
  } else {
    bootApply();
  }

  window.ChittiWheelsI18n = { apply: apply, t: t, supported: SUPPORTED };
})();
