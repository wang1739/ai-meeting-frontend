import { create } from 'zustand';
import type { Meeting } from '@/data/mockData';
import { mockMeetings } from '@/data/mockData';

interface MeetingFilters {
  search: string;
  status: string;
  dateRange: string;
}

interface MeetingState {
  meetings: Meeting[];
  activeMeetingId: string | null;
  filters: MeetingFilters;
  viewMode: 'list' | 'card';
  selectedIds: string[];

  setFilters: (filters: Partial<MeetingFilters>) => void;
  setViewMode: (mode: 'list' | 'card') => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  getFilteredMeetings: () => Meeting[];
  getActiveMeeting: () => Meeting | null;
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
}

export const useMeetingStore = create<MeetingState>()((set, get) => ({
  meetings: mockMeetings,
  activeMeetingId: null,
  filters: { search: '', status: '', dateRange: '' },
  viewMode: 'list',
  selectedIds: [],

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setViewMode: (mode) => set({ viewMode: mode }),

  toggleSelect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id],
    })),

  selectAll: () =>
    set((state) => ({
      selectedIds: state.meetings.map((m) => m.id),
    })),

  clearSelection: () => set({ selectedIds: [] }),

  getFilteredMeetings: () => {
    const { meetings, filters } = get();
    let filtered = meetings;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.summary?.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((m) => m.status === filters.status);
    }

    if (filters.dateRange) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter((m) => {
            const d = new Date(m.startTime);
            return d >= startOfDay && d < new Date(startOfDay.getTime() + 86400000);
          });
          break;
        case 'week':
          const weekStart = new Date(startOfDay.getTime() - startOfDay.getDay() * 86400000);
          const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
          filtered = filtered.filter((m) => {
            const d = new Date(m.startTime);
            return d >= weekStart && d < weekEnd;
          });
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          filtered = filtered.filter((m) => {
            const d = new Date(m.startTime);
            return d >= monthStart && d < monthEnd;
          });
          break;
      }
    }

    return filtered;
  },

  getActiveMeeting: () => {
    const { meetings, activeMeetingId } = get();
    if (!activeMeetingId) return null;
    return meetings.find((m) => m.id === activeMeetingId) ?? null;
  },

  addMeeting: (meeting) =>
    set((state) => ({ meetings: [meeting, ...state.meetings] })),

  updateMeeting: (id, updates) =>
    set((state) => ({
      meetings: state.meetings.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
}));