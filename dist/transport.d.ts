/**
 * A simple single-shot transport that:
 * 1. Delivers one JSON-RPC request to the McpServer
 * 2. Captures the single JSON-RPC response
 *
 * This avoids StreamableHTTPServerTransport entirely, which has complex
 * header requirements that conflict with API Gateway + serverless-http.
 */
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
export declare class SingleShotTransport implements Transport {
    onmessage?: (message: JSONRPCMessage) => void;
    onerror?: (error: Error) => void;
    onclose?: () => void;
    private readonly request;
    private responseResolve;
    private responseReject;
    private readonly responsePending;
    constructor(request: JSONRPCMessage);
    start(): Promise<void>;
    send(message: JSONRPCMessage): Promise<void>;
    close(): Promise<void>;
    /** Awaits the server's response to the request. */
    getResponse(timeoutMs?: number): Promise<JSONRPCMessage>;
}
//# sourceMappingURL=transport.d.ts.map