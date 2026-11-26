import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ENV_PATH = path.resolve(__dirname, '..', '.env');

/**
 * Loads key=value pairs from a local .env file without external dependencies.
 * Existing process.env values always take precedence (Cloud Run / CI safe).
 */
export function loadEnv(envPath = DEFAULT_ENV_PATH) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function getConfig() {
  const port = Number(process.env.PORT || 8080);
  const rawKey = (process.env.GEMINI_API_KEY || '').trim();
  const isPlaceholder =
    !rawKey ||
    rawKey === 'MY_GEMINI_API_KEY' ||
    rawKey === 'YOUR_GEMINI_API_KEY' ||
    rawKey === 'replace_me';

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return {
    port: Number.isFinite(port) && port > 0 ? port : 8080,
    geminiApiKey: isPlaceholder ? '' : rawKey,
    geminiModel: (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim(),
    allowedOrigins,
  };
}
