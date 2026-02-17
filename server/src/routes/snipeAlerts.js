import { Router } from 'express';
import prisma from '../db.js';
import { isEmailConfigured } from '../services/emailService.js';

const router = Router();

/**
 * GET /api/snipe-alerts — List all snipe alerts for the user.
 */
router.get('/', async (req, res) => {
  try {
    const alerts = await prisma.snipeAlert.findMany({
      where: { userId: req.userId },
      include: {
        _count: { select: { alertHistory: true } },
        alertHistory: {
          orderBy: { triggeredAt: 'desc' },
          take: 1,
          select: { triggeredAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = alerts.map(a => ({
      ...a,
      triggerCount: a._count.alertHistory,
      lastTriggered: a.alertHistory[0]?.triggeredAt || a.lastTriggeredAt,
      _count: undefined,
      alertHistory: undefined
    }));

    res.json({ alerts: result, emailConfigured: isEmailConfigured() });
  } catch (error) {
    console.error('Failed to fetch snipe alerts:', error);
    res.status(500).json({ error: 'Failed to fetch snipe alerts' });
  }
});

/**
 * POST /api/snipe-alerts — Create a new snipe alert.
 */
router.post('/', async (req, res) => {
  try {
    const {
      name, alertType, sets, cardNames,
      maxHoursRemaining, maxBids,
      minPriceGapPercent, maxPriceDollars, minDealScore,
      cooldownMinutes
    } = req.body;

    if (!name || !alertType) {
      return res.status(400).json({ error: 'Name and alert type are required' });
    }

    if (!['AUCTION_ENDING', 'BIN_DEAL'].includes(alertType)) {
      return res.status(400).json({ error: 'alertType must be AUCTION_ENDING or BIN_DEAL' });
    }

    const alert = await prisma.snipeAlert.create({
      data: {
        userId: req.userId,
        name: name.substring(0, 255),
        alertType,
        sets: sets || [],
        cardNames: cardNames || [],
        maxHoursRemaining: maxHoursRemaining != null ? Math.max(1, Math.min(48, maxHoursRemaining)) : null,
        maxBids: maxBids != null ? Math.max(0, maxBids) : null,
        minPriceGapPercent: minPriceGapPercent != null ? minPriceGapPercent : null,
        maxPriceDollars: maxPriceDollars != null ? maxPriceDollars : null,
        minDealScore: minDealScore != null ? Math.max(0, Math.min(100, minDealScore)) : null,
        cooldownMinutes: cooldownMinutes || 60
      }
    });

    res.status(201).json(alert);
  } catch (error) {
    console.error('Failed to create snipe alert:', error);
    res.status(500).json({ error: 'Failed to create snipe alert' });
  }
});

/**
 * PUT /api/snipe-alerts/:id — Update a snipe alert.
 */
router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.snipeAlert.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) return res.status(404).json({ error: 'Alert not found' });

    const {
      name, alertType, sets, cardNames,
      maxHoursRemaining, maxBids,
      minPriceGapPercent, maxPriceDollars, minDealScore,
      enabled, cooldownMinutes
    } = req.body;

    const alert = await prisma.snipeAlert.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.substring(0, 255) }),
        ...(alertType !== undefined && { alertType }),
        ...(sets !== undefined && { sets }),
        ...(cardNames !== undefined && { cardNames }),
        ...(maxHoursRemaining !== undefined && { maxHoursRemaining }),
        ...(maxBids !== undefined && { maxBids }),
        ...(minPriceGapPercent !== undefined && { minPriceGapPercent }),
        ...(maxPriceDollars !== undefined && { maxPriceDollars }),
        ...(minDealScore !== undefined && { minDealScore }),
        ...(enabled !== undefined && { enabled }),
        ...(cooldownMinutes !== undefined && { cooldownMinutes })
      }
    });

    res.json(alert);
  } catch (error) {
    console.error('Failed to update snipe alert:', error);
    res.status(500).json({ error: 'Failed to update snipe alert' });
  }
});

/**
 * DELETE /api/snipe-alerts/:id — Delete a snipe alert.
 */
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.snipeAlert.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) return res.status(404).json({ error: 'Alert not found' });

    await prisma.snipeAlert.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete snipe alert:', error);
    res.status(500).json({ error: 'Failed to delete snipe alert' });
  }
});

/**
 * GET /api/snipe-alerts/:id/history — Get trigger history for an alert.
 */
router.get('/:id/history', async (req, res) => {
  try {
    const existing = await prisma.snipeAlert.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) return res.status(404).json({ error: 'Alert not found' });

    const history = await prisma.alertHistory.findMany({
      where: { snipeAlertId: req.params.id },
      orderBy: { triggeredAt: 'desc' },
      take: 50
    });

    res.json({ history });
  } catch (error) {
    console.error('Failed to fetch alert history:', error);
    res.status(500).json({ error: 'Failed to fetch alert history' });
  }
});

export default router;
