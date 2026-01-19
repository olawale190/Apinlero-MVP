/**
 * Àpínlẹ̀rọ Knowledge Graph - ETL Sync Pipeline
 *
 * Syncs data from Supabase PostgreSQL to Neo4j Aura:
 * 1. Extracts data from Supabase tables
 * 2. Transforms into graph nodes and relationships
 * 3. Loads into Neo4j
 */

import { runWrite, verifyConnection, closeDriver } from './neo4j-client.js';
import { getProducts, getOrders, getCustomers, getBusinessUsers, getPayments } from './supabase-client.js';

/**
 * Product Alias Data - Yoruba + English
 * This is the core innovation: mapping ethnic food terminology to products
 */
const PRODUCT_ALIASES = {
  'Palm Oil 5L': {
    english: ['red oil', 'palm oil', 'cooking oil'],
    yoruba: ['epo pupa', 'adin', 'zomi']
  },
  'Egusi Seeds': {
    english: ['melon seeds', 'egusi', 'ground egusi'],
    yoruba: ['egwusi', 'agusi', 'efo egusi']
  },
  'Stockfish': {
    english: ['stock fish', 'dried fish', 'norwegian fish'],
    yoruba: ['okporoko', 'panla', 'eja okporoko']
  },
  'Plantain (Green)': {
    english: ['green plantain', 'unripe plantain', 'cooking plantain'],
    yoruba: ['ogede', 'ogede agbagba', 'dodo']
  },
  'Yam Flour': {
    english: ['yam flour', 'amala flour', 'pounded yam flour'],
    yoruba: ['elubo', 'amala', 'elubo isu']
  },
  'Cassava Flour': {
    english: ['garri', 'eba', 'cassava', 'gari'],
    yoruba: ['lafun', 'eba', 'iyan']
  },
  'Scotch Bonnet Peppers': {
    english: ['scotch bonnet', 'hot pepper', 'chili pepper', 'pepper'],
    yoruba: ['ata rodo', 'ata wewe', 'ata ijosi']
  },
  'Jollof Rice Mix': {
    english: ['jollof', 'jollof rice', 'party rice', 'jollof mix'],
    yoruba: []
  },
  'Maggi Seasoning': {
    english: ['maggi', 'seasoning cubes', 'knorr', 'stock cubes'],
    yoruba: []
  },
  'Dried Crayfish': {
    english: ['crayfish', 'dried crayfish', 'crawfish', 'ground crayfish'],
    yoruba: ['ede', 'eja ede']
  },
  'Fufu Flour': {
    english: ['fufu', 'pounded yam', 'poundo yam', 'instant pounded yam'],
    yoruba: ['iyan', 'isu', 'poundo']
  },
  'Coconut Oil 1L': {
    english: ['coconut oil', 'coconut', 'virgin coconut oil'],
    yoruba: ['adi agbon', 'epo agbon']
  },
  'Garden Eggs': {
    english: ['garden eggs', 'african eggplant', 'white eggplant'],
    yoruba: ['igba', 'igbagba', 'efo igba']
  },
  'African Nutmeg': {
    english: ['nutmeg', 'african nutmeg', 'calabash nutmeg'],
    yoruba: ['ehuru', 'ariwo', 'arigbo']
  },
  'Red Palm Oil': {
    english: ['palm kernel oil', 'red palm oil', 'crude palm oil'],
    yoruba: ['adin dudu', 'epo igi']
  }
};

// Extract unique categories from products
function extractCategories(products) {
  const categories = new Set();
  products.forEach(p => {
    if (p.category) categories.add(p.category);
  });
  return Array.from(categories);
}

