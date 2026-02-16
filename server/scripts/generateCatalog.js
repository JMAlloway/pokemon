/**
 * Generate a complete cardCatalog.js with ALL cards in every set.
 *
 * Data sources (tried in order):
 *   1. GitHub raw JSON from PokemonTCG/pokemon-tcg-data repo (fast, no auth)
 *   2. TCGdex API fallback for sets not in the GitHub repo (free, no auth)
 *
 * Usage:
 *   node scripts/generateCatalog.js
 *
 * After running:
 *   1. The new catalog is written to src/data/cardCatalog.js
 *   2. Re-run `node scripts/seedSetCards.js` to update images in DB
 *   3. Restart the server
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_RAW = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master';
const TCGDEX_BASE = 'https://api.tcgdex.net/v2/en';
const TIMEOUT_MS = 15000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Set definitions ──────────────────────────────────────────────────────
// Each entry maps our catalog code to pokemontcg.io set IDs (used for both
// GitHub data files and image URLs). Sub-sets are listed separately.
const SETS = [
  // ─── Scarlet & Violet Era ───
  { name: 'Prismatic Evolutions', code: 'SV8.5',    era: 'Scarlet & Violet', apiSetIds: ['sv8pt5'] },
  { name: 'Mega Evolution',       code: 'me1',       era: 'Scarlet & Violet', apiSetIds: ['me1'] },
  { name: 'Phantasmal Flames',    code: 'me2',       era: 'Scarlet & Violet', apiSetIds: ['me2'] },
  { name: 'Surging Sparks',       code: 'SV7',       era: 'Scarlet & Violet', apiSetIds: ['sv8'] },
  { name: 'Stellar Crown',        code: 'SV7.5',     era: 'Scarlet & Violet', apiSetIds: ['sv7'] },
  { name: 'Shrouded Fable',       code: 'SV6.5',     era: 'Scarlet & Violet', apiSetIds: ['sv6pt5'] },
  { name: 'Twilight Masquerade',   code: 'SV6',       era: 'Scarlet & Violet', apiSetIds: ['sv6'] },
  { name: 'Temporal Forces',      code: 'SV5',       era: 'Scarlet & Violet', apiSetIds: ['sv5'] },
  { name: 'Paldean Fates',        code: 'SV4.5',     era: 'Scarlet & Violet', apiSetIds: ['sv4pt5'] },
  { name: 'Paradox Rift',         code: 'SV4',       era: 'Scarlet & Violet', apiSetIds: ['sv4'] },
  { name: '151',                   code: 'SV3.5',     era: 'Scarlet & Violet', apiSetIds: ['sv3pt5'] },
  { name: 'Obsidian Flames',      code: 'SV3',       era: 'Scarlet & Violet', apiSetIds: ['sv3'] },
  { name: 'Paldea Evolved',       code: 'SV2',       era: 'Scarlet & Violet', apiSetIds: ['sv2'] },
  { name: 'Scarlet & Violet',     code: 'SV1',       era: 'Scarlet & Violet', apiSetIds: ['sv1'] },

  // ─── Sword & Shield Era ───
  { name: 'Crown Zenith',    code: 'SWSH12.5', era: 'Sword & Shield', apiSetIds: ['swsh12pt5', 'swsh12pt5gg'] },
  { name: 'Evolving Skies',  code: 'SWSH7',    era: 'Sword & Shield', apiSetIds: ['swsh7'] },
  { name: 'Brilliant Stars', code: 'SWSH9',    era: 'Sword & Shield', apiSetIds: ['swsh9', 'swsh9tg'] },
  { name: 'Lost Origin',     code: 'SWSH11',   era: 'Sword & Shield', apiSetIds: ['swsh11', 'swsh11tg'] },
  { name: 'Silver Tempest',  code: 'SWSH12',   era: 'Sword & Shield', apiSetIds: ['swsh12', 'swsh12tg'] },
  { name: 'Astral Radiance', code: 'SWSH10',   era: 'Sword & Shield', apiSetIds: ['swsh10', 'swsh10tg'] },
  { name: 'Vivid Voltage',   code: 'SWSH4',    era: 'Sword & Shield', apiSetIds: ['swsh4'] },
  { name: 'Fusion Strike',   code: 'SWSH8',    era: 'Sword & Shield', apiSetIds: ['swsh8'] },
  { name: 'Chilling Reign',  code: 'SWSH6',    era: 'Sword & Shield', apiSetIds: ['swsh6'] },
  { name: 'Battle Styles',   code: 'SWSH5',    era: 'Sword & Shield', apiSetIds: ['swsh5'] },
  { name: 'Shining Fates',   code: 'SWSH4.5',  era: 'Sword & Shield', apiSetIds: ['swsh45', 'swsh45sv'] },

  // ─── Sun & Moon Era ───
  { name: 'Hidden Fates', code: 'SM11.5', era: 'Sun & Moon', apiSetIds: ['sm115', 'sma'] },

  // ─── Classic / XY Era ───
  { name: 'Base Set',    code: 'BS',   era: 'Classic', apiSetIds: ['base1'] },
  { name: 'Evolutions',  code: 'XY12', era: 'XY',      apiSetIds: ['xy12'] },
];

// ─── Rarity mapping ──────────────────────────────────────────────────────

function mapRarity(apiRarity) {
  if (!apiRarity) return 'common';
  const r = apiRarity.toLowerCase();

  if (r.includes('mega') && r.includes('illustration')) return 'megaIllustrationRare';
  if (r.includes('special') && r.includes('illustration')) return 'specialIllustrationRare';
  if (r.includes('special art rare')) return 'specialIllustrationRare';
  if (r.includes('illustration rare') && !r.includes('special') && !r.includes('mega')) return 'illustrationRare';
  if (r.includes('hyper rare')) return 'specialIllustrationRare';
  if (r.includes('ace spec')) return 'ultraRare';
  if (r.includes('secret')) return 'ultraRare';
  if (r.includes('double rare')) return 'ultraRare';
  if (r.includes('ultra rare')) return 'ultraRare';
  if (r.includes('shiny') && r.includes('ultra')) return 'ultraRare';
  if (r.includes('shiny')) return 'rare';
  if (r.includes('rare holo vmax') || r.includes('rare holo vstar')) return 'ultraRare';
  if (r.includes('rare holo v') || r.includes('rare holo gx') || r.includes('rare holo ex')) return 'ultraRare';
  if (r.includes('rare rainbow')) return 'specialIllustrationRare';
  if (r.includes('rare full art')) return 'illustrationRare';
  if (r.includes('amazing rare')) return 'ultraRare';
  if (r.includes('rare break') || r.includes('rare prime') || r.includes('rare prism')) return 'ultraRare';
  if (r.includes('rare holo')) return 'rare';
  if (r.includes('promo')) return 'rare';
  if (r === 'rare') return 'rare';
  if (r === 'uncommon') return 'uncommon';
  if (r === 'common') return 'common';
  return 'rare';
}

// ─── Card number utilities ───────────────────────────────────────────────

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

function padNumber(number) {
  if (/^\d+$/.test(number)) return number.padStart(3, '0');
  const match = number.match(/^([A-Za-z]+)(\d+)$/);
  if (match) return match[1] + match[2].padStart(2, '0');
  return number;
}

// ─── Strategy 1: GitHub raw data ─────────────────────────────────────────
// The PokemonTCG/pokemon-tcg-data repo has JSON files with complete card data
// including rarity. One file per set, no auth needed.

async function fetchFromGithub(apiSetId) {
  // Try master branch first, then main
  for (const branch of ['master', 'main']) {
    const url = `https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/${branch}/cards/en/${apiSetId}.json`;
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (resp.ok) {
        const cards = await resp.json();
        return cards; // Array of card objects with name, number, rarity, etc.
      }
    } catch {
      // Try next branch
    }
  }
  return null;
}

/**
 * Get printedTotal from the GitHub sets list.
 */
