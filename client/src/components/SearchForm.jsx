import { useState, useEffect, useRef, useMemo } from 'react';
import useSearchStore from '../store/searchStore';
import { api } from '../utils/api';

const RARITY_OPTIONS = [
  { value: '', label: 'Any Rarity' },
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'ultraRare', label: 'Ultra Rare' },
  { value: 'illustrationRare', label: 'Illustration Rare' },
  { value: 'specialIllustrationRare', label: 'Special Illustration Rare' },
  { value: 'megaIllustrationRare', label: 'Mega Illustration Rare' },
  { value: 'holoRare', label: 'Holo Rare' },
  { value: 'other', label: 'Other' }
];

const CONDITION_OPTIONS = [
  { value: '', label: 'Any Condition' },
  { value: 'mint', label: 'Mint' },
  { value: 'nearMint', label: 'Near Mint' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
];

const GRADED_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'no', label: 'Ungraded Only' },
  { value: 'yes', label: 'Graded Only' }
];

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Any Language' },
  { value: 'English', label: 'English' },
  { value: 'Japanese', label: 'Japanese' }
];

const RARITY_DISPLAY_ORDER = [
  'common', 'uncommon', 'rare', 'ultraRare',
  'illustrationRare', 'specialIllustrationRare', 'megaIllustrationRare'
];

const RARITY_LABELS = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  ultraRare: 'Ultra Rare',
  illustrationRare: 'Illustration Rare',
  specialIllustrationRare: 'Special Illustration Rare',
  megaIllustrationRare: 'Mega Illustration Rare',
};

