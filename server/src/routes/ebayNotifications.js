import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../db.js';

const router = Router();

const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN || 'pokearb-verification-token';

// GET /api/ebay/deletion — eBay challenge verification
// eBay sends a challenge_code, we respond with SHA-256(challenge_code + verification_token + endpoint_url)
router.get('/deletion', (req, res) => {
  const challengeCode = req.query.challenge_code;
  if (!challengeCode) {
    return res.status(400).json({ error: 'Missing challenge_code' });
  }

  const endpoint = process.env.EBAY_DELETION_ENDPOINT;
  if (!endpoint) {
    console.error('[eBay Notifications] EBAY_DELETION_ENDPOINT not set in .env');
    return res.status(500).json({ error: 'Endpoint not configured' });
  }

  const hash = crypto
    .createHash('sha256')
    .update(challengeCode + VERIFICATION_TOKEN + endpoint)
    .digest('hex');

  console.log(`[eBay Notifications] Challenge verified`);
  res.json({ challengeResponse: hash });
});

// POST /api/ebay/deletion — eBay account deletion notification
// Scrub any stored seller data for the deleted eBay user
router.post('/deletion', async (req, res) => {
  console.log('[eBay Notifications] Account deletion notification received:', JSON.stringify(req.body));

  try {
    const username = req.body?.notification?.data?.username;
    if (username) {
      const result = await prisma.ebayListing.updateMany({
        where: { sellerName: username },
        data: {
          sellerName: null,
          sellerRating: null,
          sellerFeedbackPercent: null
        }
      });
      if (result.count > 0) {
        console.log(`[eBay Notifications] Scrubbed seller data from ${result.count} listings for user "${username}"`);
      }
    }

    res.status(200).json({ status: 'acknowledged' });
  } catch (error) {
    console.error('[eBay Notifications] Error processing deletion:', error.message);
    res.status(200).json({ status: 'acknowledged' });
  }
});

export default router;
