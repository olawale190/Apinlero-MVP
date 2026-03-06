import { generateResponse } from '../src/response-templates.js';

// Shared test fixtures
const mockItem = { quantity: 2, product_name: 'Palm Oil 5L', subtotal: 25.00 };
const mockItems = [
  mockItem,
  { quantity: 1, product_name: 'Egusi Seeds 500g', subtotal: 8.50 }
];

describe('Response Templates', () => {

  describe('PRODUCTS_NOT_FOUND_CONTEXTUAL', () => {
    it('renders with suggestions', () => {
      const result = generateResponse('PRODUCTS_NOT_FOUND_CONTEXTUAL', {
        products: ['ogbono', 'crayfish'],
        suggestions: ['Ogbono Seeds 200g', 'Dried Crayfish 100g']
      });
      expect(result.text).toContain('ogbono');
      expect(result.text).toContain('Ogbono Seeds 200g');
      expect(result.buttons).toBeDefined();
      expect(Array.isArray(result.buttons)).toBe(true);
    });

    it('renders without suggestions', () => {
      const result = generateResponse('PRODUCTS_NOT_FOUND_CONTEXTUAL', {
        products: ['unknown item'],
        suggestions: []
      });
      expect(result.text).toContain('unknown item');
      expect(result.text).toContain('ishas-treat.apinlero.com');
    });
  });

  describe('ORDER_EDIT_PROMPT_WITH_ITEMS', () => {
    it('renders with items and total', () => {
      const result = generateResponse('ORDER_EDIT_PROMPT_WITH_ITEMS', {
        items: mockItems,
        total: 33.50
      });
      expect(result.text).toContain('2x Palm Oil 5L');
      expect(result.text).toContain('1x Egusi Seeds 500g');
      expect(result.text).toContain('33.50');
      expect(result.buttons.length).toBeGreaterThan(0);
    });
  });

  describe('RUNNING_TOTAL', () => {
    it('renders with address and delivery', () => {
      const result = generateResponse('RUNNING_TOTAL', {
        items: mockItems,
        subtotal: 33.50,
        deliveryFee: 5.00,
        total: 38.50,
        address: '45 High Street, London E1 4AA'
      });
      expect(result.text).toContain('33.50');
      expect(result.text).toContain('5.00');
      expect(result.text).toContain('38.50');
      expect(result.buttons).toBeDefined();
    });

    it('renders without address', () => {
      const result = generateResponse('RUNNING_TOTAL', {
        items: mockItems,
        subtotal: 33.50,
        deliveryFee: null,
        total: null,
        address: null
      });
      expect(result.text).toContain('postcode');
    });
  });

  describe('MEAL_INGREDIENTS', () => {
    it('renders meal ingredients', () => {
      const result = generateResponse('MEAL_INGREDIENTS', {
        meal: 'Jollof Rice',
        items: mockItems,
        subtotal: 33.50,
        deliveryFee: 5.00,
        total: 38.50,
        address: 'SE15 4AA'
      });
      expect(result.text).toContain('Jollof Rice');
      expect(result.text).toContain('Palm Oil 5L');
      expect(result.buttons.length).toBeGreaterThan(0);
    });
  });

  describe('BUDGET_SUGGESTION', () => {
    it('renders budget bundle', () => {
      const result = generateResponse('BUDGET_SUGGESTION', {
        budget: 30.00,
        items: mockItems,
        total: 28.50
      });
      expect(result.text).toContain('30.00');
      expect(result.text).toContain('28.50');
      expect(result.text).toContain('Palm Oil 5L');
      expect(result.buttons.length).toBeGreaterThan(0);
    });
  });

  describe('ADDRESS_UPDATED', () => {
    it('renders address confirmation', () => {
      const result = generateResponse('ADDRESS_UPDATED', {
        address: '45 High Street, London E1 4AA',
        postcode: 'E1 4AA',
        deliveryFee: 5.00,
        deliveryZone: 'Zone 1-2'
      });
      expect(result.text).toContain('45 High Street');
      expect(result.text).toContain('5.00');
      expect(result.buttons).toBeDefined();
    });

    it('shows free delivery message when fee is 0', () => {
      const result = generateResponse('ADDRESS_UPDATED', {
        address: '45 High Street',
        postcode: 'E1 4AA',
        deliveryFee: 0,
        deliveryZone: 'Zone 1'
      });
      expect(result.text).toContain('Free delivery');
    });
  });

  describe('AUTO_CONFIRM_FALLBACK', () => {
    it('renders fallback confirmation', () => {
      const result = generateResponse('AUTO_CONFIRM_FALLBACK', {
        items: mockItems,
        subtotal: 33.50,
        deliveryFee: 5.00,
        total: 38.50,
        address: 'SE15 4AA'
      });
      expect(result.text).toContain('confirm');
      expect(result.text).toContain('38.50');
      expect(result.buttons).toBeDefined();
    });
  });

  describe('DID_YOU_MEAN', () => {
    it('renders product suggestions', () => {
      const result = generateResponse('DID_YOU_MEAN', {
        query: 'plam oil',
        suggestions: ['Palm Oil 5L', 'Palm Oil 2.5L']
      });
      expect(result.text).toContain('plam oil');
      expect(result.text).toContain('Palm Oil 5L');
      expect(result.buttons).toBeDefined();
    });
  });

  describe('MODIFY_ORDER_APPLIED', () => {
    it('renders with added and removed items', () => {
      const result = generateResponse('MODIFY_ORDER_APPLIED', {
        items: mockItems,
        removed: ['Rice 5kg'],
        added: ['Plantain'],
        subtotal: 33.50,
        deliveryFee: 5.00,
        total: 38.50,
        address: 'SE15 4AA'
      });
      expect(result.text).toContain('Removed: Rice 5kg');
      expect(result.text).toContain('Added: Plantain');
      expect(result.text).toContain('38.50');
      expect(result.buttons.length).toBeGreaterThan(0);
    });

    it('renders without changes text', () => {
      const result = generateResponse('MODIFY_ORDER_APPLIED', {
        items: mockItems,
        removed: [],
        added: [],
        subtotal: 33.50,
        deliveryFee: 5.00,
        total: 38.50,
        address: null
      });
      expect(result.text).not.toContain('Removed');
      expect(result.text).not.toContain('Added');
    });
  });

  describe('NO_PENDING_ORDER', () => {
    it('renders correctly', () => {
      const result = generateResponse('NO_PENDING_ORDER');
      expect(result.text).toContain('pending order');
      expect(result.buttons.length).toBeGreaterThan(0);
    });
  });

  // Verify all new templates render without errors
  describe('All new templates render without errors', () => {
    const newTemplates = [
      { name: 'PRODUCTS_NOT_FOUND_CONTEXTUAL', params: { products: ['test'], suggestions: ['Test Product'] } },
      { name: 'ORDER_EDIT_PROMPT_WITH_ITEMS', params: { items: [mockItem], total: 25.00 } },
      { name: 'RUNNING_TOTAL', params: { items: [mockItem], subtotal: 25.00, deliveryFee: 5.00, total: 30.00, address: 'E1 4AA' } },
      { name: 'MEAL_INGREDIENTS', params: { meal: 'Jollof Rice', items: [mockItem], subtotal: 25.00, deliveryFee: 5.00, total: 30.00, address: 'E1' } },
      { name: 'BUDGET_SUGGESTION', params: { budget: 50.00, items: [mockItem], total: 25.00 } },
      { name: 'ADDRESS_UPDATED', params: { address: '45 High St', postcode: 'E1 4AA', deliveryFee: 5.00, deliveryZone: 'Zone 1' } },
      { name: 'AUTO_CONFIRM_FALLBACK', params: { items: [mockItem], subtotal: 25.00, deliveryFee: 5.00, total: 30.00, address: 'E1' } },
      { name: 'DID_YOU_MEAN', params: { query: 'test', suggestions: ['Test 1', 'Test 2'] } },
      { name: 'MODIFY_ORDER_APPLIED', params: { items: [mockItem], removed: [], added: [], subtotal: 25.00, deliveryFee: 5.00, total: 30.00, address: 'E1' } },
      { name: 'NO_PENDING_ORDER', params: {} },
    ];

    test.each(newTemplates)('$name renders without throwing', ({ name, params }) => {
      expect(() => generateResponse(name, params)).not.toThrow();
      const result = generateResponse(name, params);
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('buttons');
      expect(typeof result.text).toBe('string');
      expect(Array.isArray(result.buttons)).toBe(true);
      expect(result.text.length).toBeGreaterThan(0);
    });
  });

  describe('generateResponse', () => {
    it('returns ERROR template for unknown template name', () => {
      const result = generateResponse('NONEXISTENT_TEMPLATE');
      expect(result.text).toContain('something went wrong');
    });
  });
});
