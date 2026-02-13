import { useEffect, useState } from 'react';
import DealScoreBadge from './DealScoreBadge';
import TypoBadge from './TypoBadge';
import SellerInfo from './SellerInfo';
import { api } from '../utils/api';

export default function ListingDetail({ listing, recentSoldListings: initialSold, onClose, onSave, saveStatus }) {
  const [soldComps, setSoldComps] = useState(initialSold || []);
  const [alsoFoundIn, setAlsoFoundIn] = useState([]);
  const [scoreBreakdown, setScoreBreakdown] = useState(null);

  useEffect(() => {
    async function loadDetails() {
      try {
        const data = await api.get(`/api/listings/${listing.ebayListingId}`);
        if (data.recentSoldListings) setSoldComps(data.recentSoldListings);
        if (data.alsoFoundIn) setAlsoFoundIn(data.alsoFoundIn);
        if (data.scoreBreakdown) setScoreBreakdown(data.scoreBreakdown);
      } catch {
        // Use initial data
      }
    }
    loadDetails();
  }, [listing.ebayListingId]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const gap = listing.priceGapPercent !== null ? Number(listing.priceGapPercent) : null;
  const isAuction = listing.buyingOption === 'AUCTION';

  const getTimeRemaining = () => {
    if (!listing.auctionEndDate) return null;
    const ms = new Date(listing.auctionEndDate) - new Date();
    if (ms <= 0) return { label: 'Ended', urgent: true };
    const hours = ms / (1000 * 60 * 60);
    if (hours < 1) return { label: `${Math.round(ms / (1000 * 60))} minutes`, urgent: true };
    if (hours < 6) return { label: `${Math.round(hours)} hours`, urgent: true };
    if (hours < 24) return { label: `${Math.round(hours)} hours`, urgent: false };
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return { label: `${days}d ${remainingHours}h`, urgent: false };
  };
  const timeInfo = isAuction ? getTimeRemaining() : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" role="dialog" aria-modal="true" aria-label="Listing details">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-xl h-full bg-bg-secondary border-l border-border overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-bg-secondary border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-text-primary truncate pr-4">{listing.cardName}</h2>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-md hover:bg-bg-tertiary text-text-secondary"
            aria-label="Close details"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Images */}
          {listing.images && listing.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {listing.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${listing.cardName} image ${i + 1}`}
                  className="w-40 h-56 object-cover rounded-lg bg-bg-tertiary shrink-0"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {/* Score and flags */}
          <div className="flex items-center gap-3">
            <DealScoreBadge score={listing.dealScore} size="lg" />
            <TypoBadge hasTypo={listing.hasTypo} details={listing.typoDetails} confidence={listing.typoConfidenceScore} />
            {gap !== null && (
              <span className={`text-sm font-bold ${gap > 0 ? 'text-deal-green' : gap < 0 ? 'text-price-up' : 'text-text-muted'}`}>
                {gap > 0 ? `${gap.toFixed(1)}% below market` : gap < 0 ? `${Math.abs(gap).toFixed(1)}% above market` : 'At market price'}
              </span>
            )}
          </div>

          {/* Score breakdown */}
          {scoreBreakdown && (
            <div className="bg-bg-card border border-border rounded-lg p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                Score Breakdown
              </h4>
              <div className="space-y-2.5">
                {scoreBreakdown.components.map((c, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-secondary">{c.label}</span>
                      <span className={`text-sm font-bold ${c.points > 0 ? 'text-deal-green' : 'text-text-muted'}`}>
                        +{c.points}/{c.max}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${c.points > 0 ? 'bg-accent' : 'bg-bg-tertiary'}`}
                        style={{ width: `${(c.points / c.max) * 100}%` }}
                      />
                    </div>
                    {c.detail && (
                      <p className="text-xs text-text-muted mt-0.5">{c.detail}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-sm font-semibold text-text-secondary">Total</span>
                <span className="text-lg font-bold text-text-primary">{scoreBreakdown.total}<span className="text-sm text-text-muted font-normal">/{scoreBreakdown.max}</span></span>
              </div>
            </div>
          )}

          {/* Auction details */}
          {isAuction && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-purple-400">Auction</span>
                {timeInfo && (
                  <span className={`text-sm font-bold ${timeInfo.urgent ? 'text-warning' : 'text-text-secondary'}`}>
                    {timeInfo.label === 'Ended' ? 'Ended' : `${timeInfo.label} remaining`}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-text-muted">Current Bid</p>
                  <p className="text-lg font-bold text-text-primary">
                    ${Number(listing.currentBidPrice || listing.currentPrice).toFixed(2)}
                  </p>
                  {listing.shippingCost !== null && listing.shippingCost !== undefined && Number(listing.shippingCost) > 0 && (
                    <p className="text-xs text-text-muted">+${Number(listing.shippingCost).toFixed(2)} ship</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-text-muted">Bids</p>
                  <p className="text-lg font-bold text-text-primary">
                    {listing.bidCount ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Market Avg</p>
                  <p className="text-lg font-bold text-text-secondary">
                    {listing.recentSoldPrice ? `$${Number(listing.recentSoldPrice).toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              </div>
              {listing.bidCount !== null && listing.bidCount <= 2 && gap !== null && gap > 10 && (
                <p className="text-xs text-deal-green mt-2 font-medium">
                  Low competition with below-market price — potential opportunity
                </p>
              )}
              {listing.bidCount !== null && listing.bidCount > 8 && (
                <p className="text-xs text-warning mt-2">
                  High bid activity — final price may exceed current bid
                </p>
              )}
            </div>
          )}

          {/* Title and price */}
          <div className="space-y-2">
            <h3 className="text-sm text-text-secondary">{listing.listingTitle}</h3>
            {(() => {
              const itemPrice = Number(isAuction ? (listing.currentBidPrice || listing.currentPrice) : listing.currentPrice);
              const shipping = listing.shippingCost !== null && listing.shippingCost !== undefined ? Number(listing.shippingCost) : null;
              const totalPrice = shipping !== null ? itemPrice + shipping : itemPrice;
              return (
                <div className="flex items-baseline gap-4">
                  <div>
                    <span className="text-2xl font-bold text-text-primary">
                      ${itemPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-text-muted ml-1">{isAuction ? 'current bid' : 'current'}</span>
                    {shipping !== null && (
                      <div className="text-sm text-text-muted mt-0.5">
                        {shipping === 0 ? (
                          <span className="text-deal-green">Free shipping</span>
                        ) : (
                          <span>+${shipping.toFixed(2)} shipping = <span className="font-semibold text-text-primary">${totalPrice.toFixed(2)}</span> total</span>
                        )}
                      </div>
                    )}
                  </div>
                  {listing.recentSoldPrice && !isAuction && (
                    <div>
                      <span className="text-lg text-text-secondary">${Number(listing.recentSoldPrice).toFixed(2)}</span>
                      <span className="text-sm text-text-muted ml-1">market avg</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Typo details */}
          {listing.typoDetails && (
            <div className="bg-typo-amber/10 border border-typo-amber/20 rounded-lg p-3">
              <p className="text-sm text-typo-amber font-medium">Misspelling detected</p>
              <p className="text-sm text-text-secondary mt-1">{listing.typoDetails}</p>
            </div>
          )}

          {/* Seller info */}
          <div className="bg-bg-card border border-border rounded-lg p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Seller</h4>
            <SellerInfo
              name={listing.sellerName}
              rating={listing.sellerRating}
              feedbackPercent={listing.sellerFeedbackPercent}
            />
          </div>

          {/* Description */}
          {listing.description && (
            <div className="bg-bg-card border border-border rounded-lg p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Description</h4>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          {/* Recent sold comps */}
          {soldComps.length > 0 && (
            <div className="bg-bg-card border border-border rounded-lg p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                Recent Sold Comps ({soldComps.filter(s => !s.isOutlier).length})
                {soldComps.some(s => s.isOutlier) && (
                  <span className="font-normal normal-case tracking-normal ml-1">
                    · {soldComps.filter(s => s.isOutlier).length} outlier{soldComps.filter(s => s.isOutlier).length > 1 ? 's' : ''} excluded
                  </span>
                )}
              </h4>
              <div className="space-y-2">
                {soldComps.map((sold, i) => {
                  const daysAgo = sold.daysOld || Math.floor((Date.now() - new Date(sold.soldAt).getTime()) / (1000 * 60 * 60 * 24));
                  const recencyLabel = daysAgo <= 7 ? 'Fresh' : daysAgo <= 30 ? 'Recent' : 'Older';
                  const recencyColor = daysAgo <= 7 ? 'text-deal-green' : daysAgo <= 30 ? 'text-typo-amber' : 'text-text-muted';
                  const soldShipping = sold.shippingCost != null ? Number(sold.shippingCost) : null;
                  const soldTotal = Number(sold.soldPrice) + (soldShipping || 0);

                  return (
                    <div key={i} className={`flex items-center justify-between py-1.5 border-b border-border last:border-0 ${sold.isOutlier ? 'opacity-40' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${sold.isOutlier ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                          ${soldTotal.toFixed(2)}
                        </span>
                        {soldShipping != null && soldShipping > 0 && (
                          <span className="text-xs text-text-muted">
                            (${Number(sold.soldPrice).toFixed(2)} + ${soldShipping.toFixed(2)} ship)
                          </span>
                        )}
                        {sold.isOutlier ? (
                          <span className="text-xs font-medium text-error/70">Outlier</span>
                        ) : (
                          <span className={`text-xs font-medium ${recencyColor}`}>{recencyLabel}</span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">
                        {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Also found in */}
          {alsoFoundIn.length > 0 && (
            <div className="bg-bg-card border border-border rounded-lg p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Also found in</h4>
              {alsoFoundIn.map((s, i) => (
                <span key={i} className="inline-block text-xs bg-bg-tertiary text-text-secondary px-2 py-1 rounded mr-1 mb-1">
                  {s.searchName}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <a
              href={listing.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
            >
              View on eBay
            </a>
            <button
              onClick={onSave}
              disabled={saveStatus === 'saved' || saveStatus === 'saving'}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                saveStatus === 'saved'
                  ? 'bg-deal-green/15 text-deal-green cursor-default'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
              }`}
            >
              {saveStatus === 'saved' ? 'Saved to Deals' : saveStatus === 'saving' ? 'Saving...' : 'Save to Deals'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
