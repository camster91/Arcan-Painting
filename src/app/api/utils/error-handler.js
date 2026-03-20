/**
 * API Error Handler — Arcan Painting
 *
 * Middleware + helpers for:
 * - Logging all 5xx errors to Sentry with rich context
 * - Tracking error rate per endpoint
 * - Alerting when error rate exceeds 5% threshold
 *
 * Usage in a route handler:
 *
 *   import { withErrorTracking, apiError } from '../utils/error-handler.js';
 *
 *   export const GET = withErrorTracking('GET /api/leads', async (request) => {
 *     // your handler logic
 *   });
 *
 * Or wrap the entire Hono app:
 *   app.use('*', sentryErrorMiddleware);
 */

import { trackEndpointError, ERROR_RATE_THRESHOLD } from '../../../sentry.config.js';

// Lazy-load Sentry server module (avoids breaking client bundles)
async function getSentry() {
  try {
    const mod = await import('../../../sentry.server.js');
    return mod;
  } catch {
    return null;
  }
}

/**
 * Log a 5xx error to Sentry with full context.
 *
 * @param {Error|string} error
 * @param {object} context - { endpoint, method, status, userId, responseTimeMs, requestId }
 */
export async function logApiError(error, context = {}) {
  const { endpoint, method, status = 500, userId, responseTimeMs, requestId } = context;

  // Track error rate
  const { rate, errors, total } = trackEndpointError(
    `${method || 'UNKNOWN'} ${endpoint || 'unknown'}`,
    true,
  );

  // Always log locally
  console.error(
    `[API Error] ${method} ${endpoint} → ${status}`,
    { userId, responseTimeMs, requestId },
    error,
  );

  const sentry = await getSentry();
  if (!sentry) return;

  sentry.captureServerError(
    error instanceof Error ? error : new Error(String(error)),
    {
      endpoint,
      method,
      status,
      userId,
      responseTimeMs,
      requestId,
      errorRate: `${(rate * 100).toFixed(1)}%`,
      errorCount: errors,
      totalRequests: total,
    },
  );

  // Alert if error rate breaches threshold
  if (rate > ERROR_RATE_THRESHOLD && total >= 10) {
    sentry.Sentry.captureMessage(
      `High error rate on ${method} ${endpoint}: ${(rate * 100).toFixed(1)}% (${errors}/${total})`,
      {
        level: 'warning',
        tags: {
          alert_type: 'error_rate_spike',
          endpoint,
          method,
        },
        extra: { rate, errors, total },
      },
    );
  }
}

/**
 * Track a successful request (for error rate denominator).
 */
export function logApiSuccess(endpoint, method) {
  trackEndpointError(`${method || 'UNKNOWN'} ${endpoint || 'unknown'}`, false);
}

/**
 * Higher-order function — wraps a route handler with error tracking.
 *
 * @param {string} label - Human-readable endpoint label e.g. 'GET /api/leads'
 * @param {Function} handler - async (request, ...args) => Response
 * @returns {Function}
 */
export function withErrorTracking(label, handler) {
  const [method, ...pathParts] = label.split(' ');
  const endpoint = pathParts.join(' ');

  return async function trackedHandler(request, ...args) {
    const startTime = Date.now();
    let userId;

    try {
      // Try to extract userId for context (non-fatal if auth utils unavailable)
      try {
        const { getCurrentUser } = await import('./auth.js');
        const user = await getCurrentUser(request);
        userId = user?.id;
      } catch {
        // Auth utils unavailable — continue without userId
      }

      const response = await handler(request, ...args);
      const responseTimeMs = Date.now() - startTime;
      const status = response?.status ?? 200;

      if (status >= 500) {
        await logApiError(
          new Error(`HTTP ${status} from ${label}`),
          { endpoint, method, status, userId, responseTimeMs },
        );
      } else {
        logApiSuccess(endpoint, method);
      }

      return response;
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      await logApiError(error, {
        endpoint,
        method,
        status: 500,
        userId,
        responseTimeMs,
      });

      // Re-throw so React Router can handle the error response
      throw error;
    }
  };
}

/**
 * Hono middleware — attach to app for automatic error capture on all routes.
 * Use in your Hono server entry:
 *
 *   import { sentryErrorMiddleware } from '../app/api/utils/error-handler.js';
 *   app.use('*', sentryErrorMiddleware);
 *   app.onError(sentryOnError);
 */
export async function sentryErrorMiddleware(c, next) {
  const startTime = Date.now();
  await next();
  const responseTimeMs = Date.now() - startTime;
  const status = c.res.status;

  if (status >= 500) {
    await logApiError(
      new Error(`HTTP ${status}`),
      {
        endpoint: c.req.path,
        method: c.req.method,
        status,
        responseTimeMs,
        requestId: c.req.header('x-request-id'),
      },
    );
  } else {
    logApiSuccess(c.req.path, c.req.method);
  }
}

/** Hono onError handler */
export async function sentryOnError(error, c) {
  await logApiError(error, {
    endpoint: c.req.path,
    method: c.req.method,
    status: 500,
    requestId: c.req.header('x-request-id'),
  });

  return c.json({ error: 'Internal server error' }, 500);
}

/**
 * Convenience helper: return a standard API error response
 * and log to Sentry if status >= 500.
 */
export async function apiError(message, status = 500, context = {}) {
  if (status >= 500) {
    await logApiError(new Error(message), { status, ...context });
  }
  return Response.json({ error: message }, { status });
}
