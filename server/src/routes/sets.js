import { Router } from 'express';
import prisma from '../db.js';
import CARD_CATALOG, { RARITY_LABELS, RARITY_ORDER } from '../data/cardCatalog.js';

const router = Router();

const POKEMON_TCG_API_BASE = 'https://api.pokemontcg.io/v2';

// How long before we refresh pricing data (images are permanent)
const PRICE_REFRESH_TTL = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for set metadata (logo, symbol, etc.) — lightweight
const setMetaCache = new Map();
const SET_META_TTL = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Resolve a catalog set code to a pokemontcg.io set ID + metadata.
 */
async function resolveApiSet(setName, catalogCode, headers) {
  const cacheKey = `meta_${catalogCode}`;
  const cached = setMetaCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SET_META_TTL) return cached.data;

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

      setMetaCache.set(cacheKey, { data: match, timestamp: Date.now() });
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

  try {
    // 1. Check DB for existing card data
    const dbCards = await prisma.setCard.findMany({
      where: { setCode: catalogSet.code },
    });
    const dbMap = new Map(dbCards.map(c => [c.cardNumber, c]));

    // 2. Determine which cards need fetching (no images) or price refresh
    const needsImages = catalogSet.cards.filter(c => !dbMap.has(c.number) || !dbMap.get(c.number).imageLarge);
    const needsPriceRefresh = dbCards.filter(c =>
      c.imageLarge && Date.now() - new Date(c.priceUpdatedAt).getTime() > PRICE_REFRESH_TTL
    );

    const needsApiFetch = needsImages.length > 0;
    const needsPriceUpdate = needsPriceRefresh.length > 0;

    console.log(`[Sets] ${catalogSet.name}: ${dbCards.length} in DB, ${needsImages.length} need images, ${needsPriceRefresh.length} need price refresh`);

    // 3. Resolve set metadata (for logo/symbol) — only call API if we actually need to fetch
    const apiKey = process.env.POKEMON_TCG_API_KEY;
    const headers = apiKey ? { 'X-Api-Key': apiKey } : {};
    let apiSet = null;
    if (needsApiFetch || needsPriceUpdate) {
      apiSet = await resolveApiSet(catalogSet.name, catalogSet.code, headers);
    }

    // 4. Fetch from pokemontcg.io only if we need new images or price updates
    if (needsApiFetch || needsPriceUpdate) {
      const apiSetId = apiSet?.id;
      if (apiSetId) {
        console.log(`[Sets] Fetching cards from pokemontcg.io for "${catalogSet.name}" (set ID: ${apiSetId})`);
        let apiCards = [];
        let page = 1;
        const pageSize = 250;
        let hasMore = true;
        while (hasMore) {
          try {
            const url = `${POKEMON_TCG_API_BASE}/cards?q=set.id:"${apiSetId}"&page=${page}&pageSize=${pageSize}&select=name,number,rarity,images,tcgplayer,types,supertype,subtypes,hp`;
            const response = await fetch(url, { headers, signal: AbortSignal.timeout(45000) });
            if (!response.ok) break;
            const data = await response.json();
            const cards = data.data || [];
            apiCards.push(...cards);
            hasMore = cards.length === pageSize;
            page++;
          } catch (err) {
            console.warn(`[Sets] Page ${page} fetch failed: ${err.message}`);
            break;
          }
        }
        console.log(`[Sets] Fetched ${apiCards.length} cards from pokemontcg.io`);

        // 5. Upsert all fetched cards into DB
        let upsertCount = 0;
        for (const catalogCard of catalogSet.cards) {
          const cardNum = catalogCard.number.replace(/^0+/, '');
          const apiCard = apiCards.find(c => String(c.number).replace(/^0+/, '') === cardNum);
          if (!apiCard) continue;

          // Extract pricing
          let marketPrice = null, priceLow = null, priceHigh = null, priceVariant = null;
          if (apiCard.tcgplayer?.prices) {
            const variant = pickBestVariant(apiCard.tcgplayer.prices, catalogCard.rarity);
            if (variant) {
              const prices = apiCard.tcgplayer.prices[variant];
              marketPrice = prices.market || prices.mid || null;
              priceLow = prices.low || null;
              priceHigh = prices.high || null;
              priceVariant = variant;
            }
          }

          await prisma.setCard.upsert({
            where: { setCode_cardNumber: { setCode: catalogSet.code, cardNumber: catalogCard.number } },
            create: {
              setCode: catalogSet.code,
              cardNumber: catalogCard.number,
              cardName: catalogCard.name,
              rarity: catalogCard.rarity,
              imageSmall: apiCard.images?.small || null,
              imageLarge: apiCard.images?.large || null,
              marketPrice,
              priceLow,
              priceHigh,
              priceVariant,
              types: apiCard.types || [],
              supertype: apiCard.supertype || null,
              subtypes: apiCard.subtypes || [],
              hp: apiCard.hp || null,
            },
            update: {
              imageSmall: apiCard.images?.small || undefined,
              imageLarge: apiCard.images?.large || undefined,
              marketPrice,
              priceLow,
              priceHigh,
              priceVariant,
              types: apiCard.types || [],
              supertype: apiCard.supertype || null,
              subtypes: apiCard.subtypes || [],
              hp: apiCard.hp || null,
              priceUpdatedAt: new Date(),
            },
          });
          upsertCount++;
        }
        console.log(`[Sets] Stored ${upsertCount} cards in DB for "${catalogSet.name}"`);
      }
    }

    // 6. Read final data from DB (now populated)
    const finalDbCards = await prisma.setCard.findMany({
      where: { setCode: catalogSet.code },
    });
    const finalDbMap = new Map(finalDbCards.map(c => [c.cardNumber, c]));

    // 7. Build response by merging catalog + DB
    const cards = catalogSet.cards.map(catalogCard => {
      const db = finalDbMap.get(catalogCard.number);
      return {
        name: catalogCard.name,
        number: catalogCard.number,
        rarity: catalogCard.rarity,
        rarityLabel: RARITY_LABELS[catalogCard.rarity] || catalogCard.rarity,
        imageSmall: db?.imageSmall || null,
        imageLarge: db?.imageLarge || null,
        marketPrice: db?.marketPrice ? Number(db.marketPrice) : null,
        priceLow: db?.priceLow ? Number(db.priceLow) : null,
        priceHigh: db?.priceHigh ? Number(db.priceHigh) : null,
        priceVariant: db?.priceVariant || null,
        types: db?.types || [],
        supertype: db?.supertype || null,
        subtypes: db?.subtypes || [],
        hp: db?.hp || null,
        ebayListingCount: 0,
        bestEbayPrice: null,
      };
    });

    // 8. Enrich with live eBay data
    const enrichedCards = await enrichWithEbayData(cards, catalogSet.name);

    res.json({
      name: catalogSet.name,
      code: catalogSet.code,
      era: catalogSet.era,
      printedTotal: catalogSet.printedTotal,
      setLogo: apiSet?.images?.logo || null,
      setSymbol: apiSet?.images?.symbol || null,
      releaseDate: apiSet?.releaseDate || null,
      series: apiSet?.series || null,
      cards: enrichedCards,
    });
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
 * Pick the best price variant based on rarity.
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
