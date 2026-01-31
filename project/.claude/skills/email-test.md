# Email Test - Multi-Tenant Email Testing

Test the multi-tenant email system with Reply-To support.

## Usage

```bash
/email-test
```

## What This Does

1. **Checks Email Configuration**
   - Verifies VITE_RESEND_API_KEY is set
   - Confirms FROM_EMAIL and BUSINESS_EMAIL are configured

2. **Sends Test Emails**
   - Order confirmation with multi-tenant branding
   - Tests Reply-To functionality
   - Verifies business name appears in From field

3. **Displays Results**
   - Shows message ID if successful
   - Logs any errors
   - Confirms Reply-To header is set

## Example Output

```
✅ Email Configuration Check
━━━━━━━━━━━━━━━━━━━━━━━━━━
VITE_RESEND_API_KEY: ✅ Set
VITE_FROM_EMAIL: noreply@apinlero.com
VITE_BUSINESS_EMAIL: info@apinlero.com

📧 Sending Test Email...
━━━━━━━━━━━━━━━━━━━━━━━━━━
From: "Isha's Treat" <noreply@apinlero.com>
Reply-To: info@ishastreat.com

✅ Email sent successfully!
Message ID: abc123xyz

Check your inbox and try replying!
```

## Multi-Tenant Features Tested

- ✅ Business name in From field
- ✅ Reply-To header set to business email
- ✅ Customer replies go to business (not Apinlero)
- ✅ Professional email templates
- ✅ Mobile-responsive design

## Files Modified

- `project/src/lib/email.ts` - Multi-tenant email service
- `project/.env.local` - Email configuration

## Related Commands

- Visit http://localhost:5174/email-settings for UI testing
- `/deploy-vercel` to deploy with email config
- `/env-sync` to sync email vars to production
