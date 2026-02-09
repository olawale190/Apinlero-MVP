import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { validateEnvironment } from './lib/validateEnv';
import { initSentry } from './lib/sentry';

try {
  // Initialize Sentry error tracking
  initSentry();
} catch (error) {
  console.warn('Failed to initialize Sentry:', error);
}

try {
  // Validate environment on startup
  validateEnvironment();
} catch (error) {
  console.warn('Environment validation failed:', error);
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to mount React app:', error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="min-height: 100vh; background: #0f172a; display: flex; align-items: center; justify-content: center; font-family: monospace; color: #ef4444; padding: 2rem;">
        <div style="max-width: 600px; text-align: left;">
          <h1 style="color: #f87171; margin-bottom: 1rem;">Failed to Initialize App</h1>
          <p style="margin-bottom: 1rem; color: #cbd5e1;">Error: ${error instanceof Error ? error.message : String(error)}</p>
          <pre style="background: #1e293b; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.75rem; color: #94a3b8;">${error instanceof Error && error.stack ? error.stack : ''}</pre>
          <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #14b8a6; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;">Reload Page</button>
        </div>
      </div>
    `;
  }
}
