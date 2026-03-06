/**
 * Àpínlẹ̀rọ Knowledge Graph - Test Customer Seeder
 *
 * Creates 5 test customers with realistic order history for comparison test.
 * Deletes old generic test customers first, then creates new realistic ones.
 * Run: node knowledge-graph/src/seed-test-customers.js
 */

import { runWrite, verifyConnection, closeDriver } from './neo4j-client.js';

// ============================================================================
// PRODUCT CATALOG (synced from Supabase seed-isha-treat-products.sql)
// ============================================================================
const products = [
  // Oils & Fats
  { id: 'palm-oil-5l', name: 'Palm Oil (Red Oil) 5L', price: 18.99, category: 'Oils & Fats', aliases: ['red oil', 'palm fruit oil', 'oil 5L'], cultural_names: ['epo pupa', 'mmanu nri', 'zomi'], emoji: '🫒' },
  { id: 'palm-oil-1l', name: 'Palm Oil (Red Oil) 1L', price: 5.99, category: 'Oils & Fats', aliases: ['red oil', 'palm oil small'], cultural_names: ['epo pupa'], emoji: '🫒' },
  { id: 'groundnut-oil-5l', name: 'Groundnut Oil 5L', price: 15.99, category: 'Oils & Fats', aliases: ['peanut oil', 'groundnut'], cultural_names: ['epa'], emoji: '🥜' },
  { id: 'coconut-oil-1l', name: 'Coconut Oil 1L', price: 8.99, category: 'Oils & Fats', aliases: ['coconut'], cultural_names: ['adi agbon'], emoji: '🥥' },
  { id: 'shea-butter-500g', name: 'Shea Butter (Ori) 500g', price: 12.99, category: 'Oils & Fats', aliases: ['shea', 'ori'], cultural_names: ['ori', 'okwuma'], emoji: '🧈' },

  // Grains & Rice
  { id: 'rice-25kg', name: 'Nigerian Rice 25kg', price: 45.00, category: 'Grains & Rice', aliases: ['rice large', 'big rice', 'rice bag'], cultural_names: ['iresi'], emoji: '🍚' },
  { id: 'rice-10kg', name: 'Nigerian Rice 10kg', price: 22.00, category: 'Grains & Rice', aliases: ['rice', 'rice 10kg', 'medium rice'], cultural_names: ['iresi'], emoji: '🍚' },
  { id: 'rice-5kg', name: 'Nigerian Rice 5kg', price: 12.00, category: 'Grains & Rice', aliases: ['rice small', 'rice 5kg'], cultural_names: ['iresi'], emoji: '🍚' },
  { id: 'basmati-10kg', name: 'Basmati Rice 10kg', price: 28.00, category: 'Grains & Rice', aliases: ['basmati', 'indian rice'], cultural_names: [], emoji: '🍚' },

  // Flours
  { id: 'yam-flour-2kg', name: 'Yam Flour (Elubo/Amala) 2kg', price: 8.99, category: 'Flours', aliases: ['amala flour', 'elubo', 'yam flour'], cultural_names: ['elubo', 'amala'], emoji: '🫓' },
  { id: 'garri-5kg', name: 'Cassava Flour (Garri) 5kg', price: 12.99, category: 'Flours', aliases: ['garri big', 'garri 5kg'], cultural_names: ['garri', 'eba'], emoji: '🫓' },
  { id: 'garri-2kg', name: 'Cassava Flour (Garri) 2kg', price: 5.99, category: 'Flours', aliases: ['garri', 'garri small'], cultural_names: ['garri'], emoji: '🫓' },
  { id: 'plantain-flour-2kg', name: 'Plantain Flour 2kg', price: 9.99, category: 'Flours', aliases: ['plantain flour'], cultural_names: ['ogede'], emoji: '🍌' },
  { id: 'semolina-2kg', name: 'Semolina 2kg', price: 4.99, category: 'Flours', aliases: ['semolina', 'semo'], cultural_names: ['semovita'], emoji: '🫓' },
  { id: 'pounded-yam-2kg', name: 'Pounded Yam Flour 2kg', price: 7.99, category: 'Flours', aliases: ['pounded yam', 'iyan'], cultural_names: ['iyan'], emoji: '🫓' },
  { id: 'ogi-1kg', name: 'Cornmeal (Ogi/Akamu) 1kg', price: 3.99, category: 'Flours', aliases: ['ogi', 'akamu', 'pap'], cultural_names: ['ogi', 'akamu'], emoji: '🌽' },

  // Beans & Legumes
  { id: 'honey-beans-5kg', name: 'Honey Beans 5kg', price: 18.99, category: 'Beans & Legumes', aliases: ['beans', 'oloyin', 'honey beans'], cultural_names: ['ewa oloyin'], emoji: '🫘' },
  { id: 'black-eyed-beans-5kg', name: 'Black-Eyed Beans 5kg', price: 14.99, category: 'Beans & Legumes', aliases: ['black eye', 'cowpeas'], cultural_names: ['ewa'], emoji: '🫘' },

  // Dried Fish & Seafood
  { id: 'stockfish-large', name: 'Stockfish (Okporoko) Large', price: 35.00, category: 'Dried Fish', aliases: ['stockfish', 'okporoko', 'panla'], cultural_names: ['okporoko', 'panla'], emoji: '🐟' },
  { id: 'stockfish-medium', name: 'Stockfish (Okporoko) Medium', price: 25.00, category: 'Dried Fish', aliases: ['stockfish medium'], cultural_names: ['okporoko'], emoji: '🐟' },
  { id: 'stockfish-head', name: 'Stockfish Head', price: 15.00, category: 'Dried Fish', aliases: ['fish head', 'stock head'], cultural_names: ['ori eja'], emoji: '🐟' },
  { id: 'dried-catfish', name: 'Dried Catfish (Eja Kika)', price: 18.99, category: 'Dried Fish', aliases: ['catfish', 'eja kika'], cultural_names: ['eja kika'], emoji: '🐟' },
  { id: 'crayfish-ground-500g', name: 'Crayfish (Ground) 500g', price: 12.99, category: 'Dried Fish', aliases: ['crayfish', 'ground crayfish'], cultural_names: ['ede'], emoji: '🦐' },
  { id: 'crayfish-whole-500g', name: 'Crayfish (Whole) 500g', price: 14.99, category: 'Dried Fish', aliases: ['whole crayfish'], cultural_names: ['ede'], emoji: '🦐' },
  { id: 'dried-prawns-250g', name: 'Dried Prawns 250g', price: 8.99, category: 'Dried Fish', aliases: ['prawns', 'shrimp'], cultural_names: [], emoji: '🦐' },

  // Meats
  { id: 'ponmo-1kg', name: 'Ponmo (Cow Skin) 1kg', price: 14.99, category: 'Meats', aliases: ['ponmo', 'cow skin', 'kpomo'], cultural_names: ['ponmo', 'kpomo'], emoji: '🥩' },
  { id: 'shaki-1kg', name: 'Shaki (Tripe) 1kg', price: 12.99, category: 'Meats', aliases: ['shaki', 'tripe'], cultural_names: ['shaki'], emoji: '🥩' },
  { id: 'smoked-turkey-wings', name: 'Smoked Turkey Wings', price: 8.99, category: 'Meats', aliases: ['turkey wings', 'turkey'], cultural_names: [], emoji: '🦃' },
  { id: 'smoked-turkey-legs', name: 'Smoked Turkey Legs', price: 6.99, category: 'Meats', aliases: ['turkey legs', 'drumsticks'], cultural_names: [], emoji: '🦃' },
  { id: 'goat-meat-500g', name: 'Dried Goat Meat 500g', price: 22.99, category: 'Meats', aliases: ['goat meat', 'goat'], cultural_names: ['eran ewure'], emoji: '🐐' },
  { id: 'chicken-whole', name: 'Whole Chicken', price: 8.99, category: 'Meats', aliases: ['chicken', 'whole chicken'], cultural_names: ['adie'], emoji: '🍗' },
  { id: 'suya-spice-200g', name: 'Suya Spice Mix 200g', price: 4.99, category: 'Spices', aliases: ['suya spice', 'suya pepper', 'yaji'], cultural_names: ['yaji'], emoji: '🌶️' },

  // Seeds & Nuts
  { id: 'egusi-1kg', name: 'Egusi (Melon Seeds) 1kg', price: 14.99, category: 'Seeds & Nuts', aliases: ['egusi', 'melon seeds'], cultural_names: ['egusi'], emoji: '🎃' },
  { id: 'ogbono-500g', name: 'Ogbono (African Mango) 500g', price: 12.99, category: 'Seeds & Nuts', aliases: ['ogbono', 'apon'], cultural_names: ['ogbono', 'apon'], emoji: '🥭' },

  // Dried Vegetables
  { id: 'bitter-leaf-100g', name: 'Bitter Leaf (Dried) 100g', price: 5.99, category: 'Dried Vegetables', aliases: ['bitter leaf', 'onugbu'], cultural_names: ['ewuro', 'onugbu'], emoji: '🥬' },
  { id: 'uziza-leaf-50g', name: 'Uziza Leaf (Dried) 50g', price: 4.99, category: 'Dried Vegetables', aliases: ['uziza'], cultural_names: ['uziza'], emoji: '🌿' },
  { id: 'ugu-leaf-100g', name: 'Ugu Leaf (Dried) 100g', price: 5.99, category: 'Dried Vegetables', aliases: ['ugu', 'pumpkin leaves'], cultural_names: ['ugu'], emoji: '🥬' },
  { id: 'efo-tete-100g', name: 'Efo Tete (Dried) 100g', price: 4.99, category: 'Dried Vegetables', aliases: ['spinach', 'efo'], cultural_names: ['efo tete'], emoji: '🥬' },
  { id: 'scent-leaf-50g', name: 'Scent Leaf (Dried) 50g', price: 3.99, category: 'Dried Vegetables', aliases: ['scent leaf', 'nchuanwu'], cultural_names: ['efirin', 'nchuanwu'], emoji: '🌿' },
  { id: 'locust-beans-200g', name: 'Locust Beans (Iru/Dawadawa) 200g', price: 6.99, category: 'Seasonings', aliases: ['locust beans', 'iru', 'dawadawa'], cultural_names: ['iru', 'dawadawa', 'ogiri'], emoji: '🫘' },

  // Spices
  { id: 'cameroon-pepper-200g', name: 'Cameroon Pepper 200g', price: 5.99, category: 'Spices', aliases: ['cameroon pepper', 'ata gungun'], cultural_names: ['ata gungun'], emoji: '🌶️' },
  { id: 'scotch-bonnet-200g', name: 'Scotch Bonnet (Ata Rodo) 200g', price: 3.99, category: 'Spices', aliases: ['scotch bonnet', 'ata rodo', 'pepper'], cultural_names: ['ata rodo'], emoji: '🌶️' },
  { id: 'curry-500g', name: 'Curry Powder 500g', price: 4.99, category: 'Spices', aliases: ['curry'], cultural_names: [], emoji: '🍛' },
  { id: 'thyme-100g', name: 'Thyme 100g', price: 2.99, category: 'Spices', aliases: ['thyme'], cultural_names: [], emoji: '🌿' },
  { id: 'mixed-veg-500g', name: 'Mixed Vegetables (Frozen) 500g', price: 3.99, category: 'Fresh Produce', aliases: ['mixed veg', 'vegetables'], cultural_names: [], emoji: '🥗' },

  // Seasonings
  { id: 'maggi-100', name: 'Maggi Cubes (Box of 100)', price: 8.99, category: 'Seasonings', aliases: ['maggi', 'seasoning cubes'], cultural_names: [], emoji: '🧂' },
  { id: 'knorr-100', name: 'Knorr Cubes (Box of 100)', price: 8.99, category: 'Seasonings', aliases: ['knorr'], cultural_names: [], emoji: '🧂' },

  // Beverages
  { id: 'milo-1kg', name: 'Milo 1kg', price: 12.99, category: 'Beverages', aliases: ['milo'], cultural_names: [], emoji: '🥤' },
  { id: 'peak-milk-tin', name: 'Peak Milk (Tin) 400g', price: 3.99, category: 'Beverages', aliases: ['peak milk', 'milk', 'evap'], cultural_names: [], emoji: '🥛' },
  { id: 'malt-drink', name: 'Malta Guinness', price: 1.99, category: 'Beverages', aliases: ['malt', 'malta'], cultural_names: [], emoji: '🍺' },

  // Canned Goods
  { id: 'tomato-paste-400g', name: 'Tomato Paste (Tin) 400g', price: 1.99, category: 'Canned Goods', aliases: ['tomato paste', 'tomato tin', 'tomatoe'], cultural_names: ['tomati'], emoji: '🍅' },
  { id: 'tomato-paste-800g', name: 'Tomato Paste (Tin) 800g', price: 3.49, category: 'Canned Goods', aliases: ['tomato big', 'large tomato'], cultural_names: [], emoji: '🍅' },

  // Fresh Produce
  { id: 'plantain-ripe', name: 'Plantain (Ripe) bunch', price: 4.99, category: 'Fresh Produce', aliases: ['plantain', 'ripe plantain', 'dodo'], cultural_names: ['ogede', 'dodo'], emoji: '🍌' },
  { id: 'plantain-green', name: 'Plantain (Green) bunch', price: 4.99, category: 'Fresh Produce', aliases: ['green plantain', 'unripe plantain'], cultural_names: ['ogede'], emoji: '🍌' },
  { id: 'onions-5kg', name: 'Onions 5kg', price: 6.99, category: 'Fresh Produce', aliases: ['onions', 'onion bag'], cultural_names: ['alubosa'], emoji: '🧅' },
  { id: 'fresh-pepper-500g', name: 'Fresh Pepper Mix 500g', price: 3.99, category: 'Fresh Produce', aliases: ['fresh pepper', 'pepper mix'], cultural_names: ['ata'], emoji: '🌶️' },

  // Snacks
  { id: 'chin-chin-500g', name: 'Chin Chin 500g', price: 4.99, category: 'Snacks', aliases: ['chin chin', 'chinchin'], cultural_names: [], emoji: '🍪' }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function generateOrderId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'ISH-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Generate a realistic timestamp N days ago, between 9am and 7pm */
function daysAgoRealistic(days, hour) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  // Set a realistic hour (9am-7pm) — use provided hour or pick one
  const h = hour !== undefined ? hour : 9 + Math.floor(Math.random() * 10);
  const m = Math.floor(Math.random() * 60);
  date.setHours(h, m, 0, 0);
  return date.toISOString();
}

