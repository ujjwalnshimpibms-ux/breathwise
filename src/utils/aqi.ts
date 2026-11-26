import type {
  AirQualityData,
  HourlyAqiPoint,
  Language,
  ThemeMode,
  UserProfile,
} from '../types/saans';

export interface AqiCategoryInfo {
  id: 'good' | 'moderate' | 'sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  label: string;
  labelHi: string;
  textColorClass: string;
  bgTintClass: string;
  borderTintClass: string;
  strokeHex: string;
  adviceTone: string;
}

export function getAqiCategory(aqi: number): AqiCategoryInfo {
  if (aqi <= 50) {
    return {
      id: 'good',
      label: 'Good',
      labelHi: 'अच्छा',
      textColorClass: 'text-emerald-800 dark:text-emerald-300',
      bgTintClass: 'bg-emerald-500/14 dark:bg-emerald-400/15',
      borderTintClass: 'border-emerald-600/30',
      strokeHex: '#10B981',
      adviceTone: 'Safe for outdoor activity with light ventilation.',
    };
  }
  if (aqi <= 100) {
    return {
      id: 'moderate',
      label: 'Moderate',
      labelHi: 'मध्यम',
      textColorClass: 'text-amber-800 dark:text-amber-300',
      bgTintClass: 'bg-amber-500/14 dark:bg-amber-400/15',
      borderTintClass: 'border-amber-600/30',
      strokeHex: '#D97706',
      adviceTone: 'Sensitive groups should watch for mild irritation.',
    };
  }
  if (aqi <= 150) {
    return {
      id: 'sensitive',
      label: 'Sensitive Caution',
      labelHi: 'संवेदनशील समूह सावधान',
      textColorClass: 'text-orange-800 dark:text-orange-300',
      bgTintClass: 'bg-orange-500/14 dark:bg-orange-400/15',
      borderTintClass: 'border-orange-600/30',
      strokeHex: '#EA580C',
      adviceTone: 'Children, elderly, and asthma-prone members should limit prolonged exertion.',
    };
  }
  if (aqi <= 200) {
    return {
      id: 'unhealthy',
      label: 'Unhealthy',
      labelHi: 'अस्वास्थ्यकर',
      textColorClass: 'text-red-800 dark:text-red-300',
      bgTintClass: 'bg-red-500/14 dark:bg-red-400/15',
      borderTintClass: 'border-red-600/30',
      strokeHex: '#DC2626',
      adviceTone: 'Move vigorous outdoor play indoors and wear N95/FFP2 masks in transit.',
    };
  }
  if (aqi <= 300) {
    return {
      id: 'very_unhealthy',
      label: 'Very Unhealthy',
      labelHi: 'बहुत अस्वास्थ्यकर',
      textColorClass: 'text-purple-800 dark:text-purple-300',
      bgTintClass: 'bg-purple-500/14 dark:bg-purple-400/15',
      borderTintClass: 'border-purple-600/30',
      strokeHex: '#9333EA',
      adviceTone: 'Keep windows sealed during peak smog and prioritize indoor air filtration.',
    };
  }
  return {
    id: 'hazardous',
    label: 'Severe / Hazardous',
    labelHi: 'गंभीर / खतरनाक',
    textColorClass: 'text-rose-900 dark:text-rose-300',
    bgTintClass: 'bg-rose-700/14 dark:bg-rose-500/20',
    borderTintClass: 'border-rose-700/30',
    strokeHex: '#991B1B',
    adviceTone: 'Minimize outdoor exposure, seal drafts, and run continuous indoor filtration.',
  };
}

/**
 * Signature Breathwise background tint: softly shifts the dawn paper / forest canvas
 * based on the current AQI band (clear sky blue-green when good, warm grey-amber when unhealthy).
 */
export function getAqiBackdropStyle(aqi: number, theme: ThemeMode): string {
  if (theme === 'dark') {
    if (aqi <= 50) {
      return 'radial-gradient(1100px 560px at 82% -8%, rgba(16, 185, 129, 0.14), transparent 65%), radial-gradient(800px 420px at 12% 10%, rgba(56, 189, 248, 0.08), transparent 60%)';
    }
    if (aqi <= 150) {
      return 'radial-gradient(1100px 560px at 82% -8%, rgba(242, 163, 58, 0.12), transparent 65%), radial-gradient(800px 420px at 12% 10%, rgba(14, 107, 92, 0.12), transparent 60%)';
    }
    return 'radial-gradient(1100px 560px at 82% -8%, rgba(140, 106, 86, 0.18), transparent 65%), radial-gradient(800px 420px at 12% 10%, rgba(108, 86, 76, 0.12), transparent 60%)';
  }

  if (aqi <= 50) {
    return 'radial-gradient(1100px 560px at 82% -8%, rgba(134, 239, 172, 0.24), transparent 65%), radial-gradient(800px 420px at 12% 10%, rgba(125, 211, 252, 0.20), transparent 60%)';
  }
  if (aqi <= 150) {
    return 'radial-gradient(1100px 560px at 82% -8%, rgba(242, 163, 58, 0.14), transparent 65%), radial-gradient(800px 420px at 12% 10%, rgba(167, 215, 197, 0.22), transparent 60%)';
  }
  return 'radial-gradient(1100px 560px at 82% -8%, rgba(154, 127, 108, 0.20), transparent 65%), radial-gradient(800px 420px at 12% 10%, rgba(190, 172, 156, 0.20), transparent 60%)';
}

