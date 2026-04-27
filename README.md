# 🕌 Halal Stock Screener

A full-stack web app for screening Shariah-compliant stocks using AAOIFI rules.

**Live Demo:** https://halal-stock-screener.workers.dev (after deployment)

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

- Node.js 16+ (for local development)
- Cloudflare account (free tier works)
- Git (optional)

### 1. Setup Cloudflare Worker

```bash
# Navigate to worker directory
cd worker

# Install dependencies
npm install

# Authenticate with Cloudflare
npx wrangler login

# Deploy to Cloudflare
npm run deploy
```

After deployment, you'll get a URL like: `https://halal-stock-screener.YOUR-ACCOUNT.workers.dev`

### 2. Update Frontend URL

Edit `public/index.html` and update the API_URL:

```javascript
const API_URL =
    "https://halal-stock-screener.YOUR-ACCOUNT.workers.dev/api/screen";
```

### 3. Deploy Frontend

Choose one of these options:

#### Option A: Cloudflare Pages (Recommended)

```bash
# Install Wrangler CLI
npm install -g wrangler

# Deploy the public folder
wrangler pages deploy public
```

#### Option B: GitHub Pages

1. Push to GitHub
2. Enable Pages in repository settings
3. Set root to `/public`

#### Option C: Vercel, Netlify, or any static host

Simply upload the `public/index.html` file.

### 4. Test Locally (Optional)

```bash
cd worker
npm run dev
```

Visit: http://localhost:8787

Then update `public/index.html` to use `http://localhost:8787/api/screen`

## API Endpoints

### GET /api/screen

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

Edit `worker/src/index.js` and update the `SAMPLE_TICKERS` array:

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

### Adjust Thresholds

In `worker/src/index.js`, modify the compliance function:

```javascript
const debtRatio = (totalDebt / marketCap) * 100;
const debtPasses = debtRatio < 33; // Change threshold here

const interestRatio = (interestIncome / totalRevenue) * 100;
const interestPasses = interestRatio < 5; // Change threshold here
```

### Add More Sectors

Edit `EXCLUDED_SECTORS` array in `worker/src/index.js`:

```javascript
const EXCLUDED_SECTORS = [
    "banking",
    "financial services",
    // Add more sectors
];
```

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

- [ ] Node.js and npm installed
- [ ] Cloudflare account created
- [ ] `wrangler` authenticated
- [ ] Worker deployed (`npm run deploy`)
- [ ] Frontend URL updated with correct Worker URL
- [ ] Frontend deployed (Pages, GitHub Pages, or other host)
- [ ] Test with real stocks
- [ ] Dark mode tested
- [ ] Mobile responsiveness verified

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
