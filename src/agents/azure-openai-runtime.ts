// import { AzureChatOpenAI } from "@langchain/openai";
// import {
//   ManagedIdentityCredential,
//   AzureCliCredential,
//   DefaultAzureCredential,
// } from "@azure/identity";
// import { getBearerTokenProvider } from "@azure/identity";
// import {
//   AZURE_OPENAI_ENDPOINT,
//   AZURE_OPENAI_DEPLOYMENT,
//   AZURE_OPENAI_API_VERSION,
//   AZURE_OPENAI_SCOPE,
//   AZURE_OPENAI_MANAGED_IDENTITY_CLIENT_ID,
// } from "./azure-openai-models.js";

// let cachedModel: AzureChatOpenAI | null = null;

// export async function getAzureOpenAIModelInstance(): Promise<AzureChatOpenAI> {
//   if (cachedModel) {
//     return cachedModel;
//   }

//   console.log(
//     "[Runtime] Initializing Azure OpenAI with managed identity - azure-openai-runtime.ts:19",
//   );

//   let credential;

//   // Check if running in a development environment
//   if (process.env.NODE_ENV === "production") {
//     credential = new ManagedIdentityCredential(AZURE_OPENAI_MANAGED_IDENTITY_CLIENT_ID);
//     console.log(
//       `ENV : ${process.env.NODE_ENV}  Using ManagedIdentityCredential - azure-openai-runtime.ts:26`,
//     );
//   } else {
//     credential = new AzureCliCredential();
//     console.log(
//       `ENV : ${process.env.NODE_ENV}  Using AzureCliCredential - azure-openai-runtime.ts:29`,
//     );
//   }

//   console.log("Using credential: - azure-openai-runtime.ts:32", credential.constructor.name);
//   // const credential = new DefaultAzureCredential();
//   // const scope = "https://cognitiveservices.azure.com/.default";
//   // const azureADTokenProvider = getBearerTokenProvider(credential, scope);
//   // Get the bearer token provider function
//   const azureADTokenProvider = getBearerTokenProvider(credential, AZURE_OPENAI_SCOPE);

//   // Create AzureChatOpenAI instance with managed identity authentication
//   // Note: Do NOT set azureOpenAIApiKey when using managed identity - it will override the token provider
//   const model = new AzureChatOpenAI({
//     model: AZURE_OPENAI_DEPLOYMENT,
//     temperature: 1,
//     maxTokens: undefined,
//     timeout: undefined,
//     maxRetries: 2,
//     // Azure-specific configuration
//     azureOpenAIApiVersion: AZURE_OPENAI_API_VERSION,
//     azureOpenAIApiDeploymentName: AZURE_OPENAI_DEPLOYMENT,
//     azureOpenAIEndpoint: AZURE_OPENAI_ENDPOINT,
//     azureADTokenProvider: azureADTokenProvider, // This enables managed identity authentication
//   });

//   console.log(
//     `[Runtime] Azure OpenAI client initialized for deployment: ${AZURE_OPENAI_DEPLOYMENT}`,
//   );

//   cachedModel = model;
//   return model;
// }

// export function clearAzureOpenAICache(): void {
//   cachedModel = null;
// }
