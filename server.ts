import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  AirQualityData,
  CleanAirPlan,
  Language,
  PlanSectionKey,
  UserProfile,
} from './src/types/saans.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isTransientHighDemandError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand') || msg.includes('429');
}

async function generateWithRetry(
  ai: GoogleGenAI,
  contents: string,
  config: Record<string, unknown>
) {
  try {
    return await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        ...config,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
  } catch (err) {
    if (!isTransientHighDemandError(err)) throw err;
    await new Promise((r) => setTimeout(r, 600));
    try {
      return await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config,
      });
    } catch {
      throw err;
    }
  }
}

async function streamWithRetry(
  ai: GoogleGenAI,
  contents: string,
  config: Record<string, unknown>
) {
  try {
    return await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents,
      config: {
        ...config,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
  } catch (err) {
    if (!isTransientHighDemandError(err)) throw err;
    await new Promise((r) => setTimeout(r, 600));
    return await ai.models.generateContentStream({
      model: 'gemini-3.1-flash-lite',
      contents,
      config,
    });
  }
}

function buildImpactSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      metricLabel: { type: Type.STRING, description: 'Short label e.g. Personal PM2.5 exposure' },
      valueText: { type: Type.STRING, description: 'Concise estimate e.g. -24% exposure or 12 kg CO2/wk' },
      pm25ReductionPct: { type: Type.INTEGER, description: 'Estimated integer percentage 0-60' },
      co2AvoidedKgPerWeek: { type: Type.NUMBER, description: 'Estimated kg CO2 avoided per week' },
      confidence: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
      assumptions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '2-3 transparent assumptions used for this estimate',
      },
      disclaimer: { type: Type.STRING, description: 'Brief label noting this is an estimate, not a medical claim' },
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

function buildRoutinesSectionSchema() {
  const impactSchema = buildImpactSchema();
  return {
    type: Type.OBJECT,
    properties: {
      familySummary: {
        type: Type.STRING,
        description: 'Plain-language 1-2 sentence explanation of what today AQI means specifically for this family.',
      },
      headlineAlert: {
        type: Type.STRING,
        description: 'Calm, practical 1-line priority action for today.',
      },
      routines: {
        type: Type.ARRAY,
        description: 'Exactly 4 items: morning, afternoon, evening, night.',
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            timeOfDay: { type: Type.STRING, enum: ['morning', 'afternoon', 'evening', 'night'] },
            windowLabel: { type: Type.STRING },
            title: { type: Type.STRING },
            whyItHelps: { type: Type.STRING },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            costLevel: { type: Type.STRING, enum: ['free', 'low', 'medium', 'high'] },
            effortLevel: { type: Type.STRING, enum: ['easy', 'moderate', 'habit_shift'] },
            impact: impactSchema,
          },
          required: ['id', 'timeOfDay', 'windowLabel', 'title', 'whyItHelps', 'steps', 'costLevel', 'effortLevel', 'impact'],
        },
      },
    },
    required: ['familySummary', 'headlineAlert', 'routines'],
  };
}

function buildIndoorHacksSectionSchema() {
  const impactSchema = buildImpactSchema();
  return {
    type: Type.OBJECT,
    properties: {
      indoorHacks: {
        type: Type.ARRAY,
        description: '4 ranked indoor air quality hacks ordered by effectiveness and cost.',
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            rank: { type: Type.INTEGER },
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            whyItHelps: { type: Type.STRING },
            honestNote: { type: Type.STRING },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            costLevel: { type: Type.STRING, enum: ['free', 'low', 'medium', 'high'] },
            effortLevel: { type: Type.STRING, enum: ['easy', 'moderate', 'habit_shift'] },
            effectivenessScore: { type: Type.INTEGER },
            impact: impactSchema,
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
    },
    required: ['indoorHacks'],
  };
}

function buildAlternativesSectionSchema() {
  const impactSchema = buildImpactSchema();
  return {
    type: Type.OBJECT,
    properties: {
      alternatives: {
        type: Type.ARRAY,
        description: '3 tailored sustainable alternatives matching the user lifestyle and budget.',
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            replaces: { type: Type.STRING },
            whyItHelps: { type: Type.STRING },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            costLevel: { type: Type.STRING, enum: ['free', 'low', 'medium', 'high'] },
            effortLevel: { type: Type.STRING, enum: ['easy', 'moderate', 'habit_shift'] },
            impact: impactSchema,
          },
          required: ['id', 'title', 'replaces', 'whyItHelps', 'steps', 'costLevel', 'effortLevel', 'impact'],
        },
      },
    },
    required: ['alternatives'],
  };
}

