import { useState, useMemo, useCallback, forwardRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckSquare,
  BarChart3,
  Plus,
  Zap,
  Sparkles,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime, isSameDay, isThisWeek, formatDuration } from '@/utils/date';
import { apiFetch } from '@/lib/api';
import { getGreeting, mockActionItems, mockUsers } from '@/data/mockData';
import { useMeetingStore } from '@/stores/meetingStore';
import { useAuthStore } from '@/stores/authStore';
import type { ActionItem, Meeting } from '@/data/mockData';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import AvatarGroup from '@/components/ui/AvatarGroup';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const currentUser = useAuthStore.getState().userInfo || { id: '', name: '用户', email: '' };

function getUserById(id: string) {
  return mockUsers.find((u) => u.id === id) ?? mockUsers[0];
}

function getMeetingTitleById(id: string) {
  return ''; // 后续从 store 中查找
}

function getStatusBadgeVariant(status: ActionItem['status']) {
  switch (status) {
    case 'todo':
      return 'warning' as const;
    case 'in_progress':
      return 'primary' as const;
    case 'done':
      return 'success' as const;
  }
}

function getStatusLabel(status: ActionItem['status']) {
  switch (status) {
    case 'todo':
      return '待处理';
    case 'in_progress':
      return '进行中';
    case 'done':
      return '已完成';
  }
}

// ---------------------------------------------------------------------------
// Mock 7-day chart data
// ---------------------------------------------------------------------------

const weekLabels = ['05/28', '05/29', '05/30', '05/31', '06/01', '06/02', '06/03'];
const durationData = [45, 90, 30, 0, 90, 0, 90]; // minutes per day
const moodData = [75, 82, 78, 0, 88, 0, 85]; // mood scores

// ---------------------------------------------------------------------------
// Mini SVG Line Chart
// ---------------------------------------------------------------------------

