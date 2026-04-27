/**
 * Alpha Vantage API Provider
 * Free stock data with 5 calls per minute limit
 * https://www.alphavantage.co
 */

/**
 * Fetch stock data from Alpha Vantage API
 * @param {string} ticker - Stock ticker symbol
 * @param {string} apiKey - Alpha Vantage API key
 * @returns {Promise<Object|null>} Stock data or null if fetch fails
 */
export async function fetchStockData(ticker, apiKey) {
    if (!apiKey) {
        throw new Error("ALPHAVANTAGE_API_KEY environment variable not set");
    }

    try {
        // Get current quote
        const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker.toUpperCase()}&apikey=${apiKey}`;

        const quoteResponse = await fetch(quoteUrl, {
            cf: { cacheTtl: 300, cacheEverything: true }, // Cache for 5 minutes
        });

        if (!quoteResponse.ok) {
            console.error(
                `Alpha Vantage API error for ${ticker}: ${quoteResponse.status}`,
            );
            return null;
        }

        const quoteData = await quoteResponse.json();

        // Check for API errors or rate limiting
        if (
            quoteData["Note"] ||
            quoteData["Error Message"] ||
            !quoteData["Global Quote"]
        ) {
            console.warn(
                `Alpha Vantage API issue for ${ticker}:`,
                quoteData["Note"] || quoteData["Error Message"] || "No data",
            );
            return null;
        }

        const quote = quoteData["Global Quote"];

        if (!quote["05. price"] || parseFloat(quote["05. price"]) === 0) {
            console.warn(`No valid quote data for ${ticker}`);
            return null;
        }

        // Get company overview
        const companyUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker.toUpperCase()}&apikey=${apiKey}`;

        const companyResponse = await fetch(companyUrl, {
            cf: { cacheTtl: 86400, cacheEverything: true }, // Cache for 24 hours
        });

        let company = {};
        if (companyResponse.ok) {
            company = await companyResponse.json();
        }

        const price = parseFloat(quote["05. price"]) || 0;
        const pe = parseFloat(quote["10. PE Ratio"]) || 0;
        const marketCap = parseInt(company["MarketCapitalization"]) || 0;

        return {
            ticker: ticker.toUpperCase(),
            name: company["Name"] || ticker,
            sector: company["Sector"] || "Unknown",
            industry: company["Industry"] || "Unknown",
            marketCap: marketCap,
            price: price,
            peRatio: pe,
            website: company["Website"] || "",
            totalDebt: estimateTotalDebt(marketCap, pe),
            totalRevenue: estimateTotalRevenue(marketCap, pe),
            interestIncome: estimateInterestIncome(company["Sector"]),
        };
    } catch (error) {
        console.error(
            `Error fetching from Alpha Vantage for ${ticker}:`,
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

export const providerName = "alphavantage";
