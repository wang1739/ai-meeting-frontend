import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = 'http://localhost:3000/api/auth';

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  token: string | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      userInfo: null,
      token: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || '邮箱或密码错误');
          }

          set({
            isLoggedIn: true,
            userInfo: data.user,
            token: data.token,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, name: string, password: string) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            if (res.status === 409) {
              throw new Error('该邮箱已注册');
            }
            throw new Error(data.message || '注册失败');
          }

          set({
            isLoggedIn: true,
            userInfo: data.user,
            token: data.token,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('guest_token');
        set({ isLoggedIn: false, userInfo: null, token: null });
      },

      checkAuth: () => {
        set({ isLoading: true });
        const state = useAuthStore.getState();
        if (state.token && state.userInfo) {
          set({ isLoggedIn: true, isLoading: false });
        } else {
          set({ isLoggedIn: false, userInfo: null, token: null, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        userInfo: state.userInfo,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
