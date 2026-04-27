/**
 * Data Service Functions
 * Handles stock data retrieval and processing with pluggable providers
 */

/**
 * Fetch stock data by ticker using configured provider
 * Returns stock object with financial metrics
 * @param {string} ticker - Stock ticker symbol
 * @param {Object} provider - Data provider instance (from factory)
 */
export async function fetchStockData(ticker, provider) {
    try {
        return await provider.fetchStockData(ticker);
    } catch (error) {
        console.error(`Error fetching ${ticker}:`, error.message);
        return null;
    }
}

/**
 * Fetch multiple stocks with compliance data
 * @param {string[]} tickers - Array of ticker symbols
 * @param {Function} evaluateFn - Compliance evaluation function
 * @param {Object} provider - Data provider instance (from factory)
 * @returns {Promise<Array>} Array of stock data with compliance info
 */
export async function fetchMultipleStocks(tickers, evaluateFn, provider) {
    const results = [];

    for (const ticker of tickers) {
        try {
            const stockData = await fetchStockData(ticker, provider);
            if (stockData) {
                const compliance = evaluateFn(stockData);
                results.push({
                    ...stockData,
                    ...compliance,
                });
            }
            // Rate limiting delay (important for external APIs)
            await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
            console.error(`Error processing ${ticker}:`, error);
        }
    }

    return results;
}

/**
 * Apply filters and sorting to stock results
 */
export function filterAndSort(
    stocks,
    { searchTerm = "", filterType = "all", sortBy = "marketCap" },
) {
    let filtered = stocks.filter((stock) => {
        const matchesSearch =
            !searchTerm ||
            stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stock.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            filterType === "all" || stock.status === filterType;
        return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
        if (sortBy === "marketCap") return b.marketCap - a.marketCap;
        if (sortBy === "debtRatio")
            return parseFloat(a.debtRatio) - parseFloat(b.debtRatio);
        if (sortBy === "interestRatio")
            return parseFloat(a.interestRatio) - parseFloat(b.interestRatio);
        return 0;
    });

    return filtered;
}
