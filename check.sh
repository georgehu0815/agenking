pnpm clawdbot status --all


# Listening: 127.0.0.1:18789
# Troubles: run clawdbot status
# Troubleshooting: https://docs.clawd.bot/troubleshooting
# ✓ Gateway is running

# ━━━ Channels Status ━━━

# > clawdbot@2026.1.25 clawdbot /Users/ghu/aiworker/clawdbot
# > node scripts/run-node.mjs channels status


# 🦞 Clawdbot 2026.1.25 (6d8fb60) — Your messages, your servers, Meta's tears.

# Checking channel status…
# Gateway reachable.
# - Telegram default: enabled, configured, running, mode:polling, token:config
# - WhatsApp default: enabled, configured, linked, running, connected, dm:allowlist, allow:+13522355298
# - Slack default: disabled, configured, stopped, bot:config, app:config, error:disabled

# Tip: status --deep adds gateway health probes to status output (requires a reachable gateway).

# ━━━ Skills Status ━━━
#   Ready skills: 45
#   Missing deps: 10

# ━━━ Running Processes ━━━
#   Gateway PIDs: 38002 

# ━━━ Configuration ━━━
#   Config: ~/.clawdbot/clawdbot.json
#   Gateway: http://127.0.0.1:> clawdbot@2026.1.25 clawdbot /Users/ghu/aiworker/clawdbot> node scripts/run-node.mjs config get gateway.port18789
#   Bind: > clawdbot@2026.1.25 clawdbot /Users/ghu/aiworker/clawdbot> node scripts/run-node.mjs config get gateway.bindloopback

# ━━━ Quick Actions ━━━
#   Launch TUI:        pnpm clawdbot tui
#   Start gateway:     pnpm clawdbot gateway start
#   Stop gateway:      pnpm clawdbot gateway stop
#   View logs:         pnpm clawdbot logs -f
#   Open dashboard:    pnpm clawdbot dashboard
#   Full status:       pnpm clawdbot status --all
#   Doctor check:      pnpm clawdbot doctor

# ━━━ Convenience Scripts ━━━
#   Launch TUI:        ./launch-tui.sh
#   Start both:        ./start-gateway-and-tui.sh
#   Organize files:    ./use-file-organizer.sh