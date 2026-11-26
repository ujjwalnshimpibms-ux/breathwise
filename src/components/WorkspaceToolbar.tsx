import React from 'react';
import { Moon, Sun } from 'lucide-react';
import type { Language, ThemeMode } from '../types/saans';

interface WorkspaceToolbarProps {
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  rightSlot?: React.ReactNode;
  leftSlot?: React.ReactNode;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  language,
  onChangeLanguage,
  theme,
  onToggleTheme,
  rightSlot,
  leftSlot,
}) => {
  return (
    <div className="no-print bg-[#EDE9DF]/70 dark:bg-[#10211C]/75 backdrop-blur-sm">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {leftSlot && <div className="hidden sm:flex flex-wrap items-center gap-3">{leftSlot}</div>}

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto sm:ml-auto">
          {rightSlot}

          {/* Language segmented control */}
          <div
            role="group"
            aria-label="Language"
            className="inline-flex items-center p-1 rounded-xl bg-white/85 dark:bg-[#152822] shadow-xs"
          >
            <button
              type="button"
              onClick={() => onChangeLanguage('en')}
              aria-pressed={language === 'en'}
              className={`min-h-[36px] px-3 py-1 text-[13px] font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                language === 'en'
                  ? 'bg-[#0E6B5C] text-white dark:bg-[#6EE7B7] dark:text-[#07201A]'
                  : 'text-[#46615A] dark:text-[#9CB5AC] hover:text-[#0F2A24] dark:hover:text-[#E8F1ED]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onChangeLanguage('hi')}
              aria-pressed={language === 'hi'}
              className={`min-h-[36px] px-3 py-1 text-[13px] font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                language === 'hi'
                  ? 'bg-[#0E6B5C] text-white dark:bg-[#6EE7B7] dark:text-[#07201A]'
                  : 'text-[#46615A] dark:text-[#9CB5AC] hover:text-[#0F2A24] dark:hover:text-[#E8F1ED]'
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Light / Dark theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="min-h-[44px] min-w-[44px] px-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/85 dark:bg-[#152822] text-[13px] font-semibold text-[#0F2A24] dark:text-[#E8F1ED] hover:bg-white dark:hover:bg-[#1B332C] shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#F2A33A]" />
            ) : (
              <Moon className="w-4 h-4 text-[#0E6B5C]" />
            )}
            <span className="hidden sm:inline">
              {theme === 'dark'
                ? language === 'hi'
                  ? 'लाइट'
                  : 'Light'
                : language === 'hi'
                  ? 'डार्क'
                  : 'Dark'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
