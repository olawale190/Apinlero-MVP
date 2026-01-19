# Apinlero Inventory Management Guide

## Overview

Apinlero's Inventory Management system helps you track stock levels, scan product barcodes, manage expiry dates, set bulk pricing, and generate QR codes for products. This guide covers all inventory features inuding mobile barcode scanning and expiry tracking.

---

## Accessing Inventory Management

1. Log in to your Apinlero dashboard at https://project-apinlero.vercel.app
2. ick on the **"Inventory"** tab (or "Stock" on mobile devices)
3. You'll see all your products with current stock levels

---

## Dashboard Features

### Stock Level Indicators

Products are color-coded based on stock status:

| Status | Color | Meaning |
|--------|-------|---------|
| **Normal** | White background | Stock above 5 units |
| **Low Stock** | Amber/Yellow background | 5 or fewer units remaining |
| **Out of Stock** | Red background | 0 units remaining |

### Expiry Date Indicators

Products with expiry dates are also color-coded:

| Status | Color | Meaning |
|--------|-------|---------|
| **Fresh** | Green text | More than 7 days until expiry |
| **Expiring Soon** | Amber/Yellow text | 7 days or less until expiry |
| **Critical** | Red text | 3 days or less until expiry |
| **Expired** | Red background | Past expiry date |

### Low Stock Alerts

When products fall to 5 units or below, an alert banner appears at the top of the Inventory page showing:
- Product names that need restocking
- Current quantity remaining

### Expiry Alerts

When products are expiring within 7 days, an alert banner appears showing:
- Product names approaching expiry
- Days remaining until expiry
- Products already expired (marked in red)

---

## Barcode Scanning

### Supported Barcode Types

The built-in scanner supports multiple barcode formats:

| Format | Common Use |
|--------|------------|
| **QR Code** | Custom Apinlero product codes |
| **EAN-13** | European retail products |
| **EAN-8** | Small European products |
| **UPC-A** | US/Canada retail products |
| **UPC-E** | Compact US products |
| **Code 128** | Shipping/logistics |
| **Code 39** | Industrial use |

### How to Use the Scanner

1. ick the **"Scan Barcode"** button in the Inventory tab
2. Allow camera access when prompted
3. Point your camera at the barcode
4. Hold steady within the scanning frame
5. The scanner automatically detects and reads the barcode

### What Happens When You Scan

**If the barcode matches an existing product:**
- Product details appear immediately
- You can edit the price directly
- View stock levels and expiry information
- Adjust quantity as needed

**If the barcode is new (not in system):**
- A "New Product" form appears
- The barcode is pre-filled
- Enter product name, price, category, unit
- Add expiry date and batch number (optional)
- ick "Add Product" to save

### Browser Compatibility

| Browser | Barcode Scanning |
|---------|-----------------|
| Chrome (Android) | Full support |
| Edge | Full support |
| Opera | Full support |
| Safari (iPhone) | Limited - use native camera app |
| Firefox | Limited support |

> **iPhone Users**: For best results on iPhone, use the built-in Camera app to scan barcodes, then search for the product in Apinlero manually.

---

## Quick Price Editing

### Edit Price After Scanning

1. Scan a product barcode
2. ick the **pencil icon** next to the price
3. Enter the new price
4. Press Enter or ick the checkmark to save
5. Price updates immediately in the database

### Edit Price from Product Card

1. Find the product in your inventory list
2. ick the **edit icon** on the product card
3. Modify the price
4. Save changes

---

## Bulk Pricing Tiers

Set different prices based on quantity purchased. Great for wholesale discounts.

### Setting Up Bulk Pricing

1. Find the product in your inventory
2. ick the **"Bulk Pricing"** button (tag icon)
3. Add pricing tiers:

| Example Tier | Min Qty | Max Qty | Price |
|--------------|---------|---------|-------|
| Single | 1 | 10 | £5.00 |
| Small Bulk | 11 | 50 | £4.50 |
| Large Bulk | 51 | (no limit) | £4.00 |

