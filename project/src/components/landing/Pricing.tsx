import { Check } from "lucide-react";
import { colors } from '../../config/colors';

interface PricingProps {
  onStartTrial: () => void;
}

const plans = [
  {
    name: "Solo",
    price: "150",
    description: "Perfect for solopreneurs and small businesses",
    features: [
      "1 team member",
      "2 connected channels",
      "1,000 conversations/month",
      "Basic automation",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Starter",
    price: "250",
    description: "For growing teams ready to scale",
    features: [
      "5 team members",
      "5 connected channels",
      "5,000 conversations/month",
      "Advanced automation",
      "AI-powered responses",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Growth",
    price: "350",
    description: "For businesses with high-volume needs",
    features: [
      "Unlimited team members",
      "Unlimited channels",
      "Unlimited conversations",
      "Custom automation workflows",
      "Advanced analytics",
      "Dedicated account manager",
      "API access",
    ],
    popular: false,
  },
];

export function Pricing({ onStartTrial }: PricingProps) {
  return (
    <section className="bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Choose the plan that fits your business. Upgrade or downgrade
            anytime.
          </p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl border bg-white p-8 shadow-sm ${
                plan.popular
                  ? `${colors.tailwind.primaryBorder} ring-2 ${colors.tailwind.primaryRing}`
                  : "border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 rounded-full ${colors.tailwind.primaryMain} px-4 py-1 text-sm font-medium text-white`}>
                  Most Popular
                </div>
              )}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {plan.description}
                </p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">
                    £{plan.price}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>
              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className={`h-5 w-5 shrink-0 ${colors.tailwind.primaryMainText}`} />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onStartTrial}
                className={`mt-8 w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? `${colors.tailwind.primaryMain} text-white ${colors.tailwind.primaryHover}`
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Start Free Trial
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
