# Sentry Error Tracking — Setup Guide

## What's Installed

| Feature | Status |
|---|---|
| Client-side error capture | ✅ `src/sentry.client.js` |
| Server-side error capture | ✅ `src/sentry.server.js` |
| Shared config + data scrubbing | ✅ `src/sentry.config.js` |
| Admin ErrorBoundary | ✅ `src/components/ErrorBoundary.jsx` |
| API error logging + rate tracking | ✅ `src/app/api/utils/error-handler.js` |
| Hono server integration | ✅ `__create/index.ts` |
| Source maps (production builds) | ✅ `vite.config.ts` |
| CI source map upload | ✅ `.github/workflows/deploy.yml` |
| Dev test panel | ✅ `src/components/SentryTest.jsx` |

---

## 1. Create a Sentry Project

1. Go to [sentry.io](https://sentry.io) → Create Account (free tier is fine)
2. Create a new project → select **React**
3. Copy the **DSN** (looks like `https://abc123@o123456.ingest.sentry.io/789`)

---

## 2. Configure Environment Variables

### Local Development (`.env`)
```bash
SENTRY_DSN=https://your-dsn@oXXXXXX.ingest.sentry.io/XXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@oXXXXXX.ingest.sentry.io/XXXXXXX
```

Note: In `development` mode, Sentry will **log to console but NOT send** to Sentry. This is intentional to avoid noise. Change `beforeSend` in `sentry.client.js` to override.

### Coolify (Production)
Add these environment variables in Coolify → your app → Environment Variables:
```
SENTRY_DSN=https://your-dsn@...
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@...
```

### GitHub Actions Secrets
Go to GitHub → Settings → Secrets and add:
```
SENTRY_DSN          → your DSN
SENTRY_AUTH_TOKEN   → from sentry.io → Settings → Auth Tokens
SENTRY_ORG          → your org slug (from Sentry URL)
SENTRY_PROJECT      → arcan-painting (or whatever you named it)
```

---

## 3. Configure Alerts in Sentry

### Email Alerts
1. Sentry → **Alerts** → **Create Alert**
2. Choose **Issues** → Alert when "New Issue" is created
3. Set **Actions** → Send email to `cameron@ashbi.ca`

### Slack Integration
1. Sentry → **Settings** → **Integrations** → **Slack**
2. Connect your workspace
3. Create alert → Actions → Post to **#alerts** channel
4. Add conditions: `event.level = error` OR `error rate > 5%`

### Performance Degradation Alert
1. Sentry → **Alerts** → **Create Alert** → **Metrics**
2. Metric: `transaction.duration` → P95 > 3000ms
3. Notify via email + Slack

### Weekly Digest
1. Sentry → **Settings** → **Notifications** → **Weekly Report**
2. Enable for your project

---

## 4. Data Privacy (What's Scrubbed)

The following are automatically stripped from all Sentry events:
- `password`, `current_password`, `new_password`
- `credit_card`, `card_number`, `cvv`, `cvc`
- `ssn`, `sin` (Social Insurance Number)
- `token`, `secret`, `authorization`, `cookie`

Browser extension errors are also ignored via `denyUrls`.

---

## 5. Using in Route Handlers

### Wrap individual handlers
```js
import { withErrorTracking } from '../utils/error-handler.js';

export const GET = withErrorTracking('GET /api/leads', async (request) => {
  // your handler code — errors auto-reported to Sentry
});
```

### Manual API error logging
```js
import { logApiError } from '../utils/error-handler.js';

try {
  // ...
} catch (err) {
  await logApiError(err, { endpoint: '/api/leads', method: 'POST', userId: user.id });
  return Response.json({ error: 'Failed' }, { status: 500 });
}
```

---

## 6. Custom Events

Import from `sentry.client.js`:

```js
import {
  trackLogin,
  trackLogout,
  trackLeadEvent,
  trackEstimateAccepted,
  trackPayment,
  trackFormError,
} from '@/sentry.client.js';

// After successful login:
trackLogin({ success: true, userId: user.id, username: user.username });

// After lead is created:
trackLeadEvent('created', lead.id, { source: 'contact-form' });

// After estimate accepted:
trackEstimateAccepted(estimate.id, estimate.total);

// After payment:
trackPayment({ success: true, paymentId: pi.id, amount: 1500 });
```

---

## 7. Error Boundaries

### Wrap any component
```jsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary name="leads-table">
  <LeadsTable />
</ErrorBoundary>
```

### Full-page fallback
```jsx
<ErrorBoundary name="billing-section" fullPage>
  <BillingDashboard />
</ErrorBoundary>
```

### HOC pattern
```js
import { withErrorBoundary } from '@/components/ErrorBoundary';
const SafeLeadsTable = withErrorBoundary(LeadsTable, { name: 'leads-table' });
```

---

## 8. Testing

1. Add `<SentryTest />` to any admin page in development
2. Click "Send Test Message" → check Sentry Issues dashboard
3. Click "Throw Exception" → verify ErrorBoundary catches + shows fallback UI
4. Remove `<SentryTest />` before committing

---

## Expected Outcomes

| Metric | Target |
|---|---|
| Mean time to detection | <10 minutes |
| Error coverage | 100% of unhandled errors |
| False positives | <5% (browser extensions filtered) |
| PII exposure | 0 (scrubbed at source) |
| Source map coverage | 100% of production JS |
