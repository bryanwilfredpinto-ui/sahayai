/* ============================================================================
 * cnai_i18n.js — Chitti News AI · Build Order 6 · Full-UI i18n layer
 * ----------------------------------------------------------------------------
 * NEW REQUIREMENT (Sire, June 2026): when a user picks Kannada/Telugu/Tamil/…,
 * the ENTIRE UI renders in that language — every label, button, heading,
 * placeholder, error — not just Chitti's reply. This module owns UI_STRINGS +
 * applyLanguage() + changeLanguage() + auto-detect.
 *
 * Pure language only (no Hinglish). Technical terms (AI, ML, LLM, RAG, GPT,
 * Google, IBM, NVIDIA, Hugging Face, SWAYAM, NPTEL, Excel, Word, GitHub, Python,
 * Flask, ChatGPT, Gemini, Claude, RSI/MACD, etc.) stay in English.
 *
 * Key: persists to 'cnai_lang' AND mirrors to the page's existing 'chitti_lang'
 * so the chitti_lang.js substrate and this layer stay in sync.
 *
 * API (window.CNAIi18n / module.exports):
 *   UI_STRINGS · applyLanguage(lang) · changeLanguageI18n(lang) ·
 *   autoDetect() · t(key, lang) · listLangs() · missingKeys()
 * ==========================================================================*/
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.CNAIi18n = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Technical terms that NEVER translate (stay English in every language).
  const TECH_TERMS = ['AI', 'ML', 'DL', 'LLM', 'API', 'GPT', 'RAG', 'GenAI', 'NLP', 'UPI', 'DPDP', 'WCAG', 'TTS', 'NVDA',
    'ChatGPT', 'Claude', 'Gemini', 'Google', 'IBM', 'NVIDIA', 'Microsoft', 'Hugging Face', 'Coursera', 'Udemy', 'YouTube',
    'SWAYAM', 'NPTEL', 'NIELIT', 'Excel', 'Word', 'PowerPoint', 'WhatsApp', 'Notion', 'GitHub', 'LinkedIn', 'Python', 'React', 'Flask', 'Agentic AI'];

  const LANGS = ['en', 'hi', 'te', 'kn', 'ta', 'bn', 'mr', 'gu', 'ml', 'pa', 'or'];

  const UI_STRINGS = {
    en: { nav_news: 'AI News', nav_coach: 'Career Coach', nav_roadmap: 'Learn', nav_certify: 'Certify', news_title: 'Top AI News for You', news_refresh: 'Refresh', news_loading: 'Loading latest AI stories…', news_empty: 'No stories yet — check back soon.', coach_title: 'Your AI Career Coach', coach_intro: 'Tell me your profession or upload your resume', coach_placeholder: 'e.g. I am a farmer with 10 years experience', coach_cta: 'Get My AI Upgrade Path', tools_label: 'I currently use:', stop_using: 'STOP using', start_using: 'START using', free_badge: 'FREE', paid_badge: 'PAID', cert_title: 'Your Free Certifications', cert_enrol: 'Enrol Now', cert_consent: 'Shall I register you for this course?', cert_yes: 'Yes, register me', cert_no: "No, I'll do it myself", roadmap_title: 'Your Learning Roadmap', roadmap_placeholder: 'e.g. I want to learn Agentic AI', roadmap_cta: 'Generate Roadmap', analogy_label: 'Explain using:', analogy_cricket: 'Cricket', analogy_market: 'Share Market', analogy_farming: 'Farming', analogy_bollywood: 'Bollywood', analogy_cooking: 'Cooking', analogy_code: 'Code', feedback_helpful: 'This was helpful', feedback_not: 'This was not helpful', feedback_edit: 'Edit or correct this', feedback_speak: 'Speak feedback', feedback_read: 'Read aloud', chitti_forget: 'Chitti Forget (clear my data)', privacy_note: 'Your data stays on your device only.', loading: 'Loading…', error_generic: 'Something went wrong. Please try again.' },
    hi: { nav_news: 'AI समाचार', nav_coach: 'करियर कोच', nav_roadmap: 'सीखें', nav_certify: 'सर्टिफाई करें', news_title: 'आपके लिए टॉप AI खबरें', news_refresh: 'रिफ्रेश', news_loading: 'ताज़ी AI खबरें लोड हो रही हैं…', news_empty: 'अभी कोई खबर नहीं — जल्द वापस आएं।', coach_title: 'आपका AI करियर कोच', coach_intro: 'अपना पेशा बताएं या रेज़्यूमे अपलोड करें', coach_placeholder: 'जैसे: मैं 10 साल से किसान हूँ', coach_cta: 'मेरा AI अपग्रेड रास्ता दिखाएं', tools_label: 'मैं अभी इस्तेमाल करता/करती हूँ:', stop_using: 'बंद करें', start_using: 'शुरू करें', free_badge: 'मुफ्त', paid_badge: 'पेड', cert_title: 'आपके मुफ्त सर्टिफिकेट', cert_enrol: 'अभी एनरोल करें', cert_consent: 'क्या मैं आपको इस कोर्स में रजिस्टर करूं?', cert_yes: 'हाँ, रजिस्टर करो', cert_no: 'नहीं, मैं खुद करूंगा/करूंगी', roadmap_title: 'आपका सीखने का रोडमैप', roadmap_placeholder: 'जैसे: मुझे Agentic AI सीखनी है', roadmap_cta: 'रोडमैप बनाएं', analogy_label: 'इस तरह समझाएं:', analogy_cricket: 'क्रिकेट', analogy_market: 'शेयर बाज़ार', analogy_farming: 'खेती', analogy_bollywood: 'बॉलीवुड', analogy_cooking: 'रसोई', analogy_code: 'कोड', feedback_helpful: 'यह मददगार था', feedback_not: 'यह मददगार नहीं था', feedback_edit: 'इसे सही करें', feedback_speak: 'बोलकर फीडबैक दें', feedback_read: 'ज़ोर से पढ़ें', chitti_forget: 'चिट्टी भूल जाओ (डेटा मिटाएं)', privacy_note: 'आपका डेटा सिर्फ आपके फोन पर रहता है।', loading: 'लोड हो रहा है…', error_generic: 'कुछ गड़बड़ हुई। फिर कोशिश करें।' },
    te: { nav_news: 'AI వార్తలు', nav_coach: 'కెరీర్ కోచ్', nav_roadmap: 'నేర్చుకోండి', nav_certify: 'సర్టిఫై', news_title: 'మీ కోసం టాప్ AI వార్తలు', news_refresh: 'రిఫ్రెష్', news_loading: 'తాజా AI వార్తలు లోడ్ అవుతున్నాయి…', news_empty: 'ఇంకా వార్తలు లేవు — తర్వాత తనిఖీ చేయండి.', coach_title: 'మీ AI కెరీర్ కోచ్', coach_intro: 'మీ వృత్తి చెప్పండి లేదా రెజ్యూమ్ అప్‌లోడ్ చేయండి', coach_placeholder: 'ఉదా: నేను 10 సంవత్సరాల రైతుని', coach_cta: 'నా AI అప్‌గ్రేడ్ మార్గం చూపించు', tools_label: 'నేను ప్రస్తుతం ఉపయోగిస్తున్నాను:', stop_using: 'ఆపండి', start_using: 'ప్రారంభించండి', free_badge: 'ఉచిత', paid_badge: 'చెల్లింపు', cert_title: 'మీ ఉచిత సర్టిఫికెట్లు', cert_enrol: 'ఇప్పుడే చేరండి', cert_consent: 'నేను మిమ్మల్ని ఈ కోర్సులో నమోదు చేయనా?', cert_yes: 'అవును, నమోదు చేయండి', cert_no: 'వద్దు, నేను చేస్తాను', roadmap_title: 'మీ లెర్నింగ్ రోడ్‌మ్యాప్', roadmap_placeholder: 'ఉదా: నాకు Agentic AI నేర్చుకోవాలి', roadmap_cta: 'రోడ్‌మ్యాప్ తయారు చేయి', analogy_label: 'ఇలా వివరించండి:', analogy_cricket: 'క్రికెట్', analogy_market: 'షేర్ మార్కెట్', analogy_farming: 'వ్యవసాయం', analogy_bollywood: 'బాలీవుడ్', analogy_cooking: 'వంటగది', analogy_code: 'కోడ్', feedback_helpful: 'ఇది సహాయకరంగా ఉంది', feedback_not: 'ఇది సహాయకరంగా లేదు', feedback_edit: 'దీన్ని సరిచేయండి', feedback_speak: 'మాట్లాడి ఫీడ్‌బ్యాక్ ఇవ్వండి', feedback_read: 'బిగ్గరగా చదవండి', chitti_forget: 'చిట్టి మరచిపో (డేటా తొలగించు)', privacy_note: 'మీ డేటా మీ పరికరంలో మాత్రమే ఉంటుంది.', loading: 'లోడ్ అవుతోంది…', error_generic: 'ఏదో తప్పు జరిగింది. మళ్ళీ ప్రయత్నించండి.' },
    kn: { nav_news: 'AI ಸುದ್ದಿ', nav_coach: 'ಕೆರಿಯರ್ ಕೋಚ್', nav_roadmap: 'ಕಲಿಯಿರಿ', nav_certify: 'ಸರ್ಟಿಫೈ', news_title: 'ನಿಮಗಾಗಿ ಟಾಪ್ AI ಸುದ್ದಿ', news_refresh: 'ರಿಫ್ರೆಶ್', news_loading: 'ತಾಜಾ AI ಸುದ್ದಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ…', news_empty: 'ಇನ್ನೂ ಸುದ್ದಿ ಇಲ್ಲ — ಶೀಘ್ರದಲ್ಲೇ ಮರಳಿ ನೋಡಿ.', coach_title: 'ನಿಮ್ಮ AI ಕೆರಿಯರ್ ಕೋಚ್', coach_intro: 'ನಿಮ್ಮ ವೃತ್ತಿ ಹೇಳಿ ಅಥವಾ ರೆಸ್ಯೂಮ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ', coach_placeholder: 'ಉದಾ: ನಾನು 10 ವರ್ಷದ ರೈತ', coach_cta: 'ನನ್ನ AI ಅಪ್‌ಗ್ರೇಡ್ ಮಾರ್ಗ ತೋರಿಸಿ', tools_label: 'ನಾನು ಪ್ರಸ್ತುತ ಬಳಸುತ್ತಿದ್ದೇನೆ:', stop_using: 'ನಿಲ್ಲಿಸಿ', start_using: 'ಪ್ರಾರಂಭಿಸಿ', free_badge: 'ಉಚಿತ', paid_badge: 'ಶುಲ್ಕ', cert_title: 'ನಿಮ್ಮ ಉಚಿತ ಪ್ರಮಾಣಪತ್ರಗಳು', cert_enrol: 'ಈಗ ನೋಂದಾಯಿಸಿ', cert_consent: 'ನಾನು ಈ ಕೋರ್ಸ್‌ಗೆ ನಿಮ್ಮನ್ನು ನೋಂದಾಯಿಸಲೇ?', cert_yes: 'ಹೌದು, ನೋಂದಾಯಿಸಿ', cert_no: 'ಬೇಡ, ನಾನೇ ಮಾಡುತ್ತೇನೆ', roadmap_title: 'ನಿಮ್ಮ ಲರ್ನಿಂಗ್ ರೋಡ್‌ಮ್ಯಾಪ್', roadmap_placeholder: 'ಉದಾ: ನಾನು Agentic AI ಕಲಿಯಬೇಕು', roadmap_cta: 'ರೋಡ್‌ಮ್ಯಾಪ್ ತಯಾರಿಸಿ', analogy_label: 'ಹೀಗೆ ವಿವರಿಸಿ:', analogy_cricket: 'ಕ್ರಿಕೆಟ್', analogy_market: 'ಷೇರು ಮಾರುಕಟ್ಟೆ', analogy_farming: 'ಕೃಷಿ', analogy_bollywood: 'ಬಾಲಿವುಡ್', analogy_cooking: 'ಅಡುಗೆ', analogy_code: 'ಕೋಡ್', feedback_helpful: 'ಇದು ಉಪಯುಕ್ತವಾಗಿತ್ತು', feedback_not: 'ಇದು ಉಪಯುಕ್ತವಾಗಲಿಲ್ಲ', feedback_edit: 'ಇದನ್ನು ಸರಿಪಡಿಸಿ', feedback_speak: 'ಮಾತನಾಡಿ ಫೀಡ್‌ಬ್ಯಾಕ್ ನೀಡಿ', feedback_read: 'ಜೋರಾಗಿ ಓದಿ', chitti_forget: 'ಚಿಟ್ಟಿ ಮರೆತುಬಿಡು (ಡೇಟಾ ಅಳಿಸಿ)', privacy_note: 'ನಿಮ್ಮ ಡೇಟಾ ನಿಮ್ಮ ಸಾಧನದಲ್ಲಿ ಮಾತ್ರ ಇರುತ್ತದೆ.', loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…', error_generic: 'ಏನೋ ತಪ್ಪಾಯಿತು. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' },
    ta: { nav_news: 'AI செய்திகள்', nav_coach: 'தொழில் பயிற்சியாளர்', nav_roadmap: 'கற்கவும்', nav_certify: 'சான்றிதழ்', news_title: 'உங்களுக்கான சிறந்த AI செய்திகள்', news_refresh: 'புதுப்பி', news_loading: 'புதிய AI செய்திகள் ஏற்றப்படுகின்றன…', news_empty: 'இன்னும் செய்திகள் இல்லை — விரைவில் மீண்டும் பாருங்கள்.', coach_title: 'உங்கள் AI தொழில் பயிற்சியாளர்', coach_intro: 'உங்கள் தொழிலை சொல்லுங்கள் அல்லது ரெஸ்யூமை பதிவேற்றுங்கள்', coach_placeholder: 'எ.கா: நான் 10 ஆண்டு அனுபவமுள்ள விவசாயி', coach_cta: 'என் AI மேம்பாட்டு பாதை காட்டு', tools_label: 'நான் தற்போது பயன்படுத்துகிறேன்:', stop_using: 'நிறுத்துங்கள்', start_using: 'தொடங்குங்கள்', free_badge: 'இலவசம்', paid_badge: 'கட்டணம்', cert_title: 'உங்கள் இலவச சான்றிதழ்கள்', cert_enrol: 'இப்போதே சேருங்கள்', cert_consent: 'இந்த படிப்பில் உங்களை பதிவு செய்யட்டுமா?', cert_yes: 'ஆம், பதிவு செய்யுங்கள்', cert_no: 'வேண்டாம், நானே செய்கிறேன்', roadmap_title: 'உங்கள் கற்றல் வழிகாட்டி', roadmap_placeholder: 'எ.கா: எனக்கு Agentic AI கற்க வேண்டும்', roadmap_cta: 'வழிகாட்டி உருவாக்கு', analogy_label: 'இவ்வாறு விளக்குங்கள்:', analogy_cricket: 'கிரிக்கெட்', analogy_market: 'பங்கு சந்தை', analogy_farming: 'விவசாயம்', analogy_bollywood: 'பாலிவுட்', analogy_cooking: 'சமையல்', analogy_code: 'குறியீடு', feedback_helpful: 'இது உதவியாக இருந்தது', feedback_not: 'இது உதவியாக இல்லை', feedback_edit: 'இதை சரிசெய்யுங்கள்', feedback_speak: 'பேசி கருத்து தெரிவியுங்கள்', feedback_read: 'சத்தமாக படியுங்கள்', chitti_forget: 'சித்தி மறந்துவிடு (தரவு அழி)', privacy_note: 'உங்கள் தரவு உங்கள் சாதனத்தில் மட்டுமே இருக்கும்.', loading: 'ஏற்றுகிறது…', error_generic: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.' },
    bn: { nav_news: 'AI খবর', nav_coach: 'ক্যারিয়ার কোচ', nav_roadmap: 'শিখুন', nav_certify: 'সার্টিফাই', news_title: 'আপনার জন্য সেরা AI খবর', news_refresh: 'রিফ্রেশ', news_loading: 'সর্বশেষ AI খবর লোড হচ্ছে…', news_empty: 'এখনো কোনো খবর নেই — শীঘ্রই আবার চেক করুন।', coach_title: 'আপনার AI ক্যারিয়ার কোচ', coach_intro: 'আপনার পেশা বলুন বা রেজুমে আপলোড করুন', coach_placeholder: 'যেমন: আমি ১০ বছরের কৃষক', coach_cta: 'আমার AI আপগ্রেড পথ দেখাও', tools_label: 'আমি এখন ব্যবহার করি:', stop_using: 'বন্ধ করুন', start_using: 'শুরু করুন', free_badge: 'বিনামূল্যে', paid_badge: 'পেইড', cert_title: 'আপনার বিনামূল্যে সার্টিফিকেট', cert_enrol: 'এখনই নথিভুক্ত হন', cert_consent: 'আমি কি আপনাকে এই কোর্সে নিবন্ধন করব?', cert_yes: 'হ্যাঁ, নিবন্ধন করুন', cert_no: 'না, আমি নিজে করব', roadmap_title: 'আপনার শেখার রোডম্যাপ', roadmap_placeholder: 'যেমন: আমি Agentic AI শিখতে চাই', roadmap_cta: 'রোডম্যাপ তৈরি করুন', analogy_label: 'এভাবে বোঝান:', analogy_cricket: 'ক্রিকেট', analogy_market: 'শেয়ার বাজার', analogy_farming: 'কৃষি', analogy_bollywood: 'বলিউড', analogy_cooking: 'রান্নাঘর', analogy_code: 'কোড', feedback_helpful: 'এটি সহায়ক ছিল', feedback_not: 'এটি সহায়ক ছিল না', feedback_edit: 'এটি সংশোধন করুন', feedback_speak: 'কথা বলে মতামত দিন', feedback_read: 'জোরে পড়ুন', chitti_forget: 'চিট্টি ভুলে যাও (ডেটা মুছুন)', privacy_note: 'আপনার ডেটা শুধু আপনার ডিভাইসে থাকে।', loading: 'লোড হচ্ছে…', error_generic: 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।' },
    // ── Completed per CEOS BO6 (same pattern; pure language; tech terms English) ──
    mr: { nav_news: 'AI बातम्या', nav_coach: 'करिअर कोच', nav_roadmap: 'शिका', nav_certify: 'सर्टिफाय', news_title: 'तुमच्यासाठी टॉप AI बातम्या', news_refresh: 'रिफ्रेश', news_loading: 'ताज्या AI बातम्या लोड होत आहेत…', news_empty: 'अजून बातम्या नाहीत — लवकरच पुन्हा पाहा.', coach_title: 'तुमचा AI करिअर कोच', coach_intro: 'तुमचा व्यवसाय सांगा किंवा रेझ्युमे अपलोड करा', coach_placeholder: 'उदा: मी 10 वर्षांचा शेतकरी आहे', coach_cta: 'माझा AI अपग्रेड मार्ग दाखवा', tools_label: 'मी सध्या वापरतो/वापरते:', stop_using: 'बंद करा', start_using: 'सुरू करा', free_badge: 'मोफत', paid_badge: 'सशुल्क', cert_title: 'तुमची मोफत प्रमाणपत्रे', cert_enrol: 'आता नोंदणी करा', cert_consent: 'मी तुम्हाला या कोर्ससाठी नोंदणी करू का?', cert_yes: 'होय, नोंदणी करा', cert_no: 'नाही, मी स्वतः करेन', roadmap_title: 'तुमचा शिकण्याचा रोडमॅप', roadmap_placeholder: 'उदा: मला Agentic AI शिकायचे आहे', roadmap_cta: 'रोडमॅप तयार करा', analogy_label: 'असे समजावा:', analogy_cricket: 'क्रिकेट', analogy_market: 'शेअर बाजार', analogy_farming: 'शेती', analogy_bollywood: 'बॉलिवूड', analogy_cooking: 'स्वयंपाक', analogy_code: 'कोड', feedback_helpful: 'हे उपयुक्त होते', feedback_not: 'हे उपयुक्त नव्हते', feedback_edit: 'हे दुरुस्त करा', feedback_speak: 'बोलून अभिप्राय द्या', feedback_read: 'मोठ्याने वाचा', chitti_forget: 'चिट्टी विसरून जा (डेटा मिटवा)', privacy_note: 'तुमचा डेटा फक्त तुमच्या डिव्हाइसवर राहतो.', loading: 'लोड होत आहे…', error_generic: 'काहीतरी चूक झाली. पुन्हा प्रयत्न करा.' },
    gu: { nav_news: 'AI સમાચાર', nav_coach: 'કરિયર કોચ', nav_roadmap: 'શીખો', nav_certify: 'સર્ટિફાય', news_title: 'તમારા માટે ટોપ AI સમાચાર', news_refresh: 'રિફ્રેશ', news_loading: 'તાજા AI સમાચાર લોડ થઈ રહ્યા છે…', news_empty: 'હજુ કોઈ સમાચાર નથી — જલ્દી પાછા તપાસો.', coach_title: 'તમારો AI કરિયર કોચ', coach_intro: 'તમારો વ્યવસાય જણાવો અથવા રેઝ્યૂમે અપલોડ કરો', coach_placeholder: 'દા.ત: હું 10 વર્ષનો ખેડૂત છું', coach_cta: 'મારો AI અપગ્રેડ માર્ગ બતાવો', tools_label: 'હું હાલમાં વાપરું છું:', stop_using: 'બંધ કરો', start_using: 'શરૂ કરો', free_badge: 'મફત', paid_badge: 'ચૂકવેલ', cert_title: 'તમારા મફત પ્રમાણપત્રો', cert_enrol: 'હમણાં નોંધણી કરો', cert_consent: 'શું હું તમને આ કોર્સમાં નોંધણી કરું?', cert_yes: 'હા, નોંધણી કરો', cert_no: 'ના, હું જાતે કરીશ', roadmap_title: 'તમારો શીખવાનો રોડમેપ', roadmap_placeholder: 'દા.ત: મારે Agentic AI શીખવું છે', roadmap_cta: 'રોડમેપ બનાવો', analogy_label: 'આ રીતે સમજાવો:', analogy_cricket: 'ક્રિકેટ', analogy_market: 'શેર બજાર', analogy_farming: 'ખેતી', analogy_bollywood: 'બોલિવૂડ', analogy_cooking: 'રસોઈ', analogy_code: 'કોડ', feedback_helpful: 'આ મદદરૂપ હતું', feedback_not: 'આ મદદરૂપ ન હતું', feedback_edit: 'આને સુધારો', feedback_speak: 'બોલીને પ્રતિસાદ આપો', feedback_read: 'મોટેથી વાંચો', chitti_forget: 'ચિટ્ટી ભૂલી જા (ડેટા ભૂંસો)', privacy_note: 'તમારો ડેટા ફક્ત તમારા ડિવાઇસ પર રહે છે.', loading: 'લોડ થઈ રહ્યું છે…', error_generic: 'કંઈક ખોટું થયું. ફરી પ્રયાસ કરો.' },
    ml: { nav_news: 'AI വാർത്തകൾ', nav_coach: 'കരിയർ കോച്ച്', nav_roadmap: 'പഠിക്കൂ', nav_certify: 'സർട്ടിഫൈ', news_title: 'നിങ്ങൾക്കായി മികച്ച AI വാർത്തകൾ', news_refresh: 'പുതുക്കുക', news_loading: 'പുതിയ AI വാർത്തകൾ ലോഡ് ചെയ്യുന്നു…', news_empty: 'ഇതുവരെ വാർത്തകളില്ല — ഉടൻ വീണ്ടും നോക്കൂ.', coach_title: 'നിങ്ങളുടെ AI കരിയർ കോച്ച്', coach_intro: 'നിങ്ങളുടെ ജോലി പറയൂ അല്ലെങ്കിൽ റെസ്യൂമെ അപ്‌ലോഡ് ചെയ്യൂ', coach_placeholder: 'ഉദാ: ഞാൻ 10 വർഷത്തെ കർഷകനാണ്', coach_cta: 'എന്റെ AI അപ്‌ഗ്രേഡ് വഴി കാണിക്കൂ', tools_label: 'ഞാൻ ഇപ്പോൾ ഉപയോഗിക്കുന്നു:', stop_using: 'നിർത്തുക', start_using: 'തുടങ്ങുക', free_badge: 'സൗജന്യം', paid_badge: 'പണം', cert_title: 'നിങ്ങളുടെ സൗജന്യ സർട്ടിഫിക്കറ്റുകൾ', cert_enrol: 'ഇപ്പോൾ ചേരൂ', cert_consent: 'ഞാൻ നിങ്ങളെ ഈ കോഴ്സിൽ രജിസ്റ്റർ ചെയ്യട്ടെ?', cert_yes: 'അതെ, രജിസ്റ്റർ ചെയ്യൂ', cert_no: 'വേണ്ട, ഞാൻ സ്വയം ചെയ്യാം', roadmap_title: 'നിങ്ങളുടെ പഠന റോഡ്മാപ്പ്', roadmap_placeholder: 'ഉദാ: എനിക്ക് Agentic AI പഠിക്കണം', roadmap_cta: 'റോഡ്മാപ്പ് ഉണ്ടാക്കൂ', analogy_label: 'ഇങ്ങനെ വിശദീകരിക്കൂ:', analogy_cricket: 'ക്രിക്കറ്റ്', analogy_market: 'ഷെയർ മാർക്കറ്റ്', analogy_farming: 'കൃഷി', analogy_bollywood: 'ബോളിവുഡ്', analogy_cooking: 'പാചകം', analogy_code: 'കോഡ്', feedback_helpful: 'ഇത് സഹായകരമായിരുന്നു', feedback_not: 'ഇത് സഹായകരമായില്ല', feedback_edit: 'ഇത് തിരുത്തൂ', feedback_speak: 'സംസാരിച്ച് അഭിപ്രായം നൽകൂ', feedback_read: 'ഉറക്കെ വായിക്കൂ', chitti_forget: 'ചിട്ടി മറക്കൂ (ഡാറ്റ മായ്ക്കൂ)', privacy_note: 'നിങ്ങളുടെ ഡാറ്റ നിങ്ങളുടെ ഉപകരണത്തിൽ മാത്രം.', loading: 'ലോഡ് ചെയ്യുന്നു…', error_generic: 'എന്തോ തെറ്റ് സംഭവിച്ചു. വീണ്ടും ശ്രമിക്കൂ.' },
    pa: { nav_news: 'AI ਖ਼ਬਰਾਂ', nav_coach: 'ਕਰੀਅਰ ਕੋਚ', nav_roadmap: 'ਸਿੱਖੋ', nav_certify: 'ਸਰਟੀਫਾਈ', news_title: 'ਤੁਹਾਡੇ ਲਈ ਟਾਪ AI ਖ਼ਬਰਾਂ', news_refresh: 'ਰਿਫ੍ਰੈਸ਼', news_loading: 'ਤਾਜ਼ਾ AI ਖ਼ਬਰਾਂ ਲੋਡ ਹੋ ਰਹੀਆਂ ਹਨ…', news_empty: 'ਅਜੇ ਕੋਈ ਖ਼ਬਰ ਨਹੀਂ — ਜਲਦੀ ਵਾਪਸ ਦੇਖੋ।', coach_title: 'ਤੁਹਾਡਾ AI ਕਰੀਅਰ ਕੋਚ', coach_intro: 'ਆਪਣਾ ਕਿੱਤਾ ਦੱਸੋ ਜਾਂ ਰੈਜ਼ਿਊਮੇ ਅੱਪਲੋਡ ਕਰੋ', coach_placeholder: 'ਜਿਵੇਂ: ਮੈਂ 10 ਸਾਲ ਦਾ ਕਿਸਾਨ ਹਾਂ', coach_cta: 'ਮੇਰਾ AI ਅੱਪਗ੍ਰੇਡ ਰਾਹ ਦਿਖਾਓ', tools_label: 'ਮੈਂ ਹੁਣ ਵਰਤਦਾ/ਵਰਤਦੀ ਹਾਂ:', stop_using: 'ਬੰਦ ਕਰੋ', start_using: 'ਸ਼ੁਰੂ ਕਰੋ', free_badge: 'ਮੁਫ਼ਤ', paid_badge: 'ਅਦਾਇਗੀ', cert_title: 'ਤੁਹਾਡੇ ਮੁਫ਼ਤ ਸਰਟੀਫਿਕੇਟ', cert_enrol: 'ਹੁਣੇ ਦਾਖ਼ਲਾ ਲਓ', cert_consent: 'ਕੀ ਮੈਂ ਤੁਹਾਨੂੰ ਇਸ ਕੋਰਸ ਵਿੱਚ ਰਜਿਸਟਰ ਕਰਾਂ?', cert_yes: 'ਹਾਂ, ਰਜਿਸਟਰ ਕਰੋ', cert_no: 'ਨਹੀਂ, ਮੈਂ ਖ਼ੁਦ ਕਰਾਂਗਾ/ਕਰਾਂਗੀ', roadmap_title: 'ਤੁਹਾਡਾ ਸਿੱਖਣ ਦਾ ਰੋਡਮੈਪ', roadmap_placeholder: 'ਜਿਵੇਂ: ਮੈਂ Agentic AI ਸਿੱਖਣਾ ਹੈ', roadmap_cta: 'ਰੋਡਮੈਪ ਬਣਾਓ', analogy_label: 'ਇਸ ਤਰ੍ਹਾਂ ਸਮਝਾਓ:', analogy_cricket: 'ਕ੍ਰਿਕਟ', analogy_market: 'ਸ਼ੇਅਰ ਬਾਜ਼ਾਰ', analogy_farming: 'ਖੇਤੀ', analogy_bollywood: 'ਬਾਲੀਵੁੱਡ', analogy_cooking: 'ਰਸੋਈ', analogy_code: 'ਕੋਡ', feedback_helpful: 'ਇਹ ਮਦਦਗਾਰ ਸੀ', feedback_not: 'ਇਹ ਮਦਦਗਾਰ ਨਹੀਂ ਸੀ', feedback_edit: 'ਇਸ ਨੂੰ ਠੀਕ ਕਰੋ', feedback_speak: 'ਬੋਲ ਕੇ ਫੀਡਬੈਕ ਦਿਓ', feedback_read: 'ਉੱਚੀ ਆਵਾਜ਼ ਵਿੱਚ ਪੜ੍ਹੋ', chitti_forget: 'ਚਿੱਟੀ ਭੁੱਲ ਜਾ (ਡੇਟਾ ਮਿਟਾਓ)', privacy_note: 'ਤੁਹਾਡਾ ਡੇਟਾ ਸਿਰਫ਼ ਤੁਹਾਡੇ ਡਿਵਾਈਸ ਉੱਤੇ ਰਹਿੰਦਾ ਹੈ।', loading: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…', error_generic: 'ਕੁਝ ਗ਼ਲਤ ਹੋਇਆ। ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।' },
    or: { nav_news: 'AI ଖବର', nav_coach: 'କ୍ୟାରିଅର୍ କୋଚ୍', nav_roadmap: 'ଶିଖନ୍ତୁ', nav_certify: 'ସର୍ଟିଫାଇ', news_title: 'ଆପଣଙ୍କ ପାଇଁ ଶ୍ରେଷ୍ଠ AI ଖବର', news_refresh: 'ରିଫ୍ରେସ୍', news_loading: 'ସଦ୍ୟତମ AI ଖବର ଲୋଡ୍ ହେଉଛି…', news_empty: 'ଏ ପର୍ଯ୍ୟନ୍ତ କୌଣସି ଖବର ନାହିଁ — ଶୀଘ୍ର ପୁଣି ଦେଖନ୍ତୁ।', coach_title: 'ଆପଣଙ୍କ AI କ୍ୟାରିଅର୍ କୋଚ୍', coach_intro: 'ଆପଣଙ୍କ ବୃତ୍ତି କୁହନ୍ତୁ କିମ୍ବା ରେଜ୍ୟୁମେ ଅପଲୋଡ୍ କରନ୍ତୁ', coach_placeholder: 'ଉଦା: ମୁଁ 10 ବର୍ଷର କୃଷକ', coach_cta: 'ମୋର AI ଅପଗ୍ରେଡ୍ ବାଟ ଦେଖାନ୍ତୁ', tools_label: 'ମୁଁ ବର୍ତ୍ତମାନ ବ୍ୟବହାର କରେ:', stop_using: 'ବନ୍ଦ କରନ୍ତୁ', start_using: 'ଆରମ୍ଭ କରନ୍ତୁ', free_badge: 'ମାଗଣା', paid_badge: 'ଦେୟ', cert_title: 'ଆପଣଙ୍କ ମାଗଣା ସାର୍ଟିଫିକେଟ୍', cert_enrol: 'ବର୍ତ୍ତମାନ ନାମ ଲେଖାନ୍ତୁ', cert_consent: 'ମୁଁ ଆପଣଙ୍କୁ ଏହି କୋର୍ସରେ ପଞ୍ଜିକରଣ କରିବି କି?', cert_yes: 'ହଁ, ପଞ୍ଜିକରଣ କରନ୍ତୁ', cert_no: 'ନା, ମୁଁ ନିଜେ କରିବି', roadmap_title: 'ଆପଣଙ୍କ ଶିକ୍ଷଣ ରୋଡମ୍ୟାପ୍', roadmap_placeholder: 'ଉଦା: ମୁଁ Agentic AI ଶିଖିବାକୁ ଚାହେଁ', roadmap_cta: 'ରୋଡମ୍ୟାପ୍ ତିଆରି କରନ୍ତୁ', analogy_label: 'ଏହିପରି ବୁଝାନ୍ତୁ:', analogy_cricket: 'କ୍ରିକେଟ୍', analogy_market: 'ଶେୟାର ବଜାର', analogy_farming: 'କୃଷି', analogy_bollywood: 'ବଲିଉଡ୍', analogy_cooking: 'ରନ୍ଧନ', analogy_code: 'କୋଡ୍', feedback_helpful: 'ଏହା ସହାୟକ ଥିଲା', feedback_not: 'ଏହା ସହାୟକ ନ ଥିଲା', feedback_edit: 'ଏହାକୁ ସଂଶୋଧନ କରନ୍ତୁ', feedback_speak: 'କହି ମତାମତ ଦିଅନ୍ତୁ', feedback_read: 'ବଡ ପାଟିରେ ପଢନ୍ତୁ', chitti_forget: 'ଚିଟ୍ଟି ଭୁଲିଯାଅ (ଡାଟା ଲିଭାନ୍ତୁ)', privacy_note: 'ଆପଣଙ୍କ ଡାଟା କେବଳ ଆପଣଙ୍କ ଡିଭାଇସରେ ରହେ।', loading: 'ଲୋଡ୍ ହେଉଛି…', error_generic: 'କିଛି ଭୁଲ ହେଲା। ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।' },
  };

  const KEYS = Object.keys(UI_STRINGS.en);

  function t(key, lang) { const L = UI_STRINGS[lang] || UI_STRINGS.en; return (key in L) ? L[key] : (UI_STRINGS.en[key] || key); }
  function listLangs() { return LANGS.slice(); }

  // Completeness check — returns { lang: [missingKeys] } (empty object = complete).
  function missingKeys() {
    const out = {};
    for (const lang of LANGS) {
      const have = UI_STRINGS[lang] || {};
      const miss = KEYS.filter(k => !(k in have) || have[k] == null || have[k] === '');
      if (miss.length) out[lang] = miss;
    }
    return out;
  }

  function _doc() { try { return (typeof document !== 'undefined') ? document : null; } catch (e) { return null; } }
  function _persist(lang) {
    try { if (typeof localStorage !== 'undefined') { localStorage.setItem('cnai_lang', lang); localStorage.setItem('chitti_lang', lang); } } catch (e) {}
  }

  // applyLanguage(lang) — re-render every [data-i18n] / [data-i18n-aria] element.
  function applyLanguage(lang) {
    if (!UI_STRINGS[lang]) lang = 'en';
    const s = UI_STRINGS[lang];
    const doc = _doc();
    if (doc) {
      doc.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (s[key]) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.setAttribute('placeholder', s[key]);
          else el.textContent = s[key];
        }
      });
      doc.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        if (s[key]) el.setAttribute('aria-label', s[key]);
      });
      if (doc.documentElement) doc.documentElement.setAttribute('lang', lang);
    }
    _persist(lang);
    return lang;
  }

  function changeLanguageI18n(lang) { return applyLanguage(lang); }

  // Auto-detect: navigator.language → if an Indian language we support, use it; else en (CEOS).
  function autoDetect() {
    try {
      if (typeof localStorage !== 'undefined') { const saved = localStorage.getItem('cnai_lang') || localStorage.getItem('chitti_lang'); if (saved && UI_STRINGS[saved]) return saved; }
    } catch (e) {}
    try {
      const nav = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'en';
      const code = String(nav).toLowerCase().split('-')[0];
      if (UI_STRINGS[code]) return code;
      // any Indian locale we don't have a full bundle for → Hindi default (CEOS)
      if (/^(hi|bn|te|ta|mr|gu|kn|ml|pa|or|as|ur|sa|ne|sd|ks|kok|mai|brx|sat|doi|mni)$/.test(code)) return 'hi';
    } catch (e) {}
    return 'en';
  }

  // Wire to the page on load (cooperates with the existing changeLanguage()).
  function init() {
    const doc = _doc(); if (!doc) return;
    const start = autoDetect();
    applyLanguage(start);
    const sel = doc.getElementById('lang-select');
    if (sel) { try { sel.value = start; } catch (e) {} sel.addEventListener('change', e => applyLanguage(e.target.value)); }
  }
  try { const doc = _doc(); if (doc) { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init(); } } catch (e) {}

  return { UI_STRINGS, KEYS, TECH_TERMS, applyLanguage, changeLanguageI18n, autoDetect, t, listLangs, missingKeys, init };
});
