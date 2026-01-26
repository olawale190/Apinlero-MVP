import { ShoppingCart, TrendingUp, TrendingDown, Clock, Radio, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { Order } from '../lib/supabase';

interface StatsCardsProps {
  orders: Order[];
}

// Helper to get date range
function getDateRange(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Helper to filter orders by date range
function filterOrdersByDateRange(orders: Order[], startDate: Date, endDate: Date): Order[] {
  return orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= startDate && orderDate < endDate;
  });
}

// Calculate trend percentage
function calculateTrend(current: number, previous: number): { percentage: number; direction: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    return { percentage: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'neutral' };
  }
  const percentage = ((current - previous) / previous) * 100;
  return {
    percentage: Math.abs(Math.round(percentage)),
    direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral',
  };
}

export default function StatsCards({ orders }: StatsCardsProps) {
  // Today's date boundaries
  const todayStart = getDateRange(0);
  const todayEnd = new Date();

  // Yesterday's date boundaries
  const yesterdayStart = getDateRange(1);
  const yesterdayEnd = getDateRange(0);

  // This week (last 7 days)
  const weekStart = getDateRange(7);
  const previousWeekStart = getDateRange(14);

  // Filter orders
  const todayOrders = filterOrdersByDateRange(orders, todayStart, todayEnd);
  const yesterdayOrders = filterOrdersByDateRange(orders, yesterdayStart, yesterdayEnd);
  const thisWeekOrders = filterOrdersByDateRange(orders, weekStart, todayEnd);
  const previousWeekOrders = filterOrdersByDateRange(orders, previousWeekStart, weekStart);

  // Today's stats
  const ordersToday = todayOrders.length;
  const ordersYesterday = yesterdayOrders.length;
  const ordersTrend = calculateTrend(ordersToday, ordersYesterday);

  // Revenue
  const revenueToday = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const revenueYesterday = yesterdayOrders.reduce((sum, order) => sum + order.total, 0);
  const revenueTrend = calculateTrend(revenueToday, revenueYesterday);

  // Weekly comparison
  const weeklyRevenue = thisWeekOrders.reduce((sum, order) => sum + order.total, 0);
  const previousWeeklyRevenue = previousWeekOrders.reduce((sum, order) => sum + order.total, 0);
  const weeklyTrend = calculateTrend(weeklyRevenue, previousWeeklyRevenue);

  // Pending orders
  const pendingOrders = todayOrders.filter(order => order.status === 'Pending').length;

  // Channel distribution
  const channelCounts = thisWeekOrders.reduce((acc, order) => {
    acc[order.channel] = (acc[order.channel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalChannelOrders = Object.values(channelCounts).reduce((a, b) => a + b, 0);
  const topChannel = Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0];

  // Render trend indicator
  const TrendIndicator = ({ trend }: { trend: { percentage: number; direction: 'up' | 'down' | 'neutral' } }) => {
    if (trend.direction === 'neutral') {
      return (
        <span className="flex items-center text-xs text-gray-500">
          <Minus size={12} className="mr-0.5" />
          <span>0%</span>
        </span>
      );
    }
    const isUp = trend.direction === 'up';
    return (
      <span className={`flex items-center text-xs ${isUp ? 'text-green-600' : 'text-red-500'}`}>
        {isUp ? <ArrowUp size={12} className="mr-0.5" /> : <ArrowDown size={12} className="mr-0.5" />}
        <span>{trend.percentage}%</span>
      </span>
    );
  };

  const stats = [
    {
      label: 'Orders Today',
      value: ordersToday,
      icon: ShoppingCart,
      color: '#0d9488',
      trend: ordersTrend,
      subtitle: 'vs yesterday',
    },
    {
      label: 'Revenue Today',
      value: `£${revenueToday.toFixed(2)}`,
      icon: revenueTrend.direction === 'up' ? TrendingUp : TrendingDown,
      color: '#0d9488',
      trend: revenueTrend,
      subtitle: 'vs yesterday',
    },
    {
      label: 'Weekly Revenue',
      value: `£${weeklyRevenue.toFixed(2)}`,
      icon: weeklyTrend.direction === 'up' ? TrendingUp : TrendingDown,
      color: '#6366f1',
      trend: weeklyTrend,
      subtitle: 'vs last week',
    },
    {
      label: 'Pending Orders',
      value: pendingOrders,
      icon: Clock,
      color: pendingOrders > 0 ? '#f59e0b' : '#0d9488',
      trend: null,
      subtitle: pendingOrders > 0 ? 'Need attention' : 'All clear',
    },
  ];

  return (
    <div className="space-y-4 mb-4 sm:mb-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-3 sm:p-6 transition-transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
              <stat.icon size={16} className="sm:w-5 sm:h-5" style={{ color: stat.color }} />
            </div>
            <p className="text-lg sm:text-2xl font-bold truncate" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <div className="flex items-center justify-between mt-1">
              {stat.trend && <TrendIndicator trend={stat.trend} />}
              <span className="text-xs text-gray-400">{stat.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Channel Distribution Bar */}
      {totalChannelOrders > 0 && (
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-gray-700">Channel Distribution (This Week)</p>
            <Radio size={16} className="text-teal-600" />
          </div>

          {/* Stacked Bar */}
          <div className="h-4 rounded-full overflow-hidden flex bg-gray-100">
            {Object.entries(channelCounts).map(([channel, count], idx) => {
              const percentage = (count / totalChannelOrders) * 100;
              const colors: Record<string, string> = {
                WhatsApp: '#25D366',
                Web: '#6366f1',
                Phone: '#f59e0b',
                'Walk-in': '#0d9488',
              };
              return (
                <div
                  key={channel}
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: colors[channel] || '#9ca3af'
                  }}
                  className="h-full transition-all"
                  title={`${channel}: ${count} (${percentage.toFixed(0)}%)`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2">
            {Object.entries(channelCounts).map(([channel, count]) => {
              const percentage = ((count / totalChannelOrders) * 100).toFixed(0);
              const colors: Record<string, string> = {
                WhatsApp: '#25D366',
                Web: '#6366f1',
                Phone: '#f59e0b',
                'Walk-in': '#0d9488',
              };
              return (
                <div key={channel} className="flex items-center text-xs">
                  <span
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: colors[channel] || '#9ca3af' }}
                  />
                  <span className="text-gray-600">
                    {channel}: {count} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
