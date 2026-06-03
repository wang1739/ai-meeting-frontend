import { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useMeetingStore } from '@/stores/meetingStore';
import { mockUsers, mockActionItems } from '@/data/mockData';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import AvatarGroup from '@/components/ui/AvatarGroup';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';
import {
  SlidersHorizontal,
  LayoutList,
  LayoutGrid,
  CheckCircle2,
  Circle,
  Calendar,
  Plus,
} from 'lucide-react';

/* ── Status configuration ── */

const statusConfig = {
  ongoing: {
    label: '进行中',
    badgeVariant: 'primary' as const,
    borderColor: '#4F46E5' as const,
  },
  scheduled: {
    label: '已排期',
    badgeVariant: 'info' as const,
    borderColor: '#3B82F6' as const,
  },
  completed: {
    label: '已完成',
    badgeVariant: 'success' as const,
    borderColor: '#10B981' as const,
  },
  cancelled: {
    label: '已取消',
    badgeVariant: 'default' as const,
    borderColor: '#94A3B8' as const,
  },
};

/* ── Helpers ── */

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}

function getUserName(userId: string): string {
  return mockUsers.find((u) => u.id === userId)?.name ?? userId;
}

function getAvatarGroupUsers(ids: string[]) {
  return ids.map((id) => ({ name: getUserName(id) }));
}

/* ── Animation variants ── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

/* ── Component ── */

