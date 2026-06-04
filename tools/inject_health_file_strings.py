# -*- coding: utf-8 -*-
"""
inject_health_file_strings.py

Adds Chitti Health File's page-specific UI strings (plus the shared
bottom-nav / scan-modal chrome) to the chitti_lang.js T auto-translate
dictionary, so the page switches language via the Vaani-anchored
substrate (chitti_lang.js) with ZERO HTML changes.

Root cause this fixes: chitti_health_file.html carries no data-i18n /
data-vai-i18n tags, so it relied purely on the T dictionary — which had
none of its strings → only ~26% of the UI translated. (QA 2026-06-05.)

Contract (SAHAYAI_MASTER §2 Voice strategy + chitti_i18n.js header):
 - 9 Vaani primary languages (en, hi, ta, te, bn, mr, gu, kn, ml) get
   real translations for chrome / labels / buttons / nav.
 - Long medical-prose paragraphs get full Hindi; other primaries +
   the 17 secondary languages honestly Hindi-fallback (never silent
   English). Native QA for the 8 non-Hindi primaries is flagged in the
   QA report as a remaining limitation.
 - Technical / brand tokens (AES-256-GCM, DeepSeek, the literal voice
   confirm phrase, UPI…) are intentionally NOT added — they stay
   English per CTO.md §6.

Idempotent: guarded by a marker comment; re-running replaces the block.
"""
import json, re, io

LANG = 'chitti_lang.js'
MARKER = '/* === HEALTH FILE STRINGS (inject_health_file_strings.py) === */'
MARKER_END = '/* === END HEALTH FILE STRINGS === */'

PRIMARY8 = ['ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml']
SECONDARY = ['pa', 'or', 'as', 'ur', 'sa', 'mai', 'kok', 'doi',
             'ks', 'ne', 'sd', 'mni', 'sat', 'bho', 'raj', 'kru', 'hoc']


def E(en, hi, ta=None, te=None, bn=None, mr=None, gu=None, kn=None, ml=None):
    """Build a 26-language entry. Missing primaries + all secondaries
    fall back to Hindi (honest, per Voice-Strategy lock)."""
    prim = {'ta': ta, 'te': te, 'bn': bn, 'mr': mr, 'gu': gu, 'kn': kn, 'ml': ml}
    obj = {'en': en, 'hi': hi}
    for k, v in prim.items():
        obj[k] = v if v is not None else hi
    for k in SECONDARY:
        obj[k] = hi
    return en, obj


