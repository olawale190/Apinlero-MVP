import { Router, Request, Response } from 'express';
import { cartService, CartError } from '../services/cart.service';
import { authenticate } from '../middleware/auth';
import { validate, idSchema } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

// ============================================
// Validation Schemas
// ============================================

const addItemSchema = z.object({
  productId: idSchema,
  quantity: z.number().int().positive(),
});

const updateQuantitySchema = z.object({
  quantity: z.number().int().min(0),
});

// ============================================
// Cart Routes
// ============================================

/**
 * @route   GET /api/cart
 * @desc    Get current user's cart
 * @access  Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const cart = await cartService.getOrCreateCart(req.user!.id);
    res.json({ data: cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch cart',
    });
  }
});

/**
 * @route   POST /api/cart/items
 * @desc    Add item to cart
 * @access  Private
 */
router.post(
  '/items',
  validate({ body: addItemSchema }),
  async (req: Request, res: Response) => {
    try {
      const { productId, quantity } = req.body;
      const cart = await cartService.addItem(req.user!.id, productId, quantity);

      res.json({
        message: 'Item added to cart',
        data: cart,
      });
    } catch (error) {
      if (error instanceof CartError) {
        const statusCodes: Record<string, number> = {
          PRODUCT_NOT_FOUND: 404,
          PRODUCT_UNAVAILABLE: 400,
          MIN_ORDER_NOT_MET: 400,
          INSUFFICIENT_STOCK: 400,
        };
        const statusCode = statusCodes[error.code] ?? 400;

        res.status(statusCode).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Add to cart error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to add item to cart',
      });
    }
  }
);

/**
 * @route   PUT /api/cart/items/:productId
 * @desc    Update item quantity in cart
 * @access  Private
 */
router.put(
  '/items/:productId',
  validate({
    params: z.object({ productId: idSchema }),
    body: updateQuantitySchema,
  }),
  async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;

      const cart = await cartService.updateItemQuantity(
        req.user!.id,
        productId,
        quantity
      );

      res.json({
        message: quantity > 0 ? 'Cart updated' : 'Item removed from cart',
        data: cart,
      });
    } catch (error) {
      if (error instanceof CartError) {
        const statusCodes: Record<string, number> = {
          CART_NOT_FOUND: 404,
          ITEM_NOT_FOUND: 404,
          MIN_ORDER_NOT_MET: 400,
          INSUFFICIENT_STOCK: 400,
        };
        const statusCode = statusCodes[error.code] ?? 400;

        res.status(statusCode).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Update cart error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to update cart',
      });
    }
  }
);

/**
 * @route   DELETE /api/cart/items/:productId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete(
  '/items/:productId',
  validate({ params: z.object({ productId: idSchema }) }),
  async (req: Request, res: Response) => {
    try {
      const cart = await cartService.removeItem(
        req.user!.id,
        req.params.productId
      );

      res.json({
        message: 'Item removed from cart',
        data: cart,
      });
    } catch (error) {
      if (error instanceof CartError) {
        res.status(404).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Remove from cart error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to remove item from cart',
      });
    }
  }
);

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const cart = await cartService.clearCart(req.user!.id);

    res.json({
      message: 'Cart cleared',
      data: cart,
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to clear cart',
    });
  }
});

/**
 * @route   GET /api/cart/validate
 * @desc    Validate cart before checkout
 * @access  Private
 */
router.get('/validate', async (req: Request, res: Response) => {
  try {
    const validation = await cartService.validateCart(req.user!.id);

    res.json({
      data: validation,
    });
  } catch (error) {
    console.error('Validate cart error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to validate cart',
    });
  }
});

export default router;
