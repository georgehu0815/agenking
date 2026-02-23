import type { GatewayRequestHandler } from "./types.js";

interface CustomStatusParams {
  includeDetails?: boolean;
}
interface CustomStatusResponse {
  status: "health" | "degraded" | "unhealthy";
  upTime: number; // in seconds
  details?: Record<string, any>;
}

export const handleCustomStatus: GatewayRequestHandler = async ({ params, context, respond }) => {
  // const {runtime}=context;
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  // console.log(`Runtime: ${runtime}, Uptime: ${uptime}s, Memory Usage: - custom-status.ts:19`, memoryUsage);

  let status: CustomStatusResponse["status"] = "health";

  if (memoryUsage.heapUsed > 200 * 1024 * 1024) {
    // 200MB threshold for example
    status = "degraded";
  }
  if (uptime > 3600) {
    // 1 hour uptime threshold for example
    status = "unhealthy";
  }

  const response: CustomStatusResponse = {
    status,
    upTime: uptime,
  };

  const { includeDetails = false } = params as CustomStatusParams;

  if (includeDetails) {
    response.details = {
      memoryUsage,
      pid: process.pid,
      // version: runtime.version,
      // channelCount: runtime.channelManager.getStatus(),
    };
  }

  respond(true, response);
};
