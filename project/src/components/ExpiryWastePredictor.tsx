import { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  TrendingDown,
  Percent,
  MessageCircle,
  Gift,
  Trash2,
  CheckCircle,
  Package
} from 'lucide-react';
import type { Order } from '../lib/supabase';

interface ExpiryWastePredictorProps {
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

interface ExpiringProduct {
  id: string;
  name: string;
  quantity: number;
  daysUntilExpiry: number;
  dailySalesRate: number;
  predictedWaste: number;
  predictedLoss: number;
  pricePerUnit: number;
  suggestions: Suggestion[];
  urgency: 'critical' | 'warning' | 'ok';
}

interface Suggestion {
  type: 'flash_sale' | 'bundle' | 'whatsapp' | 'donate';
  title: string;
  description: string;
  potentialSaved: number;
}

// Mock expiry data (in real app, this would come from inventory system)
const mockExpiryData: Record<string, number> = {
  'Fresh Tomatoes': 3,
  'Fresh Pepper': 4,
  'Fresh Fish': 2,
  'Palm Oil': 30,
  'Plantain': 5,
  'Yam': 7,
  'Fresh Vegetables': 3,
  'Milk': 5,
  'Bread': 2,
  'Fresh Meat': 3,
};

export default function ExpiryWastePredictor({ orders, products }: ExpiryWastePredictorProps) {
  const [selectedProduct, setSelectedProduct] = useState<ExpiringProduct | null>(null);
  const [actionTaken, setActionTaken] = useState<Record<string, string>>({});

  // Calculate daily sales rate for each product
  const calculateSalesRate = (productName: string): number => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesInPeriod = orders
      .filter(o => new Date(o.created_at) > thirtyDaysAgo)
      .flatMap(o => Array.isArray(o.items) ? o.items : [])
      .filter(item => item.product_name.toLowerCase().includes(productName.toLowerCase()))
      .reduce((sum, item) => sum + item.quantity, 0);

    return salesInPeriod / 30;
  };

  // Analyze expiring products
  const analyzeExpiringProducts = (): ExpiringProduct[] => {
    const expiringProducts: ExpiringProduct[] = [];

    products.forEach(product => {
      const daysUntilExpiry = mockExpiryData[product.name] || null;

      if (daysUntilExpiry !== null && daysUntilExpiry <= 7 && (product.stock_quantity || 0) > 0) {
        const dailySalesRate = calculateSalesRate(product.name);
        const currentStock = product.stock_quantity || 0;
        const expectedSales = dailySalesRate * daysUntilExpiry;
        const predictedWaste = Math.max(0, currentStock - expectedSales);
        const predictedLoss = predictedWaste * product.price;

        // Determine urgency
        let urgency: 'critical' | 'warning' | 'ok' = 'ok';
        if (daysUntilExpiry <= 2 && predictedWaste > 0) {
          urgency = 'critical';
        } else if (daysUntilExpiry <= 5 && predictedWaste > 0) {
          urgency = 'warning';
        }

        // Generate suggestions
        const suggestions: Suggestion[] = [];

        if (predictedWaste > 0) {
          // Flash sale suggestion
          const discountNeeded = Math.min(50, Math.round((predictedWaste / currentStock) * 60));
          suggestions.push({
            type: 'flash_sale',
            title: `${discountNeeded}% Flash Sale`,
            description: `Create a flash sale to move ${Math.ceil(predictedWaste)} units before expiry`,
            potentialSaved: predictedLoss * 0.5 // Assume 50% recovery with discount
          });

          // WhatsApp promotion
          const customersWhoBuy = new Set(
            orders
              .filter(o => o.items.some(item =>
                item.product_name.toLowerCase().includes(product.name.toLowerCase())
              ))
              .map(o => o.phone_number)
          ).size;

          suggestions.push({
            type: 'whatsapp',
            title: 'WhatsApp Alert',
            description: `Message ${customersWhoBuy} customers who regularly buy ${product.name}`,
            potentialSaved: predictedLoss * 0.4
          });

          // Bundle suggestion
          suggestions.push({
            type: 'bundle',
            title: 'Quick Bundle',
            description: `Create a discounted bundle with complementary products`,
            potentialSaved: predictedLoss * 0.35
          });
        }

        expiringProducts.push({
          id: product.id,
          name: product.name,
          quantity: currentStock,
          daysUntilExpiry,
          dailySalesRate,
          predictedWaste,
          predictedLoss,
          pricePerUnit: product.price,
          suggestions,
          urgency
        });
      }
    });

    return expiringProducts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  };

  const expiringProducts = analyzeExpiringProducts();

  // Calculate totals
  const totalPotentialWaste = expiringProducts.reduce((sum, p) => sum + p.predictedWaste, 0);
  const totalPotentialLoss = expiringProducts.reduce((sum, p) => sum + p.predictedLoss, 0);
  const criticalCount = expiringProducts.filter(p => p.urgency === 'critical').length;

  const getUrgencyBadge = (urgency: ExpiringProduct['urgency']) => {
    switch (urgency) {
      case 'critical':
        return <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Critical</span>;
      case 'warning':
        return <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">Warning</span>;
      default:
        return <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">OK</span>;
    }
  };

