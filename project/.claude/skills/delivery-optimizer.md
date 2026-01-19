# Àpínlẹ̀rọ Delivery Optimizer Skill

You are an AI assistant specialized in delivery route optimization for Isha's Treat & Groceries, an African & Caribbean wholesale business in London.

## Delivery Zones

### London Delivery Areas

| Zone | Areas | Delivery Fee | Typical Time |
|------|-------|--------------|--------------|
| **Zone 1** | E1-E18 (East London) | £5.00 | Same day |
| **Zone 2** | N1-N22 (North London) | £5.00 | Same day |
| **Zone 3** | SE1-SE28 (South East) | £5.00 | Next day |
| **Zone 4** | SW1-SW20 (South West) | £7.00 | Next day |
| **Zone 5** | W1-W14 (West London) | £7.00 | Next day |
| **Zone 6** | NW1-NW11 (North West) | £7.00 | Next day |
| **Zone 7** | Outer London | £10.00 | 2-3 days |

### Postcode Mapping
```javascript
const getDeliveryZone = (postcode) => {
  const prefix = postcode.toUpperCase().match(/^[A-Z]+/)?.[0];
  const number = parseInt(postcode.match(/\d+/)?.[0] || '0');

  const zones = {
    'E': { zone: 1, fee: 5.00 },
    'N': { zone: 2, fee: 5.00 },
    'SE': { zone: 3, fee: 5.00 },
    'SW': { zone: 4, fee: 7.00 },
    'W': { zone: 5, fee: 7.00 },
    'NW': { zone: 6, fee: 7.00 },
    'RM': { zone: 7, fee: 10.00 },   // Romford
    'IG': { zone: 7, fee: 10.00 },   // Ilford
    'DA': { zone: 7, fee: 10.00 },   // Dartford
    'BR': { zone: 7, fee: 10.00 },   // Bromley
    'CR': { zone: 7, fee: 10.00 },   // Croydon
  };

  return zones[prefix] || { zone: 7, fee: 10.00 };
};
```

## Delivery Structure

```typescript
interface Delivery {
  order_id: string;
  customer_name: string;
  phone: string;
  address: string;
  postcode: string;
  zone: number;
  items_count: number;
  total_weight_kg: number;
  delivery_window: string;      // "Morning" | "Afternoon" | "Evening"
  special_instructions?: string;
  status: 'Scheduled' | 'Out for Delivery' | 'Delivered' | 'Failed';
}
```

## Route Optimization

### Daily Route Planning Query
```sql
SELECT
  o.id,
  o.customer_name,
  o.phone_number,
  o.delivery_address,
  SUBSTRING(o.delivery_address FROM '[A-Z]{1,2}[0-9]{1,2}') as postcode,
  o.total,
  jsonb_array_length(o.items) as item_count,
  o.notes
FROM orders o
WHERE o.status = 'Confirmed'
  AND o.delivery_method = 'delivery'
  AND DATE(o.created_at) >= CURRENT_DATE - INTERVAL '2 days'
ORDER BY postcode;
```

### Group by Zone
```sql
WITH deliveries AS (
  SELECT *,
    CASE
      WHEN delivery_address ~* '^E[0-9]' THEN 'Zone 1 - East'
      WHEN delivery_address ~* '^N[0-9]' THEN 'Zone 2 - North'
      WHEN delivery_address ~* '^SE[0-9]' THEN 'Zone 3 - South East'
      WHEN delivery_address ~* '^SW[0-9]' THEN 'Zone 4 - South West'
      WHEN delivery_address ~* '^W[0-9]' THEN 'Zone 5 - West'
      WHEN delivery_address ~* '^NW[0-9]' THEN 'Zone 6 - North West'
      ELSE 'Zone 7 - Outer'
    END as zone
  FROM orders
  WHERE status = 'Confirmed' AND delivery_method = 'delivery'
)
SELECT zone, COUNT(*) as deliveries, SUM(total) as total_value
FROM deliveries
GROUP BY zone
ORDER BY zone;
```

## Route Optimization Algorithm

```javascript
// Simple nearest neighbor algorithm for route planning
const optimizeRoute = (deliveries, startLocation = 'E1 6AN') => {
  const route = [];
  let currentLocation = startLocation;
  const remaining = [...deliveries];

  while (remaining.length > 0) {
    // Find nearest delivery
    let nearestIdx = 0;
    let nearestDist = Infinity;

    remaining.forEach((delivery, idx) => {
      const dist = estimateDistance(currentLocation, delivery.postcode);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });

    const next = remaining.splice(nearestIdx, 1)[0];
    route.push(next);
    currentLocation = next.postcode;
  }

  return route;
};

// Estimate distance between postcodes (simplified)
const estimateDistance = (from, to) => {
  // In production, use Google Maps Distance Matrix API
  // This is a simplified postcode-based estimate
  const fromZone = getDeliveryZone(from).zone;
  const toZone = getDeliveryZone(to).zone;
  return Math.abs(fromZone - toZone) + Math.random() * 2;
};
```

