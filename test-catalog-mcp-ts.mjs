#!/usr/bin/env node
/**
 * Test script for catalog-mcp-direct (TypeScript-only) plugin
 */

import { createJiti } from "jiti";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function test() {
  console.log("Testing catalog_mcp tool (TypeScript direct)...\n");

  const jiti = createJiti(__dirname, {
    interopDefault: true,
    esmResolve: true,
  });

  // Load the TypeScript tool
  const toolModule = await jiti.import(
    "./extensions/catalog-mcp-direct/src/catalog-mcp-tool.ts"
  );
  const mockApi = { pluginConfig: {} };
  const tool = toolModule.createCatalogMcpTool(mockApi);

  console.log("Tool name:", tool.name);
  console.log("Tool description:", tool.description);

  // Test 1: List Tools
  console.log("\n=== Test 1: List Tools ===");
  try {
    const result = await tool.execute("test-1", {
      operation: "list_tools",
    });

    if (result.isError) {
      console.error("Error:", result.content[0].text);
      return;
    }

    const data = JSON.parse(result.content[0].text);
    console.log(`\n✓ Found ${data.count} tools:`);
    data.tools.forEach((t) => {
      console.log(`  - ${t.name}: ${t.description?.trim()}`);
    });
  } catch (err) {
    console.error("Test 1 failed:", err);
    process.exit(1);
  }

  // Test 2: Search Catalog
  console.log("\n=== Test 2: Search Catalog ===");
  try {
    const result = await tool.execute("test-2", {
      operation: "search_catalog",
      query: "premium",
    });

    if (result.isError) {
      console.error("Error:", result.content[0].text);
      return;
    }

    const data = JSON.parse(result.content[0].text);
    console.log(`\n✓ Found ${data.count} items matching "premium":`);
    data.results.forEach((item) => {
      console.log(`  - ${item.id}: ${item.name} ($${item.price})`);
    });
  } catch (err) {
    console.error("Test 2 failed:", err);
    process.exit(1);
  }

  // Test 3: Get Catalog Item
  console.log("\n=== Test 3: Get Catalog Item ===");
  try {
    const result = await tool.execute("test-3", {
      operation: "get_catalog_item",
      item_id: "PROD-001",
    });

    if (result.isError) {
      console.error("Error:", result.content[0].text);
      return;
    }

    const data = JSON.parse(result.content[0].text);
    console.log("\n✓ Item details:");
    console.log(`  ID: ${data.item.id}`);
    console.log(`  Name: ${data.item.name}`);
    console.log(`  Price: $${data.item.price} ${data.item.currency}`);
    console.log(`  Status: ${data.item.status}`);
  } catch (err) {
    console.error("Test 3 failed:", err);
    process.exit(1);
  }

  console.log("\n✅ All tests passed!");
}

test().catch((err) => {
  console.error("\n❌ Test suite failed:", err);
  process.exit(1);
});
