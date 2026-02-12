import prisma from '../db.js';

/**
 * eBay API Service
 *
 * Integrates with eBay Browse API and Finding API for listing searches and sold items.
 * Uses app-level OAuth credentials (no user login required).
 * Implements rate limiting and exponential backoff retry logic.
 *
 * Environment variables:
 * - EBAY_APP_ID: eBay application ID
 * - EBAY_CERT_ID: eBay certificate ID
 * - EBAY_OAUTH_TOKEN: OAuth app token
 */

const EBAY_API_BASE = 'https://api.ebay.com';
const EBAY_SANDBOX_BASE = 'https://api.sandbox.ebay.com';

// Rate limiting: max 25 requests per second to stay well under eBay limits
const RATE_LIMIT = {
  maxRequestsPerSecond: 25,
  requestTimestamps: [],
  rateLimitedUntil: null
};

/**
 * Check if we're currently rate limited.
 */
function isRateLimited() {
  if (RATE_LIMIT.rateLimitedUntil) {
    if (Date.now() < RATE_LIMIT.rateLimitedUntil) {
      return {
        limited: true,
        retryAfterMs: RATE_LIMIT.rateLimitedUntil - Date.now()
      };
    }
    RATE_LIMIT.rateLimitedUntil = null;
  }

  // Clean old timestamps (older than 1 second)
  const now = Date.now();
  RATE_LIMIT.requestTimestamps = RATE_LIMIT.requestTimestamps.filter(t => now - t < 1000);

  if (RATE_LIMIT.requestTimestamps.length >= RATE_LIMIT.maxRequestsPerSecond) {
    return { limited: true, retryAfterMs: 1000 };
  }

  return { limited: false };
}

function recordRequest() {
  RATE_LIMIT.requestTimestamps.push(Date.now());
}

/**
 * Handle rate limit response from eBay.
 */
function handleRateLimitResponse(retryAfterSeconds) {
  const retryAfterMs = (retryAfterSeconds || 60) * 1000;
  RATE_LIMIT.rateLimitedUntil = Date.now() + retryAfterMs;
  return retryAfterMs;
}

/**
 * Exponential backoff retry logic.
 * Delays: 1s, 2s, 4s, 8s, 16s
 */
async function withRetry(fn, maxAttempts = 5) {
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on rate limit - that's handled separately
      if (error.statusCode === 429) {
        throw error;
      }

      // Don't retry on client errors (400-499) except timeout
      if (error.statusCode >= 400 && error.statusCode < 500 && error.code !== 'TIMEOUT') {
        throw error;
      }

      if (attempt < maxAttempts - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s, 16s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Make an authenticated eBay API request.
 */
async function ebayFetch(endpoint, options = {}) {
  const rateLimitStatus = isRateLimited();
  if (rateLimitStatus.limited) {
    const error = new Error('Rate limited');
    error.statusCode = 429;
    error.retryAfterMs = rateLimitStatus.retryAfterMs;
    throw error;
  }

  const token = process.env.EBAY_OAUTH_TOKEN;
  if (!token) {
    // Return simulated results when no API key is configured
    return null;
  }

  const baseUrl = process.env.NODE_ENV === 'development' && process.env.EBAY_USE_SANDBOX === 'true'
    ? EBAY_SANDBOX_BASE
    : EBAY_API_BASE;

  const url = `${baseUrl}${endpoint}`;

  recordRequest();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        ...options.headers
      }
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const retryMs = handleRateLimitResponse(retryAfter ? parseInt(retryAfter) : 60);
      const error = new Error('eBay API rate limited');
      error.statusCode = 429;
      error.retryAfterMs = retryMs;
      throw error;
    }

    if (!response.ok) {
      const error = new Error(`eBay API error: ${response.status}`);
      error.statusCode = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const timeoutError = new Error('eBay API request timed out');
      timeoutError.code = 'TIMEOUT';
      timeoutError.statusCode = 408;
      throw timeoutError;
    }
    throw error;
  }
}

