/**
 * SentryTest — Development-only component to verify Sentry is working.
 *
 * Add to any admin page temporarily:
 *   import SentryTest from '@/components/SentryTest';
 *   <SentryTest />
 *
 * Remove before deploying to production.
 */
import { useState } from 'react';

export default function SentryTest() {
  const [status, setStatus] = useState(null);

  if (import.meta.env.PROD) return null; // Never show in production

  async function triggerError() {
    try {
      const { Sentry } = await import('../sentry.client.js');
      Sentry.captureMessage('Sentry test message from SentryTest component', {
        level: 'info',
        tags: { test: 'true' },
      });
      setStatus('✅ Test message sent to Sentry — check your Sentry dashboard');
    } catch (err) {
      setStatus('❌ Sentry not configured: ' + err.message);
    }
  }

  function triggerException() {
    // This will be caught by the nearest ErrorBoundary
    throw new Error('SentryTest: deliberate error to test ErrorBoundary + Sentry capture');
  }

  async function triggerUnhandledRejection() {
    Promise.reject(new Error('SentryTest: deliberate unhandled promise rejection'));
    setStatus('✅ Unhandled rejection triggered — check Sentry');
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-yellow-50 border border-yellow-300 rounded-lg p-4 shadow-lg max-w-xs">
      <p className="text-xs font-bold text-yellow-800 mb-2">🔧 Sentry Test Panel (dev only)</p>
      <div className="flex flex-col gap-2">
        <button
          onClick={triggerError}
          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
        >
          Send Test Message
        </button>
        <button
          onClick={triggerException}
          className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700"
        >
          Throw Exception (tests ErrorBoundary)
        </button>
        <button
          onClick={triggerUnhandledRejection}
          className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700"
        >
          Unhandled Rejection
        </button>
      </div>
      {status && (
        <p className="text-xs text-gray-700 mt-2 break-words">{status}</p>
      )}
    </div>
  );
}
