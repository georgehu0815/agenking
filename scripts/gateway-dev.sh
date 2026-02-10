#!/usr/bin/env bash
#
# Gateway dev script that reads token from config
#

set -euo pipefail

# Ensure pandoc and LaTeX are in PATH for PDF conversion
export PATH="/opt/homebrew/bin:/Library/TeX/texbin:$PATH"

# Get the token from config
CONFIG_FILE="$HOME/.clawdbot/clawdbot.json"

if [ -f "$CONFIG_FILE" ]; then
  # Extract token using jq if available, otherwise use grep/sed
  if command -v jq &> /dev/null; then
    TOKEN=$(jq -r '.gateway.auth.token // empty' "$CONFIG_FILE")
  else
    # Fallback: use grep and sed
    TOKEN=$(grep -A 2 '"gateway"' "$CONFIG_FILE" | grep -A 5 '"auth"' | grep '"token"' | sed 's/.*"token": "\(.*\)".*/\1/' | head -1)
  fi

  if [ -n "$TOKEN" ]; then
    export CLAWDBOT_GATEWAY_TOKEN="$TOKEN"
  fi
fi

# Run gateway with environment variable from config
# Using default profile (not --dev) to use ~/.clawdbot/clawdbot.json
node scripts/run-node.mjs gateway --allow-unconfigured "$@"
