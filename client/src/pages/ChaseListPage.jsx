import { useEffect, useState } from 'react';
import useChaseListStore from '../store/chaseListStore';

const RARITY_COLORS = {
  'Common': 'text-text-muted',
  'Uncommon': 'text-text-secondary',
  'Rare': 'text-accent',
  'Double Rare': 'text-accent',
  'Ultra Rare': 'text-typo-amber',
  'Illustration Rare': 'text-typo-amber',
  'Special Art Rare': 'text-deal-green',
  'Hyper Rare': 'text-price-up',
};

const STATUS_LABELS = {
  needed: 'Needed',
  dealFound: 'Deal Found',
  purchased: 'Purchased',
};

const STATUS_COLORS = {
  needed: 'bg-bg-tertiary text-text-secondary',
  dealFound: 'bg-deal-green/15 text-deal-green',
  purchased: 'bg-accent/15 text-accent',
};

export default function ChaseListPage() {
  const {
    availableSets, chaseLists, activeList, setCards,
    isLoading, isScanning, error,
    fetchSets, fetchChaseLists, fetchChaseList, fetchSetCards,
    createChaseList, deleteChaseList,
    addCards, removeCards, updateCardStatus, scanChaseList,
    clearError
  } = useChaseListStore();

  const [view, setView] = useState('list'); // 'list' | 'browse' | 'detail'
  const [selectedSet, setSelectedSet] = useState('');
  const [selectedCards, setSelectedCards] = useState(new Set());
  const [filterRarity, setFilterRarity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    fetchSets();
    fetchChaseLists();
  }, [fetchSets, fetchChaseLists]);

  // When activeList changes, sync selected cards
  useEffect(() => {
    if (activeList) {
      setSelectedCards(new Set(activeList.cards.map(c => c.setCardId)));
    }
  }, [activeList]);

  const handleCreateList = async () => {
    if (!selectedSet) return;
    try {
      const list = await createChaseList(selectedSet);
      await fetchSetCards(selectedSet);
      setView('browse');
      await fetchChaseList(list.id);
    } catch (e) {
      // If already exists, load it
      if (e.status === 409 && e.data?.chaseListId) {
        await fetchChaseList(e.data.chaseListId);
        await fetchSetCards(selectedSet);
        setView('browse');
      }
    }
  };

  const handleSelectList = async (list) => {
    await fetchChaseList(list.id);
    await fetchSetCards(list.setName);
    setView('detail');
  };

  const handleToggleCard = async (setCardId) => {
    if (!activeList) return;
    const newSelected = new Set(selectedCards);
    if (newSelected.has(setCardId)) {
      newSelected.delete(setCardId);
      await removeCards(activeList.id, [setCardId]);
    } else {
      newSelected.add(setCardId);
      await addCards(activeList.id, [setCardId]);
    }
    setSelectedCards(newSelected);
  };

  const handleStatusChange = async (cardId, status) => {
    if (!activeList) return;
    await updateCardStatus(activeList.id, cardId, status);
  };

  const handleScan = async () => {
    if (!activeList) return;
    setScanResult(null);
    try {
      const result = await scanChaseList(activeList.id);
      setScanResult(result);
    } catch {
      // Error handled by store
    }
  };

  const handleDelete = async (id) => {
    await deleteChaseList(id);
    setDeleteConfirm(null);
    setView('list');
    fetchChaseLists();
  };

  const handleBackToList = () => {
    setView('list');
    setScanResult(null);
    fetchChaseLists();
  };

  // Get unique rarities and types from set cards for filtering
  const rarities = [...new Set(setCards.map(c => c.rarity).filter(Boolean))];
  const cardTypes = [...new Set(setCards.map(c => c.cardType).filter(Boolean))];

  // Filter set cards
  const filteredSetCards = setCards.filter(card => {
    if (filterRarity && card.rarity !== filterRarity) return false;
    if (filterType && card.cardType !== filterType) return false;
    return true;
  });

  // Filter chase list cards by status
  const filteredChaseCards = activeList?.cards?.filter(card => {
    if (filterStatus && card.status !== filterStatus) return false;
    return true;
  }) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {error && (
        <div className="mb-4 bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error flex items-center justify-between">
          {error}
          <button onClick={clearError} className="text-xs text-error/60 hover:text-error ml-4">Dismiss</button>
        </div>
      )}

      {/* LIST VIEW — Show all chase lists */}
      {view === 'list' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Chase Lists</h2>
              <p className="text-sm text-text-secondary mt-0.5">
                Select cards you need to complete a master set. Deals are scanned automatically.
              </p>
            </div>
          </div>

          {/* Create new chase list */}
          <div className="bg-bg-secondary border border-border rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Start a new chase list</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-1">Set</label>
                <select
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent outline-none"
                >
                  <option value="">Select a set...</option>
                  {availableSets.map(s => (
                    <option key={s.name} value={s.name}>{s.name} ({s.cardCount} cards)</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreateList}
                disabled={!selectedSet || isLoading}
                className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Chase List'}
              </button>
            </div>
          </div>

          {/* Existing chase lists */}
          {isLoading && chaseLists.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">Loading chase lists...</div>
          ) : chaseLists.length === 0 ? (
            <div className="text-center py-16 text-text-muted text-sm">
              No chase lists yet. Create one above to start tracking cards you need.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chaseLists.map(list => (
                <div
                  key={list.id}
                  className="bg-bg-card border border-border rounded-xl p-5 hover:border-border-bright transition-colors cursor-pointer"
                  onClick={() => handleSelectList(list)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSelectList(list); }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-bold text-text-primary">{list.setName}</h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(list.id); }}
                      className="text-xs text-text-muted hover:text-error transition-colors p-1"
                      aria-label="Delete chase list"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>

                  {/* Progress bar */}
                  {list.stats && list.stats.total > 0 && (
                    <>
                      <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden mb-2">
                        <div className="h-full flex">
                          <div
                            className="bg-accent transition-all"
                            style={{ width: `${(list.stats.purchased / list.stats.total) * 100}%` }}
                          />
                          <div
                            className="bg-deal-green transition-all"
                            style={{ width: `${(list.stats.dealFound / list.stats.total) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span>{list.stats.needed} needed</span>
                        {list.stats.dealFound > 0 && (
                          <span className="text-deal-green">{list.stats.dealFound} deals</span>
                        )}
                        <span className="text-accent">{list.stats.purchased} owned</span>
                      </div>
                    </>
                  )}
                  {list.stats && list.stats.total === 0 && (
                    <p className="text-xs text-text-muted italic">No cards selected yet</p>
                  )}

                  {/* Estimated cost */}
                  {list.stats && list.stats.totalMarketValue > 0 && (
                    <div className="mt-2 text-xs text-text-secondary">
                      Est. cost to complete: <span className="font-semibold text-text-primary">${list.stats.totalMarketValue.toFixed(2)}</span>
                    </div>
                  )}

                  {list.lastScannedAt && (
                    <div className="mt-2 text-[10px] text-text-muted">
                      Last scanned: {new Date(list.lastScannedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* BROWSE VIEW — Select cards from the set to add to chase list */}
      {view === 'browse' && activeList && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToList}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-text-primary">{activeList.setName}</h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  Tap cards you still need. {selectedCards.size} selected.
                </p>
              </div>
            </div>
            <button
              onClick={() => setView('detail')}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              View Chase List ({selectedCards.size})
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:border-accent outline-none"
            >
              <option value="">All Rarities</option>
              {rarities.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:border-accent outline-none"
            >
              <option value="">All Types</option>
              {cardTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {filteredSetCards.map(card => {
              const isSelected = selectedCards.has(card.id);
              return (
                <div
                  key={card.id}
                  className={`relative bg-bg-card border rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                    isSelected
                      ? 'border-accent ring-1 ring-accent bg-accent/5'
                      : 'border-border hover:border-border-bright'
                  }`}
                  onClick={() => handleToggleCard(card.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleCard(card.id); } }}
                >
                  {/* Checkmark overlay */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  )}

                  {/* Card number */}
                  <div className="text-[10px] text-text-muted mb-1">{card.cardNumber}</div>

                  {/* Card image placeholder */}
                  <div className="w-full aspect-[2.5/3.5] bg-bg-tertiary rounded mb-2 flex items-center justify-center">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.cardName} className="w-full h-full object-cover rounded" loading="lazy" />
                    ) : (
                      <span className="text-[10px] text-text-muted text-center px-1 leading-tight">{card.cardName}</span>
                    )}
                  </div>

                  {/* Card info */}
                  <h4 className="text-xs font-medium text-text-primary truncate" title={card.cardName}>
                    {card.cardName}
                  </h4>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className={`text-[10px] ${RARITY_COLORS[card.rarity] || 'text-text-muted'}`}>
                      {card.rarity}
                    </span>
                    {card.marketPrice && (
                      <span className="text-[10px] font-medium text-text-secondary">
                        ${Number(card.marketPrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* DETAIL VIEW — Chase list with deal results */}
      {view === 'detail' && activeList && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToList}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-text-primary">{activeList.setName} — Chase List</h2>
                {activeList.stats && (
                  <p className="text-sm text-text-secondary mt-0.5">
                    {activeList.stats.needed} needed · {activeList.stats.dealFound} deals found · {activeList.stats.purchased} purchased
                    {activeList.stats.totalMarketValue > 0 && (
                      <> · Est. <span className="font-semibold">${activeList.stats.totalMarketValue.toFixed(2)}</span> to complete</>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { fetchSetCards(activeList.setName); setView('browse'); }}
                className="px-3 py-2 rounded-lg bg-bg-tertiary text-text-secondary text-sm font-medium hover:text-text-primary transition-colors"
              >
                Edit Cards
              </button>
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isScanning && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isScanning ? 'Scanning...' : 'Scan for Deals'}
              </button>
            </div>
          </div>

          {/* Scan result summary */}
          {scanResult && (
            <div className={`mb-4 border rounded-lg p-3 text-sm ${
              scanResult.dealsFound > 0
                ? 'bg-deal-green/10 border-deal-green/20 text-deal-green'
                : 'bg-bg-secondary border-border text-text-secondary'
            }`}>
              Scanned {scanResult.scanned} cards — {scanResult.dealsFound > 0
                ? `${scanResult.dealsFound} deal${scanResult.dealsFound > 1 ? 's' : ''} found!`
                : 'No deals meeting your threshold right now.'}
            </div>
          )}

          {/* Status filter */}
          <div className="flex gap-2 mb-4">
            {['', 'needed', 'dealFound', 'purchased'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === s
                    ? 'bg-accent/15 text-accent'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                {s === '' ? 'All' : STATUS_LABELS[s]}
                {s && activeList.stats && (
                  <span className="ml-1 opacity-60">
                    ({s === 'needed' ? activeList.stats.needed : s === 'dealFound' ? activeList.stats.dealFound : activeList.stats.purchased})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Chase cards list */}
          {filteredChaseCards.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">
              {activeList.cards?.length === 0
                ? 'No cards in your chase list yet. Click "Edit Cards" to select cards you need.'
                : 'No cards match the current filter.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChaseCards.map(card => (
                <ChaseCardRow
                  key={card.id}
                  card={card}
                  onStatusChange={(status) => handleStatusChange(card.id, status)}
                />
              ))}
            </div>
          )}

          {/* Last scan timestamp */}
          {activeList.lastScannedAt && (
            <div className="mt-4 text-xs text-text-muted text-center">
              Last scanned: {new Date(activeList.lastScannedAt).toLocaleString()}
              {activeList.scanEnabled && ' · Auto-scan every 15 minutes'}
            </div>
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-bg-secondary border border-border rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-text-primary mb-2">Delete this chase list?</h3>
            <p className="text-sm text-text-secondary mb-4">
              This will remove the chase list and all card tracking. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg bg-bg-tertiary text-text-secondary text-sm hover:bg-bg-tertiary/80"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-lg bg-error text-white text-sm font-medium hover:bg-error/80"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Single chase card row showing card info, deal, and status controls.
 */
function ChaseCardRow({ card, onStatusChange }) {
  const { setCard } = card;
  const hasDeal = card.bestDealUrl && card.bestDealPrice;
  const marketPrice = setCard.marketPrice ? Number(setCard.marketPrice) : null;
  const dealPrice = card.bestDealPrice ? Number(card.bestDealPrice) : null;
  const dealPercent = marketPrice && dealPrice
    ? Math.round(((marketPrice - dealPrice) / marketPrice) * 100)
    : null;

  return (
    <div className={`bg-bg-card border rounded-lg p-4 flex items-center gap-4 ${
      card.status === 'dealFound'
        ? 'border-deal-green/30 bg-deal-green/5'
        : card.status === 'purchased'
          ? 'border-accent/30 bg-accent/5'
          : 'border-border'
    }`}>
      {/* Card info */}
      <div className="shrink-0 w-10 h-14 bg-bg-tertiary rounded flex items-center justify-center">
        {setCard.imageUrl ? (
          <img src={setCard.imageUrl} alt={setCard.cardName} className="w-full h-full object-cover rounded" />
        ) : (
          <span className="text-[8px] text-text-muted text-center leading-tight">{setCard.cardNumber}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-text-primary truncate">{setCard.cardName}</h4>
          <span className="text-[10px] text-text-muted shrink-0">{setCard.cardNumber}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs ${RARITY_COLORS[setCard.rarity] || 'text-text-muted'}`}>
            {setCard.rarity}
          </span>
          {marketPrice && (
            <span className="text-xs text-text-muted">· Market: ${marketPrice.toFixed(2)}</span>
          )}
        </div>

        {/* Deal info */}
        {hasDeal && (
          <div className="flex items-center gap-2 mt-1">
            <a
              href={card.bestDealUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:text-accent-hover transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Best deal: ${dealPrice.toFixed(2)}
            </a>
            {dealPercent !== null && dealPercent > 0 && (
              <span className="text-xs font-medium text-deal-green">
                {dealPercent}% below market
              </span>
            )}
            {card.bestDealScore && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                card.bestDealScore >= 60 ? 'bg-deal-green/15 text-deal-green'
                  : card.bestDealScore >= 30 ? 'bg-typo-amber/15 text-typo-amber'
                    : 'bg-bg-tertiary text-text-muted'
              }`}>
                {card.bestDealScore}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Status badge + controls */}
      <div className="shrink-0 flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[card.status]}`}>
          {STATUS_LABELS[card.status]}
        </span>

        {card.status !== 'purchased' && (
          <button
            onClick={() => onStatusChange('purchased')}
            className="text-xs px-2 py-1 rounded bg-accent/15 text-accent hover:bg-accent/25 transition-colors font-medium"
            title="Mark as purchased"
          >
            Got it
          </button>
        )}
        {card.status === 'purchased' && (
          <button
            onClick={() => onStatusChange('needed')}
            className="text-xs px-2 py-1 rounded bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
            title="Mark as needed again"
          >
            Undo
          </button>
        )}
        {card.status === 'dealFound' && (
          <button
            onClick={() => onStatusChange('needed')}
            className="text-xs px-2 py-1 rounded bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
            title="Reset to needed"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
