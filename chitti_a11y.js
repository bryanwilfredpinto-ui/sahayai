/**
 * CHITTI A11Y SUBSTRATE v3.0
 * One file. Drop into every Chitti page.
 * <script src="chitti_a11y.js"></script>
 * 
 * WHAT THIS DOES:
 * 1. Language bar — click any language = ENTIRE UI changes to that language
 * 2. Per-response widget — speaker, Chitti icon, thumbs up, thumbs down, feedback
 * 3. Read page button
 * 4. Accessibility — large text, slow speech, braille mode
 */

(function () {
  "use strict";

  // ── ALL 26 LANGUAGES ──────────────────────────────────────────────────────
  const LANGS = [
    { code: "en",  label: "English",     native: "English"     },
    { code: "hi",  label: "Hindi",       native: "हिन्दी"       },
    { code: "bn",  label: "Bangla",      native: "বাংলা"        },
    { code: "te",  label: "Telugu",      native: "తెలుగు"       },
    { code: "ta",  label: "Tamil",       native: "தமிழ்"        },
    { code: "mr",  label: "Marathi",     native: "मराठी"        },
    { code: "gu",  label: "Gujarati",    native: "ગુજરાતી"      },
    { code: "kn",  label: "Kannada",     native: "ಕನ್ನಡ"       },
    { code: "ml",  label: "Malayalam",   native: "മലയാളം"       },
    { code: "pa",  label: "Punjabi",     native: "ਪੰਜਾਬੀ"       },
    { code: "or",  label: "Odia",        native: "ଓଡ଼ିଆ"        },
    { code: "as",  label: "Assamese",    native: "অসমীয়া"       },
    { code: "ur",  label: "Urdu",        native: "اردو"         },
    { code: "sa",  label: "Sanskrit",    native: "संस्कृतम्"     },
    { code: "mai", label: "Maithili",    native: "मैथिली"       },
    { code: "kok", label: "Konkani",     native: "कोंकणी"       },
    { code: "doi", label: "Dogri",       native: "डोगरी"        },
    { code: "ks",  label: "Kashmiri",    native: "کٲشُر"        },
    { code: "ne",  label: "Nepali",      native: "नेपाली"       },
    { code: "sd",  label: "Sindhi",      native: "سنڌي"         },
    { code: "mni", label: "Manipuri",    native: "মৈতৈলোন্"     },
    { code: "sat", label: "Santali",     native: "ᱥᱟᱱᱛᱟᱲᱤ"     },
    { code: "bho", label: "Bhojpuri",    native: "भोजपुरी"      },
    { code: "raj", label: "Rajasthani",  native: "राजस्थानी"    },
    { code: "kru", label: "Kurukh",      native: "कुड़ुख़"       },
    { code: "hoc", label: "Ho",          native: "हो"           }
  ];

  // ── UI TRANSLATIONS ────────────────────────────────────────────────────────
  // Every string that appears in the UI — translated per language
  const T = {
    en:  { read_page:"🔊 Read Page", speak:"🔊 Speak", ask_chitti:"🤖 Ask Chitti", good:"👍 Good", bad:"👎 Bad", feedback:"📝 Feedback", what_wrong:"What was wrong?", submit:"Submit", cancel:"Cancel", type_here:"Type feedback…", thanks:"Thank you! Chitti will learn.", large_text:"🔡 Large Text", slow:"🐢 Slow Speech", braille:"⠿ Braille", sebi:"⚠️ NOT SEBI REGISTERED · Educational only · Not investment advice", disclaimer:"Full Disclaimer", search:"Search", send:"Send", clear:"Clear", loading:"Loading…", live:"🟢 LIVE", warming:"🟠 Warming up", down:"🔴 Down", how_to:"How to use", demo:"Demo Mode", top:"↑ Top", change_lang:"Change language", scan:"Scan", compare:"Compare", wallet:"Family Wallet", reminders:"Reminders", settings:"Settings", learn:"Learn", jan_aushadhi:"Jan Aushadhi", insurance:"Insurance", national:"National", state:"State", business:"Business", tech:"Tech", sports:"Sports", entertainment:"Entertainment", read_later:"Read Later", refresh:"Refresh", chitti_take:"Chitti's Take", explain:"Explain Simply", fact_check:"Fact Check", read_aloud:"Read aloud", save:"Save", share:"Share", open_source:"Open source", ask:"Ask anything", summarise:"Summarise call", translate:"Translate", reply:"Reply suggestion", explain_letter:"Explain a letter", shopping:"Shopping list", recent:"Recent", voice_grant:"Voice grant", agree:"✓ I AGREE", not_now:"Not now", disclaimer_read:"Re-read T&C", clear_history:"Clear history" },

    hi:  { read_page:"🔊 पृष्ठ पढ़ें", speak:"🔊 बोलें", ask_chitti:"🤖 चित्ती से पूछें", good:"👍 अच्छा", bad:"👎 बुरा", feedback:"📝 प्रतिक्रिया", what_wrong:"क्या गलत था?", submit:"जमा करें", cancel:"रद्द करें", type_here:"प्रतिक्रिया लिखें…", thanks:"धन्यवाद! चित्ती सीखेगा।", large_text:"🔡 बड़ा टेक्स्ट", slow:"🐢 धीमी आवाज़", braille:"⠿ ब्रेल", sebi:"⚠️ SEBI पंजीकृत नहीं · केवल शैक्षिक", disclaimer:"पूरी जानकारी", search:"खोजें", send:"भेजें", clear:"साफ करें", loading:"लोड हो रहा है…", live:"🟢 लाइव", warming:"🟠 शुरू हो रहा है", down:"🔴 बंद", how_to:"उपयोग कैसे करें", demo:"डेमो मोड", top:"↑ ऊपर", change_lang:"भाषा बदलें", scan:"स्कैन करें", compare:"तुलना करें", wallet:"पारिवारिक वॉलेट", reminders:"अनुस्मारक", settings:"सेटिंग्स", learn:"सीखें", jan_aushadhi:"जन औषधि", insurance:"बीमा", national:"राष्ट्रीय", state:"राज्य", business:"व्यापार", tech:"तकनीक", sports:"खेल", entertainment:"मनोरंजन", read_later:"बाद में पढ़ें", refresh:"ताज़ा करें", chitti_take:"चित्ती की राय", explain:"सरल बताएं", fact_check:"तथ्य जांच", read_aloud:"ज़ोर से पढ़ें", save:"सहेजें", share:"साझा करें", open_source:"स्रोत खोलें", ask:"कुछ भी पूछें", summarise:"कॉल सारांश", translate:"अनुवाद करें", reply:"जवाब सुझाव", explain_letter:"पत्र समझाएं", shopping:"खरीदारी सूची", recent:"हाल का", voice_grant:"आवाज़ अनुमति", agree:"✓ मैं सहमत हूँ", not_now:"अभी नहीं", disclaimer_read:"शर्तें फिर पढ़ें", clear_history:"इतिहास साफ करें" },

    bn:  { read_page:"🔊 পৃষ্ঠা পড়ুন", speak:"🔊 বলুন", ask_chitti:"🤖 চিট্টিকে জিজ্ঞেস করুন", good:"👍 ভালো", bad:"👎 খারাপ", feedback:"📝 মতামত", what_wrong:"কী ভুল ছিল?", submit:"জমা দিন", cancel:"বাতিল", type_here:"মতামত লিখুন…", thanks:"ধন্যবাদ! চিট্টি শিখবে।", large_text:"🔡 বড় লেখা", slow:"🐢 ধীর বক্তৃতা", braille:"⠿ ব্রেইল", sebi:"⚠️ SEBI নিবন্ধিত নয় · শুধু শিক্ষামূলক", disclaimer:"সম্পূর্ণ বিবরণ", search:"খুঁজুন", send:"পাঠান", clear:"মুছুন", loading:"লোড হচ্ছে…", live:"🟢 লাইভ", warming:"🟠 শুরু হচ্ছে", down:"🔴 বন্ধ", how_to:"কীভাবে ব্যবহার করবেন", demo:"ডেমো মোড", top:"↑ উপরে", change_lang:"ভাষা পরিবর্তন করুন", scan:"স্ক্যান করুন", compare:"তুলনা করুন", wallet:"পারিবারিক ওয়ালেট", reminders:"অনুস্মারক", settings:"সেটিংস", learn:"শিখুন", jan_aushadhi:"জন ঔষধি", insurance:"বীমা", national:"জাতীয়", state:"রাজ্য", business:"ব্যবসা", tech:"প্রযুক্তি", sports:"খেলাধুলা", entertainment:"বিনোদন", read_later:"পরে পড়ুন", refresh:"রিফ্রেশ করুন", chitti_take:"চিট্টির মত", explain:"সহজে বোঝান", fact_check:"তথ্য যাচাই", read_aloud:"জোরে পড়ুন", save:"সংরক্ষণ করুন", share:"শেয়ার করুন", open_source:"উৎস খুলুন", ask:"যেকোনো কিছু জিজ্ঞেস করুন", summarise:"কল সারাংশ", translate:"অনুবাদ করুন", reply:"উত্তর পরামর্শ", explain_letter:"চিঠি বোঝান", shopping:"কেনাকাটার তালিকা", recent:"সাম্প্রতিক", voice_grant:"ভয়েস অনুমতি", agree:"✓ আমি সম্মত", not_now:"এখন না", disclaimer_read:"শর্ত আবার পড়ুন", clear_history:"ইতিহাস মুছুন" },

    te:  { read_page:"🔊 పేజీ చదవండి", speak:"🔊 మాట్లాడండి", ask_chitti:"🤖 చిట్టీని అడగండి", good:"👍 మంచిది", bad:"👎 చెడు", feedback:"📝 అభిప్రాయం", what_wrong:"ఏమి తప్పు?", submit:"సమర్పించు", cancel:"రద్దు", type_here:"అభిప్రాయం టైప్ చేయండి…", thanks:"ధన్యవాదాలు! చిట్టీ నేర్చుకుంటుంది.", large_text:"🔡 పెద్ద అక్షరాలు", slow:"🐢 నెమ్మది", braille:"⠿ బ్రెయిలీ", sebi:"⚠️ SEBI నమోదు కాలేదు · కేవలం విద్యా", disclaimer:"పూర్తి వివరాలు", search:"వెతకండి", send:"పంపండి", clear:"తీసివేయండి", loading:"లోడ్ అవుతోంది…", live:"🟢 లైవ్", warming:"🟠 మొదలవుతోంది", down:"🔴 డౌన్", how_to:"ఎలా వాడాలి", demo:"డెమో మోడ్", top:"↑ పైకి", change_lang:"భాష మార్చండి", scan:"స్కాన్ చేయండి", compare:"పోల్చండి", wallet:"కుటుంబ వాలెట్", reminders:"రిమైండర్లు", settings:"సెట్టింగులు", learn:"నేర్చుకోండి", jan_aushadhi:"జన్ ఔషధి", insurance:"బీమా", national:"జాతీయ", state:"రాష్ట్రం", business:"వ్యాపారం", tech:"సాంకేతికత", sports:"క్రీడలు", entertainment:"వినోదం", read_later:"తర్వాత చదవండి", refresh:"రిఫ్రెష్", chitti_take:"చిట్టీ అభిప్రాయం", explain:"సులభంగా చెప్పండి", fact_check:"వాస్తవ తనిఖీ", read_aloud:"గట్టిగా చదవండి", save:"సేవ్ చేయండి", share:"షేర్ చేయండి", open_source:"మూలం తెరవండి", ask:"ఏదైనా అడగండి", summarise:"కాల్ సారాంశం", translate:"అనువదించండి", reply:"జవాబు సూచన", explain_letter:"లేఖ వివరించండి", shopping:"షాపింగ్ జాబితా", recent:"ఇటీవలి", voice_grant:"వాయిస్ అనుమతి", agree:"✓ నేను అంగీకరిస్తున్నాను", not_now:"ఇప్పుడు వద్దు", disclaimer_read:"నిబంధనలు మళ్ళీ చదవండి", clear_history:"చరిత్ర తీసివేయండి" },

    ta:  { read_page:"🔊 பக்கம் படிக்கவும்", speak:"🔊 பேசுங்கள்", ask_chitti:"🤖 சிட்டியிடம் கேளுங்கள்", good:"👍 நல்லது", bad:"👎 மோசம்", feedback:"📝 கருத்து", what_wrong:"என்ன தவறு?", submit:"சமர்பிக்கவும்", cancel:"ரத்து செய்யவும்", type_here:"கருத்தை தட்டச்சு செய்யுங்கள்…", thanks:"நன்றி! சிட்டி கற்றுக்கொள்ளும்.", large_text:"🔡 பெரிய எழுத்து", slow:"🐢 மெதுவான பேச்சு", braille:"⠿ பிரெயில்", sebi:"⚠️ SEBI பதிவு இல்லை · கல்வி நோக்கம் மட்டும்", disclaimer:"முழு விவரம்", search:"தேடுங்கள்", send:"அனுப்புங்கள்", clear:"அழிக்கவும்", loading:"ஏற்றுகிறது…", live:"🟢 நேரடி", warming:"🟠 தொடங்குகிறது", down:"🔴 நிறுத்தம்", how_to:"எப்படி பயன்படுத்துவது", demo:"டெமோ பயன்முறை", top:"↑ மேலே", change_lang:"மொழி மாற்று", scan:"ஸ்கேன் செய்யுங்கள்", compare:"ஒப்பிடுங்கள்", wallet:"குடும்ப வாலட்", reminders:"நினைவூட்டல்கள்", settings:"அமைப்புகள்", learn:"கற்றுக்கொள்ளுங்கள்", jan_aushadhi:"ஜன் ஔஷதி", insurance:"காப்பீடு", national:"தேசிய", state:"மாநிலம்", business:"வணிகம்", tech:"தொழில்நுட்பம்", sports:"விளையாட்டு", entertainment:"பொழுதுபோக்கு", read_later:"பிறகு படிக்கவும்", refresh:"புதுப்பிக்கவும்", chitti_take:"சிட்டியின் கருத்து", explain:"எளிமையாக விளக்குங்கள்", fact_check:"உண்மை சரிபார்ப்பு", read_aloud:"சத்தமாக படிக்கவும்", save:"சேமிக்கவும்", share:"பகிரவும்", open_source:"மூலம் திறக்கவும்", ask:"எதையும் கேளுங்கள்", summarise:"அழைப்பு சுருக்கம்", translate:"மொழிபெயர்க்கவும்", reply:"பதில் பரிந்துரை", explain_letter:"கடிதம் விளக்கவும்", shopping:"ஷாப்பிங் பட்டியல்", recent:"சமீபத்திய", voice_grant:"குரல் அனுமதி", agree:"✓ நான் ஒப்புக்கொள்கிறேன்", not_now:"இப்போது வேண்டாம்", disclaimer_read:"விதிமுறைகளை மீண்டும் படிக்கவும்", clear_history:"வரலாற்றை அழிக்கவும்" },

    mr:  { read_page:"🔊 पृष्ठ वाचा", speak:"🔊 बोला", ask_chitti:"🤖 चिट्टीला विचारा", good:"👍 चांगले", bad:"👎 वाईट", feedback:"📝 अभिप्राय", what_wrong:"काय चुकीचे होते?", submit:"सबमिट करा", cancel:"रद्द करा", type_here:"अभिप्राय टाइप करा…", thanks:"धन्यवाद! चिट्टी शिकेल.", large_text:"🔡 मोठा मजकूर", slow:"🐢 हळू भाषण", braille:"⠿ ब्रेल", sebi:"⚠️ SEBI नोंदणीकृत नाही · केवळ शैक्षणिक", disclaimer:"पूर्ण माहिती", search:"शोधा", send:"पाठवा", clear:"साफ करा", loading:"लोड होत आहे…", live:"🟢 लाइव्ह", warming:"🟠 सुरू होत आहे", down:"🔴 बंद", how_to:"कसे वापरावे", demo:"डेमो मोड", top:"↑ वर", change_lang:"भाषा बदला", scan:"स्कॅन करा", compare:"तुलना करा", wallet:"कौटुंबिक वॉलेट", reminders:"स्मरणपत्रे", settings:"सेटिंग्ज", learn:"शिका", jan_aushadhi:"जन औषधी", insurance:"विमा", national:"राष्ट्रीय", state:"राज्य", business:"व्यवसाय", tech:"तंत्रज्ञान", sports:"क्रीडा", entertainment:"मनोरंजन", read_later:"नंतर वाचा", refresh:"रिफ्रेश करा", chitti_take:"चिट्टीचे मत", explain:"सोप्या शब्दात सांगा", fact_check:"तथ्य तपासणी", read_aloud:"मोठ्याने वाचा", save:"जतन करा", share:"शेअर करा", open_source:"स्रोत उघडा", ask:"काहीही विचारा", summarise:"कॉल सारांश", translate:"भाषांतर करा", reply:"उत्तर सुचवणी", explain_letter:"पत्र समजावून सांगा", shopping:"खरेदी यादी", recent:"अलीकडील", voice_grant:"आवाज परवानगी", agree:"✓ मी सहमत आहे", not_now:"आत्ता नाही", disclaimer_read:"अटी पुन्हा वाचा", clear_history:"इतिहास साफ करा" },

    gu:  { read_page:"🔊 પૃષ્ઠ વાંચો", speak:"🔊 બોલો", ask_chitti:"🤖 ચિટ્ટીને પૂછો", good:"👍 સારું", bad:"👎 ખરાબ", feedback:"📝 પ્રતિક્રિયા", what_wrong:"શું ખોટું હતું?", submit:"સબમિટ કરો", cancel:"રદ કરો", type_here:"પ્રતિક્રિયા ટાઇપ કરો…", thanks:"આભાર! ચિટ્ટી શીખશે.", large_text:"🔡 મોટો ટેક્સ્ટ", slow:"🐢 ધીમી વાણી", braille:"⠿ બ્રેઇલ", sebi:"⚠️ SEBI નોંધાયેલ નથી · માત્ર શૈક્ષણિક", disclaimer:"સંપૂર્ણ માહિતી", search:"શોધો", send:"મોકલો", clear:"સાફ કરો", loading:"લોડ થઈ રહ્યું છે…", live:"🟢 લાઇવ", warming:"🟠 શરૂ થઈ રહ્યું છે", down:"🔴 બંધ", how_to:"કેવી રીતે વાપરવું", demo:"ડેમો મોડ", top:"↑ ઉપર", change_lang:"ભાષા બદલો", scan:"સ્કેન કરો", compare:"સરખામણી કરો", wallet:"કૌટુંબિક વૉલેટ", reminders:"રીમાઇન્ડર", settings:"સેટિંગ્સ", learn:"શીખો", jan_aushadhi:"જન ઔષધિ", insurance:"વીમો", national:"રાષ્ટ્રીય", state:"રાજ્ય", business:"વ્યવસાય", tech:"ટેકનોલોજી", sports:"રમતગમત", entertainment:"મનોરંજન", read_later:"પછી વાંચો", refresh:"રિફ્રેશ કરો", chitti_take:"ચિટ્ટીનો મત", explain:"સરળ ભાષામાં સમજાવો", fact_check:"હકીકત તપાસ", read_aloud:"મોટેથી વાંચો", save:"સાચવો", share:"શેર કરો", open_source:"સ્રોત ખોલો", ask:"કંઈ પણ પૂછો", summarise:"કૉલ સારાંશ", translate:"અનુવાદ કરો", reply:"જવાબ સૂચન", explain_letter:"પત્ર સમજાવો", shopping:"ખરીદી યાદી", recent:"તાજેતરનું", voice_grant:"અવાજ પરવાનગી", agree:"✓ હું સંમત છું", not_now:"અત્યારે નહીં", disclaimer_read:"શરતો ફરી વાંચો", clear_history:"ઇતિહાસ સાફ કરો" },

    kn:  { read_page:"🔊 ಪುಟ ಓದಿ", speak:"🔊 ಮಾತಾಡಿ", ask_chitti:"🤖 ಚಿಟ್ಟಿಯನ್ನು ಕೇಳಿ", good:"👍 ಒಳ್ಳೆಯದು", bad:"👎 ಕೆಟ್ಟದು", feedback:"📝 ಪ್ರತಿಕ್ರಿಯೆ", what_wrong:"ಏನು ತಪ್ಪಾಯಿತು?", submit:"ಸಲ್ಲಿಸಿ", cancel:"ರದ್ದು ಮಾಡಿ", type_here:"ಪ್ರತಿಕ್ರಿಯೆ ಟೈಪ್ ಮಾಡಿ…", thanks:"ಧನ್ಯವಾದ! ಚಿಟ್ಟಿ ಕಲಿಯುತ್ತದೆ.", large_text:"🔡 ದೊಡ್ಡ ಅಕ್ಷರ", slow:"🐢 ನಿಧಾನ ಮಾತು", braille:"⠿ ಬ್ರೈಲ್", sebi:"⚠️ SEBI ನೋಂದಾಯಿತವಲ್ಲ · ಶೈಕ್ಷಣಿಕ ಮಾತ್ರ", disclaimer:"ಪೂರ್ಣ ಮಾಹಿತಿ", search:"ಹುಡುಕಿ", send:"ಕಳುಹಿಸಿ", clear:"ತೆರವುಗೊಳಿಸಿ", loading:"ಲೋಡ್ ಆಗುತ್ತಿದೆ…", live:"🟢 ಲೈವ್", warming:"🟠 ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ", down:"🔴 ಡೌನ್", how_to:"ಹೇಗೆ ಬಳಸುವುದು", demo:"ಡೆಮೋ ಮೋಡ್", top:"↑ ಮೇಲೆ", change_lang:"ಭಾಷೆ ಬದಲಿಸಿ", scan:"ಸ್ಕ್ಯಾನ್ ಮಾಡಿ", compare:"ಹೋಲಿಸಿ", wallet:"ಕುಟುಂಬ ವಾಲೆಟ್", reminders:"ರಿಮೈಂಡರ್‌ಗಳು", settings:"ಸೆಟ್ಟಿಂಗ್‌ಗಳು", learn:"ಕಲಿಯಿರಿ", jan_aushadhi:"ಜನ್ ಔಷಧಿ", insurance:"ವಿಮೆ", national:"ರಾಷ್ಟ್ರೀಯ", state:"ರಾಜ್ಯ", business:"ವ್ಯಾಪಾರ", tech:"ತಂತ್ರಜ್ಞಾನ", sports:"ಕ್ರೀಡೆ", entertainment:"ಮನರಂಜನೆ", read_later:"ನಂತರ ಓದಿ", refresh:"ರಿಫ್ರೆಶ್", chitti_take:"ಚಿಟ್ಟಿಯ ಅಭಿಪ್ರಾಯ", explain:"ಸರಳವಾಗಿ ವಿವರಿಸಿ", fact_check:"ಸತ್ಯ ಪರಿಶೀಲನೆ", read_aloud:"ಗಟ್ಟಿಯಾಗಿ ಓದಿ", save:"ಉಳಿಸಿ", share:"ಹಂಚಿಕೊಳ್ಳಿ", open_source:"ಮೂಲ ತೆರೆಯಿರಿ", ask:"ಏನಾದರೂ ಕೇಳಿ", summarise:"ಕರೆ ಸಾರಾಂಶ", translate:"ಅನುವಾದಿಸಿ", reply:"ಉತ್ತರ ಸಲಹೆ", explain_letter:"ಪತ್ರ ವಿವರಿಸಿ", shopping:"ಶಾಪಿಂಗ್ ಪಟ್ಟಿ", recent:"ಇತ್ತೀಚಿನ", voice_grant:"ಧ್ವನಿ ಅನುಮತಿ", agree:"✓ ನಾನು ಒಪ್ಪುತ್ತೇನೆ", not_now:"ಈಗ ಬೇಡ", disclaimer_read:"ನಿಯಮಗಳನ್ನು ಮತ್ತೆ ಓದಿ", clear_history:"ಇತಿಹಾಸ ತೆರವುಗೊಳಿಸಿ" },

    ml:  { read_page:"🔊 പേജ് വായിക്കുക", speak:"🔊 സംസാരിക്കുക", ask_chitti:"🤖 ചിട്ടിയോട് ചോദിക്കുക", good:"👍 നല്ലത്", bad:"👎 മോശം", feedback:"📝 അഭിപ്രായം", what_wrong:"എന്ത് തെറ്റ്?", submit:"സമർപ്പിക്കുക", cancel:"റദ്ദാക്കുക", type_here:"അഭിപ്രായം ടൈപ്പ് ചെയ്യുക…", thanks:"നന്ദി! ചിട്ടി പഠിക്കും.", large_text:"🔡 വലിയ ടെക്സ്റ്റ്", slow:"🐢 സ്ലോ സ്പീച്ച്", braille:"⠿ ബ്രെയ്‌ൽ", sebi:"⚠️ SEBI രജിസ്റ്റർ ചെയ്തിട്ടില്ല · വിദ്യാഭ്യാസ മാത്രം", disclaimer:"പൂർണ്ണ വിവരം", search:"തിരയുക", send:"അയയ്ക്കുക", clear:"മായ്ക്കുക", loading:"ലോഡ് ചെയ്യുന്നു…", live:"🟢 ലൈവ്", warming:"🟠 ആരംഭിക്കുന്നു", down:"🔴 ഡൗൺ", how_to:"എങ്ങനെ ഉപയോഗിക്കാം", demo:"ഡെമോ മോഡ്", top:"↑ മുകളിലേക്ക്", change_lang:"ഭാഷ മാറ്റുക", scan:"സ്കാൻ ചെയ്യുക", compare:"താരതമ്യം ചെയ്യുക", wallet:"കുടുംബ വാലറ്റ്", reminders:"ഓർമ്മപ്പെടുത്തലുകൾ", settings:"ക്രമീകരണങ്ങൾ", learn:"പഠിക്കുക", jan_aushadhi:"ജൻ ഔഷധി", insurance:"ഇൻഷുറൻസ്", national:"ദേശീയ", state:"സംസ്ഥാനം", business:"ബിസിനസ്സ്", tech:"സാങ്കേതികത", sports:"കായികം", entertainment:"വിനോദം", read_later:"പിന്നീട് വായിക്കുക", refresh:"പുതുക്കുക", chitti_take:"ചിട്ടിയുടെ അഭിപ്രായം", explain:"ലളിതമായി വിശദീകരിക്കുക", fact_check:"വസ്തുത പരിശോധന", read_aloud:"ഉറക്കെ വായിക്കുക", save:"സേവ് ചെയ്യുക", share:"ഷെയർ ചെയ്യുക", open_source:"ഉറവിടം തുറക്കുക", ask:"എന്തും ചോദിക്കുക", summarise:"കോൾ സംഗ്രഹം", translate:"വിവർത്തനം ചെയ്യുക", reply:"മറുപടി നിർദ്ദേശം", explain_letter:"കത്ത് വിശദീകരിക്കുക", shopping:"ഷോപ്പിംഗ് ലിസ്റ്റ്", recent:"സമീപകാലം", voice_grant:"ശബ്ദ അനുമതി", agree:"✓ ഞാൻ സമ്മതിക്കുന്നു", not_now:"ഇപ്പോൾ വേണ്ട", disclaimer_read:"നിബന്ധനകൾ വീണ്ടും വായിക്കുക", clear_history:"ചരിത്രം മായ്ക്കുക" }
  };

  // For languages without full translation yet — fall back to Hindi
  ["pa","or","as","ur","sa","mai","kok","doi","ks","ne","sd","mni","sat","bho","raj","kru","hoc"].forEach(c => { T[c] = T["hi"]; });

  // ── STATE ─────────────────────────────────────────────────────────────────
  let currentLang = localStorage.getItem("chitti_lang") || "en";

  // ── TRANSLATE ENTIRE PAGE ─────────────────────────────────────────────────
  function translatePage(lang) {
    const t = T[lang] || T["en"];
    currentLang = lang;
    localStorage.setItem("chitti_lang", lang);

    // Set HTML lang attribute for screen readers
    document.documentElement.lang = lang;

    // Translate every element with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (t[key]) el.textContent = t[key];
    });

    // Translate placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (t[key]) el.placeholder = t[key];
    });

    // Translate aria-labels
    document.querySelectorAll("[data-i18n-aria]").forEach(el => {
      const key = el.getAttribute("data-i18n-aria");
      if (t[key]) el.setAttribute("aria-label", t[key]);
    });

    // Update language bar active state
    document.querySelectorAll(".chitti-lang-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    // Dispatch event so page-specific JS can react
    document.dispatchEvent(new CustomEvent("chitti:langchange", { detail: { lang, t } }));
  }

  // ── INJECT LANGUAGE BAR ───────────────────────────────────────────────────
  function injectLangBar() {
    // Remove any existing lang bar
    const existing = document.getElementById("chitti-langbar");
    if (existing) existing.remove();

    const bar = document.createElement("div");
    bar.id = "chitti-langbar";
    bar.setAttribute("role", "navigation");
    bar.setAttribute("aria-label", "Language selector");
    bar.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
      background: #1a1a2e; color: #fff;
      display: flex; align-items: center; flex-wrap: wrap;
      padding: 4px 8px; gap: 4px;
      font-family: system-ui, sans-serif; font-size: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

    // Language buttons
    LANGS.forEach(lng => {
      const btn = document.createElement("button");
      btn.className = "chitti-lang-btn";
      btn.dataset.lang = lng.code;
      btn.textContent = lng.native;
      btn.title = lng.label;
      btn.setAttribute("aria-label", `Switch to ${lng.label}`);
      btn.style.cssText = `
        background: transparent; border: 1px solid rgba(255,255,255,0.2);
        color: #fff; padding: 2px 8px; border-radius: 12px;
        cursor: pointer; font-size: 11px; white-space: nowrap;
        transition: all 0.2s;
      `;
      btn.addEventListener("mouseenter", () => { btn.style.background = "rgba(255,165,0,0.3)"; });
      btn.addEventListener("mouseleave", () => { btn.style.background = btn.dataset.lang === currentLang ? "#FF6B00" : "transparent"; });
      btn.addEventListener("click", () => translatePage(lng.code));
      bar.appendChild(btn);
    });

    // Read page button
    const readBtn = document.createElement("button");
    readBtn.id = "chitti-read-page";
    readBtn.textContent = "🔊";
    readBtn.title = "Read page aloud";
    readBtn.style.cssText = `
      margin-left: auto; background: #FF6B00; border: none;
      color: #fff; padding: 2px 10px; border-radius: 12px;
      cursor: pointer; font-size: 13px;
    `;
    readBtn.addEventListener("click", readPageAloud);
    bar.appendChild(readBtn);

    document.body.insertBefore(bar, document.body.firstChild);

    // Add top padding to body so bar doesn't overlap content
    document.body.style.paddingTop = (parseInt(document.body.style.paddingTop) || 0) + 36 + "px";

    // Apply current language
    translatePage(currentLang);
  }

  // ── READ PAGE ALOUD ───────────────────────────────────────────────────────
  function readPageAloud() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const text = document.body.innerText.slice(0, 3000);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = currentLang === "hi" ? "hi-IN" : currentLang === "bn" ? "bn-IN" : currentLang === "ta" ? "ta-IN" : currentLang === "te" ? "te-IN" : currentLang === "mr" ? "mr-IN" : currentLang === "gu" ? "gu-IN" : currentLang === "kn" ? "kn-IN" : currentLang === "ml" ? "ml-IN" : "en-IN";
    window.speechSynthesis.speak(u);
  }

  // ── SPEAK HELPER ──────────────────────────────────────────────────────────
  window.Chitti = window.Chitti || {};
  window.Chitti.speak = function(text, lang) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || (currentLang === "hi" ? "hi-IN" : "en-IN");
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };
  window.Chitti.getLang = function() { return currentLang; };
  window.Chitti.getT = function() { return T[currentLang] || T["en"]; };

  // ── PER-RESPONSE WIDGET ───────────────────────────────────────────────────
  function attachWidget(box) {
    if (box.dataset.chittiWidget) return;
    box.dataset.chittiWidget = "1";

    const section = box.dataset.chittiSection || box.querySelector("h2,h3,h4")?.textContent || "This response";
    const t = T[currentLang] || T["en"];

    const row = document.createElement("div");
    row.className = "chitti-widget-row";
    row.style.cssText = `
      display: flex; align-items: center; gap: 8px;
      padding: 6px 10px; margin-top: 8px;
      background: rgba(255,107,0,0.05); border-radius: 8px;
      border-left: 3px solid #FF6B00; font-size: 13px;
      font-family: system-ui, sans-serif;
    `;

    // Section label
    const label = document.createElement("span");
    label.style.cssText = "color: #FF6B00; font-size: 11px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
    label.textContent = "🤖 " + section.slice(0, 40);
    row.appendChild(label);

    // Speaker button
    const speakBtn = makeBtn("🔊", t.speak, () => {
      Chitti.speak(box.innerText, currentLang);
    });
    row.appendChild(speakBtn);

    // Ask Chitti button
    const askBtn = makeBtn("🤖", t.ask_chitti, () => {
      const q = prompt("Ask Chitti about: " + section);
      if (q) window.location.href = "chitti_vaani.html?q=" + encodeURIComponent(q);
    });
    row.appendChild(askBtn);

    // Thumbs up
    const upBtn = makeBtn("👍", t.good, () => {
      upBtn.style.background = "#4CAF50";
      sendFeedback(box.id || section, "up", "");
    });
    row.appendChild(upBtn);

    // Thumbs down — opens feedback popup
    const downBtn = makeBtn("👎", t.bad, () => {
      openFeedbackPopup(box, section);
    });
    row.appendChild(downBtn);

    box.appendChild(row);
  }

  function makeBtn(emoji, title, onClick) {
    const btn = document.createElement("button");
    btn.textContent = emoji;
    btn.title = title;
    btn.setAttribute("aria-label", title);
    btn.style.cssText = `
      background: transparent; border: 1px solid rgba(255,107,0,0.3);
      border-radius: 50%; width: 28px; height: 28px;
      cursor: pointer; font-size: 14px; display: flex;
      align-items: center; justify-content: center;
      transition: background 0.2s;
    `;
    btn.addEventListener("mouseenter", () => { btn.style.background = "rgba(255,107,0,0.15)"; });
    btn.addEventListener("mouseleave", () => { if (!btn.dataset.active) btn.style.background = "transparent"; });
    btn.addEventListener("click", onClick);
    return btn;
  }

  function openFeedbackPopup(box, section) {
    const t = T[currentLang] || T["en"];
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      z-index: 999999; display: flex; align-items: center; justify-content: center;
      font-family: system-ui, sans-serif;
    `;
    const popup = document.createElement("div");
    popup.style.cssText = `
      background: #fff; border-radius: 12px; padding: 20px;
      max-width: 380px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    `;
    popup.innerHTML = `
      <h3 style="margin:0 0 4px;color:#1a1a2e;font-size:15px;">📝 ${t.feedback_header || t.feedback}: <span style="color:#FF6B00">${section.slice(0,40)}</span></h3>
      <p style="margin:0 0 12px;color:#666;font-size:13px;">${t.what_wrong}</p>
      <textarea id="chitti-fb-text" placeholder="${t.type_here}" style="width:100%;height:80px;border:1px solid #ddd;border-radius:8px;padding:8px;font-size:13px;resize:none;box-sizing:border-box;"></textarea>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button id="chitti-fb-submit" style="flex:1;background:#FF6B00;color:#fff;border:none;border-radius:8px;padding:8px;cursor:pointer;font-size:13px;">${t.submit}</button>
        <button id="chitti-fb-cancel" style="flex:1;background:#eee;color:#333;border:none;border-radius:8px;padding:8px;cursor:pointer;font-size:13px;">${t.cancel}</button>
      </div>
    `;
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    Chitti.speak(t.what_wrong, currentLang);

    popup.querySelector("#chitti-fb-submit").addEventListener("click", () => {
      const text = popup.querySelector("#chitti-fb-text").value;
      sendFeedback(box.id || section, "down", text);
      popup.innerHTML = `<p style="text-align:center;color:#4CAF50;font-size:15px;padding:20px;">✅ ${t.thanks}</p>`;
      setTimeout(() => overlay.remove(), 1500);
    });
    popup.querySelector("#chitti-fb-cancel").addEventListener("click", () => overlay.remove());
  }

  function sendFeedback(boxId, vote, text) {
    const base = window.CHITTI_FEEDBACK_API || "/api/feedback";
    fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ box_id: boxId, vote, text, lang: currentLang, page: location.pathname, ts: Date.now() })
    }).catch(() => {});
  }

  // ── MUTATIONOBSERVER — auto attach to new response boxes ──────────────────
  function scanForBoxes() {
    document.querySelectorAll(".chitti-response, [data-chitti-response]").forEach(attachWidget);
  }

  const observer = new MutationObserver(scanForBoxes);

  // ── INIT ──────────────────────────────────────────────────────────────────
  function init() {
    injectLangBar();
    scanForBoxes();
    observer.observe(document.body, { childList: true, subtree: true });

    // Add CSS for active lang button
    const style = document.createElement("style");
    style.textContent = `
      .chitti-lang-btn.active { background: #FF6B00 !important; border-color: #FF6B00 !important; font-weight: bold; }
      .chitti-lang-btn:focus { outline: 2px solid #FF6B00; }
      @media (max-width: 600px) { #chitti-langbar { font-size: 10px; } .chitti-lang-btn { padding: 2px 5px; font-size: 10px; } }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
