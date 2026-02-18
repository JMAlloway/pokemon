import { Router } from 'express';
import prisma from '../db.js';
import { flagPriceOutliers } from '../services/dealScoring.js';

const router = Router();

// GET /api/saved-deals — Get all saved deals for user
router.get('/', async (req, res) => {
  try {
    const { sort = 'savedAt', order = 'desc', status = 'active' } = req.query;

    const orderBy = {};
    if (sort === 'priceChange') {
      orderBy.priceChangePercent = order;
    } else if (sort === 'price') {
      orderBy.currentPrice = order;
    } else {
      orderBy.savedAt = order;
    }

    const savedDeals = await prisma.savedListing.findMany({
      where: {
        userId: req.userId,
        ...(status !== 'all' ? { status } : {})
      },
      include: {
        ebayListing: {
          include: {
            searchQuery: {
              select: { id: true, cardName: true, set: true }
            }
          }
        }
      },
      orderBy: [orderBy]
    });

    const deals = savedDeals.map(deal => ({
      id: deal.id,
      ebayListingId: deal.ebayListingId,
      priceAtSave: deal.priceAtSave,
      recentSoldPriceAtSave: deal.recentSoldPriceAtSave,
      dealScoreAtSave: deal.dealScoreAtSave,
      savedAt: deal.savedAt,
      currentPrice: deal.currentPrice || deal.ebayListing?.currentPrice,
      priceChangePercent: deal.priceChangePercent,
      status: deal.status,
      lastPriceCheckAt: deal.lastPriceCheckAt,
      listing: deal.ebayListing ? {
        cardName: deal.ebayListing.cardName,
        listingTitle: deal.ebayListing.listingTitle,
        listingUrl: deal.ebayListing.listingUrl,
        images: deal.ebayListing.images,
        sellerName: deal.ebayListing.sellerName,
        sellerRating: deal.ebayListing.sellerRating,
        sellerFeedbackPercent: deal.ebayListing.sellerFeedbackPercent,
        hasTypo: deal.ebayListing.hasTypo,
        typoDetails: deal.ebayListing.typoDetails,
        dealScore: deal.ebayListing.dealScore,
        priceGapPercent: deal.ebayListing.priceGapPercent,
        condition: deal.ebayListing.condition,
        description: deal.ebayListing.description,
        listingStatus: deal.ebayListing.listingStatus,
        searchQuery: deal.ebayListing.searchQuery
      } : null
    }));

    // Count notifications (sold/delisted since last check)
    const notifications = await prisma.savedListing.findMany({
      where: {
        userId: req.userId,
        status: { in: ['sold', 'delisted'] },
        lastPriceCheckAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      include: { ebayListing: { select: { cardName: true } } }
    });

    res.json({
      deals,
      notifications: notifications.map(n => ({
        id: n.id,
        cardName: n.ebayListing?.cardName,
        status: n.status,
        message: n.status === 'sold'
          ? `One of your saved deals sold: ${n.ebayListing?.cardName}`
          : `Listing removed by seller: ${n.ebayListing?.cardName}`
      }))
    });
  } catch (error) {
    console.error('Get saved deals error:', error);
    res.status(500).json({ error: 'Failed to load saved deals' });
  }
});

// POST /api/saved-deals — Save a listing to deals
router.post('/', async (req, res) => {
  try {
    const { ebayListingId } = req.body;

    if (!ebayListingId) {
      return res.status(400).json({ error: 'eBay listing ID required' });
    }

    // Find the listing — ebayListingId may exist in multiple search queries,
    // so use findFirst. The searchQueryId param can target a specific snapshot.
    const { searchQueryId } = req.body;
    const listing = searchQueryId
      ? await prisma.ebayListing.findUnique({
          where: {
            searchQueryId_ebayListingId: { searchQueryId, ebayListingId }
          }
        })
      : await prisma.ebayListing.findFirst({
          where: { ebayListingId }
        });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.listingStatus === 'sold') {
      return res.status(400).json({ error: 'This listing is no longer available' });
    }

    // Check for existing saved deal (by internal listing ID — per-search snapshot)
    const existing = await prisma.savedListing.findUnique({
      where: { listingId: listing.id }
    });

    if (existing) {
      return res.status(409).json({ error: 'This listing is already saved' });
    }

    const savedDeal = await prisma.savedListing.create({
      data: {
        userId: req.userId,
        listingId: listing.id,
        ebayListingId: listing.ebayListingId,
        priceAtSave: listing.currentPrice,
        recentSoldPriceAtSave: listing.recentSoldPrice,
        dealScoreAtSave: listing.dealScore,
        currentPrice: listing.currentPrice,
        priceChangePercent: 0
      }
    });

    res.status(201).json({
      message: 'Deal saved',
      savedDeal
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'This listing is already saved' });
    }
    console.error('Save deal error:', error);
    res.status(500).json({ error: 'Failed to save deal' });
  }
});

// DELETE /api/saved-deals/:id — Remove a saved deal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deal = await prisma.savedListing.findFirst({
      where: { id, userId: req.userId }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Saved deal not found' });
    }

    await prisma.savedListing.delete({ where: { id } });

    res.json({ message: 'Deal removed' });
  } catch (error) {
    console.error('Delete saved deal error:', error);
    res.status(500).json({ error: 'Failed to remove deal' });
  }
});

// GET /api/saved-deals/:id — Get single saved deal details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deal = await prisma.savedListing.findFirst({
      where: { id, userId: req.userId },
      include: {
        ebayListing: {
          include: {
            searchQuery: { select: { id: true, cardName: true, set: true } }
          }
        }
      }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Saved deal not found' });
    }

    // Get recent sold comps
    const recentSold = await prisma.recentSoldListing.findMany({
      where: { cardName: deal.ebayListing?.cardName },
      orderBy: { soldAt: 'desc' },
      take: 20
    });

    res.json({ deal, recentSoldListings: flagPriceOutliers(recentSold) });
  } catch (error) {
    console.error('Get saved deal error:', error);
    res.status(500).json({ error: 'Failed to load deal' });
  }
});

export default router;
