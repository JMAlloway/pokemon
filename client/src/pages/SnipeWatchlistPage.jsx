import { useEffect, useState } from 'react';
import useSnipeStore from '../store/snipeStore';
import DealScoreBadge from '../components/DealScoreBadge';
import PriceDisplay from '../components/PriceDisplay';

function AuctionRow({ auction }) {
  const hoursLeft = auction.hoursRemaining;
  const timeLabel = hoursLeft < 1
    ? `${Math.round(hoursLeft * 60)}m`
    : hoursLeft < 24
      ? `${Math.round(hoursLeft)}h`
      : `${Math.round(hoursLeft / 24)}d ${Math.round(hoursLeft % 24)}h`;

  const urgencyColor = auction.timeCategory === 'urgent'
    ? 'text-error'
    : auction.timeCategory === 'soon'
      ? 'text-warning'
      : 'text-text-muted';

  return (
    <a
      href={auction.listingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-bg-card border border-border rounded-lg p-4 hover:border-border-bright transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 flex flex-col items-center gap-1">
          <DealScoreBadge score={auction.dealScore} size="lg" />
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Score</span>
        </div>

        {auction.images && auction.images.length > 0 && (
          <div className="shrink-0 w-12 h-16 rounded overflow-hidden bg-bg-tertiary">
            <img
              src={auction.images[0]}
              alt={auction.cardName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate" title={auction.listingTitle}>
            {auction.listingTitle}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">
              Auction
            </span>
            <span className="text-xs text-text-secondary">{auction.cardName}</span>
            <span className="flex items-center gap-1 text-xs">
              <span className="text-text-muted">
                {auction.bidCount ?? 0} bid{auction.bidCount !== 1 ? 's' : ''}
              </span>
              <span className={`font-semibold ${urgencyColor}`}>
                · {timeLabel} left
              </span>
            </span>
            {auction.hasTypo && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-typo-amber/15 text-typo-amber">
                Typo
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <PriceDisplay
            price={auction.currentBidPrice || auction.currentPrice}
            shippingCost={auction.shippingCost}
            shippingEstimated={auction.shippingEstimated}
            baseline={auction.recentSoldPrice}
            gapPercent={auction.priceGapPercent}
          />
        </div>
      </div>
    </a>
  );
}

function AuctionSection({ title, subtitle, auctions, color }) {
  if (auctions.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <span className="text-xs text-text-muted">{subtitle}</span>
        <span className="text-xs text-text-muted ml-auto">{auctions.length} auction{auctions.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-2">
        {auctions.map(a => (
          <AuctionRow key={a.id} auction={a} />
        ))}
      </div>
    </div>
  );
}

export default function SnipeWatchlistPage() {
  const { urgent, soon, upcoming, total, isLoading, error, filters, fetchWatchlist, setFilters } = useSnipeStore();
  const [maxHours, setMaxHours] = useState(filters.maxHours);
  const [maxBids, setMaxBids] = useState(filters.maxBids);

  useEffect(() => {
    fetchWatchlist(filters);
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchWatchlist(filters), 60000);
    return () => clearInterval(interval);
  }, [fetchWatchlist, filters]);

  const handleApplyFilters = () => {
    setFilters({ maxHours, maxBids });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-1">Snipe Watchlist</h2>
        <p className="text-sm text-text-secondary">
          Auctions ending soon, below market value, with low competition. Auto-refreshes every minute.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 bg-bg-card border border-border rounded-lg p-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">Ending within</label>
          <select
            value={maxHours}
            onChange={(e) => setMaxHours(Number(e.target.value))}
            className="text-xs bg-bg-tertiary text-text-primary border border-border rounded px-2 py-1"
          >
            <option value={1}>1 hour</option>
            <option value={3}>3 hours</option>
            <option value={6}>6 hours</option>
            <option value={12}>12 hours</option>
            <option value={24}>24 hours</option>
            <option value={48}>48 hours</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">Max bids</label>
          <select
            value={maxBids}
            onChange={(e) => setMaxBids(Number(e.target.value))}
            className="text-xs bg-bg-tertiary text-text-primary border border-border rounded px-2 py-1"
          >
            <option value={0}>0 (no bids)</option>
            <option value={2}>2 or fewer</option>
            <option value={5}>5 or fewer</option>
            <option value={10}>10 or fewer</option>
            <option value={100}>Any</option>
          </select>
        </div>
        <button
          onClick={handleApplyFilters}
          className="text-xs px-3 py-1 rounded-md font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
        >
          Apply
        </button>
        {isLoading && (
          <span className="text-xs text-text-muted ml-auto">Refreshing...</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-error/10 border border-error/20 rounded-lg p-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Results */}
      {total === 0 && !isLoading && !error && (
        <div className="mt-16 text-center">
          <div className="text-4xl mb-3 opacity-50">&#x1F3AF;</div>
          <p className="text-text-secondary">No sniping opportunities right now.</p>
          <p className="text-sm text-text-muted mt-1">
            Run some searches first to populate auction data, then check back here.
          </p>
        </div>
      )}

      <AuctionSection
        title="Ending Now"
        subtitle="< 1 hour — price is likely final"
        auctions={urgent}
        color="bg-error"
      />
      <AuctionSection
        title="Ending Soon"
        subtitle="1-6 hours — still time to snipe"
        auctions={soon}
        color="bg-warning"
      />
      <AuctionSection
        title="Upcoming"
        subtitle="6+ hours — watch these"
        auctions={upcoming}
        color="bg-text-muted"
      />
    </div>
  );
}