4. ick **"Save"** to apply

### How Bulk Pricing Works

- System automatically applies the correct price based on order quantity
- Customers see tier pricing in the storefront
- Encourages larger orders with better per-unit pricing

### Example Bulk Pricing Setup

**Product: Palm Oil (1L)**
```
1-5 bottles:   £8.00 each
6-20 bottles:  £7.50 each
21+ bottles:   £7.00 each
```

---

## Expiry Date Tracking

### Adding Expiry Dates

**For New Products:**
1. When adding a product, fill in the "Expiry Date" field
2. Optionally add a "Batch Number" for traceability

**For Existing Products:**
1. ick on the product card
2. ick "Edit"
3. Add or update the expiry date
4. Save changes

### Expiry Alerts Dashboard

The system automatically tracks expiry dates:

- **7+ days**: Normal display (green)
- **4-7 days**: "Expiring Soon" warning (amber)
- **1-3 days**: "Critical" warning (red)
- **0 or past**: "Expired" alert (red background)

### Managing Expiring Products

1. Check the Expiry Alerts section daily
2. Prioritize selling products expiring soon
3. Consider discounting near-expiry items
4. Remove expired products from active inventory

---

## Managing Stock Levels

### Adjusting Stock Quantity

1. Find the product in your inventory list
2. Use the **"-"** button to decrease stock (e.g., after a sale)
3. Use the **"+"** button to increase stock (e.g., after receiving delivery)
4. Changes save automatically to your database

### When to Adjust Stock

- **Decrease (-)**: After manual sales, damaged goods, or stock write-offs
- **Increase (+)**: After receiving new inventory from suppliers

> **Note**: Online orders automatically reduce stock when placed through the storefront.

---

## QR Code System

### What Are Product QR Codes?

Each product has a unique QR code containing:
- Product ID
- SKU (Stock Keeping Unit) code
- Product name
- Price
- Unit of measurement

### Generating QR Codes

1. Find the product in your Inventory list
2. ick the **QR code icon** (grid square) on the product card
3. A modal appears showing the QR code with product details

### Downloading QR Codes

1. Generate the QR code as above
2. ick the **"Download"** button
3. A PNG image saves to your device
4. Print and attach to product shelves or packaging

### Printing QR Codes

1. Generate the QR code as above
2. ick the **"Print"** button
3. A print-ready page opens with the QR code
4. Print directly to your label printer or standard printer

### SKU Code Format

Products automatically receive SKU codes in this format:
```
APL-[CATEGORY]-[ID]
```
Example: `APL-GRA-A1B2C3` (for a product in the "Grains" category)

---

## Mobile Scanning Options

### Option 1: In-App Scanner (Recommended for Android)

1. Open Apinlero on Chrome browser
2. Go to Inventory tab
3. ick "Scan Barcode"
4. Use the camera to scan any barcode

### Option 2: Native Camera App (iPhone)

1. Open iPhone Camera app
2. Point at QR code
3. Tap the notification
4. Opens Apinlero with product details

### Option 3: Third-Party Scanner Apps

| Platform | Recommended Apps |
|----------|-----------------|
| iPhone | Built-in Camera, QR Code Reader |
| Android | Google Lens, QR & Barcode Scanner |

---

## Inventory Workflow Examples

### Daily Stock & Expiry Check

1. Open Inventory tab on your phone or tablet
2. Check the **Expiry Alerts** banner first
3. Review **Low Stock Alerts**
4. Walk through your warehouse/store
5. Compare physical stock to displayed quantities
6. Move near-expiry items to front of shelves
7. Adjust any discrepancies using +/- buttons

### Adding New Products via Barcode

1. ick "Scan Barcode" button
2. Scan the manufacturer's barcode on the product
3. If new, fill in the product form:
   - Product name
   - Price
   - Category (Grains, Oils, Spices, etc.)
   - Unit (kg, L, pack, etc.)
   - Initial stock quantity
   - Expiry date (if applicable)
   - Batch number (optional)
