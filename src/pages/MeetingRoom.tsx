import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMeetingStore } from '@/stores/meetingStore'
import { useAuthStore } from '@/stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { mockMeetings, mockUsers, type TranscriptEntry, type User } from '@/data/mockData'
import { cancelReminder } from '@/utils/meetingReminder'
import { apiFetch } from '@/lib/api'
import {
  Mic, MicOff, Video, VideoOff, MessageSquare, Share2, LogOut,
  Circle, Clock, Bot, Sparkles, Bookmark, ChevronRight, ChevronLeft,
  PanelRightClose, PanelRightOpen, Download, FileText, PenLine,
  PictureInPicture, Radio, Wifi, Activity, Smile, Volume2,
} from 'lucide-react'

const mockAiResponses = [
  '根据会议内容，我建议将"用户体验优化"列为Q2最高优先级。',
  '已检测到讨论中提到了3个关键风险点，建议记录到行动项。',
  '当前讨论与预设议程偏离，是否需要引导回主线？',
  '我注意到团队对AI模块的时间线有不同理解，建议统一确认。',
]

const mockNotifications = [
  '检测到讨论偏离议程',
  '识别到潜在风险：资源分配不足',
  '建议记录：用户反馈数据需要进一步分析',
  '检测到关键决策点：路线图优先级调整',
]

/* ──────────── Helper: highlight keywords ──────────── */
function highlightKeywords(text: string): React.ReactNode[] {
  const keywords = ['路线图', 'AI', '产品', '用户']
  const pattern = new RegExp(`(${keywords.join('|')})`, 'g')
  const parts = text.split(pattern)
  return parts.map((part, i) =>
    keywords.includes(part)
      ? <span key={i} className="bg-yellow-200/60 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-200 px-0.5 rounded font-medium">{part}</span>
      : part,
  )
}

/* ──────────── Sub: VU Meter ──────────── */
const VUMeter: React.FC = () => {
  const bars = 6
  const [levels, setLevels] = useState<number[]>(Array(bars).fill(0.2))
  useEffect(() => {
    const interval = setInterval(() => {
      setLevels(Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2))
    }, 200)
    return () => clearInterval(interval)
  }, [bars])
  return (
    <div className="flex items-end gap-[3px] h-5">
      {levels.map((l, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] transition-all duration-150"
          style={{ height: `${l * 100}%`, opacity: 0.4 + l * 0.6 }}
        />
      ))}
    </div>
  )
}

