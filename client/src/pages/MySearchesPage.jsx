import { useEffect, useState } from 'react';
import useSavedSearchesStore from '../store/savedSearchesStore';
import SearchForm from '../components/SearchForm';
import ListingCard from '../components/ListingCard';
import DealScoreBadge from '../components/DealScoreBadge';

const FREQUENCY_LABELS = {
  manual: 'Manual Only',
  hourly: 'Every Hour',
  fourHourly: 'Every 4 Hours',
  daily: 'Daily',
  weekly: 'Weekly'
};

export default function MySearchesPage() {
  const {
    searches, activeSearch, listings, recentSoldListings,
    isLoading, isRunning, error,
    fetchSearches, createSearch, deleteSearch, runSearch, loadListings
  } = useSavedSearchesStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [frequency, setFrequency] = useState('manual');
  const [priceThreshold, setPriceThreshold] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  const handleCreate = async (params) => {
    try {
      await createSearch({
        ...params,
        searchFrequency: frequency,
        priceThresholdPercent: priceThreshold ? Number(priceThreshold) : undefined
      });
      setShowCreateForm(false);
      setFrequency('manual');
      setPriceThreshold('');
      fetchSearches();
    } catch {
      // Error handled by store
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSearch(id);
      setDeleteConfirm(null);
      fetchSearches();
    } catch {
      // Error handled
    }
  };

  const handleRun = async (id) => {
    try {
      await runSearch(id);
    } catch {
      // Error handled
    }
  };

  const handleSelectSearch = (search) => {
    loadListings(search.id);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">My Searches</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Create saved searches with automated scheduling.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ New Search'}
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Create Saved Search</h3>
          <SearchForm onSearch={handleCreate} isSearching={isRunning} />
          <div className="flex gap-4 mt-3">
            <div className="w-48">
              <label htmlFor="frequency" className="block text-xs font-medium text-text-secondary mb-1">
                Schedule
              </label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent outline-none"
              >
                {Object.entries(FREQUENCY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="w-48">
              <label htmlFor="threshold" className="block text-xs font-medium text-text-secondary mb-1">
                Price Threshold %
              </label>
              <input
                id="threshold"
                type="number"
                min="0"
                max="100"
                step="1"
                value={priceThreshold}
                onChange={(e) => setPriceThreshold(e.target.value)}
                placeholder="e.g. 15"
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Search list sidebar */}
        <div className="lg:col-span-4 space-y-2">
          {isLoading && searches.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">Loading searches...</div>
          ) : searches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-muted text-sm">No saved searches yet.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-2 text-sm text-accent hover:text-accent-hover"
              >
                Create your first search
              </button>
            </div>
          ) : (
            searches.map(search => (
              <div
                key={search.id}
                className={`bg-bg-card border rounded-lg p-3 cursor-pointer transition-colors ${
                  activeSearch?.id === search.id
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-border-bright'
                }`}
                onClick={() => handleSelectSearch(search)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSelectSearch(search); }}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">
                      {search.cardName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {search.set && <span className="text-xs text-text-muted truncate">{search.set}</span>}
                      <span className="text-xs text-accent">{FREQUENCY_LABELS[search.searchFrequency]}</span>
                    </div>
                  </div>
                  <span className="text-xs text-text-muted shrink-0">{search.totalListings || 0}</span>
                </div>

                {/* Last job info */}
                {search.lastJobAt && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      search.lastJobStatus === 'completed' ? 'bg-deal-green'
                        : search.lastJobStatus === 'failed' ? 'bg-error'
                          : 'bg-text-muted'
                    }`} />
                    <span className="text-[10px] text-text-muted">
                      {new Date(search.lastJobAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRun(search.id); }}
                    disabled={isRunning}
                    className="text-xs px-2 py-1 rounded bg-bg-tertiary text-text-secondary hover:text-accent transition-colors"
                  >
                    {isRunning && activeSearch?.id === search.id ? 'Running...' : 'Search Now'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(search.id); }}
                    className="text-xs px-2 py-1 rounded bg-bg-tertiary text-text-secondary hover:text-error transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Listings panel */}
        <div className="lg:col-span-8">
          {activeSearch ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{activeSearch.cardName}</h3>
                  <span className="text-xs text-text-muted">
                    {listings.length} listings · {FREQUENCY_LABELS[activeSearch.searchFrequency]}
                    {activeSearch.lastExecutedAt && ` · Last run: ${new Date(activeSearch.lastExecutedAt).toLocaleString()}`}
                  </span>
                </div>
                <button
                  onClick={() => handleRun(activeSearch.id)}
                  disabled={isRunning}
                  className="px-3 py-1.5 rounded-lg bg-accent/15 text-accent text-sm font-medium hover:bg-accent/25 disabled:opacity-50 transition-colors"
                >
                  {isRunning ? 'Searching...' : 'Run Now'}
                </button>
              </div>
              <div className="space-y-2">
                {listings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    recentSoldListings={recentSoldListings}
                  />
                ))}
                {listings.length === 0 && !isLoading && (
                  <div className="text-center py-12 text-text-muted text-sm">
                    No listings found. Try running the search.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-text-muted text-sm">
              Select a search from the list to view results.
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 animate-[fadeIn_150ms_ease-out]" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-bg-secondary border border-border rounded-xl p-6 max-w-sm w-full mx-4 animate-[scaleIn_200ms_ease-out]">
            <h3 className="text-lg font-bold text-text-primary mb-2">Delete this saved search?</h3>
            <p className="text-sm text-text-secondary mb-4">
              This will remove the search and all associated listings. Saved deals will be kept.
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
