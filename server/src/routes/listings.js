import { Router } from 'express';
import prisma from '../db.js';


const router = Router();

// GET /api/listings/:ebayListingId — Get full listing details
router.get('/:ebayListingId', async (req, res) => {
  try {
    const { ebayListingId } = req.params;

    const listing = await prisma.ebayListing.findUnique({
      where: { ebayListingId },
      include: {
        searchQuery: {
          select: { id: true, cardName: true, set: true, rarity: true, condition: true }
        },
        savedListing: {
          where: { userId: req.userId },
          select: { id: true, savedAt: true, priceAtSave: true, priceChangePercent: true }
        }
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

    // Check if listing appears in other searches
    const otherSearches = await prisma.ebayListing.findMany({
      where: {
        ebayListingId,
        searchQueryId: { not: listing.searchQueryId }
      },
      include: {
        searchQuery: { select: { id: true, cardName: true, set: true } }
      }
    });

    res.json({
      listing: {
        ...listing,
        isSaved: listing.savedListing !== null,
        savedListingId: listing.savedListing?.id || null,
        savedListing: undefined
      },
      recentSoldListings: recentSold,
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
