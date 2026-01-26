# WhatsApp Bot Debugger - Index

> **Phase 2 Complete** ✅ | **Production Ready** | **Last Updated**: January 26, 2026

## Quick Start

```bash
# Run health check
node debugger-cli.js health-check

# Validate tenant isolation (CRITICAL)
node debugger-cli.js validate-tenant test-business-001

# Test phone formats
node debugger-cli.js check-phone-formats 447448682282
```

---

## 📚 Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| **Quick Reference** | Command cheat sheet, common workflows | [QUICK_REFERENCE.md](QUICK_REFERENCE.md) |
| **Architecture** | System design, data flow, patterns | [ARCHITECTURE.md](ARCHITECTURE.md) |
| **Phase 2 Implementation** | Complete implementation details | [PHASE2_IMPLEMENTATION.md](PHASE2_IMPLEMENTATION.md) |
| **Completion Report** | Phase 2 summary and statistics | [PHASE2_COMPLETE.txt](PHASE2_COMPLETE.txt) |

---

## 🔧 Modules

### Validators (`validators/`)
Ensure correctness and isolation

| Module | Lines | Purpose | Documentation |
|--------|-------|---------|---------------|
| **tenant-isolation.js** | 356 | Multi-tenant isolation validation | [README](validators/README.md) |
| **phone-formats.js** | 299 | Phone normalization testing | [README](validators/README.md) |

**Commands:**
- `node debugger-cli.js validate-tenant <business-id>`
- `node debugger-cli.js check-phone-formats <phone>`

---

### Simulators (`simulators/`)
Test error handling and resilience

| Module | Lines | Scenarios | Documentation |
|--------|-------|-----------|---------------|
| **error-scenarios.js** | 431 | 10 error scenarios | [README](simulators/README.md) |

**10 Error Scenarios:**
1. database-timeout
2. rpc-failure
3. malformed-webhook
4. session-cache-miss
5. missing-from
6. missing-body
7. invalid-format
8. empty-payload
9. network-failure
10. invalid-business-id

**Commands:**
- `node debugger-cli.js simulate-failure <scenario>`

---

### Monitors (`monitors/`)
System health and status

| Module | Lines | Checks | Documentation |
|--------|-------|--------|---------------|
| **health-checks.js** | 532 | 9 health checks | [README](monitors/README.md) |

**9 Health Checks:**
- Database: Supabase connection, schema validation
- Environment: Required & optional variables
- Application: Message handler, directory structure
- External: Neo4j, Twilio, Meta WhatsApp

**Commands:**
- `node debugger-cli.js health-check`

---

## 🎯 Common Use Cases

### 1. Before Deployment
```bash
node debugger-cli.js health-check
node debugger-cli.js validate-tenant your-business-id
node debugger-cli.js check-phone-formats 447448682282
```

### 2. Troubleshooting Customer Issues
```bash
# Test their exact scenario
node debugger-cli.js test-message "customer's message" \
  --business-id their-business \
  --phone their-phone

# Check phone normalization
node debugger-cli.js check-phone-formats their-phone
```

### 3. Testing Error Handling
```bash
# Test critical scenarios
node debugger-cli.js simulate-failure missing-from
node debugger-cli.js simulate-failure empty-payload
node debugger-cli.js simulate-failure database-timeout
```

### 4. Validating Multi-Tenant Isolation
```bash
# CRITICAL security check
node debugger-cli.js validate-tenant test-business-001
```

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| **Production Code** | 1,618 lines |
| **Documentation** | ~2,000 lines |
| **Total Files** | 11 files |
| **New Directories** | 3 |
| **Error Scenarios** | 10 |
| **Health Checks** | 9 |
| **Validators** | 2 |
| **Phone Formats Tested** | 4 |

---

## 🗂️ File Structure

```
whatsapp-bot/
├── INDEX.md                         # ← You are here
├── QUICK_REFERENCE.md               # Command cheat sheet
├── ARCHITECTURE.md                  # System architecture
├── PHASE2_IMPLEMENTATION.md         # Implementation details
├── PHASE2_COMPLETE.txt              # Completion summary
├── .phase2-manifest.json            # Machine-readable manifest
│
├── debugger-cli.js                  # CLI entry point (refactored)
├── test-harness.js                  # Core testing functions
│
├── validators/                      # ✨ NEW in Phase 2
│   ├── README.md
│   ├── tenant-isolation.js          # Multi-tenant validation
│   └── phone-formats.js             # Phone normalization
│
├── simulators/                      # ✨ NEW in Phase 2
│   ├── README.md
│   └── error-scenarios.js           # Error injection
│
├── monitors/                        # ✨ NEW in Phase 2
│   ├── README.md
│   └── health-checks.js             # System health
│
├── generators/
│   └── webhook-mock.js              # Mock webhooks
│
├── fixtures/
│   └── test-conversations/          # Test data
│
└── src/
    └── message-handler.js           # Bot logic
```

---

## 🚀 Claude Code Integration

Use the `/whatsapp-debug` skill:

```bash
/whatsapp-debug health-check
/whatsapp-debug validate-tenant test-business-001
/whatsapp-debug check-phone-formats 447448682282
/whatsapp-debug simulate-failure database-timeout
/whatsapp-debug test-message "2x palm oil to SE15 4AA"
```

**Skill Definition**: `../.claude/skills/whatsapp-bot-debugger.md`

---

## ✅ Verification

All commands tested and verified:

- ✅ `health-check` - Detects system issues
- ✅ `validate-tenant` - Tenant isolation checks
- ✅ `check-phone-formats` - Phone normalization
- ✅ `simulate-failure` - Error handling
- ✅ `test-message` - Message processing
- ✅ `generate-mock-webhook` - Webhook generation

---

## 🔐 Security Features

### Critical Validations
1. **Multi-tenant isolation** - Prevents data leaks between businesses
2. **Phone normalization** - Ensures consistent customer matching
3. **Input validation** - Tests malformed webhook handling
4. **Session isolation** - Validates business context separation

**ALWAYS run before production:**
```bash
node debugger-cli.js validate-tenant your-business-id
```

---

## 🎓 Learning Path

### New to the Debugger?
1. Start with [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
2. Run `node debugger-cli.js help`
3. Try `node debugger-cli.js health-check`

### Understanding the System?
1. Read [ARCHITECTURE.md](ARCHITECTURE.md)
2. Review module READMEs in each directory
3. Check [PHASE2_IMPLEMENTATION.md](PHASE2_IMPLEMENTATION.md)

### Troubleshooting?
1. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for common patterns
2. Use `health-check` to diagnose issues
3. Review module documentation

---

## 📞 Support

### For Questions
1. Check this INDEX for navigation
2. See QUICK_REFERENCE.md for usage
3. Review ARCHITECTURE.md for design
4. Check module README files for APIs

### For Issues
- Run `health-check` to diagnose
- Use `simulate-failure` to test error handling
- Check module logs and outputs

---

## 🎉 Status

| Category | Status |
|----------|--------|
| **Phase 2 Implementation** | ✅ Complete |
| **Testing** | ✅ Verified |
| **Documentation** | ✅ Complete |
| **Production Ready** | ✅ Yes |
| **Claude Code Skill** | ✅ Ready |

**All work saved in**: `/Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/whatsapp-bot/`

---

**Ready to use!** Start with: `node debugger-cli.js health-check`
