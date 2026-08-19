#!/usr/bin/env bash
#
# Deploy the WhatsApp bot to Railway and prove the new code is actually live.
#
#   cd whatsapp-bot && ./deploy.sh
#
# WHY THIS EXISTS
# ---------------
# Pushing to GitHub does NOT deploy this bot. On 2026-08-19 three commits sat on
# GitHub main while the live service kept serving old code — the service was
# never wired to auto-deploy from the repo (CLAUDE.md still documents the old
# `git push railway main` method, and that remote no longer exists).
#
# The check at the end is the point. "Deployed" in the Railway UI only means the
# build finished; it does not mean the running container has your change. This
# asks the live bot a question only the new code answers correctly.
#
set -uo pipefail

PROJECT="welcoming-nurturing"
SERVICE="apinlero-whatsapp-bot"
BOT_URL="https://apinlero-whatsapp-bot-production.up.railway.app"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
fail() { printf '\033[31m%s\033[0m\n' "$1"; }
ok()   { printf '\033[32m%s\033[0m\n' "$1"; }

# A native Meta webhook shape. Old code rejects it with 400 ("Missing required
# fields"); the current code understands it and answers 200.
probe() {
  curl -s -o /dev/null -m 20 -w '%{http_code}' \
    -X POST "$BOT_URL/webhook/meta" \
    -H 'Content-Type: application/json' \
    -d '{"object":"whatsapp_business_account","entry":[]}' 2>/dev/null
}

bold "1. Checking the Railway CLI"

if ! command -v railway >/dev/null 2>&1; then
  fail "The railway CLI isn't installed."
  echo "   npm i -g @railway/cli    (then run this script again)"
  exit 1
fi

if ! railway whoami >/dev/null 2>&1; then
  fail "Not logged in to Railway."
  echo ""
  echo "   Run this, finish in the browser, then run this script again:"
  echo ""
  bold "   railway login"
  echo ""
  exit 1
fi
ok "   Logged in as: $(railway whoami 2>/dev/null | tail -1)"

BEFORE=$(probe)
echo "   Live bot currently answers: HTTP $BEFORE"
if [ "$BEFORE" = "200" ]; then
  ok "   Already running current code — deploying anyway to pick up latest."
fi

bold "2. Linking to $SERVICE"
if ! railway status >/dev/null 2>&1; then
  railway link --project "$PROJECT" --service "$SERVICE" || {
    fail "Could not link automatically."
    echo "   Run 'railway link' on its own and pick:"
    echo "     project: $PROJECT"
    echo "     service: $SERVICE"
    exit 1
  }
fi
ok "   Linked."

bold "3. Uploading and building (this takes a couple of minutes)"
if ! railway up --service "$SERVICE" --detach; then
  fail "Deploy command failed. Check the build log:  railway logs --service $SERVICE"
  exit 1
fi
ok "   Build started."

bold "4. Waiting for the new code to go live"
echo "   Asking the bot something only the new code answers correctly..."

for i in $(seq 1 40); do
  sleep 15
  CODE=$(probe)
  printf '   [%02d/40] HTTP %s\n' "$i" "$CODE"
  if [ "$CODE" = "200" ]; then
    echo ""
    ok "SUCCESS — the new code is live."
    echo ""
    echo "Next: step 2 of the runbook (paste add-meta-cloud-api-columns.sql into Supabase)."
    exit 0
  fi
done

echo ""
fail "Timed out after 10 minutes — the bot still answers HTTP $(probe)."
echo ""
echo "Check the build log:"
echo "   railway logs --service $SERVICE"
echo ""
echo "If the build succeeded but the code is still old, the service is probably"
echo "deploying from somewhere other than this directory. In the Railway"
echo "dashboard, open $SERVICE -> Settings -> Source and point it at:"
echo "   repo:   olawale190/Apinlero-MVP"
echo "   branch: main"
echo "   root:   whatsapp-bot"
exit 1
