/**
 * Àpínlẹ̀rọ Knowledge Graph - Query Examples
 *
 * Useful Cypher queries for business intelligence
 */

import { runQuery, verifyConnection, closeDriver } from './neo4j-client.js';

const queries = {
  // Top customers by spend
  topCustomers: `
    MATCH (c:Customer)-[:PLACED]->(o:Order)
    RETURN c.name as customer,
           c.phone as phone,
           COUNT(o) as orders,
           SUM(o.total) as total_spent
    ORDER BY total_spent DESC
    LIMIT 10
  `,

  // Orders by channel
  ordersByChannel: `
    MATCH (o:Order)
    RETURN o.channel as channel,
           COUNT(o) as orders,
           SUM(o.total) as revenue,
           AVG(o.total) as avg_order
    ORDER BY revenue DESC
  `,

  // Products by popularity
  popularProducts: `
    MATCH (o:Order)-[r:CONTAINS]->(p:Product)
    RETURN p.name as product,
           p.category as category,
           SUM(r.quantity) as total_sold,
           COUNT(DISTINCT o) as order_count
    ORDER BY total_sold DESC
    LIMIT 15
  `,

  // Frequently bought together
  boughtTogether: `
    MATCH (o:Order)-[:CONTAINS]->(p1:Product),
          (o)-[:CONTAINS]->(p2:Product)
    WHERE p1.id < p2.id
    RETURN p1.name as product1,
           p2.name as product2,
           COUNT(*) as frequency
    ORDER BY frequency DESC
    LIMIT 10
  `,

  // Order status distribution
  orderStatus: `
    MATCH (o:Order)
    RETURN o.status as status,
           COUNT(o) as count,
           SUM(o.total) as total_value
    ORDER BY count DESC
  `,

  // Low stock products
  lowStock: `
    MATCH (p:Product)
    WHERE p.stock_quantity <= 10
    RETURN p.name as product,
           p.stock_quantity as stock,
           p.category as category
    ORDER BY p.stock_quantity ASC
  `,

  // Revenue by category
  categoryRevenue: `
    MATCH (o:Order)-[r:CONTAINS]->(p:Product)-[:BELONGS_TO]->(c:Category)
    RETURN c.name as category,
           SUM(r.quantity * r.price) as revenue,
           SUM(r.quantity) as units_sold
    ORDER BY revenue DESC
  `,

  // Recent orders
  recentOrders: `
    MATCH (c:Customer)-[:PLACED]->(o:Order)
    RETURN o.id as order_id,
           c.name as customer,
           o.channel as channel,
           o.status as status,
           o.total as total,
           o.created_at as date
    ORDER BY o.created_at DESC
    LIMIT 20
  `,

  // Customer purchase history
  customerHistory: `
    MATCH (c:Customer {phone: $phone})-[:PLACED]->(o:Order)-[:CONTAINS]->(p:Product)
    RETURN o.id as order_id,
           o.created_at as date,
           o.total as order_total,
           COLLECT(p.name) as products
    ORDER BY o.created_at DESC
  `,

  // Graph overview
  graphStats: `
    MATCH (n)
    RETURN labels(n)[0] as type, COUNT(n) as count
    ORDER BY count DESC
  `
};

async function runQueries() {
  console.log('📊 Àpínlẹ̀rọ Knowledge Graph Queries\n');

  const connected = await verifyConnection();
  if (!connected) {
    process.exit(1);
  }

  try {
    // Graph stats
    console.log('\n=== Graph Overview ===');
    const stats = await runQuery(queries.graphStats);
    stats.forEach(r => console.log(`  ${r.get('type')}: ${r.get('count')}`));

    // Top customers
    console.log('\n=== Top 10 Customers ===');
    const customers = await runQuery(queries.topCustomers);
    customers.forEach(r => {
      console.log(`  ${r.get('customer')} - ${r.get('orders')} orders - £${r.get('total_spent')?.toFixed(2)}`);
    });

    // Orders by channel
    console.log('\n=== Orders by Channel ===');
    const channels = await runQuery(queries.ordersByChannel);
    channels.forEach(r => {
      console.log(`  ${r.get('channel')}: ${r.get('orders')} orders - £${r.get('revenue')?.toFixed(2)}`);
    });

    // Popular products
    console.log('\n=== Top 10 Products ===');
    const products = await runQuery(queries.popularProducts);
    products.slice(0, 10).forEach(r => {
      console.log(`  ${r.get('product')} - ${r.get('total_sold')} units`);
    });

    // Bought together
    console.log('\n=== Frequently Bought Together ===');
    const pairs = await runQuery(queries.boughtTogether);
    pairs.slice(0, 5).forEach(r => {
      console.log(`  ${r.get('product1')} + ${r.get('product2')} (${r.get('frequency')} times)`);
    });

  } catch (error) {
    console.error('Query failed:', error.message);
  } finally {
    await closeDriver();
  }
}

// Run if called directly
runQueries();

export { queries };