/* ──────────── Sub: Voice-wave avatar ──────────── */
const VoiceAvatar: React.FC<{ name: string }> = ({ name }) => {
  return (
    <div className="relative flex items-center justify-center">
      <motion.span
        className="absolute inset-0 rounded-full"
        animate={{ boxShadow: ['0 0 0 0 rgba(79,70,229,0.3)', '0 0 0 6px rgba(79,70,229,0)'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <Avatar name={name} size="sm" />
    </div>
  )
}

/* ──────────── Sub: Transcript Bubble ──────────── */
interface BubbleProps {
  entry: TranscriptEntry
  user: User
  isBookmarked: boolean
  onToggleBookmark: (id: string) => void
}

const TranscriptBubble: React.FC<BubbleProps> = ({ entry, user, isBookmarked, onToggleBookmark }) => {
  const isSelf = user.id === 'u1'
  const time = new Date(entry.timestamp * 1000).toISOString().substring(14, 19)
  const bgColor = isSelf ? 'bg-[var(--bg-card)]' : 'bg-blue-50/70 dark:bg-blue-900/10'
  const borderColor = isSelf ? 'border-[var(--border-color)]' : 'border-blue-100 dark:border-blue-800/20'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('flex gap-3 group', isSelf ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-1">
        <Avatar name={user.name} size="sm" />
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[70%]', isSelf ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-[var(--text-secondary)]">{user.name}</span>
          <span className="text-xs text-[var(--text-muted)]">{time}</span>
        </div>
        <div
          className={cn(
            'relative rounded-[12px] px-4 py-2.5 border shadow-sm',
            bgColor,
            borderColor,
          )}
        >
          {/* Tail triangle */}
          <div
            className={cn(
              'absolute top-3 w-0 h-0 border-4 border-transparent',
              isSelf
                ? 'right-[-6px] border-l-[var(--border-color)]'
                : 'left-[-6px] border-r-[var(--border-color)]',
            )}
          />
          <p className="text-base text-[var(--text-primary)] leading-relaxed" style={{ lineHeight: 1.6 }}>
            {highlightKeywords(entry.text)}
          </p>
          {entry.translatedText && (
            <p className="mt-1.5 text-xs text-[var(--text-muted)] border-t border-[var(--border-color)] pt-1.5">
              🌐 {entry.translatedText}
            </p>
          )}
        </div>
        {/* Toolbar */}
        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleBookmark(entry.id)}
            className={cn(
              'p-1 rounded transition-colors',
              isBookmarked
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            )}
          >
            <Bookmark className={cn('h-3.5 w-3.5', isBookmarked && 'fill-current')} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ──────────── Sub: Agenda Progress ──────────── */
const milestones = [
  { label: '开场', time: '3min', done: true },
  { label: '需求评审', time: '15min', done: true },
  { label: 'AI讨论', time: '10min', done: false },
  { label: '总结', time: '5min', done: false },
]

const AgendaProgress: React.FC = () => (
  <div className="space-y-2">
    <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">议程进度</h4>
    <div className="relative pl-5">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-1 bottom-1 w-[2px] bg-[var(--border-color)] rounded-full" />
      {milestones.map((m, i) => (
        <div key={i} className="relative flex items-center gap-3 pb-3 last:pb-0">
          <div
            className={cn(
              'absolute left-[-14px] w-[16px] h-[16px] rounded-full border-2 flex items-center justify-center z-10',
              m.done
                ? 'border-[var(--color-gradient-start)] bg-[var(--color-gradient-start)]'
                : 'border-[var(--border-color)] bg-[var(--bg-card)]',
            )}
          >
            {m.done && <div className="w-[6px] h-[6px] rounded-full bg-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <span className={cn('text-xs font-medium', m.done ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>
                {m.label}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">{m.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

/* ──────────── Sub: Bookmarks Timeline ──────────── */
const BookmarksTimeline: React.FC<{ bookmarks: { id: string; text: string; timestamp: number }[] }> = ({ bookmarks }) => (
  <div className="space-y-2">
    <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">书签时间线</h4>
    {bookmarks.length === 0 ? (
      <p className="text-[11px] text-[var(--text-muted)]">暂无书签</p>
    ) : (
      <div className="space-y-1.5">
        {bookmarks.map((bm) => (
          <div key={bm.id} className="flex gap-2 text-xs p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <span className="shrink-0 text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
              {new Date(bm.timestamp * 1000).toISOString().substring(14, 19)}
            </span>
            <span className="text-[var(--text-secondary)] line-clamp-2">{bm.text}</span>
          </div>
        ))}
      </div>
    )}
  </div>
)

/* ──────────── Sub: Attendees List ──────────── */
const AttendeesList: React.FC<{ userIds: string[] }> = ({ userIds }) => (
  <div className="space-y-2">
    <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">参会者</h4>
    <div className="space-y-1.5">
      {userIds.map((uid) => {
        const user = mockUsers.find((u) => u.id === uid)
        if (!user) return null
        return (
          <div key={uid} className="flex items-center gap-2 py-1">
            <div className="relative">
              <Avatar name={user.name} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-[var(--bg-card)]" />
            </div>
            <span className="text-xs text-[var(--text-primary)]">{user.name}</span>
            <Badge variant="success" size="sm" dot className="ml-auto">在线</Badge>
          </div>
        )
      })}
    </div>
  </div>
)

/* ──────────── Sub: Whiteboard Canvas ──────────── */
type DrawTool = 'pen' | 'eraser' | 'rectangle' | 'circle'

const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<DrawTool>('pen')
  const [isDrawing, setIsDrawing] = useState(false)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const c = canvas.getContext('2d')
    if (!c) return
    c.strokeStyle = '#1E293B'
    c.lineWidth = 2
    c.lineCap = 'round'
    c.lineJoin = 'round'
    setCtx(c)
  }, [])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e)
    startRef.current = pos
    if (tool === 'pen' || tool === 'eraser') {
      setIsDrawing(true)
      ctx!.beginPath()
      ctx!.moveTo(pos.x, pos.y)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && tool !== 'rectangle' && tool !== 'circle') return
    const pos = getPos(e)
    if (tool === 'pen') {
      ctx!.lineTo(pos.x, pos.y)
      ctx!.stroke()
    } else if (tool === 'eraser') {
      ctx!.clearRect(pos.x - 8, pos.y - 8, 16, 16)
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!startRef.current) return
    const pos = getPos(e)
    const start = startRef.current
    if (tool === 'rectangle') {
      ctx!.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y)
    } else if (tool === 'circle') {
      const rx = Math.abs(pos.x - start.x) / 2
      const ry = Math.abs(pos.y - start.y) / 2
      const cx = (start.x + pos.x) / 2
      const cy = (start.y + pos.y) / 2
      ctx!.beginPath()
      ctx!.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx!.stroke()
    }
    setIsDrawing(false)
    startRef.current = null
  }

  const clearCanvas = () => {
    if (!canvasRef.current || !ctx) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-[var(--border-color)] bg-[var(--bg-card)] rounded-t-md">
        {(['pen', 'eraser', 'rectangle', 'circle'] as DrawTool[]).map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={cn(
              'p-1.5 rounded text-xs transition-colors',
              tool === t
                ? 'bg-[var(--color-gradient-start)]/10 text-[var(--color-gradient-start)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800',
            )}
          >
            {t === 'pen' && <PenLine className="h-4 w-4" />}
            {t === 'eraser' && <span className="text-base leading-none">🧹</span>}
            {t === 'rectangle' && <span className="text-base leading-none">▭</span>}
            {t === 'circle' && <span className="text-base leading-none">○</span>}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={clearCanvas}>清空</Button>
          <Button variant="secondary" size="sm">
            <Sparkles className="h-3.5 w-3.5" />
            AI 识别
          </Button>
        </div>
      </div>
      {/* Canvas */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-b-md overflow-hidden">
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
        />
      </div>
    </div>
  )
}

/* ──────────── Sub: AI Notification Toast ──────────── */
interface AiNotification {
  id: number
  text: string
}

const AiNotificationToast: React.FC<{ notification: AiNotification; onDismiss: (id: number) => void }> = ({ notification, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
    className="ai-card px-3 py-2.5 flex items-start gap-2 cursor-pointer"
    onClick={() => onDismiss(notification.id)}
  >
    <Sparkles className="h-3.5 w-3.5 text-[var(--color-gradient-end)] shrink-0 mt-0.5" />
    <span className="text-xs text-[var(--text-secondary)] leading-relaxed">{notification.text}</span>
  </motion.div>
)

/* ──────────── Sub: AI Predefined Commands ──────────── */
const aiCommands = [
  { icon: Activity, label: '总结最近5分钟' },
  { icon: FileText, label: '列出数字与日期' },
  { icon: Share2, label: '追溯决策' },
  { icon: Circle, label: '识别风险' },
]

/* ──────────── Sub: Copy Invite Link Button ──────────── */
function CopyInviteLinkButton({ meetingId }: { meetingId: string }) {
  const [copied, setCopied] = useState(false)

  const copyLink = useCallback(() => {
    const link = `${window.location.origin}/meeting/${meetingId}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [meetingId])

  return (
    <Button
      variant="ghost"
      size="sm"
      icon={
        copied ? (
          <svg className="h-4 w-4 text-[var(--color-success)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        )
      }
      onClick={copyLink}
      title="复制邀请链接"
    >
      {copied ? '已复制' : '邀请'}
    </Button>
  )
}

/* ────────────────────────────────────────────────
   MAIN MEETING ROOM COMPONENT
   ──────────────────────────────────────────────── */
const MeetingRoom: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>()
  const navigate = useNavigate()
  const updateMeeting = useMeetingStore((s) => s.updateMeeting)
  
  /* State */
  const [meeting, setMeeting] = useState(mockMeetings[0])
  const [isLoading, setIsLoading] = useState(true)
  const [mode, setMode] = useState<'transcript' | 'notes' | 'whiteboard'>('transcript')
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(true)

  useEffect(() => {
    const fetchMeeting = async () => {
      if (!meetingId) return
      try {
        const data = await apiFetch(`/meetings/${meetingId}`)
        setMeeting(data)
      } catch (error) {
        console.error('获取会议信息失败:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMeeting()
  }, [meetingId])

  // ── Speech Recognition (Web Speech API) ──
  const currentUser = useAuthStore((s) => s.userInfo)
  const savedResultCountRef = useRef(0)

  const startRecognition = useCallback(() => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      setRecognitionStatus('error')
      setMicError('当前浏览器不支持语音识别，请使用 Chrome 或 Edge')
      return
    }

    // Stop previous instance if exists
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
    }

    setMicError('')
    setRecognitionStatus('listening')

    const recognition: any = new SpeechRecognitionCtor()
    recognition.lang = 'zh-CN'
    recognition.interimResults = true
    recognition.continuous = true

    shouldListenRef.current = true
    savedResultCountRef.current = 0

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (!transcript.trim()) continue
        const isFinal = event.results[i].isFinal
        const newEntry: TranscriptEntry = {
          id: `speech-${Date.now()}-${i}`,
          userId: currentUser?.id ?? 'unknown',
          text: transcript,
          timestamp: Math.floor(Date.now() / 1000),
        }
        // For interim results, replace the last non-final entry with the same id
        // For final results, always append
        setEntries((prev) => {
          if (!isFinal) {
            const withoutLastInterim = prev.filter((e) => !e.id.startsWith('interim-'))
            return [...withoutLastInterim, { ...newEntry, id: `interim-${Date.now()}` }]
          }
          const withoutInterims = prev.filter((e) => !e.id.startsWith('interim-'))
          return [...withoutInterims, newEntry]
        })

        // Save final results to backend (don't block UI)
        if (isFinal && meetingId) {
          if (i >= savedResultCountRef.current) {
            savedResultCountRef.current = i + 1
            const startTimeMs = Math.floor(Date.now() - 3000)
            const endTimeMs = Math.floor(Date.now())
            console.log('正在保存转写:', { text: transcript.slice(0, 40), meetingId })
            apiFetch(`/meetings/${meetingId}/transcripts`, {
                method: 'POST',
                body: JSON.stringify({
                  speakerLabel: currentUser?.name ?? 'Speaker',
                  text: transcript,
                  startTimeMs,
                  endTimeMs,
                  isFinal: true,
                }),
              }).then((res) => {
                console.log('[转写保存成功]', { text: transcript.slice(0, 40), response: res })
              }).catch((err) => {
                console.error('保存转写失败:', err)
              })
          }
        }
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        shouldListenRef.current = false
        setRecognitionStatus('error')
        setMicError('无法访问麦克风，请检查权限设置')
      } else if (event.error === 'no-speech') {
        // Ignore — happens when user is silent
      } else if (event.error === 'aborted') {
        if (shouldListenRef.current) {
          setRecognitionStatus('listening')
        } else {
          setRecognitionStatus('stopped')
        }
      } else {
        console.warn('Speech recognition error:', event.error)
      }
    }

    recognition.onend = () => {
      // Auto-restart only if shouldListenRef is still true
      if (shouldListenRef.current) {
        try {
          recognition.start()
        } catch {
          setRecognitionStatus('error')
          setMicError('语音识别自动重启失败，请点击"开始录音"重试')
        }
      } else {
        setRecognitionStatus('stopped')
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch (err) {
      shouldListenRef.current = false
      setRecognitionStatus('error')
      setMicError('无法启动语音识别：' + (err as Error).message)
    }
  }, [meetingId, currentUser])

  const stopRecognition = useCallback(() => {
    shouldListenRef.current = false
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
    }
    // Don't clear recognitionRef — let onend handle state cleanup
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false
      try { recognitionRef.current?.stop() } catch { /* ignore */ }
      recognitionRef.current = null
    }
  }, [])

  // Transcript entries
  const [entries, setEntries] = useState<TranscriptEntry[]>([])
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const transcriptRef = useRef<HTMLDivElement>(null!)
  const [translateLang, setTranslateLang] = useState('')

  // AI Panel chat
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string; time: string }[]>([])
  const [aiInput, setAiInput] = useState('')

  // Meeting chat (right panel)
  interface ChatMsg { id: string; userId: string; userName: string; content: string; createdAt: string }
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [rightTab, setRightTab] = useState<'ai' | 'chat'>('ai')
  const chatListRef = useRef<HTMLDivElement>(null!)

  // Load chat messages & poll every 3s
  useEffect(() => {
    if (!meetingId) return
    const load = async () => {
      try {
        const data = await apiFetch<ChatMsg[]>(`/meetings/${meetingId}/messages`)
        setChatMessages(data)
      } catch { /* ignore */ }
    }
    load()
    const iv = setInterval(load, 3000)
    return () => clearInterval(iv)
  }, [meetingId])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight
    }
  }, [chatMessages])

  const sendChatMessage = useCallback(async () => {
    const text = chatInput.trim()
    if (!text || !meetingId) return
    setChatInput('')
    try {
      await apiFetch(`/meetings/${meetingId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      })
    } catch { /* ignore */ }
  }, [chatInput, meetingId])

  // AI notifications
  const [notifications, setNotifications] = useState<AiNotification[]>([])
  const notifCounter = useRef(0)

  // Timer
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // End meeting modal
  const [showEndModal, setShowEndModal] = useState(false)

  // Audio source
  const [audioSource, setAudioSource] = useState('microphone')

  // Speech Recognition (Web Speech API)
  type RecognitionStatus = 'idle' | 'listening' | 'stopped' | 'error'
  const recognitionRef = useRef<any>(null)
  const shouldListenRef = useRef(false)
  const [recognitionStatus, setRecognitionStatus] = useState<RecognitionStatus>('idle')
  const [micError, setMicError] = useState('')

  // Notes editor
  const [notesContent, setNotesContent] = useState('')
  const notesRef = useRef<HTMLDivElement>(null!)
  const [acceptedCards, setAcceptedCards] = useState<Set<string>>(new Set())
  const [dismissedCards, setDismissedCards] = useState<Set<string>>(new Set())

  const aiCards = [
    { id: 'points', title: '讨论要点', content: '1. Q2产品路线图优先级调整\n2. AI功能模块资源评估\n3. 用户体验优化方案' },
    { id: 'actions', title: '行动项建议', content: '• 张明: 整理路线图优先级文档\n• 李华: AI模块可行性评估\n• 王芳: 用户反馈数据汇总' },
    { id: 'decisions', title: '决议记录', content: '• Q2主攻用户体验优化\n• AI模块6月底交付V1\n• 每周同步会改为周二' },
  ]

  /* ── Auto scroll transcript ── */
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [entries])

  /* ── Timer ── */
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  /* ── AI notifications ── */
  useEffect(() => {
    const interval = setInterval(() => {
      const text = mockNotifications[notifCounter.current % mockNotifications.length]
      const id = notifCounter.current
      notifCounter.current += 1
      setNotifications((prev) => [...prev.slice(-2), { id, text }])
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, 6000)
    }, 12000)
    return () => clearInterval(interval)
  }, [])

  /* ── Format timer ── */
  const formatTime = (s: number): string => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  /* ── Bookmarks ── */
  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const bookmarks = entries
    .filter((e) => bookmarkedIds.has(e.id))
    .map((e) => ({ id: e.id, text: e.text, timestamp: e.timestamp }))

  /* ── AI chat ── */
  const sendAiMessage = useCallback(() => {
    if (!aiInput.trim()) return
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    setAiMessages((prev) => [...prev, { role: 'user', text: aiInput.trim(), time }])
    setAiInput('')
    // Simulate AI response
    setTimeout(() => {
      const resp = mockAiResponses[Math.floor(Math.random() * mockAiResponses.length)]
      const t = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      setAiMessages((prev) => [...prev, { role: 'ai', text: resp, time: t }])
    }, 1000 + Math.random() * 1000)
  }, [aiInput])

  /* ── Notes: accept/dismiss card ── */
  const acceptCard = (id: string, content: string) => {
    setAcceptedCards((prev) => new Set(prev).add(id))
    if (notesRef.current) {
      notesRef.current.focus()
      document.execCommand('insertText', false, `\n${content}\n`)
    }
  }

  const dismissCard = (id: string) => {
    setDismissedCards((prev) => new Set(prev).add(id))
  }

  /* ── Meeting end ── */
  const handleEndMeeting = () => {
    setShowEndModal(true)
  }

  /* ── Render ── */
  const transcriptContent = (
    <div className="flex flex-col h-full">
      {/* Status + Control bar */}
      <div className="shrink-0 flex items-center justify-between px-6 py-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          {/* Status dot */}
          <span className="relative flex h-2.5 w-2.5">
            {recognitionStatus === 'listening' && (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </>
            )}
            {recognitionStatus === 'idle' && (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-400" />
            )}
            {recognitionStatus === 'stopped' && (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500" />
            )}
            {recognitionStatus === 'error' && (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            )}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {recognitionStatus === 'idle' && '麦克风已就绪，等待开始录音'}
            {recognitionStatus === 'listening' && '正在聆听...'}
            {recognitionStatus === 'stopped' && '录音已停止'}
            {recognitionStatus === 'error' && micError || '麦克风不可用'}
          </span>
          {micError && recognitionStatus === 'error' && (
            <span className="text-xs text-red-500 ml-1">{micError}</span>
          )}
        </div>
        <div>
          {recognitionStatus === 'listening' ? (
            <button
              onClick={stopRecognition}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <MicOff className="h-3.5 w-3.5" />
              停止录音
            </button>
          ) : (
            <button
              onClick={startRecognition}
              disabled={recognitionStatus === 'error' && micError.includes('不支持')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Mic className="h-3.5 w-3.5" />
              开始录音
            </button>
          )}
        </div>
      </div>

      {/* Transcript bubbles */}
      <div
        ref={transcriptRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {entries.length === 0 ? (
          <div className="flex h-full min-h-[300px] items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]/50" />
              <p className="text-sm text-[var(--text-muted)]">暂无发言内容</p>
            </div>
          </div>
        ) : (
          entries.map((entry) => {
            const isSelf = entry.userId === currentUser?.id
            const displayName = isSelf ? (currentUser?.name ?? '我') : '参会者'
            return (
              <TranscriptBubble
                key={entry.id + (entry.id.startsWith('interim-') ? '-interim' : '')}
                entry={entry}
                user={{ id: entry.userId, name: displayName } as any}
                isBookmarked={bookmarkedIds.has(entry.id)}
                onToggleBookmark={toggleBookmark}
              />
            )
          })
        )}
      </div>
      {/* Floating control bar */}
      <div className="sticky bottom-0 left-0 right-0 border-t border-[var(--border-color)] bg-[var(--bg-card)]/90 backdrop-blur-sm px-4 py-2 flex items-center gap-3">
        <Button variant="secondary" size="sm" icon={<Bookmark className="h-3.5 w-3.5" />}>
          添加书签
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[var(--text-muted)]">翻译为</span>
          <select
            value={translateLang}
            onChange={(e) => setTranslateLang(e.target.value)}
            className="text-xs border border-[var(--border-color)] rounded-[6px] px-2 py-1 bg-transparent text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          >
            <option value="">不翻译</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
        </div>
      </div>
    </div>
  )

  const notesContentArea = (
    <div className="flex flex-col h-full">
      {/* Editor */}
      <div className="flex-1 p-4 flex flex-col gap-4">
        <div
          ref={notesRef}
          contentEditable
          suppressContentEditableWarning
          className="flex-1 border border-[var(--border-color)] rounded-md p-4 text-sm leading-relaxed text-[var(--text-primary)] bg-[var(--bg-card)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--text-muted)]"
          data-placeholder="在此输入会议纪要..."
          onInput={(e) => setNotesContent((e.target as HTMLDivElement).innerText)}
          dangerouslySetInnerHTML={{ __html: notesContent }}
        />
        {/* Simulated colored cursors */}
        <div className="relative h-0">
          <div className="absolute top-[-60px] left-[20%] flex items-center gap-1 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-[10px] text-[#10B981] font-medium">LH</span>
          </div>
          <div className="absolute top-[-30px] left-[55%] flex items-center gap-1 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span className="text-[10px] text-[#F59E0B] font-medium">WF</span>
          </div>
          <div className="absolute top-[-80px] left-[70%] flex items-center gap-1 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <span className="text-[10px] text-[#8B5CF6] font-medium">CJ</span>
          </div>
        </div>
      </div>
      {/* AI Suggestion Cards */}
      <div className="border-t border-[var(--border-color)] px-4 py-3 bg-[var(--bg-card)]">
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="h-4 w-4 text-[var(--color-gradient-end)]" />
          <span className="text-xs font-semibold text-[var(--text-secondary)]">AI 建议</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {aiCards.map((card) => {
            if (dismissedCards.has(card.id)) return null
            const accepted = acceptedCards.has(card.id)
            return (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: accepted ? 0.5 : 1, y: 0 }}
                className={cn(
                  'ai-card p-3 rounded-md transition-all',
                  accepted && 'opacity-50 scale-[0.97]',
                )}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Badge variant="primary" size="sm" className="bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] text-white border-0">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                    AI
                  </Badge>
                  <span className="text-xs font-medium text-[var(--text-primary)]">{card.title}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line mb-2">{card.content}</p>
                <div className="flex gap-1.5">
                  {!accepted && (
                    <Button variant="primary" size="sm" className="!h-7 !px-2.5 !text-[10px]" onClick={() => acceptCard(card.id, card.content)}>
                      采纳
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="!h-7 !px-2.5 !text-[10px]" onClick={() => dismissCard(card.id)}>
                    {accepted ? '已采纳' : '忽略'}
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const whiteboardContent = (
    <div className="flex h-full">
      {/* Document preview */}
      <div className="w-1/3 border-r border-[var(--border-color)] p-3 space-y-3 overflow-y-auto">
        <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">会议材料</h4>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] p-4 flex flex-col items-center justify-center min-h-[120px]"
            >
              <FileText className="h-8 w-8 text-[var(--text-muted)] mb-1" />
              <span className="text-[10px] text-[var(--text-muted)]">第 {i} 页</span>
              <div className="w-full mt-2 space-y-1">
                <div className="skeleton h-2 w-3/4" />
                <div className="skeleton h-2 w-1/2" />
                <div className="skeleton h-2 w-5/6" />
              </div>
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" className="w-full" icon={<Download className="h-3.5 w-3.5" />}>
          下载全部材料
        </Button>
      </div>
      {/* Whiteboard */}
      <div className="flex-1 p-3">
        <div className="h-full flex flex-col rounded-md border border-[var(--border-color)] overflow-hidden bg-[var(--bg-card)]">
          <Whiteboard />
        </div>
      </div>
    </div>
  )

  const modeViews: Record<string, React.ReactNode> = {
    transcript: transcriptContent,
    notes: notesContentArea,
    whiteboard: whiteboardContent,
  }

  const modeTabs = [
    { key: 'transcript', label: '实时转写' },
    { key: 'notes', label: '协同纪要' },
    { key: 'whiteboard', label: '材料白板' },
  ] as const

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      {/* ─── 1. Top Control Bar ─── */}
      <header className="glass h-14 shrink-0 flex items-center justify-between px-4 border-b border-[var(--border-color)] z-30 relative">
        {/* Left */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse-dot" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">{meeting.title}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] font-mono">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(elapsed)}
          </div>
        </div>

        {/* Center */}
        <div className="flex items-center gap-6">
          {/* Audio source selector */}
          <select
            value={audioSource}
            onChange={(e) => setAudioSource(e.target.value)}
            className="text-xs border border-[var(--border-color)] rounded-[6px] px-2 py-1 bg-transparent text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          >
            <option value="microphone">麦克风 (AT2020)</option>
            <option value="system">系统音频</option>
            <option value="mixed">混合音源</option>
          </select>
          {/* VU Meter */}
          <VUMeter />
          {/* Voice-wave avatars */}
          <div className="flex items-center -space-x-1">
            {(meeting as any).participants?.length > 0
              ? (meeting as any).participants.map((p: { user: { name: string } }) => (
                  <VoiceAvatar key={p.user.name} name={p.user.name} />
                ))
              : <span className="text-xs text-[var(--text-muted)] px-1">暂无参会人</span>
            }
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <CopyInviteLinkButton meetingId={meetingId || meeting.id} />
          <Button variant="ghost" size="sm" icon={<Share2 className="h-4 w-4" />} title="共享屏幕" />
          <Button variant="danger" size="sm" icon={<LogOut className="h-4 w-4" />} onClick={handleEndMeeting}>
            结束会议
          </Button>
        </div>
      </header>

      {/* ─── Main flex layout ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── 4. Left Toolbar ─── */}
        <AnimatePresence>
          {leftOpen && (
            <motion.aside
              key="left-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 224, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden"
            >
              <div className="w-56 h-full overflow-y-auto p-4 space-y-6">
                <AgendaProgress />
                <BookmarksTimeline bookmarks={bookmarks} />
                <AttendeesList userIds={meeting.attendees} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Toggle button for left panel */}
        <button
          onClick={() => setLeftOpen((p) => !p)}
          className="shrink-0 w-5 flex items-center justify-center border-r border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors z-10"
          title={leftOpen ? '收起侧栏' : '展开侧栏'}
        >
          {leftOpen ? <ChevronLeft className="h-3 w-3 text-[var(--text-muted)]" /> : <ChevronRight className="h-3 w-3 text-[var(--text-muted)]" />}
        </button>

        {/* ─── 2. Main Content Area ─── */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mode Tabs */}
          <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-card)] px-4 shrink-0">
            {modeTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors relative',
                  mode === tab.key
                    ? 'border-[var(--color-gradient-start)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                )}
              >
                {tab.label}
                {mode === tab.key && (
                  <motion.div
                    layoutId="mode-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)]"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Mode Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                {modeViews[mode]}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Toggle button for right panel */}
        <button
          onClick={() => setRightOpen((p) => !p)}
          className="shrink-0 w-5 flex items-center justify-center border-l border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors z-10"
          title={rightOpen ? '收起AI面板' : '展开AI面板'}
        >
          {rightOpen ? <PanelRightClose className="h-3 w-3 text-[var(--text-muted)]" /> : <PanelRightOpen className="h-3 w-3 text-[var(--text-muted)]" />}
        </button>

        {/* ─── 3. Right AI Panel ─── */}
        {rightOpen && (
          <aside className="shrink-0 w-96 border-l border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col">
            {/* Tab bar: AI 问答 / 会议聊天 */}
            <div className="flex border-b border-[var(--border-color)] shrink-0">
              <button
                onClick={() => setRightTab('ai')}
                className={cn(
                  'flex-1 py-2.5 text-xs font-medium transition-colors',
                  rightTab === 'ai'
                    ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                )}
              >
                AI 问答
              </button>
              <button
                onClick={() => setRightTab('chat')}
                className={cn(
                  'flex-1 py-2.5 text-xs font-medium transition-colors',
                  rightTab === 'chat'
                    ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                )}
              >
                会议聊天
              </button>
            </div>

            {/* ─── AI 问答 ─── */}
            {rightTab === 'ai' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Speaker & Emotion */}
                <div className="px-3 py-2 border-b border-[var(--border-color)] shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] text-[var(--text-muted)]">语速</span>
                      <div className="relative h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] rounded-full" style={{ width: '65%' }} />
                        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[var(--color-gradient-start)] shadow-sm" style={{ left: '65%', transform: 'translate(-50%, -50%)' }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Smile className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs font-mono text-[var(--text-secondary)]">87%</span>
                    </div>
                  </div>
                </div>

                {/* AI Chat */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
                  {aiMessages.length === 0 && (
                    <p className="text-xs text-[var(--text-muted)] text-center py-8">向 AI 提问或选择预置指令</p>
                  )}
                  {aiMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'max-w-[85%] rounded-md px-3 py-2 text-xs leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-slate-100 dark:bg-slate-800 text-[var(--text-primary)] ml-auto'
                          : 'ai-card text-[var(--text-secondary)]',
                      )}
                    >
                      {msg.role === 'ai' && (
                        <div className="flex items-center gap-1 mb-1">
                          <Bot className="h-3 w-3 text-[var(--color-gradient-end)]" />
                          <span className="text-[10px] font-medium text-[var(--color-gradient-end)]">AI</span>
                        </div>
                      )}
                      <p>{msg.text}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">{msg.time}</p>
                    </motion.div>
                  ))}
                </div>

                {/* AI Input */}
                <div className="px-3 py-2 border-t border-[var(--border-color)] shrink-0">
                  <div className="flex gap-2">
                    <input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendAiMessage() }}
                      placeholder="向 AI 提问..."
                      className="flex-1 text-xs border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                    <Button size="sm" onClick={sendAiMessage}>发送</Button>
                  </div>
                </div>

                {/* Predefined commands */}
                <div className="px-3 py-2 border-t border-[var(--border-color)] shrink-0">
                  <div className="grid grid-cols-2 gap-2">
                    {aiCommands.map((cmd, i) => {
                      const Icon = cmd.icon
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                            setAiMessages((prev) => [...prev, { role: 'user', text: cmd.label, time }])
                            setTimeout(() => {
                              const resp = mockAiResponses[Math.floor(Math.random() * mockAiResponses.length)]
                              const t = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                              setAiMessages((prev) => [...prev, { role: 'ai', text: resp, time: t }])
                            }, 800)
                          }}
                          className="flex flex-col items-center gap-1 p-2.5 rounded-md border border-[var(--border-color)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
                        >
                          <Icon className="h-4 w-4 text-[var(--color-gradient-start)]" />
                          <span className="text-[10px] text-[var(--text-secondary)] leading-tight">{cmd.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* AI Notifications */}
                <div className="px-3 py-2 border-t border-[var(--border-color)] space-y-2 shrink-0">
                  <AnimatePresence>
                    {notifications.map((n) => (
                      <AiNotificationToast key={n.id} notification={n} onDismiss={(id) => setNotifications((prev) => prev.filter((x) => x.id !== id))} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ─── 会议聊天 ─── */}
            {rightTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Chat message list */}
                <div ref={chatListRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
                  {chatMessages.length === 0 && (
                    <p className="text-xs text-[var(--text-muted)] text-center py-8">暂无消息，发送第一条消息吧</p>
                  )}
                  {chatMessages.map((msg) => {
                    const isSelf = currentUser?.id === msg.userId
                    return (
                      <div key={msg.id} className={cn('flex gap-2 max-w-[90%]', isSelf ? 'ml-auto flex-row-reverse' : '')}>
                        <Avatar name={msg.userName} size="sm" />
                        <div className={cn('rounded-md px-3 py-2 text-xs leading-relaxed', isSelf ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-primary)]')}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-medium opacity-80">{msg.userName}</span>
                            <span className="text-[10px] opacity-60">{new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="break-words">{msg.content}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Chat input */}
                <div className="px-3 py-2 border-t border-[var(--border-color)] shrink-0">
                  <div className="flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage() }}
                      placeholder="输入消息..."
                      className="flex-1 text-xs border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                    <Button size="sm" onClick={sendChatMessage} disabled={!chatInput.trim()}>发送</Button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ─── 5. Bottom Status Bar ─── */}
      <footer className="glass h-8 shrink-0 flex items-center justify-between px-4 border-t border-[var(--border-color)] text-[11px] text-[var(--text-muted)] z-30 relative">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Radio className="h-3 w-3" />
            码率 2.4 Mbps
          </span>
          <span className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            延迟 45ms
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          引擎状态
          <span className="w-1.5 h-1.5 rounded-full bg-success ml-1" />
          <span className="text-success">在线</span>
        </div>
      </footer>

      {/* ─── End Meeting Modal ─── */}
      <Modal isOpen={showEndModal} onClose={() => setShowEndModal(false)} title="结束会议" size="sm">
        <p className="text-sm text-[var(--text-secondary)] mb-4">确定要结束当前会议吗？会议记录将自动保存。</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowEndModal(false)}>取消</Button>
          <Button variant="danger" onClick={async () => {
            setShowEndModal(false)
            cancelReminder(meetingId || meeting.id)
            try {
              await apiFetch(`/meetings/${meetingId || meeting.id}/end`, {
                method: 'PATCH',
              })
            } catch (e) {
              console.error('结束会议失败:', e)
            }
            // Stop speech recognition
            stopRecognition()
            updateMeeting(meetingId || meeting.id, {
              status: 'completed',
              endTime: new Date().toISOString(),
              duration: Math.round(elapsed / 60),
            })
            navigate(`/meeting/${meetingId || meeting.id}/review`)
          }}>
            确认结束
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default MeetingRoom