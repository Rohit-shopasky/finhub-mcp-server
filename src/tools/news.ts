import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FinnhubClient } from "../finnhub.js";

export function registerNewsTools(
  server: McpServer,
  client: FinnhubClient
): void {
  // ── get_company_news ─────────────────────────────────────────────────────────
  server.registerTool(
    "get_company_news",
    {
      title: "Get Company News",
      description:
        "Retrieve recent news articles related to a specific company within a given date range.",
      inputSchema: {
        symbol: z
          .string()
          .toUpperCase()
          .describe("Stock ticker symbol (e.g. AAPL)"),
        from: z
          .string()
          .describe("Start date in YYYY-MM-DD format (e.g. 2024-01-01)"),
        to: z
          .string()
          .describe("End date in YYYY-MM-DD format (e.g. 2024-01-31)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .default(5)
          .describe("Maximum number of articles to return (1-20, default 5)"),
      },
    },
    async ({ symbol, from, to, limit }) => {
      try {
        const articles = await client.getCompanyNews(symbol, from, to);
        if (!articles?.length) {
          return {
            content: [
              {
                type: "text",
                text: `No news found for "${symbol}" between ${from} and ${to}.`,
              },
            ],
          };
        }

        const items = articles.slice(0, limit).map((a, i) => {
          const date = new Date(a.datetime * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          return [
            `${i + 1}. [${date}] ${a.headline}`,
            `   Source  : ${a.source}`,
            `   Summary : ${a.summary?.slice(0, 200)}${(a.summary?.length ?? 0) > 200 ? "…" : ""}`,
            `   URL     : ${a.url}`,
          ].join("\n");
        });

        const text = [
          `📰 Company News: ${symbol} (${from} → ${to})`,
          `${"─".repeat(60)}`,
          ...items,
        ].join("\n\n");

        return { content: [{ type: "text", text }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            { type: "text", text: `Error fetching company news: ${msg}` },
          ],
        };
      }
    }
  );

  // ── get_market_news ──────────────────────────────────────────────────────────
  server.registerTool(
    "get_market_news",
    {
      title: "Get Market News",
      description:
        "Retrieve the latest general market news articles by category (general, forex, crypto, merger).",
      inputSchema: {
        category: z
          .enum(["general", "forex", "crypto", "merger"])
          .default("general")
          .describe(
            "News category: general, forex, crypto, or merger (default: general)"
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .default(5)
          .describe("Maximum number of articles to return (1-20, default 5)"),
      },
    },
    async ({ category, limit }) => {
      try {
        const articles = await client.getMarketNews(category);
        if (!articles?.length) {
          return {
            content: [
              {
                type: "text",
                text: `No market news found for category "${category}".`,
              },
            ],
          };
        }

        const items = articles.slice(0, limit).map((a, i) => {
          const date = new Date(a.datetime * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          return [
            `${i + 1}. [${date}] ${a.headline}`,
            `   Source  : ${a.source}`,
            `   Summary : ${a.summary?.slice(0, 200)}${(a.summary?.length ?? 0) > 200 ? "…" : ""}`,
            `   URL     : ${a.url}`,
          ].join("\n");
        });

        const text = [
          `🌍 Market News [${category.toUpperCase()}]`,
          `${"─".repeat(60)}`,
          ...items,
        ].join("\n\n");

        return { content: [{ type: "text", text }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            { type: "text", text: `Error fetching market news: ${msg}` },
          ],
        };
      }
    }
  );
}
