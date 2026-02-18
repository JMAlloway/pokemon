import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

/**
 * GET /api/portfolio/stats — Get portfolio summary stats.
 */
router.get('/stats', async (req, res) => {
  try {
    const purchases = await prisma.savedListing.findMany({
      where: { userId: req.userId, purchased: true },
      include: {
        ebayListing: {
          select: { cardName: true, listingTitle: true, images: true, listingUrl: true, recentSoldPrice: true }
        }
      }
    });

    let totalSpent = 0;
    let totalRevenue = 0;
    let totalFees = 0;
    let totalShipping = 0;
    let soldCount = 0;
    let unsoldCount = 0;
    let unrealizedValue = 0;

    for (const p of purchases) {
      const cost = Number(p.purchasePrice || 0);
      totalSpent += cost;

      if (p.soldPrice != null) {
        soldCount++;
        const revenue = Number(p.soldPrice);
        totalRevenue += revenue;
        totalFees += Number(p.platformFees || 0);
        totalShipping += Number(p.shippingPaid || 0);
      } else {
        unsoldCount++;
        // Unrealized value based on current market or current listing price
        const marketPrice = p.ebayListing?.recentSoldPrice
          ? Number(p.ebayListing.recentSoldPrice)
          : (p.currentPrice ? Number(p.currentPrice) : cost);
        unrealizedValue += marketPrice;
      }
    }

    const totalProfit = totalRevenue - totalSpent - totalFees - totalShipping;
    const roi = totalSpent > 0 ? Math.round((totalProfit / totalSpent) * 10000) / 100 : 0;

    res.json({
      totalCards: purchases.length,
      soldCount,
      unsoldCount,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalFees: Math.round(totalFees * 100) / 100,
      totalShipping: Math.round(totalShipping * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      roi,
      unrealizedValue: Math.round(unrealizedValue * 100) / 100
    });
  } catch (error) {
    console.error('Portfolio stats error:', error);
    res.status(500).json({ error: 'Failed to load portfolio stats' });
  }
});

/**
 * GET /api/portfolio — Get all portfolio items (purchased deals).
 */
router.get('/', async (req, res) => {
  try {
    const { sort = 'purchasedAt', order = 'desc' } = req.query;

    const orderBy = {};
    if (sort === 'profit') {
      orderBy.soldPrice = order; // approximate sort
    } else if (sort === 'purchasePrice') {
      orderBy.purchasePrice = order;
    } else {
      orderBy.purchasedAt = order;
    }

    const items = await prisma.savedListing.findMany({
      where: { userId: req.userId, purchased: true },
      include: {
        ebayListing: {
          select: {
            cardName: true,
            listingTitle: true,
            images: true,
            listingUrl: true,
            condition: true,
            recentSoldPrice: true,
            hasTypo: true,
            sellerName: true
          }
        }
      },
      orderBy: [orderBy]
    });

    const portfolio = items.map(item => {
      const cost = Number(item.purchasePrice || 0);
      const fees = Number(item.platformFees || 0);
      const shipping = Number(item.shippingPaid || 0);
      const sold = item.soldPrice ? Number(item.soldPrice) : null;
      const profit = sold != null ? sold - cost - fees - shipping : null;
      const roiPercent = cost > 0 && profit != null ? Math.round((profit / cost) * 10000) / 100 : null;

      return {
        id: item.id,
        cardName: item.ebayListing?.cardName || 'Unknown',
        listingTitle: item.ebayListing?.listingTitle,
        images: item.ebayListing?.images || [],
        listingUrl: item.ebayListing?.listingUrl,
        condition: item.ebayListing?.condition,
        hasTypo: item.ebayListing?.hasTypo,
        sellerName: item.ebayListing?.sellerName,
        purchasePrice: cost,
        purchasedAt: item.purchasedAt,
        soldPrice: sold,
        soldAt: item.soldAt,
        platformFees: fees,
        shippingPaid: shipping,
        profit,
        roiPercent,
        marketPrice: item.ebayListing?.recentSoldPrice ? Number(item.ebayListing.recentSoldPrice) : null,
        notes: item.notes,
        dealScoreAtSave: item.dealScoreAtSave
      };
    });

    res.json({ portfolio });
  } catch (error) {
    console.error('Portfolio list error:', error);
    res.status(500).json({ error: 'Failed to load portfolio' });
  }
});

/**
 * PUT /api/portfolio/:id — Update portfolio data for a saved deal.
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { purchasePrice, purchasedAt, soldPrice, soldAt, platformFees, shippingPaid, notes } = req.body;

    const deal = await prisma.savedListing.findFirst({
      where: { id, userId: req.userId }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const data = { purchased: true };
    if (purchasePrice !== undefined) data.purchasePrice = purchasePrice;
    if (purchasedAt !== undefined) data.purchasedAt = purchasedAt ? new Date(purchasedAt) : null;
    if (soldPrice !== undefined) data.soldPrice = soldPrice;
    if (soldAt !== undefined) data.soldAt = soldAt ? new Date(soldAt) : null;
    if (platformFees !== undefined) data.platformFees = platformFees;
    if (shippingPaid !== undefined) data.shippingPaid = shippingPaid;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.savedListing.update({
      where: { id },
      data
    });

    res.json({ message: 'Portfolio updated', deal: updated });
  } catch (error) {
    console.error('Portfolio update error:', error);
    res.status(500).json({ error: 'Failed to update portfolio' });
  }
});

export default router;
