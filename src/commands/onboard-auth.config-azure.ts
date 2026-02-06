import {
  buildAzureOpenAIModelDefinition,
  AZURE_OPENAI_DEFAULT_MODEL_REF,
  AZURE_OPENAI_MODEL_CATALOG,
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_API_VERSION,
} from "../agents/azure-openai-models.js";
import type { ClawdbotConfig } from "../config/config.js";

export function applyAzureOpenAIProviderConfig(cfg: ClawdbotConfig): ClawdbotConfig {
  const models = { ...cfg.agents?.defaults?.models };
  models[AZURE_OPENAI_DEFAULT_MODEL_REF] = {
    ...models[AZURE_OPENAI_DEFAULT_MODEL_REF],
    alias: models[AZURE_OPENAI_DEFAULT_MODEL_REF]?.alias ?? "GPT-5.2",
  };

  const providers = { ...cfg.models?.providers };
  const existingProvider = providers.azureopenai;
  const existingModels = Array.isArray(existingProvider?.models) ? existingProvider.models : [];
  const azureModels = AZURE_OPENAI_MODEL_CATALOG.map(buildAzureOpenAIModelDefinition);
  const mergedModels = [
    ...existingModels,
    ...azureModels.filter((model) => !existingModels.some((existing) => existing.id === model.id)),
  ];
  const { apiKey: existingApiKey, ...existingProviderRest } = (existingProvider ?? {}) as Record<
    string,
    unknown
  > as { apiKey?: string };
  const resolvedApiKey = typeof existingApiKey === "string" ? existingApiKey : undefined;
  const normalizedApiKey = resolvedApiKey?.trim();

  providers.azureopenai = {
    ...existingProviderRest,
    baseUrl: AZURE_OPENAI_ENDPOINT,
    api: "openai-completions",
    auth: "managedidentity",
    headers: {
      "api-version": AZURE_OPENAI_API_VERSION,
    },
    ...(normalizedApiKey ? { apiKey: normalizedApiKey } : {}),
    models: mergedModels.length > 0 ? mergedModels : azureModels,
  };

  return {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        models,
      },
    },
    models: {
      mode: cfg.models?.mode ?? "merge",
      providers,
    },
  };
}

export function applyAzureOpenAIConfig(cfg: ClawdbotConfig): ClawdbotConfig {
  const next = applyAzureOpenAIProviderConfig(cfg);
  const existingModel = next.agents?.defaults?.model;
  return {
    ...next,
    agents: {
      ...next.agents,
      defaults: {
        ...next.agents?.defaults,
        model: {
          ...(existingModel && "fallbacks" in (existingModel as Record<string, unknown>)
            ? {
                fallbacks: (existingModel as { fallbacks?: string[] }).fallbacks,
              }
            : undefined),
          primary: AZURE_OPENAI_DEFAULT_MODEL_REF,
        },
      },
    },
  };
}
