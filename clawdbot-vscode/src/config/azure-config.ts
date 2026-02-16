/**
 * Azure OpenAI Configuration for VSCode Extension
 *
 * This file reads Azure configuration from environment variables
 * that were loaded by dotenv in extension.ts
 */

/**
 * Get required environment variable
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please set it in your .env file.`
    );
  }
  return value;
}

/**
 * Get Azure OpenAI configuration
 * This is called after dotenv has loaded the .env file
 */
export function getAzureConfig() {
  return {
    endpoint: getRequiredEnv('AZURE_OPENAI_ENDPOINT'),
    deployment: getRequiredEnv('AZURE_OPENAI_DEPLOYMENT'),
    apiVersion: getRequiredEnv('AZURE_OPENAI_API_VERSION'),
    scope: getRequiredEnv('AZURE_OPENAI_SCOPE'),
    managedIdentityClientId: getRequiredEnv('AZURE_OPENAI_MANAGED_IDENTITY_CLIENT_ID'),
  };
}
