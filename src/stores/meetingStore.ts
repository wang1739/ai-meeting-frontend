import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import type { Meeting } from '@/data/mockData';

/* ─── Backend response shape ─── */
interface BackendParticipant {
  id: string;
  role: string;
  isSpeaker: boolean;
  user: { id: string; name: string; email: string };
}

interface BackendMeeting {
  id: string;
  title: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string;
  backgroundInfo: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; name: string; email: string };
  participants: BackendParticipant[];
}

/* ─── Helpers ─── */

function mapBackendMeeting(bm: BackendMeeting): Meeting {
  // 拼接 date + startTime/endTime 为 ISO 字符串（兼容 date-only or time-only）
  const buildISO = (date: string | null, time: string | null) => {
    if (date && time) return new Date(`${date}T${time}`).toISOString();
    if (date) return new Date(`${date}T00:00:00`).toISOString();
    return new Date().toISOString();
  };

  // 如果 startTime 已经是完整 ISO 字符串（包含 T），直接使用
  const start = bm.startTime?.includes('T')
    ? bm.startTime
    : buildISO(bm.date, bm.startTime);
  const end = bm.endTime?.includes('T')
    ? bm.endTime
    : buildISO(bm.date, bm.endTime);

  const duration = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000,
  );

  return {
    id: bm.id,
    title: bm.title,
    startTime: start,
    endTime: end,
    duration: Math.max(duration, 0),
    status: bm.status as Meeting['status'],
    attendees: bm.participants.map((p) => p.user.id),
    summary: bm.backgroundInfo || undefined,
    tags: [],
    // 保留完整数据供详情页使用
    ...(bm as any),
  };
}

/* ─── Filters ─── */

interface MeetingFilters {
  search: string;
  status: string;
  dateRange: string;
}

/* ─── State ─── */

interface MeetingState {
  meetings: Meeting[];
  isLoading: boolean;
  activeMeetingId: string | null;
  filters: MeetingFilters;
  viewMode: 'list' | 'card';
  selectedIds: string[];

  /* 异步 API */
  fetchMeetings: () => Promise<void>;
  createMeeting: (data: {
    title: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    backgroundInfo?: string;
    agenda?: { id: string; title: string; duration: number }[];
    participants?: { userId: string; role: string; isSpeaker: boolean }[];
    status?: string;
  }) => Promise<Meeting>;
  deleteMeeting: (id: string) => Promise<void>;

  /* 本地同步操作 */
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
  meetings: [],
  isLoading: false,
  activeMeetingId: null,
  filters: { search: '', status: '', dateRange: '' },
  viewMode: 'list',
  selectedIds: [],

  /* ═══ 异步 API ═══ */

  fetchMeetings: async () => {
    set({ isLoading: true });
    try {
      const data = (await apiFetch('/meetings')) as BackendMeeting[];
      const meetings = data.map(mapBackendMeeting);
      set({ meetings, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createMeeting: async (data) => {
    // 构建 startTime（ISO 8601）：优先使用 date+startTime 组合，其次单独 startTime，最后用当前时间
    let startTimeISO: string;
    if (data.date && data.startTime) {
      startTimeISO = new Date(`${data.date}T${data.startTime}`).toISOString();
    } else if (data.startTime && data.startTime.includes('T')) {
      startTimeISO = new Date(data.startTime).toISOString();
    } else if (data.startTime) {
      startTimeISO = new Date(`${new Date().toISOString().slice(0, 10)}T${data.startTime}`).toISOString();
    } else {
      startTimeISO = new Date().toISOString();
    }

    // 只发送指定字段：title、startTime、status、agenda、participants
    const payload: Record<string, unknown> = {
      title: data.title || '未命名会议',
      startTime: startTimeISO,
      status: data.status || 'scheduled',
    };
    if (data.agenda && Array.isArray(data.agenda) && data.agenda.length > 0) {
      payload.agenda = JSON.stringify(data.agenda);
    }
    if (data.participants && data.participants.length > 0) {
      payload.participants = data.participants;
    }

    const result = (await apiFetch('/meetings', {
      method: 'POST',
      body: JSON.stringify(payload),
      rawBody: true,
    })) as BackendMeeting;

    const meeting = mapBackendMeeting(result);
    // 本地乐观更新
    set((state) => ({ meetings: [meeting, ...state.meetings] }));
    return meeting;
  },

  deleteMeeting: async (id: string) => {
    await apiFetch(`/meetings/${id}`, {
      method: 'DELETE',
    });
    // 本地乐观更新
    set((state) => ({ 
      meetings: state.meetings.filter((m) => m.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    }));
  },

  /* ═══ 本地同步操作 ═══ */

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
          m.summary?.toLowerCase().includes(q),
      );
    }

    if (filters.status) {
      filtered = filtered.filter((m) => m.status === filters.status);
    }

    if (filters.dateRange) {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter((m) => {
            const d = new Date(m.startTime);
            return (
              d >= startOfDay &&
              d < new Date(startOfDay.getTime() + 86400000)
            );
          });
          break;
        case 'week':
          const weekStart = new Date(
            startOfDay.getTime() - startOfDay.getDay() * 86400000,
          );
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
        m.id === id ? { ...m, ...updates } : m,
      ),
    })),
}));
