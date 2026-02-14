import { Router } from 'express';
import prisma from '../db.js';

import { validateSearchQuery } from '../middleware/validate.js';
import { executeSearch } from '../services/backgroundJobs.js';
import { flagPriceOutliers } from '../services/dealScoring.js';
import { validateCardName } from '../services/pokemonTcg.js';
import { getRateLimitStatus } from '../services/ebayApi.js';

const router = Router();

// GET /api/saved-searches — List all saved searches for user
router.get('/', async (req, res) => {
  try {
    const searches = await prisma.searchQuery.findMany({
      where: { userId: req.userId },
      include: {
        _count: { select: { ebayListings: true } },
        backgroundJobLogs: {
          orderBy: { executedAt: 'desc' },
          take: 1,
          select: { status: true, executedAt: true, listingsFound: true, errorMessage: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Count new listings since last check per search
    const enriched = searches.map(search => {
      const lastJob = search.backgroundJobLogs[0];
      return {
        ...search,
        totalListings: search._count.ebayListings,
        lastJobStatus: lastJob?.status || null,
        lastJobAt: lastJob?.executedAt || null,
        lastJobListings: lastJob?.listingsFound || 0,
        lastJobError: lastJob?.errorMessage || null,
        backgroundJobLogs: undefined,
        _count: undefined
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({ error: 'Failed to load searches' });
  }
});

// POST /api/saved-searches — Create a new saved search
router.post('/', validateSearchQuery, async (req, res) => {
  try {
    const { cardName, set, rarity, condition, searchFrequency, priceThresholdPercent } = req.body;

    // Validate card name
    const validation = await validateCardName(cardName);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.message,
        suggestions: validation.suggestions
      });
    }

    const resolvedName = validation.name || cardName;

    // Check for duplicate saved search
    const existing = await prisma.searchQuery.findFirst({
      where: {
        userId: req.userId,
        cardName: resolvedName,
        set: set || null
      }
    });

    if (existing) {
      // Run the existing search instead of creating a duplicate
      const result = await executeSearch(existing);
      const listings = await prisma.ebayListing.findMany({
        where: { searchQueryId: existing.id, listingStatus: 'active' },
        orderBy: { dealScore: 'desc' }
      });
      return res.json({ search: existing, listings, searchResult: result });
    }

    const search = await prisma.searchQuery.create({
      data: {
        userId: req.userId,
        cardName: resolvedName,
        set: set || null,
        rarity: rarity || null,
        condition: condition || null,
        searchFrequency: searchFrequency || 'manual',
        priceThresholdPercent: priceThresholdPercent || null
      }
    });

    // Execute initial search immediately
    const result = await executeSearch(search);

    const listings = await prisma.ebayListing.findMany({
      where: { searchQueryId: search.id, listingStatus: 'active' },
      orderBy: { dealScore: 'desc' }
    });

    res.status(201).json({
      search,
      listings,
      searchResult: result
    });
  } catch (error) {
    console.error('Create saved search error:', error);
    res.status(500).json({ error: 'Failed to create search' });
  }
});

// PUT /api/saved-searches/:id — Update a saved search
router.put('/:id', validateSearchQuery, async (req, res) => {
  try {
    const { id } = req.params;
    const { cardName, set, rarity, condition, searchFrequency, priceThresholdPercent } = req.body;

    const existing = await prisma.searchQuery.findFirst({
      where: { id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Search not found' });
    }

    const validation = await validateCardName(cardName);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message, suggestions: validation.suggestions });
    }

    const updated = await prisma.searchQuery.update({
      where: { id },
      data: {
        cardName: validation.name || cardName,
        set: set || null,
        rarity: rarity || null,
        condition: condition || null,
        searchFrequency: searchFrequency || existing.searchFrequency,
        priceThresholdPercent: priceThresholdPercent !== undefined ? priceThresholdPercent : existing.priceThresholdPercent
      }
    });

    // Re-execute search with updated criteria
    const result = await executeSearch(updated);

    const listings = await prisma.ebayListing.findMany({
      where: { searchQueryId: updated.id, listingStatus: 'active' },
      orderBy: { dealScore: 'desc' }
    });

    res.json({ search: updated, listings, searchResult: result });
  } catch (error) {
    console.error('Update saved search error:', error);
    res.status(500).json({ error: 'Failed to update search' });
  }
});

// DELETE /api/saved-searches/:id — Delete a saved search
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.searchQuery.findFirst({
      where: { id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Search not found' });
    }

    await prisma.searchQuery.delete({ where: { id } });

    res.json({ message: 'Search deleted' });
  } catch (error) {
    console.error('Delete saved search error:', error);
    res.status(500).json({ error: 'Failed to delete search' });
  }
});

// POST /api/saved-searches/:id/run — Manually trigger a saved search
router.post('/:id/run', async (req, res) => {
  try {
    const { id } = req.params;

    const rl = getRateLimitStatus();
    if (rl.isLimited) {
      return res.status(429).json({
        error: `Rate limit in effect. Your search will run in ${Math.ceil(rl.retryAfterMs / 60000)} minutes.`,
        retryAfterMs: rl.retryAfterMs
      });
    }

    const search = await prisma.searchQuery.findFirst({
      where: { id, userId: req.userId }
    });

    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }

    const result = await executeSearch(search);

    const listings = await prisma.ebayListing.findMany({
      where: { searchQueryId: search.id, listingStatus: 'active' },
      orderBy: { dealScore: 'desc' }
    });

    if (!result.success) {
      // Return cached results if available
      if (listings.length > 0) {
        return res.json({
          listings,
          cached: true,
          cacheTimestamp: search.lastExecutedAt,
          error: `Unable to fetch latest listings. Showing results from ${search.lastExecutedAt?.toISOString() || 'cache'}.`
        });
      }
      return res.status(502).json({
        error: 'Unable to fetch listings from eBay. Please check your connection and try again.',
        retryable: true
      });
    }

    res.json({
      listings,
      baseline: result.baseline,
      recencyScore: result.recencyScore,
      sampleSize: result.sampleSize,
      cached: false
    });
  } catch (error) {
    console.error('Run saved search error:', error);
    res.status(500).json({ error: 'Failed to run search' });
  }
});

// GET /api/saved-searches/:id/listings — Get listings for a saved search
router.get('/:id/listings', async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'active', sort = 'dealScore', order = 'desc' } = req.query;

    const search = await prisma.searchQuery.findFirst({
      where: { id, userId: req.userId }
    });

    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }

    const orderBy = {};
    orderBy[sort === 'price' ? 'currentPrice' : sort === 'typo' ? 'hasTypo' : 'dealScore'] = order;

    const listings = await prisma.ebayListing.findMany({
      where: {
        searchQueryId: id,
        ...(status !== 'all' ? { listingStatus: status } : {})
      },
      orderBy: [orderBy],
      include: {
        savedListing: {
          select: { id: true, savedAt: true }
        }
      }
    });

    // Get recent sold listings for the card
    const soldListings = await prisma.recentSoldListing.findMany({
      where: { cardName: search.cardName },
      orderBy: { soldAt: 'desc' },
      take: 20
    });

    res.json({
      listings: listings.map(l => ({
        ...l,
        isSaved: l.savedListing !== null,
        savedListingId: l.savedListing?.id || null,
        savedListing: undefined
      })),
      recentSoldListings: flagPriceOutliers(soldListings),
      searchQuery: search
    });
  } catch (error) {
    console.error('Get search listings error:', error);
    res.status(500).json({ error: 'Failed to load listings' });
  }
});

export default router;