/** Calculate order total from items, with optional small adjustment for realism */
function calcTotal(items, adjustment) {
  const raw = items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);
  // Apply adjustment (e.g. -0.07 to make £35.00 → £34.93)
  const adjusted = adjustment !== undefined ? raw + adjustment : raw;
  return Math.round(adjusted * 100) / 100;
}

// ============================================================================
// OLD PHONE NUMBERS (to delete)
// ============================================================================
const OLD_PHONES = [
  '+447700000001', '+447700000002', '+447700000003',
  '+447700000004', '+447700000005', '+447700000006'
];

// ============================================================================
// NEW PHONE NUMBERS
// ============================================================================
const PHONES = {
  bola:        '+447418293041',
  chidi:       '+447521384067',
  folake:      '+447632475182',
  mrsAdeyemi:  '+447734586291',
  tunde:       '+447845697302',
  amara:       '+447956708413',
};

// ============================================================================
// CLEANUP OLD TEST CUSTOMERS
// ============================================================================
async function cleanupOldCustomers() {
  console.log('\n🗑️  Cleaning up old test customers...');

  for (const phone of OLD_PHONES) {
    await runWrite(`
      MATCH (c:Customer {phone: $phone})
      OPTIONAL MATCH (c)-[:PLACED]->(o:Order)
      OPTIONAL MATCH (o)-[r:CONTAINS]->()
      DELETE r
      WITH c, o
      OPTIONAL MATCH (c)-[rel]-()
      DELETE rel
      WITH c, collect(o) AS orders
      FOREACH (o IN orders | DELETE o)
      DELETE c
    `, { phone });
  }

  // Also clean up new phones in case of re-run (idempotency)
  for (const phone of Object.values(PHONES)) {
    await runWrite(`
      MATCH (c:Customer {phone: $phone})
      OPTIONAL MATCH (c)-[:PLACED]->(o:Order)
      OPTIONAL MATCH (o)-[r:CONTAINS]->()
      DELETE r
      WITH c, o
      OPTIONAL MATCH (c)-[rel]-()
      DELETE rel
      WITH c, collect(o) AS orders
      FOREACH (o IN orders | DELETE o)
      DELETE c
    `, { phone });
  }

  console.log(`   ✅ Cleaned up ${OLD_PHONES.length} old + ${Object.keys(PHONES).length} new phone numbers`);
}

