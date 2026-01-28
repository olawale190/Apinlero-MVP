# Deploy test-stripe-connection Edge Function

## Quick Deploy Steps

Follow these steps to deploy the `test-stripe-connection` Edge Function to Supabase:

### 1. Open Supabase Dashboard

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Select your **Apinlero** project
3. Navigate to **Edge Functions** in the left sidebar

### 2. Create New Edge Function

1. Click **"New Edge Function"** or **"Create a new function"** button
2. Function name: `test-stripe-connection`
3. Click **"Create function"**

### 3. Paste the Code

Copy the entire code below and paste it into the editor:

```typescript
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestRequest {
  publishableKey: string;
  secretKey: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { publishableKey, secretKey }: TestRequest = await req.json();

    // Validate keys are provided
    if (!publishableKey || !secretKey) {
      return new Response(JSON.stringify({ success: false, error: 'Missing API keys' }), { status: 400, headers: corsHeaders });
    }

    // Validate key formats
    if (!publishableKey.startsWith('pk_')) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid publishable key format. Must start with pk_test_ or pk_live_' }), { status: 400, headers: corsHeaders });
    }

    if (!secretKey.startsWith('sk_')) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid secret key format. Must start with sk_test_ or sk_live_' }), { status: 400, headers: corsHeaders });
    }

    // Check if keys match (both test or both live)
    const pubIsTest = publishableKey.includes('_test_');
    const secIsTest = secretKey.includes('_test_');

    if (pubIsTest !== secIsTest) {
      return new Response(JSON.stringify({ success: false, error: 'Keys mismatch: One is test mode and one is live mode. Both must match.' }), { status: 400, headers: corsHeaders });
    }

    // Initialize Stripe with the secret key
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Test the connection by retrieving account information
    const account = await stripe.account.retrieve();

    // Return success with account details
    return new Response(JSON.stringify({
      success: true,
      accountId: account.id,
      accountName: account.business_profile?.name || account.email || 'Unknown',
      country: account.country,
      currency: account.default_currency,
      testMode: pubIsTest,
      message: 'Stripe connection successful!',
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid API keys. Please check your Stripe dashboard.' }), { status: 401, headers: corsHeaders });
    }

    if (error instanceof Stripe.errors.StripeError) {
      return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: corsHeaders });
  }
});
```

### 4. Deploy the Function

1. Click **"Deploy"** or **"Save & Deploy"** button
2. Wait for deployment to complete (usually 10-30 seconds)
3. You should see a success message with the function URL

### 5. Verify Deployment

1. Check that the function appears in your Edge Functions list
2. Status should show as **"Deployed"** or **"Active"**
3. Note the function URL (should be like: `https://[project-ref].supabase.co/functions/v1/test-stripe-connection`)

## Testing the Function

Once deployed, you can test it:

### Via StripeSettings UI
1. Navigate to the Stripe Settings page
2. Enter your Stripe test keys
3. Click **"Test Connection"**
4. You should see a success message with your account details

### Via curl (Terminal)

```bash
curl -X POST 'https://[your-project-ref].supabase.co/functions/v1/test-stripe-connection' \
  -H 'Authorization: Bearer [your-anon-key]' \
  -H 'Content-Type: application/json' \
  -d '{
    "publishableKey": "pk_test_...",
    "secretKey": "sk_test_..."
  }'
```

## Expected Response

### Success Response
```json
{
  "success": true,
  "accountId": "acct_123456789",
  "accountName": "Your Business Name",
  "country": "GB",
  "currency": "gbp",
  "testMode": true,
  "message": "Stripe connection successful!"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Invalid API keys. Please check your Stripe dashboard."
}
```

## Troubleshooting

### Function Won't Deploy
- Check that the code is copied completely without any missing characters
- Verify no syntax errors (red underlines in editor)
- Try refreshing the browser and deploying again

### Connection Test Fails
- Verify you're using **test keys** from Stripe (pk_test_... and sk_test_...)
- Ensure both keys are from the **same Stripe account**
- Check that keys are not revoked in Stripe Dashboard

### CORS Errors in Browser
- The function already includes CORS headers
- If you still see CORS errors, check browser console for the exact error
- Verify the function URL is correct in your frontend code

## Next Steps

After deploying this function:

1. ✅ Both Edge Functions are now deployed:
   - `create-payment-intent` (already deployed)
   - `test-stripe-connection` (just deployed)

2. 📝 Continue with remaining setup:
   - Add Stripe Settings to app navigation
   - Test the full integration end-to-end
   - Implement encryption for secret keys

## Related Files

- Edge Function code: `project/supabase/functions/test-stripe-connection/index.ts`
- UI component: `project/src/pages/StripeSettings.tsx`
- Stripe library: `project/src/lib/stripe.ts`
- Complete guide: `STRIPE_INTEGRATION_COMPLETE.md`

---

**Important:** This is a NEW function - don't replace or modify the existing `create-payment-intent` function. Both functions need to exist side-by-side.
