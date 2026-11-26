import { getConfig } from './env.mjs';

const GEMINI_TIMEOUT_MS = 12000;
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

export function hasGeminiKey() {
  return Boolean(getConfig().geminiApiKey);
}

function isRetryableStatus(status) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function callGeminiOnce({ apiKey, model, systemInstruction, contents, responseSchema }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: contents }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
      ...(responseSchema ? { responseSchema } : {}),
    },
    ...(systemInstruction
      ? {
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
        }
      : {}),
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      const error = new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 200)}`);
      error.status = res.status;
      throw error;
    }

    const json = await res.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('Empty Gemini response text');
    }

    return JSON.parse(rawText.trim());
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Invokes Gemini REST API without third-party SDKs.
 * Returns null if GEMINI_API_KEY is unset or if generation fails, allowing callers to fall back cleanly.
 */
export async function generateStructuredJson({ systemInstruction, contents, responseSchema }) {
  const { geminiApiKey, geminiModel } = getConfig();
  if (!geminiApiKey) {
    return null;
  }

  try {
    return await callGeminiOnce({
      apiKey: geminiApiKey,
      model: geminiModel,
      systemInstruction,
      contents,
      responseSchema,
    });
  } catch (err) {
    if (err?.status && !isRetryableStatus(err.status)) {
      console.warn('[gemini] non-retryable error, using fallback:', err.message);
      return null;
    }
    try {
      return await callGeminiOnce({
        apiKey: geminiApiKey,
        model: FALLBACK_MODEL,
        systemInstruction,
        contents,
        responseSchema,
      });
    } catch (retryErr) {
      console.warn('[gemini] fallback model failed, using offline fallback:', retryErr.message);
      return null;
    }
  }
}
