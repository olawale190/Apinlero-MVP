import { MessageCircle, ShoppingCart, TruckIcon, BarChart3, Brain, Zap } from "lucide-react";

export function PlatformFeatures() {
  const features = [
    {
      icon: MessageCircle,
      title: "WhatsApp Order Bot",
      description: "AI understands natural language orders. Customers text \"2 bags of rice, 1 palm oil\" and it's automatically processed."
    },
    {
      icon: ShoppingCart,
      title: "Web Storefront",
      description: "Beautiful online store for your business. Customers can browse products, see prices, and place orders 24/7."
    },
    {
      icon: Brain,
      title: "Smart Inventory",
      description: "Track stock levels automatically. Get alerts when products are running low. Predict demand based on order history."
    },
    {
      icon: TruckIcon,
      title: "Delivery Routes",
      description: "Optimize delivery routes automatically. Reduce fuel costs by up to 40%. Real-time driver tracking."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "See your best-selling products, peak order times, customer insights, and revenue trends in real-time."
    },
    {
      icon: Zap,
      title: "Multi-Channel Orders",
      description: "Accept orders from WhatsApp, website, phone, or in-person. Everything syncs to one central system."
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Grow
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built specifically for ethnic grocery wholesalers and specialty food businesses
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                  <Icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
