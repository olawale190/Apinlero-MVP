import { useState } from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Package,
  Calendar,
  Lightbulb,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { Order } from '../lib/supabase';

interface AIInsightsPanelProps {
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

interface Insight {
  id: string;
  type: 'urgent' | 'opportunity' | 'trend' | 'prediction';
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
  priority: number;
}

// Cultural events calendar for ethnic grocery (Nigerian, Caribbean, religious)
const culturalEvents = [
  // Islamic
  { name: 'Eid al-Fitr', date: new Date('2026-03-20'), daysAway: 0, products: ['Rice', 'Meat', 'Palm Oil', 'Spices', 'Tomato Paste'] },
  { name: 'Eid al-Adha', date: new Date('2026-05-27'), daysAway: 0, products: ['Rice', 'Lamb', 'Goat', 'Spices', 'Palm Oil'] },

  // Christian
  { name: 'Easter', date: new Date('2026-04-05'), daysAway: 0, products: ['Rice', 'Chicken', 'Stockfish', 'Vegetables'] },
  { name: 'Christmas', date: new Date('2026-12-25'), daysAway: 0, products: ['Rice', 'Chicken', 'Beef', 'Jollof Spices', 'Drinks'] },

  // Nigerian
  { name: 'Nigerian Independence Day', date: new Date('2026-10-01'), daysAway: 0, products: ['Palm Oil', 'Rice', 'Garri', 'Egusi', 'Suya Spice'] },
  { name: 'New Yam Festival (Iri Ji)', date: new Date('2026-08-15'), daysAway: 0, products: ['Yam', 'Palm Oil', 'Stockfish', 'Crayfish'] },

  // Caribbean
  { name: 'Notting Hill Carnival', date: new Date('2026-08-30'), daysAway: 0, products: ['Rice', 'Chicken', 'Scotch Bonnet', 'Plantain', 'Jerk Spices'] },
  { name: 'Jamaican Independence Day', date: new Date('2026-08-06'), daysAway: 0, products: ['Rice & Peas', 'Ackee', 'Saltfish', 'Plantain'] },

  // Hindu
  { name: 'Diwali', date: new Date('2026-11-01'), daysAway: 0, products: ['Rice', 'Spices', 'Lentils', 'Ghee', 'Sweets'] },
  { name: 'Holi', date: new Date('2026-03-10'), daysAway: 0, products: ['Rice', 'Spices', 'Sweets', 'Drinks'] },

  // General UK
  { name: 'Mother\'s Day (UK)', date: new Date('2026-03-22'), daysAway: 0, products: ['Rice', 'Chicken', 'Drinks', 'Sweets'] },
  { name: 'Boxing Day', date: new Date('2026-12-26'), daysAway: 0, products: ['Leftovers Ingredients', 'Rice', 'Snacks'] },
];

// Calculate days away for each event
const getUpcomingEvents = () => {
  const now = new Date();
  return culturalEvents
    .map(event => ({
      ...event,
      daysAway: Math.ceil((event.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }))
    .filter(event => event.daysAway > 0 && event.daysAway <= 30)
    .sort((a, b) => a.daysAway - b.daysAway);
};

export default function AIInsightsPanel({ orders, products }: AIInsightsPanelProps) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    order => new Date(order.created_at).toDateString() === today
  );

  // Calculate insights
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // 1. Low Stock Alert
    const lowStockProducts = products.filter(p => (p.stock_quantity || 0) < 5);
    if (lowStockProducts.length > 0) {
      insights.push({
        id: 'low-stock',
        type: 'urgent',
        icon: AlertTriangle,
        title: `${lowStockProducts.length} products running low`,
        description: `${lowStockProducts.slice(0, 3).map(p => p.name).join(', ')}${lowStockProducts.length > 3 ? ` +${lowStockProducts.length - 3} more` : ''} need restocking soon.`,
        action: 'reorder',
        actionLabel: 'View & Reorder',
        priority: 1
      });
    }

    // 2. Sales Trend Analysis
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayOrders = orders.filter(
      order => new Date(order.created_at).toDateString() === yesterday.toDateString()
    );

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);
    const revenueChange = yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(0)
      : 0;

