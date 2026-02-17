import { create } from 'zustand';
import { api } from '../utils/api';

const useSnipeAlertStore = create((set) => ({
  alerts: [],
  emailConfigured: false,
  isLoading: false,
  error: null,
  history: [],

  fetchAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get('/api/snipe-alerts');
      set({
        alerts: data.alerts || [],
        emailConfigured: data.emailConfigured || false,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  createAlert: async (alertData) => {
    const data = await api.post('/api/snipe-alerts', alertData);
    set(state => ({ alerts: [data, ...state.alerts] }));
    return data;
  },

  updateAlert: async (id, alertData) => {
    const data = await api.put(`/api/snipe-alerts/${id}`, alertData);
    set(state => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, ...data } : a)
    }));
    return data;
  },

  deleteAlert: async (id) => {
    await api.delete(`/api/snipe-alerts/${id}`);
    set(state => ({ alerts: state.alerts.filter(a => a.id !== id) }));
  },

  toggleAlert: async (id, enabled) => {
    const data = await api.put(`/api/snipe-alerts/${id}`, { enabled });
    set(state => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, enabled: data.enabled } : a)
    }));
  },

  testAlert: async (id) => {
    const data = await api.post(`/api/snipe-alerts/${id}/test`);
    return data;
  },

  fetchHistory: async (alertId) => {
    try {
      const data = await api.get(`/api/snipe-alerts/${alertId}/history`);
      set({ history: data.history || [] });
    } catch {
      set({ history: [] });
    }
  }
}));

export default useSnipeAlertStore;