// Extract customers from orders (if no customers table)
function extractCustomersFromOrders(orders) {
  const customerMap = new Map();

  orders.forEach(order => {
    const phone = order.phone_number?.trim();
    if (!phone) return;

    if (!customerMap.has(phone)) {
      customerMap.set(phone, {
        id: phone, // Use phone as ID
        name: order.customer_name,
        phone: phone,
        email: order.email || null,
        address: order.delivery_address || null,
        total_orders: 0,
        total_spent: 0
      });
    }

    const customer = customerMap.get(phone);
    customer.total_orders += 1;
    customer.total_spent += parseFloat(order.total) || 0;
  });

  return Array.from(customerMap.values());
}

async function syncAliases(products) {
  console.log(`\n🗣️ Syncing product aliases (Yoruba + English)...`);

  let aliasCount = 0;

  for (const product of products) {
    const aliases = PRODUCT_ALIASES[product.name];
    if (!aliases) continue;

    // Sync English aliases
    for (const alias of aliases.english || []) {
      await runWrite(`
        MERGE (a:Alias {name: $alias})
        SET a.language = 'english',
            a.updated_at = datetime()
        WITH a
        MATCH (p:Product {name: $productName})
        MERGE (a)-[:REFERS_TO]->(p)
      `, {
        alias: alias.toLowerCase(),
        productName: product.name
      });
      aliasCount++;
    }

    // Sync Yoruba aliases
    for (const alias of aliases.yoruba || []) {
      await runWrite(`
        MERGE (a:Alias {name: $alias})
        SET a.language = 'yoruba',
            a.updated_at = datetime()
        WITH a
        MATCH (p:Product {name: $productName})
        MERGE (a)-[:REFERS_TO]->(p)
      `, {
        alias: alias.toLowerCase(),
        productName: product.name
      });
      aliasCount++;
    }
  }

  console.log(`  ✓ ${aliasCount} aliases synced across ${Object.keys(PRODUCT_ALIASES).length} products`);
}

async function syncCategories(categories) {
  console.log(`\n📁 Syncing ${categories.length} categories...`);

  for (const category of categories) {
    await runWrite(`
      MERGE (c:Category {name: $name})
      ON CREATE SET c.created_at = datetime()
    `, { name: category });
  }
  console.log(`  ✓ ${categories.length} categories synced`);
}

async function syncProducts(products) {
  console.log(`\n📦 Syncing ${products.length} products...`);

  for (const product of products) {
    await runWrite(`
      MERGE (p:Product {id: $id})
      SET p.name = $name,
          p.price = $price,
          p.category = $category,
          p.unit = $unit,
          p.stock_quantity = $stock,
          p.is_active = $is_active,
          p.updated_at = datetime()

      WITH p
      MATCH (c:Category {name: $category})
      MERGE (p)-[:BELONGS_TO]->(c)
    `, {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price) || 0,
      category: product.category || 'Uncategorized',
      unit: product.unit || 'Each',
      stock: product.stock_quantity || 0,
      is_active: product.is_active !== false
    });
  }
  console.log(`  ✓ ${products.length} products synced`);
}

async function syncCustomers(customers) {
  console.log(`\n👥 Syncing ${customers.length} customers...`);

  for (const customer of customers) {
    await runWrite(`
      MERGE (c:Customer {phone: $phone})
      SET c.id = $id,
          c.name = $name,
          c.email = $email,
          c.address = $address,
          c.total_orders = $total_orders,
          c.total_spent = $total_spent,
          c.updated_at = datetime()
    `, {
      id: customer.id || customer.phone,
      phone: customer.phone,
      name: customer.name || 'Unknown',
      email: customer.email || null,
      address: customer.address || customer.delivery_address || null,
      total_orders: customer.total_orders || 0,
      total_spent: customer.total_spent || 0
    });
  }
  console.log(`  ✓ ${customers.length} customers synced`);
}

