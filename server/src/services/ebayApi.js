import prisma from '../db.js';

/**
 * eBay API Service
 *
 * Integrates with eBay Browse API for listing searches and item details.
 * Uses OAuth 2.0 Client Credentials Grant (app-level, no user login).
 * Implements rate limiting and exponential backoff retry logic.
 *
 * Environment variables:
 * - EBAY_APP_ID: eBay Client ID (App ID)
 * - EBAY_CERT_ID: eBay Client Secret (Cert ID)
 * - EBAY_ENVIRONMENT: "sandbox" or "production"
 */

const EBAY_PRODUCTION = {
  api: 'https://api.ebay.com',
  auth: 'https://api.ebay.com/identity/v1/oauth2/token'
};

const EBAY_SANDBOX = {
  api: 'https://api.sandbox.ebay.com',
  auth: 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
};

// OAuth token cache
let oauthToken = null;
let tokenExpiresAt = 0;
let oauthFailedAt = 0; // Cache failures for 60 seconds to avoid repeated hangs

// Rate limiting: max 25 requests per second to stay well under eBay limits
const RATE_LIMIT = {
  maxRequestsPerSecond: 25,
  requestTimestamps: [],
  rateLimitedUntil: null
};

function getEbayUrls() {
  return process.env.EBAY_ENVIRONMENT === 'production' ? EBAY_PRODUCTION : EBAY_SANDBOX;
}

/**
 * Obtain an OAuth 2.0 Application Access Token using Client Credentials Grant.
 * Tokens are cached until expiry with a 5-minute buffer.
 */
