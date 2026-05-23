import { readFileSync, writeFileSync } from 'node:fs';
const PATH = 'c:/Users/DELL/sahayai/sahayai/strings.js';

// Helper to build per-lang variants for symmetric keys (mb./mc. parity)
function dup(map, prefixPairs) {
  const out = { ...map };
  for (const [from, to] of prefixPairs) {
    for (const [k, v] of Object.entries(map)) {
      if (k.startsWith(from)) out[k.replace(from, to)] = v;
    }
  }
  return out;
}

const TIPS = {
  // 8 tips × 9 langs each (bike). Indexed st.tip.0..7
  "st.tip.0": {
    en:"Check tyre pressure before riding — low pressure kills grip.",
    hi:"चलाने से पहले tyre pressure जांचें — कम pressure से grip कम होती है।",
    bn:"চালানোর আগে টায়ার প্রেশার দেখুন — কম প্রেশারে গ্রিপ কমে যায়।",
    ta:"ஓட்டுவதற்கு முன் டயர் காற்றழுத்தம் சரிபார் — குறைந்தால் பிடிப்பு போகும்.",
    te:"నడుపుకు ముందు టైర్ ప్రెషర్ చూడండి — తక్కువైతే గ్రిప్ తగ్గుతుంది.",
    mr:"चालण्या आधी टायर प्रेशर तपासा — कमी प्रेशरने ग्रिप कमी होते.",
    gu:"ચલાવતા પહેલા ટાયર પ્રેશર તપાસો — ઓછા પ્રેશરમાં ગ્રિપ ઓછી થાય.",
    kn:"ಚಲಾಯಿಸುವ ಮುಂಚೆ ಟೈರ್ ಪ್ರೆಶರ್ ಪರಿಶೀಲಿಸಿ — ಕಡಿಮೆಯಾದರೆ ಗ್ರಿಪ್ ಕಡಿಮೆ.",
    ml:"ഓടിക്കുന്നതിന് മുമ്പ് ടയർ പ്രെഷർ പരിശോധിക്കൂ — കുറവായാൽ ഗ്രിപ്പ് നഷ്ടം.",
  },
  "st.tip.1": {
    en:"Helmet on, strap tight. 1300 Indians die every day from head injuries.",
    hi:"हेलमेट पहनें, strap कसकर बांधें। हर दिन 1300 भारतीय head injury से जान खो देते हैं।",
    bn:"হেলমেট পরুন, স্ট্র্যাপ টাইট করুন। প্রতিদিন ১৩০০ ভারতীয় মাথার চোটে প্রাণ হারান।",
    ta:"ஹெல்மெட் அணியுங்கள், ஸ்ட்ராப்பை இறுக்கமாக கட்டுங்கள்.",
    te:"హెల్మెట్ ధరించండి, స్ట్రాప్ గట్టిగా కట్టండి. రోజుకు 1300 భారతీయులు తలగాయంతో మరణిస్తున్నారు.",
    mr:"हेल्मेट घाला, स्ट्रॅप घट्ट बांधा. दररोज 1300 भारतीय डोक्याच्या जखमेने मरतात.",
    gu:"હેલ્મેટ પહેરો, સ્ટ્રેપ ટાઈટ કરો. દરરોજ 1300 ભારતીય માથાની ઈજાથી મરે છે.",
    kn:"ಹೆಲ್ಮೆಟ್ ಧರಿಸಿ, ಸ್ಟ್ರಾಪ್ ಬಿಗಿಯಾಗಿ ಕಟ್ಟಿ. ದಿನಕ್ಕೆ 1300 ಭಾರತೀಯರು ತಲೆಗಾಯದಿಂದ ಸಾಯುತ್ತಾರೆ.",
    ml:"ഹെൽമെറ്റ് ധരിക്കൂ, സ്ട്രാപ്പ് മുറുക്കൂ. ദിവസവും 1300 ഇന്ത്യക്കാർ തലയ്ക്കു ക്ഷതമേറ്റ് മരിക്കുന്നു.",
  },
  "st.tip.2": {
    en:"At every signal, foot down — sudden brake from behind is the #1 city accident.",
    hi:"हर signal पर पैर ज़मीन पर रखें — पीछे से अचानक brake सबसे बड़ा शहरी accident है।",
    bn:"প্রতি সিগনালে পা মাটিতে — পেছন থেকে ব্রেকই শহরের সবচেয়ে বড় দুর্ঘটনা।",
    ta:"ஒவ்வொரு சிக்னலிலும் கால் தரையில் — பின்னால் இருந்து திடீர் பிரேக் நகர விபத்து #1.",
    te:"ప్రతి సిగ్నల్ వద్ద పాదం నేలపై — వెనుక నుండి హఠాత్తు బ్రేక్ #1 సిటీ యాక్సిడెంట్.",
    mr:"प्रत्येक सिग्नलवर पाय जमिनीवर — मागून अचानक ब्रेक #1 शहरी अपघात.",
    gu:"દરેક સિગ્નલ પર પગ જમીન પર — પાછળથી અચાનક બ્રેક #1 શહેરી અકસ્માત.",
    kn:"ಪ್ರತಿ ಸಿಗ್ನಲ್‌ನಲ್ಲಿ ಪಾದ ನೆಲಕ್ಕೆ — ಹಿಂದಿನಿಂದ ಹಠಾತ್ ಬ್ರೇಕ್ #1 ನಗರ ಅಪಘಾತ.",
    ml:"ഓരോ സിഗ്നലിലും കാല് നിലത്ത് — പിന്നിൽ നിന്നുള്ള പെട്ടെന്നുള്ള ബ്രേക്ക് #1 നഗര അപകടം.",
  },
  "st.tip.3": {
    en:"Use high-beam correctly — drop to low when a vehicle is in front.",
    hi:"रात को high-beam का सही use — सामने गाड़ी हो तो low कर दें।",
    bn:"হাই-বিম সাবধানে — সামনে গাড়ি থাকলে লো বিম।",
    ta:"ஹை-பீம் சரியாக — முன்னால் வாகனம் இருந்தால் லோ-பீம்.",
    te:"హై-బీమ్ సరిగ్గా — ముందు వాహనం ఉంటే లో-బీమ్.",
    mr:"हाय-बीम योग्य — समोर वाहन असेल तर लो-बीम.",
    gu:"હાય-બીમ યોગ્ય — સામે વાહન હોય તો લો-બીમ.",
    kn:"ಹೈ-ಬೀಮ್ ಸರಿಯಾಗಿ — ಮುಂದೆ ವಾಹನ ಇದ್ದರೆ ಲೋ-ಬೀಮ್.",
    ml:"ഹൈ-ബീം ശരിയായി — മുന്നിൽ വാഹനം ഉണ്ടെങ്കിൽ ലോ-ബീം.",
  },
  "st.tip.4": {
    en:"Mileage drop? Check tyre pressure first, then chain tension.",
    hi:"Mileage कम लगे? पहले tyre pressure, फिर chain का खिंचाव देखें।",
    bn:"মাইলেজ কমেছে? প্রথমে টায়ার প্রেশার, তারপর চেন দেখুন।",
    ta:"மைலேஜ் குறைந்ததா? முதலில் டயர் காற்றழுத்தம், பின் செயின் இறுக்கம்.",
    te:"మైలేజ్ తగ్గిందా? ముందు టైర్ ప్రెషర్, తరువాత చైన్ టెన్షన్.",
    mr:"मायलेज कमी? आधी टायर प्रेशर, मग चेन ताण.",
    gu:"માઈલેજ ઓછું? પહેલા ટાયર પ્રેશર, પછી ચેન ટેન્શન.",
    kn:"ಮೈಲೇಜ್ ಕಡಿಮೆಯೇ? ಮೊದಲು ಟೈರ್ ಪ್ರೆಶರ್, ನಂತರ ಚೈನ್ ಟೆನ್ಶನ್.",
    ml:"മൈലേജ് കുറവോ? ആദ്യം ടയർ പ്രെഷർ, പിന്നെ ചെയിൻ ടെൻഷൻ.",
  },
  "st.tip.5": {
    en:"Brake fluid every 2 years. Old fluid slows the brake.",
    hi:"Brake fluid हर 2 साल बदलें। पुराना fluid brake को धीरे करता है।",
    bn:"প্রতি ২ বছরে ব্রেক ফ্লুইড বদলান।",
    ta:"2 ஆண்டுக்கொரு முறை பிரேக் ஃப்ளூயிட் மாற்றவும்.",
    te:"ప్రతి 2 సంవత్సరాలకు బ్రేక్ ఫ్లూయిడ్ మార్చండి.",
    mr:"दर 2 वर्षांनी ब्रेक फ्लुइड बदला.",
    gu:"દર 2 વર્ષે બ્રેક ફ્લુઇડ બદલો.",
    kn:"ಪ್ರತಿ 2 ವರ್ಷಗಳಿಗೊಮ್ಮೆ ಬ್ರೇಕ್ ಫ್ಲೂಯಿಡ್ ಬದಲಿಸಿ.",
    ml:"ഓരോ 2 വർഷത്തിലും ബ്രേക്ക് ഫ്ലൂയിഡ് മാറ്റൂ.",
  },
  "st.tip.6": {
    en:"Use only the engine oil quantity the manual lists.",
    hi:"Engine oil उतना ही डालें जितना manual में लिखा है।",
    bn:"ম্যানুয়ালে যা লেখা ঠিক ততই ইঞ্জিন তেল দিন।",
    ta:"மேன்யுவலில் சொன்ன அளவே என்ஜின் எண்ணெய் ஊற்றுங்கள்.",
    te:"మ్యానువల్‌లో ఇచ్చిన ఇంజిన్ ఆయిల్ మాత్రమే వాడండి.",
    mr:"मॅन्युअलमध्ये दिलेलंच इंजिन ऑइल टाका.",
    gu:"મેન્યુઅલ માં લખેલું જ એન્જિન ઓઇલ નાખો.",
    kn:"ಮ್ಯಾನುಯಲ್‌ನಲ್ಲಿ ಬರೆದಿರುವಷ್ಟು ಮಾತ್ರ ಇಂಜಿನ್ ಆಯಿಲ್.",
    ml:"മാനുവൽ പറയുന്ന അളവ് മാത്രം എഞ്ചിൻ ഓയിൽ.",
  },
  "st.tip.7": {
    en:"Brakes make noise? Mechanic immediately. Never compromise on safety.",
    hi:"Brake में आवाज़ आए? तुरंत mechanic। Safety se samjhota mat karo।",
    bn:"ব্রেকে শব্দ? এখনই মেকানিক। নিরাপত্তায় কোনো আপস নয়।",
    ta:"பிரேக்கில் சத்தம்? உடனே மெக்கானிக். பாதுகாப்பில் சமரசம் வேண்டாம்.",
    te:"బ్రేక్‌లో శబ్దం? వెంటనే మెకానిక్. భద్రతలో రాజీ లేదు.",
    mr:"ब्रेकमध्ये आवाज? लगेच मेकॅनिक. सुरक्षेशी तडजोड नको.",
    gu:"બ્રેકમાં અવાજ? તરત મિકેનિક. સુરક્ષામાં બાંધછોડ નહીં.",
    kn:"ಬ್ರೇಕ್‌ನಲ್ಲಿ ಶಬ್ದ? ತಕ್ಷಣ ಮೆಕಾನಿಕ್. ಸುರಕ್ಷತೆಯಲ್ಲಿ ರಾಜಿ ಇಲ್ಲ.",
    ml:"ബ്രേക്കിൽ ശബ്ദം? ഉടനെ മെക്കാനിക്. സുരക്ഷയിൽ വിട്ടുവീഴ്ച ഇല്ല.",
  },
};

