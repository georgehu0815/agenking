import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export type McpClientOptions = {
  serverUrl: string;
  timeout?: number;
};

export type McpToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

/**
 * MCP client for connecting to HTTP/SSE MCP servers
 */
export class McpClient {
  private client: Client;
  private transport: SSEClientTransport;
  private serverUrl: string;
  private timeout: number;
  private connected: boolean = false;

  constructor(options: McpClientOptions) {
    this.serverUrl = options.serverUrl;
    this.timeout = options.timeout || 30000;

    // Create MCP client
    this.client = new Client(
      {
        name: "clawdbot-catalog-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    // Create SSE transport
    this.transport = new SSEClientTransport(new URL(this.serverUrl));
  }

  /**
   * Connect to MCP server
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    await this.client.connect(this.transport);
    this.connected = true;
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (!this.connected) return;

    await this.client.close();
    this.connected = false;
  }

  /**
   * List available tools from MCP server
   */
  async listTools(): Promise<Array<{
    name: string;
    description?: string;
    inputSchema: Record<string, unknown>;
  }>> {
    if (!this.connected) {
      await this.connect();
    }

    const response = await this.client.listTools();

    return response.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.connected) {
      await this.connect();
    }

    const response = await this.client.callTool({
      name,
      arguments: args,
    });

    // Extract content from response
    if (!response.content || response.content.length === 0) {
      return null;
    }

    // For single text response, parse as JSON
    if (response.content.length === 1 && response.content[0].type === "text") {
      const text = response.content[0].text;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    // For multiple responses, parse each
    if (response.content.length > 1) {
      return response.content.map((item) => {
        if (item.type === "text") {
          try {
            return JSON.parse(item.text);
          } catch {
            return item.text;
          }
        }
        return item;
      });
    }

    return response.content;
  }
}

/**
 * Create MCP client with automatic cleanup
 */
export async function withMcpClient<T>(
  options: McpClientOptions,
  fn: (client: McpClient) => Promise<T>
): Promise<T> {
  const client = new McpClient(options);

  try {
    await client.connect();
    return await fn(client);
  } finally {
    await client.disconnect();
  }
}
