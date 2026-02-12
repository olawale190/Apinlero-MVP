import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Tag,
  ShoppingCart,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  unit: string;
  stock_quantity?: number;
  is_active: boolean;
}

interface Order {
  id: string;
  items: Array<{ product_id?: string; name: string; quantity: number; price: number }>;
  total_amount: number;
  created_at: string;
  status: string;
}

interface PricingSuggestion {
  productId: string;
  productName: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  type: 'increase' | 'decrease' | 'bundle';
  confidence: number;
  potentialImpact: string;
}

interface StockPrediction {
  productId: string;
  productName: string;
  currentStock: number;
  dailySalesRate: number;
  daysUntilStockout: number | null;
  reorderQuantity: number;
  urgency: 'critical' | 'warning' | 'ok' | 'overstocked';
  prediction: string;
}

interface CategorySuggestion {
  productId: string;
  productName: string;
  currentCategory: string;
  suggestedCategory: string;
  confidence: number;
  reason: string;
}

// Category keyword mappings for auto-categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Meat': ['chicken', 'turkey', 'beef', 'goat', 'lamb', 'cow', 'oxtail', 'tripe', 'shaki', 'ponmo', 'gizzard', 'drumstick', 'wing', 'leg', 'thigh', 'snot', 'liver', 'ear', 'foot', 'shin', 'abodi', 'mask', 'smoked bean'],
  'Fish': ['fish', 'mackerel', 'tilapia', 'croaker', 'hake', 'prawn', 'shrimp', 'crayfish', 'catfish', 'kote', 'panla', 'herring', 'stockfish', 'sawa'],
  'Produce': ['yam', 'plantain', 'potato', 'okro', 'okra', 'spinach', 'pepper', 'tomato', 'onion', 'snail', 'ogbono', 'bawa', 'bell pepper'],
  'Grains': ['rice', 'beans', 'indomie', 'noodle', 'lentil', 'tilda', 'basmati', 'tolly boy', 'peacock'],
  'Flour': ['flour', 'garri', 'fufu', 'semolina', 'semovita', 'lafun', 'elubo', 'poundo', 'pap', 'custard'],
  'Oils': ['oil', 'palm oil', 'groundnut oil', 'vegetable oil', 'shea butter', 'butter', 'bleached'],
  'Seasonings': ['seasoning', 'cube', 'knorr', 'maggi', 'gino', 'onga', 'lasor', 'jumbo', 'badia', 'spicity', 'ama wonda', 'benny', 'curry', 'thyme', 'paste', 'tin tomato', 'derica'],
  'Spices': ['spice', 'egusi', 'suya', 'pepper soup', 'cameroon pepper', 'chilli', 'ginger', 'garlic', 'nutmeg', 'uziza', 'iru', 'locust bean', 'crayfish ground'],
  'Snacks': ['biscuit', 'chin chin', 'plantain chip', 'groundnut', 'cashew', 'coconut', 'kulikuli', 'moimoi', 'tomtom', 'vicks', 'splash', 'kopiko', 'milo', 'milk', 'nescafe', 'golden morn', 'popcorn', 'chewing gum', 'parago', 'custard'],
};

// Market price ranges for African grocery categories (in pence, per typical unit)
const MARKET_PRICE_RANGES: Record<string, { low: number; mid: number; high: number }> = {
  'Seasonings': { low: 99, mid: 300, high: 699 },
  'Spices': { low: 70, mid: 350, high: 900 },
  'Meat': { low: 299, mid: 500, high: 900 },
  'Fish': { low: 150, mid: 600, high: 5200 },
  'Produce': { low: 100, mid: 800, high: 3800 },
  'Oils': { low: 299, mid: 899, high: 1800 },
  'Grains': { low: 400, mid: 1200, high: 2500 },
  'Flour': { low: 330, mid: 700, high: 1999 },
  'Snacks': { low: 100, mid: 350, high: 1450 },
};

interface AIInventoryAssistantProps {
  products: Product[];
  onApplyPriceChange?: (productId: string, newPrice: number) => void;
  onApplyCategoryChange?: (productId: string, newCategory: string) => void;
}