// Reuse the same st.tip.N values as mc.st.tip.N (cars same advice)
const CAR_TIPS = {};
for (const [k, v] of Object.entries(TIPS)) {
  CAR_TIPS[k.replace('st.tip.', 'mc.st.tip.')] = v;
}

const DOCS = {
  "doc.insurance":   { en:"Insurance", hi:"बीमा", bn:"বীমা", ta:"காப்பீடு", te:"బీమా", mr:"विमा", gu:"વીમો", kn:"ವಿಮೆ", ml:"ഇൻഷുറൻസ്" },
  "doc.puc":         { en:"PUC / Pollution", hi:"PUC / प्रदूषण", bn:"পিইউসি / দূষণ", ta:"PUC / மாசு", te:"PUC / కాలుష్యం", mr:"PUC / प्रदूषण", gu:"PUC / પ્રદૂષણ", kn:"PUC / ಮಾಲಿನ್ಯ", ml:"PUC / മലിനീകരണം" },
  "doc.rc":          { en:"RC (Vehicle Registration)", hi:"RC (वाहन रजिस्ट्रेशन)", bn:"আরসি (যানবাহন নিবন্ধন)", ta:"RC (வாகனப் பதிவு)", te:"RC (వాహన నమోదు)", mr:"RC (वाहन नोंदणी)", gu:"RC (વાહન નોંધણી)", kn:"RC (ವಾಹನ ನೋಂದಣಿ)", ml:"RC (വാഹന രജിസ്ട്രേഷൻ)" },
  "doc.dl":          { en:"Driving Licence", hi:"ड्राइविंग लाइसेंस", bn:"ড্রাইভিং লাইসেন্স", ta:"ஓட்டுநர் உரிமம்", te:"డ్రైవింగ్ లైసెన్స్", mr:"ड्रायव्हिंग लायसन्स", gu:"ડ્રાઇવિંગ લાઇસન્સ", kn:"ಚಾಲನಾ ಪರವಾನಗಿ", ml:"ഡ്രൈവിംഗ് ലൈസൻസ്" },
  "doc.fastag":      { en:"FASTag balance", hi:"FASTag balance", bn:"FASTag ব্যালেন্স", ta:"FASTag பேலன்ஸ்", te:"FASTag బ్యాలెన్స్", mr:"FASTag बॅलन्स", gu:"FASTag બેલેન્સ", kn:"FASTag ಬ್ಯಾಲೆನ್ಸ್", ml:"FASTag ബാലൻസ്" },
  "doc.unknown":     { en:"Document", hi:"दस्तावेज़", bn:"কাগজ", ta:"ஆவணம்", te:"పత్రం", mr:"कागदपत्र", gu:"દસ્તાવેજ", kn:"ದಾಖಲೆ", ml:"രേഖ" },
  "doc.expired":     { en:"expired", hi:"expire हो गया", bn:"মেয়াদ শেষ", ta:"முடிந்தது", te:"గడువు ముగిసింది", mr:"मुदत संपली", gu:"એક્સપાયર", kn:"ಮುಗಿದಿದೆ", ml:"കാലഹരണപ്പെട്ടു" },
  "doc.add_expiry":  { en:"add expiry", hi:"expiry जोड़ो", bn:"মেয়াদ যোগ করুন", ta:"முடிவு சேர்", te:"గడువు జోడించండి", mr:"मुदत जोडा", gu:"એક્સપાયરી ઉમેરો", kn:"ಮುಕ್ತಾಯ ಸೇರಿಸಿ", ml:"കാലാവധി ചേർക്കൂ" },
  "doc.days_left":   { en:"days", hi:"दिन", bn:"দিন", ta:"நாட்கள்", te:"రోజులు", mr:"दिवस", gu:"દિવસ", kn:"ದಿನಗಳು", ml:"ദിവസം" },
  "doc.expiry_label":{ en:"Expiry", hi:"Expiry", bn:"মেয়াদ", ta:"முடிவு தேதி", te:"గడువు", mr:"मुदत", gu:"એક્સપાયરી", kn:"ಮುಕ್ತಾಯ", ml:"കാലാവധി" },
  "doc.renew":       { en:"renew", hi:"नया करें", bn:"নবায়ন", ta:"புதுப்பி", te:"పునరుద్ధరణ", mr:"नूतनीकरण", gu:"નવીકરણ", kn:"ನವೀಕರಣ", ml:"പുതുക്കൂ" },
  "doc.renew.speak": { en:"To renew, apply online on PolicyBazaar or the government portal.", hi:"नया करने के लिए PolicyBazaar या सरकारी portal pe online apply karein.", bn:"নবায়নের জন্য পলিসিবাজার বা সরকারি পোর্টালে অনলাইনে আবেদন করুন।", ta:"புதுப்பிக்க PolicyBazaar அல்லது அரசு போர்ட்டலில் ஆன்லைனில் விண்ணப்பிக்கவும்.", te:"పునరుద్ధరణకు PolicyBazaar లేదా ప్రభుత్వ పోర్టల్‌లో ఆన్‌లైన్‌లో దరఖాస్తు చేయండి.", mr:"नूतनीकरणासाठी PolicyBazaar किंवा सरकारी पोर्टलवर ऑनलाइन अर्ज करा.", gu:"નવીકરણ માટે PolicyBazaar અથવા સરકારી પોર્ટલ પર ઓનલાઈન અરજી કરો.", kn:"ನವೀಕರಣಕ್ಕಾಗಿ PolicyBazaar ಅಥವಾ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಆನ್‌ಲೈನ್ ಅರ್ಜಿ.", ml:"പുതുക്കാൻ PolicyBazaar അല്ലെങ്കിൽ സർക്കാർ പോർട്ടലിൽ ഓൺലൈൻ അപേക്ഷ." },
  "doc.no_expiry":   { en:"no expiry added yet", hi:"अभी expiry नहीं डाली", bn:"মেয়াদ এখনো যোগ করা হয়নি", ta:"இன்னும் முடிவு தேதி இல்லை", te:"గడువు ఇంకా జోడించలేదు", mr:"मुदत अजून जोडलेली नाही", gu:"એક્સપાયરી હજુ ઉમેરી નથી", kn:"ಮುಕ್ತಾಯ ಇನ್ನೂ ಸೇರಿಸಿಲ್ಲ", ml:"കാലാവധി ഇതുവരെ ചേർത്തിട്ടില്ല" },
  "doc.days_remaining":{ en:"days left", hi:"दिन बाकी", bn:"দিন বাকি", ta:"நாட்கள் மீதம்", te:"రోజులు మిగిలాయి", mr:"दिवस बाकी", gu:"દિવસ બાકી", kn:"ದಿನಗಳು ಬಾಕಿ", ml:"ദിവസം ബാക്കി" },
  "doc.demo.speak":  { en:"Demo: Insurance expires in 12 days. Chitti will remind you.", hi:"Demo: 12 दिन में Insurance expire ho rahi hai. Chitti reminder dega.", bn:"ডেমো: ১২ দিনে বীমা মেয়াদ শেষ. Chitti মনে করিয়ে দেবে.", ta:"டெமோ: 12 நாட்களில் காப்பீடு முடிகிறது. Chitti நினைவூட்டும்.", te:"డెమో: 12 రోజుల్లో బీమా గడువు ముగుస్తుంది. Chitti గుర్తు చేస్తుంది.", mr:"डेमो: 12 दिवसांत विमा संपतोय. Chitti आठवण देईल.", gu:"ડેમો: 12 દિવસમાં વીમો સમાપ્ત. Chitti યાદ અપાવશે.", kn:"ಡೆಮೋ: 12 ದಿನಗಳಲ್ಲಿ ವಿಮೆ ಮುಗಿಯುತ್ತದೆ. Chitti ನೆನಪಿಸುತ್ತದೆ.", ml:"ഡെമോ: 12 ദിവസത്തിൽ ഇൻഷുറൻസ് കാലഹരണപ്പെടും. Chitti ഓർമ്മിപ്പിക്കും." },
};