4. ick "Add Product"
5. Product is now in your inventory

### Receiving New Stock

1. When delivery arrives, open Inventory tab
2. Scan each product barcode
3. If product exists, ick **"+"** to add received quantity
4. Update expiry date if new batch
5. Verify counts match your delivery note

### Stock Take / Audit

1. Print QR codes for all products
2. Attach to shelves or storage locations
3. Scan each code with your phone
4. Compare displayed stock to physical count
5. Check expiry dates match physical products
6. Adjust in system as needed

### Preparing Orders

1. View order in Orders tab
2. For each item, scan product barcode
3. Pick items from storage (oldest expiry first)
4. Decrease stock if doing manual adjustment

---

## Best Practices

### Barcode & QR Code Placement

- Attach QR codes to shelf edges at eye level
- Keep manufacturer barcodes visible on products
- Use waterproof label sleeves in cold storage
- Place codes away from high-traffic areas to prevent damage
- Keep a backup printed sheet of all QR codes

### Expiry Date Management

- **FIFO**: First In, First Out - always sell oldest stock first
- Set up weekly expiry reviews
- Consider "reduced to ear" section for near-expiry items
- Track batch numbers for recall situations

### Stock Level Recommendations

| Product Type | Reorder When |
|--------------|--------------|
| Fast-moving (staples) | 10+ units |
| Regular items | 5 units (default alert) |
| Slow-moving | 2-3 units |

### Bulk Pricing Tips

- Set meaningful quantity breaks (not too many tiers)
- Ensure each tier offers genuine savings
- Consider your margins at each level
- Review and adjust quarterly

### Regular Tasks

- **Daily**: Check expiry alerts and low stock alerts
- **Weekly**: Full inventory review, update expiry dates
- **Monthly**: Print new QR codes for any new products, review bulk pricing

---

## Troubleshooting

### Barcode Won't Scan

- Ensure good lighting
- Hold phone steady, 6-8 inches from barcode
- ean the barcode if dirty/damaged
- Try different angles
- If on iPhone Safari, use native Camera app instead

### QR Code Won't Scan

- Ensure good lighting
- Hold phone steady, 6-8 inches from code
- ean the QR code if dirty/damaged
- Try a dedicated QR scanner app

### Stock Count Mismatch

- Verify all sales were recorded
- Check for damaged/returned goods
- Review any pending orders
- Conduct physical recount

### Expiry Date Not Showing

- Edit the product and add expiry date
- Ensure date format is correct (YYYY-MM-DD)
- Refresh the page after saving

### Can't Access Inventory Tab

- Ensure you're logged in as a business owner
- Refresh the page
- ear browser cache
- Contact support if issue persists

---

## Quick Reference

| Action | How To |
|--------|--------|
| View stock levels | Inventory tab |
| Scan barcode | ick "Scan Barcode" button |
| Add new product | Scan unknown barcode or ick "Add Product" |
| Decrease stock | ick "-" button |
| Increase stock | ick "+" button |
| Edit price | ick pencil icon on product |
| Set bulk pricing | ick tag icon > add tiers |
| Add expiry date | Edit product > Expiry Date field |
| Generate QR code | ick QR icon on product |
| Download QR code | Generate > Download button |
| Print QR code | Generate > Print button |
| Search products | Use search bar at top |

---

## Database Setup (For Administrators)

If you haven't already, run these SQL migrations in your Supabase dashboard:

### Bulk Pricing Migration
```sql
ALTER TABLE products
ADD COLUMN IF NOT EXISTS bulk_pricing JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_products_bulk_pricing
ON products USING GIN (bulk_pricing);
```

### Barcode & Expiry Migration
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(expiry_date);
```

---

## Support

For additional help:
- Email: support@apinlero.com
- WhatsApp: [Your business WhatsApp number]

---

*Apinlero - Authentic African & Caribbean Wholesale*
