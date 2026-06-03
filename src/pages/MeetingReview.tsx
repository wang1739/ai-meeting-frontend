import { useState, useCallback, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Play, Pause, Download, Share2, Clock, Calendar, Users, Tag,
  MessageSquare, MessageCircle, CheckSquare, ListTodo, FileText,
  Sparkles, Headphones, Edit3, Paperclip, Send,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import AvatarGroup from '@/components/ui/AvatarGroup'
import Avatar from '@/components/ui/Avatar'
import Skeleton from '@/components/ui/Skeleton'
import { useMeetingStore } from '@/stores/meetingStore'
import {
  mockMeetings,
  mockUsers,
  mockActionItems,
  mockTags,
  type TranscriptEntry,
  type ActionItem,
  type Meeting,
} from '@/data/mockData'

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
}

/* ------------------------------------------------------------------ */
/*  Mock: summary segments & decisions per meeting                     */
/* ------------------------------------------------------------------ */
const summarySegmentsMap: Record<string, { title: string; time: string; text: string }[]> = {
  m2: [
    { title: '性能优化进展', time: '0:00 - 1:35', text: '首页LCP从3.2秒降至1.8秒，移动端首屏从4.5秒降至2.2秒。核心措施：图片懒加载、代码分割、SSR优化及WebP格式适配。' },
    { title: '代码审查规范修订', time: '1:45 - 2:45', text: '讨论简化PR审查流程。决定实施分级审查制度：紧急修复/样式调整一人批准即可，核心逻辑变更需至少两人审查通过。' },
    { title: 'v2.8版本发布计划', time: '2:55 - 4:12', text: '周四灰度发布，按5%→30%→100%逐步放量。包含12个新功能、24个bug修复，需做好回滚预案。' },
  ],
  m4: [
    { title: 'Q2交付回顾', time: '0:00 - 1:05', text: 'Q2完成8个项目，6个按时交付，2个延期。延期主因：需求变更频繁，B端项目中途改需求导致开发周期延长近两周。' },
    { title: '需求变更管理', time: '1:05 - 2:20', text: '提出设置需求冻结时间点，大变更先评估影响再纳入当前迭代。跨部门信息同步需加强，建议每周一、四召开接口对齐会。' },
    { title: '测试与自动化', time: '2:20 - 3:30', text: '核心业务线自动化测试覆盖率已达65%，目标Q3达到85%。测试资源瓶颈待解决。' },
    { title: '文档与技术债务', time: '3:30 - 4:08', text: '提议文档更新作为项目验收必要条件，并设置文档质量评分纳入绩效考核。当前技术债务约40人天，计划Q3消化。' },
  ],
  m6: [
    { title: '搜索模块优化', time: '0:00 - 1:22', text: '引入语义搜索提升准确率。基于Elasticsearch 8.x + 开源BGE embedding模型，预计3周改造时间。' },
    { title: '数据看板自定义', time: '1:22 - 2:25', text: '提供10个预设模板和拖拽能力，分两期实现：先出基础自定义看板，第二期丰富组件库。' },
    { title: '通知中心优化', time: '2:25 - 3:22', text: '设计通知偏好设置页面，支持按类型单独开关和免打扰时段。默认保留重要推送，后续做智能推荐。' },
    { title: '移动端适配优化', time: '3:22 - 3:45', text: '针对页面布局错乱和操作不便问题，用响应式方案重构主要页面。' },
  ],
}

