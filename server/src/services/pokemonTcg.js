import { KNOWN_POKEMON_NAMES, KNOWN_TRAINER_CARDS } from './typoDetection.js';
import { similarityScore } from '../utils/levenshtein.js';
import CARD_CATALOG, { CATALOG_CARD_NAMES, CATALOG_SET_NAMES } from '../data/cardCatalog.js';

// Combined list of all known card names (Pokemon + Trainers + Catalog)
const ALL_KNOWN_CARDS = [
  ...new Set([...KNOWN_POKEMON_NAMES, ...KNOWN_TRAINER_CARDS, ...CATALOG_CARD_NAMES])
];

// Pattern: card number like "118/094" or "013/094"
const CARD_NUMBER_PATTERN = /\b\d{1,3}\s*\/\s*\d{2,3}\b/;

/**
 * Pokemon TCG Database Service
 *
 * Validates card names, provides autocomplete, and prevents false positives.
 * Uses a comprehensive local database of Pokemon names with optional
 * Pokemon TCG API integration for extended data.
 *
 * API: https://pokemontcg.io/ (free, no auth required for basic queries)
 */

const POKEMON_TCG_API_BASE = 'https://api.pokemontcg.io/v2';

// Extended card database with sets (merged from static list + catalog)
const STATIC_SETS = [
  'Base Set', 'Jungle', 'Fossil', 'Team Rocket', 'Gym Heroes', 'Gym Challenge',
  'Neo Genesis', 'Neo Discovery', 'Neo Revelation', 'Neo Destiny',
  'Expedition', 'Aquapolis', 'Skyridge',
  'Ruby & Sapphire', 'Sandstorm', 'Dragon', 'Team Magma vs Team Aqua',
  'Hidden Legends', 'FireRed & LeafGreen', 'Team Rocket Returns',
  'Diamond & Pearl', 'Mysterious Treasures', 'Secret Wonders',
  'HeartGold & SoulSilver', 'Unleashed', 'Undaunted', 'Triumphant',
  'Black & White', 'Emerging Powers', 'Noble Victories', 'Next Destinies',
  'XY', 'Flashfire', 'Furious Fists', 'Phantom Forces', 'Roaring Skies',
  'Evolutions', 'Generations',
  'Sun & Moon', 'Guardians Rising', 'Burning Shadows', 'Shining Legends',
  'Crimson Invasion', 'Ultra Prism', 'Forbidden Light', 'Celestial Storm',
  'Lost Thunder', 'Team Up', 'Unbroken Bonds', 'Unified Minds',
  'Cosmic Eclipse', 'Hidden Fates',
  'Sword & Shield', 'Rebel Clash', 'Darkness Ablaze', 'Vivid Voltage',
  'Shining Fates', 'Battle Styles', 'Chilling Reign', 'Evolving Skies',
  'Fusion Strike', 'Brilliant Stars', 'Astral Radiance', 'Lost Origin',
  'Silver Tempest', 'Crown Zenith',
  'Scarlet & Violet', 'Paldea Evolved', 'Obsidian Flames', '151',
  'Paradox Rift', 'Paldean Fates', 'Temporal Forces', 'Twilight Masquerade',
  'Shrouded Fable', 'Stellar Crown', 'Surging Sparks', 'Prismatic Evolutions',
  'Mega Evolution', 'Phantasmal Flames'
];
const POKEMON_SETS = [...new Set([...STATIC_SETS, ...CATALOG_SET_NAMES])];

const CARD_TYPES = ['V', 'VMAX', 'VSTAR', 'ex', 'EX', 'GX', 'Tag Team', 'BREAK',
  'Mega', 'Level X', 'Prime', 'LEGEND', 'Full Art', 'Alt Art',
  'Secret Rare', 'Rainbow Rare', 'Gold', 'Illustration Rare',
  'Special Art Rare', 'Hyper Rare', 'Trainer Gallery'];

let pokemonTcgCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Validate if a card name exists in Pokemon TCG database.
 * Returns validation result with suggestions if not found.
 */
