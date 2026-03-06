import { describe, it, expect } from '@jest/globals';
import { resolveButtonId } from '../../src/message-handler.js';

describe('resolveButtonId', () => {
  it('returns null for null/undefined input', () => {
    expect(resolveButtonId(null)).toBeNull();
    expect(resolveButtonId(undefined)).toBeNull();
  });

  it('returns null for unrecognized button text', () => {
    expect(resolveButtonId('some random text')).toBeNull();
    expect(resolveButtonId('hello world')).toBeNull();
  });

  // Order buttons
  it('resolves "📦 Order" to START_ORDER', () => {
    expect(resolveButtonId('📦 Order')).toBe('START_ORDER');
  });

  it('resolves "📦 Place Order" to START_ORDER', () => {
    expect(resolveButtonId('📦 Place Order')).toBe('START_ORDER');
  });

  it('resolves "📦 New Order" to START_ORDER', () => {
    expect(resolveButtonId('📦 New Order')).toBe('START_ORDER');
  });

  it('resolves "📦 Order Now" to START_ORDER', () => {
    expect(resolveButtonId('📦 Order Now')).toBe('START_ORDER');
  });

  // Product buttons
  it('resolves "📋 See Products" to PRODUCTS_LIST', () => {
    expect(resolveButtonId('📋 See Products')).toBe('PRODUCTS_LIST');
  });

  it('resolves "📋 View Catalog" to PRODUCTS_LIST', () => {
    expect(resolveButtonId('📋 View Catalog')).toBe('PRODUCTS_LIST');
  });

  it('resolves "📋 Full Catalog" to PRODUCTS_LIST', () => {
    expect(resolveButtonId('📋 Full Catalog')).toBe('PRODUCTS_LIST');
  });

  it('resolves "📋 Products" to PRODUCTS_LIST', () => {
    expect(resolveButtonId('📋 Products')).toBe('PRODUCTS_LIST');
  });

  // Confirmation buttons
  it('resolves "✅ Yes" to CONFIRM', () => {
    expect(resolveButtonId('✅ Yes')).toBe('CONFIRM');
  });

  it("resolves \"✅ Yes, that's right\" to CONFIRM", () => {
    expect(resolveButtonId("✅ Yes, that's right")).toBe('CONFIRM');
  });

  // Edit / decline buttons
  it('resolves "✏️ Make Changes" to DECLINE', () => {
    expect(resolveButtonId('✏️ Make Changes')).toBe('DECLINE');
  });

  it('resolves "✏️ Change" to DECLINE', () => {
    expect(resolveButtonId('✏️ Change')).toBe('DECLINE');
  });

  // Cancel buttons
  it('resolves "❌ Cancel" to CANCEL', () => {
    expect(resolveButtonId('❌ Cancel')).toBe('CANCEL');
  });

  it('resolves "❌ Cancel Order" to CANCEL', () => {
    expect(resolveButtonId('❌ Cancel Order')).toBe('CANCEL');
  });

  // Reorder
  it('resolves "🔄 Reorder" to REORDER', () => {
    expect(resolveButtonId('🔄 Reorder')).toBe('REORDER');
  });

  // Payment buttons
  it('resolves "💳 Pay Now" to PAYMENT_CARD', () => {
    expect(resolveButtonId('💳 Pay Now')).toBe('PAYMENT_CARD');
  });

  it('resolves "💵 Cash on Delivery" to PAYMENT_CASH', () => {
    expect(resolveButtonId('💵 Cash on Delivery')).toBe('PAYMENT_CASH');
  });

  it('resolves "💵 Cash" to PAYMENT_CASH', () => {
    expect(resolveButtonId('💵 Cash')).toBe('PAYMENT_CASH');
  });

  it('resolves "🏦 Transfer" to PAYMENT_TRANSFER', () => {
    expect(resolveButtonId('🏦 Transfer')).toBe('PAYMENT_TRANSFER');
  });

  it('resolves "🏦 Bank Transfer" to PAYMENT_TRANSFER', () => {
    expect(resolveButtonId('🏦 Bank Transfer')).toBe('PAYMENT_TRANSFER');
  });

  // Track / status
  it('resolves "📍 Track Order" to ORDER_STATUS', () => {
    expect(resolveButtonId('📍 Track Order')).toBe('ORDER_STATUS');
  });

  // Help
  it('resolves "💬 Help" to GREETING', () => {
    expect(resolveButtonId('💬 Help')).toBe('GREETING');
  });

  // Case insensitivity
  it('is case insensitive', () => {
    expect(resolveButtonId('📦 ORDER')).toBe('START_ORDER');
    expect(resolveButtonId('✅ YES')).toBe('CONFIRM');
    expect(resolveButtonId('❌ cancel')).toBe('CANCEL');
  });

  // Whitespace trimming
  it('trims whitespace', () => {
    expect(resolveButtonId('  📦 Order  ')).toBe('START_ORDER');
    expect(resolveButtonId('  ✅ Yes  ')).toBe('CONFIRM');
  });
});
