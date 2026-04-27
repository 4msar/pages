/**
 * Mock Provider
 * Returns realistic test data for development and testing
 * Useful for local development without API keys
 */

const MOCK_STOCKS = {
    AAPL: {
        ticker: "AAPL",
        name: "Apple Inc.",
        sector: "Technology",
        industry: "Consumer Electronics",
        marketCap: 2800000000000,
        price: 175.5,
        peRatio: 28.5,
        website: "https://www.apple.com",
        totalDebt: 108000000000,
        totalRevenue: 98356000000,
        interestIncome: 0,
    },
    MSFT: {
        ticker: "MSFT",
        name: "Microsoft Corporation",
        sector: "Technology",
        industry: "Software",
        marketCap: 2700000000000,
        price: 380.2,
        peRatio: 32.1,
        website: "https://www.microsoft.com",
        totalDebt: 46200000000,
        totalRevenue: 198270000000,
        interestIncome: 0,
    },
    JPM: {
        ticker: "JPM",
        name: "JPMorgan Chase & Co.",
        sector: "Financials",
        industry: "Banking",
        marketCap: 450000000000,
        price: 195.75,
        peRatio: 10.5,
        website: "https://www.jpmorganchase.com",
        totalDebt: 2450000000000,
        totalRevenue: 150000000000,
        interestIncome: 85000000000,
    },
    PG: {
        ticker: "PG",
        name: "The Procter & Gamble Company",
        sector: "Consumer Staples",
        industry: "Household Products",
        marketCap: 420000000000,
        price: 165.3,
        peRatio: 26.2,
        website: "https://www.pg.com",
        totalDebt: 25600000000,
        totalRevenue: 81570000000,
        interestIncome: 0,
    },
    TSLA: {
        ticker: "TSLA",
        name: "Tesla, Inc.",
        sector: "Consumer Discretionary",
        industry: "Automotive",
        marketCap: 850000000000,
        price: 242.5,
        peRatio: 68.5,
        website: "https://www.tesla.com",
        totalDebt: 1800000000,
        totalRevenue: 81462000000,
        interestIncome: 0,
    },
    JNJ: {
        ticker: "JNJ",
        name: "Johnson & Johnson",
        sector: "Healthcare",
        industry: "Pharmaceuticals",
        marketCap: 380000000000,
        price: 159.8,
        peRatio: 15.8,
        website: "https://www.jnj.com",
        totalDebt: 32200000000,
        totalRevenue: 95564000000,
        interestIncome: 0,
    },
};

/**
 * Fetch mock stock data
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object|null>} Mock stock data or null if not found
 */
export async function fetchStockData(ticker) {
    try {
        const upperTicker = ticker.toUpperCase();
        const mockData = MOCK_STOCKS[upperTicker];

        if (!mockData) {
            console.warn(`No mock data for ticker: ${ticker}`);
            return null;
        }

        // Return a copy with randomized price variation for realism
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        return {
            ...mockData,
            price: mockData.price * (1 + variation),
            lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error(`Error fetching mock data for ${ticker}:`, error.message);
        return null;
    }
}

/**
 * Get all available tickers from mock data
 * @returns {Promise<string[]>} Array of available ticker symbols
 */
export async function getAvailableTickers() {
    try {
        return Object.keys(MOCK_STOCKS);
    } catch (error) {
        console.error(
            "Error getting available tickers from mock provider:",
            error.message,
        );
        return [];
    }
}

export const providerName = "mock";
