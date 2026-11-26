import React from 'react';
import { Home, LayoutGrid, MessageCircle, Users } from 'lucide-react';
import type { AppView, Language } from '../types/saans';
import { UI_COPY } from '../i18n/copy';

interface MobileBottomBarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  language: Language;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeView,
  onNavigate,
  language,
}) => {
  const copy = UI_COPY[language];

  const tabs: Array<{ view: AppView; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
    { view: 'landing', label: copy.nav.overview, Icon: Home },
    { view: 'dashboard', label: copy.nav.dashboard, Icon: LayoutGrid },
    { view: 'chat', label: copy.nav.ask, Icon: MessageCircle },
    { view: 'community', label: copy.nav.community, Icon: Users },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#F7F4EE]/95 dark:bg-[#0B1714]/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(15,42,36,0.08)]"
    >
      <div className="grid grid-cols-4 h-full">
        {tabs.map(({ view, label, Icon }) => {
          const isActive = activeView === view;
          return (
            <button
              key={view}
              type="button"
              onClick={() => onNavigate(view)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 px-1 transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#0E6B5C] dark:text-[#6EE7B7] font-semibold'
                  : 'text-[#46615A] dark:text-[#9CB5AC]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[12px] leading-none whitespace-nowrap truncate max-w-full">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