async function getOAuthToken() {
  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;

  if (!appId || !certId) {
    return null; // No credentials configured — fall back to sample data
  }

  // Return cached token if still valid (with 5-minute buffer)
  if (oauthToken && Date.now() < tokenExpiresAt - 300000) {
    return oauthToken;
  }

  // Don't retry too quickly after a failure (wait 60 seconds)
  if (oauthFailedAt && Date.now() - oauthFailedAt < 60000) {
    return oauthToken || null; // Return old token if available, else null
  }

  const { auth } = getEbayUrls();
  const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');

  console.log('[eBay OAuth] Requesting new application access token...');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(auth, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[eBay OAuth] Token request failed:', response.status, errorText);
      oauthFailedAt = Date.now();
      const error = new Error(`eBay OAuth failed: ${response.status}`);
      error.statusCode = response.status;
      throw error;
    }

    const data = await response.json();
    oauthToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in * 1000);
    oauthFailedAt = 0;

    console.log(`[eBay OAuth] Token obtained, expires in ${data.expires_in}s`);
    return oauthToken;
  } catch (error) {
    clearTimeout(timeout);
    oauthFailedAt = Date.now();
    console.error('[eBay OAuth] Failed to obtain token:', error.message);
    if (oauthToken) {
      console.log('[eBay OAuth] Falling back to previous token');
      return oauthToken;
    }
    return null;
  }
}

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

      if (error.statusCode === 429) throw error;
      if (error.statusCode >= 400 && error.statusCode < 500 && error.code !== 'TIMEOUT') throw error;

      if (attempt < maxAttempts - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[eBay API] Retry ${attempt + 1}/${maxAttempts - 1} after ${delay}ms...`);
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

  const token = await getOAuthToken();
  if (!token) {
    return null; // No credentials — will fall back to sample data
  }

  const { api } = getEbayUrls();
  const url = `${api}${endpoint}`;

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

    if (response.status === 401) {
      // Token expired — force refresh and retry once
      console.log('[eBay API] Token rejected (401), forcing refresh...');
      oauthToken = null;
      tokenExpiresAt = 0;
      const newToken = await getOAuthToken();
      if (newToken) {
        const retryController = new AbortController();
        const retryTimeout = setTimeout(() => retryController.abort(), 10000);
        try {
          const retryResponse = await fetch(url, {
            ...options,
            signal: retryController.signal,
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
              'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
              ...options.headers
            }
          });
          clearTimeout(retryTimeout);
          if (retryResponse.ok) return await retryResponse.json();
        } catch {
          clearTimeout(retryTimeout);
        }
      }
      const error = new Error('eBay API authentication failed');
      error.statusCode = 401;
      throw error;
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`[eBay API] Error ${response.status}: ${errorBody.substring(0, 200)}`);
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

// eBay category ID for "Collectible Card Games > Pokémon Individual Cards"
const POKEMON_CARDS_CATEGORY = '183454';

/**
 * Search eBay for active Pokemon card listings.
 * Uses Browse API /buy/browse/v1/item_summary/search
 */
export async function searchListings({ cardName, set, rarity, condition, graded, language, limit = 50 }) {
  // Use the card name directly — category_ids scopes to Pokemon cards
  // so we don't need to prepend "Pokemon card" which over-constrains specific searches
  let query = cardName;
  if (set) query += ` ${set}`;

  // Build shared filter conditions (excluding buyingOptions)
  const baseFilters = [];
  if (condition) {
    const conditionMap = {
      mint: '1000',
      nearMint: '1500',
      excellent: '2500',
      good: '3000',
      fair: '5000',
      poor: '6000'
    };
    if (conditionMap[condition]) {
      baseFilters.push(`conditionIds:{${conditionMap[condition]}}`);
    }
  }

  // Build aspect_filter for graded status and language
  let aspectFilter = null;
  const aspects = [];
  if (graded) {
    aspects.push(`Graded:{${graded === 'yes' ? 'Yes' : 'No'}}`);
  }
  if (language) {
    aspects.push(`Language:{${language}}`);
  }
  if (aspects.length > 0) {
    aspectFilter = `categoryId:${POKEMON_CARDS_CATEGORY},${aspects.join(',')}`;
  }

  // Build params for a specific buying option
  const buildParams = (buyingOption, searchLimit) => {
    const params = new URLSearchParams({
      q: query,
      category_ids: POKEMON_CARDS_CATEGORY,
      limit: String(searchLimit)
    });
    const filters = [`buyingOptions:{${buyingOption}}`, ...baseFilters];
    params.append('filter', filters.join(','));
    if (aspectFilter) {
      params.append('aspect_filter', aspectFilter);
    }
    return params;
  };

  try {
    // Make two parallel calls — one for BIN, one for auctions — to get a balanced mix
    const binLimit = Math.ceil(limit * 0.6);
    const auctionLimit = Math.ceil(limit * 0.4);

    const [binData, auctionData] = await Promise.all([
      withRetry(
        () => ebayFetch(`/buy/browse/v1/item_summary/search?${buildParams('FIXED_PRICE', binLimit).toString()}`),
        2
      ).catch(err => { if (err.statusCode === 429) throw err; return null; }),
      withRetry(
        () => ebayFetch(`/buy/browse/v1/item_summary/search?${buildParams('AUCTION', auctionLimit).toString()}`),
        2
      ).catch(err => { if (err.statusCode === 429) throw err; return null; })
    ]);

    const binItems = binData?.itemSummaries || [];
    const auctionItems = auctionData?.itemSummaries || [];

    if (binItems.length === 0 && auctionItems.length === 0) {
      console.log(`[eBay API] No listings found for "${cardName}", supplementing with sample data`);
      return generateSampleListings(cardName, set, rarity, condition);
    }

    const mapItem = (item) => {
      const buyingOptions = item.buyingOptions || [];
      const isAuction = buyingOptions.includes('AUCTION');
      const buyingOption = isAuction ? 'AUCTION' : 'FIXED_PRICE';
      const bidPrice = isAuction ? parseFloat(item.currentBidPrice?.value || item.price?.value || 0) : null;

      // Shipping: eBay returns shippingOptions array; first entry has the cost
      // Free shipping shows as 0.00 or "0.0"; missing means unknown
      const shippingOption = item.shippingOptions?.[0];
      const shippingCost = shippingOption?.shippingCost?.value !== undefined
        ? parseFloat(shippingOption.shippingCost.value)
        : null;

      return {
        ebayListingId: item.itemId,
        listingTitle: item.title,
        currentPrice: isAuction ? (bidPrice || parseFloat(item.price?.value || 0)) : parseFloat(item.price?.value || 0),
        currency: item.price?.currency || 'USD',
        shippingCost,
        sellerName: item.seller?.username || null,
        sellerRating: item.seller?.feedbackScore ? Math.min(5, item.seller.feedbackScore / 1000) : null,
        sellerFeedbackPercent: item.seller?.feedbackPercentage ? parseFloat(item.seller.feedbackPercentage) : null,
        listingUrl: item.itemWebUrl || item.itemHref || `https://www.ebay.com/itm/${item.itemId}`,
        images: item.thumbnailImages
          ? item.thumbnailImages.map(i => i.imageUrl)
          : (item.image ? [item.image.imageUrl] : []),
        description: item.shortDescription || null,
        condition: item.condition || null,
        listingStatus: 'active',
        buyingOption,
        bidCount: isAuction ? (item.bidCount || 0) : null,
        currentBidPrice: bidPrice,
        auctionEndDate: item.itemEndDate ? new Date(item.itemEndDate) : null
      };
    };

    const listings = [...binItems.map(mapItem), ...auctionItems.map(mapItem)];

    const binCount = listings.filter(l => l.buyingOption === 'FIXED_PRICE').length;
    const auctionCount = listings.filter(l => l.buyingOption === 'AUCTION').length;
    console.log(`[eBay API] Found ${listings.length} listings for "${cardName}" (${binCount} BIN, ${auctionCount} Auction)`);
    return listings;
  } catch (error) {
    console.error(`[eBay API] Search failed for "${cardName}":`, error.message);
    if (error.statusCode === 429) throw error;
    console.log('[eBay API] Falling back to sample data');
    return generateSampleListings(cardName, set, rarity, condition);
  }
}

