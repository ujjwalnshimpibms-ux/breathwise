import React, { useEffect, useState } from 'react';
import type { Language, UserProfile } from '../types/saans';
import {
  calculateWhatIfImpact,
  WHAT_IF_OPTIONS,
  type WhatIfSelection,
  type WhatIfSummary,
} from '../utils/impact';
import { calculateWhatIfImpactRemote } from '../services/ai';
import { UI_COPY } from '../i18n/copy';

interface WhatIfSimulatorProps {
  profile: UserProfile;
  currentPm25: number;
  selections: WhatIfSelection;
  onChangeSelections: (next: WhatIfSelection) => void;
  language: Language;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  profile,
  currentPm25,
  selections,
  onChangeSelections,
  language,
}) => {
  const copy = UI_COPY[language];
  const [summary, setSummary] = useState<WhatIfSummary>(() =>
    calculateWhatIfImpact(profile, currentPm25, selections)
  );
  const [remoteError, setRemoteError] = useState(false);

  // Instant local preview + debounced (150ms) backend sync to POST /api/whatif
  useEffect(() => {
    setSummary(calculateWhatIfImpact(profile, currentPm25, selections));
    setRemoteError(false);

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      calculateWhatIfImpactRemote(selections, profile, currentPm25, controller.signal)
        .then((remote) => {
          if (!controller.signal.aborted) {
            setSummary(remote);
            setRemoteError(false);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setRemoteError(true);
          }
        });
    }, 150);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [profile, currentPm25, selections]);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - summary.cleanAirScore / 100);

  const toggleOption = (id: string, defaultVal = 1) => {
    const current = selections[id] ?? 0;
    onChangeSelections({
      ...selections,
      [id]: current > 0 ? 0 : defaultVal,
    });
  };

  const updateSlider = (id: string, val: number) => {
    onChangeSelections({
      ...selections,
      [id]: val,
    });
  };

  return (
    <section
      id="section-what-if"
      aria-labelledby="what-if-heading"
      className="rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 sm:p-8 shadow-[0_18px_46px_-18px_rgba(15,42,36,0.12)]"
    >
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 cols: Big toggles & sliders */}
        <div className="lg:col-span-7 min-w-0">
          <h2
            id="what-if-heading"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2A24] dark:text-[#E8F1ED]"
          >
            {copy.dashboard.simulatorTitle}
          </h2>
          <p className="mt-1.5 text-base text-[#46615A] dark:text-[#9CB5AC]">
            {copy.dashboard.simulatorSub}
          </p>

          <div className="mt-6 space-y-3.5">
            {WHAT_IF_OPTIONS.map((opt) => {
              const value = selections[opt.id] ?? 0;
              const isActive = value > 0;
              const label = language === 'hi' ? opt.labelHi : opt.label;
              const desc = language === 'hi' ? opt.descriptionHi : opt.description;

              return (
                <div
                  key={opt.id}
                  className={`rounded-2xl p-4 sm:p-5 transition-colors ${
                    isActive
                      ? 'bg-[#E6EFE9] dark:bg-[#173029]'
                      : 'bg-[#F7F4EE] dark:bg-[#0E1D19]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <label
                        htmlFor={`sim-${opt.id}`}
                        className="text-base font-semibold text-[#0F2A24] dark:text-[#E8F1ED] cursor-pointer block"
                      >
                        {label}
                      </label>
                      <p className="mt-1 text-[13px] sm:text-sm text-[#46615A] dark:text-[#9CB5AC]">
                        {desc}
                      </p>
                    </div>

                    <button
                      id={`sim-${opt.id}`}
                      type="button"
                      role="switch"
                      aria-checked={isActive}
                      onClick={() => toggleOption(opt.id, opt.defaultSliderValue ?? 1)}
                      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B5C] ${
                        isActive
                          ? 'bg-[#0E6B5C] dark:bg-[#6EE7B7]'
                          : 'bg-[#C9D6CE] dark:bg-[#234037]'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 rounded-full bg-white dark:bg-[#07201A] shadow-xs transition-transform ${
                          isActive ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {opt.hasSlider && (
                    <div className="mt-4 flex items-center gap-4">
                      <input
                        type="range"
                        aria-label={label}
                        min={opt.sliderMin ?? 0}
                        max={opt.sliderMax ?? 6}
                        value={value}
                        onChange={(e) => updateSlider(opt.id, Number(e.target.value))}
                        className="w-full accent-[#0E6B5C] dark:accent-[#6EE7B7] cursor-pointer"
                      />
                      <span className="font-mono-tabular text-sm font-bold text-[#0E6B5C] dark:text-[#6EE7B7] whitespace-nowrap shrink-0">
                        {value} {language === 'hi' ? opt.sliderUnitHi : opt.sliderUnit}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 cols: Sticky live "Your week" summary panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-32 rounded-3xl bg-[#0E6B5C] dark:bg-[#153B31] text-white p-6 sm:p-7 shadow-[0_20px_50px_-18px_rgba(14,107,92,0.45)] flex flex-col items-center text-center">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#FDE68A]">
            {copy.dashboard.yourWeekTitle}
          </p>
          <p className="mt-1 font-display text-xl font-bold">{copy.dashboard.cleanAirScore}</p>

          <div className="relative mt-4 w-32 h-32 flex items-center justify-center">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 104 104" aria-hidden="true">
              <circle
                cx="52"
                cy="52"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="10"
              />
              <circle
                cx="52"
                cy="52"
                r={radius}
                fill="none"
                stroke="#F2A33A"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-[stroke-dashoffset] duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                data-testid="clean-air-score"
                className="font-mono-tabular text-3xl font-bold"
              >
                {summary.cleanAirScore}
              </span>
              <span className="text-[13px] text-white/80">/ 100</span>
            </div>
          </div>

          <p className="mt-1.5 text-[13px] text-white/85">
            {copy.dashboard.baseline}:{' '}
            <span className="font-mono-tabular font-semibold">{summary.baselineScore}/100</span>
          </p>

          <div className="mt-6 w-full space-y-3.5 text-left rounded-2xl bg-white/12 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] text-white/85">{copy.dashboard.estReduction}</span>
              <span
                data-testid="whatif-pm-reduction"
                className="font-mono-tabular text-xl font-bold text-[#FDE68A]"
              >
                -{summary.estimatedPm25ExposureReductionPct}%
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] text-white/85">{copy.dashboard.co2Avoided}</span>
              <span
                data-testid="whatif-co2-avoided"
                className="font-mono-tabular text-lg font-bold"
              >
                {summary.co2AvoidedKgPerWeek} kg
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] text-white/85">{copy.dashboard.rupeesSaved}</span>
              <span
                data-testid="whatif-rupees-saved"
                className="font-mono-tabular text-lg font-bold text-[#A7F3D0]"
              >
                ₹{summary.rupeesSavedPerWeek}
              </span>
            </div>
          </div>

          <p className="mt-4 text-[13px] leading-relaxed text-white/80">
            {copy.dashboard.estimateNote}
          </p>
          {(summary.isOfflineEstimate || remoteError) && (
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-400/20 text-[#FDE68A] text-[12px] font-medium">
              {language === 'hi' ? 'ऑफ़लाइन अनुमान का उपयोग' : 'Using offline estimate'}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};
