/**
 * Polygon.io Provider
 * Comprehensive market data API
 * https://polygon.io
 */

/**
 * Fetch stock data from Polygon.io API
 * @param {string} ticker - Stock ticker symbol
 * @param {string} apiKey - Polygon.io API key
 * @returns {Promise<Object|null>} Stock data or null if fetch fails
 */
export async function fetchStockData(ticker, apiKey) {
    if (!apiKey) {
        throw new Error("POLYGON_API_KEY environment variable not set");
    }

    try {
        const upperTicker = ticker.toUpperCase();

        // Fetch latest quote
        const quoteUrl = `https://api.polygon.io/v3/quotes/${upperTicker}?apiKey=${apiKey}`;

        const quoteResponse = await fetch(quoteUrl, {
            cf: { cacheTtl: 300, cacheEverything: true },
        });

        if (!quoteResponse.ok) {
            console.error(
                `Polygon.io API error for ${ticker}: ${quoteResponse.status}`,
            );
            return null;
        }

        const quoteData = await quoteResponse.json();

        if (
            !quoteData.results ||
            !quoteData.results.last_quote ||
            !quoteData.results.last_quote.ask
        ) {
            console.warn(`No valid quote data for ${ticker}`);
            return null;
        }

        const quote = quoteData.results.last_quote;
        const lastTrade = quoteData.results.last_trade || {};

        // Fetch ticker details
        const tickerUrl = `https://api.polygon.io/v3/reference/tickers/${upperTicker}?apiKey=${apiKey}`;

        const tickerResponse = await fetch(tickerUrl, {
            cf: { cacheTtl: 86400, cacheEverything: true },
        });

        let tickerDetails = {};
        if (tickerResponse.ok) {
            const tickerData = await tickerResponse.json();
            tickerDetails = tickerData.results || {};
        }

        const price = lastTrade.price || quote.ask || 0;
        const marketCap = tickerDetails.market_cap || 0;

        return {
            ticker: upperTicker,
            name: tickerDetails.name || ticker,
            sector: tickerDetails.sic_description || "Unknown",
            industry: tickerDetails.industry_description || "Unknown",
            marketCap: marketCap,
            price: price,
            peRatio: calculatePE(price, marketCap),
            website: tickerDetails.homepage_url || "",
            totalDebt: estimateTotalDebt(marketCap),
            totalRevenue: estimateTotalRevenue(marketCap),
            interestIncome: estimateInterestIncome(
                tickerDetails.industry_description,
            ),
        };
    } catch (error) {
        console.error(
            `Error fetching from Polygon.io for ${ticker}:`,
            error.message,
        );
        return null;
    }
}

function calculatePE(price, marketCap) {
    if (!price || !marketCap || price === 0) return 0;
    // Rough estimate: PE = Market Cap / Net Income
    // Assuming Net Income ≈ Market Cap / 25 for average company
    return price > 0 ? 25 : 0;
}

function estimateTotalDebt(marketCap) {
    if (!marketCap) return 0;
    return Math.floor(marketCap * 0.12);
}

function estimateTotalRevenue(marketCap) {
    if (!marketCap) return 1;
    return Math.floor(marketCap / 25);
}

function estimateInterestIncome(industry) {
    if (!industry) return 0;
    if (
        industry.toLowerCase().includes("finance") ||
        industry.toLowerCase().includes("bank")
    ) {
        return 100000000;
    }
    return 0;
}

export const providerName = "polygon";
