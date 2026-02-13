import { KNOWN_POKEMON_NAMES, KNOWN_TRAINER_CARDS } from './typoDetection.js';
import { similarityScore } from '../utils/levenshtein.js';
import { CATALOG_CARD_NAMES, CATALOG_SET_NAMES } from '../data/cardCatalog.js';

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

export { POKEMON_SETS, CARD_TYPES, KNOWN_POKEMON_NAMES, KNOWN_TRAINER_CARDS, ALL_KNOWN_CARDS };
