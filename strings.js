/* strings.js — single source of truth for every visible UI string on
   chitti_vaani.html. Sire 2026-05-23 GAP 6: "select Telugu, zero
   English remains. select Bengali, zero English remains."

   Coverage: tab labels, Settings (Battery / Share / Privacy / Products
   / General), Talk-tab expanders, Grandparent bar, QR / Settings
   actions, and the shared error / onboarding text.

   Single function — window.updateAllStrings(lang) — runs through every
   element with [data-vai-i18n="key"] and rewrites its textContent from
   the matching language bag. Called by:
     • vaiApplyStrings(lang) on chitti_vaani.html
     • the existing window.dispatchEvent(chitti:langchange) listener
*/
(function () {
  "use strict";

  // Each key is the value of data-vai-i18n="…" on the element. Adding
  // a new visible string is a 3-step process:
  //   1. Tag the HTML node with data-vai-i18n="namespace.key"
  //   2. Add the key + EN baseline below
  //   3. Add translations under each language

  const STRINGS = {
    en: {
      // Tabs
      "tab.talk":"Speak","tab.act":"Do","tab.vault":"Vault","tab.circle":"Family","tab.settings":"Settings","tab.sos":"SOS",
      // Talk-tab expanders
      "talk.quick":"Quick actions","talk.quick.sub":"tap to expand",
      "talk.recent":"Recent","talk.recent.sub":"tap to expand",
      // Settings — top
      "set.title":"Settings","set.back":"← Back",
      // Battery
      "set.battery":"Chitti Battery",
      "set.battery.note":"Every question costs tokens on Chitti's server. Top up to ask more questions later.",
      // Share
      "set.share":"Share Chitti","set.share.wa":"WhatsApp","set.share.copy":"Copy link","set.share.share":"Share",
      // Privacy
      "set.privacy":"Privacy & data",
      "set.dpdp.title":"DPDP Act 2023","set.dpdp.sub":"Read the full consent",
      "set.perm.mic":"Microphone","set.perm.contacts":"Contacts","set.perm.storage":"Storage","set.perm.location":"Location",
      // Products
      "set.products":"All Chitti products","set.products.sub":"Tap a card to expand · 🔊 listen · ▶ Demo · 👍 like · 👎 send per-card feedback",
      // General
      "set.general":"General","set.font":"Font size","set.voicespeed":"Voice speed","set.lang":"Language","set.caregiver":"👨‍👩‍👧 Caregiver panel",
      // Header buttons
      "hdr.howto":"How to use","hdr.gp":"Grandparent","hdr.settings":"Settings",
      // Errors / onboarding (mirrors VAI_I18N inside chitti_vaani.html)
      "set.battery.title":"Chitti Battery","set.battery.queries":"queries left","set.battery.days":"Est. {{n}} days","set.demo":"Demo","mb.title":"Chitti Mechanic Bike","mb.tag":"Your bike's best friend","mc.title":"Chitti Mechanic Car","mc.tag":"Your car's best friend","mb.tab.home":"Home","mb.tab.bike":"My Bike","mb.tab.docs":"Documents","mb.tab.alerts":"Alerts","mb.tab.ask":"Ask Chitti","mc.tab.home":"Home","mc.tab.car":"My Car","mc.tab.docs":"Documents","mc.tab.alerts":"Alerts","mc.tab.ask":"Ask Chitti","mb.empty.title":"Add your bike","mb.empty.sub":"Speak: My bike Hero Splendor UP32AB1234 2018 red","mc.empty.title":"Add your car","mc.empty.sub":"Speak: My car Maruti Swift DL3CAB5678 2020 white","mb.health.good":"Healthy","mb.health.warn":"Pay attention","mb.health.bad":"Urgent","mb.helmet":"Wore your helmet? Say yes and Chitti will open Maps","mb.safety.daily":"Daily safety tip","mb.fairprice":"Fair price range","mb.diy":"Can fix at home?","mb.ask.hint":"Tell Chitti what is wrong — chain noise, mileage drop, will not start, anything","na.title":"Chitti News AI + Coach","na.tag":"AI news + dynamic AI learning for every Indian","na.mode.news":"AI News","na.mode.coach":"AI Coach","na.profile.title":"Tell Chitti about you","na.profile.q1":"What do you do?","na.profile.q1.ph":"Interior decorator, farmer, cricketer, anything","na.profile.q2":"How much do you know about AI?","na.profile.l0":"Nothing yet","na.profile.l1":"A little","na.profile.l2":"Good","na.profile.l3":"Strong","na.profile.save":"Save profile","na.story.explain":"Explain to me","na.story.pin":"Pin","na.story.sources":"Source","na.coach.start":"Start learning","na.coach.cert":"See certificate","na.lesson.task":"Try this now","na.cert.title":"Sahayai AI Certificate","na.cert.next":"Recommended next certifications","na.unknown":"Chitti has not seen this profession yet — researching now","err.network":"Chitti could not hear. Try once more.","err.retry":"Try again",
    },
    hi: {
      "tab.talk":"बोलें","tab.act":"करें","tab.vault":"दस्तावेज़","tab.circle":"अपने","tab.settings":"सेटिंग्स","tab.sos":"SOS",
      "talk.quick":"त्वरित कार्य","talk.quick.sub":"खोलने के लिए दबाएँ",
      "talk.recent":"हाल का","talk.recent.sub":"खोलने के लिए दबाएँ",
      "set.title":"सेटिंग्स","set.back":"← वापस",
      "set.battery":"Chitti बैटरी",
      "set.battery.note":"हर सवाल पर Chitti के सर्वर पर टोकन खर्च होते हैं। टॉप-अप से और सवाल पूछ सकते हैं।",
      "set.share":"Chitti साझा","set.share.wa":"WhatsApp","set.share.copy":"लिंक कॉपी","set.share.share":"साझा",
      "set.privacy":"गोपनीयता और डेटा",
      "set.dpdp.title":"DPDP Act 2023","set.dpdp.sub":"पूरी सहमति पढ़ें",
      "set.perm.mic":"माइक्रोफ़ोन","set.perm.contacts":"संपर्क","set.perm.storage":"स्टोरेज","set.perm.location":"लोकेशन",
      "set.products":"सभी Chitti उत्पाद","set.products.sub":"कार्ड दबाएँ → खुलेगा · 🔊 सुनें · ▶ डेमो · 👍 अच्छा · 👎 इस कार्ड के लिए सुझाव",
      "set.general":"सामान्य","set.font":"फ़ॉन्ट आकार","set.voicespeed":"आवाज़ की गति","set.lang":"भाषा","set.caregiver":"👨‍👩‍👧 केयरगिवर पैनल",
      "hdr.howto":"कैसे उपयोग करें","hdr.gp":"बुज़ुर्ग मोड","hdr.settings":"सेटिंग्स","set.battery.title":"Chitti बैटरी","set.battery.queries":"सवाल बाकी","set.battery.days":"~{{n}} दिन","set.demo":"डेमो","mb.title":"Chitti Mechanic Bike","mb.tag":"आपकी बाइक का सबसे अच्छा दोस्त","mc.title":"Chitti Mechanic Car","mc.tag":"आपकी गाड़ी का सबसे अच्छा दोस्त","mb.tab.home":"घर","mb.tab.bike":"मेरी बाइक","mb.tab.docs":"कागज़ात","mb.tab.alerts":"चेतावनी","mb.tab.ask":"Chitti Mechanic से पूछो","mc.tab.home":"घर","mc.tab.car":"मेरी गाड़ी","mc.tab.docs":"कागज़ात","mc.tab.alerts":"चेतावनी","mc.tab.ask":"Chitti Mechanic से पूछो","mb.empty.title":"अपनी बाइक जोड़ें","mb.empty.sub":"बोलें — मेरी बाइक Hero Splendor UP32AB1234 2018 लाल","mc.empty.title":"अपनी गाड़ी जोड़ें","mc.empty.sub":"बोलें — मेरी गाड़ी Maruti Swift DL3CAB5678 2020 सफ़ेद","mb.health.good":"ठीक है","mb.health.warn":"ध्यान दो","mb.health.bad":"तुरंत देखो","mb.helmet":"हेलमेट पहना? हाँ बोलें तभी Maps खोलूंगी","mb.safety.daily":"आज की सुरक्षा सलाह","mb.fairprice":"सही दाम क्या है","mb.diy":"घर पे ठीक हो सकता है?","mb.ask.hint":"Chitti को बताइए क्या तकलीफ़ है","na.title":"Chitti News AI + Coach","na.tag":"AI ख़बरें + हर भारतीय के लिए AI सीखना","na.mode.news":"AI समाचार","na.mode.coach":"AI Coach","na.profile.title":"अपने बारे में Chitti को बताइए","na.profile.q1":"आप क्या करते हैं?","na.profile.q1.ph":"इंटीरियर डेकोरेटर · किसान · क्रिकेटर · कुछ भी","na.profile.q2":"AI के बारे में कितना जानते हो?","na.profile.l0":"बिल्कुल नहीं","na.profile.l1":"थोड़ा थोड़ा","na.profile.l2":"ठीक-ठाक","na.profile.l3":"बहुत अच्छा","na.profile.save":"मेरा प्रोफ़ाइल बचाओ","na.story.explain":"मुझे समझाओ","na.story.pin":"पिन","na.story.sources":"स्रोत","na.coach.start":"सीखना शुरू करो","na.coach.cert":"प्रमाणपत्र देखो","na.lesson.task":"अभी करके देखो","na.cert.title":"Sahayai AI Certificate","na.cert.next":"अगला सुझाव — असली मुफ़्त certifications","na.unknown":"यह पेशा Chitti के लिए नया है — अभी जान रही हूँ","err.network":"Chitti sun nahi payi — dobara bolein","err.retry":"फिर बोलें",
    },
    bn: {
      "tab.talk":"বলুন","tab.act":"কাজ","tab.vault":"নথি","tab.circle":"পরিজন","tab.settings":"সেটিংস","tab.sos":"SOS",
      "talk.quick":"দ্রুত কাজ","talk.quick.sub":"খুলতে আলতো চাপুন",
      "talk.recent":"সাম্প্রতিক","talk.recent.sub":"খুলতে আলতো চাপুন",
      "set.title":"সেটিংস","set.back":"← ফিরে",
      "set.battery":"Chitti ব্যাটারি",
      "set.battery.note":"প্রতি প্রশ্নের জন্য Chitti সার্ভারে টোকেন খরচ হয়। আরও প্রশ্ন জিজ্ঞাসা করতে টপ-আপ করুন।",
      "set.share":"Chitti শেয়ার","set.share.wa":"WhatsApp","set.share.copy":"লিংক কপি","set.share.share":"শেয়ার",
      "set.privacy":"গোপনীয়তা ও ডেটা",
      "set.dpdp.title":"DPDP আইন ২০২৩","set.dpdp.sub":"সম্পূর্ণ সম্মতি পড়ুন",
      "set.perm.mic":"মাইক্রোফোন","set.perm.contacts":"কন্টাক্ট","set.perm.storage":"স্টোরেজ","set.perm.location":"অবস্থান",
      "set.products":"সব Chitti পণ্য","set.products.sub":"কার্ড চাপুন → খুলবে · 🔊 শুনুন · ▶ ডেমো · 👍 ভালো · 👎 এই কার্ডের মতামত",
      "set.general":"সাধারণ","set.font":"ফন্ট সাইজ","set.voicespeed":"কণ্ঠের গতি","set.lang":"ভাষা","set.caregiver":"👨‍👩‍👧 কেয়ারগিভার প্যানেল",
      "hdr.howto":"কীভাবে ব্যবহার","hdr.gp":"বয়স্ক মোড","hdr.settings":"সেটিংস","set.battery.title":"Chitti ব্যাটারি","set.battery.queries":"প্রশ্ন বাকি","set.battery.days":"~{{n}} দিন","set.demo":"ডেমো","mb.title":"Chitti Mechanic Bike","mb.tag":"আপনার Bikeএর সেরা বন্ধু","mc.title":"Chitti Mechanic Car","mc.tag":"আপনার Carএর সেরা বন্ধু","mb.tab.home":"ঘর","mb.tab.bike":"আমার Bike","mb.tab.docs":"কাগজপত্র","mb.tab.alerts":"সতর্কতা","mb.tab.ask":"Chitti Mechanic কে জিজ্ঞাসা","mc.tab.home":"ঘর","mc.tab.car":"আমার Car","mc.tab.docs":"কাগজপত্র","mc.tab.alerts":"সতর্কতা","mc.tab.ask":"Chitti Mechanic কে জিজ্ঞাসা","mb.empty.title":"আপনার Bike যোগ করুন","mb.empty.sub":"বলুন — আমার Bike Hero Splendor UP32AB1234 2018 লাল","mc.empty.title":"আপনার Car যোগ করুন","mc.empty.sub":"বলুন — আমার Car Maruti Swift DL3CAB5678 2020 সাদা","mb.health.good":"ভালো","mb.health.warn":"নজর দিন","mb.health.bad":"এখনই দেখুন","mb.helmet":"হেলমেট পরেছেন? হ্যাঁ বললে Maps খুলব","mb.safety.daily":"আজকের নিরাপত্তা টিপ","mb.fairprice":"ন্যায্য দাম","mb.diy":"বাড়িতে সারানো যাবে?","mb.ask.hint":"Chitti কে বলুন কী সমস্যা","na.title":"Chitti News AI + Coach","na.tag":"AI খবর + প্রত্যেক ভারতীয়ের জন্য AI শেখা","na.mode.news":"AI সংবাদ","na.mode.coach":"AI Coach","na.profile.title":"নিজের কথা Chitti কে বলুন","na.profile.q1":"আপনি কী করেন?","na.profile.q1.ph":"ইন্টেরিয়র ডেকরেটর · চাষি · ক্রিকেটার · যা কিছু","na.profile.q2":"AI সম্পর্কে কতটা জানেন?","na.profile.l0":"কিছুই না","na.profile.l1":"একটু একটু","na.profile.l2":"ভালো","na.profile.l3":"খুব ভালো","na.profile.save":"প্রোফাইল সংরক্ষণ","na.story.explain":"আমাকে বুঝিয়ে দাও","na.story.pin":"পিন","na.story.sources":"উৎস","na.coach.start":"শেখা শুরু","na.coach.cert":"সার্টিফিকেট দেখো","na.lesson.task":"এখনই করে দেখো","na.cert.title":"Sahayai AI Certificate","na.cert.next":"পরবর্তী পরামর্শ — সত্যিকারের ফ্রি certifications","na.unknown":"এই পেশা Chitti এর কাছে নতুন — এখন জানছি","err.network":"Chitti shunte parlo na — abar bolun","err.retry":"আবার বলুন",
    },
    ta: {
      "tab.talk":"பேசு","tab.act":"செயல்","tab.vault":"ஆவணம்","tab.circle":"குடும்பம்","tab.settings":"அமைப்புகள்","tab.sos":"SOS",
      "talk.quick":"விரைவு செயல்","talk.quick.sub":"திறக்க தட்டவும்",
      "talk.recent":"சமீபத்திய","talk.recent.sub":"திறக்க தட்டவும்",
      "set.title":"அமைப்புகள்","set.back":"← பின்",
      "set.battery":"Chitti பேட்டரி",
      "set.battery.note":"ஒவ்வொரு கேள்விக்கும் Chitti சர்வரில் டோக்கன் செலவாகின்றன. மேலும் கேட்க டாப்-அப் செய்யுங்கள்.",
      "set.share":"Chitti பகிர்","set.share.wa":"WhatsApp","set.share.copy":"இணைப்பு நகலெடு","set.share.share":"பகிர்",
      "set.privacy":"தனியுரிமை மற்றும் தரவு",
      "set.dpdp.title":"DPDP சட்டம் 2023","set.dpdp.sub":"முழு சம்மதத்தை படிக்கவும்",
      "set.perm.mic":"மைக்","set.perm.contacts":"தொடர்புகள்","set.perm.storage":"சேமிப்பு","set.perm.location":"இடம்",
      "set.products":"அனைத்து Chitti பொருட்கள்","set.products.sub":"கார்டை தட்டவும் → விரிவாகும் · 🔊 கேள் · ▶ டெமோ · 👍 நன்று · 👎 கருத்து",
      "set.general":"பொது","set.font":"எழுத்து அளவு","set.voicespeed":"குரல் வேகம்","set.lang":"மொழி","set.caregiver":"👨‍👩‍👧 பராமரிப்பாளர் பேனல்",
      "hdr.howto":"எப்படி பயன்படுத்த","hdr.gp":"மூத்தோர் முறை","hdr.settings":"அமைப்புகள்","set.battery.title":"Chitti பேட்டரி","set.battery.queries":"கேள்விகள் மீதம்","set.battery.days":"~{{n}} நாட்கள்","set.demo":"டெமோ","err.network":"Chitti kekka mudiyala — meendum sollunga","err.retry":"மீண்டும் சொல்",
    },
    te: {
      "tab.talk":"మాట్లాడు","tab.act":"పని","tab.vault":"పత్రాలు","tab.circle":"మనవారు","tab.settings":"సెట్టింగ్స్","tab.sos":"SOS",
      "talk.quick":"త్వరిత చర్యలు","talk.quick.sub":"తెరవడానికి నొక్కండి",
      "talk.recent":"ఇటీవల","talk.recent.sub":"తెరవడానికి నొక్కండి",
      "set.title":"సెట్టింగ్స్","set.back":"← వెనుకకు",
      "set.battery":"Chitti బ్యాటరీ",
      "set.battery.note":"ప్రతి ప్రశ్నకు Chitti సర్వర్‌లో టోకెన్ ఖర్చు అవుతాయి. మరిన్ని ప్రశ్నలకు టాప్-అప్ చేయండి.",
      "set.share":"Chitti పంచుకోండి","set.share.wa":"WhatsApp","set.share.copy":"లింక్ కాపీ","set.share.share":"పంచుకో",
      "set.privacy":"గోప్యత మరియు డేటా",
      "set.dpdp.title":"DPDP చట్టం 2023","set.dpdp.sub":"పూర్తి సమ్మతిని చదవండి",
      "set.perm.mic":"మైక్","set.perm.contacts":"పరిచయాలు","set.perm.storage":"నిల్వ","set.perm.location":"స్థానం",
      "set.products":"అన్ని Chitti ఉత్పత్తులు","set.products.sub":"కార్డు నొక్కండి → తెరుచుకుంటుంది · 🔊 వినండి · ▶ డెమో · 👍 బాగుంది · 👎 ఈ కార్డుకి అభిప్రాయం",
      "set.general":"సాధారణ","set.font":"ఫాంట్ సైజ్","set.voicespeed":"గొంతు వేగం","set.lang":"భాష","set.caregiver":"👨‍👩‍👧 సంరక్షకుని ప్యానెల్",
      "hdr.howto":"ఎలా వాడాలి","hdr.gp":"వృద్ధుల మోడ్","hdr.settings":"సెట్టింగ్స్","set.battery.title":"Chitti బ్యాటరీ","set.battery.queries":"ప్రశ్నలు మిగిలి","set.battery.days":"~{{n}} రోజులు","set.demo":"డెమో","mb.title":"Chitti Mechanic Bike","mb.tag":"मी Bike कु मंचि स्नेहितुडु","mc.title":"Chitti Mechanic Car","mc.tag":"मी Car कु मंचि स्नेहितुडु","mb.tab.home":"ఇల్లు","mb.tab.bike":"నా Bike","mb.tab.docs":"పత్రాలు","mb.tab.alerts":"హెచ్చరికలు","mb.tab.ask":"Chitti Mechanic ను అడగండి","mc.tab.home":"ఇల్లు","mc.tab.car":"నా Car","mc.tab.docs":"పత్రాలు","mc.tab.alerts":"హెచ్చరికలు","mc.tab.ask":"Chitti Mechanic ను అడగండి","mb.empty.title":"మీ Bike జోడించండి","mb.empty.sub":"చెప్పండి — నా Bike Hero Splendor UP32AB1234 2018 ఎరుపు","mc.empty.title":"మీ Car జోడించండి","mc.empty.sub":"చెప్పండి — నా Car Maruti Swift DL3CAB5678 2020 తెల్లని","mb.health.good":"బాగుంది","mb.health.warn":"జాగ్రత్త","mb.health.bad":"వెంటనే చూడండి","mb.helmet":"హెల్మెట్ ధరించారా? అవును అంటేనే Maps తెరుస్తాను","mb.safety.daily":"నేటి భద్రతా సూచన","mb.fairprice":"సరియైన ధర","mb.diy":"ఇంట్లో సరిచేయవచ్చా?","mb.ask.hint":"Chitti కి చెప్పండి ఏం సమస్య","na.title":"Chitti News AI + Coach","na.tag":"AI వార్తలు + ప్రతి భారతీయుని కోసం AI నేర్చుకోవడం","na.mode.news":"AI వార్తలు","na.mode.coach":"AI Coach","na.profile.title":"మీ గురించి Chitti కు చెప్పండి","na.profile.q1":"మీరు ఏం పని చేస్తారు?","na.profile.q1.ph":"ఇంటీరియర్ డెకరేటర్ · రైతు · క్రికెటర్ · ఏదైనా","na.profile.q2":"AI గురించి ఎంత తెలుసు?","na.profile.l0":"ఏమీ లేదు","na.profile.l1":"కొంచెం","na.profile.l2":"బాగుంది","na.profile.l3":"చాలా బాగుంది","na.profile.save":"నా ప్రొఫైల్ సేవ్ చేయండి","na.story.explain":"వివరించండి","na.story.pin":"పిన్","na.story.sources":"మూలం","na.coach.start":"నేర్చుకోవడం మొదలుపెట్టు","na.coach.cert":"సర్టిఫికేట్ చూడు","na.lesson.task":"ఇప్పుడే చేసి చూడు","na.cert.title":"Sahayai AI Certificate","na.cert.next":"తర్వాత సూచన — నిజమైన ಉచిత certifications","na.unknown":"ఈ వృత్తి Chitti కి కొత్తది — ఇప్పుడు తెలుసుకుంటోంది","err.network":"Chitti vinipinchaledu — malli cheppandi","err.retry":"మళ్ళీ చెప్పండి",
    },
    mr: {
      "tab.talk":"बोला","tab.act":"करा","tab.vault":"दस्तऐवज","tab.circle":"आपले","tab.settings":"सेटिंग्ज","tab.sos":"SOS",
      "talk.quick":"त्वरित कृती","talk.quick.sub":"उघडण्यासाठी टॅप करा",
      "talk.recent":"अलीकडील","talk.recent.sub":"उघडण्यासाठी टॅप करा",
      "set.title":"सेटिंग्ज","set.back":"← परत",
      "set.battery":"Chitti बॅटरी",
      "set.battery.note":"प्रत्येक प्रश्नासाठी Chitti च्या सर्व्हरवर टोकन्स खर्च होतात. अधिक प्रश्न विचारण्यासाठी टॉप-अप करा.",
      "set.share":"Chitti शेअर","set.share.wa":"WhatsApp","set.share.copy":"लिंक कॉपी","set.share.share":"शेअर",
      "set.privacy":"गोपनीयता आणि डेटा",
      "set.dpdp.title":"DPDP कायदा 2023","set.dpdp.sub":"पूर्ण सहमती वाचा",
      "set.perm.mic":"मायक्रोफोन","set.perm.contacts":"संपर्क","set.perm.storage":"स्टोरेज","set.perm.location":"स्थान",
      "set.products":"सर्व Chitti उत्पादने","set.products.sub":"कार्ड टॅप करा → उघडेल · 🔊 ऐका · ▶ डेमो · 👍 आवडले · 👎 अभिप्राय",
      "set.general":"सामान्य","set.font":"फॉन्ट आकार","set.voicespeed":"आवाजाचा वेग","set.lang":"भाषा","set.caregiver":"👨‍👩‍👧 केअरगिव्हर पॅनेल",
      "hdr.howto":"कसे वापरायचे","hdr.gp":"ज्येष्ठ मोड","hdr.settings":"सेटिंग्ज","set.battery.title":"Chitti बॅटरी","set.battery.queries":"प्रश्न शिल्लक","set.battery.days":"~{{n}} दिवस","set.demo":"डेमो","err.network":"Chitti aikalech naahi — punha bola","err.retry":"पुन्हा बोला",
    },
    gu: {
      "tab.talk":"બોલો","tab.act":"કાર્ય","tab.vault":"દસ્તાવેજ","tab.circle":"સગાંવ્હાલા","tab.settings":"સેટિંગ્સ","tab.sos":"SOS",
      "talk.quick":"ઝડપી કાર્યો","talk.quick.sub":"ખોલવા ટૅપ કરો",
      "talk.recent":"તાજેતર","talk.recent.sub":"ખોલવા ટૅપ કરો",
      "set.title":"સેટિંગ્સ","set.back":"← પાછું",
      "set.battery":"Chitti બેટરી",
      "set.battery.note":"દરેક પ્રશ્ન માટે Chitti ના સર્વર પર ટોકન્સ ખર્ચ થાય છે. વધુ પૂછવા ટોપ-અપ કરો.",
      "set.share":"Chitti શેર","set.share.wa":"WhatsApp","set.share.copy":"લિંક કોપી","set.share.share":"શેર",
      "set.privacy":"ગોપનીયતા અને ડેટા",
      "set.dpdp.title":"DPDP કાયદો 2023","set.dpdp.sub":"સંપૂર્ણ સંમતિ વાંચો",
      "set.perm.mic":"માઇક્રોફોન","set.perm.contacts":"સંપર્ક","set.perm.storage":"સ્ટોરેજ","set.perm.location":"સ્થાન",
      "set.products":"બધા Chitti ઉત્પાદનો","set.products.sub":"કાર્ડ ટૅપ કરો → ખુલશે · 🔊 સાંભળો · ▶ ડેમો · 👍 ગમ્યું · 👎 અભિપ્રાય",
      "set.general":"સામાન્ય","set.font":"ફોન્ટ સાઇઝ","set.voicespeed":"અવાજની ઝડપ","set.lang":"ભાષા","set.caregiver":"👨‍👩‍👧 કેરગિવર પેનલ",
      "hdr.howto":"કેવી રીતે વાપરવું","hdr.gp":"વૃદ્ધ મોડ","hdr.settings":"સેટિંગ્સ","set.battery.title":"Chitti બેટરી","set.battery.queries":"પ્રશ્નો બાકી","set.battery.days":"~{{n}} દિવસ","set.demo":"ડેમો","err.network":"Chitti sambhali nathi — pacho bolo","err.retry":"ફરી બોલો",
    },
    kn: {
      "tab.talk":"ಮಾತು","tab.act":"ಕೆಲಸ","tab.vault":"ದಾಖಲೆ","tab.circle":"ಬಂಧು","tab.settings":"ಸೆಟ್ಟಿಂಗ್ಸ್","tab.sos":"SOS",
      "talk.quick":"ತ್ವರಿತ ಕ್ರಿಯೆಗಳು","talk.quick.sub":"ತೆರೆಯಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
      "talk.recent":"ಇತ್ತೀಚಿನ","talk.recent.sub":"ತೆರೆಯಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
      "set.title":"ಸೆಟ್ಟಿಂಗ್ಸ್","set.back":"← ಹಿಂದೆ",
      "set.battery":"Chitti ಬ್ಯಾಟರಿ",
      "set.battery.note":"ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ Chitti ಸರ್ವರ್‌ನಲ್ಲಿ ಟೋಕನ್‌ಗಳು ಖರ್ಚಾಗುತ್ತವೆ. ಹೆಚ್ಚು ಕೇಳಲು ಟಾಪ್-ಅಪ್ ಮಾಡಿ.",
      "set.share":"Chitti ಹಂಚಿ","set.share.wa":"WhatsApp","set.share.copy":"ಲಿಂಕ್ ಕಾಪಿ","set.share.share":"ಹಂಚಿ",
      "set.privacy":"ಗೌಪ್ಯತೆ ಮತ್ತು ಡೇಟಾ",
      "set.dpdp.title":"DPDP ಕಾಯಿದೆ 2023","set.dpdp.sub":"ಪೂರ್ಣ ಸಮ್ಮತಿ ಓದಿ",
      "set.perm.mic":"ಮೈಕ್","set.perm.contacts":"ಸಂಪರ್ಕಗಳು","set.perm.storage":"ಸಂಗ್ರಹಣೆ","set.perm.location":"ಸ್ಥಳ",
      "set.products":"ಎಲ್ಲಾ Chitti ಉತ್ಪನ್ನಗಳು","set.products.sub":"ಕಾರ್ಡ್ ಟ್ಯಾಪ್ ಮಾಡಿ → ತೆರೆಯುತ್ತದೆ · 🔊 ಕೇಳಿ · ▶ ಡೆಮೋ · 👍 ಚೆನ್ನ · 👎 ಪ್ರತಿಕ್ರಿಯೆ",
      "set.general":"ಸಾಮಾನ್ಯ","set.font":"ಫಾಂಟ್ ಗಾತ್ರ","set.voicespeed":"ಧ್ವನಿ ವೇಗ","set.lang":"ಭಾಷೆ","set.caregiver":"👨‍👩‍👧 ಕೇರ್ಗಿವರ್ ಪ್ಯಾನೆಲ್",
      "hdr.howto":"ಹೇಗೆ ಬಳಸಬೇಕು","hdr.gp":"ಹಿರಿಯರ ಮೋಡ್","hdr.settings":"ಸೆಟ್ಟಿಂಗ್ಸ್","set.battery.title":"Chitti ಬ್ಯಾಟರಿ","set.battery.queries":"ಪ್ರಶ್ನೆಗಳು ಬಾಕಿ","set.battery.days":"~{{n}} ದಿನಗಳು","set.demo":"ಡೆಮೋ","err.network":"Chitti keelilla — matte heli","err.retry":"ಮತ್ತೆ ಹೇಳಿ",
    },
    ml: {
      "tab.talk":"സംസാരം","tab.act":"പ്രവൃത്തി","tab.vault":"രേഖകൾ","tab.circle":"കുടുംബം","tab.settings":"ക്രമീകരണങ്ങൾ","tab.sos":"SOS",
      "talk.quick":"പെട്ടെന്നുള്ള പ്രവൃത്തികൾ","talk.quick.sub":"തുറക്കാൻ ടാപ്പ് ചെയ്യുക",
      "talk.recent":"സമീപകാല","talk.recent.sub":"തുറക്കാൻ ടാപ്പ് ചെയ്യുക",
      "set.title":"ക്രമീകരണങ്ങൾ","set.back":"← തിരികെ",
      "set.battery":"Chitti ബാറ്ററി",
      "set.battery.note":"ഓരോ ചോദ്യത്തിനും Chitti സർവ്വറിൽ ടോക്കണുകൾ ചെലവാകുന്നു. കൂടുതൽ ചോദിക്കാൻ ടോപ്-അപ് ചെയ്യുക.",
      "set.share":"Chitti ഷെയർ","set.share.wa":"WhatsApp","set.share.copy":"ലിങ്ക് കോപ്പി","set.share.share":"ഷെയർ",
      "set.privacy":"സ്വകാര്യതയും ഡാറ്റയും",
      "set.dpdp.title":"DPDP നിയമം 2023","set.dpdp.sub":"പൂർണ്ണ സമ്മതം വായിക്കുക",
      "set.perm.mic":"മൈക്ക്","set.perm.contacts":"കോൺടാക്റ്റുകൾ","set.perm.storage":"സ്റ്റോറേജ്","set.perm.location":"സ്ഥാനം",
      "set.products":"എല്ലാ Chitti ഉൽപ്പന്നങ്ങളും","set.products.sub":"കാർഡ് ടാപ്പ് ചെയ്യൂ → വിസ്തരിക്കും · 🔊 കേൾക്കുക · ▶ ഡെമോ · 👍 ഇഷ്ടം · 👎 ഫീഡ്ബാക്ക്",
      "set.general":"പൊതുവായത്","set.font":"ഫോണ്ട് വലുപ്പം","set.voicespeed":"ശബ്ദ വേഗത","set.lang":"ഭാഷ","set.caregiver":"👨‍👩‍👧 കെയർഗിവർ പാനൽ",
      "hdr.howto":"എങ്ങനെ ഉപയോഗിക്കാം","hdr.gp":"മുതിർന്നവർ മോഡ്","hdr.settings":"ക്രമീകരണങ്ങൾ","set.battery.title":"Chitti ബാറ്ററി","set.battery.queries":"ചോദ്യങ്ങൾ ബാക്കി","set.battery.days":"~{{n}} ദിവസം","set.demo":"ഡെമോ","err.network":"Chitti ketilla — onnoode parayuu","err.retry":"വീണ്ടും പറയൂ",
    },
  };

  function strFor(lang, key) {
    const bag = STRINGS[lang] || STRINGS.en;
    return Object.prototype.hasOwnProperty.call(bag, key) ? bag[key] : (STRINGS.en[key] || key);
  }

  function updateAllStrings(lang) {
    const code = (lang && STRINGS[lang]) ? lang : 'hi';
    document.querySelectorAll('[data-vai-i18n]').forEach((el) => {
      const k = el.getAttribute('data-vai-i18n');
      const v = strFor(code, k);
      if (v) el.textContent = v;
    });
  }

  window.updateAllStrings = updateAllStrings;
  window.vaiApplyStrings = updateAllStrings;
  window.VAI_STRINGS = STRINGS;

  // Auto-run on load + on chitti:langchange.
  function run() {
    let lang = 'hi';
    try { lang = localStorage.getItem('chitti_vaani_lang') || 'hi'; } catch (e) {}
    updateAllStrings(lang);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else { run(); }
  window.addEventListener('chitti:langchange', (e) => {
    const code = (e && e.detail && e.detail.lang) || (function(){ try{return localStorage.getItem('chitti_vaani_lang');}catch(e){return 'hi';}})() || 'hi';
    updateAllStrings(code);
  });
})();
