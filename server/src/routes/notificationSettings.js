import { Router } from 'express';
import prisma from '../db.js';
import { isEmailConfigured } from '../services/emailService.js';

const router = Router();

/**
 * GET /api/notification-settings — Get current notification settings.
 */
router.get('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        discordWebhookUrl: true,
        telegramBotToken: true,
        telegramChatId: true
      }
    });

    res.json({
      emailConfigured: isEmailConfigured(),
      discordConfigured: !!user?.discordWebhookUrl,
      telegramConfigured: !!(user?.telegramBotToken && user?.telegramChatId),
      discord: {
        webhookUrl: user?.discordWebhookUrl ? '••••' + user.discordWebhookUrl.slice(-20) : null
      },
      telegram: {
        configured: !!(user?.telegramBotToken && user?.telegramChatId),
        chatId: user?.telegramChatId || null
      }
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

/**
 * PUT /api/notification-settings — Update notification settings.
 */
router.put('/', async (req, res) => {
  try {
    const { discordWebhookUrl, telegramBotToken, telegramChatId } = req.body;
    const data = {};

    if (discordWebhookUrl !== undefined) {
      if (discordWebhookUrl && !discordWebhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        return res.status(400).json({ error: 'Invalid Discord webhook URL. Must start with https://discord.com/api/webhooks/' });
      }
      data.discordWebhookUrl = discordWebhookUrl || null;
    }

    if (telegramBotToken !== undefined) {
      data.telegramBotToken = telegramBotToken || null;
    }

    if (telegramChatId !== undefined) {
      data.telegramChatId = telegramChatId || null;
    }

    await prisma.user.update({
      where: { id: req.userId },
      data
    });

    res.json({ message: 'Notification settings updated' });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * POST /api/notification-settings/test — Send a test notification to all channels.
 */
router.post('/test', async (req, res) => {
  try {
    const { channel } = req.body; // 'discord' or 'telegram'
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { discordWebhookUrl: true, telegramBotToken: true, telegramChatId: true }
    });

    const testAlert = {
      name: 'Test Alert',
      alertType: 'BIN_DEAL',
      userId: req.userId
    };
    const testListings = [{
      cardName: 'Charizard ex',
      listingTitle: 'Test listing from PokeArb',
      price: 25.99,
      marketPrice: 45.00,
      priceGapPercent: 42.2,
      dealScore: 78,
      listingUrl: 'https://www.ebay.com',
      hoursRemaining: null,
      bidCount: null
    }];

    if (channel === 'discord') {
      if (!user?.discordWebhookUrl) {
        return res.status(400).json({ error: 'Discord webhook not configured' });
      }
      const response = await fetch(user.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'PokeArb',
          content: '**Test Alert** — This is a test notification from PokeArb',
          embeds: [{
            title: 'Charizard ex',
            description: 'Test listing from PokeArb',
            color: 0x6366f1,
            fields: [
              { name: 'Price', value: '$25.99', inline: true },
              { name: 'Market', value: '$45.00', inline: true },
              { name: 'Below Market', value: '42.2%', inline: true }
            ]
          }]
        })
      });
      if (!response.ok) throw new Error(`Discord returned ${response.status}`);
      return res.json({ success: true, message: 'Test message sent to Discord' });
    }

    if (channel === 'telegram') {
      if (!user?.telegramBotToken || !user?.telegramChatId) {
        return res.status(400).json({ error: 'Telegram not configured' });
      }
      const url = `https://api.telegram.org/bot${user.telegramBotToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user.telegramChatId,
          text: '*Test Alert from PokeArb*\n\nCharizard ex — $25.99 (42.2% below market)',
          parse_mode: 'Markdown'
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.description || `Telegram returned ${response.status}`);
      }
      return res.json({ success: true, message: 'Test message sent to Telegram' });
    }

    return res.status(400).json({ error: 'Specify channel: discord or telegram' });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: `Failed to send test: ${error.message}` });
  }
});

export default router;
