# Quick Reference - Provider System

## 📁 New Files Created

```
src/providers/
├── factory.js          # Provider selector & initializer
├── finnhub.js          # Finnhub API implementation
└── local.js            # Local database implementation
```

## 🔄 How Data Flows

```
Request → index.js
  ↓
initializeProvider(env) → factory.js
  ↓ (Returns provider instance based on DATA_PROVIDER env var)
  ├─ "finnhub" → calls finnhub.js with FINNHUB_API_KEY
  └─ "local" → calls local.js with cached data
  ↓
fetchMultipleStocks(tickers, evaluateFn, provider)
  ↓ (dataService.js uses provider.fetchStockData)
evaluateCompliance(stockData)
  ↓ (compliance.js applies Shariah rules)
Response with status: "halal" | "doubtful" | "non-compliant"
```

## ⚙️ Configuration

### wrangler.toml

```toml
[env.development]
vars = { DATA_PROVIDER = "local" }

[env.production]
name = "halal-stock-screener-prod"
vars = { DATA_PROVIDER = "finnhub" }
```

### Environment Variables (via CLI)

```bash
# Set API key for Finnhub
wrangler secret put FINNHUB_API_KEY --env production
```

## 🚀 Quick Start

### Development (Local)

```bash
wrangler deploy --env development
# Uses cached stock data, no API calls
```

### Production (Finnhub)

```bash
# Step 1: Get API key from https://finnhub.io/register
wrangler secret put FINNHUB_API_KEY --env production

# Step 2: Deploy
wrangler deploy --env production
```

## 📊 Check Current Provider

```bash
curl https://your-worker-url/api/health

# Response:
{
  "status": "ok",
  "provider": "finnhub",
  "timestamp": "2026-04-27T10:30:00.000Z"
}
```

## 🔌 Adding a New Provider

1. Create `src/providers/newapi.js` with `fetchStockData()` function
2. Export as ES module with `export const providerName = "newapi"`
3. Register in `src/providers/factory.js`:
    ```javascript
    import * as newapi from "./newapi.js";
    const PROVIDERS = { finnhub, local, newapi };
    ```
4. Add to factory's `initializeProvider()`:
    ```javascript
    if (providerName === "newapi") {
        return provider.fetchStockData(ticker, env.NEWAPI_API_KEY);
    }
    ```
5. Update `wrangler.toml`:
    ```toml
    [env.production]
    vars = { DATA_PROVIDER = "newapi" }
    ```
6. Set API key: `wrangler secret put NEWAPI_API_KEY --env production`
7. Deploy: `wrangler deploy --env production`

## 📦 Provider Interface

All providers must export:

```javascript
export async function fetchStockData(ticker, apiKey?) {
    return {
        ticker,           // string
        name,            // string
        sector,          // string
        industry,        // string
        marketCap,       // number
        totalDebt,       // number
        totalRevenue,    // number
        interestIncome,  // number
        price,           // number
        peRatio,         // number
        website,         // string
    };
}
```

## 🛠️ Troubleshooting

| Issue                      | Solution                                                               |
| -------------------------- | ---------------------------------------------------------------------- |
| 401 Error from Finnhub     | Verify FINNHUB_API_KEY is set: `wrangler secret list --env production` |
| "Unknown provider" warning | Check DATA_PROVIDER spelling in wrangler.toml                          |
| Local provider always used | Verify production env is deployed: `wrangler deploy --env production`  |
| No stock data returned     | Check ticker symbol is valid (e.g., "AAPL" not "appl")                 |

## 📚 Documentation

- Full guide: [PROVIDER_SYSTEM.md](./PROVIDER_SYSTEM.md)
- API Refactoring notes: [API_REFACTORING.md](./API_REFACTORING.md)
- Setup script: [SETUP.sh](./SETUP.sh)

## 🎯 Benefits

✅ **Plug & Play**: Switch providers with just 1 line config change  
✅ **Type Safe**: All providers implement standard interface  
✅ **Scalable**: Add new providers without touching core logic  
✅ **Fallback**: Automatically falls back to local provider if config is invalid  
✅ **Environment Aware**: Dev uses local, prod uses real API  
✅ **Secure**: API keys stored as Cloudflare secrets
