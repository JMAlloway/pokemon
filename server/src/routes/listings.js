import { Router } from 'express';
import prisma from '../db.js';
import { flagPriceOutliers, getDealScoreBreakdown } from '../services/dealScoring.js';

const router = Router();

// GET /api/listings/:ebayListingId — Get full listing details
router.get('/:ebayListingId', async (req, res) => {
  try {
    const { ebayListingId } = req.params;
    const { searchQueryId } = req.query;

    // With per-search snapshots, the same eBay listing can appear in multiple
    // search queries. Use searchQueryId to target a specific snapshot, or fall
    // back to the first match (highest deal score).
    const listing = searchQueryId
      ? await prisma.ebayListing.findUnique({
          where: {
            searchQueryId_ebayListingId: { searchQueryId, ebayListingId }
          },
          include: {
            searchQuery: {
              select: { id: true, cardName: true, set: true, rarity: true, condition: true }
            },
            savedListing: true
          }
        })
      : await prisma.ebayListing.findFirst({
          where: { ebayListingId },
          orderBy: { dealScore: 'desc' },
          include: {
            searchQuery: {
              select: { id: true, cardName: true, set: true, rarity: true, condition: true }
            },
            savedListing: true
          }
        });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Get recent sold comps for this card
    const recentSold = await prisma.recentSoldListing.findMany({
      where: { cardName: listing.cardName },
      orderBy: { soldAt: 'desc' },
      take: 20
    });

    // Check if listing appears in other searches (per-search snapshots make this work)
    const otherSearches = await prisma.ebayListing.findMany({
      where: {
        ebayListingId,
        searchQueryId: { not: listing.searchQueryId }
      },
      include: {
        searchQuery: { select: { id: true, cardName: true, set: true } }
      }
    });

    // Calculate deal score breakdown
    const scoreBreakdown = getDealScoreBreakdown({
      hasTypo: listing.hasTypo,
      priceGapPercent: listing.priceGapPercent != null ? Number(listing.priceGapPercent) : null,
      recencyScore: listing.recencyScore != null ? Number(listing.recencyScore) : 50,
      typoConfidenceScore: listing.typoConfidenceScore != null ? Number(listing.typoConfidenceScore) : null,
      buyingOption: listing.buyingOption || 'FIXED_PRICE',
      bidCount: listing.bidCount,
      auctionEndDate: listing.auctionEndDate,
      shippingCost: listing.shippingCost != null ? Number(listing.shippingCost) : null
    });

    const userSaved = listing.savedListing?.userId === req.userId ? listing.savedListing : null;

    res.json({
      listing: {
        ...listing,
        isSaved: userSaved !== null,
        savedListingId: userSaved?.id || null,
        savedListing: undefined
      },
      scoreBreakdown,
      recentSoldListings: flagPriceOutliers(recentSold),
      alsoFoundIn: otherSearches.map(l => ({
        searchId: l.searchQuery.id,
        searchName: `${l.searchQuery.cardName}${l.searchQuery.set ? ' - ' + l.searchQuery.set : ''}`
      }))
    });
  } catch (error) {
    console.error('Get listing details error:', error);
    res.status(500).json({ error: 'Failed to load listing details' });
  }
});

export default router;
