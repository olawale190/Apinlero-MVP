/**
 * WhatsApp Business API Service
 *
 * Uses Meta's WhatsApp Business Cloud API to send notifications
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import axios from 'axios';

// WhatsApp API Configuration
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const BUSINESS_NAME = 'Isha Treat';

// Message Templates (must be pre-approved in Meta Business Manager)
export const TEMPLATES = {
  ORDER_CONFIRMATION: 'order_confirmation',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  PAYMENT_RECEIVED: 'payment_received',
  ORDER_CANCELLED: 'order_cancelled',
} as const;

interface WhatsAppResponse {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

interface OrderDetails {
  orderNumber: string;
  customerName: string;
  total: number;
  itemCount: number;
  deliveryAddress?: string;
  estimatedDelivery?: string;
}

class WhatsAppService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!(WHATSAPP_PHONE_ID && WHATSAPP_ACCESS_TOKEN);
    if (!this.isConfigured) {
      console.warn('WhatsApp API not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env');
    }
  }

  /**
   * Format Nigerian phone number for WhatsApp
   * Converts 08012345678 to 2348012345678
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle Nigerian numbers
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1);
    } else if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned;
    }

    return cleaned;
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Send a text message
   */
  async sendTextMessage(phone: string, message: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`[WhatsApp - DEV] Would send to ${phone}: ${message}`);
      return true;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      await axios.post<WhatsAppResponse>(
        `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`[WhatsApp] Message sent to ${formattedPhone}`);
      return true;
    } catch (error: any) {
      console.error('[WhatsApp] Failed to send message:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send a template message (for transactional notifications)
   */
  async sendTemplateMessage(
    phone: string,
    templateName: string,
    parameters: string[]
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`[WhatsApp - DEV] Would send template "${templateName}" to ${phone}`);
      console.log(`[WhatsApp - DEV] Parameters:`, parameters);
      return true;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      await axios.post<WhatsAppResponse>(
        `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: parameters.map((text) => ({ type: 'text', text })),
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`[WhatsApp] Template "${templateName}" sent to ${formattedPhone}`);
      return true;
    } catch (error: any) {
      console.error('[WhatsApp] Failed to send template:', error.response?.data || error.message);
      return false;
    }
  }

  // ==================== ORDER NOTIFICATIONS ====================

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(phone: string, order: OrderDetails): Promise<boolean> {
    const message = `🛒 *Order Confirmed!*

Thank you for your order from ${BUSINESS_NAME}!

📦 *Order #${order.orderNumber}*
👤 ${order.customerName}
🛍️ ${order.itemCount} item(s)
💰 Total: ${this.formatCurrency(order.total)}

📍 Delivery to:
${order.deliveryAddress || 'Address on file'}

We'll notify you when your order is on the way!

Thank you for shopping with ${BUSINESS_NAME} 🙏`;

    return this.sendTextMessage(phone, message);
  }

  /**
   * Send order shipped notification
   */
  async sendOrderShipped(phone: string, order: OrderDetails): Promise<boolean> {
    const message = `🚚 *Your Order is On The Way!*

Hi ${order.customerName},

Great news! Your order #${order.orderNumber} has been shipped!

📦 ${order.itemCount} item(s)
💰 Total: ${this.formatCurrency(order.total)}

${order.estimatedDelivery ? `🕐 Estimated delivery: ${order.estimatedDelivery}` : ''}

Our delivery team will contact you shortly.

Thank you for choosing ${BUSINESS_NAME}! 🙏`;

    return this.sendTextMessage(phone, message);
  }

  /**
   * Send order delivered notification
   */
  async sendOrderDelivered(phone: string, order: OrderDetails): Promise<boolean> {
    const message = `✅ *Order Delivered!*

Hi ${order.customerName},

Your order #${order.orderNumber} has been delivered!

📦 ${order.itemCount} item(s)
💰 Total: ${this.formatCurrency(order.total)}

We hope you enjoy your purchase!

If you have any questions or feedback, please don't hesitate to reach out.

Thank you for choosing ${BUSINESS_NAME}! 🙏

💚 Shop again: [Your App Link]`;

    return this.sendTextMessage(phone, message);
  }

  /**
   * Send payment received notification
   */
  async sendPaymentReceived(phone: string, order: OrderDetails): Promise<boolean> {
    const message = `💳 *Payment Received!*

Hi ${order.customerName},

We've received your payment for order #${order.orderNumber}!

💰 Amount: ${this.formatCurrency(order.total)}

Your order is now being processed and will be shipped soon.

Thank you for shopping with ${BUSINESS_NAME}! 🙏`;

    return this.sendTextMessage(phone, message);
  }

  /**
   * Send order cancelled notification
   */
  async sendOrderCancelled(phone: string, order: OrderDetails, reason?: string): Promise<boolean> {
    const message = `❌ *Order Cancelled*

Hi ${order.customerName},

Your order #${order.orderNumber} has been cancelled.

${reason ? `📝 Reason: ${reason}` : ''}

💰 Amount: ${this.formatCurrency(order.total)}

If you paid online, your refund will be processed within 3-5 business days.

Need help? Reply to this message or call us.

- ${BUSINESS_NAME} Team`;

    return this.sendTextMessage(phone, message);
  }

  /**
   * Send order status update
   */
  async sendOrderStatusUpdate(
    phone: string,
    order: OrderDetails,
    status: string,
    note?: string
  ): Promise<boolean> {
    const statusEmojis: Record<string, string> = {
      PENDING: '⏳',
      CONFIRMED: '✅',
      PROCESSING: '📦',
      SHIPPED: '🚚',
      OUT_FOR_DELIVERY: '🛵',
      DELIVERED: '✅',
      CANCELLED: '❌',
    };

    const emoji = statusEmojis[status] || '📋';

    const message = `${emoji} *Order Update*

Hi ${order.customerName},

Your order #${order.orderNumber} status: *${status}*

${note ? `📝 ${note}` : ''}

💰 Total: ${this.formatCurrency(order.total)}

Track your order in the ${BUSINESS_NAME} app.

Thank you! 🙏`;

    return this.sendTextMessage(phone, message);
  }

  // ==================== MARKETING & ALERTS ====================

  /**
   * Send low stock alert to admin
   */
  async sendLowStockAlert(adminPhone: string, productName: string, currentStock: number): Promise<boolean> {
    const message = `⚠️ *Low Stock Alert*

Product: ${productName}
Current Stock: ${currentStock}

Please restock soon to avoid running out.

- ${BUSINESS_NAME} System`;

    return this.sendTextMessage(adminPhone, message);
  }

  /**
   * Send new order alert to admin
   */
  async sendNewOrderAlert(adminPhone: string, order: OrderDetails): Promise<boolean> {
    const message = `🔔 *New Order Received!*

Order #${order.orderNumber}
Customer: ${order.customerName}
Items: ${order.itemCount}
Total: ${this.formatCurrency(order.total)}

📍 ${order.deliveryAddress || 'Check app for address'}

Login to admin panel to process this order.`;

    return this.sendTextMessage(adminPhone, message);
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
