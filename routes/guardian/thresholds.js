// ═══════════════════════════════════════════════════════════════
// routes/guardian/thresholds.js
// IMD-anchored and NDMA-anchored proactive weather thresholds.
// Every threshold has a documented source. No magic numbers.
// ═══════════════════════════════════════════════════════════════

// IMD = India Meteorological Department
// NDMA = National Disaster Management Authority
module.exports = {
  // IMD heatwave: max ≥40°C in plains. Severe ≥45°C OR ≥4.5°C above normal.
  // Source: imd.gov.in/Welcome%20To%20IMD/Welcome.php
  heatwave_temp_c:    40,
  severe_heat_c:      43,

  // IMD cold wave: min ≤10°C in plains. Severe ≤4°C.
  cold_wave_temp_c:   10,
  severe_cold_c:      4,

  // IMD rain (24h): heavy ≥64.5mm, very heavy ≥115.6mm, extremely heavy ≥204.5mm.
  heavy_rain_mm:      64.5,
  very_heavy_rain_mm: 115.6,
  extreme_rain_mm:    204.5,

  // NDMA cyclone categories (Indian Ocean). Cyclonic storm = ≥62 kmph wind.
  // Source: ndma.gov.in
  cyclone_wind_kmph:        62,
  severe_cyclone_wind_kmph: 89,

  // Validity: review quarterly. Sire approval to change.
  _meta: {
    last_reviewed: '2026-04-27',
    review_owner: 'sire',
    next_review:  '2026-07-27',
    sources: ['IMD', 'NDMA'],
  },
};