export async function validateCardName(cardName) {
  const normalized = cardName.trim().toLowerCase();

  // Check against all known card names (Pokemon + Trainers)
  const exactMatch = ALL_KNOWN_CARDS.find(
    name => name.toLowerCase() === normalized
  );

  if (exactMatch) {
    return { valid: true, name: exactMatch, suggestions: [] };
  }

  // Check if input contains a known card name (handles "Mega Charizard X ex 013/094", "Dawn 118/094")
  const containsMatch = ALL_KNOWN_CARDS.find(name => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(cardName);
  });

  if (containsMatch) {
    return { valid: true, name: cardName.trim(), suggestions: [] };
  }

  // If input contains a card number pattern (e.g. "118/094"), accept it —
  // the user knows the specific card they're looking for
  if (CARD_NUMBER_PATTERN.test(cardName)) {
    return { valid: true, name: cardName.trim(), suggestions: [] };
  }

  // Check cache
  const cacheKey = `validate_${normalized}`;
  const cached = pokemonTcgCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Try fuzzy matching against known names
  const suggestions = ALL_KNOWN_CARDS
    .map(name => ({ name, score: similarityScore(cardName, name) }))
    .filter(m => m.score >= 60)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(m => m.name);

  // Try Pokemon TCG API for extended validation
  try {
    const response = await fetch(
      `${POKEMON_TCG_API_BASE}/cards?q=name:"${encodeURIComponent(cardName)}"&pageSize=5`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const result = {
          valid: true,
          name: data.data[0].name,
          suggestions: data.data.map(c => c.name).slice(0, 5)
        };
        pokemonTcgCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    }
  } catch {
    // API unavailable — fall back to local database only
  }

  if (suggestions.length > 0 && suggestions[0]) {
    // Close enough match found in local DB
    const topScore = similarityScore(cardName, suggestions[0]);
    if (topScore >= 80) {
      const result = { valid: true, name: suggestions[0], suggestions };
      pokemonTcgCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
  }

  const result = {
    valid: false,
    name: null,
    suggestions,
    message: suggestions.length > 0
      ? `Card not found in Pokemon database. Did you mean: ${suggestions.join(', ')}?`
      : 'Card not found in Pokemon database. Please check the spelling.'
  };

  pokemonTcgCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

/**
 * Get autocomplete suggestions for partial card names.
 */
export function getAutocompleteSuggestions(partial, limit = 10) {
  const normalizedPartial = partial.toLowerCase().trim();
  if (normalizedPartial.length < 2) return [];

  // Prefix matches first
  const prefixMatches = ALL_KNOWN_CARDS
    .filter(name => name.toLowerCase().startsWith(normalizedPartial));

  // Contains matches second
  const containsMatches = ALL_KNOWN_CARDS
    .filter(name =>
      name.toLowerCase().includes(normalizedPartial) &&
      !name.toLowerCase().startsWith(normalizedPartial)
    );

  // Fuzzy matches last
  const fuzzyMatches = ALL_KNOWN_CARDS
    .filter(name => {
      const score = similarityScore(partial, name);
      return score >= 50 &&
        !name.toLowerCase().startsWith(normalizedPartial) &&
        !name.toLowerCase().includes(normalizedPartial);
    })
    .sort((a, b) => similarityScore(partial, b) - similarityScore(partial, a));

  return [...prefixMatches, ...containsMatches, ...fuzzyMatches].slice(0, limit);
}

/**
 * Get known sets for autocomplete.
 */
export function getSetSuggestions(partial) {
  if (!partial || partial.length < 2) return POKEMON_SETS.slice(0, 10);
  const normalized = partial.toLowerCase();
  return POKEMON_SETS.filter(s => s.toLowerCase().includes(normalized)).slice(0, 10);
}

/**
 * Fetch TCGPlayer market price via the pokemontcg.io API.
 *
 * The pokemontcg.io card response includes a `tcgplayer.prices` object keyed by
 * variant (e.g. "holofoil", "normal", "reverseHolofoil"). Each variant has:
 *   { low, mid, high, market, directLow }
 *
 * We pick the best variant based on rarity and return the `market` price,
 * which is the official TCGPlayer Market Price.
 *
 * Uses a cascading query strategy: if the most specific query (name + set + number)
 * returns no results, progressively broader queries are tried so new sets that
 * pokemontcg.io hasn't indexed yet can still resolve via name + number alone.
 *
 * @param {{ cardName: string, set?: string, cardNumber?: string, rarity?: string }} opts
 * @returns {Promise<{ market: number, low: number, mid: number, high: number, updatedAt: string, variant: string } | null>}
 */
export async function fetchTcgPlayerPrice({ cardName, set, cardNumber, rarity }) {
  // Build cache key
  const cacheKey = `tcgprice_${cardName}_${set || ''}_${cardNumber || ''}`;
  const cached = pokemonTcgCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Strip card number from card name for the API query
  // e.g. "Mega Charizard X ex 130/094" → "Mega Charizard X ex"
  const baseName = cardName.replace(/\s*\d{1,3}\s*\/\s*\d{2,3}\s*$/, '').trim();

  // Extract just the card number (e.g. "130" from "130/094")
  const numberMatch = (cardNumber || cardName).match(/(\d{1,3})\s*\/\s*\d{2,3}/);
  const number = numberMatch ? numberMatch[1].replace(/^0+/, '') : null;

  // Look up set code from the card catalog (e.g. "Phantasmal Flames" → "ME02")
  const catalogSet = set ? CARD_CATALOG.find(s => s.name === set) : null;
  const setCode = catalogSet?.code?.toLowerCase() || null;

  // Build cascading queries: most specific → broadest.
  // pokemontcg.io may not have new sets yet, so we try without set filters as a fallback.
  const queries = [];

  // 1. Most specific: name + set name + number
  if (set && number) {
    queries.push({ q: `name:"${baseName}" set.name:"${set}" number:"${number}"`, label: 'name+set+number' });
  }
  // 2. Try set code (pokemontcg.io IDs sometimes differ from set names)
  if (setCode && number) {
    queries.push({ q: `set.id:"${setCode}" number:"${number}"`, label: 'setCode+number' });
  }
  // 3. Name + number only (no set filter — catches new sets not yet indexed by name)
  if (number) {
    queries.push({ q: `name:"${baseName}" number:"${number}"`, label: 'name+number' });
  }
  // 4. Broadest: just name (last resort)
  queries.push({ q: `name:"${baseName}"`, label: 'name-only' });

  // Deduplicate queries
  const seen = new Set();
  const uniqueQueries = queries.filter(({ q }) => {
    if (seen.has(q)) return false;
    seen.add(q);
    return true;
  });

  for (const { q, label } of uniqueQueries) {
    const url = `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(q)}&pageSize=10&select=name,number,set,tcgplayer,rarity`;

    try {
      console.log(`[TCGPlayer] Trying ${label}: ${q}`);
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

      if (!response.ok) {
        console.warn(`[TCGPlayer] API returned ${response.status} for ${label}`);
        continue;
      }

      const data = await response.json();
      if (!data.data || data.data.length === 0) {
        console.log(`[TCGPlayer] No results for ${label}`);
        continue;
      }

      // Pick the best matching card from results
      const card = pickBestCard(data.data, { baseName, number, set, setCode });
      if (!card) {
        console.log(`[TCGPlayer] No suitable match in ${data.data.length} results for ${label}`);
        continue;
      }

      if (!card.tcgplayer?.prices) {
        console.log(`[TCGPlayer] No pricing data for ${card.name} (${card.set?.name})`);
        continue;
      }

      // Pick the best price variant based on rarity
      const variant = pickPriceVariant(card.tcgplayer.prices, rarity);
      if (!variant) {
        console.log(`[TCGPlayer] No usable price variant for ${card.name}`);
        continue;
      }

      const prices = card.tcgplayer.prices[variant];
      if (!prices.market && !prices.mid) {
        console.log(`[TCGPlayer] No market/mid price for ${card.name} (${variant})`);
        continue;
      }

      const result = {
        market: prices.market || prices.mid,
        low: prices.low || null,
        mid: prices.mid || null,
        high: prices.high || null,
        directLow: prices.directLow || null,
        updatedAt: card.tcgplayer.updatedAt || null,
        variant,
        cardName: card.name,
        setName: card.set?.name || set
      };

      console.log(`[TCGPlayer] Found via ${label}: ${card.name} (${card.set?.name}) ${variant}: market=$${result.market}`);
      pokemonTcgCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (err) {
      console.warn(`[TCGPlayer] ${label} failed:`, err.message);
      continue;
    }
  }

  console.log(`[TCGPlayer] All queries exhausted for "${baseName}" — no pricing found`);
  pokemonTcgCache.set(cacheKey, { data: null, timestamp: Date.now() });
  return null;
}

/**
 * Pick the best matching card from API results.
 * Prefers: exact number match in the expected set > exact number in any set > first result.
 */
function pickBestCard(cards, { baseName, number, set, setCode }) {
  if (cards.length === 1) return cards[0];

  // Filter to cards that have TCGPlayer pricing
  const withPricing = cards.filter(c => c.tcgplayer?.prices);
  const pool = withPricing.length > 0 ? withPricing : cards;

  // Best: exact number + matching set
  if (number && set) {
    const match = pool.find(c =>
      String(c.number) === number &&
      (c.set?.name?.toLowerCase() === set.toLowerCase() ||
       c.set?.id?.toLowerCase() === setCode)
    );
    if (match) return match;
  }

  // Good: exact number match (any set)
  if (number) {
    const match = pool.find(c => String(c.number) === number);
    if (match) return match;
  }

  // Fallback: first card with pricing
  return pool[0] || cards[0];
}

/**
 * Pick the most appropriate TCGPlayer price variant for a card.
 * Variants include: holofoil, normal, reverseHolofoil, 1stEditionHolofoil, etc.
 */
function pickPriceVariant(prices, rarity) {
  const variants = Object.keys(prices);
  if (variants.length === 0) return null;
  if (variants.length === 1) return variants[0];

  // For high-rarity cards, prefer holofoil
  const highRarities = ['ultraRare', 'illustrationRare', 'specialIllustrationRare', 'megaIllustrationRare'];
  if (rarity && highRarities.includes(rarity)) {
    if (prices.holofoil) return 'holofoil';
  }

  // For common/uncommon, prefer normal
  if (rarity === 'common' || rarity === 'uncommon') {
    if (prices.normal) return 'normal';
    if (prices.reverseHolofoil) return 'reverseHolofoil';
  }

  // General preference order
  const preferenceOrder = ['holofoil', 'normal', 'reverseHolofoil', '1stEditionHolofoil', 'unlimitedHolofoil'];
  for (const v of preferenceOrder) {
    if (prices[v]?.market || prices[v]?.mid) return v;
  }

  // Fallback: first variant with a market price
  return variants.find(v => prices[v]?.market || prices[v]?.mid) || variants[0];
}

export { POKEMON_SETS, CARD_TYPES, KNOWN_POKEMON_NAMES, KNOWN_TRAINER_CARDS, ALL_KNOWN_CARDS };
