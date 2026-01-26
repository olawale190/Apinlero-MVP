// Supabase Storage Integration for Apinlero
// Handles file uploads, downloads, and management for n8n workflows

import { supabase } from './supabase';

// Storage bucket names
export const BUCKETS = {
  MEDIA: 'apinlero-media',      // WhatsApp images, voice notes (private)
  DOCUMENTS: 'apinlero-documents', // Receipts, invoices (private)
  PRODUCTS: 'apinlero-products'    // Product catalog images (public)
} as const;

type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

export interface StorageResponse {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface StorageDiagnosticsResult {
  success: boolean;
  bucketsExist: { [key: string]: boolean };
  bucketsPublic: { [key: string]: boolean };
  uploadTestPassed: boolean;
  error?: string;
  recommendations: string[];
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

/**
 * Upload a file to Supabase Storage
 * @param bucket - The bucket to upload to
 * @param file - The file to upload
 * @param folder - Optional folder path within the bucket
 * @returns StorageResponse with the file URL or error
 */
export async function uploadFile(
  bucket: BucketName,
  file: File,
  folder?: string
): Promise<StorageResponse> {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = folder
      ? `${folder}/${timestamp}_${sanitizedName}`
      : `${timestamp}_${sanitizedName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      // Provide user-friendly error messages based on error type
      let userMessage = error.message;
      if (error.message.toLowerCase().includes('policy') || error.message.toLowerCase().includes('permission') || error.message.toLowerCase().includes('not authorized')) {
        userMessage = 'Permission denied. Storage RLS policies may not be configured. Run the storage SQL in Supabase Dashboard.';
      } else if (error.message.toLowerCase().includes('not found')) {
        userMessage = `Storage bucket "${bucket}" not found. Please check Supabase configuration.`;
      } else if (error.message.toLowerCase().includes('size') || error.message.toLowerCase().includes('too large')) {
        userMessage = 'File is too large. Maximum size is 5MB.';
      } else if (error.message.toLowerCase().includes('type') || error.message.toLowerCase().includes('mime')) {
        userMessage = 'File type not allowed. Please upload an image (JPEG, PNG, GIF, or WebP).';
      }
      return { success: false, error: userMessage };
    }

    // Get the public URL for public buckets, signed URL for private
    const url = bucket === BUCKETS.PRODUCTS
      ? getPublicUrl(bucket, data.path)
      : await getSignedUrl(bucket, data.path);

    return {
      success: true,
      path: data.path,
      url: url || undefined
    };
  } catch (error) {
    console.error('Storage upload exception:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Upload failed: ${errorMessage}` };
  }
}

/**
 * Upload a file from a base64 string (useful for n8n workflows)
 * @param bucket - The bucket to upload to
 * @param base64Data - Base64 encoded file data
 * @param fileName - Name for the file
 * @param contentType - MIME type of the file
 * @param folder - Optional folder path
 */
