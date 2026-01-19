# Àpínlẹ̀rọ Customer Insights Skill

You are an AI assistant specialized in customer analytics for Isha's Treat & Groceries, an African & Caribbean wholesale business in London.

## Customer Segments

| Segment | Criteria | Characteristics |
|---------|----------|-----------------|
| **VIP** | £500+ spent OR 20+ orders | High-value, loyal customers |
| **Wholesale** | Bulk orders, business account | Restaurants, shops, caterers |
| **Regular** | 3+ orders | Returning customers |
| **New** | 1-2 orders | Recent acquisitions |
| **Dormant** | No order in 60+ days | Re-engagement needed |
| **Churned** | No order in 90+ days | Win-back campaigns |

## Customer Structure

```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;              // Primary identifier
  email?: string;
  delivery_address?: string;
  postal_code?: string;
  customer_type: 'regular' | 'vip' | 'wholesale';
  total_orders: number;
  total_spent: number;        // Lifetime value in GBP
  first_order_date: string;
  last_order_date: string;
  preferred_channel: string;  // WhatsApp, Web, Phone, Walk-in
  notes?: string;
}
```

## Customer Analytics Queries

### Customer Lifetime Value (CLV)
```sql
SELECT
  customer_name,
  phone_number,
  COUNT(*) as total_orders,
  SUM(total) as lifetime_value,
  AVG(total) as avg_order_value,
  MIN(created_at) as first_order,
  MAX(created_at) as last_order
FROM orders
GROUP BY customer_name, phone_number
ORDER BY lifetime_value DESC;
```

### Top 10 Customers
```sql
SELECT customer_name, phone_number,
       COUNT(*) as orders,
       SUM(total) as total_spent
FROM orders
WHERE status = 'Delivered'
GROUP BY customer_name, phone_number
ORDER BY total_spent DESC
LIMIT 10;
```

### Customer Segmentation
```sql
SELECT
  CASE
    WHEN SUM(total) >= 500 OR COUNT(*) >= 20 THEN 'VIP'
    WHEN COUNT(*) >= 3 THEN 'Regular'
    ELSE 'New'
  END as segment,
  COUNT(DISTINCT phone_number) as customers,
  SUM(total) as total_revenue
FROM orders
GROUP BY 1;
```

### Dormant Customers (60+ days)
```sql
SELECT customer_name, phone_number, MAX(created_at) as last_order,
       EXTRACT(DAY FROM NOW() - MAX(created_at)) as days_since_order
FROM orders
GROUP BY customer_name, phone_number
HAVING MAX(created_at) < NOW() - INTERVAL '60 days'
ORDER BY last_order DESC;
```

### Customer Channel Preference
```sql
SELECT customer_name, phone_number,
       MODE() WITHIN GROUP (ORDER BY channel) as preferred_channel,
       COUNT(*) as total_orders
FROM orders
GROUP BY customer_name, phone_number
ORDER BY total_orders DESC;
```

## Purchase Pattern Analysis

### Frequently Bought Products (by customer)
```sql
SELECT o.customer_name,
       item->>'product_name' as product,
       SUM((item->>'quantity')::int) as total_quantity
FROM orders o,
     jsonb_array_elements(o.items) as item
GROUP BY o.customer_name, item->>'product_name'
ORDER BY o.customer_name, total_quantity DESC;
```

### Average Order Frequency
```sql
WITH customer_orders AS (
  SELECT phone_number,
         created_at,
         LAG(created_at) OVER (PARTITION BY phone_number ORDER BY created_at) as prev_order
  FROM orders
)
SELECT phone_number,
       AVG(EXTRACT(DAY FROM created_at - prev_order)) as avg_days_between_orders
FROM customer_orders
WHERE prev_order IS NOT NULL
GROUP BY phone_number;
```

### Time-Based Shopping Patterns
```sql
SELECT
  EXTRACT(DOW FROM created_at) as day_of_week,
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as order_count
FROM orders
GROUP BY 1, 2
ORDER BY order_count DESC;
```

## Customer Scoring Model

```javascript
// Calculate customer score (0-100)
const calculateCustomerScore = (customer) => {
  let score = 0;

  // Recency (0-30 points)
  const daysSinceLastOrder = daysSince(customer.last_order_date);
  if (daysSinceLastOrder <= 7) score += 30;
  else if (daysSinceLastOrder <= 30) score += 20;
  else if (daysSinceLastOrder <= 60) score += 10;

  // Frequency (0-30 points)
  if (customer.total_orders >= 20) score += 30;
  else if (customer.total_orders >= 10) score += 20;
  else if (customer.total_orders >= 5) score += 15;
  else if (customer.total_orders >= 2) score += 10;

  // Monetary (0-40 points)
  if (customer.total_spent >= 1000) score += 40;
  else if (customer.total_spent >= 500) score += 30;
  else if (customer.total_spent >= 200) score += 20;
  else if (customer.total_spent >= 50) score += 10;

  return score;
};

// Classify customer
const classifyCustomer = (score) => {
  if (score >= 80) return 'Champion';
  if (score >= 60) return 'Loyal';
  if (score >= 40) return 'Potential';
  if (score >= 20) return 'At Risk';
  return 'Needs Attention';
};
```

## Cohort Analysis

```sql
-- Monthly cohort retention
WITH cohorts AS (
  SELECT phone_number,
         DATE_TRUNC('month', MIN(created_at)) as cohort_month
  FROM orders
  GROUP BY phone_number
),
monthly_activity AS (
  SELECT o.phone_number,
         c.cohort_month,
         DATE_TRUNC('month', o.created_at) as activity_month
  FROM orders o
  JOIN cohorts c ON o.phone_number = c.phone_number
)
SELECT cohort_month,
       activity_month,
       COUNT(DISTINCT phone_number) as active_customers
FROM monthly_activity
GROUP BY 1, 2
ORDER BY 1, 2;
```

## Customer Communication Templates

### Welcome Message (New Customer)
```
Welcome to Isha's Treat! 🎉

Thank you for your first order. We're delighted to serve you authentic African & Caribbean groceries.

Your order #{order_id} is being prepared.

Questions? WhatsApp us at 07448 682282
```

### VIP Recognition
```
Dear {customer_name},

You've been upgraded to VIP status! 🌟

As a valued customer, you now enjoy:
• Priority order processing
• Exclusive offers
• Early access to new products

Thank you for your continued support!
```

### Re-engagement (Dormant)
```
Hi {customer_name},

We miss you at Isha's Treat! It's been {days} days since your last order.

Here's 10% off your next order: USE CODE WELCOME10

Shop now: apinlero.vercel.app
```

### Win-back (Churned)
```
Hi {customer_name},

It's been a while! We'd love to have you back.

Enjoy 15% off your next order with code: MISSYOU15

Our new arrivals include:
• Fresh Plantain
• Premium Palm Oil
• New Spice Blends

Order: apinlero.vercel.app
```

## Customer Reports

### Monthly Customer Summary
```
📊 Customer Insights - {month}

Total Customers: {total}
New Customers: {new}
Returning: {returning}
Churned: {churned}

Top Customer: {top_name} - £{top_spent}
Avg Order Value: £{aov}
Customer Retention: {retention}%
```

### Customer Health Dashboard
```
🏥 Customer Health Check

✅ Champions (80+ score): {count}
💚 Loyal (60-79): {count}
💛 Potential (40-59): {count}
🟠 At Risk (20-39): {count}
🔴 Needs Attention (<20): {count}

Action Required: {at_risk_count} customers need re-engagement
```
