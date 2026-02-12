import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// ==============================================================================
// STRIPE PAYMENT INTEGRATION
// ==============================================================================

// Initialize Stripe with publishable key
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
 * Calls Supabase Edge Function to create payment intent server-side
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'gbp',
  orderId: string,
  customerEmail?: string,
  customerName?: string
): Promise<{
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
} | null> {
  try {
    // Validate amount before calling edge function
    const validation = validatePaymentAmount(amount);
    if (!validation.valid) {
      console.error('Payment validation failed:', validation.error);
      return null;
    }

    // Call Supabase Edge Function to create payment intent
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        amount,
        currency,
        orderId,
        customerEmail,
        customerName,
        description: `Apinlero Order ${orderId}`,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      return null;
    }

    if (!data?.clientSecret) {
      console.error('No client secret returned from payment intent');
      return null;
    }

    console.log(`Payment intent created: ${data.paymentIntentId}`);

    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
      amount: data.amount,
      currency: data.currency,
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
 * IMPORTANT: Webhook verification MUST happen server-side (Supabase Edge Functions).
 * Use Stripe's constructEvent() method in your Edge Function with the webhook signing secret.
 * This client-side stub throws to prevent accidental misuse.
 */
export function verifyWebhookSignature(
  _payload: string,
  _signature: string,
  _secret: string
): never {
  throw new Error(
    'verifyWebhookSignature cannot be called client-side. ' +
    'Implement webhook verification in your Supabase Edge Function using stripe.webhooks.constructEvent().'
  );
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

// ==============================================================================
// PER-BUSINESS STRIPE ACCOUNTS (Option A)
// ==============================================================================

/**
 * Get Stripe instance for a specific business
 * Each business has their own Stripe account and API keys
 *
 * @param businessId - The business ID to get Stripe keys for
 * @returns Stripe instance or null if not configured
 */
export async function getBusinessStripe(businessId: string): Promise<Stripe | null> {
  try {
    // Fetch business Stripe keys from database
    const { data: business, error } = await supabase
      .from('businesses')
      .select('stripe_publishable_key')
      .eq('id', businessId)
      .single();

    if (error) {
      console.error('Error fetching business Stripe keys:', error);
      return null;
    }

    if (!business?.stripe_publishable_key) {
      console.warn('No Stripe keys found for business:', businessId);
      return null;
    }

    // Validate key format
    if (!business.stripe_publishable_key.startsWith('pk_')) {
      console.error('Invalid Stripe publishable key format');
      return null;
    }

    // Load Stripe with business's publishable key
    return await loadStripe(business.stripe_publishable_key);
  } catch (error) {
    console.error('Error loading business Stripe:', error);
    return null;
  }
}

/**
 * Create payment intent using business's Stripe account
 *
 * @param businessId - The business ID
 * @param amount - Amount in currency units (e.g., £25.50)
 * @param orderId - The order ID
 * @param customerEmail - Optional customer email
 * @param customerName - Optional customer name
 * @returns Payment intent details or null
 */
export async function createBusinessPaymentIntent(
  businessId: string,
  amount: number,
  orderId: string,
  customerEmail?: string,
  customerName?: string
): Promise<{
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
} | null> {
  try {
    // Validate amount
    const validation = validatePaymentAmount(amount);
    if (!validation.valid) {
      console.error('Payment validation failed:', validation.error);
      return null;
    }

    // Call Supabase Edge Function with business ID
    // The Edge Function will fetch the business's secret key server-side
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        businessId,  // NEW: specify which business
        amount,
        currency: 'gbp',
        orderId,
        customerEmail,
        customerName,
        description: `Order ${orderId}`,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      return null;
    }

    if (!data?.clientSecret) {
      console.error('No client secret returned from payment intent');
      return null;
    }

    console.log(`Payment intent created for business ${businessId}: ${data.paymentIntentId}`);

    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
      amount: data.amount,
      currency: data.currency,
    };
  } catch (error) {
    console.error('Error creating business payment intent:', error);
    return null;
  }
}

/**
 * Check if a business has Stripe connected
 *
 * @param businessId - The business ID
 * @returns boolean indicating if Stripe is configured
 */
export async function isStripeConnected(businessId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('stripe_publishable_key')
      .eq('id', businessId)
      .single();

    if (error) return false;

    return !!data?.stripe_publishable_key;
  } catch (error) {
    return false;
  }
}

/**
 * Get business Stripe connection status
 *
 * @param businessId - The business ID
 * @returns Connection status details
 */
export async function getStripeStatus(businessId: string): Promise<{
  connected: boolean;
  testMode: boolean;
  connectedAt: string | null;
} | null> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('stripe_publishable_key, stripe_connected_at')
      .eq('id', businessId)
      .single();

    if (error) return null;

    const connected = !!data?.stripe_publishable_key;
    const testMode = data?.stripe_publishable_key?.includes('_test_') ?? false;

    return {
      connected,
      testMode,
      connectedAt: data?.stripe_connected_at || null,
    };
  } catch (error) {
    return null;
  }
}
