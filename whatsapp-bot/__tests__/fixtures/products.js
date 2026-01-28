// Test product catalog for Apinlero tests
export const testProducts = [
  {
    id: 'prod-palm-oil-001',
    business_id: 'test-business-001',
    name: 'Palm Oil 5L',
    description: 'Premium quality red palm oil, 5 liter bottle',
    price: 12.99,
    unit: 'bottle',
    category: 'Oils & Spices',
    is_active: true,
    stock_quantity: 50,
    low_stock_threshold: 10,
    yoruba_name: 'Epo Pupa',
    sku: 'OIL-PALM-5L',
    image_url: 'https://test.supabase.co/storage/v1/object/public/products/palm-oil.jpg'
  },
  {
    id: 'prod-egusi-001',
    business_id: 'test-business-001',
    name: 'Egusi Seeds',
    description: 'Ground egusi (melon seeds) for soup, 500g bag',
    price: 8.50,
    unit: 'bag',
    category: 'Soups & Stews',
    is_active: true,
    stock_quantity: 30,
    low_stock_threshold: 5,
    yoruba_name: 'Egusi',
    sku: 'SEED-EGUSI-500G',
    image_url: 'https://test.supabase.co/storage/v1/object/public/products/egusi.jpg'
  },
  {
    id: 'prod-scotch-bonnet-001',
    business_id: 'test-business-001',
    name: 'Scotch Bonnet Peppers',
    description: 'Fresh scotch bonnet peppers, 250g pack',
    price: 3.99,
    unit: 'pack',
    category: 'Fresh Produce',
    is_active: true,
    stock_quantity: 20,
    low_stock_threshold: 5,
    yoruba_name: 'Ata Rodo',
    sku: 'VEG-PEPPER-SCOTCH-250G',
    image_url: 'https://test.supabase.co/storage/v1/object/public/products/scotch-bonnet.jpg'
  },
  {
    id: 'prod-plantain-001',
    business_id: 'test-business-001',
    name: 'Plantain (Green)',
    description: 'Fresh green plantains, per bunch',
    price: 2.99,
    unit: 'bunch',
    category: 'Fresh Produce',
    is_active: true,
    stock_quantity: 40,
    low_stock_threshold: 10,
    yoruba_name: 'Ogede',
    sku: 'FRUIT-PLANTAIN-GREEN',
    image_url: 'https://test.supabase.co/storage/v1/object/public/products/plantain.jpg'
  },
  {
    id: 'prod-tomatoes-001',
    business_id: 'test-business-001',
    name: 'Fresh Tomatoes',
    description: 'Fresh Roma tomatoes, 1kg bag',
    price: 4.50,
    unit: 'kg',
    category: 'Fresh Produce',
    is_active: true,
    stock_quantity: 25,
    low_stock_threshold: 5,
    yoruba_name: 'Ata',
    sku: 'VEG-TOMATO-1KG',
    image_url: 'https://test.supabase.co/storage/v1/object/public/products/tomatoes.jpg'
  },
  {
    id: 'prod-onions-001',
    business_id: 'test-business-001',
    name: 'Red Onions',
    description: 'Fresh red onions, 1kg bag',
    price: 2.99,
    unit: 'kg',
    category: 'Fresh Produce',
    is_active: true,
    stock_quantity: 35,
    low_stock_threshold: 10,
    yoruba_name: 'Alubosa',
    sku: 'VEG-ONION-RED-1KG',
    image_url: 'https://test.supabase.co/storage/v1/object/public/products/onions.jpg'
  },
  {
    id: 'prod-yam-001',
    business_id: 'test-business-001',
    name: 'Yam Tuber',
    description: 'Fresh yam tuber, per piece',
    price: 15.99,
    unit: 'piece',
    category: 'Root Vegetables',
    is_active: true,
    stock_quantity: 15,
    low_stock_threshold: 3,
    yoruba_name: 'Isu',
    sku: 'VEG-YAM-TUBER',
    image_url: 'https://test.supabase.co/storage/v1/object/public/products/yam.jpg'
  },
  {
    id: 'prod-bell-peppers-001',
    business_id: 'test-business-001',
    name: 'Red Bell Peppers',
    description: 'Fresh red bell peppers, 500g pack',
    price: 3.50,
    unit: 'pack',
    category: 'Fresh Produce',
    is_active: true,
    stock_quantity: 18,
    low_stock_threshold: 5,
    yoruba_name: 'Tatase',
    sku: 'VEG-PEPPER-BELL-500G',
    image_url: 'https://test.supabase.co/storage/v1/object/public/products/bell-peppers.jpg'
  },
  {
    id: 'prod-out-of-stock-001',
    business_id: 'test-business-001',
    name: 'Garri White',
    description: 'White garri for eba, 1kg pack',
    price: 5.99,
    unit: 'pack',
    category: 'Staples',
    is_active: true,
    stock_quantity: 0,
    low_stock_threshold: 5,
    yoruba_name: 'Garri',
    sku: 'STAPLE-GARRI-WHITE-1KG',
    image_url: 'https://test.supabase.co/storage/v1/object/public/products/garri.jpg'
  },
  {
    id: 'prod-rice-001',
    business_id: 'test-business-001',
    name: 'Rice',
    description: 'Premium long grain rice, 5kg bag',
    price: 18.99,
    unit: 'bag',
    category: 'Staples',
    is_active: true,
    stock_quantity: 40,
    low_stock_threshold: 10,
    yoruba_name: 'Iresi',
    sku: 'STAPLE-RICE-5KG',
    image_url: 'https://test.supabase.co/storage/v1/object/public/products/rice.jpg'
  }
];

