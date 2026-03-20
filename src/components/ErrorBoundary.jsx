/**
 * ErrorBoundary — Arcan Painting Admin Dashboard
 *
 * Wraps sections of the admin UI to catch React render errors without
 * crashing the entire page. Reports caught errors to Sentry automatically.
 *
 * Usage:
 *   <ErrorBoundary name="leads-table">
 *     <LeadsTable />
 *   </ErrorBoundary>
 *
 * Or for a full-page fallback:
 *   <ErrorBoundary name="admin-dashboard" fullPage>
 *     <Dashboard />
 *   </ErrorBoundary>
 */
import { Component } from 'react';

// Lazy-import Sentry so it doesn't crash if Sentry isn't configured
function reportToSentry(error, info, name) {
  try {
    import('../sentry.client.js').then(({ Sentry }) => {
      Sentry.withScope((scope) => {
        scope.setTag('error_boundary', name || 'unknown');
        scope.setExtra('componentStack', info?.componentStack);
        Sentry.captureException(error);
      });
    });
  } catch {
    // Sentry unavailable — fail silently
  }
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ errorInfo: info });
    reportToSentry(error, info, this.props.name);
    console.error(`[ErrorBoundary:${this.props.name || 'unknown'}]`, error, info);
  }

  handleRetry() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // Allow caller to provide custom fallback
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          retry: this.handleRetry,
        });
      }

      // Full-page variant (for top-level layout errors)
      if (this.props.fullPage) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl">⚠</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
              <p className="text-gray-500 text-sm mb-6">
                An unexpected error occurred. Our team has been notified and is working on a fix.
              </p>
              {this.props.showDetails && this.state.error && (
                <details className="mb-4 text-left">
                  <summary className="text-xs text-gray-400 cursor-pointer mb-1">Error details</summary>
                  <pre className="text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <span>↺</span> Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="ml-3 inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        );
      }

      // Inline/compact variant (for partial page sections)
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <span className="text-red-400 mt-0.5 flex-shrink-0">⚠</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">Something went wrong</p>
            <p className="text-xs text-red-600 mt-1">
              {this.props.name
                ? `The "${this.props.name}" section failed to load.`
                : 'This section failed to load.'}
              {' '}Our team has been notified.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex-shrink-0 text-xs bg-white border border-red-300 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * withErrorBoundary — HOC to wrap any component in an ErrorBoundary
 *
 * Usage:
 *   const SafeLeadsTable = withErrorBoundary(LeadsTable, { name: 'leads-table' });
 */
export function withErrorBoundary(WrappedComponent, options = {}) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WithErrorBoundary(props) {
    return (
      <ErrorBoundary name={options.name || displayName} {...options}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  }

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  return WithErrorBoundary;
}

export default ErrorBoundary;
