# Validators

Validators ensure correctness and isolation in the WhatsApp bot system.

## Available Validators

### tenant-isolation.js
Validates multi-tenant isolation to prevent data leaks between businesses.

**Functions:**
- `validateTenantIsolation(businessId)` - Run all tenant isolation checks
- `generateTenantValidationReport(results)` - Generate formatted report

**Checks:**
- Multiple customers per business
- Cross-tenant isolation
- Session cache key formatting
- Database query isolation (customers, orders, products)
- Cross-tenant data leak detection

### phone-formats.js
Tests phone number normalization across different formats.

**Functions:**
- `testPhoneFormats(phone, businessId)` - Test format normalization
- `testCustomerMatching(phone, businessId)` - Test customer matching
- `generatePhoneFormatReport(results)` - Generate formatted report
- `normalizePhoneNumber(phone)` - Normalize phone to consistent format
- `generatePhoneFormats(basePhone)` - Generate format variations

**Tested Formats:**
- E.164 (+447448682282)
- International without + (447448682282)
- WhatsApp format (whatsapp:+447448682282)
- UK national format (07448682282)

## Usage

```javascript
import { validateTenantIsolation } from './validators/tenant-isolation.js';
import { testPhoneFormats } from './validators/phone-formats.js';

// Validate tenant isolation
const result = await validateTenantIsolation('test-business-001');
console.log(generateTenantValidationReport(result));

// Test phone formats
const phoneResult = await testPhoneFormats('447448682282', 'test-business-001');
console.log(generatePhoneFormatReport(phoneResult));
```
