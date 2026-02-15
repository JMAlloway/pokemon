import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

/**
 * GET /api/market-alerts — Get cards with significant price movement.
 *
 * Compares the most recent baseline price to the price from ~7 days ago.
 * Flags cards where the price shifted more than the threshold.
 *
 * Query params:
 *   threshold — minimum % change to flag (default 15)
 *   days      — lookback period in days (default 7)
 */
router.get('/', async (req, res) => {
  try {
    const threshold = Math.max(1, parseFloat(req.query.threshold) || 15);
    const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 7));

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all unique card names that have snapshots
    const recentSnapshots = await prisma.marketSnapshot.findMany({
      where: { capturedAt: { gte: cutoffDate } },
      orderBy: { capturedAt: 'desc' }
    });

    // Group snapshots by card name
    const cardMap = new Map();
    for (const snap of recentSnapshots) {
      if (!cardMap.has(snap.cardName)) {
        cardMap.set(snap.cardName, []);
      }
      cardMap.get(snap.cardName).push(snap);
    }

    const alerts = [];

    for (const [cardName, snapshots] of cardMap) {
      if (snapshots.length < 2) continue;

      // Most recent snapshot
      const latest = snapshots[0];
      // Oldest snapshot in the window (closest to `days` ago)
      const oldest = snapshots[snapshots.length - 1];

      const latestPrice = Number(latest.baselinePrice);
      const oldestPrice = Number(oldest.baselinePrice);

      if (oldestPrice <= 0) continue;

      const changePercent = Math.round(((latestPrice - oldestPrice) / oldestPrice) * 10000) / 100;

      if (Math.abs(changePercent) >= threshold) {
        alerts.push({
          cardName,
          set: latest.set,
          currentPrice: latestPrice,
          previousPrice: oldestPrice,
          changePercent,
          direction: changePercent > 0 ? 'up' : 'down',
          snapshotCount: snapshots.length,
          latestCapturedAt: latest.capturedAt,
          oldestCapturedAt: oldest.capturedAt
        });
      }
    }

    // Sort by absolute change magnitude
    alerts.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

    res.json({
      alerts,
      total: alerts.length,
      threshold,
      lookbackDays: days
    });
  } catch (error) {
    console.error('Market alerts error:', error);
    res.status(500).json({ error: 'Failed to load market alerts' });
  }
});

/**
 * GET /api/market-alerts/:cardName — Get price history for a specific card.
 *
 * Returns snapshots over time for charting.
 */
router.get('/:cardName', async (req, res) => {
  try {
    const { cardName } = req.params;
    const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 30));
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const snapshots = await prisma.marketSnapshot.findMany({
      where: {
        cardName,
        capturedAt: { gte: cutoffDate }
      },
      orderBy: { capturedAt: 'asc' }
    });

    if (snapshots.length === 0) {
      return res.json({ cardName, snapshots: [], trend: null });
    }

    const first = Number(snapshots[0].baselinePrice);
    const last = Number(snapshots[snapshots.length - 1].baselinePrice);
    const changePercent = first > 0
      ? Math.round(((last - first) / first) * 10000) / 100
      : 0;

    res.json({
      cardName,
      snapshots: snapshots.map(s => ({
        price: Number(s.baselinePrice),
        sampleSize: s.sampleSize,
        capturedAt: s.capturedAt
      })),
      trend: {
        startPrice: first,
        endPrice: last,
        changePercent,
        direction: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat'
      }
    });
  } catch (error) {
    console.error('Market history error:', error);
    res.status(500).json({ error: 'Failed to load price history' });
  }
});

export default router;
