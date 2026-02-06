import { Type } from "@sinclair/typebox";
import type { ClawdbotPluginApi } from "../../../src/plugins/types.js";
import type { ToolResult } from "../../../src/agents/pi-tool-definition-adapter.js";
import { withMcpClient } from "./mcp-client.js";

type PluginConfig = {
  serverUrl?: string;
  timeout?: number;
};

export function createCatalogMcpTool(api: ClawdbotPluginApi) {
  return {
    name: "catalog_mcp",
    description:
      "Direct TypeScript MCP client for catalog operations. Retrieve item information, search catalog, or list available tools via HTTP/SSE MCP server.",

    parameters: Type.Object({
      operation: Type.Optional(
        Type.Union(
          [
            Type.Literal("get_catalog_item"),
            Type.Literal("get_summary_item"),
            Type.Literal("search_catalog"),
            Type.Literal("list_tools"),
          ],
          {
            description: "Operation to perform",
            default: "list_tools",
          }
        )
      ),
      item_id: Type.Optional(
        Type.String({
          description:
            "Catalog item ID (required for get_catalog_item and get_summary_item)",
        })
      ),
      query: Type.Optional(
        Type.String({
          description: "Search query (required for search_catalog)",
        })
      ),
    }),

    async execute(
      toolCallId: string,
      params: Record<string, unknown>
    ): Promise<ToolResult> {
      const operation = (params.operation as string) || "list_tools";
      const itemId = params.item_id as string | undefined;
      const query = params.query as string | undefined;

      // Get plugin configuration
      const pluginConfig = (api.pluginConfig ?? {}) as PluginConfig;
      const serverUrl =
        pluginConfig.serverUrl || "http://localhost:3333/sse";
      const timeout = pluginConfig.timeout || 30000;

      // Validate required parameters
      if (operation === "search_catalog" && !query) {
        return {
          role: "toolResult",
          toolCallId,
          toolName: "catalog_mcp",
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "search_catalog operation requires 'query' parameter",
              }),
            },
          ],
          isError: true,
        };
      }

      if (
        (operation === "get_catalog_item" || operation === "get_summary_item") &&
        !itemId
      ) {
        return {
          role: "toolResult",
          toolCallId,
          toolName: "catalog_mcp",
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `${operation} operation requires 'item_id' parameter`,
              }),
            },
          ],
          isError: true,
        };
      }

      try {
        // Use MCP client with automatic cleanup
        const result = await withMcpClient(
          { serverUrl, timeout },
          async (client) => {
            // Handle list_tools operation
            if (operation === "list_tools") {
              const tools = await client.listTools();
              return {
                tools: tools.map((t) => ({
                  name: t.name,
                  description: t.description,
                  input_schema: t.inputSchema,
                })),
                operation,
                count: tools.length,
              };
            }

            // Handle search_catalog operation
            if (operation === "search_catalog") {
              const data = await client.callTool("search_catalog", {
                query: query!,
              });

              // Ensure data is an array
              const results = Array.isArray(data)
                ? data
                : data && typeof data === "object"
                ? [data]
                : [];

              return {
                results,
                operation,
                count: results.length,
              };
            }

            // Handle get_catalog_item and get_summary_item operations
            const data = await client.callTool(operation, {
              item_id: itemId!,
            });

            return {
              item: data,
              operation,
            };
          }
        );

        return {
          role: "toolResult",
          toolCallId,
          toolName: "catalog_mcp",
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        const error = err as Error;

        return {
          role: "toolResult",
          toolCallId,
          toolName: "catalog_mcp",
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "MCP client error",
                  message: error.message,
                  serverUrl,
                  operation,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    },
  };
}
