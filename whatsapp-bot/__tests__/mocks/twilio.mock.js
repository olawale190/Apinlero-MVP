import { jest } from '@jest/globals';

// Create mock functions
export const mockMessageCreate = jest.fn();
export const mockMessages = { create: mockMessageCreate };

// Create mock Twilio client
export const mockTwilioClient = jest.fn(() => ({
  messages: mockMessages
}));

// Helper function to create success response
export const createSuccessResponse = (overrides = {}) => ({
  sid: 'SM' + Math.random().toString(36).substring(7),
  status: 'sent',
  to: 'whatsapp:+447448682282',
  from: 'whatsapp:+14155238886',
  body: 'Test message',
  dateCreated: new Date(),
  dateUpdated: new Date(),
  dateSent: new Date(),
  accountSid: 'ACtest_account_sid',
  numSegments: '1',
  direction: 'outbound-api',
  apiVersion: '2010-04-01',
  price: null,
  priceUnit: 'USD',
  errorCode: null,
  errorMessage: null,
  ...overrides
});

// Helper function to create error response
export const createErrorResponse = (errorCode = '21608', errorMessage = 'The number is unverified') => {
  const error = new Error(errorMessage);
  error.code = errorCode;
  error.status = 400;
  return error;
};

// Helper function to reset mocks
export const resetTwilioMocks = () => {
  mockMessageCreate.mockReset();
  mockMessageCreate.mockResolvedValue(createSuccessResponse());
};

// Mock the entire twilio module
jest.unstable_mockModule('twilio', () => ({
  default: mockTwilioClient,
  Twilio: mockTwilioClient
}));

export default mockTwilioClient;
