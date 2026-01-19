// n8n Storage Webhook Integration
// Triggers n8n workflows for file storage operations

const N8N_BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

interface N8nStorageResponse {
  success: boolean;
  fileUrl?: string;
  filePath?: string;
  message?: string;
  error?: string;
}

/**
 * Upload a file via n8n workflow (triggers n8n to handle storage)
 * Useful when you want n8n to process the file before storing
 */
export async function triggerFileUpload(
  fileName: string,
  fileData: string, // base64 encoded
  fileType: string,
  folder: string = 'uploads',
  metadata?: Record<string, unknown>
): Promise<N8nStorageResponse> {
  if (!N8N_BASE_URL) {
    console.warn('N8N_WEBHOOK_URL not configured');
    return { success: false, error: 'n8n not configured' };
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/storage-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        fileData,
        fileType,
        folder,
        metadata,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        fileUrl: data.url,
        filePath: data.path,
        message: 'File uploaded successfully'
      };
    } else {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.message || 'Upload failed' };
    }
  } catch (error) {
    console.error('n8n storage upload error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Request a signed URL for file download via n8n
 */
export async function triggerGetSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<N8nStorageResponse> {
  if (!N8N_BASE_URL) {
    return { success: false, error: 'n8n not configured' };
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/storage-signed-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath,
        expiresIn,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        fileUrl: data.signedUrl,
        message: 'Signed URL generated'
      };
    } else {
      return { success: false, error: 'Failed to generate signed URL' };
    }
  } catch (error) {
    console.error('n8n signed URL error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Trigger file processing workflow (e.g., resize image, extract text)
 */
export async function triggerFileProcessing(
  filePath: string,
  operation: 'resize' | 'compress' | 'extract-text' | 'generate-thumbnail',
  options?: Record<string, unknown>
): Promise<N8nStorageResponse> {
  if (!N8N_BASE_URL) {
    return { success: false, error: 'n8n not configured' };
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/storage-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath,
        operation,
        options,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        fileUrl: data.url,
        filePath: data.path,
        message: `File ${operation} completed`
      };
    } else {
      return { success: false, error: `${operation} failed` };
    }
  } catch (error) {
    console.error('n8n file processing error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Store WhatsApp media from webhook
 * Call this when receiving media from WhatsApp via n8n
 */
export async function triggerWhatsAppMediaStore(
  mediaId: string,
  mediaType: 'image' | 'audio' | 'video' | 'document',
  customerPhone: string,
  orderId?: string
): Promise<N8nStorageResponse> {
  if (!N8N_BASE_URL) {
    return { success: false, error: 'n8n not configured' };
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/whatsapp-media-store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaId,
        mediaType,
        customerPhone,
        orderId,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        fileUrl: data.url,
        filePath: data.path,
        message: 'WhatsApp media stored'
      };
    } else {
      return { success: false, error: 'Failed to store WhatsApp media' };
    }
  } catch (error) {
    console.error('n8n WhatsApp media error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Check if n8n storage webhooks are configured
 */
export function isN8nStorageConfigured(): boolean {
  return !!N8N_BASE_URL;
}
