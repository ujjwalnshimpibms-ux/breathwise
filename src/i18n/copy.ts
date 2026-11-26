import type { Language } from '../types/saans';

export interface UiCopy {
  brand: string;
  tagline: string;
  nav: {
    overview: string;
    dashboard: string;
    ask: string;
    community: string;
    getPlan: string;
    editProfile: string;
  };
  landing: {
    heroEyebrow: string;
    heroTitle: string;
    heroSub: string;
    primaryCta: string;
    secondaryCta: string;
    citySwitcherLabel: string;
    statsLabel: string;
    stats: Array<{ value: string; label: string; context: string }>;
    howTitle: string;
    howSteps: Array<{ num: string; title: string; desc: string }>;
    bentoTitle: string;
    bentoSub: string;
    finalCtaTitle: string;
    finalCtaSub: string;
    footerNote: string;
  };
  onboarding: {
    stepOf: string;
    skipDemo: string;
    back: string;
    next: string;
    finish: string;
    previewTitle: string;
    step1Title: string;
    step1Sub: string;
    searchPlaceholder: string;
    useMyLocation: string;
    locating: string;
    quickCities: string;
    step2Title: string;
    step2Sub: string;
    adults: string;
    children: string;
    elderly: string;
    sensitivities: string;
    petsLabel: string;
    step3Title: string;
    step3Sub: string;
    commute: string;
    cooking: string;
    heating: string;
    homeType: string;
    windowsRoad: string;
    budget: string;
    goal: string;
  };
  dashboard: {
    liveAqiTitle: string;
    dominant: string;
    bestWindowCardTitle: string;
    bestWindowSub: string;
    meaningTitle: string;
    topThreeTitle: string;
    statusGenerating: string;
    statusUpdated: string;
    statusOffline: string;
    offlineBadge: string;
    regenerateAi: string;
    sharePlan: string;
    printPlan: string;
    copied: string;
    subNav: {
      plan: string;
      indoor: string;
      alternatives: string;
      impact: string;
      whatIf: string;
    };
    todaysPlan: string;
    indoorHacks: string;
    alternatives: string;
    simulatorTitle: string;
    simulatorSub: string;
    yourWeekTitle: string;
    cleanAirScore: string;
    baseline: string;
    estReduction: string;
    co2Avoided: string;
    rupeesSaved: string;
    howEstimated: string;
    hideAssumptions: string;
    estimateNote: string;
    honestNote: string;
    profileSavedToast: string;
    cityUpdatedToast: string;
  };
  chat: {
    title: string;
    subtitle: string;
    placeholder: string;
    send: string;
    thinking: string;
    whyHelps: string;
    stepsTitle: string;
    tryAgain: string;
    fallbackNotice: string;
    suggestions: string[];
    welcome: string;
  };
  community: {
    title: string;
    subtitle: string;
    householdsLabel: string;
    checklistTitle: string;
    collectiveTitle: string;
    co2Label: string;
    dustLabel: string;
    treesLabel: string;
    streetDropLabel: string;
    copyCard: string;
    downloadImage: string;
    downloading: string;
    printFlyer: string;
    copied: string;
    summaryTitle: string;
  };
}

