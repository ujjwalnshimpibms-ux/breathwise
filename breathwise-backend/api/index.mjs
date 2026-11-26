/**
 * Vercel Serverless adapter for breathwise-backend.
 * Directly imports the route-handler logic (no http.createServer needed).
 */
import { loadEnv, getConfig } from '../lib/env.mjs';
import { applySecurityAndCorsHeaders } from '../lib/cors.mjs';
import { getAqiReading, searchCities, reverseGeocode } from '../lib/aqi.mjs';
import { generatePlan } from '../lib/plan.mjs';
import { calculateWhatIf } from '../lib/whatif.mjs';
import { handleChat } from '../lib/chat.mjs';
import { calculateCommunity } from '../lib/community.mjs';
import { hasGeminiKey } from '../lib/gemini.mjs';

loadEnv();

const MAX_BODY_BYTES = 1024 * 1024;

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        const err = new Error('Payload too large');
        err.status = 413;
        reject(err);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) { resolve({}); return; }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        const err = new Error('Invalid JSON body');
        err.status = 400;
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  const { allowedOrigins } = getConfig();
  const corsOk = applySecurityAndCorsHeaders(req, res, allowedOrigins);

  if (req.method === 'OPTIONS') {
    res.writeHead(corsOk ? 204 : 403);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;

  try {
    if (req.method === 'GET' && (pathname === '/health' || pathname === '/api/health')) {
      return sendJson(res, 200, {
        status: 'ok',
        service: 'breathwise-backend',
        hasGeminiKey: hasGeminiKey(),
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === 'GET' && pathname === '/api/cities') {
      const q = reqUrl.searchParams.get('q') || '';
      return sendJson(res, 200, await searchCities(q));
    }

    if (req.method === 'GET' && pathname === '/api/cities/reverse') {
      const lat = Number(reqUrl.searchParams.get('lat'));
      const lon = Number(reqUrl.searchParams.get('lon'));
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return sendJson(res, 400, { error: 'Valid lat and lon required.' });
      }
      return sendJson(res, 200, await reverseGeocode(lat, lon));
    }

    if (req.method === 'GET' && pathname === '/api/aqi') {
      const city = reqUrl.searchParams.get('city') || 'Delhi';
      const lat = reqUrl.searchParams.get('lat');
      const lon = reqUrl.searchParams.get('lon');
      const lang = reqUrl.searchParams.get('lang') || 'en';
      return sendJson(res, 200, await getAqiReading({ city, lat, lon, lang }));
    }

    if (req.method === 'POST' && pathname === '/api/plan') {
      const body = await readJsonBody(req);
      if (!body.profile || typeof body.profile !== 'object') {
        return sendJson(res, 400, { error: 'Missing household profile.' });
      }
      return sendJson(res, 200, await generatePlan({
        profile: body.profile,
        aqi: body.aqi || {},
        language: body.language || 'en',
      }));
    }

    if (req.method === 'POST' && pathname === '/api/whatif') {
      const body = await readJsonBody(req);
      return sendJson(res, 200, calculateWhatIf({
        selectedIds: body.selectedIds ?? {},
        profile: body.profile || {},
        currentPm25: body.currentPm25 ?? 150,
      }));
    }

    if (req.method === 'POST' && pathname === '/api/chat') {
      const body = await readJsonBody(req);
      const message = body.message ?? body.question;
      if (!message || !String(message).trim()) {
        return sendJson(res, 400, { error: 'message is required.' });
      }
      return sendJson(res, 200, await handleChat({
        message,
        history: body.history || [],
        profile: body.profile || {},
        aqi: body.aqi || {},
        language: body.language || 'en',
      }));
    }

    if (req.method === 'POST' && pathname === '/api/community') {
      const body = await readJsonBody(req);
      return sendJson(res, 200, calculateCommunity({
        households: body.households ?? 60,
        actionIds: body.actionIds ?? [],
      }));
    }

    sendJson(res, 404, { error: `Route not found: ${req.method} ${pathname}` });
  } catch (err) {
    const status = Number(err?.status) || 500;
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error(`[${req.method} ${pathname}] ${status}:`, message);
    if (!res.headersSent) sendJson(res, status, { error: message });
  }
}