let _githubSetsCache = null;
async function getGithubPrintedTotal(apiSetId) {
  if (!_githubSetsCache) {
    for (const branch of ['master', 'main']) {
      try {
        const url = `https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/${branch}/sets/en.json`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (resp.ok) {
          _githubSetsCache = await resp.json();
          break;
        }
      } catch {
        // try next
      }
    }
  }
  if (!_githubSetsCache) return null;
  const set = _githubSetsCache.find(s => s.id === apiSetId);
  return set?.printedTotal || null;
}

// ─── Strategy 2: TCGdex fallback ─────────────────────────────────────────
// Free API, no auth. Requires individual card fetches for rarity data.

let _tcgdexSetsCache = null;

async function fetchTcgdexSetsList() {
  if (_tcgdexSetsCache) return _tcgdexSetsCache;
  const resp = await fetch(`${TCGDEX_BASE}/sets`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!resp.ok) throw new Error(`TCGdex sets returned ${resp.status}`);
  _tcgdexSetsCache = await resp.json();
  return _tcgdexSetsCache;
}

async function resolveTcgdexSetId(setName) {
  const sets = await fetchTcgdexSetsList();
  const nameLower = setName.toLowerCase();
  const exact = sets.find(s => s.name?.toLowerCase() === nameLower);
  if (exact) return exact.id;
  const contains = sets.find(s => s.name?.toLowerCase().includes(nameLower));
  if (contains) return contains.id;
  const reverse = sets.find(s => nameLower.includes(s.name?.toLowerCase()));
  if (reverse) return reverse.id;
  return null;
}

