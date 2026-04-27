// ═══════════════════════════════════════════════════════════════
// HAT: guardian
// Chitti Guardian — PROACTIVE weather + future SOS server.
// The whole point: tells you tomorrow's weather BEFORE you ask.
// Silent on calm days. Loud on dangerous days.
// ═══════════════════════════════════════════════════════════════
const log = require('../../lib/logger').forHat('guardian');
const { geocodeCity, fetchTomorrowForecast, fetchTodayWeather } = require('./forecast');
const { checkAlerts } = require('./alerts');
const TH = require('./thresholds');

const FALLBACK = {
  en: 'Weather service is briefly unavailable. Try again in a moment.',
  hi: 'मौसम सेवा अभी उपलब्ध नहीं है। कुछ देर बाद कोशिश करें।',
  bn: 'আবহাওয়া পরিষেবা সাময়িকভাবে অনুপলব্ধ। একটু পরে চেষ্টা করুন।',
};

module.exports = {
  meta: {
    hat: 'guardian',
    version: '1.0.0',
    owner: 'sire',
    description: 'Proactive weather alerts — IMD/NDMA-anchored thresholds, multilingual, silent on calm days',
    languages: ['en', 'hi', 'bn'],
    sla: { p99_ms: 1500, availability: 0.995 },
    pii_tier: 'safe',          // city name only — no personal data leaves
    deepseek_fallback: false,  // deterministic templates — no LLM
    graduation_target: null,   // not applicable; this hat is pure data
    sources: ['Open-Meteo (ERA5)', 'IMD (thresholds)', 'NDMA (cyclone categories)'],
  },

  register(app, ctx) {
    // PROACTIVE — the headline endpoint
    app.get('/api/guardian/proactive', async (req, res) => {
      const { city = 'Indore', lang = 'en' } = req.query;
      try {
        const geo = await geocodeCity(city);
        if (!geo) return res.json({ city, alerts: [], note: 'Could not geocode city' });

        const forecast = await fetchTomorrowForecast(geo.lat, geo.lon);
        if (!forecast) return res.json({ city, alerts: [], note: 'Forecast unavailable' });

        const alerts = checkAlerts(forecast, city, lang);
        res.json({
          city,
          lang,
          tomorrow: forecast.date,
          alerts,
          alert_count: alerts.length,
          forecast_summary: {
            temp_max_c: Math.round(forecast.temp_max_c),
            temp_min_c: Math.round(forecast.temp_min_c),
            rain_mm:    Math.round(forecast.rain_mm),
            wind_kmph:  Math.round(forecast.wind_kmph),
            source:     forecast.source,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        log.error('proactive_failed', { city, error: err.message });
        res.status(503).json({ error: FALLBACK[lang] || FALLBACK.en });
      }
    });

    // REACTIVE — today's weather (used by morning brief)
    app.get('/api/weather', async (req, res) => {
      const { city = 'Indore', lang = 'en' } = req.query;
      try {
        const w = await fetchTodayWeather(city, lang);
        if (!w) {
          return res.json({
            city,
            error: true,
            chitti_message: lang === 'hi' ? 'Aaj ka mausam abhi fetch nahi ho paya.' : 'Could not fetch weather right now.',
          });
        }
        // Compose Chitti-voice message (deterministic — same as before)
        let warning = null;
        if (w.temp >= TH.heatwave_temp_c) {
          warning = lang === 'hi' ? `Heatwave alert — ${w.temp}°C. Paani pite rahein.` : `Heatwave alert — ${w.temp}°C. Stay hydrated.`;
        } else if (w.temp >= 35) {
          warning = lang === 'hi' ? `Garmi zyada hai — ${w.temp}°C.` : `Hot day — ${w.temp}°C.`;
        }
        if (w.main === 'Rain' || w.main === 'Thunderstorm') {
          warning = lang === 'hi' ? 'Baarish aa sakti hai. Chhata rakhein.' : 'Rain expected. Carry an umbrella.';
        }
        const chittiMessage = lang === 'hi'
          ? `${city} mein aaj ${w.temp}°C — ${w.condition}. Feels like ${w.feels_like}°C. Humidity ${w.humidity}%.${warning ? ' ' + warning : ''}`
          : `${city} today — ${w.temp}°C, ${w.condition}. Feels like ${w.feels_like}°C. Humidity ${w.humidity}%.${warning ? ' ' + warning : ''}`;
        res.json({
          city, ...w, warning,
          chitti_message: chittiMessage,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        log.error('today_failed', { city, error: err.message });
        res.json({ city, error: true, chitti_message: FALLBACK[lang] || FALLBACK.en });
      }
    });
  },

  cron: [],   // proactive endpoint is pull-based; future SOS hat will add quake-poll cron

  health() {
    return {
      ok: true,
      endpoints: ['GET /api/guardian/proactive', 'GET /api/weather'],
      thresholds_review_due: TH._meta.next_review,
    };
  },
};
