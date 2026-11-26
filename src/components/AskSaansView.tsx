import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Send } from 'lucide-react';
import type {
  AirQualityData,
  ChatMessage,
  Language,
  ThemeMode,
  UserProfile,
} from '../types/saans';
import { askBreathwiseAssistant } from '../services/ai';
import { buildLocalChatFallback } from '../utils/localChatFallback';
import { getAqiCategory } from '../utils/aqi';
import { UI_COPY } from '../i18n/copy';
import { WorkspaceToolbar } from './WorkspaceToolbar';

interface AskSaansViewProps {
  profile: UserProfile;
  aqiData: AirQualityData;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const AskSaansView: React.FC<AskSaansViewProps> = ({
  profile,
  aqiData,
  language,
  onChangeLanguage,
  theme,
  onToggleTheme,
}) => {
  const copy = UI_COPY[language];
  const category = getAqiCategory(aqiData.aqi);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    const assistantId = `a-${Date.now()}`;
    const placeholderAssistant: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      text: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    const historySnapshot = [...messages, userMsg];
    setMessages([...historySnapshot, placeholderAssistant]);
    setInput('');
    setSending(true);

    try {
      const reply = await askBreathwiseAssistant(
        profile,
        aqiData,
        language,
        historySnapshot,
        trimmed
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                text: reply.answer,
                steps: reply.steps,
                whyThisHelps: reply.whyThisHelps,
                healthDisclaimer: reply.healthDisclaimer,
                isStreaming: false,
                isFallback: reply.isOfflineEstimate,
                isError: false,
              }
            : m
        )
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unable to reach AI';
      const fallback = buildLocalChatFallback(trimmed, profile, aqiData, language);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                text: fallback.answer,
                steps: fallback.steps,
                whyThisHelps: fallback.whyThisHelps,
                healthDisclaimer: fallback.healthDisclaimer,
                isStreaming: false,
                isFallback: true,
                isError: true,
                failedQuestion: trimmed,
                timestamp: errMsg,
              }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <WorkspaceToolbar
        language={language}
        onChangeLanguage={onChangeLanguage}
        theme={theme}
        onToggleTheme={onToggleTheme}
        leftSlot={
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#152822] font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
              {profile.city}
            </span>
            <span
              className={`px-2.5 py-1 rounded-xl font-mono-tabular font-semibold ${category.bgTintClass} ${category.textColorClass}`}
            >
              AQI {aqiData.aqi}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#152822] text-[#46615A] dark:text-[#9CB5AC]">
              {profile.adults}A · {profile.children}C · {profile.elderly}E
            </span>
          </div>
        }
      />

