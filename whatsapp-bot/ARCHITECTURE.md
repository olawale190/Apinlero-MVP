# WhatsApp Bot Debugger - Architecture

## System Overview

The WhatsApp Bot Debugger is a modular testing framework that enables offline testing and validation of the WhatsApp bot without requiring live webhooks.

```
┌─────────────────────────────────────────────────────────────────┐
│                     WhatsApp Bot Debugger                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────┐         ┌──────────────────────────────┐    │
│  │ debugger-cli  │────────>│     Command Routing          │    │
│  │  (Entry Point)│         │  - Parse arguments           │    │
│  └───────────────┘         │  - Execute commands          │    │
│                            │  - Format output             │    │
│                            └──────────────────────────────┘    │
│                                      │                          │
│              ┌───────────────────────┼───────────────────────┐ │
│              │                       │                       │ │
│              ▼                       ▼                       ▼ │
│     ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│     │  Validators/   │    │  Simulators/   │    │  Monitors/     │
│     │                │    │                │    │                │
│     │ - Tenant       │    │ - Error        │    │ - Health       │
│     │   Isolation    │    │   Scenarios    │    │   Checks       │
│     │ - Phone        │    │ - Failure      │    │ - System       │
│     │   Formats      │    │   Injection    │    │   Status       │
│     └────────────────┘    └────────────────┘    └────────────────┘
│              │                       │                       │    │
│              └───────────────────────┼───────────────────────┘    │
│                                      ▼                             │
│                          ┌───────────────────┐                    │
│                          │  Test Harness     │                    │
│                          │  - Message testing│                    │
│                          │  - Conversation   │                    │
│                          │  - Fixtures       │                    │
│                          └───────────────────┘                    │
│                                      │                             │
│                                      ▼                             │
│                          ┌───────────────────┐                    │
│                          │ Message Handler   │                    │
│                          │ (Bot Logic)       │                    │
│                          └───────────────────┘                    │
│                                      │                             │
│              ┌───────────────────────┼───────────────────────┐    │
│              ▼                       ▼                       ▼    │
│     ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│     │   Supabase     │    │   Neo4j        │    │   Twilio/Meta  │
│     │   Database     │    │   Graph DB     │    │   WhatsApp     │
│     └────────────────┘    └────────────────┘    └────────────────┘
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Module Architecture

### Core Modules

#### 1. CLI Layer (`debugger-cli.js`)
**Responsibility**: Command-line interface and routing

```javascript
Commands
├── test-message          → test-harness.js
├── test-conversation     → test-harness.js
├── check-phone-formats   → validators/phone-formats.js
├── validate-tenant       → validators/tenant-isolation.js
├── simulate-failure      → simulators/error-scenarios.js
├── health-check          → monitors/health-checks.js
├── replay-conversation   → test-harness.js
└── generate-mock-webhook → generators/webhook-mock.js
```

**Key Functions**:
- Parse CLI arguments
- Route to appropriate module
- Format and display output
- Handle exit codes

#### 2. Test Harness (`test-harness.js`)
**Responsibility**: Core testing functionality

```javascript
Functions
├── testMessage()           // Test single message
├── testConversation()      // Test message sequence
├── replayConversation()    // Replay from fixture
└── generateTestReport()    // Format test results
```

**Dependencies**:
- Message handler (bot logic)
- Webhook generators
- Supabase database

#### 3. Validators (`validators/`)
**Responsibility**: Data correctness and isolation validation

```javascript
tenant-isolation.js
├── validateTenantIsolation()
│   ├── Multiple customers per business
│   ├── Cross-tenant isolation
│   ├── Session cache key formatting
│   ├── Database query isolation
│   └── Data leak detection
└── generateTenantValidationReport()

phone-formats.js
├── testPhoneFormats()
│   ├── E.164 format
│   ├── International format
│   ├── WhatsApp format
│   └── National format
├── testCustomerMatching()
├── normalizePhoneNumber()
└── generatePhoneFormatReport()
```

#### 4. Simulators (`simulators/`)
**Responsibility**: Error injection and resilience testing

```javascript
error-scenarios.js
├── simulateErrorScenario()
│   ├── database-timeout
│   ├── rpc-failure
│   ├── malformed-webhook
│   ├── session-cache-miss
│   ├── missing-from
│   ├── missing-body
│   ├── invalid-format
│   ├── empty-payload
│   ├── network-failure
│   └── invalid-business-id
├── runAllErrorScenarios()
└── generateErrorSimulationReport()
```

#### 5. Monitors (`monitors/`)
**Responsibility**: System health and status monitoring

```javascript
health-checks.js
├── runHealthChecks()
│   ├── Database checks
│   │   ├── Supabase connection
│   │   └── Schema validation
│   ├── Environment checks
│   │   ├── Required variables
│   │   └── Optional variables
│   ├── Application checks
│   │   ├── Message handler
│   │   └── Directory structure
│   └── External service checks
│       ├── Neo4j
│       ├── Twilio
│       └── Meta WhatsApp
└── generateHealthCheckReport()
```

#### 6. Generators (`generators/`)
**Responsibility**: Mock data generation

```javascript
webhook-mock.js
├── generateTwilioWebhook()
├── generateMetaWebhook()
├── generateWebhookWithContext()
└── generateMalformedWebhook()
```

## Data Flow

### 1. Test Message Flow
```
User Command
    │
    ▼