// ============================================================================
// PRODUCT SYNC
// ============================================================================
async function syncProducts() {
  console.log('\n📦 Syncing products to Neo4j...');

  for (const p of products) {
    await runWrite(`
      MERGE (p:Product {id: $id})
      SET p.name = $name,
          p.price = $price,
          p.category = $category,
          p.aliases = $aliases,
          p.cultural_names = $cultural_names,
          p.emoji = $emoji
    `, p);
  }

  console.log(`   ✅ Synced ${products.length} products`);
}

// ============================================================================
// CUSTOMER 1: BOLA OGUNDIMU - Weekly Regular (was "Mrs Adebayo")
// ============================================================================
async function seedBolaOgundimu() {
  const phone = PHONES.bola;
  console.log('\n👤 Creating Bola Ogundimu (Weekly Regular)...');

  await runWrite(`
    MERGE (c:Customer {phone: $phone})
    SET c.name = "Bola Ogundimu",
        c.email = "bola.ogundimu@gmail.com",
        c.postcode = "SE15 4QN",
        c.customer_type = "regular",
        c.created_at = $created
  `, { phone, created: daysAgoRealistic(90, 11) });

  // 6 weekly orders — varied slightly each week (real customers aren't identical)
  const weeklyOrders = [
    {
      // Week 1 (most recent) — standard shop
      items: [
        { productId: 'rice-10kg', quantity: 1 },
        { productId: 'tomato-paste-400g', quantity: 4 },
        { productId: 'palm-oil-1l', quantity: 2 },
        { productId: 'plantain-ripe', quantity: 2 },
        { productId: 'egusi-1kg', quantity: 1 }
      ],
      daysAgo: 7, hour: 10
    },
    {
      // Week 2 — same as usual
      items: [
        { productId: 'rice-10kg', quantity: 1 },
        { productId: 'tomato-paste-400g', quantity: 4 },
        { productId: 'palm-oil-1l', quantity: 2 },
        { productId: 'plantain-ripe', quantity: 2 },
        { productId: 'egusi-1kg', quantity: 1 }
      ],
      daysAgo: 14, hour: 11
    },
    {
      // Week 3 — added stockfish (extra item)
      items: [
        { productId: 'rice-10kg', quantity: 1 },
        { productId: 'tomato-paste-400g', quantity: 4 },
        { productId: 'palm-oil-1l', quantity: 2 },
        { productId: 'plantain-ripe', quantity: 2 },
        { productId: 'egusi-1kg', quantity: 1 },
        { productId: 'stockfish-medium', quantity: 1 }
      ],
      daysAgo: 21, hour: 14
    },
    {
      // Week 4 — standard (this one becomes USUAL_ORDER reference)
      items: [
        { productId: 'rice-10kg', quantity: 1 },
        { productId: 'tomato-paste-400g', quantity: 4 },
        { productId: 'palm-oil-1l', quantity: 2 },
        { productId: 'plantain-ripe', quantity: 2 },
        { productId: 'egusi-1kg', quantity: 1 }
      ],
      daysAgo: 28, hour: 10,
      delivery_notes: 'leave with neighbour if not in'
    },
    {
      // Week 5 — skipped plantain
      items: [
        { productId: 'rice-10kg', quantity: 1 },
        { productId: 'tomato-paste-400g', quantity: 3 },
        { productId: 'palm-oil-1l', quantity: 2 },
        { productId: 'egusi-1kg', quantity: 1 }
      ],
      daysAgo: 35, hour: 16
    },
    {
      // Week 6 — extra tomato paste (bought 5 instead of 4)
      items: [
        { productId: 'rice-10kg', quantity: 1 },
        { productId: 'tomato-paste-400g', quantity: 5 },
        { productId: 'palm-oil-1l', quantity: 2 },
        { productId: 'plantain-ripe', quantity: 2 },
        { productId: 'egusi-1kg', quantity: 1 }
      ],
      daysAgo: 42, hour: 12
    }
  ];

  let usualOrderId = null;

  for (let i = 0; i < weeklyOrders.length; i++) {
    const order = weeklyOrders[i];
    const orderId = generateOrderId();
    if (i === 3) usualOrderId = orderId; // Week 4 = reference for "usual"

    const total = calcTotal(order.items);

    const setClause = order.delivery_notes
      ? `SET o.channel = "whatsapp", o.status = "delivered", o.total = $total,
             o.created_at = $created, o.delivered_at = $delivered,
             o.delivery_notes = $notes`
      : `SET o.channel = "whatsapp", o.status = "delivered", o.total = $total,
             o.created_at = $created, o.delivered_at = $delivered`;

    await runWrite(`
      MATCH (c:Customer {phone: $phone})
      MERGE (o:Order {id: $orderId})
      ${setClause}
      MERGE (c)-[:PLACED]->(o)
    `, {
      phone,
      orderId,
      total,
      created: daysAgoRealistic(order.daysAgo, order.hour),
      delivered: daysAgoRealistic(order.daysAgo - 1, 15),
      notes: order.delivery_notes || null
    });

    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      await runWrite(`
        MATCH (o:Order {id: $orderId})
        MATCH (p:Product {id: $productId})
        MERGE (o)-[r:CONTAINS]->(p)
        SET r.quantity = $quantity, r.price = $price
      `, {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: product?.price || 0
      });
    }
  }

  // PREFERS relationships
  const preferences = [
    { productId: 'rice-10kg', frequency: 'weekly', typical_quantity: 1, preferred_size: '10kg' },
    { productId: 'tomato-paste-400g', frequency: 'weekly', typical_quantity: 4, preferred_size: '400g' },
    { productId: 'palm-oil-1l', frequency: 'weekly', typical_quantity: 2, preferred_size: '1L' },
    { productId: 'plantain-ripe', frequency: 'weekly', typical_quantity: 2, preferred_size: 'bunch' },
    { productId: 'egusi-1kg', frequency: 'weekly', typical_quantity: 1, preferred_size: '1kg' }
  ];

  for (const pref of preferences) {
    await runWrite(`
      MATCH (c:Customer {phone: $phone})
      MATCH (p:Product {id: $productId})
      MERGE (c)-[r:PREFERS]->(p)
      SET r.frequency = $frequency,
          r.typical_quantity = $quantity,
          r.preferred_size = $size,
          r.last_ordered = $lastOrdered
    `, {
      phone,
      productId: pref.productId,
      frequency: pref.frequency,
      quantity: pref.typical_quantity,
      size: pref.preferred_size,
      lastOrdered: daysAgoRealistic(7, 10)
    });
  }

  // USUAL_ORDER — confidence 0.82 (not a round number)
  if (usualOrderId) {
    await runWrite(`
      MATCH (c:Customer {phone: $phone})
      MATCH (o:Order {id: $orderId})
      MERGE (c)-[r:USUAL_ORDER]->(o)
      SET r.pattern_name = "weekly_shop",
          r.confidence = 0.82,
          r.last_matched = $lastMatched,
          r.times_ordered = 6
    `, {
      phone,
      orderId: usualOrderId,
      lastMatched: daysAgoRealistic(7, 10)
    });
  }

  console.log('   ✅ Bola Ogundimu created with 6 weekly orders (varied)');
}

