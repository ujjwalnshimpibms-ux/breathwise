# Breathwise Backend (Zero-Dependency Node.js)

Lightweight Node.js ESM API server for **Breathwise**, built strictly with Node built-ins (`node:http`, `node:fs`, `node:url`, `fetch`) and zero third-party packages.

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | HTTP port (Cloud Run injects `PORT` automatically) |
| `GEMINI_API_KEY` | *(empty)* | Google Gemini API key; if empty, `/api/plan` and `/api/chat` return deterministic personalized fallbacks with `source: "fallback", demo: true` |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Primary Gemini model (falls back to `gemini-2.5-flash-lite` on 429/503) |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000` | Comma-separated CORS allow-list |

## Run Locally

```bash
node server.mjs
```

## API Contract

### `GET /api/health` (also `/health`)
Returns server readiness and whether `GEMINI_API_KEY` is configured (never exposes the key).

### `GET /api/aqi?city=Delhi&lang=en` (optional `&lat=...&lon=...`)
Fetches live Open-Meteo US AQI and hourly forecast (5-minute cache, 6s upstream timeout) with city-aware fallback.

```json
{
  "city": "Delhi",
  "country": "India",
  "latitude": 28.6139,
  "longitude": 77.209,
  "usAqi": 268,
  "category": { "id": "very_unhealthy", "label": "Very Unhealthy", "labelHi": "बहुत अस्वास्थ्यकर" },
  "pollutants": { "pm25": 186, "pm10": 275, "no2": 64, "o3": 28 },
  "dominantPollutant": "PM2.5",
  "bestAiringWindow": "12:00 PM – 2:00 PM",
  "hourly": [{ "time": "12:00", "hour": 12, "aqi": 210, "pm25": 138 }],
  "updatedAt": "2026-11-26T09:00:00.000Z",
  "source": "live",
  "demo": false,
  "sourceLabel": "Live Open-Meteo AQI"
}
```

### `POST /api/plan`
Body: `{ "profile": { ... }, "aqi": { ... }, "language": "en" | "hi" }`
Returns `{ generatedAt, language, familySummary, headlineAlert, routines, indoorHacks, alternatives, impactSummary: { baselineScore, topActions }, source: "gemini" | "fallback", demo: boolean }`.

### `POST /api/whatif`
Body: `{ "selectedIds": { "drive_less": 3, "seal_filter_bedroom": 1 } | string[], "profile": { ... }, "currentPm25": 150 }`
Returns `{ selectedIds, pm25ReductionPct, indoorPm25SavedUg, co2AvoidedKgPerWeek, rupeesSavedPerWeek, cleanAirScore, baselineScore, source: "calculated", demo: false }`.

### `POST /api/chat`
Body: `{ "message": "hi", "history": [...], "profile": { ... }, "aqi": { ... }, "language": "en" | "hi" }`
Returns `{ answer, steps, whyThisHelps, disclaimer, source: "gemini" | "fallback", demo: boolean }`.

### `POST /api/community`
Body: `{ "households": 60, "actionIds": ["zero_burning", "school_carpool"] }`
Returns `{ households, actionIds, monthlyCo2AvoidedKg, monthlyPmDustPreventedKg, equivalentTreesPlanted, streetDustReductionPct, source: "calculated", demo: false }`.

## Cloud Run Deployment

```bash
gcloud run deploy breathwise-backend \
  --source ./breathwise-backend \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest \
  --set-env-vars ALLOWED_ORIGINS=https://your-frontend-domain.web.app
```
