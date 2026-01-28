import { jest } from '@jest/globals';

// Mock product aliases database (Yoruba ↔ English mappings)
const mockAliases = {
  'epo pupa': { product: 'Palm Oil 5L', language: 'yoruba', confidence: 1.0 },
  'palm oil': { product: 'Palm Oil 5L', language: 'english', confidence: 1.0 },
  'ata rodo': { product: 'Scotch Bonnet Peppers', language: 'yoruba', confidence: 1.0 },
  'scotch bonnet': { product: 'Scotch Bonnet Peppers', language: 'english', confidence: 1.0 },
  'egusi': { product: 'Egusi Seeds', language: 'yoruba', confidence: 1.0 },
  'egwusi': { product: 'Egusi Seeds', language: 'yoruba', confidence: 0.9 },
  'melon seeds': { product: 'Egusi Seeds', language: 'english', confidence: 1.0 },
  'ata': { product: 'Fresh Tomatoes', language: 'yoruba', confidence: 1.0 },
  'tomatoes': { product: 'Fresh Tomatoes', language: 'english', confidence: 1.0 },
  'tatase': { product: 'Red Bell Peppers', language: 'yoruba', confidence: 1.0 },
  'bell peppers': { product: 'Red Bell Peppers', language: 'english', confidence: 1.0 },
  'alubosa': { product: 'Red Onions', language: 'yoruba', confidence: 1.0 },
  'onions': { product: 'Red Onions', language: 'english', confidence: 1.0 },
  'plantain': { product: 'Plantain (Green)', language: 'english', confidence: 1.0 },
  'ogede': { product: 'Plantain (Green)', language: 'yoruba', confidence: 1.0 },
  'yam': { product: 'Yam Tuber', language: 'english', confidence: 1.0 },
  'isu': { product: 'Yam Tuber', language: 'yoruba', confidence: 1.0 }
};

// Mock session with run method
const mockSession = {
  run: jest.fn((query, params) => {
    if (!params || !params.term) {
      return Promise.resolve({ records: [] });
    }

    const term = params.term.toLowerCase().trim();
    const match = mockAliases[term];

    if (match) {
      return Promise.resolve({
        records: [{
          get: (key) => {
            const record = {
              productName: match.product,
              language: match.language,
              confidence: match.confidence,
              alias: term
            };
            return record[key];
          }
        }]
      });
    }

    // Fuzzy matching - check if term is contained in any alias
    const fuzzyMatches = Object.entries(mockAliases)
      .filter(([alias]) => alias.includes(term) || term.includes(alias))
      .map(([alias, data]) => ({
        ...data,
        alias,
        confidence: data.confidence * 0.8 // Reduce confidence for fuzzy matches
      }));

    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0];
      return Promise.resolve({
        records: [{
          get: (key) => {
            const record = {
              productName: bestMatch.product,
              language: bestMatch.language,
              confidence: bestMatch.confidence,
              alias: bestMatch.alias
            };
            return record[key];
          }
        }]
      });
    }

    return Promise.resolve({ records: [] });
  }),
  close: jest.fn(() => Promise.resolve())
};

// Mock driver
const mockDriver = {
  session: jest.fn(() => mockSession),
  close: jest.fn(() => Promise.resolve()),
  verifyConnectivity: jest.fn(() => Promise.resolve())
};

// Helper functions for tests
export const resetNeo4jMocks = () => {
  mockSession.run.mockClear();
  mockSession.close.mockClear();
  mockDriver.session.mockClear();
  mockDriver.close.mockClear();
};

export const addMockAlias = (alias, productName, language = 'english', confidence = 1.0) => {
  mockAliases[alias.toLowerCase()] = { product: productName, language, confidence };
};

export const clearMockAliases = () => {
  Object.keys(mockAliases).forEach(key => delete mockAliases[key]);
};

export const getMockAliases = () => ({ ...mockAliases });

// Mock Neo4j driver
export const mockNeo4jDriver = jest.fn((uri, authToken) => mockDriver);

// Mock auth helper
export const mockNeo4jAuth = {
  basic: jest.fn((username, password) => ({ username, password }))
};

// Mock the neo4j-driver module
jest.unstable_mockModule('neo4j-driver', () => ({
  default: {
    driver: mockNeo4jDriver,
    auth: mockNeo4jAuth
  },
  driver: mockNeo4jDriver,
  auth: mockNeo4jAuth
}));

export { mockDriver, mockSession };
export default mockDriver;
