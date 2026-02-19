import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/chase-lists/sets — List available sets that have card data
router.get('/sets', async (req, res) => {
  try {
    const setsWithCards = await prisma.setCard.groupBy({
      by: ['setCode'],
      _count: { id: true },
      orderBy: { setCode: 'asc' }
    });

    const sets = setsWithCards.map(s => ({
      code: s.setCode,
      cardCount: s._count.id
    }));

    res.json(sets);
  } catch (error) {
    console.error('Get sets error:', error);
    res.status(500).json({ error: 'Failed to load sets' });
  }
});

// GET /api/chase-lists/sets/:setCode/cards — Get all cards in a set
router.get('/sets/:setCode/cards', async (req, res) => {
  try {
    const { setCode } = req.params;
    const cards = await prisma.setCard.findMany({
      where: { setCode },
      orderBy: { cardNumber: 'asc' }
    });

    if (cards.length === 0) {
      return res.status(404).json({ error: 'Set not found or has no cards' });
    }

    res.json(cards);
  } catch (error) {
    console.error('Get set cards error:', error);
    res.status(500).json({ error: 'Failed to load set cards' });
  }
});

// GET /api/chase-lists — Get all chase lists for the user
router.get('/', async (req, res) => {
  try {
    const lists = await prisma.chaseList.findMany({
      where: { userId: req.userId },
      include: {
        cards: {
          include: { setCard: true },
          orderBy: { setCard: { cardNumber: 'asc' } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = lists.map(list => {
      const needed = list.cards.filter(c => c.status === 'needed').length;
      const dealFound = list.cards.filter(c => c.status === 'dealFound').length;
      const purchased = list.cards.filter(c => c.status === 'purchased').length;
      const totalMarketValue = list.cards.reduce((sum, c) => {
        if (c.status === 'purchased') return sum;
        return sum + (c.setCard.marketPrice ? Number(c.setCard.marketPrice) : 0);
      }, 0);

      return {
        ...list,
        stats: { needed, dealFound, purchased, total: list.cards.length, totalMarketValue }
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Get chase lists error:', error);
    res.status(500).json({ error: 'Failed to load chase lists' });
  }
});

// GET /api/chase-lists/:id — Get a single chase list with cards and deals
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const list = await prisma.chaseList.findFirst({
      where: { id, userId: req.userId },
      include: {
        cards: {
          include: { setCard: true },
          orderBy: { setCard: { cardNumber: 'asc' } }
        }
      }
    });

    if (!list) {
      return res.status(404).json({ error: 'Chase list not found' });
    }

    const needed = list.cards.filter(c => c.status === 'needed').length;
    const dealFound = list.cards.filter(c => c.status === 'dealFound').length;
    const purchased = list.cards.filter(c => c.status === 'purchased').length;
    const totalMarketValue = list.cards.reduce((sum, c) => {
      if (c.status === 'purchased') return sum;
      return sum + (c.setCard.marketPrice ? Number(c.setCard.marketPrice) : 0);
    }, 0);

    res.json({
      ...list,
      stats: { needed, dealFound, purchased, total: list.cards.length, totalMarketValue }
    });
  } catch (error) {
    console.error('Get chase list error:', error);
    res.status(500).json({ error: 'Failed to load chase list' });
  }
});

// POST /api/chase-lists — Create a new chase list for a set
router.post('/', async (req, res) => {
  try {
    const { setCode, alertMinPercent, alertMaxPrice, alertCooldownMinutes } = req.body;

    if (!setCode) {
      return res.status(400).json({ error: 'Set code is required' });
    }

    // Verify set exists in our card database
    const setCards = await prisma.setCard.findMany({ where: { setCode } });
    if (setCards.length === 0) {
      return res.status(400).json({ error: 'Set not found in database' });
    }

    // Check for existing chase list for this set
    const existing = await prisma.chaseList.findFirst({
      where: { userId: req.userId, setCode }
    });
    if (existing) {
      return res.status(409).json({ error: 'Chase list already exists for this set', chaseListId: existing.id });
    }

    const list = await prisma.chaseList.create({
      data: {
        userId: req.userId,
        setCode,
        alertMinPercent: alertMinPercent || 10,
        alertMaxPrice: alertMaxPrice || null,
        alertCooldownMinutes: alertCooldownMinutes || 60
      }
    });

    res.status(201).json(list);
  } catch (error) {
    console.error('Create chase list error:', error);
    res.status(500).json({ error: 'Failed to create chase list' });
  }
});

// PUT /api/chase-lists/:id — Update chase list settings
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { alertMinPercent, alertMaxPrice, alertCooldownMinutes, scanEnabled } = req.body;

    const existing = await prisma.chaseList.findFirst({
      where: { id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Chase list not found' });
    }

    const updated = await prisma.chaseList.update({
      where: { id },
      data: {
        ...(alertMinPercent !== undefined ? { alertMinPercent } : {}),
        ...(alertMaxPrice !== undefined ? { alertMaxPrice } : {}),
        ...(alertCooldownMinutes !== undefined ? { alertCooldownMinutes } : {}),
        ...(scanEnabled !== undefined ? { scanEnabled } : {})
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update chase list error:', error);
    res.status(500).json({ error: 'Failed to update chase list' });
  }
});

// DELETE /api/chase-lists/:id — Delete a chase list
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.chaseList.findFirst({
      where: { id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Chase list not found' });
    }

    await prisma.chaseList.delete({ where: { id } });
    res.json({ message: 'Chase list deleted' });
  } catch (error) {
    console.error('Delete chase list error:', error);
    res.status(500).json({ error: 'Failed to delete chase list' });
  }
});

// POST /api/chase-lists/:id/cards — Add cards to chase list (toggle)
router.post('/:id/cards', async (req, res) => {
  try {
    const { id } = req.params;
    const { setCardIds } = req.body; // array of setCard IDs

    if (!Array.isArray(setCardIds) || setCardIds.length === 0) {
      return res.status(400).json({ error: 'setCardIds array is required' });
    }

    const list = await prisma.chaseList.findFirst({
      where: { id, userId: req.userId }
    });
    if (!list) {
      return res.status(404).json({ error: 'Chase list not found' });
    }

    // Add each card (skip duplicates)
    const results = [];
    for (const setCardId of setCardIds) {
      try {
        const card = await prisma.chaseListCard.create({
          data: { chaseListId: id, setCardId },
          include: { setCard: true }
        });
        results.push(card);
      } catch (e) {
        // Unique constraint violation = already in list, skip
        if (e.code === 'P2002') continue;
        throw e;
      }
    }

    res.status(201).json({ added: results.length, cards: results });
  } catch (error) {
    console.error('Add chase cards error:', error);
    res.status(500).json({ error: 'Failed to add cards' });
  }
});

// DELETE /api/chase-lists/:id/cards — Remove cards from chase list
router.delete('/:id/cards', async (req, res) => {
  try {
    const { id } = req.params;
    const { setCardIds } = req.body;

    if (!Array.isArray(setCardIds) || setCardIds.length === 0) {
      return res.status(400).json({ error: 'setCardIds array is required' });
    }

    const list = await prisma.chaseList.findFirst({
      where: { id, userId: req.userId }
    });
    if (!list) {
      return res.status(404).json({ error: 'Chase list not found' });
    }

    const deleted = await prisma.chaseListCard.deleteMany({
      where: {
        chaseListId: id,
        setCardId: { in: setCardIds }
      }
    });

    res.json({ removed: deleted.count });
  } catch (error) {
    console.error('Remove chase cards error:', error);
    res.status(500).json({ error: 'Failed to remove cards' });
  }
});

// PUT /api/chase-lists/:id/cards/:cardId/status — Update card status
router.put('/:id/cards/:cardId/status', async (req, res) => {
  try {
    const { id, cardId } = req.params;
    const { status } = req.body;

    if (!['needed', 'dealFound', 'purchased'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be needed, dealFound, or purchased' });
    }

    const list = await prisma.chaseList.findFirst({
      where: { id, userId: req.userId }
    });
    if (!list) {
      return res.status(404).json({ error: 'Chase list not found' });
    }

    const updated = await prisma.chaseListCard.update({
      where: { id: cardId },
      data: { status },
      include: { setCard: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update card status error:', error);
    res.status(500).json({ error: 'Failed to update card status' });
  }
});

// POST /api/chase-lists/:id/scan — Manually trigger a scan for deals
router.post('/:id/scan', async (req, res) => {
  try {
    const { id } = req.params;

    const list = await prisma.chaseList.findFirst({
      where: { id, userId: req.userId },
      include: {
        cards: {
          where: { status: { in: ['needed', 'dealFound'] } },
          include: { setCard: true }
        }
      }
    });

    if (!list) {
      return res.status(404).json({ error: 'Chase list not found' });
    }

    if (list.cards.length === 0) {
      return res.json({ message: 'No cards to scan', dealsFound: 0 });
    }

    // Import and run scanner
    const { scanChaseList } = await import('../services/chaseListScanner.js');
    const result = await scanChaseList(list);

    res.json(result);
  } catch (error) {
    console.error('Chase list scan error:', error);
    res.status(500).json({ error: 'Failed to scan chase list' });
  }
});

export default router;
