import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/utils/date'
import {
  Play, Pause, Share2, Clock, Calendar, Users, Tag as TagIcon,
  MessageSquare, MessageCircle, CheckSquare, ListTodo, FileText,
  Sparkles, Headphones, Edit3, Paperclip, Send, FileDown,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import AvatarGroup from '@/components/ui/AvatarGroup'
import Avatar from '@/components/ui/Avatar'
import Skeleton from '@/components/ui/Skeleton'
import { Tabs, Typography, Tag } from 'antd'
const { Paragraph } = Typography
import { useMeetingStore } from '@/stores/meetingStore'
import { mockUsers, type TranscriptEntry, type ActionItem } from '@/data/mockData'
import { exportWord } from '@/utils/exportMeeting'
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const userName = (id: string) => mockUsers.find((u) => u.id === id)?.name ?? '未知'
const userColor = (id: string) => mockUsers.find((u) => u.id === id)?.color ?? '#64748B'

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
  onItemClick: (item: ActionItem) => void
}

const statusLabelMap: Record<ActionItem['status'], { text: string; className: string }> = {
  todo: { text: '待办', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  in_progress: { text: '进行中', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  done: { text: '已完成', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, status, items, badgeVariant, onDrop, onToggleCheck, onItemClick }) => {
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
        'rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4 transition-colors',
        isOver && 'border-[var(--color-primary)] bg-primary/5',
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-base font-semibold text-[var(--text-primary)]">{title}</h4>
        <Badge variant={badgeVariant} size="sm">
          {items.length}
        </Badge>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto min-h-[80px]">
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            {status === 'todo' ? '暂无待办事项' : status === 'in_progress' ? '暂无进行中' : '暂无已完成'}
          </p>
        )}
        {items.map((item) => {
          const statusInfo = statusLabelMap[item.status]
          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', item.id)
                e.dataTransfer.effectAllowed = 'move'
              }}
              className={cn(
                'cursor-grab rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 transition-all active:cursor-grabbing',
                'hover:shadow-custom-sm hover:border-[var(--color-primary)]/30 hover:bg-[var(--bg-primary)]/80',
              )}
            >
              <div className="flex items-start gap-2">
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
                <p
                  className={cn(
                    'flex-1 text-base leading-snug line-clamp-2 cursor-pointer transition-colors hover:text-[var(--color-primary)]',
                    item.status === 'done' && 'text-[var(--text-muted)] line-through',
                  )}
                  onClick={() => onItemClick(item)}
                >
                  {item.content}
                </p>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    statusInfo.className,
                  )}
                >
                  {statusInfo.text}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Avatar name={userName(item.assignee)} size="sm" />
                  <span className="text-xs text-[var(--text-muted)]">{userName(item.assignee)}</span>
                </div>
                {item.evidenceId && (
                  <button className="text-xs text-[var(--color-primary)] hover:underline">
                    查看转写证据 #{item.evidenceId.replace('t', '')}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */
export default function MeetingReview() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const navigate = useNavigate()
  const storeMeetings = useMeetingStore((s) => s.meetings)
  const meeting = storeMeetings.find((m) => m.id === meetingId)

  /* ── API state ── */
  const [summary, setSummary] = useState<any>(null)
  const [actionItems, setActionItems] = useState<any[]>([])
  const [transcriptsSegment, setTranscriptsSegment] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  /* ── fetch data ── */
  useEffect(() => {
    const fetchData = async () => {
      if (!meetingId) return
      setLoading(true)
      setError('')

      // 提前检查 token 是否存在，避免无 token 请求被 401 拦截跳转登录
      const token = useAuthStore.getState().token
      if (!token) {
        // 等待一帧让 persist 完成 rehydrate
        await new Promise((r) => setTimeout(r, 100))
        const retryToken = useAuthStore.getState().token
        if (!retryToken) {
          setError('登录已过期，请重新登录')
          setLoading(false)
          setTimeout(() => navigate('/login', { replace: true }), 1500)
          return
        }
      }

      try {
        // 1. 先尝试获取已有摘要
        let summaryData = await apiFetch(`/meetings/${meetingId}/summary`)
        
        // 2. 如果没有摘要，调用 AI 生成
        if (!summaryData || !summaryData.oneLineSummary) {
          setGenerating(true)
          try {
            await apiFetch(`/meetings/${meetingId}/generate-summary`, {
              method: 'POST',
            })
            // 重新获取
            summaryData = await apiFetch(`/meetings/${meetingId}/summary`)
          } catch (genErr: any) {
            setError('AI 生成摘要失败: ' + (genErr.message || '未知错误'))
          } finally {
            setGenerating(false)
          }
        }

        // 3. 获取行动项
        const itemsData = await apiFetch(`/meetings/${meetingId}/action-items`)

        // 4. 获取转写数据
        const transcriptData = await apiFetch(`/meetings/${meetingId}/transcripts`)

        setSummary(summaryData)
        setActionItems(itemsData)
        setTranscriptsSegment(Array.isArray(transcriptData) ? transcriptData : [])
      } catch (err: any) {
        // 区分 401 与其他错误
        const msg = err.message || ''
        if (msg.includes('登录已过期') || msg.includes('401')) {
          setError('登录已过期，请重新登录')
          setTimeout(() => navigate('/login', { replace: true }), 1500)
        } else {
          setError(err.message || '加载失败')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [meetingId, navigate])

  /* ---------- Player state ---------- */
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  /* ---------- Transcript state ---------- */
  const [editedEntries, setEditedEntries] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)

  /* ---------- Tag filter ---------- */
  const [activeTag, setActiveTag] = useState<string | null>(null)

  /* ---------- Kanban state ---------- */
  const [kanbanItems, setKanbanItems] = useState<ActionItem[]>([])

  // Sync kanbanItems when actionItems from API change
  useEffect(() => {
    setKanbanItems(actionItems.map((item: any) => ({
      id: item.id,
      meetingId: meetingId || '',
      content: item.description,
      assignee: item.assignee,
      status: item.status === 'open' ? 'todo' : item.status === 'in_progress' ? 'in_progress' : 'done',
      evidenceId: undefined,
      dueDate: item.dueDate,
    })))
  }, [actionItems, meetingId])

  /* ---------- AI Q&A state ---------- */
  const [qaInput, setQaInput] = useState('')

  /* ---------- Detail modal state ---------- */
  const [detailItem, setDetailItem] = useState<ActionItem | null>(null)

  /* ---------- Kanban tab state ---------- */
  const [activeTab, setActiveTab] = useState<string>('todo')

  /* ---------- Drag & Drop state ---------- */
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null)

  /* ---------- Kanban handlers ---------- */
  const handleKanbanDrop = useCallback((itemId: string, newStatus: ActionItem['status'], targetId?: string) => {
    setKanbanItems((prev) => {
      const sourceItem = prev.find((i) => i.id === itemId)
      if (!sourceItem) return prev

      // Same status → reorder within the group, insert at target position
      if (sourceItem.status === newStatus && targetId && targetId !== itemId) {
        const without = prev.filter((i) => i.id !== itemId)
        const insertAt = without.findIndex((i) => i.id === targetId)
        if (insertAt === -1) return prev
        const result = [...without]
        result.splice(insertAt, 0, sourceItem)
        return result
      }

      // Different status → change status
      if (sourceItem.status !== newStatus) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, status: newStatus } : item,
        )
      }

      // Same status but no target → no-op
      return prev
    })
    setDraggingItemId(null)
    setHoverTargetId(null)
  }, [])

  const handleToggleCheck = useCallback((itemId: string) => {
    setKanbanItems((prev) => {
      const item = prev.find((i) => i.id === itemId)
      if (!item) return prev
      const nextStatus = item.status === 'done' ? 'todo' : 'done'
      const updated = prev.map((i) =>
        i.id === itemId ? { ...i, status: nextStatus } : i,
      )

      // Persist to backend asynchronously
      apiFetch(`/meetings/${meetingId}/action-items/${itemId}`, {
        method: 'PATCH',
        body: { status: nextStatus },
      }).catch(() => {
        // Rollback on failure
        setKanbanItems(prev)
      })

      return updated
    })
  }, [meetingId])

  /* ---------- Kanban cards render helper ---------- */
  const renderKanbanCards = useCallback((items: ActionItem[], status: ActionItem['status']) => {
    if (items.length === 0) {
      return (
        <div className="flex w-full items-center justify-center py-12">
          <p className="text-sm text-[var(--text-muted)]">
            {status === 'todo' ? '暂无待办事项' : status === 'in_progress' ? '暂无进行中' : '暂无已完成'}
          </p>
        </div>
      )
    }
    return (
      <div
        className="flex w-full flex-col gap-3"
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
        onDrop={(e) => {
          e.preventDefault()
          const itemId = e.dataTransfer.getData('text/plain')
          if (itemId) handleKanbanDrop(itemId, status)
        }}
      >
        {items.map((item) => {
          const tagColor = item.status === 'todo' ? 'orange' : item.status === 'in_progress' ? 'blue' : 'green'
          const tagText = item.status === 'todo' ? '待办' : item.status === 'in_progress' ? '进行中' : '已完成'
          const isDragging = draggingItemId === item.id
          const isHoverTarget = hoverTargetId === item.id
          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', item.id)
                e.dataTransfer.effectAllowed = 'move'
                setDraggingItemId(item.id)
              }}
              onDragEnd={() => {
                setDraggingItemId(null)
                setHoverTargetId(null)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setHoverTargetId(item.id)
              }}
              onDragLeave={(e) => {
                // Only clear if leaving the card itself (not entering a child)
                const related = e.relatedTarget as Node | null
                if (!related || !e.currentTarget.contains(related)) {
                  setHoverTargetId(null)
                }
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const itemId = e.dataTransfer.getData('text/plain')
                if (itemId) handleKanbanDrop(itemId, status, item.id)
              }}
              className={cn(
                'w-full cursor-grab overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4 transition-all hover:shadow-sm hover:border-[var(--color-primary)]/30 active:cursor-grabbing',
                isDragging && 'opacity-40',
                isHoverTarget && '!border-[var(--color-primary)] !ring-2 !ring-[var(--color-primary)]/40',
              )}
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={() => handleToggleCheck(item.id)}
                  className={cn(
                    'mt-0.5 shrink-0 rounded p-0.5 transition-colors',
                    item.status === 'done'
                      ? 'text-[var(--color-success)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  )}
                >
                  <CheckSquare className="h-4 w-4" />
                </button>
                <Paragraph
                  ellipsis={{ rows: 2 }}
                  className="!mb-0 min-w-0 flex-1 cursor-pointer transition-colors hover:text-[var(--color-primary)]"
                  onClick={() => setDetailItem(item)}
                  style={{
                    color: item.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: item.status === 'done' ? 'line-through' : 'none',
                    wordBreak: 'break-all',
                    overflowWrap: 'break-word',
                  }}
                >
                  {item.content}
                </Paragraph>
                <Tag color={tagColor} className="shrink-0 !mt-0.5">{tagText}</Tag>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Avatar name={userName(item.assignee)} size="sm" />
                  <span className="text-xs text-[var(--text-muted)]">{userName(item.assignee)}</span>
                </div>
                {item.evidenceId && (
                  <button className="text-xs text-[var(--color-primary)] hover:underline">
                    查看转写证据 #{item.evidenceId.replace('t', '')}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }, [handleKanbanDrop, handleToggleCheck, draggingItemId, hoverTargetId, setDraggingItemId, setHoverTargetId])

  /* ========== Derived data ========== */

  // Parse detailedSummary markdown into sections
  const segments = useMemo(() => {
    if (!summary?.detailedSummary) return []
    try {
      const lines = summary.detailedSummary.split('\n')
      const sections: { title: string; time: string; text: string }[] = []
      let currentTitle = ''
      let currentText: string[] = []
      for (const line of lines) {
        if (line.startsWith('## ')) {
          if (currentTitle) {
            sections.push({ title: currentTitle, time: '', text: currentText.join('\n').trim() })
          }
          currentTitle = line.replace('## ', '').trim()
          currentText = []
        } else if (line.trim()) {
          currentText.push(line.trim())
        }
      }
      if (currentTitle) {
        sections.push({ title: currentTitle, time: '', text: currentText.join('\n').trim() })
      }
      return sections
    } catch {
      return []
    }
  }, [summary])

  const decisions = summary?.keyDecisions || []
  const keywords = summary?.keywords || []
  const transcript: TranscriptEntry[] = transcriptsSegment
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
  }

  const jumpToEntry = useCallback(
    (entry: TranscriptEntry) => {
      setActiveEntryId(entry.id)
    },
    [],
  )

  const handleSaveEdit = useCallback((entryId: string, text: string) => {
    setEditedEntries((prev) => ({ ...prev, [entryId]: text }))
    setEditingId(null)
  }, [])

  const handleSendQa = useCallback(() => {
    if (!qaInput.trim()) return
    setQaInput('')
  }, [qaInput])

  /* ========== Loading / Error states ========== */

  if (loading || !meeting || generating) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {!meeting && meetingId ? (
          <div className="text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-[var(--text-muted)]" />
            <p className="text-lg font-medium text-[var(--text-primary)]">未找到会议</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">ID: {meetingId} 的会议不存在</p>
          </div>
        ) : (
          <div className="w-full max-w-lg space-y-4 text-center">
            {generating && (
              <div className="mb-4 flex flex-col items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-[var(--color-primary)]">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span>AI 正在生成会议摘要...</span>
                </div>
              </div>
            )}
            <Skeleton variant="card" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-red-400" />
          <p className="text-lg font-medium text-red-500">加载失败</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{error}</p>
          <Button
            variant="primary"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            重新加载
          </Button>
        </div>
      </div>
    )
  }

  // 参会人：优先使用后端返回的完整 participants，兜底用 mockUsers
  const rawParticipants = (meeting as any).participants as
    | { user: { id: string; name: string; email: string }; role: string; isSpeaker: boolean }[]
    | undefined
  const hasRealParticipants = rawParticipants && rawParticipants.length > 0
  const attendeeUsers = hasRealParticipants
    ? rawParticipants.map((p) => ({ name: p.user.name }))
    : meeting.attendees.map((aid) => ({ name: mockUsers.find((u) => u.id === aid)?.name ?? '成员' }))

  const allCompleted = kanbanStats.done + kanbanStats.in_progress + kanbanStats.todo

  /* ========== Render ========== */
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-7">
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
                    {attendeeUsers.length > 0 ? (
                      <AvatarGroup users={attendeeUsers} max={5} size="sm" />
                    ) : (
                      <span className="text-sm text-[var(--text-muted)]">暂无参会人</span>
                    )}
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
                  <button className="gradient-btn inline-flex items-center gap-2" disabled>
                    <Headphones className="h-4 w-4" />
                    真实录音回放将在音频存储功能上线后开放
                  </button>
                  <Button
                    variant="secondary"
                    icon={<FileDown className="h-4 w-4" />}
                    onClick={() => exportWord(meeting, summary, actionItems)}
                  >
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
            className="space-y-4 md:col-span-2 lg:col-span-3"
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
                        <span className="text-base font-medium text-[var(--text-primary)]">{seg.title}</span>
                        <Badge variant="info" size="sm">
                          {seg.time}
                        </Badge>
                      </div>
                      <p className="text-base leading-relaxed text-[var(--text-secondary)]">{seg.text}</p>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>

            {/* 关键词 */}
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex items-center gap-2">
                <TagIcon className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">关键词</h3>
              </div>
              <Card className="!p-4">
                {keywords.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">暂无关键词</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((word: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setActiveTag(activeTag === word ? null : word)}
                        className={cn(
                          'rounded-full border font-medium transition-all text-xs px-2.5 py-1',
                          activeTag === word
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                            : 'border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
                        )}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
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
                  {decisions.map((d: string, i: number) => (
                    <Card key={i} className="!flex !items-start !gap-3 !p-4">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[10px] font-bold text-[var(--color-primary)]">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base leading-snug text-[var(--text-primary)]">{d}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* ========== CENTER COLUMN — 转写回放 ========== */}
          <motion.div
            className="space-y-4 lg:col-span-2"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {/* Audio player - placeholder */}
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex items-center gap-2">
                <Headphones className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">录音回放</h3>
              </div>
              <Card className="!rounded-lg !p-8 text-center">
                <Headphones className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-secondary)]">
                  真实录音回放将在音频存储功能上线后开放
                </p>
              </Card>
            </motion.div>

            {/* Transcript */}
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[var(--color-primary)]" />
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">转写文本</h3>
                  {transcriptsSegment.length > 0 && (
                    <span className="text-xs text-[var(--text-muted)]">{transcriptsSegment.length} 条</span>
                  )}
                </div>
              </div>

              <Card className="!p-0">
                {transcriptsSegment.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="mx-auto mb-2 h-8 w-8 text-[var(--text-muted)]" />
                    <p className="text-sm text-[var(--text-secondary)]">
                      转写内容将在接入实时转写后展示
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      届时将支持查看完整的会议记录和时间轴
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-color)] max-h-[500px] overflow-y-auto">
                    {transcriptsSegment.map((seg: any, idx: number) => (
                      <div key={seg.id || idx} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-[var(--color-primary)]">{seg.speakerLabel || 'Speaker'}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {seg.startTimeMs ? new Date(seg.startTimeMs).toISOString().substr(14, 5) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)] leading-relaxed">{seg.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </motion.div>

          {/* ========== RIGHT COLUMN ========== */}
          <motion.div
            className="space-y-4 lg:col-span-2"
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
                  <CheckSquare className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-secondary)]">暂无待办事项</p>
                </Card>
              ) : (
                <>
                  <style>{`
                    .kanban-tabs .ant-tabs-nav::before { border-bottom: none !important; }
                    .kanban-tabs .ant-tabs-nav-list { width: 100% !important; display: flex !important; }
                    .kanban-tabs .ant-tabs-tab {
                      flex: 1 !important;
                      justify-content: center !important;
                      margin: 0 !important;
                      background: #1e293b !important;
                      color: #ffffff !important;
                      border-radius: 0 !important;
                      border: none !important;
                      transition: background 0.2s !important;
                    }
                    .kanban-tabs .ant-tabs-tab:first-child { border-radius: 6px 0 0 6px !important; }
                    .kanban-tabs .ant-tabs-tab:last-child { border-radius: 0 6px 6px 0 !important; }
                    .kanban-tabs .ant-tabs-tab-active { background: #6366f1 !important; }
                    .kanban-tabs .ant-tabs-tab-btn {
                      color: #ffffff !important;
                      width: 100% !important;
                      text-align: center !important;
                      font-size: 13px !important;
                    }
                    .kanban-tabs .ant-tabs-tab:hover .ant-tabs-tab-btn { color: #ffffff !important; }
                    .kanban-tabs .ant-tabs-content-holder { padding-top: 12px !important; }
                    .kanban-tabs .ant-tabs-ink-bar { display: none !important; }
                  `}</style>
                  <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    className="kanban-tabs w-full"
                    items={[
                      { key: 'todo', label: `待办 (${todoItems.length})`, children: renderKanbanCards(todoItems, 'todo') },
                      { key: 'in_progress', label: `进行中 (${inProgressItems.length})`, children: renderKanbanCards(inProgressItems, 'in_progress') },
                      { key: 'done', label: `已完成 (${doneItems.length})`, children: renderKanbanCards(doneItems, 'done') },
                    ]}
                  />
                </>
              )}
            </motion.div>

            {/* 附件列表 */}
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">附件列表</h3>
              </div>
              <Card className="!p-0 divide-y divide-[var(--border-color)]">
                <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                  <Paperclip className="h-8 w-8 text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-muted)]">暂无附件</p>
                </div>
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
                    <p className="text-base text-[var(--text-primary)]">本次会议的主要结论是什么？</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-gradient-start)] to-[var(--color-gradient-end)]">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-base leading-relaxed text-[var(--text-secondary)]">
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

        {/* 行动项详情弹窗 */}
        <Modal
          isOpen={!!detailItem}
          onClose={() => setDetailItem(null)}
          title="行动项详情"
          size="md"
        >
          {detailItem && (() => {
            const info = statusLabelMap[detailItem.status]
            return (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{detailItem.content}</p>
                <div className="flex flex-wrap gap-4 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
                    负责人：
                    <span className="font-medium text-[var(--text-primary)]">{detailItem.assignee || '未分配'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
                    状态：
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', info.className)}>
                      {info.text}
                    </span>
                  </span>
                  {detailItem.dueDate && (
                    <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
                      截止日期：
                      <span className="font-medium text-[var(--text-primary)]">
                        {new Date(detailItem.dueDate).toLocaleDateString('zh-CN')}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )
          })()}
        </Modal>
      </div>
    </div>
  )
}