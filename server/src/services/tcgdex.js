/**
 * TCGdex Pricing Service
 *
 * Free, no-auth API that provides TCGPlayer (USD) and Cardmarket (EUR) pricing.
 * Used as a fallback when pokemontcg.io is unavailable or missing card data.
 *
 * API: https://api.tcgdex.net/v2/en
 * Docs: https://tcgdex.dev
 */

const TCGDEX_BASE = 'https://api.tcgdex.net/v2/en';
const REQUEST_TIMEOUT_MS = 6000;

// Cache for set ID resolution (set name → tcgdex set ID)
let setsCache = null;
let setsCacheTimestamp = 0;
const SETS_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

// Cache for individual card pricing
const priceCache = new Map();
const PRICE_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const PRICE_CACHE_MAX_SIZE = 500;

function cachePut(cache, key, value, maxSize = PRICE_CACHE_MAX_SIZE) {
  if (cache.size >= maxSize) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}

/**
 * Fetch all TCGdex sets and cache them.
 * Returns array of { id, name, ... }
 */
async function fetchSets() {
  if (setsCache && Date.now() - setsCacheTimestamp < SETS_CACHE_TTL) {
    return setsCache;
  }

  const response = await fetch(`${TCGDEX_BASE}/sets`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`TCGdex sets endpoint returned ${response.status}`);
  }

  setsCache = await response.json();
  setsCacheTimestamp = Date.now();
  return setsCache;
}

/**
 * Resolve a set name to a TCGdex set ID.
 * TCGdex uses its own IDs (e.g. "sv08.5" for Prismatic Evolutions).
 */
async function resolveSetId(setName) {
  const sets = await fetchSets();
  const nameLower = setName.toLowerCase();

  // Exact name match
  const exact = sets.find(s => s.name?.toLowerCase() === nameLower);
  if (exact) return exact.id;

  // Contains match (e.g. "Phantasmal Flames" inside longer name)
  const contains = sets.find(s => s.name?.toLowerCase().includes(nameLower));
  if (contains) return contains.id;

  // Reverse contains (set name contains our search)
  const reverse = sets.find(s => nameLower.includes(s.name?.toLowerCase()));
  if (reverse) return reverse.id;

  return null;
}

/**
 * Fetch TCGdex pricing for a card.
 *
 * @param {{ cardName: string, set?: string, cardNumber?: string, rarity?: string }} opts
 * @returns {Promise<{ market: number, low: number, mid: number, high: number, updatedAt: string, variant: string, source: string } | null>}
 */
export async function fetchTcgdexPrice({ cardName, set, cardNumber, rarity }) {
  // Extract card number from cardName if not provided
  const numberMatch = (cardNumber || cardName).match(/(\d{1,3})\s*\/\s*\d{2,3}/);
  const number = numberMatch ? numberMatch[1].replace(/^0+/, '') : null;

  const cacheKey = `tcgdex_${cardName}_${set || ''}_${number || ''}`;
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
    return cached.data;
  }

  try {
    const result = await _fetchTcgdexPriceInner({ cardName, set, number, rarity });
    cachePut(priceCache, cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn(`[TCGdex] Price fetch failed:`, err.message);
    cachePut(priceCache, cacheKey, { data: null, timestamp: Date.now() });
    return null;
  }
}

async function _fetchTcgdexPriceInner({ cardName, set, number, rarity }) {
  // Step 1: Resolve the set ID
  let setId = null;
  if (set) {
    try {
      setId = await resolveSetId(set);
      if (setId) {
        console.log(`[TCGdex] Resolved set "${set}" → "${setId}"`);
      } else {
        console.log(`[TCGdex] Could not resolve set "${set}"`);
      }
    } catch (err) {
      console.warn(`[TCGdex] Set resolution failed:`, err.message);
    }
  }

  // Step 2: Try to fetch the specific card
  // Strategy: if we have setId + number, fetch directly; otherwise search
  const card = await findCard({ cardName, setId, number });
  if (!card) {
    console.log(`[TCGdex] No card found for "${cardName}"${set ? ` in ${set}` : ''}`);
    return null;
  }

  // Step 3: Extract pricing
  const pricing = card.pricing;
  if (!pricing) {
    console.log(`[TCGdex] Card found but no pricing data: ${card.name} (${card.set?.name || 'unknown set'})`);
    return null;
  }

  // Prefer TCGPlayer (USD), fall back to Cardmarket (EUR → approximate USD)
  if (pricing.tcgplayer) {
    const result = extractTcgPlayerPrice(pricing.tcgplayer, rarity);
    if (result) {
      console.log(`[TCGdex] TCGPlayer price for ${card.name}: $${result.market} (${result.variant}, updated ${result.updatedAt})`);
      return { ...result, source: 'tcgdex-tcgplayer' };
    }
  }

  if (pricing.cardmarket) {
    const result = extractCardmarketPrice(pricing.cardmarket, rarity);
    if (result) {
      console.log(`[TCGdex] Cardmarket price for ${card.name}: €${result.market} (~$${(result.market * 1.08).toFixed(2)}) (updated ${result.updatedAt})`);
      // Approximate EUR → USD conversion
      const usdRate = 1.08;
      return {
        market: Math.round(result.market * usdRate * 100) / 100,
        low: result.low ? Math.round(result.low * usdRate * 100) / 100 : null,
        mid: result.mid ? Math.round(result.mid * usdRate * 100) / 100 : null,
        high: result.high ? Math.round(result.high * usdRate * 100) / 100 : null,
        updatedAt: result.updatedAt,
        variant: result.variant,
        source: 'tcgdex-cardmarket'
      };
    }
  }

  console.log(`[TCGdex] Card has pricing object but no usable prices: ${card.name}`);
  return null;
}

