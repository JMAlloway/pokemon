import { useEffect, useState } from 'react';
import useMarketStore from '../store/marketStore';

function AlertCard({ alert }) {
  const isUp = alert.direction === 'up';
  return (
    <div className="bg-bg-card border border-border rounded-lg p-4 hover:border-border-bright transition-all duration-200 cursor-pointer group">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{alert.cardName}</h3>
          {alert.set && <p className="text-xs text-text-muted">{alert.set}</p>}
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${isUp ? 'text-error' : 'text-deal-green'}`}>
            {isUp ? '+' : ''}{alert.changePercent.toFixed(1)}%
          </div>
          <div className="text-xs text-text-muted">
            ${alert.previousPrice.toFixed(2)} → ${alert.currentPrice.toFixed(2)}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          isUp ? 'bg-error/15 text-error' : 'bg-deal-green/15 text-deal-green'
        }`}>
          Price {isUp ? 'increase' : 'drop'}
        </span>
        <span className="text-xs text-text-muted group-hover:text-text-secondary transition-colors">
          {alert.snapshotCount} data points · View history
        </span>
      </div>
    </div>
  );
}

function PriceHistory({ cardHistory, onClose }) {
  if (!cardHistory) return null;

  const { cardName, snapshots, trend } = cardHistory;
  if (snapshots.length === 0) {
    return (
      <div className="mb-6 bg-bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-text-primary">{cardName} — Price History</h3>
          <button onClick={onClose} className="text-xs text-text-muted hover:text-text-primary">Close</button>
        </div>
        <p className="text-sm text-text-muted">No price history available yet.</p>
      </div>
    );
  }

  const prices = snapshots.map(s => s.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const range = maxPrice - minPrice || 1;

  return (
    <div className="mb-6 bg-bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{cardName} — Price History</h3>
          {trend && (
            <span className={`text-xs font-medium ${
              trend.direction === 'up' ? 'text-error' : trend.direction === 'down' ? 'text-deal-green' : 'text-text-muted'
            }`}>
              {trend.direction === 'up' ? '+' : ''}{trend.changePercent.toFixed(1)}%
              (${trend.startPrice.toFixed(2)} → ${trend.endPrice.toFixed(2)})
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-xs text-text-muted hover:text-text-primary">Close</button>
      </div>

      {/* Simple bar chart */}
      <div className="flex items-end gap-px h-24 mt-2">
        {snapshots.map((snap, i) => {
          const height = ((snap.price - minPrice) / range) * 100;
          const isUp = trend && snap.price >= trend.startPrice;
          return (
            <div
              key={i}
              className="flex-1 min-w-[3px] rounded-t relative group"
              style={{
                height: `${Math.max(4, height)}%`,
                backgroundColor: isUp ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)'
              }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-bg-secondary border border-border rounded px-1.5 py-0.5 text-[10px] text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                ${snap.price.toFixed(2)} — {new Date(snap.capturedAt).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-text-muted">
          {new Date(snapshots[0].capturedAt).toLocaleDateString()}
        </span>
        <span className="text-[10px] text-text-muted">
          ${minPrice.toFixed(2)} — ${maxPrice.toFixed(2)}
        </span>
        <span className="text-[10px] text-text-muted">
          {new Date(snapshots[snapshots.length - 1].capturedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default function MarketAlertsPage() {
  const { alerts, total, cardHistory, isLoading, error, fetchAlerts, fetchCardHistory, clearCardHistory } = useMarketStore();
  const [threshold, setThreshold] = useState(15);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchAlerts(threshold, days);
  }, [fetchAlerts, threshold, days]);

  const priceDrops = alerts.filter(a => a.direction === 'down');
  const priceSpikes = alerts.filter(a => a.direction === 'up');

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-1">Market Alerts</h2>
        <p className="text-sm text-text-secondary">
          Cards with significant price movement. Data builds as you run searches over time.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 bg-bg-card border border-border rounded-lg p-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">Min change</label>
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="text-xs bg-bg-tertiary text-text-primary border border-border rounded-lg px-2 py-1.5 focus:border-accent outline-none transition-colors"
          >
            <option value={5}>5%</option>
            <option value={10}>10%</option>
            <option value={15}>15%</option>
            <option value={25}>25%</option>
            <option value={50}>50%</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">Lookback</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs bg-bg-tertiary text-text-primary border border-border rounded-lg px-2 py-1.5 focus:border-accent outline-none transition-colors"
          >
            <option value={3}>3 days</option>
            <option value={7}>1 week</option>
            <option value={14}>2 weeks</option>
            <option value={30}>30 days</option>
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

      {/* Price history detail */}
      {cardHistory && (
        <PriceHistory cardHistory={cardHistory} onClose={clearCardHistory} />
      )}

      {/* No data */}
      {total === 0 && !isLoading && !error && (
        <div className="mt-16 text-center animate-[fadeInUp_300ms_ease-out]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <p className="text-text-secondary font-medium">No significant price movements detected.</p>
          <p className="text-sm text-text-muted mt-2">
            Run searches regularly to build price history. Alerts appear when a card's price shifts more than {threshold}% over {days} days.
          </p>
        </div>
      )}

      {/* Price drops — buying opportunities */}
      {priceDrops.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-deal-green mb-3">
            Price Drops ({priceDrops.length}) — Potential buying opportunities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {priceDrops.map(alert => (
              <div key={alert.cardName} onClick={() => fetchCardHistory(alert.cardName)} className="cursor-pointer">
                <AlertCard alert={alert} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price spikes — hold or sell signals */}
      {priceSpikes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-error mb-3">
            Price Spikes ({priceSpikes.length}) — Cards gaining value
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {priceSpikes.map(alert => (
              <div key={alert.cardName} onClick={() => fetchCardHistory(alert.cardName)} className="cursor-pointer">
                <AlertCard alert={alert} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
