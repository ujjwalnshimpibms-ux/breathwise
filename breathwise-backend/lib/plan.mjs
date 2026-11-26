import { generateStructuredJson } from './gemini.mjs';
import { getBaselineCleanAirScore } from './whatif.mjs';

function buildImpactSchema() {
  return {
    type: 'OBJECT',
    properties: {
      metricLabel: { type: 'STRING' },
      valueText: { type: 'STRING' },
      pm25ReductionPct: { type: 'INTEGER' },
      co2AvoidedKgPerWeek: { type: 'NUMBER' },
      confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] },
      assumptions: { type: 'ARRAY', items: { type: 'STRING' } },
      disclaimer: { type: 'STRING' },
    },
    required: [
      'metricLabel',
      'valueText',
      'pm25ReductionPct',
      'co2AvoidedKgPerWeek',
      'confidence',
      'assumptions',
      'disclaimer',
    ],
  };
}

function buildPlanSchema() {
  const impact = buildImpactSchema();
  return {
    type: 'OBJECT',
    properties: {
      familySummary: { type: 'STRING' },
      headlineAlert: { type: 'STRING' },
      routines: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            timeOfDay: { type: 'STRING', enum: ['morning', 'afternoon', 'evening', 'night'] },
            windowLabel: { type: 'STRING' },
            title: { type: 'STRING' },
            whyItHelps: { type: 'STRING' },
            steps: { type: 'ARRAY', items: { type: 'STRING' } },
            costLevel: { type: 'STRING', enum: ['free', 'low', 'medium', 'high'] },
            effortLevel: { type: 'STRING', enum: ['easy', 'moderate', 'habit_shift'] },
            impact,
          },
          required: [
            'id',
            'timeOfDay',
            'windowLabel',
            'title',
            'whyItHelps',
            'steps',
            'costLevel',
            'effortLevel',
            'impact',
          ],
        },
      },
      indoorHacks: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            rank: { type: 'INTEGER' },
            title: { type: 'STRING' },
            category: { type: 'STRING' },
            whyItHelps: { type: 'STRING' },
            honestNote: { type: 'STRING' },
            steps: { type: 'ARRAY', items: { type: 'STRING' } },
            costLevel: { type: 'STRING', enum: ['free', 'low', 'medium', 'high'] },
            effortLevel: { type: 'STRING', enum: ['easy', 'moderate', 'habit_shift'] },
            effectivenessScore: { type: 'INTEGER' },
            impact,
          },
          required: [
            'id',
            'rank',
            'title',
            'category',
            'whyItHelps',
            'steps',
            'costLevel',
            'effortLevel',
            'effectivenessScore',
            'impact',
          ],
        },
      },
      alternatives: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            title: { type: 'STRING' },
            replaces: { type: 'STRING' },
            whyItHelps: { type: 'STRING' },
            steps: { type: 'ARRAY', items: { type: 'STRING' } },
            costLevel: { type: 'STRING', enum: ['free', 'low', 'medium', 'high'] },
            effortLevel: { type: 'STRING', enum: ['easy', 'moderate', 'habit_shift'] },
            impact,
          },
          required: ['id', 'title', 'replaces', 'whyItHelps', 'steps', 'costLevel', 'effortLevel', 'impact'],
        },
      },
    },
    required: ['familySummary', 'headlineAlert', 'routines', 'indoorHacks', 'alternatives'],
  };
}

function buildFamilySummary(aqiValue, profile, lang) {
  const city = profile.city || 'your city';
  const hasKids = (profile.children ?? 0) > 0;
  const hasElderly = (profile.elderly ?? 0) > 0;
  const sens = Array.isArray(profile.sensitivities) ? profile.sensitivities : [];
  const hasResp = sens.includes('asthma') || sens.includes('allergies');
  const hasHeart = sens.includes('heart');

  if (lang === 'hi') {
    if (aqiValue > 200) {
      const group = hasKids || hasElderly ? 'बच्चों और बुजुर्गों' : 'पूरे परिवार';
      const extra = hasResp ? ' (अस्थमा/एलर्जी के कारण विशेष सावधानी रखें)' : '';
      return `आज ${city} की हवा बहुत प्रदूषित है। ${group} की बाहरी गतिविधियां कम रखें, खिड़कियां सुबह-शाम बंद रखें और बाहर जाने पर N95 मास्क पहनें${extra}।`;
    }
    if (aqiValue > 100) {
      return `${city} में प्रदूषण स्तर बढ़ा हुआ है। ${
        hasKids ? 'बच्चों को दोपहर के साफ समय में ही बाहर खेलने दें' : 'तेज़ बाहरी व्यायाम दोपहर तक टालें'
      }${hasResp ? ' और इन्हेलर/दवा पास रखें' : ''}।`;
    }
    return `${city} में आज हवा अपेक्षाकृत बेहतर है। दोपहर में क्रॉस-वेंटिलेशन के लिए 20 मिनट खिड़कियां खोल सकते हैं।`;
  }

  if (aqiValue > 200) {
    const targets = [];
    if (hasKids) targets.push(`${profile.children} child${profile.children > 1 ? 'ren' : ''}`);
    if (hasElderly) targets.push(`${profile.elderly} senior${profile.elderly > 1 ? 's' : ''}`);
    const targetText = targets.length > 0 ? `especially for your ${targets.join(' and ')}` : 'for everyone at home';
    const healthNote = hasResp
      ? ' With respiratory sensitivities in your household, shift outdoor play indoors and use well-fitted N95/FFP2 masks for commutes.'
      : hasHeart
        ? ' With cardiovascular sensitivity noted, avoid strenuous outdoor exertion today.'
        : ' Keep road-facing windows sealed during morning and evening traffic peaks.';
    return `Heavy smog in ${city} today — take extra care ${targetText}.${healthNote}`;
  }
  if (aqiValue > 100) {
    return `Elevated particulate levels in ${city}. ${
      hasKids
        ? 'Keep school commutes masked and limit vigorous outdoor play to the midday dip.'
        : 'Schedule errands during the afternoon clearing window.'
    }${hasResp ? ' Watch for early cough or wheeze triggers.' : ''}`;
  }
  return `Air quality in ${city} is manageable today. You can safely open windows briefly around midday to refresh indoor air.`;
}