## Delivery Time Windows

| Window | Time | Best For |
|--------|------|----------|
| **Morning** | 9:00 - 12:00 | Restaurants, businesses |
| **Afternoon** | 12:00 - 17:00 | Residential |
| **Evening** | 17:00 - 20:00 | Working customers |

### Time Slot Capacity
```javascript
const MAX_DELIVERIES_PER_SLOT = 8;
const DELIVERY_SLOTS = {
  'Morning': { start: '09:00', end: '12:00', capacity: MAX_DELIVERIES_PER_SLOT },
  'Afternoon': { start: '12:00', end: '17:00', capacity: MAX_DELIVERIES_PER_SLOT },
  'Evening': { start: '17:00', end: '20:00', capacity: MAX_DELIVERIES_PER_SLOT }
};

const checkSlotAvailability = (date, slot, currentBookings) => {
  const booked = currentBookings.filter(b =>
    b.date === date && b.slot === slot
  ).length;
  return booked < DELIVERY_SLOTS[slot].capacity;
};
```

## Delivery Tracking

### Update Delivery Status
```sql
-- Mark as out for delivery
UPDATE orders
SET status = 'Out for Delivery',
    updated_at = NOW()
WHERE id = $order_id;

-- Mark as delivered
UPDATE orders
SET status = 'Delivered',
    delivered_at = NOW(),
    updated_at = NOW()
WHERE id = $order_id;
```

### Failed Delivery Handling
```javascript
const handleFailedDelivery = async (orderId, reason) => {
  const reasons = [
    'Customer not available',
    'Wrong address',
    'Access issues',
    'Customer refused',
    'Weather conditions'
  ];

  // Log the failure
  await logDeliveryAttempt(orderId, 'Failed', reason);

  // Reschedule for next available slot
  const nextSlot = await findNextAvailableSlot();

  // Notify customer
  await sendNotification(orderId, `
    Delivery attempt failed: ${reason}
    Rescheduled for: ${nextSlot}
    Contact us to arrange alternative: 07448 682282
  `);

  return nextSlot;
};
```

## Driver Assignment

```javascript
const assignDriver = (deliveries, drivers) => {
  // Group deliveries by zone
  const byZone = deliveries.reduce((acc, d) => {
    const zone = getDeliveryZone(d.postcode).zone;
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(d);
    return acc;
  }, {});

  // Assign drivers to zones
  const assignments = [];
  Object.entries(byZone).forEach(([zone, zoneDeliveries]) => {
    const availableDriver = drivers.find(d => d.available);
    if (availableDriver) {
      assignments.push({
        driver: availableDriver.name,
        zone,
        deliveries: zoneDeliveries,
        estimatedTime: zoneDeliveries.length * 20 // 20 mins per delivery
      });
      availableDriver.available = false;
    }
  });

  return assignments;
};
```

## Delivery Reports

### Daily Delivery Summary
```
🚚 Delivery Summary - {date}

Total Deliveries: {total}
├── Completed: {completed} ✅
├── In Progress: {in_progress} 🔄
├── Scheduled: {scheduled} 📅
└── Failed: {failed} ❌

By Zone:
{zone_breakdown}

Average Delivery Time: {avg_time} mins
On-Time Rate: {on_time_pct}%
```

### Route Sheet (for driver)
```
📋 Route Sheet - {date}
Driver: {driver_name}
Zone: {zone}
Deliveries: {count}

Start: {start_time}
Estimated Finish: {end_time}

ROUTE:
{route_list}

1. {customer_1}
   📍 {address_1}
   📦 {items_1}
   💰 £{total_1} ({payment_method_1})
   📝 {notes_1}

2. {customer_2}
   ...

Total Value: £{total_value}
```

## Notifications

### Customer Notifications
```javascript
const deliveryNotifications = {
  scheduled: (order) => `
    📦 Order Confirmed!
    Your delivery is scheduled for {date}.
    We'll notify you when it's on the way.
  `,

  outForDelivery: (order) => `
    🚚 Out for Delivery!
    Your order is on its way.
    Expected arrival: {time_window}
    Driver: {driver_name}
  `,

  arriving: (order) => `
    📍 Almost There!
    Your delivery will arrive in approximately 10 minutes.
    Please be ready to receive your order.
  `,

  delivered: (order) => `
    ✅ Delivered!
    Your order has been delivered.
    Thank you for shopping with Isha's Treat!
    Questions? WhatsApp: 07448 682282
  `,

  failed: (order, reason) => `
    ⚠️ Delivery Attempt Failed
    Reason: {reason}
    We'll try again tomorrow.
    To reschedule: 07448 682282
  `
};
```

## Delivery Costs Analysis

```sql
SELECT
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as deliveries,
  SUM(delivery_fee) as delivery_revenue,
  -- Assume £3 cost per delivery
  COUNT(*) * 3 as estimated_cost,
  SUM(delivery_fee) - (COUNT(*) * 3) as delivery_profit
FROM orders
WHERE delivery_method = 'delivery'
  AND status = 'Delivered'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;
```
