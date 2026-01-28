import * as Sentry from '@sentry/react';

export function initSentry() {
  // Only initialize Sentry if DSN is provided
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn) {
    console.log('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE || 'development',

    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring - sample rate for production
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Session Replay - sample rate
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Filter sensitive data
    beforeSend(event, hint) {
      // Don't send errors in development
      if (import.meta.env.MODE === 'development') {
        console.error('Sentry would send:', event, hint);
        return null;
      }

      // Remove sensitive data from breadcrumbs and context
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            // Remove any keys/passwords/tokens
            const sensitiveKeys = ['password', 'token', 'key', 'secret', 'authorization'];
            Object.keys(breadcrumb.data).forEach(key => {
              if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                breadcrumb.data![key] = '[Filtered]';
              }
            });
          }
          return breadcrumb;
        });
      }

      return event;
    },

    // Ignore common errors that don't need tracking
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      // Network errors
      'NetworkError',
      'Failed to fetch',
      // Random plugins/extensions
      'ResizeObserver loop limit exceeded',
    ],
  });
}

// Helper to capture custom errors
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Helper to add breadcrumb
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}

// Helper to set user context
export function setUser(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email,
  });
}

// Helper to clear user context (on logout)
export function clearUser() {
  Sentry.setUser(null);
}
