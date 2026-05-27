/**
 * chitti_camera_universal.js
 * --------------------------
 * Universal "📷 Scan" substrate — adds ONE camera button + 10-mode picker
 * to every Chitti page via chitti_a11y.js auto-load.
 *
 * Sire's spec 2026-05-27:
 *   "Add ONE camera button to every Chitti page. Uses Gemini Vision API
 *    (free). When tapped shows these options:
 *      💊 Medicine · 🍎 Food label · 👗 Fashion · 📄 Document · 🧾 Bill
 *      ⚖️ Legal notice · 🌾 Crop/plant · 💊 Prescription · 🛡️ QR/Payment
 *      🏷️ Product
 *    Same camera. Every Chitti. One tap."
 *
 * Auto-loaded by chitti_a11y.js — every page that loads the a11y substrate
 * inherits the camera button without per-page HTML edits.
 *
 * Result envelope is posted to /api/camera/analyze on the API gateway
 * (window.CHITTI_VAANI_API or window.CHITTI_CAMERA_API). The backend
 * routes to Gemini Vision and returns formatted text + capture_id; the
 * envelope is mirrored to the Camera Intelligence store via
 * chitti_camera.js (§2b SAHAYAI_MASTER).
 *
 * 8-gate compliance:
 *   Blind     — modal auto-announces; aria-live result; speak() on response
 *   Deaf      — every result visible as text; no audio-only info
 *   Mute      — pure tap interaction; voice input optional (mic icon)
 *   Illiterate— emoji-first labels; voice-out for every step
 *   Per-box   — result rendered in data-chitti-response → 4-icon widget attaches
 *   10 langs  — labels translate via window.Chitti.a11y.lang.current
 *   375px     — 2-col grid + flex modal; no horizontal scroll
 *   48×48 tap — every button >= 48×48 (button 56×56)
 */