function buildFallbackPlan(profile, aqi, language) {
  const city = profile.city || 'Delhi';
  const usAqi = Number(aqi?.usAqi ?? aqi?.aqi ?? 220);
  const bestWindow = aqi?.bestAiringWindow || aqi?.bestOutdoorWindow || (language === 'hi' ? 'दोपहर 12:00 – 2:00 बजे' : '12:00 PM – 2:00 PM');
  const familySummary = buildFamilySummary(usAqi, profile, language);
  const isHighBudget = profile.budget === 'high';
  const isLowBudget = profile.budget === 'low';
  const isBiomass = profile.cookingFuel === 'biomass';
  const isLpg = profile.cookingFuel === 'lpg';
  const isCarOrBike = profile.commuteMode === 'car' || profile.commuteMode === 'two_wheeler';
  const commuteLabel =
    profile.commuteMode === 'car'
      ? language === 'hi'
        ? 'निजी कार'
        : 'private car'
      : profile.commuteMode === 'two_wheeler'
        ? language === 'hi'
          ? 'दोपहिया वाहन'
          : 'two-wheeler'
        : language === 'hi'
          ? 'दैनिक आवागमन'
          : 'daily commute';

  if (language === 'hi') {
    return {
      familySummary,
      headlineAlert: `${city} में आज ${bestWindow} के बीच ही खिड़कियां खोलें और बाहरी काम निपटाएं।`,
      routines: [
        {
          id: 'r-morning',
          timeOfDay: 'morning',
          windowLabel: '6:30 AM – 10:00 AM',
          title: profile.windowsFacingRoad
            ? `${city} के सुबह के ट्रैफिक में सड़क वाली खिड़कियां बंद रखें`
            : 'सुबह के धुंध समय में N95 मास्क और बंद वेंटिलेशन',
          whyItHelps: 'सुबह के तापमान व्युत्क्रमण में PM2.5 ज़मीन के पास फंसा रहता है; घर के भीतर धुंध आने से रोकना सबसे आसान बचाव है।',
          steps: [
            profile.windowsFacingRoad
              ? 'मुख्य सड़क की तरफ वाली खिड़कियां सुबह 10:30 बजे तक बंद रखें।'
              : 'सुबह-सुबह वेंटिलेशन टालें; दोपहर के साफ समय का इंतजार करें।',
            (profile.children ?? 0) > 0
              ? 'बच्चों को स्कूल जाते समय फिट बैठने वाला N95 या KF94 मास्क पहनाएं।'
              : 'सुबह की यात्रा में N95/KF94 मास्क साथ रखें।',
            isCarOrBike
              ? 'कार में AC "Recirculate" मोड पर रखें या दोपहिया पर N95 मास्क पहनें।'
              : 'बस/मेट्रो स्टॉप पर मुख्य सड़क से थोड़ा हटकर खड़े हों।',
          ],
          costLevel: 'free',
          effortLevel: 'easy',
          impact: {
            metricLabel: 'सुबह PM2.5 संपर्क',
            valueText: '-22% सुबह का संपर्क',
            pm25ReductionPct: 22,
            co2AvoidedKgPerWeek: 0,
            confidence: 'high',
            assumptions: [
              'सुबह 6-10 बजे बाहरी PM2.5 दोपहर की तुलना में ~35-45% अधिक होता है।',
              'बंद खिड़कियां और मास्क कणों के प्रवेश को काफी धीमा करते हैं।',
            ],
            disclaimer: 'अनुमानित एक्सपोज़र कमी — चिकित्सीय दावा नहीं।',
          },
        },
        {
          id: 'r-afternoon',
          timeOfDay: 'afternoon',
          windowLabel: bestWindow,
          title: 'दोपहर की 25-मिनट क्रॉस-वेंटिलेशन और सुरक्षित आउटडोर समय',
          whyItHelps: 'दोपहर की धूप हवा की परत को ऊपर उठाती है, जिससे दिन में प्रदूषण का स्तर सबसे कम होता है।',
          steps: [
            'घर में जमा CO2 और नमी निकालने के लिए 20-25 मिनट आमने-सामने की खिड़कियां खोलें।',
            (profile.children ?? 0) > 0
              ? 'बच्चों की हल्की आउटडोर गतिविधि इसी समय तक सीमित रखें।'
              : 'बाहरी काम और टहलना इसी दोपहर विंडो में रखें।',
            'झाड़ू लगाने के बजाय गीले कपड़े से पोंछा लगाएं ताकि धूल हवा में न उड़े।',
          ],
          costLevel: 'free',
          effortLevel: 'easy',
          impact: {
            metricLabel: 'घरेलू हवा ताज़गी',
            valueText: '-15% इनडोर धुंध जमाव',
            pm25ReductionPct: 15,
            co2AvoidedKgPerWeek: 0.4,
            confidence: 'medium',
            assumptions: ['दोपहर के समय मिश्रण ऊंचाई सबसे अधिक होती है।', 'गीला पोंछा सूखी झाड़ू से होने वाली धूल को रोकता है।'],
            disclaimer: 'अनुमानित डेटा पर आधारित — चिकित्सीय सलाह नहीं।',
          },
        },
        {
          id: 'r-evening',
          timeOfDay: 'evening',
          windowLabel: '5:30 PM – 9:00 PM',
          title: 'शाम का ट्रैफिक पीक और रसोई वेंटिलेशन',
          whyItHelps: 'शाम को सड़क का धुआं और रसोई के कण एक साथ मिलकर घर की हवा को सबसे ज़्यादा प्रभावित करते हैं।',
          steps: [
            'शाम 5:30 से पहले सभी बाहरी खिड़कियां बंद कर दें।',
            isLpg || isBiomass
              ? 'खाना बनाते समय एग्जॉस्ट फैन/चिमनी चलाएं और संभव हो तो उबालने के लिए इंडक्शन का उपयोग करें।'
              : 'खाना बनाते समय रसोई का एग्जॉस्ट 10 मिनट अतिरिक्त चालू रखें।',
            'बच्चों के लिए इनडोर खेल और शांत गतिविधियों का समय रखें।',
          ],
          costLevel: 'free',
          effortLevel: 'easy',
          impact: {
            metricLabel: 'रसोई PM2.5 व NO2',
            valueText: '-18% शाम का एक्सपोज़र',
            pm25ReductionPct: 18,
            co2AvoidedKgPerWeek: 1.2,
            confidence: 'high',
            assumptions: ['सक्रिय एग्जॉस्ट से रसोई का NO2 और धुआं 40-55% कम होता है।'],
            disclaimer: 'अनुमानित रेंज — व्यक्तिगत वेंटिलेशन पर निर्भर।',
          },
        },
        {
          id: 'r-night',
          timeOfDay: 'night',
          windowLabel: '9:30 PM – 6:00 AM',
          title: 'सोने के कमरे को साफ़ हवा क्षेत्र (Clean Sleep Zone) बनाएं',
          whyItHelps: 'हम अपना लगभग एक-तिहाई दिन बेडरूम में बिताते हैं; रात में साफ हवा फेफड़ों को आराम देती है।',
          steps: [
            isHighBudget
              ? 'बेडरूम का दरवाजा बंद कर HEPA एयर प्यूरीफायर को रात भर स्लीप मोड पर चलाएं।'
              : 'केवल बेडरूम का दरवाजा बंद कर HEPA या DIY बॉक्स-फैन फ़िल्टर चलाएं।',
            'अगरबत्ती, मच्छर कॉइल या सुगंधित मोमबत्ती रात में न जलाएं।',
            (profile.sensitivities || []).includes('asthma')
              ? 'अस्थमा इन्हेलर पास रखें और खांसी बढ़ने पर डॉक्टर से मिलें।'
              : 'किसी भी सांस संबंधी लक्षण पर डॉक्टर से सलाह लें।',
          ],
          costLevel: isHighBudget ? 'medium' : 'low',
          effortLevel: 'easy',
          impact: {
            metricLabel: 'रात की नींद में PM2.5',
            valueText: '-34% बेडरूम कण स्तर',
            pm25ReductionPct: 34,
            co2AvoidedKgPerWeek: 0.3,
            confidence: 'high',
            assumptions: ['बंद बेडरूम में लगातार फिल्ट्रेशन बहुत तेज़ी से असर दिखाता है।'],
            disclaimer: 'अनुमानित कमी — किसी भी लक्षण पर डॉक्टर को दिखाएं।',
          },
        },
      ],
      indoorHacks: [
        {
          id: 'h-seal',
          rank: 1,
          title: 'दरवाजों और खिड़कियों के नीचे रबर/फोम ड्राफ्ट सील लगाएं',
          category: 'बिल्डिंग सीलिंग',
          whyItHelps: 'सड़क की तरफ की खिड़कियों की बारीक दरारों से सबसे ज़्यादा बाहरी धुंध घर में घुसती है।',
          honestNote: 'प्यूरीफायर चलाने से पहले दरारें सील करना प्यूरीफायर की क्षमता को दोगुना असरदार बनाता है।',
          steps: [
            'सड़क की ओर वाली खिड़कियों पर ₹150-300 की चिपकने वाली फोम वेदर-स्ट्रिप लगाएं।',
            'मुख्य दरवाजे के नीचे डोर-स्वीप या मुड़ा हुआ तौलिया रखें।',
          ],
          costLevel: 'low',
          effortLevel: 'easy',
          effectivenessScore: 88,
          impact: {
            metricLabel: 'बाहरी धुंध घुसपैठ',
            valueText: '-24% इनडोर रिसाव',
            pm25ReductionPct: 24,
            co2AvoidedKgPerWeek: 0.5,
            confidence: 'high',
            assumptions: ['सड़क की ओर खुली खिड़कियों वाले घर के लिए'],
            disclaimer: 'अनुमानित आंकड़ा — वास्तविक सुधार फ्रेम की फिटिंग पर निर्भर है।',
          },
        },
        {
          id: 'h-diy-hepa',
          rank: 2,
          title: isHighBudget ? 'बेडरूम में ट्रू-HEPA H13 प्यूरीफायर चलाएं' : 'DIY बॉक्स-फैन + HEPA/MERV-13 फ़िल्टर (₹2,000 से कम)',
          category: 'सक्रिय फ़िल्ट्रेशन',
          whyItHelps: 'HEPA या MERV-13 फ़िल्टर कमरे से सूक्ष्म PM2.5 कणों को भौतिक रूप से छान लेता है।',
          honestNote: 'ईमानदार तथ्य: स्नेक प्लांट या एरिका पाम घर के लिए सुंदर हैं, पर बंद कमरे में PM2.5 कम करने के लिए 100+ पौधे भी एक छोटे HEPA फ़िल्टर की बराबरी नहीं कर सकते।',
          steps: [
            isHighBudget
              ? 'सोने से 45 मिनट पहले बेडरूम में H13 HEPA प्यूरीफायर चालू करें और दरवाजा बंद रखें।'
              : '14–16 इंच के पंखे के पीछे MERV-13 या रिप्लेसमेंट HEPA फ़िल्टर टेप से सील करें।',
            'बंद बेडरूम में मध्यम गति पर लगातार चलाएं।',
          ],
          costLevel: isLowBudget ? 'low' : 'medium',
          effortLevel: 'moderate',
          effectivenessScore: 92,
          impact: {
            metricLabel: 'बेडरूम PM2.5 कमी',
            valueText: '-38% तक कम कण',
            pm25ReductionPct: 38,
            co2AvoidedKgPerWeek: 0,
            confidence: 'high',
            assumptions: ['140–180 sq ft बंद बेडरूम', 'मध्यम गति पर लगातार 6-8 घंटे संचालन'],
            disclaimer: 'अनुमानित प्रदर्शन — फिल्टर सील और कमरे के आकार पर निर्भर।',
          },
        },
        {
          id: 'h-wet-mop',
          rank: 3,
          title: 'सूखी झाड़ू की जगह रोज़ गीला पोंछा और दरवाजे पर जूते',
          category: 'धूल नियंत्रण',
          whyItHelps: 'फर्श पर बैठी भारी धूल सूखी झाड़ू से फिर हवा में उड़कर सांस में जाती है।',
          steps: ['दोपहर में सादे पानी से माइक्रोफाइबर पोंछा लगाएं।', 'जूते दरवाजे के बाहर उतारने की जगह बनाएं।'],
          costLevel: 'free',
          effortLevel: 'easy',
          effectivenessScore: 74,
          impact: {
            metricLabel: 'इनडोर PM10 व धूल',
            valueText: '-16% धूल का उड़ना',
            pm25ReductionPct: 16,
            co2AvoidedKgPerWeek: 0,
            confidence: 'medium',
            assumptions: ['दैनिक 1 बार गीला पोंछा'],
            disclaimer: 'अनुमानित प्रभाव — चिकित्सीय दावा नहीं।',
          },
        },
        {
          id: 'h-no-smoke',
          rank: 4,
          title: 'मच्छर कॉइल, अगरबत्ती और तेज़ तड़के का धुआं नियंत्रित करें',
          category: 'इनडोर स्रोत नियंत्रण',
          whyItHelps: 'बंद कमरे में जलने वाली कॉइल या घनी अगरबत्ती बहुत तेज़ी से PM2.5 बढ़ाती है।',
          steps: ['कॉइल की जगह मच्छरदानी या लिक्विड वेपोराइज़र का उपयोग करें।', 'तेज़ तड़का लगाते समय ढक्कन लगाएं और एग्जॉस्ट फैन चलाएं।'],
          costLevel: 'free',
          effortLevel: 'easy',
          effectivenessScore: 84,
          impact: {
            metricLabel: 'इनडोर पीक स्पाइक',
            valueText: '-28% अचानक धुआं',
            pm25ReductionPct: 28,
            co2AvoidedKgPerWeek: 0.6,
            confidence: 'high',
            assumptions: ['शाम को कॉइल और बंद कमरे में धुएं से बचाव'],
            disclaimer: 'अनुमानित कमी — इनडोर अध्ययन पर आधारित।',
          },
        },
      ],
      alternatives: [
        {
          id: 'alt-commute',
          title: isCarOrBike ? 'सप्ताह में 3 दिन छोटी ट्रिप को मेट्रो या कारपूल से बदलें' : 'भीड़भाड़ वाले समय से हटकर पब्लिक ट्रांजिट यात्रा करें',
          replaces: `${commuteLabel} से अकेले शहर यात्रा`,
          whyItHelps: 'ठंडी हवा में शुरुआती किलोमीटर में वाहन सबसे ज़्यादा PM और NOx छोड़ते हैं।',
          steps: ['5 किमी से कम यात्रा के लिए मेट्रो फीडर/ई-रिक्शा चुनें।', 'स्कूल या ऑफिस ड्रॉप के लिए पड़ोस के 2 परिवारों के साथ कारपूल करें।'],
          costLevel: 'free',
          effortLevel: 'habit_shift',
          impact: {
            metricLabel: 'उत्सर्जन व ईंधन बचत',
            valueText: '12.6 kg CO2/सप्ताह बचाया',
            pm25ReductionPct: 11,
            co2AvoidedKgPerWeek: 12.6,
            confidence: 'high',
            assumptions: ['प्रति ट्रिप औसतन 14 किमी आना-जाना', 'सप्ताह में 3 दिन बदलाव'],
            disclaimer: 'अनुमानित बचत — वास्तविक दूरी के अनुसार बदलती है।',
          },
        },
        {
          id: 'alt-induction',
          title: isBiomass ? 'लकड़ी/उपले की जगह LPG या इंडक्शन अपनाएं' : 'चाय, उबालने और दाल के लिए इंडक्शन कुकटॉप अपनाएं',
          replaces: isBiomass ? 'बायोमास धुआं रसोई' : 'दैनिक LPG बर्नर पर उबालना',
          whyItHelps: 'बिना खुली लौ के खाना पकाने से रसोई में NO2 और सूक्ष्म कण तेजी से घटते हैं।',
          steps: ['सिंगल इंडक्शन प्लेट पर चाय और प्रेशर कुकिंग से शुरुआत करें।', 'रसोई में क्रॉस-वेंटिलेशन या चिमनी नियमित साफ रखें।'],
          costLevel: 'low',
          effortLevel: 'easy',
          impact: {
            metricLabel: 'रसोई उत्सर्जन',
            valueText: '3.6 kg CO2/सप्ताह बचाया',
            pm25ReductionPct: 14,
            co2AvoidedKgPerWeek: 3.6,
            confidence: 'medium',
            assumptions: ['दिन के 60% उबालने के काम इंडक्शन पर'],
            disclaimer: 'अनुमानित आंकड़ा — उपयोग की आवृत्ति पर निर्भर।',
          },
        },
        {
          id: 'alt-burning',
          title: 'सोसाइटी में पत्तियां जलाने की जगह कम्पोस्टिंग शुरू कराएं',
          replaces: 'सर्दियों में सूखी पत्तियां व कचरा जलाना',
          whyItHelps: 'खुले में पत्तियां जलाने से निकलने वाला धुआं सीधे ग्राउंड-लेवल स्मॉग को बढ़ाता है।',
          steps: ['RWA में बगीचे के कोने में साधारण कम्पोस्ट बिन रखने का सुझाव दें।', 'रात के गार्डों को लकड़ी जलाने के बजाय इलेक्ट्रिक हीटर या गर्म जैकेट दें।'],
          costLevel: 'free',
          effortLevel: 'moderate',
          impact: {
            metricLabel: 'मोहल्ला PM2.5 रोकथाम',
            valueText: '4.5 kg CO2/सप्ताह बचाया',
            pm25ReductionPct: 9,
            co2AvoidedKgPerWeek: 4.5,
            confidence: 'medium',
            assumptions: ['सप्ताह में 2 बार छोटे कचरे के ढेर जलने से रोकना'],
            disclaimer: 'अनुमानित सामुदायिक प्रभाव।',
          },
        },
      ],
    };
  }

  return {
    familySummary,
    headlineAlert: `In ${city} today, keep street-facing air out during peaks and time airing to ${bestWindow}.`,
    routines: [
      {
        id: 'r-morning',
        timeOfDay: 'morning',
        windowLabel: '6:30 AM – 10:00 AM',
        title: profile.windowsFacingRoad
          ? `Seal ${city} road-facing glass & mask up for commutes`
          : 'Delay morning airing & wear fitted N95 masks outdoors',
        whyItHelps: 'Morning temperature inversions trap cold exhaust and PM2.5 close to street level; blocking indoor infiltration cuts peak exposure.',
        steps: [
          profile.windowsFacingRoad
            ? 'Keep road-facing windows and balcony doors latched until 10:30 AM.'
            : 'Delay morning window airing until the midday thermal lift.',
          (profile.children ?? 0) > 0
            ? 'Fit children with snug N95/KF94 masks during outdoor school bus waits or walks.'
            : 'Keep a snug N95/FFP2 mask on during morning outdoor walks.',
          isCarOrBike
            ? 'Switch car cabin air to Recirculate in heavy traffic (or wear N95 on two-wheelers).'
            : 'Wait slightly back from busy curbsides at bus or metro stops.',
        ],
        costLevel: 'free',
        effortLevel: 'easy',
        impact: {
          metricLabel: 'Morning PM2.5 ingress',
          valueText: '-22% morning exposure',
          pm25ReductionPct: 22,
          co2AvoidedKgPerWeek: 0,
          confidence: 'high',
          assumptions: [
            'Morning inversion PM2.5 in winter is typically 35–45% higher than mid-afternoon.',
            'Closed double-latched windows + cabin recirculation slow particle entry.',
          ],
          disclaimer: 'Estimated exposure reduction — not a medical claim.',
        },
      },
      {
        id: 'r-afternoon',
        timeOfDay: 'afternoon',
        windowLabel: bestWindow,
        title: '25-minute midday cross-ventilation & outdoor break',
        whyItHelps: 'Afternoon sunlight warms the lower atmosphere, lifting the smog cap so air dilutes naturally.',
        steps: [
          'Open opposite-side windows for 20–25 minutes to flush indoor CO2 and cooking humidity.',
          (profile.children ?? 0) > 0
            ? 'Keep children’s active outdoor play inside this midday dip rather than early morning or dusk.'
            : 'Schedule quick outdoor errands during this midday window.',
          'Follow with a quick damp mop instead of dry sweeping so settled dust does not re-suspend.',
        ],
        costLevel: 'free',
        effortLevel: 'easy',
        impact: {
          metricLabel: 'Indoor air freshness',
          valueText: '-15% trapped indoor haze',
          pm25ReductionPct: 15,
          co2AvoidedKgPerWeek: 0.4,
          confidence: 'medium',
          assumptions: ['Planetary boundary layer mixing height peaks in early afternoon.', 'Wet mopping avoids dust resuspension compared with dry brooms.'],
          disclaimer: 'Estimate based on typical diurnal dispersion.',
        },
      },
      {
        id: 'r-evening',
        timeOfDay: 'evening',
        windowLabel: '5:30 PM – 9:00 PM',
        title: 'Close up before dusk rush & ventilate cooking plumes',
        whyItHelps: 'Evening rush-hour exhaust combined with unvented cooking fumes creates the sharpest indoor PM2.5 spikes of the day.',
        steps: [
          'Close all exterior windows by 5:30 PM before evening cooling traps traffic smoke.',
          isLpg || isBiomass
            ? 'Run your kitchen exhaust fan during every meal and use an electric kettle or induction for boiling.'
            : 'Keep your kitchen exhaust hood running for 10 minutes after finishing cooking.',
          (profile.children ?? 0) > 0
            ? 'Shift kids’ evening playtime indoors with quiet reading or stretching.'
            : 'Prefer indoor workouts over dusk roadside jogs.',
        ],
        costLevel: 'free',
        effortLevel: 'easy',
        impact: {
          metricLabel: 'Evening kitchen & smog peak',
          valueText: '-18% evening PM2.5 & NO2',
          pm25ReductionPct: 18,
          co2AvoidedKgPerWeek: 1.2,
          confidence: 'high',
          assumptions: ['Active exhaust hoods capture 40–55% of cooking aerosols and NO2.'],
          disclaimer: 'Estimated range — varies with hood airflow and sealing.',
        },
      },
      {
        id: 'r-night',
        timeOfDay: 'night',
        windowLabel: '9:30 PM – 6:00 AM',
        title: 'Run a dedicated Clean Sleep Zone in bedrooms',
        whyItHelps: 'Families spend ~8 continuous hours asleep; keeping one closed bedroom clean gives airways a predictable recovery window.',
        steps: [
          isHighBudget
            ? 'Close bedroom doors 45 minutes before bed and run a True-HEPA purifier on sleep mode.'
            : 'Shut bedroom doors 45 minutes before bedtime and run a HEPA purifier or DIY box-fan filter on medium.',
          'Avoid overnight mosquito coils, incense sticks, or scented candles inside sleeping rooms.',
          (profile.sensitivities || []).includes('asthma')
            ? 'Keep prescribed reliever inhalers accessible and consult a doctor if nighttime coughing persists.'
            : 'Consult a clinician promptly if anyone notices persistent coughing or wheezing.',
        ],
        costLevel: isHighBudget ? 'medium' : 'low',
        effortLevel: 'easy',
        impact: {
          metricLabel: 'Overnight bedroom PM2.5',
          valueText: '-34% overnight exposure',
          pm25ReductionPct: 34,
          co2AvoidedKgPerWeek: 0.3,
          confidence: 'high',
          assumptions: ['Concentrating filtration in a closed 150 sq ft bedroom multiplies air changes per hour.'],
          disclaimer: 'Estimated exposure drop — seek medical advice for any symptoms.',
        },
      },
    ],
    indoorHacks: [
      {
        id: 'h-seal',
        rank: 1,
        title: 'Weather-strip door & window gaps facing the street',
        category: 'Envelope sealing',
        whyItHelps: 'Unsealed sliding window tracks and under-door gaps leak outdoor smog continuously into living areas.',
        honestNote: 'Sealing leaks first cuts the load on any air purifier in half—free/low-cost physics before gadgets.',
        steps: [
          'Apply peel-and-stick EPDM foam tape along road-facing sliding window frames (under ₹300).',
          'Tuck a fabric door-snake or rubber sweep under the main entry door.',
        ],
        costLevel: 'low',
        effortLevel: 'easy',
        effectivenessScore: 88,
        impact: {
          metricLabel: 'Outdoor smog infiltration',
          valueText: '-24% passive leakage',
          pm25ReductionPct: 24,
          co2AvoidedKgPerWeek: 0.5,
          confidence: 'high',
          assumptions: ['Home with road-facing windows', 'Standard aluminum/timber sliding tracks'],
          disclaimer: 'Estimate — actual gain depends on existing frame gaps.',
        },
      },
      {
        id: 'h-diy-hepa',
        rank: 2,
        title: isHighBudget ? 'Dedicated True-HEPA H13 filtration in sleeping rooms' : 'DIY MERV-13 / HEPA box-fan filter under ₹2,000',
        category: 'Active filtration',
        whyItHelps: 'Mechanical HEPA or MERV-13 media physically traps 0.3–2.5 micron winter smoke particles.',
        honestNote: 'Honest science note: Houseplants (snake plant, areca palm) lift mood slightly, but lab studies show you would need hundreds per room to match one small HEPA fan for PM2.5.',
        steps: [
          isHighBudget
            ? 'Size a True-HEPA purifier for your bedroom CADR and run continuously overnight with doors shut.'
            : 'Tape a pleated MERV-13 or replacement HEPA cylinder filter securely to the intake side of a standard 14–16" fan.',
          'Run on medium speed in closed bedrooms 1 hour before sleep.',
        ],
        costLevel: isLowBudget ? 'low' : 'medium',
        effortLevel: 'moderate',
        effectivenessScore: 92,
        impact: {
          metricLabel: 'Bedroom PM2.5 concentration',
          valueText: '-38% indoor PM2.5',
          pm25ReductionPct: 38,
          co2AvoidedKgPerWeek: 0,
          confidence: 'high',
          assumptions: ['150 sq ft closed bedroom', 'Continuous 6–8h operation at medium fan speed'],
          disclaimer: 'Estimated filtration rate — depends on filter seal and room leakage.',
        },
      },
      {
        id: 'h-wet-mop',
        rank: 3,
        title: 'Switch from dry sweeping to daily damp mopping',
        category: 'Dust control',
        whyItHelps: 'Heavy coarse dust and brake/tire particles settle on floors and get kicked back into breathing height by brooms.',
        steps: ['Damp-mop high-traffic hallways with plain water once daily.', 'Keep outdoor shoes on an entry rack outside the living room.'],
        costLevel: 'free',
        effortLevel: 'easy',
        effectivenessScore: 74,
        impact: {
          metricLabel: 'Resuspended indoor dust',
          valueText: '-16% coarse PM10',
          pm25ReductionPct: 16,
          co2AvoidedKgPerWeek: 0,
          confidence: 'medium',
          assumptions: ['Daily damp mopping replacing dry broom', 'Shoes-off entry mat'],
          disclaimer: 'Estimate — supports general household dust reduction.',
        },
      },
      {
        id: 'h-no-smoke',
        rank: 4,
        title: 'Replace mosquito coils & incense with smokeless options',
        category: 'Source elimination',
        whyItHelps: 'A single smoldering mosquito coil or heavy incense stick in a closed room spikes indoor PM2.5 rapidly.',
        steps: ['Use window mesh screens or electric liquid vaporizers instead of burning coils.', 'Cover high-heat tempering pans and keep the exhaust fan running for 10 minutes post-cooking.'],
        costLevel: 'free',
        effortLevel: 'easy',
        effectivenessScore: 84,
        impact: {
          metricLabel: 'Acute indoor PM peaks',
          valueText: '-28% indoor smoke spikes',
          pm25ReductionPct: 28,
          co2AvoidedKgPerWeek: 0.6,
          confidence: 'high',
          assumptions: ['Eliminating nightly coils/incense in closed rooms'],
          disclaimer: 'Estimated source reduction based on indoor combustion studies.',
        },
      },
    ],
    alternatives: [
      {
        id: 'alt-commute',
        title: isCarOrBike ? 'Swap 3 short trips a week for Metro or school carpool' : 'Shift errands off peak traffic corridors',
        replaces: `Solo ${commuteLabel} city commutes`,
        whyItHelps: 'Cold winter car starts emit disproportionately high tailpipe PM2.5 and NOx before the catalytic converter warms up.',
        steps: ['Use metro + e-rickshaw for trips under 6 km, keeping N95 masks in your bag.', 'Coordinate a 2-family rotation for morning school drop-offs on your lane.'],
        costLevel: 'free',
        effortLevel: 'habit_shift',
        impact: {
          metricLabel: 'Tailpipe emissions avoided',
          valueText: '12.6 kg CO2/wk avoided',
          pm25ReductionPct: 11,
          co2AvoidedKgPerWeek: 12.6,
          confidence: 'high',
          assumptions: ['14 km average round trip replaced 3 days/week'],
          disclaimer: 'Estimated savings — scales with actual trip distance.',
        },
      },
      {
        id: 'alt-induction',
        title: isBiomass ? 'Transition primary cooking from wood/biomass to LPG or induction' : 'Shift simmering, tea & boiling tasks to an induction cooktop',
        replaces: isBiomass ? 'Smoky solid-fuel cooking' : 'Long-simmer LPG gas burner meals',
        whyItHelps: 'Induction eliminates open-flame NO2 and indoor heat/moisture buildup, protecting developing airways.',
        steps: ['Use a portable 1800W induction plate for tea, dal pressure-cooking, and boiling water.', 'Reserve open flame only for dishes needing direct heat—stretching fuel refills too.'],
        costLevel: 'low',
        effortLevel: 'easy',
        impact: {
          metricLabel: 'Indoor NO2 & fuel CO2',
          valueText: '3.6 kg CO2/wk avoided',
          pm25ReductionPct: 14,
          co2AvoidedKgPerWeek: 3.6,
          confidence: 'medium',
          assumptions: ['60% of daily boiling/simmering shifted to induction'],
          disclaimer: 'Estimated fuel & indoor exposure impact.',
        },
      },
      {
        id: 'alt-burning',
        title: 'Propose leaf composting & guard heaters in your RWA',
        replaces: 'Winter dry-leaf & evening watchman bonfires',
        whyItHelps: 'Smoldering leaf piles release dense ground-level smoke directly beneath apartment balconies.',
        steps: ['Share a simple wire-mesh leaf compost bin plan with your resident association.', 'Pool a small monthly fund so night security staff get electric heaters instead of burning scrap wood.'],
        costLevel: 'free',
        effortLevel: 'moderate',
        impact: {
          metricLabel: 'Neighborhood smoke avoided',
          valueText: '4.5 kg CO2/wk avoided',
          pm25ReductionPct: 9,
          co2AvoidedKgPerWeek: 4.5,
          confidence: 'medium',
          assumptions: ['Preventing 2 small neighborhood biomass burn events per week'],
          disclaimer: 'Estimated collective neighborhood benefit.',
        },
      },
    ],
  };
}

