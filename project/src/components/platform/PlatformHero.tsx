import { MessageSquare, TrendingUp, Clock } from "lucide-react";

interface PlatformHeroProps {
  onStartTrial: () => void;
}

export function PlatformHero({ onStartTrial }: PlatformHeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold mb-2">
              Àpínlẹ̀rọ
            </h1>
            <p className="text-blue-200 text-lg">AI-Powered Order Management</p>
          </div>

          {/* Main headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Stop Losing WhatsApp Orders
          </h2>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed max-w-3xl mx-auto">
            AI-powered order management for wholesale grocers. Turn messy WhatsApp chats into organized orders, inventory tracking, and delivery routes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={onStartTrial}
              className="px-8 py-4 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start Free Trial
            </button>
            <a
              href="#features"
              className="px-8 py-4 bg-blue-800/50 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-blue-800/70 transition-all border border-blue-400/30"
            >
              See How It Works
            </a>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <MessageSquare className="w-12 h-12 mb-3 text-blue-300" />
              <div className="text-3xl font-bold mb-1">100%</div>
              <div className="text-blue-200">Orders Captured</div>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-12 h-12 mb-3 text-blue-300" />
              <div className="text-3xl font-bold mb-1">5min</div>
              <div className="text-blue-200">Setup Time</div>
            </div>
            <div className="flex flex-col items-center">
              <TrendingUp className="w-12 h-12 mb-3 text-blue-300" />
              <div className="text-3xl font-bold mb-1">3x</div>
              <div className="text-blue-200">Faster Processing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