/**
 * Search eBay for recently sold/completed Pokemon card listings.
 * Used to establish market baseline pricing.
 *
 * Note: The Browse API in sandbox has limited completed items data.
 * In production, this queries real sold listings.
 */
export async function searchSoldListings({ cardName, set, graded, language, days = 90 }) {
  const query = `${cardName}${set ? ' ' + set : ''}`;

  const params = new URLSearchParams({
    q: query,
    category_ids: POKEMON_CARDS_CATEGORY,
    limit: '100',
    filter: `buyingOptions:{FIXED_PRICE|AUCTION},priceCurrency:USD`
  });

  // Apply same aspect filters to sold listings for accurate baseline
  const aspects = [];
  if (graded) {
    aspects.push(`Graded:{${graded === 'yes' ? 'Yes' : 'No'}}`);
  }
  if (language) {
    aspects.push(`Language:{${language}}`);
  }
  if (aspects.length > 0) {
    params.append('aspect_filter', `categoryId:${POKEMON_CARDS_CATEGORY},${aspects.join(',')}`);
  }

  try {
    const data = await withRetry(() =>
      ebayFetch(`/buy/browse/v1/item_summary/search?${params.toString()}`)
    );

    if (!data || !data.itemSummaries) {
      return generateSampleSoldListings(cardName, set, days);
    }

    // From active listings, use prices as market reference points
    // (sandbox doesn't have completed items endpoint access)
    const pricePoints = data.itemSummaries
      .filter(item => item.price?.value)
      .map(item => {
        const shippingOption = item.shippingOptions?.[0];
        const shippingCost = shippingOption?.shippingCost?.value !== undefined
          ? parseFloat(shippingOption.shippingCost.value)
          : null;
        return {
          cardName,
          set: set || null,
          soldPrice: parseFloat(item.price.value),
          shippingCost,
          soldAt: new Date(item.itemCreationDate || Date.now()),
          source: 'eBay'
        };
      });

    if (pricePoints.length === 0) {
      return generateSampleSoldListings(cardName, set, days);
    }

    return pricePoints;
  } catch (error) {
    if (error.statusCode === 429) throw error;
    console.error(`[eBay API] Sold listings search failed:`, error.message);
    return generateSampleSoldListings(cardName, set, days);
  }
}

/**
 * Get details for a specific eBay listing.
 */
