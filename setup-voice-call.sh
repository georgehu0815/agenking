#!/bin/bash
# Quick voice-call plugin setup

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎙️ Clawdbot Voice Call Setup${NC}"
echo ""

# Check if plugin exists
if [ ! -d ~/.clawdbot/extensions/voice-call ] && [ ! -d ./.disabled-extensions/voice-call ]; then
  echo -e "${RED}Error: voice-call plugin not found${NC}"
  echo "Expected location: ~/.clawdbot/extensions/voice-call"
  exit 1
fi

# Provider selection
echo -e "${YELLOW}Select provider:${NC}"
echo "1) Mock (testing - no network)"
echo "2) Twilio (production ready)"
echo "3) Telnyx (cost-effective)"
echo "4) Plivo (simple API)"
read -p "Choice (1-4): " provider_choice

case $provider_choice in
  1)
    PROVIDER="mock"
    echo -e "${GREEN}Using Mock provider (testing)${NC}"
    ;;
  2)
    PROVIDER="twilio"
    echo -e "${GREEN}Using Twilio${NC}"
    ;;
  3)
    PROVIDER="telnyx"
    echo -e "${GREEN}Using Telnyx${NC}"
    ;;
  4)
    PROVIDER="plivo"
    echo -e "${GREEN}Using Plivo${NC}"
    ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

echo ""

# Enable plugin
echo -e "${BLUE}Enabling voice-call plugin...${NC}"
pnpm clawdbot config set plugins.entries.voice-call.enabled true
pnpm clawdbot config set plugins.entries.voice-call.config.provider "$PROVIDER"

# Default numbers
echo ""
echo -e "${YELLOW}Phone Numbers:${NC}"
read -p "From number (e.g., +15551234567): " from_number
read -p "Default to number (e.g., +15559876543): " to_number

if [ -z "$from_number" ]; then
  from_number="+15550001234"
  echo -e "${YELLOW}Using default: $from_number${NC}"
fi

if [ -z "$to_number" ]; then
  to_number="+15550005678"
  echo -e "${YELLOW}Using default: $to_number${NC}"
fi

pnpm clawdbot config set plugins.entries.voice-call.config.fromNumber "$from_number"
pnpm clawdbot config set plugins.entries.voice-call.config.toNumber "$to_number"

# Provider-specific config
echo ""
if [ "$PROVIDER" = "twilio" ]; then
  echo -e "${YELLOW}Twilio Credentials:${NC}"
  read -p "Account SID (starts with AC): " account_sid
  read -sp "Auth Token: " auth_token
  echo ""

  pnpm clawdbot config set plugins.entries.voice-call.config.twilio.accountSid "$account_sid"
  pnpm clawdbot config set plugins.entries.voice-call.config.twilio.authToken "$auth_token"
fi

if [ "$PROVIDER" = "telnyx" ]; then
  echo -e "${YELLOW}Telnyx Credentials:${NC}"
  read -p "API Key: " api_key
  read -p "Connection ID: " connection_id
  read -p "Public Key: " public_key

  pnpm clawdbot config set plugins.entries.voice-call.config.telnyx.apiKey "$api_key"
  pnpm clawdbot config set plugins.entries.voice-call.config.telnyx.connectionId "$connection_id"
  pnpm clawdbot config set plugins.entries.voice-call.config.telnyx.publicKey "$public_key"
fi

if [ "$PROVIDER" = "plivo" ]; then
  echo -e "${YELLOW}Plivo Credentials:${NC}"
  read -p "Auth ID: " auth_id
  read -sp "Auth Token: " auth_token
  echo ""

  pnpm clawdbot config set plugins.entries.voice-call.config.plivo.authId "$auth_id"
  pnpm clawdbot config set plugins.entries.voice-call.config.plivo.authToken "$auth_token"
fi

# Webhook settings
echo ""
echo -e "${BLUE}Configuring webhook server...${NC}"
pnpm clawdbot config set plugins.entries.voice-call.config.serve.port 3334
pnpm clawdbot config set plugins.entries.voice-call.config.serve.path "/voice/webhook"
pnpm clawdbot config set plugins.entries.voice-call.config.outbound.defaultMode notify

# Public URL setup
if [ "$PROVIDER" != "mock" ]; then
  echo ""
  echo -e "${YELLOW}Public URL Setup (required for real calls):${NC}"
  echo "1) Tailscale Funnel (recommended)"
  echo "2) ngrok"
  echo "3) Manual (I'll set it myself later)"
  read -p "Choice (1-3): " url_choice

  case $url_choice in
    1)
      echo -e "${GREEN}Configuring Tailscale Funnel${NC}"
      pnpm clawdbot config set plugins.entries.voice-call.config.tailscale.mode funnel
      pnpm clawdbot config set plugins.entries.voice-call.config.tailscale.path "/voice/webhook"
      echo -e "${YELLOW}After restarting gateway, run: pnpm clawdbot voicecall expose --mode funnel${NC}"
      ;;
    2)
      echo -e "${GREEN}Configuring ngrok${NC}"
      pnpm clawdbot config set plugins.entries.voice-call.config.tunnel.provider ngrok
      pnpm clawdbot config set plugins.entries.voice-call.config.tunnel.allowNgrokFreeTier true
      ;;
    3)
      echo -e "${YELLOW}Remember to set publicUrl later:${NC}"
      echo "  pnpm clawdbot config set plugins.entries.voice-call.config.publicUrl \"https://your-domain.com/voice/webhook\""
      ;;
  esac
fi

# Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Voice call plugin configured!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Configuration Summary:${NC}"
echo -e "  Provider: ${GREEN}$PROVIDER${NC}"
echo -e "  From: ${GREEN}$from_number${NC}"
echo -e "  To: ${GREEN}$to_number${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Restart gateway: ${BLUE}./restart-gateway.sh${NC}"
if [ "$PROVIDER" = "mock" ]; then
  echo -e "  2. Test call: ${BLUE}pnpm clawdbot voicecall call --to \"$to_number\" --message \"Test\"${NC}"
else
  echo -e "  2. Verify webhook is accessible"
  echo -e "  3. Test call: ${BLUE}pnpm clawdbot voicecall call --to \"$to_number\" --message \"Test\"${NC}"
fi
echo ""
echo -e "${YELLOW}WhatsApp Usage:${NC}"
echo -e "  Send to Clawdbot: ${BLUE}\"Call $to_number and say 'Server is online'\"${NC}"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo -e "  Full guide: ${BLUE}cat VOICE_CALL_SETUP_GUIDE.md${NC}"
echo ""
