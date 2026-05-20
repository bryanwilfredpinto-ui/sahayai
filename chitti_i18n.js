/* ─────────────────────────────────────────────────────────────────
 * chitti_i18n.js — Substrate-level UI translation for all 26 langs.
 *
 * Scope: ~50 cross-Chitti UI strings (button labels, feedback widget
 * tooltips, ISL panel chrome, error messages, confirmation prompts).
 * Page-specific labels opt in by adding `data-i18n="namespace.key"`
 * to the element; on language switch, the substrate sweeps the DOM
 * and replaces every data-i18n target's text content.
 *
 * Pages with their own per-page i18n table (the existing pattern
 * in medupi / news-ai / shares) register it via:
 *   window.Chitti.i18n.register({ 'med.modal.title': { hi: '…', bn: '…', … } });
 *
 * Public API on window.Chitti.i18n:
 *   t(key, lang)              → translated string (falls back hi → en → key)
 *   register(table)           → merge per-page strings into the global table
 *   applyLang(lang)           → sweep DOM, replace every data-i18n target
 *   currentLang()             → currently active language code
 *
 * Honest contract: 13 languages (hi, en, bn, te, ta, mr, gu, kn, ml,
 * pa, or, as, ur) have hand-written translations for every substrate
 * string. The other 13 (sa, mai, kok, doi, ks, ne, sd, mni, sat, bho,
 * raj, kru, ho) ship with an honest *Hindi fallback marked
 * "untranslated — community contributions welcome"* per the Voice
 * Strategy lock (SAHAYAI_MASTER.md §2 row "Voice strategy"). Pages
 * never silently morph one language into another; the missing-status
 * is rendered as a small "(translation pending)" footnote when those
 * languages are active. See [`chitti_voice_hall_of_fame.html`] —
 * translation contributors enter the Hall of Fame the same way voice
 * donors do.
 *
 * RTL: ur, ks, sd render right-to-left. chitti_a11y.js sets
 * document.documentElement.dir = 'rtl' on switch.
 * ───────────────────────────────────────────────────────────────── */
