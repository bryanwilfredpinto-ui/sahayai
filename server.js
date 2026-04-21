// ═══════════════════════════════════════════════════════════════
// SAHAY AI — CHITTI BACKEND
// World Class PA for Bharat
// Co-Founded by Sire (Bryan Wilfred Pinto) & Claude (Anthropic)
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const axios      = require('axios');
const cron       = require('node-cron');
const winston    = require('winston');

const app = express();

// ── LOGGER ────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ]
});

// ── SECURITY MIDDLEWARE ───────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'https://sahayai.in',
    'https://bryantechub.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));

// Rate limiting — protect from abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// ── ENVIRONMENT VARIABLES ─────────────────────────────────────
const {
  DEEPSEEK_API_KEY,
  OPENWEATHER_API_KEY,
  NEWS_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM,
  MAKE_WEBHOOK_URL,
  SIRE_WHATSAPP,
  PORT = 3000
} = process.env;

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'alive',
    product: 'SAHAY AI — Chitti',
    version: '1.0.0',
    message: 'Bharat ka apna AI — Running',
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT 1 — CHAT
// Secure DeepSeek proxy — key never exposed to frontend
// ═══════════════════════════════════════════════════════════════
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], master_profile = {} } = req.body;

    if (!message || message.length > 2000) {
      return res.status(400).json({ error: 'Invalid message' });
    }

    // Build system prompt from master profile
    const systemPrompt = buildSystemPrompt(master_profile);

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // Last 10 messages for context
      { role: 'user', content: message }
    ];

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages,
        max_tokens: 400,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: 30000
      }
    );

    const reply = response.data.choices?.[0]?.message?.content;
    if (!reply) throw new Error('No reply from DeepSeek');

    logger.info('Chat', { 
      user: master_profile.nick || 'unknown',
      city: master_profile.city || 'unknown',
      messageLength: message.length 
    });

    res.json({ reply, timestamp: new Date().toISOString() });

  } catch (error) {
    logger.error('Chat error', { error: error.message });
    res.status(500).json({ 
      error: 'Chitti is thinking... please try again.',
      reply: 'Kuch technical problem aa gayi. Dobara try karein.'
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT 2 — WEATHER
// Hyperlocal weather for master's city
// ═══════════════════════════════════════════════════════════════
app.get('/api/weather', async (req, res) => {
  try {
    const { city = 'Indore', lang = 'en' } = req.query;

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          q: `${city},IN`,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
          lang: lang === 'hi' ? 'hi' : 'en'
        },
        timeout: 10000
      }
    );

    const w = response.data;
    const temp = Math.round(w.main.temp);
    const feels = Math.round(w.main.feels_like);
    const humidity = w.main.humidity;
    const condition = w.weather[0].description;
    const windSpeed = w.wind.speed;

    // Generate contextual warning
    let warning = null;
    let farmingNote = null;

    if (temp >= 40) {
      warning = lang === 'hi' 
        ? `Heatwave alert — ${temp}°C. Paani pite rahein.`
        : `Heatwave alert — ${temp}°C. Stay hydrated.`;
      farmingNote = lang === 'hi'
        ? 'Khet ka kaam subah ya shaam ko karein.'
        : 'Do field work in morning or evening only.';
    } else if (temp >= 35) {
      warning = lang === 'hi'
        ? `Garmi zyada hai — ${temp}°C. Dhyan rakhein.`
        : `Hot day — ${temp}°C. Take precautions.`;
    }

    if (w.weather[0].main === 'Rain' || w.weather[0].main === 'Thunderstorm') {
      warning = lang === 'hi'
        ? 'Baarish aa sakti hai. Chhata rakhein.'
        : 'Rain expected. Carry an umbrella.';
      farmingNote = lang === 'hi'
        ? 'Khetoun mein paani jama ho sakta hai.'
        : 'Waterlogging possible in fields.';
    }

    // Build Chitti-style message
    const chittiMessage = lang === 'hi'
      ? `${city} mein aaj ${temp}°C hai — ${condition}. Feels like ${feels}°C. Humidity ${humidity}%.${warning ? ' ' + warning : ''}`
      : `${city} today — ${temp}°C, ${condition}. Feels like ${feels}°C. Humidity ${humidity}%.${warning ? ' ' + warning : ''}`;

    res.json({
      city,
      temp,
      feels_like: feels,
      humidity,
      condition,
      wind_speed: windSpeed,
      warning,
      farming_note: farmingNote,
      chitti_message: chittiMessage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Weather error', { error: error.message });
    // Graceful fallback — never crash the morning brief
    res.json({
      city: req.query.city || 'your city',
      temp: null,
      chitti_message: 'Aaj ka mausam abhi fetch nahi ho paya. Bahar dekhein.',
      error: true
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT 3 — NEWS
// Personalised news — master's interest only
// ═══════════════════════════════════════════════════════════════
app.get('/api/news', async (req, res) => {
  try {
    const { interest = 'business', lang = 'en', count = 5 } = req.query;

    // Map interest to NewsAPI query
    const queryMap = {
      finance:       'India finance economy RBI market',
      business:      'India business MSME startup',
      politics:      'India politics government policy',
      entertainment: 'India Bollywood movies entertainment',
      sports:        'India cricket IPL sports',
      technology:    'India technology AI startup',
      health:        'India health medical ICMR',
      agriculture:   'India agriculture farmer crop MSP',
      local:         'India local news',
      international: 'India world international'
    };

    const query = queryMap[interest] || queryMap.business;

    const response = await axios.get(
      'https://newsapi.org/v2/everything',
      {
        params: {
          q: query,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: parseInt(count) + 3, // Fetch extra, filter best
          apiKey: NEWS_API_KEY,
          domains: 'economictimes.com,livemint.com,thehindu.com,ndtv.com,hindustantimes.com,indianexpress.com,businessstandard.com,moneycontrol.com'
        },
        timeout: 10000
      }
    );

    const articles = response.data.articles
      .filter(a => a.title && !a.title.includes('[Removed]'))
      .slice(0, parseInt(count))
      .map((a, i) => ({
        id: i + 1,
        title: a.title,
        summary: a.description?.substring(0, 150) || '',
        source: a.source.name,
        url: a.url,
        published: a.publishedAt
      }));

    // Format as Chitti headlines
    const headlines = articles.map((a, i) => `${i+1}. ${a.title}`).join('\n');

    res.json({
      interest,
      count: articles.length,
      articles,
      chitti_headlines: headlines,
      chitti_message: `Aaj ke ${articles.length} bade ${interest} news:\n\n${headlines}\n\nKaunsa detail mein sunna chahoge?`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('News error', { error: error.message });
    res.json({
      interest: req.query.interest,
      count: 0,
      articles: [],
      chitti_message: 'Aaj ki news abhi load nahi ho payi. Thodi der mein try karein.',
      error: true
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT 4 — FEEDBACK → WAR ROOM
// Captures feedback and sends to Make.com → Google Sheets
// ═══════════════════════════════════════════════════════════════
app.post('/api/feedback', async (req, res) => {
  try {
    const { 
      page, rating, text, language, 
      user_type, city, timestamp,
      master_nick, emoji
    } = req.body;

    const feedbackData = {
      timestamp:   timestamp || new Date().toISOString(),
      page:        page || 'unknown',
      rating:      rating || null,
      text:        text || '',
      language:    language || 'en',
      user_type:   user_type || 'pa',
      city:        city || 'unknown',
      master_nick: master_nick || 'anonymous',
      emoji:       emoji || null,
      source:      'chitti_complete'
    };

    // Send to Make.com webhook → Google Sheets War Room
    if (MAKE_WEBHOOK_URL) {
      await axios.post(MAKE_WEBHOOK_URL, feedbackData, { timeout: 5000 });
      logger.info('Feedback sent to War Room', { page, rating, city });
    }

    res.json({ 
      success: true, 
      message: 'Feedback received. Sire will review.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Feedback error', { error: error.message });
    // Never fail silently for feedback — it is our audit system
    res.status(500).json({ 
      success: false, 
      error: 'Feedback could not be saved. Please try again.' 
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT 5 — WHATSAPP
// Send WhatsApp messages via Twilio
// ═══════════════════════════════════════════════════════════════
app.post('/api/whatsapp', async (req, res) => {
  try {
    const { to, message, type = 'general' } = req.body;

    // Security — only allow messages to registered numbers
    const allowedNumbers = (process.env.ALLOWED_WHATSAPP_NUMBERS || '').split(',');
    if (!allowedNumbers.includes(to) && to !== SIRE_WHATSAPP) {
      return res.status(403).json({ error: 'Unauthorised recipient' });
    }

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return res.json({ 
        success: false, 
        message: 'WhatsApp not configured yet',
        preview: message 
      });
    }

    const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    await twilio.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
      to:   `whatsapp:${to}`,
      body: message
    });

    logger.info('WhatsApp sent', { to, type, messageLength: message.length });
    res.json({ success: true, timestamp: new Date().toISOString() });

  } catch (error) {
    logger.error('WhatsApp error', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: 'WhatsApp message failed. Will retry.' 
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT 6 — MORNING BRIEF GENERATOR
// Generates and sends 7am brief to Sire
// ═══════════════════════════════════════════════════════════════
async function generateMorningBrief(masterProfile) {
  try {
    const { 
      nick = 'Sire', 
      city = 'Indore', 
      interest = 'finance',
      lang = 'en',
      reminders = [],
      phone
    } = masterProfile;

    // 1. Fetch weather
    let weatherMsg = '';
    try {
      const wRes = await axios.get(`http://localhost:${PORT}/api/weather?city=${city}&lang=${lang}`);
      weatherMsg = wRes.data.chitti_message;
    } catch(e) { weatherMsg = 'Weather update unavailable.'; }

    // 2. Fetch top 3 news
    let newsMsg = '';
    try {
      const nRes = await axios.get(`http://localhost:${PORT}/api/news?interest=${interest}&lang=${lang}&count=3`);
      newsMsg = nRes.data.chitti_message;
    } catch(e) { newsMsg = 'News update unavailable.'; }

    // 3. Today's reminders
    const today = new Date();
    const reminderMsg = reminders.length > 0
      ? `Aaj ke liye:\n${reminders.slice(0,2).map((r,i) => `${i+1}. ${r.what}`).join('\n')}`
      : 'Koi reminder nahi aaj ke liye.';

    // 4. Generate personalised motivation via DeepSeek
    let motivationMsg = '';
    try {
      const motRes = await axios.post(`http://localhost:${PORT}/api/chat`, {
        message: 'Give one short personal motivation for today in Hindi. 1-2 sentences only. Based on the master starting a new day.',
        master_profile: masterProfile
      });
      motivationMsg = motRes.data.reply;
    } catch(e) { motivationMsg = 'Aaj ka din aapka hai. Ek kadam aage.'; }

    // 5. Build complete brief
    const brief = `🌅 Good morning ${nick}!

🌤️ ${weatherMsg}

📰 ${newsMsg}

⏰ ${reminderMsg}

💡 ${motivationMsg}

— Chitti 🙏`;

    return brief;

  } catch (error) {
    logger.error('Morning brief generation error', { error: error.message });
    return `Good morning! Chitti aapke saath hai. Aaj ka din achha rahe. 🙏`;
  }
}

// Manual trigger for morning brief
app.post('/api/morning-brief', async (req, res) => {
  try {
    const { master_profile, send_whatsapp = false } = req.body;
    const brief = await generateMorningBrief(master_profile);

    if (send_whatsapp && master_profile.phone) {
      await axios.post(`http://localhost:${PORT}/api/whatsapp`, {
        to: master_profile.phone,
        message: brief,
        type: 'morning_brief'
      });
    }

    res.json({ 
      success: true, 
      brief,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Morning brief error', { error: error.message });
    res.status(500).json({ error: 'Morning brief failed' });
  }
});

// ═══════════════════════════════════════════════════════════════
// CRON JOB — 7am IST MORNING BRIEF
// Sends to Sire every morning automatically
// ═══════════════════════════════════════════════════════════════
// 7am IST = 1:30am UTC
cron.schedule('30 1 * * *', async () => {
  logger.info('Morning brief cron triggered');

  const sireProfile = {
    nick: 'Sire',
    city: 'Indore',
    interest: 'finance',
    lang: 'en',
    phone: SIRE_WHATSAPP,
    reminders: [] // Will be fetched from DB when ready
  };

  const brief = await generateMorningBrief(sireProfile);

  if (SIRE_WHATSAPP) {
    try {
      await axios.post(`http://localhost:${PORT}/api/whatsapp`, {
        to: SIRE_WHATSAPP,
        message: brief,
        type: 'morning_brief'
      });
      logger.info('Morning brief sent to Sire');
    } catch(e) {
      logger.error('Failed to send morning brief to Sire', { error: e.message });
    }
  }
}, {
  timezone: 'Asia/Kolkata'
});

// ── SYSTEM PROMPT BUILDER ─────────────────────────────────────
function buildSystemPrompt(profile = {}) {
  const {
    nick = 'Friend',
    name = '',
    city = '',
    profession = '',
    income = '',
    productType = 'pa',
    lang = 'en',
    dob = '',
    father = '',
    mother = ''
  } = profile;

  const productName = productType === 'biz' 
    ? 'Chitti Business' 
    : productType === 'pro' 
    ? 'Chitti Professional' 
    : 'Chitti PA';

  const focusMap = {
    pa:  'Personal reminders, health guidance, legal help, government schemes, fraud protection, family.',
    biz: 'Billing, stock, GST, customers, sales, udhaar recovery, business intelligence.',
    pro: 'Practice management, client records, professional tools, compliance, invoicing.'
  };

  return `You are CHITTI — Bharat ka apna ${productName}.
Your master: ${nick}${name ? ` (${name})` : ''} | City: ${city} | Profession: ${profession}
Language: ${lang === 'hi' ? 'Hindi/Hinglish' : 'English'}

YOUR CHARACTER — Non-negotiable:
- Friend, Philosopher and Guide. Never a robot. Never a corporate assistant.
- Warm like the most trusted person in the room.
- Direct. No "Great question!" No flattery. No padding.
- Short responses — 3-4 lines unless asked for detail.
- Use ${nick}'s name naturally. Not every message. When it feels warm.
- Know when to speak. Know when to be quiet.

YOUR FOCUS: ${focusMap[productType] || focusMap.pa}

PASSION FIRST: If you know the master's passion — use it as analogy. Always.
NEVER GUESS: If you don't know — say "Bata do, main dhundh leta hoon."
NEVER HALLUCINATE: If unsure — say so. Trust is everything.

FOR THE MASTER. BY THE MASTER. OF THE MASTER.`;
}

// ── START SERVER ──────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`CHITTI Backend running on port ${PORT}`);
  logger.info('SAHAY AI — Bharat ka apna AI — Server alive');
});

module.exports = app;