export default function SearchForm({ onSearch, isSearching, initialValues = {} }) {
  const [cardName, setCardName] = useState(initialValues.cardName || '');
  const [set, setSet] = useState(initialValues.set || '');
  const [rarity, setRarity] = useState(initialValues.rarity || '');
  const [condition, setCondition] = useState(initialValues.condition || '');
  const [graded, setGraded] = useState(initialValues.graded || '');
  const [language, setLanguage] = useState(initialValues.language || '');
  const [manualMode, setManualMode] = useState(false);

  // Catalog state
  const [catalog, setCatalog] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [setQuery, setSetQuery] = useState('');
  const [cardQuery, setCardQuery] = useState('');
  const [showSetDropdown, setShowSetDropdown] = useState(false);
  const [showCardDropdown, setShowCardDropdown] = useState(false);

  // Manual mode autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, getAutocomplete } = useSearchStore();

  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const setDropdownRef = useRef(null);
  const setInputRef = useRef(null);
  const cardDropdownRef = useRef(null);
  const cardInputRef = useRef(null);

  // Fetch catalog on mount
  useEffect(() => {
    api.get('/api/search/catalog')
      .then(data => setCatalog(data))
      .catch(() => {
        // Fall back to manual mode if catalog unavailable
        setManualMode(true);
      });
  }, []);

  // Autocomplete for manual mode
  useEffect(() => {
    if (!manualMode) return;
    const timer = setTimeout(() => {
      if (cardName.length >= 2) {
        getAutocomplete(cardName);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [cardName, getAutocomplete, manualMode]);

  // Click-outside handlers
  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (setDropdownRef.current && !setDropdownRef.current.contains(e.target) && setInputRef.current && !setInputRef.current.contains(e.target)) {
        setShowSetDropdown(false);
      }
      if (cardDropdownRef.current && !cardDropdownRef.current.contains(e.target) && cardInputRef.current && !cardInputRef.current.contains(e.target)) {
        setShowCardDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter sets based on query
  const filteredSets = useMemo(() => {
    if (!catalog?.sets) return [];
    if (!setQuery.trim()) return catalog.sets;
    const q = setQuery.toLowerCase();
    return catalog.sets.filter(s =>
      s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q))
    );
  }, [catalog, setQuery]);

  // Cards for the selected set, grouped by rarity
  const groupedCards = useMemo(() => {
    if (!selectedSet) return {};
    let cards = selectedSet.cards;
    if (cardQuery.trim()) {
      const q = cardQuery.toLowerCase();
      cards = cards.filter(c => c.name.toLowerCase().includes(q));
    }
    const groups = {};
    for (const card of cards) {
      if (!groups[card.rarity]) groups[card.rarity] = [];
      groups[card.rarity].push(card);
    }
    return groups;
  }, [selectedSet, cardQuery]);

  // Sorted rarity keys for display
  const sortedRarityKeys = useMemo(() => {
    return RARITY_DISPLAY_ORDER.filter(r => groupedCards[r]?.length > 0);
  }, [groupedCards]);

  const totalFilteredCards = useMemo(() => {
    return sortedRarityKeys.reduce((sum, r) => sum + groupedCards[r].length, 0);
  }, [sortedRarityKeys, groupedCards]);

  const handleSelectSet = (setObj) => {
    setSelectedSet(setObj);
    setSet(setObj.name);
    setSetQuery(setObj.name);
    setShowSetDropdown(false);
    // Reset card selection
    setCardName('');
    setCardQuery('');
    setRarity('');
  };

  const handleSelectCard = (card) => {
    setCardName(card.name);
    setCardQuery(`${card.name} #${card.number}`);
    setRarity(card.rarity);
    setShowCardDropdown(false);
  };

  const handleClearSet = () => {
    setSelectedSet(null);
    setSet('');
    setSetQuery('');
    setCardName('');
    setCardQuery('');
    setRarity('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cardName.trim() || isSearching) return;
    setShowSuggestions(false);
    setShowSetDropdown(false);
    setShowCardDropdown(false);
    onSearch({
      cardName: cardName.trim(),
      set: set.trim() || undefined,
      rarity: rarity || undefined,
      condition: condition || undefined,
      graded: graded || undefined,
      language: language || undefined
    });
  };

  const selectSuggestion = (name) => {
    setCardName(name);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const inputClasses = "w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => { setManualMode(false); handleClearSet(); }}
          className={`px-2 py-1 rounded transition-colors ${!manualMode ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}
        >
          Browse Catalog
        </button>
        <button
          type="button"
          onClick={() => { setManualMode(true); setCardName(''); setSet(''); setRarity(''); }}
          className={`px-2 py-1 rounded transition-colors ${manualMode ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}
        >
          Manual Search
        </button>
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        {!manualMode ? (
          <>
            {/* Set picker */}
            <div className="relative w-56">
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Set *
              </label>
              <div className="relative">
                <input
                  ref={setInputRef}
                  type="text"
                  value={setQuery}
                  onChange={(e) => {
                    setSetQuery(e.target.value);
                    setShowSetDropdown(true);
                    if (selectedSet && e.target.value !== selectedSet.name) {
                      setSelectedSet(null);
                      setSet('');
                      setCardName('');
                      setCardQuery('');
                      setRarity('');
                    }
                  }}
                  onFocus={() => setShowSetDropdown(true)}
                  placeholder="Search sets..."
                  className={inputClasses}
                  autoComplete="off"
                />
                {selectedSet && (
                  <button
                    type="button"
                    onClick={handleClearSet}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs"
                    title="Clear"
                  >
                    x
                  </button>
                )}
              </div>
              {showSetDropdown && filteredSets.length > 0 && (
                <div
                  ref={setDropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto"
                >
                  {filteredSets.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectSet(s)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-tertiary transition-colors ${
                        selectedSet?.name === s.name ? 'bg-bg-tertiary text-accent' : 'text-text-primary'
                      }`}
                    >
                      <span>{s.name}</span>
                      <span className="text-text-muted text-xs ml-2">{s.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Card picker (grouped by rarity) */}
            <div className="relative flex-1 min-w-[240px]">
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Card *
              </label>
              <input
                ref={cardInputRef}
                type="text"
                value={cardQuery}
                onChange={(e) => {
                  setCardQuery(e.target.value);
                  setShowCardDropdown(true);
                  // Clear card selection if user edits
                  if (cardName) {
                    setCardName('');
                    setRarity('');
                  }
                }}
                onFocus={() => setShowCardDropdown(true)}
                placeholder={selectedSet ? `Search ${selectedSet.name} cards...` : 'Select a set first'}
                className={inputClasses}
                disabled={!selectedSet}
                autoComplete="off"
              />
              {showCardDropdown && selectedSet && sortedRarityKeys.length > 0 && (
                <div
                  ref={cardDropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl z-20 max-h-72 overflow-y-auto"
                >
                  <div className="px-3 py-1.5 text-xs text-text-muted border-b border-border">
                    {totalFilteredCards} card{totalFilteredCards !== 1 ? 's' : ''}
                  </div>
                  {sortedRarityKeys.map(rarityKey => (
                    <div key={rarityKey}>
                      <div className="px-3 py-1.5 text-xs font-semibold text-accent bg-bg-tertiary/50 sticky top-0">
                        {RARITY_LABELS[rarityKey] || rarityKey}
                      </div>
                      {groupedCards[rarityKey].map((card, i) => (
                        <button
                          key={`${rarityKey}-${i}`}
                          type="button"
                          onClick={() => handleSelectCard(card)}
                          className="w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-bg-tertiary transition-colors flex justify-between items-center"
                        >
                          <span>{card.name}</span>
                          <span className="text-text-muted text-xs">#{card.number}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {showCardDropdown && selectedSet && sortedRarityKeys.length === 0 && cardQuery && (
                <div
                  ref={cardDropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl z-20 px-3 py-2 text-sm text-text-muted"
                >
                  No cards match "{cardQuery}"
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Manual card name with autocomplete */}
            <div className="relative flex-1 min-w-[200px]">
              <label htmlFor="cardName" className="block text-xs font-medium text-text-secondary mb-1">
                Card Name *
              </label>
              <input
                ref={inputRef}
                id="cardName"
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="e.g. Charizard"
                className={inputClasses}
                required
                maxLength={255}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto"
                  role="listbox"
                >
                  {suggestions.map((name, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectSuggestion(name)}
                      className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary transition-colors"
                      role="option"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Manual set */}
            <div className="w-48">
              <label htmlFor="set" className="block text-xs font-medium text-text-secondary mb-1">
                Set
              </label>
              <input
                id="set"
                type="text"
                value={set}
                onChange={(e) => setSet(e.target.value)}
                placeholder="e.g. Base Set"
                className={inputClasses}
                maxLength={100}
              />
            </div>
          </>
        )}

        {/* Rarity */}
        <div className="w-44">
          <label htmlFor="rarity" className="block text-xs font-medium text-text-secondary mb-1">
            Rarity
          </label>
          <select
            id="rarity"
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
            className={inputClasses}
          >
            {RARITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div className="w-36">
          <label htmlFor="condition" className="block text-xs font-medium text-text-secondary mb-1">
            Condition
          </label>
          <select
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className={inputClasses}
          >
            {CONDITION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Graded */}
        <div className="w-36">
          <label htmlFor="graded" className="block text-xs font-medium text-text-secondary mb-1">
            Graded
          </label>
          <select
            id="graded"
            value={graded}
            onChange={(e) => setGraded(e.target.value)}
            className={inputClasses}
          >
            {GRADED_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div className="w-36">
          <label htmlFor="language" className="block text-xs font-medium text-text-secondary mb-1">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={inputClasses}
          >
            {LANGUAGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Search button */}
        <button
          type="submit"
          disabled={isSearching || !cardName.trim()}
          className="px-6 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSearching && (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Selection summary */}
      {!manualMode && cardName && (
        <div className="text-xs text-text-secondary">
          Searching: <span className="text-text-primary font-medium">{cardName}</span>
          {set && <> in <span className="text-text-primary font-medium">{set}</span></>}
          {rarity && RARITY_LABELS[rarity] && <> ({RARITY_LABELS[rarity]})</>}
        </div>
      )}
    </form>
  );
}