// ============================================================================
// CUSTOMER 2: CHIDI NWOSU - Monthly Bulk Buyer (was "Brother Emeka")
// ============================================================================
async function seedChidiNwosu() {
  const phone = PHONES.chidi;
  console.log('\n👤 Creating Chidi Nwosu (Monthly Bulk)...');

  await runWrite(`
    MERGE (c:Customer {phone: $phone})
    SET c.name = "Chidi Nwosu",
        c.email = "chidi.nwosu@hotmail.co.uk",
        c.postcode = "E17 8PQ",
        c.customer_type = "bulk",
        c.created_at = $created,
        c.notes = "Runs a small kitchen in Walthamstow"
  `, { phone, created: daysAgoRealistic(120, 9) });

  // Order 1 (most recent): monthly bulk — slightly different from order 2
  const bulkOrder1Items = [
    { productId: 'rice-25kg', quantity: 2 },
    { productId: 'palm-oil-5l', quantity: 1 },
    { productId: 'tomato-paste-400g', quantity: 14 },
    { productId: 'chicken-whole', quantity: 6 }
  ];

  const bulkOrder1Id = generateOrderId();
  await runWrite(`
    MATCH (c:Customer {phone: $phone})
    MERGE (o:Order {id: $orderId})
    SET o.channel = "whatsapp",
        o.status = "delivered",
        o.total = $total,
        o.created_at = $created,
        o.delivery_notes = "for restaurant"
    MERGE (c)-[:PLACED]->(o)
  `, {
    phone,
    orderId: bulkOrder1Id,
    total: calcTotal(bulkOrder1Items, -0.13),
    created: daysAgoRealistic(30, 9)
  });

  for (const item of bulkOrder1Items) {
    const product = products.find(p => p.id === item.productId);
    await runWrite(`
      MATCH (o:Order {id: $orderId})
      MATCH (p:Product {id: $productId})
      MERGE (o)-[r:CONTAINS]->(p)
      SET r.quantity = $quantity, r.price = $price
    `, {
      orderId: bulkOrder1Id,
      productId: item.productId,
      quantity: item.quantity,
      price: product?.price || 0
    });
  }

  // Order 2: previous month bulk — slightly different quantities
  const bulkOrder2Items = [
    { productId: 'rice-25kg', quantity: 2 },
    { productId: 'palm-oil-5l', quantity: 1 },
    { productId: 'tomato-paste-400g', quantity: 10 },
    { productId: 'chicken-whole', quantity: 4 },
    { productId: 'onions-5kg', quantity: 1 }
  ];

  const bulkOrder2Id = generateOrderId();
  await runWrite(`
    MATCH (c:Customer {phone: $phone})
    MERGE (o:Order {id: $orderId})
    SET o.channel = "whatsapp",
        o.status = "delivered",
        o.total = $total,
        o.created_at = $created
    MERGE (c)-[:PLACED]->(o)
  `, {
    phone,
    orderId: bulkOrder2Id,
    total: calcTotal(bulkOrder2Items, 0.07),
    created: daysAgoRealistic(60, 10)
  });

  for (const item of bulkOrder2Items) {
    const product = products.find(p => p.id === item.productId);
    await runWrite(`
      MATCH (o:Order {id: $orderId})
      MATCH (p:Product {id: $productId})
      MERGE (o)-[r:CONTAINS]->(p)
      SET r.quantity = $quantity, r.price = $price
    `, {
      orderId: bulkOrder2Id,
      productId: item.productId,
      quantity: item.quantity,
      price: product?.price || 0
    });
  }

  // Order 3: New Year party order (not generic "December party")
  const partyItems = [
    { productId: 'rice-25kg', quantity: 3 },
    { productId: 'chin-chin-500g', quantity: 12 },
    { productId: 'malt-drink', quantity: 30 },
    { productId: 'chicken-whole', quantity: 10 },
    { productId: 'suya-spice-200g', quantity: 4 },
    { productId: 'onions-5kg', quantity: 2 }
  ];

  const partyOrderId = generateOrderId();
  await runWrite(`
    MATCH (c:Customer {phone: $phone})
    MERGE (o:Order {id: $orderId})
    SET o.channel = "whatsapp",
        o.status = "delivered",
        o.total = $total,
        o.created_at = $created,
        o.event_tag = "New Year party"
    MERGE (c)-[:PLACED]->(o)
  `, {
    phone,
    orderId: partyOrderId,
    total: calcTotal(partyItems, -0.23),
    created: daysAgoRealistic(55, 11)
  });

  for (const item of partyItems) {
    const product = products.find(p => p.id === item.productId);
    await runWrite(`
      MATCH (o:Order {id: $orderId})
      MATCH (p:Product {id: $productId})
      MERGE (o)-[r:CONTAINS]->(p)
      SET r.quantity = $quantity, r.price = $price
    `, {
      orderId: partyOrderId,
      productId: item.productId,
      quantity: item.quantity,
      price: product?.price || 0
    });
  }

  // USUAL_ORDER for monthly bulk
  await runWrite(`
    MATCH (c:Customer {phone: $phone})
    MATCH (o:Order {id: $orderId})
    MERGE (c)-[r:USUAL_ORDER]->(o)
    SET r.pattern_name = "monthly_bulk",
        r.confidence = 0.75,
        r.last_matched = $lastMatched,
        r.times_ordered = 2
  `, {
    phone,
    orderId: bulkOrder1Id,
    lastMatched: daysAgoRealistic(30, 9)
  });

  // USUAL_ORDER for party (event-tagged)
  await runWrite(`
    MATCH (c:Customer {phone: $phone})
    MATCH (o:Order {id: $orderId})
    MERGE (c)-[r:USUAL_ORDER]->(o)
    SET r.pattern_name = "event_order",
        r.confidence = 0.65,
        r.last_matched = $lastMatched,
        r.times_ordered = 1
  `, {
    phone,
    orderId: partyOrderId,
    lastMatched: daysAgoRealistic(55, 11)
  });

  console.log('   ✅ Chidi Nwosu created with 3 orders (2 bulk + 1 New Year party)');
}

