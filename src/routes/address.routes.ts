import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { validate, idSchema, sanitizedString } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// All address routes require authentication
router.use(authenticate);

// ============================================
// Validation Schemas
// ============================================

const createAddressSchema = z.object({
  label: sanitizedString(50),
  fullName: sanitizedString(100),
  phone: z.string().min(10).max(15),
  address: sanitizedString(200),
  city: sanitizedString(50),
  state: sanitizedString(50),
  landmark: sanitizedString(200).optional(),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = createAddressSchema.partial();

// ============================================
// Address Routes
// ============================================

/**
 * @route   GET /api/addresses
 * @desc    Get user's delivery addresses
 * @access  Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ data: addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch addresses',
    });
  }
});

/**
 * @route   GET /api/addresses/:id
 * @desc    Get address by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate({ params: z.object({ id: idSchema }) }),
  async (req: Request, res: Response) => {
    try {
      const address = await prisma.address.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!address) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Address not found',
        });
        return;
      }

      res.json({ data: address });
    } catch (error) {
      console.error('Get address error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch address',
      });
    }
  }
);

/**
 * @route   POST /api/addresses
 * @desc    Create a new delivery address
 * @access  Private
 */
router.post(
  '/',
  validate({ body: createAddressSchema }),
  async (req: Request, res: Response) => {
    try {
      const { isDefault, ...addressData } = req.body;

      // If this is set as default, unset other defaults
      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId: req.user!.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      // If this is the first address, make it default
      const addressCount = await prisma.address.count({
        where: { userId: req.user!.id },
      });

      const address = await prisma.address.create({
        data: {
          ...addressData,
          userId: req.user!.id,
          isDefault: isDefault || addressCount === 0,
        },
      });

      res.status(201).json({
        message: 'Address created successfully',
        data: address,
      });
    } catch (error) {
      console.error('Create address error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to create address',
      });
    }
  }
);

/**
 * @route   PUT /api/addresses/:id
 * @desc    Update a delivery address
 * @access  Private
 */
router.put(
  '/:id',
  validate({
    params: z.object({ id: idSchema }),
    body: updateAddressSchema,
  }),
  async (req: Request, res: Response) => {
    try {
      // Verify address belongs to user
      const existingAddress = await prisma.address.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!existingAddress) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Address not found',
        });
        return;
      }

      const { isDefault, ...addressData } = req.body;

      // If setting as default, unset other defaults
      if (isDefault && !existingAddress.isDefault) {
        await prisma.address.updateMany({
          where: { userId: req.user!.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      const address = await prisma.address.update({
        where: { id: req.params.id },
        data: {
          ...addressData,
          isDefault: isDefault ?? existingAddress.isDefault,
        },
      });

      res.json({
        message: 'Address updated successfully',
        data: address,
      });
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to update address',
      });
    }
  }
);

/**
 * @route   DELETE /api/addresses/:id
 * @desc    Delete a delivery address
 * @access  Private
 */
router.delete(
  '/:id',
  validate({ params: z.object({ id: idSchema }) }),
  async (req: Request, res: Response) => {
    try {
      // Verify address belongs to user
      const address = await prisma.address.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!address) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Address not found',
        });
        return;
      }

      // Check if address is used in any orders
      const ordersWithAddress = await prisma.order.count({
        where: { addressId: req.params.id },
      });

      if (ordersWithAddress > 0) {
        res.status(400).json({
          error: 'ADDRESS_IN_USE',
          message: 'Cannot delete address that has been used in orders',
        });
        return;
      }

      await prisma.address.delete({
        where: { id: req.params.id },
      });

      // If deleted address was default, make another one default
      if (address.isDefault) {
        const firstAddress = await prisma.address.findFirst({
          where: { userId: req.user!.id },
          orderBy: { createdAt: 'desc' },
        });

        if (firstAddress) {
          await prisma.address.update({
            where: { id: firstAddress.id },
            data: { isDefault: true },
          });
        }
      }

      res.json({
        message: 'Address deleted successfully',
      });
    } catch (error) {
      console.error('Delete address error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to delete address',
      });
    }
  }
);

/**
 * @route   PATCH /api/addresses/:id/default
 * @desc    Set address as default
 * @access  Private
 */
router.patch(
  '/:id/default',
  validate({ params: z.object({ id: idSchema }) }),
  async (req: Request, res: Response) => {
    try {
      // Verify address belongs to user
      const address = await prisma.address.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!address) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Address not found',
        });
        return;
      }

      // Unset all other defaults
      await prisma.address.updateMany({
        where: { userId: req.user!.id, isDefault: true },
        data: { isDefault: false },
      });

      // Set this address as default
      const updatedAddress = await prisma.address.update({
        where: { id: req.params.id },
        data: { isDefault: true },
      });

      res.json({
        message: 'Default address updated',
        data: updatedAddress,
      });
    } catch (error) {
      console.error('Set default address error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to set default address',
      });
    }
  }
);

export default router;
