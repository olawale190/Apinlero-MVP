// n8n Webhook Integration
// Triggers n8n workflows for email automation

const N8N_BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

interface N8nResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Trigger a manual email send via n8n
 * Used for resending order confirmations or status updates
 */
export async function triggerOrderEmail(
  orderId: string,
  type: 'confirmation' | 'status'
): Promise<N8nResponse> {
  if (!N8N_BASE_URL) {
    console.warn('N8N_WEBHOOK_URL not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/manual-order-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, type, timestamp: new Date().toISOString() })
    });

    if (response.ok) {
      return { success: true, message: 'Email sent successfully' };
    } else {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.message || 'Failed to send email' };
    }
  } catch (error) {
    console.error('n8n webhook error:', error);
    return { success: false, error: 'Network error - please try again' };
  }
}

/**
 * Trigger low stock alert email to business owner
 */
export async function triggerLowStockAlert(
  productId: string,
  productName: string,
  stockQuantity: number
): Promise<N8nResponse> {
  if (!N8N_BASE_URL) {
    console.warn('N8N_WEBHOOK_URL not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/manual-stock-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        productName,
        stockQuantity,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      return { success: true, message: 'Alert sent successfully' };
    } else {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.message || 'Failed to send alert' };
    }
  } catch (error) {
    console.error('n8n webhook error:', error);
    return { success: false, error: 'Network error - please try again' };
  }
}

/**
 * Trigger expiry warning email for products expiring soon
 */
export async function triggerExpiryAlert(
  productId: string,
  productName: string,
  expiryDate: string,
  daysUntilExpiry: number
): Promise<N8nResponse> {
  if (!N8N_BASE_URL) {
    console.warn('N8N_WEBHOOK_URL not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/manual-expiry-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        productName,
        expiryDate,
        daysUntilExpiry,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      return { success: true, message: 'Expiry alert sent successfully' };
    } else {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.message || 'Failed to send alert' };
    }
  } catch (error) {
    console.error('n8n webhook error:', error);
    return { success: false, error: 'Network error - please try again' };
  }
}

/**
 * Trigger daily summary report email
 */
export async function triggerDailySummary(): Promise<N8nResponse> {
  if (!N8N_BASE_URL) {
    console.warn('N8N_WEBHOOK_URL not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/manual-daily-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: new Date().toISOString() })
    });

    if (response.ok) {
      return { success: true, message: 'Daily summary sent successfully' };
    } else {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.message || 'Failed to send summary' };
    }
  } catch (error) {
    console.error('n8n webhook error:', error);
    return { success: false, error: 'Network error - please try again' };
  }
}

/**
 * Test n8n webhook connection
 */
export async function testN8nConnection(): Promise<N8nResponse> {
  if (!N8N_BASE_URL) {
    return { success: false, error: 'N8N_WEBHOOK_URL not configured in environment' };
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
    });

    if (response.ok) {
      return { success: true, message: 'n8n connection successful' };
    } else {
      return { success: false, error: 'n8n webhook returned an error' };
    }
  } catch (error) {
    console.error('n8n connection test error:', error);
    return { success: false, error: 'Could not connect to n8n' };
  }
}

/**
 * Check if n8n is configured
 */
export function isN8nConfigured(): boolean {
  return !!N8N_BASE_URL;
}
