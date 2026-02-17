import { useEffect, useState } from 'react';
import useSnipeStore from '../store/snipeStore';
import useSnipeAlertStore from '../store/snipeAlertStore';
import DealScoreBadge from '../components/DealScoreBadge';
import PriceDisplay from '../components/PriceDisplay';
import { api } from '../utils/api';

/* ── Listing Row (works for both auctions and BIN) ── */
function ListingRow({ listing }) {
  const isAuction = listing.buyingOption === 'AUCTION';
  const hoursLeft = listing.hoursRemaining;

  const timeLabel = hoursLeft != null
    ? hoursLeft < 1
      ? `${Math.round(hoursLeft * 60)}m`
      : hoursLeft < 24
        ? `${Math.round(hoursLeft)}h`
        : `${Math.round(hoursLeft / 24)}d ${Math.round(hoursLeft % 24)}h`
    : null;

  const urgencyColor = listing.timeCategory === 'urgent'
    ? 'text-error'
    : listing.timeCategory === 'soon'
      ? 'text-warning'
      : 'text-text-muted';

  return (
    <a
      href={listing.listingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-bg-card border border-border rounded-lg p-4 hover:border-border-bright transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 flex flex-col items-center gap-1">
          <DealScoreBadge score={listing.dealScore} size="lg" />
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Score</span>
        </div>

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

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate" title={listing.listingTitle}>
            {listing.listingTitle}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              isAuction ? 'bg-purple-500/15 text-purple-400' : 'bg-accent/15 text-accent'
            }`}>
              {isAuction ? 'Auction' : 'BIN'}
            </span>
            <span className="text-xs text-text-secondary">{listing.cardName}</span>
            {listing.searchQuery?.set && (
              <span className="text-xs text-text-muted">· {listing.searchQuery.set}</span>
            )}
            {isAuction && (
              <span className="flex items-center gap-1 text-xs">
                <span className="text-text-muted">
                  {listing.bidCount ?? 0} bid{listing.bidCount !== 1 ? 's' : ''}
                </span>
                {timeLabel && (
                  <span className={`font-semibold ${urgencyColor}`}>
                    · {timeLabel} left
                  </span>
                )}
              </span>
            )}
            {listing.acceptsBestOffer && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                Best Offer
              </span>
            )}
            {listing.hasTypo && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-typo-amber/15 text-typo-amber">
                Typo
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <PriceDisplay
            price={listing.currentBidPrice || listing.currentPrice}
            shippingCost={listing.shippingCost}
            shippingEstimated={listing.shippingEstimated}
            baseline={listing.recentSoldPrice}
            gapPercent={listing.priceGapPercent}
          />
        </div>
      </div>
    </a>
  );
}

/* ── Section Group ── */
function ListingSection({ title, subtitle, listings, color, icon }) {
  if (listings.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <span className="text-xs text-text-muted">{subtitle}</span>
        <span className="text-xs text-text-muted ml-auto">{listings.length} {icon || 'listing'}{listings.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-2">
        {listings.map(l => (
          <ListingRow key={l.id} listing={l} />
        ))}
      </div>
    </div>
  );
}

/* ── Multi-select dropdown ── */
function MultiSelect({ label, options, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs bg-bg-tertiary text-text-primary border border-border rounded-lg px-2.5 py-1.5 focus:border-accent outline-none transition-colors min-w-[120px]"
      >
        <span className="truncate">
          {selected.length === 0 ? placeholder || label : `${selected.length} selected`}
        </span>
        <svg className={`w-3 h-3 text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-56 max-h-48 overflow-y-auto bg-bg-secondary border border-border rounded-lg shadow-lg py-1">
            {options.length === 0 && (
              <div className="px-3 py-2 text-xs text-text-muted">No options available</div>
            )}
            {selected.length > 0 && (
              <button
                onClick={() => { onChange([]); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-accent hover:bg-bg-tertiary"
              >
                Clear all
              </button>
            )}
            {options.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-primary hover:bg-bg-tertiary cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => {
                    onChange(
                      selected.includes(opt)
                        ? selected.filter(s => s !== opt)
                        : [...selected, opt]
                    );
                  }}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span className="truncate">{opt}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Alert Form ── */
function AlertForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    alertType: initial?.alertType || 'AUCTION_ENDING',
    sets: initial?.sets || [],
    cardNames: initial?.cardNames || [],
    maxHoursRemaining: initial?.maxHoursRemaining ?? 6,
    maxBids: initial?.maxBids ?? '',
    minPriceGapPercent: initial?.minPriceGapPercent ?? '',
    maxPriceDollars: initial?.maxPriceDollars ?? '',
    minDealScore: initial?.minDealScore ?? '',
    cooldownMinutes: initial?.cooldownMinutes ?? 60
  });
  const [setsInput, setSetsInput] = useState('');
  const [cardInput, setCardInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      ...form,
      maxBids: form.maxBids !== '' ? Number(form.maxBids) : null,
      minPriceGapPercent: form.minPriceGapPercent !== '' ? Number(form.minPriceGapPercent) : null,
      maxPriceDollars: form.maxPriceDollars !== '' ? Number(form.maxPriceDollars) : null,
      minDealScore: form.minDealScore !== '' ? Number(form.minDealScore) : null,
      maxHoursRemaining: form.alertType === 'AUCTION_ENDING' ? Number(form.maxHoursRemaining) : null,
      cooldownMinutes: Number(form.cooldownMinutes)
    });
  };

  const addSet = () => {
    const v = setsInput.trim();
    if (v && !form.sets.includes(v)) {
      setForm(f => ({ ...f, sets: [...f.sets, v] }));
      setSetsInput('');
    }
  };
  const addCard = () => {
    const v = cardInput.trim();
    if (v && !form.cardNames.includes(v)) {
      setForm(f => ({ ...f, cardNames: [...f.cardNames, v] }));
      setCardInput('');
    }
  };

  const selectClass = "text-xs bg-bg-tertiary text-text-primary border border-border rounded-lg px-2 py-1.5 focus:border-accent outline-none w-full";
  const inputClass = "text-xs bg-bg-tertiary text-text-primary border border-border rounded-lg px-2.5 py-1.5 focus:border-accent outline-none w-full";

  return (
    <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-lg p-4 space-y-4 animate-[fadeInUp_200ms_ease-out]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Name */}
        <div>
          <label className="text-xs text-text-muted mb-1 block">Alert name</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Charizard under $50"
            className={inputClass}
            required
          />
        </div>
        {/* Type */}
        <div>
          <label className="text-xs text-text-muted mb-1 block">Alert type</label>
          <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-0.5">
            {[
              { value: 'AUCTION_ENDING', label: 'Auction Ending' },
              { value: 'BIN_DEAL', label: 'BIN Deal' }
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, alertType: opt.value }))}
                className={`flex-1 text-xs px-2.5 py-1.5 rounded-md transition-all ${
                  form.alertType === opt.value
                    ? 'bg-accent/20 text-accent font-medium'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Thresholds */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {form.alertType === 'AUCTION_ENDING' && (
          <div>
            <label className="text-xs text-text-muted mb-1 block">Max hours left</label>
            <select value={form.maxHoursRemaining} onChange={e => setForm(f => ({ ...f, maxHoursRemaining: Number(e.target.value) }))} className={selectClass}>
              <option value={1}>1 hour</option>
              <option value={3}>3 hours</option>
              <option value={6}>6 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
            </select>
          </div>
        )}
        {form.alertType === 'AUCTION_ENDING' && (
          <div>
            <label className="text-xs text-text-muted mb-1 block">Max bids</label>
            <input type="number" min="0" value={form.maxBids} onChange={e => setForm(f => ({ ...f, maxBids: e.target.value }))} placeholder="Any" className={inputClass} />
          </div>
        )}
        <div>
          <label className="text-xs text-text-muted mb-1 block">Min % below market</label>
          <input type="number" min="0" step="1" value={form.minPriceGapPercent} onChange={e => setForm(f => ({ ...f, minPriceGapPercent: e.target.value }))} placeholder="Any" className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-text-muted mb-1 block">Max price ($)</label>
          <input type="number" min="0" step="0.01" value={form.maxPriceDollars} onChange={e => setForm(f => ({ ...f, maxPriceDollars: e.target.value }))} placeholder="Any" className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-text-muted mb-1 block">Min deal score</label>
          <input type="number" min="0" max="100" value={form.minDealScore} onChange={e => setForm(f => ({ ...f, minDealScore: e.target.value }))} placeholder="Any" className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-text-muted mb-1 block">Cooldown (min)</label>
          <select value={form.cooldownMinutes} onChange={e => setForm(f => ({ ...f, cooldownMinutes: Number(e.target.value) }))} className={selectClass}>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={360}>6 hours</option>
          </select>
        </div>
      </div>

      {/* Sets */}
      <div>
        <label className="text-xs text-text-muted mb-1 block">Filter to sets (leave empty for all)</label>
        <div className="flex gap-2">
          <input value={setsInput} onChange={e => setSetsInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSet())} placeholder="Type set name and press Enter" className={inputClass} />
          <button type="button" onClick={addSet} className="text-xs px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-text-secondary hover:text-text-primary shrink-0">Add</button>
        </div>
        {form.sets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.sets.map(s => (
              <span key={s} className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                {s}
                <button type="button" onClick={() => setForm(f => ({ ...f, sets: f.sets.filter(x => x !== s) }))} className="hover:text-error">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card names */}
      <div>
        <label className="text-xs text-text-muted mb-1 block">Filter to cards (leave empty for all)</label>
        <div className="flex gap-2">
          <input value={cardInput} onChange={e => setCardInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCard())} placeholder="Type card name and press Enter" className={inputClass} />
          <button type="button" onClick={addCard} className="text-xs px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-text-secondary hover:text-text-primary shrink-0">Add</button>
        </div>
        {form.cardNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.cardNames.map(c => (
              <span key={c} className="inline-flex items-center gap-1 text-xs bg-deal-green/10 text-deal-green px-2 py-0.5 rounded-full">
                {c}
                <button type="button" onClick={() => setForm(f => ({ ...f, cardNames: f.cardNames.filter(x => x !== c) }))} className="hover:text-error">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button type="button" onClick={onCancel} className="text-xs px-4 py-2 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary">Cancel</button>
        <button type="submit" className="text-xs px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90">{initial ? 'Update' : 'Create'} Alert</button>
      </div>
    </form>
  );
}

/* ── Alerts Panel ── */
function AlertsPanel() {
  const { alerts, emailConfigured, isLoading, fetchAlerts, createAlert, deleteAlert, toggleAlert, testAlert, fetchHistory, history } = useSnipeAlertStore();
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [viewHistory, setViewHistory] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const { updateAlert } = useSnipeAlertStore();

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleCreate = async (data) => {
    try {
      await createAlert(data);
      setShowForm(false);
    } catch {
      // Error handled in store
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateAlert(editingAlert.id, data);
      setEditingAlert(null);
    } catch {
      // Error handled
    }
  };

  const handleTest = async (alert) => {
    setTestingId(alert.id);
    setTestResult(null);
    try {
      const result = await testAlert(alert.id);
      setTestResult({ id: alert.id, ...result });
    } catch {
      setTestResult({ id: alert.id, success: false, message: 'Failed to send test' });
    } finally {
      setTestingId(null);
    }
  };

  const handleViewHistory = (alert) => {
    setViewHistory(viewHistory === alert.id ? null : alert.id);
    if (viewHistory !== alert.id) fetchHistory(alert.id);
  };

  return (
    <div className="mt-8 border-t border-border pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            Email Alerts
          </h3>
          <p className="text-xs text-text-muted mt-0.5">Get notified when deals match your criteria. Checked every 5 minutes.</p>
        </div>
        {!showForm && !editingAlert && (
          <button onClick={() => setShowForm(true)} className="text-xs px-3 py-1.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors">
            + New Alert
          </button>
        )}
      </div>

      {!emailConfigured && (
        <div className="mb-4 bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-2">
          <svg className="w-4 h-4 text-warning shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-xs text-warning font-medium">SMTP not configured</p>
            <p className="text-xs text-text-muted mt-0.5">Add SMTP_HOST, SMTP_USER, SMTP_PASS, and ALERT_EMAIL to your server .env file to enable email delivery. Alerts will log to server console until configured.</p>
          </div>
        </div>
      )}

      {/* New alert form */}
      {showForm && <AlertForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}
      {editingAlert && <AlertForm onSubmit={handleUpdate} onCancel={() => setEditingAlert(null)} initial={editingAlert} />}

      {/* Alert list */}
      {isLoading && alerts.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm">Loading alerts...</div>
      )}

      {!isLoading && alerts.length === 0 && !showForm && (
        <div className="text-center py-8">
          <p className="text-sm text-text-muted">No alerts configured yet.</p>
        </div>
      )}

      <div className="space-y-2 mt-3">
        {alerts.map(alert => (
          <div key={alert.id} className="bg-bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-3">
              {/* Toggle */}
              <button
                onClick={() => toggleAlert(alert.id, !alert.enabled)}
                className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${alert.enabled ? 'bg-accent' : 'bg-bg-tertiary border border-border'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${alert.enabled ? 'left-[18px]' : 'left-0.5'}`} />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary truncate">{alert.name}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    alert.alertType === 'AUCTION_ENDING' ? 'bg-purple-500/15 text-purple-400' : 'bg-accent/15 text-accent'
                  }`}>
                    {alert.alertType === 'AUCTION_ENDING' ? 'Auction' : 'BIN'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted flex-wrap">
                  {alert.alertType === 'AUCTION_ENDING' && alert.maxHoursRemaining && (
                    <span>≤{alert.maxHoursRemaining}h</span>
                  )}
                  {alert.maxBids != null && <span>≤{alert.maxBids} bids</span>}
                  {alert.minPriceGapPercent != null && <span>≥{Number(alert.minPriceGapPercent)}% below</span>}
                  {alert.maxPriceDollars != null && <span>≤${Number(alert.maxPriceDollars)}</span>}
                  {alert.minDealScore != null && <span>Score ≥{alert.minDealScore}</span>}
                  {alert.sets?.length > 0 && <span>{alert.sets.length} set{alert.sets.length > 1 ? 's' : ''}</span>}
                  {alert.cardNames?.length > 0 && <span>{alert.cardNames.length} card{alert.cardNames.length > 1 ? 's' : ''}</span>}
                  {alert.triggerCount > 0 && (
                    <span className="text-accent">{alert.triggerCount} trigger{alert.triggerCount > 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleTest(alert)}
                  disabled={testingId === alert.id}
                  className="text-xs px-2 py-1 rounded text-text-muted hover:text-accent transition-colors disabled:opacity-50"
                  title="Send test email"
                >
                  {testingId === alert.id ? (
                    <div className="w-4 h-4 border-2 border-border border-t-accent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </button>
                <button onClick={() => handleViewHistory(alert)} className="text-xs px-2 py-1 rounded text-text-muted hover:text-text-primary transition-colors" title="View history">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button onClick={() => setEditingAlert(alert)} className="text-xs px-2 py-1 rounded text-text-muted hover:text-text-primary transition-colors" title="Edit">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                  </svg>
                </button>
                <button onClick={() => deleteAlert(alert.id)} className="text-xs px-2 py-1 rounded text-text-muted hover:text-error transition-colors" title="Delete">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Test result */}
            {testResult && testResult.id === alert.id && (
              <div className={`mt-2 text-xs px-2 py-1 rounded ${testResult.emailSent ? 'bg-deal-green/10 text-deal-green' : 'bg-warning/10 text-warning'}`}>
                {testResult.message}
              </div>
            )}

            {/* History panel */}
            {viewHistory === alert.id && (
              <div className="mt-3 pt-3 border-t border-border">
                {history.length === 0 ? (
                  <p className="text-xs text-text-muted">No triggers yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {history.map(h => (
                      <div key={h.id} className="flex items-center gap-2 text-xs">
                        <span className="text-text-muted shrink-0">{new Date(h.triggeredAt).toLocaleString()}</span>
                        <span className="text-text-primary truncate">{h.cardName}</span>
                        <span className="text-deal-green font-medium shrink-0">${Number(h.price).toFixed(2)}</span>
                        {h.priceGapPercent && <span className="text-text-muted shrink-0">{Number(h.priceGapPercent).toFixed(1)}% below</span>}
                        {h.emailSent ? (
                          <span className="text-accent shrink-0" title="Email sent">✓</span>
                        ) : (
                          <span className="text-text-muted shrink-0" title="Logged only">○</span>
                        )}
                        <a href={h.listingUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline shrink-0 ml-auto">View</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function SnipeWatchlistPage() {
  const { urgent, soon, upcoming, binDeals, total, isLoading, isRefreshing, lastRefreshResult, error, filters, fetchWatchlist, refreshWatchlist, setFilters, fetchFilterOptions, filterOptions, availableSearches, fetchAvailableSearches } = useSnipeStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState(null);
  const [showRefreshPicker, setShowRefreshPicker] = useState(false);
  const [selectedSearchIds, setSelectedSearchIds] = useState([]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchWatchlist(filters);
    const interval = setInterval(() => fetchWatchlist(filters), 60000);
    return () => clearInterval(interval);
  }, [fetchWatchlist, filters]);

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  const hasAdvancedFilters = filters.minDealScore > 0 || filters.sets.length > 0 || filters.cardNames.length > 0 || filters.maxPrice;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">Snipe Watchlist</h2>
          <p className="text-sm text-text-secondary">
            Find auctions and BIN deals below market value. Auto-refreshes every minute.
          </p>
        </div>
        <button
          onClick={() => {
            fetchAvailableSearches();
            setSelectedSearchIds([]);
            setShowRefreshPicker(true);
          }}
          disabled={isRefreshing}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition-colors font-medium disabled:opacity-50 shrink-0"
          title="Pull fresh listings from eBay (does not trigger email alerts)"
        >
          {isRefreshing ? (
            <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M4.031 9.865v-4.992" />
            </svg>
          )}
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Refresh search picker modal */}
      {showRefreshPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 animate-[fadeIn_150ms_ease-out]" onClick={() => setShowRefreshPicker(false)} />
          <div className="relative bg-bg-secondary border border-border rounded-xl p-6 max-w-md w-full mx-4 animate-[scaleIn_200ms_ease-out]">
            <h3 className="text-lg font-bold text-text-primary mb-1">Refresh Data</h3>
            <p className="text-xs text-text-muted mb-4">Select which searches to re-run against eBay. This will NOT trigger email alerts. Max 5 at a time.</p>

            {availableSearches.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">No saved searches yet. Create searches first.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
                {availableSearches.map(s => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                      selectedSearchIds.includes(s.id) ? 'bg-accent/10 border border-accent/30' : 'bg-bg-tertiary border border-transparent hover:bg-bg-card'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSearchIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedSearchIds.length < 5) {
                            setSelectedSearchIds([...selectedSearchIds, s.id]);
                          }
                        } else {
                          setSelectedSearchIds(selectedSearchIds.filter(id => id !== s.id));
                        }
                      }}
                      className="accent-accent"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{s.cardName}</p>
                      <p className="text-[10px] text-text-muted">
                        {s.set || 'Any set'} · {s.listingCount} listings
                        {s.lastExecutedAt && ` · Last run ${new Date(s.lastExecutedAt).toLocaleString()}`}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-xs text-text-muted">{selectedSearchIds.length}/5 selected</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRefreshPicker(false)}
                  className="text-xs px-4 py-2 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowRefreshPicker(false);
                    setRefreshMsg(null);
                    try {
                      const result = await refreshWatchlist(selectedSearchIds);
                      setRefreshMsg(result.message);
                      fetchWatchlist(filters);
                      setTimeout(() => setRefreshMsg(null), 6000);
                    } catch {
                      setRefreshMsg('Failed to refresh. Try again.');
                      setTimeout(() => setRefreshMsg(null), 4000);
                    }
                  }}
                  disabled={selectedSearchIds.length === 0}
                  className="text-xs px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50"
                >
                  Refresh ({selectedSearchIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refresh result message */}
      {refreshMsg && (
        <div className="mb-4 bg-accent/10 border border-accent/20 rounded-lg p-3 flex items-center gap-2 animate-[fadeInUp_150ms_ease-out]">
          <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-accent">{refreshMsg}</span>
        </div>
      )}

      {/* Listing Type Toggle */}
      <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-0.5 mb-4 w-fit">
        {[
          { value: 'AUCTION', label: 'Auctions' },
          { value: 'BIN', label: 'Buy It Now' },
          { value: 'all', label: 'All' }
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => handleFilterChange('buyingOption', opt.value)}
            className={`text-xs px-3 py-1.5 rounded-md transition-all ${
              filters.buyingOption === opt.value
                ? opt.value === 'AUCTION' ? 'bg-purple-500/20 text-purple-400 font-medium' : 'bg-accent/20 text-accent font-medium'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 bg-bg-card border border-border rounded-lg p-3">
        <div className="flex items-center gap-4 flex-wrap">
          {(filters.buyingOption === 'AUCTION' || filters.buyingOption === 'all') && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted">Ending within</label>
                <select
                  value={filters.maxHours}
                  onChange={(e) => handleFilterChange('maxHours', Number(e.target.value))}
                  className="text-xs bg-bg-tertiary text-text-primary border border-border rounded-lg px-2 py-1.5 focus:border-accent outline-none"
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
                  value={filters.maxBids}
                  onChange={(e) => handleFilterChange('maxBids', Number(e.target.value))}
                  className="text-xs bg-bg-tertiary text-text-primary border border-border rounded-lg px-2 py-1.5 focus:border-accent outline-none"
                >
                  <option value={0}>0 (no bids)</option>
                  <option value={2}>2 or fewer</option>
                  <option value={5}>5 or fewer</option>
                  <option value={10}>10 or fewer</option>
                  <option value={100}>Any</option>
                </select>
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">Min gap</label>
            <select
              value={filters.minGap}
              onChange={(e) => handleFilterChange('minGap', Number(e.target.value))}
              className="text-xs bg-bg-tertiary text-text-primary border border-border rounded-lg px-2 py-1.5 focus:border-accent outline-none"
            >
              <option value={0}>Any below market</option>
              <option value={5}>5%+ below</option>
              <option value={10}>10%+ below</option>
              <option value={20}>20%+ below</option>
              <option value={30}>30%+ below</option>
              <option value={50}>50%+ below</option>
            </select>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary ml-auto relative"
          >
            {hasAdvancedFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
            )}
            <span>Filters</span>
            <svg className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-border border-t-accent rounded-full animate-spin" />
              <span className="text-xs text-text-muted">Refreshing...</span>
            </div>
          )}
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 flex-wrap animate-[fadeInUp_150ms_ease-out]">
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted">Min score</label>
              <select
                value={filters.minDealScore}
                onChange={(e) => handleFilterChange('minDealScore', Number(e.target.value))}
                className="text-xs bg-bg-tertiary text-text-primary border border-border rounded-lg px-2 py-1.5 focus:border-accent outline-none"
              >
                <option value={0}>Any</option>
                <option value={30}>30+</option>
                <option value={40}>40+</option>
                <option value={50}>50+</option>
                <option value={60}>60+</option>
                <option value={70}>70+</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted">Max price</label>
              <input
                type="number"
                min="0"
                step="1"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="$"
                className="text-xs bg-bg-tertiary text-text-primary border border-border rounded-lg px-2 py-1.5 focus:border-accent outline-none w-20"
              />
            </div>

            <MultiSelect
              label="Sets"
              options={filterOptions.sets}
              selected={filters.sets}
              onChange={(v) => handleFilterChange('sets', v)}
              placeholder="All sets"
            />

            <MultiSelect
              label="Cards"
              options={filterOptions.cardNames}
              selected={filters.cardNames}
              onChange={(v) => handleFilterChange('cardNames', v)}
              placeholder="All cards"
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-error/10 border border-error/20 rounded-lg p-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && !isLoading && !error && (
        <div className="mt-16 text-center animate-[fadeInUp_300ms_ease-out]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-text-secondary font-medium">No sniping opportunities right now.</p>
          <p className="text-sm text-text-muted mt-2">
            Run some searches first to populate listing data, then check back here.
          </p>
        </div>
      )}

      {/* Auction sections */}
      <ListingSection title="Ending Now" subtitle="< 1 hour — price is likely final" listings={urgent} color="bg-error" icon="auction" />
      <ListingSection title="Ending Soon" subtitle="1-6 hours — still time to snipe" listings={soon} color="bg-warning" icon="auction" />
      <ListingSection title="Upcoming" subtitle="6+ hours — watch these" listings={upcoming} color="bg-text-muted" icon="auction" />

      {/* BIN deals section */}
      <ListingSection title="BIN Deals" subtitle="Buy It Now below market" listings={binDeals} color="bg-accent" icon="deal" />

      {/* Email Alerts Panel */}
      <AlertsPanel />

      {/* Notification Settings */}
      <NotificationSettings />
    </div>
  );
}

