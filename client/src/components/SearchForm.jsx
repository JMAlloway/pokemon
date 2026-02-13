import { useState, useEffect, useRef } from 'react';
import useSearchStore from '../store/searchStore';

const RARITY_OPTIONS = [
  { value: '', label: 'Any Rarity' },
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
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

export default function SearchForm({ onSearch, isSearching, initialValues = {} }) {
  const [cardName, setCardName] = useState(initialValues.cardName || '');
  const [set, setSet] = useState(initialValues.set || '');
  const [rarity, setRarity] = useState(initialValues.rarity || '');
  const [condition, setCondition] = useState(initialValues.condition || '');
  const [graded, setGraded] = useState(initialValues.graded || '');
  const [language, setLanguage] = useState(initialValues.language || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, getAutocomplete } = useSearchStore();
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (cardName.length >= 2) {
        getAutocomplete(cardName);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [cardName, getAutocomplete]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cardName.trim() || isSearching) return;
    setShowSuggestions(false);
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
      <div className="flex gap-3 items-end flex-wrap">
        {/* Card name with autocomplete */}
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

        {/* Set */}
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

        {/* Rarity */}
        <div className="w-36">
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
    </form>
  );
}
