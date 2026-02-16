/**
 * Generate a complete cardCatalog.js from the pokemontcg.io API.
 *
 * Fetches ALL cards for every set and writes a complete catalog file
 * with proper rarity mappings. Run this locally where the API is reachable.
 *
 * Usage:
 *   node scripts/generateCatalog.js
 *
 * After running:
 *   1. The new catalog is written to src/data/cardCatalog.js
 *   2. Re-run `node scripts/seedSetCards.js` to update images in DB
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMON_TCG_API_KEY || '';

// All sets we want in the catalog, with their pokemontcg.io API set IDs.
// Some sets have sub-sets (Trainer Gallery, Galarian Gallery, Shiny Vault)
// that are separate "sets" in the API but belong to the same catalog entry.
const SETS = [
  // ─── Scarlet & Violet Era ───
  {
    name: 'Prismatic Evolutions',
    code: 'SV8.5',
    era: 'Scarlet & Violet',
    apiSetIds: ['sv8pt5'],
  },
  {
    name: 'Mega Evolution',
    code: 'me1',
    era: 'Scarlet & Violet',
    apiSetIds: ['me1'],
  },
  {
    name: 'Phantasmal Flames',
    code: 'me2',
    era: 'Scarlet & Violet',
    apiSetIds: ['me2'],
  },
  {
    name: 'Surging Sparks',
    code: 'SV7',
    era: 'Scarlet & Violet',
    apiSetIds: ['sv8'],
  },
  {
    name: 'Stellar Crown',
    code: 'SV7.5',
    era: 'Scarlet & Violet',
    apiSetIds: ['sv7'],
  },
  {
    name: 'Shrouded Fable',
    code: 'SV6.5',
    era: 'Scarlet & Violet',
    apiSetIds: ['sv6pt5'],
  },
  {
    name: 'Twilight Masquerade',
    code: 'SV6',
    era: 'Scarlet & Violet',
    apiSetIds: ['sv6'],
  },
  {
    name: 'Temporal Forces',
    code: 'SV5',
    era: 'Scarlet & Violet',
    apiSetIds: ['sv5'],
  },
  {
    name: 'Paldean Fates',
    code: 'SV4.5',
    era: 'Scarlet & Violet',
    apiSetIds: ['sv4pt5'],
  },
  {
    name: 'Paradox Rift',
    code: 'SV4',
    era: 'Scarlet & Violet',
    apiSetIds: ['sv4'],
  },
  {
    name: '151',
    code: 'SV3.5',
    era: 'Scarlet & Violet',
    apiSetIds: ['sv3pt5'],
  },
  {
    name: 'Obsidian Flames',
    code: 'SV3',
    era: 'Scarlet & Violet',
    apiSetIds: ['sv3'],
  },
  {
    name: 'Paldea Evolved',
    code: 'SV2',
    era: 'Scarlet & Violet',
    apiSetIds: ['sv2'],
  },
  {
    name: 'Scarlet & Violet',
    code: 'SV1',
    era: 'Scarlet & Violet',
    apiSetIds: ['sv1'],
  },

  // ─── Sword & Shield Era ───
  {
    name: 'Crown Zenith',
    code: 'SWSH12.5',
    era: 'Sword & Shield',
    apiSetIds: ['swsh12pt5', 'swsh12pt5gg'],
  },
  {
    name: 'Evolving Skies',
    code: 'SWSH7',
    era: 'Sword & Shield',
    apiSetIds: ['swsh7'],
  },
  {
    name: 'Brilliant Stars',
    code: 'SWSH9',
    era: 'Sword & Shield',
    apiSetIds: ['swsh9', 'swsh9tg'],
  },
  {
    name: 'Lost Origin',
    code: 'SWSH11',
    era: 'Sword & Shield',
    apiSetIds: ['swsh11', 'swsh11tg'],
  },
  {
    name: 'Silver Tempest',
    code: 'SWSH12',
    era: 'Sword & Shield',
    apiSetIds: ['swsh12', 'swsh12tg'],
  },
  {
    name: 'Astral Radiance',
    code: 'SWSH10',
    era: 'Sword & Shield',
    apiSetIds: ['swsh10', 'swsh10tg'],
  },
  {
    name: 'Vivid Voltage',
    code: 'SWSH4',
    era: 'Sword & Shield',
    apiSetIds: ['swsh4'],
  },
  {
    name: 'Fusion Strike',
    code: 'SWSH8',
    era: 'Sword & Shield',
    apiSetIds: ['swsh8'],
  },
  {
    name: 'Chilling Reign',
    code: 'SWSH6',
    era: 'Sword & Shield',
    apiSetIds: ['swsh6'],
  },
  {
    name: 'Battle Styles',
    code: 'SWSH5',
    era: 'Sword & Shield',
    apiSetIds: ['swsh5'],
  },
  {
    name: 'Shining Fates',
    code: 'SWSH4.5',
    era: 'Sword & Shield',
    apiSetIds: ['swsh45', 'swsh45sv'],
  },

  // ─── Sun & Moon Era ───
  {
    name: 'Hidden Fates',
    code: 'SM11.5',
    era: 'Sun & Moon',
    apiSetIds: ['sm115', 'sma'],
  },

  // ─── Classic / XY Era ───
  {
    name: 'Base Set',
    code: 'BS',
    era: 'Classic',
    apiSetIds: ['base1'],
  },
  {
    name: 'Evolutions',
    code: 'XY12',
    era: 'XY',
    apiSetIds: ['xy12'],
  },
];

/**
 * Map pokemontcg.io rarity string to our catalog rarity enum.
 */
