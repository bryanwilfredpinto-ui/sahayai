// ═══════════════════════════════════════════════════════════════
// routes/guardian/forecast.js
// Forecast data fetching. Open-Meteo for tomorrow's forecast (free, no auth, ERA5).
// OpenWeatherMap for geocoding (city → lat/lon).
// ═══════════════════════════════════════════════════════════════
const axios = require('axios');
const log = require('../../lib/logger').forHat('guardian');

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_URL    = 'https://api.openweathermap.org/geo/1.0/direct';

async function geocodeCity(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    log.warn('geocode_no_key');
    return null;
  }
  try {
    const r = await axios.get(GEOCODE_URL, {
      params: { q: `${city},IN`, limit: 1, appid: apiKey },
      timeout: 8000,
    });
    if (r.data && r.data.length > 0) {
      return { lat: r.data[0].lat, lon: r.data[0].lon };
    }
    return null;
  } catch (err) {
    log.warn('geocode_failed', { city, error: err.message });
    return null;
  }
}

async function fetchTomorrowForecast(lat, lon) {
  try {
    const r = await axios.get(OPEN_METEO_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
        forecast_days: 2,
        timezone: 'Asia/Kolkata',
      },
      timeout: 10000,
    });
    const d = r.data?.daily;
    if (!d || !d.time || d.time.length < 2) return null;
    return {
      date:        d.time[1],
      temp_max_c:  d.temperature_2m_max[1],
      temp_min_c:  d.temperature_2m_min[1],
      rain_mm:     d.precipitation_sum[1],
      wind_kmph:   d.wind_speed_10m_max[1],
      source:      'Open-Meteo (ERA5)',
    };
  } catch (err) {
    log.error('forecast_fetch_failed', { lat, lon, error: err.message });
    return null;
  }
}

async function fetchTodayWeather(city, lang = 'en') {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;
  try {
    const r = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { q: `${city},IN`, appid: apiKey, units: 'metric', lang: lang === 'hi' ? 'hi' : 'en' },
      timeout: 10000,
    });
    const w = r.data;
    return {
      temp:       Math.round(w.main.temp),
      feels_like: Math.round(w.main.feels_like),
      humidity:   w.main.humidity,
      condition:  w.weather[0].description,
      main:       w.weather[0].main,
      wind_speed: w.wind.speed,
    };
  } catch (err) {
    log.warn('weather_today_failed', { city, error: err.message });
    return null;
  }
}

module.exports = { geocodeCity, fetchTomorrowForecast, fetchTodayWeather };
