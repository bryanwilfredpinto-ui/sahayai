import { readFileSync, writeFileSync } from 'node:fs';
const PATH = 'c:/Users/DELL/sahayai/sahayai/strings.js';

const K = {
  "kyv.sec.anatomy":     { en:"🔧 Anatomy — what each part does", hi:"🔧 हर पुर्ज़े का काम", bn:"🔧 প্রতিটি অংশ কী করে", ta:"🔧 ஒவ்வொரு பாகமும் என்ன செய்கிறது", te:"🔧 ప్రతి భాగం ఏం చేస్తుంది", mr:"🔧 प्रत्येक भागाचे काम", gu:"🔧 દરેક ભાગનું કામ", kn:"🔧 ಪ್ರತಿ ಭಾಗದ ಕೆಲಸ", ml:"🔧 ഓരോ ഭാഗത്തിന്റെയും ജോലി" },
  "kyv.sec.consumables": { en:"🛢️ Consumables — what, when, how much", hi:"🛢️ Consumables — कब, क्या, कितने का", bn:"🛢️ কনজিউমেবল — কী, কখন, কত দাম", ta:"🛢️ பயன்படுத்துபவை — என்ன, எப்போது, எவ்வளவு", te:"🛢️ వినియోగాలు — ఏది, ఎప్పుడు, ఎంత", mr:"🛢️ Consumables — काय, कधी, किती", gu:"🛢️ Consumables — શું, ક્યારે, કેટલા", kn:"🛢️ Consumables — ಏನು, ಯಾವಾಗ, ಎಷ್ಟು", ml:"🛢️ Consumables — എന്ത്, എപ്പോൾ, എത്ര" },
  "kyv.sec.cleaning":    { en:"✨ Cleaning — store or homemade", hi:"✨ साफ़-सफ़ाई — store ya घर पर", bn:"✨ পরিষ্কার — দোকান বা ঘরে", ta:"✨ சுத்தம் — கடை அல்லது வீட்டில்", te:"✨ శుభ్రత — షాప్ లేదా ఇంట్లో", mr:"✨ साफसफाई — दुकान किंवा घरी", gu:"✨ સફાઈ — દુકાન કે ઘરે", kn:"✨ ಸ್ವಚ್ಛತೆ — ಅಂಗಡಿ ಅಥವಾ ಮನೆಯಲ್ಲಿ", ml:"✨ വൃത്തി — കടയിലോ വീട്ടിലോ" },
  "kyv.sec.toolkit":     { en:"🧰 Toolkit — what to keep yourself", hi:"🧰 Toolkit — कौन से tool रखें", bn:"🧰 টুলকিট — কী রাখবেন", ta:"🧰 கருவிகள் — என்ன வைத்திருக்க", te:"🧰 ఉపకరణాలు — ఏం ఉంచుకోవాలి", mr:"🧰 टूलकिट — काय ठेवायचं", gu:"🧰 ટૂલકિટ — શું રાખવું", kn:"🧰 ಟೂಲ್‌ಕಿಟ್ — ಏನು ಇಟ್ಟುಕೊಳ್ಳಬೇಕು", ml:"🧰 ടൂൾകിറ്റ് — എന്ത് സൂക്ഷിക്കണം" },
  "kyv.sec.warnings":    { en:"🚨 Sound · smell · light — decoded", hi:"🚨 आवाज़ · गंध · रोशनी — समझो", bn:"🚨 শব্দ · গন্ধ · আলো — বোঝো", ta:"🚨 ஒலி · வாசனை · ஒளி — புரிந்துகொள்", te:"🚨 శబ్దం · వాసన · లైట్ — అర్థం", mr:"🚨 आवाज · वास · प्रकाश — समजून घ्या", gu:"🚨 અવાજ · ગંધ · લાઇટ — સમજો", kn:"🚨 ಶಬ್ದ · ವಾಸನೆ · ಬೆಳಕು — ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ", ml:"🚨 ശബ്ദം · മണം · ലൈറ്റ് — മനസ്സിലാക്കൂ" },
  "kyv.sec.known":       { en:"specific quirks", hi:"की खास बातें", bn:"-এর বিশেষ বৈশিষ্ট্য", ta:"இன் சிறப்பு அம்சங்கள்", te:"యొక్క ప్రత్యేక లక్షణాలు", mr:"ची खास माहिती", gu:"ની ખાસ વાતો", kn:"ನ ವಿಶೇಷ ಲಕ್ಷಣಗಳು", ml:"-ന്റെ പ്രത്യേക ഗുണങ്ങൾ" },
  "kyv.sec.calendar":    { en:"📅 Year-round care + money-saving guide", hi:"📅 साल भर का care + पैसा बचाओ", bn:"📅 সারা বছরের যত্ন + টাকা বাঁচান", ta:"📅 ஆண்டு முழுவதும் கவனிப்பு + பணம் சேமி", te:"📅 సంవత్సరమంతా సంరక్షణ + డబ్బు ఆదా", mr:"📅 वर्षभर काळजी + पैसे वाचवा", gu:"📅 આખા વર્ષની સંભાળ + પૈસા બચાવો", kn:"📅 ವರ್ಷವಿಡೀ ಆರೈಕೆ + ಹಣ ಉಳಿತಾಯ", ml:"📅 വർഷം മുഴുവൻ പരിചരണം + പണം ലാഭം" },
  // Stats
  "kyv.stat.engine":  { en:"Engine", hi:"इंजन", bn:"ইঞ্জিন", ta:"இயந்திரம்", te:"ఇంజిన్", mr:"इंजिन", gu:"એન્જિન", kn:"ಎಂಜಿನ್", ml:"എഞ്ചിൻ" },
  "kyv.stat.type":    { en:"Type", hi:"प्रकार", bn:"ধরন", ta:"வகை", te:"రకం", mr:"प्रकार", gu:"પ્રકાર", kn:"ಪ್ರಕಾರ", ml:"തരം" },
  "kyv.stat.fuel":    { en:"Fuel", hi:"ईंधन", bn:"জ্বালানি", ta:"எரிபொருள்", te:"ఇంధనం", mr:"इंधन", gu:"ઈંધણ", kn:"ಇಂಧನ", ml:"ഇന്ധനം" },
  "kyv.stat.bhp":     { en:"BHP", hi:"BHP", bn:"BHP", ta:"BHP", te:"BHP", mr:"BHP", gu:"BHP", kn:"BHP", ml:"BHP" },
  "kyv.stat.torque":  { en:"Torque", hi:"बल", bn:"টর্ক", ta:"முறுக்கு", te:"టార్క్", mr:"टॉर्क", gu:"ટોર્ક", kn:"ಟಾರ್ಕ್", ml:"ടോർക്ക്" },
  "kyv.stat.tank":    { en:"Tank", hi:"टंकी", bn:"ট্যাঙ্ক", ta:"தொட்டி", te:"ట్యాంక్", mr:"टाकी", gu:"ટાંકી", kn:"ಟ್ಯಾಂಕ್", ml:"ടാങ്ക്" },
  "kyv.stat.mileage": { en:"Mileage", hi:"माइलेज", bn:"মাইলেজ", ta:"மைலேஜ்", te:"మైలేజ్", mr:"मायलेज", gu:"માઈલેજ", kn:"ಮೈಲೇಜ್", ml:"മൈലേജ്" },
  "kyv.stat.service": { en:"Service", hi:"सर्विस", bn:"সার্ভিস", ta:"சர்வீஸ்", te:"సర్వీస్", mr:"सर्व्हिस", gu:"સર્વિસ", kn:"ಸರ್ವೀಸ್", ml:"സർവീസ്" },
  // Service-cost block
  "kyv.cost.lbl":   { en:"Service cost benchmark", hi:"सर्विस का सही दाम", bn:"সার্ভিসের ন্যায্য খরচ", ta:"சர்வீஸ் சரியான விலை", te:"సర్వీస్ సరైన ధర", mr:"सर्व्हिस योग्य किंमत", gu:"સર્વિસ વાજબી ભાવ", kn:"ಸರ್ವೀಸ್ ನ್ಯಾಯ ಬೆಲೆ", ml:"സർവീസ് ന്യായവില" },
  "kyv.cost.local": { en:"Local mechanic:", hi:"लोकल मेकैनिक:", bn:"লোকাল মেকানিক:", ta:"உள்ளூர் மெக்கானிக்:", te:"లోకల్ మెకానిక్:", mr:"लोकल मेकॅनिक:", gu:"લોકલ મિકેનિક:", kn:"ಲೋಕಲ್ ಮೆಕಾನಿಕ್:", ml:"ലോക്കൽ മെക്കാനിക്:" },
  "kyv.cost.auth":  { en:"Authorised:", hi:"Authorised:", bn:"অথরাইজড:", ta:"அதிகாரப்பூர்வம்:", te:"అధికారిక:", mr:"अधिकृत:", gu:"અધિકૃત:", kn:"ಅಧಿಕೃತ:", ml:"അംഗീകൃതം:" },
  // Seasons
  "kyv.season.monsoon": { en:"Monsoon", hi:"मानसून", bn:"বর্ষা", ta:"மழைக்காலம்", te:"వర్షాకాలం", mr:"पावसाळा", gu:"ચોમાસું", kn:"ಮಳೆಗಾಲ", ml:"മഴക്കാലം" },
  "kyv.season.summer":  { en:"Summer", hi:"गर्मी", bn:"গ্রীষ্ম", ta:"கோடை", te:"వేసవి", mr:"उन्हाळा", gu:"ઉનાળો", kn:"ಬೇಸಿಗೆ", ml:"വേനൽ" },
  "kyv.season.winter":  { en:"Winter", hi:"सर्दी", bn:"শীত", ta:"குளிர்காலம்", te:"శీతాకాలం", mr:"हिवाळा", gu:"શિયાળો", kn:"ಚಳಿಗಾಲ", ml:"തണുപ്പ്" },
  // Other
  "kyv.resale":   { en:"Resale prep", hi:"बेचने की तैयारी", bn:"বিক্রির প্রস্তুতি", ta:"மறுவிற்பனைக்கான தயாரிப்பு", te:"రీసేల్ ప్రిపరేషన్", mr:"विक्रीची तयारी", gu:"વેચાણની તૈયારી", kn:"ಮಾರಾಟಕ್ಕೆ ಸಿದ್ಧತೆ", ml:"വിൽപനയ്ക്ക് തയ്യാറെടുപ്പ്" },
  "kyv.preride":  { en:"Pre-ride 30-sec check", hi:"बाइक चलाने से पहले 30 सेकंड जांच", bn:"চলার আগে ৩০-সেকেন্ড চেক", ta:"ஓட்டுவதற்கு முன் 30-விநாடி சோதனை", te:"నడుపుకు ముందు 30 సెకన్ల చెక్", mr:"चालण्या आधी ३०-सेकंद तपासणी", gu:"ચલાવતા પહેલા ૩૦-સેકન્ડ ચેક", kn:"ಚಲಾಯಿಸುವ ಮುಂಚೆ 30-ಸೆಕೆಂಡ್ ಚೆಕ್", ml:"ഓടിക്കുന്നതിന് മുമ്പ് 30-സെക്കൻഡ് പരിശോധന" },
  "kyv.predrive": { en:"Pre-drive 30-sec check", hi:"गाड़ी चलाने से पहले 30 सेकंड जांच", bn:"চালানোর আগে ৩০-সেকেন্ড চেক", ta:"ஓட்டுவதற்கு முன் 30-விநாடி சோதனை", te:"నడుపుకు ముందు 30 సెకన్ల చెక్", mr:"चालवण्या आधी ३०-सेकंद तपासणी", gu:"ચલાવતા પહેલા ૩૦-સેકન્ડ ચેક", kn:"ಚಲಾಯಿಸುವ ಮುಂಚೆ 30-ಸೆಕೆಂಡ್ ಚೆಕ್", ml:"ഓടിക്കുന്നതിന് മുമ്പ് 30-സെക്കൻഡ് പരിശോധന" },
};

let s = readFileSync(PATH, 'utf8');
const langs = ['en','hi','bn','ta','te','mr','gu','kn','ml'];
let injected = 0;
for (const lang of langs) {
  const blockStartRe = new RegExp('(^|\\n)    ' + lang + ': \\{');
  const blockStart = s.search(blockStartRe);
  if (blockStart === -1) continue;
  for (const [key, perLang] of Object.entries(K)) {
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
console.log('Injected ' + injected + ' KYV renderer translations.');
