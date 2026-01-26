#!/usr/bin/env node

/**
 * WhatsApp Bot Debugger CLI
 *
 * Command-line interface for testing and debugging the WhatsApp bot
 * without requiring live Twilio or Meta webhooks.
 */

import {
  testMessage,
  testConversation,
  replayConversation,
  generateTestReport,
} from './test-harness.js';
import { generateTwilioWebhook, generateMetaWebhook } from './generators/webhook-mock.js';
import {
  validateTenantIsolation,
  generateTenantValidationReport,
} from './validators/tenant-isolation.js';
import {
  testPhoneFormats,
  generatePhoneFormatReport,
} from './validators/phone-formats.js';
import {
  simulateErrorScenario,
  generateErrorSimulationReport,
  ERROR_SCENARIOS,
} from './simulators/error-scenarios.js';
import {
  runHealthChecks,
  generateHealthCheckReport,
} from './monitors/health-checks.js';
import fs from 'fs';
import path from 'path';

// Default values
const DEFAULT_BUSINESS_ID = 'test-business-001';
const DEFAULT_PHONE = '447448682282';
const DEFAULT_PROVIDER = 'twilio';

/**
 * Parse command-line arguments
 */
function parseArgs(args) {
  const parsed = {
    command: args[0],
    positional: [],
    options: {},
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      // Option flag
      const key = arg.substring(2);
      const value = args[i + 1];

      if (value && !value.startsWith('--')) {
        parsed.options[key] = value;
        i++; // Skip next arg
      } else {
        parsed.options[key] = true;
      }
    } else {
      // Positional argument
      parsed.positional.push(arg);
    }
  }

  return parsed;
}

/**
 * Display usage information
 */
function showUsage() {
  console.log(`
WhatsApp Bot Debugger CLI

Usage: node debugger-cli.js <command> [options]

Commands:

  test-message <message>
      Test a single message through the bot

      Options:
        --business-id <id>    Business ID (default: test-business-001)
        --phone <number>      Customer phone number (default: 447448682282)
        --provider <provider> WhatsApp provider: twilio|meta (default: twilio)

      Example:
        node debugger-cli.js test-message "2x palm oil to SE15 4AA" --business-id test-001

  test-conversation <messages...>
      Test a conversation flow with multiple messages

      Options:
        --business-id <id>    Business ID
        --phone <number>      Customer phone number
        --provider <provider> WhatsApp provider

      Example:
        node debugger-cli.js test-conversation "Hi" "2x palm oil" "yes" "cash"

  check-phone-formats <phone>
      Test phone number normalization across different formats

      Options:
        --business-id <id>    Business ID

      Example:
        node debugger-cli.js check-phone-formats 447448682282

  replay-conversation <fixture-file>
      Replay a recorded conversation from a JSON fixture

      Options:
        --business-id <id>    Override business ID from fixture

      Example:
        node debugger-cli.js replay-conversation fixtures/complete-order-flow.json

  simulate-failure <scenario>
      Simulate error scenarios to test error handling

      Scenarios:
        - database-timeout    (database connection timeout)
        - rpc-failure         (stock decrement RPC failure)
        - malformed-webhook   (malformed webhook payload)
        - session-cache-miss  (session not found in cache)
        - missing-from        (webhook missing 'from' field)
        - missing-body        (webhook missing 'body' field)
        - invalid-format      (malformed phone number)
        - empty-payload       (empty webhook)
        - network-failure     (network timeout/error)
        - invalid-business-id (business ID does not exist)

      Example:
        node debugger-cli.js simulate-failure missing-from

  generate-mock-webhook <provider>
      Generate a mock webhook payload

      Options:
        --message <text>      Message content (default: "Hi")
        --phone <number>      Customer phone number
        --output <file>       Save to file (optional)

      Example:
        node debugger-cli.js generate-mock-webhook meta --message "Hi" --output webhook.json

  health-check
      Run proactive health checks on the WhatsApp bot system

      Example:
        node debugger-cli.js health-check

  validate-tenant <business-id>
      Validate multi-tenant isolation for a business

      Example:
        node debugger-cli.js validate-tenant test-business-001

  help
      Show this help message
`);
}

/**
 * Execute command
 */
