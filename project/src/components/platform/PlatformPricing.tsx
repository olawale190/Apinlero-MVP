import { Check } from "lucide-react";

interface PlatformPricingProps {
  onStartTrial: () => void;
}

export function PlatformPricing({ onStartTrial }: PlatformPricingProps) {
  const plans = [
    {
      name: "Solo",
      price: "£150",
      period: "/month",
      description: "Perfect for starting out",
      features: [
        "WhatsApp order bot",
        "Web storefront",
        "Up to 50 orders/month",
        "Basic analytics",
        "Email support",
        "1 user account"
      ],
      popular: false
    },
    {
      name: "Starter",
      price: "£250",
      period: "/month",
      description: "For growing businesses",
      features: [
        "Everything in Solo, plus:",
        "Up to 200 orders/month",
        "Smart inventory tracking",
        "Delivery route optimization",
        "Advanced analytics",
        "Priority support",
        "3 user accounts",
        "Custom branding"
      ],
      popular: true
    },
    {
      name: "Growth",
      price: "£350",
      period: "/month",
      description: "For established businesses",
      features: [
        "Everything in Starter, plus:",
        "Unlimited orders",
        "AI demand forecasting",
        "Multi-location support",
        "API access",
        "Dedicated account manager",
        "Unlimited user accounts",
        "White-label option"
      ],
      popular: false
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a 30-day free trial. No credit card required.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                plan.popular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                {/* Plan name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 text-lg">{plan.period}</span>
                </div>

                {/* CTA button */}
                <button
                  onClick={onStartTrial}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors mb-8 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Start Free Trial
                </button>

                {/* Features list */}
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Additional info */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            All plans include WhatsApp bot, web storefront, and mobile app access.
          </p>
          <p className="text-gray-600 mt-2">
            Need a custom plan? <button onClick={onStartTrial} className="text-blue-600 hover:text-blue-700 font-semibold">Contact us</button>
          </p>
        </div>
      </div>
    </section>
  );
}
