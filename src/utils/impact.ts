import type {
  CleanAirPlan,
  CommunityAction,
  UserProfile,
  WhatIfOption,
} from '../types/saans';

export const WHAT_IF_OPTIONS: WhatIfOption[] = [
  {
    id: 'drive_less',
    label: 'Swap car/two-wheeler for metro or carpool',
    labelHi: 'कार/बाइक की जगह मेट्रो या कारपूल अपनाएं',
    description: 'Avoids tailpipe PM2.5 & NOx in congested winter corridors.',
    descriptionHi: 'सर्दियों के ट्रैफिक में धुएं और NOx उत्सर्जन को कम करता है।',
    hasSlider: true,
    sliderMin: 0,
    sliderMax: 6,
    sliderUnit: 'days/wk',
    sliderUnitHi: 'दिन/सप्ताह',
    defaultSliderValue: 3,
    pm25ExposureReductionPctPerUnit: 3.5,
    co2AvoidedKgPerWeekPerUnit: 4.2,
    rupeesSavedPerWeekPerUnit: 110,
    scoreBoostPerUnit: 3.5,
  },
  {
    id: 'induction_cooking',
    label: 'Shift primary cooking to induction + exhaust',
    labelHi: 'इंडक्शन कुकिंग और एग्जॉस्ट फैन का उपयोग करें',
    description: 'Cuts indoor ultrafine particles and NO2 spikes during meals.',
    descriptionHi: 'रसोई में सूक्ष्म कणों और NO2 के स्तर को काफी घटाता है।',
    hasSlider: false,
    pm25ExposureReductionPctPerUnit: 14,
    co2AvoidedKgPerWeekPerUnit: 3.6,
    rupeesSavedPerWeekPerUnit: 75,
    scoreBoostPerUnit: 12,
  },
  {
    id: 'seal_filter_bedroom',
    label: 'Seal bedroom window gaps + run HEPA/DIY fan',
    labelHi: 'बेडरूम की दरारें सील करें और HEPA/DIY फ़िल्टर चलाएं',
    description: 'Creates an 8-hour low-PM sleep sanctuary overnight.',
    descriptionHi: 'रात के 8 घंटों में कमरे की हवा को साफ रखता है।',
    hasSlider: false,
    pm25ExposureReductionPctPerUnit: 28,
    co2AvoidedKgPerWeekPerUnit: 0.4,
    rupeesSavedPerWeekPerUnit: 0,
    scoreBoostPerUnit: 16,
  },
  {
    id: 'skip_peak_outdoors',
    label: 'Time outdoor errands to midday clearing window',
    labelHi: 'बाहरी काम दोपहर के साफ समय में करें',
    description: 'Avoids morning and evening temperature-inversion smog traps.',
    descriptionHi: 'सुबह और शाम के घने स्मॉग से बचाव करता है।',
    hasSlider: false,
    pm25ExposureReductionPctPerUnit: 11,
    co2AvoidedKgPerWeekPerUnit: 0.5,
    rupeesSavedPerWeekPerUnit: 25,
    scoreBoostPerUnit: 9,
  },
  {
    id: 'no_indoor_smoke',
    label: 'Pause incense, mosquito coils & dry sweeping',
    labelHi: 'अगरबत्ती, कॉइल और सूखी झाड़ू से बचें (गीला पोंछा लगाएं)',
    description: 'Prevents indoor PM2.5 spikes and dust resuspension.',
    descriptionHi: 'घर के अंदर धूल और धुएं के अचानक बढ़ने को रोकता है।',
    hasSlider: false,
    pm25ExposureReductionPctPerUnit: 10,
    co2AvoidedKgPerWeekPerUnit: 0.8,
    rupeesSavedPerWeekPerUnit: 40,
    scoreBoostPerUnit: 8,
  },
];