function buildPlanResponseSchema() {
  const r = buildRoutinesSectionSchema();
  const h = buildIndoorHacksSectionSchema();
  const a = buildAlternativesSectionSchema();
  return {
    type: Type.OBJECT,
    properties: {
      ...r.properties,
      ...h.properties,
      ...a.properties,
    },
    required: ['familySummary', 'headlineAlert', 'routines', 'indoorHacks', 'alternatives'],
  };
}

function buildChatResponseSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      answer: { type: Type.STRING },
      steps: { type: Type.ARRAY, items: { type: Type.STRING } },
      whyThisHelps: { type: Type.STRING },
      healthDisclaimer: { type: Type.STRING },
    },
    required: ['answer', 'steps', 'whyThisHelps', 'healthDisclaimer'],
  };
}

function buildProfilePromptContext(profile: UserProfile, aqiData: AirQualityData): string {
  return `Location: ${profile.city}, ${profile.country}
Live Air Quality: US AQI ${aqiData.aqi} (${aqiData.dominantPollutant} dominant, PM2.5: ${aqiData.pm25} ug/m3, PM10: ${aqiData.pm10} ug/m3, NO2: ${aqiData.no2} ug/m3)
Best Outdoor Window Today: ${aqiData.bestOutdoorWindow}
Household: ${profile.adults} adults, ${profile.children} children, ${profile.elderly} elderly, sensitivities: ${profile.sensitivities.join(', ')}, pets: ${profile.hasPets ? 'yes' : 'no'}
Lifestyle & Home: commute=${profile.commuteMode}, cooking=${profile.cookingFuel}, heating=${profile.heatingMethod}, home=${profile.homeType}, windowsFacingRoad=${profile.windowsFacingRoad}, budget=${profile.budget}, goal=${profile.goal}`;
}

