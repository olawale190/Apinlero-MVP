import { useState } from 'react';
import {
  Gift,
  Sparkles,
  TrendingUp,
  Check,
  MessageCircle,
  Plus,
  Package,
  Percent
} from 'lucide-react';
import type { Order } from '../lib/supabase';

interface SmartBundlesProps {
  orders: Order[];
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock_quantity?: number;
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  products: { name: string; price: number }[];
  originalPrice: number;
  bundlePrice: number;
  savings: number;
  savingsPercent: number;
  confidence: number; // How confident AI is about this bundle (based on co-purchase data)
  potentialRevenue: number; // Estimated monthly revenue
  status: 'suggested' | 'active' | 'inactive';
}

export default function SmartBundles({ orders, products }: SmartBundlesProps) {
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [activeBundles, setActiveBundles] = useState<string[]>([]);

  // Analyze co-purchase patterns
  const analyzeCoPurchases = () => {
    const coPurchases: Record<string, Record<string, number>> = {};

    orders.forEach(order => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach(item1 => {
        items.forEach(item2 => {
          if (item1.product_name !== item2.product_name) {
            if (!coPurchases[item1.product_name]) {
              coPurchases[item1.product_name] = {};
            }
            coPurchases[item1.product_name][item2.product_name] =
              (coPurchases[item1.product_name][item2.product_name] || 0) + 1;
          }
        });
      });
    });

    return coPurchases;
  };

  // Generate bundle suggestions
  const generateBundles = (): Bundle[] => {
    const coPurchases = analyzeCoPurchases();
    const bundles: Bundle[] = [];

    // Find strong co-purchase patterns
    const patterns: { products: string[]; count: number }[] = [];

    Object.entries(coPurchases).forEach(([product1, related]) => {
      Object.entries(related).forEach(([product2, count]) => {
        if (count >= 2) { // At least 2 co-purchases
          // Check if we already have this pair
          const existing = patterns.find(p =>
            p.products.includes(product1) && p.products.includes(product2)
          );
          if (!existing) {
            patterns.push({ products: [product1, product2], count });
          }
        }
      });
    });

    // Sort by co-purchase frequency
    patterns.sort((a, b) => b.count - a.count);

    // Create bundle suggestions
    const bundleTemplates = [
      {
        name: 'Egusi Soup Starter',
        description: 'Everything you need to make delicious Egusi soup',
        targetProducts: ['Egusi', 'Palm Oil', 'Crayfish', 'Stockfish'],
        discount: 12
      },
      {
        name: 'Jollof Rice Kit',
        description: 'Complete ingredients for the perfect Jollof rice',
        targetProducts: ['Rice', 'Tomato', 'Pepper', 'Onion'],
        discount: 10
      },
      {
        name: 'Weekend BBQ Pack',
        description: 'Get your weekend party started right',
        targetProducts: ['Meat', 'Suya Spice', 'Onion', 'Pepper'],
        discount: 15
      },
      {
        name: 'Breakfast Bundle',
        description: 'Start your day the African way',
        targetProducts: ['Garri', 'Sugar', 'Milk', 'Groundnut'],
        discount: 10
      },
      {
        name: 'Stew Essentials',
        description: 'Base ingredients for any Nigerian stew',
        targetProducts: ['Tomato', 'Palm Oil', 'Pepper', 'Onion'],
        discount: 12
      }
    ];

    bundleTemplates.forEach((template, idx) => {
      // Find matching products
      const matchedProducts = template.targetProducts
        .map(target => {
          const found = products.find(p =>
            p.name.toLowerCase().includes(target.toLowerCase())
          );
          return found ? { name: found.name, price: found.price } : null;
        })
        .filter(Boolean) as { name: string; price: number }[];

      if (matchedProducts.length >= 2) {
        const originalPrice = matchedProducts.reduce((sum, p) => sum + p.price, 0);
        const bundlePrice = originalPrice * (1 - template.discount / 100);
        const savings = originalPrice - bundlePrice;

        // Calculate confidence based on co-purchase data
        let confidence = 50; // Base confidence
        matchedProducts.forEach(p1 => {
          matchedProducts.forEach(p2 => {
            if (p1.name !== p2.name && coPurchases[p1.name]?.[p2.name]) {
              confidence += coPurchases[p1.name][p2.name] * 5;
            }
          });
        });
        confidence = Math.min(98, confidence);

        // Estimate potential revenue (based on order frequency)
        const potentialRevenue = bundlePrice * Math.round(orders.length / 10);

        bundles.push({
          id: `bundle-${idx}`,
          name: template.name,
          description: template.description,
          products: matchedProducts,
          originalPrice,
          bundlePrice,
          savings,
          savingsPercent: template.discount,
          confidence,
          potentialRevenue,
          status: activeBundles.includes(`bundle-${idx}`) ? 'active' : 'suggested'
        });
      }
    });

    return bundles.sort((a, b) => b.confidence - a.confidence);
  };

  const bundles = generateBundles();

  const handleActivateBundle = (bundleId: string) => {
    setActiveBundles(prev =>
      prev.includes(bundleId)
        ? prev.filter(id => id !== bundleId)
        : [...prev, bundleId]
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2">
            <Gift className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm sm:text-lg">Smart Bundles</h2>
            <p className="text-pink-100 text-xs sm:text-sm">AI-discovered product combinations</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 border-b">
        <div className="text-center">
          <p className="text-xl font-bold text-pink-600">{bundles.length}</p>
          <p className="text-xs text-gray-500">Suggestions</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-600">{activeBundles.length}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-purple-600">
            £{bundles.reduce((sum, b) => sum + b.potentialRevenue, 0).toFixed(0)}
          </p>
          <p className="text-xs text-gray-500">Potential/mo</p>
        </div>
      </div>

      {/* Bundles List */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                bundle.status === 'active'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-pink-300'
              }`}
              onClick={() => setSelectedBundle(bundle)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 text-sm">{bundle.name}</h3>
                    {bundle.status === 'active' && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={10} />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{bundle.description}</p>
                </div>
                <div className="flex items-center gap-1 bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs">
                  <Sparkles size={12} />
                  {bundle.confidence}% match
                </div>
              </div>

              {/* Products in bundle */}
              <div className="flex flex-wrap gap-1 mb-3">
                {bundle.products.map((product, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                    {product.name}
                  </span>
                ))}
              </div>

              {/* Pricing */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 line-through text-sm">£{bundle.originalPrice.toFixed(2)}</span>
                  <span className="text-lg font-bold text-green-600">£{bundle.bundlePrice.toFixed(2)}</span>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Percent size={10} />
                    {bundle.savingsPercent}% off
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActivateBundle(bundle.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                    bundle.status === 'active'
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-pink-600 text-white hover:bg-pink-700'
                  }`}
                >
                  {bundle.status === 'active' ? (
                    <>Deactivate</>
                  ) : (
                    <>
                      <Plus size={12} />
                      Activate
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bundle Detail Modal */}
      {selectedBundle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b bg-gradient-to-r from-pink-50 to-rose-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">{selectedBundle.name}</h3>
                  <p className="text-sm text-gray-600">{selectedBundle.description}</p>
                </div>
                <button
                  onClick={() => setSelectedBundle(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* AI Confidence */}
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-700 flex items-center gap-2">
                    <Sparkles size={16} />
                    AI Confidence Score
                  </span>
                  <span className="text-xl font-bold text-purple-600">{selectedBundle.confidence}%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${selectedBundle.confidence}%` }}
                  ></div>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Based on customer co-purchase patterns
                </p>
              </div>

              {/* Products */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <Package size={16} />
                  Bundle Contents
                </h4>
                <div className="space-y-2">
                  {selectedBundle.products.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                      <span className="text-sm text-gray-700">{product.name}</span>
                      <span className="text-sm text-gray-500">£{product.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-green-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Original Price</span>
                  <span className="text-gray-400 line-through">£{selectedBundle.originalPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600">-{selectedBundle.savingsPercent}%</span>
                </div>
                <div className="flex items-center justify-between font-bold pt-2 border-t border-green-200">
                  <span className="text-gray-800">Bundle Price</span>
                  <span className="text-green-600 text-lg">£{selectedBundle.bundlePrice.toFixed(2)}</span>
                </div>
                <p className="text-xs text-green-600">
                  Customers save £{selectedBundle.savings.toFixed(2)} per bundle
                </p>
              </div>

              {/* Potential Revenue */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="text-purple-600" size={16} />
                <span>Potential monthly revenue: <strong className="text-purple-600">£{selectedBundle.potentialRevenue.toFixed(0)}</strong></span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    handleActivateBundle(selectedBundle.id);
                    setSelectedBundle(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                    selectedBundle.status === 'active'
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-pink-600 text-white'
                  }`}
                >
                  {selectedBundle.status === 'active' ? 'Deactivate' : 'Activate Bundle'}
                </button>
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <MessageCircle size={16} />
                  Promote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
