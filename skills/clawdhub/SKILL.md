---
name: clawdhub
description: Use the ClawdHub CLI to search, install, update, and publish agent skills from clawdhub.com. Use when you need to fetch new skills on the fly, sync installed skills to latest or a specific version, or publish new/updated skill folders with the npm-installed clawdhub CLI.
metadata: {"clawdbot":{"requires":{"bins":["clawdhub"]},"install":[{"id":"node","kind":"node","package":"clawdhub","bins":["clawdhub"],"label":"Install ClawdHub CLI (npm)"}]}}
---

# ClawdHub CLI

Install
```bash
npm i -g clawdhub
```

Auth (publish)
```bash
clawdhub login
clawdhub whoami
```

Search
```bash
clawdhub search "postgres backups"
```

mcp-skill v1.0.0  Mcp Skill  (0.481)
mcporter v1.0.0  Mcporter  (0.462)
apple-docs-mcp v1.0.0  Apple Docs Mcp  (0.452)
mcd-cn v1.0.0  McDonald's China  (0.437)
atlassian-mcp v1.0.0  Atlassian MCP (Jira, Confluence)  (0.431)
mcporter-skill v1.0.0  mcporter  (0.428)
clickup-mcp v1.0.0  ClickUp MCP  (0.421)
microsoft-ads-mcp v1.0.0  Microsoft Ads MCP  (0.413)
gold-price-mcp v1.0.0  Gold Price Mcp  (0.383)
openai-docs v1.0.0  OpenAI Developer Docs  (0.360)

Install
```bash
clawdhub install my-skill
clawdhub install my-skill --version 1.2.3
```

Update (hash-based match + upgrade)
```bash
clawdhub update my-skill
clawdhub update my-skill --version 1.2.3
clawdhub update --all
clawdhub update my-skill --force
clawdhub update --all --no-input --force
```
pnpm clawdhub list

List
```bash
clawdhub list
```

Publish
```bash
clawdhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.2.0 --changelog "Fixes + docs"
```

Notes
- Default registry: https://clawdhub.com (override with CLAWDHUB_REGISTRY or --registry)
- Default workdir: cwd (falls back to Clawdbot workspace); install dir: ./skills (override with --workdir / --dir / CLAWDHUB_WORKDIR)
- Update command hashes local files, resolves matching version, and upgrades to latest unless --version is set
