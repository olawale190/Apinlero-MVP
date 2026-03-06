import { jest } from '@jest/globals';
import { penceToPounds, poundsToPence } from '../../src/currency.js';

describe('Currency Conversion', () => {
  describe('penceToPounds', () => {
    test('converts 899 pence to 8.99 pounds', () => {
      expect(penceToPounds(899)).toBe(8.99);
    });

    test('converts 1299 pence to 12.99 pounds', () => {
      expect(penceToPounds(1299)).toBe(12.99);
    });

    test('converts 500 pence to 5.00 pounds', () => {
      expect(penceToPounds(500)).toBe(5);
    });

    test('converts 0 pence to 0 pounds', () => {
      expect(penceToPounds(0)).toBe(0);
    });

    test('converts 1 penny to 0.01 pounds', () => {
      expect(penceToPounds(1)).toBe(0.01);
    });
  });

  describe('poundsToPence', () => {
    test('converts 8.99 pounds to 899 pence', () => {
      expect(poundsToPence(8.99)).toBe(899);
    });

    test('converts 12.99 pounds to 1299 pence', () => {
      expect(poundsToPence(12.99)).toBe(1299);
    });

    test('handles floating point correctly (rounds)', () => {
      expect(poundsToPence(19.999)).toBe(2000);
    });
  });
});

describe('Order item price display', () => {
  test('order items built from DB products have correct pound prices', () => {
    // Simulate a product from Supabase (price in pence)
    const dbProduct = { id: 'prod-1', name: 'Palm Oil 5L', price: 1299 };
    const quantity = 2;

    const orderItem = {
      product_id: dbProduct.id,
      product_name: dbProduct.name,
      quantity,
      price: penceToPounds(dbProduct.price),
      subtotal: penceToPounds(dbProduct.price) * quantity
    };

    expect(orderItem.price).toBe(12.99);
    expect(orderItem.subtotal).toBe(25.98);
  });

  test('product list shows £8.99 not £899.00', () => {
    const dbPrice = 899; // pence
    const displayPrice = `£${penceToPounds(dbPrice).toFixed(2)}`;
    expect(displayPrice).toBe('£8.99');
    expect(displayPrice).not.toBe('£899.00');
  });

  test('price check displays correct pounds value', () => {
    const dbPrice = 350; // pence
    const displayPrice = `£${penceToPounds(dbPrice).toFixed(2)}`;
    expect(displayPrice).toBe('£3.50');
  });
});