debugger-cli.js (parse args)
    │
    ▼
test-harness.js (testMessage)
    │
    ├─> webhook-mock.js (generate payload)
    │
    ▼
message-handler.js (bot logic)
    │
    ├─> Supabase (database queries)
    ├─> Neo4j (product matching)
    └─> Session cache (state management)
    │
    ▼
Response (text, metadata)
    │
    ▼
debugger-cli.js (format output)
    │
    ▼
User sees result
```

### 2. Validation Flow
```
User Command (validate-tenant)
    │
    ▼
debugger-cli.js
    │
    ▼
validators/tenant-isolation.js
    │
    ├─> test-harness.js (multiple test messages)
    │   │
    │   └─> message-handler.js
    │
    ├─> Supabase (check schema)
    │
    └─> Collect results
    │
    ▼
generateTenantValidationReport()
    │
    ▼
User sees validation report
```

### 3. Health Check Flow
```
User Command (health-check)
    │
    ▼
debugger-cli.js
    │
    ▼
monitors/health-checks.js
    │
    ├─> Check Supabase connection
    ├─> Check database schema
    ├─> Check environment variables
    ├─> Check message handler
    ├─> Check directory structure
    ├─> Check Neo4j (if configured)
    ├─> Check Twilio config
    └─> Check Meta config
    │
    ▼
generateHealthCheckReport()
    │
    ▼
User sees health status
```

## Design Principles

### 1. Modularity
- Each module has a single, well-defined responsibility
- Modules can be used independently
- Clear interfaces between modules

### 2. Testability
- All modules can be imported and tested separately
- Mock data generators enable offline testing
- No dependency on live external services

### 3. Extensibility
- Easy to add new validators
- Simple to create new error scenarios
- Straightforward to add health checks

### 4. Reporting
- All modules generate structured reports
- Consistent output format across commands
- Clear pass/fail indicators

### 5. Zero Impact
- Doesn't modify bot code
- Runs independently of live system
- Can be used in development and production

## Key Patterns

### 1. Validator Pattern
```javascript
export async function validate*() {
  const results = { success: true, checks: [], issues: [] };

  // Run checks
  // Collect results

  return results;
}

export function generate*Report(results) {
  // Format results into human-readable report
  return report;
}
```

### 2. Simulator Pattern
```javascript
export async function simulate*(scenario, context) {
  const results = {
    scenario,
    success: false,
    handledGracefully: false,
  };

  try {
    // Inject error
    // Test handling

    results.handledGracefully = checkHandling();
  } catch (error) {
    results.error = error.message;
  }

  return results;
}
```

### 3. Monitor Pattern
```javascript
export async function runHealthChecks() {
  const checks = [];

  // Run each check
  checks.push(await checkComponent());

  const passed = checks.filter(c => c.status === 'pass').length;
  const overallStatus = determineStatus(checks);

  return { overallStatus, checks, summary };
}
```

## Configuration

### Environment Variables
```bash
# Required
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx

# Optional
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
META_ACCESS_TOKEN=xxx
NEO4J_URI=neo4j+s://xxx.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=xxx
```

### Default Values
```javascript
const DEFAULT_BUSINESS_ID = 'test-business-001';
const DEFAULT_PHONE = '447448682282';
const DEFAULT_PROVIDER = 'twilio';
```

## Extension Points

### Adding a New Validator
1. Create `validators/your-validator.js`
2. Implement validation logic
3. Add report generator
4. Import in `debugger-cli.js`
5. Add command case
6. Update help text

### Adding a New Error Scenario
1. Add to `ERROR_SCENARIOS` in `error-scenarios.js`
2. Implement test function
3. Add to switch statement in `simulateErrorScenario()`
4. Update documentation

### Adding a New Health Check
1. Create check function in `health-checks.js`
2. Add to `runHealthChecks()` sequence
3. Return `HealthCheckResult` object
4. Check will automatically appear in report

## Performance Characteristics

- **test-message**: < 2 seconds (single message)
- **test-conversation**: < 5 seconds (4-5 messages)
- **health-check**: < 5 seconds (9 checks)
- **validate-tenant**: < 10 seconds (multiple messages + DB queries)
- **check-phone-formats**: < 5 seconds (4 format variations)
- **simulate-failure**: < 1 second (most scenarios)

## Security Considerations

1. **Credentials**: Never log sensitive environment variables
2. **Data Isolation**: Always use business_id scoping
3. **Test Data**: Use synthetic test data, not production data
4. **Access Control**: Service key required for database access
5. **Webhook Validation**: Mock webhooks match real format exactly

## Future Enhancements

1. **Performance Metrics**: Add timing and throughput monitoring
2. **Load Testing**: Concurrent request simulation
3. **Integration Tests**: End-to-end workflow testing
4. **CI/CD Integration**: Automated test suite
5. **Web Dashboard**: Visual test results and monitoring
6. **Alerting**: Proactive issue detection and notifications
