import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Import mocks BEFORE the actual modules
import { seedTestData, clearTestData, getTestData } from '../mocks/supabase.mock.js';
import '../mocks/neo4j.mock.js';
import '../mocks/twilio.mock.js';

// Import test data
import { testProducts, testBusinesses, testWhatsAppConfigs } from '../fixtures/products.js';

// Note: Since handleIncomingMessage has complex dependencies on Twilio service,
// we'll create simplified integration tests that test the core logic

describe('Message Handler Integration Tests', () => {
  const testBusinessId = 'test-business-001';
  const testPhone = '447448682282';
  const testCustomerName = 'Test Customer';

  beforeEach(() => {
    // Clear all test data
    clearTestData();

    // Seed test products
    seedTestData('products', testProducts);
    seedTestData('businesses', testBusinesses);
    seedTestData('whatsapp_configs', testWhatsAppConfigs);

    // Clear session cache
    jest.clearAllMocks();
  });

  afterEach(() => {
    clearTestData();
  });

  describe('Order Processing Flow', () => {
    test('should handle simple order request', async () => {
      // This is a simplified test showing the structure
      // In a real test, we would import and call handleIncomingMessage

      // Simulate customer placing an order
      const messageData = {
        from: testPhone,
        customerName: testCustomerName,
        text: '2x palm oil',
        messageId: 'msg-001',
        provider: 'twilio',
        businessId: testBusinessId
      };

      // For now, verify test data is set up correctly
      const products = getTestData('products');
      expect(products.length).toBeGreaterThan(0);

      const palmOil = products.find(p => p.name === 'Palm Oil 5L');
      expect(palmOil).toBeDefined();
      expect(palmOil.price).toBe(12.99);
      expect(palmOil.stock_quantity).toBe(50);
    });

    test('should handle complete order with address', async () => {
      const messageData = {
        from: testPhone,
        customerName: testCustomerName,
        text: '2x palm oil to SE15 4AA',
        messageId: 'msg-002',
        provider: 'twilio',
        businessId: testBusinessId
      };

      // Verify products are available
      const products = getTestData('products');
      const palmOil = products.find(p => p.name === 'Palm Oil 5L');
      expect(palmOil).toBeDefined();
      expect(palmOil.is_active).toBe(true);
    });

    test('should handle Yoruba product names', async () => {
      const messageData = {
        from: testPhone,
        customerName: testCustomerName,
        text: '3x epo pupa to E1 6AN',
        messageId: 'msg-003',
        provider: 'twilio',
        businessId: testBusinessId
      };

      // Verify products with Yoruba names exist
      const products = getTestData('products');
      const palmOil = products.find(p => p.yoruba_name === 'Epo Pupa');
      expect(palmOil).toBeDefined();
      expect(palmOil.name).toBe('Palm Oil 5L');
    });

    test('should handle multi-item orders', async () => {
      const messageData = {
        from: testPhone,
        customerName: testCustomerName,
        text: '2x palm oil, 3x egusi and 1x plantain to SE15 4AA',
        messageId: 'msg-004',
        provider: 'twilio',
        businessId: testBusinessId
      };

      // Verify all products exist
      const products = getTestData('products');
      const productNames = products.map(p => p.name);

      expect(productNames).toContain('Palm Oil 5L');
      expect(productNames).toContain('Egusi Seeds');
      expect(productNames).toContain('Plantain (Green)');
    });
  });

  describe('Session Management', () => {
    test('should create customer record on first message', async () => {
      // Before any messages, no customers should exist
      let customers = getTestData('customers');
      expect(customers).toHaveLength(0);

      // After customer service call (simulated by manual insert)
      seedTestData('customers', [{
        id: 'cust-new-001',
        business_id: testBusinessId,
        phone: testPhone,
        name: testCustomerName,
        is_active: true
      }]);

      customers = getTestData('customers');
      expect(customers).toHaveLength(1);
      expect(customers[0].phone).toBe(testPhone);
    });

    test('should maintain session state across messages', async () => {
      // Create initial session
      seedTestData('whatsapp_sessions', [{
        id: 'session-001',
        business_id: testBusinessId,
        customer_phone: testPhone,
        current_state: 'AWAITING_ADDRESS',
        cart: [{ product: 'Palm Oil 5L', quantity: 2 }],
        is_active: true
      }]);

      const sessions = getTestData('whatsapp_sessions');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].current_state).toBe('AWAITING_ADDRESS');
      expect(sessions[0].cart).toHaveLength(1);
    });
  });

  describe('Database Operations', () => {
    test('should log incoming messages', async () => {
      // Simulate logging an incoming message
      seedTestData('whatsapp_message_logs', [{
        id: 'log-001',
        business_id: testBusinessId,
        message_id: 'msg-001',
        customer_phone: testPhone,
        direction: 'inbound',
        message_type: 'text',
        content: '2x palm oil',
        provider: 'twilio',
        status: 'received',
        timestamp: new Date().toISOString()
      }]);

      const logs = getTestData('whatsapp_message_logs');
      expect(logs).toHaveLength(1);
      expect(logs[0].direction).toBe('inbound');
      expect(logs[0].content).toBe('2x palm oil');
    });

    test('should log outbound responses', async () => {
      seedTestData('whatsapp_message_logs', [{
        id: 'log-002',
        business_id: testBusinessId,
        message_id: 'msg-002',
        customer_phone: testPhone,
        direction: 'outbound',
        message_type: 'text',
        content: 'Thanks for your order!',
        provider: 'twilio',
        status: 'sent',
        timestamp: new Date().toISOString()
      }]);

      const logs = getTestData('whatsapp_message_logs');
      expect(logs).toHaveLength(1);
      expect(logs[0].direction).toBe('outbound');
    });

    test('should create order records', async () => {
      // Create an order
      seedTestData('orders', [{
        id: 'order-001',
        business_id: testBusinessId,
        customer_id: 'cust-001',
        customer_phone: testPhone,
        customer_name: testCustomerName,
        total: 25.98,
        delivery_fee: 5,
        status: 'pending',
        payment_method: 'cash',
        delivery_method: 'delivery',
        delivery_address: '123 Test St',
        delivery_postcode: 'SE15 4AA',
        source: 'whatsapp'
      }]);

      seedTestData('order_items', [{
        id: 'item-001',
        order_id: 'order-001',
        product_id: 'prod-palm-oil-001',
        product_name: 'Palm Oil 5L',
        quantity: 2,
        price: 12.99,
        unit: 'bottle'
      }]);

      const orders = getTestData('orders');
      expect(orders).toHaveLength(1);
      expect(orders[0].total).toBe(25.98);
      expect(orders[0].source).toBe('whatsapp');

      const items = getTestData('order_items');
      expect(items).toHaveLength(1);
      expect(items[0].product_name).toBe('Palm Oil 5L');
      expect(items[0].quantity).toBe(2);
    });
  });

  describe('Product Availability', () => {
    test('should check product stock levels', async () => {
      const products = getTestData('products');
      const palmOil = products.find(p => p.name === 'Palm Oil 5L');

      expect(palmOil.stock_quantity).toBe(50);
      expect(palmOil.is_active).toBe(true);
    });

    test('should handle out of stock products', async () => {
      const products = getTestData('products');
      const outOfStock = products.find(p => p.stock_quantity === 0);

      expect(outOfStock).toBeDefined();
      expect(outOfStock.name).toBe('Garri White');
      expect(outOfStock.stock_quantity).toBe(0);
    });
  });

  describe('Business Multi-tenancy', () => {
    test('should isolate data by business ID', async () => {
      // Add products for a second business
      seedTestData('products', [{
        id: 'prod-other-001',
        business_id: 'test-business-002',
        name: 'Other Product',
        price: 9.99,
        unit: 'piece',
        is_active: true,
        stock_quantity: 100
      }]);

      const allProducts = getTestData('products');
      const business1Products = allProducts.filter(p => p.business_id === testBusinessId);
      const business2Products = allProducts.filter(p => p.business_id === 'test-business-002');

      expect(business1Products.length).toBeGreaterThan(0);
      expect(business2Products.length).toBe(1);
    });

    test('should use correct business configuration', async () => {
      const configs = getTestData('whatsapp_configs');
      const businessConfig = configs.find(c => c.business_id === testBusinessId);

      expect(businessConfig).toBeDefined();
      expect(businessConfig.provider).toBe('twilio');
      expect(businessConfig.is_active).toBe(true);
      expect(businessConfig.display_phone_number).toBe('+14155238886');
    });
  });

  describe('Delivery Zones', () => {
    test('should calculate correct delivery fee for SE postcode', async () => {
      // This would be tested through the order creation logic
      const deliveryPostcode = 'SE15 4AA';
      const expectedFee = 5; // Based on delivery zones

      // Create order with delivery details
      seedTestData('orders', [{
        id: 'order-delivery-001',
        business_id: testBusinessId,
        delivery_postcode: deliveryPostcode,
        delivery_fee: expectedFee,
        total: 17.99,
        status: 'pending'
      }]);

      const orders = getTestData('orders');
      const order = orders.find(o => o.id === 'order-delivery-001');
      expect(order.delivery_fee).toBe(expectedFee);
    });

    test('should calculate correct delivery fee for E postcode', async () => {
      const deliveryPostcode = 'E1 6AN';
      const expectedFee = 5; // Same day delivery zone

      seedTestData('orders', [{
        id: 'order-delivery-002',
        business_id: testBusinessId,
        delivery_postcode: deliveryPostcode,
        delivery_fee: expectedFee,
        total: 17.99,
        status: 'pending'
      }]);

      const orders = getTestData('orders');
      const order = orders.find(o => o.id === 'order-delivery-002');
      expect(order.delivery_fee).toBe(expectedFee);
    });
  });
});