export const COMMUNITY_ACTIONS: CommunityAction[] = [
  {
    id: 'zero_burning',
    title: 'Zero leaf & municipal waste burning pledge',
    titleHi: 'पत्ती और कचरा न जलाने का मोहल्ला संकल्प',
    description: 'Replace winter garden bonfires and dry leaf burning with shared composting pits.',
    descriptionHi: 'सर्दियों में पत्तियां जलाने की जगह सामूहिक कम्पोस्ट पिट का उपयोग करें।',
    co2KgPerHouseholdMonth: 14.5,
    pmDustGramsPerHouseholdMonth: 320,
    effort: 'easy',
  },
  {
    id: 'school_carpool',
    title: 'Lane-wise school & metro carpool rotation',
    titleHi: 'स्कूल और मेट्रो के लिए गली-स्तरीय कारपूल',
    description: '3 neighboring families share morning drop-offs, cutting gate idling and cold starts.',
    descriptionHi: 'तीन पड़ोसी परिवार बारी-बारी से स्कूल ड्रॉप साझा करें।',
    co2KgPerHouseholdMonth: 28.0,
    pmDustGramsPerHouseholdMonth: 95,
    effort: 'moderate',
  },
  {
    id: 'wet_dust_control',
    title: 'Morning wet sweeping & construction tarpaulin check',
    titleHi: 'सुबह पानी का छिड़काव और निर्माण धूल नियंत्रण',
    description: 'RWA cleaning staff sprinkle greywater before sweeping; open sand piles stay covered.',
    descriptionHi: 'सफाई से पहले हल्का पानी छिड़कें और रेत/निर्माण सामग्री को ढक कर रखें।',
    co2KgPerHouseholdMonth: 1.5,
    pmDustGramsPerHouseholdMonth: 240,
    effort: 'easy',
  },
  {
    id: 'native_hedges',
    title: 'Roadside native dust-trapping hedge corridor',
    titleHi: 'सड़क किनारे धूल रोकने वाली स्थानीय झाड़ियां लगाना',
    description: 'Plant dense native shrubs along perimeter walls to buffer road PM10 plumes.',
    descriptionHi: 'बाहरी दीवारों के पास घनी स्थानीय झाड़ियां लगाकर सड़क की धूल कम करें।',
    co2KgPerHouseholdMonth: 6.2,
    pmDustGramsPerHouseholdMonth: 140,
    effort: 'habit_shift',
  },
  {
    id: 'no_idling_zone',
    title: 'No-idling gates & EV delivery pickup point',
    titleHi: 'गेट पर इंजन बंद (नो-आइडलिंग) और ई-रिक्शा ज़ोन',
    description: 'Engines off after 30 seconds at society gates; consolidated parcel drop near entrance.',
    descriptionHi: 'गेट पर 30 सेकंड से ज़्यादा गाड़ी खड़ी होने पर इंजन बंद रखने का नियम।',
    co2KgPerHouseholdMonth: 9.8,
    pmDustGramsPerHouseholdMonth: 70,
    effort: 'easy',
  },
];

export interface WhatIfSelection {
  [optionId: string]: number;
}

export interface WhatIfSummary {
  estimatedPm25ExposureReductionPct: number;
  estimatedIndoorPm25SavedUg: number;
  co2AvoidedKgPerWeek: number;
  rupeesSavedPerWeek: number;
  cleanAirScore: number;
  baselineScore: number;
  /** True when value comes from local/offline fallback rather than backend AI */
  isOfflineEstimate?: boolean;
}

export function getBaselineCleanAirScore(profile: UserProfile): number {
  let score = 38;
  if (
    profile.commuteMode === 'bus_metro' ||
    profile.commuteMode === 'cycle' ||
    profile.commuteMode === 'walk' ||
    profile.commuteMode === 'wfh'
  ) {
    score += 12;
  }
  if (profile.cookingFuel === 'induction' || profile.cookingFuel === 'electric') {
    score += 10;
  } else if (profile.cookingFuel === 'biomass') {
    score -= 8;
  }
  if (!profile.windowsFacingRoad) {
    score += 4;
  }
  if (profile.heatingMethod === 'heat_pump' || profile.heatingMethod === 'none') {
    score += 4;
  } else if (profile.heatingMethod === 'wood_coal') {
    score -= 10;
  }
  return Math.max(15, Math.min(72, score));
}

