import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Type } from "@sinclair/typebox";
import type { ClawdbotPluginApi } from "../../../src/plugins/types.js";
import type { ToolResult } from "../../../src/agents/pi-tool-definition-adapter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type PluginConfig = {
  mcpServerUrl?: string;
};

export function createCatalogLookupTool(api: ClawdbotPluginApi) {
  return {
    name: "catalog_lookup",
    description:
      "Retrieve catalog item information, summary, search, or list available tools via HTTP/SSE MCP server",

    parameters: Type.Object({
      operation: Type.Optional(
        Type.Union([
          Type.Literal("get_catalog_item"),
          Type.Literal("get_summary_item"),
          Type.Literal("search_catalog"),
          Type.Literal("list_tools"),
        ], {
          description: "Operation to perform",
          default: "get_catalog_item",
        })
      ),
      item_id: Type.Optional(
        Type.String({
          description: "Catalog item ID (required for get_catalog_item and get_summary_item)",
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
      const operation = (params.operation as string) || "get_catalog_item";
      const itemId = params.item_id as string | undefined;
      const query = params.query as string | undefined;

      // Validate required parameters
      if (operation === "search_catalog" && !query) {
        return {
          role: "toolResult",
          toolCallId,
          toolName: "catalog_lookup",
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "search_catalog operation requires 'query' parameter"
            })
          }],
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
          toolName: "catalog_lookup",
          content: [{
            type: "text",
            text: JSON.stringify({
              error: `${operation} operation requires 'item_id' parameter`
            })
          }],
          isError: true,
        };
      }

      // Resolve paths to skill Python files
      const skillDir = path.resolve(__dirname, "../../../skills/catalog_lookup_http");
      const venvPython = path.join(skillDir, ".venv/bin/python3");

      // Check if venv exists, fall back to system python
      const pythonPath = await import("node:fs/promises")
        .then(fs => fs.access(venvPython).then(() => venvPython))
        .catch(() => "python3");

      // Prepare input for Python skill
      const skillInput = {
        operation,
        ...(itemId && { item_id: itemId }),
        ...(query && { query }),
      };

      // Set MCP server URL from config if provided
      const pluginConfig = (api.pluginConfig ?? {}) as PluginConfig;
      const env = { ...process.env };
      if (pluginConfig.mcpServerUrl) {
        env.MCP_SERVER_URL = pluginConfig.mcpServerUrl;
      }

      return new Promise((resolve) => {
        const proc = spawn(
          pythonPath,
          [
            "-c",
            `import json, sys; sys.path.insert(0, '${skillDir}'); from skill import handler; print(json.dumps(handler(json.load(sys.stdin))))`,
          ],
          {
            cwd: skillDir,
            stdio: ["pipe", "pipe", "pipe"],
            env,
          }
        );

        let stdout = "";
        let stderr = "";

        proc.stdin.write(JSON.stringify(skillInput));
        proc.stdin.end();

        proc.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        proc.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        proc.on("close", (code) => {
          if (code !== 0) {
            resolve({
              role: "toolResult",
              toolCallId,
              toolName: "catalog_lookup",
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: `Skill execution failed (exit code ${code})`,
                  stderr: stderr.trim(),
                }, null, 2)
              }],
              isError: true,
            });
            return;
          }

          try {
            // Parse the result from Python skill
            const result = JSON.parse(stdout);

            resolve({
              role: "toolResult",
              toolCallId,
              toolName: "catalog_lookup",
              content: [{
                type: "text",
                text: JSON.stringify(result, null, 2),
              }],
            });
          } catch (err) {
            resolve({
              role: "toolResult",
              toolCallId,
              toolName: "catalog_lookup",
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: "Failed to parse skill output",
                  stdout: stdout.trim(),
                  stderr: stderr.trim(),
                }, null, 2)
              }],
              isError: true,
            });
          }
        });

        proc.on("error", (err) => {
          resolve({
            role: "toolResult",
            toolCallId,
            toolName: "catalog_lookup",
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Failed to spawn Python process",
                message: err.message,
              }, null, 2)
            }],
            isError: true,
          });
        });
      });
    },
  };
}
