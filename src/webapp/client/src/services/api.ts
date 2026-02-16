import type { ChatRequest, ChatResponse, HealthResponse } from "../types.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

/**
 * Start a new chat session
 */
export async function startChat(request: ChatRequest): Promise<ChatResponse> {
  const url = `${API_BASE}/chat`;

  console.log("[API] ═══════════════════════════════════════");
  console.log("[API] 📤 POST /api/chat");
  console.log("[API]    URL:", url);
  console.log("[API]    Request body:", JSON.stringify(request, null, 2));
  console.log("[API] ═══════════════════════════════════════");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    console.log("[API] 📥 Response received");
    console.log("[API]    Status:", response.status, response.statusText);
    console.log("[API]    OK:", response.ok);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("[API] ❌ Request failed:", error);
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("[API] ✅ Success:", JSON.stringify(data, null, 2));

    return data;
  } catch (err) {
    console.error("[API] ❌❌❌ Exception in startChat:", err);
    throw err;
  }
}

/**
 * Cancel a running chat session
 */
export async function cancelChat(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/chat/${sessionId}/cancel`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
}

/**
 * Get stream URL for a session
 */
export function getStreamUrl(sessionId: string): string {
  return `${API_BASE}/chat/${sessionId}/stream`;
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
