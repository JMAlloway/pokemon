import { Router } from 'express';
import prisma from '../db.js';
import CARD_CATALOG, { RARITY_LABELS, RARITY_ORDER } from '../data/cardCatalog.js';

const router = Router();

const POKEMON_TCG_API_BASE = 'https://api.pokemontcg.io/v2';

// Cache for set card data (images + pricing from pokemontcg.io)
const setDataCache = new Map();
const SET_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Resolve a catalog set code to a pokemontcg.io set ID.
 * e.g. "Phantasmal Flames" (code "me2") → pokemontcg.io ID "mev2"
 */
async function resolveApiSetId(setName, catalogCode, headers) {
  const queries = [
    `name:"${setName}"`,
    `name:"${setName.split(' ').slice(-1)[0]}"`,
  ];
  if (catalogCode) queries.push(`id:"${catalogCode}"`);

  for (const q of queries) {
    try {
      const url = `${POKEMON_TCG_API_BASE}/sets?q=${encodeURIComponent(q)}&select=id,name,images,total,printedTotal,releaseDate,series`;
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
      if (!response.ok) continue;
      const data = await response.json();
      if (!data.data?.length) continue;

      const nameLower = setName.toLowerCase();
      const match = data.data.find(s => s.name.toLowerCase() === nameLower)
        || data.data.find(s => s.name.toLowerCase().includes(nameLower))
        || (catalogCode ? data.data.find(s => s.id.toLowerCase() === catalogCode.toLowerCase()) : null)
        || data.data[0];

      return match;
    } catch {
      continue;
    }
  }
  return null;
}

// GET /api/sets — List all sets from catalog
router.get('/', (req, res) => {
  const sets = CARD_CATALOG.map(s => ({
    name: s.name,
    code: s.code,
    era: s.era,
    printedTotal: s.printedTotal,
    cardCount: s.cards.length,
  }));
  res.json({ sets });
});

// GET /api/sets/:setCode — Get all cards in a set with images, pricing, and eBay data
router.get('/:setCode', async (req, res) => {
  const { setCode } = req.params;
  const catalogSet = CARD_CATALOG.find(s => s.code.toLowerCase() === setCode.toLowerCase());

  if (!catalogSet) {
    return res.status(404).json({ error: 'Set not found in catalog' });
  }

  // Check cache
  const cacheKey = `set_${setCode}`;
  const cached = setDataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SET_CACHE_TTL) {
    // Still enrich with live eBay counts (fast DB query)
    const cards = await enrichWithEbayData(cached.data.cards, catalogSet.name);
    return res.json({ ...cached.data, cards });
  }

  try {
    const apiKey = process.env.POKEMON_TCG_API_KEY;
    const headers = apiKey ? { 'X-Api-Key': apiKey } : {};

    // Resolve pokemontcg.io set ID
    const apiSet = await resolveApiSetId(catalogSet.name, catalogSet.code, headers);
    const apiSetId = apiSet?.id;

    let apiCards = [];
    if (apiSetId) {
      console.log(`[Sets] Resolved "${catalogSet.name}" → pokemontcg.io set "${apiSetId}"`);
      // Fetch all cards with images + pricing (pageSize=250 covers most sets)
      const url = `${POKEMON_TCG_API_BASE}/cards?q=set.id:"${apiSetId}"&pageSize=250&select=name,number,rarity,images,tcgplayer,types,supertype,subtypes,hp`;
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
      if (response.ok) {
        const data = await response.json();
        apiCards = data.data || [];
        console.log(`[Sets] Fetched ${apiCards.length} cards from pokemontcg.io for "${catalogSet.name}"`);
      }
    }

    // Merge catalog cards with API data
    const cards = catalogSet.cards.map(catalogCard => {
      // Match by card number (strip leading zeros for comparison)
      const cardNum = catalogCard.number.replace(/^0+/, '');
      const apiCard = apiCards.find(c => String(c.number).replace(/^0+/, '') === cardNum);

      // Extract best price variant
      let marketPrice = null;
      let priceVariant = null;
      let priceLow = null;
      let priceHigh = null;
      if (apiCard?.tcgplayer?.prices) {
        const variant = pickBestVariant(apiCard.tcgplayer.prices, catalogCard.rarity);
        if (variant) {
          const prices = apiCard.tcgplayer.prices[variant];
          marketPrice = prices.market || prices.mid || null;
          priceLow = prices.low || null;
          priceHigh = prices.high || null;
          priceVariant = variant;
        }
      }

      return {
        name: catalogCard.name,
        number: catalogCard.number,
        rarity: catalogCard.rarity,
        rarityLabel: RARITY_LABELS[catalogCard.rarity] || catalogCard.rarity,
        imageSmall: apiCard?.images?.small || null,
        imageLarge: apiCard?.images?.large || null,
        marketPrice,
        priceLow,
        priceHigh,
        priceVariant,
        types: apiCard?.types || [],
        supertype: apiCard?.supertype || null,
        subtypes: apiCard?.subtypes || [],
        hp: apiCard?.hp || null,
        // eBay data will be added by enrichWithEbayData
        ebayListingCount: 0,
        bestEbayPrice: null,
      };
    });

    const setData = {
      name: catalogSet.name,
      code: catalogSet.code,
      era: catalogSet.era,
      printedTotal: catalogSet.printedTotal,
      setLogo: apiSet?.images?.logo || null,
      setSymbol: apiSet?.images?.symbol || null,
      releaseDate: apiSet?.releaseDate || null,
      series: apiSet?.series || null,
      cards,
    };

    // Cache before enriching with eBay data (eBay data changes more frequently)
    setDataCache.set(cacheKey, { data: setData, timestamp: Date.now() });

    // Enrich with live eBay listing counts
    const enrichedCards = await enrichWithEbayData(cards, catalogSet.name);
    res.json({ ...setData, cards: enrichedCards });
  } catch (error) {
    console.error(`[Sets] Error fetching set "${catalogSet.name}":`, error.message);
    // Fallback: return catalog data without images
    const cards = catalogSet.cards.map(c => ({
      name: c.name,
      number: c.number,
      rarity: c.rarity,
      rarityLabel: RARITY_LABELS[c.rarity] || c.rarity,
      imageSmall: null,
      imageLarge: null,
      marketPrice: null,
      priceLow: null,
      priceHigh: null,
      priceVariant: null,
      types: [],
      supertype: null,
      subtypes: [],
      hp: null,
      ebayListingCount: 0,
      bestEbayPrice: null,
    }));
    res.json({
      name: catalogSet.name,
      code: catalogSet.code,
      era: catalogSet.era,
      printedTotal: catalogSet.printedTotal,
      setLogo: null,
      setSymbol: null,
      releaseDate: null,
      series: null,
      cards,
    });
  }
});

