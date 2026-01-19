import { MessageSquareX, Clock, TrendingDown } from "lucide-react";

const painPoints = [
  {
    icon: MessageSquareX,
    title: "Scattered Conversations",
    description:
      "Jumping between WhatsApp, Instagram, and email means missed messages and frustrated customers.",
  },
  {
    icon: Clock,
    title: "Wasted Time",
    description:
      "Hours spent manually responding to the same questions over and over across different platforms.",
  },
  {
    icon: TrendingDown,
    title: "Lost Sales",
    description:
      "Slow responses and disorganised communication cost you customers and revenue every day.",
  },
];

export function Problem() {
  return (
    <section className="bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Sound familiar?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Growing businesses face these challenges every day
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                <point.icon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                {point.title}
              </h3>
              <p className="mt-3 text-gray-600">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
