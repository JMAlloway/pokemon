import prisma from '../db.js';
import { searchListings, getRateLimitStatus, fillMissingShipping } from './ebayApi.js';
import { batchAnalyzeTitles } from './typoDetection.js';
import { calculateRecencyWeightedBaseline, calculatePriceGap, calculateDealScore } from './dealScoring.js';

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

  console.log(`[ChaseScanner] Scanning ${neededCards.length} cards for "${chaseList.setName}"`);

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
      const result = await scanSingleCard(chaseCard, chaseList.setName, alertMinPercent, alertMaxPrice);
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

  console.log(`[ChaseScanner] Scan complete for "${chaseList.setName}": ${dealsFound} deals found`);

  return { scanned: neededCards.length, dealsFound, cards: cardResults };
}

/**
 * Scan a single chase card for the best deal.
 */
async function scanSingleCard(chaseCard, setName, alertMinPercent, alertMaxPrice) {
  const { setCard } = chaseCard;
  const searchQuery = `${setCard.cardName} ${setCard.cardNumber}`;

  // Search eBay
  const listings = await searchListings({
    cardName: searchQuery,
    set: setName
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

  // Fill shipping
  const withShipping = await fillMissingShipping(listings);

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
        buyingOption: listing.buyingOption
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
          belowThreshold: true
        };
      }
    }
  }

  // Update the chase card with best deal info
  const updateData = {
    bestDealUrl: bestDeal?.url || null,
    bestDealPrice: bestDeal?.price || null,
    bestDealScore: bestDeal?.dealScore || null
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
