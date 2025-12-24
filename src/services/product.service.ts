import { prisma } from '../lib/prisma';

interface ProductFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
}

interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Product Service
 * Handles all product and category operations for Isha Treat
 */
export class ProductService {
  // ============================================
  // Category Operations
  // ============================================

  /**
   * Get all active categories
   */
  async getCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  /**
   * Get category by ID with products
   */
  async getCategoryById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  /**
   * Create a new category (Admin only)
   */
  async createCategory(data: {
    name: string;
    description?: string;
    image?: string;
    sortOrder?: number;
  }) {
    return prisma.category.create({
      data,
    });
  }

  /**
   * Update a category (Admin only)
   */
  async updateCategory(
    id: string,
    data: {
      name?: string;
      description?: string;
      image?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  // ============================================
  // Product Operations
  // ============================================

  /**
   * Get products with filters and pagination
   */
  async getProducts(filters: ProductFilters, pagination: PaginationOptions) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
        { sku: { contains: filters.search } },
      ];
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        (where.price as Record<string, number>).gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        (where.price as Record<string, number>).lte = filters.maxPrice;
      }
    }

    if (filters.inStock) {
      where.stock = { gt: 0 };
    }

    if (filters.featured) {
      where.isFeatured = true;
    }

    // Execute query with count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get featured products for homepage
   */
  async getFeaturedProducts(limit: number = 10) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        stock: { gt: 0 },
      },
      take: limit,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(sku: string) {
    return prisma.product.findUnique({
      where: { sku },
      include: {
        category: true,
      },
    });
  }

  /**
   * Create a new product (Admin only)
   */
  async createProduct(data: {
    name: string;
    description?: string;
    sku: string;
    price: number;
    unit: string;
    minOrder?: number;
    stock?: number;
    image?: string;
    images?: string;
    categoryId: string;
    isFeatured?: boolean;
  }) {
    return prisma.product.create({
      data,
      include: {
        category: true,
      },
    });
  }

  /**
   * Update a product (Admin only)
   */
  async updateProduct(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      unit?: string;
      minOrder?: number;
      stock?: number;
      image?: string;
      images?: string;
      categoryId?: string;
      isActive?: boolean;
      isFeatured?: boolean;
    }
  ) {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  /**
   * Update product stock (Admin only)
   */
  async updateStock(id: string, quantity: number) {
    return prisma.product.update({
      where: { id },
      data: { stock: quantity },
    });
  }

  /**
   * Decrease stock after order (internal use)
   */
  async decreaseStock(id: string, quantity: number) {
    return prisma.product.update({
      where: { id },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });
  }

  /**
   * Search products
   */
  async searchProducts(query: string, limit: number = 20) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { sku: { contains: query } },
        ],
      },
      take: limit,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });
  }
}

// Export singleton instance
export const productService = new ProductService();