export default function AIInventoryAssistant({ products, onApplyPriceChange, onApplyCategoryChange }: AIInventoryAssistantProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pricing' | 'stock' | 'categories'>('pricing');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  // Fetch recent orders for analysis
  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    }
    fetchOrders();
  }, []);

  // Calculate sales data per product
  const salesData = useMemo(() => {
    const data: Record<string, { totalSold: number; totalRevenue: number; orderCount: number; lastSold: string | null }> = {};

    orders.forEach(order => {
      if (!order.items || !Array.isArray(order.items)) return;
      order.items.forEach(item => {
        const key = item.product_id || item.name;
        if (!data[key]) {
          data[key] = { totalSold: 0, totalRevenue: 0, orderCount: 0, lastSold: null };
        }
        data[key].totalSold += item.quantity;
        data[key].totalRevenue += item.price * item.quantity;
        data[key].orderCount += 1;
        if (!data[key].lastSold || order.created_at > data[key].lastSold!) {
          data[key].lastSold = order.created_at;
        }
      });
    });

    return data;
  }, [orders]);

  // Generate pricing suggestions
  const pricingSuggestions = useMemo((): PricingSuggestion[] => {
    const suggestions: PricingSuggestion[] = [];
    const activeProducts = products.filter(p => p.is_active);

    activeProducts.forEach(product => {
      const sales = salesData[product.id] || salesData[product.name];
      const categoryRange = MARKET_PRICE_RANGES[product.category];

      // 1. High demand products - suggest price increase
      if (sales && sales.totalSold > 10 && sales.orderCount > 5) {
        const avgOrderQty = sales.totalSold / sales.orderCount;
        if (avgOrderQty > 2) {
          const increase = Math.round(product.price * 0.08); // 8% increase
          suggestions.push({
            productId: product.id,
            productName: product.name,
            currentPrice: product.price,
            suggestedPrice: product.price + increase,
            reason: `High demand: ${sales.totalSold} sold in 30 days (avg ${avgOrderQty.toFixed(1)} per order). Market can support a small increase.`,
            type: 'increase',
            confidence: Math.min(92, 60 + sales.orderCount * 2),
            potentialImpact: `+£${((increase * sales.totalSold) / 100).toFixed(2)}/month extra revenue`
          });
        }
      }

      // 2. Slow movers with decent stock - suggest discount
      if (sales && sales.totalSold < 3 && (product.stock_quantity || 0) > 10) {
        const discount = Math.round(product.price * 0.12); // 12% discount
        suggestions.push({
          productId: product.id,
          productName: product.name,
          currentPrice: product.price,
          suggestedPrice: product.price - discount,
          reason: `Slow mover: only ${sales.totalSold} sold in 30 days with ${product.stock_quantity} in stock. A discount could boost sales.`,
          type: 'decrease',
          confidence: 72,
          potentialImpact: `Could move ${Math.min(product.stock_quantity || 0, 10)} extra units`
        });
      }

      // 3. No sales at all but in stock
      if (!sales && (product.stock_quantity || 0) > 5) {
        const discount = Math.round(product.price * 0.15); // 15% discount
        suggestions.push({
          productId: product.id,
          productName: product.name,
          currentPrice: product.price,
          suggestedPrice: product.price - discount,
          reason: `No sales in 30 days with ${product.stock_quantity} in stock. Consider an introductory discount.`,
          type: 'decrease',
          confidence: 65,
          potentialImpact: 'Introduce product to customers at lower entry price'
        });
      }

      // 4. Price seems too low compared to category range
      if (categoryRange && product.price < categoryRange.low * 0.7) {
        const suggestedPrice = categoryRange.low;
        suggestions.push({
          productId: product.id,
          productName: product.name,
          currentPrice: product.price,
          suggestedPrice,
          reason: `Price seems below market range for ${product.category} (typical: £${(categoryRange.low / 100).toFixed(2)} - £${(categoryRange.high / 100).toFixed(2)}).`,
          type: 'increase',
          confidence: 68,
          potentialImpact: `Align with market pricing for better margins`
        });
      }

      // 5. Price seems too high compared to category range
      if (categoryRange && product.price > categoryRange.high * 1.5) {
        suggestions.push({
          productId: product.id,
          productName: product.name,
          currentPrice: product.price,
          suggestedPrice: categoryRange.high,
          reason: `Price appears above typical ${product.category} range (max: £${(categoryRange.high / 100).toFixed(2)}). May be reducing sales.`,
          type: 'decrease',
          confidence: 60,
          potentialImpact: 'Better price competitiveness could increase volume'
        });
      }
    });

    // Sort by confidence (highest first)
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 20);
  }, [products, salesData]);

  // Generate stock predictions
  const stockPredictions = useMemo((): StockPrediction[] => {
    const predictions: StockPrediction[] = [];
    const activeProducts = products.filter(p => p.is_active);
    const daysCovered = orders.length > 0 ? 30 : 0;

    activeProducts.forEach(product => {
      const stock = product.stock_quantity || 0;
      const sales = salesData[product.id] || salesData[product.name];
      const dailyRate = sales ? sales.totalSold / Math.max(daysCovered, 1) : 0;

      let urgency: StockPrediction['urgency'] = 'ok';
      let daysUntilStockout: number | null = null;
      let reorderQuantity = 0;
      let prediction = '';

      if (dailyRate > 0) {
        daysUntilStockout = stock > 0 ? Math.floor(stock / dailyRate) : 0;

        if (daysUntilStockout <= 3) {
          urgency = 'critical';
          reorderQuantity = Math.ceil(dailyRate * 14); // 2 weeks supply
          prediction = `Will run out in ${daysUntilStockout} day${daysUntilStockout !== 1 ? 's' : ''}! Sells ~${dailyRate.toFixed(1)}/day. Reorder ${reorderQuantity} units for 2 weeks.`;
        } else if (daysUntilStockout <= 7) {
          urgency = 'warning';
          reorderQuantity = Math.ceil(dailyRate * 14);
          prediction = `${daysUntilStockout} days of stock left at current sales rate (~${dailyRate.toFixed(1)}/day). Reorder soon.`;
        } else if (daysUntilStockout > 60 && stock > dailyRate * 45) {
          urgency = 'overstocked';
          prediction = `${daysUntilStockout} days of stock. This is ${Math.floor(daysUntilStockout / 30)} months supply. Consider running a promotion.`;
        } else {
          prediction = `${daysUntilStockout} days of stock remaining at ~${dailyRate.toFixed(1)} sales/day.`;
        }
      } else {
        // No sales data
        if (stock === 0) {
          urgency = 'critical';
          prediction = 'Out of stock with no recent sales data. Consider restocking if this product is still relevant.';
          reorderQuantity = 10;
        } else if (stock > 20) {
          urgency = 'overstocked';
          prediction = `${stock} units in stock with no recent sales. May need a promotional push or price review.`;
        } else {
          prediction = `${stock} units in stock. No sales data yet to predict demand.`;
        }
      }

      predictions.push({
        productId: product.id,
        productName: product.name,
        currentStock: stock,
        dailySalesRate: dailyRate,
        daysUntilStockout,
        reorderQuantity,
        urgency,
        prediction
      });
    });

    // Sort: critical first, then warning, then overstocked, then ok
    const urgencyOrder = { critical: 0, warning: 1, overstocked: 2, ok: 3 };
    return predictions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  }, [products, salesData, orders]);

  // Generate category suggestions
  const categorySuggestions = useMemo((): CategorySuggestion[] => {
    const suggestions: CategorySuggestion[] = [];

    products.filter(p => p.is_active).forEach(product => {
      const name = product.name.toLowerCase();
      let bestMatch: { category: string; score: number; keyword: string } | null = null;

      for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
          if (name.includes(keyword.toLowerCase())) {
            const score = keyword.length / name.length; // Longer keyword match = higher score
            if (!bestMatch || score > bestMatch.score) {
              bestMatch = { category, score, keyword };
            }
          }
        }
      }

      if (bestMatch && bestMatch.category !== product.category) {
        const confidence = Math.min(95, Math.round(50 + bestMatch.score * 100));
        suggestions.push({
          productId: product.id,
          productName: product.name,
          currentCategory: product.category,
          suggestedCategory: bestMatch.category,
          confidence,
          reason: `Product name contains "${bestMatch.keyword}" which matches ${bestMatch.category} category.`
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }, [products]);

  const handleApplyPrice = async (suggestion: PricingSuggestion) => {
    if (onApplyPriceChange) {
      onApplyPriceChange(suggestion.productId, suggestion.suggestedPrice);
      setAppliedSuggestions(prev => new Set(prev).add(`price-${suggestion.productId}`));
    }
  };

  const handleApplyCategory = async (suggestion: CategorySuggestion) => {
    if (onApplyCategoryChange) {
      onApplyCategoryChange(suggestion.productId, suggestion.suggestedCategory);
      setAppliedSuggestions(prev => new Set(prev).add(`cat-${suggestion.productId}`));
    }
  };

  // Stats
  const criticalStock = stockPredictions.filter(p => p.urgency === 'critical').length;
  const warningStock = stockPredictions.filter(p => p.urgency === 'warning').length;
  const overstocked = stockPredictions.filter(p => p.urgency === 'overstocked').length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Loader2 className="animate-spin mx-auto mb-3 text-teal-600" size={32} />
        <p className="text-gray-500">Analyzing your inventory with AI...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Inventory Assistant</h2>
            <p className="text-purple-200 text-sm">Powered by Apinlero AI</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="bg-white/15 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-white">{pricingSuggestions.length}</p>
            <p className="text-xs text-purple-200">Price Tips</p>
          </div>
          <div className="bg-white/15 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-white">{criticalStock}</p>
            <p className="text-xs text-purple-200">Critical</p>
          </div>
          <div className="bg-white/15 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-white">{warningStock}</p>
            <p className="text-xs text-purple-200">Low Stock</p>
          </div>
          <div className="bg-white/15 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-white">{categorySuggestions.length}</p>
            <p className="text-xs text-purple-200">Re-categorize</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'pricing'
              ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <DollarSign size={16} />
          <span className="hidden sm:inline">Pricing</span>
          {pricingSuggestions.length > 0 && (
            <span className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded-full">{pricingSuggestions.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'stock'
              ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package size={16} />
          <span className="hidden sm:inline">Stock</span>
          {criticalStock > 0 && (
            <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{criticalStock}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'categories'
              ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Tag size={16} />
          <span className="hidden sm:inline">Categories</span>
          {categorySuggestions.length > 0 && (
            <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full">{categorySuggestions.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-3">
            {pricingSuggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <DollarSign size={32} className="mx-auto mb-2" />
                <p>No pricing suggestions right now.</p>
                <p className="text-sm mt-1">Suggestions appear based on sales data and market analysis.</p>
              </div>
            ) : (
              pricingSuggestions.map(suggestion => {
                const isApplied = appliedSuggestions.has(`price-${suggestion.productId}`);
                const isExpanded = expandedItem === `price-${suggestion.productId}`;
                const priceDiff = suggestion.suggestedPrice - suggestion.currentPrice;
                const pctChange = ((priceDiff / suggestion.currentPrice) * 100).toFixed(0);

                return (
                  <div
                    key={suggestion.productId}
                    className={`border rounded-lg overflow-hidden transition ${
                      isApplied ? 'border-green-300 bg-green-50' :
                      suggestion.type === 'increase' ? 'border-blue-200 hover:border-blue-300' :
                      'border-orange-200 hover:border-orange-300'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedItem(isExpanded ? null : `price-${suggestion.productId}`)}
                      className="w-full flex items-center justify-between p-3 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1.5 rounded-lg ${
                          suggestion.type === 'increase' ? 'bg-blue-100' : 'bg-orange-100'
                        }`}>
                          {suggestion.type === 'increase' ? (
                            <ArrowUp size={16} className="text-blue-600" />
                          ) : (
                            <ArrowDown size={16} className="text-orange-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{suggestion.productName}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">£{(suggestion.currentPrice / 100).toFixed(2)}</span>
                            <ChevronRight size={12} className="text-gray-400" />
                            <span className={`font-semibold ${
                              suggestion.type === 'increase' ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              £{(suggestion.suggestedPrice / 100).toFixed(2)}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              suggestion.type === 'increase' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {priceDiff > 0 ? '+' : ''}{pctChange}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">{suggestion.confidence}%</span>
                        <ChevronDown size={16} className={`text-gray-400 transition ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t bg-gray-50">
                        <p className="text-sm text-gray-600 mt-3 mb-2">{suggestion.reason}</p>
                        <p className="text-xs text-gray-500 mb-3">{suggestion.potentialImpact}</p>

                        {/* Confidence bar */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-gray-500">Confidence:</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-full rounded-full ${
                                suggestion.confidence >= 80 ? 'bg-green-500' :
                                suggestion.confidence >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${suggestion.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{suggestion.confidence}%</span>
                        </div>

                        {!isApplied ? (
                          <button
                            onClick={() => handleApplyPrice(suggestion)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                          >
                            <Sparkles size={14} />
                            Apply Price Change
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                            <CheckCircle2 size={14} />
                            Applied
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Stock Predictions Tab */}
        {activeTab === 'stock' && (
          <div className="space-y-3">
            {stockPredictions.filter(p => p.urgency !== 'ok').length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package size={32} className="mx-auto mb-2" />
                <p>All stock levels look healthy!</p>
              </div>
            ) : (
              stockPredictions
                .filter(p => p.urgency !== 'ok')
                .slice(0, 30)
                .map(prediction => {
                  const isExpanded = expandedItem === `stock-${prediction.productId}`;

                  return (
                    <div
                      key={prediction.productId}
                      className={`border rounded-lg overflow-hidden transition ${
                        prediction.urgency === 'critical' ? 'border-red-300 bg-red-50' :
                        prediction.urgency === 'warning' ? 'border-amber-300 bg-amber-50' :
                        'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedItem(isExpanded ? null : `stock-${prediction.productId}`)}
                        className="w-full flex items-center justify-between p-3 text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-1.5 rounded-lg ${
                            prediction.urgency === 'critical' ? 'bg-red-200' :
                            prediction.urgency === 'warning' ? 'bg-amber-200' :
                            'bg-blue-200'
                          }`}>
                            {prediction.urgency === 'critical' ? (
                              <AlertTriangle size={16} className="text-red-700" />
                            ) : prediction.urgency === 'warning' ? (
                              <AlertTriangle size={16} className="text-amber-700" />
                            ) : (
                              <BarChart3 size={16} className="text-blue-700" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 text-sm truncate">{prediction.productName}</p>
                            <p className="text-xs text-gray-500">
                              Stock: {prediction.currentStock} |
                              {prediction.daysUntilStockout !== null
                                ? ` ${prediction.daysUntilStockout} days left`
                                : ' No sales data'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            prediction.urgency === 'critical' ? 'bg-red-200 text-red-800' :
                            prediction.urgency === 'warning' ? 'bg-amber-200 text-amber-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {prediction.urgency === 'critical' ? 'CRITICAL' :
                             prediction.urgency === 'warning' ? 'LOW' : 'OVERSTOCK'}
                          </span>
                          <ChevronDown size={16} className={`text-gray-400 transition ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 border-t bg-white/60">
                          <p className="text-sm text-gray-600 mt-3 mb-2">{prediction.prediction}</p>
                          {prediction.dailySalesRate > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <div className="bg-white rounded p-2 text-center">
                                <p className="text-sm font-bold text-gray-800">{prediction.dailySalesRate.toFixed(1)}</p>
                                <p className="text-xs text-gray-500">Sales/day</p>
                              </div>
                              <div className="bg-white rounded p-2 text-center">
                                <p className="text-sm font-bold text-gray-800">{prediction.currentStock}</p>
                                <p className="text-xs text-gray-500">In stock</p>
                              </div>
                              <div className="bg-white rounded p-2 text-center">
                                <p className="text-sm font-bold text-purple-600">{prediction.reorderQuantity}</p>
                                <p className="text-xs text-gray-500">Reorder qty</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-3">
            {categorySuggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Tag size={32} className="mx-auto mb-2" />
                <p>All products are well-categorized!</p>
              </div>
            ) : (
              categorySuggestions.slice(0, 20).map(suggestion => {
                const isApplied = appliedSuggestions.has(`cat-${suggestion.productId}`);
                const isExpanded = expandedItem === `cat-${suggestion.productId}`;

                return (
                  <div
                    key={suggestion.productId}
                    className={`border rounded-lg overflow-hidden transition ${
                      isApplied ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedItem(isExpanded ? null : `cat-${suggestion.productId}`)}
                      className="w-full flex items-center justify-between p-3 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <Tag size={16} className="text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{suggestion.productName}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{suggestion.currentCategory}</span>
                            <ChevronRight size={12} className="text-gray-400" />
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">{suggestion.suggestedCategory}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">{suggestion.confidence}%</span>
                        <ChevronDown size={16} className={`text-gray-400 transition ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t bg-gray-50">
                        <p className="text-sm text-gray-600 mt-3 mb-3">{suggestion.reason}</p>

                        {!isApplied ? (
                          <button
                            onClick={() => handleApplyCategory(suggestion)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                          >
                            <Tag size={14} />
                            Apply Category Change
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                            <CheckCircle2 size={14} />
                            Applied
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
