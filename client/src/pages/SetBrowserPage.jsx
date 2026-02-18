import { useEffect, useState, useRef } from 'react';
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
  const highestCard = [...cardsWithPrice].sort((a, b) => b.marketPrice - a.marketPrice)[0];
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

function CardTile({ card, onSearch, layout }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasImage = card.imageLarge || card.imageSmall;
  const priceDiff = card.marketPrice && card.bestEbayPrice
    ? ((card.bestEbayPrice - card.marketPrice) / card.marketPrice * 100)
    : null;

  const isBinder = layout === 'binder';

  if (isBinder) {
    return (
      <div
        className="group cursor-pointer"
        onClick={() => onSearch(card)}
        title={`${card.name} #${card.number}${card.marketPrice ? ` — $${card.marketPrice.toFixed(2)}` : ''}`}
      >
        <div className="relative aspect-[5/7] bg-bg-tertiary rounded overflow-hidden">
          {hasImage ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
                </div>
              )}
              <img
                src={card.imageLarge || card.imageSmall}
                alt={`${card.name} #${card.number}`}
                className={`w-full h-full object-contain transition-all duration-200 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-text-muted">
              <span className="text-[9px] text-center px-1">{card.name}</span>
            </div>
          )}

          {/* Price overlay on hover */}
          {card.marketPrice && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] font-bold text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              ${card.marketPrice.toFixed(2)}
            </div>
          )}

          {/* Deal indicator */}
          {priceDiff !== null && priceDiff < -10 && (
            <span className="absolute top-0.5 right-0.5 text-[8px] font-bold px-1 py-0.5 rounded bg-deal-green/90 text-white">
              {priceDiff.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    );
  }

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

function LayoutToggle({ layout, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-0.5">
      <button
        onClick={() => onChange('grid')}
        className={`p-1.5 rounded transition-colors ${layout === 'grid' ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text-primary'}`}
        title="Card grid"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      </button>
      <button
        onClick={() => onChange('binder')}
        className={`p-1.5 rounded transition-colors ${layout === 'binder' ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text-primary'}`}
        title="Binder layout (3x3)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5M3.75 4.5v15h16.5v-15M7.5 8.25h.008v.008H7.5V8.25zm0 4h.008v.008H7.5v-.008zm0 4h.008v.008H7.5v-.008zm4.5-8h.008v.008H12V8.25zm0 4h.008v.008H12v-.008zm0 4h.008v.008H12v-.008zm4.5-8h.008v.008h-.008V8.25zm0 4h.008v.008h-.008v-.008zm0 4h.008v.008h-.008v-.008z" />
        </svg>
      </button>
    </div>
  );
}

function GridColsSelector({ gridCols, onChange }) {
  const options = [
    { value: 0, label: 'Auto' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
    { value: 6, label: '6' },
    { value: 8, label: '8' },
  ];

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-text-muted mr-1">Cols</span>
      <div className="flex items-center gap-0.5 bg-bg-tertiary rounded-lg p-0.5">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`text-[11px] font-medium px-2 py-1 rounded transition-colors ${
              gridCols === opt.value
                ? 'bg-accent/15 text-accent'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function BinderSlot({ card, onSearch }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!card) {
    return (
      <div className="aspect-[5/7] rounded-sm bg-black/20 border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
      </div>
    );
  }

  const hasImage = card.imageLarge || card.imageSmall;

  return (
    <div
      className="group aspect-[5/7] rounded-sm relative overflow-hidden cursor-pointer"
      onClick={() => onSearch(card)}
      title={`${card.name} #${card.number}${card.marketPrice ? ` — $${card.marketPrice.toFixed(2)}` : ''}`}
    >
      {/* Sleeve background */}
      <div className="absolute inset-0 bg-black/30 border border-white/[0.08] rounded-sm" />

      {/* Card image */}
      {hasImage ? (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          )}
          <img
            src={card.imageLarge || card.imageSmall}
            alt={card.name}
            className={`absolute inset-[2px] w-[calc(100%-4px)] h-[calc(100%-4px)] object-contain transition-all duration-200 group-hover:scale-[1.03] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8px] text-white/30 text-center px-1">{card.name}</span>
        </div>
      )}

      {/* Sleeve glare effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tl from-white/[0.03] via-transparent to-transparent pointer-events-none" />

      {/* Hover price tooltip */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center">
        <div className="translate-y-full group-hover:translate-y-0 transition-transform duration-200 pb-2 text-center">
          {card.marketPrice && (
            <span className="text-xs font-bold text-white drop-shadow-lg">${card.marketPrice.toFixed(2)}</span>
          )}
          <p className="text-[10px] text-white/70 truncate max-w-full px-1">{card.name}</p>
        </div>
      </div>
    </div>
  );
}

function BinderPageSingle({ cards, pageNum, side, onSearch }) {
  const slots = [...cards];
  while (slots.length < 9) slots.push(null);

  return (
    <div className={`relative flex-1 ${side === 'left' ? 'rounded-l-lg' : 'rounded-r-lg'}`}>
      {/* Page surface */}
      <div
        className={`
          h-full p-4 sm:p-5 md:p-6
          ${side === 'left'
            ? 'bg-gradient-to-r from-zinc-800/90 via-zinc-800/80 to-zinc-800/70 rounded-l-lg border-l border-t border-b border-white/[0.06]'
            : 'bg-gradient-to-l from-zinc-800/90 via-zinc-800/80 to-zinc-800/70 rounded-r-lg border-r border-t border-b border-white/[0.06]'
          }
        `}
      >
        {/* Page number */}
        <div className={`text-[10px] text-white/20 mb-2 ${side === 'left' ? 'text-left' : 'text-right'}`}>
          {pageNum}
        </div>

        {/* 3x3 card grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {slots.map((card, i) => (
            <BinderSlot key={card ? `${card.number}-${i}` : `empty-${i}`} card={card} onSearch={onSearch} />
          ))}
        </div>
      </div>

      {/* Inner shadow for page depth */}
      {side === 'left' && (
        <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
      )}
      {side === 'right' && (
        <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

function BinderSpread({ leftCards, rightCards, spreadIndex, totalSpreads, onSearch, onNavigate }) {
  const leftPageNum = spreadIndex * 2 + 1;
  const rightPageNum = spreadIndex * 2 + 2;

  return (
    <div>
      {/* Binder navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onNavigate(spreadIndex - 1)}
          disabled={spreadIndex === 0}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Prev
        </button>

        <span className="text-[10px] text-text-muted">
          Pages {leftPageNum}–{rightPageNum} of {totalSpreads * 2}
        </span>

        <button
          onClick={() => onNavigate(spreadIndex + 1)}
          disabled={spreadIndex >= totalSpreads - 1}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Open binder */}
      <div className="relative max-w-6xl mx-auto">
        {/* Binder cover shadow */}
        <div className="absolute -inset-2 bg-gradient-to-b from-black/30 via-black/10 to-black/30 rounded-xl blur-sm -z-10" />

        {/* Two-page spread */}
        <div className="flex">
          {/* Left page */}
          <BinderPageSingle
            cards={leftCards}
            pageNum={leftPageNum}
            side="left"
            onSearch={onSearch}
          />

          {/* Spine / binding */}
          <div className="relative w-6 sm:w-8 md:w-10 bg-zinc-900 flex flex-col items-center justify-evenly py-6 shrink-0 z-10">
            {/* Ring holes */}
            {[0, 1, 2].map(i => (
              <div key={i} className="relative">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-zinc-600 bg-zinc-800" />
                <div className="absolute inset-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-zinc-500/30 to-transparent" />
              </div>
            ))}

            {/* Spine shadow */}
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-r from-black/40 to-transparent" />
            <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-l from-black/40 to-transparent" />
          </div>

          {/* Right page */}
          <BinderPageSingle
            cards={rightCards}
            pageNum={rightPageNum}
            side="right"
            onSearch={onSearch}
          />
        </div>
      </div>

      {/* Page dots */}
      {totalSpreads > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {Array.from({ length: totalSpreads }).map((_, i) => (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === spreadIndex
                  ? 'bg-accent w-4'
                  : 'bg-border hover:bg-text-muted'
              }`}
              title={`Pages ${i * 2 + 1}–${i * 2 + 2}`}
            />
          ))}
        </div>
      )}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [layout, setLayout] = useState('grid'); // grid, binder
  const [binderSpread, setBinderSpread] = useState(0);
  const [gridCols, setGridCols] = useState(0); // 0 = auto (responsive)
  const totalSpreadsRef = useRef(0);

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

  // Reset filters when changing sets
  useEffect(() => {
    setSearchQuery('');
    setRarityFilter(null);
    setSortBy('number');
    setBinderSpread(0);
  }, [setCode]);

  // Keyboard navigation for binder
  useEffect(() => {
    if (layout !== 'binder') return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setBinderSpread(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setBinderSpread(prev => Math.min(prev + 1, Math.max(0, totalSpreadsRef.current - 1)));
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [layout]);

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
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary mb-1">Set Browser</h1>
          <p className="text-sm text-text-secondary">Browse all Pokemon TCG sets and find deals on individual cards.</p>
        </div>
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
                className="group bg-bg-card border border-border rounded-lg p-4 text-left hover:border-border-bright hover:shadow-lg hover:shadow-accent/[0.03] transition-all duration-200"
              >
                <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{s.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                  <span>{s.era}</span>
                  <span>{s.cardCount} cards</span>
                  <svg className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
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

  // Filter cards
  let displayCards = [...setData.cards];

  if (rarityFilter) {
    displayCards = displayCards.filter(c => c.rarity === rarityFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    displayCards = displayCards.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.number.includes(q)
    );
  }

  // Sort cards
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

  // Binder spreads (18 cards per spread = two 3x3 pages)
  const binderSpreads = [];
  if (layout === 'binder') {
    for (let i = 0; i < displayCards.length; i += 18) {
      binderSpreads.push(displayCards.slice(i, i + 18));
    }
    if (binderSpreads.length === 0) binderSpreads.push([]);
    totalSpreadsRef.current = binderSpreads.length;
  }
  const currentSpreadIndex = Math.min(binderSpread, Math.max(0, binderSpreads.length - 1));

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/sets')}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        All Sets
      </button>

      <SetHeader setData={setData} />

      {/* Controls */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Top row: rarity filter */}
        <RarityFilter selected={rarityFilter} onChange={setRarityFilter} rarityCounts={rarityCounts} />

        {/* Bottom row: search, sort, layout */}
        <div className="flex items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Filter by name or number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-bg-tertiary border border-border rounded-lg pl-8 pr-3 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-xs bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-text-primary focus:border-accent outline-none transition-colors"
          >
            <option value="number">Sort by #</option>
            <option value="priceHigh">Price: High → Low</option>
            <option value="priceLow">Price: Low → High</option>
            <option value="name">Name A–Z</option>
          </select>

          <LayoutToggle layout={layout} onChange={setLayout} />
          {layout === 'grid' && (
            <GridColsSelector gridCols={gridCols} onChange={setGridCols} />
          )}
        </div>
      </div>

      {/* Filtered count */}
      {(searchQuery || rarityFilter) && (
        <p className="text-xs text-text-muted mb-3">
          Showing {displayCards.length} of {setData.cards.length} cards
        </p>
      )}

      {/* Card display */}
      {layout === 'binder' ? (
        <BinderSpread
          leftCards={binderSpreads[currentSpreadIndex]?.slice(0, 9) || []}
          rightCards={binderSpreads[currentSpreadIndex]?.slice(9, 18) || []}
          spreadIndex={currentSpreadIndex}
          totalSpreads={binderSpreads.length}
          onSearch={handleSearchCard}
          onNavigate={(i) => setBinderSpread(Math.max(0, Math.min(i, binderSpreads.length - 1)))}
        />
      ) : (
        <div
          className={gridCols === 0
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
            : 'grid gap-3'
          }
          style={gridCols > 0 ? { gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` } : undefined}
        >
          {displayCards.map(card => (
            <CardTile
              key={`${card.number}-${card.rarity}`}
              card={card}
              onSearch={handleSearchCard}
              layout="grid"
            />
          ))}
        </div>
      )}

      {displayCards.length === 0 && (
        <p className="text-center text-text-muted py-10">
          {searchQuery ? `No cards matching "${searchQuery}"` : 'No cards match the selected filter.'}
        </p>
      )}
    </div>
  );
}
