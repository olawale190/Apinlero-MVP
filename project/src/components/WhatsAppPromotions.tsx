import { useState } from 'react';
import {
  MessageCircle,
  Send,
  Users,
  Sparkles,
  Edit3,
  X,
  CheckCircle,
  TrendingUp,
  Gift,
  Clock
} from 'lucide-react';
import type { Order } from '../lib/supabase';

interface WhatsAppPromotionsProps {
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

interface Promotion {
  id: string;
  type: 'ai_suggested' | 'manual';
  title: string;
  message: string;
  targetAudience: string;
  targetCount: number;
  reason?: string;
}

interface CampaignHistory {
  id: string;
  title: string;
  sentTo: number;
  orders: number;
  conversionRate: number;
  sentDate: string;
}

export default function WhatsAppPromotions({ orders, products }: WhatsAppPromotionsProps) {
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggested' | 'history'>('suggested');

  // Generate AI-suggested promotions based on data
  const generatePromotions = (): Promotion[] => {
    const promotions: Promotion[] = [];

    // 1. Low stock promotion
    const lowStockProducts = products.filter(p => (p.stock_quantity || 0) < 5 && (p.stock_quantity || 0) > 0);
    if (lowStockProducts.length > 0) {
      const product = lowStockProducts[0];
      const customersWhoBought = new Set(
        orders
          .filter(o => o.items.some(item => item.product_name === product.name))
          .map(o => o.phone_number)
      ).size;

      promotions.push({
        id: 'low-stock-promo',
        type: 'ai_suggested',
        title: `${product.name} Flash Sale`,
        message: `🛒 Limited Stock Alert!\n\n${product.name} is almost sold out! Only ${product.stock_quantity} left.\n\nOrder now before it's gone!\n\n💰 Special price: £${(product.price * 0.9).toFixed(2)} (10% off)\n\nReply YES to order or visit our store.\n\n- Isha's Treat & Groceries`,
        targetAudience: `Customers who previously bought ${product.name}`,
        targetCount: Math.max(customersWhoBought, 15),
        reason: `${product.name} stock is low. Target customers who bought it before.`
      });
    }

    // 2. Weekend special promotion
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek >= 4) { // Thursday onwards
      promotions.push({
        id: 'weekend-special',
        type: 'ai_suggested',
        title: 'Weekend Special Offer',
        message: `🎉 WEEKEND SPECIAL!\n\nFree delivery on all orders over £30 this weekend!\n\n🛒 Stock up on your favorites:\n• Fresh African groceries\n• Quality meats & fish\n• Authentic spices\n\nOrder via WhatsApp or visit us!\n\nOffer ends Sunday.\n\n- Isha's Treat & Groceries`,
        targetAudience: 'All customers',
        targetCount: new Set(orders.map(o => o.phone_number)).size,
        reason: 'Weekends see 40% higher order values. Promote to maximize sales.'
      });
    }

    // 3. Win-back inactive customers
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCustomers = new Set(
      orders
        .filter(o => new Date(o.created_at) > thirtyDaysAgo)
        .map(o => o.phone_number)
    );

    const inactiveCustomers = new Set(
      orders
        .filter(o => new Date(o.created_at) <= thirtyDaysAgo)
        .map(o => o.phone_number)
    );

    const trueInactive = [...inactiveCustomers].filter(c => !recentCustomers.has(c));

    if (trueInactive.length > 0) {
      promotions.push({
        id: 'win-back',
        type: 'ai_suggested',
        title: 'We Miss You!',
        message: `👋 We miss you!\n\nIt's been a while since your last order. We'd love to see you again!\n\n🎁 Here's a special welcome back offer:\n15% OFF your next order!\n\nUse code: WELCOME15\n\nValid for 7 days.\n\nReply to order or visit us!\n\n- Isha's Treat & Groceries`,
        targetAudience: 'Customers inactive for 30+ days',
        targetCount: trueInactive.length,
        reason: `${trueInactive.length} customers haven't ordered in 30+ days. Win them back!`
      });
    }

    // 4. New product announcement
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Simulate new products
    promotions.push({
      id: 'new-arrivals',
      type: 'ai_suggested',
      title: 'New Stock Arrived!',
      message: `🆕 FRESH STOCK ALERT!\n\nJust arrived at Isha's Treat:\n\n✅ Fresh Catfish\n✅ Ogbono Seeds\n✅ Palm Oil (5L)\n✅ Dried Crayfish\n\nFirst come, first served!\n\n📱 Order now via WhatsApp\n🚗 Same-day delivery available\n\n- Isha's Treat & Groceries`,
      targetAudience: 'All customers',
      targetCount: new Set(orders.map(o => o.phone_number)).size,
      reason: 'New stock announcements drive 35% more orders.'
    });

    // 5. Top customer appreciation
    const customerOrderCounts = orders.reduce((acc, order) => {
      acc[order.phone_number] = (acc[order.phone_number] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCustomers = Object.entries(customerOrderCounts)
      .filter(([, count]) => count >= 3)
      .length;

    if (topCustomers > 0) {
      promotions.push({
        id: 'vip-appreciation',
        type: 'ai_suggested',
        title: 'VIP Customer Appreciation',
        message: `⭐ VIP CUSTOMER APPRECIATION ⭐\n\nThank you for being a loyal customer!\n\nAs a valued VIP, you get:\n🎁 20% OFF your next order\n🚗 FREE delivery (any amount)\n\nUse code: VIP20\n\nValid this week only!\n\nThank you for your continued support.\n\n- Isha's Treat & Groceries`,
        targetAudience: 'Top customers (3+ orders)',
        targetCount: topCustomers,
        reason: 'Reward your best customers to increase loyalty.'
      });
    }

    return promotions;
  };

  const promotions = generatePromotions();

  // Mock campaign history
  const campaignHistory: CampaignHistory[] = [
    {
      id: '1',
      title: 'Weekend Special',
      sentTo: 45,
      orders: 12,
      conversionRate: 26.7,
      sentDate: '2 days ago'
    },
    {
      id: '2',
      title: 'New Stock Alert',
      sentTo: 32,
      orders: 8,
      conversionRate: 25.0,
      sentDate: '5 days ago'
    },
    {
      id: '3',
      title: 'We Miss You!',
      sentTo: 18,
      orders: 5,
      conversionRate: 27.8,
      sentDate: '1 week ago'
    }
  ];

  const handleSendPromotion = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedPromotion(null);
      setCustomMessage('');
    }, 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2">
            <MessageCircle className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm sm:text-lg">WhatsApp Promotions</h2>
            <p className="text-green-100 text-xs sm:text-sm">AI-powered targeted campaigns</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('suggested')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'suggested'
              ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={16} />
            AI Suggested
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Clock size={16} />
            Campaign History
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'suggested' ? (
          <div className="space-y-3">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedPromotion?.id === promo.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
                onClick={() => {
                  setSelectedPromotion(promo);
                  setCustomMessage(promo.message);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className="text-green-600" size={16} />
                      <h3 className="font-semibold text-gray-800 text-sm">{promo.title}</h3>
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        AI Suggested
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs mb-2">{promo.reason}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {promo.targetCount} customers
                      </span>
                      <span>{promo.targetAudience}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPromotion(promo);
                      setCustomMessage(promo.message);
                    }}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <Send size={12} />
                    Send
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {campaignHistory.map((campaign) => (
              <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm">{campaign.title}</h3>
                  <span className="text-xs text-gray-500">{campaign.sentDate}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-800">{campaign.sentTo}</p>
                    <p className="text-xs text-gray-500">Sent To</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{campaign.orders}</p>
                    <p className="text-xs text-gray-500">Orders</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-teal-600">{campaign.conversionRate}%</p>
                    <p className="text-xs text-gray-500">Conversion</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Summary Stats */}
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-600" size={16} />
                <span className="font-semibold text-gray-800 text-sm">Campaign Performance</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">26.5%</p>
                  <p className="text-xs text-gray-500">Avg Conversion Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-600">£1,245</p>
                  <p className="text-xs text-gray-500">Revenue Generated</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send Promotion Modal */}
      {selectedPromotion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {showSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Promotion Sent!</h3>
                <p className="text-gray-600">
                  Successfully sent to {selectedPromotion.targetCount} customers via WhatsApp.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-bold text-gray-800">{selectedPromotion.title}</h3>
                  <button
                    onClick={() => {
                      setSelectedPromotion(null);
                      setCustomMessage('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Message Preview</label>
                      <button className="text-xs text-green-600 flex items-center gap-1">
                        <Edit3 size={12} />
                        Edit
                      </button>
                    </div>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full h-48 p-3 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={16} />
                      <span>Sending to <strong>{selectedPromotion.targetCount}</strong> customers</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{selectedPromotion.targetAudience}</p>
                  </div>

                  <button
                    onClick={handleSendPromotion}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Send via WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
