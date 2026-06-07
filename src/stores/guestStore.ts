import { create } from 'zustand';

export type AuthState = 'loading' | 'authorized' | 'guest_required' | 'forbidden' | 'not_found';

export interface GuestInfo {
  token: string;
  displayName: string;
  meetingId: string;
  role: 'guest';
}

interface GuestState {
  authState: AuthState;
  guestInfo: GuestInfo | null;
  isLoggedIn: boolean;

  setAuthState: (state: AuthState) => void;
  setGuestInfo: (info: GuestInfo) => void;
  login: () => void;
  logout: () => void;
  clearGuest: () => void;
}

/** 从 localStorage 恢复访客 token */
function loadGuestToken(): GuestInfo | null {
  try {
    const raw = localStorage.getItem('guest_token');
    if (raw) return JSON.parse(raw) as GuestInfo;
  } catch {
    /* ignore */
  }
  return null;
}

export const useGuestStore = create<GuestState>()((set) => ({
  authState: 'loading',
  guestInfo: loadGuestToken(),
  isLoggedIn: false, // 纯前端模拟：默认未登录

  setAuthState: (authState) => set({ authState }),

  setGuestInfo: (info) => {
    localStorage.setItem('guest_token', JSON.stringify(info));
    set({ guestInfo: info });
  },

  login: () => set({ isLoggedIn: true }),

  logout: () => {
    localStorage.removeItem('guest_token');
    set({ isLoggedIn: false, guestInfo: null });
  },

  clearGuest: () => {
    localStorage.removeItem('guest_token');
    set({ guestInfo: null });
  },
}));
