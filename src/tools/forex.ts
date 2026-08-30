import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FinnhubClient } from "../finnhub.js";

export function registerForexTools(
  server: McpServer,
  client: FinnhubClient
): void {
  // ── get_forex_rates ──────────────────────────────────────────────────────────
  server.registerTool(
    "get_forex_rates",
    {
      title: "Get Forex Rates",
      description:
        "Get current foreign exchange rates relative to a base currency (e.g. USD, EUR, GBP).",
      inputSchema: {
        base: z
          .string()
          .toUpperCase()
          .length(3)
          .default("USD")
          .describe("3-letter base currency code (e.g. USD, EUR, GBP)"),
      },
    },
    async ({ base }) => {
      try {
        const data = await client.getForexRates(base);
        if (!data?.quote || Object.keys(data.quote).length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No forex rates found for base currency "${base}".`,
              },
            ],
          };
        }

        // Show a curated list of major pairs + all others
        const major = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "CNY", "HKD", "SGD", "INR"];
        const quote = data.quote;

        const majorRows = major
          .filter((c) => c !== base && quote[c] != null)
          .map((c) => `  ${(base + "/" + c).padEnd(10)}: ${quote[c].toFixed(6)}`);

        const otherRows = Object.entries(quote)
          .filter(([c]) => !major.includes(c))
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([c, r]) => `  ${(base + "/" + c).padEnd(10)}: ${(r as number).toFixed(6)}`);

        const text = [
          `💱 Forex Rates — Base: ${base}`,
          `${"─".repeat(35)}`,
          "Major Pairs:",
          ...majorRows,
          "",
          "Other Pairs:",
          ...otherRows.slice(0, 20),
          otherRows.length > 20
            ? `  ... and ${otherRows.length - 20} more`
            : "",
        ]
          .filter((l) => l !== undefined)
          .join("\n");

        return { content: [{ type: "text", text }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            { type: "text", text: `Error fetching forex rates: ${msg}` },
          ],
        };
      }
    }
  );

  // ── get_forex_candles ────────────────────────────────────────────────────────
  server.registerTool(
    "get_forex_candles",
    {
      title: "Get Forex Candles",
      description:
        "Get historical OHLCV candlestick data for a forex pair (e.g. OANDA:EUR_USD).",
      inputSchema: {
        symbol: z
          .string()
          .describe(
            "Forex pair symbol in Finnhub format (e.g. OANDA:EUR_USD, OANDA:GBP_USD)"
          ),
        resolution: z
          .enum(["1", "5", "15", "30", "60", "D", "W", "M"])
          .describe(
            "Candle resolution: 1/5/15/30/60 (minutes), D (daily), W (weekly), M (monthly)"
          ),
        from: z
          .string()
          .describe("Start date in YYYY-MM-DD format"),
        to: z
          .string()
          .describe("End date in YYYY-MM-DD format"),
      },
    },
    async ({ symbol, resolution, from, to }) => {
      try {
        const fromTs = Math.floor(new Date(from).getTime() / 1000);
        const toTs = Math.floor(new Date(to).getTime() / 1000);
        const candles = await client.getForexCandles(
          symbol,
          resolution,
          fromTs,
          toTs
        );

        if (candles.s === "no_data" || !candles.c?.length) {
          return {
            content: [
              {
                type: "text",
                text: `No forex candle data available for ${symbol} in the specified range.`,
              },
            ],
          };
        }

        const rows = candles.t.map((ts, i) => {
          const date = new Date(ts * 1000).toISOString().split("T")[0];
          return `${date}  O:${candles.o[i].toFixed(5)}  H:${candles.h[i].toFixed(5)}  L:${candles.l[i].toFixed(5)}  C:${candles.c[i].toFixed(5)}  V:${candles.v[i].toLocaleString()}`;
        });

        const text = [
          `💱 Forex Candles: ${symbol} [${resolution}] from ${from} to ${to} (${rows.length} bars)`,
          `${"─".repeat(70)}`,
          ...rows.slice(-50),
        ].join("\n");

        return { content: [{ type: "text", text }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            { type: "text", text: `Error fetching forex candles: ${msg}` },
          ],
        };
      }
    }
  );
}
