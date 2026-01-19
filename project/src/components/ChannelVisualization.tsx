import { useState } from 'react';
import {
  BarChart3,
  MessageCircle,
  Globe,
  Phone,
  User,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import type { Order } from '../lib/supabase';

interface ChannelVisualizationProps {
  orders: Order[];
}

interface ChannelData {
  name: string;
  icon: typeof MessageCircle;
  color: string;
  bgColor: string;
  orders: number;
  revenue: number;
  percentage: number;
  avgOrderValue: number;
  trend: number; // percentage change vs last period
}

export default function ChannelVisualization({ orders }: ChannelVisualizationProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');

  // Filter orders based on time range
  const getFilteredOrders = () => {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    return orders.filter(o => new Date(o.created_at) >= startDate);
  };

  // Calculate previous period for trend comparison
  const getPreviousPeriodOrders = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (timeRange) {
      case 'today':
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 14);
        endDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 60);
        endDate.setDate(now.getDate() - 30);
        break;
    }

    return orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= startDate && d <= endDate;
    });
  };

  const filteredOrders = getFilteredOrders();
  const previousOrders = getPreviousPeriodOrders();

  // Calculate channel data
  const calculateChannelData = (): ChannelData[] => {
    const channels: Record<string, { orders: number; revenue: number }> = {
      WhatsApp: { orders: 0, revenue: 0 },
      Web: { orders: 0, revenue: 0 },
      Phone: { orders: 0, revenue: 0 },
      'Walk-in': { orders: 0, revenue: 0 },
    };

    const previousChannels: Record<string, { orders: number; revenue: number }> = {
      WhatsApp: { orders: 0, revenue: 0 },
      Web: { orders: 0, revenue: 0 },
      Phone: { orders: 0, revenue: 0 },
      'Walk-in': { orders: 0, revenue: 0 },
    };

    filteredOrders.forEach(order => {
      if (channels[order.channel]) {
        channels[order.channel].orders += 1;
        channels[order.channel].revenue += order.total;
      }
    });

    previousOrders.forEach(order => {
      if (previousChannels[order.channel]) {
        previousChannels[order.channel].orders += 1;
        previousChannels[order.channel].revenue += order.total;
      }
    });

    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);

    const channelConfig: Record<string, { icon: typeof MessageCircle; color: string; bgColor: string }> = {
      WhatsApp: { icon: MessageCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
      Web: { icon: Globe, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      Phone: { icon: Phone, color: 'text-orange-600', bgColor: 'bg-orange-100' },
      'Walk-in': { icon: User, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    };

    return Object.entries(channels)
      .map(([name, data]) => {
        const previousData = previousChannels[name];
        const trend = previousData.orders > 0
          ? Math.round(((data.orders - previousData.orders) / previousData.orders) * 100)
          : data.orders > 0 ? 100 : 0;

        return {
          name,
          icon: channelConfig[name].icon,
          color: channelConfig[name].color,
          bgColor: channelConfig[name].bgColor,
          orders: data.orders,
          revenue: data.revenue,
          percentage: totalOrders > 0 ? Math.round((data.orders / totalOrders) * 100) : 0,
          avgOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
          trend,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  };

  const channelData = calculateChannelData();
  const topChannel = channelData[0];
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2">
              <BarChart3 className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm sm:text-lg">Channel Performance</h2>
              <p className="text-blue-100 text-xs sm:text-sm">Multi-channel order analysis</p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-1 bg-white/20 rounded-lg p-1">
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  timeRange === range
                    ? 'bg-white text-blue-600 font-medium'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 border-b">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-800">{filteredOrders.length}</p>
          <p className="text-xs text-gray-500">Total Orders</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-600">£{totalRevenue.toFixed(0)}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-600">£{avgOrderValue.toFixed(0)}</p>
          <p className="text-xs text-gray-500">Avg Order</p>
        </div>
      </div>

      {/* Channel Bars */}
      <div className="p-4">
        {/* Top Channel Highlight */}
        {topChannel && topChannel.orders > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-3 mb-4 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <topChannel.icon className={topChannel.color} size={18} />
              <span className="font-semibold text-gray-800 text-sm">
                {topChannel.name} is your top channel!
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {topChannel.percentage}% of orders • £{topChannel.avgOrderValue.toFixed(0)} avg order value
            </p>
          </div>
        )}

        {/* Channel Breakdown */}
        <div className="space-y-4">
          {channelData.map((channel) => (
            <div key={channel.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`${channel.bgColor} p-1.5 rounded-lg`}>
                    <channel.icon className={channel.color} size={16} />
                  </div>
                  <span className="font-medium text-gray-800 text-sm">{channel.name}</span>
                  {channel.trend !== 0 && (
                    <span className={`text-xs flex items-center gap-0.5 ${
                      channel.trend > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {channel.trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(channel.trend)}%
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-800">{channel.orders} orders</span>
                  <span className="text-xs text-gray-500 ml-2">£{channel.revenue.toFixed(0)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    channel.name === 'WhatsApp' ? 'bg-green-500' :
                    channel.name === 'Web' ? 'bg-blue-500' :
                    channel.name === 'Phone' ? 'bg-orange-500' :
                    'bg-purple-500'
                  }`}
                  style={{ width: `${channel.percentage}%` }}
                ></div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{channel.percentage}% of orders</span>
                <span>Avg: £{channel.avgOrderValue.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Insight */}
        {filteredOrders.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <TrendingUp className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-sm text-gray-700">
                    <strong className="text-blue-700">{topChannel?.name}</strong> orders have{' '}
                    <strong className="text-green-600">
                      {((topChannel?.avgOrderValue || 0) / avgOrderValue * 100 - 100).toFixed(0)}% higher
                    </strong>{' '}
                    average value than other channels.
                  </p>
                  <button className="text-xs text-blue-600 mt-1 flex items-center gap-1 hover:underline">
                    Promote {topChannel?.name} ordering
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
