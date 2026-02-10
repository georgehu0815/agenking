#!/usr/bin/env bash
#
# news-fetch-gog Setup Test
# Validates that all prerequisites are met before running the digest workflow
#

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PASS="${GREEN}✓${NC}"
FAIL="${RED}✗${NC}"
WARN="${YELLOW}⚠${NC}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  news-fetch-gog Setup Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check 1: gog CLI
echo -n "Checking gog CLI... "
if command -v gog &> /dev/null; then
  version=$(gog --version 2>&1 | head -1 || echo "unknown")
  echo -e "$PASS ($version)"
else
  echo -e "$FAIL"
  echo "  Install with: brew install steipete/tap/gogcli"
  exit 1
fi

# Check 2: jq
echo -n "Checking jq... "
if command -v jq &> /dev/null; then
  version=$(jq --version)
  echo -e "$PASS ($version)"
else
  echo -e "$FAIL"
  echo "  Install with: brew install jq"
  exit 1
fi

# Check 3: curl
echo -n "Checking curl... "
if command -v curl &> /dev/null; then
  version=$(curl --version | head -1 | cut -d' ' -f2)
  echo -e "$PASS (v$version)"
else
  echo -e "$FAIL"
  exit 1
fi

# Check 4: Python 3
echo -n "Checking Python 3... "
if command -v python3 &> /dev/null; then
  version=$(python3 --version | cut -d' ' -f2)
  echo -e "$PASS (v$version)"
else
  echo -e "$WARN Not found (optional for CSV parsing)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Authentication Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check 5: gog authentication
echo "Checking gog authentication..."
if gog auth list &> /dev/null; then
  accounts=$(gog auth list 2>&1 | grep -v "^$" | wc -l | tr -d ' ')
  if [ "$accounts" -gt 0 ]; then
    echo -e "$PASS Found $accounts authenticated account(s)"
    echo ""
    gog auth list | head -10
  else
    echo -e "$FAIL No authenticated accounts"
    echo "  Run: gog auth add georgehu@microsoft.com --services gmail,sheets,drive"
    exit 1
  fi
else
  echo -e "$FAIL gog auth check failed"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Configuration Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check 6: Configuration
echo -n "Checking SHEET_ID... "
if [ -n "${SHEET_ID:-}" ]; then
  echo -e "$PASS $SHEET_ID"

  # Validate Sheet access
  echo -n "Testing Sheet access... "
  if gog sheets metadata "$SHEET_ID" --json &> /dev/null; then
    echo -e "$PASS Accessible"
  else
    echo -e "$FAIL Cannot access Sheet"
    echo "  Verify Sheet ID and permissions"
    exit 1
  fi
else
  echo -e "$FAIL Not set"
  echo "  Set with: export SHEET_ID=<your-sheet-id>"
  exit 1
fi

echo -n "Checking RECIPIENT_EMAIL... "
if [ -n "${RECIPIENT_EMAIL:-}" ]; then
  echo -e "$PASS $RECIPIENT_EMAIL"
else
  echo -e "$WARN Not set (will use default: georgehu@microsoft.com)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  API Connectivity Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check 7: Hacker News API
echo -n "Testing Hacker News API... "
if curl -s -m 5 "https://hn.algolia.com/api/v1/search?query=test&hitsPerPage=1" > /dev/null; then
  echo -e "$PASS Reachable"
else
  echo -e "$FAIL Cannot reach HN API"
  exit 1
fi

# Check 8: Google APIs
echo -n "Testing Google Sheets API... "
if gog sheets get "$SHEET_ID" "Sheet1!A1:A1" --json &> /dev/null; then
  echo -e "$PASS Working"
else
  echo -e "$WARN Failed (check authentication)"
fi

echo -n "Testing Google Drive API... "
# Just check if we can list files (doesn't actually list anything sensitive)
if gog drive ls --max 1 &> /dev/null 2>&1; then
  echo -e "$PASS Working"
else
  echo -e "$WARN Failed (check authentication)"
fi

echo -n "Testing Gmail API... "
# Check if we can access Gmail (doesn't send anything)
if gog gmail search "in:inbox" --max 1 &> /dev/null 2>&1; then
  echo -e "$PASS Working"
else
  echo -e "$WARN Failed (check authentication)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✓ All checks passed!${NC}"
echo ""
echo "You're ready to run the digest:"
echo "  ./run-digest.sh"
echo ""
echo "Or test with dry-run (comment out email step):"
echo "  # Edit run-digest.sh and comment out email sending"
echo "  ./run-digest.sh"
echo ""