function buildTopActions(plan, lang) {
  const candidates = [
    ...(plan.routines || []).map((r) => ({
      id: r.id,
      title: r.title,
      category: lang === 'hi' ? 'दिनचर्या' : 'Routine',
      impactValueText: r.impact?.valueText || '',
      pm25ReductionPct: Number(r.impact?.pm25ReductionPct || 0),
      sectionAnchor: 'plan',
    })),
    ...(plan.indoorHacks || []).map((h) => ({
      id: h.id,
      title: h.title,
      category: lang === 'hi' ? 'घरेलू उपाय' : 'Indoor hack',
      impactValueText: h.impact?.valueText || '',
      pm25ReductionPct: Number(h.impact?.pm25ReductionPct || 0),
      sectionAnchor: 'indoor',
    })),
    ...(plan.alternatives || []).map((a) => ({
      id: a.id,
      title: a.title,
      category: lang === 'hi' ? 'टिकाऊ विकल्प' : 'Alternative',
      impactValueText: a.impact?.valueText || '',
      pm25ReductionPct: Number(a.impact?.pm25ReductionPct || 0),
      sectionAnchor: 'alternatives',
    })),
  ];
  return candidates.sort((a, b) => b.pm25ReductionPct - a.pm25ReductionPct).slice(0, 3);
}

