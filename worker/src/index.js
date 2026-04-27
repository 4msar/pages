/**
 * Halal Stock Screener - Cloudflare Worker
 * Combines frontend (HTML) and backend (API) in a single worker
 * Serves HTML on GET / and API on GET /api/screen
 */

import { evaluateCompliance } from "./functions/compliance.js";
import { fetchMultipleStocks, filterAndSort } from "./functions/dataService.js";
import { initializeProvider } from "./providers/factory.js";
import { getAllTickers } from "./functions/stockData.js";

// Sample S&P 500 stocks
const SAMPLE_TICKERS = [
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "NVDA",
    "TSLA",
    "META",
    "V",
    "WMT",
    "JPM",
    "KO",
    "NKE",
    "COST",
    "DIS",
    "INTC",
    "AMD",
];

/**
 * HTML Frontend - Embedded in Worker
 */
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Halal Stock Screener</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <style>
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .animate-spin {
            animation: spin 1s linear infinite;
        }
        .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        .dark .skeleton {
            background: linear-gradient(90deg, #333 25%, #444 50%, #333 75%);
        }
        .badge {
            padding: 0.25rem 0.75rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 600;
        }
        .badge-halal {
            background-color: #d1fae5;
            color: #065f46;
        }
        .dark .badge-halal {
            background-color: #064e3b;
            color: #86efac;
        }
        .badge-non-compliant {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .dark .badge-non-compliant {
            background-color: #7f1d1d;
            color: #fca5a5;
        }
        .badge-doubtful {
            background-color: #fef3c7;
            color: #92400e;
        }
        .dark .badge-doubtful {
            background-color: #78350f;
            color: #fcd34d;
        }
    </style>
</head>
<body class="bg-white dark:bg-slate-900 transition-colors">
    <header class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-4xl font-bold">🕌 Halal Stock Screener</h1>
                    <p class="text-emerald-100 mt-2">AAOIFI Shariah-Compliant Stock Analysis</p>
                </div>
                <button id="darkModeToggle" class="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition">
                    🌙 Dark Mode
                </button>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8 transition-colors">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Ticker/Company</label>
                    <input type="text" id="searchInput" placeholder="e.g., AAPL or Apple"
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:text-white transition">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter</label>
                    <select id="filterSelect" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:text-white transition">
                        <option value="all">Show All</option>
                        <option value="halal">Halal Only</option>
                        <option value="non-compliant">Non-Compliant Only</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
                    <select id="sortSelect" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:text-white transition">
                        <option value="marketCap">Market Cap</option>
                        <option value="debtRatio">Debt Ratio</option>
                        <option value="interestRatio">Interest Ratio</option>
                    </select>
                </div>
            </div>
            <div class="flex gap-4 items-center">
                <button id="refreshBtn" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition">🔄 Refresh Data</button>
                <div id="loadingIndicator" class="hidden flex items-center gap-2">
                    <svg class="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="text-gray-600 dark:text-gray-400">Loading stocks...</span>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4 transition-colors">
                <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Stocks</p>
                <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2" id="totalCount">0</p>
            </div>
            <div class="bg-emerald-50 dark:bg-emerald-900 rounded-lg shadow p-4 transition-colors">
                <p class="text-emerald-700 dark:text-emerald-300 text-sm font-medium">Halal ✓</p>
                <p class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2" id="halalCount">0</p>
            </div>
            <div class="bg-yellow-50 dark:bg-yellow-900 rounded-lg shadow p-4 transition-colors">
                <p class="text-yellow-700 dark:text-yellow-300 text-sm font-medium">Doubtful ⚠</p>
                <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2" id="doubtfulCount">0</p>
            </div>
            <div class="bg-red-50 dark:bg-red-900 rounded-lg shadow p-4 transition-colors">
                <p class="text-red-700 dark:text-red-300 text-sm font-medium">Non-Compliant ✗</p>
                <p class="text-3xl font-bold text-red-600 dark:text-red-400 mt-2" id="nonCompliantCount">0</p>
            </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden transition-colors">
            <div id="resultsContainer" class="overflow-x-auto">
                <div id="skeletonLoader" class="p-6">
                    <div class="space-y-4">
                        <div class="skeleton h-12 rounded"></div>
                        <div class="skeleton h-12 rounded"></div>
                        <div class="skeleton h-12 rounded"></div>
                        <div class="skeleton h-12 rounded"></div>
                        <div class="skeleton h-12 rounded"></div>
                    </div>
                </div>
                <table id="resultsTable" class="w-full hidden">
                    <thead class="bg-gray-100 dark:bg-slate-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Ticker</th>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Company</th>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Sector</th>
                            <th class="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Market Cap</th>
                            <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Debt Ratio</th>
                            <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Interest Ratio</th>
                            <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Details</th>
                        </tr>
                    </thead>
                    <tbody id="resultsBody" class="divide-y divide-gray-200 dark:divide-slate-700"></tbody>
                </table>
                <div id="emptyState" class="hidden p-12 text-center">
                    <p class="text-gray-500 dark:text-gray-400 text-lg">No stocks found matching your criteria.</p>
                </div>
            </div>
        </div>

        <div class="mt-8 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-6 transition-colors">
            <h3 class="font-bold text-blue-900 dark:text-blue-300 mb-3">📋 Shariah Screening Rules (AAOIFI)</h3>
            <ul class="text-blue-800 dark:text-blue-200 space-y-2 text-sm">
                <li>✓ <strong>Debt Ratio:</strong> Total Debt / Market Cap &lt; 33%</li>
                <li>✓ <strong>Interest Income:</strong> Interest Income / Revenue &lt; 5%</li>
                <li>✗ <strong>Excluded Sectors:</strong> Banking, Insurance, Alcohol, Tobacco, Gambling, Weapons</li>
                <li>⚠️ <strong>Doubtful Status:</strong> High debt but low interest income</li>
            </ul>
        </div>
    </main>

    <footer class="bg-gray-100 dark:bg-slate-800 mt-12 py-6 transition-colors">
        <div class="max-w-7xl mx-auto px-4 text-center text-gray-600 dark:text-gray-400 text-sm">
            <p>Data sourced from Yahoo Finance API. For educational purposes only. Not financial advice.</p>
        </div>
    </footer>

    <script>
        const API_URL = '/api/screen';
        const TICKERS_URL = '/api/tickers';
        let allStocks = [];
        let availableTickers = [];

        function initDarkMode() {
            const isDark = localStorage.getItem('darkMode') === 'true';
            if (isDark) {
                document.documentElement.classList.add('dark');
            }
            document.getElementById('darkModeToggle').addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                const newDark = document.documentElement.classList.contains('dark');
                localStorage.setItem('darkMode', newDark);
            });
        }

        async function fetchTickers() {
            try {
                const response = await fetch(TICKERS_URL);
                if (!response.ok) {
                    throw new Error(\`Failed to fetch tickers: \${response.status}\`);
                }
                availableTickers = await response.json();
                console.log('Available tickers loaded:', availableTickers);
                return availableTickers;
            } catch (error) {
                console.error('Error fetching tickers:', error);
                return [];
            }
        }

        async function fetchStocks() {
            const loadingIndicator = document.getElementById('loadingIndicator');
            const skeletonLoader = document.getElementById('skeletonLoader');
            const resultsTable = document.getElementById('resultsTable');
            const emptyState = document.getElementById('emptyState');

            loadingIndicator.classList.remove('hidden');
            skeletonLoader.classList.remove('hidden');
            resultsTable.classList.add('hidden');
            emptyState.classList.add('hidden');

            try {
                // Fetch all available tickers if not already loaded
                if (availableTickers.length === 0) {
                    await fetchTickers();
                }
                
                // Fetch stocks for all available tickers
                const tickersParam = availableTickers.length > 0 ? \`?tickers=\${availableTickers.join(',')}\` : '';
                const response = await fetch(API_URL + tickersParam);
                if (!response.ok) {
                    throw new Error(\`API error: \${response.status}\`);
                }
                allStocks = await response.json();
                renderResults();
            } catch (error) {
                console.error('Error fetching stocks:', error);
                emptyState.textContent = \`Error loading data: \${error.message}\`;
                emptyState.classList.remove('hidden');
            } finally {
                loadingIndicator.classList.add('hidden');
                skeletonLoader.classList.add('hidden');
            }
        }

        function renderResults() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const filterType = document.getElementById('filterSelect').value;
            const sortBy = document.getElementById('sortSelect').value;

            let filtered = allStocks.filter(stock => {
                const matchesSearch = stock.ticker.toLowerCase().includes(searchTerm) || stock.name.toLowerCase().includes(searchTerm);
                const matchesFilter = filterType === 'all' || stock.status === filterType;
                return matchesSearch && matchesFilter;
            });

            filtered.sort((a, b) => {
                if (sortBy === 'marketCap') return b.marketCap - a.marketCap;
                if (sortBy === 'debtRatio') return parseFloat(a.debtRatio) - parseFloat(b.debtRatio);
                if (sortBy === 'interestRatio') return parseFloat(a.interestRatio) - parseFloat(b.interestRatio);
                return 0;
            });

            const tbody = document.getElementById('resultsBody');
            tbody.innerHTML = '';

            if (filtered.length === 0) {
                document.getElementById('resultsTable').classList.add('hidden');
                document.getElementById('emptyState').classList.remove('hidden');
            } else {
                filtered.forEach(stock => {
                    const badgeClass = \`badge badge-\${stock.status}\`;
                    const marketCapDisplay = stock.marketCap > 0 ? \`\$\${(stock.marketCap / 1e9).toFixed(2)}B\` : 'N/A';
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-gray-50 dark:hover:bg-slate-700 transition';
                    row.innerHTML = \`
                        <td class="px-6 py-4 font-bold text-gray-900 dark:text-white">\${stock.ticker}</td>
                        <td class="px-6 py-4 text-gray-700 dark:text-gray-300">\${stock.name}</td>
                        <td class="px-6 py-4 text-gray-600 dark:text-gray-400">\${stock.sector}</td>
                        <td class="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">\${marketCapDisplay}</td>
                        <td class="px-6 py-4 text-center text-gray-700 dark:text-gray-300">\${stock.debtRatio}%</td>
                        <td class="px-6 py-4 text-center text-gray-700 dark:text-gray-300">\${stock.interestRatio}%</td>
                        <td class="px-6 py-4 text-center">
                            <span class="\${badgeClass}">
                                \${stock.status === 'halal' ? '✓ Halal' : stock.status === 'non-compliant' ? '✗ Non-Compliant' : '⚠️ Doubtful'}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">\${stock.reason}</td>
                    \`;
                    tbody.appendChild(row);
                });
                document.getElementById('resultsTable').classList.remove('hidden');
                document.getElementById('emptyState').classList.add('hidden');
            }

            const halalStocks = allStocks.filter(s => s.status === 'halal');
            const doubtfulStocks = allStocks.filter(s => s.status === 'doubtful');
            const nonCompliantStocks = allStocks.filter(s => s.status === 'non-compliant');

            document.getElementById('totalCount').textContent = allStocks.length;
            document.getElementById('halalCount').textContent = halalStocks.length;
            document.getElementById('doubtfulCount').textContent = doubtfulStocks.length;
            document.getElementById('nonCompliantCount').textContent = nonCompliantStocks.length;
        }

        document.getElementById('searchInput').addEventListener('input', renderResults);
        document.getElementById('filterSelect').addEventListener('change', renderResults);
        document.getElementById('sortSelect').addEventListener('change', renderResults);
        document.getElementById('refreshBtn').addEventListener('click', fetchStocks);

        initDarkMode();
        // Load tickers first, then fetch stocks
        fetchTickers().then(() => fetchStocks());
    <\/script>
</body>
</html>`;

/**
 * Stock data database with realistic financial metrics
 * Moved to src/functions/stockData.js for better organization
 * Can be replaced with real API calls (Finnhub, IEX, Alpaca) by updating dataService.js
 */

/**
 * Compliance checking functions moved to src/functions/compliance.js
 * Evaluates stocks against AAOIFI Shariah compliance rules
 */

/**
 * Main request handler
 */
async function handleRequest(request, env) {
    // Enable CORS
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    // Initialize data provider
    const provider = initializeProvider(env);

    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Serve frontend on root path
    if (path === "/" || path === "") {
        return new Response(HTML_CONTENT, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "public, max-age=3600",
            },
        });
    }

    // API: Get all available tickers
    if (path === "/api/tickers") {
        try {
            const tickers = getAllTickers();
            return new Response(JSON.stringify(tickers), {
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders,
                    "Cache-Control": "max-age=86400", // Cache for 24 hours
                },
            });
        } catch (error) {
            console.error("Error in /api/tickers:", error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders,
                },
            });
        }
    }

    // API: Screen stocks
    if (path === "/api/screen") {
        try {
            const tickerParam = url.searchParams.get("ticker");
            const tickersParam = url.searchParams.get("tickers");
            let tickers;

            if (tickerParam) {
                tickers = [tickerParam.toUpperCase()];
            } else if (tickersParam) {
                tickers = tickersParam
                    .split(",")
                    .map((t) => t.toUpperCase().trim());
            } else {
                tickers = getAllTickers();
            }

            // Fetch all stocks with compliance evaluation
            const results = await fetchMultipleStocks(
                tickers,
                evaluateCompliance,
                provider,
            );

            // Sort by market cap (largest first)
            results.sort((a, b) => b.marketCap - a.marketCap);

            return new Response(JSON.stringify(results), {
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders,
                    "Cache-Control": "max-age=3600",
                },
            });
        } catch (error) {
            console.error("Error in /api/screen:", error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders,
                },
            });
        }
    }

    // Health check
    // Health check with provider info
    if (path === "/api/health") {
        return new Response(
            JSON.stringify({
                status: "ok",
                provider: provider.name,
                timestamp: new Date().toISOString(),
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders,
                },
            },
        );
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
}

/**
 * Export for Cloudflare Workers
 */
export default {
    async fetch(request, env) {
        return handleRequest(request, env);
    },
};
