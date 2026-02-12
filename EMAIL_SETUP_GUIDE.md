# Apinlero Email Setup Guide

Complete guide to setting up and configuring email functionality for Apinlero MVP.

---

## Overview

Apinlero supports **two email delivery methods**:

1. **Resend (Primary)** - Direct API integration, fast and reliable
2. **n8n (Fallback)** - Workflow-based automation, optional

The system automatically uses Resend if configured, otherwise falls back to n8n.

---

## Quick Start (Recommended: Resend)

### 1. Sign Up for Resend

1. Go to [resend.com](https://resend.com)
2. Click "Get Started for Free"
3. Sign up with your email
4. Verify your email address

### 2. Get Your API Key

1. Log in to Resend dashboard
2. Go to **API Keys** section
3. Click "Create API Key"
4. Give it a name (e.g., "Apinlero Production")
5. Copy the API key (starts with `re_`)

### 3. Configure Environment Variables

Add these to your `.env` file:

```bash
# Required
VITE_RESEND_API_KEY=re_your_actual_api_key_here

# Optional (defaults provided)
VITE_FROM_EMAIL=noreply@apinlero.com
VITE_BUSINESS_EMAIL=info@apinlero.com
```

### 4. Verify Domain (Production Only)

For production, verify your domain in Resend:

1. Go to **Domains** in Resend dashboard
2. Click "Add Domain"
3. Enter your domain (e.g., `apinlero.com`)
4. Add the DNS records to your domain provider
5. Wait for verification (usually 5-10 minutes)

**Note**: For development/testing, you can use Resend's test domain without verification.

### 5. Test Email Configuration

1. Start your development server: `npm run dev`
2. Navigate to `/email-settings` route
3. Enter your email address
4. Click "Send Basic Test"
5. Check your inbox (and spam folder)

---

## Email Features

### 1. Order Confirmation Emails ✅

**When**: Automatically sent when new order is created
**Who**: Customer
**Includes**:
- Order number and details
- Item list with quantities and prices
- Total amount
- Delivery address
- Estimated delivery time

**Manual trigger**: Click "Resend Confirmation" in Orders table

---

### 2. Order Status Update Emails ✅

**When**: Automatically sent when order status changes
**Who**: Customer
**Includes**:
- Order number
- New status (Pending/Confirmed/Delivered)
- Status-specific message

**Manual trigger**: Click "Send Status Update" in Orders table

---

### 3. Low Stock Alert Emails ✅

**When**: Manually triggered from inventory
**Who**: Business owner
**Includes**:
- Product name
- Current stock level
- Alert threshold
- Link to inventory management

**Manual trigger**: Click mail icon on low stock products in Inventory Manager

---

### 4. Daily Summary Report Emails ✅

**When**: Can be scheduled or manually triggered
**Who**: Business owner
**Includes**:
- Total orders and revenue for the day
- Top selling products
- Low stock alerts
- Link to full dashboard

**Usage**:
```typescript
import { sendDailySummaryEmail } from '../lib/email';

await sendDailySummaryEmail({
  businessEmail: 'owner@business.com',
  businessName: 'Your Business Name',
  date: new Date().toLocaleDateString(),
  totalOrders: 15,
  totalRevenue: 450.75,
  lowStockProducts: [/* ... */],
  topProducts: [/* ... */]
});
```

---

### 5. Welcome Emails ✅

**When**: Sent when new customer signs up
**Who**: New customer
**Includes**:
- Welcome message
- Store link
- WhatsApp contact option
- Getting started guide

**Triggered**: Automatically in SignupForm component

---

## Email Templates

All email templates are designed with:
- **Responsive design** - Works on mobile and desktop
- **Professional styling** - Navy blue gradient theme matching Apinlero branding
- **Clear CTAs** - Action buttons for key links
- **Accessibility** - Proper HTML structure and alt text

Templates are located in: [`project/src/lib/email.ts`](project/src/lib/email.ts)

---

## Production Deployment

### Vercel Deployment

1. Add environment variables in Vercel dashboard:
   ```bash
   vercel env add VITE_RESEND_API_KEY production
   # Paste your API key when prompted

   vercel env add VITE_FROM_EMAIL production
   # Enter: noreply@yourdomain.com

   vercel env add VITE_BUSINESS_EMAIL production
   # Enter: info@yourdomain.com
   ```

2. Redeploy:
   ```bash
   vercel --prod
   ```

### Railway Deployment (WhatsApp Bot)

If using the WhatsApp bot with email integration:

1. Add environment variables in Railway dashboard
2. Redeploy the service

---

## Alternative: n8n Setup (Optional Fallback)

If you prefer workflow-based automation or want a fallback:

### 1. Deploy n8n Instance

**Option A: n8n Cloud** (Recommended)
1. Go to [n8n.cloud](https://n8n.cloud)
2. Sign up for free account
3. Create a new workflow
4. Get your webhook URL

**Option B: Railway**
1. Deploy n8n template from Railway
2. Set encryption key environment variable
3. Access your n8n instance URL

### 2. Import Workflows

Workflow templates are in [`project/n8n-workflows/`](project/n8n-workflows/):

- `01-order-confirmation.json`
- `02-order-status-update.json`
- `03-new-order-alert.json`
- `04-low-stock-alert.json`
- `05-daily-summary.json`
- `06-manual-triggers.json`
- `07-welcome-email.json`

### 3. Configure n8n Credentials

In n8n, add credentials for:
- **Resend HTTP Request** node (use your Resend API key)
- **Supabase** credentials for data fetching

### 4. Set Environment Variable

```bash
VITE_N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook
```

---

## Troubleshooting

### Email Not Sending

**Check 1**: Verify environment variables are set
```bash
# In your terminal
echo $VITE_RESEND_API_KEY
```

**Check 2**: Check browser console for errors
- Open DevTools → Console
- Look for API errors

**Check 3**: Test directly in Email Settings page
- Navigate to `/email-settings`
- Send test email
- Check result message

### Emails Going to Spam

**Solution**: Verify your domain in Resend
1. Add SPF, DKIM, and DMARC records
2. Send test emails to yourself
3. Mark as "Not Spam" to train filters

### API Key Not Working

**Solution**: Regenerate API key
1. Go to Resend dashboard → API Keys
2. Delete old key
3. Create new key
4. Update environment variables
5. Restart development server

### Emails Have Broken Styling

**Issue**: Email HTML/CSS not rendering correctly

**Solution**: Email clients have limited CSS support
- Our templates use inline styles
- Avoid Tailwind classes in email templates
- Test with multiple email clients

---

## Email Testing Checklist

Use the Email Settings page (`/email-settings`) to test:

- [ ] Basic connectivity test passes
- [ ] Order confirmation email received
- [ ] Low stock alert email received
- [ ] Daily summary email received
- [ ] Welcome email received
- [ ] All emails display correctly on mobile
- [ ] All emails display correctly on desktop
- [ ] Links in emails work correctly
- [ ] Images load (if any)
- [ ] Emails not in spam folder

---

## Cost Estimates

### Resend Pricing

| Tier | Emails/Month | Cost |
|------|-------------|------|
| Free | 3,000 | $0 |
| Pro | 50,000 | $20 |
| Business | 100,000 | $80 |

**Apinlero Estimate**:
- 50 customers × 5 emails/month = 250 emails
- **Recommendation**: Free tier is sufficient for MVP

### n8n Pricing (Optional)

| Tier | Executions/Month | Cost |
|------|-----------------|------|
| Starter | 2,500 | Free |
| Pro | 10,000 | $20 |
| Scale | 50,000 | $50 |

---

## API Reference

### Email Service Functions

All functions are in [`project/src/lib/email.ts`](project/src/lib/email.ts):

#### `sendOrderConfirmationEmail(data)`

Sends order confirmation to customer.

```typescript
await sendOrderConfirmationEmail({
  customerEmail: 'customer@example.com',
  customerName: 'John Doe',
  orderId: 'order-123',
  orderNumber: 'ORD001',
  items: [
    { name: 'Product A', quantity: 2, price: 10.50 }
  ],
  total: 21.00,
  deliveryAddress: '123 Main St',
  estimatedDelivery: 'Tomorrow'
});
```

#### `sendOrderStatusUpdateEmail(email, name, orderNumber, status, message)`

Sends status update to customer.

```typescript
await sendOrderStatusUpdateEmail(
  'customer@example.com',
  'John Doe',
  'ORD001',
  'Delivered',
  'Your order has been delivered!'
);
```

#### `sendLowStockAlertEmail(data)`

Sends low stock alert to business owner.

```typescript
await sendLowStockAlertEmail({
  businessEmail: 'owner@business.com',
  businessName: 'My Business',
  productName: 'Product A',
  currentStock: 3,
  threshold: 5,
  productId: 'product-123'
});
```

#### `sendDailySummaryEmail(data)`

Sends daily business summary.

```typescript
await sendDailySummaryEmail({
  businessEmail: 'owner@business.com',
  businessName: 'My Business',
  date: '2026-01-28',
  totalOrders: 15,
  totalRevenue: 450.75,
  lowStockProducts: [{ name: 'Product A', stock: 3 }],
  topProducts: [{ name: 'Product B', quantity: 25 }]
});
```

#### `sendWelcomeEmail(data)`

Sends welcome email to new customer.

```typescript
await sendWelcomeEmail({
  customerEmail: 'customer@example.com',
  customerName: 'John Doe',
  businessName: 'My Business',
  storeUrl: 'https://store.example.com',
  whatsappNumber: '+1234567890'
});
```

#### Utility Functions

```typescript
// Check if email service is configured
isEmailConfigured(): boolean

// Test email configuration
testEmailConfiguration(testEmail: string): Promise<EmailResponse>
```

---

## File Structure

```
project/
├── src/
│   ├── lib/
│   │   ├── email.ts          # Direct email service (Resend)
│   │   └── n8n.ts            # n8n webhook integration (fallback)
│   ├── pages/
│   │   ├── EmailSettings.tsx # Email testing and configuration UI
│   │   └── SignupForm.tsx    # Welcome email integration
│   └── components/
│       ├── OrdersTable.tsx   # Order emails integration
│       └── InventoryManager.tsx # Stock alert emails
├── n8n-workflows/
│   ├── 01-order-confirmation.json
│   ├── 02-order-status-update.json
│   ├── 03-new-order-alert.json
│   ├── 04-low-stock-alert.json
│   ├── 05-daily-summary.json
│   ├── 06-manual-triggers.json
│   └── 07-welcome-email.json
└── .env.example             # Environment variable template
```

---

## Best Practices

### 1. Always Test Before Sending to Customers

Use the Email Settings page to test all email types before going live.

### 2. Use Personalization

Include customer names and business names to make emails feel personal.

### 3. Keep Subject Lines Clear

Good: "Order Confirmation - #ORD001"
Bad: "Your order"

### 4. Include Unsubscribe Options (Future)

For marketing emails, add unsubscribe links to comply with regulations.

### 5. Monitor Email Deliverability

Check Resend dashboard for:
- Delivery rates
- Bounce rates
- Spam reports

### 6. Use Transactional vs Marketing Designations

- Order confirmations: Transactional
- Welcome emails: Transactional
- Promotional offers: Marketing (requires unsubscribe)

---

## Support

### Resend Support
- Documentation: [resend.com/docs](https://resend.com/docs)
- Email: support@resend.com

### n8n Support
- Documentation: [docs.n8n.io](https://docs.n8n.io)
- Community: [community.n8n.io](https://community.n8n.io)

### Apinlero Issues
- GitHub: [github.com/olawale190/Apinlero-MVP/issues](https://github.com/olawale190/Apinlero-MVP/issues)

---

## Changelog

### 2026-01-28 - Email System Complete ✅

**Added**:
- Direct Resend API integration
- All 5 email types implemented
- Email Settings testing page
- Comprehensive documentation
- Environment variable updates

**Features**:
- ✅ Order confirmation emails
- ✅ Order status update emails
- ✅ Low stock alert emails
- ✅ Daily summary report emails
- ✅ Welcome emails
- ✅ Automatic fallback to n8n
- ✅ Email testing interface
- ✅ Responsive email templates

---

*Last Updated: January 28, 2026*
