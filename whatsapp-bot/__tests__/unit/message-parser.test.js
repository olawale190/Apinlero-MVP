import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Import mocks BEFORE the actual modules
import '../mocks/neo4j.mock.js';

// Now import the functions to test
import {
  detectIntent,
  parseOrderItems,
  parseAddress,
  getDeliveryZone,
  isCompleteOrder,
  parseMessage
} from '../../src/message-parser.js';

describe('Message Parser - detectIntent', () => {
  test('detects greeting intent', () => {
    expect(detectIntent('Hello')).toBe('GREETING');
    expect(detectIntent('Good morning')).toBe('GREETING');
    expect(detectIntent('Hey there')).toBe('GREETING');
    expect(detectIntent('Hi')).toBe('GREETING');
  });

  test('detects confirmation', () => {
    expect(detectIntent('yes')).toBe('CONFIRM');
    expect(detectIntent('yeah')).toBe('CONFIRM');
    expect(detectIntent('ok')).toBe('CONFIRM');
    expect(detectIntent('okay')).toBe('CONFIRM');
    expect(detectIntent('confirm')).toBe('CONFIRM');
  });

  test('detects decline', () => {
    expect(detectIntent('no')).toBe('DECLINE');
    expect(detectIntent('nope')).toBe('DECLINE');
    expect(detectIntent('cancel')).toBe('DECLINE');
  });

  test('detects order intent', () => {
    expect(detectIntent('I want 2x palm oil')).toBe('NEW_ORDER');
    expect(detectIntent('2 bags of rice')).toBe('NEW_ORDER');
    expect(detectIntent('order palm oil')).toBe('NEW_ORDER');
  });

  test('detects payment method - cash', () => {
    expect(detectIntent('cash on delivery')).toBe('PAYMENT_CASH');
    expect(detectIntent('pay cash')).toBe('PAYMENT_CASH');
    expect(detectIntent('cod')).toBe('PAYMENT_CASH');
  });

  test('detects payment method - card', () => {
    expect(detectIntent('pay by card')).toBe('PAYMENT_CARD');
    expect(detectIntent('card payment')).toBe('PAYMENT_CARD');
    expect(detectIntent('pay now')).toBe('PAYMENT_CARD');
  });

  test('detects payment method - transfer', () => {
    expect(detectIntent('bank transfer')).toBe('PAYMENT_TRANSFER');
    expect(detectIntent('transfer')).toBe('PAYMENT_TRANSFER');
  });

  test('detects product list request', () => {
    expect(detectIntent('show me your products')).toBe('PRODUCTS_LIST');
    expect(detectIntent('what do you have')).toBe('PRODUCTS_LIST');
    expect(detectIntent('menu')).toBe('PRODUCTS_LIST');
  });

  test('detects start order', () => {
    expect(detectIntent('place an order')).toBe('START_ORDER');
    expect(detectIntent('order now')).toBe('START_ORDER');
  });

  test('detects reorder', () => {
    expect(detectIntent('reorder')).toBe('REORDER');
    expect(detectIntent('same again')).toBe('REORDER');
  });

  test('detects thanks', () => {
    expect(detectIntent('thank you')).toBe('THANKS');
    expect(detectIntent('thanks')).toBe('THANKS');
  });

  test('defaults to general inquiry for unknown messages', () => {
    expect(detectIntent('random text')).toBe('GENERAL_INQUIRY');
  });
});

