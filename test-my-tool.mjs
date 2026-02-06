#!/usr/bin/env node
import { createJiti } from "jiti";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function test() {
  console.log("Testing catalog_lookup tool...\n");

  const jiti = createJiti(__dirname, {
    interopDefault: true,
    esmResolve: true,
  });

  const toolModule = await jiti.import(
    "./extensions/catalog-lookup-http/src/catalog-tool.ts"
  );
  const mockApi = { pluginConfig: {} };
  const tool = toolModule.createCatalogLookupTool(mockApi);

  console.log("Tool name:", tool.name);
  console.log("Executing tool with operation=list_tools...\n");

  try {
    const result = await tool.execute("test-1", {
      operation: "list_tools"
    });

    console.log("Result:");
    console.log(JSON.stringify(result, null, 2));

    if (result.content && result.content[0]) {
      const data = JSON.parse(result.content[0].text);
      console.log("\nParsed data:");
      if (data.tools) {
        console.log("Available MCP tools:");
        data.tools.forEach(tool => {
          console.log(`  - ${tool.name}: ${tool.description.trim()}`);
        });
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  } catch (err) {
    console.error("Error executing tool:", err);
    process.exit(1);
  }
}

test().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});