/* ── Notification Settings ── */
function NotificationSettings() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [discordUrl, setDiscordUrl] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChat, setTelegramChat] = useState('');
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (open && !settings) {
      api.get('/api/notification-settings').then(data => {
        setSettings(data);
        setTelegramChat(data.telegram?.chatId || '');
      }).catch(() => {});
    }
  }, [open, settings]);

  const handleSave = async (channel) => {
    setSaving(true);
    try {
      const body = {};
      if (channel === 'discord') body.discordWebhookUrl = discordUrl || null;
      if (channel === 'telegram') {
        body.telegramBotToken = telegramToken || null;
        body.telegramChatId = telegramChat || null;
      }
      await api.put('/api/notification-settings', body);
      setSettings(null); // Refresh
      setDiscordUrl('');
      setTelegramToken('');
    } catch {
      // Error handled
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (channel) => {
    setTestResult(null);
    try {
      const result = await api.post('/api/notification-settings/test', { channel });
      setTestResult({ channel, ...result });
    } catch (err) {
      setTestResult({ channel, success: false, message: err.message });
    }
  };

  const inputClass = "text-xs bg-bg-tertiary text-text-primary border border-border rounded-lg px-2.5 py-1.5 focus:border-accent outline-none w-full";

  return (
    <div className="mt-6 border-t border-border pt-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-accent transition-colors"
      >
        <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Notification Channels
        <svg className={`w-3 h-3 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
        {settings && (settings.discordConfigured || settings.telegramConfigured) && (
          <span className="text-xs text-deal-green font-normal">Active</span>
        )}
      </button>

      {open && (
        <div className="mt-4 space-y-4 animate-[fadeInUp_150ms_ease-out]">
          <p className="text-xs text-text-muted">Alerts are sent to all configured channels when triggered.</p>

          {/* Discord */}
          <div className="bg-bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-text-primary">Discord</span>
              {settings?.discordConfigured && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-deal-green/15 text-deal-green font-medium">Connected</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={discordUrl}
                onChange={e => setDiscordUrl(e.target.value)}
                placeholder={settings?.discordConfigured ? 'Update webhook URL...' : 'https://discord.com/api/webhooks/...'}
                className={inputClass}
              />
              <button onClick={() => handleSave('discord')} disabled={saving} className="text-xs px-3 py-1.5 bg-accent text-white rounded-lg shrink-0 disabled:opacity-50">
                {saving ? '...' : 'Save'}
              </button>
              {settings?.discordConfigured && (
                <button onClick={() => handleTest('discord')} className="text-xs px-2 py-1.5 bg-bg-tertiary text-text-secondary rounded-lg shrink-0 hover:text-text-primary">
                  Test
                </button>
              )}
            </div>
          </div>

          {/* Telegram */}
          <div className="bg-bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-text-primary">Telegram</span>
              {settings?.telegramConfigured && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-deal-green/15 text-deal-green font-medium">Connected</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={telegramToken}
                onChange={e => setTelegramToken(e.target.value)}
                placeholder={settings?.telegramConfigured ? 'Update bot token...' : 'Bot token from @BotFather'}
                className={inputClass}
              />
              <input
                value={telegramChat}
                onChange={e => setTelegramChat(e.target.value)}
                placeholder="Chat ID"
                className={inputClass}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleSave('telegram')} disabled={saving} className="text-xs px-3 py-1.5 bg-accent text-white rounded-lg disabled:opacity-50">
                {saving ? '...' : 'Save'}
              </button>
              {settings?.telegramConfigured && (
                <button onClick={() => handleTest('telegram')} className="text-xs px-2 py-1.5 bg-bg-tertiary text-text-secondary rounded-lg hover:text-text-primary">
                  Test
                </button>
              )}
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`text-xs px-3 py-2 rounded-lg ${testResult.success ? 'bg-deal-green/10 text-deal-green' : 'bg-error/10 text-error'}`}>
              {testResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
