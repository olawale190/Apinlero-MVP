/**
 * Stripe Payment Form Component
 * Handles secure card payment collection using Stripe Elements
 */

import { useState, FormEvent } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock } from 'lucide-react';
import { colors } from '../config/colors';

interface StripePaymentFormProps {
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripePaymentForm({
  amount,
  currency,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-success`, // Optional: for redirect-based flows
        },
        redirect: 'if_required', // Don't redirect, handle in-page
      });

      if (error) {
        onError(error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      } else {
        onError('Payment was not completed. Please try again.');
      }
    } catch (err: any) {
      onError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white border rounded-lg p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full ${colors.tailwind.primaryMain} text-white py-4 rounded-lg font-semibold ${colors.tailwind.primaryHover} transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing Payment...
          </>
        ) : (
          <>
            <Lock size={18} />
            Pay {currency.toUpperCase()} {amount.toFixed(2)} Securely
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-500">
        <Lock size={12} className="inline mr-1" />
        Your payment information is encrypted and secure
      </p>
    </form>
  );
}
