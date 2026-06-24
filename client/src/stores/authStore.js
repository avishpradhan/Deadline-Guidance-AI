import { create } from 'zustand';
import { authService } from '../services/authService';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('dg_token') || null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  /**
   * Initialize auth state on app load.
   * Checks for existing token and validates it.
   */
  initialize: async () => {
    const token = get().token;
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const { user } = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false, error: null });
    } catch {
      // Token expired or invalid
      localStorage.removeItem('dg_token');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authService.login(email, password);
      localStorage.setItem('dg_token', token);
      set({ token, user, isAuthenticated: true, isLoading: false, error: null });
      return true;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  signup: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authService.signup(name, email, password);
      localStorage.setItem('dg_token', token);
      set({ token, user, isAuthenticated: true, isLoading: false, error: null });
      return true;
    } catch (err) {
      const message = err.response?.data?.error || 'Signup failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('dg_token');
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
