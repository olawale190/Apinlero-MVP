import { Router, Request, Response } from 'express';
import { productService } from '../services/product.service';
import { authenticate, authorize } from '../middleware/auth';
import { validate, sanitizedString, idSchema, paginationSchema } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const productFiltersSchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().max(100).optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  inStock: z.string().transform((v) => v === 'true').optional(),
  featured: z.string().transform((v) => v === 'true').optional(),
}).merge(paginationSchema);

const createCategorySchema = z.object({
  name: sanitizedString(100),
  description: sanitizedString(500).optional(),
  image: z.string().url().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const createProductSchema = z.object({
  name: sanitizedString(200),
  description: sanitizedString(1000).optional(),
  sku: z.string().min(1).max(50),
  price: z.number().positive(),
  unit: z.string().min(1).max(20),
  minOrder: z.number().int().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  image: z.string().url().optional(),
  images: z.string().optional(), // JSON array of URLs
  categoryId: z.string().min(1),
  isFeatured: z.boolean().optional(),
});

const updateProductSchema = createProductSchema.partial();

// ============================================
// Public Routes (No auth required)
// ============================================

/**
 * @route   GET /api/products/categories
 * @desc    Get all active categories
 * @access  Public
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await productService.getCategories();
    res.json({ data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch categories',
    });
  }
});

/**
 * @route   GET /api/products/categories/:id
 * @desc    Get category by ID with products
 * @access  Public
 */
router.get(
  '/categories/:id',
  validate({ params: z.object({ id: idSchema }) }),
  async (req: Request, res: Response) => {
    try {
      const category = await productService.getCategoryById(req.params.id);

      if (!category) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Category not found',
        });
        return;
      }

      res.json({ data: category });
    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch category',
      });
    }
  }
);

/**
 * @route   GET /api/products
 * @desc    Get products with filters and pagination
 * @access  Public
 */
router.get(
  '/',
  validate({ query: productFiltersSchema }),
  async (req: Request, res: Response) => {
    try {
      const { page, limit, ...filters } = req.query as {
        page: number;
        limit: number;
        categoryId?: string;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        inStock?: boolean;
        featured?: boolean;
      };

      const result = await productService.getProducts(filters, { page, limit });
      res.json({ data: result });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch products',
      });
    }
  }
);

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products for homepage
 * @access  Public
 */
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await productService.getFeaturedProducts(limit);
    res.json({ data: products });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch featured products',
    });
  }
});

/**
 * @route   GET /api/products/search
 * @desc    Search products
 * @access  Public
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 20;

    if (query.length < 2) {
      res.status(400).json({
        error: 'INVALID_QUERY',
        message: 'Search query must be at least 2 characters',
      });
      return;
    }

    const products = await productService.searchProducts(query, limit);
    res.json({ data: products });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to search products',
    });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get(
  '/:id',
  validate({ params: z.object({ id: idSchema }) }),
  async (req: Request, res: Response) => {
    try {
      const product = await productService.getProductById(req.params.id);

      if (!product) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Product not found',
        });
        return;
      }

      res.json({ data: product });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch product',
      });
    }
  }
);

// ============================================
// Admin Routes (Auth required)
// ============================================

/**
 * @route   POST /api/products/categories
 * @desc    Create a new category
 * @access  Admin
 */
router.post(
  '/categories',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate({ body: createCategorySchema }),
  async (req: Request, res: Response) => {
    try {
      const category = await productService.createCategory(req.body);
      res.status(201).json({
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to create category',
      });
    }
  }
);

/**
 * @route   PUT /api/products/categories/:id
 * @desc    Update a category
 * @access  Admin
 */
router.put(
  '/categories/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate({
    params: z.object({ id: idSchema }),
    body: createCategorySchema.partial(),
  }),
  async (req: Request, res: Response) => {
    try {
      const category = await productService.updateCategory(
        req.params.id,
        req.body
      );
      res.json({
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to update category',
      });
    }
  }
);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate({ body: createProductSchema }),
  async (req: Request, res: Response) => {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json({
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to create product',
      });
    }
  }
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate({
    params: z.object({ id: idSchema }),
    body: updateProductSchema,
  }),
  async (req: Request, res: Response) => {
    try {
      const product = await productService.updateProduct(
        req.params.id,
        req.body
      );
      res.json({
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to update product',
      });
    }
  }
);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock
 * @access  Admin
 */
router.patch(
  '/:id/stock',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate({
    params: z.object({ id: idSchema }),
    body: z.object({ stock: z.number().int().min(0) }),
  }),
  async (req: Request, res: Response) => {
    try {
      const product = await productService.updateStock(
        req.params.id,
        req.body.stock
      );
      res.json({
        message: 'Stock updated successfully',
        data: product,
      });
    } catch (error) {
      console.error('Update stock error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to update stock',
      });
    }
  }
);

export default router;
