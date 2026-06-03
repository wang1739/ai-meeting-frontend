import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Search,
  Command,
  FileText,
  MessageSquare,
  CheckSquare,
  Calendar,
  ArrowRight,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react'
import type { Meeting, TranscriptEntry, ActionItem } from '@/data/mockData'
import { mockMeetings, mockActionItems, mockUsers } from '@/data/mockData'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

interface SearchPageProps {
  isOpen?: boolean
  onClose?: () => void
}

interface SearchResults {
  meetings: Meeting[]
  transcripts: Array<{ entry: TranscriptEntry; meeting: Meeting }>
  actionItems: ActionItem[]
}

const statusBadgeMap: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  ongoing: 'success',
  scheduled: 'info',
  completed: 'default',
  cancelled: 'danger',
}

const actionStatusBadgeMap: Record<string, 'success' | 'warning' | 'default'> = {
  done: 'success',
  in_progress: 'warning',
  todo: 'default',
}

const popularSearches = [
  '性能优化',
  '代码审查',
  '发布计划',
  '自动化测试',
  'Q2复盘',
  '需求评审',
  '语义搜索',
  '移动端适配',
]

function getMeetingById(id: string): Meeting | undefined {
  return mockMeetings.find((m) => m.id === id)
}

function getUserName(userId: string): string {
  const user = mockUsers.find((u) => u.id === userId)
  return user?.name ?? userId
}

function searchAll(query: string): SearchResults {
  const q = query.toLowerCase().trim()
  if (!q) return { meetings: [], transcripts: [], actionItems: [] }

  // Search meetings by title
  const meetings = mockMeetings.filter((m) => m.title.toLowerCase().includes(q))

  // Search transcripts
  const transcripts: Array<{ entry: TranscriptEntry; meeting: Meeting }> = []
  for (const meeting of mockMeetings) {
    if (meeting.transcript) {
      for (const entry of meeting.transcript) {
        if (entry.text.toLowerCase().includes(q)) {
          transcripts.push({ entry, meeting })
        }
      }
    }
  }

  // Search action items
  const actionItems = mockActionItems.filter(
    (a) =>
      a.content.toLowerCase().includes(q) ||
      getUserName(a.assignee).toLowerCase().includes(q),
  )

  return { meetings, transcripts, actionItems }
}

function generateAISummary(query: string, results: SearchResults): string[] {
  if (!query.trim() || (results.meetings.length === 0 && results.transcripts.length === 0 && results.actionItems.length === 0)) {
    return []
  }
  const bullets: string[] = []
  if (results.meetings.length > 0) {
    bullets.push(`共找到 ${results.meetings.length} 场相关会议，主要集中在"${results.meetings[0].title}"`)
  }
  if (results.transcripts.length > 0) {
    const speakers = new Set(results.transcripts.map((t) => t.entry.userId))
    bullets.push(`涉及 ${speakers.size} 位参与者的 ${results.transcripts.length} 条相关讨论片段`)
  }
  if (results.actionItems.length > 0) {
    const pending = results.actionItems.filter((a) => a.status !== 'done').length
    bullets.push(`包含 ${results.actionItems.length} 个行动项，其中 ${pending} 项待完成`)
  }
  return bullets
}

