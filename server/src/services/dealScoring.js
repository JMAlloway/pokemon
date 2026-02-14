/**
 * Deal Score Algorithm
 *
 * Price gap (below/above market) is the PRIMARY signal — a listing priced
 * above market is capped at a low score regardless of other factors.
 *
 * BIN:     Price gap (up to 60 pts) + Typo (up to 40 pts)
 * Auction: Price gap (up to 50 pts, time-dampened) + Time/bids (up to 20 pts) + Typo (up to 15 pts)
 *
 * Above-market cap: listings priced above market have their score hard-capped
 * so that good timing or typos alone can never produce a high deal score.
 */

/**
 * Detect price outliers using the IQR (Interquartile Range) method.
 * Returns the input array with an `isOutlier` flag added to each item.
 *
 * Only uses listings where shipping cost is known for IQR bounds
 * calculation, since mixing item-only prices with item+shipping totals
 * skews the distribution and can flag legitimate prices as outliers.
 * Listings with unknown shipping are never marked as outliers (they'll
 * be handled separately in baseline calculation).
 *
 * @param {Array} listings - Array of objects with soldPrice and optional shippingCost
 * @param {number} multiplier - IQR multiplier (default 1.5, use 2.0 for less aggressive filtering)
 * @returns {Array} Same array with `isOutlier: boolean` added to each item
 */
