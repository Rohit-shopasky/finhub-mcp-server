import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FinnhubClient } from "./finnhub.js";
import { registerStockTools } from "./tools/stocks.js";
import { registerNewsTools } from "./tools/news.js";
import { registerSearchTools } from "./tools/search.js";
import { registerForexTools } from "./tools/forex.js";
import { registerCryptoTools } from "./tools/crypto.js";
/**
 * Creates and configures a fresh McpServer instance with all Finnhub tools.
 * Called once on startup (stdio mode) or per-request (HTTP/Lambda stateless mode).
 */
export function createMcpServer(apiKey) {
    const finnhub = new FinnhubClient(apiKey);
    const server = new McpServer({
        name: "finnhub-mcp",
        version: "1.0.0",
    });
    registerStockTools(server, finnhub);
    registerNewsTools(server, finnhub);
    registerSearchTools(server, finnhub);
    registerForexTools(server, finnhub);
    registerCryptoTools(server, finnhub);
    return server;
}
/**
 * Validates and returns the FINNHUB_API_KEY env var.
 * Exits the process with a clear error if missing.
 */
export function requireApiKey() {
    const key = process.env.FINNHUB_API_KEY;
    if (!key) {
        console.error("[finnhub-mcp] ERROR: FINNHUB_API_KEY environment variable is not set.\n" +
            "Get a free key at https://finnhub.io/register");
        process.exit(1);
    }
    return key;
}
//# sourceMappingURL=server.js.map