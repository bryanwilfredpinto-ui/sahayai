// ═══════════════════════════════════════════════════════════════
// routes/guardian/templates.js
// Multilingual alert templates. Adding a language = adding a key block.
// Templates mirror IMD/NDMA bulletin phrasing (Pillar 2).
// ═══════════════════════════════════════════════════════════════

module.exports = {
  heatwave: {
    en: (city, t) => `🔥 Heatwave alert — ${city}. Tomorrow ${t}°C expected (IMD heatwave threshold ≥40°C). Carry water. Avoid 12-3 PM outdoor work. Could save you ~₹200 (clinic + ORS).`,
    hi: (city, t) => `🔥 लू की चेतावनी — ${city}। कल ${t}°C तक (IMD लू मानक ≥40°C)। पानी साथ रखें। दोपहर 12-3 बजे बाहर न जाएं। ~₹200 बच सकते हैं।`,
    bn: (city, t) => `🔥 তাপপ্রবাহ সতর্কতা — ${city}। আগামীকাল ${t}°C পর্যন্ত (IMD তাপপ্রবাহ মাত্রা ≥৪০°C)। জল সঙ্গে রাখুন। দুপুর ১২-৩টায় বাইরে কাজ এড়িয়ে চলুন। ~₹২০০ বাঁচতে পারে।`,
  },
  severe_heat: {
    en: (city, t) => `🚨 SEVERE HEATWAVE — ${city}. Tomorrow ${t}°C — at IMD severe heatwave level (≥43°C). Stay indoors 11 AM - 4 PM. Heat stroke risk is real. SOS: 112.`,
    hi: (city, t) => `🚨 गंभीर लू — ${city}। कल ${t}°C — IMD गंभीर लू स्तर (≥43°C)। 11 AM - 4 PM घर में रहें। हीट स्ट्रोक का खतरा। SOS: 112।`,
    bn: (city, t) => `🚨 চরম তাপপ্রবাহ — ${city}। আগামীকাল ${t}°C — IMD চরম তাপপ্রবাহ মাত্রা (≥৪৩°C)। সকাল ১১টা - বিকেল ৪টা ঘরে থাকুন। হিট স্ট্রোকের ঝুঁকি। SOS: ১১২।`,
  },
  cold_wave: {
    en: (city, t) => `🥶 Cold wave — ${city}. Tomorrow night ${t}°C (IMD cold wave ≤10°C). Cover yourself. Check on elderly neighbours. ~₹150 saved (medication).`,
    hi: (city, t) => `🥶 शीत लहर — ${city}। कल रात ${t}°C (IMD शीत लहर ≤10°C)। गर्म कपड़े पहनें। बुजुर्गों का ध्यान रखें। ~₹150 बचेंगे।`,
    bn: (city, t) => `🥶 শৈত্যপ্রবাহ — ${city}। আগামীকাল রাতে ${t}°C (IMD শৈত্যপ্রবাহ ≤১০°C)। গরম পোশাক পরুন। বয়স্কদের খেয়াল রাখুন। ~₹১৫০ বাঁচবে।`,
  },
  heavy_rain: {
    en: (city, mm) => `🌧️ Heavy rain — ${city}. Tomorrow up to ${mm}mm (IMD heavy rain ≥64.5mm). Protect anything outside. Avoid low-lying roads. Could prevent ~₹2,000+ damage.`,
    hi: (city, mm) => `🌧️ भारी बारिश — ${city}। कल ${mm}mm तक (IMD भारी बारिश ≥64.5mm)। बाहर रखी चीज़ें ढक दें। निचली सड़कों से बचें। ~₹2,000+ का नुकसान बच सकता है।`,
    bn: (city, mm) => `🌧️ ভারী বৃষ্টি — ${city}। আগামীকাল ${mm}mm পর্যন্ত (IMD ভারী বৃষ্টি ≥৬৪.৫mm)। বাইরে রাখা জিনিস ঢেকে রাখুন। নিচু রাস্তা এড়িয়ে চলুন। ~₹২,০০০+ ক্ষতি এড়ানো যেতে পারে।`,
  },
  very_heavy_rain: {
    en: (city, mm) => `⚠️ VERY HEAVY RAIN — ${city}. Tomorrow ${mm}mm (IMD very heavy ≥115.6mm). Flooding risk. Avoid travel. Move valuables to higher ground. SOS: 112.`,
    hi: (city, mm) => `⚠️ अत्यधिक भारी बारिश — ${city}। कल ${mm}mm (IMD अत्यधिक ≥115.6mm)। बाढ़ का खतरा। यात्रा टालें। सामान ऊपर रखें। SOS: 112।`,
    bn: (city, mm) => `⚠️ অতি ভারী বৃষ্টি — ${city}। আগামীকাল ${mm}mm (IMD অতি ভারী ≥১১৫.৬mm)। বন্যার ঝুঁকি। ভ্রমণ এড়িয়ে চলুন। জিনিসপত্র উপরে রাখুন। SOS: ১১২।`,
  },
  cyclone: {
    en: (city, w) => `🌀 Cyclone alert — ${city}. Wind up to ${w} kmph (NDMA cyclonic storm ≥62 kmph). Charge phone. Stock 3 days water + dry food. Stay indoors. SOS: 112.`,
    hi: (city, w) => `🌀 चक्रवात चेतावनी — ${city}। हवा ${w} kmph तक (NDMA चक्रवात ≥62 kmph)। फोन चार्ज करें। 3 दिन का पानी + सूखा खाना जमा करें। घर में रहें। SOS: 112।`,
    bn: (city, w) => `🌀 ঘূর্ণিঝড় সতর্কতা — ${city}। বাতাস ${w} kmph পর্যন্ত (NDMA ঘূর্ণিঝড় ≥৬২ kmph)। ফোন চার্জ করুন। ৩ দিনের জল + শুকনো খাবার মজুত রাখুন। ঘরে থাকুন। SOS: ১১২।`,
  },
};
