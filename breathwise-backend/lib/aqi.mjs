/**
 * Live Air Quality & Geocoding service backed by Open-Meteo (keyless public API)
 * with 5-minute in-memory caching and deterministic city-aware offline fallback.
 */

export const POPULAR_CITIES = [
  { name: 'Delhi', country: 'India', admin1: 'Delhi', latitude: 28.6139, longitude: 77.209 },
  { name: 'Gurugram', country: 'India', admin1: 'Haryana', latitude: 28.4595, longitude: 77.0266 },
  { name: 'Noida', country: 'India', admin1: 'Uttar Pradesh', latitude: 28.5355, longitude: 77.391 },
  { name: 'Mumbai', country: 'India', admin1: 'Maharashtra', latitude: 19.076, longitude: 72.8777 },
  { name: 'Kolkata', country: 'India', admin1: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { name: 'Bengaluru', country: 'India', admin1: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Patna', country: 'India', admin1: 'Bihar', latitude: 25.5941, longitude: 85.1376 },
  { name: 'Lucknow', country: 'India', admin1: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
  { name: 'Lahore', country: 'Pakistan', admin1: 'Punjab', latitude: 31.5204, longitude: 74.3587 },
  { name: 'London', country: 'United Kingdom', admin1: 'England', latitude: 51.5072, longitude: -0.1276 },
];

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6000;
const aqiCache = new Map();

async function fetchJsonWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Upstream HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function classifyUsAqi(aqi) {
  if (aqi <= 50) return { id: 'good', label: 'Good', labelHi: 'अच्छा' };
  if (aqi <= 100) return { id: 'moderate', label: 'Moderate', labelHi: 'मध्यम' };
  if (aqi <= 150) return { id: 'sensitive', label: 'Sensitive Caution', labelHi: 'संवेदनशील समूह सावधान' };
  if (aqi <= 200) return { id: 'unhealthy', label: 'Unhealthy', labelHi: 'अस्वास्थ्यकर' };
  if (aqi <= 300) return { id: 'very_unhealthy', label: 'Very Unhealthy', labelHi: 'बहुत अस्वास्थ्यकर' };
  return { id: 'hazardous', label: 'Severe / Hazardous', labelHi: 'गंभीर / खतरनाक' };
}

export function determineDominantPollutant(pm25, pm10, no2, o3) {
  const scores = [
    { name: 'PM2.5', ratio: pm25 / 35 },
    { name: 'PM10', ratio: pm10 / 150 },
    { name: 'NO2', ratio: no2 / 100 },
    { name: 'O3', ratio: o3 / 100 },
  ];
  scores.sort((a, b) => b.ratio - a.ratio);
  return scores[0]?.name ?? 'PM2.5';
}

function formatHour12(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${period}`;
}

export function findBestAiringWindow(hourly) {
  if (!Array.isArray(hourly) || hourly.length === 0) {
    return '1:00 PM – 3:00 PM';
  }
  const midday = hourly.filter((h) => h.hour >= 10 && h.hour <= 16);
  const daytime = hourly.filter((h) => h.hour >= 8 && h.hour <= 17);
  const pool = midday.length >= 2 ? midday : daytime.length >= 2 ? daytime : hourly;

  let best = pool[0];
  let bestPairAvg = Number.POSITIVE_INFINITY;
  const limit = pool.length > 1 ? pool.length - 1 : 1;

  for (let i = 0; i < limit; i++) {
    const next = pool[i + 1] ?? pool[i];
    const avg = (pool[i].aqi + next.aqi) / 2;
    if (avg < bestPairAvg) {
      bestPairAvg = avg;
      best = pool[i];
    }
  }

  const startHour = best.hour;
  const endHour = (startHour + 2) % 24;
  return `${formatHour12(startHour)} – ${formatHour12(endHour)}`;
}

export function createFallbackAqi({ city = 'Delhi', country = 'India', latitude = 28.6139, longitude = 77.209, lang = 'en' }) {
  const lower = String(city).toLowerCase();
  const isNorthIndiaWinter =
    lower.includes('delhi') ||
    lower.includes('noida') ||
    lower.includes('gurugram') ||
    lower.includes('patna') ||
    lower.includes('lucknow') ||
    lower.includes('lahore');

  const isCoastalOrMetro =
    lower.includes('mumbai') || lower.includes('kolkata') || lower.includes('chennai');

  const baseAqi = isNorthIndiaWinter ? 268 : isCoastalOrMetro ? 148 : 54;
  const basePm25 = isNorthIndiaWinter ? 186 : isCoastalOrMetro ? 68 : 14;
  const basePm10 = Math.round(basePm25 * 1.48);
  const no2 = isNorthIndiaWinter ? 64 : 24;
  const o3 = 28;

  const hourly = [
    { time: '03:00', hour: 3, aqi: baseAqi + 16, pm25: basePm25 + 14 },
    { time: '06:00', hour: 6, aqi: baseAqi + 22, pm25: basePm25 + 18 },
    { time: '09:00', hour: 9, aqi: baseAqi + 14, pm25: basePm25 + 12 },
    { time: '12:00', hour: 12, aqi: Math.max(28, baseAqi - 58), pm25: Math.max(8, basePm25 - 48) },
    { time: '14:00', hour: 14, aqi: Math.max(25, baseAqi - 74), pm25: Math.max(7, basePm25 - 60) },
    { time: '17:00', hour: 17, aqi: Math.max(28, baseAqi - 12), pm25: Math.max(8, basePm25 - 10) },
    { time: '20:00', hour: 20, aqi: baseAqi + 30, pm25: basePm25 + 24 },
    { time: '23:00', hour: 23, aqi: baseAqi + 35, pm25: basePm25 + 28 },
  ];

  return {
    city,
    country,
    latitude,
    longitude,
    usAqi: baseAqi,
    category: classifyUsAqi(baseAqi),
    pollutants: {
      pm25: basePm25,
      pm10: basePm10,
      no2,
      o3,
    },
    dominantPollutant: 'PM2.5',
    bestAiringWindow: lang === 'hi' ? 'दोपहर 12:00 – 2:00 बजे' : '12:00 PM – 2:00 PM',
    hourly,
    updatedAt: new Date().toISOString(),
    source: 'fallback',
    demo: true,
    sourceLabel: lang === 'hi' ? 'डेमो डेटा (ऑफ़लाइन अनुमान)' : 'Demo estimate (offline fallback)',
  };
}

export async function searchCities(query) {
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    return { cities: POPULAR_CITIES.slice(0, 6), source: 'local', demo: false };
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=6&language=en&format=json`;
    const data = await fetchJsonWithTimeout(url);
    if (Array.isArray(data.results) && data.results.length > 0) {
      return {
        cities: data.results.map((r) => ({
          name: r.name,
          country: r.country || 'Unknown',
          admin1: r.admin1,
          latitude: r.latitude,
          longitude: r.longitude,
        })),
        source: 'live',
        demo: false,
      };
    }
  } catch {
    // Fall back to popular city match
  }

  const lower = trimmed.toLowerCase();
  const matches = POPULAR_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.country.toLowerCase().includes(lower) ||
      (c.admin1 && c.admin1.toLowerCase().includes(lower))
  );

  return {
    cities: matches.length > 0 ? matches : POPULAR_CITIES.slice(0, 4),
    source: 'fallback',
    demo: true,
  };
}

export async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Breathwise-Backend/1.0' },
      });
      if (res.ok) {
        const data = await res.json();
        const name =
          data.address?.city ||
          data.address?.town ||
          data.address?.state_district ||
          data.address?.state ||
          'Your Location';
        return {
          name,
          country: data.address?.country || '',
          latitude: lat,
          longitude: lon,
          source: 'live',
          demo: false,
        };
      }
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Ignore reverse lookup failure
  }

  return {
    name: `Location (${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)})`,
    country: '',
    latitude: lat,
    longitude: lon,
    source: 'fallback',
    demo: true,
  };
}

