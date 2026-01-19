import { useState } from 'react';
import { CheckCircle, ArrowRight, Building2, Mail, Phone, User, PartyPopper } from 'lucide-react';
import { colors } from '../config/colors';

interface SignupFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function SignupForm({ onSuccess, onCancel }: SignupFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    businessType: 'grocery',
    monthlyOrders: '0-50',
    plan: 'solo'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call to save signup
    // In production, this would save to Supabase
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(3); // Success step
    }, 1500);
  };

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    }
    // Step 3 no longer redirects to dashboard
  };

  const getPlanName = () => {
    switch (formData.plan) {
      case 'solo': return 'Solo';
      case 'starter': return 'Starter';
      case 'growth': return 'Growth';
      default: return 'Solo';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.gradients.subtle} py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Àpínlẹ̀rọ</h1>
          <p className="text-lg text-gray-600">Start your 30-day free trial</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {/* Step 1 */}
            <div className={`flex items-center ${step >= 1 ? 'text-teal-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step >= 1 ? 'border-teal-600 bg-teal-50' : 'border-gray-300'
              }`}>
                {step > 1 ? <CheckCircle className="w-6 h-6" /> : <span className="font-semibold">1</span>}
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Business Info</span>
            </div>

            {/* Divider */}
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>

            {/* Step 2 */}
            <div className={`flex items-center ${step >= 2 ? 'text-teal-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step >= 2 ? 'border-teal-600 bg-teal-50' : 'border-gray-300'
              }`}>
                {step > 2 ? <CheckCircle className="w-6 h-6" /> : <span className="font-semibold">2</span>}
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Choose Plan</span>
            </div>

            {/* Divider */}
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>

            {/* Step 3 */}
            <div className={`flex items-center ${step >= 3 ? 'text-teal-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step >= 3 ? 'border-teal-600 bg-teal-50' : 'border-gray-300'
              }`}>
                {step >= 3 ? <CheckCircle className="w-6 h-6" /> : <span className="font-semibold">3</span>}
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Done</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Step 1: Business Information */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tell us about your business</h2>

              {/* Business Name */}
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Business Name *
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., Isha's Treat & Groceries"
                />
              </div>

              {/* Owner Name */}
              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Your Name *
                </label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  required
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., Isha Oluwaseun"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="you@yourbusiness.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="+44 7448 682282"
                />
              </div>

              {/* Business Type */}
              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  id="businessType"
                  name="businessType"
                  required
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="grocery">Ethnic Grocery Wholesaler</option>
                  <option value="specialty">Specialty Food Store</option>
                  <option value="restaurant">Restaurant Supplier</option>
                  <option value="other">Other Food Business</option>
                </select>
              </div>

              {/* Estimated Monthly Orders */}
              <div>
                <label htmlFor="monthlyOrders" className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Monthly Orders
                </label>
                <select
                  id="monthlyOrders"
                  name="monthlyOrders"
                  value={formData.monthlyOrders}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="0-50">0-50 orders/month (Solo)</option>
                  <option value="50-200">50-200 orders/month (Starter)</option>
                  <option value="200+">200+ orders/month (Growth)</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Choose Plan */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose your plan</h2>

              {/* Plan Options */}
              <div className="space-y-4">
                {/* Solo Plan */}
                <label className={`block p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.plan === 'solo' ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-300'
                }`}>
                  <input
                    type="radio"
                    name="plan"
                    value="solo"
                    checked={formData.plan === 'solo'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">Solo - £150/month</h3>
                      <p className="text-sm text-gray-600 mt-1">Perfect for starting out</p>
                      <ul className="mt-3 space-y-1 text-sm text-gray-700">
                        <li>✓ Up to 50 orders/month</li>
                        <li>✓ WhatsApp order bot</li>
                        <li>✓ Web storefront</li>
                        <li>✓ Basic analytics</li>
                      </ul>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      formData.plan === 'solo' ? 'border-teal-600 bg-teal-600' : 'border-gray-300'
                    }`}>
                      {formData.plan === 'solo' && <div className="w-3 h-3 bg-white rounded-full"></div>}
                    </div>
                  </div>
                </label>

                {/* Starter Plan */}
                <label className={`block p-6 border-2 rounded-xl cursor-pointer transition-all relative ${
                  formData.plan === 'starter' ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-300'
                }`}>
                  <div className="absolute -top-3 right-4 bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                  <input
                    type="radio"
                    name="plan"
                    value="starter"
                    checked={formData.plan === 'starter'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">Starter - £250/month</h3>
                      <p className="text-sm text-gray-600 mt-1">For growing businesses</p>
                      <ul className="mt-3 space-y-1 text-sm text-gray-700">
                        <li>✓ Up to 200 orders/month</li>
                        <li>✓ Everything in Solo, plus:</li>
                        <li>✓ Smart inventory tracking</li>
                        <li>✓ Delivery route optimization</li>
                        <li>✓ Advanced analytics</li>
                      </ul>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      formData.plan === 'starter' ? 'border-teal-600 bg-teal-600' : 'border-gray-300'
                    }`}>
                      {formData.plan === 'starter' && <div className="w-3 h-3 bg-white rounded-full"></div>}
                    </div>
                  </div>
                </label>

                {/* Growth Plan */}
                <label className={`block p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.plan === 'growth' ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-300'
                }`}>
                  <input
                    type="radio"
                    name="plan"
                    value="growth"
                    checked={formData.plan === 'growth'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">Growth - £350/month</h3>
                      <p className="text-sm text-gray-600 mt-1">For established businesses</p>
                      <ul className="mt-3 space-y-1 text-sm text-gray-700">
                        <li>✓ Unlimited orders</li>
                        <li>✓ Everything in Starter, plus:</li>
                        <li>✓ AI demand forecasting</li>
                        <li>✓ Multi-location support</li>
                        <li>✓ API access</li>
                      </ul>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      formData.plan === 'growth' ? 'border-teal-600 bg-teal-600' : 'border-gray-300'
                    }`}>
                      {formData.plan === 'growth' && <div className="w-3 h-3 bg-white rounded-full"></div>}
                    </div>
                  </div>
                </label>
              </div>

              {/* Free Trial Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <strong>30-day free trial</strong> - No credit card required. Cancel anytime.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Starting Trial...
                    </>
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Thank You / Success */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <PartyPopper className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-2">Thank You for Joining Àpínlẹ̀rọ!</h2>
              <p className="text-xl text-teal-600 font-medium mb-6">
                Welcome aboard, {formData.ownerName || 'there'}!
              </p>

              <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">Your Registration Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Business Name:</span>
                    <span className="font-medium text-gray-900">{formData.businessName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{formData.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Selected Plan:</span>
                    <span className="font-medium text-teal-600">{getPlanName()} (30-day free trial)</span>
                  </div>
                </div>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
                <ul className="space-y-3 text-sm text-gray-700 text-left">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                    <span>Check your email (<strong>{formData.email}</strong>) for your account activation link</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                    <span>Our team will reach out within 24 hours to help you get started</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                    <span>Complete your business profile and add your products</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                    <span>Start accepting orders via WhatsApp and your web storefront!</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Questions?</strong> Reply to our welcome email or contact us at{' '}
                  <a href="mailto:hello@apinlero.co.uk" className="text-teal-600 hover:underline font-medium">
                    hello@apinlero.co.uk
                  </a>
                </p>
              </div>

              <a
                href="/"
                className="inline-block px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Homepage
              </a>
            </div>
          )}
        </div>

        {/* Trust Badges */}
        {step < 3 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>✓ No credit card required • ✓ 30-day free trial • ✓ Cancel anytime</p>
          </div>
        )}
      </div>
    </div>
  );
}
