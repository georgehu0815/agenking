import type { DatabaseSync } from "node:sqlite";

export async function loadSqliteVecExtension(params: {
  db: DatabaseSync;
  extensionPath?: string;
}): Promise<{ ok: boolean; extensionPath?: string; error?: string }> {
  try {
    const sqliteVec = await import("sqlite-vec");
    const resolvedPath = params.extensionPath?.trim() ? params.extensionPath.trim() : undefined;
    const extensionPath = resolvedPath ?? sqliteVec.getLoadablePath();

    // Node.js built-in sqlite doesn't have enableLoadExtension (allowExtension is set in constructor)
    // better-sqlite3 does have it, so call it if available
    if (typeof (params.db as any).enableLoadExtension === "function") {
      (params.db as any).enableLoadExtension(true);
    }

    // Check if loadExtension method exists (Node.js with --experimental-sqlite has it)
    if (typeof (params.db as any).loadExtension !== "function") {
      return {
        ok: false,
        error:
          "loadExtension method not available. Ensure Node.js is running with --experimental-sqlite flag.",
      };
    }

    if (resolvedPath) {
      (params.db as any).loadExtension(extensionPath);
    } else {
      // sqliteVec.load() calls db.loadExtension internally
      sqliteVec.load(params.db as any);
    }

    return { ok: true, extensionPath };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
