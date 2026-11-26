import type {
  AirQualityData,
  BackendAqiResponse,
  CityOption,
  Language,
} from '../types/saans';
import { POPULAR_CITIES } from '../data/demoData';
import { API_TIMEOUT_MS, apiFetchJson } from './api';
import { mapBackendAqiToAirQualityData } from './mappers';

/**
 * Service Layer: Air Quality & Geocoding
 * All calls go through the Breathwise backend (VITE_API_URL).
 */

export async function searchCities(query: string): Promise<CityOption[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return POPULAR_CITIES.slice(0, 6);
  }

  try {
    const res = await apiFetchJson<{ cities: CityOption[] }>(
      `/api/cities?q=${encodeURIComponent(trimmed)}`,
      { timeoutMs: API_TIMEOUT_MS }
    );
    if (Array.isArray(res.cities) && res.cities.length > 0) {
      return res.cities;
    }
  } catch {
    // Graceful local filter if backend unreachable during typing
  }

  const lower = trimmed.toLowerCase();
  const localMatches = POPULAR_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.country.toLowerCase().includes(lower) ||
      (c.admin1 && c.admin1.toLowerCase().includes(lower))
  );
  return localMatches.length > 0 ? localMatches : POPULAR_CITIES.slice(0, 4);
}

export async function reverseLookupCity(lat: number, lon: number): Promise<CityOption> {
  try {
    const data = await apiFetchJson<CityOption>(
      `/api/cities/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
      { timeoutMs: API_TIMEOUT_MS }
    );
    if (data && data.name) {
      return data;
    }
  } catch {
    // Fall back to coordinate label
  }
  return {
    name: `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
    country: '',
    latitude: lat,
    longitude: lon,
  };
}

export async function fetchLiveAirQuality(
  latitude: number,
  longitude: number,
  city: string,
  lang: Language = 'en',
  signal?: AbortSignal
): Promise<AirQualityData> {
  const params = new URLSearchParams({
    city,
    lat: String(latitude),
    lon: String(longitude),
    lang,
  });

  const dto = await apiFetchJson<BackendAqiResponse>(`/api/aqi?${params.toString()}`, {
    method: 'GET',
    timeoutMs: API_TIMEOUT_MS,
    signal,
  });

  return mapBackendAqiToAirQualityData(dto, lang);
}