describe('Message Parser - parseOrderItems', () => {
  test('parses quantity with x notation', async () => {
    const items = await parseOrderItems('2x palm oil');
    expect(items).toHaveLength(1);
    expect(items[0].product).toBe('Palm Oil 5L');
    expect(items[0].quantity).toBe(2);
    expect(items[0].unit).toBe('Each');
  });

  test('parses Yoruba product names', async () => {
    const items = await parseOrderItems('3x epo pupa');
    expect(items).toHaveLength(1);
    expect(items[0].product).toBe('Palm Oil 5L');
    expect(items[0].quantity).toBe(3);
    expect(items[0].language).toBe('yoruba');
  });

  test('parses quantity with unit notation', async () => {
    const items = await parseOrderItems('2 bags egusi');
    expect(items).toHaveLength(1);
    expect(items[0].product).toBe('Egusi Seeds');
    expect(items[0].quantity).toBe(2);
    expect(items[0].unit).toBe('bag');
  });

  test('parses multiple items', async () => {
    const items = await parseOrderItems('2x palm oil and 3x egusi');
    expect(items.length).toBeGreaterThanOrEqual(1);

    const palmOil = items.find(i => i.product === 'Palm Oil 5L');
    expect(palmOil).toBeDefined();
    expect(palmOil.quantity).toBe(2);
  });

  test('parses items with "to" delivery address', async () => {
    const items = await parseOrderItems('2x palm oil to SE15 4AA');
    expect(items).toHaveLength(1);
    expect(items[0].product).toBe('Palm Oil 5L');
    expect(items[0].quantity).toBe(2);
  });

  test('parses plantain order', async () => {
    const items = await parseOrderItems('1x plantain');
    expect(items).toHaveLength(1);
    expect(items[0].product).toBe('Plantain (Green)');
    expect(items[0].quantity).toBe(1);
  });

  test('parses scotch bonnet peppers', async () => {
    const items = await parseOrderItems('2x scotch bonnet');
    expect(items).toHaveLength(1);
    expect(items[0].product).toBe('Scotch Bonnet Peppers');
    expect(items[0].quantity).toBe(2);
  });

  test('parses Yoruba name for scotch bonnet', async () => {
    const items = await parseOrderItems('3x ata rodo');
    expect(items).toHaveLength(1);
    expect(items[0].product).toBe('Scotch Bonnet Peppers');
    expect(items[0].quantity).toBe(3);
    expect(items[0].language).toBe('yoruba');
  });

  test('returns empty array for no products found', async () => {
    const items = await parseOrderItems('hello there');
    expect(items).toHaveLength(0);
  });

  test('handles complex multi-item order', async () => {
    const items = await parseOrderItems('2x palm oil, 3 bags egusi and 1x plantain');
    expect(items.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Message Parser - parseAddress', () => {
  test('extracts UK postcode', () => {
    const { postcode } = parseAddress('Deliver to SE15 4AA');
    expect(postcode).toBe('SE15 4AA');
  });

  test('extracts postcode without spaces', () => {
    const { postcode } = parseAddress('Send to SE154AA');
    expect(postcode).toBe('SE15 4AA');
  });

  test('extracts different postcode formats', () => {
    const tests = [
      { input: 'E1 6AN', expected: 'E1 6AN' },
      { input: 'SW1A 1AA', expected: 'SW1A 1AA' },
      { input: 'W1T 4TJ', expected: 'W1T 4TJ' },
      { input: 'N1 9GU', expected: 'N1 9GU' }
    ];

    tests.forEach(({ input, expected }) => {
      const { postcode } = parseAddress(`Deliver to ${input}`);
      expect(postcode).toBe(expected);
    });
  });

  test('extracts full address with postcode', () => {
    const { address, postcode } = parseAddress('Send to 123 Test St, London SE15 4AA');
    expect(address).toContain('123 Test St');
    expect(postcode).toBe('SE15 4AA');
  });

  test('handles "deliver to" keyword', () => {
    const { postcode } = parseAddress('deliver to E1 6AN');
    expect(postcode).toBe('E1 6AN');
  });

  test('handles "address:" keyword', () => {
    const { postcode } = parseAddress('address: SE15 4AA');
    expect(postcode).toBe('SE15 4AA');
  });

  test('returns null for no postcode found', () => {
    const { postcode } = parseAddress('hello there');
    expect(postcode).toBe(null);
  });

  test('extracts address after "send to"', () => {
    const { address } = parseAddress('send to 123 Main Street');
    expect(address).toContain('123 Main Street');
  });
});

describe('Message Parser - getDeliveryZone', () => {
  test('calculates fee for E postcode (Zone 1)', () => {
    const zone = getDeliveryZone('E1 6AN');
    expect(zone.zone).toBe(1);
    expect(zone.fee).toBe(5);
    expect(zone.estimatedDelivery).toBe('Same day');
  });

  test('calculates fee for SE postcode (Zone 3)', () => {
    const zone = getDeliveryZone('SE15 4AA');
    expect(zone.zone).toBe(3);
    expect(zone.fee).toBe(5);
    expect(zone.estimatedDelivery).toBe('Next day');
  });

  test('calculates fee for SW postcode (Zone 4)', () => {
    const zone = getDeliveryZone('SW1A 1AA');
    expect(zone.zone).toBe(4);
    expect(zone.fee).toBe(7);
    expect(zone.estimatedDelivery).toBe('Next day');
  });

  test('calculates fee for N postcode (Zone 2)', () => {
    const zone = getDeliveryZone('N1 9GU');
    expect(zone.zone).toBe(2);
    expect(zone.fee).toBe(5);
    expect(zone.estimatedDelivery).toBe('Same day');
  });

  test('returns default fee for unknown postcode', () => {
    const zone = getDeliveryZone('XY99 9ZZ');
    expect(zone.zone).toBe(7);
    expect(zone.fee).toBe(10);
    expect(zone.estimatedDelivery).toBe('2-3 days');
  });

  test('returns default fee for null postcode', () => {
    const zone = getDeliveryZone(null);
    expect(zone.fee).toBe(10);
  });
});

describe('Message Parser - isCompleteOrder', () => {
  test('returns true when has items and postcode', () => {
    const items = [{ product: 'Palm Oil 5L', quantity: 2 }];
    const postcode = 'SE15 4AA';
    expect(isCompleteOrder(items, postcode)).toBe(true);
  });

  test('returns false when items but no postcode', () => {
    const items = [{ product: 'Palm Oil 5L', quantity: 2 }];
    const postcode = null;
    expect(isCompleteOrder(items, postcode)).toBe(false);
  });

  test('returns false when postcode but no items', () => {
    const items = [];
    const postcode = 'SE15 4AA';
    expect(isCompleteOrder(items, postcode)).toBe(false);
  });

  test('returns false when neither items nor postcode', () => {
    const items = [];
    const postcode = null;
    expect(isCompleteOrder(items, postcode)).toBe(false);
  });
});

describe('Message Parser - parseMessage (full integration)', () => {
  test('parses complete order message', async () => {
    const result = await parseMessage('2x palm oil to SE15 4AA');

    expect(result.intent).toBe('NEW_ORDER');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].product).toBe('Palm Oil 5L');
    expect(result.items[0].quantity).toBe(2);
    expect(result.postcode).toBe('SE15 4AA');
    expect(result.deliveryZone.fee).toBe(5);
    expect(result.isCompleteOrder).toBe(true);
  });

  test('parses greeting message', async () => {
    const result = await parseMessage('Hello');

    expect(result.intent).toBe('GREETING');
    expect(result.items).toHaveLength(0);
    expect(result.postcode).toBe(null);
    expect(result.isCompleteOrder).toBe(false);
  });

  test('parses order without address', async () => {
    const result = await parseMessage('2x palm oil');

    expect(result.intent).toBe('NEW_ORDER');
    expect(result.items).toHaveLength(1);
    expect(result.postcode).toBe(null);
    expect(result.isCompleteOrder).toBe(false);
  });

  test('parses Yoruba order with address', async () => {
    const result = await parseMessage('3x epo pupa to E1 6AN');

    expect(result.intent).toBe('NEW_ORDER');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].product).toBe('Palm Oil 5L');
    expect(result.items[0].language).toBe('yoruba');
    expect(result.postcode).toBe('E1 6AN');
    expect(result.deliveryZone.zone).toBe(1);
    expect(result.isCompleteOrder).toBe(true);
  });

  test('parses multi-item order', async () => {
    const result = await parseMessage('2x palm oil, 3x egusi and 1x plantain to SE15 4AA');

    expect(result.intent).toBe('NEW_ORDER');
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.postcode).toBe('SE15 4AA');
    expect(result.isCompleteOrder).toBe(true);
  });
});
