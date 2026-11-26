import http from 'node:http';
import { loadEnv, getConfig } from './lib/env.mjs';
import { applySecurityAndCorsHeaders } from './lib/cors.mjs';
import { getAqiReading, searchCities, reverseGeocode } from './lib/aqi.mjs';
import { generatePlan } from './lib/plan.mjs';
import { calculateWhatIf } from './lib/whatif.mjs';
import { handleChat } from './lib/chat.mjs';
import { calculateCommunity } from './lib/community.mjs';
import { hasGeminiKey } from './lib/gemini.mjs';

loadEnv();

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB

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
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(JSON.parse(text));
      } catch {
        const err = new Error('Invalid JSON body');
        err.status = 400;
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

export function createAppServer() {
  return http.createServer(async (req, res) => {
    const start = Date.now();
    const { allowedOrigins } = getConfig();
    const corsOk = applySecurityAndCorsHeaders(req, res, allowedOrigins);

    if (req.method === 'OPTIONS') {
      res.writeHead(corsOk ? 204 : 403);
      res.end();
      return;
    }

    const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = reqUrl.pathname;

    try {
      if (req.method === 'GET' && (pathname === '/health' || pathname === '/api/health')) {
        sendJson(res, 200, {
          status: 'ok',
          service: 'breathwise-backend',
          hasGeminiKey: hasGeminiKey(),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (req.method === 'GET' && pathname === '/api/cities') {
        const q = reqUrl.searchParams.get('q') || '';
        const data = await searchCities(q);
        sendJson(res, 200, data);
        return;
      }

      if (req.method === 'GET' && pathname === '/api/cities/reverse') {
        const lat = Number(reqUrl.searchParams.get('lat'));
        const lon = Number(reqUrl.searchParams.get('lon'));
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          sendJson(res, 400, { error: 'Valid lat and lon query parameters are required.' });
          return;
        }
        const data = await reverseGeocode(lat, lon);
        sendJson(res, 200, data);
        return;
      }

      if (req.method === 'GET' && pathname === '/api/aqi') {
        const city = reqUrl.searchParams.get('city') || 'Delhi';
        const lat = reqUrl.searchParams.get('lat');
        const lon = reqUrl.searchParams.get('lon');
        const lang = reqUrl.searchParams.get('lang') || 'en';
        const data = await getAqiReading({ city, lat, lon, lang });
        sendJson(res, 200, data);
        return;
      }

      if (req.method === 'POST' && pathname === '/api/plan') {
        const body = await readJsonBody(req);
        if (!body.profile || typeof body.profile !== 'object') {
          sendJson(res, 400, { error: 'Missing household profile.' });
          return;
        }
        const data = await generatePlan({
          profile: body.profile,
          aqi: body.aqi || {},
          language: body.language || 'en',
        });
        sendJson(res, 200, data);
        return;
      }

      if (req.method === 'POST' && pathname === '/api/whatif') {
        const body = await readJsonBody(req);
        const data = calculateWhatIf({
          selectedIds: body.selectedIds ?? {},
          profile: body.profile || {},
          currentPm25: body.currentPm25 ?? 150,
        });
        sendJson(res, 200, data);
        return;
      }

      if (req.method === 'POST' && pathname === '/api/chat') {
        const body = await readJsonBody(req);
        const message = body.message ?? body.question;
        if (!message || !String(message).trim()) {
          sendJson(res, 400, { error: 'message is required.' });
          return;
        }
        const data = await handleChat({
          message,
          history: body.history || [],
          profile: body.profile || {},
          aqi: body.aqi || {},
          language: body.language || 'en',
        });
        sendJson(res, 200, data);
        return;
      }

      if (req.method === 'POST' && pathname === '/api/community') {
        const body = await readJsonBody(req);
        const data = calculateCommunity({
          households: body.households ?? 60,
          actionIds: body.actionIds ?? [],
        });
        sendJson(res, 200, data);
        return;
      }

      sendJson(res, 404, { error: `Route not found: ${req.method} ${pathname}` });
    } catch (err) {
      const status = Number(err?.status) || 500;
      const message = err instanceof Error ? err.message : 'Internal server error';
      console.error(`[${req.method} ${pathname}] ${status}:`, message);
      if (!res.headersSent) {
        sendJson(res, status, { error: message });
      }
    } finally {
      const durationMs = Date.now() - start;
      console.log(`${req.method} ${pathname} ${res.statusCode} ${durationMs}ms`);
    }
  });
}

// Start server only when executed directly (not when imported by tests)
const isEntry = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isEntry) {
  const { port } = getConfig();
  const server = createAppServer();
  server.listen(port, '0.0.0.0', () => {
    console.log(
      `Breathwise backend listening on http://0.0.0.0:${port} (Gemini: ${
        hasGeminiKey() ? 'configured' : 'offline fallback mode'
      })`
    );
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
