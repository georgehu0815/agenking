import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { type Api, completeSimple, type Model } from "@mariozechner/pi-ai";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../config/config.js";
import { isTruthyEnvValue } from "../infra/env.js";
import {
  type AuthProfileCredential,
  ensureAuthProfileStore,
  saveAuthProfileStore,
} from "./auth-profiles.js";
import { getApiKeyForModel, requireApiKey } from "./model-auth.js";
import { normalizeProviderId } from "./model-selection.js";
import { ensureOpenClawModelsJson } from "./models-config.js";
import { discoverAuthStorage, discoverModels } from "./pi-model-discovery.js";
import { TokenManager } from "./token-manager.js";

const LIVE = isTruthyEnvValue(process.env.LIVE) || isTruthyEnvValue(process.env.OPENCLAW_LIVE_TEST);
const describeLive = LIVE ? describe : describe.skip;

const ANTHROPIC_PROVIDER = "anthropic";
const PREFERRED_MODEL_IDS = [
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
  "claude-sonnet-4-5",
  "claude-sonnet-4-0",
  "claude-haiku-3-5",
];

function pickAnthropicModel(models: Array<Model<Api>>): Model<Api> | null {
  for (const id of PREFERRED_MODEL_IDS) {
    const match = models.find(
      (m) => normalizeProviderId(m.provider) === ANTHROPIC_PROVIDER && m.id === id,
    );
    if (match) {
      return match;
    }
  }
  return models.find((m) => normalizeProviderId(m.provider) === ANTHROPIC_PROVIDER) ?? null;
}

describeLive("anthropic via token-manager (keychain)", () => {
  it(
    "sends a message using the API key sourced from macOS keychain",
    async () => {
      // 1. Retrieve the API key from the macOS keychain via TokenManager.
      //    TokenManager checks ANTHROPIC_API_KEY env var first, then the
      //    "Claude Code" keychain service where Claude Code stores its key.
      const tokenManager = new TokenManager({ verbose: true });
      const keychainApiKey = tokenManager.getAnthropicApiKey();

      if (!keychainApiKey) {
        throw new Error(
          "No Anthropic API key found via TokenManager. " +
            'Set ANTHROPIC_API_KEY or ensure a "Claude Code" keychain entry exists on macOS.',
        );
      }

      // 2. Write the keychain-sourced key into a temp agent dir as an
      //    anthropic:default profile so the standard auth pipeline resolves it.
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-token-mgr-"));
      const profileId = `anthropic:token-manager-${randomUUID()}`;

      try {
        const store = ensureAuthProfileStore(tempDir, { allowKeychainPrompt: false });
        store.profiles[profileId] = {
          type: "api_key",
          provider: ANTHROPIC_PROVIDER,
          key: keychainApiKey,
        } satisfies AuthProfileCredential;
        saveAuthProfileStore(store, tempDir);

        // 3. Load the main OpenClaw config (contains the anthropic provider
        //    definition added earlier) and discover models for the temp dir.
        const cfg = loadConfig();
        await ensureOpenClawModelsJson(cfg, tempDir);

        const authStorage = discoverAuthStorage(tempDir);
        const modelRegistry = discoverModels(authStorage, tempDir);
        const allModels = Array.isArray(modelRegistry) ? modelRegistry : modelRegistry.getAll();

        const anthropicModels = (allModels as Array<Model<Api>>).filter(
          (m) => normalizeProviderId(m.provider) === ANTHROPIC_PROVIDER,
        );

        expect(anthropicModels.length).toBeGreaterThan(0);

        const model = pickAnthropicModel(allModels as Array<Model<Api>>);
        if (!model) {
          throw new Error(
            "No Anthropic models discovered. Verify the anthropic provider is " +
              "defined in ~/.openclaw/openclaw.json models.providers.",
          );
        }

        console.log(`[token-manager-live] selected model: ${model.provider}/${model.id}`);

        // 4. Resolve the key through the standard auth pipeline, verifying
        //    that the profile written from the keychain key is found correctly.
        const authInfo = await getApiKeyForModel({
          model,
          cfg,
          profileId,
          agentDir: tempDir,
        });
        const resolvedKey = requireApiKey(authInfo, ANTHROPIC_PROVIDER);

        expect(resolvedKey).toBe(keychainApiKey);
        expect(authInfo.source).toBe(`profile:${profileId}`);

        // 5. Send a message to the Anthropic API and verify the response.
        const response = await completeSimple(
          model,
          {
            messages: [
              {
                role: "user",
                content: "Reply with the single word: ok",
                timestamp: Date.now(),
              },
            ],
          },
          {
            apiKey: resolvedKey,
            maxTokens: 64,
            temperature: 0,
          },
        );

        const text = response.content
          .filter((block) => block.type === "text")
          .map((block) => block.text.trim())
          .join(" ")
          .toLowerCase();

        console.log(`[token-manager-live] response: "${text}"`);

        expect(text.length).toBeGreaterThan(0);
        expect(text).toContain("ok");
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    },
    2 * 60 * 1000,
  );
});
