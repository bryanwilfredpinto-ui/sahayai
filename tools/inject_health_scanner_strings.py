# -*- coding: utf-8 -*-
"""
inject_health_scanner_strings.py

Adds Chitti Health Scanner (chitti_health_scanner.html) UI strings to the
chitti_lang.js T auto-translate dictionary so the page switches language via
the Vaani-anchored substrate — same mechanism as Health File. (QA 2026-06-05.)

Short chrome / nav / card-names / buttons / urgency → all 9 Vaani primary
languages. Longer prose / disclaimers → full Hindi + honest Hindi-fallback for
the other primaries + 17 secondary (Voice-Strategy lock; native QA flagged).
Brand / technical tokens (Chitti, DeepSeek, UPI, AES-256-GCM, PMJAY, ABDM,
DPDP, Jan Aushadhi) stay English. Idempotent (MARKER guard).
"""
import json, re, io

LANG = 'chitti_lang.js'
MARKER = '/* === HEALTH SCANNER STRINGS (inject_health_scanner_strings.py) === */'
MARKER_END = '/* === END HEALTH SCANNER STRINGS === */'

SECONDARY = ['pa', 'or', 'as', 'ur', 'sa', 'mai', 'kok', 'doi',
             'ks', 'ne', 'sd', 'mni', 'sat', 'bho', 'raj', 'kru', 'hoc']


def E(en, hi, ta=None, te=None, bn=None, mr=None, gu=None, kn=None, ml=None):
    prim = {'ta': ta, 'te': te, 'bn': bn, 'mr': mr, 'gu': gu, 'kn': kn, 'ml': ml}
    obj = {'en': en, 'hi': hi}
    for k, v in prim.items():
        obj[k] = v if v is not None else hi
    for k in SECONDARY:
        obj[k] = hi
    return en, obj