const decisionsMap: Record<string, { text: string; time: string; speaker: string }[]> = {
  m2: [
    { text: '实施分级代码审查制度，核心逻辑变更需至少两人审查通过', time: '2:12', speaker: '张明' },
    { text: 'v2.8版本周四灰度发布，按5% → 30% → 100% 比例逐步放量', time: '3:22', speaker: '李华' },
    { text: '审查规范草案会后发群，周二前收集反馈意见', time: '2:45', speaker: '张明' },
  ],
  m4: [
    { text: '需求变更需先评估影响再决定是否纳入当前迭代', time: '0:45', speaker: '张明' },
    { text: '设置需求冻结时间点，后续变更统一放入下一期', time: '1:02', speaker: '李华' },
    { text: '文档更新作为项目验收必要条件，设置文档质量评分机制', time: '2:55', speaker: '王芳' },
    { text: '每个迭代至少保留20%时间处理技术债务', time: '3:40', speaker: '张明' },
  ],
  m6: [
    { text: '搜索模块使用开源BGE模型升级语义搜索，预计3周完成', time: '1:05', speaker: '王芳' },
    { text: '数据看板分两期实现：先基础自定义版，再丰富组件库', time: '2:25', speaker: '张明' },
    { text: '通知默认保留重要推送类型，避免用户错过关键信息', time: '3:10', speaker: '张明' },
  ],
}

const mockAttachments = [
  { name: 'Q2路线图.pdf', size: '2.4 MB' },
  { name: '会议议程.docx', size: '856 KB' },
  { name: '用户调研报告.pptx', size: '5.1 MB' },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const userName = (id: string) => mockUsers.find((u) => u.id === id)?.name ?? '未知'
const userColor = (id: string) => mockUsers.find((u) => u.id === id)?.color ?? '#64748B'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

/* ------------------------------------------------------------------ */
/*  Sub‑components                                                     */
/* ------------------------------------------------------------------ */

/** Simple waveform SVG  */
const Waveform = ({ isPlaying }: { isPlaying: boolean }) => {
  const bars = useMemo(() => {
    const count = 48
    return Array.from({ length: count }, (_, i) => {
      const center = count / 2
      const dist = Math.abs(i - center) / center
      return Math.max(8, Math.round(32 - dist * 24 + Math.sin(i * 1.2) * 6 + Math.cos(i * 0.7) * 4))
    })
  }, [])

  return (
    <svg viewBox="0 0 200 40" className="h-full w-full" preserveAspectRatio="none">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * (200 / bars.length) + 1}
          y={(40 - h) / 2}
          width={200 / bars.length - 2}
          height={h}
          rx={1.5}
          className={cn(
            'transition-all duration-150',
            isPlaying ? 'fill-[var(--color-primary)]' : 'fill-[var(--text-muted)]',
          )}
          style={isPlaying ? { animation: `wavePulse 0.6s ease-in-out ${i * 0.03}s infinite alternate` } : undefined}
        />
      ))}
    </svg>
  )
}

/** Single transcript entry  */
interface TranscriptItemProps {
  entry: TranscriptEntry
  isActive: boolean
  isEdited: boolean
  onJump: () => void
  onEdit: () => void
  onSave: (text: string) => void
  onCancel: () => void
}
const TranscriptItem: React.FC<TranscriptItemProps> = ({
  entry,
  isActive,
  isEdited,
  onJump,
  onEdit,
  onSave,
  onCancel,
}) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.text)

  const handleEdit = () => {
    setEditing(true)
    setDraft(entry.text)
    onEdit()
  }

  const handleSave = () => {
    setEditing(false)
    onSave(draft)
  }

  const handleCancel = () => {
    setEditing(false)
    setDraft(entry.text)
    onCancel()
  }

  return (
    <motion.div
      layout
      className={cn(
        'group relative cursor-pointer rounded-md px-4 py-3 transition-colors',
        isActive && 'border-l-[3px] border-[var(--color-primary)] bg-primary/5',
        !isActive && 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
      )}
      onClick={!editing ? onJump : undefined}
    >
      <div className="mb-1 flex items-center gap-2 text-xs">
        <span
          className="inline-flex items-center gap-1.5 font-semibold"
          style={{ color: userColor(entry.userId) }}
        >
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: userColor(entry.userId) }} />
          {userName(entry.userId)}
        </span>
        <span className="text-[var(--text-muted)]">{formatTime(entry.timestamp)}</span>
        {isEdited && (
          <Badge variant="warning" size="sm">
            已修改
          </Badge>
        )}
      </div>

      {editing ? (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] p-2 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              保存
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              取消
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">{draft}</p>
          <button
            className="shrink-0 rounded p-1 text-[var(--text-muted)] opacity-0 transition-opacity hover:text-[var(--text-primary)] group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              handleEdit()
            }}
            title="编辑"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

