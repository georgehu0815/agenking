/**
 * Simplified Agent for VSCode Extension
 *
 * This is a lightweight agent implementation that:
 * - Works in CommonJS/bundled environment
 * - Doesn't load skills (not needed for VSCode)
 * - Streams events to the extension
 * - Uses Azure OpenAI with Managed Identity
 */

import { ChatOpenAI } from '@langchain/openai';
import { AzureCliCredential, ManagedIdentityCredential } from '@azure/identity';
import type { AgentEvent } from '../shared/types.js';
import { getAzureConfig } from '../config/azure-config.js';

export interface AgentConfig {
  model: string;
  maxIterations?: number;
  signal?: AbortSignal;
}

// Cache for Azure token
let cachedAzureToken: { token: string; expiresAt: number } | null = null;

export class SimpleAgent {
  private model: string;
  private maxIterations: number;
  private signal?: AbortSignal;

  constructor(config: AgentConfig) {
    this.model = config.model;
    this.maxIterations = config.maxIterations ?? 10;
    this.signal = config.signal;
  }

  static create(config: AgentConfig): SimpleAgent {
    return new SimpleAgent(config);
  }

  /**
   * Get Azure OpenAI token using Managed Identity or Azure CLI
   */
  private async getAzureToken(): Promise<string> {
    try {
      // Return cached token if still valid (with 5 min buffer)
      if (cachedAzureToken && Date.now() < cachedAzureToken.expiresAt - 5 * 60 * 1000) {
        console.log('[SimpleAgent] Using cached Azure token');
        return cachedAzureToken.token;
      }

      // Get Azure configuration
      const config = getAzureConfig();

      // Get credential based on environment
      const credential = process.env.NODE_ENV === 'production'
        ? new ManagedIdentityCredential({ clientId: config.managedIdentityClientId })
        : new AzureCliCredential();

      console.log(`[SimpleAgent] Using ${process.env.NODE_ENV === 'production' ? 'ManagedIdentityCredential' : 'AzureCliCredential'}`);
      console.log('[SimpleAgent] Requesting token for scope:', config.scope);

      // Get token
      const tokenResponse = await credential.getToken(config.scope);

      if (!tokenResponse || !tokenResponse.token) {
        throw new Error('Token response is empty or invalid');
      }

      console.log('[SimpleAgent] Token obtained successfully, expires at:', new Date(tokenResponse.expiresOnTimestamp));

      // Cache the token
      cachedAzureToken = {
        token: tokenResponse.token,
        expiresAt: tokenResponse.expiresOnTimestamp
      };

      return tokenResponse.token;
    } catch (error) {
      console.error('[SimpleAgent] Error obtaining Azure token:', error);
      throw new Error(`Failed to obtain Azure token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async *run(query: string): AsyncGenerator<AgentEvent> {
    const startTime = Date.now();

    try {
      // Yield thinking event
      yield {
        type: 'thinking',
        message: 'Processing your query...'
      };

      // Check for abort
      if (this.signal?.aborted) {
        throw new Error('Aborted');
      }

      // Get Azure configuration and token
      const config = getAzureConfig();
      console.log('[SimpleAgent] Azure config loaded:', {
        endpoint: config.endpoint,
        deployment: config.deployment,
        apiVersion: config.apiVersion
      });

      const azureToken = await this.getAzureToken();
      console.log('[SimpleAgent] Azure token obtained, length:', azureToken.length);

      if (!azureToken || azureToken.length === 0) {
        throw new Error('Failed to obtain Azure token - token is empty');
      }

      // Set OPENAI_API_KEY environment variable as a workaround for ChatOpenAI validation
      // ChatOpenAI checks for this env var in constructor before applying custom config
      process.env.OPENAI_API_KEY = azureToken;
      console.log('[SimpleAgent] Set OPENAI_API_KEY environment variable');

      // Create Azure OpenAI instance
      // Note: GPT-5.2 only supports temperature=1 (default), so we don't set it
      const llm = new ChatOpenAI({
        model: config.deployment,
        streaming: true,
        openAIApiKey: azureToken,
        configuration: {
          baseURL: `${config.endpoint}/openai/deployments/${config.deployment}`,
          defaultQuery: { 'api-version': config.apiVersion },
          defaultHeaders: { 'api-key': azureToken },
        },
      });

      console.log('[SimpleAgent] ChatOpenAI instance created successfully');

      // Yield answer start
      yield {
        type: 'answer_start'
      };

      // Stream the response
      let fullResponse = '';
      const stream = await llm.stream(query);

      for await (const chunk of stream) {
        if (this.signal?.aborted) {
          throw new Error('Aborted');
        }

        const content = chunk.content.toString();
        fullResponse += content;
      }

      // Yield final done event
      const totalTime = Date.now() - startTime;
      yield {
        type: 'done',
        answer: fullResponse,
        iterations: 1,
        totalTime
      };

    } catch (error) {
      if (error instanceof Error && error.message === 'Aborted') {
        throw error;
      }

      // For errors, we can't yield a proper error event since it's not in the type
      // Just throw and let the extension handle it
      throw error;
    }
  }
}
