pnpm clawdbot hooks       

> clawdbot@2026.1.25 clawdbot /Users/ghu/aiworker/clawdbot
> node scripts/run-node.mjs hooks


🦞 Clawdbot 2026.1.25 (20f6a55) — WhatsApp automation without the "please accept our new privacy policy".

Hooks (3/4 ready)
┌───────────┬──────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────┐
│ Status    │ Hook                                             │ Description                                                                                             │ Source                                          │
├───────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ ✓ ready   │ 🚀 boot-md                                        │ Run BOOT.md on gateway startup                                                                          │ clawdbot-bundled                                │
│ ✓ ready   │ 📝 command-logger                                 │ Log all command events to a centralized audit file                                                      │ clawdbot-bundled                                │
│ ✓ ready   │ 💾 session-memory                                 │ Save session context to memory when /new command is issued                                              │ clawdbot-bundled                                │
│ ✗ missing │ 😈 soul-evil                                      │ Swap SOUL.md with SOUL_EVIL.md during a purge window or by random chance                                │ clawdbot-bundled   