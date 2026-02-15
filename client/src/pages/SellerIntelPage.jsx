import { useEffect, useState } from 'react';
import useSellerStore from '../store/sellerStore';
import DealScoreBadge from '../components/DealScoreBadge';

function SellerRow({ seller, onSelect }) {
  const daysSinceFirst = Math.floor((Date.now() - new Date(seller.firstSeenAt).getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceLast = Math.floor((Date.now() - new Date(seller.lastSeenAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div
      className="bg-bg-card border border-border rounded-lg p-4 hover:border-border-bright transition-colors cursor-pointer"
      onClick={() => onSelect(seller.sellerName)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(seller.sellerName); }}
    >
      <div className="flex items-center gap-4">
        <div className="shrink-0 flex flex-col items-center gap-1">
          <DealScoreBadge score={Math.round(Number(seller.avgDealScore) || 0)} size="lg" />
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Avg</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">{seller.sellerName}</h3>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-text-secondary">
              {seller.totalListingsSeen} listing{seller.totalListingsSeen !== 1 ? 's' : ''} seen
            </span>
            {seller.dealsCount > 0 && (
              <span className="text-xs font-medium text-deal-green">
                {seller.dealsCount} deal{seller.dealsCount !== 1 ? 's' : ''} ({seller.dealRate}%)
              </span>
            )}
            {seller.typosCount > 0 && (
              <span className="text-xs font-medium text-typo-amber">
                {seller.typosCount} typo{seller.typosCount !== 1 ? 's' : ''} ({seller.typoRate}%)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-text-muted">
              Cards: {(seller.cardNames || []).slice(0, 3).join(', ')}
              {(seller.cardNames || []).length > 3 ? ` +${seller.cardNames.length - 3} more` : ''}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right text-xs text-text-muted">
          <div>Tracking {daysSinceFirst}d</div>
          <div>Last seen {daysSinceLast === 0 ? 'today' : `${daysSinceLast}d ago`}</div>
        </div>
      </div>
    </div>
  );
}

function SellerDetail({ seller, listings, onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        className="text-xs text-accent hover:text-accent/80 mb-4 flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to sellers
      </button>

      <div className="bg-bg-card border border-border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-text-primary mb-3">{seller.sellerName}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-text-primary">{seller.totalListingsSeen}</div>
            <div className="text-xs text-text-muted">Listings seen</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-deal-green">{seller.dealsCount}</div>
            <div className="text-xs text-text-muted">Deals ({seller.dealRate}% rate)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-typo-amber">{seller.typosCount}</div>
            <div className="text-xs text-text-muted">Typos ({seller.typoRate}% rate)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">{Math.round(Number(seller.avgDealScore) || 0)}</div>
            <div className="text-xs text-text-muted">Avg deal score</div>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-xs text-text-muted">Cards seen: </span>
          <span className="text-xs text-text-secondary">{(seller.cardNames || []).join(', ')}</span>
        </div>
      </div>

      {listings.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3">Active Listings ({listings.length})</h4>
          <div className="space-y-2">
            {listings.map(listing => (
              <a
                key={listing.id}
                href={listing.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-bg-card border border-border rounded-lg p-3 hover:border-border-bright transition-colors"
              >
                <div className="flex items-center gap-3">
                  <DealScoreBadge score={listing.dealScore} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{listing.listingTitle}</p>
                    <p className="text-xs text-text-muted">{listing.searchQuery?.cardName}</p>
                  </div>
                  <div className="text-sm font-semibold text-text-primary">
                    ${Number(listing.currentPrice).toFixed(2)}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {listings.length === 0 && (
        <p className="text-sm text-text-muted text-center mt-8">No active listings from this seller right now.</p>
      )}
    </div>
  );
}

export default function SellerIntelPage() {
  const { sellers, total, selectedSeller, sellerListings, isLoading, error, fetchSellers, fetchSellerDetail, clearSelectedSeller } = useSellerStore();
  const [sortBy, setSortBy] = useState('deals');
  const [minDeals, setMinDeals] = useState(1);

  useEffect(() => {
    fetchSellers(sortBy, minDeals);
  }, [fetchSellers, sortBy, minDeals]);

  const handleSelectSeller = (sellerName) => {
    fetchSellerDetail(sellerName);
  };

  if (selectedSeller) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <SellerDetail
          seller={selectedSeller}
          listings={sellerListings}
          onBack={clearSelectedSeller}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-1">Seller Intelligence</h2>
        <p className="text-sm text-text-secondary">
          Track sellers who consistently have underpriced cards or typos. Data builds over time as you search.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 bg-bg-card border border-border rounded-lg p-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs bg-bg-tertiary text-text-primary border border-border rounded px-2 py-1"
          >
            <option value="deals">Most deals</option>
            <option value="score">Avg deal score</option>
            <option value="recent">Most recent</option>
            <option value="listings">Most listings</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">Min deals</label>
          <select
            value={minDeals}
            onChange={(e) => setMinDeals(Number(e.target.value))}
            className="text-xs bg-bg-tertiary text-text-primary border border-border rounded px-2 py-1"
          >
            <option value={0}>Any</option>
            <option value={1}>1+</option>
            <option value={3}>3+</option>
            <option value={5}>5+</option>
            <option value={10}>10+</option>
          </select>
        </div>
        {isLoading && (
          <span className="text-xs text-text-muted ml-auto">Loading...</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-error/10 border border-error/20 rounded-lg p-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Sellers list */}
      {total === 0 && !isLoading && !error && (
        <div className="mt-16 text-center">
          <div className="text-4xl mb-3 opacity-50">&#x1F575;&#xFE0F;</div>
          <p className="text-text-secondary">No seller data yet.</p>
          <p className="text-sm text-text-muted mt-1">
            Run some searches to start building seller intelligence.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {sellers.map(seller => (
          <SellerRow key={seller.id} seller={seller} onSelect={handleSelectSeller} />
        ))}
      </div>
    </div>
  );
}
