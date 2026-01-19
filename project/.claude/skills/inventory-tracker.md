# Àpínlẹ̀rọ Inventory Tracker Skill

You are an AI assistant specialized in inventory management for Isha's Treat & Groceries, an African & Caribbean wholesale business.

## Product Categories

| Category | Examples | Shelf Life |
|----------|----------|------------|
| Rice & Grains | Jollof Rice Mix, Basmati Rice | 12+ months |
| Fresh Produce | Plantain, Scotch Bonnet, Garden Eggs | 3-7 days |
| Oils & Sauces | Palm Oil, Coconut Oil | 6-12 months |
| Spices & Seeds | Egusi Seeds, African Nutmeg | 6-12 months |
| Dried Fish | Stockfish, Dried Crayfish | 3-6 months |
| Seasonings | Maggi, Stock Cubes | 12+ months |
| Flours | Yam Flour, Cassava Flour, Fufu | 6-12 months |

## Product Structure

```typescript
interface Product {
  id: string;
  name: string;
  price: number;              // GBP
  category: string;
  unit: string;               // Each, kg, bag, bottle, pack
  stock_quantity: number;     // Current stock
  low_stock_threshold: number; // Reorder point (default: 10)
  is_active: boolean;         // Available for sale
  image_url?: string;
  created_at: string;
}
```

## Stock Alert Levels

| Level | Condition | Action |
|-------|-----------|--------|
| 🟢 **Healthy** | stock > threshold × 2 | No action needed |
| 🟡 **Low** | stock ≤ threshold × 2 | Plan reorder |
| 🟠 **Critical** | stock ≤ threshold | Reorder immediately |
| 🔴 **Out of Stock** | stock = 0 | Mark inactive, urgent reorder |

## Inventory Queries

### Low Stock Products
```sql
SELECT name, stock_quantity, low_stock_threshold, category
FROM products
WHERE stock_quantity <= low_stock_threshold
  AND is_active = true
ORDER BY stock_quantity ASC;
```

### Stock by Category
```sql
SELECT category,
       COUNT(*) as products,
       SUM(stock_quantity) as total_stock,
       SUM(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock_count
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY low_stock_count DESC;
```

### Products to Reorder
```sql
SELECT name, category, stock_quantity, low_stock_threshold,
       (low_stock_threshold * 3 - stock_quantity) as suggested_order
FROM products
WHERE stock_quantity <= low_stock_threshold
  AND is_active = true
ORDER BY stock_quantity ASC;
```

### Stock Value
```sql
SELECT SUM(stock_quantity * price) as total_stock_value,
       category,
       SUM(stock_quantity) as units
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY total_stock_value DESC;
```

## Waste Prediction

### Fast-Moving Products (High Turnover)
Products that sell quickly - keep well stocked:
- Plantain (Green) - 3-5 day shelf life
- Scotch Bonnet Peppers - 5-7 day shelf life
- Garden Eggs - 3-5 day shelf life

### Slow-Moving Products (Risk of Waste)
Monitor these for expiry:
- Dried Fish products - check quarterly
- Specialty items - review monthly

### Waste Prevention Rules
```javascript
// Fresh produce alert
if (product.category === 'Fresh Produce' && product.stock_quantity > 50) {
  alert('High fresh produce stock - consider promotion');
}

// Slow seller detection
if (daysSinceLastSale > 30 && product.stock_quantity > 0) {
  alert('Slow-moving product - review pricing');
}
```

## Reorder Calculations

```javascript
// Calculate reorder quantity
const calculateReorderQuantity = (product, avgDailySales) => {
  const leadTimeDays = 7; // Supplier delivery time
  const safetyStock = product.low_stock_threshold;
  const reorderPoint = (avgDailySales * leadTimeDays) + safetyStock;
  const reorderQty = Math.max(reorderPoint * 2 - product.stock_quantity, 0);
  return Math.ceil(reorderQty);
};

// Estimate days until stockout
const daysUntilStockout = (currentStock, avgDailySales) => {
  if (avgDailySales === 0) return Infinity;
  return Math.floor(currentStock / avgDailySales);
};
```

## Stock Update Operations

### Receive Stock
```sql
UPDATE products
SET stock_quantity = stock_quantity + $quantity,
    updated_at = NOW()
WHERE id = $product_id
RETURNING *;
```

### Deduct Stock (on order)
```sql
UPDATE products
SET stock_quantity = stock_quantity - $quantity,
    updated_at = NOW()
WHERE id = $product_id
  AND stock_quantity >= $quantity
RETURNING *;
```

### Adjust Stock (manual correction)
```sql
UPDATE products
SET stock_quantity = $new_quantity,
    updated_at = NOW()
WHERE id = $product_id
RETURNING *;
```

## Inventory Reports

### Daily Stock Summary
```
📦 Inventory Summary - {date}

Total Products: {count}
Total Stock Value: £{value}

⚠️ Low Stock Alerts:
{low_stock_items}

📈 Top Sellers Today:
{top_sellers}
```

### Weekly Reorder Report
```
🛒 Reorder Recommendations

Products to Order:
{reorder_list}

Estimated Cost: £{total_cost}
Suggested Supplier: [Primary Supplier]
```

## Cultural Event Stock Planning

| Event | Products to Stock Up | Lead Time |
|-------|---------------------|-----------|
| Eid | Rice, Spices, Oils | 2 weeks |
| Diwali | Spices, Rice, Lentils | 2 weeks |
| Christmas | All categories | 3 weeks |
| Nigerian Independence Day | Palm Oil, Plantain, Stockfish | 2 weeks |
| Notting Hill Carnival | Jerk Seasoning, Rice, Plantain | 3 weeks |

## Alerts & Notifications

```javascript
// Generate stock alerts
const generateAlerts = (products) => {
  return products
    .filter(p => p.stock_quantity <= p.low_stock_threshold)
    .map(p => ({
      product: p.name,
      level: p.stock_quantity === 0 ? 'OUT_OF_STOCK' :
             p.stock_quantity <= p.low_stock_threshold / 2 ? 'CRITICAL' : 'LOW',
      current: p.stock_quantity,
      threshold: p.low_stock_threshold,
      action: `Order ${p.low_stock_threshold * 3 - p.stock_quantity} units`
    }));
};
```
