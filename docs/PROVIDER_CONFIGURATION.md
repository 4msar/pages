# Provider Configuration Guide

## Available Providers

This application supports 8 financial data providers. Choose based on your needs:

| Provider                | Free Tier         | Quality   | Speed     | Setup   | Best For                   |
| ----------------------- | ----------------- | --------- | --------- | ------- | -------------------------- |
| **Local**               | ✅ Yes            | Mock      | Fast      | None    | Development/Testing        |
| **Mock**                | ✅ Yes            | Test Data | Instant   | None    | Unit Tests                 |
| **Alpha Vantage**       | ✅ Free (Limited) | Good      | Slow      | API Key | Budget-friendly Production |
| **Twelve Data**         | ✅ Free (Limited) | Very Good | Fast      | API Key | Balanced Quality/Price     |
| **Finnhub**             | ✅ Free (Limited) | Excellent | Fast      | API Key | Quality Data               |
| **IEX Cloud**           | ❌ Paid Only      | Excellent | Very Fast | API Key | Premium Quality            |
| **Polygon.io**          | ✅ Free (Limited) | Excellent | Very Fast | API Key | Comprehensive Data         |
| **EOD Historical Data** | ✅ Free (Limited) | Good      | Medium    | API Key | Historical Data            |

## Quick Start

### Development (No API Key Needed)

```bash
# Use mock data for testing
wrangler deploy --env development

# In wrangler.toml
[env.development]
vars = { DATA_PROVIDER = "mock" }
```

### Production Setup

Choose your provider and set environment variables:

```toml
[env.production]
vars = { DATA_PROVIDER = "finnhub" }
```

Then set the API key as a Cloudflare secret:

```bash
wrangler secret put FINNHUB_API_KEY --env production
```

---

## Provider Details & Setup

### 1. Local Provider (Default)

- **No setup required** - uses cached data from `stockData.js`
- Perfect for testing and development
- Contains: AAPL, MSFT, GOOGL, AMZN, TSLA, JPM, PG, JNJ

```toml
[env.development]
vars = { DATA_PROVIDER = "local" }
```

---

### 2. Mock Provider

- **No API key required** - generates realistic test data
- Randomized prices for realism testing
- Returns: AAPL, MSFT, JPM, PG, TSLA, JNJ with variations

```toml
[env.testing]
vars = { DATA_PROVIDER = "mock" }
```

**Best for**: Unit tests, CI/CD pipelines, development without internet

---

### 3. Alpha Vantage

**Free Tier**: 5 calls/minute, 500 calls/day  
**Website**: https://www.alphavantage.co

**Setup**:

```bash
# 1. Get free API key at https://www.alphavantage.co/
# 2. Set environment
wrangler secret put ALPHAVANTAGE_API_KEY --env production

# 3. Configure
[env.production]
vars = { DATA_PROVIDER = "alphavantage" }
```

**Pros**: Free tier, easy to use, good for learning  
**Cons**: Rate limited (5/min), slow responses during high traffic

---

### 4. Twelve Data

**Free Tier**: 500 API calls/day  
**Website**: https://twelvedata.com

**Setup**:

```bash
# 1. Get free API key at https://twelvedata.com/
# 2. Set environment
wrangler secret put TWELVEDATA_API_KEY --env production

# 3. Configure
[env.production]
vars = { DATA_PROVIDER = "twelvedata" }
```

**Pros**: Good free tier, fast API, good documentation  
**Cons**: Free tier limited to EOD data

---

### 5. Finnhub (Recommended)

**Free Tier**: 60 calls/minute, unlimited daily  
**Website**: https://finnhub.io

**Setup**:

```bash
# 1. Get free API key at https://finnhub.io/
# 2. Set environment
wrangler secret put FINNHUB_API_KEY --env production

# 3. Configure
[env.production]
vars = { DATA_PROVIDER = "finnhub" }
```

**Pros**: Best free tier, 60 calls/min limit, real-time data, excellent docs  
**Cons**: Limited company data in free tier

---

### 6. IEX Cloud (Premium)

**Pricing**: Pay-per-use ($0.001 per message)  
**Website**: https://iexcloud.io

**Setup**:

```bash
# 1. Sign up at https://iexcloud.io/
# 2. Get publishable token from dashboard
# 3. Set environment
wrangler secret put IEXCLOUD_API_KEY --env production

# 4. Configure
[env.production]
vars = { DATA_PROVIDER = "iexcloud" }
```

**Pros**: Extremely fast, comprehensive data, no rate limits  
**Cons**: Paid service (but very affordable for low volumes)

---

### 7. Polygon.io (Recommended)

**Free Tier**: Unlimited API calls (with tier restrictions)  
**Website**: https://polygon.io

**Setup**:

```bash
# 1. Sign up free at https://polygon.io/
# 2. Get API key from dashboard
# 3. Set environment
wrangler secret put POLYGON_API_KEY --env production

# 4. Configure
[env.production]
vars = { DATA_PROVIDER = "polygon" }
```

