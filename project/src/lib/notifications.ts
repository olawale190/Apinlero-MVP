/**
 * Order notification service
 * Sends email and WhatsApp confirmations when orders are placed
 */

interface OrderNotificationData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  total: number;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
    unit: string;
  }>;
  deliveryMethod: 'delivery' | 'collection';
  deliveryAddress?: string;
}

interface NotificationResult {
  success: boolean;
  results: {
    email: { sent: boolean; error: string | null };
    whatsapp: { sent: boolean; error: string | null };
  };
}

/**
 * Send order confirmation notifications (email + WhatsApp)
 */
export async function sendOrderNotifications(data: OrderNotificationData): Promise<NotificationResult> {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send notifications');
    }

    return await response.json();
  } catch (error) {
    console.error('Notification error:', error);
    // Return a failure result but don't throw - notifications are non-critical
    return {
      success: false,
      results: {
        email: { sent: false, error: error instanceof Error ? error.message : 'Unknown error' },
        whatsapp: { sent: false, error: error instanceof Error ? error.message : 'Unknown error' },
      },
    };
  }
}
