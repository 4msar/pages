# 🕌 Halal Stock Screener

A full-stack web app for screening Shariah-compliant stocks using AAOIFI rules.

**Live Demo:** https://halal-stock-screener.msar.workers.dev (after deployment)

## Features

✅ **Shariah Compliance Screening**

- Debt / Market Cap < 33%
- Interest Income / Revenue < 5%
- Excluded sectors: Banking, Insurance, Alcohol, Tobacco, Gambling, Weapons

✅ **Modern UI**

- Clean, responsive design with Tailwind CSS
- Dark mode toggle
- Real-time search and filtering
- Interactive results table with sorting

✅ **Performance**

- Cloudflare Workers backend (serverless)
- Yahoo Finance data via public endpoints
- Response caching (1 hour)

## Project Structure

```
halal-stock-screener/
├── worker/                              # Complete app (backend + frontend)
│   ├── src/
│   │   └── index.js                    # Everything: Backend API + Frontend HTML
│   ├── wrangler.toml                   # Cloudflare Worker config
│   └── package.json                    # Dependencies
├── README.md
└── DEPLOYMENT.md
```

**Everything is in one worker!** No separate frontend deployment needed.

## Quick Start

### Prerequisites

- Node.js 16+ installed
- npm installed
- Cloudflare account (free tier works)

### 1. Install Dependencies

```bash
cd worker
npm install
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

Follow the prompts to sign in to your Cloudflare account.

### 3. Deploy

```bash
npm run deploy
```

**That's it!** 🎉

Your app is now live at: `https://halal-stock-screener.YOUR-ACCOUNT.workers.dev`

Visit that URL and start screening stocks!

### Test Locally (Optional)

Before deploying, test locally:

```bash
npm run dev
```

Visit: `http://localhost:8787`

## How It Works

**Everything is in one Cloudflare Worker!**

1. Browser requests `/` → Worker serves HTML frontend
2. Frontend JavaScript makes API calls to `/api/screen`
3. Worker backend fetches stock data from Yahoo Finance
4. Results are screened for Shariah compliance
5. JSON response sent back to frontend
6. Frontend displays results with search/filter/sort

No separate frontend hosting needed. Single deployment. Single URL.

Fetches and screens stocks for Shariah compliance.

**Query Parameters:**

- `ticker` (optional): Screen a specific stock by ticker (e.g., `?ticker=AAPL`)

**Response:**

```json
[
    {
        "ticker": "AAPL",
        "name": "Apple Inc.",
        "sector": "Technology",
        "marketCap": 2800000000000,
        "totalDebt": 100000000000,
        "totalRevenue": 394328000000,
        "interestIncome": 0,
        "price": 150.25,
        "peRatio": 25.5,
        "status": "halal",
        "reason": "Shariah-compliant",
        "debtRatio": "3.57",
        "interestRatio": "0.00",
        "score": 100
    }
]
```

**Status Values:**

- `halal`: Passes all Shariah compliance checks
- `doubtful`: High debt but low interest income
- `non-compliant`: Fails compliance checks or in excluded sector

## Shariah Screening Rules (AAOIFI)

| Rule                  | Threshold | Status |
| --------------------- | --------- | ------ |
| Debt Ratio            | < 33%     | Pass ✓ |
| Interest Income Ratio | < 5%      | Pass ✓ |
| Excluded Sectors      | None      | Pass ✓ |

**Excluded Sectors:**

- Banking / Financial Services
- Insurance
- Alcohol / Tobacco
- Gambling
- Weapons / Defense
- Adult Entertainment

## Customization

### Add More Stocks

Edit `worker/src/index.js` and find the `SAMPLE_TICKERS` array:

```javascript
const SAMPLE_TICKERS = [
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "NVDA",
    // Add more tickers here
];
```

Then deploy:

```bash
cd worker
npm run deploy
```

### Adjust Thresholds

In `worker/src/index.js`, find the `evaluateCompliance()` function and modify:

```javascript
const debtRatio = (totalDebt / marketCap) * 100;
const debtPasses = debtRatio < 33; // Change 33 to your threshold

const interestRatio = (interestIncome / totalRevenue) * 100;
const interestPasses = interestRatio < 5; // Change 5 to your threshold
```

Then deploy the changes.

### Add More Excluded Sectors

Edit the `EXCLUDED_SECTORS` array in `worker/src/index.js`:

```javascript
const EXCLUDED_SECTORS = [
    "banking",
    "financial services",
    "insurance",
    // Add more sectors
];
```

Then deploy.

## Performance & Caching

- Worker caches results for 1 hour
- 300ms delay between stock fetches to avoid rate limiting
- Typical response time: 2-3 seconds for 25 stocks

## Troubleshooting

### Issue: "Failed to fetch from API"

**Solution:**

- Check that the Worker is deployed
- Verify the API URL in `index.html` matches your deployment URL
- Check Cloudflare dashboard for errors

### Issue: "No data returned"

**Solution:**

- Yahoo Finance API may be temporarily down
- Try fetching a single stock: `?ticker=AAPL`
- Check browser console for errors

### Issue: Worker deployment fails

**Solution:**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npx wrangler login  # Re-authenticate
npm run deploy
```

## API Limitations

- Yahoo Finance doesn't provide official API (using unofficial endpoints)
- Rate limited to prevent IP blocking
- Some stocks may not have complete data

## Security Notes

- This app is for educational purposes only
- Data is fetched directly from Yahoo Finance
- No financial data is stored on servers
- CORS enabled for all origins (can be restricted in production)

## Deployment Checklist

- [ ] Node.js 16+ and npm installed
- [ ] Cloudflare account created
- [ ] `cd worker && npm install`
- [ ] `wrangler login` (authenticated)
- [ ] `npm run deploy` (worker deployed)
- [ ] Visit your worker URL
- [ ] Test: Click "🔄 Refresh Data"
- [ ] Test: Search for a stock
- [ ] Test: Toggle dark mode
- [ ] Test: Filter and sort results
- [ ] Share your worker URL!

## License

MIT - Free to use and modify

## Disclaimer

**This app is for educational and informational purposes only.**

- Not financial advice
- Not official Shariah compliance certification
- Always consult with qualified Islamic finance advisors
- Market data may be delayed or inaccurate
- Past performance doesn't guarantee future results

---

**Made with ❤️ for Islamic investors**
