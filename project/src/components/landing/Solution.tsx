import { Inbox, Bot, BarChart3 } from "lucide-react";
import { colors } from '../../config/colors';

const features = [
  {
    icon: Inbox,
    title: "Unified Inbox",
    description:
      "All your customer messages from WhatsApp, Instagram, Facebook, and more in one powerful dashboard.",
  },
  {
    icon: Bot,
    title: "Smart Automation",
    description:
      "AI-powered responses handle common queries instantly, so your team can focus on what matters.",
  },
  {
    icon: BarChart3,
    title: "Actionable Insights",
    description:
      "Track response times, customer satisfaction, and team performance with real-time analytics.",
  },
];

export function Solution() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            The Àpínlẹ̀rọ Solution
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Everything you need to deliver exceptional customer experiences
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-teal-300 hover:shadow-lg"
            >
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-teal-50 transition-transform group-hover:scale-150" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
                  <feature.icon className={`h-6 w-6 ${colors.tailwind.primaryMainText}`} />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
