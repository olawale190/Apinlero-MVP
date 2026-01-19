import { loadStripe, Stripe } from '@stripe/stripe-js';

// ==============================================================================
// STRIPE PAYMENT INTEGRATION
// ==============================================================================

// Initialize Stripe (replace with your actual publishable key in production)
// For now, this is a test key placeholder
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get Stripe instance (lazy loading)
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise || Promise.resolve(null);
};

/**
 * Create a payment intent for an order
 * Note: In production, this should be done server-side via Supabase Edge Functions
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'gbp',
  orderId: string
): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  try {
    // For MVP demo purposes only - In production, this MUST be server-side
    // You would call a Supabase Edge Function here that creates the payment intent
    // using your Stripe secret key (server-side only)

    console.warn('⚠️ Payment intent creation should be server-side in production');

    // Placeholder return for demo
    // In production, replace with:
    // const response = await supabase.functions.invoke('create-payment-intent', {
    //   body: { amount, currency, orderId }
    // });
    // return response.data;

    return {
      clientSecret: 'demo_client_secret',
      paymentIntentId: 'demo_payment_intent_' + orderId,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return null;
  }
}

/**
 * Process a card payment
 */
export async function processCardPayment(
  clientSecret: string,
  cardElement: any // Stripe CardElement
): Promise<{ success: boolean; error?: string; paymentIntentId?: string }> {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      return { success: false, error: 'Stripe not initialized' };
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (paymentIntent?.status === 'succeeded') {
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
      };
    }

    return { success: false, error: 'Payment failed' };
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate order total with delivery fee
 */
export function calculateOrderTotal(
  items: Array<{ price: number; quantity: number }>,
  deliveryFee: number = 5.0
): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return Number((subtotal + deliveryFee).toFixed(2));
}

/**
 * Format amount for Stripe (convert £25.50 to 2550 pence)
 */
export function formatAmountForStripe(amount: number, currency: string = 'gbp'): number {
  // For zero-decimal currencies (e.g., JPY), return amount as-is
  const zeroDecimalCurrencies = ['jpy', 'krw'];
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }

  // For currencies with decimals, multiply by 100
  return Math.round(amount * 100);
}

/**
 * Format amount from Stripe (convert 2550 pence to £25.50)
 */
export function formatAmountFromStripe(amount: number, currency: string = 'gbp'): number {
  const zeroDecimalCurrencies = ['jpy', 'krw'];
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return amount;
  }

  return amount / 100;
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number): {
  valid: boolean;
  error?: string;
} {
  // Minimum charge in GBP is £0.30
  if (amount < 0.3) {
    return { valid: false, error: 'Minimum payment amount is £0.30' };
  }

  // Maximum reasonable order
  if (amount > 10000) {
    return { valid: false, error: 'Payment amount exceeds maximum (£10,000)' };
  }

  // Check for valid decimal places
  if (!/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
    return { valid: false, error: 'Invalid amount format (max 2 decimal places)' };
  }

  return { valid: true };
}

// ==============================================================================
// PAYMENT METHODS
// ==============================================================================

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'Cash',
    description: 'Cash on delivery or in-store',
    enabled: true,
    icon: '💷',
  },
  {
    id: 'card',
    name: 'Card Payment',
    description: 'Debit or credit card (Stripe)',
    enabled: true,
    icon: '💳',
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct bank transfer',
    enabled: true,
    icon: '🏦',
  },
  {
    id: 'online',
    name: 'Online Payment',
    description: 'Pay via website',
    enabled: true,
    icon: '🌐',
  },
];

/**
 * Get payment method by ID
 */
export function getPaymentMethod(id: string): PaymentMethod | undefined {
  return PAYMENT_METHODS.find(method => method.id === id);
}

/**
 * Check if payment method requires online processing
 */
export function requiresOnlineProcessing(paymentMethod: string): boolean {
  return ['card', 'online'].includes(paymentMethod);
}

// ==============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// ==============================================================================

/**
 * Verify Stripe webhook signature
 * Note: This should be done server-side in Supabase Edge Functions
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // This is a placeholder - actual verification happens server-side
  // In production, use Stripe's constructEvent method in your Edge Function
  console.warn('⚠️ Webhook verification should be server-side');
  return false;
}

// ==============================================================================
// ERROR HANDLING
// ==============================================================================

export interface StripeError {
  type: string;
  message: string;
  code?: string;
}

export function handleStripeError(error: any): StripeError {
  if (error.type === 'card_error') {
    return {
      type: 'card_error',
      message: error.message || 'Card was declined',
      code: error.code,
    };
  }

  if (error.type === 'validation_error') {
    return {
      type: 'validation_error',
      message: 'Invalid payment details',
      code: error.code,
    };
  }

  return {
    type: 'unknown_error',
    message: 'An unexpected error occurred. Please try again.',
  };
}
