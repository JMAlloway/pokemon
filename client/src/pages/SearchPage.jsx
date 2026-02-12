import { useState } from 'react';
import SearchForm from '../components/SearchForm';
import ListingCard from '../components/ListingCard';
import useSearchStore from '../store/searchStore';

export default function SearchPage() {
  const { listings, isSearching, error, cached, cacheTimestamp, baseline, recencyScore, sampleSize, search, clearResults } = useSearchStore();
  const [sortBy, setSortBy] = useState('dealScore');

  const handleSearch = async (params) => {
    try {
      await search(params);
    } catch {
      // Error already set in store
    }
  };

  const sortedListings = [...listings].sort((a, b) => {
    if (sortBy === 'price') return Number(a.currentPrice) - Number(b.currentPrice);
    if (sortBy === 'priceGap') return (Number(b.priceGapPercent) || 0) - (Number(a.priceGapPercent) || 0);
    if (sortBy === 'typo') return (b.hasTypo ? 1 : 0) - (a.hasTypo ? 1 : 0) || (Number(b.dealScore) || 0) - (Number(a.dealScore) || 0);
    // Default: dealScore (typos first, then by gap)
    return (b.hasTypo ? 1000 : 0) + (Number(b.dealScore) || 0) - ((a.hasTypo ? 1000 : 0) + (Number(a.dealScore) || 0));
  });

  const typoCount = listings.filter(l => l.hasTypo).length;
  const dealsCount = listings.filter(l => Number(l.priceGapPercent) > 10).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-1">Search Pokemon Cards</h2>
        <p className="text-sm text-text-secondary">
          Find underpriced cards with misspelled titles and below-market pricing.
        </p>
      </div>

      <SearchForm onSearch={handleSearch} isSearching={isSearching} />

      {/* Error */}
      {error && (
        <div className="mt-4 bg-error/10 border border-error/20 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-error shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm text-error font-medium">{error}</p>
            {cached && cacheTimestamp && (
              <p className="text-xs text-text-muted mt-1">
                Showing cached results from {new Date(cacheTimestamp).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {listings.length > 0 && (
        <div className="mt-6">
          {/* Stats bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-secondary">
                <span className="font-bold text-text-primary">{listings.length}</span> listings found
              </span>
              {typoCount > 0 && (
                <span className="text-sm text-typo-amber font-medium">
                  {typoCount} with typos
                </span>
              )}
              {dealsCount > 0 && (
                <span className="text-sm text-deal-green font-medium">
                  {dealsCount} deals &gt;10% below market
                </span>
              )}
              {baseline && (
                <span className="text-sm text-text-muted">
                  Market avg: ${Number(baseline).toFixed(2)}
                </span>
              )}
              {sampleSize !== null && sampleSize !== undefined && sampleSize <= 2 && sampleSize > 0 && (
                <span className="text-xs text-warning">
                  Limited data ({sampleSize} sale{sampleSize > 1 ? 's' : ''} in 90 days)
                </span>
              )}
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Sort:</span>
              {[
                { value: 'dealScore', label: 'Deal Score' },
                { value: 'price', label: 'Price' },
                { value: 'priceGap', label: 'Price Gap' },
                { value: 'typo', label: 'Typos' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`text-xs px-2 py-1 rounded ${
                    sortBy === opt.value
                      ? 'bg-accent/15 text-accent font-medium'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listing grid */}
          <div className="space-y-2">
            {sortedListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isSearching && listings.length === 0 && !error && (
        <div className="mt-16 text-center">
          <div className="text-4xl mb-3 opacity-50">&#x1F50D;</div>
          <p className="text-text-secondary">Enter a card name above to start scanning for deals.</p>
          <p className="text-sm text-text-muted mt-1">
            Try popular cards like Charizard, Pikachu, or Lugia.
          </p>
        </div>
      )}
    </div>
  );
}
