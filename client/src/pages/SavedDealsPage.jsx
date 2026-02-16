import { useEffect, useState } from 'react';
import useSavedDealsStore from '../store/savedDealsStore';
import DealScoreBadge from '../components/DealScoreBadge';
import TypoBadge from '../components/TypoBadge';
import ListingDetail from '../components/ListingDetail';

export default function SavedDealsPage() {
  const { deals, notifications, isLoading, error, fetchDeals, removeDeal } = useSavedDealsStore();
  const [sortBy, setSortBy] = useState('savedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('active');
  const [expandedDeal, setExpandedDeal] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState(null);

  useEffect(() => {
    fetchDeals(sortBy, sortOrder, statusFilter);
  }, [fetchDeals, sortBy, sortOrder, statusFilter]);

  // Poll for updates every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDeals(sortBy, sortOrder, statusFilter);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchDeals, sortBy, sortOrder, statusFilter]);

  const handleRemove = async (id) => {
    try {
      await removeDeal(id);
      setRemoveConfirm(null);
    } catch {
      // Error handled
    }
  };

  const activeDeals = deals.filter(d => statusFilter === 'all' || d.status === statusFilter);
  const priceDrops = activeDeals.filter(d => d.priceChangePercent && Number(d.priceChangePercent) < 0).length;
  const priceIncreases = activeDeals.filter(d => d.priceChangePercent && Number(d.priceChangePercent) > 0).length;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Saved Deals</h2>
        <p className="text-sm text-text-secondary mt-0.5">
          Monitor price changes on bookmarked listings. Updated automatically.
        </p>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-4 space-y-2">
          {notifications.map(n => (
            <div key={n.id} className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-warning shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-warning">{n.message}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">
            <span className="font-bold text-text-primary">{activeDeals.length}</span> deals
          </span>
          {priceDrops > 0 && (
            <span className="text-sm text-deal-green font-medium">{priceDrops} price drops</span>
          )}
          {priceIncreases > 0 && (
            <span className="text-sm text-price-up font-medium">{priceIncreases} price increases</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-bg-tertiary border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:border-accent outline-none"
            aria-label="Filter by status"
          >
            <option value="active">Active</option>
            <option value="all">All</option>
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-text-muted">Sort:</span>
            {[
              { value: 'savedAt', label: 'Newest' },
              { value: 'priceChange', label: 'Price Change' },
              { value: 'price', label: 'Price' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => { setSortBy(opt.value); setSortOrder('desc'); }}
                className={`text-xs px-2 py-1 rounded ${
                  sortBy === opt.value ? 'bg-accent/15 text-accent font-medium' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deals list */}
      {isLoading && deals.length === 0 ? (
        <div className="text-center py-16 text-text-muted text-sm">Loading saved deals...</div>
      ) : activeDeals.length === 0 ? (
        <div className="text-center py-16 animate-[fadeInUp_300ms_ease-out]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          </div>
          <p className="text-text-secondary font-medium">No saved deals yet.</p>
          <p className="text-xs text-text-muted mt-2">Save deals from search results to track their prices here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeDeals.map(deal => {
            const priceChange = deal.priceChangePercent ? Number(deal.priceChangePercent) : 0;
            const currentPrice = deal.currentPrice ? Number(deal.currentPrice) : Number(deal.priceAtSave);
            const savedPrice = Number(deal.priceAtSave);

            return (
              <div
                key={deal.id}
                className="bg-bg-card border border-border rounded-lg p-4 hover:border-border-bright transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Deal score */}
                  <div className="shrink-0">
                    <DealScoreBadge score={deal.dealScoreAtSave} size="md" />
                  </div>

                  {/* Image */}
                  {deal.listing?.images && deal.listing.images.length > 0 && (
                    <div className="shrink-0 w-10 h-14 rounded overflow-hidden bg-bg-tertiary">
                      <img
                        src={deal.listing.images[0]}
                        alt={deal.listing?.cardName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-text-primary truncate">
                          {deal.listing?.cardName || 'Unknown Card'}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {deal.listing?.hasTypo && (
                            <TypoBadge hasTypo details={deal.listing.typoDetails} />
                          )}
                          {deal.status !== 'active' && (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                              deal.status === 'sold' ? 'bg-error/15 text-error' : 'bg-warning/15 text-warning'
                            }`}>
                              {deal.status === 'sold' ? 'Sold' : 'Delisted'}
                            </span>
                          )}
                          <span className="text-xs text-text-muted">
                            Saved {new Date(deal.savedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Price info */}
                      <div className="text-right shrink-0">
                        <div className="text-base font-bold text-text-primary">${currentPrice.toFixed(2)}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-text-muted">was ${savedPrice.toFixed(2)}</span>
                          {priceChange !== 0 && (
                            <span className={`text-xs font-bold ${
                              priceChange < 0 ? 'text-deal-green' : 'text-price-up'
                            }`}>
                              {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        {priceChange < 0 && (
                          <span className="text-[10px] text-deal-green font-medium">Price decreased</span>
                        )}
                        {priceChange > 0 && (
                          <span className="text-[10px] text-price-up font-medium">Price increased</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom actions */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs text-text-muted">
                        {deal.lastPriceCheckAt && (
                          <span>Checked: {new Date(deal.lastPriceCheckAt).toLocaleString()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedDeal(deal)}
                          className="text-xs px-2.5 py-1 rounded-md bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
                        >
                          Details
                        </button>
                        <a
                          href={deal.listing?.listingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2.5 py-1 rounded-md bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
                        >
                          eBay
                        </a>
                        <button
                          onClick={() => setRemoveConfirm(deal.id)}
                          className="text-xs px-2.5 py-1 rounded-md bg-bg-tertiary text-text-secondary hover:text-error transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail drawer */}
      {expandedDeal && expandedDeal.listing && (
        <ListingDetail
          listing={{
            ...expandedDeal.listing,
            currentPrice: expandedDeal.currentPrice || expandedDeal.priceAtSave,
            ebayListingId: expandedDeal.ebayListingId,
            recentSoldPrice: expandedDeal.recentSoldPriceAtSave
          }}
          onClose={() => setExpandedDeal(null)}
          onSave={() => {}}
          saveStatus="saved"
        />
      )}

      {/* Remove confirmation */}
      {removeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 animate-[fadeIn_150ms_ease-out]" onClick={() => setRemoveConfirm(null)} />
          <div className="relative bg-bg-secondary border border-border rounded-xl p-6 max-w-sm w-full mx-4 animate-[scaleIn_200ms_ease-out]">
            <h3 className="text-lg font-bold text-text-primary mb-2">Remove from saved deals?</h3>
            <p className="text-sm text-text-secondary mb-4">
              This deal will be removed from your saved deals list.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRemoveConfirm(null)}
                className="px-4 py-2 rounded-lg bg-bg-tertiary text-text-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemove(removeConfirm)}
                className="px-4 py-2 rounded-lg bg-error text-white text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
