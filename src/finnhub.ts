import axios, { AxiosInstance } from "axios";

const BASE_URL = "https://finnhub.io/api/v1";

// ─── Response Types ────────────────────────────────────────────────────────────

export interface StockQuote {
  c: number;   // Current price
  d: number;   // Change
  dp: number;  // Percent change
  h: number;   // High price of the day
  l: number;   // Low price of the day
  o: number;   // Open price of the day
  pc: number;  // Previous close price
  t: number;   // Timestamp
}

export interface StockCandles {
  c: number[];   // Close prices
  h: number[];   // High prices
  l: number[];   // Low prices
  o: number[];   // Open prices
  s: string;     // Status ("ok" | "no_data")
  t: number[];   // Timestamps (Unix)
  v: number[];   // Volume
}

export interface CompanyProfile {
  country: string;
  currency: string;
  estimateCurrency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
}

export interface BasicFinancials {
  metric: Record<string, number | string | null>;
  metricType: string;
  symbol: string;
}

export interface EarningsItem {
  actual: number | null;
  estimate: number | null;
  period: string;
  quarter: number;
  surprise: number | null;
  surprisePercent: number | null;
  symbol: string;
  year: number;
}

export interface NewsArticle {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface SymbolSearchResult {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

export interface ForexRates {
  base: string;
  quote: Record<string, number>;
}

export interface CryptoCandles {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  s: string;
  t: number[];
  v: number[];
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class FinnhubClient {
  private http: AxiosInstance;

  constructor(apiKey: string) {
    this.http = axios.create({
      baseURL: BASE_URL,
      params: { token: apiKey },
      timeout: 10_000,
    });

    // Translate HTTP errors into readable messages
    this.http.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err?.response?.status;
        if (status === 403) {
          throw new Error(
            "Access denied (403): This symbol or endpoint requires a paid Finnhub plan. " +
            "Indian (NSE/BSE), European, and other non-US exchanges are not available on the free tier. " +
            "Try a US stock like AAPL, MSFT, or TSLA, or upgrade at https://finnhub.io/pricing"
          );
        }
        if (status === 401) {
          throw new Error(
            "Unauthorized (401): Your FINNHUB_API_KEY is invalid or missing. " +
            "Get a free key at https://finnhub.io/register"
          );
        }
        if (status === 429) {
          throw new Error(
            "Rate limit exceeded (429): Too many requests. " +
            "The free tier allows 30 API calls/second. Please wait a moment and try again."
          );
        }
        throw err;
      }
    );
  }

  // Stocks
  async getStockQuote(symbol: string): Promise<StockQuote> {
    const res = await this.http.get<StockQuote>("/quote", {
      params: { symbol },
    });
    return res.data;
  }

  async getStockCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<StockCandles> {
    const res = await this.http.get<StockCandles>("/stock/candle", {
      params: { symbol, resolution, from, to },
    });
    return res.data;
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    const res = await this.http.get<CompanyProfile>("/stock/profile2", {
      params: { symbol },
    });
    return res.data;
  }

  async getBasicFinancials(
    symbol: string,
    metric: string = "all"
  ): Promise<BasicFinancials> {
    const res = await this.http.get<BasicFinancials>("/stock/metric", {
      params: { symbol, metric },
    });
    return res.data;
  }

  async getEarnings(symbol: string): Promise<EarningsItem[]> {
    const res = await this.http.get<EarningsItem[]>("/stock/earnings", {
      params: { symbol },
    });
    return res.data;
  }

  // News
  async getCompanyNews(
    symbol: string,
    from: string,
    to: string
  ): Promise<NewsArticle[]> {
    const res = await this.http.get<NewsArticle[]>("/company-news", {
      params: { symbol, from, to },
    });
    return res.data;
  }

  async getMarketNews(category: string): Promise<NewsArticle[]> {
    const res = await this.http.get<NewsArticle[]>("/news", {
      params: { category },
    });
    return res.data;
  }

  // Search
  async searchSymbols(query: string): Promise<SymbolSearchResult> {
    const res = await this.http.get<SymbolSearchResult>("/search", {
      params: { q: query },
    });
    return res.data;
  }

  // Forex
  async getForexRates(base: string): Promise<ForexRates> {
    const res = await this.http.get<ForexRates>("/forex/rates", {
      params: { base },
    });
    return res.data;
  }

  async getForexCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<StockCandles> {
    const res = await this.http.get<StockCandles>("/forex/candle", {
      params: { symbol, resolution, from, to },
    });
    return res.data;
  }

  // Crypto
  async getCryptoCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<CryptoCandles> {
    const res = await this.http.get<CryptoCandles>("/crypto/candle", {
      params: { symbol, resolution, from, to },
    });
    return res.data;
  }
}
