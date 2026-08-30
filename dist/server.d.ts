import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * Creates and configures a fresh McpServer instance with all Finnhub tools.
 * Called once on startup (stdio mode) or per-request (HTTP/Lambda stateless mode).
 */
export declare function createMcpServer(apiKey: string): McpServer;
/**
 * Validates and returns the FINNHUB_API_KEY env var.
 * Exits the process with a clear error if missing.
 */
export declare function requireApiKey(): string;
//# sourceMappingURL=server.d.ts.map