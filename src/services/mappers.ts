import type {
  AirQualityData,
  BackendAqiResponse,
  BackendChatResponse,
  BackendCommunityResponse,
  BackendPlanResponse,
  BackendWhatIfResponse,
  CleanAirPlan,
  Language,
} from '../types/saans';
import type { CommunityImpactSummary, WhatIfSummary } from '../utils/impact';
import type { AssistantReply } from './ai';

export function isOfflineResponse(meta: { source?: string; demo?: boolean }): boolean {
  return meta.source === 'fallback' || meta.demo === true;
}

export function mapBackendAqiToAirQualityData(
  dto: BackendAqiResponse,
  lang: Language
): AirQualityData {
  const isDemo = isOfflineResponse(dto);
  return {
    city: dto.city,
    country: dto.country,
    latitude: dto.latitude,
    longitude: dto.longitude,
    aqi: Math.round(dto.usAqi ?? 0),
    pm25: dto.pollutants?.pm25 ?? 0,
    pm10: dto.pollutants?.pm10 ?? 0,
    no2: dto.pollutants?.no2 ?? 0,
    o3: dto.pollutants?.o3 ?? 0,
    dominantPollutant: dto.dominantPollutant || 'PM2.5',
    updatedAt: dto.updatedAt || new Date().toISOString(),
    bestOutdoorWindow:
      dto.bestAiringWindow || (lang === 'hi' ? 'दोपहर 12:00 – 2:00 बजे' : '12:00 PM – 2:00 PM'),
    hourly: Array.isArray(dto.hourly) ? dto.hourly : [],
    isDemo,
    source: dto.source,
    sourceLabel:
      dto.sourceLabel ||
      (isDemo
        ? lang === 'hi'
          ? 'ऑफ़लाइन अनुमान'
          : 'Using offline estimate'
        : lang === 'hi'
          ? 'लाइव Open-Meteo AQI'
          : 'Live Open-Meteo AQI'),
  };
}

export function mapBackendPlanToCleanAirPlan(dto: BackendPlanResponse): CleanAirPlan {
  const isFallback = isOfflineResponse(dto);
  return {
    generatedAt: dto.generatedAt || new Date().toISOString(),
    language: dto.language === 'hi' ? 'hi' : 'en',
    familySummary: dto.familySummary,
    headlineAlert: dto.headlineAlert,
    routines: Array.isArray(dto.routines) ? dto.routines : [],
    indoorHacks: Array.isArray(dto.indoorHacks) ? dto.indoorHacks : [],
    alternatives: Array.isArray(dto.alternatives) ? dto.alternatives : [],
    baselineScore: dto.impactSummary?.baselineScore,
    source: dto.source,
    isFallback,
  };
}

export function mapBackendWhatIfToSummary(dto: BackendWhatIfResponse): WhatIfSummary {
  return {
    estimatedPm25ExposureReductionPct: dto.pm25ReductionPct,
    estimatedIndoorPm25SavedUg: dto.indoorPm25SavedUg,
    co2AvoidedKgPerWeek: dto.co2AvoidedKgPerWeek,
    rupeesSavedPerWeek: dto.rupeesSavedPerWeek,
    cleanAirScore: dto.cleanAirScore,
    baselineScore: dto.baselineScore,
    isOfflineEstimate: isOfflineResponse(dto),
  };
}

export function mapBackendChatToReply(dto: BackendChatResponse): AssistantReply {
  return {
    answer: dto.answer,
    steps: Array.isArray(dto.steps) ? dto.steps : [],
    whyThisHelps: dto.whyThisHelps,
    healthDisclaimer: dto.disclaimer,
    isOfflineEstimate: isOfflineResponse(dto),
  };
}

export function mapBackendCommunityToSummary(
  dto: BackendCommunityResponse
): CommunityImpactSummary {
  return {
    households: dto.households,
    monthlyCo2AvoidedKg: dto.monthlyCo2AvoidedKg,
    monthlyPmDustPreventedKg: dto.monthlyPmDustPreventedKg,
    equivalentTreesPlanted: dto.equivalentTreesPlanted,
    estimatedStreetDustReductionPct: dto.streetDustReductionPct,
    isOfflineEstimate: isOfflineResponse(dto),
  };
}
