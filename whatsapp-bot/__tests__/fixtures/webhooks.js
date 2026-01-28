// Twilio webhook payload fixtures
export const twilioWebhookFixtures = {
  // Simple greeting message
  simpleTextMessage: {
    MessageSid: 'SM1234567890abcdef1234567890abcdef',
    From: 'whatsapp:+447448682282',
    To: 'whatsapp:+14155238886',
    Body: 'Hello',
    NumMedia: '0',
    ProfileName: 'Test Customer',
    AccountSid: 'ACtest_account_sid',
    MessagingServiceSid: 'MGtest_service_sid',
    WaId: '447448682282'
  },

  // Order message with product and quantity
  orderMessage: {
    MessageSid: 'SM2234567890abcdef1234567890abcdef',
    From: 'whatsapp:+447448682282',
    To: 'whatsapp:+14155238886',
    Body: '2x palm oil',
    NumMedia: '0',
    ProfileName: 'Test Customer',
    AccountSid: 'ACtest_account_sid',
    WaId: '447448682282'
  },

  // Complete order with address
  completeOrderMessage: {
    MessageSid: 'SM3234567890abcdef1234567890abcdef',
    From: 'whatsapp:+447448682282',
    To: 'whatsapp:+14155238886',
    Body: '2x palm oil to SE15 4AA',
    NumMedia: '0',
    ProfileName: 'Test Customer',
    AccountSid: 'ACtest_account_sid',
    WaId: '447448682282'
  },

  // Yoruba product order
  yorubaOrder: {
    MessageSid: 'SM4234567890abcdef1234567890abcdef',
    From: 'whatsapp:+447448682282',
    To: 'whatsapp:+14155238886',
    Body: '3x epo pupa to E1 6AN',
    NumMedia: '0',
    ProfileName: 'Isha Customer',
    AccountSid: 'ACtest_account_sid',
    WaId: '447448682282'
  },

  // Multi-item order
  multiItemOrder: {
    MessageSid: 'SM5234567890abcdef1234567890abcdef',
    From: 'whatsapp:+447448682282',
    To: 'whatsapp:+14155238886',
    Body: '2x palm oil, 3x egusi and 1x plantain to SE15 4AA',
    NumMedia: '0',
    ProfileName: 'Test Customer',
    AccountSid: 'ACtest_account_sid',
    WaId: '447448682282'
  },

  // Confirmation message
  confirmationMessage: {
    MessageSid: 'SM6234567890abcdef1234567890abcdef',
    From: 'whatsapp:+447448682282',
    To: 'whatsapp:+14155238886',
    Body: 'yes',
    NumMedia: '0',
    ProfileName: 'Test Customer',
    AccountSid: 'ACtest_account_sid',
    WaId: '447448682282'
  },

  // Decline message
  declineMessage: {
    MessageSid: 'SM7234567890abcdef1234567890abcdef',
    From: 'whatsapp:+447448682282',
    To: 'whatsapp:+14155238886',
    Body: 'no',
    NumMedia: '0',
    ProfileName: 'Test Customer',
    AccountSid: 'ACtest_account_sid',
    WaId: '447448682282'
  },

  // Payment method selection - cash
  cashPaymentMessage: {
    MessageSid: 'SM8234567890abcdef1234567890abcdef',
    From: 'whatsapp:+447448682282',
    To: 'whatsapp:+14155238886',
    Body: 'cash on delivery',
    NumMedia: '0',
    ProfileName: 'Test Customer',
    AccountSid: 'ACtest_account_sid',
    WaId: '447448682282'
  },

  // Payment method selection - card
  cardPaymentMessage: {
    MessageSid: 'SM9234567890abcdef1234567890abcdef',
    From: 'whatsapp:+447448682282',
    To: 'whatsapp:+14155238886',
    Body: 'pay by card',
    NumMedia: '0',
    ProfileName: 'Test Customer',
    AccountSid: 'ACtest_account_sid',
    WaId: '447448682282'
  },

  // Help request
  helpMessage: {
    MessageSid: 'SM0234567890abcdef1234567890abcdef',
    From: 'whatsapp:+447448682282',
    To: 'whatsapp:+14155238886',
    Body: 'help',
    NumMedia: '0',
    ProfileName: 'Test Customer',
    AccountSid: 'ACtest_account_sid',
    WaId: '447448682282'
  },

  // Menu request
  menuMessage: {
    MessageSid: 'SMa234567890abcdef1234567890abcdef',
    From: 'whatsapp:+447448682282',
    To: 'whatsapp:+14155238886',
    Body: 'menu',
    NumMedia: '0',
    ProfileName: 'Test Customer',
    AccountSid: 'ACtest_account_sid',
    WaId: '447448682282'
  },

  // Image message (product photo)
  imageMessage: {
    MessageSid: 'SMb234567890abcdef1234567890abcdef',
    From: 'whatsapp:+447448682282',
    To: 'whatsapp:+14155238886',
    Body: '',
    NumMedia: '1',
    MediaUrl0: 'https://api.twilio.com/2010-04-01/Accounts/ACtest/Messages/SMb234/Media/MEtest',
    MediaContentType0: 'image/jpeg',
    ProfileName: 'Test Customer',
    AccountSid: 'ACtest_account_sid',
    WaId: '447448682282'
  },

  // Voice message
  voiceMessage: {
    MessageSid: 'SMc234567890abcdef1234567890abcdef',
    From: 'whatsapp:+447448682282',
    To: 'whatsapp:+14155238886',
    Body: '',
    NumMedia: '1',
    MediaUrl0: 'https://api.twilio.com/2010-04-01/Accounts/ACtest/Messages/SMc234/Media/MEtest',
    MediaContentType0: 'audio/ogg',
    ProfileName: 'Test Customer',
    AccountSid: 'ACtest_account_sid',
    WaId: '447448682282'
  }
};

