# WhatsApp Bot Debugger

Test and debug the Apinlero WhatsApp bot without live webhooks.

## Overview

This skill enables offline testing, validation, and debugging of the WhatsApp bot's multi-tenant architecture, conversation flows, and error handling.

## Commands

### test-message
Test a single message through the bot's message handling pipeline.

**Usage:**
```bash
/whatsapp-debug test-message <message> [options]
```

**Options:**
- `--business-id <id>` - Business ID for multi-tenant context (default: test-business-001)
- `--phone <number>` - Customer phone number (default: 447448682282)
- `--provider <twilio|meta>` - WhatsApp provider (default: twilio)
- `--session-state <state>` - Initial session state (default: none)

**Example:**
```bash
/whatsapp-debug test-message "2x palm oil to SE15 4AA" --business-id test-001 --phone 447448682282
```

### validate-tenant
Validate multi-tenant isolation for a specific business.

**Usage:**
```bash
/whatsapp-debug validate-tenant <business-id>
```

**Checks:**
- Session cache key formatting
- Customer query isolation
- Order query isolation
- Product catalog access
- Cross-tenant data leak detection

**Example:**
```bash
/whatsapp-debug validate-tenant test-business-001
```

### check-phone-formats
Test phone number normalization and customer matching across formats.

**Usage:**
```bash
/whatsapp-debug check-phone-formats <phone-number>
```

**Tests:**
- E.164 format (+447448682282)
- National format (07448682282)
- WhatsApp format (whatsapp:+447448682282)
- Ensures single customer match across all formats

**Example:**
```bash
/whatsapp-debug check-phone-formats 447448682282
```

### replay-conversation
Replay a recorded conversation and validate state transitions.

**Usage:**
```bash
/whatsapp-debug replay-conversation <fixture-file>
```

**Example:**
```bash
/whatsapp-debug replay-conversation complete-order-flow.json
```

### simulate-failure
Simulate error scenarios to test error handling.

**Usage:**
```bash
/whatsapp-debug simulate-failure <scenario>
```

**Scenarios:**
- `database-timeout` - Database connection timeout
- `rpc-failure` - Stock decrement RPC failure
- `malformed-webhook` - Invalid webhook payload
- `session-cache-miss` - Session not found in cache

**Example:**
```bash
/whatsapp-debug simulate-failure database-timeout
```

### health-check
Run proactive health checks on the WhatsApp bot system.

**Usage:**
```bash
/whatsapp-debug health-check
```

**Checks:**
- Database connectivity (Supabase)
- Session cache health
- Product catalog availability
- Message log size
- Neo4j connectivity (if configured)

**Example:**
```bash
/whatsapp-debug health-check
```

### generate-mock-webhook
Generate mock webhook payload for testing.

**Usage:**
```bash
/whatsapp-debug generate-mock-webhook <provider> [options]
```

**Providers:**
- `twilio` - Twilio WhatsApp webhook format
- `meta` - Meta WhatsApp Cloud API format

**Options:**
- `--message <text>` - Message content
- `--phone <number>` - Customer phone number
- `--output <file>` - Save to file (optional)

**Example:**
```bash
/whatsapp-debug generate-mock-webhook meta --message "Hi" --phone 447448682282 --output webhook.json
```

## Implementation Details

The skill uses these components:

1. **debugger-cli.js** - Command routing and execution
2. **test-harness.js** - Message injection without webhooks
3. **generators/webhook-mock.js** - Mock payload generation
4. **validators/** - Tenant isolation and phone format validation
5. **simulators/** - Error injection for testing
6. **monitors/** - Proactive health checks
7. **fixtures/** - Test data and conversation flows

## Quick Start

```bash
# Install dependencies (if not already installed)
cd whatsapp-bot
npm install

# Test a simple message
/whatsapp-debug test-message "Hi"

# Run health check
/whatsapp-debug health-check

# Validate multi-tenant isolation (CRITICAL)
/whatsapp-debug validate-tenant test-business-001
```

## Success Criteria

- ✅ Tests any conversation flow in < 5 seconds
- ✅ Detects multi-tenant isolation issues automatically
- ✅ Validates phone number matching across all formats
- ✅ Simulates and verifies error recovery
- ✅ Runs full test suite in < 30 seconds
- ✅ Generates clear, actionable error reports

## Integration with Claude Code

When you invoke `/whatsapp-debug <command>`, Claude Code will:

1. Read this skill definition
2. Execute the appropriate command via `whatsapp-bot/debugger-cli.js`
3. Display results in a structured format
4. Provide actionable recommendations for any issues found

## Output Format

All commands return structured output:

```
✅ SUCCESS | ⚠️ WARNING | ❌ FAILURE

Command: <command-name>
Duration: <milliseconds>ms

Results:
  <key-findings>

Issues Found: <count>
  - <issue-1>
  - <issue-2>

Recommendations:
  - <recommendation-1>
  - <recommendation-2>
```

## Notes

- All tests run offline without live Twilio/Meta webhooks
- Uses in-memory mock for webhook payloads
- Directly imports and tests existing bot code
- No modifications required to bot implementation
- Safe to run in development and production codebases