(function (global) {
  'use strict';
  if (global.__chittiCameraUniversalLoaded) return;
  global.__chittiCameraUniversalLoaded = true;

  // ── i18n: 10 priority languages (Sire's spec) + 16 cousins fall back to Hindi.
  // Per the chitti_lang.js convention.
  var LANGS = {
    hi: 'हिन्दी', en: 'English', bn: 'বাংলা', te: 'తెలుగు', ta: 'தமிழ்',
    mr: 'मराठी', gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ', ml: 'മലയാളം', pa: 'ਪੰਜਾਬੀ',
  };

  // ── 10 camera modes (Sire's spec).
  // Each carries: id, emoji, label (per-lang), prompt-tag passed to backend.
  var MODES = [
    { id: 'medicine',     emoji: '💊', tag: 'medicine',
      label: { hi:'दवा', en:'Medicine', bn:'ওষুধ', te:'మందు', ta:'மருந்து',
               mr:'औषध', gu:'દવા', kn:'ಔಷಧಿ', ml:'മരുന്ന്', pa:'ਦਵਾਈ' },
      hint:  { hi:'जन औषधि का सस्ता विकल्प', en:'Jan Aushadhi alternative',
               bn:'জন ঔষধি বিকল্প', te:'జన ఔషధి ప్రత్యామ్నాయం', ta:'ஜன் ஔஷதி மாற்று',
               mr:'जन औषधी पर्याय', gu:'જન ઔષધિ વિકલ્પ', kn:'ಜನ್ ಔಷಧಿ ಪರ್ಯಾಯ',
               ml:'ജൻ ഔഷധി ബദൽ', pa:'ਜਨ ਔਸ਼ਧੀ ਵਿਕਲਪ' } },
    { id: 'food',         emoji: '🍎', tag: 'food_label',
      label: { hi:'खाद्य लेबल', en:'Food label', bn:'খাদ্য লেবেল',
               te:'ఆహార లేబుల్', ta:'உணவு லேபிள்', mr:'अन्न लेबल',
               gu:'ખોરાક લેબલ', kn:'ಆಹಾರ ಲೇಬಲ್', ml:'ഭക്ഷ്യ ലേബൽ',
               pa:'ਖਾਣਾ ਲੇਬਲ' },
      hint:  { hi:'FSSAI जाँच · चीनी / नमक चेतावनी', en:'FSSAI · sugar/salt warning',
               bn:'FSSAI · চিনি/লবণ', te:'FSSAI · చక్కెర/ఉప్పు',
               ta:'FSSAI · சர்க்கரை/உப்பு', mr:'FSSAI · साखर/मीठ',
               gu:'FSSAI · ખાંડ/મીઠું', kn:'FSSAI · ಸಕ್ಕರೆ/ಉಪ್ಪು',
               ml:'FSSAI · പഞ്ചസാര/ഉപ്പ്', pa:'FSSAI · ਖੰਡ/ਨਮਕ' } },
    { id: 'fashion',      emoji: '👗', tag: 'fashion_outfit',
      label: { hi:'फैशन', en:'Fashion', bn:'ফ্যাশন', te:'ఫ్యాషన్', ta:'ஃபேஷன்',
               mr:'फॅशन', gu:'ફેશન', kn:'ಫ್ಯಾಶನ್', ml:'ഫാഷൻ', pa:'ਫੈਸ਼ਨ' },
      hint:  { hi:'अवसर · रंग · ट्रेंड', en:'Occasion · colour · trend',
               bn:'উপলক্ষ · রঙ · ট্রেন্ড', te:'సందర్భం · రంగు · ట్రెండ్',
               ta:'நிகழ்ச்சி · நிறம் · ட்ரெண்ட்', mr:'प्रसंग · रंग · ट्रेंड',
               gu:'પ્રસંગ · રંગ · ટ્રેન્ડ', kn:'ಸಂದರ್ಭ · ಬಣ್ಣ · ಟ್ರೆಂಡ್',
               ml:'അവസരം · നിറം · ട്രെൻഡ്', pa:'ਮੌਕਾ · ਰੰਗ · ਟ੍ਰੈਂਡ' } },
    { id: 'document',     emoji: '📄', tag: 'document_read',
      label: { hi:'दस्तावेज़', en:'Document', bn:'নথি', te:'పత్రం', ta:'ஆவணம்',
               mr:'दस्तऐवज', gu:'દસ્તાવેજ', kn:'ದಾಖಲೆ', ml:'രേഖ', pa:'ਦਸਤਾਵੇਜ਼' },
      hint:  { hi:'आपकी भाषा में पढ़कर सुनाएगा', en:'Read aloud in your language',
               bn:'আপনার ভাষায় পড়ে শোনাবে', te:'మీ భాషలో చదివి వినిపిస్తుంది',
               ta:'உங்கள் மொழியில் வாசிக்கும்', mr:'तुमच्या भाषेत वाचून दाखवेल',
               gu:'તમારી ભાષામાં વાંચીને સંભળાવશે', kn:'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಓದಿಸುತ್ತದೆ',
               ml:'നിങ്ങളുടെ ഭാഷയിൽ വായിച്ചുകേൾപ്പിക്കും', pa:'ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ ਪੜ੍ਹ ਕੇ ਸੁਣਾਏਗਾ' } },
    { id: 'bill',         emoji: '🧾', tag: 'bill_check',
      label: { hi:'बिल', en:'Bill', bn:'বিল', te:'బిల్లు', ta:'பில்',
               mr:'बिल', gu:'બિલ', kn:'ಬಿಲ್', ml:'ബിൽ', pa:'ਬਿੱਲ' },
      hint:  { hi:'अधिक चार्ज की जाँच', en:'Overcharging check',
               bn:'অতিরিক্ত চার্জ পরীক্ষা', te:'అదనపు ఛార్జీలు పరిశీలన',
               ta:'அதிக கட்டண சோதனை', mr:'जादा शुल्क तपासणी',
               gu:'વધારે ચાર્જ તપાસ', kn:'ಹೆಚ್ಚು ಶುಲ್ಕ ಪರಿಶೀಲನೆ',
               ml:'അധിക ചാർജ് പരിശോധന', pa:'ਵਾਧੂ ਚਾਰਜ ਜਾਂਚ' } },
    { id: 'legal',        emoji: '⚖️', tag: 'legal_notice',
      label: { hi:'कानूनी नोटिस', en:'Legal notice', bn:'আইনি নোটিশ',
               te:'చట్టపరమైన నోటీసు', ta:'சட்ட அறிவிப்பு', mr:'कायदेशीर सूचना',
               gu:'કાનૂની નોટિસ', kn:'ಕಾನೂನು ನೋಟಿಸ್', ml:'നിയമപരമായ നോട്ടീസ്',
               pa:'ਕਾਨੂੰਨੀ ਨੋਟਿਸ' },
      hint:  { hi:'सरल हिंदी में समझाएगा', en:'Plain-Hindi explanation',
               bn:'সরল হিন্দিতে ব্যাখ্যা', te:'సాధారణ హిందీలో వివరణ',
               ta:'எளிய இந்தியில் விளக்கம்', mr:'सोप्या हिंदीत स्पष्टीकरण',
               gu:'સરળ હિન્દીમાં સમજૂતી', kn:'ಸುಲಭ ಹಿಂದಿಯಲ್ಲಿ ವಿವರಣೆ',
               ml:'ലളിത ഹിന്ദിയിൽ വിശദീകരണം', pa:'ਸਾਦੀ ਹਿੰਦੀ ਵਿੱਚ ਸਮਝਾਏਗਾ' } },
    { id: 'crop',         emoji: '🌾', tag: 'crop_plant',
      label: { hi:'फसल / पौधा', en:'Crop / plant', bn:'ফসল / গাছ',
               te:'పంట / మొక్క', ta:'பயிர் / செடி', mr:'पीक / झाड',
               gu:'પાક / છોડ', kn:'ಬೆಳೆ / ಗಿಡ', ml:'വിള / ചെടി',
               pa:'ਫਸਲ / ਪੌਦਾ' },
      hint:  { hi:'किसानों के लिए रोग पहचान', en:'Disease detection for farmers',
               bn:'কৃষকদের জন্য রোগ শনাক্তকরণ', te:'రైతులకు వ్యాధి గుర్తింపు',
               ta:'விவசாயிகளுக்கு நோய் கண்டறிதல்', mr:'शेतकऱ्यांसाठी रोग ओळख',
               gu:'ખેડૂતો માટે રોગ ઓળખ', kn:'ರೈತರಿಗೆ ರೋಗ ಗುರುತಿಸುವಿಕೆ',
               ml:'കർഷകർക്കായി രോഗ കണ്ടെത്തൽ', pa:'ਕਿਸਾਨਾਂ ਲਈ ਬਿਮਾਰੀ ਪਛਾਣ' } },
    { id: 'prescription', emoji: '💉', tag: 'prescription',
      label: { hi:'प्रिस्क्रिप्शन', en:'Prescription', bn:'প্রেসক্রিপশন',
               te:'ప్రిస్క్రిప్షన్', ta:'மருந்துசீட்டு', mr:'प्रिस्क्रिप्शन',
               gu:'પ્રિસ્ક્રિપ્શન', kn:'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್', ml:'കുറിപ്പടി',
               pa:'ਨੁਸਖਾ' },
      hint:  { hi:'दवाएँ निकालकर रिमाइंडर सेट करेगा',
               en:'Extract medicines + set reminders',
               bn:'ওষুধ বের করে রিমাইন্ডার সেট করবে',
               te:'మందులు తీసి రిమైండర్ సెట్ చేస్తుంది',
               ta:'மருந்துகள் எடுத்து நினைவூட்டல் அமைக்கும்',
               mr:'औषधे काढून रिमाइंडर सेट करेल',
               gu:'દવાઓ કાઢીને રિમાઇન્ડર સેટ કરશે',
               kn:'ಔಷಧಗಳನ್ನು ಹೊರತೆಗೆದು ರಿಮೈಂಡರ್ ಸೆಟ್ ಮಾಡುತ್ತದೆ',
               ml:'മരുന്നുകൾ എടുത്ത് റിമൈൻഡർ സജ്ജമാക്കും',
               pa:'ਦਵਾਈਆਂ ਕੱਢ ਕੇ ਰਿਮਾਈਂਡਰ ਸੈੱਟ ਕਰੇਗਾ' } },
    { id: 'qr',           emoji: '🛡️', tag: 'qr_payment',
      label: { hi:'QR / भुगतान', en:'QR / Payment', bn:'QR / পেমেন্ট',
               te:'QR / చెల్లింపు', ta:'QR / பணம்', mr:'QR / पेमेंट',
               gu:'QR / ચુકવણી', kn:'QR / ಪಾವತಿ', ml:'QR / പേയ്‌മെന്റ്',
               pa:'QR / ਅਦਾਇਗੀ' },
      hint:  { hi:'भुगतान से पहले धोखाधड़ी जाँच', en:'Fraud check before paying',
               bn:'পেমেন্টের আগে জালিয়াতি পরীক্ষা',
               te:'చెల్లింపుకు ముందు మోసం పరిశీలన',
               ta:'பணம் கட்டும் முன் மோசடி சோதனை',
               mr:'पेमेंटआधी फसवणूक तपासणी',
               gu:'ચુકવણી પહેલા છેતરપિંડી તપાસ',
               kn:'ಪಾವತಿಗೂ ಮುನ್ನ ಮೋಸ ಪರಿಶೀಲನೆ',
               ml:'പേയ്‌മെന്റിന് മുമ്പ് വഞ്ചന പരിശോധന',
               pa:'ਅਦਾਇਗੀ ਤੋਂ ਪਹਿਲਾਂ ਧੋਖਾਧੜੀ ਜਾਂਚ' } },
    { id: 'product',      emoji: '🏷️', tag: 'product_authentic',
      label: { hi:'उत्पाद', en:'Product', bn:'পণ্য', te:'ఉత్పత్తి',
               ta:'பொருள்', mr:'उत्पादन', gu:'ઉત્પાદન', kn:'ಉತ್ಪನ್ನ',
               ml:'ഉൽപ്പന്നം', pa:'ਉਤਪਾਦ' },
      hint:  { hi:'नकली उत्पाद की पहचान', en:'Fake-product detection',
               bn:'নকল পণ্য সনাক্তকরণ', te:'నకిలీ ఉత్పత్తి గుర్తింపు',
               ta:'போலி பொருள் கண்டறிதல்', mr:'बनावट उत्पादन ओळख',
               gu:'નકલી ઉત્પાદન ઓળખ', kn:'ನಕಲಿ ಉತ್ಪನ್ನ ಗುರುತಿಸುವಿಕೆ',
               ml:'വ്യാജ ഉൽപ്പന്നം കണ്ടെത്തൽ', pa:'ਨਕਲੀ ਉਤਪਾਦ ਪਛਾਣ' } },
  ];

  // ── UI strings (10 langs).
  var STR = {
    title:         { hi:'क्या स्कैन करना है?', en:'What to scan?', bn:'কী স্ক্যান করবেন?',
                     te:'ఏమి స్కాన్ చేయాలి?', ta:'எதை ஸ்கேன் செய்வது?',
                     mr:'काय स्कॅन करायचे?', gu:'શું સ્કેન કરવું?',
                     kn:'ಏನು ಸ್ಕ್ಯಾನ್ ಮಾಡಬೇಕು?', ml:'എന്ത് സ്കാൻ ചെയ്യണം?',
                     pa:'ਕੀ ਸਕੈਨ ਕਰਨਾ ਹੈ?' },
    scan:          { hi:'स्कैन करें', en:'Scan', bn:'স্ক্যান', te:'స్కాన్',
                     ta:'ஸ்கேன்', mr:'स्कॅन', gu:'સ્કેન', kn:'ಸ್ಕ್ಯಾನ್',
                     ml:'സ്കാൻ', pa:'ਸਕੈਨ' },
    capture:       { hi:'फ़ोटो लें', en:'Capture', bn:'ছবি তোলো', te:'ఫోటో',
                     ta:'புகைப்படம்', mr:'फोटो', gu:'ફોટો', kn:'ಫೋಟೋ',
                     ml:'ഫോട്ടോ', pa:'ਫੋਟੋ' },
    cancel:        { hi:'रद्द', en:'Cancel', bn:'বাতিল', te:'రద్దు',
                     ta:'ரத்து', mr:'रद्द', gu:'રદ', kn:'ರದ್ದು',
                     ml:'റദ്ദാക്കുക', pa:'ਰੱਦ' },
    flip:          { hi:'पलटें', en:'Flip', bn:'ঘোরান', te:'తిప్పు',
                     ta:'திருப்பு', mr:'फिरवा', gu:'ફેરવો', kn:'ತಿರುಗಿಸಿ',
                     ml:'തിരിക്കുക', pa:'ਪਲਟਾਓ' },
    analyzing:     { hi:'चित्ती देख रही है…', en:'Chitti is looking…',
                     bn:'চিত্তি দেখছে…', te:'చిత్తి చూస్తోంది…',
                     ta:'சித்தி பார்க்கிறாள்…', mr:'चित्ती बघत आहे…',
                     gu:'ચિત્તી જોઈ રહી છે…', kn:'ಚಿತ್ತಿ ನೋಡುತ್ತಿದ್ದಾಳೆ…',
                     ml:'ചിത്തി നോക്കുന്നു…', pa:'ਚਿਤੀ ਵੇਖ ਰਹੀ ਹੈ…' },
    nocamera:      { hi:'इस डिवाइस पर कैमरा नहीं खुल सका — फ़ाइल अपलोड करें',
                     en:'Could not open camera on this device — upload a photo instead',
                     bn:'এই ডিভাইসে ক্যামেরা খোলা গেল না — ছবি আপলোড করুন',
                     te:'ఈ పరికరంలో కెమెరా తెరవలేకపోయింది — ఫోటో అప్‌లోడ్ చేయండి',
                     ta:'இந்த சாதனத்தில் கேமராவை திறக்க முடியவில்லை — படத்தை பதிவேற்றவும்',
                     mr:'या डिव्हाइसवर कॅमेरा उघडता आला नाही — फोटो अपलोड करा',
                     gu:'આ ડિવાઇસ પર કેમેરા ખુલી શક્યો નહીં — ફોટો અપલોડ કરો',
                     kn:'ಈ ಸಾಧನದಲ್ಲಿ ಕ್ಯಾಮೆರಾ ತೆರೆಯಲಾಗಲಿಲ್ಲ — ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
                     ml:'ഈ ഉപകരണത്തിൽ കാമറ തുറക്കാനായില്ല — ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യൂ',
                     pa:'ਇਸ ਡਿਵਾਈਸ ਤੇ ਕੈਮਰਾ ਨਹੀਂ ਖੁੱਲ੍ਹਿਆ — ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ' },
    upload:        { hi:'फ़ाइल चुनें', en:'Choose file', bn:'ফাইল নির্বাচন',
                     te:'ఫైల్ ఎంచుకోండి', ta:'கோப்பு தேர்வு',
                     mr:'फाइल निवडा', gu:'ફાઇલ પસંદ કરો',
                     kn:'ಫೈಲ್ ಆಯ್ಕೆ', ml:'ഫയൽ തിരഞ്ഞെടുക്കുക',
                     pa:'ਫਾਈਲ ਚੁਣੋ' },
    error:         { hi:'चित्ती को कुछ नहीं दिखा। फिर से कोशिश करें।',
                     en:'Chitti could not see anything. Try again.',
                     bn:'চিত্তি কিছু দেখেনি। আবার চেষ্টা করুন।',
                     te:'చిత్తికి ఏమీ కనిపించలేదు. మళ్ళీ ప్రయత్నించండి.',
                     ta:'சித்திக்கு எதுவும் தெரியவில்லை. மீண்டும் முயற்சிக்கவும்.',
                     mr:'चित्तीला काही दिसले नाही. पुन्हा प्रयत्न करा.',
                     gu:'ચિત્તીને કંઈ દેખાયું નહીં. ફરી પ્રયત્ન કરો.',
                     kn:'ಚಿತ್ತಿಗೆ ಏನೂ ಕಾಣಿಸಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
                     ml:'ചിത്തിക്ക് ഒന്നും കാണാനായില്ല. വീണ്ടും ശ്രമിക്കൂ.',
                     pa:'ਚਿਤੀ ਨੂੰ ਕੁਝ ਨਹੀਂ ਦਿਖਿਆ। ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।' },
    apidown:       { hi:'सर्वर बंद है — फ़ोटो डिवाइस पर सहेजा गया, बाद में देखा जाएगा',
                     en:'Server unreachable — photo saved on device, will analyse later',
                     bn:'সার্ভার পৌঁছানো যাচ্ছে না — ফোটো ডিভাইসে সেভ হয়েছে, পরে বিশ্লেষণ হবে',
                     te:'సర్వర్ చేరుకోలేకపోతున్నాం — ఫోటో పరికరంలో సేవ్ చేయబడింది, తర్వాత విశ్లేషించబడుతుంది',
                     ta:'சேவையகம் கிடைக்கவில்லை — படம் சாதனத்தில் சேமிக்கப்பட்டது',
                     mr:'सर्व्हर बंद आहे — फोटो डिव्हाइसवर साठवला, नंतर तपासला जाईल',
                     gu:'સર્વર બંધ છે — ફોટો ડિવાઇસ પર સેવ થયો, પાછળથી તપાસાશે',
                     kn:'ಸರ್ವರ್ ತಲುಪಲಾಗದು — ಫೋಟೋ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ',
                     ml:'സെർവർ ലഭ്യമല്ല — ഫോട്ടോ ഉപകരണത്തിൽ സേവ് ചെയ്തു',
                     pa:'ਸਰਵਰ ਬੰਦ ਹੈ — ਫੋਟੋ ਡਿਵਾਈਸ ਤੇ ਸੇਵ ਹੋਈ, ਬਾਅਦ ਵਿੱਚ ਜਾਂਚਾਂਗੇ' },
    result_title:  { hi:'चित्ती का जवाब', en:"Chitti's answer", bn:'চিত্তির উত্তর',
                     te:'చిత్తి జవాబు', ta:'சித்தியின் பதில்', mr:'चित्तीचे उत्तर',
                     gu:'ચિત્તીનો જવાબ', kn:'ಚಿತ್ತಿಯ ಉತ್ತರ', ml:'ചിത്തിയുടെ ഉത്തരം',
                     pa:'ਚਿਤੀ ਦਾ ਜਵਾਬ' },
  };

  // ── Helpers
  function lang() {
    try {
      var a = global.Chitti && global.Chitti.a11y && global.Chitti.a11y.lang;
      if (a && a.current && LANGS[a.current]) return a.current;
    } catch (_) {}
    try {
      var n = (navigator.language || 'en').split('-')[0];
      if (LANGS[n]) return n;
    } catch (_) {}
    return 'hi'; // Hindi-first per §1 of SAHAYAI_MASTER
  }
  function t(key) {
    var l = lang();
    var bag = STR[key] || {};
    return bag[l] || bag.hi || bag.en || key;
  }
  function modeLabel(m) {
    var l = lang();
    return (m.label && m.label[l]) || m.label.hi || m.label.en;
  }
  function modeHint(m) {
    var l = lang();
    return (m.hint && m.hint[l]) || m.hint.hi || m.hint.en;
  }
  function speak(text) {
    try {
      if (global.Chitti && global.Chitti.a11y && typeof global.Chitti.a11y.speak === 'function') {
        global.Chitti.a11y.speak(text, lang());
        return;
      }
      if (global.speechSynthesis) {
        var u = new SpeechSynthesisUtterance(text);
        u.lang = lang() === 'en' ? 'en-IN' : (lang() + '-IN');
        global.speechSynthesis.speak(u);
      }
    } catch (_) {}
  }

  // Resolve the API base. The /api/camera/analyze endpoint lives on
  // chitti-vaani-api (per §2 row 1: Vaani is the only user interface; camera
  // is a Vaani capability surfaced on every page). Pages may override via
  // window.CHITTI_CAMERA_ANALYZE_API to point at a local dev backend.
  var DEFAULT_VAANI_API = 'https://chitti-vaani-api-production.up.railway.app';
  function apiBase() {
    return (global.CHITTI_CAMERA_ANALYZE_API ||
            global.CHITTI_VAANI_API ||
            DEFAULT_VAANI_API).replace(/\/$/, '');
  }
  function userToken() {
    try {
      var k = 'chitti_user_token_v1';
      var v = localStorage.getItem(k);
      if (v && v.length >= 8) return v;
      v = (global.crypto && crypto.randomUUID && crypto.randomUUID()) ||
          ('cam-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));
      localStorage.setItem(k, v);
      return v;
    } catch (_) {
      return 'cam-anon-' + Date.now().toString(36);
    }
  }

  // ── Styles (scoped via .chitti-cam-* class prefix). Indian flag palette.
  var STYLES = [
    '.chitti-cam-fab{position:fixed;left:16px;bottom:88px;width:56px;height:56px;border-radius:50%;',
    'background:linear-gradient(135deg,#FF9933,#E07B1D);color:#fff;border:none;font-size:26px;',
    'cursor:pointer;display:flex;align-items:center;justify-content:center;',
    'box-shadow:0 8px 24px rgba(255,153,51,.45);z-index:9500;transition:transform .15s}',
    '.chitti-cam-fab:hover{transform:scale(1.06)}',
    '.chitti-cam-fab:focus-visible{outline:3px solid #000080;outline-offset:4px}',
    '.chitti-cam-fab:active{transform:scale(.96)}',
    '@media(max-width:380px){.chitti-cam-fab{left:12px;bottom:84px}}',

    '.chitti-cam-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9600;',
    'display:none;align-items:flex-end;justify-content:center;padding:0;animation:chitti-cam-fade .18s ease-out}',
    '.chitti-cam-overlay[aria-hidden="false"]{display:flex}',
    '@keyframes chitti-cam-fade{from{opacity:0}to{opacity:1}}',

    '.chitti-cam-sheet{background:#fff;width:100%;max-width:520px;border-radius:18px 18px 0 0;',
    'padding:18px 16px 24px;max-height:90vh;overflow-y:auto;',
    'box-shadow:0 -10px 30px rgba(0,0,0,.25)}',
    '.chitti-cam-grab{width:44px;height:5px;background:#e5e7eb;border-radius:3px;margin:-6px auto 12px}',
    '.chitti-cam-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px}',
    '.chitti-cam-title{font-size:18px;font-weight:800;color:#000080;margin:0;flex:1}',
    '.chitti-cam-close{background:transparent;border:1px solid #e5e7eb;border-radius:10px;',
    'width:48px;height:48px;font-size:20px;cursor:pointer;color:#666}',
    '.chitti-cam-close:focus-visible{outline:3px solid #FF9933;outline-offset:2px}',

    '.chitti-cam-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}',
    '@media(min-width:480px){.chitti-cam-grid{grid-template-columns:repeat(3,1fr)}}',
    '.chitti-cam-mode{display:flex;flex-direction:column;align-items:flex-start;gap:4px;',
    'padding:14px 12px;min-height:88px;background:#FFF7EC;border:1px solid #FFE0BD;border-radius:14px;',
    'cursor:pointer;text-align:left;font-family:inherit;transition:all .15s}',
    '.chitti-cam-mode:hover{border-color:#FF9933;background:#fff;transform:translateY(-1px)}',
    '.chitti-cam-mode:focus-visible{outline:3px solid #000080;outline-offset:2px}',
    '.chitti-cam-mode-emoji{font-size:28px;line-height:1}',
    '.chitti-cam-mode-label{font-size:14px;font-weight:800;color:#1a1a1a}',
    '.chitti-cam-mode-hint{font-size:11px;color:#666;line-height:1.3}',

    /* Camera viewfinder */
    '.chitti-cam-view{position:fixed;inset:0;background:#000;z-index:9700;',
    'display:none;flex-direction:column;align-items:center;justify-content:space-between;padding:14px}',
    '.chitti-cam-view[aria-hidden="false"]{display:flex}',
    '.chitti-cam-video{flex:1;width:100%;max-height:70vh;background:#000;border-radius:14px;object-fit:cover}',
    '.chitti-cam-controls{display:flex;align-items:center;justify-content:space-between;width:100%;',
    'max-width:520px;gap:14px;margin-top:14px}',
    '.chitti-cam-shutter{width:72px;height:72px;border-radius:50%;background:#fff;border:4px solid #FF9933;',
    'cursor:pointer;font-size:32px;display:flex;align-items:center;justify-content:center;',
    'box-shadow:0 6px 20px rgba(255,153,51,.5)}',
    '.chitti-cam-shutter:active{transform:scale(.92)}',
    '.chitti-cam-btn-side{min-width:48px;min-height:48px;background:rgba(255,255,255,.16);',
    'border:1px solid rgba(255,255,255,.34);color:#fff;border-radius:12px;padding:10px 14px;',
    'font-size:14px;font-weight:700;cursor:pointer}',
    '.chitti-cam-btn-side:focus-visible{outline:3px solid #FF9933;outline-offset:2px}',

    /* Honest no-camera fallback */
    '.chitti-cam-fallback{background:#fff;border-radius:14px;padding:18px;margin:14px 0;text-align:center}',
    '.chitti-cam-fallback p{margin:0 0 12px;font-size:14px;color:#1a1a1a;line-height:1.5}',
    '.chitti-cam-upload-btn{display:inline-block;padding:12px 22px;background:#138808;color:#fff;',
    'border:none;border-radius:10px;font-weight:800;cursor:pointer;min-height:48px}',

    /* Result box — picked up by feedback-widget.js via data-chitti-response */
    '.chitti-cam-result{margin:14px 16px;background:#fff;border:1px solid #FF9933;border-radius:14px;',
    'padding:14px;box-shadow:0 4px 14px rgba(255,153,51,.18)}',
    '.chitti-cam-result-head{font-size:14px;font-weight:800;color:#FF9933;display:flex;',
    'align-items:center;gap:6px;margin-bottom:8px}',
    '.chitti-cam-result-text{font-size:15px;line-height:1.6;white-space:pre-wrap;color:#1a1a1a}',

    /* Spinner */
    '.chitti-cam-spinner{display:inline-block;width:18px;height:18px;border:2px solid #FF9933;',
    'border-top-color:transparent;border-radius:50%;animation:chitti-cam-spin .8s linear infinite;',
    'vertical-align:middle;margin-right:8px}',
    '@keyframes chitti-cam-spin{to{transform:rotate(360deg)}}',
  ].join('');

  function injectStyles() {
    if (document.getElementById('chitti-cam-universal-style')) return;
    var s = document.createElement('style');
    s.id = 'chitti-cam-universal-style';
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  // ── Build the floating "Scan" button.
  function buildFab() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chitti-cam-fab';
    btn.id = 'chitti-cam-fab';
    btn.setAttribute('aria-label', t('scan') + ' — ' + t('title'));
    btn.setAttribute('title', t('scan'));
    btn.textContent = '📷';
    btn.addEventListener('click', openPicker);
    return btn;
  }

  // ── Build the mode-picker bottom sheet.
  function buildPicker() {
    var overlay = document.createElement('div');
    overlay.className = 'chitti-cam-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'chitti-cam-title');
    overlay.setAttribute('aria-hidden', 'true');

    var sheet = document.createElement('div');
    sheet.className = 'chitti-cam-sheet';

    var grab = document.createElement('div');
    grab.className = 'chitti-cam-grab';
    grab.setAttribute('aria-hidden', 'true');
    sheet.appendChild(grab);

    var head = document.createElement('div');
    head.className = 'chitti-cam-head';
    var h2 = document.createElement('h2');
    h2.id = 'chitti-cam-title';
    h2.className = 'chitti-cam-title';
    h2.textContent = t('title');
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'chitti-cam-close';
    close.setAttribute('aria-label', t('cancel'));
    close.textContent = '✕';
    close.addEventListener('click', closePicker);
    head.appendChild(h2);
    head.appendChild(close);
    sheet.appendChild(head);

    var grid = document.createElement('div');
    grid.className = 'chitti-cam-grid';
    MODES.forEach(function (m) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'chitti-cam-mode';
      tile.setAttribute('data-mode', m.id);
      tile.setAttribute('aria-label', modeLabel(m) + ' — ' + modeHint(m));
      tile.innerHTML =
        '<span class="chitti-cam-mode-emoji" aria-hidden="true">' + m.emoji + '</span>' +
        '<span class="chitti-cam-mode-label">' + modeLabel(m) + '</span>' +
        '<span class="chitti-cam-mode-hint">' + modeHint(m) + '</span>';
      tile.addEventListener('click', function () { startCamera(m); });
      grid.appendChild(tile);
    });
    sheet.appendChild(grid);

    overlay.appendChild(sheet);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closePicker();
    });
    return overlay;
  }

  function openPicker() {
    var ov = document.getElementById('chitti-cam-overlay') || (function () {
      var built = buildPicker();
      built.id = 'chitti-cam-overlay';
      document.body.appendChild(built);
      return built;
    })();
    // Refresh labels if language changed since last open
    var h2 = ov.querySelector('#chitti-cam-title');
    if (h2) h2.textContent = t('title');
    ov.querySelectorAll('.chitti-cam-mode').forEach(function (tile, i) {
      var m = MODES[i];
      if (!m) return;
      var lbl = tile.querySelector('.chitti-cam-mode-label');
      var hnt = tile.querySelector('.chitti-cam-mode-hint');
      if (lbl) lbl.textContent = modeLabel(m);
      if (hnt) hnt.textContent = modeHint(m);
      tile.setAttribute('aria-label', modeLabel(m) + ' — ' + modeHint(m));
    });
    ov.setAttribute('aria-hidden', 'false');
    // Auto-announce for blind users
    try {
      var profile = JSON.parse(localStorage.getItem('chitti_a11y_v1') || '{}').profile || {};
      if (profile.blind) speak(t('title'));
    } catch (_) {}
    var firstMode = ov.querySelector('.chitti-cam-mode');
    if (firstMode) setTimeout(function () { firstMode.focus(); }, 50);
  }

  function closePicker() {
    var ov = document.getElementById('chitti-cam-overlay');
    if (ov) ov.setAttribute('aria-hidden', 'true');
    var fab = document.getElementById('chitti-cam-fab');
    if (fab) fab.focus();
  }

  // ── Camera viewfinder
  var _stream = null;
  var _currentMode = null;
  var _facing = 'environment';

  function buildView() {
    var v = document.createElement('div');
    v.className = 'chitti-cam-view';
    v.id = 'chitti-cam-view';
    v.setAttribute('role', 'dialog');
    v.setAttribute('aria-modal', 'true');
    v.setAttribute('aria-hidden', 'true');

    var video = document.createElement('video');
    video.className = 'chitti-cam-video';
    video.id = 'chitti-cam-video';
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    v.appendChild(video);

    var ctl = document.createElement('div');
    ctl.className = 'chitti-cam-controls';

    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'chitti-cam-btn-side';
    cancel.textContent = t('cancel');
    cancel.setAttribute('aria-label', t('cancel'));
    cancel.addEventListener('click', closeCamera);

    var shutter = document.createElement('button');
    shutter.type = 'button';
    shutter.className = 'chitti-cam-shutter';
    shutter.textContent = '●';
    shutter.setAttribute('aria-label', t('capture'));
    shutter.addEventListener('click', capturePhoto);

    var flip = document.createElement('button');
    flip.type = 'button';
    flip.className = 'chitti-cam-btn-side';
    flip.textContent = '⟳';
    flip.setAttribute('aria-label', t('flip'));
    flip.addEventListener('click', flipCamera);

    ctl.appendChild(cancel);
    ctl.appendChild(shutter);
    ctl.appendChild(flip);
    v.appendChild(ctl);
    return v;
  }

  async function startCamera(mode) {
    _currentMode = mode;
    closePicker();

    var view = document.getElementById('chitti-cam-view') || (function () {
      var built = buildView();
      document.body.appendChild(built);
      return built;
    })();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('no_media_devices');
      }
      _stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: _facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      var vid = document.getElementById('chitti-cam-video');
      vid.srcObject = _stream;
      view.setAttribute('aria-hidden', 'false');
      // Refresh button labels in case lang changed
      view.querySelectorAll('.chitti-cam-btn-side').forEach(function (b, i) {
        if (i === 0) { b.textContent = t('cancel'); b.setAttribute('aria-label', t('cancel')); }
        else         { b.textContent = '⟳';        b.setAttribute('aria-label', t('flip')); }
      });
      try {
        var profile = JSON.parse(localStorage.getItem('chitti_a11y_v1') || '{}').profile || {};
        if (profile.blind) speak(modeLabel(mode) + ' — ' + t('capture'));
      } catch (_) {}
    } catch (e) {
      // No camera / permission denied / not in HTTPS context → fall back to upload
      offerUpload(mode, String(e && e.message || e));
    }
  }

  async function flipCamera() {
    _facing = (_facing === 'environment') ? 'user' : 'environment';
    if (_stream) {
      _stream.getTracks().forEach(function (t) { t.stop(); });
      _stream = null;
    }
    if (_currentMode) startCamera(_currentMode);
  }

  function closeCamera() {
    var view = document.getElementById('chitti-cam-view');
    if (view) view.setAttribute('aria-hidden', 'true');
    if (_stream) {
      _stream.getTracks().forEach(function (t) { t.stop(); });
      _stream = null;
    }
  }

  function capturePhoto() {
    var vid = document.getElementById('chitti-cam-video');
    if (!vid || !vid.videoWidth) return;
    var c = document.createElement('canvas');
    var maxW = 1024;
    var scale = Math.min(1, maxW / vid.videoWidth);
    c.width = Math.floor(vid.videoWidth * scale);
    c.height = Math.floor(vid.videoHeight * scale);
    c.getContext('2d').drawImage(vid, 0, 0, c.width, c.height);
    var b64 = c.toDataURL('image/jpeg', 0.82);
    closeCamera();
    analyze(b64, _currentMode);
  }

  function offerUpload(mode, reason) {
    var ov = document.getElementById('chitti-cam-overlay') || (function () {
      var built = buildPicker();
      built.id = 'chitti-cam-overlay';
      document.body.appendChild(built);
      return built;
    })();
    var sheet = ov.querySelector('.chitti-cam-sheet');
    // Replace the grid with a file-upload fallback.
    var grid = sheet.querySelector('.chitti-cam-grid');
    if (grid) grid.style.display = 'none';
    var existing = sheet.querySelector('.chitti-cam-fallback');
    if (existing) existing.remove();
    var fb = document.createElement('div');
    fb.className = 'chitti-cam-fallback';
    fb.innerHTML = '<p>' + t('nocamera') + '</p>';
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.style.display = 'none';
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () { analyze(fr.result, mode); };
      fr.readAsDataURL(f);
    });
    var pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'chitti-cam-upload-btn';
    pick.textContent = t('upload');
    pick.addEventListener('click', function () { inp.click(); });
    fb.appendChild(pick);
    fb.appendChild(inp);
    sheet.appendChild(fb);
    ov.setAttribute('aria-hidden', 'false');
    try { speak(t('nocamera')); } catch (_) {}
    try { console.info('[chitti-cam] camera unavailable, offered upload. reason:', reason); }
    catch (_) {}
  }

  // ── Analyze: POST image to /api/camera/analyze, render result.
  async function analyze(b64, mode) {
    var host = ensureResultHost();
    var box = document.createElement('div');
    box.className = 'chitti-cam-result';
    var boxId = 'cam-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    box.id = boxId;
    box.setAttribute('data-chitti-response', boxId); // feedback-widget.js attaches here
    box.setAttribute('data-chitti-section', t('result_title') + ' · ' + modeLabel(mode));
    box.setAttribute('role', 'region');
    box.setAttribute('aria-live', 'polite');
    box.innerHTML =
      '<div class="chitti-cam-result-head">' +
        '<span class="chitti-cam-spinner" aria-hidden="true"></span>' +
        '<span>' + t('analyzing') + '</span>' +
      '</div>';
    host.appendChild(box);
    try { box.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
    try { speak(t('analyzing')); } catch (_) {}

    var base = apiBase();
    var payload = {
      user_token:  userToken(),
      mode:        mode.tag,
      mode_label:  modeLabel(mode),
      lang:        lang(),
      image_b64:   b64,
      page:        (location.pathname.split('/').pop() || 'index'),
    };

    if (!base) {
      // Honest stub: no API base → queue via chitti_camera.js if loaded.
      try {
        if (global.Chitti && global.Chitti.camera && typeof global.Chitti.camera.capture === 'function') {
          await global.Chitti.camera.capture({
            what:   mode.tag,
            product:(location.pathname.split('/').pop() || 'index').replace(/\.html$/, ''),
            result: 'unclear',
            image_b64: b64,
            meta:   { reason: 'no_api_base', mode: mode.tag, lang: lang() },
          });
        }
      } catch (_) {}
      renderResult(box, t('apidown'), mode);
      return;
    }

    try {
      var r = await fetch(base + '/api/camera/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('http ' + r.status);
      var j = await r.json();
      var text = (j && (j.text || j.answer)) || t('error');
      renderResult(box, text, mode, j && j.capture_id);
    } catch (e) {
      try { console.warn('[chitti-cam] analyze failed:', e); } catch (_) {}
      // Best-effort offline queue
      try {
        if (global.Chitti && global.Chitti.camera && typeof global.Chitti.camera.capture === 'function') {
          await global.Chitti.camera.capture({
            what:   mode.tag,
            product:(location.pathname.split('/').pop() || 'index').replace(/\.html$/, ''),
            result: 'unclear',
            image_b64: b64,
            meta:   { error: String(e && e.message || e), mode: mode.tag, lang: lang() },
          });
        }
      } catch (_) {}
      renderResult(box, t('error'), mode);
    }
  }

  function renderResult(box, text, mode, captureId) {
    box.innerHTML =
      '<div class="chitti-cam-result-head">' +
        '<span aria-hidden="true">🤖</span>' +
        '<span>' + t('result_title') + ' — ' + modeLabel(mode) + '</span>' +
      '</div>' +
      '<div class="chitti-cam-result-text">' + escapeHTML(text) + '</div>';
    if (captureId) box.setAttribute('data-chitti-capture-id', captureId);
    try { speak(text); } catch (_) {}
    // Hint feedback-widget.js to attach (it auto-attaches on mutation, but
    // call its public re-scan if exposed).
    try {
      if (global.ChittiFeedback && typeof global.ChittiFeedback.scan === 'function') {
        global.ChittiFeedback.scan();
      }
    } catch (_) {}
  }

  function escapeHTML(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function ensureResultHost() {
    var id = 'chitti-cam-results';
    var host = document.getElementById(id);
    if (host) return host;
    host = document.createElement('div');
    host.id = id;
    // Insert near the top of <main>, or at the end of <body>, so results are
    // visible without scrolling deep into the page.
    var main = document.querySelector('main') || document.body;
    main.insertBefore(host, main.firstChild);
    return host;
  }

  // ── Wire it up.
  function init() {
    injectStyles();
    if (document.getElementById('chitti-cam-fab')) return;
    document.body.appendChild(buildFab());
    // Re-translate the FAB aria-label when language changes.
    try {
      document.addEventListener('chitti:langchange', function () {
        var fab = document.getElementById('chitti-cam-fab');
        if (fab) {
          fab.setAttribute('aria-label', t('scan') + ' — ' + t('title'));
          fab.setAttribute('title', t('scan'));
        }
      });
    } catch (_) {}
    global.Chitti = global.Chitti || {};
    global.Chitti.cameraUniversal = {
      open: openPicker,
      close: closePicker,
      analyze: analyze,
      MODES: MODES,
      LANGS: LANGS,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
