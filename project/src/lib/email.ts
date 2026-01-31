// Email Service - Direct integration with Resend
// Multi-tenant email system with Reply-To support
// Provides email sending functionality without relying on n8n

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'noreply@apinlero.com';
const BUSINESS_EMAIL = import.meta.env.VITE_BUSINESS_EMAIL || 'info@apinlero.com';

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface EmailOptions {
  replyTo?: string;  // Business email for Reply-To header (multi-tenant support)
  businessName?: string;  // Business name for From field display name
}

interface OrderConfirmationData {
  customerEmail: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  // Multi-tenant fields
  businessEmail?: string;  // Business email for Reply-To
  businessName?: string;   // Business name for branding
}

interface LowStockAlertData {
  businessEmail: string;
  businessName: string;
  productName: string;
  currentStock: number;
  threshold: number;
  productId: string;
}

interface DailySummaryData {
  businessEmail: string;
  businessName: string;
  date: string;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: Array<{
    name: string;
    stock: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
  }>;
}

interface WelcomeEmailData {
  customerEmail: string;
  customerName: string;
  businessName: string;
  businessEmail?: string;  // Business email for Reply-To
  storeUrl?: string;
  whatsappNumber?: string;
}

/**
 * Send email using Resend API with multi-tenant support
 *
 * Multi-tenant Strategy (Option 2 - Shared Domain with Reply-To):
 * - All emails sent from noreply@apinlero.com (verified domain)
 * - Reply-To header set to business email (e.g., info@ishastreat.com)
 * - From display name includes business name for branding
 *
 * Future upgrade path: Option 1 (Custom domains per business)
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options: EmailOptions = {}
): Promise<EmailResponse> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // Build From field with business branding
    const fromName = options.businessName || 'Apinlero';
    const fromField = `${fromName} <${FROM_EMAIL}>`;

    // Build email payload
    const emailPayload: Record<string, unknown> = {
      from: fromField,
      to: [to],
      subject,
      html
    };

    // Add Reply-To for multi-tenant support (customers reply to business, not Apinlero)
    if (options.replyTo) {
      emailPayload.reply_to = options.replyTo;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(emailPayload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Email sent via Resend (ID: ${data.id}, Reply-To: ${options.replyTo || 'none'})`);
      return { success: true, messageId: data.id };
    } else {
      const error = await response.json().catch(() => ({}));
      console.error('❌ Resend API error:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: 'Network error - please try again' };
  }
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(
  data: OrderConfirmationData
): Promise<EmailResponse> {
  const businessName = data.businessName || 'Apinlero';
  const contactEmail = data.businessEmail || BUSINESS_EMAIL;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .total { font-size: 1.2em; font-weight: bold; margin-top: 20px; padding-top: 20px; border-top: 2px solid #1e3a8a; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
    .button { display: inline-block; background: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Order Confirmed! 🎉</h1>
    <p>Thank you for your order, ${data.customerName}!</p>
  </div>

  <div class="content">
    <p>Your order has been received and is being processed.</p>

    <div class="order-details">
      <h2>Order #${data.orderNumber}</h2>
      <p><strong>Order ID:</strong> ${data.orderId}</p>
      ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
      ${data.deliveryAddress ? `<p><strong>Delivery Address:</strong><br>${data.deliveryAddress}</p>` : ''}

      <h3>Items Ordered:</h3>
      ${data.items.map(item => `
        <div class="item">
          <span>${item.quantity}x ${item.name}</span>
          <span>£${item.price.toFixed(2)}</span>
        </div>
      `).join('')}

      <div class="total">
        <div style="display: flex; justify-content: space-between;">
          <span>Total:</span>
          <span>£${data.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <p>We'll send you another email when your order is ready for delivery/pickup.</p>

    <div class="footer">
      <p><strong>Questions?</strong> Simply reply to this email and we'll get back to you!</p>
      <p style="margin-top: 10px;">Or contact us at <a href="mailto:${contactEmail}">${contactEmail}</a></p>
      <p style="margin-top: 20px; font-size: 0.8em; color: #9ca3af;">
        Email sent by ${businessName} via Apinlero
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail(
    data.customerEmail,
    `Order Confirmation - #${data.orderNumber}`,
    html,
    {
      businessName,
      replyTo: data.businessEmail  // Customer replies go to business, not Apinlero
    }
  );
}

/**
 * Send low stock alert email to business owner
 */
