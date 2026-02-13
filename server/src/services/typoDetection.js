import { levenshteinDistance, similarityScore, findBestMatch } from '../utils/levenshtein.js';
import prisma from '../db.js';

// Common Pokemon card name misspellings to seed and detect
const KNOWN_POKEMON_NAMES = [
  // Popular / high-value (original list)
  'Charizard', 'Pikachu', 'Mewtwo', 'Blastoise', 'Venusaur', 'Lugia',
  'Rayquaza', 'Umbreon', 'Espeon', 'Gengar', 'Dragonite', 'Gyarados',
  'Alakazam', 'Machamp', 'Arcanine', 'Ninetales', 'Eevee', 'Snorlax',
  'Mew', 'Celebi', 'Ho-Oh', 'Entei', 'Suicune', 'Raikou', 'Tyranitar',
  'Gardevoir', 'Salamence', 'Metagross', 'Latios', 'Latias', 'Kyogre',
  'Groudon', 'Dialga', 'Palkia', 'Giratina', 'Garchomp', 'Lucario',
  'Togekiss', 'Zekrom', 'Reshiram', 'Sylveon', 'Greninja', 'Mimikyu',
  'Toxtricity', 'Dragapult', 'Eternatus', 'Calyrex', 'Arceus',
  'Jolteon', 'Flareon', 'Vaporeon', 'Leafeon', 'Glaceon',
  'Magikarp', 'Ditto', 'Zapdos', 'Moltres', 'Articuno',
  'Scizor', 'Steelix', 'Kingdra', 'Heracross', 'Ampharos',
  'Feraligatr', 'Typhlosion', 'Meganium', 'Wobbuffet',
  'Absol', 'Blaziken', 'Swampert', 'Sceptile', 'Milotic',
  'Flygon', 'Aggron', 'Wailord', 'Sharpedo', 'Camerupt',
  'Luxray', 'Staraptor', 'Infernape', 'Torterra', 'Empoleon',
  'Darkrai', 'Shaymin', 'Cresselia', 'Heatran', 'Regigigas',
  // Phantasmal Flames (ME02) — full set coverage
  'Oddish', 'Gloom', 'Vileplume',
  'Lotad', 'Lombre', 'Ludicolo',
  'Genesect', 'Nymble', 'Lokix',
  'Charmander', 'Charmeleon',
  'Darumaka', 'Darmanitan',
  'Oricorio', 'Charcadet', 'Ceruledge',
  'Seel', 'Dewgong',
  'Swinub', 'Piloswine', 'Mamoswine',
  'Piplup', 'Prinplup',
  'Rotom', 'Yamper', 'Boltund',
  'Pawmi', 'Pawmo', 'Pawmot',
  'Misdreavus', 'Mismagius',
  'Snubbull', 'Granbull',
  'Meloetta', 'Diancie',
  'Milcery', 'Alcremie',
  'Zacian', 'Bramblin', 'Brambleghast',
  'Tauros', 'Gligar', 'Gliscor',
  'Trapinch', 'Vibrava',
  'Gastly', 'Haunter',
  'Murkrow', 'Honchkrow',
  'Carvanha', 'Seviper',
  'Wooper', 'Clodsire',
  'Sandile', 'Krookodile',
  'Toxel', 'Bronzor', 'Bronzong',
  'Togedemaru', 'Duraludon', 'Archaludon',
  'Jigglypuff', 'Wigglytuff',
  'Meowth', 'Ambipom',
  'Zigzagoon', 'Linoone',
  'Starly', 'Lopunny'
];

/**
 * Analyze a listing title for potential misspellings of Pokemon names.
 * Uses Levenshtein distance to detect typos.
 *
 * @param {string} title - The eBay listing title
 * @param {string} targetCardName - The card name being searched for
 * @returns {{ hasTypo: boolean, typoDetails: string|null, confidenceScore: number|null }}
 */
export function analyzeTitle(title, targetCardName) {
  const words = title.split(/[\s,\-\(\)\/\|]+/).filter(w => w.length > 2);
  const targetLower = targetCardName.toLowerCase();

  // Check if the exact card name appears correctly in title
  if (title.toLowerCase().includes(targetLower)) {
    return { hasTypo: false, typoDetails: null, confidenceScore: null };
  }

  // Look for misspellings of the target card name
  let bestTypo = null;

  for (const word of words) {
    const wordLower = word.toLowerCase();

    // Skip very short or numeric words
    if (wordLower.length < 3 || /^\d+$/.test(wordLower)) continue;

    // Check against target card name (split into parts for multi-word names)
    const targetParts = targetCardName.split(/[\s\-]+/);

    for (const part of targetParts) {
      if (part.length < 3) continue;
      const partLower = part.toLowerCase();

      // Already exact match
      if (wordLower === partLower) continue;

      const dist = levenshteinDistance(wordLower, partLower);
      const similarity = similarityScore(word, part);

      // Typo detection: distance 1-3, with high similarity
      if (dist >= 1 && dist <= 3 && similarity >= 65) {
        if (!bestTypo || similarity > bestTypo.similarity) {
          bestTypo = {
            original: word,
            correct: part,
            distance: dist,
            similarity
          };
        }
      }
    }
  }

  if (bestTypo) {
    // Confidence: inverse distance * similarity weighting
    const confidence = Math.min(100, Math.round(
      (bestTypo.similarity * 0.6) + ((4 - bestTypo.distance) / 3 * 40)
    ));

    return {
      hasTypo: true,
      typoDetails: `"${bestTypo.original}" appears to be misspelling of "${bestTypo.correct}" (distance: ${bestTypo.distance})`,
      confidenceScore: confidence
    };
  }

  // Also check against known Pokemon names for broader detection
  for (const word of words) {
    if (word.length < 4) continue;
    const match = findBestMatch(word, KNOWN_POKEMON_NAMES, 2);
    if (match && match.distance > 0 && match.similarity >= 70) {
      const confidence = Math.min(100, Math.round(
        (match.similarity * 0.6) + ((3 - match.distance) / 2 * 40)
      ));
      return {
        hasTypo: true,
        typoDetails: `"${word}" appears to be misspelling of "${match.correct}" (distance: ${match.distance})`,
        confidenceScore: confidence
      };
    }
  }

  return { hasTypo: false, typoDetails: null, confidenceScore: null };
}

/**
 * Batch analyze multiple listing titles.
 * Targets <500ms for 100+ listings.
 */
export function batchAnalyzeTitles(listings, targetCardName) {
  return listings.map(listing => {
    const result = analyzeTitle(listing.listingTitle || listing.title, targetCardName);
    return { ...listing, ...result };
  });
}

/**
 * Get known typo patterns from the database.
 */
export async function getTypoPatterns() {
  return prisma.typoPattern.findMany();
}

/**
 * Validate a card name suggestion using fuzzy matching against known names.
 */
export function suggestCardNames(input, limit = 5) {
  const inputLower = input.toLowerCase();

  // First try exact prefix match
  const prefixMatches = KNOWN_POKEMON_NAMES.filter(
    name => name.toLowerCase().startsWith(inputLower)
  );
  if (prefixMatches.length > 0) return prefixMatches.slice(0, limit);

  // Then try fuzzy match
  const matches = KNOWN_POKEMON_NAMES
    .map(name => ({
      name,
      similarity: similarityScore(input, name)
    }))
    .filter(m => m.similarity >= 50)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(m => m.name);

  return matches;
}

export { KNOWN_POKEMON_NAMES };
