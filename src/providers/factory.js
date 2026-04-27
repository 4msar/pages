/**
 * Provider Factory
 * Selects and initializes the appropriate data provider based on environment
 */

import * as finnhub from "./finnhub.js";
import * as local from "./local.js";
import * as alphavantage from "./alphavantage.js";
import * as iexcloud from "./iexcloud.js";
import * as polygon from "./polygon.js";
import * as twelvedata from "./twelvedata.js";
import * as eoddata from "./eoddata.js";
import * as mock from "./mock.js";

const PROVIDERS = {
    finnhub,
    local,
    alphavantage,
    iexcloud,
    polygon,
    twelvedata,
    eoddata,
    mock,
};

/**
 * Get the appropriate provider based on configuration
 * @param {Object} env - Cloudflare Workers environment object
 * @returns {Object} Provider module with fetchStockData function
 */
export function getProvider(env) {
    const providerName = (env.DATA_PROVIDER || "local").toLowerCase();

    if (!PROVIDERS[providerName]) {
        console.warn(
            `Unknown provider: ${providerName}. Available providers: ${Object.keys(PROVIDERS).join(", ")}. Falling back to 'local'.`,
        );
        return local;
    }

    return PROVIDERS[providerName];
}

/**
 * Create a provider instance with environment variables
 * @param {Object} env - Cloudflare Workers environment object
 * @returns {Object} Provider instance with configuration
 */
export function initializeProvider(env) {
    const provider = getProvider(env);
    const providerName = (env.DATA_PROVIDER || "local").toLowerCase();

    // Map of providers that require API keys
    const apiKeyMap = {
        finnhub: env.FINNHUB_API_KEY,
        alphavantage: env.ALPHAVANTAGE_API_KEY,
        iexcloud: env.IEXCLOUD_API_KEY,
        polygon: env.POLYGON_API_KEY,
        twelvedata: env.TWELVEDATA_API_KEY,
        eoddata: env.EODDATA_API_KEY,
    };

    // Store env for use in provider functions
    return {
        name: providerName,
        fetchStockData: (ticker) => {
            const apiKey = apiKeyMap[providerName];
            if (apiKey) {
                return provider.fetchStockData(ticker, apiKey);
            }
            return provider.fetchStockData(ticker);
        },
        getAvailableTickers: () => {
            const apiKey = apiKeyMap[providerName];
            if (apiKey) {
                return provider.getAvailableTickers(apiKey);
            }
            return provider.getAvailableTickers();
        },
    };
}

/**
 * List all available providers
 */
export function listProviders() {
    return Object.keys(PROVIDERS);
}
