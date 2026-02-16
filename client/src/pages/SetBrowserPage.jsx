import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const RARITY_COLORS = {
  common: 'bg-zinc-500/15 text-zinc-400',
  uncommon: 'bg-emerald-500/15 text-emerald-400',
  rare: 'bg-blue-500/15 text-blue-400',
  ultraRare: 'bg-purple-500/15 text-purple-400',
  illustrationRare: 'bg-pink-500/15 text-pink-400',
  specialIllustrationRare: 'bg-amber-500/15 text-amber-400',
  megaIllustrationRare: 'bg-red-500/15 text-red-400',
};

const RARITY_ORDER = [
  'common', 'uncommon', 'rare', 'ultraRare',
  'illustrationRare', 'specialIllustrationRare', 'megaIllustrationRare',
];

function SetHeader({ setData }) {
  const cardsWithPrice = setData.cards.filter(c => c.marketPrice);
  const totalMarketValue = cardsWithPrice.reduce((sum, c) => sum + c.marketPrice, 0);
  const avgPrice = cardsWithPrice.length > 0 ? totalMarketValue / cardsWithPrice.length : 0;
  const highestCard = cardsWithPrice.sort((a, b) => b.marketPrice - a.marketPrice)[0];
  const totalEbayListings = setData.cards.reduce((sum, c) => sum + c.ebayListingCount, 0);

  return (
    <div className="bg-bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex items-start gap-6">
        {setData.setLogo && (
          <img
            src={setData.setLogo}
            alt={`${setData.name} logo`}
            className="h-16 object-contain"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">{setData.name}</h1>
            {setData.setSymbol && (
              <img src={setData.setSymbol} alt="" className="h-6" />
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
            {setData.series && <span>{setData.series}</span>}
            {setData.releaseDate && <span>Released {setData.releaseDate}</span>}
            <span>{setData.cards.length} cards</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
        <Stat
          label="Set Market Value"
          value={totalMarketValue > 0 ? `$${totalMarketValue.toFixed(2)}` : '—'}
          sub={cardsWithPrice.length > 0 ? `${cardsWithPrice.length} cards priced` : 'No pricing data'}
        />
        <Stat
          label="Avg Card Price"
          value={avgPrice > 0 ? `$${avgPrice.toFixed(2)}` : '—'}
        />
        <Stat
          label="Most Valuable"
          value={highestCard ? `$${highestCard.marketPrice.toFixed(2)}` : '—'}
          sub={highestCard?.name}
        />
        <Stat
          label="Active eBay Listings"
          value={totalEbayListings > 0 ? totalEbayListings.toLocaleString() : '—'}
          sub={totalEbayListings > 0 ? 'across all cards' : 'No listings tracked'}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="bg-bg-tertiary rounded-lg p-3">
      <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-text-primary mt-0.5">{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

function CardTile({ card, onSearch }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasImage = card.imageLarge || card.imageSmall;
  const priceDiff = card.marketPrice && card.bestEbayPrice
    ? ((card.bestEbayPrice - card.marketPrice) / card.marketPrice * 100)
    : null;

  return (
    <div
      className="group bg-bg-card border border-border rounded-lg overflow-hidden hover:border-border-bright transition-all cursor-pointer hover:shadow-lg hover:shadow-accent/5"
      onClick={() => onSearch(card)}
      title={`Search for ${card.name} ${card.number} deals`}
    >
      {/* Card image */}
      <div className="relative aspect-[5/7] bg-bg-tertiary overflow-hidden">
        {hasImage ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
              </div>
            )}
            <img
              src={card.imageLarge || card.imageSmall}
              alt={`${card.name} #${card.number}`}
              className={`w-full h-full object-contain transition-all duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted p-3">
            <svg className="w-10 h-10 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-xs text-center">{card.name}</span>
          </div>
        )}

        {/* Number badge */}
        <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
          #{card.number}
        </span>

        {/* eBay deal indicator */}
        {priceDiff !== null && priceDiff < -10 && (
          <span className="absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-deal-green/90 text-white">
            {priceDiff.toFixed(0)}%
          </span>
        )}
      </div>

      {/* Card info */}
      <div className="p-2.5">
        <h3 className="text-xs font-semibold text-text-primary truncate">{card.name}</h3>

        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${RARITY_COLORS[card.rarity] || 'bg-bg-tertiary text-text-muted'}`}>
            {card.rarityLabel}
          </span>
          {card.types?.length > 0 && (
            <span className="text-[10px] text-text-muted">{card.types.join('/')}</span>
          )}
        </div>

        {/* Pricing row */}
        <div className="mt-2 space-y-0.5">
          {card.marketPrice ? (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-muted">Market</span>
              <span className="text-xs font-bold text-text-primary">${card.marketPrice.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-muted">Market</span>
              <span className="text-[10px] text-text-muted italic">No data</span>
            </div>
          )}

          {card.priceLow && card.priceHigh && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-muted">Range</span>
              <span className="text-[10px] text-text-secondary">
                ${card.priceLow.toFixed(2)} – ${card.priceHigh.toFixed(2)}
              </span>
            </div>
          )}

          {card.bestEbayPrice ? (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-muted">Best eBay</span>
              <span className={`text-xs font-semibold ${priceDiff !== null && priceDiff < -5 ? 'text-deal-green' : 'text-text-secondary'}`}>
                ${card.bestEbayPrice.toFixed(2)}
              </span>
            </div>
          ) : null}
        </div>

        {/* eBay listing count */}
        {card.ebayListingCount > 0 && (
          <div className="mt-1.5 text-[10px] text-text-muted">
            {card.ebayListingCount} active listing{card.ebayListingCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

function RarityFilter({ selected, onChange, rarityCounts }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
          !selected ? 'bg-accent/15 text-accent' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
        }`}
      >
        All ({Object.values(rarityCounts).reduce((a, b) => a + b, 0)})
      </button>
      {RARITY_ORDER.map(rarity => {
        const count = rarityCounts[rarity];
        if (!count) return null;
        return (
          <button
            key={rarity}
            onClick={() => onChange(rarity === selected ? null : rarity)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selected === rarity
                ? RARITY_COLORS[rarity]
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            }`}
          >
            {rarity === 'megaIllustrationRare' ? 'Mega IR' :
             rarity === 'specialIllustrationRare' ? 'Special IR' :
             rarity === 'illustrationRare' ? 'Illust. Rare' :
             rarity === 'ultraRare' ? 'Ultra Rare' :
             rarity.charAt(0).toUpperCase() + rarity.slice(1)} ({count})
          </button>
        );
      })}
    </div>
  );
}

export default function SetBrowserPage() {
  const { setCode } = useParams();
  const navigate = useNavigate();
  const [setData, setSetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rarityFilter, setRarityFilter] = useState(null);
  const [sortBy, setSortBy] = useState('number'); // number, priceHigh, priceLow, name
  const [sets, setSets] = useState([]);

  // If no setCode, fetch set list
  useEffect(() => {
    if (!setCode) {
      setLoading(true);
      api.get('/api/sets')
        .then(data => { setSets(data.sets || []); setLoading(false); })
        .catch(err => { setError(err.message); setLoading(false); });
    }
  }, [setCode]);

  // Fetch set data when setCode changes
  useEffect(() => {
    if (!setCode) return;
    setLoading(true);
    setError(null);
    api.get(`/api/sets/${setCode}`)
      .then(data => { setSetData(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [setCode]);

  const handleSearchCard = (card) => {
    // Navigate to search page with card pre-filled
    const params = new URLSearchParams({
      cardName: `${card.name} ${card.number}/${setData.printedTotal}`,
      set: setData.name,
      rarity: card.rarity,
    });
    navigate(`/?${params.toString()}`);
  };

  // Set list view
  if (!setCode) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Set Browser</h1>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-error/10 border border-error/30 rounded-lg p-4 text-error text-sm">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sets.map(s => (
              <button
                key={s.code}
                onClick={() => navigate(`/sets/${s.code}`)}
                className="bg-bg-card border border-border rounded-lg p-4 text-left hover:border-border-bright transition-colors"
              >
                <h3 className="text-sm font-semibold text-text-primary">{s.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                  <span>{s.era}</span>
                  <span>{s.cardCount} cards</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-2 border-border border-t-accent rounded-full animate-spin" />
        <p className="text-sm text-text-muted">Loading set data and card images...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-error/10 border border-error/30 rounded-lg p-4 text-error text-sm">{error}</div>
      </div>
    );
  }

  if (!setData) return null;

  // Compute rarity counts
  const rarityCounts = {};
  for (const card of setData.cards) {
    rarityCounts[card.rarity] = (rarityCounts[card.rarity] || 0) + 1;
  }

  // Filter and sort cards
  let displayCards = rarityFilter
    ? setData.cards.filter(c => c.rarity === rarityFilter)
    : [...setData.cards];

  displayCards.sort((a, b) => {
    switch (sortBy) {
      case 'priceHigh':
        return (b.marketPrice || 0) - (a.marketPrice || 0);
      case 'priceLow':
        return (a.marketPrice || Infinity) - (b.marketPrice || Infinity);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'number':
      default:
        return parseInt(a.number) - parseInt(b.number);
    }
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <SetHeader setData={setData} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <RarityFilter selected={rarityFilter} onChange={setRarityFilter} rarityCounts={rarityCounts} />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="text-xs bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-text-primary"
        >
          <option value="number">Sort by #</option>
          <option value="priceHigh">Price: High → Low</option>
          <option value="priceLow">Price: Low → High</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {displayCards.map(card => (
          <CardTile
            key={`${card.number}-${card.rarity}`}
            card={card}
            onSearch={handleSearchCard}
          />
        ))}
      </div>

      {displayCards.length === 0 && (
        <p className="text-center text-text-muted py-10">No cards match the selected filter.</p>
      )}
    </div>
  );
}
