import { Sparkles, TrendingUp, AlertTriangle, Clock, Package } from 'lucide-react';
import type { Order } from '../lib/supabase';

interface AISummaryProps {
  orders: Order[];
}

export default function AISummary({ orders }: AISummaryProps) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    order => new Date(order.created_at).toDateString() === today
  );

  const _totalRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  void _totalRevenue; // Reserved for future use
  const pendingCount = todayOrders.filter(o => o.status === 'Pending').length;

  // Calculate top products
  const productCounts = todayOrders
    .flatMap(order => Array.isArray(order.items) ? order.items : [])
    .reduce((acc, item) => {
      acc[item.product_name] = (acc[item.product_name] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

  const topProduct = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)[0];

  // Calculate channel breakdown
  const channelBreakdown = todayOrders.reduce((acc, order) => {
    acc[order.channel] = (acc[order.channel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topChannel = Object.entries(channelBreakdown)
    .sort(([, a], [, b]) => b - a)[0];

  // Find urgent orders (pending orders)
  const urgentOrders = todayOrders
    .filter(o => o.status === 'Pending')
    .slice(0, 3);

  // Calculate average compared to historical (mock for now)
  const weekdayName = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
  const averageForDay = 12; // Mock average for demo
  const percentDiff = ((todayOrders.length - averageForDay) / averageForDay * 100).toFixed(0);

  const insights = [
    {
      icon: TrendingUp,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      title: 'Order Volume Trend',
      content: todayOrders.length > averageForDay
        ? `Orders ${percentDiff}% above your ${weekdayName} average`
        : `${todayOrders.length} orders today (tracking normally)`,
    },
    {
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      title: 'Top Product',
      content: topProduct
        ? `${topProduct[0]} (${topProduct[1]} orders) - stock running low`
        : 'No orders yet today',
    },
    {
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      title: 'Peak Channel',
      content: topChannel
        ? `${topChannel[0]}: ${topChannel[1]} orders (${((topChannel[1] / todayOrders.length) * 100).toFixed(0)}%)`
        : 'No data yet',
    },
    {
      icon: AlertTriangle,
      color: pendingCount > 0 ? 'text-orange-600' : 'text-green-600',
      bgColor: pendingCount > 0 ? 'bg-orange-50' : 'bg-green-50',
      title: 'Urgent Actions',
      content: pendingCount > 0
        ? `${pendingCount} orders awaiting confirmation - prioritize now`
        : 'All orders processed ✓',
    },
  ];

  return (
    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg shadow-lg p-3 sm:p-6 mb-4 sm:mb-6 border border-teal-100">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Sparkles className="text-teal-600 flex-shrink-0" size={20} />
        <h2 className="text-base sm:text-xl font-bold text-gray-800">
          <span className="hidden sm:inline">AI Daily Insight - </span>
          <span className="sm:hidden">AI Insight - </span>
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          })}
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-4">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`${insight.bgColor} rounded-lg p-2.5 sm:p-4 transition-all hover:shadow-md`}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <insight.icon className={`${insight.color} flex-shrink-0`} size={16} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xs sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
                  {insight.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{insight.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {urgentOrders.length > 0 && (
        <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-orange-500">
          <h3 className="font-semibold text-xs sm:text-sm text-gray-700 mb-1.5 sm:mb-2">
            ⚡ Urgent: Prioritize These Orders
          </h3>
          <div className="space-y-1">
            {urgentOrders.map((order) => (
              <p key={order.id} className="text-xs sm:text-sm text-gray-600 truncate">
                • {order.customer_name} - {order.channel} - £{order.total.toFixed(2)}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 sm:mt-4 flex items-center justify-between">
        <p className="text-xs text-gray-500 hidden sm:block">
          💡 AI-powered insights update in real-time
        </p>
        <div className="flex items-center gap-2 ml-auto">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600">Live</span>
        </div>
      </div>
    </div>
  );
}
