import axios from "axios";
const BASE_URL = "https://finnhub.io/api/v1";
// ─── Client ───────────────────────────────────────────────────────────────────
export class FinnhubClient {
    http;
    constructor(apiKey) {
        this.http = axios.create({
            baseURL: BASE_URL,
            params: { token: apiKey },
            timeout: 10_000,
        });
        // Translate HTTP errors into readable messages
        this.http.interceptors.response.use((res) => res, (err) => {
            const status = err?.response?.status;
            if (status === 403) {
                throw new Error("Access denied (403): This symbol or endpoint requires a paid Finnhub plan. " +
                    "Indian (NSE/BSE), European, and other non-US exchanges are not available on the free tier. " +
                    "Try a US stock like AAPL, MSFT, or TSLA, or upgrade at https://finnhub.io/pricing");
            }
            if (status === 401) {
                throw new Error("Unauthorized (401): Your FINNHUB_API_KEY is invalid or missing. " +
                    "Get a free key at https://finnhub.io/register");
            }
            if (status === 429) {
                throw new Error("Rate limit exceeded (429): Too many requests. " +
                    "The free tier allows 30 API calls/second. Please wait a moment and try again.");
            }
            throw err;
        });
    }
    // Stocks
    async getStockQuote(symbol) {
        const res = await this.http.get("/quote", {
            params: { symbol },
        });
        return res.data;
    }
    async getStockCandles(symbol, resolution, from, to) {
        const res = await this.http.get("/stock/candle", {
            params: { symbol, resolution, from, to },
        });
        return res.data;
    }
    async getCompanyProfile(symbol) {
        const res = await this.http.get("/stock/profile2", {
            params: { symbol },
        });
        return res.data;
    }
    async getBasicFinancials(symbol, metric = "all") {
        const res = await this.http.get("/stock/metric", {
            params: { symbol, metric },
        });
        return res.data;
    }
    async getEarnings(symbol) {
        const res = await this.http.get("/stock/earnings", {
            params: { symbol },
        });
        return res.data;
    }
    // News
    async getCompanyNews(symbol, from, to) {
        const res = await this.http.get("/company-news", {
            params: { symbol, from, to },
        });
        return res.data;
    }
    async getMarketNews(category) {
        const res = await this.http.get("/news", {
            params: { category },
        });
        return res.data;
    }
    // Search
    async searchSymbols(query) {
        const res = await this.http.get("/search", {
            params: { q: query },
        });
        return res.data;
    }
    // Forex
    async getForexRates(base) {
        const res = await this.http.get("/forex/rates", {
            params: { base },
        });
        return res.data;
    }
    async getForexCandles(symbol, resolution, from, to) {
        const res = await this.http.get("/forex/candle", {
            params: { symbol, resolution, from, to },
        });
        return res.data;
    }
    // Crypto
    async getCryptoCandles(symbol, resolution, from, to) {
        const res = await this.http.get("/crypto/candle", {
            params: { symbol, resolution, from, to },
        });
        return res.data;
    }
}
//# sourceMappingURL=finnhub.js.map