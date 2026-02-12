import cron from 'node-cron';
import prisma from '../db.js';
import { searchListings, checkListingStatus, getRateLimitStatus } from './ebayApi.js';
import { batchAnalyzeTitles } from './typoDetection.js';
import { calculateRecencyWeightedBaseline, calculatePriceGap, calculateDealScore } from './dealScoring.js';

const runningJobs = new Map();
let isProcessing = false;

/**
 * Initialize all scheduled background jobs.
 */
export function initializeBackgroundJobs() {
  // Hourly: run hourly searches + saved deals monitoring
  cron.schedule('0 * * * *', () => {
    runScheduledSearches('hourly');
    monitorSavedDeals();
  });

  // Every 4 hours
  cron.schedule('0 */4 * * *', () => {
    runScheduledSearches('fourHourly');
  });

  // Daily at 6 AM
  cron.schedule('0 6 * * *', () => {
    runScheduledSearches('daily');
  });

  // Weekly on Monday at 6 AM
  cron.schedule('0 6 * * 1', () => {
    runScheduledSearches('weekly');
  });

  // Saved deals monitoring: every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    monitorSavedDeals();
  });

  console.log('[BackgroundJobs] Scheduled jobs initialized');
}

/**
 * Run all searches matching a given frequency.
 */
async function runScheduledSearches(frequency) {
  if (isProcessing) {
    console.log(`[BackgroundJobs] Already processing, skipping ${frequency} batch`);
    return;
  }

  const rateLimitStatus = getRateLimitStatus();
  if (rateLimitStatus.isLimited) {
    console.log(`[BackgroundJobs] Rate limited, skipping ${frequency} batch`);
    return;
  }

  try {
    isProcessing = true;

    const searches = await prisma.searchQuery.findMany({
      where: { searchFrequency: frequency },
      include: { user: { select: { id: true } } },
      orderBy: { lastExecutedAt: 'asc' } // oldest first
    });

    console.log(`[BackgroundJobs] Running ${searches.length} ${frequency} searches`);

    for (const search of searches) {
      // Check rate limit before each search
      const rl = getRateLimitStatus();
      if (rl.isLimited) {
        console.log(`[BackgroundJobs] Rate limited mid-batch, stopping`);
        break;
      }

      await executeSearch(search);

      // Brief pause between searches to respect rate limits
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (error) {
    console.error(`[BackgroundJobs] Error in ${frequency} batch:`, error.message);
  } finally {
    isProcessing = false;
  }
}

/**
 * Execute a single search query and store results.
 * Can be called from background job or manual trigger.
 */
export async function executeSearch(searchQuery) {
  const jobLog = await prisma.backgroundJobLog.create({
    data: {
      searchQueryId: searchQuery.id,
      jobType: 'eBaySearch',
      status: 'running'
    }
  });

  try {
    // 1. Search for active listings
    const listings = await searchListings({
      cardName: searchQuery.cardName,
      set: searchQuery.set,
      rarity: searchQuery.rarity,
      condition: searchQuery.condition
    });

    // 2. Derive baseline pricing from active listings (avoids a duplicate API call)
    //    Convert active listing prices into the soldListings format for baseline calculation
    const pricePoints = listings
      .filter(l => l.currentPrice > 0)
      .map(l => ({
        soldPrice: l.currentPrice,
        soldAt: new Date() // active listings treated as current market data
      }));

    // Also check DB for any previously stored sold listings
    const storedSold = await prisma.recentSoldListing.findMany({
      where: { cardName: searchQuery.cardName },
      orderBy: { soldAt: 'desc' },
      take: 100
    });

    const allPriceData = [
      ...storedSold.map(s => ({ soldPrice: Number(s.soldPrice), soldAt: s.soldAt })),
      ...pricePoints
    ];

    // 3. Calculate recency-weighted baseline
    const baseline = calculateRecencyWeightedBaseline(allPriceData);

    // 4. Analyze listings for typos
    const analyzedListings = batchAnalyzeTitles(listings, searchQuery.cardName);

    // 5. Remove old sample data for this search if we got real results
    const hasRealListings = analyzedListings.some(l => !l.ebayListingId.startsWith('ebay_'));
    if (hasRealListings) {
      const deleted = await prisma.ebayListing.deleteMany({
        where: {
          searchQueryId: searchQuery.id,
          ebayListingId: { startsWith: 'ebay_' }
        }
      });
      if (deleted.count > 0) {
        console.log(`[BackgroundJobs] Cleaned up ${deleted.count} sample listings for "${searchQuery.cardName}"`);
      }
    }

    // 6. Calculate deal scores and store listings
    let storedCount = 0;
    for (const listing of analyzedListings) {
      const priceGapPercent = baseline.weightedPrice
        ? calculatePriceGap(baseline.weightedPrice, listing.currentPrice)
        : null;

      const dealScore = calculateDealScore({
        hasTypo: listing.hasTypo,
        priceGapPercent,
        recencyScore: baseline.recencyScore,
        typoConfidenceScore: listing.confidenceScore
      });

      // Upsert listing
      await prisma.ebayListing.upsert({
        where: { ebayListingId: listing.ebayListingId },
        create: {
          ebayListingId: listing.ebayListingId,
          searchQueryId: searchQuery.id,
          cardName: searchQuery.cardName,
          listingTitle: listing.listingTitle,
          currentPrice: listing.currentPrice,
          recentSoldPrice: baseline.weightedPrice,
          priceGapPercent,
          hasTypo: listing.hasTypo,
          typoDetails: listing.typoDetails,
          typoConfidenceScore: listing.confidenceScore,
          dealScore,
          recencyScore: baseline.recencyScore,
          sellerName: listing.sellerName,
          sellerRating: listing.sellerRating,
          sellerFeedbackPercent: listing.sellerFeedbackPercent,
          listingUrl: listing.listingUrl,
          images: listing.images || [],
          description: listing.description,
          condition: listing.condition,
          listingStatus: listing.listingStatus || 'active'
        },
        update: {
          currentPrice: listing.currentPrice,
          recentSoldPrice: baseline.weightedPrice,
          priceGapPercent,
          hasTypo: listing.hasTypo,
          typoDetails: listing.typoDetails,
          typoConfidenceScore: listing.confidenceScore,
          dealScore,
          recencyScore: baseline.recencyScore,
          sellerFeedbackPercent: listing.sellerFeedbackPercent,
          listingStatus: listing.listingStatus || 'active',
          lastCheckedAt: new Date()
        }
      });

      storedCount++;
    }

    // 7. Update search query timestamp
    await prisma.searchQuery.update({
      where: { id: searchQuery.id },
      data: { lastExecutedAt: new Date() }
    });

    // 8. Complete job log
    await prisma.backgroundJobLog.update({
      where: { id: jobLog.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        listingsFound: storedCount
      }
    });

    return {
      success: true,
      listingsFound: storedCount,
      baseline: baseline.weightedPrice,
      recencyScore: baseline.recencyScore,
      sampleSize: baseline.sampleSize
    };
  } catch (error) {
    console.error(`[BackgroundJobs] Search failed for ${searchQuery.cardName}:`, error.message);

    await prisma.backgroundJobLog.update({
      where: { id: jobLog.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error.message,
        retryCount: { increment: 1 }
      }
    });

    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode
    };
  }
}

/**
 * Monitor all active saved deals for price changes.
 */
export async function monitorSavedDeals() {
  try {
    const savedDeals = await prisma.savedListing.findMany({
      where: { status: 'active' },
      include: { ebayListing: true }
    });

    console.log(`[BackgroundJobs] Monitoring ${savedDeals.length} saved deals`);

    for (const deal of savedDeals) {
      try {
        const status = await checkListingStatus(deal.ebayListingId);

        if (status === 'sold' || status === 'delisted') {
          await prisma.savedListing.update({
            where: { id: deal.id },
            data: {
              status,
              lastPriceCheckAt: new Date()
            }
          });

          // Also update the eBay listing status
          await prisma.ebayListing.updateMany({
            where: { ebayListingId: deal.ebayListingId },
            data: {
              listingStatus: status,
              ...(status === 'sold' ? { soldAt: new Date() } : {})
            }
          });
          continue;
        }

        // For active listings, check price
        if (deal.ebayListing) {
          const currentPrice = Number(deal.ebayListing.currentPrice);
          const priceAtSave = Number(deal.priceAtSave);
          const priceChangePercent = priceAtSave > 0
            ? Math.round(((currentPrice - priceAtSave) / priceAtSave) * 10000) / 100
            : null;

          await prisma.savedListing.update({
            where: { id: deal.id },
            data: {
              currentPrice,
              priceChangePercent,
              lastPriceCheckAt: new Date()
            }
          });
        }
      } catch (error) {
        console.error(`[BackgroundJobs] Error monitoring deal ${deal.id}:`, error.message);
      }

      // Brief pause between API calls
      await new Promise(r => setTimeout(r, 200));
    }
  } catch (error) {
    console.error('[BackgroundJobs] Error in saved deals monitoring:', error.message);
  }
}

/**
 * Store sold listings for baseline calculations.
 */
async function storeSoldListings(soldListings, cardName, set) {
  for (const sold of soldListings) {
    const daysOld = Math.floor((Date.now() - new Date(sold.soldAt).getTime()) / (1000 * 60 * 60 * 24));

    try {
      await prisma.recentSoldListing.create({
        data: {
          cardName: sold.cardName || cardName,
          set: sold.set || set || null,
          rarity: sold.rarity || null,
          condition: sold.condition || null,
          soldPrice: sold.soldPrice,
          soldAt: new Date(sold.soldAt),
          daysOld: Math.min(90, daysOld),
          source: sold.source || 'eBay'
        }
      });
    } catch {
      // Skip duplicate entries silently
    }
  }

  // Clean up old entries (older than 90 days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  await prisma.recentSoldListing.deleteMany({
    where: { soldAt: { lt: cutoffDate } }
  });
}

/**
 * Get job status for a search query.
 */
export async function getJobStatus(searchQueryId) {
  const latestJob = await prisma.backgroundJobLog.findFirst({
    where: { searchQueryId },
    orderBy: { executedAt: 'desc' }
  });
  return latestJob;
}