const LS = {
  "ls.flag":   { en:"🔜 Launching Soon", hi:"🔜 जल्द आ रहा है", bn:"🔜 শীঘ্রই আসছে", ta:"🔜 விரைவில் வரும்", te:"🔜 త్వరలో వస్తోంది", mr:"🔜 लवकरच येत आहे", gu:"🔜 ટૂંક સમયમાં", kn:"🔜 ಶೀಘ್ರದಲ್ಲೇ", ml:"🔜 ഉടൻ വരുന്നു" },
  "ls.tag":    { en:"Chitti Special", hi:"Chitti Special", bn:"Chitti Special", ta:"Chitti Special", te:"Chitti Special", mr:"Chitti Special", gu:"Chitti Special", kn:"Chitti Special", ml:"Chitti Special" },
  "ls.phase2": { en:"Phase 2", hi:"Phase 2", bn:"Phase 2", ta:"Phase 2", te:"Phase 2", mr:"Phase 2", gu:"Phase 2", kn:"Phase 2", ml:"Phase 2" },
  // 2W items
  "ls.obd2_bike.title": { en:"🔧 OBD2 for Bikes", hi:"🔧 बाइक के लिए OBD2", bn:"🔧 বাইকের জন্য OBD2", ta:"🔧 பைக் OBD2", te:"🔧 బైక్ OBD2", mr:"🔧 बाईक OBD2", gu:"🔧 બાઈક OBD2", kn:"🔧 ಬೈಕ್ OBD2", ml:"🔧 ബൈക്ക് OBD2" },
  "ls.obd2_bike.sub":   { en:"Bluetooth dongle reads engine error codes directly. Chitti diagnoses before you even visit the mechanic.", hi:"Bluetooth device से सीधे engine error code पढ़ेगी Chitti। आपसे सिर्फ़ 'हाँ' सुनकर mechanic के पास जाने से पहले ही diagnosis हो जाएगी।", bn:"Bluetooth device সরাসরি ইঞ্জিন কোড পড়বে। মেকানিকের কাছে যাওয়ার আগেই Chitti বলে দেবে।", ta:"Bluetooth சாதனம் நேரடியாக என்ஜின் கோடு படிக்கும். மெக்கானிக்கிற்கு போகுமுன்னே Chitti சொல்லும்.", te:"Bluetooth పరికరం నేరుగా ఇంజిన్ కోడ్ చదువుతుంది. మెకానిక్ దగ్గరకు వెళ్ళకుండానే Chitti చెబుతుంది.", mr:"Bluetooth उपकरण थेट इंजिन कोड वाचेल. मेकॅनिककडे जायच्या आधीच Chitti सांगेल.", gu:"Bluetooth ડિવાઈસ સીધું એન્જિન કોડ વાંચશે. મિકેનિક પાસે જતા પહેલા Chitti કહેશે.", kn:"Bluetooth ಸಾಧನ ನೇರವಾಗಿ ಎಂಜಿನ್ ಕೋಡ್ ಓದುತ್ತದೆ. ಮೆಕಾನಿಕ್ ಬಳಿಗೆ ಹೋಗುವ ಮುಂಚೆ Chitti ಹೇಳುತ್ತದೆ.", ml:"Bluetooth ഉപകരണം നേരിട്ട് എഞ്ചിൻ കോഡ് വായിക്കും. മെക്കാനിക്കിന്റെ അടുത്ത് പോകുന്നതിന് മുമ്പ് Chitti പറയും." },
  "ls.chain_meter.title": { en:"📐 Chain Tension Meter", hi:"📐 चेन तनाव मीटर", bn:"📐 চেইন টেনশন মিটার", ta:"📐 செயின் இறுக்க மீட்டர்", te:"📐 చైన్ టెన్షన్ మీటర్", mr:"📐 चेन ताण मीटर", gu:"📐 ચેન ટેન્શન મીટર", kn:"📐 ಚೈನ್ ಟೆನ್ಶನ್ ಮೀಟರ್", ml:"📐 ചെയിൻ ടെൻഷൻ മീറ്റർ" },
  "ls.chain_meter.sub":   { en:"Camera measures chain tension — no guesswork. Chitti tells you the exact slack.", hi:"Camera से चेन का तनाव check — कोई guess work नहीं। Slack ज़्यादा या कम — Chitti exact बताएगी।", bn:"ক্যামেরা চেইন টেনশন মাপবে — অনুমান নয়। Chitti সঠিক বলবে।", ta:"கேமரா செயின் இறுக்கம் அளவிடும். Chitti சரியான அளவைச் சொல்லும்.", te:"కెమెరా చైన్ టెన్షన్ కొలుస్తుంది. Chitti ఖచ్చితంగా చెబుతుంది.", mr:"कॅमेरा चेन ताण मोजेल. Chitti अचूक सांगेल.", gu:"કેમેરા ચેન ટેન્શન માપશે. Chitti ચોક્કસ કહેશે.", kn:"ಕ್ಯಾಮೆರಾ ಚೈನ್ ಟೆನ್ಶನ್ ಅಳೆಯುತ್ತದೆ. Chitti ನಿಖರ ಹೇಳುತ್ತದೆ.", ml:"ക്യാമറ ചെയിൻ ടെൻഷൻ അളക്കും. Chitti കൃത്യം പറയും." },
  "ls.tyre_ai.title": { en:"🛞 Tyre Pressure AI", hi:"🛞 Tyre Pressure AI", bn:"🛞 টায়ার প্রেশার AI", ta:"🛞 டயர் காற்றழுத்த AI", te:"🛞 టైర్ ప్రెషర్ AI", mr:"🛞 टायर प्रेशर AI", gu:"🛞 ટાયર પ્રેશર AI", kn:"🛞 ಟೈರ್ ಪ್ರೆಶರ್ AI", ml:"🛞 ടയർ പ്രെഷർ AI" },
  "ls.tyre_ai.sub":   { en:"Photo of the tyre — AI detects wear pattern, front-back balance, alignment, pressure — all from one photo.", hi:"Tyre की photo से wear pattern पकड़ेगी Chitti। Front-back balance, alignment, pressure — सब एक photo से।", bn:"টায়ারের ছবি থেকে wear pattern, ব্যালেন্স, অ্যালাইনমেন্ট, প্রেশার — সব এক ছবিতে।", ta:"டயர் புகைப்படத்தில் இருந்து wear pattern, balance, alignment, pressure — அனைத்தும் ஒரே படத்தில்.", te:"టైర్ ఫోటో నుండి wear pattern, బ్యాలెన్స్, అలైన్‌మెంట్, ప్రెషర్ — అన్నీ ఒక ఫోటోలో.", mr:"टायरच्या फोटोवरून wear pattern, बॅलन्स, अलाइनमेंट, प्रेशर — सर्व एका फोटोत.", gu:"ટાયરના ફોટોમાંથી wear pattern, બેલેન્સ, અલાઈન્મેન્ટ, પ્રેશર — બધું એક ફોટોમાં.", kn:"ಟೈರ್ ಫೋಟೋದಿಂದ wear pattern, ಬ್ಯಾಲೆನ್ಸ್, ಅಲೈನ್‌ಮೆಂಟ್, ಪ್ರೆಶರ್ — ಎಲ್ಲವೂ ಒಂದು ಫೋಟೋದಲ್ಲಿ.", ml:"ടയറിന്റെ ഫോട്ടോയിൽ നിന്ന് wear pattern, ബാലൻസ്, അലൈൻമെന്റ്, പ്രെഷർ — എല്ലാം ഒറ്റ ഫോട്ടോയിൽ." },
  "ls.mech_reviews.title": { en:"🤝 Community Mechanic Reviews", hi:"🤝 कम्युनिटी मेकैनिक रिव्यू", bn:"🤝 কমিউনিটি মেকানিক রিভিউ", ta:"🤝 சமூக மெக்கானிக் மதிப்புரை", te:"🤝 కమ్యూనిటీ మెకానిక్ సమీక్షలు", mr:"🤝 कम्युनिटी मेकॅनिक रिव्ह्यू", gu:"🤝 સમુદાય મિકેનિક રિવ્યુ", kn:"🤝 ಸಮುದಾಯ ಮೆಕಾನಿಕ್ ಪರಿಶೀಲನೆ", ml:"🤝 കമ്മ്യൂണിറ്റി മെക്കാനിക് റിവ്യൂ" },
  "ls.mech_reviews.sub":   { en:"Trusted mechanics in your area — 100+ riders have confirmed their work. Don't get fooled.", hi:"आपके area के भरोसेमंद mechanics — 100+ riders ने उनका काम confirm किया है। धोखा मत खाओ।", bn:"আপনার এলাকার বিশ্বস্ত মেকানিক — ১০০+ চালকের কনফার্ম। ঠকে যাবেন না।", ta:"உங்கள் பகுதியில் நம்பகமான மெக்கானிக்குகள் — 100+ ஓட்டுநர்கள் உறுதிப்படுத்தியுள்ளனர். ஏமாறாதீர்கள்.", te:"మీ ప్రాంతంలో నమ్మదగిన మెకానిక్‌లు — 100+ రైడర్ల ధృవీకరణ. మోసపోకండి.", mr:"तुमच्या भागातील विश्वासू मेकॅनिक — 100+ रायडर्सने पुष्टी केली. फसवू नका.", gu:"તમારા વિસ્તારના વિશ્વસનીય મિકેનિક — 100+ રાઈડર્સે ખાતરી કરી. છેતરાશો નહીં.", kn:"ನಿಮ್ಮ ಪ್ರದೇಶದ ನಂಬಿಗಸ್ತ ಮೆಕಾನಿಕ್‌ಗಳು — 100+ ರೈಡರ್‌ಗಳಿಂದ ದೃಢೀಕರಣ. ಮೋಸಹೋಗದಿರಿ.", ml:"നിങ്ങളുടെ പ്രദേശത്തെ വിശ്വസനീയ മെക്കാനിക്കുകൾ — 100+ റൈഡർമാർ സ്ഥിരീകരിച്ചു." },

  // 4W LS items
  "ls.obd2_live.title": { en:"🔌 OBD2 Live Diagnosis", hi:"🔌 OBD2 लाइव डायग्नोसिस", bn:"🔌 OBD2 লাইভ নির্ণয়", ta:"🔌 OBD2 நேரடி கண்டறிதல்", te:"🔌 OBD2 లైవ్ నిర్ధారణ", mr:"🔌 OBD2 लाइव्ह निदान", gu:"🔌 OBD2 લાઈવ નિદાન", kn:"🔌 OBD2 ಲೈವ್ ರೋಗನಿರ್ಣಯ", ml:"🔌 OBD2 ലൈവ് നിർണ്ണയം" },
  "ls.obd2_live.sub":   { en:"Bluetooth device reads engine codes directly. Chitti explains in plain language — what's wrong, what it'll cost.", hi:"Bluetooth device से सीधे engine error code पढ़ेगी Chitti। Plain Hindi में समझाएगी — कहाँ क्या गड़बड़ है, कितना खर्चा।", bn:"Bluetooth সরাসরি কোড পড়বে। Chitti সহজ ভাষায় বলবে — কী সমস্যা, কত খরচ।", ta:"Bluetooth நேரடியாக கோடு படிக்கும். Chitti எளிய மொழியில் சொல்லும்.", te:"Bluetooth నేరుగా కోడ్ చదువుతుంది. Chitti సాదా భాషలో చెబుతుంది.", mr:"Bluetooth थेट कोड वाचेल. Chitti सोप्या भाषेत सांगेल.", gu:"Bluetooth સીધો કોડ વાંચશે. Chitti સરળ ભાષામાં કહેશે.", kn:"Bluetooth ನೇರವಾಗಿ ಕೋಡ್ ಓದುತ್ತದೆ. Chitti ಸುಲಭ ಭಾಷೆಯಲ್ಲಿ ಹೇಳುತ್ತದೆ.", ml:"Bluetooth നേരിട്ട് കോഡ് വായിക്കും. Chitti ലളിതഭാഷയിൽ പറയും." },
  "ls.fair_price.title": { en:"💰 Fair Price Guarantee", hi:"💰 सही दाम गारंटी", bn:"💰 ন্যায্য দামের গ্যারান্টি", ta:"💰 சரியான விலை உத்தரவாதம்", te:"💰 న్యాయమైన ధర హామీ", mr:"💰 योग्य किंमत हमी", gu:"💰 વાજબી ભાવ ગેરંટી", kn:"💰 ನ್ಯಾಯಯುತ ಬೆಲೆ ಗ್ಯಾರಂಟಿ", ml:"💰 ന്യായവില ഉറപ്പ്" },
  "ls.fair_price.sub":   { en:"Right prices in your city — Chitti compares with 100+ workshops in your pincode. Mechanic cannot cheat.", hi:"आपके शहर में सही दाम — Chitti आपके pincode के 100+ workshops से compare करेगी। Mechanic धोखा नहीं दे सकता।", bn:"আপনার শহরে সঠিক দাম — Chitti পিনকোডের ১০০+ ওয়ার্কশপের সাথে মেলায়।", ta:"உங்கள் நகரத்தில் சரியான விலை — பின்கோடின் 100+ பட்டறைகளுடன் ஒப்பீடு.", te:"మీ నగరంలో సరైన ధర — Chitti పిన్‌కోడ్ 100+ వర్క్‌షాప్‌లతో పోలుస్తుంది.", mr:"तुमच्या शहरात योग्य किंमत — Chitti पिनकोडच्या 100+ वर्कशॉपशी तुलना.", gu:"તમારા શહેરમાં યોગ્ય ભાવ — Chitti પિનકોડના 100+ વર્કશોપ સાથે સરખામણી.", kn:"ನಿಮ್ಮ ನಗರದಲ್ಲಿ ಸರಿಯಾದ ಬೆಲೆ — Chitti ಪಿನ್‌ಕೋಡ್ 100+ ವರ್ಕ್‌ಶಾಪ್‌ಗಳೊಂದಿಗೆ ಹೋಲಿಸುತ್ತದೆ.", ml:"നിങ്ങളുടെ നഗരത്തിൽ ശരിയായ വില — Chitti പിൻകോഡിലെ 100+ വർക്ക്‌ഷോപ്പുകളുമായി താരതമ്യം." },
  "ls.confirmed_fix.title": { en:"✅ Confirmed Fix Reports", hi:"✅ कन्फर्म्ड फिक्स रिपोर्ट्स", bn:"✅ নিশ্চিত মেরামত রিপোর্ট", ta:"✅ உறுதிப்படுத்தப்பட்ட பழுதுபார்ப்பு அறிக்கைகள்", te:"✅ నిర్ధారిత మరమ్మతు నివేదికలు", mr:"✅ कन्फर्म्ड फिक्स अहवाल", gu:"✅ કન્ફર્મ્ડ ફિક્સ રિપોર્ટ", kn:"✅ ದೃಢೀಕೃತ ರಿಪೇರಿ ವರದಿಗಳು", ml:"✅ സ്ഥിരീകരിച്ച റിപ്പയർ റിപ്പോർട്ടുകൾ" },
  "ls.confirmed_fix.sub":   { en:"1000+ mechanics have confirmed this fix. Social proof like BlueDriver — you know what actually worked.", hi:"1000+ mechanics ने यह fix confirm किया है। BlueDriver जैसा social proof — आपको पता रहेगा क्या काम real में चला।", bn:"১০০০+ মেকানিক এই ঠিকানা কনফার্ম করেছেন।", ta:"1000+ மெக்கானிக்குகள் இந்த சரிசெய்தலை உறுதி செய்துள்ளனர்.", te:"1000+ మెకానిక్‌లు ఈ ఫిక్స్‌ను ధృవీకరించారు.", mr:"1000+ मेकॅनिकनी हा फिक्स पुष्टी केला आहे.", gu:"1000+ મિકેનિકોએ આ ફિક્સની પુષ્ટિ કરી છે.", kn:"1000+ ಮೆಕಾನಿಕ್‌ಗಳು ಈ ರಿಪೇರಿಯನ್ನು ದೃಢೀಕರಿಸಿದ್ದಾರೆ.", ml:"1000+ മെക്കാനിക്കുകൾ ഈ റിപ്പയർ സ്ഥിരീകരിച്ചു." },
  "ls.drive_score.title": { en:"📊 Drive Score", hi:"📊 ड्राइव स्कोर", bn:"📊 ড্রাইভ স্কোর", ta:"📊 ஓட்டுநர் மதிப்பெண்", te:"📊 డ్రైవ్ స్కోర్", mr:"📊 ड्राइव्ह स्कोअर", gu:"📊 ડ્રાઈવ સ્કોર", kn:"📊 ಡ್ರೈವ್ ಸ್ಕೋರ್", ml:"📊 ഡ്രൈവ് സ്കോർ" },
  "ls.drive_score.sub":   { en:"How much fuel your driving wastes — daily, weekly, monthly. CARFAX-style logbook tuned for Indian road conditions.", hi:"आपकी driving से fuel कितना waste — daily, weekly, monthly। CARFAX जैसा logbook + India ke road conditions par tuned।", bn:"আপনার ড্রাইভিং কতটা ফুয়েল নষ্ট করে — দৈনিক, সাপ্তাহিক, মাসিক।", ta:"உங்கள் ஓட்டுநர் முறை எவ்வளவு எரிபொருளை வீணாக்குகிறது.", te:"మీ డ్రైవింగ్ ఎంత ఇంధనం వృథా చేస్తోంది.", mr:"तुमची ड्रायव्हिंग किती इंधन वाया घालवते.", gu:"તમારી ડ્રાઇવિંગ કેટલું ઈંધણ બગાડે છે.", kn:"ನಿಮ್ಮ ಡ್ರೈವಿಂಗ್ ಎಷ್ಟು ಇಂಧನ ವ್ಯರ್ಥ ಮಾಡುತ್ತದೆ.", ml:"നിങ്ങളുടെ ഡ്രൈവിംഗ് എത്ര ഇന്ധനം പാഴാക്കുന്നു." },
};

