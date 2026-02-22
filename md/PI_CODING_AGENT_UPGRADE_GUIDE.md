# pi-coding-agent Upgrade Guide

Reference for upgrading `@mariozechner/pi-coding-agent` in clawdbot.

---

## How to Check the Installed Version

```bash
# What version is actually symlinked (the one Node.js resolves at runtime)
ls -la node_modules/@mariozechner/pi-coding-agent

# Full version in the pnpm store
cat node_modules/@mariozechner/pi-coding-agent/package.json | grep '"version"'
```

> **Warning:** The `.d.ts` files you read with an editor may be from a *different* version in the pnpm store than what the symlink resolves to at runtime. Always check the symlink target first.

---

## Known Breaking Changes by Version

### v0.49.3 → v0.54.0

#### 1. `AuthStorage` — static factory added

| Version | How to create |
|---------|---------------|
| **0.49.3** | `new AuthStorage(authPath: string)` — constructor, path is **required** |
| **0.54.0** | `AuthStorage.create(authPath?: string)` — static factory, path optional |

Also in 0.49.3, `discoverAuthStorage` and `discoverModels` are **exported directly** from the package index:

```ts
// 0.49.3 — just re-export; no wrapper needed
export { discoverAuthStorage, discoverModels } from "@mariozechner/pi-coding-agent";

// 0.54.0 — must wrap manually because they were removed from the index
import { AuthStorage, ModelRegistry } from "@mariozechner/pi-coding-agent";
export function discoverAuthStorage(agentDir?: string): AuthStorage {
  return AuthStorage.create(authPath);
}
```

**File to update:** [src/agents/pi-model-discovery.ts](../src/agents/pi-model-discovery.ts)

#### 2. `ToolDefinition.execute` — parameter order changed

| Version | Signature |
|---------|-----------|
| **0.49.3** | `execute(toolCallId, params, onUpdate, ctx: ExtensionContext, signal?)` |
| **0.54.0** | `execute(toolCallId, params, signal?, onUpdate?, ctx?)` *(tentative — verify on upgrade)* |

The inner `AgentTool.execute` (from `@mariozechner/pi-agent-core`) stays consistent:
```ts
// pi-agent-core (both versions)
execute(toolCallId, params, signal?, onUpdate?)
```

**File to update:** [src/agents/pi-tool-definition-adapter.ts](../src/agents/pi-tool-definition-adapter.ts)

#### 3. `CreateAgentSessionOptions.systemPrompt`

| Version | Status |
|---------|--------|
| **0.49.3** | `systemPrompt` is a valid option — no suppressor needed |
| **0.54.0** | `systemPrompt` removed from the type but **still accepted at runtime** — requires `@ts-expect-error` |

**Files to update:** [src/agents/pi-embedded-runner/compact.ts](../src/agents/pi-embedded-runner/compact.ts), [src/agents/pi-embedded-runner/run/attempt.ts](../src/agents/pi-embedded-runner/run/attempt.ts)

---

## Upgrade Checklist

Run these steps whenever bumping the package version in `package.json`:

1. **Check actual installed version** (symlink target, not pnpm store path)
   ```bash
   ls -la node_modules/@mariozechner/pi-coding-agent
   ```

2. **Verify `discoverAuthStorage` / `discoverModels` exports**
   ```bash
   grep "discoverAuthStorage\|discoverModels" \
     node_modules/@mariozechner/pi-coding-agent/dist/index.js
   ```
   - If present → keep the simple re-export in `pi-model-discovery.ts`
   - If absent → write wrapper using `AuthStorage.create()` / `new ModelRegistry()`

3. **Verify `AuthStorage` API**
   ```bash
   grep "static create\|constructor" \
     node_modules/@mariozechner/pi-coding-agent/dist/core/auth-storage.js
   ```

4. **Verify `ToolDefinition.execute` signature**
   ```bash
   grep "execute(" \
     node_modules/@mariozechner/pi-coding-agent/dist/core/extensions/types.d.ts
   ```
   Update parameter order in `pi-tool-definition-adapter.ts` to match.

5. **Verify `CreateAgentSessionOptions`**
   ```bash
   grep "systemPrompt" \
     node_modules/@mariozechner/pi-coding-agent/dist/core/sdk.d.ts
   ```
   - If present → remove any `@ts-expect-error` suppressors
   - If absent → add `@ts-expect-error` before `systemPrompt` in `compact.ts` and `attempt.ts`

6. **Build and check for new errors**
   ```bash
   pnpm build 2>&1
   ```

7. **Test at runtime** (catch issues the type checker won't catch)
   ```bash
   clawdbot stop
   bash start-gateway.sh
   sleep 3
   grep -i "error\|AuthStorage\|model.catalog" ~/.clawdbot/logs/gateway.err.log | tail -20
   ```

---

## Why Runtime Errors Differ from Type Errors

pnpm uses a content-addressed store with symlinks. It is possible for:
- The **symlink** (`node_modules/@mariozechner/pi-coding-agent`) to point to version **A**
- A **different copy** in the store to exist at version **B**

The `.d.ts` files you read in your editor are whichever version your editor's module resolver finds — which may not match what Node.js loads at runtime.

**Always verify with:**
```bash
node --input-type=module -e "
import { AuthStorage } from '@mariozechner/pi-coding-agent';
console.log('own props:', Object.getOwnPropertyNames(AuthStorage));
console.log('has create:', typeof AuthStorage.create);
"
```

---

## Azure OpenAI Managed Identity Config

The `openclaw.json` provider config that enables the custom stream adapter:

```json
"azureopenai": {
  "baseUrl": "https://<your-endpoint>.cognitiveservices.azure.com/",
  "auth": "managedidentity",
  "api": "openai-completions",
  "headers": { "api-version": "2024-08-01-preview" },
  "models": [
    {
      "id": "gpt-5.2",
      "name": "GPT-5.2",
      "input": ["text", "image"],
      "contextWindow": 128000,
      "maxTokens": 8192
    }
  ]
}
```

The `auth: "managedidentity"` field triggers `streamAzureOpenAINative` in `attempt.ts`:

```ts
// src/agents/pi-embedded-runner/run/attempt.ts
const usesAzureManagedIdentity =
  normalizedProvider === "azureopenai" && providerConfig?.auth === "managedidentity";

if (usesAzureManagedIdentity) {
  activeSession.agent.streamFn = (model, context, options) =>
    streamAzureOpenAINative(context, options);
}
```

Managed identity client ID and endpoint constants live in [src/agents/azure-openai-models.ts](../src/agents/azure-openai-models.ts).
