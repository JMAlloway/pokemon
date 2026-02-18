import { useEffect, useState } from 'react';
import useMarketStore from '../store/marketStore';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ComposedChart } from 'recharts';

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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-bg-secondary border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] text-text-muted mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: entry.color }}>
          {entry.name}: ${Number(entry.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
}

function PriceHistory({ cardHistory, onClose }) {
  const [chartDays, setChartDays] = useState(30);
  const { fetchCardHistory } = useMarketStore();

  if (!cardHistory) return null;

  const { cardName, snapshots, soldData, trend } = cardHistory;
  const hasSoldData = soldData && soldData.length > 0;

  if (snapshots.length === 0 && !hasSoldData) {
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

  // Merge snapshots and sold data into a unified timeline
  const chartData = [];
  const dateMap = new Map();

  for (const snap of snapshots) {
    const dateKey = new Date(snap.capturedAt).toLocaleDateString();
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, { date: dateKey, timestamp: new Date(snap.capturedAt).getTime() });
    }
    const entry = dateMap.get(dateKey);
    // Use the latest baseline price for the day
    entry.baseline = snap.price;
    entry.sampleSize = snap.sampleSize;
  }

  if (hasSoldData) {
    for (const sold of soldData) {
      const dateKey = new Date(sold.soldAt).toLocaleDateString();
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey, timestamp: new Date(sold.soldAt).getTime() });
      }
      const entry = dateMap.get(dateKey);
      // Average sold prices for the same day
      if (entry.soldPrices) {
        entry.soldPrices.push(sold.price);
      } else {
        entry.soldPrices = [sold.price];
      }
    }
  }

  // Convert to sorted array
  const sortedData = Array.from(dateMap.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(entry => ({
      ...entry,
      sold: entry.soldPrices
        ? Math.round((entry.soldPrices.reduce((a, b) => a + b, 0) / entry.soldPrices.length) * 100) / 100
        : undefined,
      soldPrices: undefined
    }));

  const allPrices = sortedData.flatMap(d => [d.baseline, d.sold].filter(Boolean));
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const padding = (maxPrice - minPrice) * 0.1 || 1;

  return (
    <div className="mb-6 bg-bg-card border border-border rounded-lg p-4 animate-[fadeInUp_200ms_ease-out]">
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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-0.5">
            {[7, 14, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => { setChartDays(d); fetchCardHistory(cardName, d); }}
                className={`text-[10px] px-2 py-1 rounded-md transition-all ${
                  chartDays === d ? 'bg-accent/20 text-accent font-medium' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {d === 7 ? '1W' : d === 14 ? '2W' : d === 30 ? '1M' : '3M'}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-xs text-text-muted hover:text-text-primary ml-2">Close</button>
        </div>
      </div>

      {/* Recharts line chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={sortedData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[Math.floor(minPrice - padding), Math.ceil(maxPrice + padding)]}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={v => `$${v}`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="baseline"
              name="Market Baseline"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#baselineGradient)"
              dot={false}
              connectNulls
            />
            {hasSoldData && (
              <Line
                type="monotone"
                dataKey="sold"
                name="Sold Price"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 3 }}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[#6366f1] rounded" />
          <span className="text-[10px] text-text-muted">Market Baseline</span>
        </div>
        {hasSoldData && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#22c55e] rounded" />
            <span className="text-[10px] text-text-muted">Actual Sold Prices</span>
          </div>
        )}
        <span className="text-[10px] text-text-muted">
          {sortedData.length} data points
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