    if (Number(revenueChange) > 20) {
      insights.push({
        id: 'revenue-up',
        type: 'trend',
        icon: TrendingUp,
        title: `Revenue up ${revenueChange}% vs yesterday`,
        description: `Great performance! Today's revenue is £${todayRevenue.toFixed(2)} compared to £${yesterdayRevenue.toFixed(2)} yesterday.`,
        priority: 3
      });
    } else if (Number(revenueChange) < -20 && yesterdayRevenue > 0) {
      insights.push({
        id: 'revenue-down',
        type: 'urgent',
        icon: TrendingUp,
        title: `Revenue down ${Math.abs(Number(revenueChange))}% vs yesterday`,
        description: `Consider sending a promotion to boost sales. Yesterday you made £${yesterdayRevenue.toFixed(2)}.`,
        action: 'promotion',
        actionLabel: 'Create Promotion',
        priority: 2
      });
    }

    // 3. Top Selling Product Insight
    const productSales = todayOrders
      .flatMap(order => Array.isArray(order.items) ? order.items : [])
      .reduce((acc, item) => {
        acc[item.product_name] = (acc[item.product_name] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topProducts.length > 0) {
      insights.push({
        id: 'top-product',
        type: 'opportunity',
        icon: Package,
        title: `${topProducts[0][0]} is your top seller today`,
        description: `Sold ${topProducts[0][1]} units. Consider featuring it prominently or creating a bundle.`,
        action: 'bundle',
        actionLabel: 'Create Bundle',
        priority: 4
      });
    }

    // 4. Cultural Event Coming
    const upcomingEvents = getUpcomingEvents();
    if (upcomingEvents.length > 0) {
      const nextEvent = upcomingEvents[0];
      insights.push({
        id: 'cultural-event',
        type: 'prediction',
        icon: Calendar,
        title: `${nextEvent.name} in ${nextEvent.daysAway} days`,
        description: `Expect increased demand for: ${nextEvent.products.join(', ')}. Stock up now to avoid shortages.`,
        action: 'stock-up',
        actionLabel: 'Prepare Stock',
        priority: 2
      });
    }

    // 5. Customer Repeat Pattern
    const customerOrders = orders.reduce((acc, order) => {
      acc[order.phone_number] = (acc[order.phone_number] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const repeatCustomers = Object.values(customerOrders).filter(count => count > 1).length;
    const totalCustomers = Object.keys(customerOrders).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers * 100).toFixed(0) : 0;

    if (Number(repeatRate) > 50) {
      insights.push({
        id: 'repeat-customers',
        type: 'trend',
        icon: Lightbulb,
        title: `${repeatRate}% repeat customer rate`,
        description: `Your customers love coming back! Consider a loyalty programme to reward them.`,
        priority: 5
      });
    }

    // 6. Customer Churn Warning
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find customers who ordered before but haven't ordered in last 30 days
    const customerLastOrder = orders.reduce((acc, order) => {
      const orderDate = new Date(order.created_at);
      if (!acc[order.phone_number] || orderDate > acc[order.phone_number]) {
        acc[order.phone_number] = orderDate;
      }
      return acc;
    }, {} as Record<string, Date>);

    const inactiveCustomers = Object.entries(customerLastOrder)
      .filter(([_, lastOrder]) => lastOrder < thirtyDaysAgo)
      .length;

    if (inactiveCustomers > 0) {
      insights.push({
        id: 'churn-warning',
        type: 'urgent',
        icon: AlertTriangle,
        title: `${inactiveCustomers} customers haven't ordered in 30+ days`,
        description: `Send them a reminder or special offer to win them back. Retention is cheaper than acquisition!`,
        action: 'send-reminder',
        actionLabel: 'Send Reminder',
        priority: 2
      });
    }

    // 7. Stock Expiry Prediction (for products with expiry dates)
    const lowStockHighDemand = products.filter(p => {
      const soldToday = productSales[p.name] || 0;
      const stock = p.stock_quantity || 0;
      // If current stock would run out in less than 5 days at today's rate
      return soldToday > 0 && stock > 0 && (stock / soldToday) < 5;
    });

    if (lowStockHighDemand.length > 0) {
      insights.push({
        id: 'stock-forecast',
        type: 'prediction',
        icon: Package,
        title: `${lowStockHighDemand[0]?.name || 'Products'} may run out in ~${Math.ceil((lowStockHighDemand[0]?.stock_quantity || 1) / (productSales[lowStockHighDemand[0]?.name] || 1))} days`,
        description: `Based on today's sales velocity. ${lowStockHighDemand.length > 1 ? `${lowStockHighDemand.length - 1} other products also at risk.` : 'Consider restocking soon.'}`,
        action: 'reorder',
        actionLabel: 'Reorder Now',
        priority: 2
      });
    }

    // 8. Peak Hours Insight
    const hourlyOrders = todayOrders.reduce((acc, order) => {
      const hour = new Date(order.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHour = Object.entries(hourlyOrders)
      .sort(([, a], [, b]) => b - a)[0];

    if (peakHour && Number(peakHour[1]) > 2) {
      const hourNum = Number(peakHour[0]);
      const hourStr = hourNum > 12 ? `${hourNum - 12}pm` : `${hourNum}am`;
      insights.push({
        id: 'peak-hours',
        type: 'trend',
        icon: TrendingUp,
        title: `Peak ordering time: around ${hourStr}`,
        description: `${peakHour[1]} orders received at this hour. Consider extra staff during peak times.`,
        priority: 5
      });
    }

    // 9. Order prediction for the day
    const weekday = new Date().getDay();
    const historicalOrders = orders.filter(o => new Date(o.created_at).getDay() === weekday);
    const avgOrdersForDay = Math.round(historicalOrders.length / Math.max(1, Math.ceil(orders.length / 7)));

    insights.push({
      id: 'prediction',
      type: 'prediction',
      icon: Brain,
      title: `Expecting ${Math.max(avgOrdersForDay, todayOrders.length)}-${avgOrdersForDay + 8} orders today`,
      description: `Based on your ${new Date().toLocaleDateString('en-GB', { weekday: 'long' })} patterns. You've received ${todayOrders.length} so far.`,
      priority: 6
    });

    // 10. WhatsApp Channel Performance
    const whatsappOrders = orders.filter(o => o.channel === 'WhatsApp').length;
    const whatsappPercentage = orders.length > 0 ? ((whatsappOrders / orders.length) * 100).toFixed(0) : 0;

    if (Number(whatsappPercentage) > 50) {
      insights.push({
        id: 'whatsapp-success',
        type: 'opportunity',
        icon: Lightbulb,
        title: `${whatsappPercentage}% of orders via WhatsApp`,
        description: `Your WhatsApp channel is performing well! Consider adding more product images to catalogs.`,
        priority: 7
      });
    }

    return insights.sort((a, b) => a.priority - b.priority);
  };

  const insights = generateInsights();

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'opportunity': return 'border-green-500 bg-green-50';
      case 'trend': return 'border-blue-500 bg-blue-50';
      case 'prediction': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'text-red-600';
      case 'opportunity': return 'text-green-600';
      case 'trend': return 'text-blue-600';
      case 'prediction': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 rounded-lg p-1.5 sm:p-2">
              <Brain className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm sm:text-lg">AI Daily Insights</h2>
              <p className="text-teal-100 text-xs sm:text-sm">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white/80 text-xs sm:text-sm">Live</span>
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="p-3 sm:p-4">
        <div className="grid gap-3 sm:gap-4">
          {insights.slice(0, 4).map((insight) => (
            <div
              key={insight.id}
              className={`border-l-4 rounded-lg p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md ${getInsightColor(insight.type)}`}
              onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <insight.icon className={`${getIconColor(insight.type)} flex-shrink-0 mt-0.5`} size={18} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{insight.title}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">{insight.description}</p>

                    {expandedInsight === insight.id && insight.action && (
                      <button className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-xs sm:text-sm rounded-lg hover:bg-teal-700 transition-colors">
                        {insight.actionLabel}
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <ChevronRight
                  className={`text-gray-400 flex-shrink-0 transition-transform ${expandedInsight === insight.id ? 'rotate-90' : ''}`}
                  size={18}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats Row */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg sm:text-2xl font-bold text-teal-600">{todayOrders.length}</span>
                <ArrowUpRight className="text-green-500" size={16} />
              </div>
              <p className="text-xs text-gray-500">Orders Today</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg sm:text-2xl font-bold text-teal-600">
                  £{todayOrders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}
                </span>
                <ArrowUpRight className="text-green-500" size={16} />
              </div>
              <p className="text-xs text-gray-500">Revenue</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg sm:text-2xl font-bold text-orange-500">
                  {todayOrders.filter(o => o.status === 'Pending').length}
                </span>
                {todayOrders.filter(o => o.status === 'Pending').length > 0 && (
                  <ArrowDownRight className="text-orange-500" size={16} />
                )}
              </div>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>

        {/* AI Powered Badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Sparkles size={12} />
          <span>Powered by Àpínlẹ̀rọ AI</span>
        </div>
      </div>
    </div>
  );
}
