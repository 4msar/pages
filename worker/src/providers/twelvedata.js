/**
 * Twelve Data Provider
 * Multi-asset data with free tier available
 * https://twelvedata.com
 */

/**
 * Fetch stock data from Twelve Data API
 * @param {string} ticker - Stock ticker symbol
 * @param {string} apiKey - Twelve Data API key
 * @returns {Promise<Object|null>} Stock data or null if fetch fails
 */
export async function fetchStockData(ticker, apiKey) {
    if (!apiKey) {
        throw new Error("TWELVEDATA_API_KEY environment variable not set");
    }

    try {
        const upperTicker = ticker.toUpperCase();

        // Fetch quote data
        const quoteUrl = `https://api.twelvedata.com/quote?symbol=${upperTicker}&apikey=${apiKey}`;

        const quoteResponse = await fetch(quoteUrl, {
            cf: { cacheTtl: 300, cacheEverything: true },
        });

        if (!quoteResponse.ok) {
            console.error(
                `Twelve Data API error for ${ticker}: ${quoteResponse.status}`,
            );
            return null;
        }

        const quoteData = await quoteResponse.json();

        if (quoteData.status === "error") {
            console.warn(`Twelve Data error for ${ticker}:`, quoteData.message);
            return null;
        }

        if (!quoteData.close || parseFloat(quoteData.close) === 0) {
            console.warn(`No valid quote data for ${ticker}`);
            return null;
        }

        // Fetch company profile
        const profileUrl = `https://api.twelvedata.com/stocks/profile?symbol=${upperTicker}&apikey=${apiKey}`;

        const profileResponse = await fetch(profileUrl, {
            cf: { cacheTtl: 86400, cacheEverything: true },
        });

        let profile = {};
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            profile = profileData.data || {};
        }

        const price = parseFloat(quoteData.close) || 0;
        const marketCap = parseInt(profile.market_cap) || 0;

        return {
            ticker: upperTicker,
            name: profile.name || ticker,
            sector: profile.sector || "Unknown",
            industry: profile.industry || "Unknown",
            marketCap: marketCap,
            price: price,
            peRatio: calculatePE(quoteData.pe),
            website: profile.website || "",
            totalDebt: estimateTotalDebt(marketCap),
            totalRevenue: estimateTotalRevenue(marketCap),
            interestIncome: estimateInterestIncome(profile.sector),
        };
    } catch (error) {
        console.error(
            `Error fetching from Twelve Data for ${ticker}:`,
            error.message,
        );
        return null;
    }
}

function calculatePE(pe) {
    return pe ? parseFloat(pe) : 0;
}

function estimateTotalDebt(marketCap) {
    if (!marketCap) return 0;
    return Math.floor(marketCap * 0.12);
}

function estimateTotalRevenue(marketCap) {
    if (!marketCap) return 1;
    return Math.floor(marketCap / 25);
}

function estimateInterestIncome(sector) {
    if (!sector) return 0;
    if (
        sector.toLowerCase().includes("financial") ||
        sector.toLowerCase().includes("bank")
    ) {
        return 100000000;
    }
    return 0;
}

export const providerName = "twelvedata";

/**
 * Get available tickers from Twelve Data
 * Uses a default list of popular stocks to avoid excessive API calls
 * @param {string} apiKey - Twelve Data API key (optional)
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
            "Error getting available tickers from Twelve Data:",
            error.message,
        );
        return [];
    }
}