async function resolveCityMeta(city, lat, lon) {
  const known = POPULAR_CITIES.find((c) => c.name.toLowerCase() === city.toLowerCase());
  const parsedLat = Number(lat);
  const parsedLon = Number(lon);
  if (Number.isFinite(parsedLat) && Number.isFinite(parsedLon) && (parsedLat !== 0 || parsedLon !== 0)) {
    return {
      city: city || known?.name || 'Delhi',
      country: known?.country || '',
      latitude: parsedLat,
      longitude: parsedLon,
    };
  }
  if (known) {
    return {
      city: known.name,
      country: known.country,
      latitude: known.latitude,
      longitude: known.longitude,
    };
  }
  const found = await searchCities(city);
  const first = found.cities[0] || POPULAR_CITIES[0];
  return {
    city: city || first.name,
    country: first.country || '',
    latitude: first.latitude,
    longitude: first.longitude,
  };
}

export async function getAqiReading({ city = 'Delhi', lat, lon, lang = 'en' }) {
  const safeCity = String(city || 'Delhi').trim() || 'Delhi';
  const safeLang = lang === 'hi' ? 'hi' : 'en';
  const meta = await resolveCityMeta(safeCity, lat, lon);

  const cacheKey = `${meta.latitude.toFixed(2)},${meta.longitude.toFixed(2)}:${safeLang}`;
  const cached = aqiCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { ...cached.data, city: safeCity };
  }

  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${meta.latitude}&longitude=${meta.longitude}&current=us_aqi,pm10,pm2_5,nitrogen_dioxide,ozone&hourly=us_aqi,pm2_5&forecast_days=1&timezone=auto`;
    const json = await fetchJsonWithTimeout(url);
    const current = json.current;
    if (!current || typeof current.us_aqi !== 'number') {
      throw new Error('Incomplete Open-Meteo AQI payload');
    }

    const pm25 = Math.round((current.pm2_5 ?? 0) * 10) / 10;
    const pm10 = Math.round((current.pm10 ?? 0) * 10) / 10;
    const no2 = Math.round((current.nitrogen_dioxide ?? 0) * 10) / 10;
    const o3 = Math.round((current.ozone ?? 0) * 10) / 10;
    const usAqi = Math.round(current.us_aqi);

    const hourlyTimes = json.hourly?.time ?? [];
    const hourlyAqis = json.hourly?.us_aqi ?? [];
    const hourlyPm25 = json.hourly?.pm2_5 ?? [];

    const hourly = hourlyTimes
      .map((t, idx) => {
        const hour = Number(String(t).slice(11, 13));
        return {
          time: String(t).slice(11, 16),
          hour: Number.isNaN(hour) ? idx % 24 : hour,
          aqi: Math.round(hourlyAqis[idx] ?? usAqi),
          pm25: Math.round(hourlyPm25[idx] ?? pm25),
        };
      })
      .filter((_item, idx) => idx % 3 === 0 || idx === 13 || idx === 14);

    const payload = {
      city: safeCity,
      country: meta.country,
      latitude: meta.latitude,
      longitude: meta.longitude,
      usAqi,
      category: classifyUsAqi(usAqi),
      pollutants: { pm25, pm10, no2, o3 },
      dominantPollutant: determineDominantPollutant(pm25, pm10, no2, o3),
      bestAiringWindow: findBestAiringWindow(hourly),
      hourly,
      updatedAt: current.time || new Date().toISOString(),
      source: 'live',
      demo: false,
      sourceLabel: safeLang === 'hi' ? 'लाइव Open-Meteo AQI' : 'Live Open-Meteo AQI',
    };

    aqiCache.set(cacheKey, { ts: Date.now(), data: payload });
    return payload;
  } catch {
    return createFallbackAqi({
      city: safeCity,
      country: meta.country,
      latitude: meta.latitude,
      longitude: meta.longitude,
      lang: safeLang,
    });
  }
}
