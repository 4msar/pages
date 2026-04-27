# Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cloudflare Worker                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   index.js (Handler)                      │  │
│  │  - Receives HTTP requests                                 │  │
│  │  - Initializes provider based on env vars                 │  │
│  │  - Routes to API endpoints                                │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                             │
│                     ▼                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Provider Factory                             │  │
│  │  initializeProvider(env)                                  │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │ Check env.DATA_PROVIDER:                         │  │  │
│  │  │  - "finnhub" → select Finnhub provider           │  │  │
│  │  │  - "local" → select Local provider               │  │  │
│  │  │  - fallback to Local if not recognized           │  │  │
│  │  └─────────────────┬──────────────────────────────────┘  │  │
│  └────────────────────┼───────────────────────────────────┘  │
│                       │                                         │
│          ┌────────────┴────────────┐                            │
│          ▼                         ▼                            │
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │ Finnhub Provider │    │ Local Provider   │                 │
│  │                  │    │                  │                 │
│  │ fetchStockData   │    │ fetchStockData   │                 │
│  │ (ticker, apiKey) │    │ (ticker)         │                 │
│  │                  │    │                  │                 │
│  │ Calls:           │    │ Returns:         │                 │
│  │ finnhub.io API   │    │ STOCK_DATABASE   │                 │
│  │ with APIKEY      │    │ cached data      │                 │
│  └────────┬─────────┘    └────────┬─────────┘                 │
│           │                       │                            │
│           │ Standardized Data Format                           │
│           └───────────┬───────────┘                            │
│                       ▼                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Data Service                             │  │
│  │  fetchMultipleStocks(tickers, evaluateFn, provider)   │  │
│  │                                                        │  │
│  │  for each ticker:                                      │  │
│  │    1. Call provider.fetchStockData(ticker)            │  │
│  │    2. Pass to evaluateCompliance()                    │  │
│  │    3. Add compliance status to result                 │  │
│  │    4. Rate limit (100ms delay)                        │  │
│  └─────────────────┬──────────────────────────────────┘  │
│                    ▼                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Compliance Checker                          │  │
│  │  evaluateCompliance(stock)                            │  │
│  │                                                        │  │
│  │  Rules:                                                │  │
│  │  1. ✗ Exclude sectors: Banking, Insurance, etc.      │  │
│  │  2. ✓ Debt Ratio < 33%                                │  │
│  │  3. ✓ Interest Income / Revenue < 5%                 │  │
│  │                                                        │  │
│  │  Status: "halal" | "doubtful" | "non-compliant"      │  │
│  └─────────────────┬──────────────────────────────────┘  │
│                    ▼                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Response                                   │  │
│  │  JSON with stock data + compliance status             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Environment Variable Flow

```
Development                          Production
────────────────────                 ────────────────────
wrangler.toml:                       wrangler.toml:
[env.development]                    [env.production]
vars = {                             vars = {
  DATA_PROVIDER = "local"              DATA_PROVIDER = "finnhub"
}                                    }
        │                                    │
        ▼                                    ▼
   LOCAL PROVIDER                    FINNHUB PROVIDER
   (No API key needed)               (Needs FINNHUB_API_KEY)
        │                                    │
        ▼                                    ▼
   STOCK_DATABASE                    findhub.io API
   (Cached data)                     (Real-time data)
        │                                    │
        └────────────┬─────────────────────┘
                     ▼
            Standard Data Format
                     │
                     ▼
            Compliance Evaluation
                     │
                     ▼
            API Response (Same format)
```

## File Organization

```
worker/
├── src/
│   ├── index.js
│   │   - HTTP request handler
│   │   - Initializes provider
│   │   - Routes to /api/screen, /api/health, etc
│   │
│   ├── functions/
│   │   ├── compliance.js
│   │   │   - Shariah compliance rules
│   │   │   - Excluded sectors
│   │   │   - Debt/Interest ratios
│   │   │
│   │   ├── dataService.js
│   │   │   - Provider-agnostic data operations
│   │   │   - Works with any provider
│   │   │   - Filtering and sorting
│   │   │
│   │   └── stockData.js
│   │       - Stock database (local provider)
│   │       - 16 major stock entries
│   │
│   └── providers/
│       ├── factory.js
│       │   - Selects provider based on env
│       │   - Initializes with API keys
│       │   - Provides fallback logic
│       │
│       ├── finnhub.js
│       │   - Real-time data provider
│       │   - Calls finnhub.io API
│       │   - Estimates financial metrics
│       │
│       └── local.js
│           - Development provider
│           - Uses cached stock database
│           - No external calls
│
├── wrangler.toml
│   - Configuration
│   - Environment definitions
│   - Provider selection
│
└── package.json
    - Dependencies
```

## Request → Response Timeline

```
1. HTTP Request arrives
   │
   ├─ GET /
   │  └─ → Returns HTML frontend
   │
   ├─ GET /api/screen?ticker=AAPL
   │  ├─ Initialize provider from env
   │  ├─ Call provider.fetchStockData("AAPL")
   │  │  ├─ Finnhub → API call
   │  │  └─ Local → Database lookup
   │  ├─ Apply compliance rules
   │  └─ Return JSON response
   │
   ├─ GET /api/screen
   │  ├─ Initialize provider from env
   │  ├─ Fetch all SAMPLE_TICKERS
   │  │  (with 100ms rate limit between each)
   │  ├─ Apply compliance to each
   │  ├─ Sort by market cap
   │  └─ Return JSON array
   │
   └─ GET /api/health
      └─ Return { status: "ok", provider: "...", timestamp: "..." }
```

## Provider Adding Flow

```
Existing Providers:          Want to add new provider:
┌─────────────────┐
│  local.js       │          1. Create src/providers/newapi.js
│  finnhub.js     │
└────────┬────────┘          2. Export fetchStockData() function
         │
    Register in:             3. Add to PROVIDERS object in factory.js
    factory.js
         │                   4. Add condition in initializeProvider()
    PROVIDERS = {                   for env variable handling
      finnhub,
      local,                 5. Update wrangler.toml with new env var
      newapi ← NEW!             DATA_PROVIDER = "newapi"
    }
         │                   6. Set API key: wrangler secret put
         ▼
    Ready to use!            7. Deploy: wrangler deploy

         │ Just change:      8. Done! No code changes needed
         │ DATA_PROVIDER
         │ in wrangler.toml
         ▼
    Switch instantly!
```

## Data Standardization

All providers return this format (simplified):

```javascript
{
  // From Provider
  ticker: "AAPL",
  name: "Apple Inc.",
  sector: "Technology",
  marketCap: 2700000000000,
  price: 185.92,

  // Compliance adds these
  status: "halal",
  debtRatio: "4.44%",
  interestRatio: "0.10%",
  reason: "Shariah-compliant",
  score: 100
}
```

This ensures all providers produce identical output format!