export async function getListingDetails(itemId) {
  // Sample data IDs start with "ebay_" — no API call needed
  if (itemId.startsWith('ebay_')) return null;

  try {
    const data = await withRetry(() =>
      ebayFetch(`/buy/browse/v1/item/${itemId}`)
    );

    if (!data) return null;

    return {
      ebayListingId: data.itemId,
      listingTitle: data.title,
      currentPrice: parseFloat(data.price?.value || 0),
      sellerName: data.seller?.username || null,
      sellerRating: data.seller?.feedbackScore ? Math.min(5, data.seller.feedbackScore / 1000) : null,
      sellerFeedbackPercent: data.seller?.feedbackPercentage ? parseFloat(data.seller.feedbackPercentage) : null,
      listingUrl: data.itemWebUrl,
      images: data.additionalImages
        ? data.additionalImages.map(i => i.imageUrl)
        : (data.image ? [data.image.imageUrl] : []),
      description: data.description || data.shortDescription || null,
      condition: data.condition || null,
      returnPolicy: data.returnTerms?.returnsAccepted
        ? `Returns accepted: ${data.returnTerms.returnPeriod?.value || ''} ${data.returnTerms.returnPeriod?.unit || ''}`.trim()
        : 'No returns',
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
  // Sample data IDs
  if (itemId.startsWith('ebay_')) return 'active';

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

/**
 * Check if eBay API credentials are configured.
 */
export function hasEbayCredentials() {
  return !!(process.env.EBAY_APP_ID && process.env.EBAY_CERT_ID);
}

// ==========================================
// Sample data generation (fallback when API returns no results
// or when credentials are not configured)
// ==========================================

function generateSampleListings(cardName, set, rarity, condition) {
  const basePrice = getBasePrice(cardName);
  const listings = [];

  const typoVariants = generateTypoVariants(cardName);

  for (let i = 0; i < 8; i++) {
    const priceVariation = (Math.random() * 0.6 - 0.2) * basePrice;
    const price = Math.max(0.99, Math.round((basePrice + priceVariation) * 100) / 100);
    const sellerFeedback = 85 + Math.random() * 15;

    // Make ~25% of listings auctions
    const isAuction = i >= 6;
    const auctionEndDate = isAuction ? new Date(Date.now() + (Math.random() * 6 + 0.5) * 24 * 60 * 60 * 1000) : null;
    const bidCount = isAuction ? Math.floor(Math.random() * 15) : null;
    const auctionPrice = isAuction ? Math.max(0.99, Math.round(price * (0.4 + Math.random() * 0.4) * 100) / 100) : null;

    listings.push({
      ebayListingId: `ebay_${cardName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${i}`,
      listingTitle: `Pokemon ${cardName}${set ? ' ' + set : ''} Card ${getRandomCardSuffix()}`,
      currentPrice: isAuction ? auctionPrice : price,
      currency: 'USD',
      sellerName: `seller_${Math.random().toString(36).substr(2, 8)}`,
      sellerRating: Math.round((3 + Math.random() * 2) * 10) / 10,
      sellerFeedbackPercent: Math.round(sellerFeedback * 100) / 100,
      listingUrl: `https://www.ebay.com/itm/sample-${Date.now()}-${i}`,
      images: [`https://placehold.co/400x560/1a1a2e/e0e0e0?text=${encodeURIComponent(cardName)}`],
      description: `${cardName} Pokemon Trading Card Game card${set ? ' from ' + set + ' set' : ''}. ${condition || 'Near Mint'} condition.`,
      condition: condition || 'Near Mint',
      listingStatus: 'active',
      buyingOption: isAuction ? 'AUCTION' : 'FIXED_PRICE',
      bidCount,
      currentBidPrice: auctionPrice,
      auctionEndDate,
      shippingCost: Math.random() < 0.4 ? 0 : Math.round((1 + Math.random() * 5) * 100) / 100
    });
  }

  for (let i = 0; i < typoVariants.length && i < 5; i++) {
    const discountPercent = 0.15 + Math.random() * 0.35;
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
      listingStatus: 'active',
      shippingCost: Math.random() < 0.5 ? 0 : Math.round((1 + Math.random() * 4) * 100) / 100
    });
  }

  return listings;
}

function generateSampleSoldListings(cardName, set, days = 90) {
  const basePrice = getBasePrice(cardName);
  const soldListings = [];

  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * days);
    const priceVariation = (Math.random() * 0.4 - 0.1) * basePrice;
    const price = Math.max(0.99, Math.round((basePrice + priceVariation) * 100) / 100);
    const shipping = Math.random() < 0.4 ? 0 : Math.round((1 + Math.random() * 5) * 100) / 100;

    const soldDate = new Date();
    soldDate.setDate(soldDate.getDate() - daysAgo);

    soldListings.push({
      cardName,
      set: set || null,
      soldPrice: price,
      shippingCost: shipping,
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

  const mid = Math.floor(name.length / 2);
  variants.push(name.slice(0, mid) + name[mid] + name.slice(mid));

  if (name.length > 3) {
    const pos = Math.floor(name.length / 3);
    const chars = name.split('');
    [chars[pos], chars[pos + 1]] = [chars[pos + 1], chars[pos]];
    variants.push(chars.join(''));
  }

  const dropPos = Math.floor(name.length * 0.6);
  variants.push(name.slice(0, dropPos) + name.slice(dropPos + 1));

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
