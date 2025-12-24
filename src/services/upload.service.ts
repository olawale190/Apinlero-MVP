import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Request } from 'express';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration for memory storage
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

// Multer upload middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

/**
 * Upload Service
 * Handles image uploads to Cloudinary
 */
export class UploadService {
  /**
   * Upload a single image to Cloudinary
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'products'
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      // Convert buffer to base64
      const base64 = file.buffer.toString('base64');
      const dataUri = `data:${file.mimetype};base64,${base64}`;

      // Upload to Cloudinary
      cloudinary.uploader.upload(
        dataUri,
        {
          folder: `isha-treat/${folder}`,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Max dimensions
            { quality: 'auto:good' }, // Auto optimize quality
            { fetch_format: 'auto' }, // Auto format (webp when supported)
          ],
        },
        (error, result) => {
          if (error) {
            reject(new UploadError(error.message, 'UPLOAD_FAILED'));
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(new UploadError('Upload failed', 'UPLOAD_FAILED'));
          }
        }
      );
    });
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'products'
  ): Promise<{ url: string; publicId: string }[]> {
    const uploads = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploads);
  }

  /**
   * Delete an image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(new UploadError(error.message, 'DELETE_FAILED'));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Generate a thumbnail URL
   */
  getThumbnailUrl(url: string, width: number = 200, height: number = 200): string {
    // Transform Cloudinary URL to get thumbnail
    return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
  }
}

/**
 * Custom upload error class
 */
export class UploadError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

// Export singleton instance
export const uploadService = new UploadService();
