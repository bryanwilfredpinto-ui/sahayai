/**
 * Inject ALL the new world-class feature keys into strings.js for all 9 langs.
 * Sire 2026-05-23: "Select Telugu → 100% Telugu everywhere. ZERO English."
 */
import { readFileSync, writeFileSync } from 'node:fs';
const PATH = 'c:/Users/DELL/sahayai/sahayai/strings.js';

// Each key gets 9 translations. Languages: en, hi, bn, ta, te, mr, gu, kn, ml
const K = {
  // ── Universal UI chrome ──
  "ui.suno":      { en:"Listen", hi:"सुनो", bn:"শুনুন", ta:"கேள்", te:"వినండి", mr:"ऐका", gu:"સાંભળો", kn:"ಕೇಳಿ", ml:"കേൾക്കൂ" },
  "ui.demo":      { en:"Demo", hi:"डेमो", bn:"ডেমো", ta:"டெமோ", te:"డెమో", mr:"डेमो", gu:"ડેમો", kn:"ಡೆಮೋ", ml:"ഡെമോ" },
  "ui.next":      { en:"Next", hi:"अगली", bn:"পরবর্তী", ta:"அடுத்த", te:"తరువాత", mr:"पुढील", gu:"આગળ", kn:"ಮುಂದಿನ", ml:"അടുത്തത്" },
  "ui.cancel":    { en:"Cancel", hi:"रद्द", bn:"বাতিল", ta:"ரத்து", te:"రద్దు", mr:"रद्द", gu:"રદ", kn:"ರದ್ದು", ml:"റദ്ദാക്കു" },
  "ui.send":      { en:"Send", hi:"भेजो", bn:"পাঠাও", ta:"அனுப்பு", te:"పంపండి", mr:"पाठवा", gu:"મોકલો", kn:"ಕಳುಹಿಸಿ", ml:"അയക്കൂ" },
  "ui.padho":     { en:"Read", hi:"पढ़ो", bn:"পড়ো", ta:"படி", te:"చదవండి", mr:"वाचा", gu:"વાંચો", kn:"ಓದಿ", ml:"വായിക്കൂ" },
  "ui.sab_padho": { en:"Read all", hi:"सब पढ़ो", bn:"সব পড়ো", ta:"எல்லாம் படி", te:"అన్నీ చదవండి", mr:"सर्व वाचा", gu:"બધું વાંચો", kn:"ಎಲ್ಲಾ ಓದಿ", ml:"എല്ലാം വായിക്കൂ" },
  "ui.refresh":   { en:"Refresh", hi:"फिर लाओ", bn:"রিফ্রেশ", ta:"புதுப்பி", te:"రిఫ్రెష్", mr:"रिफ्रेश", gu:"રિફ્રેશ", kn:"ರಿಫ್ರೆಶ್", ml:"പുതുക്കൂ" },
  "ui.want":      { en:"I want this", hi:"चाहिए", bn:"চাই", ta:"வேண்டும்", te:"కావాలి", mr:"पाहिजे", gu:"જોઈએ", kn:"ಬೇಕು", ml:"വേണം" },

  // ── Empty state add-by-voice button ──
  "em.add_voice": { en:"🎙️ Add by voice", hi:"🎙️ बोलकर जोड़ें", bn:"🎙️ কথা বলে যোগ করুন", ta:"🎙️ பேசி சேர்", te:"🎙️ మాట్లాడి జోడించండి", mr:"🎙️ बोलून जोडा", gu:"🎙️ બોલીને ઉમેરો", kn:"🎙️ ಮಾತಾಡಿ ಸೇರಿಸಿ", ml:"🎙️ പറഞ്ഞ് ചേർക്കൂ" },

  // ── Make/Model placeholder ──
  "vh.make.dash":  { en:"— Make —", hi:"— बनाने वाली कंपनी —", bn:"— মেক —", ta:"— தயாரிப்பு —", te:"— మేక్ —", mr:"— मेक —", gu:"— મેક —", kn:"— ಮೇಕ್ —", ml:"— മേക്ക് —" },
  "vh.model.dash": { en:"— Model —", hi:"— मॉडल —", bn:"— মডেল —", ta:"— மாடல் —", te:"— మోడల్ —", mr:"— मॉडेल —", gu:"— મોડેલ —", kn:"— ಮಾಡೆಲ್ —", ml:"— മോഡൽ —" },

  // ── Daily safety tip section title ──
  "st.title": { en:"Today's safety tip", hi:"आज की सुरक्षा सलाह", bn:"আজকের সেফটি টিপ", ta:"இன்றைய பாதுகாப்பு குறிப்பு", te:"నేటి సేఫ్టీ చిట్కా", mr:"आजचा सुरक्षा सल्ला", gu:"આજનો સેફ્ટી ટિપ", kn:"ಇಂದಿನ ಸುರಕ್ಷತಾ ಸಲಹೆ", ml:"ഇന്നത്തെ സുരക്ഷാ ടിപ്പ്" },

  // ── Docs section ──
  "dc.title":     { en:"Documents — all in one place", hi:"कागज़ात — सब एक जगह", bn:"কাগজপত্র — সব এক জায়গায়", ta:"ஆவணங்கள் — அனைத்தும் ஒரே இடத்தில்", te:"పత్రాలు — అన్నీ ఒకే చోట", mr:"कागदपत्रे — सर्व एका ठिकाणी", gu:"દસ્તાવેજો — બધું એક જગ્યાએ", kn:"ದಾಖಲೆಗಳು — ಎಲ್ಲವೂ ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ", ml:"രേഖകൾ — എല്ലാം ഒരിടത്ത്" },
  "dc.rem.label": { en:"When should we remind you?", hi:"Reminder कब चाहिए?", bn:"কখন রিমাইন্ডার চাই?", ta:"எப்போது நினைவூட்டல்?", te:"ఎప్పుడు రిమైండర్?", mr:"रिमाइंडर कधी हवा?", gu:"રિમાઇન્ડર ક્યારે?", kn:"ರಿಮೈಂಡರ್ ಯಾವಾಗ?", ml:"റിമൈൻഡർ എപ്പോൾ?" },
  "dc.rem.30":    { en:"30 days before", hi:"30 दिन पहले", bn:"৩০ দিন আগে", ta:"30 நாட்களுக்கு முன்", te:"30 రోజుల ముందు", mr:"३० दिवस आधी", gu:"૩૦ દિવસ પહેલા", kn:"30 ದಿನಗಳ ಮುಂಚೆ", ml:"30 ദിവസം മുമ്പ്" },
  "dc.rem.7":     { en:"7 days before", hi:"7 दिन पहले", bn:"৭ দিন আগে", ta:"7 நாட்களுக்கு முன்", te:"7 రోజుల ముందు", mr:"७ दिवस आधी", gu:"૭ દિવસ પહેલા", kn:"7 ದಿನಗಳ ಮುಂಚೆ", ml:"7 ദിവസം മുമ്പ്" },
  "dc.rem.1":     { en:"1 day before", hi:"1 दिन पहले", bn:"১ দিন আগে", ta:"1 நாள் முன்", te:"1 రోజు ముందు", mr:"१ दिवस आधी", gu:"૧ દિવસ પહેલા", kn:"1 ದಿನ ಮುಂಚೆ", ml:"1 ദിവസം മുമ്പ്" },

  // ── Alerts ──
  "al.title": { en:"Active alerts", hi:"सक्रिय चेतावनी", bn:"সক্রিয় সতর্কতা", ta:"செயல்படும் எச்சரிக்கைகள்", te:"క్రియాశీల హెచ్చరికలు", mr:"सक्रिय सूचना", gu:"સક્રિય ચેતવણીઓ", kn:"ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು", ml:"സജീവ മുന്നറിയിപ്പുകൾ" },

  // ── Helmet modal ──
  "hl.yes": { en:"Yes, helmet on", hi:"हाँ पहना", bn:"হ্যাঁ পরেছি", ta:"ஆம், அணிந்துள்ளேன்", te:"అవును, ధరించాను", mr:"होय, घातला आहे", gu:"હા, પહેર્યું છે", kn:"ಹೌದು, ಧರಿಸಿದ್ದೇನೆ", ml:"അതെ, ധരിച്ചു" },

  // ── Quick Actions on Home (SOS, Trip, Find Mech) ──
  "qa.sos":      { en:"SOS", hi:"SOS", bn:"SOS", ta:"SOS", te:"SOS", mr:"SOS", gu:"SOS", kn:"SOS", ml:"SOS" },
  "qa.sos.sub":  { en:"Family cascade", hi:"परिवार को कॉल", bn:"পরিবার কে কল", ta:"குடும்பத்திற்கு அழைப்பு", te:"కుటుంబానికి కాల్", mr:"कुटुंबाला कॉल", gu:"પરિવારને કૉલ", kn:"ಕುಟುಂಬಕ್ಕೆ ಕರೆ", ml:"കുടുംബത്തെ വിളിക്കും" },
  "qa.sos.aria": { en:"Emergency — Chitti calls family, never police", hi:"आपात — Chitti परिवार को बुलाएगी, पुलिस को नहीं", bn:"জরুরী — Chitti পরিবারকে ডাকবে, পুলিশকে নয়", ta:"அவசரம் — Chitti குடும்பத்தை அழைக்கும்", te:"అత్యవసరం — Chitti కుటుంబాన్ని పిలుస్తుంది", mr:"आणीबाणी — Chitti कुटुंबाला बोलावेल", gu:"કટોકટી — Chitti પરિવારને બોલાવશે", kn:"ತುರ್ತು — Chitti ಕುಟುಂಬವನ್ನು ಕರೆಯುತ್ತದೆ", ml:"അടിയന്തരം — Chitti കുടുംബത്തെ വിളിക്കും" },
  "qa.trip":     { en:"Trip ready?", hi:"Trip तैयार?", bn:"ট্রিপ রেডি?", ta:"பயணம் தயார்?", te:"ట్రిప్ రెడీ?", mr:"ट्रिप तयार?", gu:"ટ્રિપ તૈયાર?", kn:"ಪ್ರಯಾಣ ಸಿದ್ಧ?", ml:"യാത്ര തയ്യാർ?" },
  "qa.trip.sub": { en:"30-sec sweep", hi:"30-sec जांच", bn:"৩০-সেকেন্ড চেক", ta:"30 விநாடி சோதனை", te:"30 సెకన్ల చెక్", mr:"३० सेकंद तपासणी", gu:"૩૦ સેકન્ડ ચેક", kn:"30 ಸೆಕೆಂಡ್ ಚೆಕ್", ml:"30 സെക്കൻഡ് പരിശോധന" },
  "qa.trip.aria":{ en:"Pre-trip readiness check", hi:"पहले-trip तैयारी जांच", bn:"ট্রিপ-পূর্ব প্রস্তুতি চেক", ta:"பயணத்திற்கு முன் தயார்-நிலை சோதனை", te:"ట్రిప్ ముందు సిద్ధత చెక్", mr:"ट्रिप-पूर्व तयारी तपासणी", gu:"ટ્રિપ પૂર્વ તૈયારી ચેક", kn:"ಪ್ರವಾಸ-ಪೂರ್ವ ಸಿದ್ಧತೆ ಪರಿಶೀಲನೆ", ml:"യാത്രയ്ക്ക് മുമ്പുള്ള പരിശോധന" },
  "qa.mech":     { en:"Find mech", hi:"मेकैनिक", bn:"মেকানিক", ta:"மெக்கானிக்", te:"మెకానిక్", mr:"मेकॅनिक", gu:"મિકેનિક", kn:"ಮೆಕಾನಿಕ್", ml:"മെക്കാനിക്" },
  "qa.mech.sub": { en:"Community-rated", hi:"भरोसेमंद", bn:"বিশ্বস্ত", ta:"நம்பிக்கையான", te:"నమ్మదగిన", mr:"विश्वासू", gu:"વિશ્વસનીય", kn:"ನಂಬಿಗಸ್ತ", ml:"വിശ്വസനീയം" },
  "qa.mech.aria":{ en:"Find a trusted mechanic", hi:"भरोसेमंद मेकैनिक ढूंढो", bn:"বিশ্বস্ত মেকানিক খুঁজুন", ta:"நம்பிக்கையான மெக்கானிக் தேடு", te:"నమ్మదగిన మెకానిక్ వెతకండి", mr:"विश्वासू मेकॅनिक शोधा", gu:"વિશ્વસનીય મિકેનિક શોધો", kn:"ನಂಬಿಕಸ್ತ ಮೆಕಾನಿಕ್ ಹುಡುಕಿ", ml:"വിശ്വസനീയ മെക്കാനിക്കിനെ കണ്ടെത്തുക" },

  // ── Health Score widget ──
  "hs.lbl":  { en:"Health", hi:"सेहत", bn:"স্বাস্থ্য", ta:"நலம்", te:"ఆరోగ్యం", mr:"आरोग्य", gu:"સ્વાસ્થ્ય", kn:"ಆರೋಗ್ಯ", ml:"ആരോഗ്യം" },
  "hs.aria": { en:"Vehicle Health Score", hi:"वाहन स्वास्थ्य स्कोर", bn:"যানবাহন স্বাস্থ্য স্কোর", ta:"வாகன ஆரோக்கியக் காரக்கணக்கு", te:"వాహన ఆరోగ్య స్కోర్", mr:"वाहन आरोग्य स्कोअर", gu:"વાહન સ્વાસ્થ્ય સ્કોર", kn:"ವಾಹನ ಆರೋಗ್ಯ ಸ್ಕೋರ್", ml:"വാഹന ആരോഗ്യ സ്കോർ" },

  // ── Feedback panel mic + placeholder ──
  "fb.ph":      { en:"How was this feature? Write or speak…", hi:"यह feature कैसा रहा? लिखो या बोलो…", bn:"এই ফিচার কেমন? লিখুন বা বলুন…", ta:"இந்த அம்சம் எப்படி? எழுதவும் அல்லது பேசவும்…", te:"ఈ ఫీచర్ ఎలా ఉంది? రాయండి లేదా మాట్లాడండి…", mr:"हा फीचर कसा वाटला? लिहा किंवा बोला…", gu:"આ ફીચર કેવું? લખો કે બોલો…", kn:"ಈ ಫೀಚರ್ ಹೇಗಿತ್ತು? ಬರೆಯಿರಿ ಅಥವಾ ಮಾತಾಡಿ…", ml:"ഈ ഫീച്ചർ എങ്ങനെ? എഴുതൂ അല്ലെങ്കിൽ പറയൂ…" },
  "fb.mic":     { en:"Speak", hi:"बोलो", bn:"বলো", ta:"பேசு", te:"మాట్లాడండి", mr:"बोला", gu:"બોલો", kn:"ಮಾತಾಡಿ", ml:"പറയൂ" },
  "fb.mic.aria":{ en:"Speak your feedback", hi:"बोल कर feedback दो", bn:"কথা বলে feedback দিন", ta:"பேசி feedback கொடு", te:"మాట్లాడి feedback ఇవ్వండి", mr:"बोलून feedback द्या", gu:"બોલીને feedback આપો", kn:"ಮಾತಾಡಿ feedback ನೀಡಿ", ml:"പറഞ്ഞ് feedback നൽകൂ" },
  "fb.mic.unavailable": { en:"Voice not available on this browser. Please type.", hi:"इस browser में voice नहीं है। लिख कर भेजें।", bn:"এই ব্রাউজারে ভয়েস নেই। লিখে পাঠান।", ta:"இந்த browser-இல் voice இல்லை. தட்டச்சு செய்யவும்.", te:"ఈ browser-లో voice లేదు. టైప్ చేయండి.", mr:"या browser मध्ये voice नाही. लिहा.", gu:"આ browser માં voice નથી. લખીને મોકલો.", kn:"ಈ browser-ನಲ್ಲಿ voice ಇಲ್ಲ. ಟೈಪ್ ಮಾಡಿ.", ml:"ഈ browser-ൽ voice ഇല്ല. ടൈപ്പ് ചെയ്യൂ." },

  // ── 📸 Photo Diagnose ──
  "ph.title":  { en:"Photo Diagnose", hi:"📸 फोटो जांच", bn:"📸 ছবি দিয়ে নির্ণয়", ta:"📸 புகைப்பட பரிசோதனை", te:"📸 ఫోటో పరీక్ష", mr:"📸 फोटो तपासणी", gu:"📸 ફોટો તપાસ", kn:"📸 ಫೋಟೋ ತಪಾಸಣೆ", ml:"📸 ഫോട്ടോ പരിശോധന" },
  "ph.sub":    { en:"Open the camera. Take a photo of any engine part, dashboard light, leak or tyre — Chitti will look and tell you what's wrong.", hi:"Camera खोलो। Engine का कोई part, dashboard light, leak ya tyre ki photo lo — Chitti dekh kar batayegi kya problem hai.", bn:"ক্যামেরা খুলুন। ইঞ্জিনের অংশ, ড্যাশবোর্ড লাইট, লিক বা টায়ারের ছবি তুলুন — Chitti দেখে বলবে কী সমস্যা।", ta:"கேமராவைத் திற. என்ஜின் பாகம், டாஷ்போர்டு வெளிச்சம், கசிவு அல்லது டயர் புகைப்படம் எடு — Chitti பார்த்து சொல்லும்.", te:"కెమెరా తెరవండి. ఇంజిన్ భాగం, డాష్‌బోర్డ్ లైట్, లీక్ లేదా టైర్ ఫోటో తీయండి — Chitti చూసి చెబుతుంది.", mr:"कॅमेरा उघडा. इंजिनचा भाग, डॅशबोर्ड लाईट, गळती किंवा टायरचा फोटो काढा — Chitti बघून सांगेल.", gu:"કેમેરા ખોલો. એન્જિનનો ભાગ, ડેશબોર્ડ લાઇટ, લીક અથવા ટાયરનો ફોટો લો — Chitti જોઈને કહેશે.", kn:"ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ. ಎಂಜಿನ್ ಭಾಗ, ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಲೈಟ್, ಸೋರಿಕೆ ಅಥವಾ ಟೈರ್ ಫೋಟೋ ತೆಗೆಯಿರಿ — Chitti ನೋಡಿ ಹೇಳುತ್ತದೆ.", ml:"ക്യാമറ തുറക്കൂ. എഞ്ചിൻ ഭാഗം, ഡാഷ്ബോർഡ് ലൈറ്റ്, ലീക്ക് അല്ലെങ്കിൽ ടയർ ഫോട്ടോ എടുക്കൂ — Chitti നോക്കി പറയും." },
  "ph.cta":    { en:"📸 Take / upload photo", hi:"📸 फोटो लो / upload करो", bn:"📸 ছবি তুলুন / আপলোড করুন", ta:"📸 புகைப்படம் எடு / பதிவேற்று", te:"📸 ఫోటో తీయండి / అప్‌లోడ్ చేయండి", mr:"📸 फोटो काढा / अपलोड करा", gu:"📸 ફોટો લો / અપલોડ કરો", kn:"📸 ಫೋಟೋ ತೆಗೆಯಿರಿ / ಅಪ್‌ಲೋಡ್ ಮಾಡಿ", ml:"📸 ഫോട്ടോ എടുക്കൂ / അപ്‌ലോഡ് ചെയ്യൂ" },
  "ph.speak":  { en:"Photo diagnose. Take a photo of the engine, leak, tyre or dashboard light. Chitti will look and tell you.", hi:"फोटो जांच। Engine, leak, tyre ya dashboard light ki photo lo. Chitti dekh kar batayegi.", bn:"ছবি নির্ণয়। ইঞ্জিন, লিক, টায়ার বা ড্যাশবোর্ড লাইটের ছবি তুলুন। Chitti দেখে বলবে।", ta:"புகைப்பட பரிசோதனை. என்ஜின், கசிவு, டயர் அல்லது டாஷ்போர்டு வெளிச்சம் புகைப்படம் எடு. Chitti பார்த்து சொல்லும்.", te:"ఫోటో పరీక్ష. ఇంజిన్, లీక్, టైర్ లేదా డాష్‌బోర్డ్ లైట్ ఫోటో తీయండి. Chitti చూసి చెబుతుంది.", mr:"फोटो तपासणी. इंजिन, गळती, टायर किंवा डॅशबोर्ड लाईटचा फोटो काढा. Chitti बघून सांगेल.", gu:"ફોટો તપાસ. એન્જિન, લીક, ટાયર કે ડેશબોર્ડ લાઇટનો ફોટો લો. Chitti જોઈને કહેશે.", kn:"ಫೋಟೋ ತಪಾಸಣೆ. ಎಂಜಿನ್, ಸೋರಿಕೆ, ಟೈರ್ ಅಥವಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಲೈಟ್ ಫೋಟೋ ತೆಗೆಯಿರಿ. Chitti ನೋಡಿ ಹೇಳುತ್ತದೆ.", ml:"ഫോട്ടോ പരിശോധന. എഞ്ചിൻ, ലീക്ക്, ടയർ അല്ലെങ്കിൽ ഡാഷ്ബോർഡ് ലൈറ്റ് ഫോട്ടോ എടുക്കൂ. Chitti നോക്കി പറയും." },

  // ── 🎙️ Sound Diagnose ──
  "sd.title":     { en:"Sound Diagnose", hi:"🎙️ आवाज़ जांच", bn:"🎙️ শব্দ দিয়ে নির্ণয়", ta:"🎙️ ஒலி பரிசோதனை", te:"🎙️ శబ్దం పరీక్ష", mr:"🎙️ आवाज तपासणी", gu:"🎙️ અવાજ તપાસ", kn:"🎙️ ಶಬ್ದ ತಪಾಸಣೆ", ml:"🎙️ ശബ്ദ പരിശോധന" },
  "sd.sub":       { en:"Start the engine, record 10 seconds. Then describe the sound in 1-2 words — Chitti will recognise it.", hi:"Engine चालू करके 10 second record करो। फिर 1-2 शब्द में बताओ कैसी आवाज़ आ रही है — Chitti pehchanegi.", bn:"ইঞ্জিন চালু করে ১০ সেকেন্ড রেকর্ড করুন। তারপর ১-২ শব্দে বলুন কী শব্দ — Chitti চিনবে।", ta:"என்ஜினைத் தொடங்கி 10 விநாடிகள் பதிவு செய். பின் 1-2 சொற்களில் ஒலியைச் சொல் — Chitti அடையாளம் கண்டுபிடிக்கும்.", te:"ఇంజిన్ స్టార్ట్ చేసి 10 సెకన్లు రికార్డ్ చేయండి. తర్వాత 1-2 మాటల్లో శబ్దం చెప్పండి — Chitti గుర్తిస్తుంది.", mr:"इंजिन सुरू करा, १० सेकंद रेकॉर्ड करा. मग १-२ शब्दात आवाज सांगा — Chitti ओळखेल.", gu:"એન્જિન ચાલુ કરી ૧૦ સેકન્ડ રેકોર્ડ કરો. પછી ૧-૨ શબ્દમાં અવાજ કહો — Chitti ઓળખશે.", kn:"ಎಂಜಿನ್ ಆನ್ ಮಾಡಿ 10 ಸೆಕೆಂಡ್ ರೆಕಾರ್ಡ್ ಮಾಡಿ. ನಂತರ 1-2 ಪದಗಳಲ್ಲಿ ಶಬ್ದ ಹೇಳಿ — Chitti ಗುರುತಿಸುತ್ತದೆ.", ml:"എഞ്ചിൻ ഓൺ ചെയ്ത് 10 സെക്കൻഡ് റെക്കോർഡ് ചെയ്യൂ. പിന്നെ 1-2 വാക്കിൽ ശബ്ദം പറയൂ — Chitti തിരിച്ചറിയും." },
  "sd.rec":       { en:"🔴 Record 10 sec", hi:"🔴 10 second record करो", bn:"🔴 ১০ সেকেন্ড রেকর্ড", ta:"🔴 10 விநாடி பதிவு", te:"🔴 10 సెకన్లు రికార్డ్", mr:"🔴 १० सेकंद रेकॉर्ड", gu:"🔴 ૧૦ સેકન્ડ રેકોર્ડ", kn:"🔴 10 ಸೆಕೆಂಡ್ ರೆಕಾರ್ಡ್", ml:"🔴 10 സെക്കൻഡ് റെക്കോർഡ്" },
  "sd.desc.label":{ en:"How did the sound feel? (1-2 words)", hi:"आवाज़ कैसी लग रही है? (1-2 शब्द)", bn:"শব্দটা কেমন? (১-২ শব্দ)", ta:"ஒலி எப்படி இருந்தது? (1-2 சொற்கள்)", te:"శబ్దం ఎలా ఉంది? (1-2 మాటలు)", mr:"आवाज कसा वाटतोय? (१-२ शब्द)", gu:"અવાજ કેવો લાગે છે? (૧-૨ શબ્દ)", kn:"ಶಬ್ದ ಹೇಗಿತ್ತು? (1-2 ಪದಗಳು)", ml:"ശബ്ദം എങ്ങനെ ഉണ്ടായിരുന്നു? (1-2 വാക്കുകൾ)" },
  "sd.desc.ph":   { en:"chain rattle / engine knocking / brake squeal", hi:"chain कट-कट / engine घुर-घुर / brake चीख", bn:"চেইন কট-কট / ইঞ্জিন ঘর-ঘর / ব্রেক চিৎকার", ta:"செயின் கட்-கட் / என்ஜின் கர்ர் / பிரேக் சத்தம்", te:"చైన్ కట్-కట్ / ఇంజిన్ గర్-గర్ / బ్రేక్ చప్పుడు", mr:"chain कट-कट / engine घुर-घुर / brake चीक", gu:"chain કટ-કટ / engine ઘૂર-ઘૂર / brake ચીસ", kn:"chain ಕಟ್-ಕಟ್ / engine ಗುರ್-ಗುರ್ / brake ಶಬ್ದ", ml:"chain കട്-കട് / engine ഗുര്-ഗുര് / brake ശബ്ദം" },
  "sd.submit":    { en:"Ask Chitti ➜", hi:"Chitti से पूछो ➜", bn:"Chitti কে জিজ্ঞাসা ➜", ta:"Chitti யிடம் கேள் ➜", te:"Chitti ను అడగండి ➜", mr:"Chitti ला विचारा ➜", gu:"Chitti ને પૂછો ➜", kn:"Chitti ಗೆ ಕೇಳಿ ➜", ml:"Chitti യോട് ചോദിക്കൂ ➜" },
  "sd.speak":     { en:"Sound diagnose. Start the engine, record 10 seconds, then ask Chitti.", hi:"आवाज़ जांच। Engine चालू करके 10 second record karo, phir Chitti se pucho.", bn:"শব্দ নির্ণয়। ইঞ্জিন চালু করে ১০ সেকেন্ড রেকর্ড করুন, তারপর Chitti কে জিজ্ঞাসা করুন।", ta:"ஒலி பரிசோதனை. என்ஜினைத் தொடங்கி 10 விநாடி பதிவு, பின் Chitti யிடம் கேள்.", te:"శబ్దం పరీక్ష. ఇంజిన్ స్టార్ట్ చేసి 10 సెకన్లు రికార్డ్, తర్వాత Chitti ను అడగండి.", mr:"आवाज तपासणी. इंजिन सुरू करा, १० सेकंद रेकॉर्ड, मग Chitti ला विचारा.", gu:"અવાજ તપાસ. એન્જિન ચાલુ કરી ૧૦ સેકન્ડ રેકોર્ડ, પછી Chitti ને પૂછો.", kn:"ಶಬ್ದ ತಪಾಸಣೆ. ಎಂಜಿನ್ ಆನ್ ಮಾಡಿ 10 ಸೆಕೆಂಡ್ ರೆಕಾರ್ಡ್, ನಂತರ Chitti ಗೆ ಕೇಳಿ.", ml:"ശബ്ദ പരിശോധന. എഞ്ചിൻ ഓൺ ചെയ്ത് 10 സെക്കൻഡ് റെക്കോർഡ്, പിന്നെ Chitti യോട് ചോദിക്കൂ." },

  // ── 💰 Fair Price Guard ──
  "fp.title":      { en:"Fair Price Guard", hi:"💰 सही दाम जांच", bn:"💰 ন্যায্য দাম চেক", ta:"💰 சரியான விலை சோதனை", te:"💰 న్యాయమైన ధర చెక్", mr:"💰 योग्य किंमत तपासणी", gu:"💰 વાજબી કિંમત તપાસ", kn:"💰 ನ್ಯಾಯಯುತ ಬೆಲೆ ಪರಿಶೀಲನೆ", ml:"💰 ന്യായവില പരിശോധന" },
  "fp.sub":        { en:"Did the mechanic give you a quote? Write it here — Chitti will tell you if it's fair or overcharged.", hi:"Mechanic ne quote diya? Yahaan likho — Chitti batayegi sahi daam hai ya overcharge.", bn:"মেকানিক কোট দিয়েছে? এখানে লিখুন — Chitti বলবে ন্যায্য দাম কি না।", ta:"மெக்கானிக் விலை சொன்னாரா? இங்கே எழுது — Chitti சொல்லும் சரியா மிகையா.", te:"మెకానిక్ ధర చెప్పారా? ఇక్కడ రాయండి — Chitti న్యాయమైనదా అని చెబుతుంది.", mr:"मेकॅनिकने quote दिले? इथे लिहा — Chitti सांगेल योग्य की जास्त.", gu:"મિકેનિકે ભાવ આપ્યો? અહીં લખો — Chitti કહેશે વાજબી છે કે વધારે.", kn:"ಮೆಕಾನಿಕ್ ಬೆಲೆ ಹೇಳಿದರೇ? ಇಲ್ಲಿ ಬರೆಯಿರಿ — Chitti ಹೇಳುತ್ತದೆ ನ್ಯಾಯವೋ ಹೆಚ್ಚೋ.", ml:"മെക്കാനിക് വില പറഞ്ഞോ? ഇവിടെ എഴുതൂ — Chitti പറയും ന്യായമോ കൂടുതലോ." },
  "fp.what.label": { en:"What is the work?", hi:"क्या काम है?", bn:"কী কাজ?", ta:"என்ன வேலை?", te:"ఏ పని?", mr:"काय काम?", gu:"શું કામ?", kn:"ಏನು ಕೆಲಸ?", ml:"എന്ത് ജോലി?" },
  "fp.what.ph":    { en:"chain replace, oil change, clutch plate, etc.", hi:"chain बदलना, oil change, clutch plate, etc.", bn:"চেইন বদল, oil চেঞ্জ, ক্লাচ প্লেট ইত্যাদি", ta:"செயின் மாற்றம், எண்ணெய் மாற்றம், கிளட்ச் முதலியன", te:"చైన్ మార్పు, ఆయిల్ చేంజ్, క్లచ్ ప్లేట్ మొదలైనవి", mr:"chain बदल, oil बदल, क्लच प्लेट इत्यादी", gu:"chain બદલવી, oil બદલવો, ક્લચ પ્લેટ વગેરે", kn:"chain ಬದಲಿಸುವುದು, oil ಬದಲಿಸುವುದು ಇತ್ಯಾದಿ", ml:"chain മാറ്റം, oil മാറ്റം, clutch plate മുതലായവ" },
  "fp.quote.label":{ en:"Mechanic's quote (₹)", hi:"Mechanic का quote (₹)", bn:"মেকানিকের কোট (₹)", ta:"மெக்கானிக் கோட் (₹)", te:"మెకానిక్ కోట్ (₹)", mr:"मेकॅनिकचे quote (₹)", gu:"મિકેનિકનો ભાવ (₹)", kn:"ಮೆಕಾನಿಕ್ ಕೋಟ್ (₹)", ml:"മെക്കാനിക്കിന്റെ കോട്ട് (₹)" },
  "fp.cta":        { en:"Check with Chitti ➜", hi:"Chitti से check करो ➜", bn:"Chitti দিয়ে চেক ➜", ta:"Chitti யுடன் சோதி ➜", te:"Chitti తో చెక్ ➜", mr:"Chitti ने तपास ➜", gu:"Chitti થી તપાસો ➜", kn:"Chitti ಯೊಂದಿಗೆ ಚೆಕ್ ➜", ml:"Chitti യിൽ ചെക്ക് ➜" },
  "fp.speak":      { en:"Fair price guard. Tell me what the mechanic quoted — Chitti will check.", hi:"Fair price guard. Mechanic ne kitne ka quote diya, Chitti se check karo.", bn:"ন্যায্য দাম চেক। মেকানিক কত বলেছে — Chitti চেক করবে।", ta:"சரியான விலை சோதனை. மெக்கானிக் என்ன சொன்னார் — Chitti சோதிக்கும்.", te:"న్యాయమైన ధర చెక్. మెకానిక్ ఎంత చెప్పాడు — Chitti చెక్ చేస్తుంది.", mr:"योग्य किंमत तपासणी. मेकॅनिकने काय quote दिले — Chitti तपासेल.", gu:"વાજબી કિંમત તપાસ. મિકેનિકે કેટલા કહ્યા — Chitti તપાસશે.", kn:"ನ್ಯಾಯ ಬೆಲೆ ಪರಿಶೀಲನೆ. ಮೆಕಾನಿಕ್ ಎಷ್ಟು ಹೇಳಿದರು — Chitti ಪರಿಶೀಲಿಸುತ್ತದೆ.", ml:"ന്യായവില പരിശോധന. മെക്കാനിക് എത്ര പറഞ്ഞു — Chitti പരിശോധിക്കും." },
  "fp.demo.what":  { en:"Chain replace", hi:"Chain बदलना", bn:"চেইন বদল", ta:"செயின் மாற்றம்", te:"చైన్ మార్పు", mr:"Chain बदल", gu:"Chain બદલવી", kn:"Chain ಬದಲಿಸುವುದು", ml:"Chain മാറ്റം" },

  // ── 🗺️ Find Mechanic ──
  "fm.title":     { en:"Find a trusted mechanic", hi:"🗺️ भरोसेमंद मेकैनिक ढूंढो", bn:"🗺️ বিশ্বস্ত মেকানিক খুঁজুন", ta:"🗺️ நம்பிக்கையான மெக்கானிக் தேடு", te:"🗺️ నమ్మదగిన మెకానిక్", mr:"🗺️ विश्वासू मेकॅनिक शोधा", gu:"🗺️ વિશ્વસનીય મિકેનિક શોધો", kn:"🗺️ ನಂಬಿಗಸ್ತ ಮೆಕಾನಿಕ್", ml:"🗺️ വിശ്വസനീയ മെക്കാനിക്" },
  "fm.sub":       { en:"Give your pincode — Chitti will find trusted mechanics nearby + open Google Maps.", hi:"Pincode dijiye — Chitti aapke area ke trusted mechanics dhundhegi + Google Maps mein khol degi.", bn:"আপনার পিনকোড দিন — Chitti কাছাকাছি বিশ্বস্ত মেকানিক খুঁজে Google Maps-এ খুলবে।", ta:"உங்கள் pincode தாருங்கள் — Chitti அருகிலுள்ள நம்பிக்கையான மெக்கானிக்குகளை Google Maps-இல் காட்டும்.", te:"మీ pincode ఇవ్వండి — Chitti దగ్గర్లోని నమ్మదగిన మెకానిక్‌లను Google Maps లో చూపిస్తుంది.", mr:"तुमचा pincode द्या — Chitti जवळचे विश्वासू मेकॅनिक Google Maps मध्ये दाखवेल.", gu:"તમારો pincode આપો — Chitti નજીકના વિશ્વસનીય મિકેનિક Google Maps માં બતાવશે.", kn:"ನಿಮ್ಮ pincode ನೀಡಿ — Chitti ಹತ್ತಿರದ ನಂಬಿಗಸ್ತ ಮೆಕಾನಿಕ್‌ಗಳನ್ನು Google Maps ನಲ್ಲಿ ತೋರಿಸುತ್ತದೆ.", ml:"നിങ്ങളുടെ pincode നൽകൂ — Chitti അടുത്തുള്ള മെക്കാനിക്കിനെ Google Maps-ൽ കാണിക്കും." },
  "fm.pin.label": { en:"Pincode (optional)", hi:"Pincode (वैकल्पिक)", bn:"পিনকোড (ঐচ্ছিক)", ta:"Pincode (விருப்பம்)", te:"Pincode (ఐచ్ఛికం)", mr:"Pincode (ऐच्छिक)", gu:"Pincode (વૈકલ્પિક)", kn:"Pincode (ಐಚ್ಛಿಕ)", ml:"Pincode (ഓപ്ഷണൽ)" },
  "fm.cta":       { en:"🗺️ Find mechanic", hi:"🗺️ Mechanic ढूंढो", bn:"🗺️ মেকানিক খুঁজুন", ta:"🗺️ மெக்கானிக் தேடு", te:"🗺️ మెకానిక్ వెతకండి", mr:"🗺️ मेकॅनिक शोधा", gu:"🗺️ મિકેનિક શોધો", kn:"🗺️ ಮೆಕಾನಿಕ್ ಹುಡುಕಿ", ml:"🗺️ മെക്കാനിക്കിനെ കണ്ടെത്തുക" },
  "fm.speak":     { en:"Find mechanic. Give pincode, Chitti will find trusted mechanics nearby.", hi:"Find mechanic. Pincode bataiye, Chitti aapke area ke trusted mechanics dhundhegi.", bn:"মেকানিক খুঁজুন। পিনকোড দিন, Chitti কাছাকাছি বিশ্বস্ত মেকানিক খুঁজবে।", ta:"மெக்கானிக் தேடு. Pincode சொல்லு, Chitti அருகிலுள்ள மெக்கானிக்குகளைத் தேடும்.", te:"మెకానిక్ వెతకండి. Pincode చెప్పండి, Chitti దగ్గర్లోని మెకానిక్‌లను వెతుకుతుంది.", mr:"मेकॅनिक शोधा. Pincode सांगा, Chitti जवळचे मेकॅनिक शोधेल.", gu:"મિકેનિક શોધો. Pincode કહો, Chitti નજીકના મિકેનિક શોધશે.", kn:"ಮೆಕಾನಿಕ್ ಹುಡುಕಿ. Pincode ಹೇಳಿ, Chitti ಹತ್ತಿರದ ಮೆಕಾನಿಕ್‌ಗಳನ್ನು ಹುಡುಕುತ್ತದೆ.", ml:"മെക്കാനിക്കിനെ കണ്ടെത്തുക. Pincode പറയൂ, Chitti അടുത്തുള്ളവരെ കണ്ടെത്തും." },

  // ── 📓 Service Logbook ──
  "lg.title":   { en:"Service Logbook", hi:"📓 सर्विस लॉगबुक", bn:"📓 সার্ভিস লগবুক", ta:"📓 சர்வீஸ் பதிவேடு", te:"📓 సర్వీస్ లాగ్‌బుక్", mr:"📓 सर्व्हिस लॉगबुक", gu:"📓 સર્વિસ લોગબુક", kn:"📓 ಸರ್ವೀಸ್ ಲಾಗ್‌ಬುಕ್", ml:"📓 സർവീസ് ലോഗ്ബുക്ക്" },
  "lg.sub":     { en:"Log every repair / service here. Your vehicle's medical history — gets you more money at resale.", hi:"Har repair / service yahaan log karein. Aapki gaadi ka medical history — resale time pe zyada paisa milta hai.", bn:"প্রতিটি মেরামত এখানে লগ করুন। আপনার গাড়ির মেডিকেল হিস্টরি — বিক্রির সময় বেশি দাম পাবেন।", ta:"ஒவ்வொரு பழுதுபார்ப்பையும் இங்கே பதிவு செய். உங்கள் வாகனத்தின் மருத்துவ வரலாறு — மறுவிற்பனையில் கூடுதல் பணம்.", te:"ప్రతి రిపేర్ ఇక్కడ లాగ్ చేయండి. మీ వాహన మెడికల్ హిస్టరీ — రీసేల్ లో ఎక్కువ డబ్బు.", mr:"प्रत्येक दुरुस्ती इथे लॉग करा. तुमच्या वाहनाची मेडिकल हिस्ट्री — रिसेलमध्ये जास्त पैसे.", gu:"દરેક રિપેર અહીં લોગ કરો. તમારી ગાડીની મેડિકલ હિસ્ટ્રી — રિસેલમાં વધુ પૈસા.", kn:"ಪ್ರತಿ ರಿಪೇರ್ ಇಲ್ಲಿ ಲಾಗ್ ಮಾಡಿ. ನಿಮ್ಮ ವಾಹನದ ಮೆಡಿಕಲ್ ಹಿಸ್ಟರಿ — ರೀಸೇಲ್‌ನಲ್ಲಿ ಹೆಚ್ಚು ಹಣ.", ml:"എല്ലാ റിപ്പയറും ഇവിടെ ലോഗ് ചെയ്യൂ. നിങ്ങളുടെ വാഹനത്തിന്റെ മെഡിക്കൽ ഹിസ്റ്ററി — റീസെയിലിൽ കൂടുതൽ പണം." },
  "lg.add_cta": { en:"➕ Add service entry", hi:"➕ नई सर्विस जोड़ें", bn:"➕ নতুন সার্ভিস যোগ", ta:"➕ புதிய சர்வீஸ் சேர்", te:"➕ కొత్త సర్వీస్ జోడించండి", mr:"➕ नवीन सर्व्हिस जोडा", gu:"➕ નવી સર્વિસ ઉમેરો", kn:"➕ ಹೊಸ ಸರ್ವೀಸ್ ಸೇರಿಸಿ", ml:"➕ പുതിയ സർവീസ് ചേർക്കൂ" },
  "lg.date":    { en:"Date", hi:"तारीख", bn:"তারিখ", ta:"தேதி", te:"తేదీ", mr:"तारीख", gu:"તારીખ", kn:"ದಿನಾಂಕ", ml:"തീയതി" },
  "lg.km":      { en:"Odometer (KM)", hi:"Odometer (KM)", bn:"ওডোমিটার (KM)", ta:"ஓடோமீட்டர் (KM)", te:"ఓడోమీటర్ (KM)", mr:"ओडोमीटर (KM)", gu:"ઓડોમીટર (KM)", kn:"ಓಡೋಮೀಟರ್ (KM)", ml:"ഓഡോമീറ്റർ (KM)" },
  "lg.what":    { en:"What work was done?", hi:"क्या काम हुआ?", bn:"কী কাজ হলো?", ta:"என்ன வேலை?", te:"ఏ పని జరిగింది?", mr:"काय काम झालं?", gu:"શું કામ થયું?", kn:"ಏನು ಕೆಲಸ ಆಯಿತು?", ml:"എന്ത് ജോലി ചെയ്തു?" },
  "lg.what.ph": { en:"oil change + chain lube + tyre PSI", hi:"oil change + chain lube + tyre PSI", bn:"oil change + chain lube + tyre PSI", ta:"oil change + chain lube + tyre PSI", te:"oil change + chain lube + tyre PSI", mr:"oil change + chain lube + tyre PSI", gu:"oil change + chain lube + tyre PSI", kn:"oil change + chain lube + tyre PSI", ml:"oil change + chain lube + tyre PSI" },
  "lg.cost":    { en:"Total cost (₹)", hi:"कुल खर्च (₹)", bn:"মোট খরচ (₹)", ta:"மொத்த செலவு (₹)", te:"మొత్తం ఖర్చు (₹)", mr:"एकूण खर्च (₹)", gu:"કુલ ખર્ચ (₹)", kn:"ಒಟ್ಟು ವೆಚ್ಚ (₹)", ml:"ആകെ ചെലവ് (₹)" },
  "lg.mech":    { en:"Mechanic / shop (optional)", hi:"Mechanic / shop (वैकल्पिक)", bn:"মেকানিক / দোকান (ঐচ্ছিক)", ta:"மெக்கானிக் / கடை (விருப்பம்)", te:"మెకానిక్ / షాప్ (ఐచ్ఛికం)", mr:"मेकॅनिक / दुकान (ऐच्छिक)", gu:"મિકેનિક / દુકાન (વૈકલ્પિક)", kn:"ಮೆಕಾನಿಕ್ / ಅಂಗಡಿ (ಐಚ್ಛಿಕ)", ml:"മെക്കാനിക് / കട (ഓപ്ഷണൽ)" },
  "lg.mech.ph": { en:"Hero ASS Phase 2", hi:"Hero ASS Phase 2", bn:"Hero ASS Phase 2", ta:"Hero ASS Phase 2", te:"Hero ASS Phase 2", mr:"Hero ASS Phase 2", gu:"Hero ASS Phase 2", kn:"Hero ASS Phase 2", ml:"Hero ASS Phase 2" },
  "lg.save":    { en:"💾 Save entry", hi:"💾 सेव करो", bn:"💾 সেভ করুন", ta:"💾 சேமி", te:"💾 సేవ్ చేయండి", mr:"💾 जतन करा", gu:"💾 સેવ કરો", kn:"💾 ಉಳಿಸಿ", ml:"💾 സേവ് ചെയ്യൂ" },

  // ── Speech prompts for existing buttons (so they read in user's language) ──
  "mb.speak.form": { en:"Tell Chitti your bike's make, model, reg number and year", hi:"अपनी bike ka make, model, reg number aur saal Chitti ko bataiye", bn:"আপনার বাইকের make, model, reg নম্বর এবং বছর Chitti কে বলুন", ta:"உங்கள் பைக்கின் make, model, reg number, year-ஐ Chitti யிடம் சொல்லுங்கள்", te:"మీ బైక్ make, model, reg number, year Chitti కి చెప్పండి", mr:"तुमच्या बाईकचे make, model, reg number, year Chitti ला सांगा", gu:"તમારી બાઈકના make, model, reg number, year Chitti ને કહો", kn:"ನಿಮ್ಮ ಬೈಕ್‌ನ make, model, reg number, year Chitti ಗೆ ಹೇಳಿ", ml:"നിങ്ങളുടെ ബൈക്കിന്റെ make, model, reg number, year Chitti യോട് പറയൂ" },
  "mb.speak.obd":  { en:"OBD2 scan. Write the error code, Chitti will explain in your language.", hi:"OBD2 scan. Error code likhiye, Chitti use aapki bhasha mein samjhayegi.", bn:"OBD2 স্ক্যান। Error code লিখুন, Chitti আপনার ভাষায় বোঝাবে।", ta:"OBD2 ஸ்கேன். Error code எழுதவும், Chitti உங்கள் மொழியில் விளக்கும்.", te:"OBD2 స్కాన్. Error code రాయండి, Chitti మీ భాషలో వివరిస్తుంది.", mr:"OBD2 स्कॅन. Error code लिहा, Chitti तुमच्या भाषेत समजावेल.", gu:"OBD2 સ્કેન. Error code લખો, Chitti તમારી ભાષામાં સમજાવશે.", kn:"OBD2 ಸ್ಕ್ಯಾನ್. Error code ಬರೆಯಿರಿ, Chitti ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ವಿವರಿಸುತ್ತದೆ.", ml:"OBD2 സ്കാൻ. Error code എഴുതൂ, Chitti നിങ്ങളുടെ ഭാഷയിൽ വിശദീകരിക്കും." },
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
console.log('Injected ' + injected + ' world-class translations across 9 language blocks.');
