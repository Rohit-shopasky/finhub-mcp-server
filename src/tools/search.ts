import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FinnhubClient } from "../finnhub.js";

export function registerSearchTools(
  server: McpServer,
  client: FinnhubClient
): void {
  // ── search_symbols ───────────────────────────────────────────────────────────
  server.registerTool(
    "search_symbols",
    {
      title: "Search Stock Symbols",
      description:
        "Search for stock ticker symbols by company name or keyword. Returns matching symbols with their exchange and type.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe(
            "Search query — company name or partial ticker (e.g. 'Apple', 'TSLA', 'Microsoft')"
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .default(10)
          .describe("Maximum number of results to return (1-20, default 10)"),
      },
    },
    async ({ query, limit }) => {
      try {
        const result = await client.searchSymbols(query);
        if (!result?.result?.length) {
          return {
            content: [
              {
                type: "text",
                text: `No symbols found matching "${query}".`,
              },
            ],
          };
        }

        const rows = result.result.slice(0, limit).map((r, i) => {
          return `${i + 1}. ${r.displaySymbol.padEnd(12)} ${r.description.padEnd(40)} [${r.type}]`;
        });

        const text = [
          `🔍 Symbol Search: "${query}" — ${result.count} total results`,
          `${"─".repeat(70)}`,
          `#   Symbol       Description                              Type`,
          `${"─".repeat(70)}`,
          ...rows,
        ].join("\n");

        return { content: [{ type: "text", text }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            { type: "text", text: `Error searching symbols: ${msg}` },
          ],
        };
      }
    }
  );
}