export default function SearchPage({ isOpen = true, onClose = () => {} }: SearchPageProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({
    meetings: [],
    transcripts: [],
    actionItems: [],
  })
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClose = useCallback(() => {
    onClose()
    navigate(-1)
  }, [onClose, navigate])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults({ meetings: [], transcripts: [], actionItems: [] })
    }
  }, [isOpen])

  useEffect(() => {
    const timer = setTimeout(() => {
      setResults(searchAll(query))
    }, 80)
    return () => clearTimeout(timer)
  }, [query])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    },
    [handleClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  const handleChipClick = (term: string) => {
    setQuery(term)
  }

  const totalResults = results.meetings.length + results.transcripts.length + results.actionItems.length
  const hasQuery = query.trim().length > 0
  const aiBullets = generateAISummary(query, results)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-2xl mx-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-custom-lg overflow-hidden"
            initial={{ opacity: 0, scale: 0.92, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Search input area */}
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] px-5 py-4">
              <Search className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索会议、转写内容、行动项..."
                className="flex-1 bg-transparent text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-[11px] text-[var(--text-muted)]">
                <Command className="h-3 w-3" />
                <span>K</span>
              </kbd>
            </div>

            {/* Results or empty state */}
            <div className="max-h-[60vh] overflow-y-auto">
              {!hasQuery ? (
                // Empty state: recent / popular searches
                <div className="px-5 py-6">
                  <p className="mb-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    热门搜索
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleChipClick(term)}
                        className="rounded-full border border-[var(--border-color)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : totalResults === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                  <Search className="mb-3 h-10 w-10 text-[var(--text-muted)] opacity-50" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    没有找到相关结果
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    试试其他关键词
                  </p>
                </div>
              ) : (
                <div className="px-5 py-4 space-y-5">
                  {/* AI Summary */}
                  {aiBullets.length > 0 && (
                    <Card variant="glow" className="!p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="mb-2 text-xs font-semibold text-primary">
                            AI 总结
                          </p>
                          <p className="mb-2 text-sm text-[var(--text-secondary)]">
                            根据搜索结果，AI 发现以下关联：
                          </p>
                          <ul className="space-y-1.5">
                            {aiBullets.map((bullet, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Meetings group */}
                  {results.meetings.length > 0 && (
                    <div>
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        <FileText className="h-3.5 w-3.5" />
                        会议 ({results.meetings.length})
                      </h3>
                      <div className="space-y-1">
                        {results.meetings.map((meeting) => (
                          <button
                            key={meeting.id}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                            onClick={() => {
                              // Navigate to meeting review
                              handleClose()
                            }}
                          >
                            <Calendar className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {meeting.title}
                              </p>
                              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                {new Date(meeting.startTime).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                            <Badge
                              variant={statusBadgeMap[meeting.status] ?? 'default'}
                              size="sm"
                            >
                              {meeting.status === 'ongoing'
                                ? '进行中'
                                : meeting.status === 'scheduled'
                                  ? '已安排'
                                  : meeting.status === 'completed'
                                    ? '已完成'
                                    : '已取消'}
                            </Badge>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transcripts group */}
                  {results.transcripts.length > 0 && (
                    <div>
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        <MessageSquare className="h-3.5 w-3.5" />
                        转写片段 ({results.transcripts.length})
                      </h3>
                      <div className="space-y-1">
                        {results.transcripts.map(({ entry, meeting }) => (
                          <button
                            key={entry.id}
                            className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                            onClick={() => {
                              handleClose()
                            }}
                          >
                            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-primary">
                                {getUserName(entry.userId)}
                              </p>
                              <p className="mt-0.5 text-sm text-[var(--text-secondary)] line-clamp-2">
                                {entry.text}
                              </p>
                              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                来自会议：{meeting.title}
                              </p>
                            </div>
                            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action items group */}
                  {results.actionItems.length > 0 && (
                    <div>
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        <CheckSquare className="h-3.5 w-3.5" />
                        行动项 ({results.actionItems.length})
                      </h3>
                      <div className="space-y-1">
                        {results.actionItems.map((item) => {
                          const meeting = getMeetingById(item.meetingId)
                          return (
                            <button
                              key={item.id}
                              className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                              onClick={() => {
                                handleClose()
                              }}
                            >
                              <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                                  {item.content}
                                </p>
                                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                  负责人：{getUserName(item.assignee)}
                                  {meeting && ` · 来自：${meeting.title}`}
                                </p>
                              </div>
                              <Badge
                                variant={actionStatusBadgeMap[item.status] ?? 'default'}
                                size="sm"
                              >
                                {item.status === 'done'
                                  ? '已完成'
                                  : item.status === 'in_progress'
                                    ? '进行中'
                                    : '待办'}
                              </Badge>
                              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between border-t border-[var(--border-color)] px-5 py-2.5">
              <span className="text-xs text-[var(--text-muted)]">
                {hasQuery && totalResults > 0
                  ? `${totalResults} 个结果`
                  : '输入关键词开始搜索'}
              </span>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" /> 选择
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-[var(--border-color)] px-1 py-0.5 text-[10px]">
                    ESC
                  </kbd>{' '}
                  关闭
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}