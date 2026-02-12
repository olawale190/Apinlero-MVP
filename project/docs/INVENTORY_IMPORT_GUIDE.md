# Inventory Bulk Import Guide

## Quick Start

1. **Download the template**: Go to Inventory tab → Click **Import** (orange button) → Download Template
2. **Fill in your products**: Open the CSV in Excel/Google Sheets and add your products
3. **Upload and import**: Click Import → Upload your filled CSV → Review → Import

---

## CSV Template Format

Download the template from: `/templates/inventory_template.csv`

### Required Columns

| Column | Description | Example |
|--------|-------------|---------|
| **Product Name** | Name of the product (required) | Tilda Basmati Rice 5kg |
| **Price (GBP)** | Price in pounds (required) | 12.99 |

### Optional Columns

| Column | Description | Example |
|--------|-------------|---------|
| Category | Product category | Grains, Oils, Fish, Spices |
| Unit | Unit of measurement | each, kg, pack, box, bag, bottle |
| Stock Quantity | Initial stock count | 50 |
| Barcode | Product barcode | 5011157100012 |
| Expiry Date | Expiry date (YYYY-MM-DD) | 2026-12-31 |
| Batch Number | Batch/lot number | BATCH001 |
| Description | Product description | Premium basmati rice |

---

## Valid Categories

- Grains
- Oils
- Produce
- Fish
- Meat
- Spices
- Canned
- Drinks
- Flour
- Seeds
- Seafood
- Seasonings
- Snacks
- Dairy
- Frozen
- General (default)

---

## Valid Units

- each (default)
- kg
- pack
- box
- case
- bag
- bottle
- tin
- litre
- gram

---

## Example CSV Content

```csv
Product Name,Price (GBP),Category,Unit,Stock Quantity,Barcode,Expiry Date,Batch Number,Description
Tilda Basmati Rice 5kg,12.99,Grains,bag,50,5011157100012,2026-12-31,BATCH001,Premium basmati rice
Palm Oil 1L,6.50,Oils,bottle,30,5012345678901,2026-06-15,PO2026A,Red palm oil
Egusi Seeds 500g,8.99,Seeds,pack,25,,2026-09-30,,Ground melon seeds
Stockfish (Medium),15.00,Fish,each,20,,,SF001,Norwegian stockfish
Plantain (Ripe),1.50,Produce,each,100,,,,Fresh ripe plantain
```

---

## Tips for Isha's Treat

### Filling the Template

1. **Open in Excel or Google Sheets** - easier to edit than plain CSV
2. **Keep the header row exactly as-is** - the system uses these to identify columns
3. **Use consistent categories** - helps with filtering and reporting
4. **Add stock quantities** - so you can track inventory immediately
5. **Include expiry dates** - the system will alert you when products expire soon

### Common Categories for Your Products

| Category | Products |
|----------|----------|
| Grains | Rice, beans, lentils, couscous |
| Oils | Palm oil, groundnut oil, coconut oil |
| Fish | Stockfish, dried fish, crayfish |
| Spices | Suya spice, curry, pepper |
| Flour | Pounded yam, semolina, garri |
| Produce | Plantain, yam, cassava |
| Seasonings | Maggi cubes, seasoning |
| Canned | Tomato paste, sardines |

### Date Format

Use **YYYY-MM-DD** format for expiry dates:
- Correct: `2026-12-31`
- Also works: `31/12/2026`
- Incorrect: `December 31, 2026`

---

## Troubleshooting

### "Invalid product" errors

- Check that Product Name has at least 2 characters
- Check that Price is a positive number
- Remove any special characters from the name

### Products not showing after import

- Click the Refresh button (circular arrow) in the Inventory tab
- Check if there's a search filter active - clear the search box

### CSV not uploading

- Make sure the file is saved as .csv (not .xlsx)
- Check file size is under 10MB
- Try re-saving from Excel as "CSV UTF-8"

---

## After Import

Once imported, you can:
- **Edit any product** - Click the pencil icon
- **Add images** - Edit product → Upload image
- **Set bulk pricing** - Click the tag icon
- **Generate QR codes** - Click the QR icon
- **Adjust stock levels** - Use +/- buttons

---

## Need Help?

Contact support@apinlero.com for assistance with bulk imports.
