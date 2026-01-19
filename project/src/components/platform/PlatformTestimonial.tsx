import { Star, ExternalLink } from "lucide-react";

interface PlatformTestimonialProps {
  onViewStore: () => void;
}

export function PlatformTestimonial({ onViewStore }: PlatformTestimonialProps) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Growing Businesses
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how businesses like yours are transforming their operations
          </p>
        </div>

        {/* Testimonial card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 shadow-lg border border-blue-100">
            {/* Stars */}
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-xl md:text-2xl text-gray-800 mb-8 leading-relaxed">
              "Before Àpínlẹ̀rọ, I was drowning in WhatsApp messages. Now my customers can order anytime through WhatsApp or the website, and I can see everything in one dashboard. Game changer!"
            </blockquote>

            {/* Author */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  I
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-lg">Isha Oluwaseun</div>
                  <div className="text-gray-600">Owner, Isha's Treat & Groceries</div>
                  <div className="text-sm text-blue-700 font-medium">Pilot Customer - London, UK</div>
                </div>
              </div>

              {/* CTA to view store */}
              <button
                onClick={onViewStore}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                Visit Isha's Store
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats below testimonial */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-blue-600 mb-2">150+</div>
              <div className="text-gray-600">Orders Processed</div>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-blue-600 mb-2">2x</div>
              <div className="text-gray-600">Revenue Growth</div>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-blue-600 mb-2">10hrs</div>
              <div className="text-gray-600">Saved Per Week</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
