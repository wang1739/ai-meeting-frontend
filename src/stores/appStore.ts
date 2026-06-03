import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface AppState {
  sidebarCollapsed: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  sidebarCollapsed: false,
  theme: (localStorage.getItem('app-theme') as Theme) || 'system',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme: Theme) => {
    localStorage.setItem('app-theme', theme);
    set({ theme });
  },
}));