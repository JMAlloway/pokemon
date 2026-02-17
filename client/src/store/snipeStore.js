import { create } from 'zustand';
import { api } from '../utils/api';

const useSnipeStore = create((set) => ({
  urgent: [],
  soon: [],
  upcoming: [],
  binDeals: [],
  total: 0,
  isLoading: false,
  isRefreshing: false,
  refreshError: null,
  lastRefreshResult: null,
  error: null,
  filters: {
    maxHours: 6,
    maxBids: 5,
    minGap: 0,
    minDealScore: 0,
    buyingOption: 'AUCTION',
    sets: [],
    cardNames: [],
    maxPrice: ''
  },
  filterOptions: { sets: [], cardNames: [] },

  fetchWatchlist: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.maxHours) params.set('maxHours', filters.maxHours);
      if (filters.maxBids !== undefined) params.set('maxBids', filters.maxBids);
      if (filters.minGap) params.set('minGap', filters.minGap);
      if (filters.minDealScore) params.set('minDealScore', filters.minDealScore);
      if (filters.buyingOption) params.set('buyingOption', filters.buyingOption);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.sets?.length > 0) params.set('sets', filters.sets.join(','));
      if (filters.cardNames?.length > 0) params.set('cardNames', filters.cardNames.join(','));

      const data = await api.get(`/api/snipe-watchlist?${params.toString()}`);
      set({
        urgent: data.urgent || [],
        soon: data.soon || [],
        upcoming: data.upcoming || [],
        binDeals: data.binDeals || [],
        total: data.total || 0,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  fetchFilterOptions: async () => {
    try {
      const data = await api.get('/api/snipe-watchlist/filter-options');
      set({ filterOptions: data });
    } catch {
      // Non-critical
    }
  },

  availableSearches: [],

  fetchAvailableSearches: async () => {
    try {
      const data = await api.get('/api/snipe-watchlist/searches');
      set({ availableSearches: data.searches || [] });
    } catch {
      // Non-critical
    }
  },

  refreshWatchlist: async (searchIds) => {
    set({ isRefreshing: true, refreshError: null });
    try {
      const data = await api.post('/api/snipe-watchlist/refresh', { searchIds });
      set({ isRefreshing: false, lastRefreshResult: data });
      return data;
    } catch (error) {
      set({ isRefreshing: false, refreshError: error.message });
      throw error;
    }
  },

  setFilters: (newFilters) => {
    set(state => ({ filters: { ...state.filters, ...newFilters } }));
  }
}));

export default useSnipeStore;
