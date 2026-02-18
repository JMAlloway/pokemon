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

  refreshProgress: null,   // { index, total, cardName, status }

  refreshWatchlist: async (searchIds) => {
    set({ isRefreshing: true, refreshError: null, refreshProgress: null });

    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('token');
      fetch('/api/snipe-watchlist/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ searchIds })
      }).then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            set({ isRefreshing: false, refreshError: err.error || 'Refresh failed' });
            reject(new Error(err.error || 'Refresh failed'));
          });
        }

        const contentType = response.headers.get('content-type') || '';

        // If server returned JSON (validation error, empty result), handle normally
        if (contentType.includes('application/json')) {
          return response.json().then(data => {
            set({ isRefreshing: false, lastRefreshResult: data, refreshProgress: null });
            resolve(data);
          });
        }

        // SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processStream = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              set({ isRefreshing: false, refreshProgress: null });
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === 'start') {
                  set({ refreshProgress: { index: event.index, total: event.total, cardName: event.cardName, status: 'searching' } });
                } else if (event.type === 'complete') {
                  set({ refreshProgress: { index: event.index, total: event.total, cardName: event.cardName, status: 'done', listingsFound: event.listingsFound } });
                } else if (event.type === 'error') {
                  set({ refreshProgress: { index: event.index, total: event.total, cardName: event.cardName, status: 'error' } });
                } else if (event.type === 'done') {
                  set({ isRefreshing: false, lastRefreshResult: event, refreshProgress: null });
                  resolve(event);
                }
              } catch {
                // skip malformed lines
              }
            }

            processStream();
          }).catch(err => {
            set({ isRefreshing: false, refreshError: err.message, refreshProgress: null });
            reject(err);
          });
        };

        processStream();
      }).catch(err => {
        set({ isRefreshing: false, refreshError: err.message, refreshProgress: null });
        reject(err);
      });
    });
  },

  setFilters: (newFilters) => {
    set(state => ({ filters: { ...state.filters, ...newFilters } }));
  }
}));

export default useSnipeStore;
