import type { ApplyAuthChoiceParams, ApplyAuthChoiceResult } from "./auth-choice.apply.js";
import {
  applyAzureOpenAIConfig,
  applyAuthProfileConfig,
  AZURE_OPENAI_DEFAULT_MODEL_REF,
} from "./onboard-auth.js";

export async function applyAuthChoiceAzureOpenAI(
  params: ApplyAuthChoiceParams,
): Promise<ApplyAuthChoiceResult | null> {
  if (params.authChoice !== "azure-openai-managedidentity") {
    return null;
  }

  let nextConfig = params.config;
  let agentModelOverride: string | undefined;

  await params.prompter.note(
    [
      "Azure OpenAI with Managed Identity authentication",
      "",
      "For development: Run `az login` to authenticate",
      "For production: Ensure Managed Identity is configured on your Azure resource",
      "",
      "Make sure your Azure OpenAI deployment is configured in:",
      "  src/agents/azure-openai-models.ts",
    ].join("\n"),
    "Azure OpenAI Setup",
  );

  // Apply Azure OpenAI provider configuration
  nextConfig = applyAzureOpenAIConfig(nextConfig);

  // Add auth profile for managed identity
  nextConfig = applyAuthProfileConfig(nextConfig, {
    profileId: "azureopenai:default",
    provider: "azureopenai",
    mode: "managedidentity",
  });

  if (params.setDefaultModel) {
    await params.prompter.note(
      `Default model set to ${AZURE_OPENAI_DEFAULT_MODEL_REF} (GPT-5.2)`,
      "Model configured",
    );
  } else {
    agentModelOverride = AZURE_OPENAI_DEFAULT_MODEL_REF;
    if (params.agentId) {
      await params.prompter.note(
        `Default model set to ${AZURE_OPENAI_DEFAULT_MODEL_REF} for agent "${params.agentId}".`,
        "Model configured",
      );
    }
  }

  await params.prompter.note(
    [
      "Azure OpenAI configured successfully!",
      "",
      "Next steps:",
      "1. Update your Azure OpenAI endpoint and deployment in:",
      "   src/agents/azure-openai-models.ts",
      "2. Run `pnpm build` to apply changes",
      "3. For production, set NODE_ENV=production",
    ].join("\n"),
    "Configuration complete",
  );

  return { config: nextConfig, agentModelOverride };
}
