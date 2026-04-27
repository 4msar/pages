#!/bin/bash
# Setup Guide: Plug & Play Provider System

# 1. For LOCAL PROVIDER (Development - already configured)
echo "=== Development Setup (Local Provider) ==="
wrangler deploy --env development

# 2. For FINNHUB PROVIDER (Production - requires API key)
echo "=== Production Setup (Finnhub Provider) ==="
echo "Step 1: Get a free API key from https://finnhub.io/register"
echo "Step 2: Set the API key as a secret"
wrangler secret put FINNHUB_API_KEY --env production
# (Paste your API key when prompted)

echo "Step 3: Deploy to production"
wrangler deploy --env production

# 3. Check which provider is running
echo "=== Check Active Provider ==="
curl https://your-worker-url/api/health

# Output:
# {"status":"ok","provider":"finnhub","timestamp":"2026-04-27T10:30:00.000Z"}
# or
# {"status":"ok","provider":"local","timestamp":"2026-04-27T10:30:00.000Z"}

# 4. To switch providers later (no code changes needed!)
echo "=== To Switch Providers ==="
echo "Edit wrangler.toml:"
echo '  [env.production]'
echo '  vars = { DATA_PROVIDER = "finnhub" }'
echo ""
echo "Then deploy:"
echo "wrangler deploy --env production"
