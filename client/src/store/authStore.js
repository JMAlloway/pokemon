import { create } from 'zustand';
import { api } from '../utils/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await api.get('/api/auth/me');
      set({ user, isLoading: false, error: null });
    } catch {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const tokens = await api.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          const user = await api.get('/api/auth/me');
          set({ user, isLoading: false, error: null });
        } else {
          get().logout();
        }
      } catch {
        get().logout();
      }
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const data = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({ user: data.user, error: null });
      return data.user;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  register: async (username, email, password) => {
    set({ error: null });
    try {
      const data = await api.post('/api/auth/register', { username, email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({ user: data.user, error: null });
      return data.user;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isLoading: false, error: null });
  }
}));

export default useAuthStore;
