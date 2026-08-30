export interface StockQuote {
    c: number;
    d: number;
    dp: number;
    h: number;
    l: number;
    o: number;
    pc: number;
    t: number;
}
export interface StockCandles {
    c: number[];
    h: number[];
    l: number[];
    o: number[];
    s: string;
    t: number[];
    v: number[];
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
export declare class FinnhubClient {
    private http;
    constructor(apiKey: string);
    getStockQuote(symbol: string): Promise<StockQuote>;
    getStockCandles(symbol: string, resolution: string, from: number, to: number): Promise<StockCandles>;
    getCompanyProfile(symbol: string): Promise<CompanyProfile>;
    getBasicFinancials(symbol: string, metric?: string): Promise<BasicFinancials>;
    getEarnings(symbol: string): Promise<EarningsItem[]>;
    getCompanyNews(symbol: string, from: string, to: string): Promise<NewsArticle[]>;
    getMarketNews(category: string): Promise<NewsArticle[]>;
    searchSymbols(query: string): Promise<SymbolSearchResult>;
    getForexRates(base: string): Promise<ForexRates>;
    getForexCandles(symbol: string, resolution: string, from: number, to: number): Promise<StockCandles>;
    getCryptoCandles(symbol: string, resolution: string, from: number, to: number): Promise<CryptoCandles>;
}
//# sourceMappingURL=finnhub.d.ts.map