ENTRIES = [
    # ── Disclaimer / hero ──────────────────────────────────────────
    E("NOT a doctor.", "डॉक्टर नहीं है।",
      "மருத்துவர் அல்ல.", "డాక్టర్ కాదు.", "ডাক্তার নন।", "डॉक्टर नाही.",
      "ડૉક્ટર નથી.", "ವೈದ್ಯರಲ್ಲ.", "ഡോക്ടറല്ല."),
    E("Never", "कभी नहीं",
      "ஒருபோதும்", "ఎప్పటికీ కాదు", "কখনও নয়", "कधीही नाही",
      "ક્યારેય નહીં", "ಎಂದಿಗೂ ಇಲ್ಲ", "ഒരിക്കലും ഇല്ല"),
    E("substitutes for professional medical advice.",
      "पेशेवर चिकित्सा सलाह का विकल्प नहीं है।",
      "தொழில்முறை மருத்துவ ஆலோசனைக்கு மாற்றாகாது.",
      "నిపుణుల వైద్య సలహాకు ప్రత్యామ్నాయం కాదు.",
      "পেশাদার চিকিৎসা পরামর্শের বিকল্প নয়।",
      "व्यावसायिक वैद्यकीय सल्ल्याचा पर्याय नाही.",
      "વ્યાવસાયિક તબીબી સલાહનો વિકલ્પ નથી.",
      "ವೃತ್ತಿಪರ ವೈದ್ಯಕೀಯ ಸಲಹೆಗೆ ಪರ್ಯಾಯವಲ್ಲ.",
      "പ്രൊഫഷണൽ വൈദ്യോപദേശത്തിന് പകരമാകില്ല."),
    E("Read full disclaimer →", "पूरा अस्वीकरण पढ़ें →",
      "முழு மறுப்பை படிக்க →", "పూర్తి నిరాకరణ చదవండి →",
      "সম্পূর্ণ দাবিত্যাগ পড়ুন →", "संपूर्ण अस्वीकरण वाचा →",
      "સંપૂર્ણ અસ્વીકરણ વાંચો →", "ಪೂರ್ಣ ಹಕ್ಕು ನಿರಾಕರಣೆ ಓದಿ →",
      "പൂർണ്ണ നിരാകരണം വായിക്കുക →"),
    E("🩺 This page is moving into Chitti MedUPI →",
      "🩺 यह पेज Chitti MedUPI में जा रहा है →",
      "🩺 இந்தப் பக்கம் Chitti MedUPI-க்கு மாறுகிறது →",
      "🩺 ఈ పేజీ Chitti MedUPI లోకి మారుతోంది →",
      "🩺 এই পেজটি Chitti MedUPI-তে যাচ্ছে →",
      "🩺 हे पेज Chitti MedUPI मध्ये जात आहे →",
      "🩺 આ પેજ Chitti MedUPI માં જઈ રહ્યું છે →",
      "🩺 ಈ ಪುಟ Chitti MedUPI ಗೆ ಸ್ಥಳಾಂತರಗೊಳ್ಳುತ್ತಿದೆ →",
      "🩺 ഈ പേജ് Chitti MedUPI ലേക്ക് മാറുന്നു →"),
    E("Chitti Health File stores and explains your medical documents.",
      "Chitti Health File आपके मेडिकल दस्तावेज़ संभालकर रखता है और समझाता है।"),
    E('Upload prescriptions, blood reports, MRI scans, insurance policies. Chitti READS them, extracts every detail, sets the right reminders, and lets you ask "Wife ki diabetes ka history dikhao" in your language. Per-family-member profiles. Encrypted at rest. Shared with a doctor only after your spoken "haan".',
      'पर्चे, ब्लड रिपोर्ट, MRI स्कैन, बीमा पॉलिसी अपलोड करें। Chitti उन्हें पढ़ता है, हर जानकारी निकालता है, सही रिमाइंडर सेट करता है, और आपको अपनी भाषा में "Wife ki diabetes ka history dikhao" पूछने देता है। हर परिवार के सदस्य की अलग प्रोफ़ाइल। एन्क्रिप्टेड स्टोरेज। डॉक्टर के साथ सिर्फ़ आपके बोले गए "हाँ" के बाद ही साझा।'),
    # ── Privacy contract block ─────────────────────────────────────
    E("🛡️ Privacy contract:", "🛡️ गोपनीयता अनुबंध:",
      "🛡️ தனியுரிமை ஒப்பந்தம்:", "🛡️ గోప్యతా ఒప్పందం:",
      "🛡️ গোপনীয়তা চুক্তি:", "🛡️ गोपनीयता करार:",
      "🛡️ ગોપનીયતા કરાર:", "🛡️ ಗೌಪ್ಯತಾ ಒಪ್ಪಂದ:",
      "🛡️ സ്വകാര്യതാ കരാർ:"),
    E("Documents encrypted at rest with AES-256-GCM. Only YOU (with your user_token) can decrypt. Doctor share requires per-use voice",
      "दस्तावेज़ AES-256-GCM से एन्क्रिप्टेड रहते हैं। सिर्फ़ आप (अपने user_token के साथ) ही उन्हें खोल सकते हैं। डॉक्टर के साथ साझा करने के लिए हर बार आवाज़ से सहमति ज़रूरी है"),
    E("every single time.", "हर एक बार।",
      "ஒவ்வொரு முறையும்.", "ప్రతిసారీ.", "প্রতিবারই।", "प्रत्येक वेळी.",
      "દર વખતે.", "ಪ್ರತಿ ಬಾರಿಯೂ.", "ഓരോ തവണയും."),
    E("No health data used for AI training",
      "AI प्रशिक्षण के लिए कोई स्वास्थ्य डेटा इस्तेमाल नहीं होता",
      "AI பயிற்சிக்கு உடல்நல தரவு பயன்படுத்தப்படாது",
      "AI శిక్షణ కోసం ఆరోగ్య డేటా వాడబడదు",
      "AI প্রশিক্ষণে কোনো স্বাস্থ্য তথ্য ব্যবহার হয় না",
      "AI प्रशिक्षणासाठी कोणताही आरोग्य डेटा वापरला जात नाही",
      "AI તાલીમ માટે કોઈ આરોગ્ય ડેટા વપરાતો નથી",
      "AI ತರಬೇತಿಗೆ ಯಾವುದೇ ಆರೋಗ್ಯ ಡೇಟಾ ಬಳಸುವುದಿಲ್ಲ",
      "AI പരിശീലനത്തിന് ആരോഗ്യ ഡാറ്റ ഉപയോഗിക്കില്ല"),
    E("Chitti's Golden Rule:", "Chitti का सुनहरा नियम:",
      "Chitti-யின் தங்க விதி:", "Chitti బంగారు నియమం:",
      "Chitti-র সোনালী নিয়ম:", "Chitti चा सुवर्ण नियम:",
      "Chitti નો સુવર્ણ નિયમ:", "Chitti ಯ ಚಿನ್ನದ ನಿಯಮ:",
      "Chitti യുടെ സുവർണ്ണ നിയമം:"),
    E("every share / upload / reminder fires through",
      "हर शेयर / अपलोड / रिमाइंडर इससे होकर गुज़रता है"),
    E(". Silence = wait. Never defaults to Yes.",
      "। चुप्पी = प्रतीक्षा। कभी अपने आप हाँ नहीं।"),
    E("Full T&C →", "पूरे नियम व शर्तें →",
      "முழு விதிமுறைகள் →", "పూర్తి నిబంధనలు →", "সম্পূর্ণ শর্তাবলী →",
      "संपूर्ण अटी व शर्ती →", "સંપૂર્ણ નિયમો અને શરતો →",
      "ಪೂರ್ಣ ನಿಯಮಗಳು →", "പൂർണ്ണ നിബന്ധനകൾ →"),
    # ── Badges ─────────────────────────────────────────────────────
    E("Per-use voice consent", "हर बार आवाज़ से सहमति",
      "ஒவ்வொரு முறையும் குரல் ஒப்புதல்", "ప్రతిసారీ వాయిస్ సమ్మతి",
      "প্রতিবার ভয়েস সম্মতি", "प्रत्येक वेळी आवाज संमती",
      "દર વખતે વોઇસ સંમતિ", "ಪ್ರತಿ ಬಾರಿ ಧ್ವನಿ ಒಪ್ಪಿಗೆ",
      "ഓരോ തവണയും വോയ്സ് സമ്മതം"),
    E("Phase B-4: Reminder dispatch LIVE", "Phase B-4: रिमाइंडर डिस्पैच LIVE"),
    E("Phase B-1: MRI/discharge auto-extract", "Phase B-1: MRI/discharge ऑटो-एक्सट्रैक्ट"),
    # ── Profile bar ────────────────────────────────────────────────
    E("Profile:", "प्रोफ़ाइल:",
      "சுயவிவரம்:", "ప్రొఫైల్:", "প্রোফাইল:", "प्रोफाइल:",
      "પ્રોફાઇલ:", "ಪ್ರೊಫೈಲ್:", "പ്രൊഫൈൽ:"),
    E("＋ Add family member", "＋ परिवार का सदस्य जोड़ें",
      "＋ குடும்ப உறுப்பினரைச் சேர்க்க", "＋ కుటుంబ సభ్యుడిని జోడించండి",
      "＋ পরিবারের সদস্য যোগ করুন", "＋ कुटुंब सदस्य जोडा",
      "＋ કુટુંબના સભ્યને ઉમેરો", "＋ ಕುಟುಂಬ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ",
      "＋ കുടുംബാംഗത്തെ ചേർക്കുക"),
    E("Switch between Self · Wife · Mother · Father · Child anytime",
      "Self · Wife · Mother · Father · Child के बीच कभी भी बदलें"),
    # ── Tab bar ────────────────────────────────────────────────────
    E("📤 Upload", "📤 अपलोड",
      "📤 பதிவேற்று", "📤 అప్‌లోడ్", "📤 আপলোড", "📤 अपलोड",
      "📤 અપલોડ", "📤 ಅಪ್‌ಲೋಡ್", "📤 അപ്‌ലോഡ്"),
    E("🕒 Timeline", "🕒 टाइमलाइन",
      "🕒 காலவரிசை", "🕒 టైమ్‌లైన్", "🕒 টাইমলাইন", "🕒 टाइमलाइन",
      "🕒 ટાઇમલાઇન", "🕒 ಟೈಮ್‌ಲೈನ್", "🕒 ടൈംലൈൻ"),
    E("⏰ Reminders", "⏰ रिमाइंडर",
      "⏰ நினைவூட்டல்கள்", "⏰ రిమైండర్లు", "⏰ রিমাইন্ডার", "⏰ स्मरणपत्रे",
      "⏰ રિમાઇન્ડર", "⏰ ಜ್ಞಾಪನೆಗಳು", "⏰ ഓർമ്മപ്പെടുത്തലുകൾ"),
    E("📈 Vitals", "📈 वाइटल्स",
      "📈 உயிர்ச்சக்தி", "📈 వైటల్స్", "📈 ভাইটাল", "📈 व्हायटल्स",
      "📈 વાઇટલ્સ", "📈 ವೈಟಲ್ಸ್", "📈 വൈറ്റൽസ്"),
    E("📤 Share with doctor", "📤 डॉक्टर के साथ साझा करें",
      "📤 மருத்துவருடன் பகிர்", "📤 డాక్టర్‌తో షేర్ చేయండి",
      "📤 ডাক্তারের সাথে শেয়ার করুন", "📤 डॉक्टरांसोबत शेअर करा",
      "📤 ડૉક્ટર સાથે શેર કરો", "📤 ವೈದ್ಯರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ",
      "📤 ഡോക്ടറുമായി പങ്കിടുക"),
    E("🔎 Search", "🔎 खोजें",
      "🔎 தேடு", "🔎 వెతకండి", "🔎 খুঁজুন", "🔎 शोधा",
      "🔎 શોધો", "🔎 ಹುಡುಕಿ", "🔎 തിരയുക"),
    # ── Upload form ────────────────────────────────────────────────
    E("📤 Upload a medical document", "📤 मेडिकल दस्तावेज़ अपलोड करें",
      "📤 மருத்துவ ஆவணத்தைப் பதிவேற்று", "📤 వైద్య పత్రాన్ని అప్‌లోడ్ చేయండి",
      "📤 মেডিকেল ডকুমেন্ট আপলোড করুন", "📤 वैद्यकीय कागदपत्र अपलोड करा",
      "📤 તબીબી દસ્તાવેજ અપલોડ કરો", "📤 ವೈದ್ಯಕೀಯ ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
      "📤 മെഡിക്കൽ രേഖ അപ്‌ലോഡ് ചെയ്യുക"),
    E("Pick the kind of document, then take a photo or upload a PDF. For",
      "दस्तावेज़ का प्रकार चुनें, फिर फ़ोटो लें या PDF अपलोड करें। For"),
    E(", Chitti reads it with DeepSeek vision and extracts every detail. For other types it stores the file encrypted and you can tag it manually (full extraction lands in Phase B per spec).",
      "के लिए, Chitti इसे DeepSeek vision से पढ़ता है और हर जानकारी निकालता है। अन्य प्रकारों के लिए यह फ़ाइल को एन्क्रिप्टेड रखता है और आप इसे मैन्युअली टैग कर सकते हैं (पूरा एक्सट्रैक्शन स्पेक के अनुसार Phase B में आएगा)।"),
    E("What kind of document?", "किस प्रकार का दस्तावेज़?",
      "எந்த வகை ஆவணம்?", "ఏ రకమైన పత్రం?", "কোন ধরনের ডকুমেন্ট?",
      "कोणत्या प्रकारचे कागदपत्र?", "કયા પ્રકારનો દસ્તાવેજ?",
      "ಯಾವ ರೀತಿಯ ದಾಖಲೆ?", "ഏത് തരം രേഖ?"),
    E("File (PDF or image · max 15MB)", "फ़ाइल (PDF या इमेज · अधिकतम 15MB)",
      "கோப்பு (PDF அல்லது படம் · அதிகபட்சம் 15MB)",
      "ఫైల్ (PDF లేదా చిత్రం · గరిష్టం 15MB)",
      "ফাইল (PDF বা ছবি · সর্বোচ্চ 15MB)", "फाइल (PDF किंवा इमेज · कमाल 15MB)",
      "ફાઇલ (PDF અથવા ઇમેજ · મહત્તમ 15MB)", "ಫೈಲ್ (PDF ಅಥವಾ ಚಿತ್ರ · ಗರಿಷ್ಠ 15MB)",
      "ഫയൽ (PDF അല്ലെങ്കിൽ ചിത്രം · പരമാവധി 15MB)"),
    E("Date of visit / test", "विज़िट / टेस्ट की तारीख़",
      "வருகை / பரிசோதனை தேதி", "సందర్శన / పరీక్ష తేదీ", "ভিজিট / টেস্টের তারিখ",
      "भेट / चाचणी तारीख", "મુલાકાત / ટેસ્ટની તારીખ", "ಭೇಟಿ / ಪರೀಕ್ಷೆ ದಿನಾಂಕ",
      "സന്ദർശന / പരിശോധന തീയതി"),
    E("Doctor (optional)", "डॉक्टर (वैकल्पिक)",
      "மருத்துவர் (விருப்பம்)", "డాక్టర్ (ఐచ్ఛికం)", "ডাক্তার (ঐচ্ছিক)",
      "डॉक्टर (पर्यायी)", "ડૉક્ટર (વૈકલ્પિક)", "ವೈದ್ಯರು (ಐಚ್ಛಿಕ)",
      "ഡോക്ടർ (ഓപ്ഷണൽ)"),
    E("Hospital / clinic (optional)", "अस्पताल / क्लिनिक (वैकल्पिक)",
      "மருத்துவமனை / கிளினிக் (விருப்பம்)", "ఆసుపత్రి / క్లినిక్ (ఐచ్ఛికం)",
      "হাসপাতাল / ক্লিনিক (ঐচ্ছিক)", "रुग्णालय / क्लिनिक (पर्यायी)",
      "હોસ્પિટલ / ક્લિનિક (વૈકલ્પિક)", "ಆಸ್ಪತ್ರೆ / ಕ್ಲಿನಿಕ್ (ಐಚ್ಛಿಕ)",
      "ആശുപത്രി / ക്ലിനിക് (ഓപ്ഷണൽ)"),
    E("Short name (so you find it later)", "छोटा नाम (ताकि बाद में मिल जाए)",
      "குறுகிய பெயர் (பிறகு கண்டுபிடிக்க)", "చిన్న పేరు (తర్వాత కనుగొనడానికి)",
      "সংক্ষিপ্ত নাম (পরে খুঁজে পেতে)", "लहान नाव (नंतर सापडावे म्हणून)",
      "ટૂંકું નામ (પછી મળે તે માટે)", "ಚಿಕ್ಕ ಹೆಸರು (ನಂತರ ಸಿಗಲು)",
      "ഹ്രസ്വ പേര് (പിന്നീട് കണ്ടെത്താൻ)"),
    E("📤 Upload — Chitti will confirm first", "📤 अपलोड — Chitti पहले पुष्टि करेगा",
      "📤 பதிவேற்று — Chitti முதலில் உறுதிப்படுத்தும்",
      "📤 అప్‌లోడ్ — Chitti ముందుగా నిర్ధారిస్తుంది",
      "📤 আপলোড — Chitti আগে নিশ্চিত করবে", "📤 अपलोड — Chitti आधी खात्री करेल",
      "📤 અપલોડ — Chitti પહેલા ખાતરી કરશે", "📤 ಅಪ್‌ಲೋಡ್ — Chitti ಮೊದಲು ದೃಢೀಕರಿಸುತ್ತದೆ",
      "📤 അപ്‌ലോഡ് — Chitti ആദ്യം സ്ഥിരീകരിക്കും"),
    E("Reset", "रीसेट",
      "மீட்டமை", "రీసెట్", "রিসেট", "रीसेट", "રીસેટ", "ಮರುಹೊಂದಿಸಿ", "റീസെറ്റ്"),
    E("After upload, Chitti speaks the extracted summary aloud and any medicine / follow-up reminders are auto-created. You can edit or delete them on the Reminders tab.",
      "अपलोड के बाद, Chitti निकाले गए सारांश को बोलकर सुनाता है और कोई भी दवा / फ़ॉलो-अप रिमाइंडर अपने आप बन जाते हैं। आप उन्हें Reminders टैब पर बदल या हटा सकते हैं।"),
    E("prescription", "पर्चा",
      "மருந்துச்சீட்டு", "ప్రిస్క్రిప్షన్", "প্রেসক্রিপশন", "प्रिस्क्रिप्शन",
      "પ્રિસ્ક્રિપ્શન", "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್", "കുറിപ്പടി"),
    E("blood report", "ब्लड रिपोर्ट",
      "இரத்த அறிக்கை", "బ్లడ్ రిపోర్ట్", "ব্লাড রিপোর্ট", "रक्त अहवाल",
      "બ્લડ રિપોર્ટ", "ರಕ್ತ ವರದಿ", "രക്ത റിപ്പോർട്ട്"),
    E("and", "और",
      "மற்றும்", "మరియు", "এবং", "आणि", "અને", "ಮತ್ತು", "ഒപ്പം"),
    # NOTE: the bottom-nav labels (Do · Vault · Family · Settings) are owned
    # by chitti_bottom_nav.js, and the universal-scanner tiles (What to scan?,
    # Food label, Fashion, Document, Bill, Legal notice, Crop/plant,
    # Prescription, QR/Payment, Product + hints) are owned by
    # chitti_camera_universal.js — each has its own per-language dict and
    # re-renders on chitti:langchange. They are intentionally NOT duplicated
    # here, to keep one source of truth per CTO.md rule #7.
    # ── Health File remaining chrome (tabs / titles / labels / buttons)
    E("Language", "भाषा",
      "மொழி", "భాష", "ভাষা", "भाषा", "ભાષા", "ಭಾಷೆ", "ഭാഷ"),
    E("🛡️ Insurance", "🛡️ बीमा",
      "🛡️ காப்பீடு", "🛡️ భీమా", "🛡️ বীমা", "🛡️ विमा", "🛡️ વીમો",
      "🛡️ ವಿಮೆ", "🛡️ ഇൻഷുറൻസ്"),
    E("🌐 Translate", "🌐 अनुवाद",
      "🌐 மொழிபெயர்", "🌐 అనువదించు", "🌐 অনুবাদ", "🌐 भाषांतर",
      "🌐 અનુવાદ", "🌐 ಅನುವಾದಿಸಿ", "🌐 വിവർത്തനം"),
    E("🔊 Read", "🔊 पढ़ो",
      "🔊 படி", "🔊 చదవండి", "🔊 পড়ুন", "🔊 वाचा", "🔊 વાંચો",
      "🔊 ಓದಿ", "🔊 വായിക്കുക"),
    E("🕒 Health timeline", "🕒 स्वास्थ्य टाइमलाइन",
      "🕒 உடல்நல காலவரிசை", "🕒 ఆరోగ్య టైమ్‌లైన్", "🕒 স্বাস্থ্য টাইমলাইন",
      "🕒 आरोग्य टाइमलाइन", "🕒 આરોગ્ય ટાઇમલાઇન", "🕒 ಆರೋಗ್ಯ ಟೈಮ್‌ಲೈನ್",
      "🕒 ആരോഗ്യ ടൈംലൈൻ"),
    E("Filter by kind", "प्रकार से फ़िल्टर करें",
      "வகை வாரியாக வடிகட்டு", "రకం వారీగా ఫిల్టర్ చేయండి", "ধরন অনুসারে ফিল্টার",
      "प्रकारानुसार फिल्टर", "પ્રકાર પ્રમાણે ફિલ્ટર", "ಪ್ರಕಾರದ ಪ್ರಕಾರ ಫಿಲ್ಟರ್",
      "തരം അനുസരിച്ച് ഫിൽട്ടർ"),
    E("Search text", "टेक्स्ट खोजें",
      "உரையைத் தேடு", "టెక్స్ట్ వెతకండి", "টেক্সট খুঁজুন", "मजकूर शोधा",
      "ટેક્સ્ટ શોધો", "ಪಠ್ಯ ಹುಡುಕಿ", "ടെക്സ്റ്റ് തിരയുക"),
    E("⏰ Smart reminders", "⏰ स्मार्ट रिमाइंडर",
      "⏰ ஸ்மார்ட் நினைவூட்டல்கள்", "⏰ స్మార్ట్ రిమైండర్లు",
      "⏰ স্মার্ট রিমাইন্ডার", "⏰ स्मार्ट स्मरणपत्रे", "⏰ સ્માર્ટ રિમાઇન્ડર",
      "⏰ ಸ್ಮಾರ್ಟ್ ಜ್ಞಾಪನೆಗಳು", "⏰ സ്മാർട്ട് ഓർമ്മപ്പെടുത്തലുകൾ"),
    E("＋ New reminder", "＋ नया रिमाइंडर",
      "＋ புதிய நினைவூட்டல்", "＋ కొత్త రిమైండర్", "＋ নতুন রিমাইন্ডার",
      "＋ नवीन स्मरणपत्र", "＋ નવું રિમાઇન્ડર", "＋ ಹೊಸ ಜ್ಞಾಪನೆ",
      "＋ പുതിയ ഓർമ്മപ്പെടുത്തൽ"),
    E("🔄 Refresh", "🔄 रीफ़्रेश",
      "🔄 புதுப்பி", "🔄 రిఫ్రెష్", "🔄 রিফ্রেশ", "🔄 रिफ्रेश",
      "🔄 રિફ્રેશ", "🔄 ರಿಫ್ರೆಶ್", "🔄 പുതുക്കുക"),
    E("📈 Vitals log", "📈 वाइटल्स लॉग",
      "📈 உயிர்ச்சக்தி பதிவு", "📈 వైటల్స్ లాగ్", "📈 ভাইটাল লগ",
      "📈 व्हायटल्स लॉग", "📈 વાઇટલ્સ લોગ", "📈 ವೈಟಲ್ಸ್ ಲಾಗ್",
      "📈 വൈറ്റൽസ് ലോഗ്"),
    E("📈 Log vital — Chitti will confirm first", "📈 वाइटल लॉग करें — Chitti पहले पुष्टि करेगा",
      "📈 உயிர்ச்சக்தி பதிவு — Chitti முதலில் உறுதிப்படுத்தும்",
      "📈 వైటల్ లాగ్ — Chitti ముందుగా నిర్ధారిస్తుంది",
      "📈 ভাইটাল লগ — Chitti আগে নিশ্চিত করবে", "📈 व्हायटल लॉग — Chitti आधी खात्री करेल",
      "📈 વાઇટલ લોગ — Chitti પહેલા ખાતરી કરશે", "📈 ವೈಟಲ್ ಲಾಗ್ — Chitti ಮೊದಲು ದೃಢೀಕರಿಸುತ್ತದೆ",
      "📈 വൈറ്റൽ ലോഗ് — Chitti ആദ്യം സ്ഥിരീകരിക്കും"),
    E("🎙️ Voice log", "🎙️ आवाज़ से लॉग",
      "🎙️ குரல் பதிவு", "🎙️ వాయిస్ లాగ్", "🎙️ ভয়েস লগ", "🎙️ आवाज लॉग",
      "🎙️ વોઇસ લોગ", "🎙️ ಧ್ವನಿ ಲಾಗ್", "🎙️ വോയ്സ് ലോഗ്"),
    E("Trend", "रुझान",
      "போக்கு", "ట్రెండ్", "ট্রেন্ড", "कल", "વલણ", "ಪ್ರವೃತ್ತಿ", "ട്രെൻഡ്"),
    E("Window:", "अवधि:",
      "காலம்:", "విండో:", "উইন্ডো:", "कालावधी:", "વિન્ડો:", "ಅವಧಿ:", "വിൻഡോ:"),
    E("Vital:", "वाइटल:",
      "உயிர்ச்சக்தி:", "వైటల్:", "ভাইটাল:", "व्हायटल:", "વાઇટલ:", "ವೈಟಲ್:", "വൈറ്റൽ:"),
    E("Recent readings", "हाल की रीडिंग",
      "சமீபத்திய அளவீடுகள்", "ఇటీవలి రీడింగ్‌లు", "সাম্প্রতিক রিডিং",
      "अलीकडील रीडिंग", "તાજેતરના રીડિંગ", "ಇತ್ತೀಚಿನ ರೀಡಿಂಗ್‌ಗಳು",
      "സമീപകാല റീഡിംഗുകൾ"),
    E("🛡️ Insurance manager", "🛡️ बीमा प्रबंधक",
      "🛡️ காப்பீட்டு மேலாளர்", "🛡️ భీమా మేనేజర్", "🛡️ বীমা ম্যানেজার",
      "🛡️ विमा व्यवस्थापक", "🛡️ વીમા મેનેજર", "🛡️ ವಿಮಾ ನಿರ್ವಾಹಕ",
      "🛡️ ഇൻഷുറൻസ് മാനേജർ"),
    E("＋ Add policy", "＋ पॉलिसी जोड़ें",
      "＋ பாலிசியைச் சேர்", "＋ పాలసీని జోడించండి", "＋ পলিসি যোগ করুন",
      "＋ पॉलिसी जोडा", "＋ પોલિસી ઉમેરો", "＋ ಪಾಲಿಸಿ ಸೇರಿಸಿ",
      "＋ പോളിസി ചേർക്കുക"),
    E("📤 Quick share with doctor", "📤 डॉक्टर के साथ तुरंत साझा करें",
      "📤 மருத்துவருடன் விரைவாகப் பகிர்", "📤 డాక్టర్‌తో త్వరిత షేర్",
      "📤 ডাক্তারের সাথে দ্রুত শেয়ার", "📤 डॉक्टरांसोबत झटपट शेअर",
      "📤 ડૉક્ટર સાથે ઝડપી શેર", "📤 ವೈದ್ಯರೊಂದಿಗೆ ತ್ವರಿತ ಹಂಚಿಕೆ",
      "📤 ഡോക്ടറുമായി പെട്ടെന്ന് പങ്കിടുക"),
    E("🔎 Smart search across all health data", "🔎 सभी स्वास्थ्य डेटा में स्मार्ट खोज",
      "🔎 அனைத்து உடல்நல தரவிலும் ஸ்மார்ட் தேடல்",
      "🔎 అన్ని ఆరోగ్య డేటాలో స్మార్ట్ సెర్చ్", "🔎 সমস্ত স্বাস্থ্য ডেটায় স্মার্ট সার্চ",
      "🔎 सर्व आरोग्य डेटामध्ये स्मार्ट शोध", "🔎 બધા આરોગ્ય ડેટામાં સ્માર્ટ શોધ",
      "🔎 ಎಲ್ಲಾ ಆರೋಗ್ಯ ಡೇಟಾದಲ್ಲಿ ಸ್ಮಾರ್ಟ್ ಹುಡುಕಾಟ",
      "🔎 എല്ലാ ആരോഗ്യ ഡാറ്റയിലും സ്മാർട്ട് തിരയൽ"),
    # Long descriptions: clean Hindi; other langs honestly Hindi-fallback
    # (native QA flagged in the QA report).
    E("Every document, fact, and visit in chronological order. Filter by condition, doctor, or date. Tap a row to open the source document (decrypted only for you).",
      "हर दस्तावेज़, जानकारी और विज़िट क्रम से। बीमारी, डॉक्टर या तारीख़ से फ़िल्टर करें। किसी पंक्ति पर टैप करने से मूल दस्तावेज़ खुलेगा (सिर्फ़ आप ही उसे खोल सकते हैं)।"),
    E("Auto-created from your prescriptions, follow-ups, and insurance premiums. Five kinds: medicine (daily), follow-up (one-shot), premium due (with 30/7/1 day advance alerts), test due, prescription expiry. Channels: browser push, WhatsApp, voice call (Twilio — env-gated).",
      "आपके पर्चों, फ़ॉलो-अप और बीमा प्रीमियम से अपने आप बनते हैं। पाँच तरह: दवा (रोज़ाना), फ़ॉलो-अप (एक बार), प्रीमियम देय (30/7/1 दिन पहले अलर्ट), टेस्ट देय, पर्चा समाप्ति। चैनल: browser push, WhatsApp, voice call (Twilio — env-gated)।"),
    E("Voice-log BP / sugar / HbA1c / weight / SpO2 / pulse / temperature. Chitti flags out-of-range readings RED. Trend chart shows the last 30 / 90 / 365 days.",
      "BP / sugar / HbA1c / weight / SpO2 / pulse / temperature आवाज़ से लॉग करें। Chitti सीमा से बाहर की रीडिंग को RED में दिखाता है। ट्रेंड चार्ट पिछले 30 / 90 / 365 दिन दिखाता है।"),
    E("Health / life / vehicle policies in one place. Premium-due reminders auto-spawn at 30 / 7 / 1 day before due.",
      "Health / life / vehicle पॉलिसी एक जगह। प्रीमियम देय रिमाइंडर देय तारीख़ से 30 / 7 / 1 दिन पहले अपने आप बन जाते हैं।"),
    E("Ask Chitti in your language. \"Wife ki blood sugar last 6 mahine\" · \"kaunsi medicines chal rahi hain\" · \"Dr Sharma ki last visit kab thi\".",
      "Chitti से अपनी भाषा में पूछें। \"Wife ki blood sugar last 6 mahine\" · \"kaunsi medicines chal rahi hain\" · \"Dr Sharma ki last visit kab thi\"।"),
    # ── MedUPI minor strings ───────────────────────────────────────
    E("Card ID:", "कार्ड ID:",
      "அட்டை ID:", "కార్డ్ ID:", "কার্ড ID:", "कार्ड ID:",
      "કાર્ડ ID:", "ಕಾರ್ಡ್ ID:", "കാർഡ് ID:"),
    E("Listen", "सुनो",
      "கேள்", "వినండి", "শুনুন", "ऐका", "સાંભળો", "ಕೇಳಿ", "കേൾക്കുക"),
    E("Upload your full prescription. Chitti reads it with DeepSeek vision, extracts every medicine + dose + frequency + follow-up date, and auto-creates the right reminders. Use the",
      "अपना पूरा पर्चा अपलोड करें। Chitti इसे DeepSeek vision से पढ़ता है, हर दवा + खुराक + समय + फ़ॉलो-अप तारीख़ निकालता है, और सही रिमाइंडर अपने आप बनाता है। उपयोग करें"),
    E("tab to upload prescriptions directly into a family member's profile.",
      "टैब, ताकि पर्चे सीधे किसी परिवार के सदस्य की प्रोफ़ाइल में अपलोड हों।"),
]


def main():
    with io.open(LANG, encoding='utf-8') as f:
        src = f.read()

    # Build the injected block: literal "key": {...}, lines.
    lines = [MARKER]
    for en, obj in ENTRIES:
        lines.append('    ' + json.dumps(en, ensure_ascii=False) + ': ' +
                     json.dumps(obj, ensure_ascii=False) + ',')
    lines.append('    ' + MARKER_END)
    block = '\n'.join(lines) + '\n'

    # Idempotent: remove any prior injected block (MARKER … MARKER_END).
    pat = re.compile(re.escape(MARKER) + r'.*?' + re.escape(MARKER_END) + r'\n', re.S)
    src = pat.sub('', src)

    # Insert right after `var T = {`
    anchor = 'var T = {\n'
    idx = src.index(anchor) + len(anchor)
    src = src[:idx] + block + src[idx:]

    with io.open(LANG, 'w', encoding='utf-8') as f:
        f.write(src)
    print('Injected %d Health File / shared-nav entries into %s' % (len(ENTRIES), LANG))


if __name__ == '__main__':
    main()
