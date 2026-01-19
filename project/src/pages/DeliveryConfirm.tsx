import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Package, MapPin, User, Phone, AlertCircle, Truck } from 'lucide-react';

interface Order {
  id: string;
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit: string;
  }>;
  total: number;
  status: string;
  delivery_fee: number;
  created_at: string;
}

interface DeliveryConfirmProps {
  orderId: string;
  token: string;
}

export default function DeliveryConfirm({ orderId, token }: DeliveryConfirmProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [driverNote, setDriverNote] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Order not found');
        return;
      }

      // Simple token validation (in production, use proper secure tokens)
      const expectedToken = btoa(orderId).slice(0, 8);
      if (token !== expectedToken) {
        setError('Invalid delivery link');
        return;
      }

      setOrder(data);

      if (data.status === 'Delivered') {
        setConfirmed(true);
      }
    } catch (err) {
      setError('Failed to load order');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order) return;

    setConfirming(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'Delivered',
          delivered_at: new Date().toISOString(),
          delivery_notes: driverNote || null
        })
        .eq('id', orderId);

      if (error) throw error;

      setConfirmed(true);
    } catch (err) {
      setError('Failed to confirm delivery');
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Delivery Confirmed!</h1>
          <p className="text-gray-600 mb-4">
            Order #{orderId.slice(0, 8).toUpperCase()} has been marked as delivered.
          </p>
          <p className="text-sm text-gray-500">
            Thank you for completing this delivery.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-teal-600 text-white rounded-t-lg p-4 text-center">
          <Truck className="w-10 h-10 mx-auto mb-2" />
          <h1 className="text-xl font-bold">Delivery Confirmation</h1>
          <p className="text-teal-100 text-sm">Order #{orderId.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Order Details */}
        <div className="bg-white shadow-lg rounded-b-lg">
          {/* Customer Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{order?.customer_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <a href={`tel:${order?.phone_number}`} className="font-medium text-teal-600">
                  {order?.phone_number}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p className="font-medium">{order?.delivery_address || 'No address provided'}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-gray-400" />
              <p className="font-medium text-gray-700">Items to Deliver</p>
            </div>
            <div className="space-y-2">
              {order?.items?.map((item, index) => (
                <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                  <span>{item.quantity}x {item.product_name}</span>
                  <span className="text-gray-500">{item.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between font-bold text-lg">
              <span>Order Total</span>
              <span className="text-teal-600">£{order?.total?.toFixed(2)}</span>
            </div>
          </div>

          {/* Driver Note */}
          <div className="p-4 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Note (optional)
            </label>
            <textarea
              value={driverNote}
              onChange={(e) => setDriverNote(e.target.value)}
              placeholder="e.g., Left with neighbour, handed to customer..."
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={2}
            />
          </div>

          {/* Confirm Button */}
          <div className="p-4">
            <button
              onClick={handleConfirmDelivery}
              disabled={confirming}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {confirming ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Confirm Delivery
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              By confirming, you verify that this order has been delivered to the customer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
