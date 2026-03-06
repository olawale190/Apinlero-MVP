import { describe, it, expect } from '@jest/globals';
import { resolveButtonId } from '../../src/message-handler.js';

/**
 * State Machine Tests
 *
 * Tests the state transitions and button resolution logic that drives
 * the conversation flow. The resolveButtonId function is the critical
 * piece that maps button taps to intents, which then drive state transitions.
 */

describe('State Machine: Button → Intent → State Transitions', () => {
  describe('AWAITING_CONFIRMATION state transitions via buttons', () => {
    it('✅ Yes button resolves to CONFIRM → should confirm order', () => {
      expect(resolveButtonId('✅ Yes')).toBe('CONFIRM');
    });

    it("✅ Yes, that's right button resolves to CONFIRM", () => {
      expect(resolveButtonId("✅ Yes, that's right")).toBe('CONFIRM');
    });

    it('❌ Cancel button resolves to CANCEL → should cancel order', () => {
      expect(resolveButtonId('❌ Cancel')).toBe('CANCEL');
    });

    it('✏️ Make Changes button resolves to DECLINE → should enter EDITING_ORDER', () => {
      expect(resolveButtonId('✏️ Make Changes')).toBe('DECLINE');
    });

    it('✏️ Change button resolves to DECLINE → should enter EDITING_ORDER', () => {
      expect(resolveButtonId('✏️ Change')).toBe('DECLINE');
    });
  });

  describe('EDITING_ORDER state transitions via buttons', () => {
    it('🔄 Start Over button resolves to REORDER', () => {
      expect(resolveButtonId('🔄 Start Over')).toBe('REORDER');
    });

    it('❌ Cancel Order button resolves to CANCEL → should clear session', () => {
      expect(resolveButtonId('❌ Cancel Order')).toBe('CANCEL');
    });
  });

  describe('AWAITING_PAYMENT state transitions via buttons', () => {
    it('💳 Pay Now resolves to PAYMENT_CARD', () => {
      expect(resolveButtonId('💳 Pay Now')).toBe('PAYMENT_CARD');
    });

    it('💳 Pay Online resolves to PAYMENT_CARD', () => {
      expect(resolveButtonId('💳 Pay Online')).toBe('PAYMENT_CARD');
    });

    it('💵 Cash resolves to PAYMENT_CASH', () => {
      expect(resolveButtonId('💵 Cash')).toBe('PAYMENT_CASH');
    });

    it('💵 Cash on Delivery resolves to PAYMENT_CASH', () => {
      expect(resolveButtonId('💵 Cash on Delivery')).toBe('PAYMENT_CASH');
    });

    it('🏦 Transfer resolves to PAYMENT_TRANSFER', () => {
      expect(resolveButtonId('🏦 Transfer')).toBe('PAYMENT_TRANSFER');
    });

    it('🏦 Bank Transfer resolves to PAYMENT_TRANSFER', () => {
      expect(resolveButtonId('🏦 Bank Transfer')).toBe('PAYMENT_TRANSFER');
    });
  });

  describe('ORDER_COMPLETED / INITIAL state transitions via buttons', () => {
    it('📦 Order resolves to START_ORDER', () => {
      expect(resolveButtonId('📦 Order')).toBe('START_ORDER');
    });

    it('📋 View Catalog resolves to PRODUCTS_LIST', () => {
      expect(resolveButtonId('📋 View Catalog')).toBe('PRODUCTS_LIST');
    });

    it('🔄 Reorder resolves to REORDER', () => {
      expect(resolveButtonId('🔄 Reorder')).toBe('REORDER');
    });

    it('📍 Track Order resolves to ORDER_STATUS', () => {
      expect(resolveButtonId('📍 Track Order')).toBe('ORDER_STATUS');
    });
  });

  describe('Edge cases: unresolved buttons fall through to parser', () => {
    it('returns null for plain text messages', () => {
      expect(resolveButtonId('I want palm oil')).toBeNull();
      expect(resolveButtonId('yes')).toBeNull();
      expect(resolveButtonId('no')).toBeNull();
    });

    it('returns null for empty/null input', () => {
      expect(resolveButtonId(null)).toBeNull();
      expect(resolveButtonId(undefined)).toBeNull();
      expect(resolveButtonId('')).toBeNull();
    });
  });
});

