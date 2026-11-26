export type Language = 'en' | 'hi';
export type ThemeMode = 'light' | 'dark';
export type AppView = 'landing' | 'onboarding' | 'dashboard' | 'chat' | 'community';

export type HealthSensitivity = 'asthma' | 'allergies' | 'heart' | 'none';
export type CommuteMode = 'car' | 'two_wheeler' | 'bus_metro' | 'cycle' | 'walk' | 'wfh';
export type CookingFuel = 'lpg' | 'induction' | 'biomass' | 'electric';
export type HeatingMethod = 'none' | 'electric_heater' | 'gas_heater' | 'wood_coal' | 'heat_pump';
export type HomeType = 'apartment' | 'independent_house';
export type BudgetLevel = 'low' | 'medium' | 'high';
export type PrimaryGoal = 'protect_kids' | 'save_money' | 'reduce_footprint';

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type CostLevel = 'free' | 'low' | 'medium' | 'high';
export type EffortLevel = 'easy' | 'moderate' | 'habit_shift';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type SectionLoadState = 'idle' | 'generating' | 'ai' | 'offline' | 'error';
export type PlanSectionKey = 'routines' | 'indoorHacks' | 'alternatives';

export interface UserProfile {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  adults: number;
  children: number;
  elderly: number;
  sensitivities: HealthSensitivity[];
  hasPets: boolean;
  commuteMode: CommuteMode;
  cookingFuel: CookingFuel;
  heatingMethod: HeatingMethod;
  homeType: HomeType;
  windowsFacingRoad: boolean;
  budget: BudgetLevel;
  goal: PrimaryGoal;
}

export interface CityOption {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface HourlyAqiPoint {
  time: string;
  hour: number;
  aqi: number;
  pm25: number;
}

export interface AirQualityData {
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  dominantPollutant: 'PM2.5' | 'PM10' | 'NO2' | 'O3';
  updatedAt: string;
  bestOutdoorWindow: string;
  hourly: HourlyAqiPoint[];
  isDemo: boolean;
  source?: string;
  sourceLabel: string;
}

export interface ImpactEstimate {
  metricLabel: string;
  valueText: string;
  pm25ReductionPct: number;
  co2AvoidedKgPerWeek: number;
  confidence: ConfidenceLevel;
  assumptions: string[];
  disclaimer: string;
}

export interface RoutineItem {
  id: string;
  timeOfDay: TimeOfDay;
  windowLabel: string;
  title: string;
  whyItHelps: string;
  steps: string[];
  costLevel: CostLevel;
  effortLevel: EffortLevel;
  impact: ImpactEstimate;
}

export interface IndoorHack {
  id: string;
  rank: number;
  title: string;
  category: string;
  whyItHelps: string;
  honestNote?: string;
  steps: string[];
  costLevel: CostLevel;
  effortLevel: EffortLevel;
  effectivenessScore: number;
  impact: ImpactEstimate;
}

export interface SustainableAlternative {
  id: string;
  title: string;
  replaces: string;
  whyItHelps: string;
  steps: string[];
  costLevel: CostLevel;
  effortLevel: EffortLevel;
  impact: ImpactEstimate;
}

export interface CleanAirPlan {
  generatedAt: string;
  language: Language;
  familySummary: string;
  headlineAlert: string;
  routines: RoutineItem[];
  indoorHacks: IndoorHack[];
  alternatives: SustainableAlternative[];
  baselineScore?: number;
  source?: string;
  isFallback?: boolean;
}

export interface SectionStatusMap {
  routines: SectionLoadState;
  indoorHacks: SectionLoadState;
  alternatives: SectionLoadState;
}

export interface WhatIfOption {
  id: string;
  label: string;
  labelHi: string;
  description: string;
  descriptionHi: string;
  hasSlider?: boolean;
  sliderMin?: number;
  sliderMax?: number;
  sliderUnit?: string;
  sliderUnitHi?: string;
  defaultSliderValue?: number;
  pm25ExposureReductionPctPerUnit: number;
  co2AvoidedKgPerWeekPerUnit: number;
  rupeesSavedPerWeekPerUnit: number;
  scoreBoostPerUnit: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  steps?: string[];
  whyThisHelps?: string;
  healthDisclaimer?: string;
  timestamp: string;
  isStreaming?: boolean;
  isFallback?: boolean;
  isError?: boolean;
  errorMessage?: string;
  failedQuestion?: string;
}

export interface CommunityAction {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  co2KgPerHouseholdMonth: number;
  pmDustGramsPerHouseholdMonth: number;
  effort: EffortLevel;
}

/* ---------------- Backend API Response Contracts ---------------- */

export interface BackendAqiResponse {
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  usAqi: number;
  category?: { id: string; label: string; labelHi: string };
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
  };
  dominantPollutant: 'PM2.5' | 'PM10' | 'NO2' | 'O3';
  bestAiringWindow: string;
  hourly: HourlyAqiPoint[];
  updatedAt: string;
  source: 'live' | 'fallback';
  demo: boolean;
  sourceLabel?: string;
}

export interface BackendPlanResponse {
  generatedAt: string;
  language: Language;
  familySummary: string;
  headlineAlert: string;
  routines: RoutineItem[];
  indoorHacks: IndoorHack[];
  alternatives: SustainableAlternative[];
  impactSummary?: {
    baselineScore: number;
    topActions?: Array<{
      id: string;
      title: string;
      category: string;
      impactValueText: string;
      pm25ReductionPct: number;
      sectionAnchor: 'plan' | 'indoor' | 'alternatives';
    }>;
  };
  source: 'gemini' | 'fallback';
  demo: boolean;
}

export interface BackendWhatIfResponse {
  selectedIds: Record<string, number>;
  pm25ReductionPct: number;
  indoorPm25SavedUg: number;
  co2AvoidedKgPerWeek: number;
  rupeesSavedPerWeek: number;
  cleanAirScore: number;
  baselineScore: number;
  source: 'calculated' | 'fallback';
  demo: boolean;
}

export interface BackendChatResponse {
  answer: string;
  steps: string[];
  whyThisHelps: string;
  disclaimer: string;
  source: 'gemini' | 'fallback';
  demo: boolean;
}

export interface BackendCommunityResponse {
  households: number;
  actionIds: string[];
  monthlyCo2AvoidedKg: number;
  monthlyPmDustPreventedKg: number;
  equivalentTreesPlanted: number;
  streetDustReductionPct: number;
  source: 'calculated' | 'fallback';
  demo: boolean;
}
