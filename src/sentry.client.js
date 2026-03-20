/**
 * Sentry — Client-Side Initialization
 * Import this at the top of root.tsx (client entry point).
 * Only runs in the browser.
 */
import * as Sentry from '@sentry/react';
import { SENTRY_DSN, SENTRY_ENV, SENTRY_RELEASE, DENY_URLS, scrubSensitiveData } from './sentry.config.js';

let initialized = false;

export function initSentryClient() {
  // Only initialize once + only in browser
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Don't init if DSN isn't configured
  if (!SENTRY_DSN) {
    if (SENTRY_ENV === 'development') {
      console.info('[Sentry] No SENTRY_DSN configured — skipping client init');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENV,
    release: SENTRY_RELEASE,

    // Capture 100% of errors, 10% of performance transactions in production
    tracesSampleRate: SENTRY_ENV === 'production' ? 0.1 : 1.0,

    // Replay — 1% sessions normally, 100% on errors
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,

    // Performance: Web Vitals (LCP, FID, CLS)
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,      // Privacy: mask text content in replays
        blockAllMedia: false,
      }),
    ],

    // Ignore noise from browser extensions and third-party scripts
    denyUrls: DENY_URLS,

    // Scrub sensitive fields before sending
    beforeSend(event, hint) {
      // Don't send errors in development (log locally instead)
      if (SENTRY_ENV === 'development') {
        console.warn('[Sentry] Would capture (dev mode):', hint?.originalException || event);
        return null;
      }
      return scrubSensitiveData(event);
    },

    // Add extra context to all events
    initialScope: {
      tags: {
        app: 'arcan-painting',
        platform: 'web',
      },
    },
  });

  // Capture unhandled promise rejections (belt-and-suspenders)
  window.addEventListener('unhandledrejection', (event) => {
    Sentry.captureException(event.reason, {
      tags: { type: 'unhandled_promise_rejection' },
    });
  });
}

// ── Custom Event Helpers ──────────────────────────────────────────────────────

/** Track login success/failure */
export function trackLogin({ success, userId, username, reason }) {
  Sentry.addBreadcrumb({
    category: 'auth',
    message: success ? 'Login successful' : `Login failed: ${reason}`,
    level: success ? 'info' : 'warning',
    data: { userId, username },
  });

  if (!success) {
    Sentry.captureMessage(`Login failed: ${reason}`, {
      level: 'warning',
      tags: { event: 'login_failure' },
      user: username ? { username } : undefined,
    });
  }

  if (success && userId) {
    Sentry.setUser({ id: String(userId), username });
  }
}

/** Clear user context on logout */
export function trackLogout() {
  Sentry.addBreadcrumb({ category: 'auth', message: 'User logged out', level: 'info' });
  Sentry.setUser(null);
}

/** Track lead lifecycle events */
export function trackLeadEvent(action, leadId, extra = {}) {
  Sentry.addBreadcrumb({
    category: 'leads',
    message: `Lead ${action}: ${leadId}`,
    level: 'info',
    data: { leadId, ...extra },
  });
}

/** Track estimate acceptance */
export function trackEstimateAccepted(estimateId, amount) {
  Sentry.addBreadcrumb({
    category: 'estimates',
    message: `Estimate accepted: ${estimateId}`,
    level: 'info',
    data: { estimateId, amount },
  });
  Sentry.captureMessage('Estimate accepted', {
    level: 'info',
    tags: { event: 'estimate_accepted' },
    extra: { estimateId, amount },
  });
}

/** Track payment processing */
export function trackPayment({ success, paymentId, amount, error }) {
  Sentry.addBreadcrumb({
    category: 'payments',
    message: success ? `Payment processed: ${paymentId}` : `Payment failed: ${error}`,
    level: success ? 'info' : 'error',
    data: { paymentId, amount },
  });

  if (!success) {
    Sentry.captureMessage(`Payment processing failed: ${error}`, {
      level: 'error',
      tags: { event: 'payment_failed' },
      extra: { paymentId, amount },
    });
  }
}

/** Track form submission errors */
export function trackFormError(formName, errors) {
  Sentry.addBreadcrumb({
    category: 'forms',
    message: `Form validation failed: ${formName}`,
    level: 'warning',
    data: { formName, errors },
  });
}

/** Expose Sentry for direct use */
export { Sentry };
