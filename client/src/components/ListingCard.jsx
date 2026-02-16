import { useState } from 'react';
import DealScoreBadge from './DealScoreBadge';
import TypoBadge from './TypoBadge';
import PriceDisplay from './PriceDisplay';
import SellerInfo from './SellerInfo';
import ListingDetail from './ListingDetail';
import useSavedDealsStore from '../store/savedDealsStore';

export default function ListingCard({ listing, recentSoldListings = [], showSaveButton = true, baselineSource }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveStatus, setSaveStatus] = useState(listing.isSaved ? 'saved' : 'idle');
  const { saveDeal } = useSavedDealsStore();

  const handleSave = async (e) => {
    e.stopPropagation();
    if (saveStatus === 'saved' || saveStatus === 'saving') return;

    setSaveStatus('saving');
    try {
      await saveDeal(listing.ebayListingId, listing.searchQueryId);
      setSaveStatus('saved');
    } catch (error) {
      const status = error.status === 409 ? 'saved' : 'error';
      setSaveStatus(status);
      if (status === 'error') {
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  };

  const handleEbayClick = (e) => {
    e.stopPropagation();
  };

  const hasTypoButExpensive = listing.hasTypo && listing.priceGapPercent !== null && Number(listing.priceGapPercent) <= 0;
  const noSoldData = !listing.recentSoldPrice;
  const isAuction = listing.buyingOption === 'AUCTION';

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
        className="group bg-bg-card border border-border rounded-lg p-4 hover:border-border-bright hover:shadow-lg hover:shadow-accent/[0.03] transition-all duration-200 cursor-pointer"
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
            <div className="shrink-0 w-16 h-22 rounded-md overflow-hidden bg-bg-tertiary ring-1 ring-border group-hover:ring-border-bright transition-all">
              <img
                src={listing.images[0]}
                alt={listing.cardName}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors" title={listing.listingTitle}>
                  {listing.listingTitle}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {isAuction ? (
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">
                      Auction
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                      BIN
                    </span>
                  )}
                  {listing.acceptsBestOffer && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                      Best Offer
                    </span>
                  )}
                  <span className="text-xs text-text-secondary">{listing.cardName}</span>
                  {listing.condition && (
                    <span className="text-xs text-text-muted">{listing.condition}</span>
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
                          {timeRemaining} left
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <PriceDisplay
                price={isAuction ? (listing.currentBidPrice || listing.currentPrice) : listing.currentPrice}
                shippingCost={listing.shippingCost}
                shippingEstimated={listing.shippingEstimated}
                baseline={listing.recentSoldPrice}
                gapPercent={listing.priceGapPercent}
                baselineSource={baselineSource}
              />
            </div>

            {/* Notes — condensed into a single row when possible */}
            {(hasTypoButExpensive || noSoldData || (listing.shippingCost == null && listing.recentSoldPrice) || (listing.recencyScore !== null && listing.recencyScore !== undefined && Number(listing.recencyScore) < 30 && listing.recentSoldPrice)) && (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {hasTypoButExpensive && (
                  <span className="text-xs text-warning">Typo found but at/above market</span>
                )}
                {noSoldData && (
                  <span className="text-xs text-text-muted italic">No recent sale data</span>
                )}
                {listing.shippingCost == null && listing.recentSoldPrice && (
                  <span className="text-xs text-warning">Shipping unknown</span>
                )}
                {listing.recencyScore !== null && listing.recencyScore !== undefined && Number(listing.recencyScore) < 30 && listing.recentSoldPrice && (
                  <span className="text-xs text-warning">Limited sales data</span>
                )}
              </div>
            )}

            {/* Bottom row */}
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
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
                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all duration-200 ${
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
                    {saveStatus === 'saved' ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        Saved
                      </span>
                    ) : saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Failed' : 'Save'}
                  </button>
                )}
                <a
                  href={listing.listingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleEbayClick}
                  className="text-xs px-3 py-1.5 rounded-md font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-all duration-200 flex items-center gap-1"
                  aria-label="View on eBay"
                >
                  eBay
                  <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
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
          baselineSource={baselineSource}
          onClose={() => setIsExpanded(false)}
          onSave={handleSave}
          saveStatus={saveStatus}
        />
      )}
    </>
  );
}
