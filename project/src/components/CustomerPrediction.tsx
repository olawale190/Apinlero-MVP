import { useState } from 'react';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  MessageCircle,
  ChevronRight,
  Clock,
  ShoppingCart,
  Heart,
  UserX
} from 'lucide-react';
import type { Order } from '../lib/supabase';

interface CustomerPredictionProps {
  orders: Order[];
}

interface CustomerData {
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: Date;
  avgOrderValue: number;
  daysSinceLastOrder: number;
  predictedProducts: string[];
  status: 'active' | 'at-risk' | 'churned';
  predictedNextOrder: number; // days
}

export default function CustomerPrediction({ orders }: CustomerPredictionProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [activeTab, setActiveTab] = useState<'predictions' | 'at-risk'>('predictions');

  // Analyze customer data
  const analyzeCustomers = (): CustomerData[] => {
    const customerMap = new Map<string, {
      name: string;
      phone: string;
      orders: Order[];
    }>();

    orders.forEach(order => {
      const key = order.phone_number;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          name: order.customer_name,
          phone: order.phone_number,
          orders: []
        });
      }
      customerMap.get(key)!.orders.push(order);
    });

    const today = new Date();
    const customers: CustomerData[] = [];

    customerMap.forEach((data) => {
      const sortedOrders = data.orders.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const lastOrderDate = new Date(sortedOrders[0].created_at);
      const daysSinceLastOrder = Math.floor(
        (today.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const totalSpent = data.orders.reduce((sum, o) => sum + o.total, 0);
      const avgOrderValue = totalSpent / data.orders.length;

      // Calculate average days between orders
      let avgDaysBetweenOrders = 14; // default
      if (sortedOrders.length >= 2) {
        let totalDays = 0;
        for (let i = 0; i < sortedOrders.length - 1; i++) {
          const diff = new Date(sortedOrders[i].created_at).getTime() -
            new Date(sortedOrders[i + 1].created_at).getTime();
          totalDays += diff / (1000 * 60 * 60 * 24);
        }
        avgDaysBetweenOrders = Math.round(totalDays / (sortedOrders.length - 1));
      }

      // Determine status
      let status: 'active' | 'at-risk' | 'churned' = 'active';
      if (daysSinceLastOrder > avgDaysBetweenOrders * 2) {
        status = 'churned';
      } else if (daysSinceLastOrder > avgDaysBetweenOrders * 1.5) {
        status = 'at-risk';
      }

      // Predict next products based on purchase history
      const productCounts = data.orders
        .flatMap(o => Array.isArray(o.items) ? o.items : [])
        .reduce((acc, item) => {
          acc[item.product_name] = (acc[item.product_name] || 0) + item.quantity;
          return acc;
        }, {} as Record<string, number>);

      const predictedProducts = Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name]) => name);

      // Predict next order date
      const predictedNextOrder = Math.max(0, avgDaysBetweenOrders - daysSinceLastOrder);

      customers.push({
        name: data.name,
        phone: data.phone,
        orderCount: data.orders.length,
        totalSpent,
        lastOrder: lastOrderDate,
        avgOrderValue,
        daysSinceLastOrder,
        predictedProducts,
        status,
        predictedNextOrder
      });
    });

    return customers.sort((a, b) => b.totalSpent - a.totalSpent);
  };

  const customers = analyzeCustomers();
  const atRiskCustomers = customers.filter(c => c.status === 'at-risk' || c.status === 'churned');
  const activeCustomers = customers.filter(c => c.status === 'active');

  // Customers likely to order soon
  const likelyToOrderSoon = customers
    .filter(c => c.status === 'active' && c.predictedNextOrder <= 3)
    .sort((a, b) => a.predictedNextOrder - b.predictedNextOrder);

  const getStatusBadge = (status: CustomerData['status']) => {
    switch (status) {
      case 'active':
        return <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Active</span>;
      case 'at-risk':
        return <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">At Risk</span>;
      case 'churned':
        return <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Inactive</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2">
            <Users className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm sm:text-lg">Customer Intelligence</h2>
            <p className="text-purple-100 text-xs sm:text-sm">AI-powered predictions & insights</p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 border-b">
        <div className="text-center">
          <p className="text-xl font-bold text-green-600">{activeCustomers.length}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-orange-500">{atRiskCustomers.filter(c => c.status === 'at-risk').length}</p>
          <p className="text-xs text-gray-500">At Risk</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-red-500">{atRiskCustomers.filter(c => c.status === 'churned').length}</p>
          <p className="text-xs text-gray-500">Inactive</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('predictions')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'predictions'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp size={16} />
            Predictions
          </div>
        </button>
        <button
          onClick={() => setActiveTab('at-risk')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'at-risk'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle size={16} />
            At Risk ({atRiskCustomers.length})
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'predictions' ? (
          <div className="space-y-4">
            {/* Likely to Order Soon */}
            {likelyToOrderSoon.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock size={16} className="text-purple-600" />
                  Likely to Order Soon
                </h3>
                <div className="space-y-2">
                  {likelyToOrderSoon.slice(0, 3).map((customer, idx) => (
                    <div
                      key={idx}
                      className="border border-purple-200 bg-purple-50 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{customer.name}</p>
                          <p className="text-xs text-gray-500">
                            Expected in ~{customer.predictedNextOrder} days
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-purple-600">
                            £{customer.avgOrderValue.toFixed(0)} avg
                          </p>
                          <p className="text-xs text-gray-500">{customer.orderCount} orders</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">
                          <strong>Predicted:</strong> {customer.predictedProducts.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Customers */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Heart size={16} className="text-red-500" />
                Top Customers
              </h3>
              <div className="space-y-2">
                {customers.slice(0, 5).map((customer, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{customer.name}</p>
                          <p className="text-xs text-gray-500">Last order: {customer.daysSinceLastOrder} days ago</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">£{customer.totalSpent.toFixed(0)}</p>
                        {getStatusBadge(customer.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {atRiskCustomers.length === 0 ? (
              <div className="text-center py-8">
                <UserX className="text-gray-300 mx-auto mb-3" size={40} />
                <p className="text-gray-500">No at-risk customers</p>
                <p className="text-xs text-gray-400">All your customers are active!</p>
              </div>
            ) : (
              atRiskCustomers.map((customer, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all ${
                    customer.status === 'churned'
                      ? 'border-red-200 bg-red-50'
                      : 'border-orange-200 bg-orange-50'
                  }`}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{customer.name}</p>
                      <p className="text-xs text-gray-500">
                        Last order: {customer.daysSinceLastOrder} days ago
                      </p>
                    </div>
                    {getStatusBadge(customer.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">
                      Lifetime value: £{customer.totalSpent.toFixed(0)}
                    </p>
                    <button
                      className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${
                        customer.status === 'churned'
                          ? 'bg-red-600 text-white'
                          : 'bg-orange-600 text-white'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Would trigger WhatsApp message
                      }}
                    >
                      <MessageCircle size={12} />
                      Win Back
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-800">{selectedCustomer.name}</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{selectedCustomer.orderCount}</p>
                  <p className="text-xs text-gray-500">Total Orders</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">£{selectedCustomer.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">Lifetime Value</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">🔮 Predicted Next Order</h4>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Products:</strong> {selectedCustomer.predictedProducts.join(', ')}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Estimated Value:</strong> £{selectedCustomer.avgOrderValue.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Expected In:</strong> ~{selectedCustomer.predictedNextOrder} days
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <MessageCircle size={16} />
                  Send Reminder
                </button>
                <button className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <ShoppingCart size={16} />
                  Pre-prepare Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
