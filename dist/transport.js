export class SingleShotTransport {
    onmessage;
    onerror;
    onclose;
    request;
    responseResolve;
    responseReject;
    responsePending;
    constructor(request) {
        this.request = request;
        this.responsePending = new Promise((resolve, reject) => {
            this.responseResolve = resolve;
            this.responseReject = reject;
        });
    }
    async start() {
        // Deliver the request to the server on the next tick
        setImmediate(() => this.onmessage?.(this.request));
    }
    async send(message) {
        this.responseResolve(message);
    }
    async close() {
        this.onclose?.();
    }
    /** Awaits the server's response to the request. */
    getResponse(timeoutMs = 25_000) {
        return Promise.race([
            this.responsePending,
            new Promise((_, reject) => setTimeout(() => reject(new Error("MCP request timed out")), timeoutMs)),
        ]);
    }
}
//# sourceMappingURL=transport.js.map