function MiniLineChart({
  data,
  color,
  gradientColor,
  unit,
  maxValue,
}: {
  data: number[];
  color: string;
  gradientColor: string;
  unit: string;
  maxValue: number;
}) {
  const width = 280;
  const height = 90;
  const padding = { top: 12, right: 8, bottom: 20, left: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((v, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - (v / maxValue) * chartH,
    value: v,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
    >
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradientColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={gradientColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill={p.value > 0 ? color : 'none'}
          stroke={p.value > 0 ? '#fff' : 'none'}
          strokeWidth={1.5}
        />
      ))}

      {/* Labels */}
      {[0, 3, 6].map((i) => (
        <text
          key={i}
          x={points[i].x}
          y={height - 2}
          textAnchor="middle"
          className="fill-[var(--text-muted)]"
          fontSize={10}
        >
          {weekLabels[i].slice(3)}
        </text>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Action Item Card
// ---------------------------------------------------------------------------

const ActionItemCard = forwardRef<HTMLDivElement, {
  item: ActionItem;
  checked: boolean;
  onToggle: () => void;
}>(function ActionItemCard({ item, checked, onToggle }, ref) {
  const assignee = getUserById(item.assignee);
  const meetingTitle = getMeetingTitleById(item.meetingId);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card variant="default" className={cn('flex items-start gap-3 p-4', checked && 'opacity-50')}>
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
            checked
              ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
              : 'border-[var(--border-color)] hover:border-[var(--color-primary)]',
          )}
        >
          {checked && (
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm leading-snug text-[var(--text-primary)]',
              checked && 'line-through text-[var(--text-muted)]',
            )}
          >
            {item.content}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Avatar name={assignee.name} size="sm" />
              <span className="text-xs text-[var(--text-secondary)]">{assignee.name}</span>
            </div>
            <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
              {getStatusLabel(item.status)}
            </Badge>
            <span className="text-xs text-[var(--text-muted)]">来自: {meetingTitle}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const navigate = useNavigate();
  const meetings = useMeetingStore((s) => s.meetings);
  const fetchMeetings = useMeetingStore((s) => s.fetchMeetings);
  const addMeeting = useMeetingStore((s) => s.addMeeting);

  // 进入页面时拉取最新会议数据
  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Action item filter state
  const [activeActionTab, setActiveActionTab] = useState('all');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  // 从 API 获取的真实待办数
  const [pendingActionCount, setPendingActionCount] = useState<number | null>(null);
  // 统计数据
  const [stats, setStats] = useState<{ todayCount: number; weekTotalHours: string } | null>(null);
  // 当前登录用户（响应式）
  const authUser = useAuthStore((s) => s.userInfo);
  const displayName = authUser?.name || '用户';

  // 进入页面时获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await apiFetch('/meetings/stats');
        setStats(result);
      } catch {
        setStats({ todayCount: 0, weekTotalHours: '0.0' });
      }
    };
    fetchStats();
  }, []);

  // 进入页面时拉取所有会议的行动项数量
  useEffect(() => {
    const fetchActionItemsCount = async () => {
      try {
        const result = await apiFetch('/meetings/action-items/stats');
        setPendingActionCount(result.totalCount);
      } catch {
        setPendingActionCount(0);
      }
    };
    fetchActionItemsCount();
  }, []);

  // -----------------------------------------------------------------------
  // 即时会议：一键创建并进入会议室
  // -----------------------------------------------------------------------

  const handleInstantMeeting = useCallback(async () => {
    try {
      // 通过 API 创建即时会议
      const meeting = await useMeetingStore.getState().createMeeting({
        title: `即时会议`,
        startTime: new Date().toISOString(),
      });
      navigate(`/meeting/${meeting.id}/room`);
    } catch {
      // 降级：本地创建
      const now = new Date();
      const meeting: Meeting = {
        id: `meeting-${Date.now()}`,
        title: `即时会议 ${now.toLocaleTimeString('zh-CN', { hour: 'numeric', minute: 'numeric' })}`,
        startTime: now.toISOString(),
        endTime: now.toISOString(),
        duration: 0,
        status: 'ongoing',
        attendees: [mockUsers[0].id],
        summary: '',
        tags: [],
        actionItems: [],
        mood: 0,
      };
      addMeeting(meeting);
      navigate(`/meeting/${meeting.id}/room`);
    }
  }, [addMeeting, navigate]);

  // -----------------------------------------------------------------------
  // Computed stats
  // -----------------------------------------------------------------------

  const todayCount = stats?.todayCount ?? 0;
  const weekHours = stats?.weekTotalHours ?? '--';

  const pendingActionDisplay = pendingActionCount !== null ? pendingActionCount : '--';

  // -----------------------------------------------------------------------
  // Upcoming meetings (ongoing + scheduled, sorted)
  // -----------------------------------------------------------------------

  const upcomingMeetings = useMemo(
    () =>
      meetings
        .filter((m) => m.status === 'ongoing' || m.status === 'scheduled')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [meetings],
  );

  // -----------------------------------------------------------------------
  // Filtered action items
  // -----------------------------------------------------------------------

  const filteredActions = useMemo(() => {
    let list = [...mockActionItems];
    if (activeActionTab === 'mine') {
      list = list.filter((a) => a.assignee === currentUser.id);
    } else if (activeActionTab === 'pending') {
      list = list.filter((a) => a.status !== 'done');
    }
    return list;
  }, [activeActionTab]);

  const actionTabs = [
    { id: 'all', label: '全部', count: mockActionItems.length },
    { id: 'mine', label: '我的', count: mockActionItems.filter((a) => a.assignee === currentUser.id).length },
    { id: 'pending', label: '未完成', count: mockActionItems.filter((a) => a.status !== 'done').length },
  ];

  function toggleCheck(id: string) {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // -----------------------------------------------------------------------
  // Stagger animation variants
  // -----------------------------------------------------------------------

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  };

  // -----------------------------------------------------------------------
  // Stat cards
  // -----------------------------------------------------------------------

  const statCards = [
    { icon: Calendar, label: '今日会议数', value: todayCount, color: '#4F46E5', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { icon: Clock, label: '本周总时长', value: `${weekHours}h`, color: '#10B981', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { icon: CheckSquare, label: '待办行动项', value: pendingActionDisplay, color: '#F59E0B', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { icon: BarChart3, label: '发言活跃度', value: '--', color: '#3B82F6', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* ================================================================ */}
      {/* 1. 顶部问候与快捷操作                                              */}
      {/* ================================================================ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {getGreeting()}，{displayName}
            <span className="ml-2 inline-block animate-pulse">👋</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            今天有 {todayCount} 场会议，合理安排你的时间
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={<Zap className="h-4 w-4" />}
            onClick={handleInstantMeeting}
          >
            即时会议
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/meetings/new')}
          >
            预约新会议
          </Button>
        </motion.div>
      </motion.div>

      {/* ================================================================ */}
      {/* 2. 数据卡片行                                                     */}
      {/* ================================================================ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((card, idx) => (
          <motion.div key={card.label} variants={itemVariants}>
            <Card variant="hover" className="flex items-center gap-4 p-5">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  card.bg,
                )}
              >
                <card.icon className="h-6 w-6" style={{ color: card.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{card.value}</p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{card.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ================================================================ */}
      {/* 3. 双栏内容区                                                     */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ---------- 左栏：即将召开 ---------- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">即将召开</h2>
            <button
              onClick={() => navigate('/meetings')}
              className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              查看全部
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>

          {upcomingMeetings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="暂无即将召开的会议"
              description="点击上方按钮快速发起会议"
            />
          ) : (
            <div className="relative space-y-0">
              {/* Timeline vertical line */}
              <div className="absolute left-[52px] top-3 bottom-3 w-px bg-[var(--border-color)]" />

              {upcomingMeetings.map((meeting, idx) => {
                const attendeeUsers = meeting.attendees.map((id) => getUserById(id));
                const timeStr = formatTime(meeting.startTime);

                return (
                  <motion.div
                    key={meeting.id}
                    variants={itemVariants}
                    className="relative flex gap-4 pb-6 last:pb-0"
                  >
                    {/* Time badge */}
                    <div className="relative z-10 flex w-[52px] shrink-0 flex-col items-center">
                      <span className="text-xs font-semibold text-[var(--color-primary)]">
                        {timeStr}
                      </span>
                      <span className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                        {formatDuration(meeting.duration)}
                      </span>
                    </div>

                    {/* Timeline dot */}
                    <div className="absolute left-[52px] top-2 z-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-white bg-[var(--color-primary)] dark:border-[var(--bg-card)]" />

                    {/* Meeting card */}
                    <div className="flex-1">
                      <Card variant="default" className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                            {meeting.title}
                          </h3>
                          <Badge
                            variant={meeting.status === 'ongoing' ? 'success' : 'default'}
                            size="sm"
                            dot
                          >
                            {meeting.status === 'ongoing' ? '进行中' : '待开始'}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <AvatarGroup
                            users={attendeeUsers.map((u) => ({
                              name: u.name,
                              src: u.avatar,
                            }))}
                            max={4}
                            size="sm"
                          />
                          <span className="text-xs text-[var(--text-muted)]">
                            {attendeeUsers.length} 人参与
                          </span>
                          <div className="ml-auto">
                            {meeting.status === 'ongoing' ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate(`/meeting/${meeting.id}/room`)}
                              >
                                加入
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/meeting/${meeting.id}/room`)}
                              >
                                待开始
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>

                      {/* AI pre-question bubble after first meeting */}
                      {idx === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.3 }}
                          className="ai-card mt-3 px-4 py-3"
                        >
                          <div className="flex items-start gap-2">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ai)]" />
                            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                              <span className="font-medium text-[var(--color-ai)]">AI 预判：</span>
                              本次会议可能与上周产品评审相关，建议提前查看行动项
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ---------- 右栏：行动项 ---------- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">待处理的行动项</h2>
            </div>

            <Tabs
              tabs={actionTabs}
              activeTab={activeActionTab}
              onChange={setActiveActionTab}
            />

            <div className="mt-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredActions.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <EmptyState
                      icon={CheckSquare}
                      title="暂无行动项"
                      description="所有事项已处理完毕"
                    />
                  </motion.div>
                ) : (
                  filteredActions.map((item) => (
                    <ActionItemCard
                      key={item.id}
                      item={item}
                      checked={!!checkedItems[item.id]}
                      onToggle={() => toggleCheck(item.id)}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ================================================================ */}
      {/* 4. 底部趋势图                                                     */}
      {/* ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">近 7 天趋势</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* 会议时长趋势 */}
          <Card variant="default" className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--color-primary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">会议时长趋势</span>
              <span className="ml-auto text-xs text-[var(--text-muted)]">分钟</span>
            </div>
            <MiniLineChart
              data={durationData}
              color="#4F46E5"
              gradientColor="#4F46E5"
              unit="min"
              maxValue={120}
            />
          </Card>

          {/* 情绪指数趋势 */}
          <Card variant="default" className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--color-success)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">情绪指数趋势</span>
              <span className="ml-auto text-xs text-[var(--text-muted)]">评分</span>
            </div>
            <MiniLineChart
              data={moodData}
              color="#10B981"
              gradientColor="#10B981"
              unit="pts"
              maxValue={100}
            />
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}