**Pros**: Comprehensive data, fast, unlimited free tier  
**Cons**: Free tier has rate limits for real-time data

---

### 8. EOD Historical Data

**Free Tier**: 20 API calls/day  
**Website**: https://eodhistoricaldata.com

**Setup**:

```bash
# 1. Get free API key at https://eodhistoricaldata.com/
# 2. Set environment
wrangler secret put EODDATA_API_KEY --env production

# 3. Configure
[env.production]
vars = { DATA_PROVIDER = "eoddata" }

# Note: Use ticker format TICKER.US (e.g., AAPL.US)
```

**Pros**: Good historical data, good for backtesting  
**Cons**: Limited free tier, slow API responses

---

## Environment Setup Examples

### Complete wrangler.toml Setup

```toml
# Development with mock data
[env.development]
vars = { DATA_PROVIDER = "mock" }

# Testing with Alpha Vantage
[env.testing]
vars = { DATA_PROVIDER = "alphavantage" }

# Production with Finnhub
[env.production]
vars = { DATA_PROVIDER = "finnhub" }

# Alternative production with Polygon
[env.production-polygon]
vars = { DATA_PROVIDER = "polygon" }
```

### Setting Multiple Secrets

```bash
# Alpha Vantage
wrangler secret put ALPHAVANTAGE_API_KEY --env production

# Twelve Data
wrangler secret put TWELVEDATA_API_KEY --env production

# Finnhub
wrangler secret put FINNHUB_API_KEY --env production

# IEX Cloud
wrangler secret put IEXCLOUD_API_KEY --env production

# Polygon.io
wrangler secret put POLYGON_API_KEY --env production

# EOD Historical Data
wrangler secret put EODDATA_API_KEY --env production
```

---

## Switching Providers at Runtime

All providers are already loaded. To switch:

1. **Update wrangler.toml**:

    ```toml
    [env.production]
    vars = { DATA_PROVIDER = "polygon" }  # Change from finnhub to polygon
    ```

2. **Ensure API key is set**:

    ```bash
    wrangler secret put POLYGON_API_KEY --env production
    ```

3. **Redeploy**:
    ```bash
    wrangler deploy --env production
    ```

The factory pattern handles everything automatically!

---

## Adding Custom Providers

Follow this pattern:

1. **Create** `src/providers/myprovider.js`:

    ```javascript
    export async function fetchStockData(ticker, apiKey) {
        // Return standardized format
        return {
            ticker,
            name,
            sector,
            industry,
            marketCap,
            price,
            peRatio,
            website,
            totalDebt,
            totalRevenue,
            interestIncome,
        };
    }
    ```

2. **Register** in `src/providers/factory.js`:

    ```javascript
    import * as myprovider from "./myprovider.js";

    const PROVIDERS = {
        // ... existing
        myprovider,
    };

    // Add to apiKeyMap if it needs an API key
    const apiKeyMap = {
        // ... existing
        myprovider: env.MYPROVIDER_API_KEY,
    };
    ```

3. **Configure** in `wrangler.toml`:
    ```toml
    [env.production]
    vars = { DATA_PROVIDER = "myprovider" }
    ```

---

## Troubleshooting

### Provider not found error

```
Unknown provider: myprovider. Available providers: finnhub, local, ...
```

**Solution**: Check spelling in `wrangler.toml` (case-sensitive)

### API Key not set error

```
FINNHUB_API_KEY environment variable not set
```

**Solution**: Set the secret:

```bash
wrangler secret put FINNHUB_API_KEY --env production
```

### Rate limiting

If you hit rate limits:

- **Alpha Vantage**: Switch to Finnhub (60/min vs 5/min)
- **Twelve Data**: Upgrade to paid plan or use IEX Cloud
- **Others**: Implement request caching or queue system

### No data for ticker

Some providers may not have data for all tickers:

- Use a different provider
- Check ticker format (some require `.US` suffix)
- Verify ticker is valid

---

## Performance Recommendations

| Use Case                              | Recommended Provider         |
| ------------------------------------- | ---------------------------- |
| **Development**                       | Local or Mock                |
| **Small Scale (<100 requests/day)**   | Alpha Vantage or Twelve Data |
| **Medium Scale (<5000 requests/day)** | Finnhub                      |
| **Large Scale (>5000 requests/day)**  | IEX Cloud or Polygon         |
| **Historical Analysis**               | EOD Historical Data          |
| **Testing**                           | Mock                         |

---

## Rate Limits Reference

| Provider      | Free Limit  | Burst     | Cache  |
| ------------- | ----------- | --------- | ------ |
| Alpha Vantage | 5/min       | 500/day   | 5 min  |
| Twelve Data   | Unlimited\* | None      | 5 min  |
| Finnhub       | 60/min      | Unlimited | 5 min  |
| IEX Cloud     | Varies      | -         | 5 min  |
| Polygon       | Varies      | -         | 5 min  |
| EOD Data      | 20/day      | -         | 24 hrs |

\*Twelve Data free tier limited to end-of-day data