      <main className="flex-1 min-h-0 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-5 pb-20 md:pb-6 flex flex-col">
        {/* Header & Context Chips */}
        <div className="shrink-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
            {copy.chat.title}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-[#46615A] dark:text-[#9CB5AC]">
            {copy.chat.subtitle}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 sm:hidden text-[13px]">
            <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#12231E] font-semibold">
              {profile.city}
            </span>
            <span
              className={`px-2.5 py-1 rounded-xl font-mono-tabular font-semibold ${category.bgTintClass} ${category.textColorClass}`}
            >
              AQI {aqiData.aqi}
            </span>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div
          className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1 space-y-4"
          aria-live="polite"
        >
          {messages.length === 0 && (
            <div className="rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 text-base leading-relaxed text-[#46615A] dark:text-[#9CB5AC] shadow-[0_10px_28px_-14px_rgba(15,42,36,0.1)]">
              {copy.chat.welcome}
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              data-testid={m.role === 'assistant' ? 'chat-assistant-bubble' : 'chat-user-bubble'}
              data-streaming={m.isStreaming ? 'true' : 'false'}
              className={`rounded-3xl p-5 sm:p-6 ${
                m.role === 'user'
                  ? 'ml-auto max-w-2xl bg-[#0E6B5C] text-white dark:bg-[#195E4F] shadow-sm'
                  : 'bg-white dark:bg-[#12231E] text-[#0F2A24] dark:text-[#E8F1ED] shadow-[0_12px_32px_-16px_rgba(15,42,36,0.12)]'
              }`}
            >
              {/* Error notice + Try again button when stream failed & local fallback answered */}
              {m.isError && (
                <div className="mb-3 rounded-2xl bg-amber-500/12 dark:bg-amber-400/15 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[13px] text-amber-900 dark:text-amber-200">
                  <span>{copy.chat.fallbackNotice}</span>
                  {m.failedQuestion && (
                    <button
                      type="button"
                      onClick={() => sendQuestion(m.failedQuestion!)}
                      className="min-h-[34px] px-3 rounded-xl bg-white dark:bg-[#1B332C] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {copy.chat.tryAgain}
                    </button>
                  )}
                </div>
              )}

              {/* Animated typing dots while waiting for first chunk */}
              {m.isStreaming && !m.text ? (
                <div className="flex items-center gap-3 text-sm text-[#46615A] dark:text-[#9CB5AC]">
                  <span>{copy.chat.thinking}</span>
                  <span className="inline-flex items-center gap-1" aria-hidden="true">
                    <span className="w-2 h-2 rounded-full bg-[#0E6B5C] dark:bg-[#6EE7B7] animate-typing-dot-1" />
                    <span className="w-2 h-2 rounded-full bg-[#0E6B5C] dark:bg-[#6EE7B7] animate-typing-dot-2" />
                    <span className="w-2 h-2 rounded-full bg-[#0E6B5C] dark:bg-[#6EE7B7] animate-typing-dot-3" />
                  </span>
                </div>
              ) : (
                <p className="text-base leading-relaxed whitespace-pre-line">{m.text}</p>
              )}

              {m.steps && m.steps.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-[#E6EFE9] dark:border-[#1B332C]">
                  <p className="text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                    {copy.chat.stepsTitle}
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm sm:text-base">
                    {m.steps.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#F2A33A] font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {m.whyThisHelps && (
                <div className="mt-4 rounded-2xl bg-[#E6EFE9] dark:bg-[#162C25] p-3.5 text-sm leading-relaxed">
                  <strong className="font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                    {copy.chat.whyHelps}:{' '}
                  </strong>
                  <span className="text-[#223C36] dark:text-[#CBE0D8]">{m.whyThisHelps}</span>
                </div>
              )}

              {m.healthDisclaimer && (
                <p className="mt-3 text-[13px] text-[#46615A] dark:text-[#9CB5AC]">
                  {m.healthDisclaimer}
                </p>
              )}
            </div>
          ))}
          <div ref={feedEndRef} />
        </div>

        {/* Bottom Pinned Suggested Chips + Input */}
        <div className="shrink-0 pt-3">
          <div
            className="flex sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible pb-2.5"
            role="group"
            aria-label="Suggested questions"
          >
            {copy.chat.suggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendQuestion(q)}
                disabled={sending}
                className="min-h-[40px] px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-[#12231E] text-[13px] sm:text-sm font-medium text-[#0E6B5C] dark:text-[#6EE7B7] hover:bg-[#E6EFE9] dark:hover:bg-[#193029] shadow-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-60"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              aria-label={copy.chat.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={copy.chat.placeholder}
              className="flex-1 min-h-[50px] px-4 rounded-2xl bg-white dark:bg-[#12231E] text-base text-[#0F2A24] dark:text-[#E8F1ED] shadow-[0_8px_24px_-12px_rgba(15,42,36,0.16)] focus:outline-2 focus:outline-[#0E6B5C]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="min-h-[50px] px-6 rounded-2xl bg-[#F2A33A] hover:bg-[#E0922B] text-[#1D1405] text-sm font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <span>{copy.chat.send}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
