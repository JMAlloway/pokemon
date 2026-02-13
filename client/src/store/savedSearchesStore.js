import { create } from 'zustand';
import { api } from '../utils/api';

const useSavedSearchesStore = create((set) => ({
  searches: [],
  activeSearch: null,
  listings: [],
  recentSoldListings: [],
  isLoading: false,
  isRunning: false,
  error: null,

  fetchSearches: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get('/api/saved-searches');
      set({ searches: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  createSearch: async (searchData) => {
    try {
      const data = await api.post('/api/saved-searches', searchData);
      set(state => ({
        searches: [data.search, ...state.searches],
        activeSearch: data.search,
        listings: data.listings || []
      }));
      return data;
    } catch (error) {
      throw error;
    }
  },

  updateSearch: async (id, searchData) => {
    try {
      const data = await api.put(`/api/saved-searches/${id}`, searchData);
      set(state => ({
        searches: state.searches.map(s => s.id === id ? data.search : s),
        activeSearch: data.search,
        listings: data.listings || []
      }));
      return data;
    } catch (error) {
      throw error;
    }
  },

  deleteSearch: async (id) => {
    try {
      await api.delete(`/api/saved-searches/${id}`);
      set(state => ({
        searches: state.searches.filter(s => s.id !== id),
        activeSearch: state.activeSearch?.id === id ? null : state.activeSearch,
        listings: state.activeSearch?.id === id ? [] : state.listings
      }));
    } catch (error) {
      throw error;
    }
  },

  runSearch: async (id) => {
    set({ isRunning: true, error: null });
    try {
      const data = await api.post(`/api/saved-searches/${id}/run`);
      set(state => ({
        listings: data.listings || [],
        activeSearch: state.searches.find(s => s.id === id) || state.activeSearch,
        isRunning: false,
        error: data.error || null
      }));
      return data;
    } catch (error) {
      set({ isRunning: false, error: error.message });
      throw error;
    }
  },

  loadListings: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get(`/api/saved-searches/${id}/listings`);
      set({
        listings: data.listings || [],
        recentSoldListings: data.recentSoldListings || [],
        activeSearch: data.searchQuery,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  }
}));

export default useSavedSearchesStore;
