/**
 * Upload Routes
 *
 * POST /api/upload/bulk       — Upload images to Cloudinary with AI tagging, auto-match to products
 * POST /api/upload/bulk-assign — Save confirmed image-to-product assignments
 */

import { Router } from 'express';
import multer from 'multer';
import { uploadBulkImages } from '../services/upload.service.js';
import { getAllProductStubs, bulkUpdateImages } from '../services/product.service.js';
import { matchImagesToProducts } from '../services/image-matching.service.js';
import {
  rateLimiter,
  authenticateToken,
  extractBusinessContext,
  requireBusinessContext,
  isValidUUID,
} from '../middleware/security.js';

// Multer: memory storage, image files only, max 5MB each, max 20 files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * Factory function — receives Supabase clients from index.js
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Service role client
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseAuth - Anon client for auth
 */
export default function createUploadRoutes(supabase, supabaseAuth) {
  const router = Router();

  // ── POST /api/upload/bulk ──────────────────────────────────────────────
  router.post(
    '/api/upload/bulk',
    rateLimiter(10),
    authenticateToken(supabaseAuth),
    extractBusinessContext(supabase),
    requireBusinessContext,
    upload.array('images', 20),
    async (req, res) => {
      try {
        const files = req.files;
        if (!files || files.length === 0) {
          return res.status(400).json({ error: 'No images provided' });
        }

        // 1. Upload to Cloudinary with AI tags
        const uploadedImages = await uploadBulkImages(files);

        // 2. Get product stubs for this business
        const products = await getAllProductStubs(supabase, req.businessId);

        // 3. Match images to products
        const result = matchImagesToProducts(uploadedImages, products);

        return res.json({
          success: true,
          data: result,
          summary: {
            uploaded: uploadedImages.length,
            matched: result.matched.length,
            unmatched: result.unmatched.length,
            failed: uploadedImages.filter((i) => !i.cloudinaryUrl).length,
          },
        });
      } catch (err) {
        console.error('Bulk upload error:', err);
        return res.status(500).json({ error: 'Bulk upload failed. Please try again.' });
      }
    },
  );

  // ── POST /api/upload/bulk-assign ───────────────────────────────────────
  router.post(
    '/api/upload/bulk-assign',
    rateLimiter(20),
    authenticateToken(supabaseAuth),
    extractBusinessContext(supabase),
    requireBusinessContext,
    async (req, res) => {
      try {
        const { assignments } = req.body;

        if (!Array.isArray(assignments) || assignments.length === 0) {
          return res.status(400).json({ error: 'No assignments provided' });
        }

        // Validate each assignment
        for (const a of assignments) {
          if (!a.productId || !isValidUUID(a.productId)) {
            return res.status(400).json({ error: `Invalid product ID: ${a.productId}` });
          }
          if (!a.imageUrl || typeof a.imageUrl !== 'string') {
            return res.status(400).json({ error: 'Each assignment must have an imageUrl' });
          }
        }

        const result = await bulkUpdateImages(supabase, assignments, req.businessId);

        return res.json({
          success: true,
          data: result,
        });
      } catch (err) {
        console.error('Bulk assign error:', err);
        return res.status(500).json({ error: 'Failed to save image assignments.' });
      }
    },
  );

  // Handle multer errors (file too large, too many files, wrong type)
  router.use((err, _req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum 5MB per image.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files. Maximum 20 images per batch.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err.message === 'Only image files are allowed') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  });

  return router;
}
