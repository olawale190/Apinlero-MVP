import { useState, FormEvent, useEffect } from 'react';
import { ArrowLeft, CreditCard, Lock, Shield } from 'lucide-react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { shopConfig } from '../config/shop';
import { supabase } from '../lib/supabase';
import { Order, OrderItem } from '../types';
import { colors } from '../config/colors';
import { sendOrderNotifications } from '../lib/notifications';
import { useBusinessContext } from '../contexts/BusinessContext';
import StripePaymentForm from '../components/StripePaymentForm';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutProps {
  onBack: () => void;
  onSuccess: (orderId: string) => void;
}

export default function Checkout({ onBack, onSuccess }: CheckoutProps) {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { business } = useBusinessContext();
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'collection'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    postcode: '',
    notes: ''
  });

  const subtotal = getCartTotal();
  const deliveryFee = deliveryMethod === 'delivery' ? shopConfig.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  const handlePaymentSuccess = async () => {
    if (!currentOrderId) return;

    try {
      // Send order confirmation notifications
      const orderItems: OrderItem[] = cartItems.map(item => ({
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        unit: item.product.unit
      }));

      sendOrderNotifications({
        orderId: currentOrderId,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        total: total,
        items: orderItems,
        deliveryMethod: deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? `${formData.address}, ${formData.postcode}` : undefined
      }).catch(console.error);

      clearCart();
      setClientSecret(null);
      onSuccess(currentOrderId);
    } catch (err: any) {
      console.error('Post-payment error:', err);
      setError('Payment succeeded but there was an error. Please contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setIsSubmitting(false);
  };

  const handleStripePayment = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      // Log business context status (non-blocking - checkout works without it pre-migration)
      if (!business?.id) {
        console.warn('[Checkout] No business context - proceeding without business_id');
      }

      // Validate form
      if (!formData.name || !formData.phone) {
        throw new Error('Please fill in all required fields');
      }
      if (deliveryMethod === 'delivery' && (!formData.address || !formData.postcode)) {
        throw new Error('Please provide delivery address and postcode');
      }

      // Get auth token (use anon key for guest checkout if no session)
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const verifyResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-order-total`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            businessId: business?.id || null,
            items: cartItems.map(item => ({
              product_name: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
            })),
            deliveryFee: deliveryFee,
            clientTotal: total,
          }),
        }
      );

      if (!verifyResponse.ok) {
        const verifyError = await verifyResponse.json();
        throw new Error(verifyError.error || 'Price verification failed');
      }

      const { valid, verifiedTotal } = await verifyResponse.json();

      if (!valid) {
        throw new Error('Price verification failed. Please refresh and try again.');
      }

      // Create order first with verified items
      const orderItems: OrderItem[] = cartItems.map(item => ({
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        unit: item.product.unit
      }));

      const order: Record<string, unknown> = {
        customer_name: formData.name,
        phone_number: formData.phone,
        email: formData.email,
        delivery_address: deliveryMethod === 'delivery'
          ? `${formData.address}, ${formData.postcode}`
          : 'Collection',
        channel: 'Web',
        items: orderItems,
        delivery_fee: deliveryFee,
        total: total,
        status: 'Pending',
        notes: `Payment: Card (Stripe)${formData.notes ? `. ${formData.notes}` : ''}`,
        delivery_method: deliveryMethod,
        payment_method: 'card'
      };
      if (business?.id) order.business_id = business.id;

      let { data, error: insertError } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .maybeSingle();

      // Retry without business_id if column doesn't exist
      if (insertError && insertError.message?.includes('business_id')) {
        delete order.business_id;
        ({ data, error: insertError } = await supabase.from('orders').insert(order).select().maybeSingle());
      }

      if (insertError) throw insertError;
      if (!data) throw new Error('Failed to create order');

      // SECURITY FIX: Create real Stripe Payment Intent via edge function
      // Use verifiedTotal instead of client-side total
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            businessId: business?.id || null,
            amount: verifiedTotal, // SECURITY: Use server-verified total
            currency: shopConfig.currency.toLowerCase(),
            orderId: data.id,
            customerEmail: formData.email,
            customerName: formData.name,
            description: `Order #${data.id} - ${cartItems.length} item(s)`,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret: secret } = await response.json();

      // Store client secret and order ID for payment form
      setClientSecret(secret);
      setCurrentOrderId(data.id);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err?.message || 'Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBankTransfer = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Log business context status (non-blocking - checkout works without it pre-migration)
      if (!business?.id) {
        console.warn('[Checkout] No business context - proceeding without business_id');
      }

      const orderItems: OrderItem[] = cartItems.map(item => ({
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        unit: item.product.unit
      }));

      const order: Record<string, unknown> = {
        customer_name: formData.name,
        phone_number: formData.phone,
        email: formData.email,
        delivery_address: deliveryMethod === 'delivery'
          ? `${formData.address}, ${formData.postcode}`
          : 'Collection',
        channel: 'Web',
        items: orderItems,
        delivery_fee: deliveryFee,
        total: total,
        status: 'Pending',
        notes: `Payment: Bank Transfer - Awaiting Payment${formData.notes ? `. ${formData.notes}` : ''}`,
        delivery_method: deliveryMethod,
        payment_method: 'bank_transfer'
      };
      if (business?.id) order.business_id = business.id;

      let { data, error: insertError } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .maybeSingle();

      if (insertError && insertError.message?.includes('business_id')) {
        delete order.business_id;
        ({ data, error: insertError } = await supabase.from('orders').insert(order).select().maybeSingle());
      }

      if (insertError) throw insertError;
      if (!data) throw new Error('Failed to create order');

      // Send order confirmation notifications (email + WhatsApp)
      sendOrderNotifications({
        orderId: data.id,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        total: total,
        items: orderItems,
        deliveryMethod: deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? `${formData.address}, ${formData.postcode}` : undefined
      }).catch(console.error); // Fire and forget

      clearCart();
      onSuccess(data.id);
    } catch (err: any) {
      console.error('Order submission error:', err);
      setError(err?.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'card') {
      handleStripePayment();
    } else {
      handleBankTransfer(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Shop</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
                <h2 className="text-xl font-semibold mb-4">Delivery Method</h2>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                      deliveryMethod === 'delivery'
                        ? 'border-teal-600 bg-teal-50 text-teal-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('collection')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                      deliveryMethod === 'collection'
                        ? 'border-teal-600 bg-teal-50 text-teal-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Collection
                  </button>
                </div>

                {deliveryMethod === 'delivery' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Address *
                      </label>
                      <textarea
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postcode *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.postcode}
                        onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Secure Payment</h2>
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <Shield size={16} />
                    <span>SSL Secured</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Card Payment Option */}
                  <label
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="w-4 h-4 text-teal-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="text-teal-600" size={20} />
                        <span className="font-semibold">Pay with Card</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Recommended</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Secure payment via Stripe</p>
                    </div>
                    <div className="flex gap-1">
                      <img src="https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/gb.svg" alt="UK" className="h-4 w-6 rounded" />
                      <div className="bg-blue-900 text-white text-xs px-1 rounded font-bold">VISA</div>
                      <div className="bg-red-500 text-white text-xs px-1 rounded font-bold">MC</div>
                    </div>
                  </label>

                  {paymentMethod === 'card' && clientSecret && (
                    <div className="ml-7 mt-4">
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: 'stripe',
                            variables: {
                              colorPrimary: '#0f766e',
                            },
                          },
                        }}
                      >
                        <StripePaymentForm
                          amount={total}
                          currency={shopConfig.currency}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      </Elements>
                    </div>
                  )}

                  {paymentMethod === 'card' && !clientSecret && (
                    <div className="ml-7 p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Lock size={14} />
                        <span>Complete your details above to proceed with payment</span>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Option */}
                  <label
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="w-4 h-4 text-teal-600"
                    />
                    <div className="flex-1">
                      <span className="font-semibold">Bank Transfer</span>
                      <p className="text-sm text-gray-500 mt-1">Manual transfer (order held until payment received)</p>
                    </div>
                  </label>

                  {paymentMethod === 'bank_transfer' && (
                    <div className="ml-7 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-800 font-medium mb-2">Bank Details:</p>
                      <div className="text-sm space-y-1 text-amber-900">
                        <p>Bank: <span className="font-medium">Monzo Bank</span></p>
                        <p>Account: <span className="font-medium">Isha's Treat</span></p>
                        <p>Sort Code: <span className="font-medium">04-00-04</span></p>
                        <p>Account No: <span className="font-medium">12345678</span></p>
                      </div>
                      <p className="text-xs text-amber-700 mt-2">Use your order number as payment reference</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Any special instructions..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Only show submit button for bank transfer or card payment setup */}
              {(paymentMethod === 'bank_transfer' || (paymentMethod === 'card' && !clientSecret)) && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-600 text-white py-4 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : paymentMethod === 'card' ? (
                    <>
                      <Lock size={18} />
                      Continue to Payment
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              )}

              <p className="text-center text-xs text-gray-500">
                <Lock size={12} className="inline mr-1" />
                Your payment information is encrypted and secure
              </p>
            </form>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                {cartItems.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="font-medium">
                      {shopConfig.currency}{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{shopConfig.currency}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">{shopConfig.currency}{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span className="text-teal-600">{shopConfig.currency}{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Badges */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-center gap-4 text-gray-400">
                  <div className="flex items-center gap-1 text-xs">
                    <Shield size={14} />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Lock size={14} />
                    <span>Encrypted</span>
                  </div>
                  <div className="text-xs">
                    Powered by <span className="font-semibold text-purple-600">Stripe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
