import prisma from '../db.js';
import { searchListings, getRateLimitStatus, fillMissingShipping } from './ebayApi.js';
import { batchAnalyzeTitles } from './typoDetection.js';
import { calculateRecencyWeightedBaseline, calculatePriceGap, calculateDealScore } from './dealScoring.js';
import { sendChaseListAlertEmail } from './emailService.js';

/**
 * Chase List Scanner
 *
 * Scans eBay for deals on cards in a user's chase list.
 * Each "needed" card gets searched; results are scored and the best deal
 * is stored on the ChaseListCard record.
 */

/**
 * Scan a single chase list for deals on all "needed" cards.
 * Returns summary of deals found.
 */
export async function scanChaseList(chaseList) {
  const cards = chaseList.cards || [];
  const neededCards = cards.filter(c => c.status === 'needed');

  if (neededCards.length === 0) {
    return { scanned: 0, dealsFound: 0, cards: [] };
  }

  console.log(`[ChaseScanner] Scanning ${neededCards.length} cards for set "${chaseList.setCode}"`);

  const alertMinPercent = Number(chaseList.alertMinPercent) || 10;
  const alertMaxPrice = chaseList.alertMaxPrice ? Number(chaseList.alertMaxPrice) : null;

  let dealsFound = 0;
  const cardResults = [];

  for (const chaseCard of neededCards) {
    const rl = getRateLimitStatus();
    if (rl.isLimited) {
      console.log(`[ChaseScanner] Rate limited, pausing scan`);
      break;
    }

    try {
      const result = await scanSingleCard(chaseCard, chaseList.setCode, alertMinPercent, alertMaxPrice);
      cardResults.push(result);
      if (result.dealFound) dealsFound++;
    } catch (error) {
      console.error(`[ChaseScanner] Error scanning ${chaseCard.setCard.cardName}:`, error.message);
      cardResults.push({
        chaseListCardId: chaseCard.id,
        cardName: chaseCard.setCard.cardName,
        cardNumber: chaseCard.setCard.cardNumber,
        dealFound: false,
        error: error.message
      });
    }

    // Brief pause between searches
    await new Promise(r => setTimeout(r, 300));
  }

  // Update last scanned timestamp
  await prisma.chaseList.update({
    where: { id: chaseList.id },
    data: { lastScannedAt: new Date() }
  });

  console.log(`[ChaseScanner] Scan complete for set "${chaseList.setCode}": ${dealsFound} deals found`);

  // Send email notification for new deals
  if (dealsFound > 0) {
    const cooldownMs = (chaseList.alertCooldownMinutes || 60) * 60 * 1000;
    const now = Date.now();
    const alertableDeals = cardResults.filter(r => {
      if (!r.dealFound || !r.bestDeal) return false;
      const card = neededCards.find(c => c.id === r.chaseListCardId);
      if (card?.lastAlertedAt && (now - new Date(card.lastAlertedAt).getTime()) < cooldownMs) return false;
      return true;
    });

    if (alertableDeals.length > 0) {
      try {
        await sendChaseListAlertEmail({
          chaseList,
          deals: alertableDeals.map(d => ({
            cardName: d.cardName,
            cardNumber: d.cardNumber,
            ...d.bestDeal,
            marketPrice: d.marketPrice
          }))
        });

        // Update lastAlertedAt for alerted cards
        await Promise.all(alertableDeals.map(d =>
          prisma.chaseListCard.update({
            where: { id: d.chaseListCardId },
            data: { lastAlertedAt: new Date() }
          })
        ));
      } catch (err) {
        console.error(`[ChaseScanner] Failed to send alert email:`, err.message);
      }
    }
  }

  return { scanned: neededCards.length, dealsFound, cards: cardResults };
}

/**
 * Scan a single chase card for the best deal.
 */
