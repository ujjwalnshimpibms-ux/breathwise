import React from 'react';
import type { AppView, Language } from '../types/saans';
import { UI_COPY } from '../i18n/copy';
import { BreathwiseLogo } from './BreathwiseLogo';

interface TopNavProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  language: Language;
  hasCustomProfile: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeView,
  onNavigate,
  language,
  hasCustomProfile,
}) => {
  const copy = UI_COPY[language];

  const navItems: Array<{ view: AppView; label: string }> = [
    { view: 'landing', label: copy.nav.overview },
    { view: 'dashboard', label: copy.nav.dashboard },
    { view: 'chat', label: copy.nav.ask },
    { view: 'community', label: copy.nav.community },
  ];

  return (
    <header className="no-print sticky top-0 z-30 h-16 bg-[#F7F4EE]/90 dark:bg-[#0B1714]/90 backdrop-blur-md shadow-[0_1px_0_rgba(15,42,36,0.06)] dark:shadow-[0_1px_0_rgba(232,241,237,0.08)]">
      <div className="max-w-[1280px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Brand SVG mark + wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          aria-label="Breathwise Home"
          className="whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B5C]"
        >
          <BreathwiseLogo />
        </button>

        {/* Zone 2: Single-line navigation links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => onNavigate(item.view)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 text-[15px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E6B5C] ${
                  isActive
                    ? 'text-[#0E6B5C] dark:text-[#6EE7B7] font-semibold'
                    : 'text-[#46615A] dark:text-[#9CB5AC] hover:text-[#0F2A24] dark:hover:text-[#E8F1ED]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-[14px] h-[3px] rounded-full bg-[#F2A33A]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('onboarding')}
            className="min-h-[44px] px-5 py-2 rounded-2xl bg-[#0E6B5C] hover:bg-[#0A5549] dark:bg-[#6EE7B7] dark:hover:bg-[#34D399] text-white dark:text-[#07201A] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B5C]"
          >
            {hasCustomProfile ? copy.nav.editProfile : copy.nav.getPlan}
          </button>
        </div>
      </div>
    </header>
  );
};
