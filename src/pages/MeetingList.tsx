import { useState, useMemo, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useMeetingStore } from '@/stores/meetingStore';
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
  Trash2,
  Check,
} from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[12px] bg-[var(--bg-card)] p-6 shadow-xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                取消
              </Button>
              <Button variant="danger" size="sm" onClick={onConfirm}>
                确认删除
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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
  ended: {
    label: '已结束',
    badgeVariant: 'default' as const,
    borderColor: '#6B7280' as const,
  },
};

/* ── Helpers ── */

function safeParse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function formatTime(dateStr: string): string {
  const d = safeParse(dateStr);
  if (!d) return '--:--';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const d = safeParse(dateStr);
  if (!d) return '时间待定';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '--';
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}

function getAvatarGroupUsers(ids: string[]) {
  return ids.map((id) => ({ name: id === 'current' ? '我' : '成员' }));
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
  const [pageNum, setPageNum] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    ids: string[];
    title: string;
    message: string;
  }>({
    isOpen: false,
    ids: [],
    title: '',
    message: '',
  });
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const {
    meetings,
    isLoading,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    getFilteredMeetings,
    fetchMeetings,
    deleteMeeting,
  } = useMeetingStore();

  // 进入页面自动获取会议列表
  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  /** 查询函数：重置页码为1，携带筛选参数刷新会议列表 */
  /** 对接后端语义：keyword=filters.search / status=filters.status / dateType=filters.dateRange / pageNum=1 */
  const getMeetingList = useCallback(() => {
    setPageNum(1);
    return getFilteredMeetings();
  }, [getFilteredMeetings]);

  /** 筛选条件变更 → 立即重新查询 */
  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilters({ status: e.target.value });
      getMeetingList();
    },
    [setFilters, getMeetingList],
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilters({ dateRange: e.target.value });
      getMeetingList();
    },
    [setFilters, getMeetingList],
  );

  /** 搜索回车触发查询 */
  const handleSearchKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        getMeetingList();
      }
    },
    [getMeetingList],
  );

  /** 筛选后的会议列表（每次 meetings / filters 变化时重新计算） */
  const filteredMeetings = useMemo(() => getFilteredMeetings(), [meetings, filters]);

  const allSelected = meetings.length > 0 && selectedIds.length === meetings.length;

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [allSelected, clearSelection, selectAll]);

  const openDeleteDialog = useCallback((ids: string[], title: string, message: string) => {
    setDeleteDialog({ isOpen: true, ids, title, message });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ isOpen: false, ids: [], title: '', message: '' });
  }, []);

  const handleDeleteSingle = useCallback(async (id: string, title: string) => {
    openDeleteDialog([id], '删除会议', `确定要删除会议"${title}"吗？`);
  }, [openDeleteDialog]);

  const handleDeleteBulk = useCallback(() => {
    openDeleteDialog(selectedIds, '批量删除会议', `确定要删除选中的 ${selectedIds.length} 个会议吗？`);
  }, [selectedIds, openDeleteDialog]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      for (const id of deleteDialog.ids) {
        await deleteMeeting(id);
      }
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('删除失败:', error);
    }
    closeDeleteDialog();
  }, [deleteDialog.ids, deleteMeeting, closeDeleteDialog]);

  /* Action items count per meeting */
  const actionItemsCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
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
            onKeyUp={handleSearchKeyUp}
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
            onChange={handleStatusChange}
            className="h-9 rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          >
            <option value="">全部状态</option>
            <option value="ongoing">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={handleDateChange}
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
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-color)] border-t-[var(--color-primary)]" />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={meetings.length === 0 ? '暂无会议' : '没有找到会议'}
          description={meetings.length === 0 ? '去创建一个吧' : '试试调整筛选条件'}
          action={{
            label: '新建会议',
            onClick: () => navigate('/meetings/new'),
          }}
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
            const config = statusConfig[meeting.status] || statusConfig.completed;
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
                      to={`/meeting/${meeting.id}/review`}
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

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteSingle(meeting.id, meeting.title)}
                    className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
                    title="删除会议"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
                  to={`/meeting/${meeting.id}/review`}
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
                  <div className="flex items-center gap-2">
                    {actionCount > 0 && (
                      <Badge variant="warning" size="sm">
                        {actionCount} 项待办
                      </Badge>
                    )}
                    <button
                      onClick={() => handleDeleteSingle(meeting.id, meeting.title)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
                      title="删除会议"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
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
                <Button variant="danger" size="sm" onClick={handleDeleteBulk}>
                删除
              </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={deleteDialog.title}
        message={deleteDialog.message}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteDialog}
      />

      {/* Success toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[100] flex items-center gap-2 rounded-lg bg-[var(--color-success)] px-4 py-3 text-white shadow-lg"
          >
            <Check className="h-5 w-5" />
            <span className="text-sm font-medium">删除成功</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}