describe('State Machine: Text-based state transitions', () => {
  describe('EDITING_ORDER text patterns', () => {
    it('"remove X" pattern should match item removal regex', () => {
      const removeRegex = /(?:remove|take\s*out|drop|delete)\s+(.+)/i;

      expect('remove egusi'.match(removeRegex)).toBeTruthy();
      expect('remove egusi'.match(removeRegex)[1]).toBe('egusi');

      expect('take out palm oil'.match(removeRegex)).toBeTruthy();
      expect('take out palm oil'.match(removeRegex)[1]).toBe('palm oil');

      expect('drop plantain'.match(removeRegex)).toBeTruthy();
      expect('delete the rice'.match(removeRegex)).toBeTruthy();
    });

    it('"start over" pattern should match reset regex', () => {
      const resetRegex = /start\s*over|fresh|new\s*order|from\s*scratch/i;

      expect(resetRegex.test('start over')).toBe(true);
      expect(resetRegex.test('Start Over')).toBe(true);
      expect(resetRegex.test('fresh')).toBe(true);
      expect(resetRegex.test('new order')).toBe(true);
      expect(resetRegex.test('from scratch')).toBe(true);

      // Should not match
      expect(resetRegex.test('add more items')).toBe(false);
      expect(resetRegex.test('hello')).toBe(false);
    });
  });

  describe('Compound intent detection in AWAITING_CONFIRMATION', () => {
    it('positive response regex matches compound messages', () => {
      const positiveRegex = /^(yes|yeah|yep|yup|yh|ye|y|sure|ok|okay|confirm|correct|right|perfect|great|good|go|proceed|done|ready|fine|alright|👍|✅)/i;

      // Simple positives
      expect(positiveRegex.test('yes')).toBe(true);
      expect(positiveRegex.test('yeah')).toBe(true);
      expect(positiveRegex.test('sure')).toBe(true);

      // Compound: positive + more text (the regex anchors to start)
      expect(positiveRegex.test('yes please add palm oil')).toBe(true);
      expect(positiveRegex.test('yeah and add plantain too')).toBe(true);
      expect(positiveRegex.test('ok also throw in some egusi')).toBe(true);
    });

    it('negative response regex works correctly', () => {
      const negativeRegex = /^(no|nope|nah|n|cancel|stop|don't|dont|never|wrong|❌)/i;

      expect(negativeRegex.test('no')).toBe(true);
      expect(negativeRegex.test('nope')).toBe(true);
      expect(negativeRegex.test('cancel')).toBe(true);
      expect(negativeRegex.test('❌')).toBe(true);

      // Should not match positive
      expect(negativeRegex.test('yes')).toBe(false);
      expect(negativeRegex.test('sure')).toBe(false);
    });
  });
});

describe('State Machine: Complete button coverage', () => {
  // Verify every button text used in response templates has a mapping
  const templateButtons = [
    // From GREETING / greeting handler
    '📦 Order', '📋 See Products', '🔄 Reorder',
    // From ORDER_CONFIRMATION
    '✅ Yes', '✏️ Make Changes', '❌ Cancel',
    // From ORDER_CONFIRMED
    '💳 Pay Now', '💵 Cash on Delivery',
    // From ORDER_EDIT_PROMPT / ORDER_EDIT_PROMPT_WITH_ITEMS
    '🔄 Start Over', '❌ Cancel Order',
    // From QUICK_CONFIRM
    '✅ YES',
    // From REORDER_CONFIRM
    '✏️ Change',
    // From PRICE_INFO
    '📦 Order Now', '📋 View More',
    // From PAYMENT_CONFIRMED
    '📍 Track Order', '💬 Contact Us',
    // From PRODUCTS_LIST / handleProductsList
    '📦 Place Order', '💬 Help',
    // From CANCELLED / NO_PENDING_ORDER
    '📦 New Order', '📋 View Catalog',
    // From handleStartOrder
    '📋 Full Catalog',
    // From GENERAL_HELP
    '📋 View Products',
    // From REPROMPT_PAYMENT
    '💵 Cash', '💳 Card', '🏦 Transfer',
    // From AUTO_CONFIRMED
    '🏦 Bank Transfer',
    // From various error templates
    '🔄 Try Again',
    // From PRODUCTS_NOT_FOUND / ORDER_UNCLEAR
    '📋 View Catalog',
    // From NO_PREVIOUS_ORDER
    '📋 Products',
    // From AVAILABILITY_INFO
    '📋 View Alternatives',
  ];

  it.each(templateButtons)('button "%s" has a mapping in resolveButtonId', (buttonText) => {
    const resolved = resolveButtonId(buttonText);
    expect(resolved).not.toBeNull();
    expect(typeof resolved).toBe('string');
  });
});
