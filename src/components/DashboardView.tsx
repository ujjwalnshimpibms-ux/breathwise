import React, { useState } from 'react';
import {
  Check,
  Clock,
  MapPin,
  Moon,
  Printer,
  RefreshCw,
  Share2,
  Sun,
  Sunrise,
  Sunset,
  X,
} from 'lucide-react';
import type {
  AirQualityData,
  CleanAirPlan,
  CostLevel,
  EffortLevel,
  Language,
  PlanSectionKey,
  SectionStatusMap,
  ThemeMode,
  TimeOfDay,
  UserProfile,
} from '../types/saans';
import { UI_COPY } from '../i18n/copy';
import { buildFamilyMeaningLine, getAqiCategory } from '../utils/aqi';
import {
  calculateWhatIfImpact,
  getTopThreeActionsNow,
  type WhatIfSelection,
} from '../utils/impact';
import { ImpactMeter } from './ImpactMeter';
import { WhatIfSimulator } from './WhatIfSimulator';
import { WorkspaceToolbar } from './WorkspaceToolbar';
import { BreathwiseLogo } from './BreathwiseLogo';

interface DashboardViewProps {
  profile: UserProfile;
  aqiData: AirQualityData;
  plan: CleanAirPlan;
  sectionStatus: SectionStatusMap;
  onRegenerateAll: () => void;
  onRegenerateSection: (section: PlanSectionKey) => void;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  whatIfSelections: WhatIfSelection;
  onChangeWhatIfSelections: (next: WhatIfSelection) => void;
}

function formatCost(cost: CostLevel, lang: Language): string {
  if (lang === 'hi') {
    return cost === 'free'
      ? 'मुफ़्त'
      : cost === 'low'
        ? 'कम लागत'
        : cost === 'medium'
          ? 'मध्यम खर्च'
          : 'अधिक खर्च';
  }
  return cost === 'free'
    ? 'Free'
    : cost === 'low'
      ? 'Low cost'
      : cost === 'medium'
        ? 'Moderate cost'
        : 'Higher cost';
}

function formatEffort(effort: EffortLevel, lang: Language): string {
  if (lang === 'hi') {
    return effort === 'easy'
      ? 'आसान'
      : effort === 'moderate'
        ? 'मध्यम प्रयास'
        : 'आदत में बदलाव';
  }
  return effort === 'easy' ? 'Easy' : effort === 'moderate' ? 'Moderate effort' : 'Habit shift';
}

function formatTimeSlot(slot: TimeOfDay, lang: Language): string {
  const map: Record<TimeOfDay, { en: string; hi: string }> = {
    morning: { en: 'Morning', hi: 'सुबह' },
    afternoon: { en: 'Afternoon', hi: 'दोपहर' },
    evening: { en: 'Evening', hi: 'शाम' },
    night: { en: 'Night', hi: 'रात' },
  };
  return map[slot][lang];
}

