import { prisma } from '../lib/prisma';

/**
 * Cart Service
 * Handles shopping cart operations for Isha Treat customers
 */
export class CartService {
  /**
   * Get or create cart for a user
   */
  async getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Calculate totals
    const totals = this.calculateCartTotals(cart.items);

    return {
      ...cart,
      ...totals,
    };
  }

  /**
   * Add item to cart
   */
  async addItem(userId: string, productId: string, quantity: number) {
    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new CartError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    if (!product.isActive) {
      throw new CartError('Product is not available', 'PRODUCT_UNAVAILABLE');
    }

    // Check minimum order quantity
    if (quantity < product.minOrder) {
      throw new CartError(
        `Minimum order quantity is ${product.minOrder} ${product.unit}`,
        'MIN_ORDER_NOT_MET'
      );
    }

    // Check stock
    if (quantity > product.stock) {
      throw new CartError(
        `Only ${product.stock} ${product.unit} available in stock`,
        'INSUFFICIENT_STOCK'
      );
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        throw new CartError(
          `Cannot add more. Only ${product.stock} ${product.unit} available`,
          'INSUFFICIENT_STOCK'
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // Return updated cart
    return this.getOrCreateCart(userId);
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(userId: string, productId: string, quantity: number) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new CartError('Cart not found', 'CART_NOT_FOUND');
    }

    // Check if item exists
    const item = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      include: { product: true },
    });

    if (!item) {
      throw new CartError('Item not in cart', 'ITEM_NOT_FOUND');
    }

    // If quantity is 0, remove item
    if (quantity <= 0) {
      return this.removeItem(userId, productId);
    }

    // Check minimum order quantity
    if (quantity < item.product.minOrder) {
      throw new CartError(
        `Minimum order quantity is ${item.product.minOrder} ${item.product.unit}`,
        'MIN_ORDER_NOT_MET'
      );
    }

    // Check stock
    if (quantity > item.product.stock) {
      throw new CartError(
        `Only ${item.product.stock} ${item.product.unit} available`,
        'INSUFFICIENT_STOCK'
      );
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    return this.getOrCreateCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, productId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new CartError('Cart not found', 'CART_NOT_FOUND');
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    return this.getOrCreateCart(userId);
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return this.getOrCreateCart(userId);
  }

  /**
   * Calculate cart totals
   */
  private calculateCartTotals(
    items: Array<{
      quantity: number;
      product: { price: number; stock: number };
    }>
  ) {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    return {
      itemCount,
      subtotal: Math.round(subtotal * 100) / 100,
    };
  }

  /**
   * Validate cart before checkout
   */
  async validateCart(userId: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return { valid: false, errors: ['Cart is empty'] };
    }

    const errors: string[] = [];

    for (const item of cart.items) {
      if (!item.product.isActive) {
        errors.push(`${item.product.name} is no longer available`);
      } else if (item.quantity > item.product.stock) {
        errors.push(
          `${item.product.name}: Only ${item.product.stock} available (you have ${item.quantity})`
        );
      } else if (item.quantity < item.product.minOrder) {
        errors.push(
          `${item.product.name}: Minimum order is ${item.product.minOrder} ${item.product.unit}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Custom cart error class
 */
export class CartError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'CartError';
  }
}

// Export singleton instance
export const cartService = new CartService();
