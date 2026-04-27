// ═══════════════════════════════════════════════════════════════
// routes/guardian/alerts.js
// The proactive brain: pure function from forecast → alerts list.
// No I/O. No side effects. Easy to unit test.
// ═══════════════════════════════════════════════════════════════
const TH = require('./thresholds');
const T  = require('./templates');

function pickLang(requested) {
  return T.heatwave[requested] ? requested : 'en';
}

/**
 * Given a forecast and city, return list of alerts that crossed thresholds.
 * Returns [] on calm days. That silence is the product.
 */
function checkAlerts(forecast, city, requestedLang) {
  const lang = pickLang(requestedLang);
  const alerts = [];

  // Heat
  if (forecast.temp_max_c >= TH.severe_heat_c) {
    alerts.push({
      type: 'severe_heat',
      severity: 'red',
      message: T.severe_heat[lang](city, Math.round(forecast.temp_max_c)),
      forecast_value: Math.round(forecast.temp_max_c),
      threshold: TH.severe_heat_c,
      authority: 'IMD',
    });
  } else if (forecast.temp_max_c >= TH.heatwave_temp_c) {
    alerts.push({
      type: 'heatwave',
      severity: 'amber',
      message: T.heatwave[lang](city, Math.round(forecast.temp_max_c)),
      forecast_value: Math.round(forecast.temp_max_c),
      threshold: TH.heatwave_temp_c,
      authority: 'IMD',
    });
  }

  // Cold
  if (forecast.temp_min_c <= TH.cold_wave_temp_c) {
    alerts.push({
      type: 'cold_wave',
      severity: 'amber',
      message: T.cold_wave[lang](city, Math.round(forecast.temp_min_c)),
      forecast_value: Math.round(forecast.temp_min_c),
      threshold: TH.cold_wave_temp_c,
      authority: 'IMD',
    });
  }

  // Rain
  if (forecast.rain_mm >= TH.very_heavy_rain_mm) {
    alerts.push({
      type: 'very_heavy_rain',
      severity: 'red',
      message: T.very_heavy_rain[lang](city, Math.round(forecast.rain_mm)),
      forecast_value: Math.round(forecast.rain_mm),
      threshold: TH.very_heavy_rain_mm,
      authority: 'IMD',
    });
  } else if (forecast.rain_mm >= TH.heavy_rain_mm) {
    alerts.push({
      type: 'heavy_rain',
      severity: 'amber',
      message: T.heavy_rain[lang](city, Math.round(forecast.rain_mm)),
      forecast_value: Math.round(forecast.rain_mm),
      threshold: TH.heavy_rain_mm,
      authority: 'IMD',
    });
  }

  // Cyclone
  if (forecast.wind_kmph >= TH.cyclone_wind_kmph) {
    alerts.push({
      type: 'cyclone',
      severity: 'red',
      message: T.cyclone[lang](city, Math.round(forecast.wind_kmph)),
      forecast_value: Math.round(forecast.wind_kmph),
      threshold: TH.cyclone_wind_kmph,
      authority: 'NDMA',
    });
  }

  return alerts;
}

module.exports = { checkAlerts };
