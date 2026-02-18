import { create } from 'zustand';
import { api } from '../utils/api';

const useMarketStore = create((set) => ({
  alerts: [],
  total: 0,
  cardHistory: null,
  isLoading: false,
  error: null,

  fetchAlerts: async (threshold = 15, days = 7) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get(`/api/market-alerts?threshold=${threshold}&days=${days}`);
      set({
        alerts: data.alerts || [],
        total: data.total || 0,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  fetchCardHistory: async (cardName, days = 30) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get(`/api/market-alerts/${encodeURIComponent(cardName)}?days=${days}`);
      set({
        cardHistory: data,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  clearCardHistory: () => {
    set({ cardHistory: null });
  }
}));

export default useMarketStore;
