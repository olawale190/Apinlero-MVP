/**
 * Test Harness for WhatsApp Bot
 *
 * Enables offline testing by directly invoking message handler
 * without requiring live Twilio or Meta webhooks.
 */

import { handleIncomingMessage } from './src/message-handler.js';
import {
  generateTwilioWebhook,
  generateMetaWebhook,
  generateWebhookWithContext,
  generateMalformedWebhook,
} from './generators/webhook-mock.js';

/**
 * Test a message by directly invoking the message handler
 *
 * @param {Object} options
 * @param {string} options.message - Message text to test
 * @param {string} options.phone - Customer phone number
 * @param {string} options.customerName - Customer name (optional)
 * @param {string} options.businessId - Business ID for multi-tenant context
 * @param {string} options.provider - 'twilio' or 'meta'
 * @param {Object} options.sessionState - Initial session state (optional)
 * @returns {Promise<Object>} Response from message handler
 */
export async function testMessage({
  message = 'Hi',
  phone = '447448682282',
  customerName = 'Test Customer',
  businessId = 'test-business-001',
  provider = 'twilio',
  sessionState = null,
}) {
  const startTime = Date.now();

  console.log(`\n🧪 Testing message: "${message}"`);
  console.log(`📱 Phone: ${phone}`);
  console.log(`🏢 Business: ${businessId}`);
  console.log(`🔌 Provider: ${provider}`);

  try {
    // Generate mock webhook payload
    const { webhook } = generateWebhookWithContext({
      provider,
      businessId,
      message,
      phone,
    });

    // Extract phone number based on provider
    let normalizedPhone;
    if (provider === 'twilio') {
      // Twilio format: whatsapp:+447448682282
      const from = webhook.From;
      normalizedPhone = from.replace('whatsapp:', '').replace('+', '');
    } else {
      // Meta format: 447448682282 (no prefix)
      normalizedPhone = webhook.entry[0].changes[0].value.messages[0].from;
    }

    // Extract message ID
    const messageId = provider === 'twilio'
      ? webhook.MessageSid
      : webhook.entry[0].changes[0].value.messages[0].id;

    // Call message handler directly
    const response = await handleIncomingMessage({
      from: normalizedPhone,
      customerName,
      text: message,
      messageId,
      provider,
      businessId,
    });

    const duration = Date.now() - startTime;

    console.log(`✅ Test completed in ${duration}ms`);
    console.log(`📤 Response: ${response?.text?.substring(0, 100)}${response?.text?.length > 100 ? '...' : ''}`);

    return {
      success: true,
      duration,
      response,
      phone: normalizedPhone,
      businessId,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Test failed after ${duration}ms:`, error.message);

    return {
      success: false,
      duration,
      error: error.message,
      stack: error.stack,
    };
  }
}

/**
 * Test a conversation flow (multiple messages in sequence)
 *
 * @param {Object} options
 * @param {Array<string>} options.messages - Array of messages to send
 * @param {string} options.phone - Customer phone number
 * @param {string} options.customerName - Customer name
 * @param {string} options.businessId - Business ID
 * @param {string} options.provider - 'twilio' or 'meta'
 * @param {number} options.delayMs - Delay between messages (default: 100ms)
 * @returns {Promise<Object>} Conversation results
 */
export async function testConversation({
  messages = ['Hi', '2x palm oil', 'yes', 'cash'],
  phone = '447448682282',
  customerName = 'Test Customer',
  businessId = 'test-business-001',
  provider = 'twilio',
  delayMs = 100,
}) {
  console.log(`\n🧪 Testing conversation (${messages.length} messages)`);
  console.log(`📱 Phone: ${phone}`);
  console.log(`🏢 Business: ${businessId}`);

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    console.log(`\n--- Message ${i + 1}/${messages.length} ---`);

    const result = await testMessage({
      message,
      phone,
      customerName,
      businessId,
      provider,
    });

    results.push({
      step: i + 1,
      message,
      ...result,
    });

    // If test failed, stop the conversation
    if (!result.success) {
      console.error(`❌ Conversation stopped at step ${i + 1} due to error`);
      break;
    }

    // Delay before next message (simulate human timing)
    if (i < messages.length - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  const totalDuration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;

  console.log(`\n✅ Conversation completed: ${successCount}/${messages.length} messages successful`);
  console.log(`⏱️  Total time: ${totalDuration}ms`);

  return {
    success: successCount === messages.length,
    totalDuration,
    messagesCount: messages.length,
    successCount,
    results,
  };
}

/**
 * Test phone number format normalization
 *
 * @param {string} basePhone - Base phone number (e.g., '447448682282')
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Normalization test results
 */
export async function testPhoneFormats(basePhone, businessId = 'test-business-001') {
  console.log(`\n🧪 Testing phone number formats for: ${basePhone}`);

  const formats = [
    basePhone,                           // 447448682282
    `+${basePhone}`,                    // +447448682282
    `0${basePhone.substring(2)}`,       // 07448682282 (UK format)
  ];

  const results = [];

  for (const format of formats) {
    console.log(`\n--- Testing format: ${format} ---`);

    const result = await testMessage({
      message: 'Hi',
      phone: format,
      businessId,
      provider: 'twilio',
    });

    results.push({
      format,
      normalized: result.phone,
      success: result.success,
      response: result.response?.text,
    });
  }

  // Check if all formats normalized to the same phone number
  const normalizedPhones = results.map(r => r.normalized).filter(Boolean);
  const uniquePhones = [...new Set(normalizedPhones)];
  const allMatch = uniquePhones.length === 1;

  console.log(`\n${allMatch ? '✅' : '❌'} Phone format test: ${allMatch ? 'All formats normalized consistently' : 'Inconsistent normalization detected'}`);

  if (!allMatch) {
    console.log(`⚠️  Found ${uniquePhones.length} different normalized formats:`);
    uniquePhones.forEach(phone => console.log(`   - ${phone}`));
  }

  return {
    success: allMatch,
    formats: results,
    uniquePhones,
  };
}

/**
 * Test malformed webhook handling
 *
 * @param {string} scenario - Malformed scenario to test
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Error handling test results
 */
export async function testMalformedWebhook(scenario, businessId = 'test-business-001') {
  console.log(`\n🧪 Testing malformed webhook: ${scenario}`);

  try {
    const malformedWebhook = generateMalformedWebhook(scenario);

    // Try to extract fields that might be missing
    const from = malformedWebhook.From?.replace('whatsapp:', '').replace('+', '') || '';
    const messageId = malformedWebhook.MessageSid || 'test-message-id';
    const text = malformedWebhook.Body || '';

    console.log(`📥 Webhook fields: from=${from}, messageId=${messageId}, text="${text}"`);

    const result = await handleIncomingMessage({
      from,
      customerName: 'Test Customer',
      text,
      messageId,
      provider: 'twilio',
      businessId,
    });

    console.log(`✅ Handled malformed webhook gracefully`);
    console.log(`📤 Response: ${result?.text?.substring(0, 100)}`);

    return {
      success: true,
      handledGracefully: true,
      response: result,
    };
  } catch (error) {
    console.error(`❌ Malformed webhook caused error: ${error.message}`);

    return {
      success: false,
      handledGracefully: false,
      error: error.message,
      expectedBehavior: 'Should handle malformed webhooks gracefully',
    };
  }
}

/**
 * Replay a recorded conversation from a fixture file
 *
 * @param {Object} fixture - Conversation fixture
 * @param {string} businessId - Business ID override
 * @returns {Promise<Object>} Replay results
 */
export async function replayConversation(fixture, businessId = null) {
  console.log(`\n🧪 Replaying conversation: ${fixture.name}`);
  console.log(`📝 Description: ${fixture.description}`);

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < fixture.messages.length; i++) {
    const step = fixture.messages[i];
    console.log(`\n--- Step ${i + 1}/${fixture.messages.length}: ${step.label} ---`);

    const result = await testMessage({
      message: step.message,
      phone: fixture.phone,
      customerName: fixture.customerName,
      businessId: businessId || fixture.businessId,
      provider: fixture.provider || 'twilio',
    });

    // Validate expected response if provided
    let validated = true;
    let validationErrors = [];

    if (step.expectedIntent) {
      // We can't directly check intent without exposing it from message handler
      // For now, we'll check if response contains expected keywords
      console.log(`🔍 Expected intent: ${step.expectedIntent}`);
    }

    if (step.expectedKeywords) {
      for (const keyword of step.expectedKeywords) {
        if (!result.response?.text?.toLowerCase().includes(keyword.toLowerCase())) {
          validated = false;
          validationErrors.push(`Missing expected keyword: "${keyword}"`);
        }
      }
    }

    if (!validated) {
      console.warn(`⚠️  Validation failed:`);
      validationErrors.forEach(err => console.warn(`   - ${err}`));
    } else {
      console.log(`✅ Validation passed`);
    }

    results.push({
      step: i + 1,
      label: step.label,
      message: step.message,
      validated,
      validationErrors,
      ...result,
    });

    // Stop if test failed
    if (!result.success) {
      console.error(`❌ Replay stopped at step ${i + 1} due to error`);
      break;
    }
  }

  const totalDuration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const validatedCount = results.filter(r => r.validated).length;

  console.log(`\n✅ Replay completed: ${successCount}/${fixture.messages.length} messages successful`);
  console.log(`✅ Validation: ${validatedCount}/${fixture.messages.length} steps validated`);
  console.log(`⏱️  Total time: ${totalDuration}ms`);

  return {
    success: successCount === fixture.messages.length,
    totalDuration,
    messagesCount: fixture.messages.length,
    successCount,
    validatedCount,
    results,
    fixture: fixture.name,
  };
}

/**
 * Generate a test report summary
 *
 * @param {Object} results - Test results
 * @returns {string} Formatted report
 */
export function generateTestReport(results) {
  let report = '\n' + '='.repeat(60) + '\n';
  report += '📊 TEST REPORT\n';
  report += '='.repeat(60) + '\n\n';

  if (results.fixture) {
    report += `Fixture: ${results.fixture}\n`;
  }

  report += `Messages: ${results.messagesCount}\n`;
  report += `Success: ${results.successCount}/${results.messagesCount}\n`;

  if (results.validatedCount !== undefined) {
    report += `Validated: ${results.validatedCount}/${results.messagesCount}\n`;
  }

  report += `Duration: ${results.totalDuration}ms\n`;
  report += `Avg per message: ${Math.round(results.totalDuration / results.messagesCount)}ms\n\n`;

  report += `Status: ${results.success ? '✅ PASSED' : '❌ FAILED'}\n`;

  if (!results.success) {
    report += '\nFailed steps:\n';
    results.results
      .filter(r => !r.success)
      .forEach(r => {
        report += `  ${r.step}. ${r.message}: ${r.error}\n`;
      });
  }

  if (results.validatedCount !== undefined && results.validatedCount < results.messagesCount) {
    report += '\nValidation failures:\n';
    results.results
      .filter(r => !r.validated)
      .forEach(r => {
        report += `  ${r.step}. ${r.label}:\n`;
        r.validationErrors?.forEach(err => report += `     - ${err}\n`);
      });
  }

  report += '\n' + '='.repeat(60) + '\n';

  return report;
}

export default {
  testMessage,
  testConversation,
  testPhoneFormats,
  testMalformedWebhook,
  replayConversation,
  generateTestReport,
};
