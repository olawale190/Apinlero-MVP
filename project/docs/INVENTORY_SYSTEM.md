# Inventory Management System

**Deployed:** February 4, 2026
**URL:** https://app.apinlero.com

## Components

### 1. InventoryManager.tsx
- Product grid with stock levels and images
- Barcode/QR scanner
- Add/Edit/Delete products
- Image upload with compression
- Bulk pricing tiers
- Low stock and expiry alerts

### 2. PurchaseOrders.tsx
- Critical/warning stock detection
- 4 default suppliers
- Order status: draft → ordered → received
- Export to WhatsApp/Email

### 3. SalesInventoryAnalytics.tsx
- Period selector: Daily/Weekly/Monthly/Yearly
- Metric cards with trends
- Charts: Line, Bar, Pie

## Dashboard Tabs
- inventory, purchase, analytics

## Dependencies
- recharts v3.7.0
