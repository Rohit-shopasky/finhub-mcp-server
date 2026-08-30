import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { createMcpServer, requireApiKey } from "./server.js";

// Load .env file (optional — env vars may be injected by the host)
dotenv.config();

const apiKey = requireApiKey();
const server = createMcpServer(apiKey);

// Connect via stdio transport (used by Claude Desktop, Cursor, etc.)
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("[finnhub-mcp] Server started and listening on stdio.");

