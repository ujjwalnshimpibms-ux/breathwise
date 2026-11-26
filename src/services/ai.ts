import type {
  AirQualityData,
  BackendChatResponse,
  BackendCommunityResponse,
  BackendPlanResponse,
  BackendWhatIfResponse,
  ChatMessage,
  CleanAirPlan,
  Language,
  UserProfile,
} from '../types/saans';
import type { CommunityImpactSummary, WhatIfSelection, WhatIfSummary } from '../utils/impact';
import { API_TIMEOUT_MS, apiFetchJson } from './api';
import {
  mapBackendChatToReply,
  mapBackendCommunityToSummary,
  mapBackendPlanToCleanAirPlan,
  mapBackendWhatIfToSummary,
} from './mappers';

/**
 * Service Layer: Breathwise Backend API
 * Zero direct Gemini imports or API keys in browser code.
 */

export interface AssistantReply {
  answer: string;
  steps: string[];
  whyThisHelps: string;
  healthDisclaimer: string;
  isOfflineEstimate?: boolean;
}

export async function generateCleanAirPlan(
  profile: UserProfile,
  aqi: AirQualityData,
  language: Language,
  signal?: AbortSignal
): Promise<CleanAirPlan> {
  const dto = await apiFetchJson<BackendPlanResponse>('/api/plan', {
    method: 'POST',
    body: { profile, aqi, language },
    timeoutMs: API_TIMEOUT_MS,
    signal,
  });
  return mapBackendPlanToCleanAirPlan(dto);
}

export async function calculateWhatIfImpactRemote(
  selectedIds: WhatIfSelection,
  profile: UserProfile,
  currentPm25: number,
  signal?: AbortSignal
): Promise<WhatIfSummary> {
  const dto = await apiFetchJson<BackendWhatIfResponse>('/api/whatif', {
    method: 'POST',
    body: { selectedIds, profile, currentPm25 },
    timeoutMs: API_TIMEOUT_MS,
    signal,
  });
  return mapBackendWhatIfToSummary(dto);
}

export async function askBreathwiseAssistant(
  profile: UserProfile,
  aqi: AirQualityData,
  language: Language,
  history: ChatMessage[],
  message: string,
  signal?: AbortSignal
): Promise<AssistantReply> {
  const dto = await apiFetchJson<BackendChatResponse>('/api/chat', {
    method: 'POST',
    body: {
      message,
      history: history.map((m) => ({ role: m.role, text: m.text })),
      profile,
      aqi,
      language,
    },
    timeoutMs: API_TIMEOUT_MS,
    signal,
  });
  return mapBackendChatToReply(dto);
}

export async function calculateCommunityImpactRemote(
  households: number,
  actionIds: string[],
  signal?: AbortSignal
): Promise<CommunityImpactSummary> {
  const dto = await apiFetchJson<BackendCommunityResponse>('/api/community', {
    method: 'POST',
    body: { households, actionIds },
    timeoutMs: API_TIMEOUT_MS,
    signal,
  });
  return mapBackendCommunityToSummary(dto);
}
