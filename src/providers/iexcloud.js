/**
 * IEX Cloud Provider
 * Premium market data with credit-based pricing
 * https://iexcloud.io
 */

/**
 * Fetch stock data from IEX Cloud API
 * @param {string} ticker - Stock ticker symbol
 * @param {string} apiKey - IEX Cloud API key
 * @returns {Promise<Object|null>} Stock data or null if fetch fails
 */
export async function fetchStockData(ticker, apiKey) {
    if (!apiKey) {
        throw new Error("IEXCLOUD_API_KEY environment variable not set");
    }

    try {
        const baseUrl = `https://cloud.iexapis.com/stable/stock/${ticker.toUpperCase()}`;

        // Fetch quote and company data in parallel
        const [quoteResponse, companyResponse] = await Promise.all([
            fetch(`${baseUrl}/quote?token=${apiKey}`, {
                cf: { cacheTtl: 300, cacheEverything: true },
            }),
            fetch(`${baseUrl}/company?token=${apiKey}`, {
                cf: { cacheTtl: 86400, cacheEverything: true },
            }),
        ]);

        if (!quoteResponse.ok || !companyResponse.ok) {
            console.error(
                `IEX Cloud API error for ${ticker}: ${quoteResponse.status}, ${companyResponse.status}`,
            );
            return null;
        }

        const quote = await quoteResponse.json();
        const company = await companyResponse.json();

        if (!quote.latestPrice || quote.latestPrice === 0) {
            console.warn(`No valid quote data for ${ticker}`);
            return null;
        }

        return {
            ticker: ticker.toUpperCase(),
            name: company.companyName || ticker,
            sector: company.sector || "Unknown",
            industry: company.industry || "Unknown",
            marketCap: quote.marketCap || 0,
            price: quote.latestPrice || 0,
            peRatio: quote.peRatio || 0,
            website: company.website || "",
            totalDebt: estimateTotalDebt(quote.marketCap, quote.peRatio),
            totalRevenue: estimateTotalRevenue(quote.marketCap, quote.peRatio),
            interestIncome: estimateInterestIncome(company.sector),
        };
    } catch (error) {
        console.error(
            `Error fetching from IEX Cloud for ${ticker}:`,
            error.message,
        );
        return null;
    }
}

function estimateTotalDebt(marketCap, pe) {
    if (!marketCap) return 0;
    return Math.floor(marketCap * 0.12);
}

function estimateTotalRevenue(marketCap, pe) {
    if (!marketCap || !pe || pe === 0) return 1;
    return Math.floor(marketCap / (pe || 25));
}

function estimateInterestIncome(sector) {
    if (!sector) return 0;
    if (
        sector.toLowerCase().includes("financials") ||
        sector.toLowerCase().includes("bank")
    ) {
        return 100000000;
    }
    return 0;
}

export const providerName = "iexcloud";

/**
 * Get available tickers from IEX Cloud
 * Uses a default list of popular stocks to avoid excessive API calls
 * @param {string} apiKey - IEX Cloud API key (optional)
 * @returns {Promise<string[]>} Array of available ticker symbols
 */
export async function getAvailableTickers(apiKey) {
    try {
        // Default list of popular US stocks
        const defaultTickers = [
            "AAPL",
            "MSFT",
            "GOOGL",
            "AMZN",
            "NVDA",
            "TSLA",
            "META",
            "V",
            "WMT",
            "JPM",
            "KO",
            "NKE",
            "COST",
            "DIS",
            "INTC",
            "AMD",
        ];

        return defaultTickers;
    } catch (error) {
        console.error(
            "Error getting available tickers from IEX Cloud:",
            error.message,
        );
        return [];
    }
}
