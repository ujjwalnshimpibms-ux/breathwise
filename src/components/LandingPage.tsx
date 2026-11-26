import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Clock,
  Compass,
  Home,
  Languages,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import type { AirQualityData, AppView, CityOption, Language, ThemeMode } from '../types/saans';
import { UI_COPY } from '../i18n/copy';
import { POPULAR_CITIES } from '../data/demoData';
import { getAqiCategory } from '../utils/aqi';
import { WorkspaceToolbar } from './WorkspaceToolbar';
import { BreathwiseLogo } from './BreathwiseLogo';

interface LandingPageProps {
  sampleAqi: AirQualityData;
  sampleCityName: string;
  onSelectSampleCity: (city: CityOption) => void;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onNavigate: (view: AppView) => void;
}

const DEMO_CITIES: CityOption[] = [
  POPULAR_CITIES[0], // Delhi
  POPULAR_CITIES[3], // Mumbai
  POPULAR_CITIES[5], // Bengaluru
  POPULAR_CITIES[9], // London
];

export const LandingPage: React.FC<LandingPageProps> = ({
  sampleAqi,
  sampleCityName,
  onSelectSampleCity,
  language,
  onChangeLanguage,
  theme,
  onToggleTheme,
  onNavigate,
}) => {
  const copy = UI_COPY[language];
  const category = getAqiCategory(sampleAqi.aqi);
  const [miniDays, setMiniDays] = React.useState(3);

  // Hero SVG ring geometry
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(1, Math.max(0.08, sampleAqi.aqi / 400));
  const strokeDashoffset = circumference * (1 - progressRatio);

  const stepIcons = [Home, Clock, BarChart3];

  return (
    <div className="min-h-screen flex flex-col">
      <WorkspaceToolbar
        language={language}
        onChangeLanguage={onChangeLanguage}
        theme={theme}
        onToggleTheme={onToggleTheme}
        leftSlot={
          <span className="text-[13px] font-medium text-[#46615A] dark:text-[#9CB5AC]">
            {copy.tagline}
          </span>
        }
      />

      <main className="flex-1">
        {/* HERO: 12-column editorial dawn split */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:pt-16 lg:pb-20">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left 7 columns */}
            <div className="lg:col-span-7">
              <p className="text-[13px] sm:text-sm font-semibold tracking-wide text-[#0E6B5C] dark:text-[#6EE7B7]">
                {copy.landing.heroEyebrow}
              </p>

              <h1
                className="mt-3 font-display font-bold tracking-tight text-[#0F2A24] dark:text-[#E8F1ED] leading-[1.04]"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', textWrap: 'balance' }}
              >
                {copy.landing.heroTitle}
              </h1>

              <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#3B564F] dark:text-[#ADC4BC] max-w-2xl">
                {copy.landing.heroSub}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('onboarding')}
                  className="min-h-[48px] px-7 py-3.5 rounded-2xl bg-[#F2A33A] hover:bg-[#E0922B] text-[#1D1405] font-bold text-base inline-flex items-center gap-2 transition-transform active:scale-[0.99] shadow-[0_10px_25px_-10px_rgba(242,163,58,0.6)] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B5C]"
                >
                  {copy.landing.primaryCta}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="min-h-[48px] px-6 py-3.5 rounded-2xl bg-white/90 hover:bg-white dark:bg-[#132520] dark:hover:bg-[#193029] text-[#0F2A24] dark:text-[#E8F1ED] font-semibold text-base shadow-[0_8px_24px_-12px_rgba(15,42,36,0.16)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copy.landing.secondaryCta}
                </button>
              </div>
            </div>

            {/* Right 5 columns: Live AQI card with animated SVG haze particles & city switcher */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-[#12231E]/95 p-6 sm:p-7 shadow-[0_20px_50px_-18px_rgba(15,42,36,0.14)] dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]">
                {/* Original SVG/CSS animated floating haze particles clearing around ring */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                  <svg className="w-full h-full opacity-70 dark:opacity-50" viewBox="0 0 400 360" fill="none">
                    <circle cx="330" cy="60" r="56" fill={category.strokeHex} fillOpacity="0.09" className="animate-float-slow" />
                    <circle cx="65" cy="295" r="44" fill="#0E6B5C" fillOpacity="0.08" className="animate-float-slow" style={{ animationDelay: '1.4s' }} />
                    <circle cx="290" cy="260" r="10" fill="#F2A33A" fillOpacity="0.30" className="animate-float-slow" style={{ animationDelay: '0.8s' }} />
                    <circle cx="110" cy="70" r="6" fill={category.strokeHex} fillOpacity="0.26" className="animate-float-slow" style={{ animationDelay: '2.1s' }} />
                    <circle cx="345" cy="180" r="5" fill="#0E6B5C" fillOpacity="0.25" className="animate-float-slow" style={{ animationDelay: '2.9s' }} />
                    <circle cx="48" cy="160" r="4" fill="#F2A33A" fillOpacity="0.32" className="animate-float-slow" style={{ animationDelay: '1.1s' }} />
                  </svg>
                </div>

                <div className="relative z-10">
                  {/* Live City Switcher Chips */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[#46615A] dark:text-[#9CB5AC]">
                      {copy.landing.citySwitcherLabel}
                    </span>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label={copy.landing.citySwitcherLabel}>
                      {DEMO_CITIES.map((c) => {
                        const active = sampleCityName.toLowerCase() === c.name.toLowerCase();
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => onSelectSampleCity(c)}
                            aria-pressed={active}
                            className={`min-h-[34px] px-2.5 py-1 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              active
                                ? 'bg-[#0E6B5C] text-white dark:bg-[#6EE7B7] dark:text-[#07201A]'
                                : 'bg-[#E6EFE9] text-[#28423C] dark:bg-[#193029] dark:text-[#B8CFC7] hover:bg-[#D7E6DC]'
                            }`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Animated Ring & Reading */}
                  <div className="mt-6 flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                      <div
                        aria-hidden="true"
                        className="absolute inset-2 rounded-full animate-pulse-ring"
                        style={{ backgroundColor: `${category.strokeHex}18` }}
                      />
                      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
                        <circle
                          cx="80"
                          cy="80"
                          r={radius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="12"
                          className="text-[#E6EFE9] dark:text-[#1B332C]"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r={radius}
                          fill="none"
                          stroke={category.strokeHex}
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-[stroke-dashoffset] duration-700 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span
                          data-testid="landing-aqi-value"
                          className="font-mono-tabular text-4xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]"
                        >
                          {sampleAqi.aqi}
                        </span>
                        <span className="text-[13px] font-medium text-[#46615A] dark:text-[#9CB5AC]">
                          US AQI
                        </span>
                      </div>
                    </div>

                    <div className="text-center sm:text-left min-w-0">
                      <div className="inline-flex items-center gap-1.5 text-sm font-medium text-[#46615A] dark:text-[#9CB5AC]">
                        <MapPin className="w-4 h-4 text-[#0E6B5C] dark:text-[#6EE7B7]" />
                        <span>{sampleAqi.city}</span>
                      </div>

                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-xl text-[13px] font-bold ${category.bgTintClass} ${category.textColorClass}`}
                        >
                          {language === 'hi' ? category.labelHi : category.label}
                        </span>
                      </div>

                      <p className="mt-3 font-mono-tabular text-sm font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
                        PM2.5 {sampleAqi.pm25} µg/m³ · {sampleAqi.dominantPollutant}
                      </p>

                      <p className="mt-1 text-[13px] text-[#46615A] dark:text-[#9CB5AC]">
                        {sampleAqi.sourceLabel}
                      </p>
                    </div>
                  </div>

                  {/* Best time to open windows today */}
                  <div className="mt-6 rounded-2xl bg-[#E6EFE9]/85 dark:bg-[#162C25] p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Clock className="w-4 h-4 text-[#0E6B5C] dark:text-[#6EE7B7] shrink-0" />
                      <span className="text-[13px] font-medium text-[#28423C] dark:text-[#C5DAD2] truncate">
                        {copy.dashboard.bestWindowCardTitle}
                      </span>
                    </div>
                    <span className="font-mono-tabular text-sm font-bold text-[#0E6B5C] dark:text-[#6EE7B7] whitespace-nowrap shrink-0">
                      {sampleAqi.bestOutdoorWindow}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          <div className="rounded-3xl bg-[#E6EFE9]/90 dark:bg-[#12231E] p-6 sm:p-8 shadow-[0_12px_30px_-16px_rgba(15,42,36,0.12)]">
            <p className="text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
              {copy.landing.statsLabel}
            </p>
            <div className="mt-4 grid md:grid-cols-3 gap-6 sm:gap-8">
              {copy.landing.stats.map((stat) => (
                <div key={stat.label}>
                  <div className="font-mono-tabular text-2xl sm:text-3xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-base font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                    {stat.label}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#46615A] dark:text-[#9CB5AC]">
                    {stat.context}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS: 3 big numbered steps with icons */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F2A24] dark:text-[#E8F1ED]">
            {copy.landing.howTitle}
          </h2>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {copy.landing.howSteps.map((step, idx) => {
              const Icon = stepIcons[idx] || Compass;
              return (
                <div
                  key={step.num}
                  className="rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 sm:p-7 shadow-[0_12px_32px_-16px_rgba(15,42,36,0.1)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tabular text-2xl font-bold text-[#F2A33A]">
                      {step.num}
                    </span>
                    <div className="w-11 h-11 rounded-2xl bg-[#E6EFE9] dark:bg-[#193029] flex items-center justify-center text-[#0E6B5C] dark:text-[#6EE7B7]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-base leading-relaxed text-[#46615A] dark:text-[#9CB5AC]">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* BENTO FEATURE GRID */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F2A24] dark:text-[#E8F1ED]">
              {copy.landing.bentoTitle}
            </h2>
            <p className="mt-2.5 text-base sm:text-lg text-[#46615A] dark:text-[#9CB5AC]">
              {copy.landing.bentoSub}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Tile 1: Today's Plan (7 cols) */}
            <div className="md:col-span-7 rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 sm:p-7 shadow-[0_12px_32px_-16px_rgba(15,42,36,0.1)] flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                  <Clock className="w-4 h-4" />
                  <span>{language === 'hi' ? 'आज की योजना' : "Today's Plan"}</span>
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                  {language === 'hi'
                    ? 'सुबह, दोपहर, शाम और रात के लिए स्पष्ट कदम'
                    : 'Morning, afternoon, evening & night routines'}
                </h3>
                <p className="mt-2 text-base text-[#46615A] dark:text-[#9CB5AC]">
                  {language === 'hi'
                    ? 'स्कूल मास्क, दोपहर वेंटिलेशन और रसोई के एग्जॉस्ट का सटीक समय।'
                    : 'Know exactly when to seal road-facing glass, when to air out bedrooms, and what mask fits today.'}
                </p>
              </div>
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(language === 'hi'
                  ? ['सुबह · सील', 'दोपहर · हवा', 'शाम · रसोई', 'रात · स्लीप']
                  : ['Morning · Seal', 'Midday · Air', 'Evening · Vent', 'Night · Sleep']
                ).map((chip) => (
                  <div
                    key={chip}
                    className="rounded-xl bg-[#E6EFE9] dark:bg-[#193029] px-3 py-2 text-[13px] font-semibold text-[#0F2A24] dark:text-[#E8F1ED] text-center"
                  >
                    {chip}
                  </div>
                ))}
              </div>
            </div>

            {/* Tile 2: Impact Meter with mini animated bar demo (5 cols) */}
            <div className="md:col-span-5 rounded-3xl bg-[#0E6B5C] dark:bg-[#143A31] text-white p-6 sm:p-7 shadow-[0_16px_36px_-14px_rgba(14,107,92,0.35)] flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#FDE68A]">
                  <BarChart3 className="w-4 h-4" />
                  <span>{language === 'hi' ? 'इम्पैक्ट मीटर' : 'Impact Meter'}</span>
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold">
                  {language === 'hi' ? 'हर सुझाव में स्पष्ट असर' : 'Every tip shows its estimated impact'}
                </h3>
              </div>

              <div className="mt-5 rounded-2xl bg-white/12 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] text-white/85">
                    {language === 'hi' ? 'बेडरूम PM2.5 में कमी' : 'Bedroom PM2.5 exposure'}
                  </span>
                  <span className="font-mono-tabular text-xl font-bold text-[#FDE68A]">
                    -38% est.
                  </span>
                </div>
                <div className="mt-2.5 h-2.5 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full w-3/4 rounded-full bg-[#F2A33A]" />
                </div>
                <p className="mt-2 text-[13px] text-white/80">
                  {language === 'hi' ? 'पारदर्शी आधार सहित · अनुमान' : 'Transparent assumptions · Estimate only'}
                </p>
              </div>
            </div>

            {/* Tile 3: What-if Simulator with live mini slider (6 cols) */}
            <div className="md:col-span-6 rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 sm:p-7 shadow-[0_12px_32px_-16px_rgba(15,42,36,0.1)]">
              <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                <SlidersHorizontal className="w-4 h-4" />
                <span>{language === 'hi' ? 'व्हाट-इफ सिम्युलेटर' : 'What-If Simulator'}</span>
              </div>
              <h3 className="mt-2 font-display text-2xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                {language === 'hi'
                  ? 'बदलाव का असर अभी आज़माएं'
                  : 'Test weekly habits before committing'}
              </h3>

              <div className="mt-5 rounded-2xl bg-[#E6EFE9]/80 dark:bg-[#162C25] p-4">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="landing-mini-slider" className="text-sm font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
                    {language === 'hi' ? 'मेट्रो/कारपूल के दिन' : 'Metro / carpool days per week'}
                  </label>
                  <span className="font-mono-tabular text-base font-bold text-[#0E6B5C] dark:text-[#6EE7B7]">
                    {miniDays} {language === 'hi' ? 'दिन' : 'days'}
                  </span>
                </div>
                <input
                  id="landing-mini-slider"
                  type="range"
                  min={0}
                  max={6}
                  value={miniDays}
                  onChange={(e) => setMiniDays(Number(e.target.value))}
                  className="mt-3 w-full accent-[#0E6B5C] dark:accent-[#6EE7B7] cursor-pointer"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px] font-semibold text-[#0F2A24] dark:text-[#E8F1ED]">
                  <span className="font-mono-tabular">
                    {(miniDays * 4.2).toFixed(1)} kg CO2/wk
                  </span>
                  <span className="font-mono-tabular text-[#0E6B5C] dark:text-[#6EE7B7]">
                    ₹{miniDays * 110}/wk {language === 'hi' ? 'बचत' : 'saved'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tile 4: Indoor Hacks (6 cols) */}
            <div className="md:col-span-6 rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 sm:p-7 shadow-[0_12px_32px_-16px_rgba(15,42,36,0.1)] flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{language === 'hi' ? 'घरेलू उपाय' : 'Indoor Air Hacks'}</span>
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                  {language === 'hi'
                    ? 'पौधों बनाम HEPA की सच्चाई और सस्ते उपाय'
                    : 'Ranked by real cost & effectiveness'}
                </h3>
                <p className="mt-2 text-base text-[#46615A] dark:text-[#9CB5AC]">
                  {language === 'hi'
                    ? '₹200 की विंडो सील और DIY बॉक्स-फैन फ़िल्टर से लेकर गीले पोंछे तक—बिना अनावश्यक खर्च।'
                    : 'From ₹200 window weather-stripping and DIY box-fan filters to honest science on houseplants vs HEPA.'}
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                <span className="rounded-xl bg-[#E6EFE9] dark:bg-[#193029] px-3 py-1.5">
                  #1 {language === 'hi' ? 'दरार सीलिंग' : 'Gap sealing'}
                </span>
                <span className="rounded-xl bg-[#E6EFE9] dark:bg-[#193029] px-3 py-1.5">
                  #2 {language === 'hi' ? 'DIY HEPA फ़िल्टर' : 'DIY HEPA fan'}
                </span>
              </div>
            </div>

            {/* Tile 5: Community Mode (7 cols) */}
            <div className="md:col-span-7 rounded-3xl bg-[#E6EFE9] dark:bg-[#152822] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                  <Users className="w-4 h-4" />
                  <span>{language === 'hi' ? 'मोहल्ला व RWA मोड' : 'Community & RWA Mode'}</span>
                </div>
                <h3 className="mt-1.5 font-display text-xl font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                  {language === 'hi'
                    ? 'पूरी सोसाइटी के लिए साझा क्लीन-एयर संकल्प कार्ड'
                    : 'Shareable society pledges & collective impact'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('community')}
                className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#0E6B5C] hover:bg-[#0A5549] dark:bg-[#6EE7B7] dark:hover:bg-[#34D399] text-white dark:text-[#07201A] text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copy.nav.community}
              </button>
            </div>

            {/* Tile 6: Bilingual EN + HI (5 cols) */}
            <div className="md:col-span-5 rounded-3xl bg-white/95 dark:bg-[#12231E] p-6 sm:p-7 shadow-[0_12px_32px_-16px_rgba(15,42,36,0.1)] flex items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
                  <Languages className="w-4 h-4" />
                  <span>English · हिन्दी</span>
                </div>
                <p className="mt-1.5 font-display text-lg font-bold text-[#0F2A24] dark:text-[#E8F1ED]">
                  {language === 'hi'
                    ? 'पूरी ऐप व AI सलाह हिंदी में'
                    : 'Full UI & AI advice in Hindi or English'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChangeLanguage(language === 'en' ? 'hi' : 'en')}
                className="min-h-[44px] px-4 rounded-2xl bg-[#E6EFE9] dark:bg-[#193029] text-sm font-semibold text-[#0F2A24] dark:text-[#E8F1ED] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {language === 'en' ? 'हिन्दी' : 'English'}
              </button>
            </div>
          </div>
        </section>

        {/* FINAL CTA BAND */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-16">
          <div className="rounded-3xl bg-[#0F2A24] dark:bg-[#132923] text-white p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-[0_24px_60px_-20px_rgba(15,42,36,0.35)]">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl sm:text-4xl font-bold leading-tight">
                {copy.landing.finalCtaTitle}
              </h2>
              <p className="mt-2.5 text-base text-[#C4DBD3]">
                {copy.landing.finalCtaSub}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('onboarding')}
              className="min-h-[50px] px-7 py-3.5 rounded-2xl bg-[#F2A33A] hover:bg-[#E0922B] text-[#1D1405] font-bold text-base inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copy.landing.primaryCta}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      {/* CLEAN FOOTER */}
      <footer className="bg-[#EFECE4] dark:bg-[#08120F] py-9 pb-24 md:pb-9">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <BreathwiseLogo />
            <p className="mt-2 text-[13px] text-[#46615A] dark:text-[#9CB5AC] max-w-xl">
              {copy.landing.footerNote}
            </p>
          </div>
          <div className="flex items-center gap-5 text-sm font-semibold text-[#0E6B5C] dark:text-[#6EE7B7]">
            <button type="button" onClick={() => onNavigate('dashboard')} className="hover:underline cursor-pointer">
              {copy.nav.dashboard}
            </button>
            <button type="button" onClick={() => onNavigate('chat')} className="hover:underline cursor-pointer">
              {copy.nav.ask}
            </button>
            <button type="button" onClick={() => onNavigate('community')} className="hover:underline cursor-pointer">
              {copy.nav.community}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
