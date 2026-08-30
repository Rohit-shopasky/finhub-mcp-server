import express from "express";
import dotenv from "dotenv";
import { createMcpServer, requireApiKey } from "./server.js";
import { SingleShotTransport } from "./transport.js";
dotenv.config();
const apiKey = requireApiKey();
// ── Build Express app ─────────────────────────────────────────────────────────
export const app = express();
app.use(express.json());
// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        server: "finnhub-mcp",
        version: "1.0.0",
        tools: 11,
        transport: "single-shot-http",
    });
});
// ── MCP endpoint ──────────────────────────────────────────────────────────────
app.post("/mcp", async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== "object") {
        res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32700, message: "Parse error: body must be a JSON object" },
            id: null,
        });
        return;
    }
    // JSON-RPC notifications have NO "id" field — they must get 202, no body.
    // e.g. the "initialized" notification mcp-remote sends after the handshake.
    const isNotification = !("id" in body);
    if (isNotification) {
        res.status(202).end();
        return;
    }
    // Regular request — process and return the JSON-RPC response.
    const server = createMcpServer(apiKey);
    const transport = new SingleShotTransport(body);
    try {
        await server.connect(transport);
        const response = await transport.getResponse();
        res.json(response);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : "Internal error";
        console.error("[finnhub-mcp] MCP error:", err);
        res.status(500).json({
            jsonrpc: "2.0",
            error: { code: -32603, message: msg },
            id: null,
        });
    }
    finally {
        await transport.close();
        await server.close();
    }
});
// ── Start local Express server (not used by Lambda — lambda.ts wraps the app) ─
const PORT = process.env.PORT ?? 8080;
app.listen(PORT, () => {
    console.log(`[finnhub-mcp] HTTP server listening on port ${PORT}`);
    console.log(`[finnhub-mcp] MCP endpoint : http://localhost:${PORT}/mcp`);
    console.log(`[finnhub-mcp] Health check : http://localhost:${PORT}/health`);
});
//# sourceMappingURL=http.js.map