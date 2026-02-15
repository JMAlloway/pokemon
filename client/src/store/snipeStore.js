import { create } from 'zustand';
import { api } from '../utils/api';

const useSnipeStore = create((set) => ({
  urgent: [],
  soon: [],
  upcoming: [],
  total: 0,
  isLoading: false,
  error: null,
  filters: {
    maxHours: 6,
    maxBids: 5,
    minGap: 0
  },

  fetchWatchlist: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.maxHours) params.set('maxHours', filters.maxHours);
      if (filters.maxBids !== undefined) params.set('maxBids', filters.maxBids);
      if (filters.minGap) params.set('minGap', filters.minGap);

      const data = await api.get(`/api/snipe-watchlist?${params.toString()}`);
      set({
        urgent: data.urgent || [],
        soon: data.soon || [],
        upcoming: data.upcoming || [],
        total: data.total || 0,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  setFilters: (newFilters) => {
    set(state => ({ filters: { ...state.filters, ...newFilters } }));
  }
}));

export default useSnipeStore;
