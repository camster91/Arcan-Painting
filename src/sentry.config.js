/**
 * Sentry Configuration — Arcan Painting
 * Shared constants + helpers used by both client + server Sentry inits.
 */

export const SENTRY_DSN = typeof process !== 'undefined'
  ? process.env.SENTRY_DSN
  : import.meta.env?.NEXT_PUBLIC_SENTRY_DSN;

export const SENTRY_ENV = typeof process !== 'undefined'
  ? (process.env.NODE_ENV || 'development')
  : (import.meta.env?.MODE || 'development');

// Release version — git commit hash injected at build time
export const SENTRY_RELEASE = typeof process !== 'undefined'
  ? (process.env.SENTRY_RELEASE || process.env.GIT_COMMIT || 'unknown')
  : (import.meta.env?.NEXT_PUBLIC_SENTRY_RELEASE || 'unknown');

/**
 * Fields to scrub from all captured events.
 * Sentry's `beforeSend` will strip these keys from request data.
 */
export const SCRUB_FIELDS = [
  'password',
  'password_confirmation',
  'current_password',
  'new_password',
  'credit_card',
  'card_number',
  'cvv',
  'cvc',
  'ssn',
  'sin',
  'token',
  'secret',
  'authorization',
  'cookie',
];

/**
 * URLs whose errors we deliberately ignore (browser extensions, etc.)
 */
export const DENY_URLS = [
  // Chrome extensions
  /extensions\//i,
  /^chrome:\/\//i,
  /^chrome-extension:\/\//i,
  // Firefox extensions
  /^moz-extension:\/\//i,
  // Safari extensions
  /^safari-extension:\/\//i,
  // Common external noise
  /gtm\.js/i,
  /googletagmanager/i,
  /connect\.facebook/i,
  /graph\.facebook/i,
];

/**
 * Scrub sensitive data from Sentry events before they are sent.
 * Mutates `event` in place.
 */
export function scrubSensitiveData(event) {
  if (!event) return event;

  // Scrub request body
  if (event.request?.data) {
    event.request.data = scrubObject(event.request.data);
  }

  // Scrub request headers
  if (event.request?.headers) {
    event.request.headers = scrubObject(event.request.headers);
  }

  // Scrub extra context
  if (event.extra) {
    event.extra = scrubObject(event.extra);
  }

  return event;
}

function scrubObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key of Object.keys(result)) {
    const lower = key.toLowerCase();
    if (SCRUB_FIELDS.some(f => lower.includes(f))) {
      result[key] = '[Filtered]';
    } else if (typeof result[key] === 'object') {
      result[key] = scrubObject(result[key]);
    }
  }
  return result;
}

/**
 * Track error rate per endpoint for Sentry performance monitoring.
 * Simple sliding-window counter (in-memory, server-side only).
 */
const endpointErrorCounts = new Map(); // endpoint → { errors, total, windowStart }
const WINDOW_MS = 60_000; // 1-minute window
export const ERROR_RATE_THRESHOLD = 0.05; // 5%

export function trackEndpointError(endpoint, isError) {
  const now = Date.now();
  if (!endpointErrorCounts.has(endpoint)) {
    endpointErrorCounts.set(endpoint, { errors: 0, total: 0, windowStart: now });
  }
  const stats = endpointErrorCounts.get(endpoint);

  // Reset window if expired
  if (now - stats.windowStart > WINDOW_MS) {
    stats.errors = 0;
    stats.total = 0;
    stats.windowStart = now;
  }

  stats.total++;
  if (isError) stats.errors++;

  const rate = stats.total > 0 ? stats.errors / stats.total : 0;
  return { rate, errors: stats.errors, total: stats.total };
}
