import { AzureCliCredential, ManagedIdentityCredential } from "@azure/identity";
import {
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_DEPLOYMENT,
  AZURE_OPENAI_API_VERSION,
  AZURE_OPENAI_SCOPE,
  AZURE_OPENAI_MANAGED_IDENTITY_CLIENT_ID,
} from "./azure-openai-models.js";

export type Message = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
  name?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any;
  };
};

export type CompletionChunk = {
  id: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: "function";
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: string | null;
  }>;
};

export class AzureOpenAINativeClient {
  private credential: AzureCliCredential | ManagedIdentityCredential;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    if (process.env.NODE_ENV === "production") {
      this.credential = new ManagedIdentityCredential(AZURE_OPENAI_MANAGED_IDENTITY_CLIENT_ID);
      console.log("[Native Client] Using ManagedIdentityCredential");
    } else {
      this.credential = new AzureCliCredential();
      console.log("[Native Client] Using AzureCliCredential - azure-openai-native-client.ts:68");
    }
  }

  private async getToken(): Promise<string> {
    // Refresh token if expired or not yet fetched
    if (!this.token || Date.now() >= this.tokenExpiry) {
      const tokenResponse = await this.credential.getToken(AZURE_OPENAI_SCOPE);
      this.token = tokenResponse.token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = tokenResponse.expiresOnTimestamp - 5 * 60 * 1000;
      console.log("[Native Client] Token refreshed - azure-openai-native-client.ts:79");
    }
    return this.token;
  }

  async *streamChatCompletion(params: {
    messages: Message[];
    tools?: Tool[];
    temperature?: number;
    maxTokens?: number;
  }): AsyncGenerator<CompletionChunk> {
    const token = await this.getToken();

    const url = `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

    const body: any = {
      messages: params.messages,
      stream: true,
      temperature: params.temperature ?? 1,
      max_tokens: params.maxTokens,
    };

    if (params.tools && params.tools.length > 0) {
      body.tools = params.tools;
      // Use "auto" to let model decide when to use tools
      // This prevents forcing empty arguments when model is uncertain
      body.tool_choice = "auto";
    }

    console.log("[Native Client] Calling Azure OpenAI API - azure-openai-native-client.ts:108");
    console.log("[Native Client] URL: - azure-openai-native-client.ts:109", url);
    console.log("[Native Client] Tools count:", params.tools?.length ?? 0);
    //    console.log("[Native Client] Messages being sent:", JSON.stringify(params.messages, null, 2));
    // console.log("[Native Client] Request body:", JSON.stringify(body, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "api-key": token, // Azure OpenAI also accepts api-key header
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Azure OpenAI API error: ${response.status} ${response.statusText}\n${errorText}`,
      );
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") {
            continue;
          }

          if (trimmed.startsWith("data: ")) {
            try {
              const jsonStr = trimmed.slice(6); // Remove "data: " prefix
              const chunk: CompletionChunk = JSON.parse(jsonStr);
              yield chunk;
            } catch (error) {
              console.error("[Native Client] Failed to parse chunk:", trimmed, error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
