const steps = [
  {
    number: "01",
    title: "Connect Your Channels",
    description:
      "Link your WhatsApp Business, Instagram, Facebook Messenger, and other platforms in minutes.",
  },
  {
    number: "02",
    title: "Set Up Your Team",
    description:
      "Invite team members and assign roles. Everyone sees the conversations they need to handle.",
  },
  {
    number: "03",
    title: "Configure Automation",
    description:
      "Create quick replies, auto-responses, and AI-powered workflows to handle common queries.",
  },
  {
    number: "04",
    title: "Start Growing",
    description:
      "Respond faster, close more sales, and build lasting customer relationships.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Get started in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Four simple steps to transform your customer communication
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-gradient-to-r from-primary-400 to-primary-200 lg:block" />
              )}
              <div className="relative flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white shadow-lg shadow-primary-600/25">
                  {step.number}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
