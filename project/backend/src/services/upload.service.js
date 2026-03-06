/**
 * Cloudinary Upload Service
 *
 * Handles image uploads with AI auto-tagging via Cloudinary's google_tagging add-on.
 * Each uploaded image gets back a secure URL, public ID, and detected tags.
 */

import { v2 as cloudinary } from 'cloudinary';

let configured = false;

export function configureCloudinary() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  configured = true;
}

/**
 * Upload a single image buffer to Cloudinary with AI tagging.
 * @param {Buffer} fileBuffer - The image file buffer
 * @param {string} originalFilename - Original filename for reference
 * @returns {Promise<{ cloudinaryUrl: string, publicId: string, tags: string[] }>}
 */
export async function uploadImageWithTags(fileBuffer, originalFilename) {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'apinlero/products',
        categorization: 'google_tagging',
        auto_tagging: 0.6,
        resource_type: 'image',
        // Use filename (without extension) as public_id prefix for traceability
        public_id: originalFilename
          .replace(/\.[^.]+$/, '')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .substring(0, 60),
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);

        // Extract tags from the google_tagging categorization response
        const tags = [];
        if (result.info?.categorization?.google_tagging?.data) {
          for (const item of result.info.categorization.google_tagging.data) {
            if (item.confidence >= 0.6) {
              tags.push(item.tag);
            }
          }
        }

        resolve({
          cloudinaryUrl: result.secure_url,
          publicId: result.public_id,
          tags,
        });
      },
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Upload multiple images in sequence (Cloudinary rate-limits parallel uploads).
 * @param {Array<{ buffer: Buffer, originalname: string }>} files - Multer file objects
 * @returns {Promise<Array<{ originalFilename: string, cloudinaryUrl: string, publicId: string, tags: string[] }>>}
 */
export async function uploadBulkImages(files) {
  const results = [];
  const maxFiles = 50;
  const batch = files.slice(0, maxFiles);

  for (const file of batch) {
    try {
      const result = await uploadImageWithTags(file.buffer, file.originalname);
      results.push({
        originalFilename: file.originalname,
        ...result,
      });
    } catch (err) {
      console.error(`Failed to upload ${file.originalname}:`, err.message);
      results.push({
        originalFilename: file.originalname,
        cloudinaryUrl: null,
        publicId: null,
        tags: [],
        error: err.message,
      });
    }
  }

  return results;
}
