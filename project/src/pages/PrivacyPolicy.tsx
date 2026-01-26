import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <p className="text-gray-600">
            <strong>Last updated:</strong> January 2026
          </p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Apinlero ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our wholesale/retail management platform and related services.
            </p>
            <p className="text-gray-700">
              We comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. Our data is stored in the EU (Ireland) to ensure GDPR compliance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Personal Information</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Name and contact details (email, phone number)</li>
              <li>Delivery address</li>
              <li>Order history and preferences</li>
              <li>Payment information (processed securely via third-party providers)</li>
              <li>WhatsApp messages when you contact us via WhatsApp</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">Business Information (for merchants)</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Business name and registration details</li>
              <li>Inventory and product information</li>
              <li>Sales and order data</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">Technical Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>IP address and browser type</li>
              <li>Device information</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Process and fulfil your orders</li>
              <li>Send order confirmations and delivery updates</li>
              <li>Provide customer support via WhatsApp and email</li>
              <li>Improve our services and user experience</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Legal Basis for Processing</h2>
            <p className="text-gray-700 mb-4">We process your data based on:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li><strong>Contract:</strong> To fulfil orders and provide services</li>
              <li><strong>Consent:</strong> For marketing communications and WhatsApp messaging</li>
              <li><strong>Legitimate interests:</strong> To improve our services and prevent fraud</li>
              <li><strong>Legal obligation:</strong> To comply with UK law and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Sharing</h2>
            <p className="text-gray-700 mb-4">We may share your data with:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li><strong>Delivery partners:</strong> To fulfil orders</li>
              <li><strong>Payment processors:</strong> To process payments securely</li>
              <li><strong>Service providers:</strong> Cloud hosting (Supabase, Vercel), messaging (Twilio)</li>
              <li><strong>Legal authorities:</strong> When required by law</li>
            </ul>
            <p className="text-gray-700 mt-4">
              We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Storage and Security</h2>
            <p className="text-gray-700 mb-4">
              Your data is stored securely in the European Union (Ireland) using Supabase, which provides:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Encryption at rest and in transit</li>
              <li>Row-level security policies</li>
              <li>Regular security audits</li>
              <li>SOC 2 Type II compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 mb-4">We retain your data for:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li><strong>Order data:</strong> 7 years (UK tax requirements)</li>
              <li><strong>Account information:</strong> Until you request deletion</li>
              <li><strong>WhatsApp messages:</strong> 90 days (for support purposes)</li>
              <li><strong>Marketing preferences:</strong> Until consent is withdrawn</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
            <p className="text-gray-700 mb-4">Under UK GDPR, you have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Restriction:</strong> Limit how we process your data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw consent:</strong> Withdraw marketing consent at any time</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, contact us at privacy@apinlero.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Cookies</h2>
            <p className="text-gray-700">
              We use essential cookies to enable core functionality. We do not use third-party tracking cookies. For analytics, we use privacy-friendly tools that do not track individual users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700">
              Our services are not intended for children under 16. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For privacy-related inquiries or to exercise your data rights:
            </p>
            <ul className="text-gray-700 space-y-1">
              <li><strong>Email:</strong> privacy@apinlero.com</li>
              <li><strong>Address:</strong> Apinlero Ltd, London, United Kingdom</li>
            </ul>
            <p className="text-gray-700 mt-4">
              You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">ico.org.uk</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
