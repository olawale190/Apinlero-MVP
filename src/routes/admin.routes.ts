import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload, uploadService } from '../services/upload.service';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorize(['ADMIN']));

// ==================== CATEGORY MANAGEMENT ====================

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  image: z.string().url().optional(),
});

/**
 * Create a new category
 * POST /api/admin/categories
 */
router.post(
  '/categories',
  validate(categorySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, image } = req.body;

      // Check if category exists
      const existing = await prisma.category.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
      });

      if (existing) {
        return res.status(400).json({ message: 'Category already exists' });
      }

      const category = await prisma.category.create({
        data: { name, description, image },
      });

      res.status(201).json({
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update a category
 * PUT /api/admin/categories/:id
 */
router.put(
  '/categories/:id',
  validate(categorySchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, description, image } = req.body;

      const category = await prisma.category.update({
        where: { id },
        data: { name, description, image },
      });

      res.json({
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Category not found' });
      }
      next(error);
    }
  }
);

/**
 * Delete a category
 * DELETE /api/admin/categories/:id
 */
router.delete(
  '/categories/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if category has products
      const productCount = await prisma.product.count({
        where: { categoryId: id },
      });

      if (productCount > 0) {
        return res.status(400).json({
          message: `Cannot delete category with ${productCount} products. Move or delete products first.`,
        });
      }

      await prisma.category.delete({ where: { id } });

      res.json({ message: 'Category deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Category not found' });
      }
      next(error);
    }
  }
);

// ==================== PRODUCT MANAGEMENT ====================

const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  unit: z.string().min(1).max(50),
  stock: z.number().int().min(0).default(0),
  categoryId: z.string().uuid(),
  images: z.array(z.string().url()).optional(),
  isActive: z.boolean().default(true),
});

/**
 * Create a new product
 * POST /api/admin/products
 */
router.post(
  '/products',
  validate(productSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        return res.status(400).json({ message: 'Category not found' });
      }

      // Generate SKU
      const sku = `ISH-${Date.now().toString(36).toUpperCase()}`;

      const product = await prisma.product.create({
        data: {
          ...data,
          sku,
          images: data.images ? JSON.stringify(data.images) : '[]',
        },
        include: { category: true },
      });

      res.status(201).json({
        message: 'Product created successfully',
        data: {
          ...product,
          images: JSON.parse(product.images || '[]'),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update a product
 * PUT /api/admin/products/:id
 */
router.put(
  '/products/:id',
  validate(productSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;

      if (data.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: data.categoryId },
        });

        if (!category) {
          return res.status(400).json({ message: 'Category not found' });
        }
      }

      const updateData: any = { ...data };
      if (data.images) {
        updateData.images = JSON.stringify(data.images);
      }

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: { category: true },
      });

      res.json({
        message: 'Product updated successfully',
        data: {
          ...product,
          images: JSON.parse(product.images || '[]'),
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Product not found' });
      }
      next(error);
    }
  }
);

/**
 * Delete a product
 * DELETE /api/admin/products/:id
 */
router.delete(
  '/products/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Get product to delete images
      const product = await prisma.product.findUnique({ where: { id } });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Delete product images from Cloudinary
      const images = JSON.parse(product.images || '[]');
      for (const imageUrl of images) {
        try {
          // Extract public ID from URL
          const match = imageUrl.match(/isha-treat\/[^/]+\/[^.]+/);
          if (match) {
            await uploadService.deleteImage(match[0]);
          }
        } catch (error) {
          console.error('Failed to delete image:', error);
        }
      }

      await prisma.product.delete({ where: { id } });

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Toggle product active status
 * PATCH /api/admin/products/:id/toggle
 */
router.patch(
  '/products/:id/toggle',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({ where: { id } });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const updated = await prisma.product.update({
        where: { id },
        data: { isActive: !product.isActive },
      });

      res.json({
        message: `Product ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update product stock
 * PATCH /api/admin/products/:id/stock
 */
router.patch(
  '/products/:id/stock',
  validate(z.object({ stock: z.number().int().min(0) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { stock } = req.body;

      const product = await prisma.product.update({
        where: { id },
        data: { stock },
      });

      res.json({
        message: 'Stock updated successfully',
        data: product,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Product not found' });
      }
      next(error);
    }
  }
);

// ==================== ORDER MANAGEMENT ====================

/**
 * Get all orders (admin view)
 * GET /api/admin/orders
 */
router.get(
  '/orders',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            items: { include: { product: true } },
            tracking: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.order.count({ where }),
      ]);

      res.json({
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update order status
 * PATCH /api/admin/orders/:id/status
 */
router.patch(
  '/orders/:id/status',
  validate(
    z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
      note: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const order = await prisma.order.update({
        where: { id },
        data: { status },
      });

      // Add tracking entry
      await prisma.orderTracking.create({
        data: {
          orderId: id,
          status,
          description: note || `Order status updated to ${status}`,
        },
      });

      res.json({
        message: 'Order status updated successfully',
        data: order,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Order not found' });
      }
      next(error);
    }
  }
);

// ==================== DASHBOARD STATS ====================

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard
 */
router.get(
  '/dashboard',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalProducts,
        totalOrders,
        todayOrders,
        totalRevenue,
        pendingOrders,
        totalUsers,
        lowStockProducts,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.order.count({ where: { createdAt: { gte: today } } }),
        prisma.order.aggregate({
          where: { status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED'] } },
          _sum: { total: true },
        }),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.product.count({ where: { stock: { lte: 10 } } }),
      ]);

      res.json({
        data: {
          totalProducts,
          totalOrders,
          todayOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          pendingOrders,
          totalUsers,
          lowStockProducts,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
