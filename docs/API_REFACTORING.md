# Halal Stock Screener - API Refactoring Guide

## Changes Made

### Issue Fixed

- **401 Error from Yahoo Finance**: The API was blocking requests from Cloudflare Workers due to rate limiting and authentication requirements.

### Solution

✅ **Converted to Cloudflare Functions** with modular architecture:

1. **Separated concerns into function modules** under `src/functions/`:
    - `compliance.js` - Shariah compliance evaluation logic
    - `dataService.js` - Data fetching and processing
    - `stockData.js` - Stock database and financial data

2. **Replaced Yahoo Finance API** with a local database:
    - Eliminates 401/rate limiting issues
    - Provides reliable, instant responses
    - Can be upgraded to real API calls

3. **Better code organization**:
    - Main `index.js` is now cleaner and easier to maintain
    - Each function module has a single responsibility
    - Easier to test and debug

## Project Structure

```
worker/
├── src/
│   ├── index.js              # Main entry point (handler + HTML frontend)
│   └── functions/
│       ├── compliance.js     # CF Function: Shariah compliance rules
│       ├── dataService.js    # CF Function: Data retrieval & filtering
│       └── stockData.js      # CF Module: Stock database
├── wrangler.toml
└── package.json
```

## Upgrading to Real API

To replace the local database with a real financial API, update `src/functions/dataService.js`:

### Option 1: Finnhub API (Recommended)

```javascript
export async function fetchStockData(ticker) {
    const apiKey = "YOUR_FINNHUB_API_KEY"; // Store in wrangler.toml env
    const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`,
    );
    // Parse and return formatted data
}
```

### Option 2: Alpha Vantage

```javascript
export async function fetchStockData(ticker) {
    const apiKey = "YOUR_ALPHA_VANTAGE_KEY";
    const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`,
    );
    // Parse and return formatted data
}
```

### Option 3: IEX Cloud

```javascript
export async function fetchStockData(ticker) {
    const apiKey = "YOUR_IEX_API_KEY";
    const response = await fetch(
        `https://cloud.iexapis.com/stable/stock/${ticker}/quote?token=${apiKey}`,
    );
    // Parse and return formatted data
}
```

## Cloudflare Functions Pattern

The new structure uses Cloudflare's recommended module pattern:

```javascript
// functions/compliance.js - Pure computation functions
export function evaluateCompliance(stock) { ... }

// functions/dataService.js - Data operations
export async function fetchStockData(ticker) { ... }
export async function fetchMultipleStocks(tickers, evaluateFn) { ... }

// functions/stockData.js - Data constants/database
export const STOCK_DATABASE = { ... }
```

## API Endpoints

### Screen All Stocks

```
GET /api/screen
```

Returns all stocks with compliance status sorted by market cap.

### Screen Single Ticker

```
GET /api/screen?ticker=AAPL
```

Returns compliance data for a specific ticker.

### Health Check

```
GET /api/health
```

Returns `{ status: "ok" }`

## Deployment

```bash
# Deploy to Cloudflare Workers
wrangler deploy

# Or with specific environment
wrangler deploy --env production
```

## Notes

- Uses ES modules for clean imports and exports
- All stock data includes: marketCap, totalDebt, totalRevenue, interestIncome
- Shariah compliance rules (AAOIFI):
    - Debt Ratio: `(Total Debt / Market Cap) < 33%`
    - Interest Ratio: `(Interest Income / Revenue) < 5%`
    - Excluded sectors: Banking, Insurance, Alcohol, Tobacco, Gambling, Weapons
- Response is cached for 1 hour
