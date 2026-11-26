/**
 * What-If Simulator impact calculator and baseline Clean Air Score.
 */

export const WHAT_IF_OPTIONS = [
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
    pm25ReductionPctPerUnit: 3.5,
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
    defaultSliderValue: 1,
    pm25ReductionPctPerUnit: 14,
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
    defaultSliderValue: 1,
    pm25ReductionPctPerUnit: 28,
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
    defaultSliderValue: 1,
    pm25ReductionPctPerUnit: 11,
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
    defaultSliderValue: 1,
    pm25ReductionPctPerUnit: 10,
    co2AvoidedKgPerWeekPerUnit: 0.8,
    rupeesSavedPerWeekPerUnit: 40,
    scoreBoostPerUnit: 8,
  },
];

export function getBaselineCleanAirScore(profile = {}) {
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
  if (profile.windowsFacingRoad === false) {
    score += 4;
  }
  if (profile.heatingMethod === 'heat_pump' || profile.heatingMethod === 'none') {
    score += 4;
  } else if (profile.heatingMethod === 'wood_coal') {
    score -= 10;
  }
  return Math.max(15, Math.min(72, score));
}

function normalizeSelectedIds(selectedIds) {
  const normalized = {};
  if (Array.isArray(selectedIds)) {
    for (const id of selectedIds) {
      const opt = WHAT_IF_OPTIONS.find((o) => o.id === id);
      if (opt) {
        normalized[id] = opt.defaultSliderValue ?? 1;
      }
    }
    return normalized;
  }

  if (selectedIds && typeof selectedIds === 'object') {
    for (const opt of WHAT_IF_OPTIONS) {
      const raw = Number(selectedIds[opt.id] ?? 0);
      if (!Number.isFinite(raw) || raw <= 0) continue;
      const maxVal = opt.hasSlider ? opt.sliderMax ?? 6 : 1;
      normalized[opt.id] = Math.min(maxVal, Math.max(0, Math.round(raw)));
    }
  }
  return normalized;
}

export function calculateWhatIf({ selectedIds, profile = {}, currentPm25 = 150 }) {
  const selections = normalizeSelectedIds(selectedIds);
  const baselineScore = getBaselineCleanAirScore(profile);
  const safePm25 = Number.isFinite(Number(currentPm25)) ? Math.max(0, Number(currentPm25)) : 150;

  let rawPmReduction = 0;
  let co2Avoided = 0;
  let rupeesSaved = 0;
  let scoreBoost = 0;

  for (const option of WHAT_IF_OPTIONS) {
    const units = selections[option.id] ?? 0;
    if (units > 0) {
      rawPmReduction += option.pm25ReductionPctPerUnit * units;
      co2Avoided += option.co2AvoidedKgPerWeekPerUnit * units;
      rupeesSaved += option.rupeesSavedPerWeekPerUnit * units;
      scoreBoost += option.scoreBoostPerUnit * units;
    }
  }

  const pm25ReductionPct = Math.min(68, Math.round(rawPmReduction));
  const indoorPm25SavedUg = Math.round((safePm25 * pm25ReductionPct) / 100);
  const cleanAirScore = Math.min(98, Math.round(baselineScore + scoreBoost));

  return {
    selectedIds: selections,
    pm25ReductionPct,
    indoorPm25SavedUg,
    co2AvoidedKgPerWeek: Math.round(co2Avoided * 10) / 10,
    rupeesSavedPerWeek: Math.round(rupeesSaved),
    cleanAirScore,
    baselineScore,
    source: 'calculated',
    demo: false,
  };
}
