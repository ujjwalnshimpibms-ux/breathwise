import { generateStructuredJson } from './gemini.mjs';

function buildChatSchema() {
  return {
    type: 'OBJECT',
    properties: {
      answer: { type: 'STRING' },
      steps: { type: 'ARRAY', items: { type: 'STRING' } },
      whyThisHelps: { type: 'STRING' },
      disclaimer: { type: 'STRING' },
    },
    required: ['answer', 'steps', 'whyThisHelps', 'disclaimer'],
  };
}

function buildChatFallback({ message, profile = {}, aqi = {}, language = 'en' }) {
  const q = String(message || '').trim().toLowerCase();
  const city = profile.city || 'Delhi';
  const usAqi = Number(aqi?.usAqi ?? aqi?.aqi ?? 220);
  const pm25 = Number(aqi?.pollutants?.pm25 ?? aqi?.pm25 ?? 120);
  const dominant = aqi?.dominantPollutant || 'PM2.5';
  const bestWindow = aqi?.bestAiringWindow || aqi?.bestOutdoorWindow || (language === 'hi' ? 'दोपहर 12:00 – 2:00 बजे' : '12:00 PM – 2:00 PM');
  const hasKids = (profile.children ?? 0) > 0;
  const sens = Array.isArray(profile.sensitivities) ? profile.sensitivities : [];
  const hasResp = sens.includes('asthma') || sens.includes('allergies');

  const isGreeting = /^(hi|hello|hey|namaste|नमस्ते|हाय|हेलो)\b[!.,? ]*$/i.test(q);

  if (language === 'hi') {
    if (isGreeting) {
      return {
        answer: `नमस्ते! मैं ब्रेथवाइज हूँ। ${city} में अभी AQI ${usAqi} (${dominant}) है—आप मुझसे आज के मास्क, बच्चों के बाहर खेलने, खिड़की खोलने के समय या कम बजट वाले घरेलू उपायों के बारे में पूछ सकते हैं।`,
        steps: [
          `आज घर की हवा बदलने का श्रेष्ठ समय: ${bestWindow}।`,
          'सड़क की ओर की खिड़कियां सुबह और शाम के पीक ट्रैफिक में बंद रखें।',
        ],
        whyThisHelps: `आपके ${city} के लाइव AQI (${usAqi}) और घरेलू प्रोफ़ाइल के आधार पर सही समय पर वेंटिलेशन से PM2.5 जमाव 20–30% कम रहता है।`,
        disclaimer: 'यह सामान्य मार्गदर्शन है, चिकित्सीय सलाह नहीं। किसी भी लक्षण पर डॉक्टर को दिखाएं।',
        source: 'fallback',
        demo: true,
      };
    }

    const isMask = q.includes('mask') || q.includes('मास्क') || q.includes('n95');
    const isKids = q.includes('kid') || q.includes('child') || q.includes('बच्च') || q.includes('खेल');
    const isRoom =
      q.includes('bedroom') ||
      q.includes('cheap') ||
      q.includes('room') ||
      q.includes('कमरे') ||
      q.includes('बेडरूम') ||
      q.includes('सस्त');

    if (isMask) {
      return {
        answer: `${city} में आज AQI ${usAqi} (${dominant} प्रमुख) है। बाहर जाते समय चेहरे पर ठीक से फिट होने वाला N95 या KF94 मास्क सबसे सुरक्षित विकल्प है।`,
        steps: [
          'नाक की क्लिप को दबाकर चेहरे के किनारों से हवा का रिसाव बंद करें।',
          hasKids ? 'बच्चों के लिए छोटे आकार का बच्चों वाला KN95/KF94 मास्क चुनें।' : 'कपड़े या सर्जिकल मास्क की जगह फ़िल्टर वाला N95 पहनें।',
          'भीगने या गंदा होने पर मास्क बदल दें।',
        ],
        whyThisHelps: 'ठीक से फिट N95 मास्क बाहर के सूक्ष्म PM2.5 कणों में से ~90–95% को सांस में जाने से रोक सकता है (अनुमानित सुरक्षा)।',
        disclaimer: 'यह सामान्य मार्गदर्शन है, चिकित्सीय सलाह नहीं। सांस फूलने या खांसी बढ़ने पर डॉक्टर से मिलें।',
        source: 'fallback',
        demo: true,
      };
    }

    if (isKids) {
      return {
        answer: `${city} में अभी AQI ${usAqi} है। ${usAqi > 150 ? 'आज तेज़ बाहरी खेल घर के अंदर ही रखना बेहतर है।' : 'बच्चे केवल दोपहर के साफ समय में हल्की गतिविधि बाहर कर सकते हैं।'}`,
        steps: [
          `बाहरी समय को ${bestWindow} के बीच 20–30 मिनट तक सीमित रखें।`,
          hasResp ? 'घर में अस्थमा/एलर्जी संवेदनशीलता है, इसलिए इन्हेलर पास रखें और भारी दौड़-भाग टालें।' : 'स्कूल जाते समय बच्चों को मास्क पहनाएं।',
          'शाम 5:30 बजे से पहले सड़क की तरफ की खिड़कियां बंद कर दें।',
        ],
        whyThisHelps: 'तेज़ खेल के दौरान बच्चे सामान्य से 2–3 गुना अधिक हवा अंदर खींचते हैं; घर के अंदर रहने से कणों का संपर्क काफी घटता है।',
        disclaimer: 'यह अनुमानित जानकारी है, चिकित्सीय सलाह नहीं। किसी भी लक्षण पर डॉक्टर से सलाह लें।',
        source: 'fallback',
        demo: true,
      };
    }

    if (isRoom) {
      return {
        answer: 'कम बजट में बेडरूम की हवा साफ रखने के लिए सबसे पहले खिड़की-दरवाजों की दरारें सील करें और एक कमरे में सरल फ़िल्टर चलाएं।',
        steps: [
          'सड़क की ओर वाली खिड़कियों पर ₹150–300 की फोम वेदर-स्ट्रिप लगाएं और दरवाजे के नीचे तौलिया/डोर-स्वीप रखें।',
          'सोने से 1 घंटा पहले कमरे का दरवाजा बंद कर साधारण पंखे के पीछे MERV-13 या HEPA रिप्लेसमेंट फ़िल्टर लगाएं।',
          'रात में मच्छर कॉइल या अगरबत्ती न जलाएं और रोज़ गीला पोंछा लगाएं।',
        ],
        whyThisHelps: 'एक बंद 150 sq ft कमरे में सीलिंग + DIY फ़िल्टर से रात भर में PM2.5 का स्तर अनुमानित 35–45% तक कम हो सकता है।',
        disclaimer: 'यह अनुमानित घरेलू मार्गदर्शन है। स्वास्थ्य संबंधी लक्षण दिखने पर डॉक्टर से परामर्श लें।',
        source: 'fallback',
        demo: true,
      };
    }

    return {
      answer: `${city} में आज AQI ${usAqi} (PM2.5: ${pm25} µg/m³) है। आज के लिए मुख्य कदम है कि ${bestWindow} के बीच ही वेंटिलेशन करें और बाकी समय खिड़कियां बंद रखें।`,
      steps: [
        `${bestWindow} के बीच 20 मिनट क्रॉस-वेंटिलेशन करें।`,
        `${profile.cookingFuel === 'lpg' ? 'LPG पर खाना बनाते समय एग्जॉस्ट फैन अवश्य चलाएं।' : 'रसोई का एग्जॉस्ट खाना बनाने के बाद भी 10 मिनट चालू रखें।'}`,
        'सफर के समय N95/KF94 मास्क और कार में Recirculate मोड का उपयोग करें।',
      ],
      whyThisHelps: 'सुबह-शाम के स्मॉग में खिड़कियां बंद रखने और दोपहर में हवा बदलने से घर के अंदर PM2.5 जमाव लगभग 20–30% कम रहता है।',
      disclaimer: 'यह सामान्य शैक्षिक जानकारी है, चिकित्सीय सलाह नहीं। लक्षण होने पर डॉक्टर को दिखाएं।',
      source: 'fallback',
      demo: true,
    };
  }

  if (isGreeting) {
    return {
      answer: `Hi! I'm Breathwise. Right now ${city} is at US AQI ${usAqi} (${dominant} dominant). Ask me anything about today's safest airing hours, masks, kids' outdoor play, or low-cost indoor air setups.`,
      steps: [
        `Today's cleanest airing window: ${bestWindow}.`,
        'Keep road-facing windows latched during morning and evening rush peaks.',
      ],
      whyThisHelps: `Tailoring daily timing to ${city}'s live AQI (${usAqi}) and your home setup helps cut peak PM2.5 exposure by an estimated 20–30%.`,
      disclaimer: 'General air-quality guidance only, not medical advice. Consult a doctor for breathing symptoms.',
      source: 'fallback',
      demo: true,
    };
  }

  const isMask = q.includes('mask') || q.includes('n95') || q.includes('ffp2');
  const isKids = q.includes('kid') || q.includes('child') || q.includes('play') || q.includes('outdoor');
  const isRoom = q.includes('bedroom') || q.includes('cheap') || q.includes('budget') || q.includes('purifier');

  if (isMask) {
    return {
      answer: `With ${city} at AQI ${usAqi} (${dominant} dominant), choose a snug-fitting N95, KN95, or FFP2 mask without a loose gap around the nose bridge.`,
      steps: [
        'Press the nose wire firmly and check that air passes through the filter fabric, not the sides.',
        hasKids
          ? 'Use child-sized KF94 or kids’ KN95 masks for school commutes—adult masks leave cheek gaps.'
          : 'Skip plain cloth or surgical masks on smog days, as they let fine PM2.5 slip around edges.',
        'Replace masks once straps loosen or after roughly 30–40 hours of smoky outdoor wear.',
      ],
      whyThisHelps: 'A properly sealed N95/FFP2 filters an estimated 90–95% of fine PM2.5 particles during outdoor transit.',
      disclaimer: 'General air-quality guidance only, not medical advice. Consult a doctor if anyone experiences breathlessness or wheezing.',
      source: 'fallback',
      demo: true,
    };
  }

  if (isKids) {
    return {
      answer: `At AQI ${usAqi} in ${city}, ${
        usAqi > 150 ? 'active outdoor play is best moved indoors today' : 'light outdoor play is okay during the cleaner midday window'
      }${hasResp ? ', especially with respiratory sensitivities at home' : ''}.`,
      steps: [
        `If stepping out, keep it brief inside today’s cleaner window (${bestWindow}).`,
        hasKids
          ? 'Swap vigorous outdoor running for indoor games, crafts, or gentle stretching.'
          : 'Avoid strenuous outdoor exercise near traffic corridors.',
        hasResp
          ? 'Keep prescribed asthma/allergy relief inhalers nearby and watch for early coughing.'
          : 'Use fitted kids’ masks during bus waits or walks.',
      ],
      whyThisHelps: 'Active play doubles or triples breathing rate, pulling fine PM2.5 deeper into airways; shifting indoors during high-AQI hours cuts exposure substantially.',
      disclaimer: 'Estimates and practical tips only—not medical advice. Please consult a pediatrician or doctor for any respiratory symptoms.',
      source: 'fallback',
      demo: true,
    };
  }

  if (isRoom) {
    return {
      answer: `Under ₹2,000, the highest-impact setup for a bedroom in ${city} is sealing window drafts first and pairing a standard fan with a replacement HEPA or MERV-13 filter.`,
      steps: [
        'Seal road-facing window tracks with ₹200 foam weather-stripping tape and tuck a towel under the door.',
        'Tape a pleated MERV-13 or cylindrical replacement HEPA filter securely to the intake of a regular fan and run it with the bedroom door shut.',
        'Keep mosquito coils, incense, and dry brooms out of bedrooms; damp-mop daily instead.',
      ],
      whyThisHelps: 'Focusing filtration in one sealed 150 sq ft sleeping room can cut overnight PM2.5 by an estimated 35–45% at a fraction of commercial purifier cost.',
      disclaimer: 'Estimated performance based on indoor air studies, not a medical guarantee. Seek medical care for persistent symptoms.',
      source: 'fallback',
      demo: true,
    };
  }

  return {
    answer: `In ${city} today, live US AQI is ${usAqi} (PM2.5: ${pm25} µg/m³). Your highest-leverage move is timing ventilation to ${bestWindow} and keeping indoor sources clear.`,
    steps: [
      `Open opposite windows for 20 minutes during ${bestWindow} to flush indoor CO2.`,
      profile.windowsFacingRoad
        ? 'Keep road-facing windows sealed before 10:30 AM and after 5:30 PM.'
        : 'Latch exterior windows before evening traffic peaks.',
      `${profile.cookingFuel === 'lpg' ? 'Run your kitchen exhaust fan during all LPG cooking.' : 'Keep kitchen ventilation active while cooking.'}`,
    ],
    whyThisHelps: 'Aligning window airing with afternoon dispersion while blocking morning/evening rush plumes reduces indoor particle buildup by an estimated 20–30%.',
    disclaimer: 'General educational guidance only, not medical advice. Please consult a clinician if you notice breathing or chest symptoms.',
    source: 'fallback',
    demo: true,
  };
}

