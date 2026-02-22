/**
 * Apinlero Knowledge Graph - Order Saver
 *
 * Persists confirmed orders to Neo4j and updates customer preferences.
 *
 * - saveOrderToGraph: Creates Order + OrderItem nodes, links to Customer
 * - updateCustomerPreferences: Updates PREFERS relationships after confirmation
 */

import { runWrite, runQuery } from './neo4j-client.js';

/**
 * Save a confirmed order to the Knowledge Graph.
 *
 * Creates:
 *   (Customer)-[:PLACED]->(Order)-[:CONTAINS]->(Product)
 *
 * @param {string} phone - Customer phone number
 * @param {Array<{name: string, quantity: number, unit?: string, price: number}>} items
 * @returns {{ orderId: string, itemCount: number }}
 */
export async function saveOrderToGraph(phone, items) {
  const orderId = `WA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Ensure Customer node exists
  await runWrite(`
    MERGE (c:Customer {phone: $phone})
    ON CREATE SET c.created_at = $now
    SET c.last_order_at = $now
  `, { phone, now });

  // Create Order node and link to Customer
  await runWrite(`
    MATCH (c:Customer {phone: $phone})
    CREATE (o:Order {
      id: $orderId,
      channel: 'WhatsApp',
      total: $total,
      status: 'confirmed',
      created_at: $now
    })
    CREATE (c)-[:PLACED]->(o)
  `, { phone, orderId, total, now });

  // Create CONTAINS relationships to Product nodes
  for (const item of items) {
    await runWrite(`
      MATCH (o:Order {id: $orderId})
      MATCH (p:Product)
      WHERE toLower(p.name) = toLower($productName)
      CREATE (o)-[:CONTAINS {
        quantity: $quantity,
        unit: $unit,
        price: $price
      }]->(p)
    `, {
      orderId,
      productName: item.name,
      quantity: item.quantity,
      unit: item.unit || null,
      price: item.price,
    });
  }

  return { orderId, itemCount: items.length };
}

/**
 * Update customer preference relationships after a confirmed order.
 *
 * For each ordered item, MERGE a PREFERS relationship and update:
 *   - last_ordered timestamp
 *   - order_count (increment)
 *   - typical_quantity (running average)
 *
 * @param {string} phone - Customer phone number
 * @param {Array<{name: string, quantity: number, unit?: string}>} items
 */
export async function updateCustomerPreferences(phone, items) {
  for (const item of items) {
    await runWrite(`
      MATCH (c:Customer {phone: $phone})
      MATCH (p:Product)
      WHERE toLower(p.name) = toLower($productName)
      MERGE (c)-[pref:PREFERS]->(p)
      ON CREATE SET
        pref.order_count = 1,
        pref.typical_quantity = $quantity,
        pref.last_ordered = $now
      ON MATCH SET
        pref.order_count = coalesce(pref.order_count, 0) + 1,
        pref.typical_quantity = (coalesce(pref.typical_quantity, $quantity) + $quantity) / 2.0,
        pref.last_ordered = $now
    `, {
      phone,
      productName: item.name,
      quantity: item.quantity,
      now: new Date().toISOString(),
    });
  }
}