// speakText + bubble keys — 2W
const MB_SPEAK = {
  "mb.speak.min_fields": { en:"Please give at least the make, model and reg number.", hi:"कम से कम बनाने वाली कंपनी, मॉडल और reg number डालिए।", bn:"অন্তত মেক, মডেল এবং রেগ নম্বর দিন।", ta:"குறைந்தது make, model, reg number கொடுக்கவும்.", te:"కనీసం మేక్, మోడల్, రెగ్ నంబర్ ఇవ్వండి.", mr:"किमान मेक, मॉडेल आणि रेग नंबर द्या.", gu:"ઓછામાં ઓછું મેક, મોડેલ અને રેગ નંબર આપો.", kn:"ಕನಿಷ್ಠ ಮೇಕ್, ಮಾಡೆಲ್, ರೆಗ್ ನಂಬರ್ ನೀಡಿ.", ml:"കുറഞ്ഞത് make, model, reg number നൽകൂ." },
  "mb.speak.saved":      { en:"Bike saved.", hi:"बाइक सेव हो गई।", bn:"বাইক সেভ হয়েছে।", ta:"பைக் சேமிக்கப்பட்டது.", te:"బైక్ సేవ్ అయింది.", mr:"बाईक सेव्ह झाली.", gu:"બાઈક સેવ થઈ.", kn:"ಬೈಕ್ ಉಳಿಸಲಾಗಿದೆ.", ml:"ബൈക്ക് സേവ് ചെയ്തു." },
  "mb.speak.demo":       { en:"Demo: Hero Splendor UP32 AB 1234, 2018, red.", hi:"डेमो भरो: Hero Splendor UP32 AB 1234, 2018, लाल.", bn:"ডেমো: Hero Splendor UP32 AB 1234, 2018, লাল.", ta:"டெமோ: Hero Splendor UP32 AB 1234, 2018, சிவப்பு.", te:"డెమో: Hero Splendor UP32 AB 1234, 2018, ఎరుపు.", mr:"डेमो: Hero Splendor UP32 AB 1234, 2018, लाल.", gu:"ડેમો: Hero Splendor UP32 AB 1234, 2018, લાલ.", kn:"ಡೆಮೋ: Hero Splendor UP32 AB 1234, 2018, ಕೆಂಪು.", ml:"ഡെമോ: Hero Splendor UP32 AB 1234, 2018, ചുവപ്പ്." },
  "mb.speak.no_voice":   { en:"Voice not available in this browser. Please type instead.", hi:"इस browser में voice नहीं है। टाइप करके भेजें।", bn:"এই ব্রাউজারে ভয়েস নেই। টাইপ করে পাঠান।", ta:"இந்த browser-இல் voice இல்லை. தட்டச்சு செய்க.", te:"ఈ browser లో voice లేదు. టైప్ చేయండి.", mr:"या browser मध्ये voice नाही. लिहा.", gu:"આ browser માં voice નથી. લખીને મોકલો.", kn:"ಈ browser ನಲ್ಲಿ voice ಇಲ್ಲ. ಟೈಪ್ ಮಾಡಿ.", ml:"ഈ browser-ൽ voice ഇല്ല. ടൈപ്പ് ചെയ്യൂ." },
  "mb.speak.voice_failed":{ en:"Voice failed to start. Please type instead.", hi:"Voice शुरू नहीं हो पायी। टाइप करके भेजें।", bn:"ভয়েস শুরু হলো না। টাইপ করুন।", ta:"Voice தொடங்க முடியவில்லை. தட்டச்சு செய்க.", te:"Voice ప్రారంభం కాలేదు. టైప్ చేయండి.", mr:"Voice सुरू झाला नाही. लिहा.", gu:"Voice શરૂ થયું નહીં. લખો.", kn:"Voice ಪ್ರಾರಂಭವಾಗಲಿಲ್ಲ. ಟೈಪ್ ಮಾಡಿ.", ml:"Voice ആരംഭിച്ചില്ല. ടൈപ്പ് ചെയ്യൂ." },
  "mb.speak.tell_problem":{ en:"Tell Chitti what the problem is.", hi:"Chitti को बताइए क्या तकलीफ़ है।", bn:"Chitti কে বলুন কী সমস্যা।", ta:"Chitti யிடம் சொல்லுங்கள் என்ன பிரச்சினை.", te:"Chitti కి సమస్య చెప్పండి.", mr:"Chitti ला सांगा काय अडचण.", gu:"Chitti ને કહો શું તકલીફ.", kn:"Chitti ಗೆ ಸಮಸ್ಯೆ ಹೇಳಿ.", ml:"Chitti യോട് പ്രശ്നം പറയൂ." },
  "mb.speak.fb_sent":    { en:"Feedback sent, thank you.", hi:"Feedback भेज दिया, धन्यवाद.", bn:"ফিডব্যাক পাঠানো হয়েছে, ধন্যবাদ.", ta:"Feedback அனுப்பப்பட்டது, நன்றி.", te:"Feedback పంపబడింది, ధన్యవాదాలు.", mr:"फीडबॅक पाठवला, धन्यवाद.", gu:"ફીડબેક મોકલ્યો, આભાર.", kn:"Feedback ಕಳುಹಿಸಲಾಗಿದೆ, ಧನ್ಯವಾದ.", ml:"ഫീഡ്‌ബാക്ക് അയച്ചു, നന്ദി." },
  "mb.speak.obd_need_code":{ en:"Please enter the error code first.", hi:"पहले error code लिखिए।", bn:"আগে error code লিখুন।", ta:"முதலில் error code எழுதவும்.", te:"మొదట error code రాయండి.", mr:"आधी error code लिहा.", gu:"પહેલા error code લખો.", kn:"ಮೊದಲು error code ಬರೆಯಿರಿ.", ml:"ആദ്യം error code എഴുതൂ." },
  "mb.speak.new_slot":   { en:"New bike slot. Fill the form and save.", hi:"नई बाइक slot. Form bhar ke save karein.", bn:"নতুন বাইক স্লট। ফর্ম পূরণ করে সেভ করুন।", ta:"புதிய பைக் இடம். படிவம் நிரப்பி சேமி.", te:"కొత్త బైక్ స్లాట్. ఫారం పూరించి సేవ్ చేయండి.", mr:"नवीन बाईक स्लॉट. फॉर्म भरून सेव्ह करा.", gu:"નવી બાઈક સ્લોટ. ફોર્મ ભરી સેવ કરો.", kn:"ಹೊಸ ಬೈಕ್ ಸ್ಲಾಟ್. ಫಾರ್ಮ್ ಭರ್ತಿ ಮಾಡಿ ಸೇವ್ ಮಾಡಿ.", ml:"പുതിയ ബൈക്ക് സ്ലോട്ട്. ഫോം പൂരിപ്പിച്ച് സേവ് ചെയ്യൂ." },
  "mb.speak.log_what":   { en:"Please write what work was done.", hi:"क्या काम हुआ यह लिखिए।", bn:"কী কাজ হলো লিখুন।", ta:"என்ன வேலை செய்தீர் எழுதவும்.", te:"ఏ పని జరిగింది రాయండి.", mr:"काय काम झालं लिहा.", gu:"શું કામ થયું લખો.", kn:"ಏನು ಕೆಲಸ ಆಯಿತು ಬರೆಯಿರಿ.", ml:"എന്ത് ജോലി ചെയ്തു എഴുതൂ." },
  "mb.speak.log_saved":  { en:"Service entry saved. Total entries:", hi:"Service entry सेव हो गयी. कुल entries:", bn:"সার্ভিস সেভ হয়েছে. মোট:", ta:"சர்வீஸ் சேமிக்கப்பட்டது. மொத்தம்:", te:"సర్వీస్ సేవ్ అయింది. మొత్తం:", mr:"सर्व्हिस सेव्ह झाली. एकूण:", gu:"સર્વિસ સેવ થઈ. કુલ:", kn:"ಸರ್ವೀಸ್ ಉಳಿಸಲಾಗಿದೆ. ಒಟ್ಟು:", ml:"സർവീസ് സേവ് ചെയ്തു. ആകെ:" },
  "mb.speak.log_empty":  { en:"No service entries yet.", hi:"अभी कोई service entry नहीं।", bn:"এখনো কোনো সার্ভিস নেই।", ta:"இன்னும் சர்வீஸ் இல்லை.", te:"ఇంకా సర్వీస్ లేదు.", mr:"अजून सर्व्हिस नाही.", gu:"હજુ સર્વિસ નથી.", kn:"ಇನ್ನೂ ಸರ್ವೀಸ್ ಇಲ್ಲ.", ml:"ഇതുവരെ സർവീസ് ഇല്ല." },
  "mb.speak.log_total":  { en:"Total service entries:", hi:"कुल service entries:", bn:"মোট সার্ভিস:", ta:"மொத்த சர்வீஸ்:", te:"మొత్తం సర్వీస్:", mr:"एकूण सर्व्हिस:", gu:"કુલ સર્વિસ:", kn:"ಒಟ್ಟು ಸರ್ವೀಸ್:", ml:"ആകെ സർവീസ്:" },
  "mb.speak.rupiye_kharch":{ en:"rupees spent.", hi:"रुपये खर्च।", bn:"টাকা খরচ।", ta:"ரூபாய் செலவு.", te:"రూపాయలు ఖర్చు.", mr:"रुपये खर्च.", gu:"રૂપિયા ખર્ચ.", kn:"ರೂಪಾಯಿ ಖರ್ಚು.", ml:"രൂപ ചെലവ്." },
  "mb.speak.demo_added": { en:"Demo entry added.", hi:"Demo entry add ho gayi.", bn:"ডেমো এন্ট্রি যোগ হলো।", ta:"டெமோ சேர்க்கப்பட்டது.", te:"డెమో ఎంట్రీ జోడించబడింది.", mr:"डेमो एंट्री जोडली.", gu:"ડેમો ઉમેરાઈ.", kn:"ಡೆಮೋ ಎಂಟ್ರಿ ಸೇರಿಸಲಾಗಿದೆ.", ml:"ഡെമോ എൻട്രി ചേർത്തു." },
  "mb.speak.sos":        { en:"Emergency. Chitti is calling family. NOT police.", hi:"Emergency. Chitti family ko call kar rahi hai. 112 ko NAHI.", bn:"জরুরী। Chitti পরিবারকে কল করছে। পুলিশকে নয়।", ta:"அவசரம். Chitti குடும்பத்தை அழைக்கிறது. காவல் அல்ல.", te:"అత్యవసరం. Chitti కుటుంబాన్ని పిలుస్తోంది. పోలీసు కాదు.", mr:"आणीबाणी. Chitti कुटुंबाला कॉल करत आहे.", gu:"કટોકટી. Chitti પરિવારને કૉલ કરી રહી છે.", kn:"ತುರ್ತು. Chitti ಕುಟುಂಬವನ್ನು ಕರೆಯುತ್ತಿದೆ.", ml:"അടിയന്തരം. Chitti കുടുംബത്തെ വിളിക്കുന്നു." },
  "mb.speak.trip_start": { en:"Pre-trip check started. Tick each item.", hi:"Pre-trip check शुरू. हर item tick करें.", bn:"ট্রিপ-পূর্ব চেক শুরু. প্রতিটি টিক দিন.", ta:"பயணம் முன் சோதனை. ஒவ்வொன்றும் டிக்.", te:"ట్రిప్ ముందు చెక్. ప్రతిదాన్ని టిక్.", mr:"ट्रिप-पूर्व तपासणी. प्रत्येक टिक.", gu:"ટ્રિપ-પૂર્વ ચેક. દરેક ટિક.", kn:"ಪ್ರವಾಸ ಚೆಕ್. ಪ್ರತಿಯೊಂದನ್ನು ಟಿಕ್.", ml:"യാത്രയ്ക്കു മുമ്പുള്ള പരിശോധന." },
  "mb.speak.trip_done":  { en:"All checked. Bike ready. Safe ride.", hi:"सब tick। Bike ready है। Safe ride।", bn:"সব টিক। বাইক প্রস্তুত। নিরাপদ যাত্রা।", ta:"எல்லாம் சரி. பைக் தயார். பாதுகாப்பான பயணம்.", te:"అన్నీ టిక్. బైక్ సిద్ధం. సురక్షిత ప్రయాణం.", mr:"सर्व टिक. बाईक तयार. सुरक्षित प्रवास.", gu:"બધું ટિક. બાઈક તૈયાર. સુરક્ષિત રાઈડ.", kn:"ಎಲ್ಲಾ ಟಿಕ್. ಬೈಕ್ ಸಿದ್ಧ. ಸುರಕ್ಷಿತ ರೈಡ್.", ml:"എല്ലാം ടിക്ക്. ബൈക്ക് റെഡി. സുരക്ഷിത യാത്ര." },
  "mb.speak.sound_need_desc":{ en:"Please describe the sound.", hi:"आवाज़ का description लिखिए.", bn:"শব্দের বর্ণনা লিখুন.", ta:"ஒலியின் விவரம் எழுதவும்.", te:"శబ్దం వివరణ రాయండి.", mr:"आवाजाचे वर्णन लिहा.", gu:"અવાજનું વર્ણન લખો.", kn:"ಶಬ್ದದ ವಿವರಣೆ ಬರೆಯಿರಿ.", ml:"ശബ്ദത്തിന്റെ വിവരണം എഴുതൂ." },
  "mb.speak.fp_need_input":{ en:"Tell me what work and how much quote.", hi:"क्या काम और कितने का quote बताइए.", bn:"কী কাজ এবং কত কোট বলুন.", ta:"என்ன வேலை, எவ்வளவு கோட் சொல்லுங்கள்.", te:"ఏ పని, ఎంత కోట్ చెప్పండి.", mr:"काय काम आणि किती quote सांगा.", gu:"શું કામ અને કેટલા ભાવ કહો.", kn:"ಯಾವ ಕೆಲಸ ಮತ್ತು ಎಷ್ಟು ಕೋಟ್ ಹೇಳಿ.", ml:"എന്ത് ജോലി, എത്ര വില പറയൂ." },
  "mb.speak.kyv_need_save":{ en:"Please save your bike first. Chitti cannot research without it.", hi:"पहले अपनी bike save करें. Chitti research नहीं कर सकती.", bn:"আগে আপনার বাইক সেভ করুন.", ta:"முதலில் உங்கள் பைக்கை சேமி.", te:"ముందు మీ బైక్ సేవ్ చేయండి.", mr:"आधी तुमची बाईक सेव्ह करा.", gu:"પહેલા તમારી બાઈક સેવ કરો.", kn:"ಮೊದಲು ನಿಮ್ಮ ಬೈಕ್ ಸೇವ್ ಮಾಡಿ.", ml:"ആദ്യം നിങ്ങളുടെ ബൈക്ക് സേവ് ചെയ്യൂ." },
  "mb.bubble.thinking":  { en:"Chitti is thinking…", hi:"Chitti सोच रही है…", bn:"Chitti ভাবছে…", ta:"Chitti யோசிக்கிறது…", te:"Chitti ఆలోచిస్తోంది…", mr:"Chitti विचार करत आहे…", gu:"Chitti વિચારી રહી છે…", kn:"Chitti ಯೋಚಿಸುತ್ತಿದೆ…", ml:"Chitti ചിന്തിക്കുന്നു…" },
  "mb.bubble.code_fail": { en:"Chitti could not get the code — try again.", hi:"Chitti से code अभी नहीं मिला — फिर try करें.", bn:"Chitti কোড পাচ্ছে না — আবার চেষ্টা.", ta:"Chitti க்கு கோடு வரவில்லை — மீண்டும் முயற்சி.", te:"Chitti కు కోడ్ రాలేదు — మళ్ళీ ప్రయత్నించండి.", mr:"Chitti ला कोड मिळाला नाही — पुन्हा.", gu:"Chitti કોડ મળ્યો નહીં — ફરી પ્રયાસ.", kn:"Chitti ಗೆ ಕೋಡ್ ಸಿಗಲಿಲ್ಲ — ಮತ್ತೆ.", ml:"Chitti-ക്ക് കോഡ് ലഭിച്ചില്ല — വീണ്ടും." },
  "mb.bubble.photo_fail":{ en:"Chitti couldn't understand the photo. Describe in writing.", hi:"Chitti photo से नहीं समझ पायी. Description लिखकर पूछें.", bn:"Chitti ছবি থেকে বোঝেনি. বর্ণনা লিখুন.", ta:"Chitti புகைப்படத்தை புரியவில்லை. விவரம் எழுதவும்.", te:"Chitti ఫోటో అర్థం కాలేదు. వివరణ రాయండి.", mr:"Chitti फोटो समजला नाही. वर्णन लिहा.", gu:"Chitti ફોટો સમજાયો નહીं. વર્ણન લખો.", kn:"Chitti ಫೋಟೋ ಅರ್ಥವಾಗಲಿಲ್ಲ. ವಿವರಣೆ ಬರೆಯಿರಿ.", ml:"Chitti-ക്ക് ഫോട്ടോ മനസ്സിലായില്ല. വിവരണം എഴുതൂ." },
  "mb.bubble.listening": { en:"Chitti is listening…", hi:"Chitti सुन रही है…", bn:"Chitti শুনছে…", ta:"Chitti கேட்கிறது…", te:"Chitti వింటోంది…", mr:"Chitti ऐकत आहे…", gu:"Chitti સાંભળી રહી છે…", kn:"Chitti ಕೇಳುತ್ತಿದೆ…", ml:"Chitti കേൾക്കുന്നു…" },
  "mb.bubble.sound_fail":{ en:"Chitti could not understand — try again.", hi:"Chitti समझ नहीं पायी — फिर try करें.", bn:"Chitti বুঝতে পারেনি — আবার চেষ্টা.", ta:"Chitti புரியவில்லை — மீண்டும்.", te:"Chitti అర్థం కాలేదు — మళ్ళీ.", mr:"Chitti ला समजले नाही — पुन्हा.", gu:"Chitti સમજાયું નહીં — ફરી.", kn:"Chitti ಅರ್ಥವಾಗಲಿಲ್ಲ — ಮತ್ತೆ.", ml:"Chitti-ക്ക് മനസ്സിലായില്ല — വീണ്ടും." },
  "mb.bubble.fp_fail":   { en:"Chitti could not understand.", hi:"Chitti समझ नहीं पायी।", bn:"Chitti বোঝেনি।", ta:"Chitti புரியவில்லை.", te:"Chitti అర్థం కాలేదు.", mr:"Chitti ला समजले नाही.", gu:"Chitti સમજાયું નહીं.", kn:"Chitti ಅರ್ಥವಾಗಲಿಲ್ಲ.", ml:"Chitti-ക്ക് മനസ്സിലായില്ല." },
  "err.network_short":   { en:"Network error.", hi:"Network error.", bn:"নেটওয়ার্ক সমস্যা.", ta:"நெட்வொர்க் பிழை.", te:"నెట్‌వర్క్ లోపం.", mr:"नेटवर्क त्रुटी.", gu:"નેટવર્ક ભૂલ.", kn:"ನೆಟ್‌ವರ್ಕ್ ದೋಷ.", ml:"നെറ്റ്‌വർക്ക് പിശക്." },
  "err.network_retry":   { en:"Network error. Try again.", hi:"Network error. फिर try करें.", bn:"নেটওয়ার্ক সমস্যা. আবার.", ta:"நெட்வொர்க் பிழை. மீண்டும்.", te:"నెట్‌వర్క్ లోపం. మళ్ళీ.", mr:"नेटवर्क त्रुटी. पुन्हा.", gu:"નેટવર્ક ભૂલ. ફરી.", kn:"ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ಮತ್ತೆ.", ml:"നെറ്റ്‌വർക്ക് പിശക്. വീണ്ടും." },
  "mb.bubble.seeing":    { en:"Chitti is looking…", hi:"Chitti देख रही है…", bn:"Chitti দেখছে…", ta:"Chitti பார்க்கிறது…", te:"Chitti చూస్తోంది…", mr:"Chitti बघत आहे…", gu:"Chitti જોઈ રહી છે…", kn:"Chitti ನೋಡುತ್ತಿದೆ…", ml:"Chitti നോക്കുന്നു…" },
  "mb.bubble.pretrip":   { en:"Chitti is doing the pre-trip check…", hi:"Chitti pre-trip check कर रही है…", bn:"Chitti ট্রিপ-পূর্ব চেক করছে…", ta:"Chitti பயணம் முன் சோதனை செய்கிறது…", te:"Chitti ట్రిప్ ముందు చెక్ చేస్తోంది…", mr:"Chitti ट्रिप-पूर्व तपासणी करत आहे…", gu:"Chitti ટ્રિપ-પૂર્વ ચેક કરી રહી છે…", kn:"Chitti ಪ್ರವಾಸ ಚೆಕ್ ಮಾಡುತ್ತಿದೆ…", ml:"Chitti യാത്രയ്ക്ക് മുമ്പ് പരിശോധിക്കുന്നു…" },
  "mb.bubble.searching": { en:"Chitti is searching…", hi:"Chitti ढूँढ रही है…", bn:"Chitti খুঁজছে…", ta:"Chitti தேடுகிறது…", te:"Chitti వెతుకుతోంది…", mr:"Chitti शोधत आहे…", gu:"Chitti શોધી રહી છે…", kn:"Chitti ಹುಡುಕುತ್ತಿದೆ…", ml:"Chitti തിരയുന്നു…" },
  "mb.bubble.what_to_do":{ en:"What to do?", hi:"क्या करें?", bn:"কী করবেন?", ta:"என்ன செய்ய வேண்டும்?", te:"ఏం చేయాలి?", mr:"काय करायचं?", gu:"શું કરવું?", kn:"ಏನು ಮಾಡಬೇಕು?", ml:"എന്ത് ചെയ്യണം?" },
  "mb.bubble.riding":    { en:"Riding", hi:"Riding", bn:"চালানো", ta:"ஓட்டுதல்", te:"నడుపు", mr:"राइडिंग", gu:"રાઇડિંગ", kn:"ರೈಡಿಂಗ್", ml:"റൈഡിംഗ്" },
  "mb.bubble.driving":   { en:"Driving", hi:"Driving", bn:"ড্রাইভিং", ta:"ஓட்டுதல்", te:"డ్రైవింగ్", mr:"ड्रायव्हिंग", gu:"ડ્રાઇવિંગ", kn:"ಡ್ರೈವಿಂಗ್", ml:"ഡ്രൈവിംഗ്" },
  "mb.trip.go":          { en:"GO — bike is ready for the trip.", hi:"GO — bike trip के लिए तैयार है।", bn:"GO — বাইক ট্রিপের জন্য প্রস্তুত।", ta:"GO — பைக் பயணத்திற்கு தயார்.", te:"GO — బైక్ ట్రిప్‌కు సిద్ధం.", mr:"GO — बाईक ट्रिपसाठी तयार.", gu:"GO — બાઈક ટ્રિપ માટે તૈયાર.", kn:"GO — ಬೈಕ್ ಪ್ರವಾಸಕ್ಕೆ ಸಿದ್ಧ.", ml:"GO — ബൈക്ക് യാത്രയ്ക്ക് തയ്യാർ." },
  "mb.trip.done_word":   { en:"done.", hi:"पूरा.", bn:"হয়েছে.", ta:"முடிந்தது.", te:"పూర్తయింది.", mr:"पूर्ण.", gu:"પૂર્ણ.", kn:"ಆಗಿದೆ.", ml:"പൂർത്തിയായി." },
  "mb.trip.baki":        { en:"remaining.", hi:"बाकी.", bn:"বাকি.", ta:"மீதம்.", te:"మిగిలాయి.", mr:"बाकी.", gu:"બાકી.", kn:"ಬಾಕಿ.", ml:"ബാക്കി." },
  "mb.fp.bargain_to":    { en:"Bargain to", hi:"मोलभाव करें", bn:"দরকষাকষি", ta:"பேரம் பேசு", te:"బేరం", mr:"घासाघीस", gu:"સોદો", kn:"ಚೌಕಾಸಿ", ml:"വിലപേശൽ" },
  "mb.fp.fair_range":    { en:"Fair range:", hi:"सही range:", bn:"ন্যায্য পরিসীমা:", ta:"சரியான வரம்பு:", te:"న్యాయమైన శ్రేణి:", mr:"योग्य श्रेणी:", gu:"વાજબી શ્રેણી:", kn:"ನ್ಯಾಯ ಶ್ರೇಣಿ:", ml:"ന്യായ ശ്രേണി:" },
  "mb.fp.fair_price":    { en:"Fair price:", hi:"सही दाम:", bn:"ন্যায্য দাম:", ta:"சரியான விலை:", te:"న్యాయమైన ధర:", mr:"योग्य किंमत:", gu:"વાજબી ભાવ:", kn:"ನ್ಯಾಯ ಬೆಲೆ:", ml:"ന്യായവില:" },
  "mb.fm.your_area":     { en:"your area", hi:"आपका क्षेत्र", bn:"আপনার এলাকা", ta:"உங்கள் பகுதி", te:"మీ ప్రాంతం", mr:"तुमचे क्षेत्र", gu:"તમારો વિસ્તાર", kn:"ನಿಮ್ಮ ಪ್ರದೇಶ", ml:"നിങ്ങളുടെ പ്രദേശം" },
  "mb.safe.ride_ok":     { en:"✅ Safe to ride to nearest mechanic", hi:"✅ नज़दीकी mechanic तक ride करना safe", bn:"✅ নিকটতম মেকানিক পর্যন্ত নিরাপদ", ta:"✅ அருகிலுள்ள மெக்கானிக் வரை பாதுகாப்பு", te:"✅ సమీప మెకానిక్ వరకు సురక్షితం", mr:"✅ जवळच्या मेकॅनिकपर्यंत सुरक्षित", gu:"✅ નજીકના મિકેનિક સુધી સુરક્ષિત", kn:"✅ ಹತ್ತಿರದ ಮೆಕಾನಿಕ್ ತನಕ ಸುರಕ್ಷಿತ", ml:"✅ അടുത്ത മെക്കാനിക് വരെ സുരക്ഷിതം" },
  "mb.safe.ride_no":     { en:"❌ Do not ride — call for help", hi:"❌ Ride मत करो — मदद के लिए call करो", bn:"❌ চালাবেন না — সাহায্যের জন্য কল", ta:"❌ ஓட்டாதீர் — உதவிக்கு அழைக்கவும்", te:"❌ నడుపకండి — సహాయం కోసం కాల్", mr:"❌ चालवू नका — मदतीसाठी कॉल", gu:"❌ ચલાવો નહીં — મદદ માટે કૉલ", kn:"❌ ಚಲಾಯಿಸಬೇಡಿ — ಸಹಾಯಕ್ಕಾಗಿ ಕರೆ", ml:"❌ ഓടിക്കരുത് — സഹായത്തിന് വിളിക്കൂ" },
  "mb.safe.ride_ok_short":{ en:"✅ Safe to ride to mechanic", hi:"✅ Mechanic तक safe", bn:"✅ মেকানিক পর্যন্ত নিরাপদ", ta:"✅ மெக்கானிக் வரை பாதுகாப்பு", te:"✅ మెకానిక్ వరకు సురక్షితం", mr:"✅ मेकॅनिकपर्यंत सुरक्षित", gu:"✅ મિકેનિક સુધી સુરક્ષિત", kn:"✅ ಮೆಕಾನಿಕ್ ತನಕ ಸುರಕ್ಷಿತ", ml:"✅ മെക്കാനിക് വരെ സുരക്ഷിതം" },
  "mb.verdict.diy":      { en:"🔧 DIY", hi:"🔧 खुद ठीक करें", bn:"🔧 নিজে করুন", ta:"🔧 நீங்களே சரிசெய்", te:"🔧 మీరే చేయండి", mr:"🔧 स्वतः ठीक करा", gu:"🔧 જાતે કરો", kn:"🔧 ಸ್ವತಃ ಮಾಡಿ", ml:"🔧 സ്വയം ചെയ്യൂ" },
  "mb.verdict.mechanic": { en:"🏪 Mechanic", hi:"🏪 मेकैनिक के पास", bn:"🏪 মেকানিকের কাছে", ta:"🏪 மெக்கானிக் வேண்டும்", te:"🏪 మెకానిక్", mr:"🏪 मेकॅनिक", gu:"🏪 મિકેનિક", kn:"🏪 ಮೆಕಾನಿಕ್", ml:"🏪 മെക്കാനിക്" },
  "mb.photo.saw":        { en:"Photo seen", hi:"Photo देखी", bn:"ছবি দেখা হয়েছে", ta:"புகைப்படம் பார்த்தேன்", te:"ఫోటో చూశాను", mr:"फोटो पाहिला", gu:"ફોટો જોયો", kn:"ಫೋಟೋ ನೋಡಿದೆ", ml:"ഫോട്ടോ കണ്ടു" },
  "mb.sound.recognised": { en:"Sound identified", hi:"आवाज़ पहचानी", bn:"শব্দ চেনা হয়েছে", ta:"ஒலி அடையாளம்", te:"శబ్దం గుర్తించబడింది", mr:"आवाज ओळखला", gu:"અવાજ ઓળખ્યો", kn:"ಶಬ್ದ ಗುರುತಿಸಲಾಯಿತು", ml:"ശബ്ദം തിരിച്ചറിഞ്ഞു" },
  "mb.sound.recording":  { en:"🔴 Recording… (10 sec)", hi:"🔴 Recording… (10 sec)", bn:"🔴 রেকর্ডিং… (১০ সেকেন্ড)", ta:"🔴 பதிவு… (10 விநாடி)", te:"🔴 రికార్డ్… (10 సెకన్లు)", mr:"🔴 रेकॉर्ड… (१० सेकंद)", gu:"🔴 રેકોર્ડ… (૧૦ સેકન્ડ)", kn:"🔴 ರೆಕಾರ್ಡ್… (10 ಸೆಕೆಂಡ್)", ml:"🔴 റെക്കോർഡ്… (10 സെക്കൻഡ്)" },
  "mb.sound.recorded":   { en:"✅ Recorded — describe the sound", hi:"✅ Recorded — आवाज़ describe करें", bn:"✅ রেকর্ডেড — শব্দ বর্ণনা", ta:"✅ பதிவான — ஒலியை விவரி", te:"✅ రికార్డ్ — శబ్దం వివరించండి", mr:"✅ रेकॉर्ड — आवाज वर्णन", gu:"✅ રેકોર્ડ — અવાજ વર્ણન", kn:"✅ ರೆಕಾರ್ಡ್ — ಶಬ್ದ ವಿವರಿಸಿ", ml:"✅ റെക്കോർഡ് — ശബ്ദം വിവരിക്കൂ" },
  "mb.sound.mic_denied": { en:"❌ Mic permission denied. Check browser permissions.", hi:"❌ Mic access नहीं मिला. Browser permissions check करें.", bn:"❌ মাইক্রোফোন অনুমতি নেই.", ta:"❌ Mic அனுமதி இல்லை.", te:"❌ Mic అనుమతి లేదు.", mr:"❌ Mic परवानगी नाही.", gu:"❌ Mic પરમિશન નથી.", kn:"❌ Mic ಅನುಮತಿ ಇಲ್ಲ.", ml:"❌ Mic അനുമതി ഇല്ല." },
  "mb.sound.again":      { en:"🔴 Record again", hi:"🔴 फिर record", bn:"🔴 আবার রেকর্ড", ta:"🔴 மீண்டும் பதிவு", te:"🔴 మళ్ళీ రికార్డ్", mr:"🔴 पुन्हा रेकॉर्ड", gu:"🔴 ફરી રેકોર્ડ", kn:"🔴 ಮತ್ತೆ ರೆಕಾರ್ಡ್", ml:"🔴 വീണ്ടും റെക്കോർഡ്" },
  "mb.sound.stop":       { en:"⏹ Stop", hi:"⏹ रोको", bn:"⏹ বন্ধ", ta:"⏹ நிறுத்து", te:"⏹ ఆపండి", mr:"⏹ थांबवा", gu:"⏹ રોકો", kn:"⏹ ನಿಲ್ಲಿಸಿ", ml:"⏹ നിർത്തൂ" },
  "mb.soon.voted":       { en:"Vote noted — Chitti is sharing the news.", hi:"Vote मिल गया — Chitti आगे पहुँचा रही है.", bn:"ভোট পেয়েছি.", ta:"வாக்கு பெறப்பட்டது.", te:"ఓటు నమోదైంది.", mr:"मत मिळाला.", gu:"વોટ મળ્યો.", kn:"ಮತ ಸ್ವೀಕರಿಸಿದೆ.", ml:"വോട്ട് ലഭിച്ചു." },
  "mb.soon.nope":        { en:"OK — we won't build this.", hi:"ठीक है — यह नहीं बनाएंगे.", bn:"ঠিক আছে — এটা করব না.", ta:"சரி — இதை செய்யமாட்டோம்.", te:"సరే — దీన్ని చేయము.", mr:"ठीक आहे.", gu:"ઠીક છે.", kn:"ಸರಿ.", ml:"ശരി." },
};

