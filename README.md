# 📈 Finnhub MCP Server

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.30%2B-purple)](https://github.com/modelcontextprotocol/sdk)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A **Model Context Protocol (MCP) server** that gives AI assistants (Claude, Cursor, etc.) real-time access to financial market data via the [Finnhub API](https://finnhub.io).

Ask Claude things like:
- *"What is Apple's current stock price?"*
- *"Show me Tesla's earnings history"*
- *"Get the latest crypto news"*
- *"What are EUR/USD rates right now?"*

---

## 🛠 Available Tools (11 total)

| Category | Tool | What it does |
|---|---|---|
| 📈 **Stocks** | `get_stock_quote` | Real-time price, change %, high/low |
| | `get_stock_candles` | Historical OHLCV candles (1min → monthly) |
| | `get_company_profile` | Name, exchange, industry, market cap |
| | `get_basic_financials` | P/E, EPS, beta, ROE, dividend yield |
| | `get_earnings` | Historical EPS vs estimate + surprise % |
| 📰 **News** | `get_company_news` | Recent articles for a stock in a date range |
| | `get_market_news` | Market news by category (general/forex/crypto/merger) |
| 🔍 **Search** | `search_symbols` | Look up ticker symbols by name or keyword |
| 💱 **Forex** | `get_forex_rates` | Live exchange rates from a base currency |
| | `get_forex_candles` | Historical OHLCV for forex pairs |
| 🪙 **Crypto** | `get_crypto_candles` | Historical OHLCV for crypto pairs |

> **Free Tier Note**: The Finnhub free plan supports US stocks (NYSE/NASDAQ), forex, and crypto. Indian (NSE/BSE) and other international exchanges require a paid plan at [finnhub.io/pricing](https://finnhub.io/pricing).

---

## ⚡ Prerequisites

- **Node.js 20+** → [Download](https://nodejs.org)
- **Finnhub API key** → [Get free key](https://finnhub.io/register) (takes 30 seconds)
- **AWS CLI** (only for Lambda deployment) → [Install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

---

## 🚀 Option 1 — Local (Claude Desktop / Cursor)

### Step 1: Clone & install

```bash
git clone <your-repo-url> finnhub-mcp
cd finnhub-mcp
npm install
```

### Step 2: Add your API key

```bash
cp .env.example .env
# Open .env and set:
# FINNHUB_API_KEY=your_key_here
```

### Step 3: Build

```bash
npm run build
```

### Step 4: Connect to Claude Desktop

Open (or create) the Claude Desktop config file:

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

Add the `mcpServers` block (merge with existing content if the file already exists):

```json
{
  "mcpServers": {
    "finnhub": {
      "command": "node",
      "args": ["/absolute/path/to/finnhub-mcp/dist/index.js"],
      "env": {
        "FINNHUB_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

> **Important**: Replace `/absolute/path/to/finnhub-mcp` with the actual path where you cloned the repo.

### Step 5: Restart Claude Desktop

Fully quit Claude (don't just close the window) and relaunch it.

**Verify**: Open a new chat and look for the 🔨 hammer icon at the bottom of the input box. Click it to see all 11 Finnhub tools listed.

---

### Connect to Cursor (Local)

Go to **Cursor Settings → MCP → Add Server** and add:

```json
{
  "finnhub": {
    "command": "node",
    "args": ["/absolute/path/to/finnhub-mcp/dist/index.js"],
    "env": {
      "FINNHUB_API_KEY": "your_api_key_here"
    }
  }
}
```

---

### Test with MCP Inspector (optional)

```bash
npm run inspector
# Opens http://localhost:5173 — interactive tool tester
```

---

## ☁️ Option 2 — AWS Lambda (Remote / Shared)

Deploy the server as a public HTTPS endpoint that any MCP client can connect to.

### Architecture

```
AI Agent (Claude / Cursor)
        │  HTTPS POST /mcp
        ▼
AWS Lambda Function URL
  (Response Streaming)
        │
        ▼
Express + StreamableHTTP (stateless)
        │
        ▼
Finnhub REST API → finnhub.io
```

### Step 1: Configure AWS CLI

```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Region (e.g. us-east-1), Output: json
```

Verify it works:
```bash
aws sts get-caller-identity
```

### Step 2: One-time Lambda setup

```bash
bash deploy/lambda-setup.sh
```

This will:
1. ✅ Create an IAM execution role
2. ✅ Build & package the server into a zip
3. ✅ Create the Lambda function (`finnhub-mcp-server`)
4. ✅ Create a **public Function URL** with response streaming

At the end you'll see:
```
════════════════════════════════════════════════
  ✅ Setup complete!

  MCP Endpoint : https://xxxx.lambda-url.us-east-1.on.aws/mcp
  Health Check : https://xxxx.lambda-url.us-east-1.on.aws/health
════════════════════════════════════════════════
```

### Step 3: Test your Lambda

```bash
# Health check
curl https://xxxx.lambda-url.us-east-1.on.aws/health

# Call a tool
curl -X POST https://xxxx.lambda-url.us-east-1.on.aws/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_stock_quote",
      "arguments": { "symbol": "AAPL" }
    }
  }'
```

### Step 4: Connect Claude Desktop to Lambda

Claude Desktop uses `mcp-remote` as a local bridge to reach the remote Lambda server. No code runs on your machine — `mcp-remote` just proxies requests over HTTPS.

Open your Claude Desktop config file:

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

Add the following (replace the URL with the one printed by `lambda-setup.sh`):

```json
{
  "mcpServers": {
    "finnhub": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://xxxx.execute-api.us-east-1.amazonaws.com/mcp"
      ]
    }
  }
}
```

> **Note**: `npx` will download `mcp-remote` automatically on first launch — no manual install needed.

**Fully quit Claude Desktop and relaunch it.** On first connection, `mcp-remote` will perform the MCP handshake with your Lambda and load all 11 tools.

**Verify**: Click the 🔨 hammer icon in the chat input — you should see all Finnhub tools listed.

### Step 5: Connect Cursor to Lambda

Go to **Cursor Settings → MCP → Add Server**:

```json
{
  "finnhub": {
    "url": "https://xxxx.execute-api.us-east-1.amazonaws.com/mcp"
  }
}
```

> Cursor supports remote HTTP MCP URLs natively — no `mcp-remote` bridge needed.

### Redeploy after code changes

```bash
npm run deploy
# or: bash deploy/deploy.sh
```

---

## 📁 Project Structure

```
finnhub-mcp/
├── src/
│   ├── index.ts          ← Stdio entry point (Claude Desktop / local)
│   ├── http.ts           ← HTTP entry point (Lambda / remote)
│   ├── server.ts         ← Shared MCP server factory
│   ├── finnhub.ts        ← Typed Finnhub HTTP client
│   └── tools/
│       ├── stocks.ts     ← 5 stock tools
│       ├── news.ts       ← 2 news tools
│       ├── search.ts     ← 1 search tool
│       ├── forex.ts      ← 2 forex tools
│       └── crypto.ts     ← 1 crypto tool
├── deploy/
│   ├── lambda-setup.sh   ← One-time AWS setup
│   └── deploy.sh         ← Redeploy script
├── dist/                 ← Compiled output (after npm run build)
├── .env                  ← Your API key (never commit this!)
├── .env.example          ← Template
├── package.json
└── tsconfig.json
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `FINNHUB_API_KEY` | ✅ Yes | Your Finnhub API key from [finnhub.io/register](https://finnhub.io/register) |
| `PORT` | No | HTTP server port (default: `8080`) |
| `AWS_REGION` | No | AWS region for deployment (default: `us-east-1`) |

---

## 💬 Example Prompts

Once connected, try these in Claude:

```
What is Apple's current stock price and how has it changed today?
```
```
Show me Microsoft's company profile and key financial metrics
```
```
Get me 5 recent news articles about Tesla
```
```
Search for symbols related to "artificial intelligence"
```
```
What are the current EUR/USD, GBP/USD, and JPY/USD exchange rates?
```
```
Show Bitcoin's daily candles on Binance for the past 30 days
```

---

## ❓ Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `FINNHUB_API_KEY is not set` | Missing env var | Add key to `.env` or Claude config's `env` block |
| `Error fetching quote: 403` | Symbol not on free plan | Use US stocks (AAPL, TSLA) or upgrade at finnhub.io/pricing |
| `Error fetching quote: 401` | Invalid API key | Verify key at [finnhub.io/dashboard](https://finnhub.io/dashboard) |
| `Error fetching quote: 429` | Rate limit hit | Free tier = 30 req/sec. Wait and retry |
| Hammer icon missing in Claude | Server not connecting | Fully quit Claude (not just close) and relaunch |
| Lambda returns timeout | Cold start too slow | Increase Lambda timeout in AWS console (currently 30s) |

---

## 📝 License

MIT — free to use, modify, and deploy.
