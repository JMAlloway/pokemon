import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

/**
 * GET /api/snipe-watchlist — Get auctions ending soon that are under market value.
 *
 * Query params:
 *   maxHours  — max hours until auction ends (default 6)
 *   maxBids   — max bid count to include (default 5)
 *   minGap    — minimum price gap % below market (default 0, meaning any below-market)
 */
router.get('/', async (req, res) => {
  try {
    const maxHours = Math.min(48, Math.max(1, parseInt(req.query.maxHours) || 6));
    const maxBids = Math.max(0, parseInt(req.query.maxBids) || 5);
    const minGap = parseFloat(req.query.minGap) || 0;

    const cutoff = new Date(Date.now() + maxHours * 60 * 60 * 1000);

    const auctions = await prisma.ebayListing.findMany({
      where: {
        buyingOption: 'AUCTION',
        listingStatus: 'active',
        auctionEndDate: {
          gt: new Date(),
          lte: cutoff
        },
        ...(maxBids < 100 ? { bidCount: { lte: maxBids } } : {}),
        ...(minGap > 0 ? { priceGapPercent: { gte: minGap } } : { priceGapPercent: { gt: 0 } })
      },
      orderBy: [
        { auctionEndDate: 'asc' }
      ],
      include: {
        searchQuery: {
          select: { id: true, cardName: true, set: true }
        }
      },
      take: 50
    });

    // Group by time urgency
    const now = Date.now();
    const urgent = [];    // < 1 hour
    const soon = [];      // 1-6 hours
    const upcoming = [];  // 6+ hours

    for (const auction of auctions) {
      const hoursLeft = (new Date(auction.auctionEndDate) - now) / (1000 * 60 * 60);
      const entry = {
        ...auction,
        hoursRemaining: Math.round(hoursLeft * 10) / 10,
        timeCategory: hoursLeft < 1 ? 'urgent' : hoursLeft < 6 ? 'soon' : 'upcoming'
      };

      if (hoursLeft < 1) urgent.push(entry);
      else if (hoursLeft < 6) soon.push(entry);
      else upcoming.push(entry);
    }

    res.json({
      total: auctions.length,
      urgent,
      soon,
      upcoming
    });
  } catch (error) {
    console.error('Snipe watchlist error:', error);
    res.status(500).json({ error: 'Failed to load snipe watchlist' });
  }
});

export default router;
