/**
 * Local Database Provider
 * Uses cached stock data (no external API calls)
 * Useful for testing, fallback, or offline mode
 */

import { STOCK_DATABASE } from "../functions/stockData.js";

/**
 * Fetch stock data from local database
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object|null>} Stock data or null if not found
 */
export async function fetchStockData(ticker) {
    try {
        const stockData = STOCK_DATABASE[ticker.toUpperCase()];

        if (!stockData) {
            console.warn(`No data for ticker: ${ticker}`);
            return null;
        }

        return {
            ticker: ticker.toUpperCase(),
            ...stockData,
        };
    } catch (error) {
        console.error(
            `Error fetching from local database for ${ticker}:`,
            error.message,
        );
        return null;
    }
}

export const providerName = "local";
