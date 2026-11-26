/**
 * Zero-dependency CORS and security headers middleware helper.
 */
export function applySecurityAndCorsHeaders(req, res, allowedOrigins) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const requestOrigin = (req.headers.origin || '').replace(/\/+$/, '');
  const allowAll = allowedOrigins.includes('*');

  if (allowAll) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (!requestOrigin || allowAll || allowedOrigins.includes(requestOrigin)) {
    return true;
  }
  return false;
}