export async function handleChat({ message, history = [], profile = {}, aqi = {}, language = 'en' }) {
  const safeLang = language === 'hi' ? 'hi' : 'en';
  const trimmed = String(message || '').trim();
  if (!trimmed) {
    const err = new Error('Message is required.');
    err.status = 400;
    throw err;
  }

  const usAqi = Number(aqi?.usAqi ?? aqi?.aqi ?? 220);
  const pm25 = Number(aqi?.pollutants?.pm25 ?? aqi?.pm25 ?? 120);
  const pm10 = Number(aqi?.pollutants?.pm10 ?? aqi?.pm10 ?? 180);
  const no2 = Number(aqi?.pollutants?.no2 ?? aqi?.no2 ?? 40);
  const dominant = aqi?.dominantPollutant || 'PM2.5';
  const bestWindow = aqi?.bestAiringWindow || aqi?.bestOutdoorWindow || '12:00 PM – 2:00 PM';

  const langLabel = safeLang === 'hi' ? 'Hindi (Devanagari script, warm everyday Hindi)' : 'English';
  const systemInstruction = `You are Breathwise, a caring, practical, non-alarmist Urban Air Quality Advisor.
Tailor every answer to the user's location, live AQI, household members, sensitivities, budget, and lifestyle.
If the user sends a brief greeting like "hi", respond warmly and mention today's local AQI and best airing window.
Always include 2-3 actionable "steps", a clear "whyThisHelps" impact explanation, and a gentle "disclaimer".
Write ALL JSON string fields in ${langLabel}. Output strictly valid JSON matching the schema.`;

  const recentHistory = (Array.isArray(history) ? history : [])
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'User' : 'Breathwise'}: ${m.text || m.message || ''}`)
    .join('\n');

  const prompt = `Context:
Location: ${profile.city || 'Delhi'}, ${profile.country || 'India'}
Live Air Quality: US AQI ${usAqi} (${dominant} dominant, PM2.5: ${pm25} ug/m3, PM10: ${pm10} ug/m3, NO2: ${no2} ug/m3)
Best Airing Window Today: ${bestWindow}
Household: ${profile.adults ?? 2} adults, ${profile.children ?? 0} children, ${profile.elderly ?? 0} elderly, sensitivities: ${(profile.sensitivities || ['none']).join(', ')}
Lifestyle: commute=${profile.commuteMode || 'car'}, cooking=${profile.cookingFuel || 'lpg'}, budget=${profile.budget || 'medium'}
${recentHistory ? `\nRecent conversation:\n${recentHistory}\n` : ''}
User message: ${trimmed}`;

  const aiReply = await generateStructuredJson({
    systemInstruction,
    contents: prompt,
    responseSchema: buildChatSchema(),
  });

  if (aiReply && typeof aiReply.answer === 'string' && aiReply.answer.trim()) {
    return {
      answer: aiReply.answer.trim(),
      steps: Array.isArray(aiReply.steps) ? aiReply.steps.filter(Boolean).slice(0, 4) : [],
      whyThisHelps:
        typeof aiReply.whyThisHelps === 'string' && aiReply.whyThisHelps.trim()
          ? aiReply.whyThisHelps.trim()
          : safeLang === 'hi'
            ? 'सही समय और आसान बचाव अपनाने से घर के अंदर PM2.5 का संपर्क घटता है।'
            : 'Combining timing shifts with source control lowers household PM2.5 exposure.',
      disclaimer:
        typeof aiReply.disclaimer === 'string' && aiReply.disclaimer.trim()
          ? aiReply.disclaimer.trim()
          : safeLang === 'hi'
            ? 'यह सामान्य जानकारी है, चिकित्सीय सलाह नहीं। लक्षण होने पर डॉक्टर को दिखाएं।'
            : 'General guidance only, not medical advice. Consult a doctor for symptoms.',
      source: 'gemini',
      demo: false,
    };
  }

  return buildChatFallback({ message: trimmed, profile, aqi, language: safeLang });
}
