// Defaults for agent metadata when upstream does not supply them.
// Using Azure OpenAI with managed identity as the default provider.
export const DEFAULT_PROVIDER = "azureopenai";
export const DEFAULT_MODEL = "gpt-5.2";
// Context window: GPT-5.2 supports 128k tokens.
export const DEFAULT_CONTEXT_TOKENS = 128_000;
