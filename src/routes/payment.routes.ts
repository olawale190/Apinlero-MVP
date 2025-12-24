import { Router, Request, Response } from 'express';
import { paymentService, PaymentError } from '../services/payment.service';
import { authenticate, authorize } from '../middleware/auth';
import { validate, idSchema } from '../middleware/validate';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const initializePaymentSchema = z.object({
  orderId: idSchema,
  callbackUrl: z.string().url().optional(),
});

// ============================================
// Payment Routes
// ============================================

/**
 * @route   POST /api/payments/initialize
 * @desc    Initialize a payment for an order
 * @access  Private
 */
router.post(
  '/initialize',
  authenticate,
  validate({ body: initializePaymentSchema }),
  async (req: Request, res: Response) => {
    try {
      const { orderId, callbackUrl } = req.body;

      // Verify order belongs to user
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: req.user!.id,
        },
      });

      if (!order) {
        res.status(404).json({
          error: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        });
        return;
      }

      const result = await paymentService.initializePayment(
        orderId,
        req.user!.email,
        order.total,
        callbackUrl
      );

      res.json({
        message: 'Payment initialized',
        data: result,
      });
    } catch (error) {
      if (error instanceof PaymentError) {
        const statusCodes: Record<string, number> = {
          ORDER_NOT_FOUND: 404,
          ALREADY_PAID: 400,
          PAYMENT_INIT_FAILED: 500,
        };
        const statusCode = statusCodes[error.code] ?? 400;

        res.status(statusCode).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Initialize payment error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to initialize payment',
      });
    }
  }
);

/**
 * @route   GET /api/payments/verify/:reference
 * @desc    Verify a payment by reference
 * @access  Private
 */
router.get(
  '/verify/:reference',
  authenticate,
  validate({ params: z.object({ reference: z.string().min(1) }) }),
  async (req: Request, res: Response) => {
    try {
      const result = await paymentService.verifyPayment(req.params.reference);

      res.json({
        message: 'Payment verified',
        data: result,
      });
    } catch (error) {
      if (error instanceof PaymentError) {
        res.status(400).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Verify payment error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to verify payment',
      });
    }
  }
);

/**
 * @route   GET /api/payments/order/:orderId
 * @desc    Get payment status for an order
 * @access  Private
 */
router.get(
  '/order/:orderId',
  authenticate,
  validate({ params: z.object({ orderId: idSchema }) }),
  async (req: Request, res: Response) => {
    try {
      // Verify order belongs to user (or user is admin)
      const order = await prisma.order.findFirst({
        where: {
          id: req.params.orderId,
          ...(req.user!.role === 'USER' ? { userId: req.user!.id } : {}),
        },
      });

      if (!order) {
        res.status(404).json({
          error: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        });
        return;
      }

      const payment = await paymentService.getPaymentStatus(req.params.orderId);

      res.json({
        data: payment,
      });
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to get payment status',
      });
    }
  }
);

/**
 * @route   POST /api/payments/webhook
 * @desc    Webhook endpoint for payment provider
 * @access  Public (verified by signature)
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Verify webhook signature (Paystack example)
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY || '';
    const hash = crypto
      .createHmac('sha512', paystackSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const signature = req.headers['x-paystack-signature'];

    if (paystackSecret && hash !== signature) {
      res.status(401).json({
        error: 'INVALID_SIGNATURE',
        message: 'Invalid webhook signature',
      });
      return;
    }

    const { event, data } = req.body;

    await paymentService.handleWebhook(event, data);

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent retries
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
});

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Process a refund (Admin only)
 * @access  Admin
 */
router.post(
  '/:id/refund',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate({
    params: z.object({ id: idSchema }),
    body: z.object({ reason: z.string().min(1).max(500) }),
  }),
  async (req: Request, res: Response) => {
    try {
      await paymentService.processRefund(req.params.id, req.body.reason);

      res.json({
        message: 'Refund processed successfully',
      });
    } catch (error) {
      if (error instanceof PaymentError) {
        res.status(400).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Process refund error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to process refund',
      });
    }
  }
);

export default router;
