import type { ClawdbotPluginApi } from "../../src/plugins/types.js";
import { createCatalogMcpTool } from "./src/catalog-mcp-tool.js";

export default function register(api: ClawdbotPluginApi) {
  // Register as non-optional so it's always available
  api.registerTool(createCatalogMcpTool(api), { optional: false });
}
