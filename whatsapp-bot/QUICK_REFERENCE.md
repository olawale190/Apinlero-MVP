# WhatsApp Bot Debugger - Quick Reference

## Common Commands

### 1. Test a Single Message
```bash
node debugger-cli.js test-message "2x palm oil to SE15 4AA"

# With options
node debugger-cli.js test-message "Hi" \
  --business-id test-business-001 \
  --phone 447448682282 \
  --provider twilio
```

### 2. Test Full Conversation
```bash
node debugger-cli.js test-conversation "Hi" "2x palm oil" "yes" "cash"
```

### 3. Health Check (System Status)
```bash
node debugger-cli.js health-check
```
**Checks**: Database, environment, application modules, external services

### 4. Validate Multi-Tenant Isolation
```bash
node debugger-cli.js validate-tenant test-business-001
```
**Critical for**: Preventing data leaks between businesses

### 5. Test Phone Format Normalization
```bash
node debugger-cli.js check-phone-formats 447448682282

# With business context
node debugger-cli.js check-phone-formats 447448682282 --business-id test-001
```
**Tests**: E.164, international, WhatsApp, national formats

### 6. Simulate Error Scenarios
```bash
# Test specific error
node debugger-cli.js simulate-failure missing-from

# Available scenarios:
# - database-timeout
# - rpc-failure
# - malformed-webhook
# - session-cache-miss
# - missing-from
# - missing-body
# - invalid-format
# - empty-payload
# - network-failure
# - invalid-business-id
```

### 7. Replay Conversation from Fixture
```bash
node debugger-cli.js replay-conversation fixtures/test-conversations/complete-order-flow.json

# Override business ID
node debugger-cli.js replay-conversation fixtures/complete-order.json --business-id custom-001
```

### 8. Generate Mock Webhooks
```bash
# Twilio format
node debugger-cli.js generate-mock-webhook twilio \
  --message "Test message" \
  --phone 447448682282 \
  --output webhook-twilio.json

# Meta format
node debugger-cli.js generate-mock-webhook meta \
  --message "Test message" \
  --phone 447448682282
```

## Using with Claude Code

From the Claude Code CLI:

```bash
# Health check
/whatsapp-debug health-check

# Tenant isolation validation
/whatsapp-debug validate-tenant test-business-001

# Phone format testing
/whatsapp-debug check-phone-formats 447448682282

# Error simulation
/whatsapp-debug simulate-failure database-timeout

# Test message
/whatsapp-debug test-message "2x palm oil to SE15 4AA"
```

## Quick Debugging Workflow

### Before Deployment
```bash
# 1. Run health check
node debugger-cli.js health-check

# 2. Validate tenant isolation
node debugger-cli.js validate-tenant your-business-id

# 3. Test phone formats
node debugger-cli.js check-phone-formats 447448682282

# 4. Test error handling
node debugger-cli.js simulate-failure missing-from
node debugger-cli.js simulate-failure empty-payload
```

### Troubleshooting Customer Issues
```bash
# 1. Test their exact message
node debugger-cli.js test-message "customer's exact message" \
  --business-id their-business-id \
  --phone their-phone-number

# 2. Check phone format normalization
node debugger-cli.js check-phone-formats their-phone-number

# 3. Replay conversation if available
node debugger-cli.js replay-conversation fixtures/customer-issue.json
```

### Testing New Features
```bash
# 1. Test conversation flow
node debugger-cli.js test-conversation "message1" "message2" "message3"

# 2. Test across formats
node debugger-cli.js check-phone-formats 447448682282

# 3. Simulate edge cases
node debugger-cli.js simulate-failure invalid-format
node debugger-cli.js simulate-failure session-cache-miss
```

## Understanding Output

### Success Indicators
- ✅ Green checkmark = Test passed
- Duration in milliseconds
- Response text shown

### Warning Indicators
- ⚠️ Warning symbol = Non-critical issue
- Configuration missing but optional
- Feature not enabled

### Failure Indicators
- ❌ Red X = Test failed
- Error message included
- Exit code 1 (process.exit(1))

## Report Sections

All commands generate structured reports with:

1. **Status** - Overall pass/fail
2. **Summary** - Key metrics and counts
3. **Results** - Detailed findings per check
4. **Issues** - Problems discovered
5. **Recommendations** - Actionable next steps

## Common Options

```bash
--business-id <id>    # Multi-tenant context (default: test-business-001)
--phone <number>      # Customer phone number (default: 447448682282)
--provider <provider> # WhatsApp provider: twilio|meta (default: twilio)
--output <file>       # Save output to file (for mock webhooks)
--message <text>      # Message content (for mock webhooks)
```

## Environment Variables

Required:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key

Optional:
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `META_ACCESS_TOKEN` - Meta WhatsApp access token
- `NEO4J_URI` - Neo4j database URI
- `NEO4J_USERNAME` - Neo4j username
- `NEO4J_PASSWORD` - Neo4j password

## Tips

### 1. Faster Testing
Use fixtures for repeated tests instead of typing messages:
```bash
node debugger-cli.js replay-conversation fixtures/common-order.json
```

### 2. Batch Testing
Create shell scripts for common test suites:
```bash
#!/bin/bash
node debugger-cli.js health-check
node debugger-cli.js validate-tenant test-001
node debugger-cli.js check-phone-formats 447448682282
```

### 3. Debugging Phone Issues
Always test both formats:
```bash
node debugger-cli.js check-phone-formats 447448682282
node debugger-cli.js check-phone-formats +447448682282
```

### 4. Systematic Error Testing
Test all error scenarios before production:
```bash
for scenario in missing-from missing-body invalid-format empty-payload; do
  echo "Testing $scenario..."
  node debugger-cli.js simulate-failure $scenario
done
```

### 5. CI/CD Integration
Add to your CI pipeline:
```yaml
test:
  script:
    - cd whatsapp-bot
    - node debugger-cli.js health-check
    - node debugger-cli.js validate-tenant test-business-001
    - node debugger-cli.js simulate-failure missing-from
```

## Getting Help

```bash
# Show all commands
node debugger-cli.js help

# Command-specific help
node debugger-cli.js test-message
# (Shows usage when required args missing)
```

## Exit Codes

- `0` - Success, all tests passed
- `1` - Failure, at least one test failed

Use in scripts:
```bash
if node debugger-cli.js health-check; then
  echo "System healthy, deploying..."
  ./deploy.sh
else
  echo "Health check failed, aborting deployment"
  exit 1
fi
```
