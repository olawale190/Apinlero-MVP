# Apinlero - Web Ordering Flow Testing Checklist

Use this checklist to verify the complete ordering flow works end-to-end.

---

## Pre-Test Setup

- [ ] Ensure you have access to the storefront: https://apinlero.vercel.app/store/ishas-treat
- [ ] Ensure you have dashboard access: https://apinlero.vercel.app/login
- [ ] Have a test phone number ready for order
- [ ] Have a test email address ready

---

## Test 1: Cart Persistence

**Objective:** Verify cart items survive page refresh

1. [ ] Go to storefront
2. [ ] Add 2-3 products to cart
3. [ ] Verify cart count shows in header
4. [ ] **Refresh the page** (Cmd+R / Ctrl+R)
5. [ ] Verify cart items are still there
6. [ ] Open cart drawer - verify items and quantities are correct

**Expected:** Cart contents persist after refresh

---

## Test 2: Stock Display

**Objective:** Verify stock status shows correctly

1. [ ] View products on storefront
2. [ ] Look for products with "In Stock" badge (green)
3. [ ] Look for products with "Low Stock" badge (amber)
4. [ ] If any product has 0 stock, verify:
   - Shows "Out of Stock" badge (red)
   - "Add to Cart" is disabled/replaced with "Out of Stock" message

**Expected:** Stock badges display correctly based on inventory levels

---

## Test 3: Search & Filter

**Objective:** Verify product search and category filter work

1. [ ] Type a product name in search box
2. [ ] Verify matching products appear
3. [ ] Clear search
4. [ ] Click different category filters
5. [ ] Verify products filter by category
6. [ ] Click "All" to show all products

**Expected:** Search and filters work correctly

---

## Test 4: Checkout - Delivery Order

**Objective:** Complete an order with delivery

1. [ ] Add products to cart
2. [ ] Click cart icon to open drawer
3. [ ] Click "Checkout"
4. [ ] Fill in contact information:
   - Name: Test Customer
   - Phone: 07700900123
   - Email: test@example.com
5. [ ] Select "Delivery" method
6. [ ] Fill in address and postcode
7. [ ] Select payment method (Bank Transfer for testing)
8. [ ] Click "Place Order"
9. [ ] Verify confirmation page shows

**Expected:** Order completes successfully

---

## Test 5: Checkout - Collection Order

**Objective:** Complete an order with collection

1. [ ] Add products to cart
2. [ ] Go to Checkout
3. [ ] Fill in contact information
4. [ ] Select "Collection" method
5. [ ] Verify delivery address fields are hidden
6. [ ] Verify delivery fee shows £0.00
7. [ ] Complete order

**Expected:** Collection order completes without requiring address

---

## Test 6: Order Appears in Dashboard

**Objective:** Verify orders show in admin dashboard

1. [ ] After placing a test order, log into dashboard
2. [ ] Check "Overview" tab
3. [ ] Verify "Pending Orders" count increased
4. [ ] Find your test order in the orders table
5. [ ] Verify order details are correct:
   - Customer name
   - Phone number
   - Items and quantities
   - Total amount
   - Status: Pending

**Expected:** Order visible in dashboard with correct details

---

## Test 7: Update Order Status

**Objective:** Verify order status can be updated

1. [ ] Find the test order in dashboard
2. [ ] Click the status dropdown
3. [ ] Change status from "Pending" to "Confirmed"
4. [ ] Verify status updates immediately
5. [ ] Change status to "Delivered"
6. [ ] Verify status updates

**Expected:** Status changes save correctly

---

## Test 8: Notifications (if configured)

**Objective:** Verify email and WhatsApp notifications send

**Prerequisites:**
- RESEND_API_KEY environment variable set
- TWILIO credentials set

1. [ ] Place a new order with valid email and phone
2. [ ] Check email inbox for order confirmation
3. [ ] Check WhatsApp for order confirmation message

**Expected:** Both email and WhatsApp notifications received

*Note: If env vars not configured, notifications will silently fail - this is expected*

---

## Test 9: Mobile Responsiveness

**Objective:** Verify storefront works on mobile

1. [ ] Open storefront on mobile device (or use browser dev tools)
2. [ ] Verify products display in 2-column grid
3. [ ] Add product to cart
4. [ ] Complete checkout flow
5. [ ] Verify all forms are usable on mobile

**Expected:** Full functionality on mobile devices

---

## Test 10: Dashboard Mobile

**Objective:** Verify dashboard works on mobile

1. [ ] Open dashboard on mobile device
2. [ ] Navigate between tabs
3. [ ] View orders
4. [ ] Update an order status

**Expected:** Dashboard usable on mobile (may be optimized for tablet+)

---

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| Cart Persistence | | |
| Stock Display | | |
| Search & Filter | | |
| Checkout - Delivery | | |
| Checkout - Collection | | |
| Order in Dashboard | | |
| Update Order Status | | |
| Notifications | | |
| Mobile Storefront | | |
| Mobile Dashboard | | |

---

## Issues Found

*Document any bugs or issues discovered during testing:*

1.
2.
3.

---

## Sign-off

Tested by: _________________
Date: _________________
Version: _________________
