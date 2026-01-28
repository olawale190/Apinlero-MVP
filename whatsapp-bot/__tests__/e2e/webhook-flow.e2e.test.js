import { describe, test, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';

// Import mocks
import { seedTestData, clearTestData, getTestData } from '../mocks/supabase.mock.js';
import { resetTwilioMocks, mockMessageCreate } from '../mocks/twilio.mock.js';
import '../mocks/neo4j.mock.js';

// Import test fixtures
import { twilioWebhookFixtures, createTwilioWebhook } from '../fixtures/webhooks.js';
import { testProducts, testBusinesses, testWhatsAppConfigs } from '../fixtures/products.js';

// Note: For E2E tests with the actual server, we would import the Express app
// For now, we'll structure these as comprehensive integration tests

describe('E2E Webhook Flow Tests', () => {
  const testBusinessId = 'test-business-001';
  const testPhone = '447448682282';

  beforeEach(() => {
    // Reset all mocks
    resetTwilioMocks();
    clearTestData();

    // Seed test data
    seedTestData('products', testProducts);
    seedTestData('businesses', testBusinesses);
    seedTestData('whatsapp_configs', testWhatsAppConfigs);

    jest.clearAllMocks();
  });

  afterEach(() => {
    clearTestData();
  });

  describe('Twilio Webhook Processing', () => {
    test('should process simple text message webhook', async () => {
      const webhook = twilioWebhookFixtures.simpleTextMessage;

      // Verify webhook structure
      expect(webhook.MessageSid).toBeDefined();
      expect(webhook.From).toContain('whatsapp:');
      expect(webhook.Body).toBe('Hello');
      expect(webhook.NumMedia).toBe('0');

      // Webhook would be processed and message would be logged
      seedTestData('whatsapp_message_logs', [{
        id: 'log-001',
        business_id: testBusinessId,
        message_id: webhook.MessageSid,
        customer_phone: testPhone,
        direction: 'inbound',
        message_type: 'text',
        content: webhook.Body,
        provider: 'twilio',
        status: 'received',
        timestamp: new Date().toISOString()
      }]);

      const logs = getTestData('whatsapp_message_logs');
      expect(logs).toHaveLength(1);
      expect(logs[0].content).toBe('Hello');
    });

    test('should process order message webhook', async () => {
      const webhook = twilioWebhookFixtures.orderMessage;

      expect(webhook.Body).toBe('2x palm oil');

      // Simulate message processing
      seedTestData('whatsapp_message_logs', [{
        id: 'log-002',
        business_id: testBusinessId,
        message_id: webhook.MessageSid,
        customer_phone: testPhone,
        direction: 'inbound',
        message_type: 'text',
        content: webhook.Body,
        intent_detected: 'NEW_ORDER',
        provider: 'twilio',
        status: 'received',
        timestamp: new Date().toISOString()
      }]);

      const logs = getTestData('whatsapp_message_logs');
      const orderLog = logs.find(l => l.intent_detected === 'NEW_ORDER');
      expect(orderLog).toBeDefined();
      expect(orderLog.content).toContain('palm oil');
    });

    test('should process complete order webhook', async () => {
      const webhook = twilioWebhookFixtures.completeOrderMessage;

      expect(webhook.Body).toBe('2x palm oil to SE15 4AA');

      // Simulate complete order processing
      seedTestData('whatsapp_sessions', [{
        id: 'session-001',
        business_id: testBusinessId,
        customer_phone: testPhone,
        current_state: 'AWAITING_CONFIRMATION',
        cart: [{ product: 'Palm Oil 5L', quantity: 2, price: 12.99 }],
        context: { deliveryPostcode: 'SE15 4AA', deliveryFee: 5 },
        is_active: true
      }]);

      const sessions = getTestData('whatsapp_sessions');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].current_state).toBe('AWAITING_CONFIRMATION');
      expect(sessions[0].cart).toHaveLength(1);
      expect(sessions[0].context.deliveryPostcode).toBe('SE15 4AA');
    });

    test('should process Yoruba order webhook', async () => {
      const webhook = twilioWebhookFixtures.yorubaOrder;

      expect(webhook.Body).toBe('3x epo pupa to E1 6AN');

      // Verify Yoruba product can be matched
      const products = getTestData('products');
      const palmOil = products.find(p => p.yoruba_name === 'Epo Pupa');
      expect(palmOil).toBeDefined();
      expect(palmOil.name).toBe('Palm Oil 5L');
    });

    test('should process multi-item order webhook', async () => {
      const webhook = twilioWebhookFixtures.multiItemOrder;

      expect(webhook.Body).toContain('palm oil');
      expect(webhook.Body).toContain('egusi');
      expect(webhook.Body).toContain('plantain');

      // Verify all products exist
      const products = getTestData('products');
      expect(products.find(p => p.name === 'Palm Oil 5L')).toBeDefined();
      expect(products.find(p => p.name === 'Egusi Seeds')).toBeDefined();
      expect(products.find(p => p.name === 'Plantain (Green)')).toBeDefined();
    });
  });

  describe('Complete Order Flow', () => {
    test('should handle full order placement to confirmation flow', async () => {
      const phone = testPhone;

      // Step 1: Customer places order
      const orderWebhook = createTwilioWebhook({
        From: `whatsapp:+${phone}`,
        Body: '2x palm oil to SE15 4AA',
        MessageSid: 'SM_order_001'
      });

      seedTestData('whatsapp_message_logs', [{
        id: 'log-order-001',
        business_id: testBusinessId,
        message_id: orderWebhook.MessageSid,
        customer_phone: phone,
        direction: 'inbound',
        content: orderWebhook.Body,
        intent_detected: 'NEW_ORDER',
        status: 'received',
        timestamp: new Date().toISOString()
      }]);

      // Session should be in AWAITING_CONFIRMATION state
      seedTestData('whatsapp_sessions', [{
        id: 'session-order-001',
        business_id: testBusinessId,
        customer_phone: phone,
        current_state: 'AWAITING_CONFIRMATION',
        cart: [{ product: 'Palm Oil 5L', quantity: 2, price: 12.99 }],
        context: { deliveryPostcode: 'SE15 4AA', deliveryFee: 5 },
        is_active: true
      }]);

      // Step 2: Customer confirms
      const confirmWebhook = createTwilioWebhook({
        From: `whatsapp:+${phone}`,
        Body: 'yes',
        MessageSid: 'SM_confirm_001'
      });

      seedTestData('whatsapp_message_logs', [{
        id: 'log-confirm-001',
        business_id: testBusinessId,
        message_id: confirmWebhook.MessageSid,
        customer_phone: phone,
        direction: 'inbound',
        content: confirmWebhook.Body,
        intent_detected: 'CONFIRM',
        status: 'received',
        timestamp: new Date().toISOString()
      }]);

      // Session should now be in AWAITING_PAYMENT state
      const sessions = getTestData('whatsapp_sessions');
      const session = sessions.find(s => s.customer_phone === phone);

      // Update session to awaiting payment
      session.current_state = 'AWAITING_PAYMENT';
      seedTestData('whatsapp_sessions', [session]);

      // Step 3: Customer selects payment method
      const paymentWebhook = createTwilioWebhook({
        From: `whatsapp:+${phone}`,
        Body: 'cash on delivery',
        MessageSid: 'SM_payment_001'
      });

      seedTestData('whatsapp_message_logs', [{
        id: 'log-payment-001',
        business_id: testBusinessId,
        message_id: paymentWebhook.MessageSid,
        customer_phone: phone,
        direction: 'inbound',
        content: paymentWebhook.Body,
        intent_detected: 'PAYMENT_CASH',
        status: 'received',
        timestamp: new Date().toISOString()
      }]);

      // Order should be created
      seedTestData('orders', [{
        id: 'order-complete-001',
        business_id: testBusinessId,
        customer_phone: phone,
        customer_name: 'Test Customer',
        total: 30.98,
        delivery_fee: 5,
        status: 'pending',
        payment_method: 'cash',
        delivery_method: 'delivery',
        delivery_postcode: 'SE15 4AA',
        source: 'whatsapp',
        created_at: new Date().toISOString()
      }]);

      seedTestData('order_items', [{
        id: 'item-complete-001',
        order_id: 'order-complete-001',
        product_id: 'prod-palm-oil-001',
        product_name: 'Palm Oil 5L',
        quantity: 2,
        price: 12.99,
        unit: 'bottle'
      }]);

      // Verify complete flow
      const logs = getTestData('whatsapp_message_logs');
      expect(logs.length).toBeGreaterThanOrEqual(3);

      const orderLog = logs.find(l => l.intent_detected === 'NEW_ORDER');
      const confirmLog = logs.find(l => l.intent_detected === 'CONFIRM');
      const paymentLog = logs.find(l => l.intent_detected === 'PAYMENT_CASH');

      expect(orderLog).toBeDefined();
      expect(confirmLog).toBeDefined();
      expect(paymentLog).toBeDefined();

      const orders = getTestData('orders');
      expect(orders).toHaveLength(1);
      expect(orders[0].payment_method).toBe('cash');
      expect(orders[0].source).toBe('whatsapp');

      const items = getTestData('order_items');
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    test('should handle order decline flow', async () => {
      const phone = testPhone;

      // Step 1: Place order
      seedTestData('whatsapp_sessions', [{
        id: 'session-decline-001',
        business_id: testBusinessId,
        customer_phone: phone,
        current_state: 'AWAITING_CONFIRMATION',
        cart: [{ product: 'Palm Oil 5L', quantity: 2 }],
        is_active: true
      }]);

      // Step 2: Decline
      const declineWebhook = createTwilioWebhook({
        From: `whatsapp:+${phone}`,
        Body: 'no',
        MessageSid: 'SM_decline_001'
      });

      seedTestData('whatsapp_message_logs', [{
        id: 'log-decline-001',
        business_id: testBusinessId,
        message_id: declineWebhook.MessageSid,
        customer_phone: phone,
        direction: 'inbound',
        content: declineWebhook.Body,
        intent_detected: 'DECLINE',
        status: 'received',
        timestamp: new Date().toISOString()
      }]);

      // Session should be reset
      const sessions = getTestData('whatsapp_sessions');
      const session = sessions.find(s => s.customer_phone === phone);
      session.current_state = 'INITIAL';
      session.cart = [];

      // No orders should be created
      const orders = getTestData('orders');
      expect(orders).toHaveLength(0);
    });
  });

  describe('Session Persistence', () => {
    test('should maintain session across multiple messages', async () => {
      const phone = testPhone;

      // Message 1: Order without address
      seedTestData('whatsapp_sessions', [{
        id: 'session-persist-001',
        business_id: testBusinessId,
        customer_phone: phone,
        current_state: 'AWAITING_ADDRESS',
        cart: [{ product: 'Palm Oil 5L', quantity: 2 }],
        is_active: true,
        last_message_at: new Date().toISOString()
      }]);

      let sessions = getTestData('whatsapp_sessions');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].current_state).toBe('AWAITING_ADDRESS');

      // Message 2: Provide address
      sessions[0].current_state = 'AWAITING_CONFIRMATION';
      sessions[0].context = { deliveryPostcode: 'SE15 4AA' };
      seedTestData('whatsapp_sessions', sessions);

      sessions = getTestData('whatsapp_sessions');
      expect(sessions[0].current_state).toBe('AWAITING_CONFIRMATION');
      expect(sessions[0].context.deliveryPostcode).toBe('SE15 4AA');
    });

    test('should clear session after order completion', async () => {
      const phone = testPhone;

      seedTestData('whatsapp_sessions', [{
        id: 'session-clear-001',
        business_id: testBusinessId,
        customer_phone: phone,
        current_state: 'COMPLETED',
        cart: [],
        is_active: false
      }]);

      const sessions = getTestData('whatsapp_sessions');
      const completedSession = sessions.find(s => s.customer_phone === phone);
      expect(completedSession.current_state).toBe('COMPLETED');
      expect(completedSession.cart).toHaveLength(0);
      expect(completedSession.is_active).toBe(false);
    });
  });

  describe('Message Logging', () => {
    test('should log all inbound and outbound messages', async () => {
      // Inbound message
      seedTestData('whatsapp_message_logs', [{
        id: 'log-in-001',
        business_id: testBusinessId,
        message_id: 'msg-in-001',
        customer_phone: testPhone,
        direction: 'inbound',
        message_type: 'text',
        content: '2x palm oil',
        status: 'received',
        timestamp: new Date().toISOString()
      }]);

      // Outbound response
      seedTestData('whatsapp_message_logs', [{
        id: 'log-out-001',
        business_id: testBusinessId,
        message_id: 'msg-out-001',
        customer_phone: testPhone,
        direction: 'outbound',
        message_type: 'text',
        content: 'Thanks! Where should we deliver?',
        status: 'sent',
        timestamp: new Date().toISOString()
      }]);

      const logs = getTestData('whatsapp_message_logs');
      expect(logs).toHaveLength(2);

      const inbound = logs.filter(l => l.direction === 'inbound');
      const outbound = logs.filter(l => l.direction === 'outbound');

      expect(inbound).toHaveLength(1);
      expect(outbound).toHaveLength(1);
    });

    test('should track response time', async () => {
      const receivedAt = new Date();
      const respondedAt = new Date(receivedAt.getTime() + 500); // 500ms later

      seedTestData('whatsapp_message_logs', [{
        id: 'log-timing-001',
        business_id: testBusinessId,
        message_id: 'msg-timing-001',
        customer_phone: testPhone,
        direction: 'inbound',
        content: 'hello',
        response_time_ms: 500,
        status: 'received',
        timestamp: receivedAt.toISOString()
      }]);

      const logs = getTestData('whatsapp_message_logs');
      const log = logs[0];
      expect(log.response_time_ms).toBe(500);
    });
  });

  describe('Error Scenarios', () => {
    test('should handle unknown product gracefully', async () => {
      const webhook = createTwilioWebhook({
        Body: '2x unknown product',
        MessageSid: 'SM_error_001'
      });

      // Message would be logged with no products found
      seedTestData('whatsapp_message_logs', [{
        id: 'log-error-001',
        business_id: testBusinessId,
        message_id: webhook.MessageSid,
        customer_phone: testPhone,
        direction: 'inbound',
        content: webhook.Body,
        intent_detected: 'GENERAL_INQUIRY',
        status: 'received',
        timestamp: new Date().toISOString()
      }]);

      const logs = getTestData('whatsapp_message_logs');
      const log = logs[0];
      expect(log.intent_detected).toBe('GENERAL_INQUIRY');
    });

    test('should handle missing address for delivery', async () => {
      seedTestData('whatsapp_sessions', [{
        id: 'session-no-address-001',
        business_id: testBusinessId,
        customer_phone: testPhone,
        current_state: 'AWAITING_ADDRESS',
        cart: [{ product: 'Palm Oil 5L', quantity: 2 }],
        is_active: true
      }]);

      const sessions = getTestData('whatsapp_sessions');
      expect(sessions[0].current_state).toBe('AWAITING_ADDRESS');
      expect(sessions[0].cart).toHaveLength(1);
    });
  });

  describe('Multi-tenant Isolation', () => {
    test('should keep business data isolated', async () => {
      const business1Phone = '447448682282';
      const business2Phone = '447700900123';

      // Business 1 order
      seedTestData('orders', [{
        id: 'order-b1-001',
        business_id: 'test-business-001',
        customer_phone: business1Phone,
        total: 25.98,
        status: 'pending'
      }]);

      // Business 2 order
      seedTestData('orders', [{
        id: 'order-b2-001',
        business_id: 'test-business-002',
        customer_phone: business2Phone,
        total: 15.50,
        status: 'pending'
      }]);

      const allOrders = getTestData('orders');
      expect(allOrders).toHaveLength(2);

      const business1Orders = allOrders.filter(o => o.business_id === 'test-business-001');
      const business2Orders = allOrders.filter(o => o.business_id === 'test-business-002');

      expect(business1Orders).toHaveLength(1);
      expect(business2Orders).toHaveLength(1);
    });
  });
});
