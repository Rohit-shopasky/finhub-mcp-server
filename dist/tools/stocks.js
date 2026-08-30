import { z } from "zod";
export function registerStockTools(server, client) {
    // ── get_stock_quote ──────────────────────────────────────────────────────────
    server.registerTool("get_stock_quote", {
        title: "Get Stock Quote",
        description: "Get a real-time stock quote including current price, daily high/low, open, previous close, and percent change.",
        inputSchema: {
            symbol: z
                .string()
                .toUpperCase()
                .describe("Stock ticker symbol (e.g. AAPL, TSLA, GOOGL)"),
        },
    }, async ({ symbol }) => {
        try {
            const q = await client.getStockQuote(symbol);
            if (!q || q.c === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `No quote data found for symbol "${symbol}". Please verify the ticker is correct.`,
                        },
                    ],
                };
            }
            const text = [
                `📈 Stock Quote: ${symbol}`,
                `─────────────────────────`,
                `Current Price : $${q.c.toFixed(2)}`,
                `Change        : ${q.d >= 0 ? "+" : ""}${q.d.toFixed(2)} (${q.dp >= 0 ? "+" : ""}${q.dp.toFixed(2)}%)`,
                `Open          : $${q.o.toFixed(2)}`,
                `High          : $${q.h.toFixed(2)}`,
                `Low           : $${q.l.toFixed(2)}`,
                `Prev Close    : $${q.pc.toFixed(2)}`,
                `Timestamp     : ${new Date(q.t * 1000).toUTCString()}`,
            ].join("\n");
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return {
                isError: true,
                content: [{ type: "text", text: `Error fetching quote: ${msg}` }],
            };
        }
    });
    // ── get_stock_candles ────────────────────────────────────────────────────────
    server.registerTool("get_stock_candles", {
        title: "Get Stock Candles",
        description: "Retrieve historical OHLCV (Open, High, Low, Close, Volume) candlestick data for a stock symbol.",
        inputSchema: {
            symbol: z
                .string()
                .toUpperCase()
                .describe("Stock ticker symbol (e.g. AAPL)"),
            resolution: z
                .enum(["1", "5", "15", "30", "60", "D", "W", "M"])
                .describe("Candle resolution: 1/5/15/30/60 (minutes), D (daily), W (weekly), M (monthly)"),
            from: z
                .string()
                .describe("Start date in YYYY-MM-DD format (will be converted to Unix timestamp)"),
            to: z
                .string()
                .describe("End date in YYYY-MM-DD format (will be converted to Unix timestamp)"),
        },
    }, async ({ symbol, resolution, from, to }) => {
        try {
            const fromTs = Math.floor(new Date(from).getTime() / 1000);
            const toTs = Math.floor(new Date(to).getTime() / 1000);
            const candles = await client.getStockCandles(symbol, resolution, fromTs, toTs);
            if (candles.s === "no_data" || !candles.c?.length) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `No candle data available for ${symbol} in the specified range.`,
                        },
                    ],
                };
            }
            const rows = candles.t.map((ts, i) => {
                const date = new Date(ts * 1000).toISOString().split("T")[0];
                return `${date}  O:${candles.o[i].toFixed(2)}  H:${candles.h[i].toFixed(2)}  L:${candles.l[i].toFixed(2)}  C:${candles.c[i].toFixed(2)}  V:${candles.v[i].toLocaleString()}`;
            });
            const header = `📊 ${symbol} Candles [${resolution}] from ${from} to ${to} (${rows.length} bars)\n${"─".repeat(70)}`;
            const text = [header, ...rows.slice(-50)].join("\n");
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return {
                isError: true,
                content: [{ type: "text", text: `Error fetching candles: ${msg}` }],
            };
        }
    });
    // ── get_company_profile ──────────────────────────────────────────────────────
    server.registerTool("get_company_profile", {
        title: "Get Company Profile",
        description: "Get detailed company information including name, exchange, industry, market cap, IPO date, and website.",
        inputSchema: {
            symbol: z
                .string()
                .toUpperCase()
                .describe("Stock ticker symbol (e.g. AAPL)"),
        },
    }, async ({ symbol }) => {
        try {
            const p = await client.getCompanyProfile(symbol);
            if (!p || !p.name) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `No company profile found for symbol "${symbol}".`,
                        },
                    ],
                };
            }
            const text = [
                `🏢 Company Profile: ${p.name} (${p.ticker})`,
                `─────────────────────────────────────────`,
                `Exchange          : ${p.exchange}`,
                `Industry          : ${p.finnhubIndustry}`,
                `Country           : ${p.country}`,
                `Currency          : ${p.currency}`,
                `Market Cap        : $${p.marketCapitalization?.toLocaleString()} M`,
                `Shares Outstanding: ${p.shareOutstanding?.toLocaleString()} M`,
                `IPO Date          : ${p.ipo}`,
                `Phone             : ${p.phone}`,
                `Website           : ${p.weburl}`,
            ].join("\n");
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return {
                isError: true,
                content: [
                    { type: "text", text: `Error fetching company profile: ${msg}` },
                ],
            };
        }
    });
    // ── get_basic_financials ─────────────────────────────────────────────────────
    server.registerTool("get_basic_financials", {
        title: "Get Basic Financials",
        description: "Retrieve key financial metrics for a stock: P/E ratio, EPS, 52-week high/low, beta, dividend yield, and more.",
        inputSchema: {
            symbol: z
                .string()
                .toUpperCase()
                .describe("Stock ticker symbol (e.g. AAPL)"),
        },
    }, async ({ symbol }) => {
        try {
            const fin = await client.getBasicFinancials(symbol);
            const m = fin.metric;
            if (!m || Object.keys(m).length === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `No financial data found for "${symbol}".`,
                        },
                    ],
                };
            }
            const fmt = (v) => v == null ? "N/A" : typeof v === "number" ? v.toLocaleString() : String(v);
            const text = [
                `💰 Basic Financials: ${symbol}`,
                `─────────────────────────────`,
                `52-Week High     : ${fmt(m["52WeekHigh"])}`,
                `52-Week Low      : ${fmt(m["52WeekLow"])}`,
                `Beta             : ${fmt(m["beta"])}`,
                `P/E (TTM)        : ${fmt(m["peBasicExclExtraTTM"])}`,
                `EPS (TTM)        : ${fmt(m["epsBasicExclExtraItemsTTM"])}`,
                `Revenue (TTM)    : ${fmt(m["revenuePerShareTTM"])}`,
                `ROE (TTM)        : ${fmt(m["roeTTM"])}`,
                `ROA (TTM)        : ${fmt(m["roaTTM"])}`,
                `Dividend Yield   : ${fmt(m["dividendYieldIndicatedAnnual"])}`,
                `Current Ratio    : ${fmt(m["currentRatioQuarterly"])}`,
                `Debt/Equity      : ${fmt(m["totalDebt/totalEquityQuarterly"])}`,
            ].join("\n");
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return {
                isError: true,
                content: [
                    { type: "text", text: `Error fetching financials: ${msg}` },
                ],
            };
        }
    });
    // ── get_earnings ─────────────────────────────────────────────────────────────
    server.registerTool("get_earnings", {
        title: "Get Earnings",
        description: "Get historical EPS earnings data including actual vs estimate and surprise percentage for a stock.",
        inputSchema: {
            symbol: z
                .string()
                .toUpperCase()
                .describe("Stock ticker symbol (e.g. AAPL)"),
        },
    }, async ({ symbol }) => {
        try {
            const earnings = await client.getEarnings(symbol);
            if (!earnings?.length) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `No earnings data found for "${symbol}".`,
                        },
                    ],
                };
            }
            const rows = earnings.slice(0, 8).map((e) => {
                const surprise = e.surprisePercent != null
                    ? `${e.surprisePercent >= 0 ? "+" : ""}${e.surprisePercent.toFixed(2)}%`
                    : "N/A";
                return `${e.period}  Q${e.quarter}  Actual: ${e.actual ?? "N/A"}  Est: ${e.estimate ?? "N/A"}  Surprise: ${surprise}`;
            });
            const text = [
                `📅 Earnings History: ${symbol}`,
                `─────────────────────────────────────────────────────`,
                ...rows,
            ].join("\n");
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return {
                isError: true,
                content: [
                    { type: "text", text: `Error fetching earnings: ${msg}` },
                ],
            };
        }
    });
}
//# sourceMappingURL=stocks.js.map