// Test customer data
export const testCustomers = [
  {
    id: 'cust-001',
    business_id: 'test-business-001',
    phone: '+447448682282',
    name: 'Test Customer',
    email: 'test@example.com',
    address: '123 Test Street',
    city: 'London',
    postcode: 'SE15 4AA',
    is_active: true
  },
  {
    id: 'cust-002',
    business_id: 'test-business-001',
    phone: '+447700900123',
    name: 'Isha Customer',
    email: 'isha@example.com',
    address: '456 Sample Road',
    city: 'London',
    postcode: 'E1 6AN',
    is_active: true
  }
];

// Test business data
export const testBusinesses = [
  {
    id: 'test-business-001',
    name: "Isha's Treat & Groceries",
    slug: 'ishas-treat',
    owner_email: 'owner@ishastreat.com',
    phone: '+447123456789',
    address: '789 Business Street',
    city: 'London',
    postcode: 'SW1A 1AA',
    country: 'UK',
    currency: 'GBP',
    timezone: 'Europe/London',
    plan: 'starter',
    monthly_message_limit: 1000,
    messages_used_this_month: 50,
    is_active: true
  }
];

// Test WhatsApp configurations
export const testWhatsAppConfigs = [
  {
    id: 'config-001',
    business_id: 'test-business-001',
    provider: 'twilio',
    twilio_account_sid: 'ACtest_account_sid',
    twilio_auth_token: 'test_auth_token',
    twilio_whatsapp_number: 'whatsapp:+14155238886',
    display_phone_number: '+14155238886',
    business_name: "Isha's Treat",
    webhook_verify_token: 'test_verify_token_123',
    is_verified: true,
    is_active: true
  }
];

// Helper function to create a custom product
export const createTestProduct = (overrides = {}) => ({
  id: `prod-${Math.random().toString(36).substring(7)}`,
  business_id: 'test-business-001',
  name: 'Test Product',
  description: 'Test product description',
  price: 9.99,
  unit: 'piece',
  category: 'Test Category',
  is_active: true,
  stock_quantity: 100,
  low_stock_threshold: 10,
  sku: `TEST-${Date.now()}`,
  ...overrides
});

// Helper function to create a custom customer
export const createTestCustomer = (overrides = {}) => ({
  id: `cust-${Math.random().toString(36).substring(7)}`,
  business_id: 'test-business-001',
  phone: '+447700900000',
  name: 'Test Customer',
  is_active: true,
  ...overrides
});