// Meta WhatsApp Cloud API webhook payload fixtures
export const metaWebhookFixtures = {
  // Simple text message
  textMessage: {
    object: 'whatsapp_business_account',
    entry: [{
      id: '123456789012345',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '447123456789',
            phone_number_id: '123456789012345'
          },
          contacts: [{
            profile: { name: 'Test Customer' },
            wa_id: '447448682282'
          }],
          messages: [{
            from: '447448682282',
            id: 'wamid.test123456789',
            timestamp: '1234567890',
            type: 'text',
            text: { body: 'Hello' }
          }]
        },
        field: 'messages'
      }]
    }]
  },

  // Order message
  orderMessage: {
    object: 'whatsapp_business_account',
    entry: [{
      id: '123456789012345',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '447123456789',
            phone_number_id: '123456789012345'
          },
          contacts: [{
            profile: { name: 'Test Customer' },
            wa_id: '447448682282'
          }],
          messages: [{
            from: '447448682282',
            id: 'wamid.test123456790',
            timestamp: '1234567890',
            type: 'text',
            text: { body: '2x palm oil to SE15 4AA' }
          }]
        },
        field: 'messages'
      }]
    }]
  },

  // Verification webhook (GET request)
  verification: {
    'hub.mode': 'subscribe',
    'hub.verify_token': 'test_verify_token',
    'hub.challenge': '1234567890'
  }
};

// Helper function to create custom webhook payload
export const createTwilioWebhook = (overrides = {}) => ({
  MessageSid: `SM${Math.random().toString(36).substring(7)}`,
  From: 'whatsapp:+447448682282',
  To: 'whatsapp:+14155238886',
  Body: 'Test message',
  NumMedia: '0',
  ProfileName: 'Test Customer',
  AccountSid: 'ACtest_account_sid',
  WaId: '447448682282',
  ...overrides
});

// Helper function to create Meta webhook payload
export const createMetaWebhook = (messageBody, overrides = {}) => ({
  object: 'whatsapp_business_account',
  entry: [{
    id: '123456789012345',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: {
          display_phone_number: '447123456789',
          phone_number_id: '123456789012345'
        },
        contacts: [{
          profile: { name: 'Test Customer' },
          wa_id: '447448682282'
        }],
        messages: [{
          from: '447448682282',
          id: `wamid.test${Date.now()}`,
          timestamp: Math.floor(Date.now() / 1000).toString(),
          type: 'text',
          text: { body: messageBody }
        }]
      },
      field: 'messages'
    }]
  }],
  ...overrides
});
