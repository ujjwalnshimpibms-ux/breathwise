import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, Printer } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { Language, ThemeMode, UserProfile } from '../types/saans';
import {
  calculateCommunityImpact,
  COMMUNITY_ACTIONS,
  type CommunityImpactSummary,
} from '../utils/impact';
import { calculateCommunityImpactRemote } from '../services/ai';
import { UI_COPY } from '../i18n/copy';
import { WorkspaceToolbar } from './WorkspaceToolbar';
import { BreathwiseLogo } from './BreathwiseLogo';

interface CommunityViewProps {
  profile: UserProfile;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  profile,
  language,
  onChangeLanguage,
  theme,
  onToggleTheme,
}) => {
  const copy = UI_COPY[language];
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'zero_burning',
    'school_carpool',
    'wet_dust_control',
  ]);
  const [households, setHouseholds] = useState<number>(60);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const pledgeCardRef = useRef<HTMLDivElement | null>(null);

  const [impact, setImpact] = useState<CommunityImpactSummary>(() =>
    calculateCommunityImpact(selectedIds, households)
  );

  useEffect(() => {
    setImpact(calculateCommunityImpact(selectedIds, households));
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      calculateCommunityImpactRemote(households, selectedIds, controller.signal)
        .then((remote) => {
          if (!controller.signal.aborted) {
            setImpact(remote);
          }
        })
        .catch(() => {
          // Keep instant local calculation on error
        });
    }, 150);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [selectedIds, households]);

  const toggleAction = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedTitles = COMMUNITY_ACTIONS.filter((a) => selectedIds.includes(a.id)).map((a) =>
    language === 'hi' ? a.titleHi : a.title
  );

  const summaryText = `Breathwise · ${copy.community.summaryTitle} (${profile.city})\n${copy.community.householdsLabel}: ${impact.households}\n\n${selectedTitles
    .map((t) => `✓ ${t}`)
    .join('\n')}\n\n${copy.community.collectiveTitle}:\n• ${impact.monthlyCo2AvoidedKg} kg CO2/mo avoided\n• ${impact.monthlyPmDustPreventedKg} kg local dust/PM prevented\n• ~${impact.estimatedStreetDustReductionPct}% est. lane dust reduction`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked fallback
    }
  };

  const handleDownloadCard = async () => {
    if (!pledgeCardRef.current || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(pledgeCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `breathwise-pledge-${profile.city.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // Fall back gracefully if canvas export fails
      handleCopy();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <WorkspaceToolbar
        language={language}
        onChangeLanguage={onChangeLanguage}
        theme={theme}
        onToggleTheme={onToggleTheme}
        leftSlot={
          <span className="text-[13px] font-medium text-[#46615A] dark:text-[#9CB5AC]">
            {profile.city} · RWA &amp; School Clean-Air Toolkit
          </span>
        }
      />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-14">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
            {copy.community.title}
          </h1>
          <p className="mt-2 text-base text-[#46615A] dark:text-[#9CB5AC]">
            {copy.community.subtitle}
          </p>
        </div>

        <div className="mt-8 grid lg:grid-cols-12 gap-7 items-start">
          {/* Left: Participating Households & Action Checklist */}
          <div className="lg:col-span-7 space-y-6">
            <section className="rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 shadow-[0_14px_38px_-18px_rgba(15,42,36,0.12)]">
              <div className="flex items-baseline justify-between gap-4">
                <label
                  htmlFor="households-slider"
                  className="text-base font-semibold text-[#0F2A24] dark:text-[#E8F1ED]"
                >
                  {copy.community.householdsLabel}
                </label>
                <span
                  data-testid="community-households-value"
                  className="font-mono-tabular text-3xl font-bold text-[#0E6B5C] dark:text-[#6EE7B7]"
                >
                  {households}
                </span>
              </div>

              <input
                id="households-slider"
                type="range"
                min={10}
                max={500}
                step={5}
                value={households}
                onChange={(e) => setHouseholds(Number(e.target.value))}
                className="mt-4 w-full accent-[#0E6B5C] dark:accent-[#6EE7B7] cursor-pointer"
              />
              <div className="mt-1.5 flex justify-between font-mono-tabular text-[13px] text-[#46615A] dark:text-[#9CB5AC]">
                <span>10</span>
                <span>250</span>
                <span>500</span>
              </div>
            </section>

            <section className="rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 shadow-[0_14px_38px_-18px_rgba(15,42,36,0.12)]">
              <h2 className="font-display text-xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                {copy.community.checklistTitle}
              </h2>

              <div className="mt-5 space-y-3">
                {COMMUNITY_ACTIONS.map((action) => {
                  const checked = selectedIds.includes(action.id);
                  const title = language === 'hi' ? action.titleHi : action.title;
                  const desc = language === 'hi' ? action.descriptionHi : action.description;
                  return (
                    <label
                      key={action.id}
                      className={`rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer transition-colors ${
                        checked
                          ? 'bg-[#E6EFE9] dark:bg-[#173029]'
                          : 'bg-[#F7F4EE] dark:bg-[#0E1D19]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAction(action.id)}
                        className="mt-1 w-5 h-5 accent-[#0E6B5C] dark:accent-[#6EE7B7] rounded shrink-0 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
                          {title}
                        </div>
                        <p className="mt-1 text-sm text-[#46615A] dark:text-[#9CB5AC]">{desc}</p>
                        <p className="mt-1.5 font-mono-tabular text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                          {action.co2KgPerHouseholdMonth} kg CO2/home/mo ·{' '}
                          {action.pmDustGramsPerHouseholdMonth}g PM avoided
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right: Downloadable Shareable Pledge Card (html-to-image) */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div
              ref={pledgeCardRef}
              className="rounded-3xl bg-[#0E6B5C] dark:bg-[#143A31] text-white p-7 shadow-[0_22px_50px_-18px_rgba(14,107,92,0.45)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 font-display text-lg font-bold text-white">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F2A33A]" />
                  Breathwise
                </span>
                <span className="text-[13px] font-semibold text-[#FDE68A]">
                  {profile.city}
                </span>
              </div>

              <h2 className="mt-4 font-display text-2xl font-bold leading-snug">
                {copy.community.summaryTitle}
              </h2>
              <p className="mt-1 text-sm text-white/85">
                {copy.community.collectiveTitle} ·{' '}
                <strong className="font-mono-tabular text-[#FDE68A]">
                  {impact.households} {language === 'hi' ? 'परिवार' : 'households'}
                </strong>
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-white/12 p-4">
                <div>
                  <div
                    data-testid="community-co2"
                    className="font-mono-tabular text-2xl sm:text-3xl font-bold text-[#FDE68A]"
                  >
                    {impact.monthlyCo2AvoidedKg} kg
                  </div>
                  <div className="mt-1 text-[13px] text-white/85">{copy.community.co2Label}</div>
                </div>

                <div>
                  <div className="font-mono-tabular text-2xl sm:text-3xl font-bold">
                    {impact.monthlyPmDustPreventedKg} kg
                  </div>
                  <div className="mt-1 text-[13px] text-white/85">{copy.community.dustLabel}</div>
                </div>

                <div>
                  <div className="font-mono-tabular text-2xl sm:text-3xl font-bold text-[#A7F3D0]">
                    {impact.equivalentTreesPlanted}
                  </div>
                  <div className="mt-1 text-[13px] text-white/85">{copy.community.treesLabel}</div>
                </div>

                <div>
                  <div className="font-mono-tabular text-2xl sm:text-3xl font-bold">
                    -{impact.estimatedStreetDustReductionPct}%
                  </div>
                  <div className="mt-1 text-[13px] text-white/85">
                    {copy.community.streetDropLabel}
                  </div>
                </div>
              </div>

              <ul className="mt-5 space-y-1.5 text-sm text-white/90">
                {selectedTitles.map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="text-[#F2A33A] font-bold">✓</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-[12px] text-white/70">{copy.tagline}</p>
            </div>

            {/* Download / Copy / Print actions */}
            <div className="no-print flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadCard}
                disabled={downloading}
                className="flex-1 min-h-[46px] px-4 rounded-2xl bg-[#F2A33A] hover:bg-[#E0922B] text-[#1D1405] font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {downloading ? copy.community.downloading : copy.community.downloadImage}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="min-h-[46px] px-4 rounded-2xl bg-white dark:bg-[#12231E] text-[#0F2A24] dark:text-[#E8F1ED] font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-xs whitespace-nowrap cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? copy.community.copied : copy.community.copyCard}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                aria-label={copy.community.printFlyer}
                className="min-h-[46px] px-4 rounded-2xl bg-[#E6EFE9] dark:bg-[#193029] text-[#0E6B5C] dark:text-[#6EE7B7] font-semibold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                {copy.community.printFlyer}
              </button>
            </div>
          </aside>
        </div>

        <div className="hidden print:block mt-6 pt-4 border-t border-gray-300">
          <BreathwiseLogo />
        </div>
      </main>
    </div>
  );
};
