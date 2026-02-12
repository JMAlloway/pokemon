import { create } from 'zustand';
import { api } from '../utils/api';

const useSavedDealsStore = create((set) => ({
  deals: [],
  notifications: [],
  isLoading: false,
  error: null,

  fetchDeals: async (sort = 'savedAt', order = 'desc', status = 'active') => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get(`/api/saved-deals?sort=${sort}&order=${order}&status=${status}`);
      set({ deals: data.deals || [], notifications: data.notifications || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  saveDeal: async (ebayListingId) => {
    try {
      const data = await api.post('/api/saved-deals', { ebayListingId });
      return data;
    } catch (error) {
      throw error;
    }
  },

  removeDeal: async (id) => {
    try {
      await api.delete(`/api/saved-deals/${id}`);
      set(state => ({ deals: state.deals.filter(d => d.id !== id) }));
    } catch (error) {
      throw error;
    }
  }
}));

export default useSavedDealsStore;