// 4W mirrors of speak/bubble keys
const MC_SPEAK = {};
for (const [k, v] of Object.entries(MB_SPEAK)) {
  MC_SPEAK[k.replace(/^mb\./, 'mc.')] = v;
}
// Tweak car-specific phrasing
MC_SPEAK['mc.speak.saved'] = { en:"Car saved.", hi:"गाड़ी सेव हो गई।", bn:"গাড়ি সেভ হয়েছে।", ta:"கார் சேமிக்கப்பட்டது.", te:"కారు సేవ్ అయింది.", mr:"गाडी सेव्ह झाली.", gu:"કાર સેવ થઈ.", kn:"ಕಾರು ಉಳಿಸಲಾಗಿದೆ.", ml:"കാർ സേവ് ചെയ്തു." };
MC_SPEAK['mc.speak.demo']  = { en:"Demo: Maruti Swift VXi DL3 CAB 5678, 2020, white.", hi:"डेमो: Maruti Swift VXi DL3 CAB 5678, 2020, सफ़ेद.", bn:"ডেমো: Maruti Swift VXi DL3 CAB 5678, 2020, সাদা.", ta:"டெமோ: Maruti Swift VXi DL3 CAB 5678, 2020, வெள்ளை.", te:"డెమో: Maruti Swift VXi DL3 CAB 5678, 2020, తెలుపు.", mr:"डेमो: Maruti Swift VXi DL3 CAB 5678, 2020, पांढरी.", gu:"ડેમો: Maruti Swift VXi DL3 CAB 5678, 2020, સફેદ.", kn:"ಡೆಮೋ: Maruti Swift VXi DL3 CAB 5678, 2020, ಬಿಳಿ.", ml:"ഡെമോ: Maruti Swift VXi DL3 CAB 5678, 2020, വെള്ള." };
MC_SPEAK['mc.speak.new_slot'] = { en:"New car slot. Fill the form and save.", hi:"नई गाड़ी slot. Form भर के सेव करें.", bn:"নতুন গাড়ি স্লট.", ta:"புதிய கார் இடம்.", te:"కొత్త కారు స్లాట్.", mr:"नवीन गाडी स्लॉट.", gu:"નવી કાર સ્લોટ.", kn:"ಹೊಸ ಕಾರು ಸ್ಲಾಟ್.", ml:"പുതിയ കാർ സ്ലോട്ട്." };
MC_SPEAK['mc.speak.trip_start'] = { en:"Pre-drive check started. Tick each item.", hi:"Pre-drive check शुरू. हर item tick करें.", bn:"ড্রাইভ-পূর্ব চেক শুরু.", ta:"ஓட்டுவதற்கு முன் சோதனை.", te:"డ్రైవ్ ముందు చెక్.", mr:"ड्राइव्ह-पूर्व तपासणी.", gu:"ડ્રાઇવ-પૂર્વ ચેક.", kn:"ಡ್ರೈವ್ ಮುಂಚಿನ ಚೆಕ್.", ml:"ഡ്രൈവിന് മുമ്പുള്ള പരിശോധന." };
MC_SPEAK['mc.speak.trip_done']  = { en:"All checked. Car ready. Safe drive.", hi:"सब tick. गाड़ी ready है. Safe drive.", bn:"সব টিক. গাড়ি প্রস্তুত.", ta:"எல்லாம் சரி. கார் தயார்.", te:"అన్నీ టిక్. కారు సిద్ధం.", mr:"सर्व टिक. गाडी तयार.", gu:"બધું ટિક. કાર તૈયાર.", kn:"ಎಲ್ಲಾ ಟಿಕ್. ಕಾರು ಸಿದ್ಧ.", ml:"എല്ലാം ടിക്. കാർ റെഡി." };
MC_SPEAK['mc.speak.kyv_need_save'] = { en:"Please save your car first.", hi:"पहले अपनी गाड़ी save करें.", bn:"আগে গাড়ি সেভ করুন.", ta:"முதலில் காரை சேமி.", te:"ముందు కారు సేవ్ చేయండి.", mr:"आधी गाडी सेव्ह करा.", gu:"પહેલા કાર સેવ કરો.", kn:"ಮೊದಲು ಕಾರು ಸೇವ್ ಮಾಡಿ.", ml:"ആദ്യം കാർ സേവ് ചെയ്യൂ." };
MC_SPEAK['mc.trip.go'] = { en:"GO — car is ready for the trip.", hi:"GO — गाड़ी trip के लिए तैयार है।", bn:"GO — গাড়ি ট্রিপের জন্য প্রস্তুত।", ta:"GO — கார் பயணத்திற்கு தயார்.", te:"GO — కారు ట్రిప్‌కు సిద్ధం.", mr:"GO — गाडी ट्रिपसाठी तयार.", gu:"GO — કાર ટ્રિપ માટે તૈયાર.", kn:"GO — ಕಾರು ಪ್ರವಾಸಕ್ಕೆ ಸಿದ್ಧ.", ml:"GO — കാർ യാത്രയ്ക്ക് തയ്യാർ." };
MC_SPEAK['mc.safe.drive_ok'] = { en:"✅ Safe to drive to workshop", hi:"✅ Workshop तक drive करना safe", bn:"✅ ওয়ার্কশপ পর্যন্ত নিরাপদ", ta:"✅ பட்டறை வரை பாதுகாப்பு", te:"✅ వర్క్‌షాప్ వరకు సురక్షితం", mr:"✅ वर्कशॉपपर्यंत सुरक्षित", gu:"✅ વર્કશોપ સુધી સુરક્ષિત", kn:"✅ ವರ್ಕ್‌ಶಾಪ್‌ವರೆಗೆ ಸುರಕ್ಷಿತ", ml:"✅ വർക്ക്‌ഷോപ്പ് വരെ സുരക്ഷിതം" };
MC_SPEAK['mc.safe.drive_no'] = { en:"❌ Do not drive — tow it", hi:"❌ Drive मत करें — tow करें", bn:"❌ চালাবেন না — টো করুন", ta:"❌ ஓட்டாதீர் — இழுத்து செல்க", te:"❌ నడుపకండి — టో చేయండి", mr:"❌ चालवू नका — टो करा", gu:"❌ ચલાવો નહીં — ટો કરો", kn:"❌ ಚಲಾಯಿಸಬೇಡಿ — ಟೋ ಮಾಡಿ", ml:"❌ ഓടിക്കരുത് — ടോ ചെയ്യൂ" };
MC_SPEAK['mc.bubble.predrive'] = { en:"Chitti is doing the pre-drive check…", hi:"Chitti pre-drive check कर रही है…", bn:"Chitti ড্রাইভ-পূর্ব চেক করছে…", ta:"Chitti முன் சோதனை செய்கிறது…", te:"Chitti డ్రైవ్ ముందు చెక్…", mr:"Chitti ड्राइव्ह-पूर्व तपासणी…", gu:"Chitti ડ્રાઇવ-પૂર્વ ચેક…", kn:"Chitti ಡ್ರೈವ್ ಮುಂಚಿನ ಚೆಕ್…", ml:"Chitti ഡ്രൈവിന് മുമ്പുള്ള പരിശോധന…" };