// ============================================================================
// CUSTOMER 3: FOLAKE ADEYEMI - Meal-based orderer (was "Aunty Funke")
//   Mother: MRS ADEYEMI (was "Mama Funke")
// ============================================================================
async function seedFolakeAdeyemi() {
  const phoneFolake = PHONES.folake;
  const phoneMama = PHONES.mrsAdeyemi;
  console.log('\n👤 Creating Folake Adeyemi & Mrs Adeyemi (Family)...');

  // Create Folake
  await runWrite(`
    MERGE (c:Customer {phone: $phone})
    SET c.name = "Folake Adeyemi",
        c.email = "folake.adeyemi@yahoo.com",
        c.postcode = "N16 7UJ",
        c.customer_type = "meal_orderer",
        c.created_at = $created
  `, { phone: phoneFolake, created: daysAgoRealistic(100, 13) });

  // Create Mrs Adeyemi (mother)
  await runWrite(`
    MERGE (c:Customer {phone: $phone})
    SET c.name = "Mrs Adeyemi",
        c.email = "adeyemi.mama@outlook.com",
        c.postcode = "N16 5RE",
        c.customer_type = "regular",
        c.created_at = $created
  `, { phone: phoneMama, created: daysAgoRealistic(80, 10) });

  // RELATED_TO
  await runWrite(`
    MATCH (folake:Customer {phone: $phoneFolake})
    MATCH (mama:Customer {phone: $phoneMama})
    MERGE (folake)-[r:RELATED_TO]->(mama)
    SET r.relationship = "mother"
  `, { phoneFolake, phoneMama });

  // Folake's orders — 3 Saturdays + 1 Wednesday (breaking pattern)
  const mealOrders = [
    {
      // Saturday — Jollof Rice
      items: [
        { productId: 'rice-10kg', quantity: 1 },
        { productId: 'tomato-paste-400g', quantity: 4 },
        { productId: 'chicken-whole', quantity: 2 },
        { productId: 'onions-5kg', quantity: 1 },
        { productId: 'curry-500g', quantity: 1 }
      ],
      daysAgo: 8, hour: 10, meal_prep: 'Jollof Rice' // Saturday
    },
    {
      // Saturday — Egusi Soup
      items: [
        { productId: 'egusi-1kg', quantity: 1 },
        { productId: 'palm-oil-1l', quantity: 2 },
        { productId: 'stockfish-medium', quantity: 2 },
        { productId: 'crayfish-ground-500g', quantity: 1 },
        { productId: 'bitter-leaf-100g', quantity: 2 }
      ],
      daysAgo: 15, hour: 11, meal_prep: 'Egusi Soup' // Saturday
    },
    {
      // WEDNESDAY — Pepper Soup (breaking the Saturday pattern)
      items: [
        { productId: 'goat-meat-500g', quantity: 2 },
        { productId: 'scotch-bonnet-200g', quantity: 1 },
        { productId: 'scent-leaf-50g', quantity: 2 },
        { productId: 'cameroon-pepper-200g', quantity: 1 }
      ],
      daysAgo: 18, hour: 17, meal_prep: 'Pepper Soup' // Wednesday evening
    },
    {
      // Saturday — Fried Rice
      items: [
        { productId: 'rice-10kg', quantity: 1 },
        { productId: 'mixed-veg-500g', quantity: 2 },
        { productId: 'chicken-whole', quantity: 2 },
        { productId: 'curry-500g', quantity: 1 },
        { productId: 'thyme-100g', quantity: 1 }
      ],
      daysAgo: 29, hour: 9, meal_prep: 'Fried Rice' // Saturday
    }
  ];

  for (const order of mealOrders) {
    const orderId = generateOrderId();
    const total = calcTotal(order.items);

    await runWrite(`
      MATCH (c:Customer {phone: $phone})
      MERGE (o:Order {id: $orderId})
      SET o.channel = "whatsapp",
          o.status = "delivered",
          o.total = $total,
          o.created_at = $created,
          o.meal_prep = $mealPrep
      MERGE (c)-[:PLACED]->(o)
    `, {
      phone: phoneFolake,
      orderId,
      total,
      created: daysAgoRealistic(order.daysAgo, order.hour),
      mealPrep: order.meal_prep
    });

    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      await runWrite(`
        MATCH (o:Order {id: $orderId})
        MATCH (p:Product {id: $productId})
        MERGE (o)-[r:CONTAINS]->(p)
        SET r.quantity = $quantity, r.price = $price
      `, {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: product?.price || 0
      });
    }
  }

  // Mrs Adeyemi's orders — different tastes from Folake
  const mamaOrders = [
    {
      // Mama likes garri, stockfish head, egusi — traditional staples
      items: [
        { productId: 'garri-5kg', quantity: 1 },
        { productId: 'palm-oil-1l', quantity: 1 },
        { productId: 'egusi-1kg', quantity: 1 },
        { productId: 'stockfish-head', quantity: 2 }
      ],
      daysAgo: 20, hour: 14
    },
    {
      // Mama also orders yam flour and ogbono — things Folake doesn't order
      items: [
        { productId: 'yam-flour-2kg', quantity: 2 },
        { productId: 'ogbono-500g', quantity: 1 },
        { productId: 'dried-catfish', quantity: 2 },
        { productId: 'locust-beans-200g', quantity: 1 }
      ],
      daysAgo: 50, hour: 11
    }
  ];

  for (const order of mamaOrders) {
    const orderId = generateOrderId();
    const total = calcTotal(order.items);

    await runWrite(`
      MATCH (c:Customer {phone: $phone})
      MERGE (o:Order {id: $orderId})
      SET o.channel = "whatsapp",
          o.status = "delivered",
          o.total = $total,
          o.created_at = $created
      MERGE (c)-[:PLACED]->(o)
    `, {
      phone: phoneMama,
      orderId,
      total,
      created: daysAgoRealistic(order.daysAgo, order.hour)
    });

    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      await runWrite(`
        MATCH (o:Order {id: $orderId})
        MATCH (p:Product {id: $productId})
        MERGE (o)-[r:CONTAINS]->(p)
        SET r.quantity = $quantity, r.price = $price
      `, {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: product?.price || 0
      });
    }
  }

  console.log('   ✅ Folake Adeyemi (4 orders) + Mrs Adeyemi (2 orders) created');
}

