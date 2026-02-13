import { useState } from 'react';
import DealScoreBadge from './DealScoreBadge';
import TypoBadge from './TypoBadge';
import PriceDisplay from './PriceDisplay';
import SellerInfo from './SellerInfo';
import ListingDetail from './ListingDetail';
import useSavedDealsStore from '../store/savedDealsStore';

export default function ListingCard({ listing, recentSoldListings = [], showSaveButton = true }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveStatus, setSaveStatus] = useState(listing.isSaved ? 'saved' : 'idle');
  const { saveDeal } = useSavedDealsStore();

  const handleSave = async (e) => {
    e.stopPropagation();
    if (saveStatus === 'saved' || saveStatus === 'saving') return;

    setSaveStatus('saving');
    try {
      await saveDeal(listing.ebayListingId);
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus(error.status === 409 ? 'saved' : 'error');
      setTimeout(() => {
        if (saveStatus === 'error') setSaveStatus('idle');
      }, 2000);
    }
  };

  const handleEbayClick = (e) => {
    e.stopPropagation();
  };

  // Determine if this listing has a note
  const hasTypoButExpensive = listing.hasTypo && listing.priceGapPercent !== null && Number(listing.priceGapPercent) <= 0;
  const noSoldData = !listing.recentSoldPrice;
  const isAuction = listing.buyingOption === 'AUCTION';

  // Calculate time remaining for auctions
  const getTimeRemaining = () => {
    if (!listing.auctionEndDate) return null;
    const ms = new Date(listing.auctionEndDate) - new Date();
    if (ms <= 0) return 'Ended';
    const hours = ms / (1000 * 60 * 60);
    if (hours < 1) return `${Math.round(ms / (1000 * 60))}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d ${Math.round(hours % 24)}h`;
  };
  const timeRemaining = isAuction ? getTimeRemaining() : null;

  return (
    <>
      <div
        className="bg-bg-card border border-border rounded-lg p-4 hover:border-border-bright transition-colors cursor-pointer"
        onClick={() => setIsExpanded(true)}
        onKeyDown={(e) => { if (e.key === 'Enter') setIsExpanded(true); }}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`${listing.cardName} - $${Number(listing.currentPrice).toFixed(2)} - Deal score ${listing.dealScore}`}
      >
        <div className="flex items-start gap-4">
          {/* Deal Score */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <DealScoreBadge score={listing.dealScore} size="lg" />
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Score</span>
          </div>

          {/* Image */}
          {listing.images && listing.images.length > 0 && (
            <div className="shrink-0 w-12 h-16 rounded overflow-hidden bg-bg-tertiary">
              <img
                src={listing.images[0]}
                alt={listing.cardName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text-primary truncate" title={listing.listingTitle}>
                  {listing.listingTitle}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {isAuction ? (
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">
                      Auction
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                      BIN
                    </span>
                  )}
                  <span className="text-xs text-text-secondary">{listing.cardName}</span>
                  {listing.condition && (
                    <span className="text-xs text-text-muted">· {listing.condition}</span>
                  )}
                  <TypoBadge
                    hasTypo={listing.hasTypo}
                    details={listing.typoDetails}
                    confidence={listing.typoConfidenceScore}
                  />
                  {isAuction && (
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      {listing.bidCount !== null && listing.bidCount !== undefined && (
                        <span>{listing.bidCount} bid{listing.bidCount !== 1 ? 's' : ''}</span>
                      )}
                      {timeRemaining && (
                        <span className={`font-medium ${timeRemaining === 'Ended' ? 'text-error' : new Date(listing.auctionEndDate) - new Date() < 6 * 60 * 60 * 1000 ? 'text-warning' : 'text-text-muted'}`}>
                          · {timeRemaining} left
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <PriceDisplay
                price={isAuction ? (listing.currentBidPrice || listing.currentPrice) : listing.currentPrice}
                shippingCost={listing.shippingCost}
                baseline={listing.recentSoldPrice}
                gapPercent={listing.priceGapPercent}
              />
            </div>

            {/* Notes */}
            {hasTypoButExpensive && (
              <p className="text-xs text-warning mt-1.5">
                Typo found but price is at/above market value—not a clear deal
              </p>
            )}
            {noSoldData && (
              <p className="text-xs text-text-muted mt-1.5 italic">
                Recent sale data not available for this card
              </p>
            )}
            {listing.shippingCost == null && listing.recentSoldPrice && (
              <p className="text-xs text-warning mt-1.5">
                Shipping cost unknown — deal % not calculated
              </p>
            )}
            {listing.recencyScore !== null && listing.recencyScore !== undefined && Number(listing.recencyScore) < 30 && listing.recentSoldPrice && (
              <p className="text-xs text-warning mt-1.5">
                Limited recent sales data. Market estimate may be unreliable.
              </p>
            )}

            {/* Bottom row */}
            <div className="flex items-center justify-between mt-2">
              <SellerInfo
                name={listing.sellerName}
                rating={listing.sellerRating}
                feedbackPercent={listing.sellerFeedbackPercent}
                compact
              />
              <div className="flex items-center gap-2">
                {showSaveButton && (
                  <button
                    onClick={handleSave}
                    disabled={saveStatus === 'saved' || saveStatus === 'saving'}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      saveStatus === 'saved'
                        ? 'bg-deal-green/15 text-deal-green cursor-default'
                        : saveStatus === 'saving'
                          ? 'bg-bg-tertiary text-text-muted cursor-wait'
                          : saveStatus === 'error'
                            ? 'bg-error/15 text-error'
                            : 'bg-bg-tertiary text-text-secondary hover:bg-accent/15 hover:text-accent'
                    }`}
                    aria-label={saveStatus === 'saved' ? 'Deal saved' : 'Save deal'}
                  >
                    {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Failed' : 'Save'}
                  </button>
                )}
                <a
                  href={listing.listingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleEbayClick}
                  className="text-xs px-2.5 py-1 rounded-md font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
                  aria-label="View on eBay"
                >
                  eBay
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {isExpanded && (
        <ListingDetail
          listing={listing}
          recentSoldListings={recentSoldListings}
          onClose={() => setIsExpanded(false)}
          onSave={handleSave}
          saveStatus={saveStatus}
        />
      )}
    </>
  );
}
