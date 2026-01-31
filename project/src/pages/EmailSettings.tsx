import { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Settings, TestTube, RefreshCw } from 'lucide-react';
import {
  isEmailConfigured,
  testEmailConfiguration,
  sendOrderConfirmationEmail,
  sendLowStockAlertEmail,
  sendDailySummaryEmail,
  sendWelcomeEmail
} from '../lib/email';
import { supabase } from '../lib/supabase';

export default function EmailSettings() {
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTest, setActiveTest] = useState<string | null>(null);

  const emailConfigured = isEmailConfigured();
  const n8nConfigured = false; // n8n support removed - using direct Resend integration

  const handleBasicTest = async () => {
    if (!testEmail) {
      setTestResult({ success: false, message: 'Please enter an email address' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testEmailConfiguration(testEmail);
      setTestResult({
        success: result.success,
        message: result.success ? 'Test email sent successfully!' : result.error || 'Failed to send test email'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'An error occurred while testing email'
      });
    }

    setIsTesting(false);
  };

  const handleSampleEmail = async (type: string) => {
    if (!testEmail) {
      setTestResult({ success: false, message: 'Please enter an email address' });
      return;
    }

    setActiveTest(type);
    setTestResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const businessEmail = user?.email || testEmail;

      let result;

      switch (type) {
        case 'order-confirmation':
          result = await sendOrderConfirmationEmail({
            customerEmail: testEmail,
            customerName: 'Test Customer',
            orderId: 'test-order-12345',
            orderNumber: 'TEST001',
            items: [
              { name: 'Product A', quantity: 2, price: 10.50 },
              { name: 'Product B', quantity: 1, price: 25.00 }
            ],
            total: 46.00,
            deliveryAddress: '123 Test Street, Test City, TE5T 1AB',
            estimatedDelivery: 'Tomorrow, 2-4 PM'
          });
          break;

        case 'low-stock':
          result = await sendLowStockAlertEmail({
            businessEmail,
            businessName: 'Test Business',
            productName: 'Test Product',
            currentStock: 3,
            threshold: 5,
            productId: 'test-product-123'
          });
          break;

        case 'daily-summary':
          result = await sendDailySummaryEmail({
            businessEmail,
            businessName: 'Test Business',
            date: new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            totalOrders: 15,
            totalRevenue: 450.75,
            lowStockProducts: [
              { name: 'Product A', stock: 3 },
              { name: 'Product B', stock: 2 }
            ],
            topProducts: [
              { name: 'Product C', quantity: 25 },
              { name: 'Product D', quantity: 18 }
            ]
          });
          break;

        case 'welcome':
          result = await sendWelcomeEmail({
            customerEmail: testEmail,
            customerName: 'Test Customer',
            businessName: 'Test Business',
            storeUrl: 'https://apinlero.com',
            whatsappNumber: '+1234567890'
          });
          break;

        default:
          result = { success: false, error: 'Unknown email type' };
      }

      setTestResult({
        success: result.success,
        message: result.success ? `${type} email sent successfully!` : result.error || 'Failed to send email'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'An error occurred while sending test email'
      });
    }

    setActiveTest(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="text-blue-600" size={32} />
            Email Configuration
          </h1>
          <p className="text-gray-600 mt-2">Test and configure your email service</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Direct Email Service Status */}
          <div className={`rounded-lg shadow-md p-6 ${emailConfigured ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-100'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Settings size={20} />
                  Direct Email Service (Resend)
                </h3>
                <p className="text-sm text-gray-600 mt-1">Primary email delivery</p>
              </div>
              {emailConfigured ? (
                <CheckCircle className="text-green-600" size={24} />
              ) : (
                <AlertCircle className="text-gray-400" size={24} />
              )}
            </div>
            <div className="mt-4">
              {emailConfigured ? (
                <div className="text-sm">
                  <p className="text-green-700 font-medium">✅ Configured and ready</p>
                  <p className="text-gray-600 mt-2">Environment variables:</p>
                  <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                    <li>VITE_RESEND_API_KEY</li>
                    <li>VITE_FROM_EMAIL</li>
                    <li>VITE_BUSINESS_EMAIL</li>
                  </ul>
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-gray-600 font-medium">Not configured</p>
                  <p className="text-gray-600 mt-2">Required environment variables:</p>
                  <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                    <li>VITE_RESEND_API_KEY</li>
                    <li>VITE_FROM_EMAIL (optional)</li>
                    <li>VITE_BUSINESS_EMAIL (optional)</li>
                  </ul>
                  <a
                    href="https://resend.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Get Resend API Key →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* n8n Webhook Status */}
          <div className={`rounded-lg shadow-md p-6 ${n8nConfigured ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-100'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <RefreshCw size={20} />
                  n8n Automation (Fallback)
                </h3>
                <p className="text-sm text-gray-600 mt-1">Workflow-based emails</p>
              </div>
              {n8nConfigured ? (
                <CheckCircle className="text-blue-600" size={24} />
              ) : (
                <AlertCircle className="text-gray-400" size={24} />
              )}
            </div>
            <div className="mt-4">
              {n8nConfigured ? (
                <div className="text-sm">
                  <p className="text-blue-700 font-medium">✅ Configured as fallback</p>
                  <p className="text-gray-600 mt-2">Environment variable:</p>
                  <ul className="list-disc list-inside text-gray-600 mt-1">
                    <li>VITE_N8N_WEBHOOK_URL</li>
                  </ul>
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-gray-600 font-medium">Not configured</p>
                  <p className="text-gray-600 mt-2">Required environment variable:</p>
                  <ul className="list-disc list-inside text-gray-600 mt-1">
                    <li>VITE_N8N_WEBHOOK_URL</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Email Section */}
        {emailConfigured && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TestTube size={24} className="text-purple-600" />
              Test Email Delivery
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Email Address
              </label>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleBasicTest}
                  disabled={isTesting || !testEmail}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Basic Test
                    </>
                  )}
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg mb-6 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <AlertCircle className="text-red-600" size={20} />
                  )}
                  <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}

            {/* Sample Email Templates */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Email Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleSampleEmail('order-confirmation')}
                  disabled={!testEmail || activeTest === 'order-confirmation'}
                  className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 text-left disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Order Confirmation</h4>
                    {activeTest === 'order-confirmation' && (
                      <RefreshCw size={16} className="animate-spin text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Customer order receipt with item details</p>
                </button>

                <button
                  onClick={() => handleSampleEmail('low-stock')}
                  disabled={!testEmail || activeTest === 'low-stock'}
                  className="p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 text-left disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Low Stock Alert</h4>
                    {activeTest === 'low-stock' && (
                      <RefreshCw size={16} className="animate-spin text-red-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Alert when inventory is running low</p>
                </button>

                <button
                  onClick={() => handleSampleEmail('daily-summary')}
                  disabled={!testEmail || activeTest === 'daily-summary'}
                  className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 text-left disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Daily Summary</h4>
                    {activeTest === 'daily-summary' && (
                      <RefreshCw size={16} className="animate-spin text-purple-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Daily business performance report</p>
                </button>

                <button
                  onClick={() => handleSampleEmail('welcome')}
                  disabled={!testEmail || activeTest === 'welcome'}
                  className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-left disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Welcome Email</h4>
                    {activeTest === 'welcome' && (
                      <RefreshCw size={16} className="animate-spin text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">New customer welcome message</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        {!emailConfigured && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="text-yellow-600" size={24} />
              Email Service Not Configured
            </h3>
            <div className="space-y-4 text-sm text-gray-700">
              <p>To enable email functionality, follow these steps:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Sign up for a free account at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">resend.com</a></li>
                <li>Get your API key from the Resend dashboard</li>
                <li>Add environment variables to your <code className="bg-gray-200 px-2 py-1 rounded">.env</code> file:</li>
              </ol>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <div>VITE_RESEND_API_KEY=re_xxxxxxxxxxxxx</div>
                <div>VITE_FROM_EMAIL=noreply@yourdomain.com</div>
                <div>VITE_BUSINESS_EMAIL=info@yourdomain.com</div>
              </div>
              <p className="text-xs text-gray-600">
                Note: You'll also need to add these variables to your Vercel deployment settings for production.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