function mapRarity(apiRarity) {
  if (!apiRarity) return 'common';
  const r = apiRarity.toLowerCase();

  // Mega Illustration Rare (SV era)
  if (r.includes('mega') && r.includes('illustration')) return 'megaIllustrationRare';

  // Special Illustration Rare / Special Art Rare (SV era)
  if (r.includes('special') && r.includes('illustration')) return 'specialIllustrationRare';
  if (r.includes('special art rare')) return 'specialIllustrationRare';

  // Illustration Rare (SV era)
  if (r.includes('illustration rare') && !r.includes('special') && !r.includes('mega')) return 'illustrationRare';

  // Hyper Rare (rainbow/gold cards — treat as specialIllustrationRare)
  if (r.includes('hyper rare')) return 'specialIllustrationRare';

  // ACE SPEC Rare
  if (r.includes('ace spec')) return 'ultraRare';

  // Secret Rare / Rare Secret
  if (r.includes('secret')) return 'ultraRare';

  // Double Rare (SV era ex/etc.)
  if (r.includes('double rare')) return 'ultraRare';

  // Ultra Rare
  if (r.includes('ultra rare')) return 'ultraRare';

  // Shiny Rare / Shiny Holo Rare / Shiny Ultra Rare
  if (r.includes('shiny') && r.includes('ultra')) return 'ultraRare';
  if (r.includes('shiny')) return 'rare';

  // VMAX / VSTAR / V / EX / GX — these are typically "Rare Holo V" etc.
  if (r.includes('rare holo vmax') || r.includes('rare holo vstar')) return 'ultraRare';
  if (r.includes('rare holo v') || r.includes('rare holo gx') || r.includes('rare holo ex')) return 'ultraRare';

  // Rare Rainbow — SWSH era rainbow rares
  if (r.includes('rare rainbow')) return 'specialIllustrationRare';

  // Rare Full Art / Amazing Rare
  if (r.includes('rare full art')) return 'illustrationRare';
  if (r.includes('amazing rare')) return 'ultraRare';

  // Rare BREAK / Rare Prime / Rare Prism Star
  if (r.includes('rare break') || r.includes('rare prime') || r.includes('rare prism')) return 'ultraRare';

  // Rare Holo (standard holo rares)
  if (r.includes('rare holo')) return 'rare';

  // Promo
  if (r.includes('promo')) return 'rare';

  // Standard rarities
  if (r === 'rare') return 'rare';
  if (r === 'uncommon') return 'uncommon';
  if (r === 'common') return 'common';

  // Fallback
  return 'rare';
}

/**
 * Fetch all cards for a given API set ID, paginating as needed.
 */