/**
 * Search eBay for active Pokemon card listings.
 * Uses Browse API /buy/browse/v1/item_summary/search
 */
export async function searchListings({ cardName, set, rarity, condition, limit = 50 }) {
  // Build search query
  let query = `Pokemon card ${cardName}`;
  if (set) query += ` ${set}`;

  // Also search for common misspellings to find typo listings
  const params = new URLSearchParams({
    q: query,
    category_ids: '183454', // Pokémon Individual Cards category
    limit: String(Math.min(limit, 200)),
    sort: 'newlyListed'
  });

  if (condition) {
    const conditionMap = {
      mint: '1000',        // New
      nearMint: '1500',    // Open box
      excellent: '2500',   // Seller refurbished
      good: '3000',        // Used
      fair: '5000',        // Good
      poor: '6000'         // Acceptable
    };
    if (conditionMap[condition]) {
      params.append('filter', `conditionIds:{${conditionMap[condition]}}`);
    }
  }

  try {
    const data = await withRetry(() =>
      ebayFetch(`/buy/browse/v1/item_summary/search?${params.toString()}`)
    );

    if (!data) {
      // No API key configured — generate realistic sample listings
      return generateSampleListings(cardName, set, rarity, condition);
    }

    if (!data.itemSummaries || data.itemSummaries.length === 0) {
      return [];
    }

    return data.itemSummaries.map(item => ({
      ebayListingId: item.itemId,
      listingTitle: item.title,
      currentPrice: parseFloat(item.price?.value || 0),
      currency: item.price?.currency || 'USD',
      sellerName: item.seller?.username || null,
      sellerRating: item.seller?.feedbackScore ? Math.min(5, item.seller.feedbackScore / 1000) : null,
      sellerFeedbackPercent: item.seller?.feedbackPercentage ? parseFloat(item.seller.feedbackPercentage) : null,
      listingUrl: item.itemWebUrl || `https://www.ebay.com/itm/${item.itemId}`,
      images: item.thumbnailImages ? item.thumbnailImages.map(i => i.imageUrl) : (item.image ? [item.image.imageUrl] : []),
      description: item.shortDescription || null,
      condition: item.condition || null,
      listingStatus: 'active'
    }));
  } catch (error) {
    if (error.statusCode === 429) throw error;
    throw error;
  }
}

/**
 * Search eBay for recently sold/completed Pokemon card listings.
 * Used to establish market baseline pricing.
 */
export async function searchSoldListings({ cardName, set, days = 90 }) {
  const query = `Pokemon card ${cardName}${set ? ' ' + set : ''}`;

  const params = new URLSearchParams({
    q: query,
    category_ids: '183454',
    limit: '100',
    filter: `buyingOptions:{FIXED_PRICE|AUCTION},priceCurrency:USD`
  });

  try {
    // Using Browse API completed items (requires specific endpoint or filter)
    const data = await withRetry(() =>
      ebayFetch(`/buy/browse/v1/item_summary/search?${params.toString()}&filter=conditions:{NEW|USED}`)
    );

    if (!data) {
      // No API key — generate sample sold data
      return generateSampleSoldListings(cardName, set, days);
    }

    if (!data.itemSummaries) return [];

    const soldItems = data.itemSummaries
      .filter(item => item.itemEndDate) // completed listings
      .map(item => ({
        cardName,
        set: set || null,
        soldPrice: parseFloat(item.price?.value || 0),
        soldAt: new Date(item.itemEndDate),
        source: 'eBay'
      }));

    return soldItems;
  } catch (error) {
    if (error.statusCode === 429) throw error;
    throw error;
  }
}

/**
 * Get details for a specific eBay listing.
 */
