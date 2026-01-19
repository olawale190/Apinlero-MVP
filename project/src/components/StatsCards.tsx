import { ShoppingCart, TrendingUp, Clock, Radio } from 'lucide-react';
import type { Order } from '../lib/supabase';

interface StatsCardsProps {
  orders: Order[];
}

export default function StatsCards({ orders }: StatsCardsProps) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    order => new Date(order.created_at).toDateString() === today
  );

  const ordersToday = todayOrders.length;

  const revenueToday = todayOrders.reduce((sum, order) => sum + order.total, 0);

  const pendingOrders = todayOrders.filter(order => order.status === 'Pending').length;

  const channelCounts = todayOrders.reduce((acc, order) => {
    acc[order.channel] = (acc[order.channel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topChannel = Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  const stats = [
    {
      label: 'Orders Today',
      value: ordersToday,
      icon: ShoppingCart,
      color: '#0d9488',
    },
    {
      label: 'Revenue Today',
      value: `£${revenueToday.toFixed(2)}`,
      icon: TrendingUp,
      color: '#0d9488',
    },
    {
      label: 'Pending Orders',
      value: pendingOrders,
      icon: Clock,
      color: pendingOrders > 0 ? '#f59e0b' : '#0d9488',
    },
    {
      label: 'Top Channel',
      value: topChannel,
      icon: Radio,
      color: '#0d9488',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
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
        </div>
      ))}
    </div>
  );
}