export function determineDominantPollutant(
  pm25: number,
  pm10: number,
  no2: number,
  o3: number
): AirQualityData['dominantPollutant'] {
  const scores: Array<{ name: AirQualityData['dominantPollutant']; ratio: number }> = [
    { name: 'PM2.5', ratio: pm25 / 35 },
    { name: 'PM10', ratio: pm10 / 150 },
    { name: 'NO2', ratio: no2 / 100 },
    { name: 'O3', ratio: o3 / 100 },
  ];
  scores.sort((a, b) => b.ratio - a.ratio);
  return scores[0]?.name ?? 'PM2.5';
}

export function findBestOutdoorWindow(hourly: HourlyAqiPoint[], lang: Language): string {
  if (!hourly.length) {
    return lang === 'hi' ? 'दोपहर 1:00 – 3:00 बजे' : '1:00 PM – 3:00 PM';
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
  return `${formatHour(startHour, lang)} – ${formatHour(endHour, lang)}`;
}

function formatHour(hour: number, lang: Language): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  if (lang === 'hi') {
    return `${h12}:00 ${period}`;
  }
  return `${h12}:00 ${period}`;
}

export function buildFamilyMeaningLine(
  aqi: number,
  profile: UserProfile,
  lang: Language
): string {
  const hasKids = profile.children > 0;
  const hasElderly = profile.elderly > 0;
  const hasResp = profile.sensitivities.includes('asthma') || profile.sensitivities.includes('allergies');
  const hasHeart = profile.sensitivities.includes('heart');

  if (lang === 'hi') {
    if (aqi > 200) {
      const group = hasKids || hasElderly ? 'बच्चों और बुजुर्गों' : 'पूरे परिवार';
      const extra = hasResp ? ' (अस्थमा/एलर्जी के कारण विशेष सावधानी रखें)' : '';
      return `आज ${profile.city} की हवा बहुत प्रदूषित है। ${group} की बाहरी गतिविधियां कम रखें, खिड़कियां सुबह-शाम बंद रखें और बाहर जाने पर N95 मास्क पहनें${extra}।`;
    }
    if (aqi > 100) {
      return `${profile.city} में प्रदूषण स्तर बढ़ा हुआ है। ${hasKids ? 'बच्चों को दोपहर के साफ समय में ही बाहर खेलने दें' : 'तेज़ बाहरी व्यायाम दोपहर तक टालें'}${hasResp ? ' और इन्हेलर/दवा पास रखें' : ''}।`;
    }
    return `${profile.city} में आज हवा अपेक्षाकृत बेहतर है। दोपहर में क्रॉस-वेंटिलेशन के लिए 20 मिनट खिड़कियां खोल सकते हैं।`;
  }

  if (aqi > 200) {
    const targets: string[] = [];
    if (hasKids) targets.push(`${profile.children} child${profile.children > 1 ? 'ren' : ''}`);
    if (hasElderly) targets.push(`${profile.elderly} senior${profile.elderly > 1 ? 's' : ''}`);
    const targetText = targets.length > 0 ? `especially for your ${targets.join(' and ')}` : 'for everyone at home';
    const healthNote = hasResp
      ? ' With respiratory sensitivities in your household, shift outdoor play indoors and use well-fitted N95/FFP2 masks for commutes.'
      : hasHeart
        ? ' With cardiovascular sensitivity noted, avoid strenuous outdoor exertion today.'
        : ' Keep road-facing windows sealed during morning and evening traffic peaks.';
    return `Heavy winter smog in ${profile.city} today — take extra care ${targetText}.${healthNote}`;
  }

  if (aqi > 100) {
    return `Elevated particulate levels in ${profile.city}. ${
      hasKids ? 'Keep school commutes masked and limit vigorous outdoor sports to the midday dip.' : 'Schedule errands during the afternoon clearing window.'
    }${hasResp ? ' Watch for early cough or wheeze triggers.' : ''}`;
  }

  return `Air quality in ${profile.city} is manageable today. You can safely open windows briefly around midday to refresh indoor air.`;
}