async function scanSingleCard(chaseCard, setCode, alertMinPercent, alertMaxPrice) {
  const { setCard } = chaseCard;
  const searchQuery = `${setCard.cardName} ${setCard.cardNumber}`;

  // Search eBay
  const listings = await searchListings({
    cardName: searchQuery,
    set: setCode
  });

  if (listings.length === 0) {
    return {
      chaseListCardId: chaseCard.id,
      cardName: setCard.cardName,
      cardNumber: setCard.cardNumber,
      dealFound: false,
      listingsChecked: 0
    };
  }

  // Filter listings to exclude wrong cards from different sets.
  // eBay titles typically include card numbers like "125/165", "#125", "No. 125".
  // Strategy: if a title contains a "XXX/YYY" or "#XXX" pattern with a DIFFERENT
  // number than ours, it's from the wrong set. Keep listings with no number or matching number.
  const expectedNum = parseInt(setCard.cardNumber, 10);
  const cardNumSlashPattern = /(\d{1,4})\s*\/\s*\d{1,4}/g; // "125/165"
  const cardNumHashPattern = /#\s*(\d{1,4})\b/g;            // "#125"
  const filteredListings = listings.filter(l => {
    if (!l.listingTitle) return true;
    const title = l.listingTitle;

    // Check "XXX/YYY" patterns (most reliable — standard card number format)
    const slashMatches = [...title.matchAll(cardNumSlashPattern)];
    if (slashMatches.length > 0) {
      return slashMatches.some(m => parseInt(m[1], 10) === expectedNum);
    }

    // Check "#XXX" patterns
    const hashMatches = [...title.matchAll(cardNumHashPattern)];
    if (hashMatches.length > 0) {
      return hashMatches.some(m => parseInt(m[1], 10) === expectedNum);
    }

    // No card number found in title — keep (benefit of the doubt)
    return true;
  });

  if (filteredListings.length === 0) {
    return {
      chaseListCardId: chaseCard.id,
      cardName: setCard.cardName,
      cardNumber: setCard.cardNumber,
      dealFound: false,
      listingsChecked: listings.length
    };
  }

  // Fill shipping
  const withShipping = await fillMissingShipping(filteredListings);

  // Get sold data for baseline
  let soldData = [];
  try {
    const stored = await prisma.recentSoldListing.findMany({
      where: { cardName: { contains: setCard.cardName } },
      orderBy: { soldAt: 'desc' },
      take: 50
    });
    soldData = stored.map(s => ({
      soldPrice: Number(s.soldPrice) + (s.shippingCost != null ? Number(s.shippingCost) : 0),
      soldAt: s.soldAt
    }));
  } catch {
    // No sold data available
  }

  // Calculate baseline (fallback to set card market price)
  const baseline = calculateRecencyWeightedBaseline(soldData);
  const baselinePrice = baseline.weightedPrice || (setCard.marketPrice ? Number(setCard.marketPrice) : null);

  // Analyze for typos
  const analyzed = batchAnalyzeTitles(withShipping, setCard.cardName);

  // Score each listing and find the best deal
  let bestDeal = null;
  let bestScore = -1;

  for (const listing of analyzed) {
    const effectivePrice = listing.buyingOption === 'AUCTION'
      ? (listing.currentBidPrice || listing.currentPrice)
      : listing.currentPrice;
    const shipping = listing.shippingCost != null ? Number(listing.shippingCost) : 0;
    const totalPrice = effectivePrice + shipping;

    // Apply max price filter
    if (alertMaxPrice && totalPrice > alertMaxPrice) continue;

    const priceGapPercent = baselinePrice
      ? calculatePriceGap(baselinePrice, totalPrice)
      : null;

    const dealScore = calculateDealScore({
      hasTypo: listing.hasTypo,
      priceGapPercent,
      recencyScore: baseline.recencyScore || 50,
      typoConfidenceScore: listing.confidenceScore,
      buyingOption: listing.buyingOption || 'FIXED_PRICE',
      bidCount: listing.bidCount,
      auctionEndDate: listing.auctionEndDate
    });

    // Track best deal that meets minimum threshold
    if (dealScore > bestScore && (priceGapPercent === null || priceGapPercent >= alertMinPercent)) {
      bestScore = dealScore;
      bestDeal = {
        url: listing.listingUrl,
        price: totalPrice,
        dealScore,
        priceGapPercent,
        title: listing.listingTitle,
        hasTypo: listing.hasTypo,
        buyingOption: listing.buyingOption,
        bidCount: listing.bidCount,
        auctionEndDate: listing.auctionEndDate,
        sellerName: listing.sellerName,
        sellerFeedbackPercent: listing.sellerFeedbackPercent
      };
    }
  }

  // Also find best deal regardless of threshold for display
  if (!bestDeal) {
    let bestAnyScore = -1;
    for (const listing of analyzed) {
      const effectivePrice = listing.buyingOption === 'AUCTION'
        ? (listing.currentBidPrice || listing.currentPrice)
        : listing.currentPrice;
      const shipping = listing.shippingCost != null ? Number(listing.shippingCost) : 0;
      const totalPrice = effectivePrice + shipping;
      const priceGapPercent = baselinePrice
        ? calculatePriceGap(baselinePrice, totalPrice)
        : null;
      const dealScore = calculateDealScore({
        hasTypo: listing.hasTypo,
        priceGapPercent,
        recencyScore: baseline.recencyScore || 50,
        typoConfidenceScore: listing.confidenceScore,
        buyingOption: listing.buyingOption || 'FIXED_PRICE',
        bidCount: listing.bidCount,
        auctionEndDate: listing.auctionEndDate
      });
      if (dealScore > bestAnyScore) {
        bestAnyScore = dealScore;
        bestDeal = {
          url: listing.listingUrl,
          price: totalPrice,
          dealScore,
          priceGapPercent,
          title: listing.listingTitle,
          hasTypo: listing.hasTypo,
          buyingOption: listing.buyingOption,
          bidCount: listing.bidCount,
          auctionEndDate: listing.auctionEndDate,
          sellerName: listing.sellerName,
          sellerFeedbackPercent: listing.sellerFeedbackPercent,
          belowThreshold: true
        };
      }
    }
  }

  // Update the chase card with best deal info
  const updateData = {
    bestDealUrl: bestDeal?.url || null,
    bestDealPrice: bestDeal?.price || null,
    bestDealScore: bestDeal?.dealScore || null,
    bestDealTitle: bestDeal?.title || null,
    bestDealBuyingOption: bestDeal?.buyingOption || null,
    bestDealBidCount: bestDeal?.bidCount ?? null,
    bestDealEndTime: bestDeal?.auctionEndDate || null,
    bestDealSellerName: bestDeal?.sellerName || null,
    bestDealSellerFeedback: bestDeal?.sellerFeedbackPercent ?? null,
    bestDealHasTypo: bestDeal?.hasTypo ?? null
  };

  // If deal meets threshold, mark as dealFound
  const meetsThreshold = bestDeal && !bestDeal.belowThreshold;
  if (meetsThreshold) {
    updateData.status = 'dealFound';
  }

  await prisma.chaseListCard.update({
    where: { id: chaseCard.id },
    data: updateData
  });

  return {
    chaseListCardId: chaseCard.id,
    cardName: setCard.cardName,
    cardNumber: setCard.cardNumber,
    listingsChecked: analyzed.length,
    dealFound: meetsThreshold,
    bestDeal: bestDeal || null,
    marketPrice: baselinePrice
  };
}

/**
 * Scan all active chase lists (called by cron job).
 */
export async function scanAllChaseLists() {
  try {
    const lists = await prisma.chaseList.findMany({
      where: { scanEnabled: true },
      include: {
        cards: {
          where: { status: 'needed' },
          include: { setCard: true }
        }
      }
    });

    console.log(`[ChaseScanner] Running scheduled scan for ${lists.length} chase lists`);

    for (const list of lists) {
      const rl = getRateLimitStatus();
      if (rl.isLimited) {
        console.log(`[ChaseScanner] Rate limited, stopping scheduled scan`);
        break;
      }

      if (list.cards.length === 0) continue;

      try {
        await scanChaseList(list);
      } catch (error) {
        console.error(`[ChaseScanner] Error scanning list ${list.id}:`, error.message);
      }

      // Pause between lists
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (error) {
    console.error('[ChaseScanner] Scheduled scan error:', error.message);
  }
}
