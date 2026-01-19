import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { colors } from '../config/colors';
import { shopConfig } from '../config/shop';

interface OrderData {
  id: string;
  customer_name: string;
  phone_number: string;
  status: 'Pending' | 'Confirmed' | 'Delivered';
  total: number;
  delivery_fee: number;
  delivery_method: string;
  delivery_address: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
    unit: string;
  }>;
  created_at: string;
}

const statusSteps = [
  { key: 'Pending', label: 'Order Received', icon: Clock, description: 'We\'ve received your order' },
  { key: 'Confirmed', label: 'Confirmed', icon: Package, description: 'Your order is being prepared' },
  { key: 'Delivered', label: 'Delivered', icon: CheckCircle, description: 'Order delivered successfully' }
];

export default function OrderTracking() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    setIsLoading(true);
    setSearched(true);

    try {
      // Search by order ID (first 8 chars) and phone number
      const searchId = orderId.toUpperCase().replace(/[^A-Z0-9]/g, '');

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .or(`id.ilike.${searchId}%,phone_number.ilike.%${phone.replace(/\s/g, '')}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Order not found. Please check your order ID and phone number.');
        return;
      }

      // Verify phone matches (last 4 digits)
      const orderPhone = data.phone_number?.replace(/\D/g, '') || '';
      const searchPhone = phone.replace(/\D/g, '');
      if (!orderPhone.endsWith(searchPhone.slice(-4)) && !data.id.toUpperCase().startsWith(searchId)) {
        setError('Order not found. Please check your order ID and phone number.');
        return;
      }

      setOrder(data as OrderData);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search for order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex(s => s.key === status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`${colors.tailwind.primaryDark} text-white`}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <a
            href="/store/ishas-treat"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </a>
          <h1 className="text-2xl font-bold">Track Your Order</h1>
          <p className="text-white/80 mt-1">Enter your order details to check status</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order ID
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g., ABC12345"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">First 8 characters from your confirmation</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., 07700 900123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Phone number used when ordering</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || (!orderId && !phone)}
              className={`w-full ${colors.tailwind.primaryMain} text-white py-3 rounded-lg font-medium ${colors.tailwind.primaryHover} transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Track Order
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Status Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-6">Order Status</h2>

              <div className="relative">
                {statusSteps.map((step, index) => {
                  const currentIndex = getStatusIndex(order.status);
                  const isCompleted = index <= currentIndex;
                  const isCurrent = index === currentIndex;

                  return (
                    <div key={step.key} className="flex items-start gap-4 pb-8 last:pb-0">
                      {/* Line */}
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`absolute left-5 top-10 w-0.5 h-12 ${
                            index < currentIndex ? 'bg-teal-500' : 'bg-gray-200'
                          }`}
                          style={{ marginLeft: '-1px' }}
                        />
                      )}

                      {/* Icon */}
                      <div
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-teal-500 text-white'
                            : 'bg-gray-200 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-teal-100' : ''}`}
                      >
                        <step.icon className="w-5 h-5" />
                      </div>

                      {/* Text */}
                      <div className="flex-1 pt-1">
                        <h3
                          className={`font-medium ${
                            isCompleted ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </h3>
                        <p className="text-sm text-gray-500">{step.description}</p>
                        {isCurrent && (
                          <span className="inline-block mt-2 px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded">
                            Current Status
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium font-mono">{order.id.slice(0, 8).toUpperCase()}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">{formatDate(order.created_at)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Delivery Method</p>
                  <p className="font-medium flex items-center gap-2">
                    {order.delivery_method === 'collection' ? (
                      <>
                        <Package className="w-4 h-4 text-gray-400" />
                        Collection
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4 text-gray-400" />
                        Delivery
                      </>
                    )}
                  </p>
                </div>

                {order.delivery_method !== 'collection' && (
                  <div>
                    <p className="text-sm text-gray-500">Delivery Address</p>
                    <p className="font-medium">{order.delivery_address}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-3">Items Ordered</h3>
                <div className="space-y-2">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product_name} x {item.quantity}
                      </span>
                      <span className="font-medium">
                        {shopConfig.currency}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{shopConfig.currency}{(order.total - order.delivery_fee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery</span>
                    <span>{shopConfig.currency}{order.delivery_fee?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className={colors.tailwind.primaryMainText}>
                      {shopConfig.currency}{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-gray-600">
                Need help with your order?{' '}
                <a
                  href={`https://wa.me/447448682282?text=Hi, I need help with order ${order.id.slice(0, 8).toUpperCase()}`}
                  className={`${colors.tailwind.primaryMainText} font-medium hover:underline`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contact us on WhatsApp
                </a>
              </p>
            </div>
          </div>
        )}

        {/* No Order Yet */}
        {searched && !order && !error && !isLoading && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No order found with those details</p>
          </div>
        )}
      </main>
    </div>
  );
}
