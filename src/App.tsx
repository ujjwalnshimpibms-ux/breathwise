import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type {
  AirQualityData,
  AppView,
  CityOption,
  CleanAirPlan,
  Language,
  PlanSectionKey,
  SectionStatusMap,
  ThemeMode,
  UserProfile,
} from './types/saans';
import {
  createDemoAirQuality,
  createSeededPlan,
  DEFAULT_PROFILE,
} from './data/demoData';
import { fetchLiveAirQuality } from './services/airQuality';
import { generateCleanAirPlan } from './services/ai';
import { getAqiBackdropStyle } from './utils/aqi';
import type { WhatIfSelection } from './utils/impact';
import { TopNav } from './components/TopNav';
import { MobileBottomBar } from './components/MobileBottomBar';
import { LandingPage } from './components/LandingPage';
import { OnboardingWizard } from './components/OnboardingWizard';
import { DashboardView } from './components/DashboardView';
import { AskSaansView } from './components/AskSaansView';
import { CommunityView } from './components/CommunityView';
import { UI_COPY } from './i18n/copy';

const STORAGE_KEYS = {
  profile: 'breathwise_profile_v1',
  plan: 'breathwise_plan_v1',
  language: 'breathwise_lang_v1',
  theme: 'breathwise_theme_v1',
  whatIf: 'breathwise_whatif_v1',
  customFlag: 'breathwise_custom_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [language, setLanguage] = useState<Language>(() =>
    readStorage<Language>(STORAGE_KEYS.language, 'en')
  );
  const [theme, setTheme] = useState<ThemeMode>(() =>
    readStorage<ThemeMode>(STORAGE_KEYS.theme, 'light')
  );
  const [profile, setProfile] = useState<UserProfile>(() =>
    readStorage<UserProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE)
  );
  const [hasCustomProfile, setHasCustomProfile] = useState<boolean>(() =>
    readStorage<boolean>(STORAGE_KEYS.customFlag, false)
  );
  const [whatIfSelections, setWhatIfSelections] = useState<WhatIfSelection>(() =>
    readStorage<WhatIfSelection>(STORAGE_KEYS.whatIf, {
      drive_less: 3,
      seal_filter_bedroom: 1,
    })
  );

  const [activeView, setActiveView] = useState<AppView>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return 'dashboard';
    return 'landing';
  });

  // Landing page live city preview state
  const [landingCity, setLandingCity] = useState<CityOption>({
    name: profile.city,
    country: profile.country,
    latitude: profile.latitude,
    longitude: profile.longitude,
  });
  const [landingAqi, setLandingAqi] = useState<AirQualityData>(() =>
    createDemoAirQuality(profile.city, language)
  );

  // Active dashboard AQI + Plan + Independent section statuses
  const [aqiData, setAqiData] = useState<AirQualityData>(() =>
    createDemoAirQuality(profile.city, language)
  );
  const [plan, setPlan] = useState<CleanAirPlan>(() => {
    const cached = readStorage<CleanAirPlan | null>(STORAGE_KEYS.plan, null);
    if (cached && cached.language === language) {
      return cached;
    }
    return createSeededPlan(profile, createDemoAirQuality(profile.city, language), language);
  });
  const [sectionStatus, setSectionStatus] = useState<SectionStatusMap>(() => ({
    routines: plan.isFallback ? 'offline' : 'ai',
    indoorHacks: plan.isFallback ? 'offline' : 'ai',
    alternatives: plan.isFallback ? 'offline' : 'ai',
  }));

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const generationIdRef = useRef<number>(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Sync Tailwind dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme));
    } catch {
      // Ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.language, JSON.stringify(language));
    } catch {
      // Ignore
    }
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
    } catch {
      // Ignore
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.whatIf, JSON.stringify(whatIfSelections));
    } catch {
      // Ignore
    }
  }, [whatIfSelections]);

  // Fetch Landing live AQI when landingCity or language changes
  useEffect(() => {
    let cancelled = false;
    fetchLiveAirQuality(
      landingCity.latitude,
      landingCity.longitude,
      landingCity.name,
      language
    ).then((live) => {
      if (!cancelled) {
        setLandingAqi(live);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [landingCity, language]);

  // Fetch Dashboard live AQI whenever profile location or language changes
  useEffect(() => {
    let cancelled = false;
    fetchLiveAirQuality(profile.latitude, profile.longitude, profile.city, language).then(
      (live) => {
        if (!cancelled) {
          setAqiData(live);
          setPlan((prev) =>
            prev.isFallback ? createSeededPlan(profile, live, language) : prev
          );
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [profile, language]);

  // Unified plan loader: calls backend /api/plan once for all sections.
  // Falls back to local seeded plan on timeout/error. Max 15s skeleton.
  const loadPlan = useCallback(
    async (targetProfile: UserProfile, targetAqi: AirQualityData, targetLang: Language) => {
      const runId = ++generationIdRef.current;
      setSectionStatus({ routines: 'generating', indoorHacks: 'generating', alternatives: 'generating' });
      const fallbackPlan = createSeededPlan(targetProfile, targetAqi, targetLang);

      // 15-second hard cap so skeleton never exceeds limit
      const controller = new AbortController();
      const capTimer = window.setTimeout(() => controller.abort(), 15000);

      try {
        const aiPlan = await generateCleanAirPlan(targetProfile, targetAqi, targetLang, controller.signal);
        clearTimeout(capTimer);
        if (generationIdRef.current !== runId) return;
        const merged: CleanAirPlan = {
          ...fallbackPlan,
          ...aiPlan,
          language: targetLang,
          routines: aiPlan.routines?.length ? aiPlan.routines : fallbackPlan.routines,
          indoorHacks: aiPlan.indoorHacks?.length ? aiPlan.indoorHacks : fallbackPlan.indoorHacks,
          alternatives: aiPlan.alternatives?.length ? aiPlan.alternatives : fallbackPlan.alternatives,
        };
        try { localStorage.setItem(STORAGE_KEYS.plan, JSON.stringify(merged)); } catch { /* Ignore */ }
        setPlan(merged);
        const status = aiPlan.isFallback ? 'offline' : 'ai';
        setSectionStatus({ routines: status, indoorHacks: status, alternatives: status });
      } catch {
        clearTimeout(capTimer);
        if (generationIdRef.current !== runId) return;
        setPlan((prev) => ({ ...prev, ...fallbackPlan, language: targetLang }));
        setSectionStatus({ routines: 'offline', indoorHacks: 'offline', alternatives: 'offline' });
      }
    },
    []
  );

  // Alias so DashboardView's onRegenerateSection still works (all sections reload together)
  const loadSingleSection = useCallback(
    (_section: PlanSectionKey, targetProfile: UserProfile, targetAqi: AirQualityData, targetLang: Language) => {
      void loadPlan(targetProfile, targetAqi, targetLang);
    },
    [loadPlan]
  );

  const loadAllSections = useCallback(
    (targetProfile: UserProfile, targetAqi: AirQualityData, targetLang: Language) => {
      void loadPlan(targetProfile, targetAqi, targetLang);
    },
    [loadPlan]
  );

  const handleLanguageChange = (nextLang: Language) => {
    setLanguage(nextLang);
    // Immediately render localized baseline so UI + content switch cleanly, then upgrade with AI if not offline-only
    const localizedFallback = createSeededPlan(profile, aqiData, nextLang);
    setPlan(localizedFallback);
    if (activeView === 'dashboard') {
      loadAllSections(profile, aqiData, nextLang);
    } else {
      setSectionStatus({
        routines: 'offline',
        indoorHacks: 'offline',
        alternatives: 'offline',
      });
    }
  };

  const handleCompleteOnboarding = async (nextProfile: UserProfile) => {
    const cityChanged = nextProfile.city.toLowerCase() !== profile.city.toLowerCase();
    setProfile(nextProfile);
    setLandingCity({
      name: nextProfile.city,
      country: nextProfile.country,
      latitude: nextProfile.latitude,
      longitude: nextProfile.longitude,
    });
    setHasCustomProfile(true);
    try {
      localStorage.setItem(STORAGE_KEYS.customFlag, JSON.stringify(true));
    } catch {
      // Ignore
    }

    const copy = UI_COPY[language];
    showToast(cityChanged ? copy.dashboard.cityUpdatedToast : copy.dashboard.profileSavedToast);
    setSectionStatus({
      routines: 'generating',
      indoorHacks: 'generating',
      alternatives: 'generating',
    });
    setActiveView('dashboard');

    const liveAqi = await fetchLiveAirQuality(
      nextProfile.latitude,
      nextProfile.longitude,
      nextProfile.city,
      language
    );
    setAqiData(liveAqi);
    setPlan(createSeededPlan(nextProfile, liveAqi, language));
    loadAllSections(nextProfile, liveAqi, language);
  };

  const handleSkipOnboarding = () => {
    setProfile(DEFAULT_PROFILE);
    setHasCustomProfile(false);
    const demoAqi = createDemoAirQuality(DEFAULT_PROFILE.city, language);
    setAqiData(demoAqi);
    setPlan(createSeededPlan(DEFAULT_PROFILE, demoAqi, language));
    setSectionStatus({
      routines: 'offline',
      indoorHacks: 'offline',
      alternatives: 'offline',
    });
    showToast(UI_COPY[language].dashboard.profileSavedToast);
    setActiveView('dashboard');
  };

  const activeAqiForTint = activeView === 'landing' ? landingAqi.aqi : aqiData.aqi;
  const backdropGradient = getAqiBackdropStyle(activeAqiForTint, theme);

  return (
    <div
      className="min-h-screen bg-[#F7F4EE] text-[#0F2A24] dark:bg-[#0B1714] dark:text-[#E8F1ED] transition-colors"
      style={{ backgroundImage: backdropGradient }}
    >
      <TopNav
        activeView={activeView}
        onNavigate={setActiveView}
        language={language}
        hasCustomProfile={hasCustomProfile}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-20 md:bottom-6 right-4 z-50 max-w-sm rounded-2xl bg-[#0F2A24] dark:bg-[#E8F1ED] text-white dark:text-[#0B1714] px-4 py-3 shadow-xl flex items-center gap-3 text-sm font-medium"
        >
          <CheckCircle2 className="w-5 h-5 text-[#F2A33A] shrink-0" />
          <span className="flex-1">{toastMessage}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToastMessage(null)}
            className="p-1 opacity-75 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeView === 'landing' && (
        <LandingPage
          sampleAqi={landingAqi}
          sampleCityName={landingCity.name}
          onSelectSampleCity={(c) => setLandingCity(c)}
          language={language}
          onChangeLanguage={handleLanguageChange}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          onNavigate={setActiveView}
        />
      )}

      {activeView === 'onboarding' && (
        <OnboardingWizard
          initialProfile={profile}
          language={language}
          onChangeLanguage={handleLanguageChange}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          onComplete={handleCompleteOnboarding}
          onSkipWithDefaults={handleSkipOnboarding}
        />
      )}

      {activeView === 'dashboard' && (
        <DashboardView
          profile={profile}
          aqiData={aqiData}
          plan={plan}
          sectionStatus={sectionStatus}
          onRegenerateAll={() => loadAllSections(profile, aqiData, language)}
          onRegenerateSection={(sec) =>
            loadSingleSection(sec, profile, aqiData, language)
          }
          language={language}
          onChangeLanguage={handleLanguageChange}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          whatIfSelections={whatIfSelections}
          onChangeWhatIfSelections={setWhatIfSelections}
        />
      )}

      {activeView === 'chat' && (
        <AskSaansView
          profile={profile}
          aqiData={aqiData}
          language={language}
          onChangeLanguage={handleLanguageChange}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        />
      )}

      {activeView === 'community' && (
        <CommunityView
          profile={profile}
          language={language}
          onChangeLanguage={handleLanguageChange}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        />
      )}

      <MobileBottomBar
        activeView={activeView}
        onNavigate={setActiveView}
        language={language}
      />
    </div>
  );
}
