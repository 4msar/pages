/**
 * EOD Historical Data Provider
 * Historical and current market data
 * https://eodhistoricaldata.com
 */

/**
 * Fetch stock data from EOD Historical Data API
 * @param {string} ticker - Stock ticker symbol (e.g., "AAPL.US")
 * @param {string} apiKey - EOD Historical Data API key
 * @returns {Promise<Object|null>} Stock data or null if fetch fails
 */
export async function fetchStockData(ticker, apiKey) {
    if (!apiKey) {
        throw new Error("EODDATA_API_KEY environment variable not set");
    }

    try {
        // Format: TICKER.EXCHANGE (e.g., AAPL.US for US stocks)
        const formattedTicker = ticker.includes(".")
            ? ticker.toUpperCase()
            : `${ticker.toUpperCase()}.US`;

        // Fetch real-time data
        const dataUrl = `https://eodhistoricaldata.com/api/real-time/${formattedTicker}?api_token=${apiKey}&fmt=json`;

        const dataResponse = await fetch(dataUrl, {
            cf: { cacheTtl: 300, cacheEverything: true },
        });

        if (!dataResponse.ok) {
            console.error(
                `EOD Data API error for ${ticker}: ${dataResponse.status}`,
            );
            return null;
        }

        const data = await dataResponse.json();

        if (data.code === "404" || !data.close || data.close === 0) {
            console.warn(`No valid data for ${ticker}`);
            return null;
        }

        // Fetch fundamentals
        const fundamentalsUrl = `https://eodhistoricaldata.com/api/fundamentals/${formattedTicker}?api_token=${apiKey}`;

        let fundamentals = {};
        try {
            const fundamentalsResponse = await fetch(fundamentalsUrl, {
                cf: { cacheTtl: 86400, cacheEverything: true },
            });

            if (fundamentalsResponse.ok) {
                fundamentals = await fundamentalsResponse.json();
            }
        } catch (e) {
            // Fundamentals may not be available for all tickers
        }

        const general = fundamentals.General || {};
        const highlights = fundamentals.Highlights || {};

        return {
            ticker: formattedTicker.split(".")[0],
            name: general.Name || ticker,
            sector: general.Sector || "Unknown",
            industry: general.Industry || "Unknown",
            marketCap: parseInt(highlights.MarketCapitalization) || 0,
            price: data.close || 0,
            peRatio: parseFloat(highlights.PERatio) || 0,
            website: general.Website || "",
            totalDebt: estimateTotalDebt(
                parseInt(highlights.MarketCapitalization),
            ),
            totalRevenue: estimateTotalRevenue(
                parseInt(highlights.MarketCapitalization),
            ),
            interestIncome: estimateInterestIncome(general.Sector),
        };
    } catch (error) {
        console.error(
            `Error fetching from EOD Historical Data for ${ticker}:`,
            error.message,
        );
        return null;
    }
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

export const providerName = "eoddata";