/**
 * Enrich cards with active eBay listing counts and best prices from our DB.
 */
async function enrichWithEbayData(cards, setName) {
  try {
    // Get all active listings that match this set's card names
    const cardNames = [...new Set(cards.map(c => c.name))];
    const listings = await prisma.ebayListing.findMany({
      where: {
        cardName: { in: cardNames },
        listingStatus: 'active',
      },
      select: {
        cardName: true,
        currentPrice: true,
        shippingCost: true,
      },
    });

    // Build a map: cardName → { count, bestPrice }
    const ebayMap = new Map();
    for (const listing of listings) {
      const key = listing.cardName;
      const totalPrice = Number(listing.currentPrice) + (Number(listing.shippingCost) || 0);
      const existing = ebayMap.get(key);
      if (!existing) {
        ebayMap.set(key, { count: 1, bestPrice: totalPrice });
      } else {
        existing.count++;
        if (totalPrice < existing.bestPrice) existing.bestPrice = totalPrice;
      }
    }

    return cards.map(card => {
      const ebay = ebayMap.get(card.name);
      return {
        ...card,
        ebayListingCount: ebay?.count || 0,
        bestEbayPrice: ebay?.bestPrice || null,
      };
    });
  } catch (error) {
    console.error('[Sets] Error enriching with eBay data:', error.message);
    return cards;
  }
}

/**
 * Pick the best price variant based on rarity (same logic as pokemonTcg.js).
 */
function pickBestVariant(prices, rarity) {
  const variants = Object.keys(prices);
  if (variants.length === 0) return null;
  if (variants.length === 1) return variants[0];

  const highRarities = ['ultraRare', 'illustrationRare', 'specialIllustrationRare', 'megaIllustrationRare'];
  if (rarity && highRarities.includes(rarity)) {
    if (prices.holofoil) return 'holofoil';
  }
  if (rarity === 'common' || rarity === 'uncommon') {
    if (prices.normal) return 'normal';
    if (prices.reverseHolofoil) return 'reverseHolofoil';
  }

  const preferenceOrder = ['holofoil', 'normal', 'reverseHolofoil', '1stEditionHolofoil', 'unlimitedHolofoil'];
  for (const v of preferenceOrder) {
    if (prices[v]?.market || prices[v]?.mid) return v;
  }
  return variants.find(v => prices[v]?.market || prices[v]?.mid) || variants[0];
}

export default router;
