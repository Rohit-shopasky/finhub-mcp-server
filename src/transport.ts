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

export class SingleShotTransport implements Transport {
  onmessage?: (message: JSONRPCMessage) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;

  private readonly request: JSONRPCMessage;
  private responseResolve!: (msg: JSONRPCMessage) => void;
  private responseReject!: (err: Error) => void;
  private readonly responsePending: Promise<JSONRPCMessage>;

  constructor(request: JSONRPCMessage) {
    this.request = request;
    this.responsePending = new Promise<JSONRPCMessage>((resolve, reject) => {
      this.responseResolve = resolve;
      this.responseReject = reject;
    });
  }

  async start(): Promise<void> {
    // Deliver the request to the server on the next tick
    setImmediate(() => this.onmessage?.(this.request));
  }

  async send(message: JSONRPCMessage): Promise<void> {
    this.responseResolve(message);
  }

  async close(): Promise<void> {
    this.onclose?.();
  }

  /** Awaits the server's response to the request. */
  getResponse(timeoutMs = 25_000): Promise<JSONRPCMessage> {
    return Promise.race([
      this.responsePending,
      new Promise<JSONRPCMessage>((_, reject) =>
        setTimeout(() => reject(new Error("MCP request timed out")), timeoutMs)
      ),
    ]);
  }
}
