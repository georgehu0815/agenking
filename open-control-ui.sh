#!/bin/bash
# Open Clawdbot Control UI with authentication token

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get gateway token from config
TOKEN=$(cat ~/.clawdbot/clawdbot.json 2>/dev/null | grep -A 5 '"gateway"' | grep '"token"' | sed 's/.*"token": "\([^"]*\)".*/\1/')

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}Warning: Could not find gateway token in config${NC}"
    echo "Using URL without token (may require manual authentication)"
    URL="http://127.0.0.1:18789/chat"
else
    echo -e "${BLUE}Gateway Token:${NC} $TOKEN"
    URL="http://127.0.0.1:18789/chat?token=$TOKEN"
fi

echo -e "${GREEN}Opening Control UI:${NC} $URL"
echo ""
echo -e "${BLUE}Available pages:${NC}"
echo "  http://127.0.0.1:18789/           - Overview"
echo "  http://127.0.0.1:18789/chat       - Chat"
echo "  http://127.0.0.1:18789/channels   - Channels"
echo "  http://127.0.0.1:18789/sessions   - Sessions"
echo "  http://127.0.0.1:18789/devices    - Devices"
echo "  http://127.0.0.1:18789/config     - Configuration"
echo ""
echo -e "${YELLOW}Note:${NC} After first successful login, you can use URLs without the token parameter."
echo ""

# Open in default browser
open "$URL"
