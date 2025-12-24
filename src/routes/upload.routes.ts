import { Router, Request, Response, NextFunction } from 'express';
import { upload, uploadService, UploadError } from '../services/upload.service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All upload routes require authentication and admin role
router.use(authenticate, authorize(['ADMIN', 'VENDOR']));

/**
 * Upload a single image
 * POST /api/upload/image
 */
router.post(
  '/image',
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const folder = (req.query.folder as string) || 'products';
      const result = await uploadService.uploadImage(req.file, folder);

      res.json({
        message: 'Image uploaded successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof UploadError) {
        return res.status(400).json({ message: error.message, code: error.code });
      }
      next(error);
    }
  }
);

/**
 * Upload multiple images (max 5)
 * POST /api/upload/images
 */
router.post(
  '/images',
  upload.array('images', 5),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No image files provided' });
      }

      const folder = (req.query.folder as string) || 'products';
      const results = await uploadService.uploadMultipleImages(files, folder);

      res.json({
        message: `${results.length} images uploaded successfully`,
        data: results,
      });
    } catch (error) {
      if (error instanceof UploadError) {
        return res.status(400).json({ message: error.message, code: error.code });
      }
      next(error);
    }
  }
);

/**
 * Delete an image
 * DELETE /api/upload/image/:publicId
 */
router.delete(
  '/image/:publicId(*)',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { publicId } = req.params;
      await uploadService.deleteImage(publicId);

      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      if (error instanceof UploadError) {
        return res.status(400).json({ message: error.message, code: error.code });
      }
      next(error);
    }
  }
);

// Error handler for multer errors
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 5MB' });
  }
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ message: 'Too many files. Maximum is 5 files' });
  }
  if (error.message.includes('Only JPEG, PNG, and WebP')) {
    return res.status(400).json({ message: error.message });
  }
  next(error);
});

export default router;