export function flagPriceOutliers(listings, multiplier = 1.5) {
  if (!listings || listings.length < 4) {
    return listings.map(l => ({ ...l, isOutlier: false }));
  }

  const totalPrice = l => Number(l.soldPrice) + (l.shippingCost != null ? Number(l.shippingCost) : 0);

  // Only use listings with known shipping for IQR bounds
  const withShipping = listings.filter(l => l.shippingCost != null);
  if (withShipping.length < 4) {
    // Not enough data with known shipping — fall back to all items using item price only
    const itemPrices = listings.map(l => Number(l.soldPrice)).sort((a, b) => a - b);
    const q1 = itemPrices[Math.floor(itemPrices.length * 0.25)];
    const q3 = itemPrices[Math.floor(itemPrices.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;
    return listings.map(l => ({
      ...l,
      isOutlier: Number(l.soldPrice) < lowerBound || Number(l.soldPrice) > upperBound
    }));
  }

  const prices = withShipping.map(totalPrice).sort((a, b) => a - b);
  const q1 = prices[Math.floor(prices.length * 0.25)];
  const q3 = prices[Math.floor(prices.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  return listings.map(l => {
    if (l.shippingCost == null) {
      // Unknown shipping: can't reliably compare to total-price IQR bounds
      return { ...l, isOutlier: false };
    }
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
    // Use total price (item + shipping) when shipping is known
    const price = Number(listing.soldPrice)
      + (listing.shippingCost != null ? Number(listing.shippingCost) : 0);

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
 *   Primary signal: price gap percentage (up to 60 points)
 *   Secondary signal: typo presence (up to 40 points)
 *   Above-market listings are capped at a low score.
 *
 * For AUCTION:
 *   Primary signal: price gap percentage (up to 50 points)
 *   Secondary signals: time remaining, bid competition, typo
 *   Above-market listings are capped at a low score.
 *
 * @param {{ hasTypo: boolean, priceGapPercent: number|null, recencyScore: number, typoConfidenceScore: number|null, buyingOption: string, bidCount: number|null, auctionEndDate: string|Date|null }} params
 * @returns {number} Deal score 0-100
 */
export function calculateDealScore({ hasTypo, priceGapPercent, recencyScore = 50, typoConfidenceScore = null, buyingOption = 'FIXED_PRICE', bidCount = null, auctionEndDate = null }) {
  if (buyingOption === 'AUCTION') {
    return calculateAuctionDealScore({ hasTypo, priceGapPercent, recencyScore, typoConfidenceScore, bidCount, auctionEndDate });
  }

  let score = 0;

  // Price gap signal: 0-60 points (PRIMARY)
  if (priceGapPercent !== null && priceGapPercent > 0) {
    // Scale: 1% below = ~1.2 pts, capping at 60 pts around 50% gap
    const gapScore = Math.min(60, Math.round(priceGapPercent * 1.2));
    const confidenceMultiplier = Math.max(0.3, recencyScore / 100);
    score += Math.round(gapScore * confidenceMultiplier);
  }

  // Typo signal: 0-40 points
  if (hasTypo) {
    const confidence = typoConfidenceScore || 70;
    score += Math.round(25 + (confidence / 100) * 15);
  }

  // Above-market cap: good timing/typo can't make an overpriced listing a "deal"
  if (priceGapPercent !== null && priceGapPercent < 0) {
    const abovePercent = Math.abs(priceGapPercent);
    const cap = Math.max(5, Math.round(25 - abovePercent));
    score = Math.min(score, cap);
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate deal score for auction listings (0-100).
 *
 * Key insight: auction prices are only meaningful close to end time.
 * A $0.99 bid with 5 days left will almost certainly get bid up — snipers
 * wait until the final minutes. So we apply a time-decay multiplier that
 * dampens the price gap and bid signals for far-out auctions.
 *
 * PRIMARY signal: price gap (up to 50 pts) — below-market price is what
 * makes a deal. Above-market listings are capped at a low score regardless
 * of other signals.
 *
 * Secondary signals:
 * 1. Time remaining + bid competition (up to 20 pts combined)
 * 2. Typo bonus (up to 15 pts)
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
  let timeScore = 2;         // base time signal for far-out auctions

  if (auctionEndDate) {
    const hoursRemaining = Math.max(0, (new Date(auctionEndDate) - new Date()) / (1000 * 60 * 60));

    if (hoursRemaining <= 1) {
      timeMultiplier = 1.0;
      timeScore = bids <= 2 ? 12 : bids <= 5 ? 8 : 3;
    } else if (hoursRemaining <= 6) {
      timeMultiplier = 0.75;
      timeScore = bids <= 3 ? 10 : bids <= 8 ? 6 : 2;
    } else if (hoursRemaining <= 24) {
      timeMultiplier = 0.45;
      timeScore = bids <= 2 ? 7 : 3;
    } else if (hoursRemaining <= 72) {
      timeMultiplier = 0.15;
      timeScore = 2;
    } else {
      timeMultiplier = 0.05;
      timeScore = 1;
    }
  }

  let score = timeScore;

  // 2. Bid competition signal (0-8 points, dampened by time)
  let bidScore = 0;
  if (bids === 0) {
    bidScore = 8;
  } else if (bids <= 2) {
    bidScore = 5;
  } else if (bids <= 5) {
    bidScore = 3;
  } else if (bids <= 10) {
    bidScore = 1;
  }
  score += Math.round(bidScore * timeMultiplier);

  // 3. Price gap signal: 0-50 points (PRIMARY — dampened by time)
  if (priceGapPercent !== null && priceGapPercent > 0) {
    const gapScore = Math.min(50, Math.round(priceGapPercent));
    const confidenceMultiplier = Math.max(0.3, recencyScore / 100);
    score += Math.round(gapScore * confidenceMultiplier * timeMultiplier);
  }

  // 4. Typo bonus (0-15 points) — NOT dampened by time
  if (hasTypo) {
    const confidence = typoConfidenceScore || 70;
    score += Math.round(8 + (confidence / 100) * 7);
  }

  // Above-market cap: time/bids/typo alone can't make an overpriced listing a "deal"
  if (priceGapPercent !== null && priceGapPercent < 0) {
    const abovePercent = Math.abs(priceGapPercent);
    const cap = Math.max(5, Math.round(20 - abovePercent));
    score = Math.min(score, cap);
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Get a detailed breakdown of how the deal score was calculated.
 * Returns individual point components so the frontend can show "how we got here".
 */
export function getDealScoreBreakdown({ hasTypo, priceGapPercent, recencyScore = 50, typoConfidenceScore = null, buyingOption = 'FIXED_PRICE', bidCount = null, auctionEndDate = null, shippingCost = null }) {
  if (buyingOption === 'AUCTION') {
    return getAuctionBreakdown({ hasTypo, priceGapPercent, recencyScore, typoConfidenceScore, bidCount, auctionEndDate, shippingCost });
  }

  const components = [];
  let total = 0;

  // Price gap signal: 0-60 points (PRIMARY)
  if (priceGapPercent !== null && priceGapPercent > 0) {
    const gapScore = Math.min(60, Math.round(priceGapPercent * 1.2));
    const confidenceMultiplier = Math.max(0.3, recencyScore / 100);
    const pts = Math.round(gapScore * confidenceMultiplier);
    components.push({ label: 'Below market price', points: pts, max: 60, detail: `${priceGapPercent.toFixed(1)}% below × ${Math.round(confidenceMultiplier * 100)}% data confidence` });
    total += pts;
  } else if (shippingCost == null) {
    components.push({ label: 'Price gap', points: 0, max: 60, detail: 'Shipping unknown — can\'t compare to market' });
  } else if (priceGapPercent !== null && priceGapPercent <= 0) {
    components.push({ label: 'Above market price', points: 0, max: 60, detail: `${Math.abs(priceGapPercent).toFixed(1)}% above market (score capped)` });
  } else {
    components.push({ label: 'Price gap', points: 0, max: 60, detail: 'No market data available' });
  }

  // Typo signal: 0-40 points
  if (hasTypo) {
    const confidence = typoConfidenceScore || 70;
    const pts = Math.round(25 + (confidence / 100) * 15);
    components.push({ label: 'Misspelling detected', points: pts, max: 40, detail: `${Math.round(confidence)}% confidence` });
    total += pts;
  } else {
    components.push({ label: 'No misspelling', points: 0, max: 40, detail: 'Correctly listed' });
  }

  // Apply above-market cap
  if (priceGapPercent !== null && priceGapPercent < 0) {
    const abovePercent = Math.abs(priceGapPercent);
    const cap = Math.max(5, Math.round(25 - abovePercent));
    if (total > cap) {
      components.push({ label: 'Above-market cap', points: cap - total, max: 0, detail: `${abovePercent.toFixed(1)}% above market limits score` });
      total = cap;
    }
  }

  return { total: Math.min(100, Math.max(0, total)), max: 100, components };
}

function getAuctionBreakdown({ hasTypo, priceGapPercent, recencyScore = 50, typoConfidenceScore = null, bidCount = 0, auctionEndDate = null, shippingCost = null }) {
  const bids = bidCount || 0;
  const components = [];
  let total = 0;

  // Time-decay multiplier
  let timeMultiplier = 0.05;
  let timeScore = 2;
  let timeLabel = '3+ days out';

  if (auctionEndDate) {
    const hoursRemaining = Math.max(0, (new Date(auctionEndDate) - new Date()) / (1000 * 60 * 60));

    if (hoursRemaining <= 1) {
      timeMultiplier = 1.0;
      timeScore = bids <= 2 ? 12 : bids <= 5 ? 8 : 3;
      timeLabel = '< 1 hour left';
    } else if (hoursRemaining <= 6) {
      timeMultiplier = 0.75;
      timeScore = bids <= 3 ? 10 : bids <= 8 ? 6 : 2;
      timeLabel = `${Math.round(hoursRemaining)}h left`;
    } else if (hoursRemaining <= 24) {
      timeMultiplier = 0.45;
      timeScore = bids <= 2 ? 7 : 3;
      timeLabel = `${Math.round(hoursRemaining)}h left`;
    } else if (hoursRemaining <= 72) {
      timeMultiplier = 0.15;
      timeScore = 2;
      timeLabel = `${Math.round(hoursRemaining / 24)}d left`;
    } else {
      timeMultiplier = 0.05;
      timeScore = 1;
      timeLabel = `${Math.round(hoursRemaining / 24)}d left`;
    }
  }

  components.push({ label: 'Time remaining', points: timeScore, max: 12, detail: `${timeLabel} (×${timeMultiplier} multiplier on price signals)` });
  total += timeScore;

  // Bid competition (dampened by time)
  let bidScore = 0;
  if (bids === 0) bidScore = 8;
  else if (bids <= 2) bidScore = 5;
  else if (bids <= 5) bidScore = 3;
  else if (bids <= 10) bidScore = 1;
  const dampedBidScore = Math.round(bidScore * timeMultiplier);
  components.push({ label: 'Bid competition', points: dampedBidScore, max: 8, detail: `${bids} bid${bids !== 1 ? 's' : ''} (${bidScore} pts × ${timeMultiplier} time)` });
  total += dampedBidScore;

  // Price gap: 0-50 points (PRIMARY — dampened by time)
  if (priceGapPercent !== null && priceGapPercent > 0) {
    const gapScore = Math.min(50, Math.round(priceGapPercent));
    const confidenceMultiplier = Math.max(0.3, recencyScore / 100);
    const pts = Math.round(gapScore * confidenceMultiplier * timeMultiplier);
    components.push({ label: 'Below market price', points: pts, max: 50, detail: `${priceGapPercent.toFixed(1)}% below × ${Math.round(confidenceMultiplier * 100)}% confidence × ${timeMultiplier} time` });
    total += pts;
  } else if (shippingCost == null) {
    components.push({ label: 'Price gap', points: 0, max: 50, detail: 'Shipping unknown — can\'t compare to market' });
  } else {
    components.push({ label: 'Price gap', points: 0, max: 50, detail: priceGapPercent !== null ? `${Math.abs(priceGapPercent).toFixed(1)}% above market` : 'No market data' });
  }

  // Typo bonus: 0-15 points (NOT dampened by time)
  if (hasTypo) {
    const confidence = typoConfidenceScore || 70;
    const pts = Math.round(8 + (confidence / 100) * 7);
    components.push({ label: 'Misspelling detected', points: pts, max: 15, detail: `Less visibility = less competition` });
    total += pts;
  } else {
    components.push({ label: 'No misspelling', points: 0, max: 15 });
  }

  // Above-market cap: time/bids/typo alone can't make an overpriced listing a "deal"
  if (priceGapPercent !== null && priceGapPercent < 0) {
    const abovePercent = Math.abs(priceGapPercent);
    const cap = Math.max(5, Math.round(20 - abovePercent));
    if (total > cap) {
      components.push({ label: 'Above-market cap', points: cap - total, max: 0, detail: `${abovePercent.toFixed(1)}% above market limits score` });
      total = cap;
    }
  }

  return { total: Math.min(100, Math.max(0, total)), max: 100, components };
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
