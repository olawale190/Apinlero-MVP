import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Box,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar
} from 'lucide-react';
import type { Order, Product } from '../lib/supabase';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesInventoryAnalyticsProps {
  orders: Order[];
  products: Product[];
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface MetricData {
  revenue: number;
  itemsSold: number;
  ordersCount: number;
  inventoryValue: number;
}

interface TrendData {
  percentage: number;
  direction: 'up' | 'down' | 'neutral';
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
function calculateTrend(current: number, previous: number): TrendData {
  if (previous === 0) {
    return { percentage: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'neutral' };
  }
  const percentage = ((current - previous) / previous) * 100;
  return {
    percentage: Math.abs(Math.round(percentage)),
    direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral',
  };
}

export default function SalesInventoryAnalytics({ orders, products }: SalesInventoryAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('daily');

  // Calculate metrics based on selected period
  const { currentMetrics, previousMetrics, chartData, topProductsData } = useMemo(() => {
    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;
    let previousEnd: Date;

    const now = new Date();

    switch (selectedPeriod) {
      case 'daily':
        currentStart = getDateRange(0);
        currentEnd = now;
        previousStart = getDateRange(1);
        previousEnd = getDateRange(0);
        break;
      case 'weekly':
        currentStart = getDateRange(7);
        currentEnd = now;
        previousStart = getDateRange(14);
        previousEnd = getDateRange(7);
        break;
      case 'monthly':
        currentStart = getDateRange(30);
        currentEnd = now;
        previousStart = getDateRange(60);
        previousEnd = getDateRange(30);
        break;
      case 'yearly':
        currentStart = getDateRange(365);
        currentEnd = now;
        previousStart = getDateRange(730);
        previousEnd = getDateRange(365);
        break;
    }

    // Filter orders for current and previous periods
    const currentOrders = filterOrdersByDateRange(orders, currentStart, currentEnd);
    const previousOrders = filterOrdersByDateRange(orders, previousStart, previousEnd);

    // Calculate current metrics
    const currentRevenue = currentOrders.reduce((sum, order) => sum + order.total, 0);
    const currentItemsSold = currentOrders.reduce((sum, order) => {
      const items = order.items as Array<{ quantity: number }>;
      return sum + items.reduce((s, item) => s + item.quantity, 0);
    }, 0);
    const currentOrdersCount = currentOrders.length;

    // Calculate previous metrics
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
    const previousItemsSold = previousOrders.reduce((sum, order) => {
      const items = order.items as Array<{ quantity: number }>;
      return sum + items.reduce((s, item) => s + item.quantity, 0);
    }, 0);
    const previousOrdersCount = previousOrders.length;

    // Calculate inventory value (current stock)
    const inventoryValue = products
      .filter(p => p.is_active)
      .reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);

    // Generate chart data for revenue trend
    const chartData = generateChartData(currentOrders, selectedPeriod, currentStart, currentEnd);

    // Calculate top products by inventory value
    const topProducts = products
      .filter(p => p.is_active)
      .map(p => ({
        name: p.name,
        value: p.price * p.stock_quantity,
        percentage: 0 // Will calculate below
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Calculate percentages
    const totalInventoryValue = topProducts.reduce((sum, p) => sum + p.value, 0);
    topProducts.forEach(p => {
      p.percentage = totalInventoryValue > 0 ? (p.value / totalInventoryValue) * 100 : 0;
    });

    return {
      currentMetrics: {
        revenue: currentRevenue,
        itemsSold: currentItemsSold,
        ordersCount: currentOrdersCount,
        inventoryValue,
      },
      previousMetrics: {
        revenue: previousRevenue,
        itemsSold: previousItemsSold,
        ordersCount: previousOrdersCount,
        inventoryValue, // Inventory is current snapshot
      },
      chartData,
      topProductsData: topProducts,
    };
  }, [orders, products, selectedPeriod]);

  // Calculate trends
  const revenueTrend = calculateTrend(currentMetrics.revenue, previousMetrics.revenue);
  const itemsTrend = calculateTrend(currentMetrics.itemsSold, previousMetrics.itemsSold);
  const ordersTrend = calculateTrend(currentMetrics.ordersCount, previousMetrics.ordersCount);

  // Render trend indicator
  const TrendIndicator = ({ trend }: { trend: TrendData }) => {
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
      <span className={`flex items-center text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-500'}`}>
        {isUp ? <ArrowUp size={12} className="mr-0.5" /> : <ArrowDown size={12} className="mr-0.5" />}
        <span>{trend.percentage}%</span>
      </span>
    );
  };

  const periodLabels = {
    daily: { label: 'Today', comparison: 'vs Yesterday' },
    weekly: { label: 'This Week', comparison: 'vs Last Week' },
    monthly: { label: 'This Month', comparison: 'vs Last Month' },
    yearly: { label: 'This Year', comparison: 'vs Last Year' },
  };

  const currentLabel = periodLabels[selectedPeriod];

  const COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#3b82f6', '#f97316', '#a855f7', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="text-teal-600" size={28} />
              Sales & Inventory Analytics
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Comprehensive overview of your business performance
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly', 'yearly'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  selectedPeriod === period
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Revenue Card */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
            <DollarSign size={20} className="text-teal-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-teal-600 mb-1">
            £{currentMetrics.revenue.toFixed(2)}
          </p>
          <div className="flex items-center justify-between">
            <TrendIndicator trend={revenueTrend} />
            <span className="text-xs text-gray-400">{currentLabel.comparison}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">{currentLabel.label}</p>
        </div>

        {/* Items Sold Card */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-600">Items Sold</p>
            <Package size={20} className="text-indigo-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-indigo-600 mb-1">
            {currentMetrics.itemsSold.toLocaleString()}
          </p>
          <div className="flex items-center justify-between">
            <TrendIndicator trend={itemsTrend} />
            <span className="text-xs text-gray-400">{currentLabel.comparison}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Total quantity</p>
        </div>

        {/* Orders Count Card */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
            <ShoppingCart size={20} className="text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 mb-1">
            {currentMetrics.ordersCount}
          </p>
          <div className="flex items-center justify-between">
            <TrendIndicator trend={ordersTrend} />
            <span className="text-xs text-gray-400">{currentLabel.comparison}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Order count</p>
        </div>

        {/* Inventory Value Card */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-600">Inventory Value</p>
            <Box size={20} className="text-purple-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-purple-600 mb-1">
            £{currentMetrics.inventoryValue.toFixed(2)}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar size={12} />
              Current stock
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Total worth</p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} name="Revenue (£)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison Bar Chart */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Period Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              {
                name: 'Revenue',
                current: currentMetrics.revenue,
                previous: previousMetrics.revenue,
              },
              {
                name: 'Items Sold',
                current: currentMetrics.itemsSold,
                previous: previousMetrics.itemsSold,
              },
              {
                name: 'Orders',
                current: currentMetrics.ordersCount,
                previous: previousMetrics.ordersCount,
              },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="current" fill="#0d9488" name="Current Period" />
            <Bar dataKey="previous" fill="#94a3b8" name="Previous Period" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products by Inventory Value */}
      {topProductsData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Products by Inventory Value</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topProductsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topProductsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>

            {/* Product List */}
            <div className="space-y-2 overflow-y-auto max-h-[300px]">
              {topProductsData.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700 font-medium">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">£{product.value.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{product.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to generate chart data based on period
function generateChartData(orders: Order[], period: TimePeriod, startDate: Date, endDate: Date) {
  const data: { name: string; revenue: number }[] = [];

  if (period === 'daily') {
    // Show last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = filterOrdersByDateRange(orders, date, nextDate);
      const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);

      data.push({
        name: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
        revenue,
      });
    }
  } else if (period === 'weekly') {
    // Show last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekOrders = filterOrdersByDateRange(orders, weekStart, weekEnd);
      const revenue = weekOrders.reduce((sum, o) => sum + o.total, 0);

      data.push({
        name: `Week ${12 - i}`,
        revenue,
      });
    }
  } else if (period === 'monthly') {
    // Show last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthOrders = filterOrdersByDateRange(orders, monthStart, monthEnd);
      const revenue = monthOrders.reduce((sum, o) => sum + o.total, 0);

      data.push({
        name: monthStart.toLocaleDateString('en-GB', { month: 'short' }),
        revenue,
      });
    }
  } else if (period === 'yearly') {
    // Show last 5 years
    for (let i = 4; i >= 0; i--) {
      const yearStart = new Date();
      yearStart.setFullYear(yearStart.getFullYear() - i);
      yearStart.setMonth(0, 1);
      yearStart.setHours(0, 0, 0, 0);
      const yearEnd = new Date(yearStart);
      yearEnd.setFullYear(yearEnd.getFullYear() + 1);

      const yearOrders = filterOrdersByDateRange(orders, yearStart, yearEnd);
      const revenue = yearOrders.reduce((sum, o) => sum + o.total, 0);

      data.push({
        name: yearStart.getFullYear().toString(),
        revenue,
      });
    }
  }

  return data;
}
