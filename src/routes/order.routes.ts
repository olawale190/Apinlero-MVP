import { Router, Request, Response } from 'express';
import { orderService, OrderError } from '../services/order.service';
import { authenticate, authorize } from '../middleware/auth';
import { validate, idSchema, paginationSchema, sanitizedString } from '../middleware/validate';
import { z } from 'zod';
import { OrderStatus, PaymentMethod } from '@prisma/client';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// ============================================
// Validation Schemas
// ============================================

const createOrderSchema = z.object({
  addressId: idSchema,
  paymentMethod: z.nativeEnum(PaymentMethod),
  deliveryNotes: sanitizedString(500).optional(),
});

const orderFiltersSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
}).merge(paginationSchema);

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  description: sanitizedString(500),
  location: sanitizedString(200).optional(),
});

// ============================================
// Customer Routes
// ============================================

/**
 * @route   POST /api/orders
 * @desc    Create a new order from cart
 * @access  Private
 */
router.post(
  '/',
  validate({ body: createOrderSchema }),
  async (req: Request, res: Response) => {
    try {
      const order = await orderService.createOrder({
        userId: req.user!.id,
        addressId: req.body.addressId,
        paymentMethod: req.body.paymentMethod,
        deliveryNotes: req.body.deliveryNotes,
      });

      res.status(201).json({
        message: 'Order placed successfully',
        data: order,
      });
    } catch (error) {
      if (error instanceof OrderError) {
        const statusCodes: Record<string, number> = {
          CART_INVALID: 400,
          CART_EMPTY: 400,
          INVALID_ADDRESS: 400,
        };
        const statusCode = statusCodes[error.code] ?? 400;

        res.status(statusCode).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Create order error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to create order',
      });
    }
  }
);

/**
 * @route   GET /api/orders
 * @desc    Get current user's orders
 * @access  Private
 */
router.get(
  '/',
  validate({ query: orderFiltersSchema }),
  async (req: Request, res: Response) => {
    try {
      const { page, limit, status, fromDate, toDate } = req.query as {
        page: number;
        limit: number;
        status?: OrderStatus;
        fromDate?: string;
        toDate?: string;
      };

      const result = await orderService.getUserOrders(
        req.user!.id,
        {
          status,
          fromDate: fromDate ? new Date(fromDate) : undefined,
          toDate: toDate ? new Date(toDate) : undefined,
        },
        page,
        limit
      );

      res.json({ data: result });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch orders',
      });
    }
  }
);

/**
 * @route   GET /api/orders/stats
 * @desc    Get user's order statistics
 * @access  Private
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await orderService.getUserOrderStats(req.user!.id);
    res.json({ data: stats });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch order statistics',
    });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate({ params: z.object({ id: idSchema }) }),
  async (req: Request, res: Response) => {
    try {
      const order = await orderService.getOrderById(
        req.params.id,
        req.user!.id
      );

      if (!order) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Order not found',
        });
        return;
      }

      res.json({ data: order });
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch order',
      });
    }
  }
);

/**
 * @route   GET /api/orders/number/:orderNumber
 * @desc    Get order by order number
 * @access  Private
 */
router.get(
  '/number/:orderNumber',
  validate({ params: z.object({ orderNumber: z.string().min(1) }) }),
  async (req: Request, res: Response) => {
    try {
      const order = await orderService.getOrderByNumber(
        req.params.orderNumber,
        req.user!.id
      );

      if (!order) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Order not found',
        });
        return;
      }

      res.json({ data: order });
    } catch (error) {
      console.error('Get order by number error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch order',
      });
    }
  }
);

/**
 * @route   GET /api/orders/:id/tracking
 * @desc    Get order tracking history
 * @access  Private
 */
router.get(
  '/:id/tracking',
  validate({ params: z.object({ id: idSchema }) }),
  async (req: Request, res: Response) => {
    try {
      const tracking = await orderService.getOrderTracking(
        req.params.id,
        req.user!.id
      );

      res.json({ data: tracking });
    } catch (error) {
      if (error instanceof OrderError) {
        res.status(404).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Get tracking error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch tracking information',
      });
    }
  }
);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel an order (only if pending)
 * @access  Private
 */
router.post(
  '/:id/cancel',
  validate({ params: z.object({ id: idSchema }) }),
  async (req: Request, res: Response) => {
    try {
      const order = await orderService.cancelOrder(
        req.params.id,
        req.user!.id
      );

      res.json({
        message: 'Order cancelled successfully',
        data: order,
      });
    } catch (error) {
      if (error instanceof OrderError) {
        const statusCodes: Record<string, number> = {
          ORDER_NOT_FOUND: 404,
          CANNOT_CANCEL: 400,
        };
        const statusCode = statusCodes[error.code] ?? 400;

        res.status(statusCode).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Cancel order error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to cancel order',
      });
    }
  }
);

// ============================================
// Admin Routes
// ============================================

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status (Admin only)
 * @access  Admin
 */
router.patch(
  '/:id/status',
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate({
    params: z.object({ id: idSchema }),
    body: updateStatusSchema,
  }),
  async (req: Request, res: Response) => {
    try {
      const order = await orderService.updateOrderStatus(
        req.params.id,
        req.body.status,
        req.body.description,
        req.body.location
      );

      res.json({
        message: 'Order status updated',
        data: order,
      });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to update order status',
      });
    }
  }
);

export default router;
