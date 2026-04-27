/**
 * Provider Factory
 * Selects and initializes the appropriate data provider based on environment
 */

import * as finnhub from "./finnhub.js";
import * as local from "./local.js";

const PROVIDERS = {
    finnhub,
    local,
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

    // Store env for use in provider functions
    return {
        name: providerName,
        fetchStockData: (ticker) => {
            if (providerName === "finnhub") {
                return provider.fetchStockData(ticker, env.FINNHUB_API_KEY);
            }
            return provider.fetchStockData(ticker);
        },
    };
}

/**
 * List all available providers
 */
export function listProviders() {
    return Object.keys(PROVIDERS);
}
