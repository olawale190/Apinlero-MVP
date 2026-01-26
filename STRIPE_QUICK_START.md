# Stripe Quick Start - TL;DR

## Who Does What?

### 👨‍💻 You (Developer/Apinlero)
**Build the payment infrastructure:**
1. Add Stripe credentials columns to database
2. Create "Connect Stripe" page in dashboard
3. Update payment flow to use per-business keys
4. Set up webhook handling

### 🏪 Isha's Treat (Business Partner)
**Set up their payment account:**
1. Create Stripe account at stripe.com
2. Complete business verification
3. Get API keys from Stripe Dashboard
4. Enter keys in Apinlero dashboard

## Architecture: Per-Business Stripe Accounts ✅

```
Customer Orders → Business's Stripe → Business Gets Money
                                        ↓
                  Business Pays £250/month → Apinlero Subscription
```

**NOT marketplace model** - Each business owns their payment account.

## Why This Approach?

✅ Business keeps 100% of order revenue
✅ Simpler compliance (no payment aggregation)
✅ Apinlero earns from subscriptions, not transaction fees
✅ Businesses can use existing Stripe accounts
✅ Less regulatory burden on platform

## Quick Implementation Checklist

### Developer Tasks
- [ ] Add Stripe columns to `businesses` table
- [ ] Create Stripe settings page UI
- [ ] Update `src/lib/stripe.ts` to support per-business keys
- [ ] Modify payment intent creation to use business keys
- [ ] Set up webhook routing per business
- [ ] Test with Isha's test keys
- [ ] Deploy and verify

### Isha's Treat Tasks
- [ ] Sign up at [stripe.com](https://stripe.com)
- [ ] Add business details (UK address, bank account)
- [ ] Verify identity (if required)
- [ ] Get test mode API keys
- [ ] Provide keys to developer
- [ ] Test checkout with test card (4242 4242 4242 4242)
- [ ] Switch to live keys when ready

## Test Card for Testing
```
Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
ZIP: 12345
```

## Timeline
- **Week 1:** Isha creates Stripe account
- **Week 2:** Developer builds integration
- **Week 3:** Testing
- **Week 4:** Go live

## More Details
See [STRIPE_SETUP_GUIDE.md](STRIPE_SETUP_GUIDE.md) for complete documentation.