/**
 * Find a card via TCGdex API.
 * Tries direct lookup first (setId + number), then search.
 */
async function findCard({ cardName, setId, number }) {
  // Direct lookup: /sets/{setId}/{number}
  if (setId && number) {
    try {
      const url = `${TCGDEX_BASE}/sets/${setId}/${number}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (response.ok) {
        const card = await response.json();
        if (card && card.name) {
          console.log(`[TCGdex] Direct lookup hit: ${card.name} #${number} in ${setId}`);
          return card;
        }
      }
    } catch (err) {
      console.warn(`[TCGdex] Direct lookup failed for ${setId}/${number}:`, err.message);
    }
  }

  // Also try with zero-padded number (TCGdex sometimes uses "001" format)
  if (setId && number) {
    const padded = number.padStart(3, '0');
    if (padded !== number) {
      try {
        const url = `${TCGDEX_BASE}/sets/${setId}/${padded}`;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
        if (response.ok) {
          const card = await response.json();
          if (card && card.name) {
            console.log(`[TCGdex] Direct lookup hit (padded): ${card.name} #${padded} in ${setId}`);
            return card;
          }
        }
      } catch {
        // Fall through to card ID approach
      }
    }
  }

  // Try card ID format: /cards/{setId}-{number}
  if (setId && number) {
    try {
      const url = `${TCGDEX_BASE}/cards/${setId}-${number}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (response.ok) {
        const card = await response.json();
        if (card && card.name) {
          console.log(`[TCGdex] Card ID lookup hit: ${card.name} (${setId}-${number})`);
          return card;
        }
      }
    } catch {
      // Fall through
    }
  }

  return null;
}

/**
 * Extract TCGPlayer pricing from TCGdex's tcgplayer object.
 */
function extractTcgPlayerPrice(tcgplayer, rarity) {
  if (!tcgplayer) return null;

  const updated = tcgplayer.updated || null;

  // Pick the best variant based on rarity
  const highRarities = ['ultraRare', 'illustrationRare', 'specialIllustrationRare', 'megaIllustrationRare'];
  const isHighRarity = rarity && highRarities.includes(rarity);

  // Check available variants
  const variants = [];
  if (tcgplayer.holofoil) variants.push({ key: 'holofoil', data: tcgplayer.holofoil });
  if (tcgplayer.normal) variants.push({ key: 'normal', data: tcgplayer.normal });
  if (tcgplayer.reverseHolofoil) variants.push({ key: 'reverseHolofoil', data: tcgplayer.reverseHolofoil });

  if (variants.length === 0) return null;

  // For high rarity, prefer holofoil
  let best;
  if (isHighRarity) {
    best = variants.find(v => v.key === 'holofoil') || variants[0];
  } else if (rarity === 'common' || rarity === 'uncommon') {
    best = variants.find(v => v.key === 'normal') || variants.find(v => v.key === 'reverseHolofoil') || variants[0];
  } else {
    best = variants.find(v => v.key === 'holofoil') || variants[0];
  }

  const prices = best.data;
  const market = prices.marketPrice || prices.midPrice || null;
  if (!market) return null;

  return {
    market,
    low: prices.lowPrice || null,
    mid: prices.midPrice || null,
    high: prices.highPrice || null,
    updatedAt: updated,
    variant: best.key
  };
}

/**
 * Extract Cardmarket pricing from TCGdex's cardmarket object.
 */
function extractCardmarketPrice(cardmarket, rarity) {
  if (!cardmarket) return null;

  const updated = cardmarket.updated || null;
  const isHighRarity = rarity && ['ultraRare', 'illustrationRare', 'specialIllustrationRare', 'megaIllustrationRare'].includes(rarity);

  // For high rarity cards, prefer holo prices
  let market, low, variant;
  if (isHighRarity && cardmarket['trend-holo']) {
    market = cardmarket['trend-holo'];
    low = cardmarket['low-holo'] || null;
    variant = 'holo';
  } else if (cardmarket.trend) {
    market = cardmarket.trend;
    low = cardmarket.low || null;
    variant = 'normal';
  } else if (cardmarket.avg30) {
    market = cardmarket.avg30;
    low = cardmarket.low || null;
    variant = 'avg30';
  } else {
    return null;
  }

  if (!market) return null;

  return {
    market,
    low,
    mid: cardmarket.avg || null,
    high: null,
    updatedAt: updated,
    variant
  };
}
