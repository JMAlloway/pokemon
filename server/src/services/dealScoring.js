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

  // Use total price (item + shipping) for outlier detection
  const totalPrice = l => Number(l.soldPrice) + (l.shippingCost != null ? Number(l.shippingCost) : 0);
  const prices = listings.map(totalPrice).sort((a, b) => a - b);
  const q1 = prices[Math.floor(prices.length * 0.25)];
  const q3 = prices[Math.floor(prices.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  return listings.map(l => {
    const price = totalPrice(l);
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
 *
 * For FIXED_PRICE (Buy It Now):
 *   Primary signal: typo presence (up to 50 points)
 *   Secondary signal: price gap percentage (up to 50 points)
 *   BIN listings with low price are the strongest deals.
 *
 * For AUCTION:
 *   Scoring factors in time remaining, bid count, and price vs market.
 *   - Auctions ending soon with low bids and below-market price = opportunity
 *   - Auctions with many bids are competitive and less likely to be deals
 *   - Score is generally lower than equivalent BIN since outcome is uncertain
 *
 * @param {{ hasTypo: boolean, priceGapPercent: number|null, recencyScore: number, typoConfidenceScore: number|null, buyingOption: string, bidCount: number|null, auctionEndDate: string|Date|null }} params
 * @returns {number} Deal score 0-100
 */
export function calculateDealScore({ hasTypo, priceGapPercent, recencyScore = 50, typoConfidenceScore = null, buyingOption = 'FIXED_PRICE', bidCount = null, auctionEndDate = null }) {
  if (buyingOption === 'AUCTION') {
    return calculateAuctionDealScore({ hasTypo, priceGapPercent, recencyScore, typoConfidenceScore, bidCount, auctionEndDate });
  }

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
 * Calculate deal score for auction listings (0-100).
 *
 * Key insight: auction prices are only meaningful close to end time.
 * A $0.99 bid with 5 days left will almost certainly get bid up — snipers
 * wait until the final minutes. So we apply a time-decay multiplier that
 * heavily dampens the price gap and bid signals for far-out auctions.
 *
 * Signals:
 * 1. Time remaining: auctions ending soon with few bids = opportunity (up to 25 pts)
 * 2. Bid competition: fewer bids = less competition (up to 25 pts)
 * 3. Price gap: current bid vs market price (up to 30 pts)
 * 4. Typo bonus: typos reduce visibility = less competition (up to 20 pts)
 *
 * Time-decay multiplier (applied to price gap + bid signals):
 *   < 1h remaining:  1.0  (price is real)
 *   1-6h:            0.75
 *   6-24h:           0.45
 *   1-3 days:        0.15
 *   3+ days:         0.05 (price is nearly meaningless)
 */
function calculateAuctionDealScore({ hasTypo, priceGapPercent, recencyScore = 50, typoConfidenceScore = null, bidCount = 0, auctionEndDate = null }) {
  const bids = bidCount || 0;

  // Time-decay multiplier: how much to trust the current price
  let timeMultiplier = 0.05; // default: far out or unknown
  let timeScore = 3;         // base time signal for far-out auctions

  if (auctionEndDate) {
    const hoursRemaining = Math.max(0, (new Date(auctionEndDate) - new Date()) / (1000 * 60 * 60));

    if (hoursRemaining <= 1) {
      timeMultiplier = 1.0;
      timeScore = bids <= 2 ? 25 : bids <= 5 ? 15 : 5;
    } else if (hoursRemaining <= 6) {
      timeMultiplier = 0.75;
      timeScore = bids <= 3 ? 20 : bids <= 8 ? 10 : 3;
    } else if (hoursRemaining <= 24) {
      timeMultiplier = 0.45;
      timeScore = bids <= 2 ? 12 : 5;
    } else if (hoursRemaining <= 72) {
      timeMultiplier = 0.15;
      timeScore = 3;
    } else {
      timeMultiplier = 0.05;
      timeScore = 1;
    }
  }

  let score = timeScore;

  // 2. Bid competition signal (0-25 points, dampened by time)
  let bidScore = 0;
  if (bids === 0) {
    bidScore = 25;
  } else if (bids <= 2) {
    bidScore = 18;
  } else if (bids <= 5) {
    bidScore = 10;
  } else if (bids <= 10) {
    bidScore = 4;
  }
  score += Math.round(bidScore * timeMultiplier);

  // 3. Price gap signal (0-30 points, dampened by time)
  if (priceGapPercent !== null && priceGapPercent > 0) {
    const gapScore = Math.min(30, Math.round(priceGapPercent * 0.6));
    const confidenceMultiplier = Math.max(0.3, recencyScore / 100);
    score += Math.round(gapScore * confidenceMultiplier * timeMultiplier);
  }

  // 4. Typo bonus (0-20 points) — NOT dampened by time
  // Typo value persists regardless of time: fewer eyeballs = less competition at close
  if (hasTypo) {
    const confidence = typoConfidenceScore || 70;
    score += Math.round(10 + (confidence / 100) * 10);
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Generate human-readable deal summary.
 */
export function getDealSummary({ hasTypo, typoDetails, priceGapPercent, recencyScore, sampleSize, buyingOption, bidCount, auctionEndDate }) {
  const parts = [];

  if (buyingOption === 'AUCTION') {
    parts.push('Auction');
    if (auctionEndDate) {
      const hoursRemaining = Math.max(0, (new Date(auctionEndDate) - new Date()) / (1000 * 60 * 60));
      if (hoursRemaining <= 1) parts.push('Ending soon!');
      else if (hoursRemaining <= 6) parts.push(`${Math.round(hoursRemaining)}h left`);
      else if (hoursRemaining <= 24) parts.push(`${Math.round(hoursRemaining)}h left`);
      else parts.push(`${Math.round(hoursRemaining / 24)}d left`);
    }
    if (bidCount !== null && bidCount !== undefined) {
      parts.push(`${bidCount} bid${bidCount !== 1 ? 's' : ''}`);
    }
  }

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