async function fetchFromTcgdex(setName) {
  const setId = await resolveTcgdexSetId(setName);
  if (!setId) {
    console.log(`    TCGdex: could not resolve set "${setName}"`);
    return null;
  }
  console.log(`    TCGdex: resolved "${setName}" → ${setId}`);

  // Get set detail for card list
  const setResp = await fetch(`${TCGDEX_BASE}/sets/${setId}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!setResp.ok) return null;
  const setData = await setResp.json();

  if (!setData.cards || setData.cards.length === 0) return null;

  // Fetch each card individually for rarity (TCGdex set endpoint doesn't include it)
  const cards = [];
  let fetched = 0;
  const total = setData.cards.length;
  const CONCURRENCY = 5;

  for (let i = 0; i < setData.cards.length; i += CONCURRENCY) {
    const batch = setData.cards.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (brief) => {
        const cardResp = await fetch(`${TCGDEX_BASE}/cards/${setId}-${brief.localId}`, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!cardResp.ok) return null;
        return await cardResp.json();
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const card = result.value;
        cards.push({
          name: card.name,
          number: card.localId || card.id?.split('-').pop() || '0',
          rarity: card.rarity || null,
        });
      }
      fetched++;
    }

    process.stdout.write(`\r    TCGdex: ${fetched}/${total} cards...`);
    await sleep(200);
  }

  console.log(`\r    TCGdex: ${cards.length}/${total} cards fetched`);
  return { cards, printedTotal: setData.cardCount?.total || null };
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Generating complete card catalog ===');
  console.log('Strategy: GitHub raw data → TCGdex fallback\n');

  const catalogEntries = [];
  let totalCards = 0;
  let githubHits = 0;
  let tcgdexHits = 0;
  let failures = 0;

  for (const setDef of SETS) {
    console.log(`[${setDef.code}] ${setDef.name}`);

    let allCards = [];
    let printedTotal = '000';
    let source = '';

    // Try GitHub first
    let githubWorked = false;
    for (const apiSetId of setDef.apiSetIds) {
      console.log(`  Trying GitHub: ${apiSetId}...`);
      const cards = await fetchFromGithub(apiSetId);
      if (cards && cards.length > 0) {
        githubWorked = true;
        console.log(`  GitHub: ${apiSetId} → ${cards.length} cards`);

        // Extract printed total from first main set
        if (apiSetId === setDef.apiSetIds[0]) {
          const pt = await getGithubPrintedTotal(apiSetId);
          if (pt) printedTotal = String(pt).padStart(3, '0');
        }

        // GitHub data has: id, name, number, rarity, images, etc.
        for (const card of cards) {
          allCards.push({
            name: card.name,
            number: card.number,
            rarity: card.rarity || null,
          });
        }
        source = 'GitHub';
      } else {
        console.log(`  GitHub: ${apiSetId} not found`);
      }
      await sleep(200);
    }

    // Fallback to TCGdex if GitHub had nothing
    if (allCards.length === 0) {
      console.log(`  Falling back to TCGdex...`);
      try {
        const result = await fetchFromTcgdex(setDef.name);
        if (result && result.cards.length > 0) {
          allCards = result.cards;
          if (result.printedTotal) {
            printedTotal = String(result.printedTotal).padStart(3, '0');
          }
          source = 'TCGdex';
        }
      } catch (err) {
        console.error(`  TCGdex error: ${err.message}`);
      }
    }

    if (allCards.length === 0) {
      console.warn(`  SKIPPED — no cards found from any source\n`);
      failures++;
      continue;
    }

    if (source === 'GitHub') githubHits++;
    else tcgdexHits++;

    // Deduplicate by number
    const seen = new Set();
    const uniqueCards = [];
    for (const card of allCards) {
      if (!seen.has(card.number)) {
        seen.add(card.number);
        uniqueCards.push(card);
      }
    }

    // Sort by number
    uniqueCards.sort(sortByNumber);

    // Build catalog cards with mapped rarities
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
    console.log(`  => ${catalogCards.length} cards (${source}, printedTotal: ${printedTotal})\n`);
  }

  if (catalogEntries.length === 0) {
    console.error('\nERROR: No sets were successfully fetched. Check your internet connection.');
    process.exit(1);
  }

  // ─── Write the catalog file ────────────────────────────────────────────
  console.log(`\n=== Writing catalog: ${catalogEntries.length} sets, ${totalCards} total cards ===`);
  console.log(`Sources: ${githubHits} from GitHub, ${tcgdexHits} from TCGdex, ${failures} failed\n`);

  let output = `/**
 * Pokemon TCG Card Catalog
 *
 * Complete card data for all tracked sets.
 * Auto-generated on ${new Date().toISOString().slice(0, 10)} from pokemon-tcg-data + TCGdex.
 *
 * Rarity tiers:
 *   common, uncommon, rare, ultraRare, illustrationRare,
 *   specialIllustrationRare, megaIllustrationRare
 *
 * To regenerate: node scripts/generateCatalog.js
 */

const CARD_CATALOG = [\n`;

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
        common: 'Common', uncommon: 'Uncommon', rare: 'Rare',
        ultraRare: 'Ultra Rare', illustrationRare: 'Illustration Rare',
        specialIllustrationRare: 'Special Illustration Rare',
        megaIllustrationRare: 'Mega Illustration Rare',
      };

      for (const rarity of RARITY_ORDER) {
        const cards = rarityGroups[rarity];
        if (!cards || cards.length === 0) continue;
        output += `      // ${RARITY_COMMENT[rarity]} (${cards.length})\n`;
        for (const card of cards) {
          output += `      { name: ${JSON.stringify(card.name)}, number: ${JSON.stringify(card.number)}, rarity: '${rarity}' },\n`;
        }
      }

      output += `    ]\n`;
      output += `  },\n\n`;
    }
  }

  output += `];\n\n`;
  output += `// ─── Derived data ${'─'.repeat(53)}──\n\n`;
  output += `/** All set names from the catalog */\n`;
  output += `export const CATALOG_SET_NAMES = CARD_CATALOG.map(s => s.name);\n\n`;
  output += `/** All unique card names from the catalog */\n`;
  output += `export const CATALOG_CARD_NAMES = [\n`;
  output += `  ...new Set(CARD_CATALOG.flatMap(s => s.cards.map(c => c.name)))\n`;
  output += `];\n\n`;
  output += `/** Rarity display labels and sort order */\n`;
  output += `export const RARITY_ORDER = [\n`;
  output += `  'common',\n  'uncommon',\n  'rare',\n  'ultraRare',\n`;
  output += `  'illustrationRare',\n  'specialIllustrationRare',\n  'megaIllustrationRare',\n`;
  output += `];\n\n`;
  output += `export const RARITY_LABELS = {\n`;
  output += `  common: 'Common',\n  uncommon: 'Uncommon',\n  rare: 'Rare',\n`;
  output += `  ultraRare: 'Ultra Rare',\n  illustrationRare: 'Illustration Rare',\n`;
  output += `  specialIllustrationRare: 'Special Illustration Rare',\n`;
  output += `  megaIllustrationRare: 'Mega Illustration Rare',\n`;
  output += `};\n\n`;
  output += `export default CARD_CATALOG;\n`;

  const outputPath = path.join(__dirname, '..', 'src', 'data', 'cardCatalog.js');
  fs.writeFileSync(outputPath, output, 'utf-8');
  console.log(`Written to ${outputPath}`);
  console.log(`\nDone! Next steps:`);
  console.log(`  1. node scripts/seedSetCards.js   (update images in DB)`);
  console.log(`  2. Restart the server`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
