import { sendSnipeAlertEmail } from './emailService.js';
import prisma from '../db.js';

/**
 * Send a Discord webhook message for a snipe alert.
 */
async function sendDiscordWebhook(webhookUrl, { alert, listings }) {
  const isAuction = alert.alertType === 'AUCTION_ENDING';

  const embeds = listings.slice(0, 10).map(l => {
    const fields = [
      { name: 'Price', value: `$${Number(l.price).toFixed(2)}`, inline: true }
    ];
    if (l.marketPrice) {
      fields.push({ name: 'Market', value: `$${Number(l.marketPrice).toFixed(2)}`, inline: true });
    }
    if (l.priceGapPercent) {
      fields.push({ name: 'Below Market', value: `${Number(l.priceGapPercent).toFixed(1)}%`, inline: true });
    }
    if (l.hoursRemaining != null) {
      const timeStr = l.hoursRemaining < 1
        ? `${Math.round(l.hoursRemaining * 60)}m`
        : `${Math.round(l.hoursRemaining)}h`;
      fields.push({ name: 'Time Left', value: timeStr, inline: true });
    }
    if (l.bidCount != null) {
      fields.push({ name: 'Bids', value: `${l.bidCount}`, inline: true });
    }

    return {
      title: l.cardName,
      description: l.listingTitle.substring(0, 100),
      url: l.listingUrl,
      color: isAuction ? 0x8b5cf6 : 0x6366f1,
      fields
    };
  });

  const payload = {
    username: 'PokeArb',
    content: isAuction
      ? `**Snipe Alert: ${alert.name}** — ${listings.length} auction(s) ending soon`
      : `**BIN Deal: ${alert.name}** — ${listings.length} listing(s) below target`,
    embeds
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Discord webhook returned ${response.status}`);
    }
    console.log(`[Discord] Sent alert "${alert.name}" (${listings.length} listings)`);
    return true;
  } catch (err) {
    console.error(`[Discord] Failed to send alert "${alert.name}":`, err.message);
    return false;
  }
}

/**
 * Send a Telegram message for a snipe alert.
 */
async function sendTelegramMessage(botToken, chatId, { alert, listings }) {
  const isAuction = alert.alertType === 'AUCTION_ENDING';
  const header = isAuction
    ? `*Snipe Alert: ${escapeMarkdown(alert.name)}*\n${listings.length} auction(s) ending soon\n`
    : `*BIN Deal: ${escapeMarkdown(alert.name)}*\n${listings.length} listing(s) below target\n`;

  const listingLines = listings.slice(0, 10).map(l => {
    const gap = l.priceGapPercent ? ` (${Number(l.priceGapPercent).toFixed(1)}% below)` : '';
    const time = l.hoursRemaining != null
      ? l.hoursRemaining < 1
        ? ` | ${Math.round(l.hoursRemaining * 60)}m left`
        : ` | ${Math.round(l.hoursRemaining)}h left`
      : '';
    return `• [${escapeMarkdown(l.cardName)}](${l.listingUrl}) — $${Number(l.price).toFixed(2)}${gap}${time}`;
  });

  const text = header + '\n' + listingLines.join('\n');

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.description || `Telegram API returned ${response.status}`);
    }
    console.log(`[Telegram] Sent alert "${alert.name}" (${listings.length} listings)`);
    return true;
  } catch (err) {
    console.error(`[Telegram] Failed to send alert "${alert.name}":`, err.message);
    return false;
  }
}

function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/**
 * Send alert through all configured notification channels.
 * Returns true if at least one channel succeeded.
 */
export async function sendAlertNotifications({ alert, listings }) {
  const results = [];

  // Email (existing)
  const emailSent = await sendSnipeAlertEmail({ alert, listings });
  results.push(emailSent);

  // Get user's notification settings
  try {
    const user = await prisma.user.findUnique({
      where: { id: alert.userId },
      select: { discordWebhookUrl: true, telegramBotToken: true, telegramChatId: true }
    });

    if (user?.discordWebhookUrl) {
      const discordSent = await sendDiscordWebhook(user.discordWebhookUrl, { alert, listings });
      results.push(discordSent);
    }

    if (user?.telegramBotToken && user?.telegramChatId) {
      const telegramSent = await sendTelegramMessage(user.telegramBotToken, user.telegramChatId, { alert, listings });
      results.push(telegramSent);
    }
  } catch (err) {
    console.error('[Notifications] Error fetching user settings:', err.message);
  }

  return results.some(r => r === true);
}
