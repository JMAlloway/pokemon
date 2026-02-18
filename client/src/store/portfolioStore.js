import { create } from 'zustand';
import { api } from '../utils/api';

const usePortfolioStore = create((set) => ({
  portfolio: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchPortfolio: async (sort = 'purchasedAt', order = 'desc') => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get(`/api/portfolio?sort=${sort}&order=${order}`);
      set({ portfolio: data.portfolio || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  fetchStats: async () => {
    try {
      const data = await api.get('/api/portfolio/stats');
      set({ stats: data });
    } catch {
      // Non-critical
    }
  },

  updatePortfolioItem: async (id, data) => {
    try {
      await api.put(`/api/portfolio/${id}`, data);
      // Refresh both portfolio and stats
      const [portfolioData, statsData] = await Promise.all([
        api.get('/api/portfolio'),
        api.get('/api/portfolio/stats')
      ]);
      set({ portfolio: portfolioData.portfolio || [], stats: statsData });
    } catch (error) {
      throw error;
    }
  },

  markAsPurchased: async (dealId, purchasePrice) => {
    try {
      await api.put(`/api/portfolio/${dealId}`, {
        purchasePrice,
        purchasedAt: new Date().toISOString()
      });
      const [portfolioData, statsData] = await Promise.all([
        api.get('/api/portfolio'),
        api.get('/api/portfolio/stats')
      ]);
      set({ portfolio: portfolioData.portfolio || [], stats: statsData });
    } catch (error) {
      throw error;
    }
  }
}));

export default usePortfolioStore;
