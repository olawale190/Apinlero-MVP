/**
 * Phone Format Validator
 *
 * Tests phone number normalization and customer matching across different formats:
 * - E.164 format (+447448682282)
 * - National format (07448682282)
 * - International without + (447448682282)
 * - WhatsApp format (whatsapp:+447448682282)
 *
 * Ensures that all formats normalize to the same value and match the same customer.
 */

import { testMessage } from '../test-harness.js';

/**
 * Normalize phone number to consistent format
 *
 * @param {string} phone - Phone number in any format
 * @returns {string} Normalized phone number (digits only, no +)
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return '';

  // Remove all non-digit characters and leading + or whatsapp: prefix
  return phone
    .replace('whatsapp:', '')
    .replace(/\D/g, '')
    .replace(/^0+/, ''); // Remove leading zeros for national format
}

/**
 * Generate test formats for a phone number
 *
 * @param {string} basePhone - Base phone number (e.g., 447448682282)
 * @returns {Array<Object>} Array of format variations
 */
export function generatePhoneFormats(basePhone) {
  // Remove any existing formatting
  const digits = normalizePhoneNumber(basePhone);

  const formats = [
    {
      name: 'E.164 format',
      value: `+${digits}`,
      description: 'Standard international format with +',
    },
    {
      name: 'International (no +)',
      value: digits,
      description: 'International format without +',
    },
    {
      name: 'WhatsApp format',
      value: `whatsapp:+${digits}`,
      description: 'Twilio WhatsApp format',
    },
  ];

  // Add national format if UK number (starts with 44)
  if (digits.startsWith('44')) {
    const nationalNumber = '0' + digits.substring(2);
    formats.push({
      name: 'UK national format',
      value: nationalNumber,
      description: 'National format with leading 0',
    });
  }

  return formats;
}

/**
 * Test phone number normalization across formats
 *
 * @param {string} phone - Base phone number to test
 * @param {string} businessId - Business ID for context
 * @returns {Promise<Object>} Test results
 */
export async function testPhoneFormats(phone, businessId = 'test-business-001') {
  console.log(`\n📱 Testing phone number normalization for: ${phone}\n`);

  const formats = generatePhoneFormats(phone);
  const results = {
    phone,
    businessId,
    success: true,
    formats: [],
    uniquePhones: new Set(),
    issues: [],
    recommendations: [],
  };

  // Test each format variation
  for (const format of formats) {
    console.log(`Testing ${format.name}: ${format.value}`);

    try {
      const result = await testMessage({
        message: 'Hi',
        phone: format.value,
        businessId,
      });

      const normalizedPhone = normalizePhoneNumber(result.phone || format.value);
      results.uniquePhones.add(normalizedPhone);

      results.formats.push({
        format: format.name,
        original: format.value,
        normalized: normalizedPhone,
        success: result.success,
        description: format.description,
      });

      console.log(`  → Normalized to: ${normalizedPhone}`);
      console.log(`  ${result.success ? '✅' : '❌'} ${result.success ? 'Success' : 'Failed'}\n`);
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
      results.success = false;
      results.formats.push({
        format: format.name,
        original: format.value,
        normalized: null,
        success: false,
        error: error.message,
        description: format.description,
      });
      results.issues.push(`Failed to normalize ${format.name}: ${error.message}`);
    }
  }

  // Check if all formats normalized to the same value
  if (results.uniquePhones.size === 0) {
    results.success = false;
    results.issues.push('No phone numbers were successfully normalized');
  } else if (results.uniquePhones.size > 1) {
    results.success = false;
    results.issues.push(
      `CRITICAL: Phone formats normalized to ${results.uniquePhones.size} different values. ` +
      `Expected 1 unique value, got: ${Array.from(results.uniquePhones).join(', ')}`
    );
    results.recommendations.push(
      'Review phone normalization logic in message handler to ensure consistent formatting'
    );
  } else {
    console.log(`✅ All formats normalized to: ${Array.from(results.uniquePhones)[0]}`);
  }

  return results;
}

