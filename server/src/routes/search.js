import { Router } from 'express';
import prisma from '../db.js';

import { validateSearchQuery } from '../middleware/validate.js';
import { executeSearch } from '../services/backgroundJobs.js';
import { validateCardName, getAutocompleteSuggestions, getSetSuggestions } from '../services/pokemonTcg.js';
import { getRateLimitStatus } from '../services/ebayApi.js';
import { flagPriceOutliers } from '../services/dealScoring.js';
import CARD_CATALOG, { RARITY_LABELS, RARITY_ORDER } from '../data/cardCatalog.js';

const router = Router();

// POST /api/search — Execute a manual search
router.post('/', validateSearchQuery, async (req, res) => {
  const startTime = Date.now();
  try {
    const { cardName, set, rarity, condition, graded, language } = req.body;
    console.log(`[Search] POST /api/search for "${cardName}"`);

    // Check rate limit
    const rl = getRateLimitStatus();
    if (rl.isLimited) {
      return res.status(429).json({
        error: `Search temporarily unavailable. Please wait ${Math.ceil(rl.retryAfterMs / 60000)} minutes and try again.`,
        retryAfterMs: rl.retryAfterMs,
        retryAt: rl.retryAt
      });
    }

    // Validate card name against Pokemon TCG database
    const validation = await validateCardName(cardName);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.message,
        suggestions: validation.suggestions
      });
    }

    // Prisma only accepts enum values it was generated with.
    // If the generated client is stale, skip persisting the rarity
    // rather than crashing the search.
    const PRISMA_RARITY_VALUES = [
      'common', 'uncommon', 'rare', 'holoRare', 'ultraRare',
      'illustrationRare', 'specialIllustrationRare', 'megaIllustrationRare', 'other'
    ];
    const persistableRarity = rarity && PRISMA_RARITY_VALUES.includes(rarity) ? rarity : null;

    // Create or find a temporary search query for this manual search
    let searchQuery = await prisma.searchQuery.findFirst({
      where: {
        userId: req.userId,
        cardName: validation.name || cardName,
        set: set || null,
        searchFrequency: 'manual'
      }
    });

    if (!searchQuery) {
      try {
        searchQuery = await prisma.searchQuery.create({
          data: {
            userId: req.userId,
            cardName: validation.name || cardName,
            set: set || null,
            rarity: persistableRarity,
            condition: condition || null,
            searchFrequency: 'manual'
          }
        });
      } catch (createErr) {
        // If rarity enum is rejected (stale Prisma client), retry without it
        if (createErr.message?.includes('Invalid value for argument `rarity`')) {
          searchQuery = await prisma.searchQuery.create({
            data: {
              userId: req.userId,
              cardName: validation.name || cardName,
              set: set || null,
              rarity: null,
              condition: condition || null,
              searchFrequency: 'manual'
            }
          });
        } else {
          throw createErr;
        }
      }
    }

    // Attach runtime filters (not persisted to SearchQuery model)
    const searchWithFilters = { ...searchQuery, graded, language };

    // Execute search with a 45-second timeout to prevent hanging
    // (extra time for individual getItem shipping lookups)
    const searchTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Search timed out after 45 seconds')), 45000)
    );
    const result = await Promise.race([
      executeSearch(searchWithFilters),
      searchTimeout
    ]);

    if (!result.success) {
      // Check for cached results
      const cachedListings = await prisma.ebayListing.findMany({
        where: { searchQueryId: searchQuery.id, listingStatus: 'active' },
        orderBy: [{ dealScore: 'desc' }]
      });

      if (cachedListings.length > 0) {
        return res.json({
          listings: cachedListings,
          cached: true,
          cacheTimestamp: searchQuery.lastExecutedAt,
          error: 'Unable to fetch latest listings from eBay. Showing cached results.',
          searchQueryId: searchQuery.id
        });
      }

      if (result.statusCode === 429) {
        return res.status(429).json({
          error: `Search temporarily unavailable. Please wait and try again.`,
          retryAfterMs: result.retryAfterMs
        });
      }

      return res.status(502).json({
        error: 'Unable to fetch listings from eBay. Please check your connection and try again.',
        retryable: true
      });
    }

    // Fetch the stored results
    const listings = await prisma.ebayListing.findMany({
      where: { searchQueryId: searchQuery.id, listingStatus: 'active' },
      orderBy: { dealScore: 'desc' }
    });

    // Get recent sold comps for the card
    const recentSoldListings = await prisma.recentSoldListing.findMany({
      where: { cardName: searchQuery.cardName },
      orderBy: { soldAt: 'desc' },
      take: 20
    });

    console.log(`[Search] Returning ${listings.length} listings for "${req.body.cardName}" (${Date.now() - startTime}ms)`);

    // Normalize: ensure all listings show the same market baseline for this search.
    const normalizedListings = result.baseline != null
      ? listings.map(l => {
          const price = l.buyingOption === 'AUCTION'
            ? Number(l.currentBidPrice || l.currentPrice)
            : Number(l.currentPrice);
          const shipping = l.shippingCost != null ? Number(l.shippingCost) : null;
          const total = shipping != null ? price + shipping : null;
          const gap = (result.baseline > 0 && total != null)
            ? Math.round(((result.baseline - total) / result.baseline) * 10000) / 100
            : null;
          return { ...l, recentSoldPrice: result.baseline, priceGapPercent: gap };
        })
      : listings;

    res.json({
      listings: normalizedListings,
      recentSoldListings: flagPriceOutliers(recentSoldListings),
      baseline: result.baseline,
      recencyScore: result.recencyScore,
      sampleSize: result.sampleSize,
      baselineSource: result.baselineSource || 'ebay',
      searchQueryId: searchQuery.id,
      cached: false
    });
  } catch (error) {
    console.error(`[Search] Error for "${req.body?.cardName}" after ${Date.now() - startTime}ms:`, error.message);
    res.status(500).json({ error: 'Search failed. Please try again.' });
  }
});

// GET /api/search/autocomplete?q=char
router.get('/autocomplete', (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json({ suggestions: [] });
  }
  const suggestions = getAutocompleteSuggestions(q);
  res.json({ suggestions });
});

// GET /api/search/sets?q=base
router.get('/sets', (req, res) => {
  const { q } = req.query;
  const suggestions = getSetSuggestions(q);
  res.json({ suggestions });
});

// GET /api/search/validate?cardName=Charizard
router.get('/validate', async (req, res) => {
  const { cardName } = req.query;
  if (!cardName) {
    return res.status(400).json({ error: 'Card name required' });
  }
  const result = await validateCardName(cardName);
  res.json(result);
});

// GET /api/search/catalog — Return set/card catalog for the picker UI
router.get('/catalog', (req, res) => {
  res.json({ sets: CARD_CATALOG, rarityLabels: RARITY_LABELS, rarityOrder: RARITY_ORDER });
});

// GET /api/search/rate-limit
router.get('/rate-limit', (req, res) => {
  res.json(getRateLimitStatus());
});

export default router;