export async function getListingDetails(itemId) {
  try {
    const data = await withRetry(() =>
      ebayFetch(`/buy/browse/v1/item/${itemId}`)
    );

    if (!data) {
      return null;
    }

    return {
      ebayListingId: data.itemId,
      listingTitle: data.title,
      currentPrice: parseFloat(data.price?.value || 0),
      sellerName: data.seller?.username || null,
      sellerRating: data.seller?.feedbackScore ? Math.min(5, data.seller.feedbackScore / 1000) : null,
      sellerFeedbackPercent: data.seller?.feedbackPercentage ? parseFloat(data.seller.feedbackPercentage) : null,
      listingUrl: data.itemWebUrl,
      images: data.additionalImages ? data.additionalImages.map(i => i.imageUrl) : (data.image ? [data.image.imageUrl] : []),
      description: data.description || data.shortDescription || null,
      condition: data.condition || null,
      returnPolicy: data.returnTerms?.returnsAccepted ? `Returns accepted: ${data.returnTerms.returnPeriod?.value || ''} ${data.returnTerms.returnPeriod?.unit || ''}`.trim() : 'No returns',
      listingStatus: data.itemEndDate ? 'sold' : 'active'
    };
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

/**
 * Check if a listing is still active.
 */
export async function checkListingStatus(itemId) {
  try {
    const details = await getListingDetails(itemId);
    if (!details) return 'delisted';
    return details.listingStatus;
  } catch (error) {
    if (error.statusCode === 404) return 'delisted';
    throw error;
  }
}

/**
 * Get rate limit status for the frontend to display.
 */
export function getRateLimitStatus() {
  const status = isRateLimited();
  return {
    isLimited: status.limited,
    retryAfterMs: status.retryAfterMs || 0,
    retryAt: status.limited ? new Date(Date.now() + (status.retryAfterMs || 0)).toISOString() : null
  };
}

// ==========================================
// Sample data generation (when no eBay API key is configured)
// This enables the app to be fully functional for development/demo.
// ==========================================

function generateSampleListings(cardName, set, rarity, condition) {
  const basePrice = getBasePrice(cardName);
  const listings = [];

  // Generate typo variants
  const typoVariants = generateTypoVariants(cardName);

  // Generate normal listings
  for (let i = 0; i < 8; i++) {
    const priceVariation = (Math.random() * 0.6 - 0.2) * basePrice; // -20% to +40%
    const price = Math.max(0.99, Math.round((basePrice + priceVariation) * 100) / 100);
    const sellerFeedback = 85 + Math.random() * 15;

    listings.push({
      ebayListingId: `ebay_${cardName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${i}`,
      listingTitle: `Pokemon ${cardName}${set ? ' ' + set : ''} Card ${getRandomCardSuffix()}`,
      currentPrice: price,
      currency: 'USD',
      sellerName: `seller_${Math.random().toString(36).substr(2, 8)}`,
      sellerRating: Math.round((3 + Math.random() * 2) * 10) / 10,
      sellerFeedbackPercent: Math.round(sellerFeedback * 100) / 100,
      listingUrl: `https://www.ebay.com/itm/sample-${Date.now()}-${i}`,
      images: [`https://placehold.co/400x560/1a1a2e/e0e0e0?text=${encodeURIComponent(cardName)}`],
      description: `${cardName} Pokemon Trading Card Game card${set ? ' from ' + set + ' set' : ''}. ${condition || 'Near Mint'} condition.`,
      condition: condition || 'Near Mint',
      listingStatus: 'active'
    });
  }

  // Generate typo listings (lower prices to simulate arbitrage)
  for (let i = 0; i < typoVariants.length && i < 5; i++) {
    const discountPercent = 0.15 + Math.random() * 0.35; // 15-50% discount
    const price = Math.max(0.99, Math.round(basePrice * (1 - discountPercent) * 100) / 100);
    const sellerFeedback = 80 + Math.random() * 18;

    listings.push({
      ebayListingId: `ebay_typo_${cardName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${i}`,
      listingTitle: `Pokemon ${typoVariants[i]}${set ? ' ' + set : ''} Card ${getRandomCardSuffix()}`,
      currentPrice: price,
      currency: 'USD',
      sellerName: `seller_${Math.random().toString(36).substr(2, 8)}`,
      sellerRating: Math.round((2.5 + Math.random() * 2.5) * 10) / 10,
      sellerFeedbackPercent: Math.round(sellerFeedback * 100) / 100,
      listingUrl: `https://www.ebay.com/itm/sample-typo-${Date.now()}-${i}`,
      images: [`https://placehold.co/400x560/2d1b4e/e0e0e0?text=${encodeURIComponent(typoVariants[i])}`],
      description: `${typoVariants[i]} Pokemon card${set ? ' from ' + set : ''}. ${condition || 'Good'} condition. Selling from personal collection.`,
      condition: condition || 'Good',
      listingStatus: 'active'
    });
  }

  return listings;
}

function generateSampleSoldListings(cardName, set, days = 90) {
  const basePrice = getBasePrice(cardName);
  const soldListings = [];

  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * days);
    const priceVariation = (Math.random() * 0.4 - 0.1) * basePrice; // -10% to +30%
    const price = Math.max(0.99, Math.round((basePrice + priceVariation) * 100) / 100);

    const soldDate = new Date();
    soldDate.setDate(soldDate.getDate() - daysAgo);

    soldListings.push({
      cardName,
      set: set || null,
      soldPrice: price,
      soldAt: soldDate,
      daysOld: daysAgo,
      source: 'eBay'
    });
  }

  return soldListings;
}