async function syncOrders(orders) {
  console.log(`\n🛒 Syncing ${orders.length} orders...`);

  for (const order of orders) {
    // Create Order node
    await runWrite(`
      MERGE (o:Order {id: $id})
      SET o.customer_name = $customer_name,
          o.phone = $phone,
          o.channel = $channel,
          o.status = $status,
          o.total = $total,
          o.delivery_fee = $delivery_fee,
          o.delivery_method = $delivery_method,
          o.payment_method = $payment_method,
          o.created_at = datetime($created_at),
          o.updated_at = datetime()

      WITH o
      MATCH (c:Customer {phone: $phone})
      MERGE (c)-[:PLACED]->(o)
    `, {
      id: order.id,
      customer_name: order.customer_name,
      phone: order.phone_number || '',
      channel: order.channel || 'Web',
      status: order.status || 'Pending',
      total: parseFloat(order.total) || 0,
      delivery_fee: parseFloat(order.delivery_fee) || 5,
      delivery_method: order.delivery_method || 'delivery',
      payment_method: order.payment_method || 'cash',
      created_at: order.created_at || new Date().toISOString()
    });

    // Create CONTAINS relationships for order items
    const items = order.items || [];
    for (const item of items) {
      await runWrite(`
        MATCH (o:Order {id: $order_id})
        MATCH (p:Product {name: $product_name})
        MERGE (o)-[r:CONTAINS]->(p)
        SET r.quantity = $quantity,
            r.price = $price,
            r.unit = $unit
      `, {
        order_id: order.id,
        product_name: item.product_name,
        quantity: item.quantity || 1,
        price: parseFloat(item.price) || 0,
        unit: item.unit || 'Each'
      });
    }
  }
  console.log(`  ✓ ${orders.length} orders synced`);
}

async function syncStaff(users) {
  if (users.length === 0) return;

  console.log(`\n👔 Syncing ${users.length} staff members...`);

  for (const user of users) {
    await runWrite(`
      MERGE (s:Staff {id: $id})
      SET s.email = $email,
          s.name = $name,
          s.role = $role,
          s.is_active = $is_active,
          s.updated_at = datetime()
    `, {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role || 'staff',
      is_active: user.is_active !== false
    });
  }
  console.log(`  ✓ ${users.length} staff synced`);
}

async function runSync() {
  console.log('🔄 Àpínlẹ̀rọ Knowledge Graph Sync');
  console.log('================================\n');

  // Verify Neo4j connection
  const connected = await verifyConnection();
  if (!connected) {
    console.error('Cannot proceed without Neo4j connection');
    process.exit(1);
  }

  try {
    // 1. Fetch data from Supabase
    console.log('📥 Fetching data from Supabase...');
    const products = await getProducts();
    const orders = await getOrders();
    let customers = await getCustomers();
    const staff = await getBusinessUsers();

    console.log(`  - Products: ${products.length}`);
    console.log(`  - Orders: ${orders.length}`);
    console.log(`  - Customers: ${customers.length}`);
    console.log(`  - Staff: ${staff.length}`);

    // Extract customers from orders if no customers table
    if (customers.length === 0) {
      customers = extractCustomersFromOrders(orders);
      console.log(`  - Extracted ${customers.length} customers from orders`);
    }

    // Extract categories
    const categories = extractCategories(products);
    console.log(`  - Categories: ${categories.length}`);

    // 2. Sync to Neo4j
    console.log('\n📤 Syncing to Neo4j...');

    await syncCategories(categories);
    await syncProducts(products);
    await syncAliases(products);  // NEW: Sync Yoruba + English aliases
    await syncCustomers(customers);
    await syncOrders(orders);
    await syncStaff(staff);

    // 3. Print summary
    console.log('\n✅ Sync complete!');
    console.log('\n📊 Graph Statistics:');

    const stats = await runWrite(`
      MATCH (n)
      RETURN labels(n)[0] as label, count(*) as count
      ORDER BY count DESC
    `);

    stats.records.forEach(record => {
      console.log(`  - ${record.get('label')}: ${record.get('count')}`);
    });

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    throw error;
  } finally {
    await closeDriver();
  }
}

runSync();