export const UI_COPY: Record<Language, UiCopy> = {
  en: {
    brand: 'Breathwise',
    tagline: 'Know your air. Change your day.',
    nav: {
      overview: 'Overview',
      dashboard: 'Dashboard',
      ask: 'Ask Breathwise',
      community: 'Community',
      getPlan: 'Get my plan',
      editProfile: 'Edit profile',
    },
    landing: {
      heroEyebrow: 'Personal Urban Air Quality Advisor',
      heroTitle: 'Know your air. Change your day.',
      heroSub:
        'Breathwise turns live winter smog readings into calm daily routines, low-cost indoor hacks, and honest exposure estimates tailored to your family.',
      primaryCta: 'Get my clean-air plan',
      secondaryCta: 'See a live demo',
      citySwitcherLabel: 'Live city preview',
      statsLabel: 'General environmental estimates',
      stats: [
        {
          value: '300+ AQI',
          label: 'Delhi winter peak mornings',
          context: 'General seasonal estimate during severe November–January inversion days.',
        },
        {
          value: '2–5× higher',
          label: 'Indoor air can trap cooking & road haze',
          context: 'General indoor exposure estimate when kitchens lack exhaust or windows leak.',
        },
        {
          value: '1 PM – 3 PM',
          label: 'Typical midday smog clearing dip',
          context: 'General diurnal pattern when warming air helps disperse ground-level PM2.5.',
        },
      ],
      howTitle: 'How Breathwise works',
      howSteps: [
        {
          num: '01',
          title: 'Set your home & commute',
          desc: 'Pick your city, household ages, sensitivities, commute mode, and cooking fuel in under a minute.',
        },
        {
          num: '02',
          title: 'Spot your safest windows',
          desc: 'Live Open-Meteo readings highlight when to seal street-facing windows and when to cross-ventilate.',
        },
        {
          num: '03',
          title: 'See every choice’s real impact',
          desc: 'Every routine and swap leads with transparent PM2.5, CO2, and savings estimates—never medical hype.',
        },
      ],
      bentoTitle: 'Built for everyday homes, not air-quality experts',
      bentoSub: 'Everything you need from dawn commutes to bedroom sleep zones.',
      finalCtaTitle: 'Ready for a calmer plan on high-smog days?',
      finalCtaSub: 'Start with your city and get a personalized clean-air briefing in seconds.',
      footerNote:
        'Breathwise provides educational air-quality guidance and transparent estimates—never medical claims. Consult a clinician for symptoms.',
    },
    onboarding: {
      stepOf: 'Step',
      skipDemo: 'Skip with Delhi defaults',
      back: 'Back',
      next: 'Continue',
      finish: 'Build my clean-air plan',
      previewTitle: 'Live profile preview',
      step1Title: 'Where is your home located?',
      step1Sub: 'We fetch live local PM2.5, AQI, and hourly airing windows for your city.',
      searchPlaceholder: 'Search your city (e.g., Delhi, Mumbai, Gurugram, London)',
      useMyLocation: 'Use my location',
      locating: 'Locating...',
      quickCities: 'Popular cities',
      step2Title: 'Who lives in your household?',
      step2Sub: 'Children, seniors, and sensitive airways receive tailored caution levels.',
      adults: 'Adults',
      children: 'Children',
      elderly: 'Elderly (60+)',
      sensitivities: 'Health sensitivities at home',
      petsLabel: 'We have indoor pets (dogs, cats, or birds)',
      step3Title: 'Daily commute, kitchen & home',
      step3Sub: 'Breathwise prioritizes low-cost swaps that match your real week.',
      commute: 'Primary commute',
      cooking: 'Main cooking fuel',
      heating: 'Winter heating',
      homeType: 'Home type',
      windowsRoad: 'Windows face a busy main road or construction',
      budget: 'Budget comfort for upgrades',
      goal: 'Top priority right now',
    },
    dashboard: {
      liveAqiTitle: 'Local Air Quality',
      dominant: 'Dominant',
      bestWindowCardTitle: 'Best window to air your home',
      bestWindowSub: '24-hour particulate outlook',
      meaningTitle: 'What this means for your family today',
      topThreeTitle: 'Top 3 things to do right now',
      statusGenerating: 'Generating…',
      statusUpdated: 'Updated just now',
      statusOffline: 'Using offline estimate',
      offlineBadge: 'Offline estimate',
      regenerateAi: 'Regenerate with AI',
      sharePlan: 'Share plan',
      printPlan: 'Print / PDF',
      copied: 'Copied',
      subNav: {
        plan: 'Plan',
        indoor: 'Indoor',
        alternatives: 'Alternatives',
        impact: 'Impact',
        whatIf: 'What-if',
      },
      todaysPlan: "Today's Plan",
      indoorHacks: 'Indoor Air Hacks',
      alternatives: 'Sustainable Alternatives',
      simulatorTitle: 'What-If Simulator',
      simulatorSub: 'Toggle swaps and sliders to preview your household’s weekly impact.',
      yourWeekTitle: 'Your week',
      cleanAirScore: 'Clean Air Score',
      baseline: 'Baseline',
      estReduction: 'Exposure avoided',
      co2Avoided: 'CO2 avoided / week',
      rupeesSaved: 'Est. savings / week',
      howEstimated: 'How we estimated this',
      hideAssumptions: 'Hide assumptions',
      estimateNote: 'Estimate — not a medical claim',
      honestNote: 'Evidence check',
      profileSavedToast: 'Profile saved — refreshing live AQI and air plan.',
      cityUpdatedToast: 'Location updated — fetching live air quality.',
    },
    chat: {
      title: 'Ask Breathwise',
      subtitle: 'Practical answers on masks, kids’ play, indoor hacks, and ventilation—grounded in your city and home.',
      placeholder: 'Ask anything about today’s air or your home...',
      send: 'Send',
      thinking: 'Breathwise is checking your air data',
      whyHelps: 'Why this helps',
      stepsTitle: 'Practical steps',
      tryAgain: 'Try again',
      fallbackNotice: 'Answered using offline personalized estimate (AI stream unavailable).',
      suggestions: [
        'Is it safe for my kids to play outside today?',
        'Best mask for today’s air?',
        'Cheap ways to clean bedroom air under ₹2,000',
        'When should I open windows today?',
      ],
      welcome:
        'Ask any question about coping with today’s air quality. Every answer adapts to your live AQI, home setup, and family.',
    },
    community: {
      title: 'Community & RWA Mode',
      subtitle: 'Coordinate practical clean-air pledges across your society, lane, or school and download a shareable card.',
      householdsLabel: 'Participating households',
      checklistTitle: 'Neighborhood Action Checklist',
      collectiveTitle: 'Collective Monthly Impact (Estimate)',
      co2Label: 'CO2 emissions avoided',
      dustLabel: 'Local PM & dust prevented',
      treesLabel: 'Monthly tree-absorption equiv.',
      streetDropLabel: 'Est. lane dust reduction',
      copyCard: 'Copy RWA text',
      downloadImage: 'Download card PNG',
      downloading: 'Rendering...',
      printFlyer: 'Print checklist',
      copied: 'Copied',
      summaryTitle: 'Society Clean-Air Pledge',
    },
  },
  hi: {
    brand: 'Breathwise',
    tagline: 'अपनी हवा को जानें। अपना दिन बदलें।',
    nav: {
      overview: 'परिचय',
      dashboard: 'डैशबोर्ड',
      ask: 'ब्रेथवाइज से पूछें',
      community: 'मोहल्ला',
      getPlan: 'मेरी योजना बनाएं',
      editProfile: 'प्रोफ़ाइल बदलें',
    },
    landing: {
      heroEyebrow: 'व्यक्तिगत शहरी वायु गुणवत्ता सलाहकार',
      heroTitle: 'अपनी हवा को जानें। अपना दिन बदलें।',
      heroSub:
        'ब्रेथवाइज आपके शहर के लाइव AQI को शांत दैनिक दिनचर्या, कम लागत वाले घरेलू उपायों और परिवार के लिए स्पष्ट प्रभाव अनुमानों में बदलता है।',
      primaryCta: 'मेरी क्लीन-एयर योजना बनाएं',
      secondaryCta: 'लाइव डेमो देखें',
      citySwitcherLabel: 'लाइव शहर पूर्वावलोकन',
      statsLabel: 'सामान्य पर्यावरणीय अनुमान',
      stats: [
        {
          value: '300+ AQI',
          label: 'दिल्ली की सर्दियों में सुबह का पीक',
          context: 'नवंबर–जनवरी के घने स्मॉग के दिनों का सामान्य मौसमी अनुमान।',
        },
        {
          value: '2–5× अधिक',
          label: 'बंद घर के अंदर धुआं फंस सकता है',
          context: 'बिना एग्जॉस्ट रसोई या सड़क की ओर खुली खिड़कियों पर सामान्य अनुमान।',
        },
        {
          value: '1 PM – 3 PM',
          label: 'दोपहर में हवा साफ होने का समय',
          context: 'धूप बढ़ने पर ज़मीन के पास जमा PM2.5 आमतौर पर हल्का होता है।',
        },
      ],
      howTitle: 'ब्रेथवाइज कैसे काम करता है',
      howSteps: [
        {
          num: '01',
          title: 'अपना घर और सफर चुनें',
          desc: 'एक मिनट से भी कम में अपना शहर, परिवार के सदस्य, आवागमन और रसोई ईंधन बताएं।',
        },
        {
          num: '02',
          title: 'सुरक्षित घंटे पहचानें',
          desc: 'लाइव Open-Meteo रीडिंग बताती है कि खिड़कियां कब बंद रखें और कब खोलें।',
        },
        {
          num: '03',
          title: 'हर कदम का असर देखें',
          desc: 'हर सुझाव में स्पष्ट PM2.5 कमी, CO2 और बचत का पारदर्शी अनुमान होता है।',
        },
      ],
      bentoTitle: 'हर परिवार के लिए सरल और व्यावहारिक',
      bentoSub: 'सुबह के स्कूल सफर से लेकर रात के सुरक्षित बेडरूम तक।',
      finalCtaTitle: 'खराब हवा वाले दिनों के लिए शांत योजना तैयार करें',
      finalCtaSub: 'अपना शहर चुनें और सेकंडों में व्यक्तिगत क्लीन-एयर गाइड पाएं।',
      footerNote:
        'ब्रेथवाइज केवल शैक्षिक वायु-गुणवत्ता मार्गदर्शन और अनुमान देता है—यह चिकित्सीय सलाह नहीं है। लक्षण होने पर डॉक्टर से मिलें।',
    },
    onboarding: {
      stepOf: 'चरण',
      skipDemo: 'दिल्ली डिफ़ॉल्ट के साथ आगे बढ़ें',
      back: 'पीछे',
      next: 'आगे बढ़ें',
      finish: 'मेरी योजना तैयार करें',
      previewTitle: 'लाइव प्रोफ़ाइल पूर्वावलोकन',
      step1Title: 'आपका घर किस शहर में है?',
      step1Sub: 'हम आपके शहर के लाइव PM2.5, AQI और वेंटिलेशन समय निकालने के लिए इसका उपयोग करते हैं।',
      searchPlaceholder: 'शहर खोजें (जैसे Delhi, Mumbai, Gurugram)',
      useMyLocation: 'मेरी लोकेशन चुनें',
      locating: 'खोजा जा रहा है...',
      quickCities: 'लोकप्रिय शहर',
      step2Title: 'आपके परिवार में कौन-कौन है?',
      step2Sub: 'बच्चों, बुजुर्गों और संवेदनशील फेफड़ों के लिए सलाह अलग होती है।',
      adults: 'वयस्क',
      children: 'बच्चे',
      elderly: 'बुजुर्ग (60+)',
      sensitivities: 'स्वास्थ्य संवेदनशीलता',
      petsLabel: 'घर में पालतू जानवर हैं',
      step3Title: 'आवागमन, रसोई और घर का विवरण',
      step3Sub: 'ताकि हम आपके बजट और दिनचर्या के अनुरूप कम लागत वाले सुझाव दें।',
      commute: 'मुख्य आवागमन साधन',
      cooking: 'खाना पकाने का ईंधन',
      heating: 'सर्दियों में हीटिंग',
      homeType: 'घर का प्रकार',
      windowsRoad: 'खिड़कियां मुख्य सड़क या निर्माण क्षेत्र की तरफ हैं',
      budget: 'उपायों के लिए बजट',
      goal: 'मुख्य प्राथमिकता',
    },
    dashboard: {
      liveAqiTitle: 'स्थानीय वायु गुणवत्ता',
      dominant: 'प्रमुख प्रदूषक',
      bestWindowCardTitle: 'घर में हवा बदलने का श्रेष्ठ समय',
      bestWindowSub: '24-घंटे का प्रदूषण रुझान',
      meaningTitle: 'आज आपके परिवार के लिए इसका क्या अर्थ है',
      topThreeTitle: 'अभी करने के लिए शीर्ष 3 कदम',
      statusGenerating: 'तैयार हो रहा है…',
      statusUpdated: 'अभी अपडेट हुआ',
      statusOffline: 'ऑफ़लाइन अनुमान लागू',
      offlineBadge: 'ऑफ़लाइन अनुमान',
      regenerateAi: 'AI से फिर बनाएं',
      sharePlan: 'योजना साझा करें',
      printPlan: 'प्रिंट / PDF',
      copied: 'कॉपी हो गया',
      subNav: {
        plan: 'दिनचर्या',
        indoor: 'घरेलू उपाय',
        alternatives: 'विकल्प',
        impact: 'प्रभाव',
        whatIf: 'व्हाट-इफ',
      },
      todaysPlan: 'आज की योजना',
      indoorHacks: 'घरेलू उपाय',
      alternatives: 'टिकाऊ विकल्प',
      simulatorTitle: 'व्हाट-इफ (What-If) सिम्युलेटर',
      simulatorSub: 'आदतों में बदलाव चुनकर अपने सप्ताह का संभावित प्रभाव देखें।',
      yourWeekTitle: 'आपका सप्ताह',
      cleanAirScore: 'क्लीन एयर स्कोर',
      baseline: 'आधार स्कोर',
      estReduction: 'कण संपर्क में कमी',
      co2Avoided: 'CO2 बचत / सप्ताह',
      rupeesSaved: 'अनुमानित बचत / सप्ताह',
      howEstimated: 'हमने यह अनुमान कैसे लगाया',
      hideAssumptions: 'आधार छुपाएं',
      estimateNote: 'अनुमान — चिकित्सीय दावा नहीं',
      honestNote: 'वैज्ञानिक तथ्य',
      profileSavedToast: 'प्रोफ़ाइल सहेजी गई — लाइव AQI और योजना अपडेट हो रही है।',
      cityUpdatedToast: 'शहर बदला गया — नया AQI डेटा लाया जा रहा है।',
    },
    chat: {
      title: 'ब्रेथवाइज से पूछें',
      subtitle: 'मास्क, बच्चों के बाहर खेलने, रसोई के धुएं या सस्ते उपायों के बारे में पूछें।',
      placeholder: 'आज की हवा या अपने घर के बारे में पूछें...',
      send: 'भेजें',
      thinking: 'ब्रेथवाइज आपकी हवा का डेटा देख रहा है',
      whyHelps: 'यह क्यों मददगार है',
      stepsTitle: 'व्यावहारिक कदम',
      tryAgain: 'फिर प्रयास करें',
      fallbackNotice: 'ऑफ़लाइन व्यक्तिगत अनुमान से उत्तर दिया गया।',
      suggestions: [
        'क्या आज बच्चों का बाहर खेलना सुरक्षित है?',
        'आज के प्रदूषण में कौन सा मास्क पहनें?',
        '₹2,000 से कम में बेडरूम की हवा साफ कैसे करें?',
        'आज खिड़कियां कब खोलनी चाहिए?',
      ],
      welcome:
        'आज की हवा से बचाव के बारे में कोई भी सवाल पूछें। हर उत्तर आपके शहर, लाइव AQI और परिवार के अनुसार होगा।',
    },
    community: {
      title: 'मोहल्ला और RWA मोड',
      subtitle: 'अपनी सोसाइटी, गली या स्कूल के लिए सामूहिक क्लीन-एयर संकल्प बनाएं और कार्ड डाउनलोड करें।',
      householdsLabel: 'शामिल परिवारों की संख्या',
      checklistTitle: 'सामुदायिक कार्य चेकलिस्ट',
      collectiveTitle: 'सामूहिक मासिक प्रभाव (अनुमान)',
      co2Label: 'CO2 उत्सर्जन बचाया गया',
      dustLabel: 'स्थानीय धूल व PM रोकथाम',
      treesLabel: 'मासिक पेड़ अवशोषण समतुल्य',
      streetDropLabel: 'गली की धूल में अनुमानित कमी',
      copyCard: 'सारांश कॉपी करें',
      downloadImage: 'कार्ड PNG डाउनलोड करें',
      downloading: 'तैयार हो रहा है...',
      printFlyer: 'चेकलिस्ट प्रिंट करें',
      copied: 'कॉपी हो गया',
      summaryTitle: 'सोसाइटी क्लीन-एयर संकल्प',
    },
  },
};