// ============================================================================
// CUSTOMER 4: TUNDE ABIOLA - Price-sensitive (was "Mr Okafor")
// ============================================================================
async function seedTundeAbiola() {
  const phone = PHONES.tunde;
  console.log('\n👤 Creating Tunde Abiola (Price-sensitive)...');

  await runWrite(`
    MERGE (c:Customer {phone: $phone})
    SET c.name = "Tunde Abiola",
        c.email = "tunde.abiola@gmail.com",
        c.postcode = "SW9 8LT",
        c.customer_type = "budget",
        c.created_at = $created,
        c.notes = "Complained small rice was too little - prefers 5kg minimum"
  `, { phone, created: daysAgoRealistic(60, 15) });

  // 3 orders showing gradually increasing spend: £28ish, £32ish, £38ish
  const budgetOrders = [
    {
      // Most recent — growing trust, spending £38ish
      items: [
        { productId: 'rice-5kg', quantity: 1 },
        { productId: 'tomato-paste-400g', quantity: 3 },
        { productId: 'garri-2kg', quantity: 1 },
        { productId: 'palm-oil-1l', quantity: 1 },
        { productId: 'maggi-100', quantity: 1 }
      ],
      daysAgo: 15, hour: 18,
      totalOverride: 38.93 // manually set for realistic odd total
    },
    {
      // Middle — £32ish
      items: [
        { productId: 'rice-5kg', quantity: 1 },
        { productId: 'black-eyed-beans-5kg', quantity: 1 },
        { productId: 'tomato-paste-400g', quantity: 2 },
        { productId: 'onions-5kg', quantity: 1 }
      ],
      daysAgo: 35, hour: 13,
      totalOverride: 32.46
    },
    {
      // First order — cautious, £28ish, asked "Can I pay on delivery?"
      items: [
        { productId: 'rice-5kg', quantity: 1 },
        { productId: 'egusi-1kg', quantity: 1 },
        { productId: 'stockfish-head', quantity: 1 },
        { productId: 'palm-oil-1l', quantity: 1 }
      ],
      daysAgo: 55, hour: 12,
      totalOverride: 28.47,
      delivery_notes: 'Can I pay on delivery?'
    }
  ];

  for (const order of budgetOrders) {
    const orderId = generateOrderId();
    const total = order.totalOverride || calcTotal(order.items);

    const setClause = order.delivery_notes
      ? `SET o.channel = "whatsapp", o.status = "delivered", o.total = $total,
             o.created_at = $created, o.delivery_notes = $notes`
      : `SET o.channel = "whatsapp", o.status = "delivered", o.total = $total,
             o.created_at = $created`;

    await runWrite(`
      MATCH (c:Customer {phone: $phone})
      MERGE (o:Order {id: $orderId})
      ${setClause}
      MERGE (c)-[:PLACED]->(o)
    `, {
      phone,
      orderId,
      total,
      created: daysAgoRealistic(order.daysAgo, order.hour),
      notes: order.delivery_notes || null
    });

    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      await runWrite(`
        MATCH (o:Order {id: $orderId})
        MATCH (p:Product {id: $productId})
        MERGE (o)-[r:CONTAINS]->(p)
        SET r.quantity = $quantity, r.price = $price
      `, {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: product?.price || 0
      });
    }
  }

  // PREFERS for rice with preferred_size: "5kg"
  await runWrite(`
    MATCH (c:Customer {phone: $phone})
    MATCH (p:Product {id: "rice-5kg"})
    MERGE (c)-[r:PREFERS]->(p)
    SET r.frequency = "monthly",
        r.typical_quantity = 1,
        r.preferred_size = "5kg",
        r.last_ordered = $lastOrdered
  `, { phone, lastOrdered: daysAgoRealistic(15, 18) });

  console.log('   ✅ Tunde Abiola created with 3 budget orders (£28→£32→£38 growth)');
}