export async function sendLowStockAlertEmail(
  data: LowStockAlertData
): Promise<EmailResponse> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Low Stock Alert</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; border: 2px solid #dc2626; }
    .alert-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
    .stock-info { font-size: 1.5em; font-weight: bold; color: #dc2626; margin: 15px 0; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ Low Stock Alert</h1>
    <p>${data.businessName}</p>
  </div>

  <div class="content">
    <div class="alert-box">
      <h2>${data.productName}</h2>
      <div class="stock-info">
        Current Stock: ${data.currentStock} units
      </div>
      <p><strong>Alert Threshold:</strong> ${data.threshold} units</p>
      <p><strong>Product ID:</strong> ${data.productId}</p>
    </div>

    <p>This product has fallen below your stock threshold. Consider reordering soon to avoid stockouts.</p>

    <a href="https://app.apinlero.com/app/inventory" class="button">
      Manage Inventory
    </a>

    <p style="margin-top: 30px; color: #6b7280; font-size: 0.9em; text-align: center;">
      You're receiving this because you have low stock alerts enabled in your Apinlero dashboard.
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail(
    data.businessEmail,
    `🚨 Low Stock Alert: ${data.productName}`,
    html,
    {
      businessName: data.businessName,
      replyTo: data.businessEmail
    }
  );
}

/**
 * Send daily summary report email
 */
