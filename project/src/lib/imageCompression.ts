// Image compression utility for Apinlero
// Compresses images before upload to reduce storage costs and improve load times

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  wasCompressed: boolean;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  maxSizeKB: 500
};

/**
 * Compress an image file using Canvas API
 * Maintains aspect ratio while reducing dimensions and quality
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;

  // Skip compression for small files or non-images
  if (!file.type.startsWith('image/')) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false
    };
  }

  // Skip if already small enough
  if (file.size <= opts.maxSizeKB * 1024) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;

      if (width > opts.maxWidth) {
        height = (height * opts.maxWidth) / width;
        width = opts.maxWidth;
      }

      if (height > opts.maxHeight) {
        width = (width * opts.maxHeight) / height;
        height = opts.maxHeight;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image with white background (for transparency in PNGs)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = outputType === 'image/png' ? undefined : opts.quality;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // If compressed is larger than original (rare), use original
          if (blob.size >= originalSize) {
            resolve({
              file,
              originalSize,
              compressedSize: originalSize,
              compressionRatio: 1,
              wasCompressed: false
            });
            return;
          }

          // Create new file with same name but compressed content
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, outputType === 'image/png' ? '.png' : '.jpg'),
            { type: outputType }
          );

          resolve({
            file: compressedFile,
            originalSize,
            compressedSize: compressedFile.size,
            compressionRatio: originalSize / compressedFile.size,
            wasCompressed: true
          });
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get compression summary message
 */
export function getCompressionSummary(result: CompressionResult): string {
  if (!result.wasCompressed) {
    return `Image: ${formatBytes(result.originalSize)} (no compression needed)`;
  }
  const savedPercent = Math.round((1 - result.compressedSize / result.originalSize) * 100);
  return `Compressed: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${savedPercent}% smaller)`;
}
