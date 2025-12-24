import { prisma } from '../lib/prisma';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

/**
 * Payment Service
 *
 * Handles payment processing for Isha Treat orders.
 * Designed to integrate with Nigerian payment gateways like Paystack or Flutterwave.
 *
 * To use this service:
 * 1. Sign up for Paystack (https://paystack.com) or Flutterwave (https://flutterwave.com)
 * 2. Add your API keys to .env:
 *    - PAYSTACK_SECRET_KEY=sk_live_xxxxx
 *    - PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
 * 3. Uncomment and implement the actual API calls
 */

interface InitializePaymentResult {
  authorization_url: string;
  reference: string;
  access_code: string;
}

interface VerifyPaymentResult {
  status: 'success' | 'failed' | 'pending';
  reference: string;
  amount: number;
  gateway_response: string;
}

export class PaymentService {
  // private paystackSecretKey: string;

  constructor() {
    // Uncomment when integrating with Paystack
    // this.paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || '';
  }

  /**
   * Initialize a payment session
   *
   * This creates a payment link that the customer can use to pay.
   * For mobile apps, this returns a URL to open in a WebView.
   */
  async initializePayment(
    orderId: string,
    email: string,
    amount: number, // Amount in Naira
    callbackUrl?: string
  ): Promise<InitializePaymentResult> {
    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new PaymentError('Order not found', 'ORDER_NOT_FOUND');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new PaymentError('Order is already paid', 'ALREADY_PAID');
    }

    // Generate unique reference
    const reference = `ISH_${orderId}_${Date.now()}`;

    // TODO: Implement actual Paystack API call
    // Example Paystack implementation:
    /*
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Paystack expects amount in kobo
        reference,
        callback_url: callbackUrl,
        metadata: {
          order_id: orderId,
          order_number: order.orderNumber,
        },
      }),
    });

    const data = await response.json();
    if (!data.status) {
      throw new PaymentError(data.message, 'PAYMENT_INIT_FAILED');
    }

    // Update payment record with reference
    await prisma.payment.updateMany({
      where: { orderId },
      data: { providerRef: reference },
    });

    return {
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      access_code: data.data.access_code,
    };
    */

    // Placeholder response for development
    console.log(`[Payment] Initialize payment for order ${orderId}, amount: ₦${amount}`);

    // Update payment record with reference
    await prisma.payment.updateMany({
      where: { orderId },
      data: { providerRef: reference },
    });

    return {
      authorization_url: `https://checkout.paystack.com/placeholder/${reference}`,
      reference,
      access_code: 'placeholder_access_code',
    };
  }

  /**
   * Verify a payment after callback
   *
   * Call this when the customer returns from the payment page
   * or when you receive a webhook notification.
   */
  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    // TODO: Implement actual Paystack verification
    // Example Paystack implementation:
    /*
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${this.paystackSecretKey}`,
        },
      }
    );

    const data = await response.json();
    if (!data.status) {
      throw new PaymentError(data.message, 'VERIFICATION_FAILED');
    }

    const { status, amount, gateway_response } = data.data;

    // Update payment and order status
    if (status === 'success') {
      await this.markPaymentSuccess(reference, JSON.stringify(data.data));
    } else if (status === 'failed') {
      await this.markPaymentFailed(reference, JSON.stringify(data.data));
    }

    return {
      status: status as 'success' | 'failed' | 'pending',
      reference,
      amount: amount / 100, // Convert from kobo to Naira
      gateway_response,
    };
    */

    // Placeholder for development
    console.log(`[Payment] Verify payment with reference: ${reference}`);

    return {
      status: 'pending',
      reference,
      amount: 0,
      gateway_response: 'Placeholder - implement actual payment verification',
    };
  }

  /**
   * Handle webhook notification from payment provider
   *
   * Webhooks are the most reliable way to get payment status.
   * Configure your webhook URL in Paystack dashboard.
   */
  async handleWebhook(
    event: string,
    data: Record<string, unknown>
  ): Promise<void> {
    console.log(`[Payment] Webhook received: ${event}`, data);

    switch (event) {
      case 'charge.success':
        await this.markPaymentSuccess(
          data.reference as string,
          JSON.stringify(data)
        );
        break;
      case 'charge.failed':
        await this.markPaymentFailed(
          data.reference as string,
          JSON.stringify(data)
        );
        break;
      default:
        console.log(`[Payment] Unhandled webhook event: ${event}`);
    }
  }

  /**
   * Mark payment as successful
   */
  async markPaymentSuccess(
    reference: string,
    providerResponse: string
  ): Promise<void> {
    const payment = await prisma.payment.findFirst({
      where: { providerRef: reference },
    });

    if (!payment) {
      throw new PaymentError('Payment not found', 'PAYMENT_NOT_FOUND');
    }

    await prisma.$transaction([
      // Update payment
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          providerResponse,
        },
      }),
      // Update order
      prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: PaymentStatus.PAID },
      }),
    ]);
  }

  /**
   * Mark payment as failed
   */
  async markPaymentFailed(
    reference: string,
    providerResponse: string
  ): Promise<void> {
    const payment = await prisma.payment.findFirst({
      where: { providerRef: reference },
    });

    if (!payment) {
      throw new PaymentError('Payment not found', 'PAYMENT_NOT_FOUND');
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        providerResponse,
      },
    });
  }

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(orderId: string) {
    return prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Process refund (Admin only)
   */
  async processRefund(paymentId: string, reason: string): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new PaymentError('Payment not found', 'PAYMENT_NOT_FOUND');
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new PaymentError('Payment is not in PAID status', 'INVALID_STATUS');
    }

    // TODO: Implement actual refund with payment provider
    // Example Paystack refund:
    /*
    const response = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: payment.providerRef,
        merchant_note: reason,
      }),
    });
    */

    console.log(`[Payment] Process refund for payment ${paymentId}: ${reason}`);

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REFUNDED },
    });
  }
}

/**
 * Custom payment error class
 */
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
