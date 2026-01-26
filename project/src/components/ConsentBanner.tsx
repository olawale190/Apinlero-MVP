import { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';

const CONSENT_KEY = 'apinlero_consent';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export default function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    timestamp: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  const savePreferences = (prefs: ConsentPreferences) => {
    const withTimestamp = { ...prefs, timestamp: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(withTimestamp));
    setPreferences(withTimestamp);
    setShowBanner(false);
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: ''
    });
  };

  const acceptEssential = () => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: ''
    });
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
      <div className="max-w-4xl mx-auto">
        {!showDetails ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-700 text-sm">
                  We use cookies to provide essential functionality and improve your experience.
                  By continuing, you agree to our{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowDetails(true)}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                Manage
              </button>
              <button
                onClick={acceptEssential}
                className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              >
                Essential Only
              </button>
              <button
                onClick={acceptAll}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Cookie Preferences</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={preferences.essential}
                  disabled
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900">Essential Cookies</p>
                  <p className="text-sm text-gray-600">
                    Required for the website to function. Cannot be disabled.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900">Analytics Cookies</p>
                  <p className="text-sm text-gray-600">
                    Help us understand how you use our website to improve it.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900">Marketing Cookies</p>
                  <p className="text-sm text-gray-600">
                    Used to show you relevant offers and promotions.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={acceptEssential}
                className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              >
                Essential Only
              </button>
              <button
                onClick={saveCustomPreferences}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to check consent status
export function getConsentPreferences(): ConsentPreferences | null {
  const stored = localStorage.getItem(CONSENT_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Helper to check if analytics is allowed
export function isAnalyticsAllowed(): boolean {
  const prefs = getConsentPreferences();
  return prefs?.analytics ?? false;
}

// Helper to check if marketing is allowed
export function isMarketingAllowed(): boolean {
  const prefs = getConsentPreferences();
  return prefs?.marketing ?? false;
}
