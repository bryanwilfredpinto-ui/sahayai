/**
 * Fill every missing i18n key in strings.js for 2W/4W coverage.
 * Sire 2026-05-23: "select Bangla → everything should flip to Bangla" —
 * non-Devanagari/Tamil/Telugu langs were falling back to English.
 *
 * Idempotent: skips a key if the block already has it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const PATH = 'c:/Users/DELL/sahayai/sahayai/strings.js';

// All translations for the 42 keys that were missing in ta/mr/gu/kn/ml
// plus the 20 new KYV keys that were missing in every block.
const KEYS = {
  // ── 2-wheeler ──
  "mb.title": { en:"Chitti Mechanic Bike", hi:"Chitti Mechanic Bike", bn:"Chitti Mechanic Bike", ta:"Chitti Mechanic Bike", te:"Chitti Mechanic Bike", mr:"Chitti Mechanic Bike", gu:"Chitti Mechanic Bike", kn:"Chitti Mechanic Bike", ml:"Chitti Mechanic Bike" },
  "mb.tag": { en:"Your bike's best friend", hi:"आपकी बाइक का सबसे अच्छा दोस्त", bn:"আপনার বাইকের সেরা বন্ধু", ta:"உங்கள் பைக்கின் சிறந்த நண்பர்", te:"మీ బైక్ యొక్క ఉత్తమ స్నేహితుడు", mr:"तुमच्या बाईकचा सर्वोत्तम मित्र", gu:"તમારી બાઈકનો શ્રેષ્ઠ મિત્ર", kn:"ನಿಮ್ಮ ಬೈಕ್‌ನ ಅತ್ಯುತ್ತಮ ಸ್ನೇಹಿತ", ml:"നിങ്ങളുടെ ബൈക്കിന്റെ ഉറ്റ സുഹൃത്ത്" },
  "mb.tab.home": { en:"Home", hi:"घर", bn:"ঘর", ta:"வீடு", te:"ఇల్లు", mr:"घर", gu:"ઘર", kn:"ಮುಖಪುಟ", ml:"വീട്" },
  "mb.tab.bike": { en:"My Bike", hi:"मेरी बाइक", bn:"আমার বাইক", ta:"என் பைக்", te:"నా బైక్", mr:"माझी बाईक", gu:"મારી બાઈક", kn:"ನನ್ನ ಬೈಕ್", ml:"എന്റെ ബൈക്ക്" },
  "mb.tab.docs": { en:"Documents", hi:"कागज़ात", bn:"কাগজপত্র", ta:"ஆவணங்கள்", te:"పత్రాలు", mr:"कागदपत्रे", gu:"દસ્તાવેજો", kn:"ದಾಖಲೆಗಳು", ml:"രേഖകൾ" },
  "mb.tab.alerts": { en:"Alerts", hi:"चेतावनी", bn:"সতর্কতা", ta:"எச்சரிக்கைகள்", te:"హెచ్చరికలు", mr:"सूचना", gu:"ચેતવણીઓ", kn:"ಎಚ್ಚರಿಕೆಗಳು", ml:"മുന്നറിയിപ്പുകൾ" },
  "mb.tab.ask": { en:"Ask Chitti", hi:"Chitti से पूछो", bn:"Chitti কে জিজ্ঞাসা", ta:"Chitti யிடம் கேள்", te:"Chitti ని అడగండి", mr:"Chitti ला विचारा", gu:"Chitti ને પૂછો", kn:"Chitti ಗೆ ಕೇಳಿ", ml:"Chitti യോട് ചോദിക്കൂ" },
  "mb.empty.title": { en:"Add your bike", hi:"अपनी बाइक जोड़ें", bn:"আপনার বাইক যোগ করুন", ta:"உங்கள் பைக்கை சேர்க்கவும்", te:"మీ బైక్ జోడించండి", mr:"तुमची बाईक जोडा", gu:"તમારી બાઈક ઉમેરો", kn:"ನಿಮ್ಮ ಬೈಕ್ ಸೇರಿಸಿ", ml:"നിങ്ങളുടെ ബൈക്ക് ചേർക്കൂ" },
  "mb.empty.sub": { en:"Speak: My bike Hero Splendor UP32AB1234 2018 red", hi:"बोलें: मेरी बाइक Hero Splendor UP32AB1234 2018 लाल", bn:"বলুন: আমার বাইক Hero Splendor UP32AB1234 2018 লাল", ta:"சொல்லுங்கள்: என் பைக் Hero Splendor UP32AB1234 2018 சிவப்பு", te:"చెప్పండి: నా బైక్ Hero Splendor UP32AB1234 2018 ఎరుపు", mr:"बोला: माझी बाईक Hero Splendor UP32AB1234 2018 लाल", gu:"બોલો: મારી બાઈક Hero Splendor UP32AB1234 2018 લાલ", kn:"ಹೇಳಿ: ನನ್ನ ಬೈಕ್ Hero Splendor UP32AB1234 2018 ಕೆಂಪು", ml:"പറയൂ: എന്റെ ബൈക്ക് Hero Splendor UP32AB1234 2018 ചുവപ്പ്" },
  "mb.form.variant": { en:"Variant", hi:"Variant", bn:"Variant", ta:"வகை (Variant)", te:"వేరియంట్", mr:"Variant", gu:"Variant", kn:"ವೇರಿಯಂಟ್", ml:"വേരിയന്റ്" },
  "mb.health.good": { en:"Healthy", hi:"ठीक है", bn:"ভাল আছে", ta:"நலமாக உள்ளது", te:"బాగుంది", mr:"छान आहे", gu:"સારી છે", kn:"ಚೆನ್ನಾಗಿದೆ", ml:"സുഖമാണ്" },
  "mb.safety.daily": { en:"Daily safety tip", hi:"रोज़ का safety टिप", bn:"প্রতিদিনের সেফটি টিপ", ta:"தினசரி பாதுகாப்பு குறிப்பு", te:"రోజువారీ సేఫ్టీ టిప్", mr:"दैनिक सेफ्टी टिप", gu:"દૈનિક સેફ્ટી ટિપ", kn:"ದೈನಂದಿನ ಸುರಕ್ಷತಾ ಸಲಹೆ", ml:"പ്രതിദിന സുരക്ഷാ നുറുങ്ങ്" },
  "mb.helmet": { en:"Wore your helmet? Say yes and Chitti will open Maps", hi:"हेलमेट पहना? 'हाँ' बोलें तभी Maps खोलूँगी", bn:"হেলমেট পরেছেন? 'হ্যাঁ' বললে Maps খুলবো", ta:"ஹெல்மெட் அணிந்துள்ளீரா? 'ஆம்' சொன்னால் Maps திறப்பேன்", te:"హెల్మెట్ ధరించారా? 'అవును' అంటే Maps తెరుస్తాను", mr:"हेल्मेट घातला? 'हो' म्हणाल्यावरच Maps उघडेन", gu:"હેલ્મેટ પહેર્યું? 'હા' કહો ત્યારે જ Maps ખુલશે", kn:"ಹೆಲ್ಮೆಟ್ ಧರಿಸಿದ್ದೀರಾ? 'ಹೌದು' ಎಂದರೆ Maps ತೆರೆಯುತ್ತೇನೆ", ml:"ഹെൽമെറ്റ് ധരിച്ചോ? 'അതെ' പറഞ്ഞാൽ Maps തുറക്കും" },
  "mb.ask.hint": { en:"Tell Chitti what is wrong — chain noise, mileage drop, will not start, anything", hi:"Chitti को बताइए क्या तकलीफ़ है — chain की आवाज़, mileage कम, start नहीं ले रही", bn:"Chitti কে বলুন কী সমস্যা — চেইন শব্দ, মাইলেজ কম, স্টার্ট হচ্ছে না", ta:"Chitti யிடம் சொல்லுங்கள் என்ன பிரச்சினை — செயின் சத்தம், மைலேஜ் குறைவு, ஸ்டார்ட் ஆகவில்லை", te:"Chitti కి సమస్య చెప్పండి — చైన్ శబ్దం, మైలేజ్ తగ్గింది, స్టార్ట్ కాలేదు", mr:"Chitti ला सांगा काय अडचण — चेन आवाज, मायलेज कमी, स्टार्ट नाही", gu:"Chitti ને કહો શું તકલીફ — ચેન અવાજ, માઈલેજ ઓછું, સ્ટાર્ટ નહીં થાય", kn:"Chitti ಗೆ ಹೇಳಿ ಏನು ಸಮಸ್ಯೆ — ಚೈನ್ ಶಬ್ದ, ಮೈಲೇಜ್ ಕಡಿಮೆ, ಸ್ಟಾರ್ಟ್ ಆಗುತ್ತಿಲ್ಲ", ml:"Chitti യോട് പറയൂ പ്രശ്നം — ചെയിൻ ശബ്ദം, മൈലേജ് കുറവ്, സ്റ്റാർട്ട് ആവുന്നില്ല" },

  // KYV - 2W
  "mb.kyv.title": { en:"Know my Bike — Chitti's deep guide", hi:"Know my Bike — Chitti की गहरी जानकारी", bn:"Know my Bike — Chitti এর গভীর গাইড", ta:"Know my Bike — Chitti யின் ஆழமான வழிகாட்டி", te:"Know my Bike — Chitti యొక్క లోతైన గైడ్", mr:"Know my Bike — Chitti चे सखोल मार्गदर्शक", gu:"Know my Bike — Chitti નું ઊંડું માર્ગદર્શન", kn:"Know my Bike — Chitti ಯ ಆಳವಾದ ಮಾರ್ಗದರ್ಶಿ", ml:"Know my Bike — Chitti യുടെ ആഴമേറിയ ഗൈഡ്" },
  "mb.kyv.sub": { en:"Everything about your exact bike — parts, oil, chain, tyres, cleaning DIY, warning sounds, season care, fair-price benchmark.", hi:"आपकी exact bike के बारे में सब कुछ — parts, oil, chain, tyres, साफ़-सफ़ाई DIY, warning आवाज़ें, season care, fair-price benchmark.", bn:"আপনার নির্দিষ্ট বাইক সম্পর্কে সব — parts, oil, chain, tyres, পরিষ্কার DIY, সতর্ক শব্দ, ঋতু যত্ন, ন্যায্য দাম।", ta:"உங்கள் சரியான பைக் பற்றி எல்லாம் — parts, oil, chain, tyres, சுத்தம் DIY, எச்சரிக்கை சத்தங்கள், பருவ பராமரிப்பு, நியாய விலை.", te:"మీ ఖచ్చితమైన బైక్ గురించి అన్నీ — parts, oil, chain, tyres, శుభ్రత DIY, హెచ్చరిక శబ్దాలు, రుతువు సంరక్షణ, న్యాయమైన ధర.", mr:"तुमच्या नेमक्या बाईकबद्दल सर्व — parts, oil, chain, tyres, साफसफाई DIY, इशारा आवाज, हंगाम काळजी, योग्य किंमत.", gu:"તમારી ચોક્કસ બાઈક વિશે બધું — parts, oil, chain, tyres, સફાઈ DIY, ચેતવણી અવાજ, ઋતુ સંભાળ, વાજબી કિંમત.", kn:"ನಿಮ್ಮ ನಿರ್ದಿಷ್ಟ ಬೈಕ್ ಬಗ್ಗೆ ಎಲ್ಲವೂ — parts, oil, chain, tyres, ಸ್ವಚ್ಛತೆ DIY, ಎಚ್ಚರಿಕೆ ಶಬ್ದಗಳು, ಋತು ಆರೈಕೆ, ನ್ಯಾಯಯುತ ಬೆಲೆ.", ml:"നിങ്ങളുടെ കൃത്യമായ ബൈക്കിനെക്കുറിച്ച് എല്ലാം — parts, oil, chain, tyres, വൃത്തി DIY, മുന്നറിയിപ്പ് ശബ്ദങ്ങൾ, സീസൺ പരിചരണം, ന്യായവില." },
  "mb.kyv.empty.title": { en:"Save your bike first", hi:"पहले अपनी बाइक save करें", bn:"আগে আপনার বাইক সেভ করুন", ta:"முதலில் உங்கள் பைக்கை சேமிக்கவும்", te:"మొదట మీ బైక్ సేవ్ చేయండి", mr:"प्रथम तुमची बाईक save करा", gu:"પહેલા તમારી બાઈક save કરો", kn:"ಮೊದಲು ನಿಮ್ಮ ಬೈಕ್ save ಮಾಡಿ", ml:"ആദ്യം നിങ്ങളുടെ ബൈക്ക് save ചെയ്യൂ" },
  "mb.kyv.empty.sub": { en:"After saving Make + Model + Variant, Chitti will deliver the workshop manual + savvy-friend guide together.", hi:"Make + Model + Variant save होने के बाद Chitti workshop manual + savvy-friend guide एक साथ देगी।", bn:"Make + Model + Variant সেভ করার পরে Chitti workshop manual + বুদ্ধিমান-বন্ধু গাইড একসাথে দেবে।", ta:"Make + Model + Variant சேமித்த பிறகு Chitti workshop manual + நண்பர் வழிகாட்டியை ஒன்றாக தரும்.", te:"Make + Model + Variant సేవ్ చేసిన తర్వాత Chitti workshop manual + స్నేహితుడి గైడ్ కలిపి ఇస్తుంది.", mr:"Make + Model + Variant save केल्यानंतर Chitti workshop manual + मित्र मार्गदर्शक एकत्र देईल.", gu:"Make + Model + Variant save કર્યા પછી Chitti workshop manual + મિત્ર માર્ગદર્શન સાથે આપશે.", kn:"Make + Model + Variant save ಮಾಡಿದ ನಂತರ Chitti workshop manual + ಸ್ನೇಹಿತ ಮಾರ್ಗದರ್ಶಿ ಒಟ್ಟಿಗೆ ನೀಡುತ್ತದೆ.", ml:"Make + Model + Variant save ചെയ്ത ശേഷം Chitti workshop manual + സുഹൃത്ത് ഗൈഡ് ഒന്നിച്ച് നൽകും." },
  "mb.kyv.loading.head": { en:"Chitti is researching…", hi:"Chitti research कर रही है…", bn:"Chitti research করছে…", ta:"Chitti ஆராய்ச்சி செய்கிறது…", te:"Chitti పరిశోధిస్తోంది…", mr:"Chitti research करत आहे…", gu:"Chitti research કરી રહી છે…", kn:"Chitti research ಮಾಡುತ್ತಿದೆ…", ml:"Chitti research ചെയ്യുന്നു…" },
  "mb.kyv.loading.sub": { en:"≈ 10 seconds — anatomy, oil, chain, tyres, brake, warnings, season-care.", hi:"≈ 10 second — anatomy, oil, chain, tyres, brake, warnings, season-care.", bn:"≈ ১০ সেকেন্ড — anatomy, oil, chain, tyres, brake, warnings, season-care.", ta:"≈ 10 விநாடிகள் — anatomy, oil, chain, tyres, brake, warnings, season-care.", te:"≈ 10 సెకన్లు — anatomy, oil, chain, tyres, brake, warnings, season-care.", mr:"≈ १० सेकंद — anatomy, oil, chain, tyres, brake, warnings, season-care.", gu:"≈ ૧૦ સેકન્ડ — anatomy, oil, chain, tyres, brake, warnings, season-care.", kn:"≈ 10 ಸೆಕೆಂಡ್‌ಗಳು — anatomy, oil, chain, tyres, brake, warnings, season-care.", ml:"≈ 10 സെക്കൻഡ് — anatomy, oil, chain, tyres, brake, warnings, season-care." },
  "mb.kyv.error": { en:"😔 Chitti couldn't research. Check internet and try again.", hi:"😔 Chitti research नहीं कर पाई। Internet check करके फिर try करें।", bn:"😔 Chitti research করতে পারেনি। Internet চেক করে আবার চেষ্টা করুন।", ta:"😔 Chitti ஆராய முடியவில்லை. Internet சரிபார்த்து மீண்டும் முயற்சிக்கவும்.", te:"😔 Chitti పరిశోధించలేకపోయింది. Internet చెక్ చేసి మళ్ళీ ప్రయత్నించండి.", mr:"😔 Chitti research करू शकली नाही. Internet तपासून पुन्हा प्रयत्न करा.", gu:"😔 Chitti research કરી શકી નહીં. Internet ચેક કરી ફરી પ્રયાસ કરો.", kn:"😔 Chitti research ಮಾಡಲಾಗಲಿಲ್ಲ. Internet ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.", ml:"😔 Chitti research ചെയ്യാൻ കഴിഞ്ഞില്ല. Internet പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കൂ." },
  "mb.kyv.retry": { en:"🔄 Try again", hi:"🔄 फिर try करें", bn:"🔄 আবার চেষ্টা করুন", ta:"🔄 மீண்டும் முயற்சி", te:"🔄 మళ్ళీ ప్రయత్నించండి", mr:"🔄 पुन्हा प्रयत्न", gu:"🔄 ફરી પ્રયાસ", kn:"🔄 ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", ml:"🔄 വീണ്ടും ശ്രമിക്കൂ" },
  "mb.kyv.refresh": { en:"Refresh", hi:"Refresh", bn:"Refresh", ta:"Refresh", te:"Refresh", mr:"Refresh", gu:"Refresh", kn:"Refresh", ml:"Refresh" },

  // ── 4-wheeler ──
  "mc.title": { en:"Chitti Mechanic Car", hi:"Chitti Mechanic Car", bn:"Chitti Mechanic Car", ta:"Chitti Mechanic Car", te:"Chitti Mechanic Car", mr:"Chitti Mechanic Car", gu:"Chitti Mechanic Car", kn:"Chitti Mechanic Car", ml:"Chitti Mechanic Car" },
  "mc.tag": { en:"Your car's best friend", hi:"आपकी गाड़ी का सबसे अच्छा दोस्त", bn:"আপনার গাড়ির সেরা বন্ধু", ta:"உங்கள் காரின் சிறந்த நண்பர்", te:"మీ కారు యొక్క ఉత్తమ స్నేహితుడు", mr:"तुमच्या गाडीचा सर्वोत्तम मित्र", gu:"તમારી કારનો શ્રેષ્ઠ મિત્ર", kn:"ನಿಮ್ಮ ಕಾರಿನ ಅತ್ಯುತ್ತಮ ಸ್ನೇಹಿತ", ml:"നിങ്ങളുടെ കാറിന്റെ ഉറ്റ സുഹൃത്ത്" },
  "mc.tab.home": { en:"Home", hi:"घर", bn:"ঘর", ta:"வீடு", te:"ఇల్లు", mr:"घर", gu:"ઘર", kn:"ಮುಖಪುಟ", ml:"വീട്" },
  "mc.tab.car": { en:"My Car", hi:"मेरी गाड़ी", bn:"আমার গাড়ি", ta:"என் கார்", te:"నా కారు", mr:"माझी गाडी", gu:"મારી કાર", kn:"ನನ್ನ ಕಾರು", ml:"എന്റെ കാർ" },
  "mc.tab.docs": { en:"Documents", hi:"कागज़ात", bn:"কাগজপত্র", ta:"ஆவணங்கள்", te:"పత్రాలు", mr:"कागदपत्रे", gu:"દસ્તાવેજો", kn:"ದಾಖಲೆಗಳು", ml:"രേഖകൾ" },
  "mc.tab.alerts": { en:"Alerts", hi:"चेतावनी", bn:"সতর্কতা", ta:"எச்சரிக்கைகள்", te:"హెచ్చరికలు", mr:"सूचना", gu:"ચેતવણીઓ", kn:"ಎಚ್ಚರಿಕೆಗಳು", ml:"മുന്നറിയിപ്പുകൾ" },
  "mc.tab.ask": { en:"Ask Chitti", hi:"Chitti से पूछो", bn:"Chitti কে জিজ্ঞাসা", ta:"Chitti யிடம் கேள்", te:"Chitti ని అడగండి", mr:"Chitti ला विचारा", gu:"Chitti ને પૂછો", kn:"Chitti ಗೆ ಕೇಳಿ", ml:"Chitti യോട് ചോദിക്കൂ" },
  "mc.empty.title": { en:"Add your car", hi:"अपनी गाड़ी जोड़ें", bn:"আপনার গাড়ি যোগ করুন", ta:"உங்கள் காரை சேர்க்கவும்", te:"మీ కారు జోడించండి", mr:"तुमची गाडी जोडा", gu:"તમારી કાર ઉમેરો", kn:"ನಿಮ್ಮ ಕಾರು ಸೇರಿಸಿ", ml:"നിങ്ങളുടെ കാർ ചേർക്കൂ" },
  "mc.empty.sub": { en:"Speak: My car Maruti Swift DL3CAB5678 2020 white", hi:"बोलें: मेरी गाड़ी Maruti Swift DL3CAB5678 2020 सफ़ेद", bn:"বলুন: আমার গাড়ি Maruti Swift DL3CAB5678 2020 সাদা", ta:"சொல்லுங்கள்: என் கார் Maruti Swift DL3CAB5678 2020 வெள்ளை", te:"చెప్పండి: నా కారు Maruti Swift DL3CAB5678 2020 తెలుపు", mr:"बोला: माझी गाडी Maruti Swift DL3CAB5678 2020 पांढरी", gu:"બોલો: મારી કાર Maruti Swift DL3CAB5678 2020 સફેદ", kn:"ಹೇಳಿ: ನನ್ನ ಕಾರು Maruti Swift DL3CAB5678 2020 ಬಿಳಿ", ml:"പറയൂ: എന്റെ കാർ Maruti Swift DL3CAB5678 2020 വെള്ള" },
  "mc.form.variant": { en:"Variant (XZ+ / VXi / ZXi+ / SX(O) / standard)", hi:"Variant (XZ+ / VXi / ZXi+ / SX(O) / standard)", bn:"Variant (XZ+ / VXi / ZXi+ / SX(O) / standard)", ta:"Variant (XZ+ / VXi / ZXi+ / SX(O) / standard)", te:"Variant (XZ+ / VXi / ZXi+ / SX(O) / standard)", mr:"Variant (XZ+ / VXi / ZXi+ / SX(O) / standard)", gu:"Variant (XZ+ / VXi / ZXi+ / SX(O) / standard)", kn:"Variant (XZ+ / VXi / ZXi+ / SX(O) / standard)", ml:"Variant (XZ+ / VXi / ZXi+ / SX(O) / standard)" },

  // KYV - 4W
  "mc.kyv.title": { en:"Know my Car — Chitti's deep guide", hi:"Know my Car — Chitti की गहरी जानकारी", bn:"Know my Car — Chitti এর গভীর গাইড", ta:"Know my Car — Chitti யின் ஆழமான வழிகாட்டி", te:"Know my Car — Chitti యొక్క లోతైన గైడ్", mr:"Know my Car — Chitti चे सखोल मार्गदर्शक", gu:"Know my Car — Chitti નું ઊંડું માર્ગદર્શન", kn:"Know my Car — Chitti ಯ ಆಳವಾದ ಮಾರ್ಗದರ್ಶಿ", ml:"Know my Car — Chitti യുടെ ആഴമേറിയ ഗൈഡ്" },
  "mc.kyv.sub": { en:"Everything about your exact car — engine parts, oil + coolant + ATF VFM picks, tyres, dashboard warnings, season care, fair-price benchmark.", hi:"आपकी exact गाड़ी के बारे में सब — engine parts, oil + coolant + ATF VFM picks, tyres, dashboard warnings, season care, fair-price benchmark.", bn:"আপনার নির্দিষ্ট গাড়ি সম্পর্কে সব — engine parts, oil + coolant + ATF VFM picks, tyres, dashboard warnings, season care, fair-price.", ta:"உங்கள் சரியான கார் பற்றி எல்லாம் — engine parts, oil + coolant + ATF VFM, tyres, dashboard warnings, பருவ பராமரிப்பு, fair-price.", te:"మీ ఖచ్చితమైన కారు గురించి అన్నీ — engine parts, oil + coolant + ATF VFM, tyres, dashboard warnings, రుతువు సంరక్షణ, fair-price.", mr:"तुमच्या नेमक्या गाडीबद्दल सर्व — engine parts, oil + coolant + ATF VFM, tyres, dashboard warnings, हंगाम काळजी, fair-price.", gu:"તમારી ચોક્કસ કાર વિશે બધું — engine parts, oil + coolant + ATF VFM, tyres, dashboard warnings, ઋતુ સંભાળ, fair-price.", kn:"ನಿಮ್ಮ ನಿರ್ದಿಷ್ಟ ಕಾರಿನ ಬಗ್ಗೆ ಎಲ್ಲವೂ — engine parts, oil + coolant + ATF VFM, tyres, dashboard warnings, ಋತು ಆರೈಕೆ, fair-price.", ml:"നിങ്ങളുടെ കൃത്യമായ കാറിനെക്കുറിച്ച് എല്ലാം — engine parts, oil + coolant + ATF VFM, tyres, dashboard warnings, സീസൺ പരിചരണം, fair-price." },
  "mc.kyv.empty.title": { en:"Save your car first", hi:"पहले अपनी गाड़ी save करें", bn:"আগে আপনার গাড়ি সেভ করুন", ta:"முதலில் உங்கள் காரை சேமிக்கவும்", te:"మొదట మీ కారు సేవ్ చేయండి", mr:"प्रथम तुमची गाडी save करा", gu:"પહેલા તમારી કાર save કરો", kn:"ಮೊದಲು ನಿಮ್ಮ ಕಾರು save ಮಾಡಿ", ml:"ആദ്യം നിങ്ങളുടെ കാർ save ചെയ്യൂ" },
  "mc.kyv.empty.sub": { en:"After saving Make + Model + Variant, Chitti will deliver the workshop manual + savvy-friend guide together.", hi:"Make + Model + Variant save होने के बाद Chitti workshop manual + savvy-friend guide एक साथ देगी।", bn:"Make + Model + Variant সেভ করার পরে Chitti workshop manual + বুদ্ধিমান-বন্ধু গাইড একসাথে দেবে।", ta:"Make + Model + Variant சேமித்த பிறகு Chitti workshop manual + நண்பர் வழிகாட்டியை ஒன்றாக தரும்.", te:"Make + Model + Variant సేవ్ చేసిన తర్వాత Chitti workshop manual + స్నేహితుడి గైడ్ కలిపి ఇస్తుంది.", mr:"Make + Model + Variant save केल्यानंतर Chitti workshop manual + मित्र मार्गदर्शक एकत्र देईल.", gu:"Make + Model + Variant save કર્યા પછી Chitti workshop manual + મિત્ર માર્ગદર્શન સાથે આપશે.", kn:"Make + Model + Variant save ಮಾಡಿದ ನಂತರ Chitti workshop manual + ಸ್ನೇಹಿತ ಮಾರ್ಗದರ್ಶಿ ಒಟ್ಟಿಗೆ ನೀಡುತ್ತದೆ.", ml:"Make + Model + Variant save ചെയ്ത ശേഷം Chitti workshop manual + സുഹൃത്ത് ഗൈഡ് ഒന്നിച്ച് നൽകും." },
  "mc.kyv.loading.head": { en:"Chitti is researching…", hi:"Chitti research कर रही है…", bn:"Chitti research করছে…", ta:"Chitti ஆராய்ச்சி செய்கிறது…", te:"Chitti పరిశోధిస్తోంది…", mr:"Chitti research करत आहे…", gu:"Chitti research કરી રહી છે…", kn:"Chitti research ಮಾಡುತ್ತಿದೆ…", ml:"Chitti research ചെയ്യുന്നു…" },
  "mc.kyv.loading.sub": { en:"≈ 10 seconds — engine, coolant, oil, tyres, AC, brake, warnings, season-care.", hi:"≈ 10 second — engine, coolant, oil, tyres, AC, brake, warnings, season-care.", bn:"≈ ১০ সেকেন্ড — engine, coolant, oil, tyres, AC, brake, warnings, season-care.", ta:"≈ 10 விநாடிகள் — engine, coolant, oil, tyres, AC, brake, warnings, season-care.", te:"≈ 10 సెకన్లు — engine, coolant, oil, tyres, AC, brake, warnings, season-care.", mr:"≈ १० सेकंद — engine, coolant, oil, tyres, AC, brake, warnings, season-care.", gu:"≈ ૧૦ સેકન્ડ — engine, coolant, oil, tyres, AC, brake, warnings, season-care.", kn:"≈ 10 ಸೆಕೆಂಡ್‌ಗಳು — engine, coolant, oil, tyres, AC, brake, warnings, season-care.", ml:"≈ 10 സെക്കൻഡ് — engine, coolant, oil, tyres, AC, brake, warnings, season-care." },
  "mc.kyv.error": { en:"😔 Chitti couldn't research. Check internet and try again.", hi:"😔 Chitti research नहीं कर पाई। Internet check करके फिर try करें।", bn:"😔 Chitti research করতে পারেনি। Internet চেক করে আবার চেষ্টা করুন।", ta:"😔 Chitti ஆராய முடியவில்லை. Internet சரிபார்த்து மீண்டும் முயற்சிக்கவும்.", te:"😔 Chitti పరిశోధించలేకపోయింది. Internet చెక్ చేసి మళ్ళీ ప్రయత్నించండి.", mr:"😔 Chitti research करू शकली नाही. Internet तपासून पुन्हा प्रयत्न करा.", gu:"😔 Chitti research કરી શકી નહીં. Internet ચેક કરી ફરી પ્રયાસ કરો.", kn:"😔 Chitti research ಮಾಡಲಾಗಲಿಲ್ಲ. Internet ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.", ml:"😔 Chitti research ചെയ്യാൻ കഴിഞ്ഞില്ല. Internet പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കൂ." },
  "mc.kyv.retry": { en:"🔄 Try again", hi:"🔄 फिर try करें", bn:"🔄 আবার চেষ্টা করুন", ta:"🔄 மீண்டும் முயற்சி", te:"🔄 మళ్ళీ ప్రయత్నించండి", mr:"🔄 पुन्हा प्रयत्न", gu:"🔄 ફરી પ્રયાસ", kn:"🔄 ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", ml:"🔄 വീണ്ടും ശ്രമിക്കൂ" },
  "mc.kyv.refresh": { en:"Refresh", hi:"Refresh", bn:"Refresh", ta:"Refresh", te:"Refresh", mr:"Refresh", gu:"Refresh", kn:"Refresh", ml:"Refresh" },
};

let s = readFileSync(PATH, 'utf8');
const langs = ['en','hi','bn','ta','te','mr','gu','kn','ml'];
let injected = 0;

for (const lang of langs) {
  // Find block start: line "    {lang}: {"
  const blockStartRe = new RegExp('(^|\\n)    ' + lang + ': \\{');
  const blockStart = s.search(blockStartRe);
  if (blockStart === -1) { console.error(`block ${lang} not found`); continue; }
  // Find a stable anchor inside the block — "err.network" exists in every block.
  const anchorIdx = s.indexOf('"err.network"', blockStart);
  if (anchorIdx === -1) { console.error(`err.network anchor missing for ${lang}`); continue; }

  for (const [key, perLang] of Object.entries(KEYS)) {
    const val = perLang[lang];
    if (!val) continue;
    const probe = '"' + key + '":';
    // Check if this key already exists in THIS block (between blockStart and the next block start)
    const nextBlockMatch = s.slice(blockStart + 1).search(/\n    [a-z]{2}: \{/);
    const blockEnd = nextBlockMatch === -1 ? s.length : blockStart + 1 + nextBlockMatch;
    if (s.indexOf(probe, blockStart) !== -1 && s.indexOf(probe, blockStart) < blockEnd) continue; // already present
    // Insert immediately BEFORE "err.network" — we need to find the anchor inside THIS block specifically.
    const blockAnchor = s.indexOf('"err.network"', blockStart);
    if (blockAnchor === -1 || blockAnchor >= blockEnd) continue;
    const insertion = '"' + key + '":' + JSON.stringify(val) + ',';
    s = s.slice(0, blockAnchor) + insertion + s.slice(blockAnchor);
    injected++;
  }
}

writeFileSync(PATH, s, 'utf8');
console.log('Injected ' + injected + ' missing translations across 9 language blocks.');
