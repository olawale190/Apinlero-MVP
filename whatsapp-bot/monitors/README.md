# Monitors

Proactive health checks for the WhatsApp bot system.

## Available Monitors

### health-checks.js
Comprehensive system health monitoring.

**Functions:**
- `runHealthChecks()` - Run all health checks
- `generateHealthCheckReport(results)` - Generate formatted report

**Health Checks:**

### Database Checks
1. **Supabase Connection** - Test database connectivity
2. **Database Schema** - Verify required tables exist
   - customers
   - orders
   - products
   - conversations

### Environment Checks
3. **Required Environment Variables**
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY

4. **Optional Environment Variables**
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - META_ACCESS_TOKEN
   - NEO4J_URI
   - NEO4J_USERNAME
   - NEO4J_PASSWORD

### Application Checks
5. **Message Handler Module** - Verify bot logic loads
6. **Directory Structure** - Check all required directories exist
   - src/
   - generators/
   - validators/
   - simulators/
   - monitors/
   - fixtures/

### External Service Checks
7. **Neo4j Connection** - Test graph database (if configured)
8. **Twilio Configuration** - Verify Twilio credentials
9. **Meta WhatsApp Configuration** - Verify Meta access token

## Usage

```javascript
import { runHealthChecks, generateHealthCheckReport } from './monitors/health-checks.js';

// Run all health checks
const results = await runHealthChecks();
console.log(generateHealthCheckReport(results));

// Check overall status
if (results.overallStatus === 'fail') {
  console.error('Critical issues detected!');
  process.exit(1);
}

// Access individual checks
results.checks.forEach(check => {
  console.log(`${check.name}: ${check.status}`);
  console.log(`  ${check.message}`);
});
```

## Health Check Results

Each check returns a structured result:

```javascript
{
  name: 'Check Name',
  category: 'database' | 'environment' | 'application' | 'external',
  status: 'pass' | 'fail' | 'warn' | 'skip',
  message: 'Status message',
  details: { /* Additional context */ },
  duration: 123 // milliseconds
}
```

## Overall Status

- **pass** - All checks passed
- **warn** - Some warnings, but system functional
- **fail** - Critical issues detected

## Recommendations

The health check report includes actionable recommendations for:
- Critical issues (failed checks)
- Warnings (potential issues)
- Configuration improvements