const ALL = { ...TIPS, ...CAR_TIPS, ...DOCS, ...LS, ...MB_SPEAK, ...MC_SPEAK };

let s = readFileSync(PATH, 'utf8');
const langs = ['en','hi','bn','ta','te','mr','gu','kn','ml'];
let injected = 0;
for (const lang of langs) {
  const blockStartRe = new RegExp('(^|\\n)    ' + lang + ': \\{');
  const blockStart = s.search(blockStartRe);
  if (blockStart === -1) continue;
  for (const [key, perLang] of Object.entries(ALL)) {
    const val = perLang[lang];
    if (!val) continue;
    const probe = '"' + key + '":';
    const nextBlockMatch = s.slice(blockStart + 1).search(/\n    [a-z]{2}: \{/);
    const blockEnd = nextBlockMatch === -1 ? s.length : blockStart + 1 + nextBlockMatch;
    if (s.indexOf(probe, blockStart) !== -1 && s.indexOf(probe, blockStart) < blockEnd) continue;
    const blockAnchor = s.indexOf('"err.network"', blockStart);
    if (blockAnchor === -1 || blockAnchor >= blockEnd) continue;
    const insertion = '"' + key + '":' + JSON.stringify(val) + ',';
    s = s.slice(0, blockAnchor) + insertion + s.slice(blockAnchor);
    injected++;
  }
}
writeFileSync(PATH, s, 'utf8');
console.log('Injected', injected, 'final translations.');
