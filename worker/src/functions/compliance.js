/**
 * Compliance Checking Functions
 * Evaluates stocks against AAOIFI Shariah compliance rules
 */

const EXCLUDED_SECTORS = [
    "banking",
    "financial services",
    "insurance",
    "alcohol",
    "tobacco",
    "gambling",
    "adult entertainment",
    "weapons",
    "defense",
    "pork",
    "interest-bearing",
];

/**
 * Check if a stock is in an excluded sector
 */
export function isExcludedSector(sector) {
    if (!sector) return false;
    const lowerSector = sector.toLowerCase();
    return EXCLUDED_SECTORS.some((excluded) => lowerSector.includes(excluded));
}

/**
 * Evaluate Shariah compliance based on AAOIFI rules
 *
 * Rules:
 * 1. Not in excluded sectors
 * 2. Debt Ratio: Total Debt / Market Cap < 33%
 * 3. Interest Ratio: Interest Income / Revenue < 5%
 *
 * Status:
 * - halal: Passes all rules
 * - doubtful: High debt but low interest income
 * - non-compliant: Fails one or more rules
 */
export function evaluateCompliance(stock) {
    // Rule 1: Check sector exclusion
    if (isExcludedSector(stock.sector)) {
        return {
            status: "non-compliant",
            reason: `Excluded sector: ${stock.sector}`,
            debtRatio: "N/A",
            interestRatio: "N/A",
            score: 0,
        };
    }

    const marketCap = stock.marketCap || 1;
    const totalDebt = stock.totalDebt || 0;
    const totalRevenue = stock.totalRevenue || 1;
    const interestIncome = stock.interestIncome || 0;

    // Rule 2: Debt ratio (Debt / Market Cap < 33%)
    const debtRatio = (totalDebt / marketCap) * 100;
    const debtPasses = debtRatio < 33;

    // Rule 3: Interest income ratio (Interest Income / Revenue < 5%)
    const interestRatio = (interestIncome / totalRevenue) * 100;
    const interestPasses = interestRatio < 5;

    // Determine compliance status
    let status = "halal";
    let reason = [];

    if (!debtPasses) {
        status = interestPasses ? "doubtful" : "non-compliant";
        reason.push(
            `High debt ratio: ${debtRatio.toFixed(2)}% (threshold: 33%)`,
        );
    }

    if (!interestPasses) {
        status = "non-compliant";
        reason.push(
            `High interest income: ${interestRatio.toFixed(2)}% (threshold: 5%)`,
        );
    }

    return {
        status,
        reason: reason.length > 0 ? reason.join("; ") : "Shariah-compliant",
        debtRatio: debtRatio.toFixed(2),
        interestRatio: interestRatio.toFixed(2),
        score: debtPasses && interestPasses ? 100 : debtPasses ? 50 : 0,
    };
}
