import nodemailer from 'nodemailer';

/**
 * Email Service for PokeArb Snipe Alerts
 *
 * Configure SMTP in .env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, ALERT_EMAIL
 *
 * If SMTP is not configured, alerts are logged to console instead.
 */

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  return transporter;
}

/**
 * Check if email sending is configured.
 */
export function isEmailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.ALERT_EMAIL);
}

/**
 * Send a snipe alert email.
 *
 * @param {{ alert: object, listings: Array<{ cardName, listingTitle, price, marketPrice, priceGapPercent, dealScore, listingUrl, hoursRemaining?, bidCount? }> }} params
 */
export async function sendSnipeAlertEmail({ alert, listings }) {
  const to = process.env.ALERT_EMAIL;
  const from = process.env.SMTP_FROM || 'PokeArb <alerts@pokearb.local>';

  if (!to) {
    console.log(`[Email] No ALERT_EMAIL configured — skipping email for alert "${alert.name}"`);
    return false;
  }

  const transport = getTransporter();
  if (!transport) {
    console.log(`[Email] SMTP not configured — logging alert "${alert.name}" with ${listings.length} listings:`);
    for (const l of listings) {
      console.log(`  → ${l.cardName}: $${l.price} (${l.priceGapPercent ? l.priceGapPercent + '% below' : 'N/A'}) — ${l.listingUrl}`);
    }
    return false;
  }

  const isAuction = alert.alertType === 'AUCTION_ENDING';
  const subject = isAuction
    ? `🎯 Snipe Alert: ${listings.length} auction${listings.length > 1 ? 's' : ''} ending soon`
    : `💰 BIN Deal: ${listings.length} listing${listings.length > 1 ? 's' : ''} below target`;

  const listingRows = listings.map(l => {
    const gapVal = l.priceGapPercent != null ? Number(l.priceGapPercent) : null;
    const gap = gapVal != null && gapVal > 0 ? `${gapVal.toFixed(1)}% below market` : '';
    const timeInfo = l.hoursRemaining != null
      ? l.hoursRemaining < 1
        ? `${Math.round(l.hoursRemaining * 60)}m left`
        : `${Math.round(l.hoursRemaining)}h left`
      : '';
    const bids = l.bidCount != null ? `${l.bidCount} bids` : '';
    const meta = [timeInfo, bids, gap].filter(Boolean).join(' · ');

    return `
      <tr style="border-bottom: 1px solid #2a2a3e;">
        <td style="padding: 12px 8px;">
          <div style="font-weight: 600; color: #e2e8f0;">${l.cardName}</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">${l.listingTitle.substring(0, 80)}${l.listingTitle.length > 80 ? '...' : ''}</div>
          <div style="font-size: 11px; color: #6366f1; margin-top: 4px;">${meta}</div>
        </td>
        <td style="padding: 12px 8px; text-align: right; white-space: nowrap;">
          <div style="font-weight: 700; font-size: 16px; color: #10b981;">$${Number(l.price).toFixed(2)}</div>
          ${l.marketPrice ? `<div style="font-size: 11px; color: #64748b;">Market: $${Number(l.marketPrice).toFixed(2)}</div>` : ''}
        </td>
        <td style="padding: 12px 8px; text-align: center;">
          <a href="${l.listingUrl}" style="display: inline-block; padding: 6px 14px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 600;">View</a>
        </td>
      </tr>`;
  }).join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 20px 24px;">
        <h1 style="margin: 0; font-size: 18px; color: white;">PokeArb Alert: ${alert.name}</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.8);">${isAuction ? 'Auctions ending soon below target' : 'BIN deals below your threshold'}</p>
      </div>
      <div style="padding: 16px 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #2a2a3e;">
              <th style="text-align: left; padding: 8px; font-size: 11px; color: #64748b; text-transform: uppercase;">Card</th>
              <th style="text-align: right; padding: 8px; font-size: 11px; color: #64748b; text-transform: uppercase;">Price</th>
              <th style="padding: 8px;"></th>
            </tr>
          </thead>
          <tbody>${listingRows}</tbody>
        </table>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #1e1e2e; text-align: center;">
        <p style="font-size: 11px; color: #475569; margin: 0;">Sent by PokeArb · Cooldown: ${alert.cooldownMinutes}min</p>
      </div>
    </div>`;

  try {
    await transport.sendMail({ from, to, subject, html });
    console.log(`[Email] Sent alert "${alert.name}" to ${to} (${listings.length} listings)`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed to send alert "${alert.name}":`, err.message);
    return false;
  }
}
