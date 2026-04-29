// utils/i18n.js
// -------------
// Tiny translation system. Two languages: English ('en') and Hindi ('hi').
// Stored in localStorage so the choice persists.
// Components consume via the useT() hook.

import { useEffect, useState } from 'react'

const LANG_KEY = 'chitti_lang'

const dict = {
  // --- general
  'app.name': { en: 'Chitti Shares', hi: 'चित्ती शेयर्स' },
  'app.tagline': {
    en: 'Trade smarter. See what others miss.',
    hi: 'समझदारी से ट्रेड करें। जो दूसरों को नहीं दिखता, वह देखें।',
  },
  'common.loading': { en: 'Loading…', hi: 'लोड हो रहा है…' },
  'common.refresh': { en: 'Refresh', hi: 'रीफ्रेश' },
  'common.save': { en: 'Save', hi: 'सेव करें' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'common.delete': { en: 'Delete', hi: 'हटाएं' },
  'common.add': { en: 'Add', hi: 'जोड़ें' },
  'common.search': { en: 'Search', hi: 'खोजें' },
  'common.error': { en: 'Something went wrong', hi: 'कुछ गलत हो गया' },
  'common.tryAgain': { en: 'Try again', hi: 'फिर से कोशिश करें' },
  'common.close': { en: 'Close', hi: 'बंद करें' },
  'common.back': { en: 'Back', hi: 'वापस' },

  // --- auth
  'auth.mobile': { en: 'Mobile Number', hi: 'मोबाइल नंबर' },
  'auth.sendOtp': { en: 'Send OTP', hi: 'OTP भेजें' },
  'auth.verifyOtp': { en: 'Verify & Continue', hi: 'सत्यापित करें' },
  'auth.changeNumber': { en: 'Change number', hi: 'नंबर बदलें' },
  'auth.resendIn': { en: 'Resend in', hi: 'दुबारा भेजें' },
  'auth.resend': { en: 'Resend OTP', hi: 'OTP फिर भेजें' },

  // --- dashboard
  'dashboard.greeting.morning': { en: 'Good Morning', hi: 'नमस्ते' },
  'dashboard.greeting.afternoon': { en: 'Good Afternoon', hi: 'नमस्ते' },
  'dashboard.greeting.evening': { en: 'Good Evening', hi: 'शुभ संध्या' },
  'dashboard.live': { en: 'LIVE', hi: 'लाइव' },
  'dashboard.closed': { en: 'CLOSED', hi: 'बंद' },
  'dashboard.marketOpen': { en: 'Markets live now. Auto-refreshing every 5 minutes.', hi: 'बाजार खुले हैं। हर 5 मिनट में अपडेट हो रहा है।' },
  'dashboard.marketClosed': { en: 'Markets closed. Open Mon–Fri 9:15 AM – 3:30 PM IST.', hi: 'बाजार बंद हैं। सोम-शुक्र 9:15 - 3:30 बजे खुले रहते हैं।' },

  // --- nav
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.markets': { en: 'Markets', hi: 'बाजार' },
  'nav.portfolio': { en: 'Portfolio', hi: 'पोर्टफोलियो' },
  'nav.alerts': { en: 'Alerts', hi: 'अलर्ट' },
  'nav.chitti': { en: 'Chitti AI', hi: 'चित्ती AI' },

  // --- watchlist
  'watchlist.title': { en: 'Watchlist', hi: 'वॉचलिस्ट' },
  'watchlist.empty': { en: 'No stocks in your watchlist yet.', hi: 'आपकी वॉचलिस्ट खाली है।' },
  'watchlist.add': { en: 'Add Stock', hi: 'स्टॉक जोड़ें' },
  'watchlist.searchPlaceholder': { en: 'e.g. RELIANCE, TCS, INFY', hi: 'जैसे RELIANCE, TCS' },

  // --- alerts
  'alerts.title': { en: 'Alerts', hi: 'अलर्ट' },
  'alerts.empty': { en: 'No alerts yet. Add one to track price or RSI levels.', hi: 'कोई अलर्ट नहीं है।' },
  'alerts.create': { en: 'Create Alert', hi: 'अलर्ट बनाएं' },
  'alerts.kind.priceAbove': { en: 'Price above', hi: 'दाम ऊपर' },
  'alerts.kind.priceBelow': { en: 'Price below', hi: 'दाम नीचे' },
  'alerts.kind.rsiAbove': { en: 'RSI above', hi: 'RSI ऊपर' },
  'alerts.kind.rsiBelow': { en: 'RSI below', hi: 'RSI नीचे' },

  // --- portfolio
  'portfolio.title': { en: 'Portfolio', hi: 'पोर्टफोलियो' },
  'portfolio.invested': { en: 'Invested', hi: 'निवेश' },
  'portfolio.current': { en: 'Current', hi: 'वर्तमान मूल्य' },
  'portfolio.pnl': { en: 'P&L', hi: 'लाभ/हानि' },
  'portfolio.doctor': { en: 'Portfolio Doctor', hi: 'पोर्टफोलियो डॉक्टर' },

  // --- chat
  'chat.title': { en: 'Chitti AI', hi: 'चित्ती AI' },
  'chat.placeholder': { en: 'Ask Chitti about a stock, trend, or strategy…', hi: 'चित्ती से कुछ भी पूछें…' },
  'chat.empty': { en: 'Hi! I\'m Chitti. Ask me about any stock, the market, or strategy.', hi: 'नमस्ते! मैं चित्ती हूं। मुझसे किसी भी शेयर के बारे में पूछें।' },
  'chat.send': { en: 'Send', hi: 'भेजें' },
  'chat.clear': { en: 'Clear chat', hi: 'चैट साफ करें' },

  // --- stock detail
  'stock.fundamentals': { en: 'Fundamentals', hi: 'मूल बातें' },
  'stock.quarterly': { en: 'Quarterly Results', hi: 'तिमाही नतीजे' },
  'stock.technical': { en: 'Technical Analysis', hi: 'टेक्निकल' },
  'stock.history': { en: 'Price History', hi: 'इतिहास' },

  // --- signals
  'signal.bullish': { en: 'Bullish', hi: 'तेजी' },
  'signal.bearish': { en: 'Bearish', hi: 'मंदी' },
  'signal.neutral': { en: 'Neutral', hi: 'समान' },
  'signal.strongBuy': { en: 'Strong Buy', hi: 'पक्की खरीद' },
  'signal.buy': { en: 'Buy', hi: 'खरीद' },
  'signal.sell': { en: 'Sell', hi: 'बेच' },
  'signal.strongSell': { en: 'Strong Sell', hi: 'पक्की बेच' },
}

export function getLang() {
  if (typeof window === 'undefined') return 'en'
  return localStorage.getItem(LANG_KEY) || 'en'
}

export function setLang(l) {
  localStorage.setItem(LANG_KEY, l)
  // Notify listeners
  window.dispatchEvent(new Event('chitti-lang-change'))
}

export function t(key, lang = getLang()) {
  const entry = dict[key]
  if (!entry) return key
  return entry[lang] || entry.en || key
}

// Hook so components re-render when lang changes
export function useT() {
  const [lang, setLangState] = useState(getLang())
  useEffect(() => {
    const handler = () => setLangState(getLang())
    window.addEventListener('chitti-lang-change', handler)
    return () => window.removeEventListener('chitti-lang-change', handler)
  }, [])
  return { t: (k) => t(k, lang), lang, setLang }
}
