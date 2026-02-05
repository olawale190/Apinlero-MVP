import { useState, useEffect } from 'react';
import {
  CreditCard,
  Shield,
  Check,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusinessContext } from '../contexts/BusinessContext';
import { useAuth } from '../contexts/AuthContext';

interface StripeConfig {
  id?: string;
  stripe_publishable_key: string | null;
  stripe_secret_key_encrypted: string | null;
  stripe_account_id: string | null;
  stripe_webhook_secret: string | null;
  stripe_connected_at: string | null;
}

export default function StripeSettings() {
  const { business } = useBusinessContext();
  const { user, isAuthenticated } = useAuth();

  const [config, setConfig] = useState<StripeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form state
  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  // SECURITY: Get business ID from context, not hardcoded
  const businessId = business?.id;

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (businessId && isAuthenticated) {
      loadStripeConfig();
    } else if (!isAuthenticated) {
      setAuthError('Please sign in to access Stripe settings.');
      setLoading(false);
    } else if (!businessId) {
      setAuthError('No business selected. Please select a business first.');
      setLoading(false);
    }
  }, [businessId, isAuthenticated]);

  async function loadStripeConfig() {
    if (!businessId) {
      setAuthError('No business ID available');
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      // SECURITY: Only fetch config for the authenticated user's business
      const { data, error } = await supabase
        .from('businesses')
        .select('stripe_publishable_key, stripe_account_id, stripe_webhook_secret, stripe_connected_at')
        .eq('id', businessId)
        .single();

      // NOTE: We intentionally do NOT fetch stripe_secret_key_encrypted to the frontend

      if (error) throw error;

      if (data) {
        setConfig(data);
        setPublishableKey(data.stripe_publishable_key || '');
        setAccountId(data.stripe_account_id || '');
        setWebhookSecret(data.stripe_webhook_secret || '');
        // SECURITY: Never populate secret key in frontend - it stays server-side only
      }
    } catch (error) {
      console.error('Failed to load Stripe configuration:', error);
      setTestResult({ success: false, message: 'Failed to load Stripe configuration' });
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    if (!businessId) {
      setTestResult({ success: false, message: 'No business selected' });
      return;
    }

    if (!publishableKey.startsWith('pk_')) {
      setTestResult({ success: false, message: 'Invalid publishable key format. Must start with pk_test_ or pk_live_' });
      return;
    }

    if (!secretKey.startsWith('sk_')) {
      setTestResult({ success: false, message: 'Invalid secret key format. Must start with sk_test_ or sk_live_' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // SECURITY: Call Edge Function to test Stripe connection
      // The Edge Function encrypts and validates the key server-side
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('test-stripe-connection', {
        body: {
          businessId,
          publishableKey,
          secretKey,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        setTestResult({ success: false, message: error.message || 'Connection test failed' });
      } else if (data?.success) {
        setTestResult({
          success: true,
          message: `Connected successfully! Account: ${data.accountId || 'Unknown'}`
        });
        if (data.accountId) {
          setAccountId(data.accountId);
        }
      } else {
        setTestResult({ success: false, message: data?.error || 'Connection test failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Network error during test' });
    } finally {
      setTesting(false);
    }
  }

  async function handleSaveConfiguration() {
    if (!businessId) {
      setTestResult({ success: false, message: 'No business selected' });
      return;
    }

    // Validation
    if (!publishableKey.startsWith('pk_')) {
      setTestResult({ success: false, message: 'Invalid publishable key format' });
      return;
    }

    if (secretKey && !secretKey.startsWith('sk_')) {
      setTestResult({ success: false, message: 'Invalid secret key format' });
      return;
    }

    setSaving(true);
    setTestResult(null);

    try {
      // SECURITY: Call Edge Function to save Stripe config
      // The Edge Function handles encryption of the secret key server-side
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('save-stripe-config', {
        body: {
          businessId,
          publishableKey,
          secretKey: secretKey || undefined, // Only send if provided
          accountId: accountId || null,
          webhookSecret: webhookSecret || null,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to save');

      setTestResult({ success: true, message: 'Stripe configuration saved securely!' });
      await loadStripeConfig();
      setSecretKey(''); // Clear secret key from memory
    } catch (error) {
      console.error('Failed to save configuration:', error);
      setTestResult({ success: false, message: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!businessId) {
      setTestResult({ success: false, message: 'No business selected' });
      return;
    }

    if (!confirm('Are you sure you want to disconnect Stripe? This will disable card payments.')) {
      return;
    }

    setSaving(true);
    try {
      // SECURITY: Use Edge Function to disconnect (handles secure deletion)
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('save-stripe-config', {
        body: {
          businessId,
          disconnect: true,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      setPublishableKey('');
      setSecretKey('');
      setAccountId('');
      setWebhookSecret('');
      setConfig(null);
      setTestResult({ success: true, message: 'Stripe disconnected successfully' });
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to disconnect Stripe' });
    } finally {
      setSaving(false);
    }
  }

  const isConnected = config?.stripe_publishable_key != null;
  const isTestMode = publishableKey.includes('_test_');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // SECURITY: Show auth error if not authenticated or no business
  if (authError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="text-red-700 mt-1">{authError}</p>
            <p className="text-sm text-red-600 mt-2">
              You must be signed in as a business owner to configure Stripe payments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stripe Payment Integration</h1>
          <p className="text-gray-600 mt-1">
            Connect your Stripe account to accept online card payments
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          isConnected
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {isConnected ? 'Connected' : 'Not Connected'}
        </span>
      </div>

      {/* Status Alert */}
      {isConnected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900">
              Stripe is connected and ready to accept payments.
              {isTestMode && ' (Test Mode - No real charges will be made)'}
              {!isTestMode && ' (Live Mode - Real payments enabled)'}
            </p>
          </div>
        </div>
      )}

      {/* Main Configuration Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Stripe Account Connection</h2>
          <p className="text-sm text-gray-600 mt-1">
            Enter your Stripe API keys to enable card payments for your business
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="font-medium text-blue-900">How to get your Stripe API keys:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 ml-4">
                  <li>Create a Stripe account at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">stripe.com</a></li>
                  <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Developers → API Keys</a></li>
                  <li>Copy your <strong>Publishable key</strong> (starts with pk_test_ or pk_live_)</li>
                  <li>Reveal and copy your <strong>Secret key</strong> (starts with sk_test_ or sk_live_)</li>
                  <li>Paste both keys below</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Publishable Key */}
          <div className="space-y-2">
            <label htmlFor="publishableKey" className="block text-sm font-medium text-gray-700">
              Publishable Key <span className="text-red-500">*</span>
            </label>
            <input
              id="publishableKey"
              type="text"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder="pk_test_51..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Safe to expose in frontend. Starts with pk_test_ (testing) or pk_live_ (production)
            </p>
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700">
              Secret Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="secretKey"
                type={showSecretKey ? 'text' : 'password'}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={isConnected ? '••••••••••••••••' : 'sk_test_51...'}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                {showSecretKey ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              ⚠️ Keep this secret! Never share or commit to version control.
              {isConnected && ' Leave blank to keep existing key.'}
            </p>
          </div>

          {/* Account ID */}
          <div className="space-y-2">
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700">
              Account ID <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              id="accountId"
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="acct_..."
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Auto-detected when you test connection
            </p>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <label htmlFor="webhookSecret" className="block text-sm font-medium text-gray-700">
              Webhook Signing Secret <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              id="webhookSecret"
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="whsec_..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              For webhook signature verification. Get from Stripe Dashboard → Webhooks
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleTestConnection}
              disabled={testing || !publishableKey || !secretKey}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Test Connection
            </button>
            <button
              onClick={handleSaveConfiguration}
              disabled={saving || !publishableKey}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save Configuration
            </button>
            {isConnected && (
              <button
                onClick={handleDisconnect}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Disconnect Stripe
              </button>
            )}
          </div>

          {/* Test Result Alert */}
          {testResult && (
            <div className={`rounded-lg p-4 flex items-start gap-3 ${
              testResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              {testResult.success ? (
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.message}
              </p>
            </div>
          )}

          {/* Connection Status */}
          {isConnected && config?.stripe_connected_at && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Connected on {new Date(config.stripe_connected_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Test Mode Warning */}
      {isConnected && isTestMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-900">
              <strong>Test Mode Active:</strong> You're using test API keys. No real charges will be made.
              Use test card <code className="px-2 py-0.5 bg-yellow-100 rounded text-sm font-mono">4242 4242 4242 4242</code> for testing.
              Switch to live keys when ready for production.
            </p>
          </div>
        </div>
      )}

      {/* Resources Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Stripe Resources</h2>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">Stripe Dashboard</span>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-sm font-medium"
            >
              Open <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">API Keys</span>
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-sm font-medium"
            >
              Get Keys <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">Test Cards</span>
            <a
              href="https://stripe.com/docs/testing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-sm font-medium"
            >
              View Docs <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700">Webhooks Setup</span>
            <a
              href="https://dashboard.stripe.com/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-sm font-medium"
            >
              Configure <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-gray-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            <strong>Security:</strong> Your secret key is automatically encrypted using AES-256 before storage. Never share your Stripe keys or commit them to version control.
            Apinlero uses your keys only to process payments for your business - we never see or store your customer payment details.
          </p>
        </div>
      </div>
    </div>
  );
}