/** Kanban column  */
interface KanbanColumnProps {
  title: string
  status: ActionItem['status']
  items: ActionItem[]
  badgeVariant: 'warning' | 'info' | 'success'
  onDrop: (itemId: string, newStatus: ActionItem['status']) => void
  onToggleCheck: (itemId: string) => void
}
const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, status, items, badgeVariant, onDrop, onToggleCheck }) => {
  const dragOverCounter = useRef(0)
  const [isOver, setIsOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragOverCounter.current += 1
    setIsOver(true)
  }

  const handleDragLeave = () => {
    dragOverCounter.current -= 1
    if (dragOverCounter.current <= 0) {
      dragOverCounter.current = 0
      setIsOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragOverCounter.current = 0
    setIsOver(false)
    const itemId = e.dataTransfer.getData('text/plain')
    if (itemId) onDrop(itemId, status)
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-3 transition-colors',
        isOver && 'border-[var(--color-primary)] bg-primary/5',
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h4>
        <Badge variant={badgeVariant} size="sm">
          {items.length}
        </Badge>
      </div>

      <div className="space-y-2 min-h-[80px]">
        {items.length === 0 && (
          <p className="py-6 text-center text-xs text-[var(--text-muted)]">
            {status === 'todo' ? '暂无待办' : status === 'in_progress' ? '暂无进行中' : '暂无已完成'}
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', item.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
            className={cn(
              'cursor-grab rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 transition-shadow active:cursor-grabbing',
              'hover:shadow-custom-sm',
            )}
          >
            <div className="mb-2 flex items-start gap-2">
              <button
                onClick={() => onToggleCheck(item.id)}
                className={cn(
                  'mt-0.5 shrink-0 rounded p-0.5 transition-colors',
                  item.status === 'done'
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                )}
              >
                <CheckSquare className="h-4 w-4" />
              </button>
              <span
                className={cn(
                  'text-sm leading-snug',
                  item.status === 'done' && 'text-[var(--text-muted)] line-through',
                )}
              >
                {item.content}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Avatar name={userName(item.assignee)} size="sm" />
                <span className="text-[11px] text-[var(--text-muted)]">{userName(item.assignee)}</span>
              </div>
              {item.evidenceId && (
                <button className="text-[11px] text-[var(--color-primary)] hover:underline">
                  查看转写证据 #{item.evidenceId.replace('t', '')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */
export default function MeetingReview() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const storeMeetings = useMeetingStore((s) => s.meetings)
  const meeting: Meeting | undefined = [...storeMeetings, ...mockMeetings].find((m) => m.id === meetingId)

  /* ---------- Player state ---------- */
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0) // 0‑100
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  /* ---------- Transcript state ---------- */
  const [editedEntries, setEditedEntries] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)

  /* ---------- Tag filter ---------- */
  const [activeTag, setActiveTag] = useState<string | null>(null)

  /* ---------- Kanban state ---------- */
  const [kanbanItems, setKanbanItems] = useState<ActionItem[]>(() =>
    mockActionItems.filter((a) => a.meetingId === meetingId),
  )

  /* ---------- AI Q&A state ---------- */
  const [qaInput, setQaInput] = useState('')

  /* ========== Derived data ========== */

  const segments = meeting ? summarySegmentsMap[meeting.id] ?? [] : []
  const decisions = meeting ? decisionsMap[meeting.id] ?? [] : []
  const transcript: TranscriptEntry[] = meeting?.transcript ?? []

  const filteredTranscript = useMemo(() => {
    if (!activeTag) return transcript
    return transcript.filter((e) => e.text.includes(activeTag))
  }, [transcript, activeTag])

  const todoItems = kanbanItems.filter((a) => a.status === 'todo')
  const inProgressItems = kanbanItems.filter((a) => a.status === 'in_progress')
  const doneItems = kanbanItems.filter((a) => a.status === 'done')

  const kanbanStats = useMemo(
    () => ({
      todo: todoItems.length,
      in_progress: inProgressItems.length,
      done: doneItems.length,
    }),
    [kanbanItems],
  )

  /* ========== Handlers ========== */

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p)
    if (!isPlaying && progress >= 100) setProgress(0)
  }, [isPlaying, progress])

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const pct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
    setProgress(pct)
    const idx = Math.floor((pct / 100) * transcript.length)
    const entry = transcript[Math.min(idx, transcript.length - 1)]
    if (entry) setActiveEntryId(entry.id)
  }

  const jumpToEntry = useCallback(
    (entry: TranscriptEntry) => {
      setActiveEntryId(entry.id)
      const idx = transcript.indexOf(entry)
      if (idx >= 0) setProgress((idx / transcript.length) * 100)
    },
    [transcript],
  )

  const handleSaveEdit = useCallback((entryId: string, text: string) => {
    setEditedEntries((prev) => ({ ...prev, [entryId]: text }))
    setEditingId(null)
  }, [])

  const handleKanbanDrop = useCallback((itemId: string, newStatus: ActionItem['status']) => {
    setKanbanItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item)),
    )
  }, [])

  const handleToggleCheck = useCallback((itemId: string) => {
    setKanbanItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const next = item.status === 'done' ? 'todo' : 'done'
        return { ...item, status: next }
      }),
    )
  }, [])

  const handleSendQa = useCallback(() => {
    if (!qaInput.trim()) return
    setQaInput('')
    // Mock: do nothing, just clear input
  }, [qaInput])

  /* ========== Loading / Error states ========== */

  if (!meeting) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {meetingId ? (
          <div className="text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-[var(--text-muted)]" />
            <p className="text-lg font-medium text-[var(--text-primary)]">未找到会议</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">ID: {meetingId} 的会议不存在</p>
          </div>
        ) : (
          <div className="w-full max-w-lg space-y-4">
            <Skeleton variant="card" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
          </div>
        )}
      </div>
    )
  }

  const attendeeUsers = meeting.attendees.map((aid) => ({
    name: userName(aid),
  }))

  const allCompleted = kanbanStats.done + kanbanStats.in_progress + kanbanStats.todo

  /* ========== Render ========== */
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* ========== HERO ========== */}
          <motion.div
            className="col-span-full"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <Card className="overflow-hidden !p-0">
              <div className="bg-gradient-to-r from-[var(--color-gradient-start)]/5 to-[var(--color-gradient-end)]/5 px-6 pb-6 pt-6">
                {/* Title */}
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{meeting.title}</h1>

                {/* Metadata */}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[var(--text-muted)]" />
                    {formatDate(meeting.startTime)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[var(--text-muted)]" />
                    {meeting.duration} 分钟
                  </span>
                  <Badge variant="success" size="sm" dot>
                    已完成
                  </Badge>
                </div>

                {/* Attendees & Tags */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--text-muted)]" />
                    <AvatarGroup users={attendeeUsers} max={5} size="sm" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {meeting.tags?.map((tag) => (
                      <Badge key={tag} variant="primary" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button className="gradient-btn inline-flex items-center gap-2" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isPlaying ? '暂停播放' : '播放录音'}
                  </button>
                  <Button variant="secondary" icon={<Download className="h-4 w-4" />}>
                    导出纪要
                  </Button>
                  <Button variant="ghost" icon={<Share2 className="h-4 w-4" />}>
                    分享
                  </Button>
                </div>

                {/* Recorded indicator */}
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1.5 text-xs text-[var(--color-primary)]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                  </span>
                  本次会议已录音
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ========== LEFT COLUMN — AI 精要 ========== */}
          <motion.div
            className="space-y-6 md:col-span-2 lg:col-span-1"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {/* 分段摘要 */}
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">分段摘要</h3>
              </div>
              {segments.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">暂无分段摘要</p>
              ) : (
                <div className="space-y-3">
                  {segments.map((seg, i) => (
                    <Card key={i} className="!p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{seg.title}</span>
                        <Badge variant="info" size="sm">
                          {seg.time}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{seg.text}</p>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>

            {/* 关键词 */}
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex items-center gap-2">
                <Tag className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">关键词</h3>
              </div>
              <Card className="!p-4">
                <div className="flex flex-wrap gap-2">
                  {mockTags.map((tag) => {
                    let sizeClass = 'text-xs px-2.5 py-1'
                    if (tag.frequency >= 10) sizeClass = 'text-sm px-3.5 py-1.5'
                    else if (tag.frequency >= 5) sizeClass = 'text-xs px-3 py-1'
                    return (
                      <button
                        key={tag.id}
                        onClick={() => setActiveTag(activeTag === tag.word ? null : tag.word)}
                        className={cn(
                          'rounded-full border font-medium transition-all',
                          activeTag === tag.word
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                            : 'border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
                          sizeClass,
                        )}
                      >
                        {tag.word}
                      </button>
                    )
                  })}
                </div>
                {activeTag && (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    正在筛选包含 "<span className="font-medium text-[var(--color-primary)]">{activeTag}</span>" 的转写内容
                    <button
                      className="ml-2 text-[var(--color-primary)] hover:underline"
                      onClick={() => setActiveTag(null)}
                    >
                      清除筛选
                    </button>
                  </p>
                )}
              </Card>
            </motion.div>

            {/* 决策记录 */}
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">决策记录</h3>
              </div>
              {decisions.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">暂无决策记录</p>
              ) : (
                <div className="space-y-2">
                  {decisions.map((d, i) => (
                    <Card key={i} className="!flex !items-start !gap-3 !p-3.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[10px] font-bold text-[var(--color-primary)]">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-[var(--text-primary)]">{d.text}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <span>{d.speaker}</span>
                          <span>·</span>
                          <span>{d.time}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* ========== CENTER COLUMN — 转写回放 ========== */}
          <motion.div
            className="space-y-6 lg:col-span-1"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {/* Audio player mock */}
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex items-center gap-2">
                <Headphones className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">录音回放</h3>
              </div>
              <Card className="!p-4">
                {/* Waveform */}
                <div className="h-12 w-full overflow-hidden rounded-md bg-[var(--bg-primary)]">
                  <Waveform isPlaying={isPlaying} />
                </div>

                {/* Controls */}
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white transition-transform hover:scale-105 active:scale-95"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>

                  {/* Progress bar */}
                  <div
                    ref={progressRef}
                    className="relative h-2 flex-1 cursor-pointer rounded-full bg-[var(--border-color)]"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                    <div
                      className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--color-primary)] shadow-sm transition-all duration-100"
                      style={{ left: `${progress}%`, marginLeft: -7 }}
                    />
                  </div>

                  <span className="shrink-0 text-xs text-[var(--text-muted)]">
                    {formatTime((progress / 100) * 260)} / 4:20
                  </span>
                </div>
              </Card>
            </motion.div>

            {/* Transcript */}
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[var(--color-primary)]" />
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">转写文本</h3>
                </div>
                {activeTag && (
                  <Badge variant="primary" size="sm">
                    已筛选
                  </Badge>
                )}
              </div>

              {filteredTranscript.length === 0 ? (
                <Card className="!p-8 text-center">
                  <MessageSquare className="mx-auto mb-2 h-8 w-8 text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    {transcript.length === 0 ? '暂无转写记录' : '没有匹配的转写内容'}
                  </p>
                </Card>
              ) : (
                <Card className="!p-2">
                  <div className="max-h-[560px] space-y-0.5 overflow-y-auto">
                    {filteredTranscript.map((entry) => (
                      <TranscriptItem
                        key={entry.id}
                        entry={entry}
                        isActive={activeEntryId === entry.id}
                        isEdited={entry.id in editedEntries}
                        onJump={() => jumpToEntry(entry)}
                        onEdit={() => setEditingId(entry.id)}
                        onSave={(text) => handleSaveEdit(entry.id, text)}
                        onCancel={() => setEditingId(null)}
                      />
                    ))}
                  </div>
                </Card>
              )}
            </motion.div>
          </motion.div>

          {/* ========== RIGHT COLUMN ========== */}
          <motion.div
            className="space-y-6 lg:col-span-1"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {/* Action Items Kanban */}
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-[var(--color-primary)]" />
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">待办事项</h3>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  共 {allCompleted} 项
                </span>
              </div>

              {kanbanItems.length === 0 ? (
                <Card className="!p-8 text-center">
                  <CheckSquare className="mx-auto mb-2 h-8 w-8 text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-secondary)]">暂无待办事项</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <KanbanColumn
                    title="待办"
                    status="todo"
                    items={todoItems}
                    badgeVariant="warning"
                    onDrop={handleKanbanDrop}
                    onToggleCheck={handleToggleCheck}
                  />
                  <KanbanColumn
                    title="进行中"
                    status="in_progress"
                    items={inProgressItems}
                    badgeVariant="info"
                    onDrop={handleKanbanDrop}
                    onToggleCheck={handleToggleCheck}
                  />
                  <KanbanColumn
                    title="已完成"
                    status="done"
                    items={doneItems}
                    badgeVariant="success"
                    onDrop={handleKanbanDrop}
                    onToggleCheck={handleToggleCheck}
                  />
                </div>
              )}
            </motion.div>

            {/* 附件列表 */}
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">附件列表</h3>
              </div>
              <Card className="!p-0 divide-y divide-[var(--border-color)]">
                {mockAttachments.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <FileText className="h-8 w-8 shrink-0 text-[var(--color-primary)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{file.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{file.size}</p>
                    </div>
                    <button className="shrink-0 rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-slate-100 hover:text-[var(--color-primary)] dark:hover:bg-slate-800">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </Card>
            </motion.div>

            {/* AI 问答框 */}
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">AI 问答</h3>
              </div>
              <Card className="!p-4">
                <p className="mb-3 text-sm text-[var(--text-muted)]">对本次会议有任何问题？</p>

                {/* Input */}
                <div className="flex items-center gap-2">
                  <input
                    value={qaInput}
                    onChange={(e) => setQaInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendQa()}
                    placeholder="输入你的问题..."
                    className="h-9 flex-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
                  />
                  <Button size="sm" icon={<Send className="h-3.5 w-3.5" />} onClick={handleSendQa}>
                    发送
                  </Button>
                </div>

                {/* Mock Q&A */}
                <div className="mt-4 space-y-3 rounded-md bg-[var(--bg-primary)] p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                      <MessageCircle className="h-3 w-3 text-[var(--color-primary)]" />
                    </div>
                    <p className="text-sm text-[var(--text-primary)]">本次会议的主要结论是什么？</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-ai)]/10">
                      <Sparkles className="h-3 w-3 text-[var(--color-ai)]" />
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                      会议讨论了三个核心议题：<strong className="text-[var(--text-primary)]">性能优化</strong>（首页LCP降至1.8秒）、
                      <strong className="text-[var(--text-primary)]">代码审查规范</strong>（实施分级审查制度）和
                      <strong className="text-[var(--text-primary)]">发布计划</strong>（v2.8版本周四灰度发布）。
                      共产生 {kanbanItems.length} 项待办事项。
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}