function parseStreamedChatSections(fullText: string, language: Language) {
  const stepsMarker = '---STEPS---';
  const whyMarker = '---WHY---';
  const discMarker = '---DISCLAIMER---';

  const stepsIdx = fullText.indexOf(stepsMarker);
  const whyIdx = fullText.indexOf(whyMarker);
  const discIdx = fullText.indexOf(discMarker);

  const answer = (stepsIdx >= 0 ? fullText.slice(0, stepsIdx) : fullText).trim();

  let steps: string[] = [];
  if (stepsIdx >= 0) {
    const end = whyIdx >= 0 ? whyIdx : discIdx >= 0 ? discIdx : fullText.length;
    steps = fullText
      .slice(stepsIdx + stepsMarker.length, end)
      .split('\n')
      .map((line) => line.replace(/^[-•*\d.)\s]+/, '').trim())
      .filter((line) => line.length > 2)
      .slice(0, 4);
  }

  let whyThisHelps = '';
  if (whyIdx >= 0) {
    const end = discIdx >= 0 ? discIdx : fullText.length;
    whyThisHelps = fullText.slice(whyIdx + whyMarker.length, end).trim();
  } else {
    whyThisHelps =
      language === 'hi'
        ? 'सही समय और आसान बचाव अपनाने से घर के अंदर PM2.5 का संपर्क घटता है।'
        : 'Pairing timing adjustments with source control reduces fine particle exposure indoors and in transit.';
  }

  let healthDisclaimer = '';
  if (discIdx >= 0) {
    healthDisclaimer = fullText.slice(discIdx + discMarker.length).trim();
  } else {
    healthDisclaimer =
      language === 'hi'
        ? 'यह सामान्य जानकारी है, चिकित्सीय सलाह नहीं। किसी भी लक्षण पर डॉक्टर से मिलें।'
        : 'General air-quality guidance only, not medical advice. Consult a doctor for breathing or chest symptoms.';
  }

  return { answer, steps, whyThisHelps, healthDisclaimer };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'Breathwise', hasGeminiKey: Boolean(getGeminiClient()) });
  });

  app.post('/api/ai/plan-section', async (req, res) => {
    try {
      const { section, profile, aqiData, language } = req.body as {
        section?: PlanSectionKey;
        profile?: UserProfile;
        aqiData?: AirQualityData;
        language?: Language;
      };

      if (!section || !profile || !aqiData) {
        res.status(400).json({ error: 'Missing section, household profile, or air quality data.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
          code: 'MISSING_API_KEY',
        });
        return;
      }

      const langLabel = language === 'hi' ? 'Hindi (Devanagari script, natural everyday Hindi)' : 'English';
      const systemInstruction = `You are Breathwise, a practical, caring, non-alarmist Urban Air Quality Advisor helping families cope with winter smog.
Always personalize to city, live AQI, household members, sensitivities, commute, cooking fuel, heating, home type, road-facing windows, budget, and top goal.
Prefer free and low-cost actions first. Never invent medical claims; mark numbers as estimates with transparent assumptions.
Write ALL text values strictly in ${langLabel}. Output strictly valid JSON matching the schema.`;

      const schema =
        section === 'routines'
          ? buildRoutinesSectionSchema()
          : section === 'indoorHacks'
            ? buildIndoorHacksSectionSchema()
            : buildAlternativesSectionSchema();

      const sectionPrompt =
        section === 'routines'
          ? `Generate the personalized Today's Plan (familySummary, headlineAlert, and 4 time-of-day routines: morning, afternoon, evening, night) for:\n${buildProfilePromptContext(profile, aqiData)}\nLanguage: ${langLabel}`
          : section === 'indoorHacks'
            ? `Generate 4 ranked Indoor Air Hacks ordered by effectiveness and cost (include an honest note on houseplants vs HEPA filtration in at least one item) for:\n${buildProfilePromptContext(profile, aqiData)}\nLanguage: ${langLabel}`
            : `Generate 3 tailored Sustainable Alternatives matching this household's commute, fuel, heating, and budget:\n${buildProfilePromptContext(profile, aqiData)}\nLanguage: ${langLabel}`;

      const response = await generateWithRetry(ai, sectionPrompt, {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: schema,
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      res.json(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate plan section';
      console.error('[api/ai/plan-section] error:', message);
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/plan', async (req, res) => {
    try {
      const { profile, aqiData, language } = req.body as {
        profile?: UserProfile;
        aqiData?: AirQualityData;
        language?: Language;
      };

      if (!profile || !aqiData) {
        res.status(400).json({ error: 'Missing household profile or air quality data.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
          code: 'MISSING_API_KEY',
        });
        return;
      }

      const langLabel = language === 'hi' ? 'Hindi (Devanagari script, natural everyday Hindi)' : 'English';
      const systemInstruction = `You are Breathwise, a practical, caring, non-alarmist Urban Air Quality Advisor helping families cope with winter smog.
Always personalize every suggestion to city, AQI, household members, sensitivities, commute, cooking fuel, heating, home type, road-facing windows, budget, and top goal.
Write ALL text values strictly in ${langLabel}. Output strictly valid JSON matching the schema.`;

      const prompt = `Generate a personalized Clean-Air Daily Plan for:\n${buildProfilePromptContext(profile, aqiData)}\nLanguage: ${langLabel}`;

      const response = await generateWithRetry(ai, prompt, {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: buildPlanResponseSchema(),
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw) as Omit<CleanAirPlan, 'generatedAt' | 'language'>;

      const plan: CleanAirPlan = {
        ...parsed,
        generatedAt: new Date().toISOString(),
        language: language === 'hi' ? 'hi' : 'en',
        isFallback: false,
      };

      res.json(plan);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate plan';
      console.error('[api/ai/plan] error:', message);
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/chat-stream', async (req, res) => {
    try {
      const { profile, aqiData, language, history, question } = req.body as {
        profile?: UserProfile;
        aqiData?: AirQualityData;
        language?: Language;
        history?: Array<{ role: string; text: string }>;
        question?: string;
      };

      if (!profile || !aqiData || !question || !question.trim()) {
        res.status(400).json({ error: 'Question, profile, and AQI data are required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
          code: 'MISSING_API_KEY',
        });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');

      const langLabel = language === 'hi' ? 'Hindi (Devanagari script, warm everyday Hindi)' : 'English';
      const systemInstruction = `You are Breathwise, a caring, practical, non-alarmist Urban Air Quality Advisor.
Tailor every answer to the user's location, live AQI, household members, sensitivities, budget, and lifestyle.
Prefer affordable, actionable steps. Write ALL text in ${langLabel}.
Format your response cleanly with these exact section markers:
[2-3 sentence direct, reassuring answer]
---STEPS---
- [Step 1]
- [Step 2]
- [Step 3]
---WHY---
[1-2 sentences explaining the estimated PM2.5 or emissions impact]
---DISCLAIMER---
[Brief gentle disclaimer reminding to consult a doctor for symptoms]`;

      const recentHistory = (history ?? [])
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'User' : 'Breathwise'}: ${m.text}`)
        .join('\n');

      const prompt = `Context:\n${buildProfilePromptContext(profile, aqiData)}\n${
        recentHistory ? `\nRecent conversation:\n${recentHistory}` : ''
      }\n\nUser question: ${question.trim()}`;

      const stream = await streamWithRetry(ai, prompt, {
        systemInstruction,
      });

      let fullText = '';
      let emittedAnswerLen = 0;
      const stepsMarker = '---STEPS---';

      for await (const chunk of stream) {
        const piece = chunk.text ?? '';
        if (!piece) continue;
        fullText += piece;

        const markerIdx = fullText.indexOf(stepsMarker);
        const safeAnswerEnd = markerIdx >= 0 ? markerIdx : Math.max(0, fullText.length - stepsMarker.length);
        if (safeAnswerEnd > emittedAnswerLen) {
          const delta = fullText.slice(emittedAnswerLen, safeAnswerEnd);
          emittedAnswerLen = safeAnswerEnd;
          res.write(`data: ${JSON.stringify({ type: 'chunk', text: delta })}\n\n`);
        }
      }

      const parsed = parseStreamedChatSections(fullText, language === 'hi' ? 'hi' : 'en');
      if (parsed.answer.length > emittedAnswerLen) {
        res.write(
          `data: ${JSON.stringify({
            type: 'chunk',
            text: parsed.answer.slice(emittedAnswerLen),
          })}\n\n`
        );
      }

      res.write(`data: ${JSON.stringify({ type: 'meta', ...parsed })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Streaming failed';
      console.error('[api/ai/chat-stream] error:', message);
      if (!res.headersSent) {
        res.status(502).json({ error: message });
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`);
        res.end();
      }
    }
  });

  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { profile, aqiData, language, history, question } = req.body as {
        profile?: UserProfile;
        aqiData?: AirQualityData;
        language?: Language;
        history?: Array<{ role: string; text: string }>;
        question?: string;
      };

      if (!profile || !aqiData || !question || !question.trim()) {
        res.status(400).json({ error: 'Question, profile, and AQI data are required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
          code: 'MISSING_API_KEY',
        });
        return;
      }

      const langLabel = language === 'hi' ? 'Hindi (Devanagari script, warm everyday Hindi)' : 'English';
      const systemInstruction = `You are Breathwise, a caring, practical, non-alarmist Urban Air Quality Advisor.
Tailor every answer to the user's location, live AQI, household members, sensitivities, budget, and lifestyle.
Always include a clear "whyThisHelps" impact explanation and a gentle "healthDisclaimer". Write ALL JSON string fields in ${langLabel}.`;

      const recentHistory = (history ?? [])
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'User' : 'Breathwise'}: ${m.text}`)
        .join('\n');

      const prompt = `Context:\n${buildProfilePromptContext(profile, aqiData)}\n${
        recentHistory ? `\nRecent conversation:\n${recentHistory}` : ''
      }\n\nUser question: ${question.trim()}`;

      const response = await generateWithRetry(ai, prompt, {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: buildChatResponseSchema(),
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      res.json(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to answer question';
      console.error('[api/ai/chat] error:', message);
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Breathwise server running at http://localhost:${PORT}`);
  });
}

startServer();
