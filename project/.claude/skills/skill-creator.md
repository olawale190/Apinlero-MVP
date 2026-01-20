# Àpínlẹ̀rọ Skill Creator

## Purpose
Master skill for creating new Claude Code skills, n8n workflows, and WhatsApp bot conversation patterns for the Apinlero platform.

## Usage
```
/create-skill
```

## Available Skill Types

| Type | Output | Location |
|------|--------|----------|
| `claude` | Markdown skill file | `.claude/skills/` |
| `n8n` | JSON workflow file | `n8n-workflows/` |
| `bot` | Bot conversation pattern | `.claude/skills/` |

## How to Create a New Skill

### Step 1: Identify the Skill Type
- **Claude Code Skill**: For CLI automation tasks (deployments, testing, migrations)
- **n8n Workflow**: For automated background tasks (reports, alerts, backups)
- **Bot Skill**: For WhatsApp conversation patterns

### Step 2: Define the Skill Requirements
Answer these questions:
1. What is the skill name? (e.g., `deploy-vercel`)
2. What does it do? (Brief description)
3. What commands/triggers does it have?
4. What dependencies does it need? (env vars, files, services)
5. What are the expected inputs and outputs?

### Step 3: Use the Template

#### For Claude Code Skills:
```bash
# Copy template
cp .claude/skill-templates/claude-code-template.md .claude/skills/{skill-name}.md

# Edit with your skill details
```

#### For n8n Workflows:
```bash
# Copy template
cp .claude/skill-templates/n8n-workflow-template.json n8n-workflows/{workflow-name}.json

# Edit nodes, connections, and credentials
```

## Existing Skills Reference

### Claude Code Skills
| Skill | Command | Purpose |
|-------|---------|---------|
| `test-webhook` | `/test-webhook` | Test WhatsApp/n8n webhooks |
| `test-payment` | `/test-payment` | Test Stripe payment flows |
| `test-bot` | `/test-bot` | Send test messages to WhatsApp bot |
| `deploy-vercel` | `/deploy-vercel` | Deploy frontend to Vercel |
| `deploy-railway` | `/deploy-railway` | Deploy bot/backend to Railway |
| `db-migrate` | `/db-migrate` | Run Supabase migrations |
| `db-seed` | `/db-seed` | Seed test data |
| `analytics-export` | `/analytics-export` | Export analytics data |

### n8n Workflows
| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `daily-report` | Schedule (6 PM) | Daily business summary |
| `inventory-alert` | Schedule (hourly) | Low stock notifications |
| `db-backup` | Schedule (daily) | Database backup |
| `whatsapp-webhook-router` | Webhook | Route WhatsApp messages |

### Bot Skills (Conversation Patterns)
| Skill | Intent | Purpose |
|-------|--------|---------|
| `order-management` | Place order | Handle customer orders |
| `inventory-tracker` | Check stock | Product availability |
| `whatsapp-bot` | General | Main conversation handler |

## Skill Structure Best Practices

### Claude Code Skill Structure
```markdown
# Skill Name
## Purpose
## Usage
## Prerequisites
## Commands
## Implementation
## Examples
## Troubleshooting
```

### n8n Workflow Structure
```
Trigger → Process → Action → Response
```

Common patterns:
- **Webhook → Supabase → HTTP → Response**
- **Schedule → Query → Filter → Notify**
- **Manual → Validate → Execute → Log**

## Templates Location

```
project/.claude/skill-templates/
├── claude-code-template.md      # Base template for CLI skills
├── n8n-workflow-template.json   # Base template for n8n flows
```

## Environment Variables

Skills may require these environment variables:

| Variable | Used By | Purpose |
|----------|---------|---------|
| `SUPABASE_URL` | All | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | All | Supabase service role key |
| `RAILWAY_TOKEN` | deploy-railway | Railway API token |
| `VERCEL_TOKEN` | deploy-vercel | Vercel API token |
| `STRIPE_SECRET_KEY` | test-payment | Stripe API key |
| `WHATSAPP_BOT_URL` | test-webhook, test-bot | Bot endpoint URL |

## Quick Create Commands

### Create a Testing Skill
```bash
# 1. Copy template
cp .claude/skill-templates/claude-code-template.md .claude/skills/test-{name}.md

# 2. Update placeholders:
# - SKILL_NAME: Test {Name}
# - COMMAND: test-{name}
# - DESCRIPTION: Test {what it tests}
```

### Create a Deployment Skill
```bash
# 1. Copy template
cp .claude/skill-templates/claude-code-template.md .claude/skills/deploy-{service}.md

# 2. Key sections to update:
# - Prerequisites (CLI tools, tokens)
# - Implementation (deployment commands)
# - Verification (health checks)
```

### Create an n8n Workflow
```bash
# 1. Copy template
cp .claude/skill-templates/n8n-workflow-template.json n8n-workflows/{name}-workflow.json

# 2. Update:
# - name: "Apinlero - {Workflow Name}"
# - nodes: Add/modify nodes for your logic
# - connections: Wire nodes together
# - credentials: Set Supabase/API credentials
```

## Verification

After creating a skill:

1. **Claude Code Skills**: Test with `/{command}` in Claude Code
2. **n8n Workflows**: Import to n8n and run test execution
3. **Bot Skills**: Test via WhatsApp or bot test endpoint

---
*Apinlero Skill Creator v1.0*
