import { create } from 'zustand';
import { api } from '../utils/api';

const useSearchStore = create((set, get) => ({
  listings: [],
  recentSoldListings: [],
  searchQuery: null,
  baseline: null,
  recencyScore: null,
  sampleSize: null,
  isSearching: false,
  error: null,
  cached: false,
  cacheTimestamp: null,
  suggestions: [],

  search: async ({ cardName, set: cardSet, rarity, condition, graded, language }) => {
    set({ isSearching: true, error: null, cached: false });
    try {
      const data = await api.post('/api/search', { cardName, set: cardSet, rarity, condition, graded, language });
      set({
        listings: data.listings || [],
        recentSoldListings: data.recentSoldListings || [],
        baseline: data.baseline,
        recencyScore: data.recencyScore,
        sampleSize: data.sampleSize,
        searchQuery: { id: data.searchQueryId, cardName, set: cardSet },
        cached: data.cached || false,
        cacheTimestamp: data.cacheTimestamp,
        isSearching: false,
        error: data.error || null
      });
      return data;
    } catch (error) {
      set({
        isSearching: false,
        error: error.message,
        listings: error.data?.listings || get().listings
      });
      throw error;
    }
  },

  getAutocomplete: async (query) => {
    if (!query || query.length < 2) {
      set({ suggestions: [] });
      return;
    }
    try {
      const data = await api.get(`/api/search/autocomplete?q=${encodeURIComponent(query)}`);
      set({ suggestions: data.suggestions || [] });
    } catch {
      set({ suggestions: [] });
    }
  },

  clearResults: () => {
    set({ listings: [], error: null, cached: false, searchQuery: null, recentSoldListings: [] });
  }
}));

export default useSearchStore;
