/**
 * Sentry — Server-Side Initialization
 * Import this at the top of the Hono server entry point.
 * Node.js only — do NOT import in browser bundles.
 */
import * as Sentry from '@sentry/node';
import { SENTRY_DSN, SENTRY_ENV, SENTRY_RELEASE, scrubSensitiveData } from './sentry.config.js';

let initialized = false;

export function initSentryServer() {
  if (initialized) return;
  initialized = true;

  if (!SENTRY_DSN) {
    if (SENTRY_ENV === 'development') {
      console.info('[Sentry] No SENTRY_DSN configured — skipping server init');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENV,
    release: SENTRY_RELEASE,

    // Capture 100% of transactions in dev, 10% in production
    tracesSampleRate: SENTRY_ENV === 'production' ? 0.1 : 1.0,

    integrations: [
      // Auto-instrument Node.js (http, fs, etc.)
      ...Sentry.getDefaultIntegrations({}),
    ],

    beforeSend(event) {
      return scrubSensitiveData(event);
    },

    initialScope: {
      tags: {
        app: 'arcan-painting',
        platform: 'server',
      },
    },
  });

  console.info(`[Sentry] Server initialized (env=${SENTRY_ENV}, release=${SENTRY_RELEASE})`);
}

/** Capture a server-side exception with rich context */
export function captureServerError(error, context = {}) {
  if (!SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    if (context.userId) scope.setUser({ id: String(context.userId) });
    if (context.endpoint) scope.setTag('endpoint', context.endpoint);
    if (context.method) scope.setTag('method', context.method);
    if (context.status) scope.setTag('status_code', String(context.status));
    if (context.requestId) scope.setTag('request_id', context.requestId);

    Object.entries(context).forEach(([key, val]) => {
      scope.setExtra(key, val);
    });

    Sentry.captureException(error);
  });
}

/** Add server breadcrumb */
export function addServerBreadcrumb(category, message, data = {}) {
  if (!SENTRY_DSN) return;
  Sentry.addBreadcrumb({ category, message, data, level: 'info' });
}

export { Sentry };