export default function MeetingList() {
  const navigate = useNavigate();

  const {
    meetings,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    getFilteredMeetings,
  } = useMeetingStore();

  const filteredMeetings = useMemo(() => getFilteredMeetings(), [getFilteredMeetings]);

  const allSelected = meetings.length > 0 && selectedIds.length === meetings.length;

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [allSelected, clearSelection, selectAll]);

  /* Action items count per meeting */
  const actionItemsCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    mockActionItems.forEach((item) => {
      counts[item.meetingId] = (counts[item.meetingId] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="pb-28">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          所有会议
          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-[var(--color-primary)]">
            {meetings.length}
          </span>
        </h1>
      </div>

      {/* ── Search & actions row ── */}
      <div className="mb-4 flex items-center gap-3">
        <div className="max-w-md flex-1">
          <SearchInput
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="搜索会议标题或摘要…"
          />
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          onClick={() => {}}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-0.5 rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-card)] p-0.5">
          <button
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'list'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            )}
            onClick={() => setViewMode('list')}
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'card'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            )}
            onClick={() => setViewMode('card')}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Filter row ── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="h-9 rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          >
            <option value="">全部状态</option>
            <option value="ongoing">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ dateRange: e.target.value })}
            className="h-9 rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          >
            <option value="">全部时间</option>
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
        </div>

        <button
          className="gradient-btn inline-flex items-center gap-2"
          onClick={() => navigate('/meetings/new')}
        >
          <Plus className="h-4 w-4" />
          新建会议
        </button>
      </div>

      {/* ── Content ── */}
      {filteredMeetings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="没有找到会议"
          description="试试调整筛选条件"
        />
      ) : viewMode === 'list' ? (
        /* ═══ List view ═══ */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="overflow-hidden rounded-[12px] border border-[var(--border-color)]"
        >
          {/* Select-all header */}
          <div className="flex items-center gap-3 border-b border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3">
            <button onClick={handleSelectAll} className="shrink-0">
              {allSelected ? (
                <CheckCircle2 className="h-5 w-5 text-[var(--color-primary)]" />
              ) : (
                <Circle className="h-5 w-5 text-[var(--text-muted)]" />
              )}
            </button>
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {allSelected ? '取消全选' : '全选'}
            </span>
          </div>

          {filteredMeetings.map((meeting) => {
            const isSelected = selectedIds.includes(meeting.id);
            const config = statusConfig[meeting.status];
            return (
              <motion.div
                key={meeting.id}
                variants={itemVariants}
                className={cn(
                  'flex items-center gap-3 border-b border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-4 transition-colors last:border-b-0',
                  'border-l-4 hover:bg-gray-50 dark:hover:bg-dark-card/50',
                  isSelected && 'bg-primary/5 dark:bg-primary/5',
                )}
                style={{ borderLeftColor: config.borderColor }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(meeting.id)}
                  className="shrink-0"
                >
                  {isSelected ? (
                    <CheckCircle2 className="h-5 w-5 text-[var(--color-primary)]" />
                  ) : (
                    <Circle className="h-5 w-5 text-[var(--text-muted)]" />
                  )}
                </button>

                {/* Content */}
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  {/* Title + meta + summary */}
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/meetings/${meeting.id}`}
                      className="text-sm font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--color-primary)]"
                    >
                      {meeting.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span>
                        {formatDate(meeting.startTime)} {formatTime(meeting.startTime)}
                      </span>
                      <span>·</span>
                      <span>{formatDuration(meeting.duration)}</span>
                    </div>
                    {meeting.summary && (
                      <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                        {meeting.summary}
                      </p>
                    )}
                  </div>

                  {/* Attendees */}
                  <div className="shrink-0">
                    <AvatarGroup
                      users={getAvatarGroupUsers(meeting.attendees)}
                      max={3}
                      size="sm"
                    />
                  </div>

                  {/* Status badge */}
                  <Badge variant={config.badgeVariant} size="sm">
                    {config.label}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* ═══ Card view ═══ */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredMeetings.map((meeting) => {
            const isSelected = selectedIds.includes(meeting.id);
            const config = statusConfig[meeting.status];
            const actionCount = actionItemsCountMap[meeting.id] || 0;
            return (
              <motion.div
                key={meeting.id}
                variants={itemVariants}
                layout
                className={cn(
                  'relative rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 transition-all duration-200',
                  'hover:shadow-md hover:-translate-y-0.5',
                  isSelected && 'ring-2 ring-primary/30',
                )}
              >
                {/* Top color strip */}
                <div
                  className="absolute left-0 right-0 top-0 h-1 rounded-t-[12px]"
                  style={{ backgroundColor: config.borderColor }}
                />

                {/* Selection checkbox */}
                <button
                  onClick={() => toggleSelect(meeting.id)}
                  className="absolute right-3 top-3 z-10"
                >
                  {isSelected ? (
                    <CheckCircle2 className="h-5 w-5 text-[var(--color-primary)]" />
                  ) : (
                    <Circle className="h-5 w-5 text-[var(--text-muted)]" />
                  )}
                </button>

                {/* Title */}
                <Link
                  to={`/meetings/${meeting.id}`}
                  className="mt-1 block text-sm font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--color-primary)]"
                >
                  {meeting.title}
                </Link>

                {/* Date & duration */}
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span>{formatDate(meeting.startTime)}</span>
                  <span>{formatTime(meeting.startTime)}</span>
                  <span>·</span>
                  <span>{formatDuration(meeting.duration)}</span>
                </div>

                {/* Attendees */}
                <div className="mt-3">
                  <AvatarGroup
                    users={getAvatarGroupUsers(meeting.attendees)}
                    max={3}
                    size="sm"
                  />
                </div>

                {/* Summary */}
                {meeting.summary && (
                  <p className="mt-2 line-clamp-2 text-xs text-[var(--text-secondary)]">
                    {meeting.summary}
                  </p>
                )}

                {/* Bottom row */}
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant={config.badgeVariant} size="sm">
                    {config.label}
                  </Badge>
                  {actionCount > 0 && (
                    <Badge variant="warning" size="sm">
                      {actionCount} 项待办
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Bottom bulk-action bar ── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-color)] px-6 py-4"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                已选择{' '}
                <span className="text-[var(--color-primary)]">{selectedIds.length}</span>{' '}
                项
              </span>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => {}}>
                  标记为已读
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {}}>
                  导出
                </Button>
                <Button variant="danger" size="sm" onClick={() => {}}>
                  删除
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}