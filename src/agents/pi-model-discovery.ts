/**
 * Wrapper exposing discoverAuthStorage / discoverModels for the rest of the
 * codebase.  In pi-coding-agent v0.54.0 these are no longer exported from the
 * package index, so we reconstruct them here using the public static factory.
 */
import path from "node:path";
import { AuthStorage, ModelRegistry } from "@mariozechner/pi-coding-agent";

export function discoverAuthStorage(agentDir?: string): AuthStorage {
  const authPath = agentDir ? path.join(agentDir, "auth.json") : undefined;
  return AuthStorage.create(authPath);
}

export function discoverModels(authStorage: AuthStorage, agentDir?: string): ModelRegistry {
  const modelsPath = agentDir ? path.join(agentDir, "models.json") : undefined;
  return new ModelRegistry(authStorage, modelsPath);
}
