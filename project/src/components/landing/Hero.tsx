import { colors } from '../../config/colors';

interface HeroProps {
  onStartTrial: () => void;
}

export function Hero({ onStartTrial }: HeroProps) {
  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${colors.gradients.subtle} py-20 sm:py-28 lg:py-32`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-200/40 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block">One Platform.</span>
            <span className={`block ${colors.tailwind.primaryMainText}`}>Any Channel.</span>
            <span className="block">Any Business.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
            Àpínlẹ̀rọ unifies your customer conversations across WhatsApp,
            Instagram, and more — so you can focus on growing your business.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={onStartTrial}
              className={`w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white ${colors.tailwind.primaryMain} ${colors.tailwind.primaryHover} transition-colors shadow-lg shadow-teal-600/25`}
            >
              Start Free Trial
            </button>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