export async function sendDailySummaryEmail(
  data: DailySummaryData
): Promise<EmailResponse> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Summary</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-value { font-size: 2em; font-weight: bold; color: #1e3a8a; }
    .stat-label { color: #6b7280; font-size: 0.9em; margin-top: 5px; }
    .section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .product-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
    .button { display: inline-block; background: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Daily Summary</h1>
    <p>${data.businessName}</p>
    <p style="font-size: 0.9em; opacity: 0.9;">${data.date}</p>
  </div>

  <div class="content">
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">${data.totalOrders}</div>
        <div class="stat-label">Orders</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">£${data.totalRevenue.toFixed(2)}</div>
        <div class="stat-label">Revenue</div>
      </div>
    </div>

    ${data.topProducts.length > 0 ? `
    <div class="section">
      <h3>🔥 Top Selling Products</h3>
      ${data.topProducts.map(product => `
        <div class="product-item">
          <span>${product.name}</span>
          <span><strong>${product.quantity}</strong> sold</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${data.lowStockProducts.length > 0 ? `
    <div class="section" style="border-left: 4px solid #dc2626;">
      <h3>⚠️ Low Stock Alerts</h3>
      ${data.lowStockProducts.map(product => `
        <div class="product-item">
          <span>${product.name}</span>
          <span style="color: #dc2626;"><strong>${product.stock}</strong> left</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div style="text-align: center;">
      <a href="https://app.apinlero.com/app" class="button">
        View Full Dashboard
      </a>
    </div>

    <p style="margin-top: 30px; color: #6b7280; font-size: 0.9em; text-align: center;">
      This daily summary is sent automatically at 6 PM. You can adjust your email preferences in your dashboard.
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail(
    data.businessEmail,
    `Daily Summary - ${data.date}`,
    html,
    {
      businessName: data.businessName,
      replyTo: data.businessEmail
    }
  );
}

/**
 * Send welcome email to new customer
 */
export async function sendWelcomeEmail(
  data: WelcomeEmailData
): Promise<EmailResponse> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .feature-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .button { display: inline-block; background: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .icon { font-size: 2em; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to ${data.businessName}! 🎉</h1>
    <p>We're excited to have you, ${data.customerName}!</p>
  </div>

  <div class="content">
    <p>Thank you for choosing ${data.businessName}. We're here to provide you with the best products and service.</p>

    <div class="feature-box">
      <div class="icon">🛒</div>
      <h3>Shop Online</h3>
      <p>Browse our full catalog and place orders anytime.</p>
      ${data.storeUrl ? `<a href="${data.storeUrl}" class="button">Visit Store</a>` : ''}
    </div>

    ${data.whatsappNumber ? `
    <div class="feature-box">
      <div class="icon">💬</div>
      <h3>Order via WhatsApp</h3>
      <p>Send us a message to place orders, check availability, or ask questions.</p>
      <a href="https://wa.me/${data.whatsappNumber.replace(/[^0-9]/g, '')}" class="button">Chat Now</a>
    </div>
    ` : ''}

    <div class="feature-box">
      <div class="icon">📦</div>
      <h3>Track Your Orders</h3>
      <p>You'll receive email updates when your orders are confirmed and ready for delivery.</p>
    </div>

    <p style="margin-top: 30px;">If you have any questions, feel free to reach out - simply reply to this email!</p>

    <p style="margin-top: 30px; color: #6b7280; font-size: 0.9em; text-align: center;">
      Welcome aboard! 🚀
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail(
    data.customerEmail,
    `Welcome to ${data.businessName}! 👋`,
    html,
    {
      businessName: data.businessName,
      replyTo: data.businessEmail  // Customer replies go to business
    }
  );
}

/**
 * Send order status update email
 */
export async function sendOrderStatusUpdateEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  status: string,
  statusMessage: string,
  businessEmail?: string,
  businessName?: string
): Promise<EmailResponse> {
  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    processing: '#8b5cf6',
    ready: '#10b981',
    delivered: '#059669',
    cancelled: '#dc2626'
  };

  const color = statusColors[status.toLowerCase()] || '#6b7280';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${color}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .status-badge { background: ${color}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
    .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Order Update 📦</h1>
    <p>Hi ${customerName}!</p>
  </div>

  <div class="content">
    <div class="order-info">
      <h2>Order #${orderNumber}</h2>
      <p><span class="status-badge">${status.toUpperCase()}</span></p>
      <p style="margin-top: 20px; font-size: 1.1em;">${statusMessage}</p>
    </div>

    <p>We'll keep you updated as your order progresses.</p>

    <div style="margin-top: 30px; color: #6b7280; font-size: 0.9em; text-align: center;">
      <p>Questions? Simply reply to this email!</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail(
    customerEmail,
    `Order Update - #${orderNumber}`,
    html,
    {
      businessName,
      replyTo: businessEmail  // Customer replies go to business
    }
  );
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}

/**
 * Test email configuration with multi-tenant support
 */
export async function testEmailConfiguration(
  testEmail: string,
  businessEmail?: string,
  businessName?: string
): Promise<EmailResponse> {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
  <h1>✅ Email Test Successful!</h1>
  <p>Your Apinlero email configuration is working correctly.</p>
  ${businessName ? `<p><strong>Business:</strong> ${businessName}</p>` : ''}
  ${businessEmail ? `<p><strong>Reply-To:</strong> ${businessEmail}</p>` : ''}
  <p style="color: #6b7280; font-size: 0.9em;">Sent at ${new Date().toISOString()}</p>
  ${businessEmail ? `<p style="color: #6b7280; font-size: 0.9em; margin-top: 20px;">Try replying to this email - it will go to ${businessEmail}</p>` : ''}
</body>
</html>
  `.trim();

  return sendEmail(testEmail, '✅ Apinlero Email Test', html, {
    businessName,
    replyTo: businessEmail
  });
}

/**
 * Helper: Get business email context from user session
 * Usage: Pass the result to any email function for automatic multi-tenant support
 */
export function getBusinessEmailContext(businessData?: { owner_email?: string; business_name?: string }) {
  return {
    businessEmail: businessData?.owner_email,
    businessName: businessData?.business_name
  };
}
