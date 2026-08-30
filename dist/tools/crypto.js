import { z } from "zod";
export function registerCryptoTools(server, client) {
    // ── get_crypto_candles ───────────────────────────────────────────────────────
    server.registerTool("get_crypto_candles", {
        title: "Get Crypto Candles",
        description: "Get historical OHLCV candlestick data for a cryptocurrency pair (e.g. BINANCE:BTCUSDT).",
        inputSchema: {
            symbol: z
                .string()
                .describe("Crypto symbol in Finnhub format: EXCHANGE:PAIR (e.g. BINANCE:BTCUSDT, COINBASE:BTC-USD)"),
            resolution: z
                .enum(["1", "5", "15", "30", "60", "D", "W", "M"])
                .describe("Candle resolution: 1/5/15/30/60 (minutes), D (daily), W (weekly), M (monthly)"),
            from: z
                .string()
                .describe("Start date in YYYY-MM-DD format"),
            to: z
                .string()
                .describe("End date in YYYY-MM-DD format"),
        },
    }, async ({ symbol, resolution, from, to }) => {
        try {
            const fromTs = Math.floor(new Date(from).getTime() / 1000);
            const toTs = Math.floor(new Date(to).getTime() / 1000);
            const candles = await client.getCryptoCandles(symbol, resolution, fromTs, toTs);
            if (candles.s === "no_data" || !candles.c?.length) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `No crypto candle data for ${symbol} in the specified range. Try BINANCE:BTCUSDT or COINBASE:BTC-USD.`,
                        },
                    ],
                };
            }
            const rows = candles.t.map((ts, i) => {
                const date = new Date(ts * 1000).toISOString().split("T")[0];
                return `${date}  O:${candles.o[i].toFixed(2)}  H:${candles.h[i].toFixed(2)}  L:${candles.l[i].toFixed(2)}  C:${candles.c[i].toFixed(2)}  V:${candles.v[i].toLocaleString()}`;
            });
            const text = [
                `🪙 Crypto Candles: ${symbol} [${resolution}] from ${from} to ${to} (${rows.length} bars)`,
                `${"─".repeat(70)}`,
                ...rows.slice(-50),
            ].join("\n");
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return {
                isError: true,
                content: [
                    { type: "text", text: `Error fetching crypto candles: ${msg}` },
                ],
            };
        }
    });
}
//# sourceMappingURL=crypto.js.map