export function calculateWhatIfImpact(
  profile: UserProfile,
  currentPm25: number,
  selections: WhatIfSelection
): WhatIfSummary {
  const baselineScore = getBaselineCleanAirScore(profile);
  let rawPmReduction = 0;
  let co2Avoided = 0;
  let rupeesSaved = 0;
  let scoreBoost = 0;

  for (const option of WHAT_IF_OPTIONS) {
    const units = selections[option.id] ?? 0;
    if (units > 0) {
      rawPmReduction += option.pm25ExposureReductionPctPerUnit * units;
      co2Avoided += option.co2AvoidedKgPerWeekPerUnit * units;
      rupeesSaved += option.rupeesSavedPerWeekPerUnit * units;
      scoreBoost += option.scoreBoostPerUnit * units;
    }
  }

  const estimatedPm25ExposureReductionPct = Math.min(68, Math.round(rawPmReduction));
  const estimatedIndoorPm25SavedUg = Math.round((currentPm25 * estimatedPm25ExposureReductionPct) / 100);
  const cleanAirScore = Math.min(98, Math.round(baselineScore + scoreBoost));

  return {
    estimatedPm25ExposureReductionPct,
    estimatedIndoorPm25SavedUg,
    co2AvoidedKgPerWeek: Math.round(co2Avoided * 10) / 10,
    rupeesSavedPerWeek: Math.round(rupeesSaved),
    cleanAirScore,
    baselineScore,
  };
}

export interface TopPriorityAction {
  id: string;
  title: string;
  category: string;
  impactValueText: string;
  pm25ReductionPct: number;
  sectionAnchor: 'plan' | 'indoor' | 'alternatives';
}

export function getTopThreeActionsNow(plan: CleanAirPlan, lang: 'en' | 'hi'): TopPriorityAction[] {
  const candidates: TopPriorityAction[] = [
    ...plan.routines.map((r) => ({
      id: r.id,
      title: r.title,
      category: lang === 'hi' ? 'दिनचर्या' : 'Routine',
      impactValueText: r.impact.valueText,
      pm25ReductionPct: r.impact.pm25ReductionPct,
      sectionAnchor: 'plan' as const,
    })),
    ...plan.indoorHacks.map((h) => ({
      id: h.id,
      title: h.title,
      category: lang === 'hi' ? 'घरेलू उपाय' : 'Indoor hack',
      impactValueText: h.impact.valueText,
      pm25ReductionPct: h.impact.pm25ReductionPct,
      sectionAnchor: 'indoor' as const,
    })),
    ...plan.alternatives.map((a) => ({
      id: a.id,
      title: a.title,
      category: lang === 'hi' ? 'टिकाऊ विकल्प' : 'Alternative',
      impactValueText: a.impact.valueText,
      pm25ReductionPct: a.impact.pm25ReductionPct,
      sectionAnchor: 'alternatives' as const,
    })),
  ];

  return candidates.sort((a, b) => b.pm25ReductionPct - a.pm25ReductionPct).slice(0, 3);
}

export interface CommunityImpactSummary {
  households: number;
  monthlyCo2AvoidedKg: number;
  monthlyPmDustPreventedKg: number;
  equivalentTreesPlanted: number;
  estimatedStreetDustReductionPct: number;
  /** True when value comes from local/offline fallback rather than backend AI */
  isOfflineEstimate?: boolean;
}

export function calculateCommunityImpact(
  selectedActionIds: string[],
  households: number
): CommunityImpactSummary {
  const safeHouseholds = Math.max(1, Math.min(5000, Math.round(households)));
  let co2PerHousehold = 0;
  let pmGramsPerHousehold = 0;

  for (const action of COMMUNITY_ACTIONS) {
    if (selectedActionIds.includes(action.id)) {
      co2PerHousehold += action.co2KgPerHouseholdMonth;
      pmGramsPerHousehold += action.pmDustGramsPerHouseholdMonth;
    }
  }

  const monthlyCo2AvoidedKg = Math.round(co2PerHousehold * safeHouseholds);
  const monthlyPmDustPreventedKg = Math.round((pmGramsPerHousehold * safeHouseholds) / 100) / 10;
  const equivalentTreesPlanted = Math.round(monthlyCo2AvoidedKg / 1.8);
  const participationFactor = Math.min(1, safeHouseholds / 150);
  const actionFactor = Math.min(1, selectedActionIds.length / COMMUNITY_ACTIONS.length);
  const estimatedStreetDustReductionPct = Math.round(
    24 * actionFactor * (0.35 + 0.65 * participationFactor)
  );

  return {
    households: safeHouseholds,
    monthlyCo2AvoidedKg,
    monthlyPmDustPreventedKg,
    equivalentTreesPlanted,
    estimatedStreetDustReductionPct,
  };
}