function getTimeIcon(slot: TimeOfDay) {
  if (slot === 'morning') return Sunrise;
  if (slot === 'afternoon') return Sun;
  if (slot === 'evening') return Sunset;
  return Moon;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  aqiData,
  plan,
  sectionStatus,
  onRegenerateAll,
  onRegenerateSection,
  language,
  onChangeLanguage,
  theme,
  onToggleTheme,
  whatIfSelections,
  onChangeWhatIfSelections,
}) => {
  const copy = UI_COPY[language];
  const category = getAqiCategory(aqiData.aqi);
  const meaningLine = plan.familySummary || buildFamilyMeaningLine(aqiData.aqi, profile, language);
  const whatIfSummary = calculateWhatIfImpact(profile, aqiData.pm25, whatIfSelections);
  const topThree = getTopThreeActionsNow(plan, language);

  const [selectedTime, setSelectedTime] = useState<'all' | TimeOfDay>('all');
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const anyGenerating =
    sectionStatus.routines === 'generating' ||
    sectionStatus.indoorHacks === 'generating' ||
    sectionStatus.alternatives === 'generating';
  const anyOffline =
    sectionStatus.routines === 'offline' ||
    sectionStatus.indoorHacks === 'offline' ||
    sectionStatus.alternatives === 'offline';

  const statusChipLabel = anyGenerating
    ? copy.dashboard.statusGenerating
    : anyOffline
      ? copy.dashboard.statusOffline
      : copy.dashboard.statusUpdated;

  const statusChipClass = anyGenerating
    ? 'bg-[#F2A33A]/20 text-[#8A5408] dark:text-[#FDE68A]'
    : anyOffline
      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
      : 'bg-[#E6EFE9] text-[#0E6B5C] dark:bg-[#193029] dark:text-[#6EE7B7]';

  // Hero 160px AQI gauge math
  const heroRadius = 64;
  const heroCirc = 2 * Math.PI * heroRadius;
  const heroOffset = heroCirc * (1 - Math.min(1, Math.max(0.06, aqiData.aqi / 400)));

  // Score ring math
  const scoreRadius = 40;
  const scoreCirc = 2 * Math.PI * scoreRadius;
  const scoreOffset = scoreCirc * (1 - whatIfSummary.cleanAirScore / 100);

  const filteredRoutines =
    selectedTime === 'all'
      ? plan.routines
      : plan.routines.filter((r) => r.timeOfDay === selectedTime);

  const toggleStepCheck = (stepKey: string) => {
    setCheckedSteps((prev) => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const shareText = `Breathwise — ${profile.city} (AQI ${aqiData.aqi}, ${aqiData.dominantPollutant})\n${meaningLine}\n\n${copy.dashboard.bestWindowCardTitle}: ${aqiData.bestOutdoorWindow}\n\n${plan.routines
    .map((r) => `• ${r.windowLabel}: ${r.title} (${r.impact.valueText})`)
    .join('\n')}`;

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    } catch {
      setShareOpen(true);
    }
  };

  const maxHourlyAqi = Math.max(100, ...aqiData.hourly.map((h) => h.aqi));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Print-only Breathwise header */}
      <div className="hidden print:block px-6 pt-4 pb-2 border-b border-gray-300">
        <BreathwiseLogo />
        <p className="text-sm mt-1">
          {profile.city} · US AQI {aqiData.aqi} ({aqiData.dominantPollutant})
        </p>
      </div>

      <WorkspaceToolbar
        language={language}
        onChangeLanguage={onChangeLanguage}
        theme={theme}
        onToggleTheme={onToggleTheme}
        leftSlot={
          <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
            <span className="font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
              {profile.city}
            </span>
            <span aria-hidden="true" className="text-[#78948B]">·</span>
            <span className="text-[#46615A] dark:text-[#9CB5AC]">
              {profile.adults}A / {profile.children}C / {profile.elderly}E
            </span>
            <span
              data-testid="dashboard-status-chip"
              className={`px-2.5 py-1 rounded-xl text-[13px] font-semibold whitespace-nowrap ${statusChipClass}`}
            >
              {statusChipLabel}
            </span>
          </div>
        }
        rightSlot={
          <>
            <button
              type="button"
              onClick={onRegenerateAll}
              disabled={anyGenerating}
              aria-label={copy.dashboard.regenerateAi}
              className="min-h-[40px] px-3.5 rounded-xl bg-white/90 dark:bg-[#152822] text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7] inline-flex items-center gap-1.5 hover:bg-white shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${anyGenerating ? 'animate-spin' : ''}`} />
              <span>{copy.dashboard.regenerateAi}</span>
            </button>

            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label={copy.dashboard.sharePlan}
              className="min-h-[40px] min-w-[40px] px-3 rounded-xl bg-white/90 dark:bg-[#152822] text-[13px] font-semibold text-[#0F2A24] dark:text-[#E8F1ED] inline-flex items-center justify-center gap-1.5 hover:bg-white shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copy.dashboard.sharePlan}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              aria-label={copy.dashboard.printPlan}
              className="min-h-[40px] min-w-[40px] px-3 rounded-xl bg-white/90 dark:bg-[#152822] text-[13px] font-semibold text-[#0F2A24] dark:text-[#E8F1ED] inline-flex items-center justify-center gap-1.5 hover:bg-white shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{copy.dashboard.printPlan}</span>
            </button>
          </>
        }
      />

      {/* Sticky Section Sub-Nav */}
      <div className="no-print sticky top-16 z-20 bg-[#F7F4EE]/92 dark:bg-[#0B1714]/92 backdrop-blur-md shadow-[0_1px_0_rgba(15,42,36,0.06)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto">
          {(
            [
              { id: 'section-plan', label: copy.dashboard.subNav.plan },
              { id: 'section-indoor', label: copy.dashboard.subNav.indoor },
              { id: 'section-alternatives', label: copy.dashboard.subNav.alternatives },
              { id: 'section-impact', label: copy.dashboard.subNav.impact },
              { id: 'section-what-if', label: copy.dashboard.subNav.whatIf },
            ] as const
          ).map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => scrollToSection(nav.id)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-[#12231E] hover:bg-[#E6EFE9] dark:hover:bg-[#193029] text-[13px] font-semibold text-[#0F2A24] dark:text-[#E8F1ED] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {nav.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 pb-24 md:pb-16 space-y-8">
        {/* TOP ROW BENTO: (a) Big AQI Hero Card, (b) Best Window + 24h Mini Bar, (c) Clean Air Score */}
        <section
          aria-label={copy.dashboard.liveAqiTitle}
          className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch"
        >
          {/* (a) Big AQI Hero Card (6 cols) */}
          <div className="md:col-span-12 lg:col-span-6 rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 sm:p-7 shadow-[0_18px_44px_-18px_rgba(15,42,36,0.12)] flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
                  <circle
                    cx="80"
                    cy="80"
                    r={heroRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-[#E6EFE9] dark:text-[#1B332C]"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r={heroRadius}
                    fill="none"
                    stroke={category.strokeHex}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={heroCirc}
                    strokeDashoffset={heroOffset}
                    className="transition-[stroke-dashoffset] duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono-tabular text-4xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                    {aqiData.aqi}
                  </span>
                  <span className="text-[13px] font-medium text-[#46615A] dark:text-[#9CB5AC]">
                    US AQI
                  </span>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium text-[#46615A] dark:text-[#9CB5AC]">
                  <MapPin className="w-4 h-4 text-[#0E6B5C] dark:text-[#6EE7B7]" />
                  <span>{aqiData.city}</span>
                </div>

                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-xl text-[13px] font-bold ${category.bgTintClass} ${category.textColorClass}`}
                  >
                    {language === 'hi' ? category.labelHi : category.label}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-[#46615A] dark:text-[#9CB5AC]">
                  <span>
                    {copy.dashboard.dominant}:{' '}
                    <strong className="font-sans font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                      {aqiData.dominantPollutant}
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">PM2.5 {aqiData.pm25} µg/m³</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">PM10 {aqiData.pm10} µg/m³</span>
                </div>

                <p className="mt-1.5 text-[13px] text-[#46615A] dark:text-[#9CB5AC]">
                  {aqiData.sourceLabel}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#F7F4EE] dark:bg-[#0E1D19] p-4 sm:p-5">
              <p className="text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                {copy.dashboard.meaningTitle}
              </p>
              <p className="mt-1.5 text-[18px] font-medium leading-relaxed text-[#0F2A24] dark:text-[#E8F1ED]">
                {meaningLine}
              </p>
            </div>
          </div>

          {/* (b) Best Window + 24h Mini Timeline Bar (3 cols) */}
          <div className="md:col-span-6 lg:col-span-3 rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 shadow-[0_18px_44px_-18px_rgba(15,42,36,0.12)] flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                <Clock className="w-4 h-4" />
                <span>{copy.dashboard.bestWindowCardTitle}</span>
              </div>
              <p className="mt-3 font-mono-tabular text-2xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                {aqiData.bestOutdoorWindow}
              </p>
              <p className="mt-1 text-[13px] text-[#46615A] dark:text-[#9CB5AC]">
                {copy.dashboard.bestWindowSub}
              </p>
            </div>

            {/* 24h mini timeline bar */}
            <div className="mt-6">
              <div className="h-24 flex items-end gap-1.5" aria-hidden="true">
                {aqiData.hourly.slice(0, 8).map((pt, i) => {
                  const pct = Math.max(18, Math.round((pt.aqi / maxHourlyAqi) * 100));
                  const ptCat = getAqiCategory(pt.aqi);
                  return (
                    <div key={`${pt.time}-${i}`} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full h-16 flex items-end">
                        <div
                          className="w-full rounded-t-lg transition-all"
                          style={{
                            height: `${pct}%`,
                            backgroundColor: ptCat.strokeHex,
                            opacity: 0.85,
                          }}
                        />
                      </div>
                      <span className="font-mono-tabular text-[11px] text-[#46615A] dark:text-[#9CB5AC]">
                        {pt.hour}h
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* (c) Clean Air Score Ring Card (3 cols) */}
          <div className="md:col-span-6 lg:col-span-3 rounded-3xl bg-[#E6EFE9] dark:bg-[#152822] p-6 shadow-[0_18px_44px_-18px_rgba(15,42,36,0.1)] flex flex-col items-center justify-between text-center">
            <p className="text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
              {copy.dashboard.cleanAirScore}
            </p>

            <div className="relative my-3 w-28 h-28 flex items-center justify-center">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
                <circle
                  cx="48"
                  cy="48"
                  r={scoreRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  className="text-white/70 dark:text-[#0B1714]"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={scoreRadius}
                  fill="none"
                  stroke="#0E6B5C"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={scoreCirc}
                  strokeDashoffset={scoreOffset}
                  className="dark:stroke-[#6EE7B7] transition-[stroke-dashoffset] duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono-tabular text-3xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                  {whatIfSummary.cleanAirScore}
                </span>
                <span className="text-[13px] text-[#46615A] dark:text-[#9CB5AC]">/ 100</span>
              </div>
            </div>

            <div className="w-full rounded-2xl bg-white/80 dark:bg-[#0E1D19] px-3.5 py-2.5 text-[13px] text-[#28423C] dark:text-[#C5DAD2]">
              {copy.dashboard.estReduction}:{' '}
              <strong className="font-mono-tabular text-[#0E6B5C] dark:text-[#6EE7B7]">
                -{whatIfSummary.estimatedPm25ExposureReductionPct}%
              </strong>
            </div>
          </div>
        </section>

        {/* TOP 3 THINGS TO DO RIGHT NOW STRIP */}
        <section
          id="section-impact"
          aria-labelledby="top-three-heading"
          className="rounded-3xl bg-[#0E6B5C] dark:bg-[#143A31] text-white p-6 shadow-[0_18px_40px_-16px_rgba(14,107,92,0.4)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="top-three-heading" className="font-display text-xl sm:text-2xl font-bold">
              {copy.dashboard.topThreeTitle}
            </h2>
            <span className="text-[13px] text-[#FDE68A] font-medium">
              {copy.dashboard.estimateNote}
            </span>
          </div>

          <div className="mt-4 grid md:grid-cols-3 gap-4">
            {topThree.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(`section-${item.sectionAnchor}`)}
                className="rounded-2xl bg-white/12 hover:bg-white/18 p-4 text-left transition-colors cursor-pointer flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between gap-2 text-[13px] text-[#FDE68A] font-semibold">
                  <span>
                    0{idx + 1} · {item.category}
                  </span>
                  <span className="font-mono-tabular">{item.impactValueText}</span>
                </div>
                <p className="text-base font-semibold text-white leading-snug">{item.title}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 1. TODAY'S PLAN (Independent Section) */}
        <section id="section-plan" aria-labelledby="todays-plan-heading" className="print-break-avoid">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2
                  id="todays-plan-heading"
                  className="font-display text-2xl sm:text-3xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]"
                >
                  {copy.dashboard.todaysPlan}
                </h2>
                {sectionStatus.routines === 'offline' && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-200 text-[13px] font-semibold">
                    {copy.dashboard.offlineBadge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-base text-[#46615A] dark:text-[#9CB5AC]">
                {plan.headlineAlert}
              </p>
            </div>

            <div className="no-print flex flex-wrap items-center gap-2">
              {sectionStatus.routines === 'offline' && (
                <button
                  type="button"
                  onClick={() => onRegenerateSection('routines')}
                  className="min-h-[40px] px-3.5 rounded-xl bg-[#E6EFE9] dark:bg-[#193029] text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {copy.dashboard.regenerateAi}
                </button>
              )}

              {/* Time-of-day horizontal tabs */}
              <div
                role="tablist"
                aria-label="Time of day filter"
                className="inline-flex items-center p-1 rounded-2xl bg-white/90 dark:bg-[#12231E] shadow-xs overflow-x-auto max-w-full"
              >
                {(['all', 'morning', 'afternoon', 'evening', 'night'] as const).map((slot) => {
                  const active = selectedTime === slot;
                  const label =
                    slot === 'all'
                      ? language === 'hi'
                        ? 'सभी'
                        : 'All'
                      : formatTimeSlot(slot, language);
                  return (
                    <button
                      key={slot}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedTime(slot)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#0E6B5C] text-white dark:bg-[#6EE7B7] dark:text-[#07201A]'
                          : 'text-[#46615A] dark:text-[#9CB5AC] hover:text-[#0F2A24] dark:hover:text-[#E8F1ED]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {sectionStatus.routines === 'generating' ? (
            <div className="mt-5 grid md:grid-cols-2 gap-5" aria-busy="true">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-72 rounded-3xl bg-white/80 dark:bg-[#12231E]/80 p-6 animate-pulse shadow-xs"
                >
                  <div className="h-4 w-32 rounded bg-[#E6EFE9] dark:bg-[#1C342D]" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-[#E6EFE9] dark:bg-[#1C342D]" />
                  <div className="mt-3 h-4 w-full rounded bg-[#F0F4F1] dark:bg-[#162923]" />
                  <div className="mt-6 h-20 w-full rounded-2xl bg-[#E6EFE9]/70 dark:bg-[#162923]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 grid md:grid-cols-2 gap-5">
              {filteredRoutines.map((item) => {
                const TimeIcon = getTimeIcon(item.timeOfDay);
                return (
                  <article
                    key={item.id}
                    className="print-break-avoid rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 sm:p-7 shadow-[0_14px_38px_-18px_rgba(15,42,36,0.12)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                          <TimeIcon className="w-4 h-4 text-[#F2A33A]" />
                          <span>{formatTimeSlot(item.timeOfDay, language)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">{item.windowLabel}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[13px] font-semibold">
                          <span className="px-2.5 py-1 rounded-xl bg-[#E6EFE9] dark:bg-[#193029] text-[#0E6B5C] dark:text-[#6EE7B7]">
                            {formatCost(item.costLevel, language)}
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-[#F7F4EE] dark:bg-[#0E1D19] text-[#46615A] dark:text-[#9CB5AC]">
                            {formatEffort(item.effortLevel, language)}
                          </span>
                        </div>
                      </div>

                      <h3 className="mt-3 font-display text-xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-base leading-relaxed text-[#46615A] dark:text-[#9CB5AC]">
                        {item.whyItHelps}
                      </p>

                      {/* Checkable steps */}
                      <ul className="mt-4 space-y-2.5">
                        {item.steps.map((step, i) => {
                          const key = `${item.id}-${i}`;
                          const done = Boolean(checkedSteps[key]);
                          return (
                            <li key={key}>
                              <label className="flex items-start gap-3 cursor-pointer text-sm sm:text-base text-[#0F2A24] dark:text-[#DFECE7]">
                                <input
                                  type="checkbox"
                                  checked={done}
                                  onChange={() => toggleStepCheck(key)}
                                  className="mt-1 w-4 h-4 accent-[#0E6B5C] dark:accent-[#6EE7B7] rounded shrink-0 cursor-pointer"
                                />
                                <span className={done ? 'line-through opacity-60' : ''}>{step}</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <ImpactMeter impact={item.impact} language={language} />
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. INDOOR AIR HACKS (Independent Section) */}
        <section id="section-indoor" aria-labelledby="indoor-hacks-heading" className="print-break-avoid">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2
                id="indoor-hacks-heading"
                className="font-display text-2xl sm:text-3xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]"
              >
                {copy.dashboard.indoorHacks}
              </h2>
              {sectionStatus.indoorHacks === 'offline' && (
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-200 text-[13px] font-semibold">
                  {copy.dashboard.offlineBadge}
                </span>
              )}
            </div>

            {sectionStatus.indoorHacks === 'offline' && (
              <button
                type="button"
                onClick={() => onRegenerateSection('indoorHacks')}
                className="no-print min-h-[40px] px-3.5 rounded-xl bg-[#E6EFE9] dark:bg-[#193029] text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {copy.dashboard.regenerateAi}
              </button>
            )}
          </div>

          {sectionStatus.indoorHacks === 'generating' ? (
            <div className="mt-5 grid md:grid-cols-2 gap-5" aria-busy="true">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-72 rounded-3xl bg-white/80 dark:bg-[#12231E]/80 p-6 animate-pulse shadow-xs"
                >
                  <div className="h-4 w-36 rounded bg-[#E6EFE9] dark:bg-[#1C342D]" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-[#E6EFE9] dark:bg-[#1C342D]" />
                  <div className="mt-3 h-4 w-full rounded bg-[#F0F4F1] dark:bg-[#162923]" />
                  <div className="mt-6 h-20 w-full rounded-2xl bg-[#E6EFE9]/70 dark:bg-[#162923]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 grid md:grid-cols-2 gap-5">
              {plan.indoorHacks.map((hack) => (
                <article
                  key={hack.id}
                  className="print-break-avoid rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 sm:p-7 shadow-[0_14px_38px_-18px_rgba(15,42,36,0.12)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono-tabular text-sm font-bold text-[#0E6B5C] dark:text-[#6EE7B7]">
                        #{hack.rank} · {hack.category}
                      </span>
                      <div className="flex items-center gap-2 text-[13px] font-semibold">
                        <span className="px-2.5 py-1 rounded-xl bg-[#E6EFE9] dark:bg-[#193029] text-[#0E6B5C] dark:text-[#6EE7B7]">
                          {formatCost(hack.costLevel, language)}
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-[#F7F4EE] dark:bg-[#0E1D19] text-[#46615A] dark:text-[#9CB5AC]">
                          {formatEffort(hack.effortLevel, language)}
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-3 font-display text-xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                      {hack.title}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-[#46615A] dark:text-[#9CB5AC]">
                      {hack.whyItHelps}
                    </p>

                    {hack.honestNote && (
                      <div className="mt-3.5 rounded-2xl bg-[#F7F4EE] dark:bg-[#0E1D19] p-3.5 text-sm leading-relaxed text-[#28423C] dark:text-[#C5DAD2]">
                        <strong className="font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                          {copy.dashboard.honestNote}:{' '}
                        </strong>
                        {hack.honestNote}
                      </div>
                    )}

                    <ul className="mt-4 space-y-1.5 text-sm sm:text-base text-[#0F2A24] dark:text-[#DFECE7]">
                      {hack.steps.map((step, i) => (
                        <li key={i} className="leading-relaxed flex items-start gap-2">
                          <span className="text-[#F2A33A] font-bold">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <ImpactMeter impact={hack.impact} language={language} />
                </article>
              ))}
            </div>
          )}
        </section>

        {/* 3. SUSTAINABLE ALTERNATIVES (Independent Section) */}
        <section
          id="section-alternatives"
          aria-labelledby="alternatives-heading"
          className="print-break-avoid"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2
                id="alternatives-heading"
                className="font-display text-2xl sm:text-3xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]"
              >
                {copy.dashboard.alternatives}
              </h2>
              {sectionStatus.alternatives === 'offline' && (
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-200 text-[13px] font-semibold">
                  {copy.dashboard.offlineBadge}
                </span>
              )}
            </div>

            {sectionStatus.alternatives === 'offline' && (
              <button
                type="button"
                onClick={() => onRegenerateSection('alternatives')}
                className="no-print min-h-[40px] px-3.5 rounded-xl bg-[#E6EFE9] dark:bg-[#193029] text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {copy.dashboard.regenerateAi}
              </button>
            )}
          </div>

          {sectionStatus.alternatives === 'generating' ? (
            <div className="mt-5 grid lg:grid-cols-3 gap-5" aria-busy="true">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-72 rounded-3xl bg-white/80 dark:bg-[#12231E]/80 p-6 animate-pulse shadow-xs"
                >
                  <div className="h-4 w-28 rounded bg-[#E6EFE9] dark:bg-[#1C342D]" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-[#E6EFE9] dark:bg-[#1C342D]" />
                  <div className="mt-3 h-4 w-full rounded bg-[#F0F4F1] dark:bg-[#162923]" />
                  <div className="mt-6 h-20 w-full rounded-2xl bg-[#E6EFE9]/70 dark:bg-[#162923]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 grid lg:grid-cols-3 gap-5">
              {plan.alternatives.map((alt) => (
                <article
                  key={alt.id}
                  className="print-break-avoid rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 shadow-[0_14px_38px_-18px_rgba(15,42,36,0.12)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
                      <span className="px-2.5 py-1 rounded-xl bg-[#E6EFE9] dark:bg-[#193029] text-[#0E6B5C] dark:text-[#6EE7B7]">
                        {formatCost(alt.costLevel, language)}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-[#F7F4EE] dark:bg-[#0E1D19] text-[#46615A] dark:text-[#9CB5AC]">
                        {formatEffort(alt.effortLevel, language)}
                      </span>
                    </div>

                    <h3 className="mt-3 font-display text-xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                      {alt.title}
                    </h3>

                    <p className="mt-1 text-[13px] font-medium text-[#46615A] dark:text-[#9CB5AC]">
                      {language === 'hi' ? 'विकल्प: ' : 'Replaces: '}
                      {alt.replaces}
                    </p>

                    <p className="mt-2.5 text-base leading-relaxed text-[#46615A] dark:text-[#9CB5AC]">
                      {alt.whyItHelps}
                    </p>

                    <ul className="mt-4 space-y-1.5 text-sm sm:text-base text-[#0F2A24] dark:text-[#DFECE7]">
                      {alt.steps.map((step, i) => (
                        <li key={i} className="leading-relaxed flex items-start gap-2">
                          <span className="text-[#F2A33A] font-bold">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <ImpactMeter impact={alt.impact} language={language} />
                </article>
              ))}
            </div>
          )}
        </section>

        {/* 4. WHAT-IF SIMULATOR */}
        <div className="no-print">
          <WhatIfSimulator
            profile={profile}
            currentPm25={aqiData.pm25}
            selections={whatIfSelections}
            onChangeSelections={onChangeWhatIfSelections}
            language={language}
          />
        </div>
      </main>

      {/* Share Plan Modal */}
      {shareOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-dialog-title"
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#12231E] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2
                id="share-dialog-title"
                className="font-display text-xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]"
              >
                {copy.dashboard.sharePlan}
              </h2>
              <button
                type="button"
                aria-label="Close share dialog"
                onClick={() => setShareOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center hover:bg-[#E6EFE9] dark:hover:bg-[#193029] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              readOnly
              rows={8}
              value={shareText}
              aria-label="Shareable plan summary"
              className="mt-4 w-full rounded-2xl bg-[#F7F4EE] dark:bg-[#0B1714] p-4 text-sm leading-relaxed text-[#0F2A24] dark:text-[#E8F1ED]"
            />

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShareOpen(false);
                  window.print();
                }}
                className="min-h-[44px] px-4 rounded-2xl bg-[#E6EFE9] dark:bg-[#193029] text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                {copy.dashboard.printPlan}
              </button>
              <button
                type="button"
                onClick={handleCopyShare}
                className="min-h-[44px] px-5 rounded-2xl bg-[#F2A33A] hover:bg-[#E0922B] text-[#1D1405] text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedShare ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copiedShare ? copy.dashboard.copied : copy.dashboard.sharePlan}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
