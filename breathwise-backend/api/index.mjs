/**
 * Vercel Serverless adapter for breathwise-backend.
 * Re-uses the existing createAppServer() handler; Vercel passes (req, res)
 * in the same Node.js IncomingMessage / ServerResponse shape.
 */
import { loadEnv } from './lib/env.mjs';
import { createAppServer } from './server.mjs';

loadEnv();

const app = createAppServer();

export default function handler(req, res) {
  // Delegate to the http.Server's request listener directly
  app.emit('request', req, res);
}
