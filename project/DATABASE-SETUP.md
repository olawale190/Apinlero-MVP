# Database Setup Guide - Apinlero Multi-Tenant Platform

## Overview

This guide will help you set up the complete database schema for Apinlero with multi-tenant support.

## What's Fixed

### Added Missing Tables
- `businesses` - Core multi-tenant table
- `categories` - Product categories (per business)
- `sub_categories` - Product sub-categories (per business)
- `media_files` - File upload tracking
- `whatsapp_configs` - WhatsApp Business API configurations
- `whatsapp_message_logs` - Message tracking
- `whatsapp_analytics_daily` - Daily analytics aggregation

### Updated Existing Tables
- `products` - Added `business_id` and relationships to categories
- `orders` - Added `business_id` and expanded status tracking
- Added comprehensive indexes for performance
- Added triggers for automatic `updated_at` timestamps

## Files

- **[database-schema-multitenant.sql](database-schema-multitenant.sql)** - NEW multi-tenant schema (recommended)
- **[database-schema.sql](database-schema.sql)** - OLD single-tenant schema (deprecated)

## Setup Instructions

### Step 1: Open Supabase Dashboard

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your Apinlero project
4. Navigate to **SQL Editor** (left sidebar)

### Step 2: Run the Schema

1. Click **New Query**
2. Copy the entire contents of [database-schema-multitenant.sql](database-schema-multitenant.sql)
3. Paste into the SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Wait for completion (should take 5-10 seconds)

### Step 3: Create Storage Buckets

The schema requires 3 storage buckets. Create them manually:

1. Go to **Storage** in Supabase Dashboard
2. Create these buckets:

   **Bucket 1: `apinlero-products`**
   - Name: `apinlero-products`
   - Public: ✅ YES (must be public)
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`

   **Bucket 2: `apinlero-media`**
   - Name: `apinlero-media`
   - Public: ❌ NO (private)
   - File size limit: 10MB
   - Allowed MIME types: `image/*, audio/*, video/*`

   **Bucket 3: `apinlero-documents`**
   - Name: `apinlero-documents`
   - Public: ❌ NO (private)
   - File size limit: 10MB
   - Allowed MIME types: `application/pdf, image/*`

### Step 4: Configure Storage Policies

After creating buckets, run these SQL commands:

```sql
-- Allow uploads to apinlero-products (public bucket)
CREATE POLICY "Anyone can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'apinlero-products');

CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'apinlero-products');

-- Allow uploads to apinlero-media (private bucket)
CREATE POLICY "Anyone can upload media files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'apinlero-media');

CREATE POLICY "Anyone can view their media files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'apinlero-media');

-- Allow uploads to apinlero-documents (private bucket)
CREATE POLICY "Anyone can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'apinlero-documents');

CREATE POLICY "Anyone can view their documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'apinlero-documents');
```

### Step 5: Verify Installation

Run this query to verify all tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- businesses
- categories
- media_files
- orders
- products
- sub_categories
- whatsapp_analytics_daily
- whatsapp_configs
- whatsapp_message_logs

### Step 6: Check Sample Data

Verify sample data was inserted:

```sql
-- Check business
SELECT * FROM businesses;

-- Check products
SELECT name, price, category FROM products LIMIT 5;

-- Check orders
SELECT customer_name, total, status FROM orders LIMIT 5;
```

## Multi-Tenant Architecture

### How It Works

Every table (except `businesses`) has a `business_id` foreign key that links data to a specific business.

```
businesses (id)
    ├─> products (business_id)
    ├─> orders (business_id)
    ├─> categories (business_id)
    ├─> media_files (business_id)
    └─> whatsapp_configs (business_id)
```

### Default Business

The schema creates one demo business:
- **ID**: `00000000-0000-0000-0000-000000000001`
- **Name**: "Isha's Treat & Groceries"
- **Email**: info@ishastreat.com

All sample products and orders are linked to this business.

### Adding More Businesses

```sql
INSERT INTO businesses (name, email, phone, subscription_tier) VALUES
  ('Your Business Name', 'contact@yourbusiness.com', '+44 20 1234 5678', 'free');
```

## Security Notes

### Current Setup (Development)

The current RLS policies use `USING (true)` which allows **anyone** to access data. This is for development/testing only.

### For Production

You MUST implement proper authentication:

1. Enable Supabase Auth
2. Update RLS policies to check user ownership:

```sql
-- Example: Only business owners can view their products
CREATE POLICY "Business owners can view products"
  ON products FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_id = auth.uid()
    )
  );
```

## Common Issues

### Issue: "relation does not exist"

**Solution**: You haven't run the schema SQL yet. Go back to Step 2.

### Issue: "bucket not found"

**Solution**: Create the storage buckets manually (Step 3).

### Issue: Upload fails with "permission denied"

**Solution**: Run the storage policy SQL from Step 4.

### Issue: Foreign key constraint violation

**Solution**: Make sure to insert businesses before products/orders.

## Database Diagram

```
┌─────────────┐
│  businesses │◄──────┐
└─────────────┘       │
                      │
      ┌───────────────┼───────────────┬────────────────┐
      │               │               │                │
┌─────▼─────┐   ┌────▼─────┐   ┌────▼────┐   ┌──────▼──────┐
│ products  │   │ orders   │   │categories│   │whatsapp_    │
│           │   │          │   │          │   │configs      │
└───────────┘   └──────────┘   └─────┬────┘   └─────────────┘
                                     │
                              ┌──────▼──────┐
                              │sub_         │
                              │categories   │
                              └─────────────┘
```

## Next Steps

After setting up the database:

1. ✅ Update `.env.local` with your Supabase credentials
2. ✅ Test the application locally
3. ✅ Deploy to Railway/Vercel
4. ⚠️ Implement authentication for production
5. ⚠️ Update RLS policies for security

## Support

If you encounter issues:
- Check the Supabase logs (Dashboard > Logs)
- Verify your `.env.local` has correct credentials
- Ensure all tables and buckets are created
- Check the browser console for errors

---

**Last Updated**: January 28, 2026
**Schema Version**: 1.0.0 (Multi-Tenant)
