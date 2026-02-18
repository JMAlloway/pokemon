import { Router } from 'express';
import prisma from '../db.js';
import { executeSearch } from '../services/backgroundJobs.js';
import { getRateLimitStatus } from '../services/ebayApi.js';

const router = Router();

/**
 * GET /api/snipe-watchlist — Get listings ending soon that are under market value.
 *
 * Query params:
 *   maxHours      — max hours until auction ends (default 6)
 *   maxBids       — max bid count to include (default 5)
 *   minGap        — minimum price gap % below market (default 0)
 *   minDealScore  — minimum deal score (default 0)
 *   buyingOption   — AUCTION, BIN, or all (default AUCTION)
 *   sets          — comma-separated set names to filter by
 *   cardNames     — comma-separated card names to filter by
 *   maxPrice      — max price in dollars
 */
router.get('/', async (req, res) => {
  try {
    const maxHours = Math.min(48, Math.max(1, parseInt(req.query.maxHours) || 6));
    const maxBids = Math.max(0, parseInt(req.query.maxBids) || 5);
    const minGap = parseFloat(req.query.minGap) || 0;
    const minDealScore = parseInt(req.query.minDealScore) || 0;
    const buyingOption = req.query.buyingOption || 'AUCTION';
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;

    // Parse set and card name filters
    const sets = req.query.sets
      ? req.query.sets.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const cardNames = req.query.cardNames
      ? req.query.cardNames.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const cutoff = new Date(Date.now() + maxHours * 60 * 60 * 1000);
    const now = new Date();

    // Build where clause for auctions
    const auctionWhere = {
      buyingOption: 'AUCTION',
      listingStatus: 'active',
      auctionEndDate: { gt: now, lte: cutoff },
      ...(maxBids < 100 ? { bidCount: { lte: maxBids } } : {}),
      ...(minGap > 0 ? { priceGapPercent: { gte: minGap } } : { priceGapPercent: { gt: 0 } }),
      ...(minDealScore > 0 ? { dealScore: { gte: minDealScore } } : {}),
      ...(maxPrice != null ? { currentPrice: { lte: maxPrice } } : {}),
      ...(sets.length > 0 ? { searchQuery: { set: { in: sets } } } : {}),
      ...(cardNames.length > 0 ? { cardName: { in: cardNames } } : {})
    };

    // Build where clause for BIN deals
    const binWhere = {
      buyingOption: 'FIXED_PRICE',
      listingStatus: 'active',
      ...(minGap > 0 ? { priceGapPercent: { gte: minGap } } : { priceGapPercent: { gt: 0 } }),
      ...(minDealScore > 0 ? { dealScore: { gte: minDealScore } } : {}),
      ...(maxPrice != null ? { currentPrice: { lte: maxPrice } } : {}),
      ...(sets.length > 0 ? { searchQuery: { set: { in: sets } } } : {}),
      ...(cardNames.length > 0 ? { cardName: { in: cardNames } } : {})
    };

    let auctions = [];
    let binDeals = [];

    // Fetch auctions
    if (buyingOption === 'AUCTION' || buyingOption === 'all') {
      auctions = await prisma.ebayListing.findMany({
        where: auctionWhere,
        orderBy: [{ auctionEndDate: 'asc' }],
        include: {
          searchQuery: { select: { id: true, cardName: true, set: true } }
        },
        take: 50
      });
    }

    // Fetch BIN deals
    if (buyingOption === 'BIN' || buyingOption === 'all') {
      binDeals = await prisma.ebayListing.findMany({
        where: binWhere,
        orderBy: [{ dealScore: 'desc' }],
        include: {
          searchQuery: { select: { id: true, cardName: true, set: true } }
        },
        take: 50
      });
    }

    // Group auctions by time urgency
    const nowMs = Date.now();
    const urgent = [];    // < 1 hour
    const soon = [];      // 1-6 hours
    const upcoming = [];  // 6+ hours

    for (const auction of auctions) {
      const hoursLeft = (new Date(auction.auctionEndDate) - nowMs) / (1000 * 60 * 60);
      const entry = {
        ...auction,
        hoursRemaining: Math.round(hoursLeft * 10) / 10,
        timeCategory: hoursLeft < 1 ? 'urgent' : hoursLeft < 6 ? 'soon' : 'upcoming'
      };

      if (hoursLeft < 1) urgent.push(entry);
      else if (hoursLeft < 6) soon.push(entry);
      else upcoming.push(entry);
    }

    // Format BIN deals
    const formattedBin = binDeals.map(d => ({
      ...d,
      hoursRemaining: null,
      timeCategory: 'bin'
    }));

    res.json({
      total: auctions.length + binDeals.length,
      urgent,
      soon,
      upcoming,
      binDeals: formattedBin
    });
  } catch (error) {
    console.error('Snipe watchlist error:', error);
    res.status(500).json({ error: 'Failed to load snipe watchlist' });
  }
});

