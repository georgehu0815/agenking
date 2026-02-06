#!/bin/bash
# Comprehensive Clawdbot status check

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Clawdbot System Status Check          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Check gateway
echo -e "${BLUE}━━━ Gateway Status ━━━${NC}"
if pnpm clawdbot gateway status 2>/dev/null; then
  echo -e "${GREEN}✓ Gateway is running${NC}"
else
  echo -e "${RED}✗ Gateway is not running${NC}"
  echo -e "${YELLOW}  Run: pnpm clawdbot gateway start${NC}"
fi
echo ""

# Check channels
echo -e "${BLUE}━━━ Channels Status ━━━${NC}"
pnpm clawdbot channels status 2>/dev/null || echo -e "${RED}✗ Channels check failed${NC}"
echo ""

# Check skills
echo -e "${BLUE}━━━ Skills Status ━━━${NC}"
skill_count=$(pnpm clawdbot skills list 2>/dev/null | grep -c "✓ ready" || echo "0")
missing_count=$(pnpm clawdbot skills list 2>/dev/null | grep -c "✗ missing" || echo "0")
echo -e "  Ready skills: ${GREEN}$skill_count${NC}"
echo -e "  Missing deps: ${YELLOW}$missing_count${NC}"
echo ""

# Check processes
echo -e "${BLUE}━━━ Running Processes ━━━${NC}"
gateway_pids=$(ps aux | grep -E "clawdbot.*gateway|clawdbot-gateway" | grep -v grep | awk '{print $2}' | tr '\n' ' ')
if [ -n "$gateway_pids" ]; then
  echo -e "  Gateway PIDs: ${GREEN}$gateway_pids${NC}"
else
  echo -e "  ${RED}No gateway processes found${NC}"
fi
echo ""

# Check config
echo -e "${BLUE}━━━ Configuration ━━━${NC}"
echo -e "  Config: ${GREEN}~/.clawdbot/clawdbot.json${NC}"
if [ -f ~/.clawdbot/clawdbot.json ]; then
  port=$(pnpm clawdbot config get gateway.port 2>/dev/null | tr -d '\n')
  bind=$(pnpm clawdbot config get gateway.bind 2>/dev/null | tr -d '\n')
  echo -e "  Gateway: ${BLUE}http://127.0.0.1:${port}${NC}"
  echo -e "  Bind: ${BLUE}${bind}${NC}"
fi
echo ""

# Quick actions
echo -e "${BLUE}━━━ Quick Actions ━━━${NC}"
echo -e "  Launch TUI:        ${YELLOW}pnpm clawdbot tui${NC}"
echo -e "  Start gateway:     ${YELLOW}pnpm clawdbot gateway start${NC}"
echo -e "  Stop gateway:      ${YELLOW}pnpm clawdbot gateway stop${NC}"
echo -e "  View logs:         ${YELLOW}pnpm clawdbot logs -f${NC}"
echo -e "  Open dashboard:    ${YELLOW}pnpm clawdbot dashboard${NC}"
echo -e "  Full status:       ${YELLOW}pnpm clawdbot status --all${NC}"
echo -e "  Doctor check:      ${YELLOW}pnpm clawdbot doctor${NC}"
echo ""

# Convenience scripts
echo -e "${BLUE}━━━ Convenience Scripts ━━━${NC}"
echo -e "  Launch TUI:        ${YELLOW}./launch-tui.sh${NC}"
echo -e "  Start both:        ${YELLOW}./start-gateway-and-tui.sh${NC}"
echo -e "  Organize files:    ${YELLOW}./use-file-organizer.sh${NC}"
echo ""

echo -e "${GREEN}✓ Status check complete${NC}"
