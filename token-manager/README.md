# Token Manager - API Token Expiration Tracker

A simple, secure system to track all your API tokens and get alerts before they expire.

## Features

- ✅ Track unlimited tokens from any service (Supabase, Stripe, AWS, etc.)
- ✅ Automatic expiration checking
- ✅ Color-coded warnings (green/yellow/red)
- ✅ Daily automated checks (optional)
- ✅ Secure: Only tracks expiration dates, NOT actual token values
- ✅ Simple command-line interface

## Quick Start

### 1. Check Tokens Now

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/token-manager
node check-tokens.js
```

### 2. Add Your First Token

```bash
node check-tokens.js --add
```

You'll be prompted for:
- **Token name**: e.g., "Supabase Deployment Token"
- **Service**: e.g., "Supabase"
- **Type**: e.g., "Access Token"
- **Expiration date**: e.g., "2026-05-03"
- **Notify days**: e.g., "7" (alert 7 days before expiry)
- **Notes**: Optional notes

### 3. Setup Daily Automated Checks (Optional)

```bash
chmod +x setup-daily-check.sh
./setup-daily-check.sh
```

This will run the token check every day at 9:00 AM automatically.

## Commands

| Command | Description |
|---------|-------------|
| `node check-tokens.js` | Check all tokens for expiration |
| `node check-tokens.js --add` | Add a new token to track |
| `node check-tokens.js --list` | List all tracked tokens |
| `node check-tokens.js --help` | Show help message |

## Example Usage

### Adding a Supabase Token

```bash
$ node check-tokens.js --add

Token name: Supabase Apinlero Deployment
Service: Supabase
Token type: Access Token
Expiration date: 2026-05-03
Notify how many days before expiry?: 7
Notes: Used for deploying Edge Functions

✅ Token added successfully!
```

### Checking Token Status

```bash
$ node check-tokens.js

========================================
  Token Expiration Check
========================================

1. Supabase Apinlero Deployment
   Service: Supabase
   Type: Access Token
   Expires: 2026-05-03
   Status: ✅ 89 days left

2. Stripe API Key
   Service: Stripe
   Type: Secret Key
   Expires: 2026-03-15
   Status: ⚠️  EXPIRES IN 5 DAYS

========================================
⚠️  WARNING: Some tokens are expiring soon!
   Please renew them before they expire.
========================================
```

## Security Best Practices

### ⚠️ IMPORTANT

**This tool tracks ONLY expiration dates, NOT actual token values.**

### Where to Store Actual Tokens:

✅ **Good (Recommended):**
- macOS Keychain Access
- Password managers (1Password, Bitwarden, LastPass)
- Password-protected notes

❌ **Bad (Never do this):**
- Don't store actual tokens in `tokens.json`
- Don't commit tokens to Git
- Don't store in plain text files
- Don't share tokens with anyone

### The `tokens.json` file should ONLY contain:
```json
{
  "tokens": [
    {
      "name": "Supabase Deployment Token",
      "service": "Supabase",
      "expiresAt": "2026-05-03",
      "notifyDaysBefore": 7
    }
  ]
}
```

**Never put actual token values in this file!**

## Token Types You Can Track

This system works with ANY token that has an expiration date:

- **Supabase**: Access tokens, Service role keys, Anon keys
- **Stripe**: Secret keys, Publishable keys, Webhook secrets
- **AWS**: Access keys, Secret access keys
- **GitHub**: Personal access tokens
- **Google Cloud**: Service account keys, API keys
- **Azure**: Access tokens, Connection strings
- **Custom APIs**: Any API token with expiration

## File Structure

```
token-manager/
├── tokens.json              # Token tracking data (expiration dates only)
├── check-tokens.js          # Main checking script
├── setup-daily-check.sh     # Setup automated daily checks
└── README.md                # This file
```

## Daily Automated Checks

After running `setup-daily-check.sh`, the system will:

1. ✅ Run every day at 9:00 AM
2. ✅ Check all tokens for expiration
3. ✅ Save logs to `~/Library/Logs/token-checker.log`
4. ✅ Alert you in the log if tokens are expiring

### View Logs

```bash
cat ~/Library/Logs/token-checker.log
```

### Stop Automated Checks

```bash
launchctl unload ~/Library/LaunchAgents/com.apinlero.token-checker.plist
```

### Restart Automated Checks

```bash
launchctl load ~/Library/LaunchAgents/com.apinlero.token-checker.plist
```

## Recommended Workflow

### When You Generate a New Token:

1. **Copy the token** from the service (Supabase, Stripe, etc.)
2. **Save it securely** in Keychain Access or password manager
3. **Add it to Token Manager**:
   ```bash
   node check-tokens.js --add
   ```
4. **Set a calendar reminder** (optional backup)

### Weekly:

1. Run a manual check:
   ```bash
   node check-tokens.js
   ```

### When a Token is Expiring:

1. Generate a new token from the service
2. Update your Keychain/password manager
3. Update the expiration date in Token Manager, or delete the old one and add the new one:
   ```bash
   node check-tokens.js --add
   ```

## Troubleshooting

### "Error loading tokens file"

Make sure you're in the correct directory:
```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/token-manager
```

### Daily check not running

Check if the launchd job is loaded:
```bash
launchctl list | grep token-checker
```

If not loaded, run setup again:
```bash
./setup-daily-check.sh
```

### Check logs for errors

```bash
cat ~/Library/Logs/token-checker-error.log
```

## Adding Tokens for Your Current Project

Here are the tokens you should track for Apinlero:

1. **Supabase Access Token** (for CLI deployments)
   - Service: Supabase
   - Type: Access Token
   - Get from: https://supabase.com/dashboard/account/tokens

2. **Stripe Secret Key** (per business, stored in database)
   - Service: Stripe
   - Type: Secret Key
   - Get from: https://dashboard.stripe.com/apikeys

3. **Stripe Webhook Secret** (for verifying webhooks)
   - Service: Stripe
   - Type: Webhook Secret
   - Get from: https://dashboard.stripe.com/webhooks

4. **Supabase Service Role Key** (if using directly)
   - Service: Supabase
   - Type: Service Role Key
   - Get from: Supabase project settings

## Support

For issues or questions:
1. Check the logs: `cat ~/Library/Logs/token-checker.log`
2. Run with verbose output: `node check-tokens.js`
3. Review this README

## License

Free to use for the Apinlero project.
