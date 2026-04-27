# Halal Stock Screener - Plug & Play Provider System

## Overview

The application now uses a **plug-and-play provider system** for data sources. You can easily switch between different data providers or add new ones without modifying core logic.

## Current Providers

### 1. **Local Provider** (Default)

- Uses cached stock data from `src/functions/stockData.js`
- No external API calls
- Perfect for testing and development
- **Configuration**: `DATA_PROVIDER = "local"`

### 2. **Finnhub Provider** (Real-time)

- Real financial data from Finnhub.io API
- Requires API key: `FINNHUB_API_KEY`
- Recommended for production
- **Configuration**: `DATA_PROVIDER = "finnhub"`

## Project Structure

```
worker/
├── src/
│   ├── index.js                      # Main entry point
│   ├── functions/
│   │   ├── compliance.js             # Shariah rules
│   │   ├── dataService.js            # Data operations (provider-agnostic)
│   │   └── stockData.js              # Local database
│   └── providers/                    # Data source adapters
│       ├── factory.js                # Provider selector & initializer
│       ├── finnhub.js                # Finnhub API adapter
│       └── local.js                  # Local database adapter
├── wrangler.toml                     # Configuration with env vars
└── package.json
```

## Configuration

### Environment Variables

Set these in `wrangler.toml`:

```toml
[env.development]
vars = { DATA_PROVIDER = "local" }

[env.production]
vars = { DATA_PROVIDER = "finnhub" }
```

### API Keys

Store sensitive API keys as Cloudflare Worker secrets:

```bash
# For production environment
wrangler secret put FINNHUB_API_KEY --env production

# For development (optional)
wrangler secret put FINNHUB_API_KEY --env development
```

### Or set directly in wrangler.toml (not recommended for secrets):

```toml
[env.production]
vars = {
  DATA_PROVIDER = "finnhub",
  FINNHUB_API_KEY = "your-key-here"
}
```

## How It Works

### 1. Provider Factory (`src/providers/factory.js`)

The factory pattern selects the right provider based on environment:

```javascript
import { initializeProvider } from "./providers/factory.js";

// In your handler
const provider = initializeProvider(env);
// provider.name = "finnhub" or "local"
// provider.fetchStockData(ticker) = function
```

### 2. Data Service (`src/functions/dataService.js`)

The data service is provider-agnostic:

```javascript
import { fetchMultipleStocks } from "./functions/dataService.js";

// Works with any provider
const results = await fetchMultipleStocks(
    ["AAPL", "MSFT"],
    evaluateCompliance,
    provider, // Pass the provider
);
```

### 3. Provider Implementations

Each provider implements a standard interface:

```javascript
// src/providers/finnhub.js
export async function fetchStockData(ticker, apiKey) {
    // Return standardized data format
    return {
        ticker,
        name,
        sector,
        marketCap,
        totalDebt,
        totalRevenue,
        interestIncome,
        price,
        peRatio,
        website,
    };
}

// src/providers/local.js
export async function fetchStockData(ticker) {
    // Same interface, different source
}
```

## Adding a New Provider

### Step 1: Create Provider Module

Create `src/providers/myapi.js`:

```javascript
/**
 * MyAPI Provider
 */

export async function fetchStockData(ticker, apiKey) {
    try {
        const response = await fetch(
            `https://api.myservice.com/quote/${ticker}`,
            { headers: { Authorization: `Bearer ${apiKey}` } },
        );

        const data = await response.json();

        return {
            ticker: ticker.toUpperCase(),
            name: data.name,
            sector: data.sector,
            marketCap: data.marketCap,
            totalDebt: data.debt,
            totalRevenue: data.revenue,
            interestIncome: data.interestIncome,
            price: data.price,
            peRatio: data.pe,
            website: data.website,
        };
    } catch (error) {
        console.error(`Error fetching from MyAPI for ${ticker}:`, error);
        return null;
    }
}

export const providerName = "myapi";
```

### Step 2: Register Provider

Update `src/providers/factory.js`:

```javascript
import * as myapi from "./myapi.js";

const PROVIDERS = {
    finnhub,
    local,
    myapi, // Add new provider
};
```

### Step 3: Configure

Update `wrangler.toml`:

```toml
[env.production]
vars = { DATA_PROVIDER = "myapi" }
```

And set the API key:

```bash
wrangler secret put MYAPI_API_KEY --env production
```

### Step 4: Update Factory (if needed)

If your API key variable has a different name, update `factory.js`:

```javascript
export function initializeProvider(env) {
    const provider = getProvider(env);
    const providerName = (env.DATA_PROVIDER || "local").toLowerCase();

    return {
        name: providerName,
        fetchStockData: (ticker) => {
            if (providerName === "myapi") {
                return provider.fetchStockData(ticker, env.MYAPI_API_KEY);
            }
            // ... other providers
        },
    };
}
```

## API Endpoints

### Screen Stocks

```
GET /api/screen
GET /api/screen?ticker=AAPL
```

Returns compliance-evaluated stock data using configured provider.

### Health Check

```
GET /api/health
```

Returns:

```json
{
    "status": "ok",
    "provider": "finnhub",
    "timestamp": "2026-04-27T10:30:00.000Z"
}
```

## Deployment

### Development (Local Provider)

```bash
wrangler deploy --env development
```

### Production (Finnhub)

```bash
# First, set the API key
wrangler secret put FINNHUB_API_KEY --env production

# Then deploy
wrangler deploy --env production
```

## Switching Providers

To switch from `local` to `finnhub`:

1. Update `wrangler.toml`:

    ```toml
    [env.production]
    vars = { DATA_PROVIDER = "finnhub" }
    ```

2. Set the API key:

    ```bash
    wrangler secret put FINNHUB_API_KEY --env production
    ```

3. Deploy:
    ```bash
    wrangler deploy --env production
    ```

**That's it!** No code changes needed.

## Data Format Standardization

All providers return data in this standardized format:

```javascript
{
  ticker: string,           // "AAPL"
  name: string,            // "Apple Inc."
  sector: string,          // "Technology"
  industry: string,        // "Consumer Electronics"
  marketCap: number,       // 2700000000000
  totalDebt: number,       // 120000000000
  totalRevenue: number,    // 394328000000
  interestIncome: number,  // 400000000
  price: number,           // 185.92
  peRatio: number,         // 28.4
  website: string,         // "https://www.apple.com"
  // + Compliance fields:
  status: string,          // "halal" | "doubtful" | "non-compliant"
  debtRatio: string,       // "4.44"
  interestRatio: string,   // "0.10"
  reason: string,          // "Shariah-compliant" | error reason
  score: number            // 0-100
}
```

## Troubleshooting

### 401 Error from Finnhub

- Verify `FINNHUB_API_KEY` is set correctly
- Check API key hasn't expired
- Verify Finnhub account is active

### Unknown Provider Error

- Check `DATA_PROVIDER` spelling in `wrangler.toml`
- Available: `local`, `finnhub`
- Falls back to `local` if invalid

### No Data Returned

- Verify ticker symbol is valid
- Check provider API status
- Review console logs for errors

## API Rate Limiting

- **Local Provider**: No limits
- **Finnhub**:
    - Free tier: 60 API calls/minute
    - Rate limiting delay built into dataService: 100ms between requests

Adjust delay in `src/functions/dataService.js` if needed:

```javascript
await new Promise((resolve) => setTimeout(resolve, 100)); // Change 100ms
```

## Next Steps

- Get Finnhub API key: https://finnhub.io/register
- Deploy to production: `wrangler deploy --env production`
- Monitor usage in Cloudflare Workers dashboard
- Add more providers as needed