async function executeCommand(command, positional, options) {
  try {
    switch (command) {
      case 'test-message': {
        const message = positional[0];
        if (!message) {
          console.error('❌ Error: Message text required');
          console.log('Usage: node debugger-cli.js test-message <message> [options]');
          process.exit(1);
        }

        const result = await testMessage({
          message,
          phone: options.phone || DEFAULT_PHONE,
          businessId: options['business-id'] || DEFAULT_BUSINESS_ID,
          provider: options.provider || DEFAULT_PROVIDER,
        });

        if (result.success) {
          console.log('\n✅ SUCCESS');
          console.log(`Duration: ${result.duration}ms`);
          console.log(`\nResponse:\n${result.response?.text || '(no response)'}`);
        } else {
          console.error('\n❌ FAILURE');
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        break;
      }

      case 'test-conversation': {
        const messages = positional;
        if (messages.length === 0) {
          console.error('❌ Error: At least one message required');
          console.log('Usage: node debugger-cli.js test-conversation <message1> <message2> ...');
          process.exit(1);
        }

        const result = await testConversation({
          messages,
          phone: options.phone || DEFAULT_PHONE,
          businessId: options['business-id'] || DEFAULT_BUSINESS_ID,
          provider: options.provider || DEFAULT_PROVIDER,
        });

        console.log(generateTestReport(result));

        if (!result.success) {
          process.exit(1);
        }
        break;
      }

      case 'check-phone-formats': {
        const phone = positional[0];
        if (!phone) {
          console.error('❌ Error: Phone number required');
          console.log('Usage: node debugger-cli.js check-phone-formats <phone>');
          process.exit(1);
        }

        const result = await testPhoneFormats(
          phone,
          options['business-id'] || DEFAULT_BUSINESS_ID
        );

        console.log(generatePhoneFormatReport(result));

        if (!result.success) {
          process.exit(1);
        }
        break;
      }

      case 'replay-conversation': {
        const fixturePath = positional[0];
        if (!fixturePath) {
          console.error('❌ Error: Fixture file path required');
          console.log('Usage: node debugger-cli.js replay-conversation <fixture-file>');
          process.exit(1);
        }

        // Load fixture
        const absolutePath = path.resolve(fixturePath);
        if (!fs.existsSync(absolutePath)) {
          console.error(`❌ Error: Fixture file not found: ${absolutePath}`);
          process.exit(1);
        }

        const fixture = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
        const result = await replayConversation(
          fixture,
          options['business-id'] || null
        );

        console.log(generateTestReport(result));

        if (!result.success) {
          process.exit(1);
        }
        break;
      }

      case 'simulate-failure': {
        const scenario = positional[0];
        if (!scenario) {
          console.error('❌ Error: Scenario required');
          console.log('Usage: node debugger-cli.js simulate-failure <scenario>');
          console.log(`Available scenarios: ${Object.keys(ERROR_SCENARIOS).join(', ')}`);
          process.exit(1);
        }

        const result = await simulateErrorScenario(
          scenario,
          options['business-id'] || DEFAULT_BUSINESS_ID
        );

        console.log(generateErrorSimulationReport(result));

        if (!result.handledGracefully) {
          process.exit(1);
        }
        break;
      }

      case 'generate-mock-webhook': {
        const provider = positional[0];
        if (!provider || !['twilio', 'meta'].includes(provider)) {
          console.error('❌ Error: Provider required (twilio or meta)');
          console.log('Usage: node debugger-cli.js generate-mock-webhook <twilio|meta> [options]');
          process.exit(1);
        }

        const message = options.message || 'Hi';
        const phone = options.phone || DEFAULT_PHONE;

        const webhook =
          provider === 'twilio'
            ? generateTwilioWebhook({ message, phone })
            : generateMetaWebhook({ message, phone });

        const json = JSON.stringify(webhook, null, 2);

        if (options.output) {
          fs.writeFileSync(options.output, json, 'utf8');
          console.log(`✅ Mock webhook saved to: ${options.output}`);
        } else {
          console.log('\n📤 Mock Webhook Payload:\n');
          console.log(json);
        }
        break;
      }

      case 'health-check': {
        const result = await runHealthChecks();
        console.log(generateHealthCheckReport(result));

        if (result.overallStatus === 'fail') {
          process.exit(1);
        }
        break;
      }

      case 'validate-tenant': {
        const businessId = positional[0];
        if (!businessId) {
          console.error('❌ Error: Business ID required');
          console.log('Usage: node debugger-cli.js validate-tenant <business-id>');
          process.exit(1);
        }

        const result = await validateTenantIsolation(businessId);
        console.log(generateTenantValidationReport(result));

        if (!result.success) {
          process.exit(1);
        }
        break;
      }

      case 'help':
      default:
        showUsage();
        break;
    }
  } catch (error) {
    console.error('\n❌ Command execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  showUsage();
  process.exit(0);
}

const { command, positional, options } = parseArgs(args);
executeCommand(command, positional, options);