// ============================================================================
// CUSTOMER 5: AMARA EZE - Quick orders via short messages (was "Bisi")
// ============================================================================
async function seedAmaraEze() {
  const phone = PHONES.amara;
  console.log('\n👤 Creating Amara Eze (Quick orders)...');

  await runWrite(`
    MERGE (c:Customer {phone: $phone})
    SET c.name = "Amara Eze",
        c.email = "amara.eze@icloud.com",
        c.postcode = "E1 6AN",
        c.customer_type = "tech_savvy",
        c.created_at = $created
  `, { phone, created: daysAgoRealistic(45, 19) });

  // Quick orders — small, frequent, emoji-style
  const quickOrders = [
    {
      // Most recent — ordered for herself
      items: [
        { productId: 'plantain-ripe', quantity: 3 },
        { productId: 'palm-oil-1l', quantity: 1 },
        { productId: 'scotch-bonnet-200g', quantity: 1 }
      ],
      daysAgo: 5, hour: 18
    },
    {
      // Second order — for herself
      items: [
        { productId: 'garri-2kg', quantity: 1 },
        { productId: 'egusi-1kg', quantity: 1 },
        { productId: 'crayfish-ground-500g', quantity: 1 }
      ],
      daysAgo: 18, hour: 12
    },
    {
      // Third order — "same as Bola's usual" (cross-reference)
      // She ordered what Bola normally gets
      items: [
        { productId: 'rice-10kg', quantity: 1 },
        { productId: 'tomato-paste-400g', quantity: 4 },
        { productId: 'palm-oil-1l', quantity: 2 },
        { productId: 'plantain-ripe', quantity: 2 },
        { productId: 'egusi-1kg', quantity: 1 }
      ],
      daysAgo: 30, hour: 15,
      delivery_notes: 'ordered for a friend - same as Bola Ogundimu usual'
    }
  ];

  for (const order of quickOrders) {
    const orderId = generateOrderId();
    const total = calcTotal(order.items);

    const setClause = order.delivery_notes
      ? `SET o.channel = "whatsapp", o.status = "delivered", o.total = $total,
             o.created_at = $created, o.delivery_notes = $notes`
      : `SET o.channel = "whatsapp", o.status = "delivered", o.total = $total,
             o.created_at = $created`;

    await runWrite(`
      MATCH (c:Customer {phone: $phone})
      MERGE (o:Order {id: $orderId})
      ${setClause}
      MERGE (c)-[:PLACED]->(o)
    `, {
      phone,
      orderId,
      total,
      created: daysAgoRealistic(order.daysAgo, order.hour),
      notes: order.delivery_notes || null
    });

    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      await runWrite(`
        MATCH (o:Order {id: $orderId})
        MATCH (p:Product {id: $productId})
        MERGE (o)-[r:CONTAINS]->(p)
        SET r.quantity = $quantity, r.price = $price
      `, {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: product?.price || 0
      });
    }
  }

  console.log('   ✅ Amara Eze created with 3 quick orders (1 cross-reference to Bola)');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function seedTestCustomers() {
  console.log('🌱 Àpínlẹ̀rọ Knowledge Graph - Test Customer Seeder\n');
  console.log('━'.repeat(60));

  const connected = await verifyConnection();
  if (!connected) {
    console.error('❌ Cannot connect to Neo4j. Check your .env configuration.');
    process.exit(1);
  }

  try {
    await cleanupOldCustomers();
    await syncProducts();
    await seedBolaOgundimu();
    await seedChidiNwosu();
    await seedFolakeAdeyemi();
    await seedTundeAbiola();
    await seedAmaraEze();

    console.log('\n' + '━'.repeat(60));
    console.log('\n📊 Seeding Summary:');
    console.log('   Products: 60+');
    console.log('   Customers: 6 (5 test + 1 related)');
    console.log('   Orders: 18 total');
    console.log('   PREFERS relationships: 6');
    console.log('   USUAL_ORDER relationships: 3');
    console.log('   RELATED_TO relationships: 1');
    console.log('\n   Customer mapping (old → new):');
    console.log('   Mrs Adebayo    → Bola Ogundimu  (+447418293041)');
    console.log('   Brother Emeka  → Chidi Nwosu     (+447521384067)');
    console.log('   Aunty Funke    → Folake Adeyemi  (+447632475182)');
    console.log('   Mama Funke     → Mrs Adeyemi     (+447734586291)');
    console.log('   Mr Okafor      → Tunde Abiola    (+447845697302)');
    console.log('   Bisi           → Amara Eze       (+447956708413)');

    console.log('\n✅ Test customer seeding complete.\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    throw error;
  } finally {
    await closeDriver();
  }
}

seedTestCustomers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
