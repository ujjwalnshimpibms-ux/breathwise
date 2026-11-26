/**
 * Shared HTTP client for Breathwise backend calls.
 * Enforces VITE_API_URL (default http://localhost:8080) and a strict 20s timeout.
 */

export const API_TIMEOUT_MS = 20000;
export const SKELETON_MAX_MS = 15000;

export function getApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8080';
  return configured.trim().replace(/\/+$/, '');
}

export async function apiFetchJson<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST';
    body?: unknown;
    timeoutMs?: number;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const { method = 'GET', body, timeoutMs = API_TIMEOUT_MS, signal } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      window.clearTimeout(timer);
      throw new DOMException('Aborted', 'AbortError');
    }
    signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errBody = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(errBody.error || `Backend request failed (${response.status})`);
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }
  }
}
