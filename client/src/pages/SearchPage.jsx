import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchForm from '../components/SearchForm';
import ListingCard from '../components/ListingCard';
import SearchLoadingAnimation from '../components/SearchLoadingAnimation';
import useSearchStore from '../store/searchStore';

export default function SearchPage() {
  const { listings, recentSoldListings, isSearching, error, cached, cacheTimestamp, baseline, baselineSource, recencyScore, sampleSize, search, clearResults } = useSearchStore();
  const [sortBy, setSortBy] = useState('dealScore');
  const [filterType, setFilterType] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const autoSearched = useRef(false);

  const initialValues = {
    cardName: searchParams.get('cardName') || '',
    set: searchParams.get('set') || '',
    rarity: searchParams.get('rarity') || '',
  };

  useEffect(() => {
    if (initialValues.cardName && !autoSearched.current && !isSearching) {
      autoSearched.current = true;
      search(initialValues).catch(() => {});
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (params) => {
    try {
      await search(params);
    } catch {
      // Error already set in store
    }
  };

  const filteredListings = listings.filter(l => {
    if (filterType === 'bin') return l.buyingOption !== 'AUCTION';
    if (filterType === 'auction') return l.buyingOption === 'AUCTION';
    return true;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'price') return Number(a.currentPrice) - Number(b.currentPrice);
    if (sortBy === 'priceGap') return (Number(b.priceGapPercent) || 0) - (Number(a.priceGapPercent) || 0);
    if (sortBy === 'typo') return (b.hasTypo ? 1 : 0) - (a.hasTypo ? 1 : 0) || (Number(b.dealScore) || 0) - (Number(a.dealScore) || 0);
    if (sortBy === 'endingSoon') {
      const aEnd = a.auctionEndDate ? new Date(a.auctionEndDate).getTime() : Infinity;
      const bEnd = b.auctionEndDate ? new Date(b.auctionEndDate).getTime() : Infinity;
      return aEnd - bEnd;
    }
    return (Number(b.dealScore) || 0) - (Number(a.dealScore) || 0);
  });

  const typoCount = listings.filter(l => l.hasTypo).length;
  const dealsCount = listings.filter(l => Number(l.priceGapPercent) > 10).length;
  const auctionCount = listings.filter(l => l.buyingOption === 'AUCTION').length;
  const binCount = listings.filter(l => l.buyingOption !== 'AUCTION').length;
  const bestOfferCount = listings.filter(l => l.acceptsBestOffer).length;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-1">Search Pokemon Cards</h2>
        <p className="text-sm text-text-secondary">
          Find underpriced cards with misspelled titles and below-market pricing.
        </p>
      </div>

      <SearchForm onSearch={handleSearch} isSearching={isSearching} initialValues={initialValues} />

      {/* Error */}
      {error && (
        <div className="mt-4 bg-error/10 border border-error/20 rounded-lg p-4 flex items-start gap-3 animate-[fadeInUp_200ms_ease-out]">
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

      {/* Loading animation */}
      {isSearching && <SearchLoadingAnimation />}

      {/* Results */}
      {!isSearching && listings.length > 0 && (
        <div className="mt-6 animate-[fadeInUp_300ms_ease-out]">
          {/* Stats bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-text-secondary">
                <span className="font-bold text-text-primary">{filteredListings.length}</span>{filterType !== 'all' ? ` of ${listings.length}` : ''} listings
              </span>
              {/* Type filter chips */}
              <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-0.5">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'bin', label: `BIN (${binCount})` },
                  { value: 'auction', label: `Auction (${auctionCount})` }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterType(opt.value)}
                    className={`text-xs px-2.5 py-1 rounded-md transition-all duration-200 ${
                      filterType === opt.value
                        ? opt.value === 'auction' ? 'bg-purple-500/20 text-purple-400 font-medium' : 'bg-accent/20 text-accent font-medium'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* Stat pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {dealsCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-deal-green/10 text-deal-green font-medium">
                    {dealsCount} deals
                  </span>
                )}
                {typoCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-typo-amber/10 text-typo-amber font-medium">
                    {typoCount} typos
                  </span>
                )}
                {bestOfferCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                    {bestOfferCount} Best Offer
                  </span>
                )}
              </div>
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-0.5 shrink-0 self-start sm:self-auto">
              <span className="text-xs text-text-muted px-1.5">Sort</span>
              {[
                { value: 'dealScore', label: 'Score' },
                { value: 'price', label: 'Price' },
                { value: 'priceGap', label: 'Gap' },
                { value: 'typo', label: 'Typos' },
                { value: 'endingSoon', label: 'Ending' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`text-xs px-2 py-1 rounded-md transition-all duration-200 ${
                    sortBy === opt.value
                      ? 'bg-accent/20 text-accent font-medium'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Baseline info */}
          {(baseline || (sampleSize !== null && sampleSize !== undefined && sampleSize <= 2 && sampleSize > 0)) && (
            <div className="flex items-center gap-3 mb-3 text-xs text-text-muted">
              {baseline && (
                <span>
                  {baselineSource === 'tcgplayer' ? 'TCGPlayer market' : 'Market avg (w/ ship)'}: <span className="text-text-secondary font-medium">${Number(baseline).toFixed(2)}</span>
                </span>
              )}
              {sampleSize !== null && sampleSize !== undefined && sampleSize <= 2 && sampleSize > 0 && (
                <span className="text-warning">
                  Limited data ({sampleSize} sale{sampleSize > 1 ? 's' : ''} in 90 days)
                </span>
              )}
            </div>
          )}

          {/* Listing grid */}
          <div className="space-y-2">
            {sortedListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} recentSoldListings={recentSoldListings} baselineSource={baselineSource} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isSearching && listings.length === 0 && !error && (
        <div className="mt-20 text-center animate-[fadeInUp_400ms_ease-out]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-text-secondary font-medium">Enter a card name above to start scanning for deals.</p>
          <p className="text-sm text-text-muted mt-2">
            Try popular cards like Charizard, Pikachu, or Lugia.
          </p>
        </div>
      )}
    </div>
  );
}