ENTRIES = [
    # ── Golden line + disclaimer (Hindi + fallback; "Chitti" stays English) ──
    E("Chitti helps you notice — doctors help you heal.",
      "Chitti आपको ध्यान देने में मदद करता है — डॉक्टर आपको ठीक करते हैं।"),
    E("Chitti helps you notice · doctors help you heal.",
      "Chitti आपको ध्यान देने में मदद करता है · डॉक्टर आपको ठीक करते हैं।"),
    E("Chitti helps you notice, doctors help you heal.",
      "Chitti आपको ध्यान देने में मदद करता है, डॉक्टर आपको ठीक करते हैं।"),
    E("⚕️ NOT A DOCTOR.", "⚕️ डॉक्टर नहीं है।",
      "⚕️ மருத்துவர் அல்ல.", "⚕️ డాక్టర్ కాదు.", "⚕️ ডাক্তার নন।", "⚕️ डॉक्टर नाही.",
      "⚕️ ડૉક્ટર નથી.", "⚕️ ವೈದ್ಯರಲ್ಲ.", "⚕️ ഡോക്ടറല്ല."),
    E("This is not a medical diagnosis.", "यह कोई चिकित्सीय निदान नहीं है।",
      "இது மருத்துவ நோயறிதல் அல்ல.", "ఇది వైద్య నిర్ధారణ కాదు.",
      "এটি কোনো চিকিৎসা নির্ণয় নয়।", "हे वैद्यकीय निदान नाही.",
      "આ કોઈ તબીબી નિદાન નથી.", "ಇದು ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯವಲ್ಲ.",
      "ഇത് ഒരു മെഡിക്കൽ രോഗനിർണയമല്ല."),
    # ── Page chrome / headers ───────────────────────────────────────
    E("Health Scanner", "हेल्थ स्कैनर",
      "ஹெல்த் ஸ்கேனர்", "హెల్త్ స్కానర్", "হেলথ স্ক্যানার", "हेल्थ स्कॅनर",
      "હેલ્થ સ્કેનર", "ಹೆಲ್ತ್ ಸ್ಕ್ಯಾನರ್", "ഹെൽത്ത് സ്കാനർ"),
    E("Choose what to scan", "क्या स्कैन करना है चुनें",
      "எதை ஸ்கேன் செய்ய வேண்டும் என்பதைத் தேர்ந்தெடுக்கவும்",
      "ఏమి స్కాన్ చేయాలో ఎంచుకోండి", "কী স্ক্যান করবেন তা বেছে নিন",
      "काय स्कॅन करायचे ते निवडा", "શું સ્કેન કરવું તે પસંદ કરો",
      "ಏನು ಸ್ಕ್ಯಾನ್ ಮಾಡಬೇಕೆಂದು ಆಯ್ಕೆಮಾಡಿ", "എന്ത് സ്കാൻ ചെയ്യണമെന്ന് തിരഞ്ഞെടുക്കുക"),
    E("What Chitti can do today", "Chitti आज क्या कर सकता है",
      "Chitti இன்று என்ன செய்ய முடியும்", "Chitti ఈ రోజు ఏమి చేయగలదు",
      "Chitti আজ কী করতে পারে", "Chitti आज काय करू शकते",
      "Chitti આજે શું કરી શકે છે", "Chitti ಇಂದು ಏನು ಮಾಡಬಹುದು",
      "Chitti ഇന്ന് എന്ത് ചെയ്യാൻ കഴിയും"),
    E("Continue in the Chitti family", "Chitti परिवार में आगे बढ़ें",
      "Chitti குடும்பத்தில் தொடரவும்", "Chitti కుటుంబంలో కొనసాగండి",
      "Chitti পরিবারে চালিয়ে যান", "Chitti कुटुंबात पुढे जा",
      "Chitti પરિવારમાં આગળ વધો", "Chitti ಕುಟುಂಬದಲ್ಲಿ ಮುಂದುವರಿಯಿರಿ",
      "Chitti കുടുംബത്തിൽ തുടരുക"),
    # ── Bottom/icon nav ─────────────────────────────────────────────
    E("Scan", "स्कैन",
      "ஸ்கேன்", "స్కాన్", "স্ক্যান", "स्कॅन", "સ્કેન", "ಸ್ಕ್ಯಾನ್", "സ്കാൻ"),
    E("Timeline", "टाइमलाइन",
      "காலவரிசை", "టైమ్‌లైన్", "টাইমলাইন", "टाइमलाइन", "ટાઇમલાઇન",
      "ಟೈಮ್‌ಲೈನ್", "ടൈംലൈൻ"),
    E("Listen", "सुनो",
      "கேள்", "వినండి", "শুনুন", "ऐका", "સાંભળો", "ಕೇಳಿ", "കേൾക്കുക"),
    E("Help", "मदद",
      "உதவி", "సహాయం", "সাহায্য", "मदत", "મદદ", "ಸಹಾಯ", "സഹായം"),
    # ── Urgency legend (icon+text, never colour alone) ──────────────
    E("Normal — looks ordinary", "सामान्य — सामान्य दिखता है",
      "சாதாரணம் — சாதாரணமாகத் தெரிகிறது", "సాధారణం — మామూలుగా కనిపిస్తుంది",
      "স্বাভাবিক — সাধারণ দেখাচ্ছে", "सामान्य — सामान्य दिसते",
      "સામાન્ય — સામાન્ય દેખાય છે", "ಸಾಮಾನ್ಯ — ಸಾಮಾನ್ಯವಾಗಿ ಕಾಣುತ್ತದೆ",
      "സാധാരണം — സാധാരണമായി കാണുന്നു"),
    E("Monitor — watch and re-check", "निगरानी — देखें और दोबारा जाँचें",
      "கண்காணி — கவனித்து மீண்டும் சரிபார்க்கவும்",
      "పర్యవేక్షించండి — గమనించి మళ్లీ తనిఖీ చేయండి",
      "পর্যবেক্ষণ — দেখুন ও আবার যাচাই করুন", "निरीक्षण — पाहा आणि पुन्हा तपासा",
      "મોનિટર — જુઓ અને ફરી તપાસો", "ಮೇಲ್ವಿಚಾರಣೆ — ಗಮನಿಸಿ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ",
      "നിരീക്ഷിക്കുക — ശ്രദ്ധിച്ച് വീണ്ടും പരിശോധിക്കുക"),
    E("Seek care — see a doctor", "देखभाल लें — डॉक्टर को दिखाएँ",
      "சிகிச்சை பெறுங்கள் — மருத்துவரைப் பாருங்கள்",
      "సంరక్షణ తీసుకోండి — డాక్టర్‌ను చూడండి", "যত্ন নিন — ডাক্তার দেখান",
      "काळजी घ्या — डॉक्टरांना दाखवा", "સંભાળ લો — ડૉક્ટરને બતાવો",
      "ಆರೈಕೆ ಪಡೆಯಿರಿ — ವೈದ್ಯರನ್ನು ನೋಡಿ", "പരിചരണം തേടുക — ഡോക്ടറെ കാണുക"),
    E("COMING SOON", "जल्द आ रहा है",
      "விரைவில் வரும்", "త్వరలో వస్తుంది", "শীঘ্রই আসছে", "लवकरच येत आहे",
      "ટૂંક સમયમાં આવી રહ્યું છે", "ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ", "ഉടൻ വരുന്നു"),
    # ── Scan-type card NAMES (9 langs) ──────────────────────────────
    E("Skin", "त्वचा", "தோல்", "చర్మం", "ত্বক", "त्वचा", "ત્વચા", "ಚರ್ಮ", "ത്വക്ക്"),
    E("Eye", "आँख", "கண்", "కన్ను", "চোখ", "डोळा", "આંખ", "ಕಣ್ಣು", "കണ്ണ്"),
    E("Tooth", "दाँत", "பல்", "దంతం", "দাঁত", "दात", "દાંત", "ಹಲ್ಲು", "പല്ല്"),
    E("Wound", "घाव", "காயம்", "గాయం", "ক্ষত", "जखम", "ઘા", "ಗಾಯ", "മുറിവ്"),
    E("Hair / Scalp", "बाल / सिर की त्वचा",
      "முடி / உச்சந்தலை", "జుట్టు / తలచర్మం", "চুল / মাথার ত্বক", "केस / टाळू",
      "વાળ / માથાની ચામડી", "ಕೂದಲು / ನೆತ್ತಿ", "മുടി / തലയോട്ടി"),
    E("Nail", "नाखून", "நகம்", "గోరు", "নখ", "नख", "નખ", "ಉಗುರು", "നഖം"),
    E("Swelling", "सूजन", "வீக்கம்", "వాపు", "ফোলা", "सूज", "સોજો", "ಊತ", "നീര്"),
    E("Mole", "तिल", "மச்சம்", "పుట్టుమచ్చ", "তিল", "तीळ", "તલ", "ಮಚ್ಚೆ", "മറുക്"),
    E("Post-surgery", "सर्जरी के बाद",
      "அறுவை சிகிச்சைக்குப் பின்", "శస్త్రచికిత్స తర్వాత", "অস্ত্রোপচারের পর",
      "शस्त्रक्रियेनंतर", "સર્જરી પછી", "ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ನಂತರ", "ശസ്ത്രക്രിയയ്ക്ക് ശേഷം"),
    E("Burn", "जलन / जला", "தீக்காயம்", "కాలిన గాయం", "পোড়া", "भाजणे",
      "દાઝવું", "ಸುಟ್ಟಗಾಯ", "പൊള്ളൽ"),
    E("Child journal", "बच्चे की डायरी",
      "குழந்தை நாட்குறிப்பு", "పిల్లల జర్నల్", "শিশুর জার্নাল", "मुलाची डायरी",
      "બાળકની જર્નલ", "ಮಗುವಿನ ಜರ್ನಲ್", "കുട്ടിയുടെ ജേണൽ"),
    E("Diabetic foot", "मधुमेह का पैर",
      "நீரிழிவு பாதம்", "మధుమేహ పాదం", "ডায়াবেটিক পা", "मधुमेह पाय",
      "ડાયાબિટીક પગ", "ಮಧುಮೇಹ ಪಾದ", "പ്രമേഹ പാദം"),
    E("Change detection", "बदलाव की पहचान",
      "மாற்றத்தைக் கண்டறிதல்", "మార్పు గుర్తింపు", "পরিবর্তন শনাক্তকরণ",
      "बदल ओळख", "ફેરફાર શોધ", "ಬದಲಾವಣೆ ಪತ್ತೆ", "മാറ്റം കണ്ടെത്തൽ"),
    # ── Buttons / actions (9 langs) ─────────────────────────────────
    E("📸 Capture", "📸 फ़ोटो लें",
      "📸 படம் எடு", "📸 ఫోటో తీయండి", "📸 ছবি তুলুন", "📸 फोटो घ्या",
      "📸 ફોટો લો", "📸 ಫೋಟೋ ತೆಗೆಯಿರಿ", "📸 ഫോട്ടോ എടുക്കുക"),
    E("✖ Cancel", "✖ रद्द करें",
      "✖ ரத்து", "✖ రద్దు", "✖ বাতিল", "✖ रद्द", "✖ રદ કરો", "✖ ರದ್ದುಮಾಡಿ", "✖ റദ്ദാക്കുക"),
    E("PHOTO CAPTURED", "फ़ोटो ले ली गई",
      "படம் எடுக்கப்பட்டது", "ఫోటో తీయబడింది", "ছবি তোলা হয়েছে", "फोटो घेतला",
      "ફોટો લેવાયો", "ಫೋಟೋ ತೆಗೆಯಲಾಗಿದೆ", "ഫോട്ടോ എടുത്തു"),
    E("📖 Save to Health File timeline", "📖 हेल्थ फ़ाइल टाइमलाइन में सेव करें",
      "📖 ஹெல்த் ஃபைல் காலவரிசையில் சேமி", "📖 హెల్త్ ఫైల్ టైమ్‌లైన్‌లో సేవ్ చేయండి",
      "📖 হেলথ ফাইল টাইমলাইনে সেভ করুন", "📖 हेल्थ फाइल टाइमलाइनमध्ये सेव्ह करा",
      "📖 હેલ્થ ફાઇલ ટાઇમલાઇનમાં સેવ કરો", "📖 ಹೆಲ್ತ್ ಫೈಲ್ ಟೈಮ್‌ಲೈನ್‌ನಲ್ಲಿ ಉಳಿಸಿ",
      "📖 ഹെൽത്ത് ഫയൽ ടൈംലൈനിൽ സേവ് ചെയ്യുക"),
    E("🔊 Listen", "🔊 सुनो",
      "🔊 கேள்", "🔊 వినండి", "🔊 শুনুন", "🔊 ऐका", "🔊 સાંભળો", "🔊 ಕೇಳಿ", "🔊 കേൾക്കുക"),
    E("🗑️ Chitti forget this photo", "🗑️ Chitti यह फ़ोटो भूल जाओ",
      "🗑️ Chitti இந்தப் படத்தை மறந்துவிடு", "🗑️ Chitti ఈ ఫోటోను మర్చిపో",
      "🗑️ Chitti এই ছবিটি ভুলে যাও", "🗑️ Chitti हा फोटो विसर",
      "🗑️ Chitti આ ફોટો ભૂલી જા", "🗑️ Chitti ಈ ಫೋಟೋ ಮರೆತುಬಿಡು",
      "🗑️ Chitti ഈ ഫോട്ടോ മറക്കുക"),
    E("✅ Haan (Yes)", "✅ हाँ",
      "✅ ஆம் (Haan)", "✅ అవును (Haan)", "✅ হ্যাঁ (Haan)", "✅ होय (Haan)",
      "✅ હા (Haan)", "✅ ಹೌದು (Haan)", "✅ അതെ (Haan)"),
    E("✋ Nahi (No)", "✋ नहीं",
      "✋ இல்லை (Nahi)", "✋ కాదు (Nahi)", "✋ না (Nahi)", "✋ नाही (Nahi)",
      "✋ ના (Nahi)", "✋ ಇಲ್ಲ (Nahi)", "✋ ഇല്ല (Nahi)"),
    E("Sire, shall I open the camera?", "Sire, क्या मैं कैमरा खोलूँ?",
      "Sire, நான் கேமராவைத் திறக்கட்டுமா?", "Sire, నేను కెమెరా తెరవాలా?",
      "Sire, আমি কি ক্যামেরা খুলব?", "Sire, मी कॅमेरा उघडू का?",
      "Sire, શું હું કૅમેરા ખોલું?", "Sire, ನಾನು ಕ್ಯಾಮೆರಾ ತೆರೆಯಲೇ?",
      "Sire, ഞാൻ ക്യാമറ തുറക്കട്ടെ?"),
    # ── Cross-link titles (brand names stay English) ────────────────
    E("Open in Chitti Health File timeline", "Chitti Health File टाइमलाइन में खोलें"),
    E("Find affordable medicines in Chitti MedUPI", "Chitti MedUPI में सस्ती दवाइयाँ खोजें"),
    E("Check PMJAY cover in Chitti Government", "Chitti Government में PMJAY कवर जाँचें"),
    E("What Chitti Health Scanner is — and is not",
      "Chitti Health Scanner क्या है — और क्या नहीं है"),
    # ── Scan-card descriptions (Hindi + honest fallback) ────────────
    E("A rash, patch or dryness you want to keep an eye on.",
      "कोई रैश, धब्बा या रूखापन जिस पर आप नज़र रखना चाहते हैं।"),
    E("Redness, yellowing or a stye you noticed.",
      "लाली, पीलापन या कोई गुहेरी जो आपने देखी।"),
    E("A spot, swelling of the gum or discolouration.",
      "कोई धब्बा, मसूड़े की सूजन या रंग बदलना।"),
    E("A cut or sore — track if it is healing or worsening.",
      "कोई कट या घाव — देखें कि यह भर रहा है या बिगड़ रहा है।"),
    E("Thinning, dandruff or a patch on the scalp.",
      "बाल पतले होना, रूसी या सिर पर कोई धब्बा।"),
    E("Colour change, a ridge or a spot on a nail.",
      "नाखून पर रंग बदलना, उभार या कोई धब्बा।"),
    E("A lump or puffy area — note its size over time.",
      "कोई गाँठ या फूला हुआ हिस्सा — समय के साथ इसका आकार नोट करें।"),
    E("Track a mole's shape, edge and colour over months.",
      "महीनों में किसी तिल का आकार, किनारा और रंग ट्रैक करें।"),
    E("Watch a stitch line or surgical site as it heals.",
      "टाँके या सर्जरी की जगह को भरते हुए देखें।"),
    E("A burn or scald — note how it changes day by day.",
      "कोई जलन या जला — रोज़ देखें कि यह कैसे बदल रहा है।"),
    E("Keep a photo journal of a child's rash or spots.",
      "बच्चे के रैश या धब्बों की फ़ोटो डायरी रखें।"),
    E("Check feet for cracks or sores — important for diabetics.",
      "पैरों में दरार या घाव जाँचें — मधुमेह रोगियों के लिए ज़रूरी।"),
    E("Compare today's photo with an earlier one to spot change.",
      "बदलाव देखने के लिए आज की फ़ोटो की पहले की फ़ोटो से तुलना करें।"),
    E("See every photo, report and reminder in one place.",
      "हर फ़ोटो, रिपोर्ट और रिमाइंडर एक ही जगह देखें।"),
    E("Generic and Jan Aushadhi prices for what a doctor prescribes.",
      "डॉक्टर जो लिखे उसके generic और Jan Aushadhi दाम।"),
    E("See if treatment is covered under a government health scheme.",
      "देखें कि इलाज किसी सरकारी स्वास्थ्य योजना में कवर है या नहीं।"),
    # ── Result-box + confirm prose (Hindi + fallback) ───────────────
    E("Confidence level: not measured (analysis coming soon).",
      "विश्वास स्तर: मापा नहीं गया (विश्लेषण जल्द आ रहा है)।"),
    E("👉 Suggested action: consider a consult if you are worried.",
      "👉 सुझाई गई कार्रवाई: यदि आप चिंतित हैं तो डॉक्टर से सलाह लें।"),
    E("This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.",
      "यह कोई चिकित्सीय निदान नहीं है। Chitti आपको ध्यान देने में मदद करता है — डॉक्टर आपको ठीक करते हैं।"),
    E("Chitti never acts on its own. Tap Haan to open the camera, or Nahi to wait.",
      "Chitti कभी अपने आप कुछ नहीं करता। कैमरा खोलने के लिए हाँ दबाएँ, या रुकने के लिए नहीं।"),
    E('🎙️ You can also say "Haan" or "Nahi". Silence = Chitti waits.',
      '🎙️ आप "हाँ" या "नहीं" भी बोल सकते हैं। चुप्पी = Chitti इंतज़ार करता है।'),
    E("Take a photo of a skin patch, eye, tooth, wound, nail, swelling, mole or burn. Chitti looks for patterns and tells you whether to monitor, consider a consult, or seek care. Chitti never gives a diagnosis.",
      "त्वचा, आँख, दाँत, घाव, नाखून, सूजन, तिल या जले की फ़ोटो लें। Chitti पैटर्न देखता है और बताता है कि निगरानी करें, सलाह लें, या देखभाल लें। Chitti कभी निदान नहीं देता।"),
    E("🔊 Voice-guided: blind users can tap 🔊 Listen on every box. Chitti reads each result aloud, in your language. Mute users can tap; deaf users see text + sign panels.",
      "🔊 आवाज़-निर्देशित: दृष्टिहीन उपयोगकर्ता हर बॉक्स पर 🔊 सुनो दबा सकते हैं। Chitti हर परिणाम आपकी भाषा में पढ़कर सुनाता है। मूक उपयोगकर्ता टैप कर सकते हैं; बधिर उपयोगकर्ता टेक्स्ट + साइन पैनल देखते हैं।"),
    E("Every photo can be saved to your Chitti Health File timeline. AI analysis is coming soon — not yet built or clinically validated. Chitti will never claim certainty.",
      "हर फ़ोटो आपकी Chitti Health File टाइमलाइन में सेव हो सकती है। AI विश्लेषण जल्द आ रहा है — अभी बना या clinically validated नहीं है। Chitti कभी निश्चितता का दावा नहीं करेगा।"),
    E("AI analysis is coming soon — the vision models are not built or clinically validated yet, so Chitti will not guess. Your photo can be saved to your Chitti Health File timeline so a doctor sees it later, and so you can compare changes over time.",
      "AI विश्लेषण जल्द आ रहा है — vision models अभी बने या clinically validated नहीं हैं, इसलिए Chitti अनुमान नहीं लगाएगा। आपकी फ़ोटो आपकी Chitti Health File टाइमलाइन में सेव हो सकती है ताकि बाद में डॉक्टर देख सके और आप समय के साथ बदलाव की तुलना कर सकें।"),
    E('Chitti Health Scanner is a noticing tool, not a doctor. It will never tell you that you have a disease, never prescribe medicine, and never claim certainty. AI accuracy is also lower on darker skin tones (Fitzpatrick IV–VI); Chitti acknowledges this openly and will always escalate to a professional. Every analysis, when live, will show a confidence level, a plain-language explanation, a suggested action (monitor / consider consult / seek care), and the line "This is not a medical diagnosis."',
      'Chitti Health Scanner एक नोटिस करने वाला साधन है, डॉक्टर नहीं। यह कभी नहीं बताएगा कि आपको कोई बीमारी है, कभी दवा नहीं लिखेगा, और कभी निश्चितता का दावा नहीं करेगा। AI की सटीकता गहरे रंग की त्वचा (Fitzpatrick IV–VI) पर कम होती है; Chitti इसे खुलकर मानता है और हमेशा किसी पेशेवर के पास भेजेगा। हर विश्लेषण, जब live होगा, एक विश्वास स्तर, सरल भाषा में व्याख्या, एक सुझाई गई कार्रवाई (निगरानी / सलाह लें / देखभाल लें), और यह पंक्ति दिखाएगा "यह कोई चिकित्सीय निदान नहीं है।"'),
    E('Privacy: health photos are encrypted at rest (AES-256-GCM), owned by you, never sold, and anonymised before any aggregate use. Say "Chitti forget" and Chitti deletes them all. Built to be DPDP 2023 and ABDM aware.',
      'गोपनीयता: स्वास्थ्य फ़ोटो AES-256-GCM से encrypt रहती हैं, आपकी अपनी होती हैं, कभी बेची नहीं जातीं, और किसी भी aggregate उपयोग से पहले anonymise की जाती हैं। "Chitti forget" बोलें और Chitti उन सबको हटा देता है। DPDP 2023 और ABDM के अनुरूप बनाया गया।'),
    E("Chitti Health Scanner · part of the Chitti MedUPI family · sahayai.in",
      "Chitti Health Scanner · Chitti MedUPI परिवार का हिस्सा · sahayai.in"),
    E("Not a doctor. This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.",
      "डॉक्टर नहीं है। यह कोई चिकित्सीय निदान नहीं है। Chitti आपको ध्यान देने में मदद करता है — डॉक्टर आपको ठीक करते हैं।"),
]


def main():
    with io.open(LANG, encoding='utf-8') as f:
        src = f.read()
    lines = [MARKER]
    for en, obj in ENTRIES:
        lines.append('    ' + json.dumps(en, ensure_ascii=False) + ': ' +
                     json.dumps(obj, ensure_ascii=False) + ',')
    lines.append('    ' + MARKER_END)
    block = '\n'.join(lines) + '\n'
    pat = re.compile(re.escape(MARKER) + r'.*?' + re.escape(MARKER_END) + r'\n', re.S)
    src = pat.sub('', src)
    anchor = 'var T = {\n'
    idx = src.index(anchor) + len(anchor)
    src = src[:idx] + block + src[idx:]
    with io.open(LANG, 'w', encoding='utf-8') as f:
        f.write(src)
    print('Injected %d Health Scanner entries into %s' % (len(ENTRIES), LANG))


if __name__ == '__main__':
    main()
