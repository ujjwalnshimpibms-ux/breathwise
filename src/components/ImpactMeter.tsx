import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ImpactEstimate, Language } from '../types/saans';
import { UI_COPY } from '../i18n/copy';

interface ImpactMeterProps {
  impact: ImpactEstimate;
  language: Language;
  prominent?: boolean;
}

export const ImpactMeter: React.FC<ImpactMeterProps> = ({
  impact,
  language,
  prominent = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const copy = UI_COPY[language];

  const barPct = Math.max(10, Math.min(100, Math.round((impact.pm25ReductionPct / 50) * 100)));

  const confidenceLabel =
    language === 'hi'
      ? impact.confidence === 'high'
        ? 'उच्च विश्वास'
        : impact.confidence === 'medium'
          ? 'मध्यम विश्वास'
          : 'प्रारंभिक अनुमान'
      : `${impact.confidence} confidence`;

  return (
    <div className="mt-5 rounded-2xl bg-[#E6EFE9]/85 dark:bg-[#142923] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-[#37524B] dark:text-[#A5C0B6]">
          {impact.metricLabel}
        </span>
        <span
          className={`font-mono-tabular font-bold text-[#0E6B5C] dark:text-[#6EE7B7] ${
            prominent ? 'text-lg sm:text-xl' : 'text-base'
          }`}
        >
          {impact.valueText}
        </span>
      </div>

      {/* Animated Impact Bar */}
      <div
        className="mt-2.5 h-2.5 w-full rounded-full bg-white/80 dark:bg-[#0B1714] overflow-hidden"
        role="progressbar"
        aria-valuenow={impact.pm25ReductionPct}
        aria-valuemin={0}
        aria-valuemax={50}
        aria-label={impact.metricLabel}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0E6B5C] to-[#F2A33A] dark:from-[#34D399] dark:to-[#F2A33A] transition-[width] duration-500 ease-out"
          style={{ width: `${barPct}%` }}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#46615A] dark:text-[#9CB5AC]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span>{confidenceLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{impact.disclaimer || copy.dashboard.estimateNote}</span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="min-h-[36px] inline-flex items-center gap-1 font-semibold text-[#0E6B5C] dark:text-[#6EE7B7] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
        >
          {expanded ? copy.dashboard.hideAssumptions : copy.dashboard.howEstimated}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <ul className="mt-2.5 space-y-1.5 text-[13px] text-[#354E47] dark:text-[#B9D0C8] bg-white/75 dark:bg-[#0E1E19] rounded-xl p-3">
          {impact.assumptions.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
