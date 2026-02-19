import { create } from 'zustand';
import { api } from '../utils/api';

const useChaseListStore = create((set, get) => ({
  // Available sets with card data
  availableSets: [],
  // All user's chase lists
  chaseLists: [],
  // Currently selected chase list (full detail with cards)
  activeList: null,
  // Set cards for browsing (when selecting cards to chase)
  setCards: [],
  // UI state
  isLoading: false,
  isScanning: false,
  error: null,

  // Fetch available sets that have card catalogs
  fetchSets: async () => {
    try {
      const data = await api.get('/api/chase-lists/sets');
      set({ availableSets: data });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Fetch set card catalog for browsing
  fetchSetCards: async (setCode) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get(`/api/chase-lists/sets/${encodeURIComponent(setCode)}/cards`);
      set({ setCards: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  // Fetch all chase lists
  fetchChaseLists: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get('/api/chase-lists');
      set({ chaseLists: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  // Get a specific chase list with full card details
  fetchChaseList: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get(`/api/chase-lists/${id}`);
      set({ activeList: data, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  // Create a new chase list for a set
  createChaseList: async (setCode, settings = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post('/api/chase-lists', { setCode, ...settings });
      set(state => ({
        chaseLists: [data, ...state.chaseLists],
        activeList: data,
        isLoading: false
      }));
      return data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Update chase list settings
  updateChaseList: async (id, settings) => {
    try {
      const data = await api.put(`/api/chase-lists/${id}`, settings);
      set(state => ({
        chaseLists: state.chaseLists.map(l => l.id === id ? { ...l, ...data } : l),
        activeList: state.activeList?.id === id ? { ...state.activeList, ...data } : state.activeList
      }));
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Delete a chase list
  deleteChaseList: async (id) => {
    try {
      await api.delete(`/api/chase-lists/${id}`);
      set(state => ({
        chaseLists: state.chaseLists.filter(l => l.id !== id),
        activeList: state.activeList?.id === id ? null : state.activeList
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Add cards to chase list
  addCards: async (chaseListId, setCardIds) => {
    try {
      const data = await api.post(`/api/chase-lists/${chaseListId}/cards`, { setCardIds });
      // Refresh the active list to get updated cards
      await get().fetchChaseList(chaseListId);
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Remove cards from chase list
  removeCards: async (chaseListId, setCardIds) => {
    try {
      const data = await api.delete(`/api/chase-lists/${chaseListId}/cards`, { setCardIds });
      // Refresh
      await get().fetchChaseList(chaseListId);
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Update a card's status (needed -> purchased, etc.)
  updateCardStatus: async (chaseListId, cardId, status) => {
    try {
      const data = await api.put(`/api/chase-lists/${chaseListId}/cards/${cardId}/status`, { status });
      // Update local state
      set(state => {
        if (!state.activeList || state.activeList.id !== chaseListId) return state;
        const updatedCards = state.activeList.cards.map(c =>
          c.id === cardId ? { ...c, ...data } : c
        );
        const needed = updatedCards.filter(c => c.status === 'needed').length;
        const dealFound = updatedCards.filter(c => c.status === 'dealFound').length;
        const purchased = updatedCards.filter(c => c.status === 'purchased').length;
        const totalMarketValue = updatedCards.reduce((sum, c) => {
          if (c.status === 'purchased') return sum;
          return sum + (c.setCard?.marketPrice ? Number(c.setCard.marketPrice) : 0);
        }, 0);
        return {
          activeList: {
            ...state.activeList,
            cards: updatedCards,
            stats: { needed, dealFound, purchased, total: updatedCards.length, totalMarketValue }
          }
        };
      });
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Trigger a manual scan
  scanChaseList: async (id) => {
    set({ isScanning: true, error: null });
    try {
      const data = await api.post(`/api/chase-lists/${id}/scan`, null, { timeoutMs: 120000 });
      // Refresh list to show updated deal info
      await get().fetchChaseList(id);
      set({ isScanning: false });
      return data;
    } catch (error) {
      set({ isScanning: false, error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));

export default useChaseListStore;