async function fetchAllCards(apiSetId) {
  const headers = {};
  if (API_KEY) headers['X-Api-Key'] = API_KEY;

  let allCards = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${API_BASE}/cards?q=set.id:"${apiSetId}"&page=${page}&pageSize=${pageSize}&select=name,number,rarity,set&orderBy=number`;
    console.log(`  Fetching ${apiSetId} page ${page}...`);

    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.warn(`  WARNING: API returned ${response.status} for ${apiSetId} page ${page}`);
      break;
    }

    const data = await response.json();
    const cards = data.data || [];
    allCards.push(...cards);

    if (cards.length < pageSize) break;
    page++;

    // Rate limiting — be polite
    await new Promise(r => setTimeout(r, API_KEY ? 100 : 1000));
  }

  return allCards;
}

/**
 * Sort cards by number. Handles numeric, prefixed (GG01, TG01, SV01), and mixed formats.
 */
function sortByNumber(a, b) {
  const parseNum = (n) => {
    const match = n.match(/^([A-Za-z]*)(\d+)$/);
    if (match) return { prefix: match[1], num: parseInt(match[2], 10) };
    return { prefix: n, num: 0 };
  };
  const pa = parseNum(a.number);
  const pb = parseNum(b.number);
  if (pa.prefix !== pb.prefix) return pa.prefix.localeCompare(pb.prefix);
  return pa.num - pb.num;
}

/**
 * Pad a card number to 3 digits if purely numeric.
 */
function padNumber(number) {
  // If purely numeric, pad to 3 digits
  if (/^\d+$/.test(number)) {
    return number.padStart(3, '0');
  }
  // If it has a letter prefix like GG1, TG5, SV49 — pad the numeric part
  const match = number.match(/^([A-Za-z]+)(\d+)$/);
  if (match) {
    return match[1] + match[2].padStart(2, '0');
  }
  return number;
}

async function main() {
  console.log('=== Generating complete card catalog from pokemontcg.io ===\n');

  const catalogEntries = [];
  let totalCards = 0;

  for (const setDef of SETS) {
    console.log(`\n[${setDef.code}] ${setDef.name}`);

    let allCards = [];
    let printedTotal = '000';

    for (const apiSetId of setDef.apiSetIds) {
      try {
        const cards = await fetchAllCards(apiSetId);
        console.log(`  ${apiSetId}: ${cards.length} cards`);

        // Get printedTotal from the first card's set data (main set only, not sub-sets)
        if (apiSetId === setDef.apiSetIds[0] && cards.length > 0 && cards[0].set) {
          const pt = cards[0].set.printedTotal;
          if (pt) printedTotal = String(pt).padStart(3, '0');
        }

        allCards.push(...cards);
      } catch (err) {
        console.error(`  ERROR fetching ${apiSetId}: ${err.message}`);
      }

      // Pause between sub-sets
      await new Promise(r => setTimeout(r, API_KEY ? 200 : 1500));
    }

    if (allCards.length === 0) {
      console.warn(`  SKIPPED — no cards found`);
      continue;
    }

    // Deduplicate by number (in case of overlaps between main set and sub-set)
    const seen = new Set();
    const uniqueCards = [];
    for (const card of allCards) {
      const key = card.number;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCards.push(card);
      }
    }

    // Sort by number
    uniqueCards.sort(sortByNumber);

    // Build catalog cards
    const catalogCards = uniqueCards.map(card => ({
      name: card.name,
      number: padNumber(card.number),
      rarity: mapRarity(card.rarity),
    }));

    catalogEntries.push({
      name: setDef.name,
      code: setDef.code,
      era: setDef.era,
      printedTotal,
      cards: catalogCards,
    });

    totalCards += catalogCards.length;
    console.log(`  => ${catalogCards.length} cards total (printedTotal: ${printedTotal})`);
  }

  // Generate the JavaScript file
  console.log(`\n=== Writing catalog: ${catalogEntries.length} sets, ${totalCards} total cards ===\n`);

  let output = `/**
 * Pokemon TCG Card Catalog
 *
 * Complete card data for all tracked sets, auto-generated from pokemontcg.io API.
 * Generated: ${new Date().toISOString().slice(0, 10)}
 *
 * Rarity tiers:
 *   common, uncommon, rare, ultraRare, illustrationRare,
 *   specialIllustrationRare, megaIllustrationRare
 *
 * To regenerate: node scripts/generateCatalog.js
 */

const CARD_CATALOG = [\n`;

  // Group by era for readability
  const eras = [...new Set(catalogEntries.map(e => e.era))];
  for (const era of eras) {
    const eraLabel = era === 'Classic' ? 'Classic Sets' :
                     era === 'XY' ? 'XY Era' :
                     `${era} Era`;
    output += `  // ─── ${eraLabel} ${'─'.repeat(Math.max(0, 60 - eraLabel.length))}──\n\n`;

    const eraSets = catalogEntries.filter(e => e.era === era);
    for (const entry of eraSets) {
      output += `  {\n`;
      output += `    name: ${JSON.stringify(entry.name)},\n`;
      output += `    code: ${JSON.stringify(entry.code)},\n`;
      output += `    era: ${JSON.stringify(entry.era)},\n`;
      output += `    printedTotal: ${JSON.stringify(entry.printedTotal)},\n`;
      output += `    cards: [\n`;

      // Group cards by rarity for readability
      const rarityGroups = {};
      for (const card of entry.cards) {
        if (!rarityGroups[card.rarity]) rarityGroups[card.rarity] = [];
        rarityGroups[card.rarity].push(card);
      }

      const RARITY_ORDER = [
        'common', 'uncommon', 'rare', 'ultraRare',
        'illustrationRare', 'specialIllustrationRare', 'megaIllustrationRare',
      ];

      const RARITY_COMMENT = {
        common: 'Common',
        uncommon: 'Uncommon',
        rare: 'Rare',
        ultraRare: 'Ultra Rare',
        illustrationRare: 'Illustration Rare',
        specialIllustrationRare: 'Special Illustration Rare',
        megaIllustrationRare: 'Mega Illustration Rare',
      };

      for (const rarity of RARITY_ORDER) {
        const cards = rarityGroups[rarity];
        if (!cards || cards.length === 0) continue;

        output += `      // ${RARITY_COMMENT[rarity]} (${cards.length})\n`;
        for (const card of cards) {
          const nameStr = JSON.stringify(card.name);
          const numStr = JSON.stringify(card.number);
          output += `      { name: ${nameStr}, number: ${numStr}, rarity: '${rarity}' },\n`;
        }
      }

      output += `    ]\n`;
      output += `  },\n\n`;
    }
  }

  output += `];\n\n`;

  // Derived exports
  output += `// ─── Derived data ${'─'.repeat(53)}──\n\n`;
  output += `/** All set names from the catalog */\n`;
  output += `export const CATALOG_SET_NAMES = CARD_CATALOG.map(s => s.name);\n\n`;
  output += `/** All unique card names from the catalog */\n`;
  output += `export const CATALOG_CARD_NAMES = [\n`;
  output += `  ...new Set(CARD_CATALOG.flatMap(s => s.cards.map(c => c.name)))\n`;
  output += `];\n\n`;
  output += `/** Rarity display labels and sort order */\n`;
  output += `export const RARITY_ORDER = [\n`;
  output += `  'common',\n`;
  output += `  'uncommon',\n`;
  output += `  'rare',\n`;
  output += `  'ultraRare',\n`;
  output += `  'illustrationRare',\n`;
  output += `  'specialIllustrationRare',\n`;
  output += `  'megaIllustrationRare',\n`;
  output += `];\n\n`;
  output += `export const RARITY_LABELS = {\n`;
  output += `  common: 'Common',\n`;
  output += `  uncommon: 'Uncommon',\n`;
  output += `  rare: 'Rare',\n`;
  output += `  ultraRare: 'Ultra Rare',\n`;
  output += `  illustrationRare: 'Illustration Rare',\n`;
  output += `  specialIllustrationRare: 'Special Illustration Rare',\n`;
  output += `  megaIllustrationRare: 'Mega Illustration Rare',\n`;
  output += `};\n\n`;
  output += `export default CARD_CATALOG;\n`;

  // Write the file
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'cardCatalog.js');
  fs.writeFileSync(outputPath, output, 'utf-8');
  console.log(`Written to ${outputPath}`);
  console.log(`\nDone! ${catalogEntries.length} sets, ${totalCards} cards.`);
  console.log(`\nNext steps:`);
  console.log(`  1. node scripts/seedSetCards.js   (update images in DB)`);
  console.log(`  2. Restart the server`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
