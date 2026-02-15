import { create } from 'zustand';
import { api } from '../utils/api';

const useSellerStore = create((set) => ({
  sellers: [],
  total: 0,
  selectedSeller: null,
  sellerListings: [],
  isLoading: false,
  error: null,

  fetchSellers: async (sort = 'deals', minDeals = 1) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get(`/api/sellers?sort=${sort}&minDeals=${minDeals}`);
      set({
        sellers: data.sellers || [],
        total: data.total || 0,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  fetchSellerDetail: async (sellerName) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get(`/api/sellers/${encodeURIComponent(sellerName)}`);
      set({
        selectedSeller: data.profile || null,
        sellerListings: data.activeListings || [],
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  clearSelectedSeller: () => {
    set({ selectedSeller: null, sellerListings: [] });
  }
}));

export default useSellerStore;
