import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

/**
 * GET /api/sellers — Get seller intelligence rankings.
 *
 * Returns sellers ranked by deal frequency, with stats on how often
 * they appear with good deals, typos, and their average deal scores.
 *
 * Query params:
 *   sort    — 'deals' (default), 'score', 'recent', 'listings'
 *   limit   — max results (default 25)
 *   minDeals — minimum deals to include (default 1)
 */
router.get('/', async (req, res) => {
  try {
    const sort = req.query.sort || 'deals';
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const minDeals = Math.max(0, parseInt(req.query.minDeals) || 1);

    const orderBy = {};
    if (sort === 'score') orderBy.avgDealScore = 'desc';
    else if (sort === 'recent') orderBy.lastSeenAt = 'desc';
    else if (sort === 'listings') orderBy.totalListingsSeen = 'desc';
    else orderBy.dealsCount = 'desc';

    const sellers = await prisma.sellerProfile.findMany({
      where: {
        dealsCount: { gte: minDeals }
      },
      orderBy: [orderBy],
      take: limit
    });

    // Enrich with deal rate
    const enriched = sellers.map(seller => ({
      ...seller,
      dealRate: seller.totalListingsSeen > 0
        ? Math.round((seller.dealsCount / seller.totalListingsSeen) * 100)
        : 0,
      typoRate: seller.totalListingsSeen > 0
        ? Math.round((seller.typosCount / seller.totalListingsSeen) * 100)
        : 0
    }));

    res.json({
      sellers: enriched,
      total: enriched.length
    });
  } catch (error) {
    console.error('Seller intelligence error:', error);
    res.status(500).json({ error: 'Failed to load seller data' });
  }
});

/**
 * GET /api/sellers/:sellerName — Get detailed info for a specific seller.
 */
router.get('/:sellerName', async (req, res) => {
  try {
    const { sellerName } = req.params;

    const profile = await prisma.sellerProfile.findUnique({
      where: { sellerName }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Get their current active listings
    const activeListings = await prisma.ebayListing.findMany({
      where: {
        sellerName,
        listingStatus: 'active'
      },
      orderBy: { dealScore: 'desc' },
      take: 20,
      include: {
        searchQuery: {
          select: { id: true, cardName: true, set: true }
        }
      }
    });

    res.json({
      profile: {
        ...profile,
        dealRate: profile.totalListingsSeen > 0
          ? Math.round((profile.dealsCount / profile.totalListingsSeen) * 100)
          : 0,
        typoRate: profile.totalListingsSeen > 0
          ? Math.round((profile.typosCount / profile.totalListingsSeen) * 100)
          : 0
      },
      activeListings
    });
  } catch (error) {
    console.error('Seller detail error:', error);
    res.status(500).json({ error: 'Failed to load seller details' });
  }
});

export default router;