/**
 * Test customer matching across phone formats
 *
 * Ensures that the same customer is matched regardless of phone number format
 *
 * @param {string} phone - Base phone number
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Test results
 */
export async function testCustomerMatching(phone, businessId = 'test-business-001') {
  console.log(`\n👤 Testing customer matching across phone formats\n`);

  const formats = generatePhoneFormats(phone);
  const results = {
    phone,
    businessId,
    success: true,
    customerIds: new Set(),
    formats: [],
    issues: [],
  };

  // Send initial message to create customer
  console.log('Creating customer with first format...');
  const firstFormat = formats[0];

  try {
    const createResult = await testMessage({
      message: 'My name is Test Customer and I want to place an order',
      phone: firstFormat.value,
      businessId,
    });

    if (!createResult.success) {
      results.success = false;
      results.issues.push('Failed to create customer with initial format');
      return results;
    }

    console.log(`✅ Customer created\n`);

    // Test if other formats match the same customer
    for (let i = 1; i < formats.length; i++) {
      const format = formats[i];
      console.log(`Testing ${format.name}: ${format.value}`);

      try {
        const result = await testMessage({
          message: 'What is my order status?',
          phone: format.value,
          businessId,
        });

        results.formats.push({
          format: format.name,
          original: format.value,
          matched: result.success,
        });

        if (result.success) {
          console.log(`  ✅ Customer matched\n`);
        } else {
          console.log(`  ❌ Customer not matched\n`);
          results.success = false;
          results.issues.push(
            `Customer not matched for ${format.name} (${format.value})`
          );
        }
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}\n`);
        results.success = false;
        results.issues.push(
          `Error testing ${format.name}: ${error.message}`
        );
      }
    }
  } catch (error) {
    console.error(`❌ Failed to create customer: ${error.message}`);
    results.success = false;
    results.issues.push(`Failed to create customer: ${error.message}`);
  }

  return results;
}

/**
 * Generate a formatted report from phone format test results
 *
 * @param {Object} results - Test results
 * @returns {string} Formatted report
 */
export function generatePhoneFormatReport(results) {
  const { phone, businessId, success, formats, uniquePhones, issues, recommendations } = results;

  let report = '\n' + '='.repeat(60) + '\n';
  report += `PHONE FORMAT VALIDATION REPORT\n`;
  report += `Base Phone: ${phone}\n`;
  report += `Business ID: ${businessId}\n`;
  report += '='.repeat(60) + '\n\n';

  report += `Status: ${success ? '✅ PASSED' : '❌ FAILED'}\n\n`;

  report += `Formats Tested: ${formats.length}\n`;
  report += `Unique Normalized Values: ${uniquePhones.size}\n\n`;

  report += 'Format Test Results:\n';
  formats.forEach((f, index) => {
    const icon = f.success ? '✅' : '❌';
    report += `  ${index + 1}. ${icon} ${f.format}\n`;
    report += `     Original:   ${f.original}\n`;
    report += `     Normalized: ${f.normalized || '(failed)'}\n`;
    if (f.description) {
      report += `     ${f.description}\n`;
    }
    if (f.error) {
      report += `     Error: ${f.error}\n`;
    }
    report += '\n';
  });

  if (uniquePhones.size > 0) {
    report += 'Normalized Values:\n';
    Array.from(uniquePhones).forEach((phone, index) => {
      report += `  ${index + 1}. ${phone}\n`;
    });
    report += '\n';
  }

  if (issues.length > 0) {
    report += `Issues Found (${issues.length}):\n`;
    issues.forEach((issue, index) => {
      report += `  ${index + 1}. ${issue}\n`;
    });
    report += '\n';
  }

  if (recommendations.length > 0) {
    report += `Recommendations (${recommendations.length}):\n`;
    recommendations.forEach((rec, index) => {
      report += `  ${index + 1}. ${rec}\n`;
    });
    report += '\n';
  }

  report += '='.repeat(60) + '\n';

  return report;
}
