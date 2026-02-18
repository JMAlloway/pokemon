/**
 * Seed script: populate the SetCard table with image URLs from pokemontcg.io.
 *
 * The pokemontcg.io API is unreachable from this environment, but image URLs
 * follow a deterministic pattern:
 *   small: https://images.pokemontcg.io/{setId}/{number}.png
 *   large: https://images.pokemontcg.io/{setId}/{number}_hires.png
 *
 * This script maps each catalog set code to its pokemontcg.io set ID (from the
 * official pokemon-tcg-data repo), constructs image URLs, and upserts them into
 * the SetCard table. The user's browser loads images directly from the CDN.
 *
 * Usage: node scripts/seedSetCards.js
 */

import { PrismaClient } from '@prisma/client';
import CARD_CATALOG from '../src/data/cardCatalog.js';

const prisma = new PrismaClient();

// Mapping: catalog set code → pokemontcg.io set ID
// Source: https://github.com/PokemonTCG/pokemon-tcg-data/blob/master/sets/en.json
const CATALOG_TO_API_SET_ID = {
  'SV8.5': 'sv8pt5',       // Prismatic Evolutions
  'me1':   'me1',           // Mega Evolution
  'me2':   'me2',           // Phantasmal Flames
  'SV7':   'sv8',           // Surging Sparks (pokemontcg.io uses sv8, not sv7)
  'SV7.5': 'sv7',           // Stellar Crown (pokemontcg.io uses sv7, not sv7pt5)
  'SV6.5': 'sv6pt5',        // Shrouded Fable
  'SV6':   'sv6',           // Twilight Masquerade
  'SV5':   'sv5',           // Temporal Forces
  'SV4.5': 'sv4pt5',        // Paldean Fates
  'SV4':   'sv4',           // Paradox Rift
  'SV3.5': 'sv3pt5',        // 151
  'SV3':   'sv3',           // Obsidian Flames
  'SV2':   'sv2',           // Paldea Evolved
  'SV1':   'sv1',           // Scarlet & Violet
  'SWSH12.5': 'swsh12pt5',  // Crown Zenith
  'SWSH7':  'swsh7',        // Evolving Skies
  'SWSH9':  'swsh9',        // Brilliant Stars
  'SM11.5': 'sm115',        // Hidden Fates
  'BS':     'base1',        // Base Set
  'XY12':   'xy12',         // Evolutions
  'SWSH4.5': 'swsh45',      // Shining Fates
  'SWSH11': 'swsh11',       // Lost Origin
  'SWSH12': 'swsh12',       // Silver Tempest
  'SWSH4':  'swsh4',        // Vivid Voltage
  'SWSH10': 'swsh10',       // Astral Radiance
  'SWSH8':  'swsh8',        // Fusion Strike
  'SWSH6':  'swsh6',        // Chilling Reign
  'SWSH5':  'swsh5',        // Battle Styles
};

// Some sets have sub-set galleries with different pokemontcg.io set IDs.
// Cards with special number prefixes route to the sub-set.
const SUB_SET_ROUTING = {
  'SWSH12.5': [
    { prefix: 'GG', apiSetId: 'swsh12pt5gg' },  // Crown Zenith Galarian Gallery
  ],
  'SWSH9': [
    { prefix: 'TG', apiSetId: 'swsh9tg' },       // Brilliant Stars Trainer Gallery
  ],
  'SWSH10': [
    { prefix: 'TG', apiSetId: 'swsh10tg' },      // Astral Radiance Trainer Gallery
  ],
  'SWSH11': [
    { prefix: 'TG', apiSetId: 'swsh11tg' },      // Lost Origin Trainer Gallery
  ],
  'SWSH12': [
    { prefix: 'TG', apiSetId: 'swsh12tg' },      // Silver Tempest Trainer Gallery
  ],
  'SWSH4.5': [
    { prefix: 'SV', apiSetId: 'swsh45sv' },      // Shining Fates Shiny Vault
  ],
  'SM11.5': [
    { prefix: 'SV', apiSetId: 'sma' },           // Hidden Fates Shiny Vault
  ],
};

const IMAGE_BASE = 'https://images.pokemontcg.io';

/**
 * Determine the pokemontcg.io set ID and card number for a given catalog card.
 */
function resolveCardImageInfo(catalogCode, cardNumber) {
  // Check sub-set routing first
  const routes = SUB_SET_ROUTING[catalogCode];
  if (routes) {
    for (const { prefix, apiSetId } of routes) {
      if (cardNumber.toUpperCase().startsWith(prefix)) {
        // Sub-set cards: strip the prefix to get the pokemontcg.io number
        // e.g. "GG30" → number "GG30" in set swsh12pt5gg
        const apiNumber = cardNumber.replace(/^0+/, '') || cardNumber;
        return { apiSetId, apiNumber };
      }
    }
  }

  const apiSetId = CATALOG_TO_API_SET_ID[catalogCode];
  if (!apiSetId) return null;

  // Strip leading zeros for numeric card numbers: "004" → "4"
  // Keep non-numeric prefixes as-is: "GG30" stays "GG30"
  const apiNumber = /^\d+$/.test(cardNumber)
    ? String(parseInt(cardNumber, 10))
    : cardNumber;

  return { apiSetId, apiNumber };
}

async function seed() {
  console.log('Seeding SetCard table with pokemontcg.io image URLs...\n');

  let totalUpserted = 0;
  let totalSkipped = 0;

  for (const catalogSet of CARD_CATALOG) {
    const baseApiSetId = CATALOG_TO_API_SET_ID[catalogSet.code];
    if (!baseApiSetId) {
      console.warn(`  [SKIP] No API set ID mapping for "${catalogSet.name}" (code: ${catalogSet.code})`);
      totalSkipped += catalogSet.cards.length;
      continue;
    }

    let setUpserted = 0;

    for (const card of catalogSet.cards) {
      const info = resolveCardImageInfo(catalogSet.code, card.number);
      if (!info) {
        totalSkipped++;
        continue;
      }

      const { apiSetId, apiNumber } = info;
      const imageSmall = `${IMAGE_BASE}/${apiSetId}/${apiNumber}.png`;
      const imageLarge = `${IMAGE_BASE}/${apiSetId}/${apiNumber}_hires.png`;

      await prisma.setCard.upsert({
        where: {
          setCode_cardNumber: {
            setCode: catalogSet.code,
            cardNumber: card.number,
          },
        },
        create: {
          setCode: catalogSet.code,
          cardNumber: card.number,
          cardName: card.name,
          rarity: card.rarity,
          imageSmall,
          imageLarge,
          types: [],
          subtypes: [],
        },
        update: {
          cardName: card.name,
          rarity: card.rarity,
          imageSmall,
          imageLarge,
        },
      });
      setUpserted++;
    }

    console.log(`  [OK] ${catalogSet.name} (${catalogSet.code} → ${baseApiSetId}): ${setUpserted} cards`);
    totalUpserted += setUpserted;
  }

  console.log(`\nDone! Upserted ${totalUpserted} cards, skipped ${totalSkipped}.`);
}

seed()
  .catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