export async function generatePlan({ profile = {}, aqi = {}, language = 'en' }) {
  const safeLang = language === 'hi' ? 'hi' : 'en';
  const baselineScore = getBaselineCleanAirScore(profile);
  const usAqi = Number(aqi?.usAqi ?? aqi?.aqi ?? 220);
  const pm25 = Number(aqi?.pollutants?.pm25 ?? aqi?.pm25 ?? 120);
  const pm10 = Number(aqi?.pollutants?.pm10 ?? aqi?.pm10 ?? 180);
  const no2 = Number(aqi?.pollutants?.no2 ?? aqi?.no2 ?? 40);
  const bestWindow = aqi?.bestAiringWindow || aqi?.bestOutdoorWindow || '12:00 PM – 2:00 PM';
  const dominant = aqi?.dominantPollutant || 'PM2.5';

  const langLabel = safeLang === 'hi' ? 'Hindi (Devanagari script, natural everyday Hindi)' : 'English';
  const systemInstruction = `You are Breathwise, a practical, caring, non-alarmist Urban Air Quality Advisor helping families cope with winter smog.
Always personalize to city, live AQI, household members, sensitivities, commute, cooking fuel, heating, home type, road-facing windows, budget, and top goal.
Prefer free and low-cost actions first. Include an honestNote on houseplants vs HEPA filtration in at least one indoorHack.
Never invent medical claims; mark numbers as estimates with transparent assumptions.
Write ALL text values strictly in ${langLabel}. Output strictly valid JSON matching the schema.`;

  const prompt = `Generate a personalized Clean-Air Daily Plan (familySummary, headlineAlert, 4 routines [morning, afternoon, evening, night], 4 ranked indoorHacks, and 3 alternatives) for:
Location: ${profile.city || 'Delhi'}, ${profile.country || 'India'}
Live Air Quality: US AQI ${usAqi} (${dominant} dominant, PM2.5: ${pm25} ug/m3, PM10: ${pm10} ug/m3, NO2: ${no2} ug/m3)
Best Airing Window Today: ${bestWindow}
Household: ${profile.adults ?? 2} adults, ${profile.children ?? 0} children, ${profile.elderly ?? 0} elderly, sensitivities: ${(profile.sensitivities || ['none']).join(', ')}, pets: ${profile.hasPets ? 'yes' : 'no'}
Lifestyle & Home: commute=${profile.commuteMode || 'car'}, cooking=${profile.cookingFuel || 'lpg'}, heating=${profile.heatingMethod || 'none'}, home=${profile.homeType || 'apartment'}, windowsFacingRoad=${Boolean(profile.windowsFacingRoad)}, budget=${profile.budget || 'medium'}, goal=${profile.goal || 'protect_kids'}
Language: ${langLabel}`;

  const aiResult = await generateStructuredJson({
    systemInstruction,
    contents: prompt,
    responseSchema: buildPlanSchema(),
  });

  const isAiValid =
    aiResult &&
    typeof aiResult.familySummary === 'string' &&
    Array.isArray(aiResult.routines) &&
    aiResult.routines.length > 0 &&
    Array.isArray(aiResult.indoorHacks) &&
    aiResult.indoorHacks.length > 0 &&
    Array.isArray(aiResult.alternatives) &&
    aiResult.alternatives.length > 0;

  const core = isAiValid ? aiResult : buildFallbackPlan(profile, aqi, safeLang);
  const source = isAiValid ? 'gemini' : 'fallback';
  const demo = !isAiValid;

  return {
    generatedAt: new Date().toISOString(),
    language: safeLang,
    familySummary: core.familySummary,
    headlineAlert: core.headlineAlert,
    routines: core.routines,
    indoorHacks: core.indoorHacks,
    alternatives: core.alternatives,
    impactSummary: {
      baselineScore,
      topActions: buildTopActions(core, safeLang),
    },
    source,
    demo,
  };
}
