import { create } from 'zustand';
import api from '../api';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  riskThreshold: string;
  cashBalance: number;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface MeResponse {
  user: AuthUser;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error || fallback;
  }
  return fallback;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  loading: false,
  error: '',

  login: async (email, password) => {
    set({ loading: true, error: '' });
    try {
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      localStorage.setItem('auth_token', response.data.token);
      set({ token: response.data.token, user: response.data.user, loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error, 'Login failed') });
      throw error;
    }
  },

  register: async (email, password) => {
    set({ loading: true, error: '' });
    try {
      const response = await api.post<AuthResponse>('/auth/register', { email, password });
      localStorage.setItem('auth_token', response.data.token);
      set({ token: response.data.token, user: response.data.user, loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error, 'Registration failed') });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ token: null, user: null, error: '' });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return;

    set({ loading: true });
    try {
      const response = await api.get<MeResponse>('/auth/me');
      set({ user: response.data.user, loading: false });
    } catch {
      get().logout();
      set({ loading: false });
    }
  },
}));
