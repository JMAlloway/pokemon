/**
 * Deal Score Algorithm
 * Combines two signals:
 * 1. Typo presence (binary flag, primary ranking signal) — up to 50 points
 * 2. Price gap percentage (secondary ranking signal) — up to 50 points
 *
 * Recency scoring is applied to sold listings baseline calculation,
 * and also influences the deal flag thresholds (more recent comps = higher confidence).
 */

/**
 * Detect price outliers using the IQR (Interquartile Range) method.
 * Returns the input array with an `isOutlier` flag added to each item.
 *
 * @param {Array} listings - Array of objects with a `soldPrice` property
 * @param {number} multiplier - IQR multiplier (default 1.5, use 2.0 for less aggressive filtering)
 * @returns {Array} Same array with `isOutlier: boolean` added to each item
 */
export function flagPriceOutliers(listings, multiplier = 1.5) {
  if (!listings || listings.length < 4) {
    return listings.map(l => ({ ...l, isOutlier: false }));
  }

  const prices = listings.map(l => Number(l.soldPrice)).sort((a, b) => a - b);
  const q1 = prices[Math.floor(prices.length * 0.25)];
  const q3 = prices[Math.floor(prices.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  return listings.map(l => {
    const price = Number(l.soldPrice);
    return { ...l, isOutlier: price < lowerBound || price > upperBound };
  });
}

/**
 * Calculate recency-weighted average price from recent sold listings.
 * More recent sales get higher weight. Outliers are excluded from the calculation.
 *
 * @param {Array} soldListings - Array of { soldPrice, soldAt, daysOld }
 * @returns {{ weightedPrice: number, recencyScore: number, sampleSize: number }}
 */
export function calculateRecencyWeightedBaseline(soldListings) {
  if (!soldListings || soldListings.length === 0) {
    return { weightedPrice: null, recencyScore: 0, sampleSize: 0 };
  }

  // Filter out price outliers before calculating baseline
  const flagged = flagPriceOutliers(soldListings);
  const filtered = flagged.filter(l => !l.isOutlier);
  const listingsToUse = filtered.length > 0 ? filtered : soldListings;

  let totalWeight = 0;
  let weightedSum = 0;

  const now = new Date();

  for (const listing of listingsToUse) {
    const soldDate = new Date(listing.soldAt);
    const daysOld = Math.max(0, Math.floor((now - soldDate) / (1000 * 60 * 60 * 24)));

    // Weight: exponential decay. Recent sales (0-7 days) weighted much higher.
    // weight = e^(-daysOld/30) — 30-day half-life decay
    const weight = Math.exp(-daysOld / 30);
    const price = Number(listing.soldPrice);

    weightedSum += price * weight;
    totalWeight += weight;
  }

  const weightedPrice = totalWeight > 0 ? weightedSum / totalWeight : null;

  // Recency score: how fresh is the data? (0-100)
  // Based on average recency of listings and sample size
  const avgDaysOld = listingsToUse.reduce((sum, l) => {
    const d = Math.floor((now - new Date(l.soldAt)) / (1000 * 60 * 60 * 24));
    return sum + d;
  }, 0) / listingsToUse.length;

  // Better score for fresher data and more samples
  const freshnessScore = Math.max(0, 100 - (avgDaysOld / 90) * 100);
  const sampleBonus = Math.min(20, listingsToUse.length * 4);
  const recencyScore = Math.min(100, Math.round(freshnessScore * 0.8 + sampleBonus));

  return {
    weightedPrice: weightedPrice ? Math.round(weightedPrice * 100) / 100 : null,
    recencyScore,
    sampleSize: listingsToUse.length
  };
}

/**
 * Calculate price gap percentage.
 * Positive = listing is below market (good deal).
 * Negative = listing is above market.
 *
 * @param {number} baselinePrice - Recency-weighted sold price average
 * @param {number} listingPrice - Current listing price
 * @returns {number|null} Price gap percentage
 */
export function calculatePriceGap(baselinePrice, listingPrice) {
  if (!baselinePrice || baselinePrice <= 0 || !listingPrice) return null;
  return Math.round(((baselinePrice - listingPrice) / baselinePrice) * 10000) / 100;
}

/**
 * Calculate deal score (0-100).
 * Primary signal: typo presence (up to 50 points)
 * Secondary signal: price gap percentage (up to 50 points)
 *
 * @param {{ hasTypo: boolean, priceGapPercent: number|null, recencyScore: number, typoConfidenceScore: number|null }} params
 * @returns {number} Deal score 0-100
 */
export function calculateDealScore({ hasTypo, priceGapPercent, recencyScore = 50, typoConfidenceScore = null }) {
  let score = 0;

  // Typo signal: 0-50 points
  if (hasTypo) {
    // Base 30 points for any typo, bonus based on confidence
    const confidence = typoConfidenceScore || 70;
    score += Math.round(30 + (confidence / 100) * 20);
  }

  // Price gap signal: 0-50 points
  if (priceGapPercent !== null && priceGapPercent > 0) {
    // Scale price gap to 0-50 points (cap at 50% gap = max points)
    const gapScore = Math.min(50, Math.round(priceGapPercent));

    // Apply recency confidence: if recency data is unreliable, reduce gap contribution
    const confidenceMultiplier = Math.max(0.3, recencyScore / 100);
    score += Math.round(gapScore * confidenceMultiplier);
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Generate human-readable deal summary.
 */
export function getDealSummary({ hasTypo, typoDetails, priceGapPercent, recencyScore, sampleSize }) {
  const parts = [];

  if (hasTypo) {
    parts.push(`Typo found${typoDetails ? `: ${typoDetails}` : ''}`);
  }

  if (priceGapPercent !== null) {
    if (priceGapPercent > 0) {
      parts.push(`${priceGapPercent.toFixed(1)}% below market`);
    } else if (priceGapPercent < 0) {
      parts.push(`${Math.abs(priceGapPercent).toFixed(1)}% above market`);
    } else {
      parts.push('At market price');
    }
  } else {
    parts.push('No recent sale data available');
  }

  if (sampleSize !== undefined && sampleSize > 0 && sampleSize <= 2) {
    parts.push(`Limited data (${sampleSize} sale${sampleSize > 1 ? 's' : ''} in 90 days)`);
  }

  return parts.join(' + ');
}