/**
 * GET /api/snipe-watchlist/filter-options — Get available sets and card names for filters.
 * Returns distinct values from active listings.
 */
router.get('/filter-options', async (req, res) => {
  try {
    // Get distinct sets from search queries that have active listings
    const setsRaw = await prisma.searchQuery.findMany({
      where: {
        set: { not: null },
        ebayListings: { some: { listingStatus: 'active' } }
      },
      select: { set: true },
      distinct: ['set']
    });

    // Get distinct card names from active listings
    const cardNamesRaw = await prisma.ebayListing.findMany({
      where: { listingStatus: 'active' },
      select: { cardName: true },
      distinct: ['cardName']
    });

    res.json({
      sets: setsRaw.map(s => s.set).filter(Boolean).sort(),
      cardNames: cardNamesRaw.map(c => c.cardName).sort()
    });
  } catch (error) {
    console.error('Filter options error:', error);
    res.status(500).json({ error: 'Failed to load filter options' });
  }
});

/**
 * GET /api/snipe-watchlist/searches — Get available saved searches for the refresh picker.
 */
router.get('/searches', async (req, res) => {
  try {
    const searches = await prisma.searchQuery.findMany({
      where: { userId: req.userId },
      select: {
        id: true,
        cardName: true,
        set: true,
        lastExecutedAt: true,
        _count: { select: { ebayListings: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      searches: searches.map(s => ({
        id: s.id,
        cardName: s.cardName,
        set: s.set,
        lastExecutedAt: s.lastExecutedAt,
        listingCount: s._count.ebayListings
      }))
    });
  } catch (error) {
    console.error('Available searches error:', error);
    res.status(500).json({ error: 'Failed to load searches' });
  }
});

/**
 * POST /api/snipe-watchlist/refresh — Re-run selected saved searches via SSE.
 * Streams progress events so the frontend can show per-search status.
 *
 * Body: { searchIds: string[] }
 *
 * SSE events:
 *   { type: "start",    index, total, cardName }
 *   { type: "complete", index, total, cardName, listingsFound }
 *   { type: "error",    index, total, cardName, error }
 *   { type: "done",     refreshed, total, listingsFound, message }
 */
router.post('/refresh', async (req, res) => {
  const { searchIds } = req.body;

  if (!searchIds || !Array.isArray(searchIds) || searchIds.length === 0) {
    return res.status(400).json({ error: 'Select at least one search to refresh.' });
  }
  if (searchIds.length > 5) {
    return res.status(400).json({ error: 'Maximum 5 searches per refresh to stay within eBay rate limits.' });
  }

  const rl = getRateLimitStatus();
  if (rl.isLimited) {
    return res.status(429).json({
      error: `Rate limit in effect. Try again in ${Math.ceil(rl.retryAfterMs / 60000)} minutes.`,
      retryAfterMs: rl.retryAfterMs
    });
  }

  let searches;
  try {
    searches = await prisma.searchQuery.findMany({
      where: { userId: req.userId, id: { in: searchIds } }
    });
  } catch (error) {
    console.error('Snipe watchlist refresh error:', error);
    return res.status(500).json({ error: 'Failed to refresh watchlist data' });
  }

  if (searches.length === 0) {
    return res.json({ refreshed: 0, message: 'No matching searches found.' });
  }

  // Switch to SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let refreshed = 0;
  let totalListings = 0;

  for (let i = 0; i < searches.length; i++) {
    const search = searches[i];
    send({ type: 'start', index: i + 1, total: searches.length, cardName: search.cardName });

    try {
      const result = await executeSearch(search);
      if (result.success) {
        refreshed++;
        totalListings += result.listingsFound || 0;
      }
      send({ type: 'complete', index: i + 1, total: searches.length, cardName: search.cardName, listingsFound: result.listingsFound || 0 });
    } catch (err) {
      console.warn(`[SnipeRefresh] Failed to refresh "${search.cardName}":`, err.message);
      send({ type: 'error', index: i + 1, total: searches.length, cardName: search.cardName, error: err.message });
    }
  }

  send({
    type: 'done',
    refreshed,
    total: searches.length,
    listingsFound: totalListings,
    message: `Refreshed ${refreshed}/${searches.length} searches. ${totalListings} listings updated.`
  });

  res.end();
});

export default router;
