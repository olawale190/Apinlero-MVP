// Order History Page
// Customer order history

import { useState } from 'react';
import { ArrowLeft, Package, ChevronDown, ChevronUp, Loader2, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../hooks/useOrders';
import { useCart } from '../../context/CartContext';
import { colors } from '../../config/colors';
import { shopConfig } from '../../config/shop';

export default function OrderHistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { orders, isLoading: ordersLoading } = useOrders();
  const { addToCart } = useCart();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = '/';
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReorder = (order: typeof orders[0]) => {
    order.items.forEach(item => {
      addToCart(
        {
          id: item.product_name, // Using name as fallback ID
          name: item.product_name,
          price: item.price,
          category: '',
          unit: '',
          is_active: true,
          created_at: new Date().toISOString()
        },
        item.quantity
      );
    });
    window.location.href = '/';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (authLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Back to shop"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Navigation */}
        <nav className="flex flex-wrap gap-2 mb-6">
          <a href="/account" className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100">
            Profile
          </a>
          <a href="/account/orders" className={`px-4 py-2 rounded-lg text-sm font-medium ${colors.tailwind.primaryMain} text-white`}>
            Orders
          </a>
          <a href="/account/addresses" className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100">
            Addresses
          </a>
          <a href="/account/wishlist" className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100">
            Wishlist
          </a>
        </nav>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
            <a
              href="/"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium ${colors.tailwind.primaryMain} ${colors.tailwind.primaryHover}`}
            >
              <ShoppingBag size={18} />
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Order Header */}
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-gray-900">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(order.created_at)} &middot; {order.items.length} item{order.items.length !== 1 ? 's' : ''} &middot; {shopConfig.currency}{order.total.toFixed(2)}
                    </div>
                  </div>
                  {expandedOrder === order.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Order Details */}
                {expandedOrder === order.id && (
                  <div className="border-t border-gray-100 p-4">
                    {/* Items */}
                    <div className="space-y-3 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.quantity}x {item.product_name}
                          </span>
                          <span className="text-gray-900 font-medium">
                            {shopConfig.currency}{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery</span>
                        <span className="text-gray-900">{shopConfig.currency}{order.delivery_fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-gray-900">Total</span>
                        <span className="text-gray-900">{shopConfig.currency}{order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                      <p className="text-sm text-gray-700">{order.delivery_address}</p>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-100 pt-4 mt-4 flex gap-3">
                      <button
                        onClick={() => handleReorder(order)}
                        className={`flex-1 py-2 rounded-lg text-white font-medium text-sm ${colors.tailwind.primaryMain} ${colors.tailwind.primaryHover}`}
                      >
                        Reorder
                      </button>
                      <a
                        href={`/track?order=${order.id}`}
                        className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm text-center hover:bg-gray-50"
                      >
                        Track Order
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
