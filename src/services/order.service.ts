import { prisma } from '../lib/prisma';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { cartService } from './cart.service';
import { whatsappService } from './whatsapp.service';

interface CreateOrderInput {
  userId: string;
  addressId: string;
  paymentMethod: PaymentMethod;
  deliveryNotes?: string;
}

interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Order Service
 * Handles order placement, tracking, and management for Isha Treat
 */
export class OrderService {
  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ISH-${timestamp}-${random}`;
  }

  /**
   * Create a new order from cart
   */
  async createOrder(input: CreateOrderInput) {
    const { userId, addressId, paymentMethod, deliveryNotes } = input;

    // Validate cart
    const validation = await cartService.validateCart(userId);
    if (!validation.valid) {
      throw new OrderError(validation.errors.join(', '), 'CART_INVALID');
    }

    // Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new OrderError('Cart is empty', 'CART_EMPTY');
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new OrderError('Invalid delivery address', 'INVALID_ADDRESS');
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const deliveryFee = this.calculateDeliveryFee(subtotal, address.state);
    const total = subtotal + deliveryFee;

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          userId,
          addressId,
          subtotal: Math.round(subtotal * 100) / 100,
          deliveryFee,
          total: Math.round(total * 100) / 100,
          deliveryNotes,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productSku: item.product.sku,
              unitPrice: item.product.price,
              quantity: item.quantity,
              total: Math.round(item.product.price * item.quantity * 100) / 100,
            })),
          },
          tracking: {
            create: {
              status: OrderStatus.PENDING,
              description: 'Order placed successfully',
            },
          },
        },
        include: {
          items: true,
          address: true,
          tracking: true,
        },
      });

      // Decrease product stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: newOrder.total,
          method: paymentMethod,
          status:
            paymentMethod === PaymentMethod.CASH_ON_DELIVERY
              ? PaymentStatus.PENDING
              : PaymentStatus.PENDING,
        },
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // Send WhatsApp notification (async, don't wait)
    this.sendOrderConfirmationNotification(order.id).catch((err) => {
      console.error('Failed to send order confirmation WhatsApp:', err);
    });

    return order;
  }

  /**
   * Send order confirmation WhatsApp notification
   */
  private async sendOrderConfirmationNotification(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        items: true,
        address: true,
      },
    });

    if (!order || !order.user.phone) return;

    const deliveryAddress = order.address
      ? `${order.address.street}, ${order.address.city}, ${order.address.state}`
      : undefined;

    await whatsappService.sendOrderConfirmation(order.user.phone, {
      orderNumber: order.orderNumber,
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      total: order.total,
      itemCount: order.items.length,
      deliveryAddress,
    });

    // Also notify admin about new order
    const adminPhone = process.env.ADMIN_WHATSAPP_PHONE;
    if (adminPhone) {
      await whatsappService.sendNewOrderAlert(adminPhone, {
        orderNumber: order.orderNumber,
        customerName: `${order.user.firstName} ${order.user.lastName}`,
        total: order.total,
        itemCount: order.items.length,
        deliveryAddress,
      });
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string, userId?: string) {
    const where: Record<string, string> = { id: orderId };
    if (userId) {
      where.userId = userId;
    }

    return prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        address: true,
        tracking: {
          orderBy: { createdAt: 'desc' },
        },
        payments: true,
      },
    });
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string, userId?: string) {
    const where: Record<string, string> = { orderNumber };
    if (userId) {
      where.userId = userId;
    }

    return prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        address: true,
        tracking: {
          orderBy: { createdAt: 'desc' },
        },
        payments: true,
      },
    });
  }

  /**
   * Get user's orders with pagination
   */
  async getUserOrders(
    userId: string,
    filters: OrderFilters,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        (where.createdAt as Record<string, Date>).gte = filters.fromDate;
      }
      if (filters.toDate) {
        (where.createdAt as Record<string, Date>).lte = filters.toDate;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, image: true },
              },
            },
          },
          address: true,
          tracking: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Only latest tracking status
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get order tracking history
   */
  async getOrderTracking(orderId: string, userId?: string) {
    // Verify order exists and belongs to user
    const order = await this.getOrderById(orderId, userId);
    if (!order) {
      throw new OrderError('Order not found', 'ORDER_NOT_FOUND');
    }

    return prisma.orderTracking.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update order status (Admin only)
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    description: string,
    location?: string
  ) {
    // Update order status
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        deliveredAt: status === OrderStatus.DELIVERED ? new Date() : undefined,
      },
    });

    // Add tracking entry
    await prisma.orderTracking.create({
      data: {
        orderId,
        status,
        description,
        location,
      },
    });

    // Send WhatsApp notification based on status (async, don't wait)
    this.sendStatusUpdateNotification(orderId, status, description).catch((err) => {
      console.error('Failed to send status update WhatsApp:', err);
    });

    return order;
  }

  /**
   * Send order status update WhatsApp notification
   */
  private async sendStatusUpdateNotification(
    orderId: string,
    status: OrderStatus,
    note?: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        items: true,
        address: true,
      },
    });

    if (!order || !order.user.phone) return;

    const orderDetails = {
      orderNumber: order.orderNumber,
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      total: order.total,
      itemCount: order.items.length,
      deliveryAddress: order.address
        ? `${order.address.street}, ${order.address.city}, ${order.address.state}`
        : undefined,
    };

    // Send specific notification based on status
    switch (status) {
      case OrderStatus.SHIPPED:
        await whatsappService.sendOrderShipped(order.user.phone, orderDetails);
        break;
      case OrderStatus.DELIVERED:
        await whatsappService.sendOrderDelivered(order.user.phone, orderDetails);
        break;
      case OrderStatus.CANCELLED:
        await whatsappService.sendOrderCancelled(order.user.phone, orderDetails, note);
        break;
      default:
        // For other statuses, send generic update
        await whatsappService.sendOrderStatusUpdate(
          order.user.phone,
          orderDetails,
          status,
          note
        );
    }
  }

  /**
   * Cancel order (Customer can cancel if still PENDING)
   */
  async cancelOrder(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) {
      throw new OrderError('Order not found', 'ORDER_NOT_FOUND');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new OrderError(
        'Only pending orders can be cancelled',
        'CANNOT_CANCEL'
      );
    }

    // Cancel order and restore stock in transaction
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      // Restore product stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // Add tracking entry
      await tx.orderTracking.create({
        data: {
          orderId,
          status: OrderStatus.CANCELLED,
          description: 'Order cancelled by customer',
        },
      });
    });

    return this.getOrderById(orderId);
  }

  /**
   * Calculate delivery fee based on location and order value
   */
  private calculateDeliveryFee(subtotal: number, state: string): number {
    // Free delivery for orders above ₦100,000
    if (subtotal >= 100000) {
      return 0;
    }

    // Base delivery fees by region (can be expanded)
    const deliveryFees: Record<string, number> = {
      Lagos: 2000,
      Ogun: 3000,
      Oyo: 3500,
      default: 5000,
    };

    return deliveryFees[state] ?? deliveryFees.default ?? 5000;
  }

  /**
   * Get order statistics for user dashboard
   */
  async getUserOrderStats(userId: string) {
    const [totalOrders, pendingOrders, deliveredOrders, totalSpent] =
      await Promise.all([
        prisma.order.count({ where: { userId } }),
        prisma.order.count({
          where: {
            userId,
            status: {
              in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING],
            },
          },
        }),
        prisma.order.count({
          where: { userId, status: OrderStatus.DELIVERED },
        }),
        prisma.order.aggregate({
          where: { userId, paymentStatus: PaymentStatus.PAID },
          _sum: { total: true },
        }),
      ]);

    return {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalSpent: totalSpent._sum.total ?? 0,
    };
  }
}

/**
 * Custom order error class
 */
export class OrderError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'OrderError';
  }
}

// Export singleton instance
export const orderService = new OrderService();