function getBasePrice(cardName) {
  const priceMap = {
    'charizard': 85, 'pikachu': 25, 'mewtwo': 45, 'blastoise': 55,
    'venusaur': 40, 'lugia': 120, 'rayquaza': 95, 'umbreon': 70,
    'espeon': 50, 'gengar': 35, 'dragonite': 60, 'gyarados': 30,
    'alakazam': 25, 'eevee': 15, 'snorlax': 20, 'mew': 65,
    'garchomp': 28, 'lucario': 32, 'sylveon': 45, 'greninja': 22,
    'mimikyu': 18, 'arceus': 75, 'darkrai': 55, 'giratina': 48
  };
  return priceMap[cardName.toLowerCase()] || 30 + Math.random() * 70;
}

function generateTypoVariants(cardName) {
  const name = cardName;
  const variants = [];

  if (name.length < 3) return [name + name[name.length - 1]];

  // Double a letter
  const mid = Math.floor(name.length / 2);
  variants.push(name.slice(0, mid) + name[mid] + name.slice(mid));

  // Swap two adjacent letters
  if (name.length > 3) {
    const pos = Math.floor(name.length / 3);
    const chars = name.split('');
    [chars[pos], chars[pos + 1]] = [chars[pos + 1], chars[pos]];
    variants.push(chars.join(''));
  }

  // Drop a letter
  const dropPos = Math.floor(name.length * 0.6);
  variants.push(name.slice(0, dropPos) + name.slice(dropPos + 1));

  // Replace a letter
  const replacePos = Math.floor(name.length * 0.4);
  const replacement = name[replacePos] === 'a' ? 'e' : 'a';
  variants.push(name.slice(0, replacePos) + replacement + name.slice(replacePos + 1));

  return variants;
}

function getRandomCardSuffix() {
  const suffixes = [
    'Holo Rare', 'GX', 'EX', 'V', 'VMAX', 'VSTAR', 'Full Art',
    'Secret Rare', 'Ultra Rare', 'Rainbow Rare', 'Gold', 'Promo',
    'Reverse Holo', 'Base Set', '1st Edition', 'Shadowless',
    'Alt Art', 'Trainer Gallery', 'Illustration Rare'
  ];
  return suffixes[Math.floor(Math.random() * suffixes.length)];
}
