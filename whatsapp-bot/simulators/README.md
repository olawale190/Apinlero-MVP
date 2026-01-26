# Simulators

Error scenario simulators for testing error handling and recovery.

## Available Simulators

### error-scenarios.js
Simulates various error conditions to test system resilience.

**Functions:**
- `simulateErrorScenario(scenario, businessId)` - Simulate a specific error
- `runAllErrorScenarios(businessId)` - Run all error scenarios
- `generateErrorSimulationReport(results)` - Generate formatted report

**Available Scenarios:**

| Scenario | Description | Expected Behavior |
|----------|-------------|-------------------|
| `database-timeout` | Database connection timeout | Graceful error message, logged |
| `rpc-failure` | Stock decrement RPC failure | Transaction rollback, error message |
| `malformed-webhook` | Malformed webhook payload | Reject with HTTP status, log error |
| `session-cache-miss` | Session not found in cache | Create new session, continue |
| `missing-from` | Webhook missing sender phone | Reject webhook, return error |
| `missing-body` | Webhook missing message text | Handle gracefully or reject |
| `invalid-format` | Unrecognizable phone format | Normalize or reject with error |
| `empty-payload` | Completely empty webhook | Reject with 400 Bad Request |
| `network-failure` | Network timeout/connection error | Retry logic or graceful degradation |
| `invalid-business-id` | Non-existent business ID | Reject or default behavior |

## Usage

```javascript
import {
  simulateErrorScenario,
  runAllErrorScenarios,
  ERROR_SCENARIOS
} from './simulators/error-scenarios.js';

// Test a specific scenario
const result = await simulateErrorScenario('missing-from', 'test-business-001');
console.log(generateErrorSimulationReport(result));

// Run all scenarios
const allResults = await runAllErrorScenarios('test-business-001');
console.log(`Passed: ${allResults.passed}/${allResults.total}`);

// List available scenarios
console.log(Object.keys(ERROR_SCENARIOS));
```

## Integration Testing

Some scenarios require integration testing with mocks:
- `database-timeout` - Requires database connection mock
- `rpc-failure` - Requires RPC client mock
- `network-failure` - Requires network interceptor

These scenarios provide recommendations when run without mocks.
