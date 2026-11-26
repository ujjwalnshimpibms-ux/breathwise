import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Building2,
  Bus,
  Car,
  Flame,
  Footprints,
  Home,
  Laptop,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Search,
  Trees,
  Zap,
} from 'lucide-react';
import type {
  BudgetLevel,
  CityOption,
  CommuteMode,
  CookingFuel,
  HealthSensitivity,
  HeatingMethod,
  HomeType,
  Language,
  PrimaryGoal,
  ThemeMode,
  UserProfile,
} from '../types/saans';
import { POPULAR_CITIES } from '../data/demoData';
import { reverseLookupCity, searchCities } from '../services/airQuality';
import { UI_COPY } from '../i18n/copy';
import { WorkspaceToolbar } from './WorkspaceToolbar';

interface OnboardingWizardProps {
  initialProfile: UserProfile;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onComplete: (profile: UserProfile) => void;
  onSkipWithDefaults: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialProfile,
  language,
  onChangeLanguage,
  theme,
  onToggleTheme,
  onComplete,
  onSkipWithDefaults,
}) => {
  const copy = UI_COPY[language];
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<UserProfile>(initialProfile);

  const [cityQuery, setCityQuery] = useState(initialProfile.city);
  const [cityResults, setCityResults] = useState<CityOption[]>(POPULAR_CITIES.slice(0, 6));
  const [searchingCities, setSearchingCities] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleCitySearch = async (q: string) => {
    setCityQuery(q);
    setSearchingCities(true);
    setLocationError(null);
    const results = await searchCities(q);
    setCityResults(results);
    setSearchingCities(false);
  };

  const selectCity = (c: CityOption) => {
    setDraft((prev) => ({
      ...prev,
      city: c.name,
      country: c.country,
      latitude: c.latitude,
      longitude: c.longitude,
    }));
    setCityQuery(c.name);
    setLocationError(null);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        language === 'hi'
          ? 'आपके ब्राउज़र में लोकेशन सुविधा उपलब्ध नहीं है।'
          : 'Geolocation is not supported in this browser.'
      );
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const cityObj = await reverseLookupCity(pos.coords.latitude, pos.coords.longitude);
        selectCity(cityObj);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationError(
          language === 'hi'
            ? 'लोकेशन अनुमति नहीं मिली — कृपया नीचे से अपना शहर चुनें।'
            : 'Location permission declined — please search or pick a city below.'
        );
      },
      { timeout: 6000 }
    );
  };

  const toggleSensitivity = (s: HealthSensitivity) => {
    setDraft((prev) => {
      if (s === 'none') {
        return { ...prev, sensitivities: ['none'] };
      }
      const withoutNone = prev.sensitivities.filter((item) => item !== 'none');
      const exists = withoutNone.includes(s);
      const next = exists ? withoutNone.filter((item) => item !== s) : [...withoutNone, s];
      return { ...prev, sensitivities: next.length > 0 ? next : ['none'] };
    });
  };

  const sensitivityOptions: Array<{ id: HealthSensitivity; en: string; hi: string }> = [
    { id: 'asthma', en: 'Asthma / wheezing', hi: 'अस्थमा / सांस फूलना' },
    { id: 'allergies', en: 'Dust or seasonal allergies', hi: 'धूल या मौसमी एलर्जी' },
    { id: 'heart', en: 'Heart or BP condition', hi: 'हृदय या बीपी समस्या' },
    { id: 'none', en: 'None reported', hi: 'कोई नहीं' },
  ];

  const commuteOptions: Array<{
    id: CommuteMode;
    en: string;
    hi: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'car', en: 'Car', hi: 'कार', Icon: Car },
    { id: 'two_wheeler', en: 'Two-wheeler', hi: 'दोपहिया', Icon: Bike },
    { id: 'bus_metro', en: 'Bus / Metro', hi: 'बस / मेट्रो', Icon: Bus },
    { id: 'cycle', en: 'Cycle', hi: 'साइकिल', Icon: Bike },
    { id: 'walk', en: 'Walk', hi: 'पैदल', Icon: Footprints },
    { id: 'wfh', en: 'Work from home', hi: 'घर से काम', Icon: Laptop },
  ];

  const cookingOptions: Array<{
    id: CookingFuel;
    en: string;
    hi: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'lpg', en: 'LPG Gas', hi: 'LPG गैस', Icon: Flame },
    { id: 'induction', en: 'Induction', hi: 'इंडक्शन', Icon: Zap },
    { id: 'electric', en: 'Electric', hi: 'इलेक्ट्रिक', Icon: Zap },
    { id: 'biomass', en: 'Wood / Biomass', hi: 'लकड़ी / उपले', Icon: Trees },
  ];

  const heatingOptions: Array<{ id: HeatingMethod; en: string; hi: string }> = [
    { id: 'none', en: 'No heater used', hi: 'हीटर नहीं' },
    { id: 'electric_heater', en: 'Electric room heater', hi: 'इलेक्ट्रिक हीटर' },
    { id: 'heat_pump', en: 'AC / Heat pump', hi: 'एसी / हीट पंप' },
    { id: 'gas_heater', en: 'Gas heater', hi: 'गैस हीटर' },
    { id: 'wood_coal', en: 'Wood / Coal / Angithi', hi: 'लकड़ी / अंगीठी' },
  ];

  const budgetOptions: Array<{ id: BudgetLevel; en: string; hi: string }> = [
    { id: 'low', en: 'Free / Low-cost first', hi: 'मुफ्त / कम लागत' },
    { id: 'medium', en: 'Moderate upgrades', hi: 'मध्यम बजट' },
    { id: 'high', en: 'Full clean-air gear', hi: 'अधिकतम सुरक्षा बजट' },
  ];

  const goalOptions: Array<{ id: PrimaryGoal; en: string; hi: string }> = [
    { id: 'protect_kids', en: 'Protect kids & elders', hi: 'बच्चों व बुजुर्गों की सुरक्षा' },
    { id: 'save_money', en: 'Save fuel & money', hi: 'ईंधन व पैसे की बचत' },
    { id: 'reduce_footprint', en: 'Cut emissions & smog', hi: 'प्रदूषण व उत्सर्जन घटाएं' },
  ];

  const commuteLabel = commuteOptions.find((c) => c.id === draft.commuteMode)?.[language] ?? draft.commuteMode;
  const cookingLabel = cookingOptions.find((c) => c.id === draft.cookingFuel)?.[language] ?? draft.cookingFuel;

  return (
    <div className="min-h-screen flex flex-col">
      <WorkspaceToolbar
        language={language}
        onChangeLanguage={onChangeLanguage}
        theme={theme}
        onToggleTheme={onToggleTheme}
        leftSlot={
          <span className="text-[13px] font-semibold text-[#46615A] dark:text-[#9CB5AC]">
            {copy.onboarding.stepOf} {step} / 3
          </span>
        }
        rightSlot={
          <button
            type="button"
            onClick={onSkipWithDefaults}
            className="min-h-[40px] px-3 text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copy.onboarding.skipDemo}
          </button>
        }
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* Progress bar */}
        <div
          className="h-2.5 w-full rounded-full bg-[#E6EFE9] dark:bg-[#162C25] overflow-hidden"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={3}
        >
          <div
            className="h-full bg-gradient-to-r from-[#0E6B5C] to-[#F2A33A] transition-[width] duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="mt-6 grid lg:grid-cols-12 gap-6 items-start">
          {/* Main Wizard Card (8 cols) */}
          <div className="lg:col-span-8 rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 sm:p-8 shadow-[0_20px_50px_-18px_rgba(15,42,36,0.12)]">
            {/* STEP 1: LOCATION */}
            {step === 1 && (
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                  {copy.onboarding.step1Title}
                </h1>
                <p className="mt-2 text-base text-[#46615A] dark:text-[#9CB5AC]">
                  {copy.onboarding.step1Sub}
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#46615A] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      aria-label={copy.onboarding.searchPlaceholder}
                      value={cityQuery}
                      onChange={(e) => handleCitySearch(e.target.value)}
                      placeholder={copy.onboarding.searchPlaceholder}
                      className="w-full min-h-[48px] pl-11 pr-4 rounded-2xl bg-[#F7F4EE] dark:bg-[#0B1714] text-base text-[#0F2A24] dark:text-[#E8F1ED] focus:outline-2 focus:outline-[#0E6B5C]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="min-h-[48px] px-4 rounded-2xl bg-[#E6EFE9] dark:bg-[#193029] text-[#0E6B5C] dark:text-[#6EE7B7] text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#D7E6DC] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    <LocateFixed className="w-4 h-4" />
                    {locating ? copy.onboarding.locating : copy.onboarding.useMyLocation}
                  </button>
                </div>

                {locationError && (
                  <p className="mt-2.5 text-[13px] text-amber-800 dark:text-amber-300" role="alert">
                    {locationError}
                  </p>
                )}

                <div className="mt-6">
                  <p className="text-[13px] font-semibold text-[#46615A] dark:text-[#9CB5AC]">
                    {searchingCities ? '...' : copy.onboarding.quickCities}
                  </p>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {cityResults.map((c) => {
                      const selected =
                        draft.city.toLowerCase() === c.name.toLowerCase() &&
                        Math.abs(draft.latitude - c.latitude) < 0.2;
                      return (
                        <button
                          key={`${c.name}-${c.latitude}`}
                          type="button"
                          onClick={() => selectCity(c)}
                          className={`min-h-[54px] px-4 py-3 rounded-2xl text-left transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#0E6B5C] text-white dark:bg-[#6EE7B7] dark:text-[#07201A] shadow-sm'
                              : 'bg-[#F7F4EE] dark:bg-[#152822] text-[#0F2A24] dark:text-[#E8F1ED] hover:bg-[#E6EFE9] dark:hover:bg-[#1B332C]'
                          }`}
                        >
                          <div className="text-sm font-bold truncate">{c.name}</div>
                          <div
                            className={`text-[13px] truncate ${
                              selected
                                ? 'text-white/85 dark:text-[#07201A]/80'
                                : 'text-[#46615A] dark:text-[#9CB5AC]'
                            }`}
                          >
                            {c.country}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: HOUSEHOLD */}
            {step === 2 && (
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                  {copy.onboarding.step2Title}
                </h1>
                <p className="mt-2 text-base text-[#46615A] dark:text-[#9CB5AC]">
                  {copy.onboarding.step2Sub}
                </p>

                <div className="mt-6 grid sm:grid-cols-3 gap-4">
                  {(
                    [
                      { key: 'adults', label: copy.onboarding.adults, min: 1 },
                      { key: 'children', label: copy.onboarding.children, min: 0 },
                      { key: 'elderly', label: copy.onboarding.elderly, min: 0 },
                    ] as const
                  ).map((item) => (
                    <div
                      key={item.key}
                      className="rounded-2xl bg-[#F7F4EE] dark:bg-[#152822] p-4 flex items-center justify-between"
                    >
                      <span className="text-sm font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.label}`}
                          onClick={() =>
                            setDraft((p) => ({
                              ...p,
                              [item.key]: Math.max(item.min, p[item.key] - 1),
                            }))
                          }
                          className="w-10 h-10 rounded-xl bg-white dark:bg-[#1D352E] flex items-center justify-center shadow-xs hover:bg-[#E6EFE9] cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-mono-tabular w-6 text-center text-base font-bold">
                          {draft[item.key]}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.label}`}
                          onClick={() =>
                            setDraft((p) => ({
                              ...p,
                              [item.key]: Math.min(12, p[item.key] + 1),
                            }))
                          }
                          className="w-10 h-10 rounded-xl bg-white dark:bg-[#1D352E] flex items-center justify-center shadow-xs hover:bg-[#E6EFE9] cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
                    {copy.onboarding.sensitivities}
                  </p>
                  <div className="mt-3 grid sm:grid-cols-2 gap-3">
                    {sensitivityOptions.map((opt) => {
                      const active = draft.sensitivities.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleSensitivity(opt.id)}
                          aria-pressed={active}
                          className={`min-h-[48px] px-4 py-3 rounded-2xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#0E6B5C] text-white dark:bg-[#6EE7B7] dark:text-[#07201A]'
                              : 'bg-[#F7F4EE] dark:bg-[#152822] text-[#354E47] dark:text-[#B9D0C8]'
                          }`}
                        >
                          {language === 'hi' ? opt.hi : opt.en}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.hasPets}
                      onChange={(e) => setDraft((p) => ({ ...p, hasPets: e.target.checked }))}
                      className="w-5 h-5 accent-[#0E6B5C] dark:accent-[#6EE7B7] rounded cursor-pointer"
                    />
                    <span className="text-base font-medium text-[#0F2A24] dark:text-[#E8F1ED]">
                      {copy.onboarding.petsLabel}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 3: LIFESTYLE VISUAL CHOICE TILES */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                    {copy.onboarding.step3Title}
                  </h1>
                  <p className="mt-2 text-base text-[#46615A] dark:text-[#9CB5AC]">
                    {copy.onboarding.step3Sub}
                  </p>
                </div>

                {/* Commute visual choice tiles */}
                <div>
                  <p className="text-sm font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
                    {copy.onboarding.commute}
                  </p>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {commuteOptions.map(({ id, en, hi, Icon }) => {
                      const active = draft.commuteMode === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setDraft((p) => ({ ...p, commuteMode: id }))}
                          aria-pressed={active}
                          className={`min-h-[68px] p-3.5 rounded-2xl flex flex-col items-start justify-between gap-2 text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#0E6B5C] text-white dark:bg-[#6EE7B7] dark:text-[#07201A]'
                              : 'bg-[#F7F4EE] dark:bg-[#152822] text-[#0F2A24] dark:text-[#E8F1ED] hover:bg-[#E6EFE9]'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm font-semibold">{language === 'hi' ? hi : en}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cooking fuel visual tiles + Home type tiles */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-sm font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
                      {copy.onboarding.cooking}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      {cookingOptions.map(({ id, en, hi, Icon }) => {
                        const active = draft.cookingFuel === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setDraft((p) => ({ ...p, cookingFuel: id }))}
                            aria-pressed={active}
                            className={`min-h-[60px] p-3 rounded-2xl flex flex-col items-start gap-1.5 text-left transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#0E6B5C] text-white dark:bg-[#6EE7B7] dark:text-[#07201A]'
                                : 'bg-[#F7F4EE] dark:bg-[#152822] text-[#0F2A24] dark:text-[#E8F1ED]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[13px] font-semibold">
                              {language === 'hi' ? hi : en}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
                      {copy.onboarding.homeType} &amp; {copy.onboarding.heating}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      {(
                        [
                          { id: 'apartment', en: 'Apartment', hi: 'अपार्टमेंट', Icon: Building2 },
                          { id: 'independent_house', en: 'House', hi: 'स्वतंत्र घर', Icon: Home },
                        ] as Array<{
                          id: HomeType;
                          en: string;
                          hi: string;
                          Icon: React.ComponentType<{ className?: string }>;
                        }>
                      ).map(({ id, en, hi, Icon }) => {
                        const active = draft.homeType === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setDraft((p) => ({ ...p, homeType: id }))}
                            aria-pressed={active}
                            className={`min-h-[60px] p-3 rounded-2xl flex flex-col items-start gap-1.5 text-left cursor-pointer ${
                              active
                                ? 'bg-[#0E6B5C] text-white dark:bg-[#6EE7B7] dark:text-[#07201A]'
                                : 'bg-[#F7F4EE] dark:bg-[#152822] text-[#0F2A24] dark:text-[#E8F1ED]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[13px] font-semibold">
                              {language === 'hi' ? hi : en}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <select
                      aria-label={copy.onboarding.heating}
                      value={draft.heatingMethod}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, heatingMethod: e.target.value as HeatingMethod }))
                      }
                      className="mt-3 w-full min-h-[44px] px-3.5 rounded-2xl bg-[#F7F4EE] dark:bg-[#152822] text-sm font-medium text-[#0F2A24] dark:text-[#E8F1ED]"
                    >
                      {heatingOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {language === 'hi' ? opt.hi : opt.en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.windowsFacingRoad}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, windowsFacingRoad: e.target.checked }))
                    }
                    className="w-5 h-5 accent-[#0E6B5C] dark:accent-[#6EE7B7] rounded cursor-pointer"
                  />
                  <span className="text-base font-medium text-[#0F2A24] dark:text-[#E8F1ED]">
                    {copy.onboarding.windowsRoad}
                  </span>
                </label>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-sm font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
                      {copy.onboarding.budget}
                    </p>
                    <div className="mt-2.5 space-y-2">
                      {budgetOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDraft((p) => ({ ...p, budget: opt.id }))}
                          aria-pressed={draft.budget === opt.id}
                          className={`w-full min-h-[44px] px-4 py-2 rounded-2xl text-left text-sm font-semibold cursor-pointer ${
                            draft.budget === opt.id
                              ? 'bg-[#0E6B5C] text-white dark:bg-[#6EE7B7] dark:text-[#07201A]'
                              : 'bg-[#F7F4EE] dark:bg-[#152822] text-[#354E47] dark:text-[#B9D0C8]'
                          }`}
                        >
                          {language === 'hi' ? opt.hi : opt.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
                      {copy.onboarding.goal}
                    </p>
                    <div className="mt-2.5 space-y-2">
                      {goalOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDraft((p) => ({ ...p, goal: opt.id }))}
                          aria-pressed={draft.goal === opt.id}
                          className={`w-full min-h-[44px] px-4 py-2 rounded-2xl text-left text-sm font-semibold cursor-pointer ${
                            draft.goal === opt.id
                              ? 'bg-[#0E6B5C] text-white dark:bg-[#6EE7B7] dark:text-[#07201A]'
                              : 'bg-[#F7F4EE] dark:bg-[#152822] text-[#354E47] dark:text-[#B9D0C8]'
                          }`}
                        >
                          {language === 'hi' ? opt.hi : opt.en}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Footer Actions */}
            <div className="mt-8 pt-6 flex items-center justify-between gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                  className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-[#E6EFE9] dark:bg-[#193029] text-sm font-semibold text-[#0F2A24] dark:text-[#E8F1ED] inline-flex items-center gap-2 hover:bg-[#D7E6DC] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {copy.onboarding.back}
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
                  className="min-h-[48px] px-6 py-3 rounded-2xl bg-[#F2A33A] hover:bg-[#E0922B] text-[#1D1405] text-sm font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {copy.onboarding.next}
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onComplete(draft)}
                  className="min-h-[48px] px-6 py-3 rounded-2xl bg-[#F2A33A] hover:bg-[#E0922B] text-[#1D1405] text-sm font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {copy.onboarding.finish}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Live Side Preview Card (4 cols) */}
          <aside
            aria-label={copy.onboarding.previewTitle}
            className="lg:col-span-4 lg:sticky lg:top-24 rounded-3xl bg-[#E6EFE9] dark:bg-[#142923] p-6 shadow-[0_14px_34px_-16px_rgba(15,42,36,0.12)]"
          >
            <p className="text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
              {copy.onboarding.previewTitle}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#0E6B5C] dark:text-[#6EE7B7]" />
              <span
                data-testid="onboarding-preview-city"
                className="font-display text-2xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]"
              >
                {draft.city}
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-sm text-[#28423C] dark:text-[#C5DAD2]">
              <p data-testid="onboarding-preview-members">
                <strong className="font-semibold">
                  {language === 'hi' ? 'परिवार:' : 'Household:'}
                </strong>{' '}
                <span className="font-mono-tabular">
                  {draft.adults} {language === 'hi' ? 'वयस्क' : 'adults'}, {draft.children}{' '}
                  {language === 'hi' ? 'बच्चे' : 'kids'}
                  {draft.elderly > 0
                    ? `, ${draft.elderly} ${language === 'hi' ? 'बुजुर्ग' : 'seniors'}`
                    : ''}
                </span>
              </p>
              <p>
                <strong className="font-semibold">
                  {language === 'hi' ? 'आवागमन:' : 'Commute:'}
                </strong>{' '}
                {commuteLabel}
              </p>
              <p>
                <strong className="font-semibold">
                  {language === 'hi' ? 'रसोई:' : 'Cooking:'}
                </strong>{' '}
                {cookingLabel}
              </p>
              <p>
                <strong className="font-semibold">
                  {language === 'hi' ? 'खिड़कियां:' : 'Windows:'}
                </strong>{' '}
                {draft.windowsFacingRoad
                  ? language === 'hi'
                    ? 'मुख्य सड़क की तरफ'
                    : 'Road-facing'
                  : language === 'hi'
                    ? 'शांत दिशा में'
                    : 'Sheltered side'}
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