  const getUrgencyColor = (urgency: ExpiringProduct['urgency']) => {
    switch (urgency) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-orange-500 bg-orange-50';
      default: return 'border-green-500 bg-green-50';
    }
  };

  const handleTakeAction = (productId: string, action: string) => {
    setActionTaken(prev => ({ ...prev, [productId]: action }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2">
            <Clock className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm sm:text-lg">Expiry & Waste Prevention</h2>
            <p className="text-red-100 text-xs sm:text-sm">AI-powered waste reduction</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 border-b">
        <div className="text-center">
          <p className="text-xl font-bold text-red-600">{criticalCount}</p>
          <p className="text-xs text-gray-500">Critical</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-orange-600">{Math.round(totalPotentialWaste)}</p>
          <p className="text-xs text-gray-500">Units at Risk</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-gray-800">£{totalPotentialLoss.toFixed(0)}</p>
          <p className="text-xs text-gray-500">Potential Loss</p>
        </div>
      </div>

      {/* Waste Prevention Score */}
      {Object.keys(actionTaken).length > 0 && (
        <div className="bg-green-50 border-b border-green-100 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-600" size={18} />
            <span className="text-sm text-green-700">
              <strong>{Object.keys(actionTaken).length}</strong> actions taken this week
            </span>
          </div>
          <span className="text-sm font-bold text-green-600">
            £{(totalPotentialLoss * 0.6).toFixed(0)} saved
          </span>
        </div>
      )}

      {/* Products List */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {expiringProducts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="text-green-400 mx-auto mb-3" size={40} />
            <p className="text-gray-500">No products expiring soon</p>
            <p className="text-xs text-gray-400">All stock is fresh!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expiringProducts.map((product) => (
              <div
                key={product.id}
                className={`border-l-4 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                  actionTaken[product.id] ? 'border-green-500 bg-green-50' : getUrgencyColor(product.urgency)
                }`}
                onClick={() => setSelectedProduct(product)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 text-sm">{product.name}</h3>
                      {actionTaken[product.id] ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle size={10} />
                          {actionTaken[product.id]}
                        </span>
                      ) : (
                        getUrgencyBadge(product.urgency)
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {product.quantity} units • Expires in {product.daysUntilExpiry} days
                    </p>
                  </div>
                  {product.predictedWaste > 0 && !actionTaken[product.id] && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        <Trash2 className="inline" size={12} /> {Math.round(product.predictedWaste)} units
                      </p>
                      <p className="text-xs text-gray-500">£{product.predictedLoss.toFixed(2)} at risk</p>
                    </div>
                  )}
                </div>

                {/* Progress bar showing sales vs waste */}
                {product.predictedWaste > 0 && !actionTaken[product.id] && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Expected to sell: {Math.round(product.dailySalesRate * product.daysUntilExpiry)}</span>
                      <span>At risk: {Math.round(product.predictedWaste)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="h-full flex">
                        <div
                          className="bg-green-500"
                          style={{ width: `${((product.quantity - product.predictedWaste) / product.quantity) * 100}%` }}
                        ></div>
                        <div
                          className="bg-red-500"
                          style={{ width: `${(product.predictedWaste / product.quantity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className={`p-4 border-b ${getUrgencyColor(selectedProduct.urgency)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-600">
                    Expires in {selectedProduct.daysUntilExpiry} days
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Stock Analysis */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Package className="text-gray-400 mx-auto mb-1" size={20} />
                  <p className="text-xl font-bold text-gray-800">{selectedProduct.quantity}</p>
                  <p className="text-xs text-gray-500">Current Stock</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <Trash2 className="text-red-400 mx-auto mb-1" size={20} />
                  <p className="text-xl font-bold text-red-600">{Math.round(selectedProduct.predictedWaste)}</p>
                  <p className="text-xs text-gray-500">Predicted Waste</p>
                </div>
              </div>

              {/* Predicted Loss */}
              <div className="bg-red-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700">Potential Loss</span>
                  <span className="text-xl font-bold text-red-600">£{selectedProduct.predictedLoss.toFixed(2)}</span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Based on current sales rate of {selectedProduct.dailySalesRate.toFixed(1)} units/day
                </p>
              </div>

              {/* AI Suggestions */}
              {selectedProduct.suggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">💡 AI Recommendations</h4>
                  <div className="space-y-2">
                    {selectedProduct.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {suggestion.type === 'flash_sale' && <Percent className="text-green-600" size={16} />}
                            {suggestion.type === 'whatsapp' && <MessageCircle className="text-green-600" size={16} />}
                            {suggestion.type === 'bundle' && <Gift className="text-pink-600" size={16} />}
                            <span className="font-medium text-sm text-gray-800">{suggestion.title}</span>
                          </div>
                          <span className="text-xs text-green-600 font-medium">
                            Save £{suggestion.potentialSaved.toFixed(0)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{suggestion.description}</p>
                        <button
                          onClick={() => {
                            handleTakeAction(selectedProduct.id, suggestion.title);
                            setSelectedProduct(null);
                          }}
                          className="w-full bg-teal-600 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors"
                        >
                          Apply This Action
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
