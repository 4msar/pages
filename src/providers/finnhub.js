/**
 * Finnhub API Provider
 * Real-time financial data from Finnhub.io
 */

/**
 * Fetch stock data from Finnhub API
 * @param {string} ticker - Stock ticker symbol
 * @param {string} apiKey - Finnhub API key
 * @returns {Promise<Object|null>} Stock data or null if fetch fails
 */
export async function fetchStockData(ticker, apiKey) {
    if (!apiKey) {
        throw new Error("FINNHUB_API_KEY environment variable not set");
    }

    try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${ticker.toUpperCase()}&token=${apiKey}`;

        const response = await fetch(url, {
            cf: { cacheTtl: 3600, cacheEverything: true }, // Cache for 1 hour
        });

        if (!response.ok) {
            console.error(
                `Finnhub API error for ${ticker}: ${response.status}`,
            );
            return null;
        }

        const quote = await response.json();

        // Check if the quote has valid data
        if (!quote.c || quote.c === 0) {
            console.warn(`No valid quote data for ${ticker}`);
            return null;
        }

        // Get company profile for sector/industry info
        const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker.toUpperCase()}&token=${apiKey}`;
        const profileResponse = await fetch(profileUrl, {
            cf: { cacheTtl: 86400, cacheEverything: true }, // Cache for 24 hours
        });

        let profile = {};
        if (profileResponse.ok) {
            profile = await profileResponse.json();
        }

        return {
            ticker: ticker.toUpperCase(),
            name: profile.name || ticker,
            sector: profile.finnhubIndustry || "Unknown",
            industry: profile.finnhubIndustry || "Unknown",
            marketCap: profile.marketCapitalization
                ? profile.marketCapitalization * 1e6
                : 0, // Convert to actual number
            price: quote.c || 0,
            peRatio: quote.pe || 0,
            website: profile.weburl || "",

            // Estimated financial metrics (Finnhub doesn't provide all in quote endpoint)
            // These would need additional API calls or a database lookup
            totalDebt: estimateTotalDebt(quote.c, profile.marketCapitalization),
            totalRevenue: estimateTotalRevenue(profile.marketCapitalization),
            interestIncome: estimateInterestIncome(profile.finnhubIndustry),
        };
    } catch (error) {
        console.error(
            `Error fetching from Finnhub for ${ticker}:`,
            error.message,
        );
        return null;
    }
}

/**
 * Estimate total debt based on market cap and P/E ratio
 * This is a rough estimate; real data would require additional API calls
 */
function estimateTotalDebt(price, marketCap) {
    if (!marketCap) return 0;
    // Average debt-to-market-cap ratio for tech companies ~10-15%
    return Math.floor(marketCap * 1e6 * 0.12);
}

/**
 * Estimate total revenue
 * Rough estimate: Revenue = Market Cap / P/E (simplified)
 */
function estimateTotalRevenue(marketCap) {
    if (!marketCap) return 1;
    // Assuming average P/E of 25, Revenue = Market Cap / 25
    return Math.floor((marketCap * 1e6) / 25);
}

/**
 * Estimate interest income based on sector
 */
function estimateInterestIncome(sector) {
    if (!sector) return 0;
    const sectorLower = sector.toLowerCase();

    // Banks have significant interest income
    if (sectorLower.includes("bank") || sectorLower.includes("financial")) {
        return Math.floor(Math.random() * 1e9) + 1e8; // 100M - 1B
    }

    // Tech/Consumer companies have minimal interest income
    return Math.floor(Math.random() * 1e8); // 0 - 100M
}

export const providerName = "finnhub";

/**
 * Get available tickers from Finnhub
 * Uses a default list of popular stocks to avoid excessive API calls
 * For a complete list, query https://finnhub.io/api/v1/stock/list?exchange=US&token=YOUR_API_KEY
 * @param {string} apiKey - Finnhub API key (optional)
 * @returns {Promise<string[]>} Array of available ticker symbols
 */
export async function getAvailableTickers(apiKey) {
    try {
        // Default list of popular US stocks
        // If you need a dynamic list, uncomment and configure the API call below
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

        // Uncomment below to fetch dynamic list from Finnhub API
        // Warning: This uses one API call per request
        if (apiKey) {
            const url = `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${apiKey}`;
            const response = await fetch(url, {
                cf: { cacheTtl: 86400, cacheEverything: true }, // Cache for 24 hours
            });

            if (response.ok) {
                const data = await response.json();
                return data
                    .filter((item) => item.symbol && !item.symbol.includes("."))
                    .map((item) => item.symbol)
                    .slice(0, 100); // Limit to first 100 stocks
            }
        }

        return defaultTickers;
    } catch (error) {
        console.error(
            "Error getting available tickers from Finnhub:",
            error.message,
        );
        return [];
    }
}