(function (global) {
  'use strict';

  global.Chitti = global.Chitti || {};
  if (global.Chitti.i18n && global.Chitti.i18n._wired) return;

  // Languages that need RTL flow.
  const RTL_LANGS = new Set(['ur', 'ks', 'sd']);

  // 13 strong-coverage languages.
  const STRONG = new Set([
    'en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'ur'
  ]);

  // 13 honest-stub languages (Hindi fallback + community-contribution callout).
  const STUB = new Set([
    'sa', 'mai', 'kok', 'doi', 'ks', 'ne', 'sd', 'mni', 'sat', 'bho', 'raj', 'kru', 'ho'
  ]);

  // Locked palette of native names for every supported code (used by the
  // dropdown rendered in chitti_a11y.js). Mirrors the Voice Factory list.
  const LANG_NATIVE = {
    en: 'English',          hi: 'हिन्दी',           bn: 'বাংলা',
    te: 'తెలుగు',           ta: 'தமிழ்',            mr: 'मराठी',
    gu: 'ગુજરાતી',           kn: 'ಕನ್ನಡ',           ml: 'മലയാളം',
    pa: 'ਪੰਜਾਬੀ',           or: 'ଓଡ଼ିଆ',            as: 'অসমীয়া',
    ur: 'اردو',             sa: 'संस्कृतम्',          mai: 'मैथिली',
    kok: 'कोंकणी',            doi: 'डोगरी',           ks: 'کٲشُر',
    ne: 'नेपाली',             sd: 'سنڌي',             mni: 'মৈতৈলোন্',
    sat: 'ᱥᱟᱱᱛᱟᱲᱤ',          bho: 'भोजपुरी',          raj: 'राजस्थानी',
    kru: 'कुड़ुख़',            ho: 'हो',
  };

  // Substrate strings — 13 strong langs are hand-translated below.
  // Format: { key: { en, hi, bn, te, ta, mr, gu, kn, ml, pa, or, as, ur } }
  // For stub langs (sa/mai/kok/doi/ks/ne/sd/mni/sat/bho/raj/kru/ho) the
  // resolver falls back to hi.
  const STRINGS = {
    // Common UI verbs
    'common.send':       { en: 'Send',         hi: 'भेजें',         bn: 'পাঠান',         te: 'పంపండి',        ta: 'அனுப்பு',         mr: 'पाठवा',         gu: 'મોકલો',          kn: 'ಕಳುಹಿಸಿ',         ml: 'അയയ്ക്കുക',     pa: 'ਭੇਜੋ',           or: 'ପଠାନ୍ତୁ',        as: 'পঠাওক',         ur: 'بھیجیں' },
    'common.cancel':     { en: 'Cancel',       hi: 'रद्द करें',     bn: 'বাতিল',         te: 'రద్దు చేయండి',   ta: 'ரத்து செய்',       mr: 'रद्द करा',      gu: 'રદ કરો',         kn: 'ರದ್ದುಗೊಳಿಸಿ',     ml: 'റദ്ദാക്കുക',     pa: 'ਰੱਦ ਕਰੋ',         or: 'ବାତିଲ୍',         as: 'বাতিল',         ur: 'منسوخ' },
    'common.ok':         { en: 'OK',           hi: 'ठीक है',        bn: 'ঠিক আছে',       te: 'సరే',           ta: 'சரி',             mr: 'ठीक आहे',       gu: 'બરાબર',          kn: 'ಸರಿ',             ml: 'ശരി',           pa: 'ਠੀਕ ਹੈ',          or: 'ଠିକ୍ ଅଛି',        as: 'ঠিক আছে',       ur: 'ٹھیک ہے' },
    'common.yes':        { en: 'Yes',          hi: 'हाँ',           bn: 'হ্যাঁ',          te: 'అవును',         ta: 'ஆம்',             mr: 'होय',           gu: 'હા',             kn: 'ಹೌದು',            ml: 'അതെ',           pa: 'ਹਾਂ',             or: 'ହଁ',             as: 'হয়',             ur: 'ہاں' },
    'common.no':         { en: 'No',           hi: 'नहीं',          bn: 'না',            te: 'కాదు',          ta: 'இல்லை',           mr: 'नाही',          gu: 'ના',             kn: 'ಇಲ್ಲ',            ml: 'അല്ല',          pa: 'ਨਹੀਂ',            or: 'ନା',             as: 'নহয়',           ur: 'نہیں' },
    'common.save':       { en: 'Save',         hi: 'सहेजें',         bn: 'সংরক্ষণ',        te: 'సేవ్',           ta: 'சேமி',            mr: 'जतन करा',       gu: 'સાચવો',          kn: 'ಉಳಿಸಿ',           ml: 'സംരക്ഷിക്കുക',  pa: 'ਸੰਭਾਲੋ',          or: 'ସଞ୍ଚୟ କରନ୍ତୁ',     as: 'সংৰক্ষণ',        ur: 'محفوظ کریں' },
    'common.submit':     { en: 'Submit',       hi: 'जमा करें',       bn: 'জমা দিন',        te: 'సమర్పించండి',    ta: 'சமர்ப்பி',         mr: 'सबमिट',         gu: 'સબમિટ',          kn: 'ಸಲ್ಲಿಸಿ',          ml: 'സമർപ്പിക്കുക',   pa: 'ਜਮ੍ਹਾਂ ਕਰੋ',       or: 'ଦାଖଲ କରନ୍ତୁ',      as: 'জমা দিয়ক',       ur: 'جمع کریں' },
    'common.close':      { en: 'Close',        hi: 'बंद करें',       bn: 'বন্ধ',          te: 'మూసివేయండి',     ta: 'மூடு',            mr: 'बंद',           gu: 'બંધ',            kn: 'ಮುಚ್ಚಿ',          ml: 'അടയ്ക്കുക',      pa: 'ਬੰਦ',             or: 'ବନ୍ଦ',            as: 'বন্ধ কৰক',        ur: 'بند' },
    'common.loading':    { en: 'Loading…',     hi: 'लोड हो रहा है…',  bn: 'লোড হচ্ছে…',    te: 'లోడ్ అవుతోంది…',  ta: 'ஏற்றுகிறது…',     mr: 'लोड होत आहे…',  gu: 'લોડ થઇ રહ્યું છે…', kn: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…',   ml: 'ലോഡ് ചെയ്യുന്നു…', pa: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…',  or: 'ଲୋଡ୍ ହେଉଛି…',     as: 'লোড হৈ আছে…',    ur: 'لوڈ ہو رہا ہے…' },
    'common.listening':  { en: 'Listening…',   hi: 'सुन रहा हूँ…',    bn: 'শুনছি…',         te: 'వింటున్నాను…',   ta: 'கேட்கிறேன்…',      mr: 'ऐकत आहे…',       gu: 'સાંભળી રહ્યો છું…',  kn: 'ಕೇಳುತ್ತಿದ್ದೇನೆ…',  ml: 'കേൾക്കുന്നു…',    pa: 'ਸੁਣ ਰਿਹਾ ਹਾਂ…',    or: 'ଶୁଣୁଛି…',          as: 'শুনি আছোঁ…',      ur: 'سن رہا ہوں…' },
    'common.error':      { en: 'Something went wrong', hi: 'कुछ गलत हुआ', bn: 'কিছু ভুল হয়েছে', te: 'ఏదో తప్పు జరిగింది', ta: 'ஏதோ தவறு', mr: 'काहीतरी चूक झाली', gu: 'કંઇક ખોટું થયું', kn: 'ಏನೋ ತಪ್ಪಾಗಿದೆ', ml: 'എന്തോ പിശക്', pa: 'ਕੁਝ ਗਲਤ ਹੋਇਆ', or: 'କିଛି ତ୍ରୁଟି ହୋଇଛି', as: 'কিবা ভুল হ\'ল', ur: 'کچھ غلط ہوگیا' },

    // Feedback widget
    'widget.speak':      { en: 'Read aloud',   hi: 'पढ़कर सुनाओ',     bn: 'পড়ে শোনাও',    te: 'చదివి వినిపించు', ta: 'வாசித்துக் காட்டு', mr: 'वाचून दाखवा',    gu: 'વાંચીને સંભળાવો',  kn: 'ಓದಿ ತೋರಿಸಿ',       ml: 'വായിച്ച് കേൾപ്പിക്കൂ', pa: 'ਪੜ੍ਹ ਕੇ ਸੁਣਾਓ',  or: 'ପଢ଼ି ଶୁଣାନ୍ତୁ',     as: 'পঢ়ি শুনাওক',     ur: 'پڑھ کر سنائیں' },
    'widget.explain':    { en: 'Explain further', hi: 'और समझाओ',     bn: 'আরো ব্যাখ্যা',  te: 'మరింత వివరించండి', ta: 'மேலும் விளக்கு',  mr: 'अधिक समजावा',    gu: 'વધુ સમજાવો',     kn: 'ಹೆಚ್ಚು ವಿವರಿಸಿ',    ml: 'കൂടുതൽ വിശദീകരിക്കൂ', pa: 'ਹੋਰ ਸਮਝਾਓ',     or: 'ଅଧିକ ବ୍ୟାଖ୍ୟା',    as: 'অধিক বুজাওক',    ur: 'مزید سمجھائیں' },
    'widget.thumb.up':   { en: 'Helpful',      hi: 'मददगार',        bn: 'সহায়ক',         te: 'సహాయకరం',       ta: 'பயனுள்ளது',       mr: 'उपयोगी',        gu: 'મદદરૂપ',         kn: 'ಸಹಾಯಕ',           ml: 'സഹായകരം',       pa: 'ਮਦਦਗਾਰ',          or: 'ସହାୟକ',           as: 'সহায়ক',          ur: 'مددگار' },
    'widget.thumb.down': { en: 'Not helpful',  hi: 'मददगार नहीं',    bn: 'সহায়ক নয়',     te: 'సహాయకరం కాదు',   ta: 'பயனற்றது',        mr: 'उपयोगी नाही',   gu: 'મદદરૂપ નથી',     kn: 'ಸಹಾಯಕವಲ್ಲ',       ml: 'സഹായകരമല്ല',    pa: 'ਮਦਦਗਾਰ ਨਹੀਂ',     or: 'ସହାୟକ ନୁହେଁ',    as: 'সহায়ক নহয়',     ur: 'مددگار نہیں' },
    'widget.feedback':   { en: 'Feedback',     hi: 'प्रतिक्रिया',     bn: 'মতামত',         te: 'అభిప్రాయం',      ta: 'கருத்து',          mr: 'अभिप्राय',      gu: 'પ્રતિસાદ',        kn: 'ಪ್ರತಿಕ್ರಿಯೆ',      ml: 'പ്രതികരണം',     pa: 'ਫੀਡਬੈਕ',           or: 'ମତାମତ',           as: 'মতামত',          ur: 'تاثرات' },
    'widget.fb.placeholder': { en: 'What was wrong with this?', hi: 'इसमें क्या गलत था?', bn: 'এতে কী ভুল ছিল?', te: 'దీంట్లో ఏం తప్పు?', ta: 'இதில் என்ன தவறு?', mr: 'यात काय चूक?',  gu: 'આમાં શું ખોટું?', kn: 'ಇದರಲ್ಲಿ ಏನು ತಪ್ಪು?', ml: 'ഇതിൽ എന്താണ് തെറ്റ്?', pa: 'ਇਸ ਵਿੱਚ ਕੀ ਗਲਤ?', or: 'ଏଥିରେ କ\'ଣ ଭୁଲ?',   as: 'ইয়াত কি ভুল?',  ur: 'اس میں کیا غلط؟' },
    'widget.fb.voice':   { en: 'Record voice feedback', hi: 'आवाज़ से बताओ', bn: 'কণ্ঠে মতামত', te: 'వాయిస్‌లో అభిప్రాయం', ta: 'குரலில் கருத்து', mr: 'आवाजात अभिप्राय', gu: 'અવાજમાં પ્રતિસાદ', kn: 'ಧ್ವನಿಯಲ್ಲಿ ಪ್ರತಿಕ್ರಿಯೆ', ml: 'ശബ്ദത്തിലൂടെ', pa: 'ਅਵਾਜ਼ ਵਿੱਚ ਫੀਡਬੈਕ', or: 'ସ୍ୱରରେ ମତାମତ', as: 'কণ্ঠেৰে মতামত', ur: 'آواز سے بتائیں' },
    'widget.fb.type':    { en: 'Type feedback', hi: 'लिखकर बताओ',    bn: 'লিখে বলুন',     te: 'రాసి చెప్పండి',  ta: 'எழுதிக் கூறு',    mr: 'लिहून सांगा',   gu: 'લખીને કહો',      kn: 'ಬರೆದು ಹೇಳಿ',       ml: 'എഴുതി പറയൂ',    pa: 'ਲਿਖ ਕੇ ਦੱਸੋ',      or: 'ଲେଖି କୁହନ୍ତୁ',     as: 'লিখি কওক',       ur: 'لکھ کر بتائیں' },
    'widget.fb.thanks':  { en: 'I will learn from this',  hi: 'मैं इससे सीखूँगा', bn: 'আমি এ থেকে শিখব', te: 'నేను దీని నుండి నేర్చుకుంటాను', ta: 'நான் இதிலிருந்து கற்றுக்கொள்வேன்', mr: 'मी यातून शिकेन', gu: 'હું આમાંથી શીખીશ', kn: 'ನಾನು ಇದರಿಂದ ಕಲಿಯುತ್ತೇನೆ', ml: 'ഞാൻ ഇതിൽ നിന്ന് പഠിക്കാം', pa: 'ਮੈਂ ਇਸ ਤੋਂ ਸਿੱਖਾਂਗਾ', or: 'ମୁଁ ଏଥିରୁ ଶିଖିବି', as: 'মই ইয়াৰ পৰা শিকিম', ur: 'میں اس سے سیکھوں گا' },

    // ISL panel
    'isl.toggle.on':     { en: 'ISL: ON',      hi: 'ISL: चालू',     bn: 'ISL: চালু',     te: 'ISL: ఆన్',      ta: 'ISL: இயக்கம்',    mr: 'ISL: चालू',     gu: 'ISL: ચાલુ',      kn: 'ISL: ಆನ್',         ml: 'ISL: ഓൺ',        pa: 'ISL: ਚਾਲੂ',        or: 'ISL: ଚାଲୁ',        as: 'ISL: চলি আছে',    ur: 'ISL: آن' },
    'isl.toggle.off':    { en: 'ISL',          hi: 'ISL',           bn: 'ISL',           te: 'ISL',           ta: 'ISL',             mr: 'ISL',           gu: 'ISL',            kn: 'ISL',             ml: 'ISL',           pa: 'ISL',             or: 'ISL',             as: 'ISL',             ur: 'ISL' },
    'isl.placeholder':   { en: 'Placeholder ISL — community video coming soon', hi: 'पूर्वावलोकन ISL — समुदाय वीडियो जल्द', bn: 'প্রিভিউ ISL — কমিউনিটি ভিডিও শীঘ্রই', te: 'ప్రివ్యూ ISL — త్వరలో', ta: 'ISL முன்னோட்டம் — விரைவில் சமூக காணொலி', mr: 'ISL पूर्वावलोकन — समुदाय व्हिडिओ लवकर', gu: 'ISL પૂર્વાવલોકન — સમુદાય વિડિયો જલ્દી', kn: 'ISL ಪೂರ್ವವೀಕ್ಷಣೆ', ml: 'ISL പ്രിവ്യൂ', pa: 'ISL ਨਮੂਨਾ', or: 'ISL ପ୍ରିଭ୍ୟୁ', as: 'ISL পূৰ্বদৃশ্য', ur: 'ISL پیشگی نمونہ' },

    // Disability Profile
    'profile.title':     { en: 'How can Chitti help you better?', hi: 'चिट्टी आपकी बेहतर सहायता कैसे करे?', bn: 'চিট্টি কীভাবে আপনাকে ভালো সাহায্য করতে পারে?', te: 'చిట్టి మిమ్మల్ని ఎలా బాగా సహాయం చేస్తుంది?', ta: 'சிட்டி உங்களுக்கு எப்படி நன்றாக உதவ முடியும்?', mr: 'चिट्टी तुम्हाला कशी मदत करू शकते?', gu: 'ચિટ્ટી તમને કેવી રીતે મદદ કરી શકે?', kn: 'ಚಿಟ್ಟಿ ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲದು?', ml: 'ചിട്ടി നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?', pa: 'ਚਿੱਟੀ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰੇ?', or: 'ଚିଟ୍ଟି କିପରି ସାହାଯ୍ୟ କରିବ?', as: 'চিট্টিয়ে কেনেদৰে সহায় কৰিব?', ur: 'چٹی آپ کی بہتر مدد کیسے کرے؟' },
    'profile.hint':      { en: 'Pick all that apply. You can change this anytime in Settings.', hi: 'जो भी लागू हो, चुनें। आप इसे कभी भी सेटिंग्स में बदल सकते हैं।', bn: 'যা প্রযোজ্য সব বেছে নিন। সেটিংসে যেকোনো সময় বদলাতে পারেন।', te: 'వర్తించే అన్నీ ఎంచుకోండి. సెట్టింగ్స్‌లో మార్చవచ్చు.', ta: 'பொருந்தும் அனைத்தையும் தேர்ந்தெடுக்கவும். அமைப்புகளில் மாற்றலாம்.', mr: 'सर्व निवडा. सेटिंग्जमध्ये बदलू शकता.', gu: 'જે પણ લાગુ પડે તે પસંદ કરો. સેટિંગ્સમાં બદલી શકો છો.', kn: 'ಎಲ್ಲವನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಬದಲಾಯಿಸಬಹುದು.', ml: 'ബാധകമായതെല്ലാം തിരഞ്ഞെടുക്കുക. ക്രമീകരണങ്ങളിൽ മാറ്റാം.', pa: 'ਜੋ ਵੀ ਲਾਗੂ ਹੋਵੇ ਚੁਣੋ। ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਬਦਲ ਸਕਦੇ ਹੋ।', or: 'ସମସ୍ତ ପ୍ରଯୁଜ୍ୟ ବାଛନ୍ତୁ। ସେଟିଂରେ ବଦଳାନ୍ତୁ।', as: 'প্ৰযোজ্য সকলো বাছনি কৰক।', ur: 'تمام لاگو منتخب کریں۔ ترتیبات میں تبدیل کر سکتے ہیں۔' },
    'profile.skip':      { en: 'Skip for now',  hi: 'अभी रहने दें',   bn: 'এখন বাদ দিন',    te: 'ఇప్పుడు దాటవేయి',  ta: 'இப்போது விட்டுவிடு', mr: 'सध्या वगळा',     gu: 'હાલમાં છોડો',     kn: 'ಇದೀಗ ಬಿಡಿ',         ml: 'ഇപ്പോൾ ഒഴിവാക്കുക', pa: 'ਹੁਣੇ ਛੱਡੋ',          or: 'ବର୍ତ୍ତମାନ ଛାଡ଼ନ୍ତୁ',  as: 'এতিয়া এৰি দিয়ক',  ur: 'ابھی چھوڑ دیں' },

    // Disability options
    'profile.opt.blind':       { en: 'I am blind or have low vision', hi: 'मैं अंधा हूँ या कम दिखता है', bn: 'আমি অন্ধ বা কম দেখি', te: 'నేను అంధుడిని', ta: 'நான் பார்வை குறைபாடு', mr: 'मी अंध आहे', gu: 'હું અંધ છું', kn: 'ನಾನು ಅಂಧ', ml: 'ഞാൻ അന്ധനാണ്', pa: 'ਮੈਂ ਅੰਨ੍ਹਾ ਹਾਂ', or: 'ମୁଁ ଅନ୍ଧ', as: 'মই অন্ধ', ur: 'میں نابینا ہوں' },
    'profile.opt.deaf':        { en: 'I am deaf or hard of hearing', hi: 'मैं बहरा हूँ', bn: 'আমি বধির', te: 'నేను చెవిటి', ta: 'காது கேளாதவன்', mr: 'मी बहिरा आहे', gu: 'હું બહેરો છું', kn: 'ನಾನು ಕಿವುಡ', ml: 'ഞാൻ ബധിരൻ', pa: 'ਮੈਂ ਬੋਲ਼ਾ ਹਾਂ', or: 'ମୁଁ ବଧିର', as: 'মই কলা', ur: 'میں بہرا ہوں' },
    'profile.opt.mute':        { en: 'I am mute or have speech difficulty', hi: 'मैं बोल नहीं सकता', bn: 'আমি বোবা', te: 'మూగవాడిని', ta: 'பேச முடியாதவன்', mr: 'मी मुका आहे', gu: 'હું મૂંગો છું', kn: 'ನಾನು ಮೂಕ', ml: 'ഞാൻ മൂകൻ', pa: 'ਮੈਂ ਗੂੰਗਾ', or: 'ମୁଁ ମୂକ', as: 'মই বোবা', ur: 'میں گونگا ہوں' },
    'profile.opt.isl':         { en: 'I use sign language (ISL)', hi: 'मैं संकेत भाषा (ISL) उपयोग करता हूँ', bn: 'আমি সংকেত ভাষা (ISL) ব্যবহার করি', te: 'నేను సంజ్ఞ భాష (ISL) వాడతాను', ta: 'நான் ISL பயன்படுத்துகிறேன்', mr: 'मी ISL वापरतो', gu: 'હું ISL વાપરું છું', kn: 'ನಾನು ISL ಬಳಸುತ್ತೇನೆ', ml: 'ഞാൻ ISL ഉപയോഗിക്കുന്നു', pa: 'ਮੈਂ ISL ਵਰਤਦਾ ਹਾਂ', or: 'ମୁଁ ISL ବ୍ୟବହାର', as: 'মই ISL ব্যৱহাৰ', ur: 'میں ISL استعمال کرتا ہوں' },
    'profile.opt.illiterate':  { en: 'I have difficulty reading', hi: 'मुझे पढ़ने में कठिनाई है', bn: 'আমার পড়তে কষ্ট', te: 'చదవడం కష్టం', ta: 'படிப்பதில் சிரமம்', mr: 'मला वाचणे कठीण', gu: 'મને વાંચવામાં મુશ્કેલી', kn: 'ಓದಲು ಕಷ್ಟ', ml: 'വായിക്കാൻ ബുദ്ധിമുട്ട്', pa: 'ਪੜ੍ਹਨ ਵਿੱਚ ਮੁਸ਼ਕਲ', or: 'ପଢ଼ିବାରେ ଅସୁବିଧା', as: 'পঢ়াত অসুবিধা', ur: 'پڑھنے میں دشواری' },
    'profile.opt.elderly':     { en: 'I am elderly (65+)', hi: 'मैं वरिष्ठ नागरिक हूँ', bn: 'আমি বয়স্ক (৬৫+)', te: 'నేను వృద్ధుడిని', ta: 'நான் முதியவன்', mr: 'मी वृद्ध आहे', gu: 'હું વૃદ્ધ છું', kn: 'ನಾನು ಹಿರಿಯ', ml: 'ഞാൻ പ്രായമായവനാണ്', pa: 'ਮੈਂ ਬਜ਼ੁਰਗ', or: 'ମୁଁ ବୟସ୍କ', as: 'মই বয়স্ক', ur: 'میں بزرگ ہوں' },
    'profile.opt.mobility':    { en: 'I have limited mobility', hi: 'मेरी गतिशीलता सीमित है', bn: 'আমার চলাচল সীমিত', te: 'నా చలనం పరిమితం', ta: 'நகர்வது சிரமம்', mr: 'गतिशीलता मर्यादित', gu: 'મારી હલનચલન મર્યાદિત', kn: 'ಚಲನೆ ಸೀಮಿತ', ml: 'ചലനം പരിമിതം', pa: 'ਚਲਣਾ ਸੀਮਤ', or: 'ଗତି ସୀମିତ', as: 'চলাচল সীমিত', ur: 'حرکت محدود' },
    'profile.opt.cognitive':   { en: 'I have cognitive disability', hi: 'मुझे संज्ञानात्मक कठिनाई है', bn: 'আমার বোধগম্য কষ্ট', te: 'జ్ఞాన లోపం', ta: 'புரிதல் சிரமம்', mr: 'आकलनात्मक अडचण', gu: 'સંજ્ઞાનાત્મક મુશ્કેલી', kn: 'ಗ್ರಹಣ ತೊಂದರೆ', ml: 'വൈജ്ഞാനിക ബുദ്ധിമുട്ട്', pa: 'ਸੋਚਣ ਵਿੱਚ ਮੁਸ਼ਕਲ', or: 'ବୋଧଶକ୍ତି ସମସ୍ୟା', as: 'বোধশক্তি সমস্যা', ur: 'ادراکی معذوری' },
    'profile.opt.rural':       { en: 'I am in a rural area / low connectivity', hi: 'मैं ग्रामीण क्षेत्र में हूँ', bn: 'আমি গ্রামাঞ্চলে', te: 'గ్రామీణ ప్రాంతం', ta: 'கிராமப்புறம்', mr: 'ग्रामीण भागात', gu: 'ગ્રામીણ વિસ્તાર', kn: 'ಗ್ರಾಮೀಣ ಪ್ರದೇಶ', ml: 'ഗ്രാമപ്രദേശം', pa: 'ਪੇਂਡੂ ਖੇਤਰ', or: 'ଗ୍ରାମାଞ୍ଚଳ', as: 'গ্ৰাম্য অঞ্চল', ur: 'دیہی علاقہ' },
    'profile.opt.none':        { en: 'None of the above', hi: 'इनमें से कोई नहीं', bn: 'কোনোটিই নয়', te: 'ఏదీ కాదు', ta: 'எதுவுமில்லை', mr: 'यापैकी काही नाही', gu: 'આમાંથી કોઈ નહીં', kn: 'ಯಾವುದೂ ಅಲ್ಲ', ml: 'ഒന്നുമല്ല', pa: 'ਕੋਈ ਨਹੀਂ', or: 'କିଛି ନୁହେଁ', as: 'একোৱেই নহয়', ur: 'کوئی نہیں' },

    // Language switcher
    'lang.label':       { en: 'Language',     hi: 'भाषा',          bn: 'ভাষা',          te: 'భాష',           ta: 'மொழி',            mr: 'भाषा',          gu: 'ભાષા',           kn: 'ಭಾಷೆ',            ml: 'ഭാഷ',           pa: 'ਭਾਸ਼ਾ',           or: 'ଭାଷା',            as: 'ভাষা',            ur: 'زبان' },

    // Voice / mic
    'mic.tap':          { en: 'Tap to speak', hi: 'बोलने के लिए दबाएँ', bn: 'বলতে চাপুন', te: 'మాట్లాడటానికి నొక్కండి', ta: 'பேச அழுத்தவும்', mr: 'बोलण्यासाठी दाबा', gu: 'બોલવા માટે દબાવો', kn: 'ಮಾತನಾಡಲು ಒತ್ತಿ', ml: 'സംസാരിക്കാൻ അമർത്തുക', pa: 'ਬੋਲਣ ਲਈ ਦਬਾਓ', or: 'କୁହିବାକୁ ଦବାନ୍ତୁ', as: 'কবলৈ টিপক', ur: 'بولنے کے لیے دبائیں' },

    // Generic safety / verify
    'safety.verify':    { en: 'Please verify',  hi: 'कृपया जाँचें',   bn: 'অনুগ্রহ করে যাচাই করুন', te: 'దయచేసి ధృవీకరించండి', ta: 'தயவு செய்து சரிபார்', mr: 'कृपया तपासा', gu: 'કૃપા કરી ચકાસો', kn: 'ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ', ml: 'ദയവായി പരിശോധിക്കുക', pa: 'ਕਿਰਪਾ ਕਰਕੇ ਜਾਂਚੋ', or: 'ଦୟାକରି ଯାଞ୍ଚ କରନ୍ତୁ', as: 'অনুগ্ৰহ কৰি পৰীক্ষা', ur: 'براہ کرم تصدیق کریں' },

    // Honest "translation pending" footer for stub languages
    'i18n.pending':     { en: 'Translation pending — community contributions welcome', hi: 'अनुवाद अभी पूरा नहीं — समुदाय से योगदान चाहिए' },

    // ── Auto-translate corpus — strings the feedback-widget and a11y
    //    substrate render literally on every Chitti page. Added 2026-05-20
    //    so the auto-translate walker flips them when the language changes.
    'widget.label.speaker':   { en: 'Speaker',     hi: 'स्पीकर',         bn: 'স্পিকার',        te: 'స్పీకర్',        ta: 'ஸ்பீக்கர்',       mr: 'स्पीकर',        gu: 'સ્પીકર',         kn: 'ಸ್ಪೀಕರ್',         ml: 'സ്പീക്കർ',       pa: 'ਸਪੀਕਰ',          or: 'ସ୍ପିକର',         as: 'স্পীকাৰ',         ur: 'اسپیکر' },
    'widget.label.chitti':    { en: 'Chitti',      hi: 'चिट्टी',          bn: 'চিট্টি',         te: 'చిట్టి',         ta: 'சிட்டி',          mr: 'चिट्टी',         gu: 'ચિટ્ટી',          kn: 'ಚಿಟ್ಟಿ',           ml: 'ചിട്ടി',         pa: 'ਚਿੱਟੀ',           or: 'ଚିଟ୍ଟି',           as: 'চিট্টি',          ur: 'چٹی' },
    'widget.label.not_ok':    { en: 'Not OK',      hi: 'ठीक नहीं',       bn: 'ঠিক নয়',        te: 'సరికాదు',        ta: 'சரியில்லை',       mr: 'ठीक नाही',       gu: 'બરાબર નથી',       kn: 'ಸರಿ ಇಲ್ಲ',         ml: 'ശരിയല്ല',         pa: 'ਠੀਕ ਨਹੀਂ',         or: 'ଠିକ୍ ନୁହେଁ',        as: 'ঠিক নহয়',         ur: 'ٹھیک نہیں' },
    'widget.was_helpful':     { en: 'Was this helpful?', hi: 'क्या यह मददगार था?', bn: 'এটি কি সহায়ক ছিল?', te: 'ఇది సహాయపడిందా?', ta: 'இது உதவியதா?', mr: 'हे उपयुक्त होते?', gu: 'આ મદદરૂપ હતું?', kn: 'ಇದು ಸಹಾಯಕವಾಗಿತ್ತೆ?', ml: 'ഇത് സഹായകരമായിരുന്നോ?', pa: 'ਕੀ ਇਹ ਮਦਦਗਾਰ ਸੀ?', or: 'ଏହା ସହାୟକ ଥିଲା କି?', as: 'এইটো সহায়ক আছিল নেকি?', ur: 'کیا یہ مددگار تھا؟' },
    'widget.report':          { en: 'Report a problem', hi: 'समस्या बताएँ', bn: 'সমস্যা জানান', te: 'సమస్యను నివేదించండి', ta: 'பிரச்சினை தெரிவி', mr: 'समस्या सांगा', gu: 'સમસ્યા જણાવો', kn: 'ಸಮಸ್ಯೆ ತಿಳಿಸಿ', ml: 'പ്രശ്നം റിപ്പോർട്ട്', pa: 'ਸਮੱਸਿਆ ਦੱਸੋ', or: 'ସମସ୍ୟା ଜଣାନ୍ତୁ', as: 'সমস্যা জনাওক', ur: 'مسئلہ بتائیں' },
    'widget.thanks':          { en: 'Thanks!',     hi: 'धन्यवाद!',         bn: 'ধন্যবাদ!',         te: 'ధన్యవాదాలు!',     ta: 'நன்றி!',           mr: 'धन्यवाद!',         gu: 'આભાર!',           kn: 'ಧನ್ಯವಾದಗಳು!',       ml: 'നന്ദി!',           pa: 'ਧੰਨਵਾਦ!',           or: 'ଧନ୍ୟବାଦ!',           as: 'ধন্যবাদ!',          ur: 'شکریہ!' },
    'a11y.braille':           { en: 'Braille mode', hi: 'ब्रेल मोड',        bn: 'ব্রেইল মোড',      te: 'బ్రెయిలీ మోడ్',    ta: 'பிரெய்லி பயன்முறை', mr: 'ब्रेल मोड',        gu: 'બ્રેઇલ મોડ',        kn: 'ಬ್ರೈಲ್ ಮೋಡ್',         ml: 'ബ്രെയിലി മോഡ്',    pa: 'ਬ੍ਰੇਲ ਮੋਡ',          or: 'ବ୍ରେଲ୍ ମୋଡ୍',         as: 'ব্ৰেইল মোড',        ur: 'بریل موڈ' },
    'a11y.read_page':         { en: 'Read page',   hi: 'पन्ना पढ़ें',       bn: 'পৃষ্ঠা পড়ুন',     te: 'పేజీ చదవండి',    ta: 'பக்கம் படி',        mr: 'पान वाचा',         gu: 'પેજ વાંચો',        kn: 'ಪುಟ ಓದಿ',           ml: 'പേജ് വായിക്കുക',   pa: 'ਪੰਨਾ ਪੜ੍ਹੋ',          or: 'ପୃଷ୍ଠା ପଢ଼ନ୍ତୁ',       as: 'পৃষ্ঠা পঢ়ক',        ur: 'صفحہ پڑھیں' },
    'a11y.explain_simply':    { en: 'Explain simply', hi: 'सरल भाषा में बताएँ', bn: 'সহজ ভাষায় বলুন', te: 'సరళంగా చెప్పండి', ta: 'எளிமையாக விளக்கு', mr: 'सोप्या भाषेत सांगा', gu: 'સરળ ભાષામાં કહો', kn: 'ಸರಳವಾಗಿ ವಿವರಿಸಿ', ml: 'ലളിതമായി വിശദീകരിക്കുക', pa: 'ਸੌਖੀ ਭਾਸ਼ਾ ਵਿੱਚ ਦੱਸੋ', or: 'ସରଳ ଭାଷାରେ କୁହନ୍ତୁ', as: 'সহজ ভাষাত কওক', ur: 'سادہ زبان میں سمجھائیں' },
    'a11y.demo':              { en: 'Demo',        hi: 'डेमो',             bn: 'ডেমো',            te: 'డెమో',            ta: 'டெமோ',             mr: 'डेमो',             gu: 'ડેમો',             kn: 'ಡೆಮೋ',              ml: 'ഡെമോ',            pa: 'ਡੈਮੋ',              or: 'ଡେମୋ',              as: 'ডেমো',             ur: 'ڈیمو' },
    'common.search':          { en: 'Search',      hi: 'खोजें',            bn: 'খুঁজুন',           te: 'వెతకండి',         ta: 'தேடு',              mr: 'शोधा',             gu: 'શોધો',              kn: 'ಹುಡುಕಿ',             ml: 'തിരയുക',           pa: 'ਖੋਜੋ',               or: 'ଖୋଜନ୍ତୁ',             as: 'বিচাৰক',            ur: 'تلاش' },
    'common.home':            { en: 'Home',        hi: 'होम',              bn: 'হোম',             te: 'హోమ్',             ta: 'முகப்பு',            mr: 'होम',              gu: 'હોમ',              kn: 'ಮುಖಪುಟ',             ml: 'ഹോം',              pa: 'ਘਰ',                or: 'ହୋମ୍',                as: 'মূল পৃষ্ঠা',         ur: 'ہوم' },
    'common.help':            { en: 'Help',        hi: 'सहायता',           bn: 'সাহায্য',         te: 'సహాయం',           ta: 'உதவி',              mr: 'मदत',              gu: 'મદદ',              kn: 'ಸಹಾಯ',                ml: 'സഹായം',            pa: 'ਮਦਦ',               or: 'ସାହାଯ୍ୟ',             as: 'সহায়',             ur: 'مدد' },
    'common.settings':        { en: 'Settings',    hi: 'सेटिंग्स',          bn: 'সেটিংস',          te: 'సెట్టింగ్స్',       ta: 'அமைப்புகள்',         mr: 'सेटिंग्ज',          gu: 'સેટિંગ્સ',           kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',         ml: 'ക്രമീകരണങ്ങൾ',     pa: 'ਸੈਟਿੰਗਾਂ',           or: 'ସେଟିଂସ୍',             as: 'ছেটিংছ',           ur: 'ترتیبات' },
    'common.back':            { en: 'Back',        hi: 'वापस',             bn: 'পিছনে',           te: 'వెనుకకు',          ta: 'பின்',              mr: 'मागे',              gu: 'પાછા',              kn: 'ಹಿಂದೆ',              ml: 'പിന്നോട്ട്',         pa: 'ਵਾਪਸ',               or: 'ପଛକୁ',                as: 'পিছলৈ',            ur: 'واپس' },
    'common.next':            { en: 'Next',        hi: 'अगला',             bn: 'পরবর্তী',          te: 'తదుపరి',           ta: 'அடுத்து',            mr: 'पुढे',              gu: 'આગળ',              kn: 'ಮುಂದೆ',              ml: 'അടുത്തത്',          pa: 'ਅੱਗੇ',               or: 'ପରବର୍ତ୍ତୀ',           as: 'পৰৱৰ্তী',           ur: 'اگلا' },
    'common.continue':        { en: 'Continue',    hi: 'जारी रखें',         bn: 'চালিয়ে যান',     te: 'కొనసాగండి',       ta: 'தொடரவும்',           mr: 'सुरू ठेवा',         gu: 'ચાલુ રાખો',         kn: 'ಮುಂದುವರಿಸಿ',         ml: 'തുടരുക',            pa: 'ਜਾਰੀ ਰੱਖੋ',          or: 'ଜାରି ରଖନ୍ତୁ',          as: 'অব্যাহত ৰাখক',     ur: 'جاری رکھیں' },
    'common.try_again':       { en: 'Try again',   hi: 'फिर कोशिश करें',     bn: 'আবার চেষ্টা',     te: 'మళ్ళీ ప్రయత్నించండి', ta: 'மீண்டும் முயற்சி',   mr: 'पुन्हा प्रयत्न',     gu: 'ફરી પ્રયત્ન',       kn: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',    ml: 'വീണ്ടും ശ്രമിക്കുക',  pa: 'ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ',     or: 'ପୁନଃ ଚେଷ୍ଟା',          as: 'পুনৰ চেষ্টা',       ur: 'دوبارہ کوشش' },
    'common.send_message':    { en: 'Send message', hi: 'संदेश भेजें',     bn: 'বার্তা পাঠান',     te: 'సందేశం పంపండి',    ta: 'செய்தி அனுப்பு',    mr: 'संदेश पाठवा',       gu: 'સંદેશ મોકલો',       kn: 'ಸಂದೇಶ ಕಳುಹಿಸಿ',       ml: 'സന്ദേശം അയക്കുക',   pa: 'ਸੁਨੇਹਾ ਭੇਜੋ',         or: 'ବାର୍ତ୍ତା ପଠାନ୍ତୁ',     as: 'বাৰ্তা পঠাওক',      ur: 'پیغام بھیجیں' },
    'common.ask':             { en: 'Ask',         hi: 'पूछें',             bn: 'জিজ্ঞাসা করুন',    te: 'అడగండి',           ta: 'கேள்',               mr: 'विचारा',           gu: 'પૂછો',              kn: 'ಕೇಳಿ',                ml: 'ചോദിക്കുക',         pa: 'ਪੁੱਛੋ',                or: 'ପଚାରନ୍ତୁ',             as: 'সোধক',              ur: 'پوچھیں' },
    'common.share':           { en: 'Share',       hi: 'साझा करें',         bn: 'শেয়ার করুন',     te: 'భాగస్వామ్యం',      ta: 'பகிர்',              mr: 'शेअर करा',          gu: 'શેર કરો',           kn: 'ಹಂಚಿಕೊಳ್ಳಿ',          ml: 'പങ്കിടുക',          pa: 'ਸਾਂਝਾ ਕਰੋ',           or: 'ସେୟାର କରନ୍ତୁ',         as: 'শ্বেয়াৰ',           ur: 'شیئر' },
    'common.print':           { en: 'Print',       hi: 'प्रिंट',             bn: 'প্রিন্ট',          te: 'ప్రింట్',           ta: 'அச்சிடு',            mr: 'प्रिंट',             gu: 'પ્રિન્ટ',             kn: 'ಮುದ್ರಿಸಿ',             ml: 'പ്രിന്റ്',           pa: 'ਪ੍ਰਿੰਟ',                or: 'ପ୍ରିଣ୍ଟ',               as: 'প্ৰিন্ট',            ur: 'پرنٹ' },
    'common.download':        { en: 'Download',    hi: 'डाउनलोड',           bn: 'ডাউনলোড',         te: 'డౌన్‌లోడ్',         ta: 'பதிவிறக்கு',         mr: 'डाउनलोड',           gu: 'ડાઉનલોડ',           kn: 'ಡೌನ್‌ಲೋಡ್',           ml: 'ഡൗൺലോഡ്',           pa: 'ਡਾਊਨਲੋਡ',             or: 'ଡାଉନଲୋଡ୍',             as: 'ডাউনলোড',           ur: 'ڈاؤن لوڈ' },
    'common.scan':            { en: 'Scan',        hi: 'स्कैन',             bn: 'স্ক্যান',         te: 'స్కాన్',           ta: 'ஸ்கேன்',             mr: 'स्कॅन',             gu: 'સ્કેન',             kn: 'ಸ್ಕ್ಯಾನ್',             ml: 'സ്കാൻ',             pa: 'ਸਕੈਨ',                or: 'ସ୍କାନ୍',               as: 'স্কেন',              ur: 'سکین' },
    'common.upload':          { en: 'Upload',      hi: 'अपलोड',             bn: 'আপলোড',           te: 'అప్‌లోడ్',           ta: 'பதிவேற்று',          mr: 'अपलोड',             gu: 'અપલોડ',             kn: 'ಅಪ್‌ಲೋಡ್',             ml: 'അപ്‌ലോഡ്',           pa: 'ਅੱਪਲੋਡ',              or: 'ଅପଲୋଡ୍',               as: 'আপলোড',             ur: 'اپ لوڈ' },
    'common.copy':            { en: 'Copy',        hi: 'कॉपी',              bn: 'কপি',             te: 'కాపీ',             ta: 'நகலெடு',             mr: 'कॉपी',              gu: 'કૉપિ',               kn: 'ನಕಲಿಸಿ',               ml: 'കോപ്പി',             pa: 'ਕਾਪੀ',                or: 'କପି',                  as: 'কপি',                ur: 'کاپی' },
    'common.delete':          { en: 'Delete',      hi: 'हटाएँ',              bn: 'মুছুন',           te: 'తొలగించండి',         ta: 'அழி',                mr: 'हटवा',              gu: 'કાઢી નાખો',          kn: 'ಅಳಿಸಿ',                ml: 'ഇല്ലാതാക്കുക',         pa: 'ਮਿਟਾਓ',                or: 'ବାହାର କରନ୍ତୁ',           as: 'মচক',                ur: 'حذف' },
    'common.edit':            { en: 'Edit',        hi: 'संपादित करें',        bn: 'সম্পাদনা',        te: 'సవరించండి',          ta: 'திருத்து',           mr: 'संपादित',           gu: 'સંપાદિત',            kn: 'ಸಂಪಾದಿಸಿ',             ml: 'എഡിറ്റ്',             pa: 'ਸੰਪਾਦਿਤ',              or: 'ସମ୍ପାଦନ',                as: 'সম্পাদনা',           ur: 'ترمیم' },
  };

  // ── Public API ────────────────────────────────────────────────
  function t(key, lang) {
    const entry = STRINGS[key];
    if (!entry) return key;
    if (lang && entry[lang]) return entry[lang];
    // Stub-lang fallback chain: lang → hi → en → key
    if (entry.hi) return entry.hi;
    if (entry.en) return entry.en;
    return key;
  }

  function register(table) {
    if (!table || typeof table !== 'object') return;
    for (const k of Object.keys(table)) {
      // Merge — keep existing keys, add new ones, page-supplied trans
      // for an existing key OVERWRITE only that lang field.
      const existing = STRINGS[k] || {};
      STRINGS[k] = Object.assign({}, existing, table[k]);
    }
  }

  function _currentLang() {
    const a = (global.Chitti && global.Chitti.a11y) || null;
    if (a && a.lang && a.lang.current) return a.lang.current;
    try { return (JSON.parse(localStorage.getItem('chitti_a11y_v1') || '{}') || {}).lang || 'en'; }
    catch (_) { return 'en'; }
  }

  // Build a reverse-lookup map: trimmed text in ANY language → STRINGS key.
  // Cached after first build; rebuilt only if STRINGS expands via register().
  let _reverseMap = null;
  let _reverseMapSize = 0;
  function _buildReverseMap() {
    const keys = Object.keys(STRINGS);
    if (_reverseMap && keys.length === _reverseMapSize) return _reverseMap;
    _reverseMap = Object.create(null);
    for (const key of keys) {
      const entry = STRINGS[key];
      for (const lang in entry) {
        const txt = entry[lang];
        if (typeof txt !== 'string') continue;
        const norm = txt.trim();
        if (norm.length < 3) continue;
        // First-key-wins on collisions — the table's intent is that each
        // key represents a unique semantic string.
        if (!_reverseMap[norm]) _reverseMap[norm] = key;
      }
    }
    _reverseMapSize = keys.length;
    return _reverseMap;
  }

  // Walk text nodes and translate exact matches of any known English (or
  // other-language) UI string into the target language. Added 2026-05-20
  // per Bryan's directive: "Once a language is selected say Bangla, the
  // entire UI must change in Bangla." Pages with no data-i18n attributes
  // still get coverage for substrate strings (Send / Cancel / Helpful /
  // Not helpful / Read aloud / Explain further / etc.).
  //
  // Skip elements: <script>, <style>, <code>, <pre>, <textarea>, <input>,
  // <noscript>, [data-i18n-skip], anything inside [data-i18n] (already
  // handled), anything inside [contenteditable].
  const _AUTO_SKIP_TAGS = new Set([
    'SCRIPT','STYLE','NOSCRIPT','CODE','PRE','TEXTAREA','INPUT','SELECT',
    'OPTION','SVG','CANVAS','VIDEO','AUDIO','IFRAME'
  ]);
  function _shouldSkipNode(parentEl) {
    if (!parentEl) return true;
    if (_AUTO_SKIP_TAGS.has(parentEl.tagName)) return true;
    if (parentEl.closest('[data-i18n]')) return true;
    if (parentEl.closest('[data-i18n-skip]')) return true;
    if (parentEl.isContentEditable) return true;
    return false;
  }
  function _applyAutoTranslate(code) {
    const rev = _buildReverseMap();
    const walker = document.createTreeWalker(
      document.body || document.documentElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          const txt = (node.nodeValue || '').trim();
          if (txt.length < 3) return NodeFilter.FILTER_REJECT;
          if (_shouldSkipNode(node.parentElement)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    const hits = [];
    let n;
    while ((n = walker.nextNode())) {
      const raw = n.nodeValue || '';
      const norm = raw.trim();
      const key = rev[norm];
      if (!key) continue;
      const val = t(key, code);
      if (!val || val === norm) continue;
      hits.push([n, raw, val]);
    }
    // Apply outside the walker so DOM mutations don't disturb iteration.
    for (const [node, raw, val] of hits) {
      const leading = raw.match(/^\s*/)[0];
      const trailing = raw.match(/\s*$/)[0];
      node.nodeValue = leading + val + trailing;
      // Mark the parent so the live-MT pass below can skip it.
      if (node.parentElement) node.parentElement.setAttribute('data-chitti-i18n-done', '1');
    }
    return hits.length;
  }

  // ────────────────────────────────────────────────────────────────
  // Live machine-translation pass — for languages NOT covered by the
  // STRINGS hand-translation table (most page text — headings, body
  // copy, button labels page authors didn't mark with data-i18n).
  //
  // Engine: MyMemory (https://mymemory.translated.net/doc/spec.php) —
  // free, CORS-enabled, no auth, decent coverage for the 13 STRONG
  // Indian languages. For STUB langs (sat, brx, mni, mai, ks, sd, doi,
  // kok, hne, raj, kru, ho, tcy, kfa, sa, bho, ne) MyMemory may return
  // the source verbatim — we detect this and skip.
  //
  // Cache: localStorage keyed by `${lang}::${origText}`. First switch
  // is async (text flips as fetches return); every later switch and
  // every later page load is instant.
  //
  // Long-term: swap to Bhashini per SAHAYAI_MASTER §2 voice strategy
  // LOCK ("Bhashini is TEMPORARY... swappable at any time"). Change
  // _XLAT_FETCH below to point at the Bhashini endpoint when ULCA
  // registration lands; everything else stays.
  //
  // Day-1 contract per Bryan 2026-05-20: "If user selects Bangla the
  // entire UI must change in Bangla. Users are blind / deaf / mute /
  // illiterate." This pass makes that contract live.
  // ────────────────────────────────────────────────────────────────
  const _XLAT_CACHE_KEY = 'chitti_xlat_v1';
  const _XLAT_MAX_TEXT_LEN = 400;
  const _XLAT_CONCURRENCY = 5;
  const _origTextMap = new WeakMap();

  function _getXlatCache() {
    try { return JSON.parse(localStorage.getItem(_XLAT_CACHE_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function _saveXlatCache(cache) {
    try { localStorage.setItem(_XLAT_CACHE_KEY, JSON.stringify(cache)); }
    catch (_) { /* localStorage may be full / disabled — best-effort */ }
  }
  function _origFor(node) {
    if (_origTextMap.has(node)) return _origTextMap.get(node);
    const t = (node.nodeValue || '').trim();
    if (t.length < 2) return null;
    _origTextMap.set(node, t);
    return t;
  }

  // Sources we never send to MyMemory — obvious noise that wastes quota.
  function _isTranslatable(text) {
    if (text.length < 2 || text.length > _XLAT_MAX_TEXT_LEN) return false;
    if (/^\s*$/.test(text)) return false;
    // Numbers / currency / pure punctuation / urls / emails
    if (/^[\d.,₹$%+\-/\s()]+$/.test(text)) return false;
    if (/^https?:\/\//i.test(text)) return false;
    if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(text)) return false;
    // Mostly emoji
    const letters = (text.match(/[a-zA-Z]/g) || []).length;
    if (letters === 0) return false;
    return true;
  }

  async function _myMemoryFetch(text, target) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${target}`;
    try {
      const r = await fetch(url, { method: 'GET' });
      if (!r.ok) return null;
      const d = await r.json();
      const t = d && d.responseData && d.responseData.translatedText;
      const m = d && d.responseData && d.responseData.match;
      if (!t) return null;
      // No data for this lang pair — MyMemory returns source verbatim.
      if ((m || 0) < 0.3 && t.trim().toLowerCase() === text.trim().toLowerCase()) return null;
      return t;
    } catch (_) {
      return null;
    }
  }

  async function _translatePageNow(target) {
    if (!target || target === 'en') return;
    const tableStrings = _buildReverseMap();
    const cache = _getXlatCache();
    const cacheKey = (orig) => `${target}::${orig}`;

    const walker = document.createTreeWalker(
      document.body || document.documentElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (n) {
          if (_shouldSkipNode(n.parentElement)) return NodeFilter.FILTER_REJECT;
          const t = (n.nodeValue || '').trim();
          if (!_isTranslatable(t)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const items = [];
    let n;
    while ((n = walker.nextNode())) {
      const orig = _origFor(n);
      if (!orig) continue;
      // Static walker already handled — don't double-translate.
      if (tableStrings[orig]) continue;
      if (n.parentElement && n.parentElement.getAttribute('data-chitti-i18n-done')) continue;
      items.push({ node: n, orig, raw: n.nodeValue });
    }

    // Fast path: apply cached translations immediately.
    const uncached = [];
    for (const it of items) {
      const c = cache[cacheKey(it.orig)];
      if (c) {
        const L = it.raw.match(/^\s*/)[0], T = it.raw.match(/\s*$/)[0];
        it.node.nodeValue = L + c + T;
      } else {
        uncached.push(it);
      }
    }

    if (!uncached.length) {
      document.dispatchEvent(new CustomEvent('chitti:i18n:mt-done', { detail: { lang: target, source: 'cache', count: items.length } }));
      return;
    }

    // Slow path — fan out N concurrent fetches, batched.
    let cursor = 0;
    async function worker() {
      while (cursor < uncached.length) {
        const it = uncached[cursor++];
        const trans = await _myMemoryFetch(it.orig, target);
        if (trans) {
          cache[cacheKey(it.orig)] = trans;
          const L = it.raw.match(/^\s*/)[0], T = it.raw.match(/\s*$/)[0];
          it.node.nodeValue = L + trans + T;
        }
      }
    }
    const ws = [];
    for (let i = 0; i < _XLAT_CONCURRENCY; i++) ws.push(worker());
    await Promise.all(ws);

    _saveXlatCache(cache);
    document.dispatchEvent(new CustomEvent('chitti:i18n:mt-done', { detail: { lang: target, source: 'mymemory', count: items.length } }));
  }

  function applyLang(lang) {
    const code = lang || _currentLang() || 'en';
    // 1. Sweep every [data-i18n] element and replace text content.
    const nodes = document.querySelectorAll('[data-i18n]');
    nodes.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const val = t(key, code);
      if (val === key) return; // no translation found — leave existing text
      // Preserve nested HTML when the element only contains a single text node.
      if (el.children.length === 0) {
        el.textContent = val;
      } else {
        // For elements with child nodes, replace ONLY the textContent of
        // direct text-node children, not inner elements. This is a soft
        // approach — pages that need richer markup should use
        // data-i18n-html="key" instead.
        for (const child of Array.from(el.childNodes)) {
          if (child.nodeType === 3) { child.textContent = val; return; }
        }
        el.textContent = val;
      }
    });
    // 2. Same sweep for [data-i18n-placeholder] (input placeholders).
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = t(key, code);
      if (val !== key) el.setAttribute('placeholder', val);
    });
    // 3. Same sweep for [data-i18n-aria] (aria-label updates).
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      const val = t(key, code);
      if (val !== key) el.setAttribute('aria-label', val);
    });
    // 4. Auto-translate text nodes whose content matches a known table
    //    entry in ANY language. Pages without data-i18n still get
    //    substrate-string coverage (illiterate-user contract — full UI
    //    flip on language change).
    try { _applyAutoTranslate(code); } catch (_) {}
    // 5. Live MT pass via MyMemory — translates every visible text node
    //    that the static table didn't cover. Async; text flips in as
    //    fetches return. Cached aggressively so subsequent switches and
    //    re-visits are instant. Day-1 contract per Bryan: "If user
    //    selects Bangla the entire UI must change in Bangla."
    try { _translatePageNow(code); } catch (_) {}
    // 6. Set <html lang> + dir.
    document.documentElement.setAttribute('lang', code);
    document.documentElement.setAttribute('dir', RTL_LANGS.has(code) ? 'rtl' : 'ltr');
    // 7. Honest stub-language footer (small, sticky bottom on stub langs).
    _ensurePendingFooter(code);
    // 8. Fire event so pages can listen + re-render dynamic content.
    document.dispatchEvent(new CustomEvent('chitti:i18n:applied', { detail: { lang: code } }));
  }

  let _pendingFooterEl = null;
  function _ensurePendingFooter(code) {
    if (STRONG.has(code)) {
      if (_pendingFooterEl && _pendingFooterEl.parentNode) _pendingFooterEl.parentNode.removeChild(_pendingFooterEl);
      _pendingFooterEl = null;
      return;
    }
    if (!STUB.has(code)) return;
    // Stub language — show the honest "translation pending" line.
    if (_pendingFooterEl) return;
    _pendingFooterEl = document.createElement('div');
    _pendingFooterEl.setAttribute('role', 'status');
    _pendingFooterEl.style.cssText =
      'position:fixed;bottom:8px;left:50%;transform:translateX(-50%);' +
      'background:#FFF7EC;color:#003366;border:1px solid #FF9933;' +
      'border-radius:999px;padding:4px 12px;font-size:11px;' +
      'font-family:-apple-system,Segoe UI,sans-serif;z-index:9000;' +
      'box-shadow:0 4px 12px rgba(0,0,0,.15);max-width:90vw;';
    _pendingFooterEl.textContent = t('i18n.pending', 'hi');
    document.body.appendChild(_pendingFooterEl);
  }

  // ── Hook into language changes from chitti_a11y.js ────────────
  document.addEventListener('chitti:lang', (e) => {
    const code = (e.detail && e.detail.code) || _currentLang();
    applyLang(code);
  });

  // Run an initial sweep once the DOM is ready, in case the page loaded
  // with a saved language preference.
  function _init() {
    try { applyLang(_currentLang()); } catch (_) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

  // ── Expose ──────────────────────────────────────────────────
  global.Chitti.i18n = {
    _wired: true,
    t,
    register,
    applyLang,
    currentLang: _currentLang,
    LANG_NATIVE,
    RTL_LANGS,
    STRONG,
    STUB,
  };
})(typeof window !== 'undefined' ? window : globalThis);
