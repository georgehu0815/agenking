import type { ClawdbotPluginApi } from "../../src/plugins/types.js";
import { createCatalogLookupTool } from "./src/catalog-tool.js";

export default function register(api: ClawdbotPluginApi) {
  api.registerTool(createCatalogLookupTool(api), { optional: false });
}
