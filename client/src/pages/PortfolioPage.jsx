import { useEffect, useState } from 'react';
import usePortfolioStore from '../store/portfolioStore';

function StatCard({ label, value, color = 'text-text-primary', prefix = '' }) {
  return (
    <div className="bg-bg-card border border-border rounded-lg p-3">
      <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${color}`}>{prefix}{value}</p>
    </div>
  );
}

function EditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    purchasePrice: item.purchasePrice || '',
    purchasedAt: item.purchasedAt ? new Date(item.purchasedAt).toISOString().split('T')[0] : '',
    soldPrice: item.soldPrice ?? '',
    soldAt: item.soldAt ? new Date(item.soldAt).toISOString().split('T')[0] : '',
    platformFees: item.platformFees || '',
    shippingPaid: item.shippingPaid || '',
    notes: item.notes || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(item.id, {
        purchasePrice: form.purchasePrice !== '' ? Number(form.purchasePrice) : null,
        purchasedAt: form.purchasedAt || null,
        soldPrice: form.soldPrice !== '' ? Number(form.soldPrice) : null,
        soldAt: form.soldAt || null,
        platformFees: form.platformFees !== '' ? Number(form.platformFees) : null,
        shippingPaid: form.shippingPaid !== '' ? Number(form.shippingPaid) : null,
        notes: form.notes || null
      });
      onClose();
    } catch {
      // Error handled
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "text-xs bg-bg-tertiary text-text-primary border border-border rounded-lg px-2.5 py-1.5 focus:border-accent outline-none w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 animate-[fadeIn_150ms_ease-out]" onClick={onClose} />
      <div className="relative bg-bg-secondary border border-border rounded-xl p-6 max-w-md w-full mx-4 animate-[scaleIn_200ms_ease-out]">
        <h3 className="text-lg font-bold text-text-primary mb-1">{item.cardName}</h3>
        <p className="text-xs text-text-muted mb-4 truncate">{item.listingTitle}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Purchase price ($)</label>
              <input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Purchase date</label>
              <input type="date" value={form.purchasedAt} onChange={e => setForm(f => ({ ...f, purchasedAt: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Sold price ($)</label>
              <input type="number" min="0" step="0.01" value={form.soldPrice} onChange={e => setForm(f => ({ ...f, soldPrice: e.target.value }))} className={inputClass} placeholder="Not sold" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Sold date</label>
              <input type="date" value={form.soldAt} onChange={e => setForm(f => ({ ...f, soldAt: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Platform fees ($)</label>
              <input type="number" min="0" step="0.01" value={form.platformFees} onChange={e => setForm(f => ({ ...f, platformFees: e.target.value }))} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Shipping paid ($)</label>
              <input type="number" min="0" step="0.01" value={form.shippingPaid} onChange={e => setForm(f => ({ ...f, shippingPaid: e.target.value }))} className={inputClass} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${inputClass} h-16 resize-none`} placeholder="Optional notes..." />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="text-xs px-4 py-2 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary">Cancel</button>
            <button type="submit" disabled={saving} className="text-xs px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { portfolio, stats, isLoading, error, fetchPortfolio, fetchStats, updatePortfolioItem } = usePortfolioStore();
  const [editingItem, setEditingItem] = useState(null);
  const [sortBy, setSortBy] = useState('purchasedAt');

  useEffect(() => {
    fetchPortfolio();
    fetchStats();
  }, [fetchPortfolio, fetchStats]);

  const handleSort = (sort) => {
    setSortBy(sort);
    fetchPortfolio(sort, 'desc');
  };

  const soldItems = portfolio.filter(p => p.soldPrice != null);
  const holdingItems = portfolio.filter(p => p.soldPrice == null);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-1">Portfolio</h2>
        <p className="text-sm text-text-secondary">
          Track your purchases and sales. Mark saved deals as "purchased" to add them here.
        </p>
      </div>

      {/* Stats dashboard */}
      {stats && stats.totalCards > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 mb-6">
          <StatCard label="Total Invested" value={`$${stats.totalSpent.toFixed(2)}`} />
          <StatCard label="Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} />
          <StatCard
            label="Profit / Loss"
            value={`$${Math.abs(stats.totalProfit).toFixed(2)}`}
            prefix={stats.totalProfit >= 0 ? '+$' : '-$'}
            color={stats.totalProfit >= 0 ? 'text-deal-green' : 'text-error'}
          />
          <StatCard
            label="ROI"
            value={`${Math.abs(stats.roi).toFixed(1)}%`}
            prefix={stats.roi >= 0 ? '+' : '-'}
            color={stats.roi >= 0 ? 'text-deal-green' : 'text-error'}
          />
          <StatCard label="Cards" value={`${stats.soldCount} sold · ${stats.unsoldCount} holding`} />
        </div>
      )}

      {/* Sort controls */}
      {portfolio.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-text-muted">Sort:</span>
          {[
            { value: 'purchasedAt', label: 'Recent' },
            { value: 'purchasePrice', label: 'Price' },
            { value: 'profit', label: 'Profit' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSort(opt.value)}
              className={`text-xs px-2 py-1 rounded ${
                sortBy === opt.value ? 'bg-accent/15 text-accent font-medium' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error">{error}</div>
      )}

      {/* Empty state */}
      {!isLoading && portfolio.length === 0 && (
        <div className="mt-16 text-center animate-[fadeInUp_300ms_ease-out]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <p className="text-text-secondary font-medium">No purchases tracked yet.</p>
          <p className="text-xs text-text-muted mt-2 max-w-md mx-auto">
            Go to Saved Deals and click "Mark Purchased" on a deal to start tracking your portfolio.
          </p>
        </div>
      )}

      {isLoading && portfolio.length === 0 && (
        <div className="text-center py-16 text-text-muted text-sm">Loading portfolio...</div>
      )}

      {/* Holding items */}
      {holdingItems.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Holding ({holdingItems.length})
          </h3>
          <div className="space-y-2">
            {holdingItems.map(item => (
              <PortfolioCard key={item.id} item={item} onEdit={() => setEditingItem(item)} />
            ))}
          </div>
        </div>
      )}

      {/* Sold items */}
      {soldItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Sold ({soldItems.length})
          </h3>
          <div className="space-y-2">
            {soldItems.map(item => (
              <PortfolioCard key={item.id} item={item} onEdit={() => setEditingItem(item)} />
            ))}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingItem && (
        <EditModal
          item={editingItem}
          onSave={updatePortfolioItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function PortfolioCard({ item, onEdit }) {
  const isSold = item.soldPrice != null;

  return (
    <div className="bg-bg-card border border-border rounded-lg p-4 hover:border-border-bright transition-colors">
      <div className="flex items-start gap-4">
        {item.images && item.images.length > 0 && (
          <div className="shrink-0 w-10 h-14 rounded overflow-hidden bg-bg-tertiary">
            <img src={item.images[0]} alt={item.cardName} className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-text-primary truncate">{item.cardName}</h4>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  isSold ? 'bg-deal-green/15 text-deal-green' : 'bg-accent/15 text-accent'
                }`}>
                  {isSold ? 'Sold' : 'Holding'}
                </span>
                {item.purchasedAt && (
                  <span className="text-xs text-text-muted">
                    Bought {new Date(item.purchasedAt).toLocaleDateString()}
                  </span>
                )}
                {item.hasTypo && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-typo-amber/15 text-typo-amber">Typo</span>
                )}
              </div>
              {item.notes && (
                <p className="text-xs text-text-muted mt-1 truncate">{item.notes}</p>
              )}
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs text-text-muted">Bought: ${item.purchasePrice.toFixed(2)}</div>
              {isSold ? (
                <>
                  <div className="text-xs text-text-muted">Sold: ${item.soldPrice.toFixed(2)}</div>
                  <div className={`text-sm font-bold mt-0.5 ${
                    item.profit >= 0 ? 'text-deal-green' : 'text-error'
                  }`}>
                    {item.profit >= 0 ? '+' : ''}${item.profit.toFixed(2)}
                    {item.roiPercent != null && (
                      <span className="text-xs ml-1">({item.roiPercent > 0 ? '+' : ''}{item.roiPercent.toFixed(0)}%)</span>
                    )}
                  </div>
                </>
              ) : (
                item.marketPrice && (
                  <div className="text-xs text-text-muted mt-0.5">
                    Market: ${item.marketPrice.toFixed(2)}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="flex items-center justify-end mt-2 gap-2">
            <button onClick={onEdit} className="text-xs px-2.5 py-1 rounded-md bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors">
              Edit
            </button>
            {item.listingUrl && (
              <a href={item.listingUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1 rounded-md bg-accent/15 text-accent hover:bg-accent/25 transition-colors">
                eBay
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