export async function uploadBase64File(
  bucket: BucketName,
  base64Data: string,
  fileName: string,
  contentType: string,
  folder?: string
): Promise<StorageResponse> {
  try {
    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = folder
      ? `${folder}/${timestamp}_${sanitizedName}`
      : `${timestamp}_${sanitizedName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, bytes, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }

    const url = bucket === BUCKETS.PRODUCTS
      ? getPublicUrl(bucket, data.path)
      : await getSignedUrl(bucket, data.path);

    return {
      success: true,
      path: data.path,
      url: url || undefined
    };
  } catch (error) {
    console.error('Storage upload exception:', error);
    return { success: false, error: 'Failed to upload file' };
  }
}

/**
 * Get a public URL for a file (only works for public buckets)
 */
export function getPublicUrl(bucket: BucketName, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get a signed URL for private file access
 * @param bucket - The bucket name
 * @param path - The file path
 * @param expiresIn - Expiry time in seconds (default 1 hour)
 */
export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Download a file from storage
 */
export async function downloadFile(
  bucket: BucketName,
  path: string
): Promise<Blob | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);

  if (error) {
    console.error('Download error:', error);
    return null;
  }

  return data;
}

/**
 * List files in a bucket/folder
 */
export async function listFiles(
  bucket: BucketName,
  folder?: string,
  limit: number = 100
): Promise<{ files: FileMetadata[]; error?: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder || '', {
      limit,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) {
    console.error('List files error:', error);
    return { files: [], error: error.message };
  }

  const files: FileMetadata[] = data
    .filter(item => item.name) // Filter out folders
    .map(item => ({
      name: item.name,
      size: item.metadata?.size || 0,
      type: item.metadata?.mimetype || 'unknown',
      lastModified: new Date(item.created_at || '').getTime()
    }));

  return { files };
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucket: BucketName,
  path: string
): Promise<StorageResponse> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if storage is configured and accessible
 */
export async function testStorageConnection(): Promise<StorageResponse> {
  try {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      return { success: false, error: error.message };
    }

    const bucketNames = data.map(b => b.name);
    const requiredBuckets = Object.values(BUCKETS);
    const missingBuckets = requiredBuckets.filter(b => !bucketNames.includes(b));

    if (missingBuckets.length > 0) {
      return {
        success: false,
        error: `Missing buckets: ${missingBuckets.join(', ')}. Please create them in Supabase dashboard.`
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Could not connect to storage' };
  }
}

// ============================================================================
// DATABASE TRACKING FUNCTIONS
// ============================================================================

export interface MediaFileRecord {
  id?: string;
  file_path: string;
  file_name: string;
  bucket_name: string;
  file_type?: string;
  mime_type?: string;
  file_size_bytes?: number;
  source: 'whatsapp' | 'web' | 'n8n' | 'manual';
  customer_phone?: string;
  order_id?: string;
  product_id?: string;
  metadata?: Record<string, unknown>;
  is_public?: boolean;
  expires_at?: string;
}

/**
 * Log uploaded file to database for tracking
 */
export async function logFileToDatabase(
  record: Omit<MediaFileRecord, 'id'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('media_files')
      .insert(record)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log file:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Log file exception:', error);
    return { success: false, error: 'Failed to log file to database' };
  }
}

/**
 * Upload file and log to database in one operation
 */
export async function uploadAndTrack(
  bucket: BucketName,
  file: File,
  options: {
    folder?: string;
    source: MediaFileRecord['source'];
    customerPhone?: string;
    orderId?: string;
    productId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<StorageResponse & { fileId?: string }> {
  const uploadResult = await uploadFile(bucket, file, options.folder);

  if (!uploadResult.success || !uploadResult.path) {
    return uploadResult;
  }

  const logResult = await logFileToDatabase({
    file_path: uploadResult.path,
    file_name: file.name,
    bucket_name: bucket,
    file_type: file.type.split('/')[0],
    mime_type: file.type,
    file_size_bytes: file.size,
    source: options.source,
    customer_phone: options.customerPhone,
    order_id: options.orderId,
    product_id: options.productId,
    metadata: options.metadata,
    is_public: bucket === BUCKETS.PRODUCTS
  });

  return {
    ...uploadResult,
    fileId: logResult.id
  };
}

/**
 * Get files for a specific customer
 */
export async function getCustomerFiles(
  customerPhone: string
): Promise<{ files: MediaFileRecord[]; error?: string }> {
  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('customer_phone', customerPhone)
    .order('created_at', { ascending: false });

  if (error) {
    return { files: [], error: error.message };
  }

  return { files: data || [] };
}

/**
 * Get files for a specific order
 */
export async function getOrderFiles(
  orderId: string
): Promise<{ files: MediaFileRecord[]; error?: string }> {
  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    return { files: [], error: error.message };
  }

  return { files: data || [] };
}

// ============================================================================
// STORAGE STATISTICS
// ============================================================================

export interface StorageStats {
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeMB: number;
  byBucket: Record<string, { count: number; sizeBytes: number }>;
  bySource: Record<string, number>;
  recentFiles: MediaFileRecord[];
}

/**
 * Get comprehensive storage statistics
 */
export async function getStorageStats(): Promise<StorageStats | null> {
  try {
    // Get all files from database
    const { data: files, error } = await supabase
      .from('media_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !files) {
      console.error('Failed to get storage stats:', error);
      return null;
    }

    const stats: StorageStats = {
      totalFiles: files.length,
      totalSizeBytes: 0,
      totalSizeMB: 0,
      byBucket: {},
      bySource: {},
      recentFiles: files.slice(0, 10)
    };

    files.forEach(file => {
      const size = file.file_size_bytes || 0;
      stats.totalSizeBytes += size;

      // By bucket
      if (!stats.byBucket[file.bucket_name]) {
        stats.byBucket[file.bucket_name] = { count: 0, sizeBytes: 0 };
      }
      stats.byBucket[file.bucket_name].count++;
      stats.byBucket[file.bucket_name].sizeBytes += size;

      // By source
      stats.bySource[file.source] = (stats.bySource[file.source] || 0) + 1;
    });

    stats.totalSizeMB = Math.round(stats.totalSizeBytes / (1024 * 1024) * 100) / 100;

    return stats;
  } catch (error) {
    console.error('Storage stats exception:', error);
    return null;
  }
}

/**
 * Check storage usage against limits
 */
export async function checkStorageLimits(): Promise<{
  usedMB: number;
  limitMB: number;
  percentUsed: number;
  isNearLimit: boolean;
  recommendation: string;
}> {
  const FREE_TIER_LIMIT_MB = 1024; // 1GB free tier
  const WARNING_THRESHOLD = 0.8; // 80%

  const stats = await getStorageStats();
  const usedMB = stats?.totalSizeMB || 0;
  const percentUsed = usedMB / FREE_TIER_LIMIT_MB;

  let recommendation = 'Storage usage is healthy.';
  if (percentUsed >= WARNING_THRESHOLD) {
    recommendation = 'Consider upgrading to Supabase Pro or cleaning up old files.';
  } else if (percentUsed >= 0.5) {
    recommendation = 'Monitor storage usage. Consider setting up automatic cleanup for old files.';
  }

  return {
    usedMB,
    limitMB: FREE_TIER_LIMIT_MB,
    percentUsed: Math.round(percentUsed * 100),
    isNearLimit: percentUsed >= WARNING_THRESHOLD,
    recommendation
  };
}

// ============================================================================
// STORAGE DIAGNOSTICS
// ============================================================================

/**
 * Run comprehensive storage diagnostics to identify configuration issues
 */
export async function runStorageDiagnostics(): Promise<StorageDiagnosticsResult> {
  const result: StorageDiagnosticsResult = {
    success: false,
    bucketsExist: {},
    bucketsPublic: {},
    uploadTestPassed: false,
    recommendations: []
  };

  try {
    // 1. Check if we can access storage at all
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      result.error = `Cannot access storage: ${listError.message}`;
      result.recommendations.push('Check your Supabase URL and API key in .env file');
      result.recommendations.push('Ensure the Supabase project is active');
      return result;
    }

    // 2. Check which required buckets exist and their public status
    const requiredBuckets = Object.values(BUCKETS);
    for (const bucket of requiredBuckets) {
      const found = buckets?.find(b => b.name === bucket);
      result.bucketsExist[bucket] = !!found;
      result.bucketsPublic[bucket] = found?.public || false;

      if (!found) {
        result.recommendations.push(`Create bucket "${bucket}" in Supabase Dashboard > Storage`);
      }
    }

    // 3. Check if apinlero-products is public (required for product images)
    if (result.bucketsExist[BUCKETS.PRODUCTS] && !result.bucketsPublic[BUCKETS.PRODUCTS]) {
      result.recommendations.push(`Set "${BUCKETS.PRODUCTS}" bucket to PUBLIC in Supabase Dashboard > Storage > bucket settings`);
    }

    // 4. Test upload permission if bucket exists
    if (result.bucketsExist[BUCKETS.PRODUCTS]) {
      try {
        const testContent = 'diagnostic-test-' + Date.now();
        const testBlob = new Blob([testContent], { type: 'text/plain' });
        const testFile = new File([testBlob], 'diagnostic-test.txt', { type: 'text/plain' });
        const testPath = `_diagnostics/${Date.now()}_test.txt`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKETS.PRODUCTS)
          .upload(testPath, testFile);

        if (uploadError) {
          console.error('Diagnostic upload test failed:', uploadError);
          if (uploadError.message.toLowerCase().includes('policy') ||
              uploadError.message.toLowerCase().includes('permission') ||
              uploadError.message.toLowerCase().includes('not authorized')) {
            result.recommendations.push('Run the storage RLS policies SQL in Supabase SQL Editor');
            result.recommendations.push('Policy needed: "Authenticated users can upload product images"');
          } else {
            result.recommendations.push(`Upload test failed: ${uploadError.message}`);
          }
        } else {
          result.uploadTestPassed = true;
          // Clean up test file
          await supabase.storage.from(BUCKETS.PRODUCTS).remove([testPath]);
        }
      } catch (testError) {
        console.error('Upload test exception:', testError);
        result.recommendations.push('Upload test threw an exception. Check browser console for details.');
      }
    }

    // 5. Determine overall success
    result.success =
      result.bucketsExist[BUCKETS.PRODUCTS] &&
      result.bucketsPublic[BUCKETS.PRODUCTS] &&
      result.uploadTestPassed;

    if (result.success) {
      result.recommendations = ['Storage is properly configured. Image uploads should work.'];
    }

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error during diagnostics';
    result.recommendations.push('Unexpected error occurred. Check browser console for details.');
    return result;
  }
}
