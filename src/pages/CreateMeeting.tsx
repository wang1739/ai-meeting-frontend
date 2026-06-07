import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import {
  FileText, Users, Bot, ChevronLeft, ChevronRight, Check, Upload, X, Clock,
  Sparkles, Search, Calendar, ExternalLink, Video, MessageSquare, Globe, Tag, Link,
  Plus, Mic, BookOpen, HelpCircle, Shield, Copy,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { mockMeetings } from '@/data/mockData'
import { useMeetingStore } from '@/stores/meetingStore'
import { scheduleEndReminder } from '@/utils/meetingReminder'

/* ---------- Types & Constants ---------- */

interface UploadedFile {
  id: string
  name: string
  size: string
}

interface Attendee {
  userId: string
  role: 'host' | 'guest' | 'audience'
  isSpeaker: boolean
}

interface AgendaItem {
  id: string
  title: string
  duration: number
}

interface FormData {
  title: string
  template: string
  date: string
  startTime: string
  endTime: string
  attendees: Attendee[]
  files: UploadedFile[]
  meetingSource: string
  meetingSourceUrl: string
  syncToCalendar: boolean
  calendarType: 'google' | 'outlook'
  agenda: AgendaItem[]
  backgroundInfo: string
  aiQuestions: string[]
  sourceLanguage: string
  translationTarget: string
  multiLangMixed: boolean
  extraLanguages: string[]
  sensitiveWordWarning: boolean
  sensitiveWords: string
  saveAsTemplate: boolean
  templateName: string
  accessPermission: 'invite-only' | 'team' | 'public'
  collaborationRole: 'view' | 'edit' | 'manage'
  collaborators: string[]
}

type StepId = 1 | 2 | 3 | 4

const ATTENDEE_ROLES = [
  { value: 'host', label: '主持人', desc: '可管理会议、录制、控制议程', color: 'bg-[var(--color-primary)]' },
  { value: 'guest', label: '嘉宾', desc: '可发言、参与互动', color: 'bg-[var(--color-warning)]' },
  { value: 'audience', label: '观众', desc: '仅可观看和收听', color: 'bg-[var(--text-muted)]' },
] as const

const MEETING_SOURCES = [
  { id: 'manual', label: '手动创建', icon: FileText },
  { id: 'tencent', label: '腾讯会议', icon: Video },
  { id: 'zoom', label: 'Zoom', icon: Video },
  { id: 'teams', label: 'Microsoft Teams', icon: MessageSquare },
  { id: 'google-meet', label: 'Google Meet', icon: Video },
]

const TEMPLATES = [
  { id: 'blank', title: '空白会议', description: '从零开始创建会议', icon: FileText },
  { id: 'weekly-sync', title: '周会', description: '每周工作同步，常规议程结构', icon: Clock },
  { id: 'project-review', title: '项目复盘', description: '回顾项目进展与问题分析', icon: BookOpen },
  { id: '1on1', title: '1v1沟通', description: '一对一面谈，个人反馈与发展', icon: MessageSquare },
]

const LANGUAGES = ['中文', 'English', '日本語', '한국어', 'Français', 'Deutsch']

const INITIAL_FORM: FormData = {
  title: '', template: 'blank', date: '', startTime: '', endTime: '',
  attendees: [], files: [], meetingSource: 'manual', meetingSourceUrl: '',
  syncToCalendar: false, calendarType: 'google',
  agenda: [], backgroundInfo: '', aiQuestions: [],
  sourceLanguage: '中文', translationTarget: 'English', multiLangMixed: false, extraLanguages: [],
  sensitiveWordWarning: false, sensitiveWords: '',
  saveAsTemplate: false, templateName: '',
  accessPermission: 'invite-only', collaborationRole: 'edit', collaborators: [],
}

/* ---------- Helpers ---------- */

function calculateDuration(start: string, end: string): string {
  if (!start || !end) return ''
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = eh * 60 + em - (sh * 60 + sm)
  if (diff <= 0) return ''
  const h = Math.floor(diff / 60)
  const m = diff % 60
  if (h === 0) return `${m}分钟`
  if (m === 0) return `${h}小时`
  return `${h}小时${m}分钟`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

/* ---------- Step Indicator ---------- */

const STEPS: { id: StepId; label: string; icon: React.ElementType }[] = [
  { id: 1, label: '基本信息', icon: FileText },
  { id: 2, label: '参会人与角色', icon: Users },
  { id: 3, label: '议程与资料', icon: Calendar },
  { id: 4, label: 'AI 与权限', icon: Bot },
]

function StepIndicator({ currentStep }: { currentStep: StepId }) {
  return (
    <div className="flex items-center justify-center gap-0 py-6">
      {STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.id
        const isActive = currentStep === step.id
        const Icon = step.icon
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300',
                isCompleted && 'border-transparent bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] text-white shadow-md',
                isActive && 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-md',
                !isCompleted && !isActive && 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)]',
              )}>
                {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn('text-xs font-medium whitespace-nowrap', (isActive || isCompleted) ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn('mx-2 h-[2px] w-16 sm:w-24 transition-colors duration-300', currentStep > step.id ? 'bg-[var(--color-primary)]' : 'bg-[var(--border-color)]')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ======================================================================== */
/*  Step 1 – 基本信息 (含会议来源对接、日历同步)                                  */
/* ======================================================================== */

function StepBasicInfo({ form, onChange }: { form: FormData; onChange: (patch: Partial<FormData>) => void }) {
  const duration = calculateDuration(form.startTime, form.endTime)

  return (
    <div className="space-y-6">
      {/* Title */}
      <input
        type="text" value={form.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="请输入会议主题"
        className="w-full border-0 border-b-2 border-[var(--border-color)] bg-transparent pb-3 text-2xl font-bold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] transition-colors"
        autoFocus
      />

      {/* Template selector */}
      <div>
        <label className="mb-3 block text-sm font-medium text-[var(--text-secondary)]">会议模板</label>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {TEMPLATES.map((tpl) => {
            const isActive = form.template === tpl.id
            const TplIcon = tpl.icon
            return (
              <button key={tpl.id} type="button" onClick={() => onChange({ template: tpl.id })}
                className={cn('flex w-36 shrink-0 flex-col items-center gap-2 rounded-[var(--radius-md)] border-2 p-4 text-center transition-all duration-200',
                  isActive ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-muted)]',
                )}>
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-full',
                  isActive ? 'bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] text-white' : 'bg-slate-100 text-[var(--text-secondary)] dark:bg-slate-800',
                )}><TplIcon className="h-4 w-4" /></div>
                <span className={cn('text-sm font-medium', isActive ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]')}>{tpl.title}</span>
                <span className="text-[11px] leading-tight text-[var(--text-muted)]">{tpl.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Date / Time */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"><Calendar className="mr-1 inline h-3.5 w-3.5" />日期</label>
          <input type="date" value={form.date} onChange={(e) => onChange({ date: e.target.value })}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] transition-colors" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">开始时间</label>
          <input type="time" value={form.startTime} onChange={(e) => onChange({ startTime: e.target.value })}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] transition-colors" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">结束时间</label>
          <input type="time" value={form.endTime} onChange={(e) => onChange({ endTime: e.target.value })}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] transition-colors" />
        </div>
      </div>
      {duration && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Clock className="h-4 w-4" />
          预计时长：<span className="font-medium text-[var(--text-primary)]">{duration}</span>
        </div>
      )}

      {/* Meeting Source Integration */}
      <div>
        <label className="mb-3 block text-sm font-medium text-[var(--text-secondary)]">会议来源</label>
        <div className="flex flex-wrap gap-2">
          {MEETING_SOURCES.map((src) => {
            const isActive = form.meetingSource === src.id
            const SrcIcon = src.icon
            return (
              <button key={src.id} type="button" onClick={() => onChange({ meetingSource: src.id, meetingSourceUrl: src.id === 'manual' ? '' : form.meetingSourceUrl })}
                className={cn('inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 py-2 text-sm transition-all',
                  isActive ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]',
                )}>
                <SrcIcon className="h-4 w-4" />
                {src.label}
              </button>
            )
          })}
        </div>
        {form.meetingSource !== 'manual' && (
          <div className="mt-3 flex items-center gap-2">
            <Link className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <input type="text" value={form.meetingSourceUrl} onChange={(e) => onChange({ meetingSourceUrl: e.target.value })}
              placeholder={`粘贴${MEETING_SOURCES.find(s => s.id === form.meetingSource)?.label}会议链接或ID…`}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] transition-colors" />
          </div>
        )}
      </div>

      {/* Calendar Sync */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)]">同步到日历</h3>
            <p className="text-xs text-[var(--text-muted)]">将会议信息同步到外部日历</p>
          </div>
          <button type="button" role="switch" aria-checked={form.syncToCalendar}
            onClick={() => onChange({ syncToCalendar: !form.syncToCalendar })}
            className={cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
              form.syncToCalendar ? 'bg-[var(--color-primary)]' : 'bg-slate-300 dark:bg-slate-600')}>
            <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
              form.syncToCalendar ? 'translate-x-5' : 'translate-x-0')} />
          </button>
        </div>
        {form.syncToCalendar && (
          <div className="mt-3 flex gap-3">
            {['google', 'outlook'].map((cal) => (
              <label key={cal} className={cn('flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border px-4 py-2 text-sm transition-colors',
                form.calendarType === cal ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--border-color)]',
              )}>
                <input type="radio" name="calendarType" value={cal} checked={form.calendarType === cal}
                  onChange={() => onChange({ calendarType: cal as 'google' | 'outlook' })} className="h-4 w-4 accent-[var(--color-primary)]" />
                {cal === 'google' ? 'Google Calendar' : 'Outlook Calendar'}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ======================================================================== */
/*  Step 2 – 参会人与角色管理                                                    */
/* ======================================================================== */

function StepAttendees({ form, onChange, users }: { form: FormData; onChange: (patch: Partial<FormData>) => void; users: { id: string; name: string; email: string }[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUsers = useMemo(() =>
    users.filter((u) => u.name.includes(searchQuery) || u.email.includes(searchQuery)),
    [users, searchQuery],
  )

  const attendeeMap = useMemo(() => {
    const map = new Map<string, Attendee>()
    form.attendees.forEach((a) => map.set(a.userId, a))
    return map
  }, [form.attendees])

  const addAttendee = (userId: string) => {
    if (attendeeMap.has(userId)) return
    onChange({ attendees: [...form.attendees, { userId, role: 'guest', isSpeaker: false }] })
  }

  const removeAttendee = (userId: string) => {
    onChange({ attendees: form.attendees.filter((a) => a.userId !== userId) })
  }

  const updateRole = (userId: string, role: Attendee['role']) => {
    onChange({ attendees: form.attendees.map((a) => a.userId === userId ? { ...a, role } : a) })
  }

  const toggleSpeaker = (userId: string) => {
    onChange({ attendees: form.attendees.map((a) => a.userId === userId ? { ...a, isSpeaker: !a.isSpeaker } : a) })
  }

  // stats
  const hostCount = form.attendees.filter((a) => a.role === 'host').length
  const speakerCount = form.attendees.filter((a) => a.isSpeaker).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
        <span>已添加 <strong className="text-[var(--text-primary)]">{form.attendees.length}</strong> 人</span>
        <span>主持人 <strong className="text-[var(--color-primary)]">{hostCount}</strong></span>
        <span>预设发言人 <strong className="text-[var(--color-warning)]">{speakerCount}</strong></span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索成员…" className="w-full rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] transition-colors" />
      </div>

      {/* Selected Attendees with Roles */}
      {form.attendees.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-secondary)]">已选参会人</label>
          {form.attendees.map((att) => {
            const user = users.find((u) => u.id === att.userId)
            if (!user) return null
            return (
              <div key={att.userId} className="flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
                <Avatar name={user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{user.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">{user.email}</span>
                    {att.role === 'host' && <Badge variant="primary" size="sm">主持人</Badge>}
                    {att.isSpeaker && <Badge variant="warning" size="sm">发言人</Badge>}
                  </div>
                </div>
                {/* Role selector */}
                <select value={att.role} onChange={(e) => updateRole(att.userId, e.target.value as Attendee['role'])}
                  className="rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none">
                  {ATTENDEE_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {/* Speaker toggle */}
                <button type="button" onClick={() => toggleSpeaker(att.userId)} title="设为发言人（用于说话人分离）"
                  className={cn('rounded-full p-1.5 transition-colors', att.isSpeaker ? 'text-[var(--color-warning)] bg-amber-50 dark:bg-amber-900/20' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}>
                  <Mic className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => removeAttendee(att.userId)}
                  className="rounded-full p-1 text-[var(--text-muted)] hover:bg-slate-100 hover:text-[var(--color-danger)] dark:hover:bg-slate-800">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Search results */}
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] p-1">
        <label className="px-2 pt-1 text-xs font-medium text-[var(--text-muted)]">成员列表</label>
        {filteredUsers.length === 0 ? (
          <div className="py-6 text-center text-sm text-[var(--text-muted)]">未找到匹配的用户</div>
        ) : (
          filteredUsers.map((u) => {
            const isSelected = attendeeMap.has(u.id)
            return (
              <div key={u.id} className={cn('flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 transition-colors',
                isSelected ? 'bg-[var(--color-primary)]/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50')}>
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size="sm" />
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{u.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{u.email}</div>
                  </div>
                </div>
                <Button variant={isSelected ? 'ghost' : 'secondary'} size="sm" onClick={() => isSelected ? removeAttendee(u.id) : addAttendee(u.id)}>
                  {isSelected ? '移除' : '添加'}
                </Button>
              </div>
            )
          })
        )}
      </div>

      {/* Role description */}
      <div className="grid grid-cols-3 gap-3">
        {ATTENDEE_ROLES.map((r) => (
          <div key={r.value} className="rounded-[var(--radius-sm)] bg-[var(--bg-primary)] p-3 text-center">
            <div className={cn('mx-auto mb-1 h-2 w-2 rounded-full', r.color)} />
            <div className="text-xs font-medium text-[var(--text-primary)]">{r.label}</div>
            <div className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">{r.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ======================================================================== */
/*  Step 3 – 议程与背景资料 (含AI预读、AI预提问建议)                                  */
/* ======================================================================== */

function StepAgenda({ form, onChange }: { form: FormData; onChange: (patch: Partial<FormData>) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [newAgendaTitle, setNewAgendaTitle] = useState('')
  const [draftDuration, setDraftDuration] = useState<Record<string, string>>({})

  const addAgendaItem = () => {
    if (!newAgendaTitle.trim()) return
    const newItem: AgendaItem = {
      id: `agenda-${Date.now()}`,
      title: newAgendaTitle.trim(),
      duration: 10,
    }
    onChange({ agenda: [...form.agenda, newItem] })
    setNewAgendaTitle('')
  }

  const removeAgenda = (id: string) => {
    onChange({ agenda: form.agenda.filter((a) => a.id !== id) })
  }

  const updateAgendaDuration = (id: string, duration: number) => {
    onChange({ agenda: form.agenda.map((a) => a.id === id ? { ...a, duration: Math.max(1, duration) } : a) })
  }

  const totalAgendaMinutes = form.agenda.reduce((sum, a) => sum + a.duration, 0)

  // AI pre-question suggestions (generated based on title, agenda, and background info)
  const aiSuggestions = useMemo(() => {
    if (!form.title && form.agenda.length === 0 && !form.backgroundInfo) return []
    const suggestions: string[] = []
    if (form.title) {
      suggestions.push(`基于会议主题"${form.title}"，建议讨论：当前面临的主要挑战是什么？`)
      suggestions.push(`本次会议期望达成的具体目标是什么？`)
    }
    if (form.agenda.length > 0) {
      suggestions.push(`针对议程"${form.agenda[0].title}"，有哪些前置条件需要确认？`)
    }
    suggestions.push('是否有跨团队协作的阻塞项需要同步？')
    suggestions.push('会后需要跟进的优先级排序是怎样的？')
    return suggestions
  }, [form.title, form.agenda, form.backgroundInfo])

  // File upload
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    const newFiles: UploadedFile[] = files.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: f.name, size: formatFileSize(f.size),
    }))
    onChange({ files: [...form.files, ...newFiles] })
  }
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newFiles: UploadedFile[] = files.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: f.name, size: formatFileSize(f.size),
    }))
    onChange({ files: [...form.files, ...newFiles] })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const removeFile = (fileId: string) => onChange({ files: form.files.filter((f) => f.id !== fileId) })

  return (
    <div className="space-y-6">
      {/* Agenda Builder */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">会议议程</h3>
        <div className="space-y-2">
          {form.agenda.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[10px] font-bold text-[var(--color-primary)]">{idx + 1}</span>
              <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{item.title}</span>
              <div className="flex items-center gap-1 shrink-0">
                <input type="number"
                  value={draftDuration[item.id] ?? item.duration}
                  onChange={(e) => {
                    setDraftDuration((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }}
                  onBlur={() => {
                    const raw = draftDuration[item.id]
                    if (raw !== undefined) {
                      const num = parseInt(raw)
                      if (!isNaN(num) && num >= 1) updateAgendaDuration(item.id, num)
                      else updateAgendaDuration(item.id, 1)
                    }
                    setDraftDuration((prev) => {
                      const next = { ...prev }
                      delete next[item.id]
                      return next
                    })
                  }}
                  className="w-14 rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-center text-[var(--text-primary)] outline-none" min={1} />
                <span className="text-xs text-[var(--text-muted)]">分钟</span>
              </div>
              <button type="button" onClick={() => removeAgenda(item.id)}
                className="rounded-full p-1 text-[var(--text-muted)] hover:text-[var(--color-danger)]">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        {totalAgendaMinutes > 0 && (
          <div className="mt-2 text-xs text-[var(--text-muted)]">议程总时长：{totalAgendaMinutes} 分钟</div>
        )}

        {/* Add agenda */}
        <div className="mt-3 flex gap-2">
          <input type="text" value={newAgendaTitle} onChange={(e) => setNewAgendaTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAgendaItem() } }}
            placeholder="输入议程项名称，按回车添加…"
            className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] transition-colors" />
          <Button variant="secondary" size="md" onClick={addAgendaItem} disabled={!newAgendaTitle.trim()} icon={<Plus className="h-4 w-4" />}>
            添加
          </Button>
        </div>
      </div>

      {/* Background Info */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">背景资料</h3>
        <textarea value={form.backgroundInfo} onChange={(e) => onChange({ backgroundInfo: e.target.value })}
          placeholder="粘贴会议背景材料、项目文档、参考资料等…&#10;AI 将自动预读并理解领域知识，生成会议准备摘要。"
          rows={4}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] transition-colors resize-none" />
      </div>

      {/* File upload */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">上传会议资料</h3>
        <div onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn('flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed p-6 transition-colors',
            dragOver ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--border-color)] hover:border-[var(--text-muted)]')}>
          <Upload className="h-7 w-7 text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-secondary)]">拖拽文件到此处或点击上传</span>
          <span className="text-xs text-[var(--text-muted)]">支持 PDF、Word、PPT、Excel、图片等格式</span>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInput} />
        </div>
        {form.files.length > 0 && (
          <div className="mt-3 space-y-2">
            {form.files.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  <div>
                    <div className="text-sm text-[var(--text-primary)]">{f.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{f.size}</div>
                  </div>
                </div>
                <button type="button" onClick={() => removeFile(f.id)} className="rounded-full p-1 text-[var(--text-muted)] hover:text-[var(--color-danger)]"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
        {/* AI pre-read summary card */}
        {(form.files.length > 0 || form.backgroundInfo) && (
          <div className="ai-card mt-3 px-4 py-3">
            <div className="flex items-start gap-2">
              <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
              <div>
                <p className="text-xs font-medium text-[var(--color-ai)]">AI 预读就绪</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                  AI 已收到 {form.files.length} 个文件和背景资料，将在会议开始前自动分析并生成领域知识摘要，帮助主持人快速掌握上下文。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Pre-question Suggestions */}
      <div>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
          <HelpCircle className="h-4 w-4 text-[var(--color-primary)]" />
          AI 预提问建议
        </h3>
        {aiSuggestions.length === 0 ? (
          <div className="rounded-[var(--radius-sm)] bg-[var(--bg-primary)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
            请输入会议主题、添加议程或粘贴背景材料，AI 将自动生成关键提问和讨论方向建议
          </div>
        ) : (
          <div className="space-y-2">
            {aiSuggestions.map((q, i) => {
              const isSelected = form.aiQuestions.includes(q)
              return (
                <div key={i} onClick={() => {
                  const next = isSelected ? form.aiQuestions.filter((x) => x !== q) : [...form.aiQuestions, q]
                  onChange({ aiQuestions: next })
                }}
                  className={cn('flex cursor-pointer items-start gap-2 rounded-[var(--radius-sm)] border px-3 py-2.5 transition-all',
                    isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-muted)]')}>
                  <div className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs transition-colors',
                    isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--border-color)]')}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">{q}</span>
                </div>
              )
            })}
            <div className="text-xs text-[var(--text-muted)] mt-1">点击选中作为会议提示问题，将展示在会议页面辅助讨论</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ======================================================================== */
/*  Step 4 – AI 与权限                                                         */
/* ======================================================================== */

function StepAIAndPermissions({ form, onChange, users }: { form: FormData; onChange: (patch: Partial<FormData>) => void; users: { id: string; name: string; email: string }[] }) {
  const [collabSearch, setCollabSearch] = useState('')

  const filteredCollabUsers = useMemo(() =>
    users.filter((u) => !form.collaborators.includes(u.id) && (u.name.includes(collabSearch) || u.email.includes(collabSearch))),
    [users, collabSearch, form.collaborators],
  )

  return (
    <div className="space-y-7">
      {/* Language & Translation */}
      <div>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
          <Globe className="h-4 w-4" />
          语言及翻译偏好
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs text-[var(--text-muted)]">会议源语言</label>
            <select value={form.sourceLanguage} onChange={(e) => onChange({ sourceLanguage: e.target.value })}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--text-muted)]">目标转写/翻译语言</label>
            <select value={form.translationTarget} onChange={(e) => onChange({ translationTarget: e.target.value })}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
              <option value="">不翻译</option>
              {LANGUAGES.filter((l) => l !== form.sourceLanguage).map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        {/* Multi-language mixed scenario */}
        <div className="mt-3 flex items-center gap-2">
          <button type="button" role="switch" aria-checked={form.multiLangMixed}
            onClick={() => onChange({ multiLangMixed: !form.multiLangMixed })}
            className={cn('relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
              form.multiLangMixed ? 'bg-[var(--color-primary)]' : 'bg-slate-300 dark:bg-slate-600')}>
            <span className={cn('pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200',
              form.multiLangMixed ? 'translate-x-4' : 'translate-x-0')} />
          </button>
          <span className="text-xs text-[var(--text-secondary)]">多语言混合场景（会议中可能出现多种语言）</span>
        </div>
      </div>

      {/* Sensitive Word */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)]">敏感词预警</h3>
            <p className="text-xs text-[var(--text-muted)]">会议转写中检测到敏感词时将发出提醒</p>
          </div>
          <button type="button" role="switch" aria-checked={form.sensitiveWordWarning}
            onClick={() => onChange({ sensitiveWordWarning: !form.sensitiveWordWarning })}
            className={cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
              form.sensitiveWordWarning ? 'bg-[var(--color-primary)]' : 'bg-slate-300 dark:bg-slate-600')}>
            <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200',
              form.sensitiveWordWarning ? 'translate-x-5' : 'translate-x-0')} />
          </button>
        </div>
        <AnimatePresence>
          {form.sensitiveWordWarning && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <textarea value={form.sensitiveWords} onChange={(e) => onChange({ sensitiveWords: e.target.value })}
                placeholder="输入敏感词，用逗号或换行分隔…" rows={3}
                className="mt-3 w-full rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] resize-none" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Template Save */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)]">保存为模板</h3>
            <p className="text-xs text-[var(--text-muted)]">将当前配置保存为模板（含议程结构和记录格式），方便下次复用</p>
          </div>
          <button type="button" role="switch" aria-checked={form.saveAsTemplate}
            onClick={() => onChange({ saveAsTemplate: !form.saveAsTemplate })}
            className={cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
              form.saveAsTemplate ? 'bg-[var(--color-primary)]' : 'bg-slate-300 dark:bg-slate-600')}>
            <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200',
              form.saveAsTemplate ? 'translate-x-5' : 'translate-x-0')} />
          </button>
        </div>
        <AnimatePresence>
          {form.saveAsTemplate && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <input type="text" value={form.templateName} onChange={(e) => onChange({ templateName: e.target.value })}
                placeholder="输入模板名称（如：周报同步模板、复盘模板）…"
                className="mt-3 w-full rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Access Permission */}
      <div>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
          <Shield className="h-4 w-4" />
          访问权限与协作
        </h3>
        <div className="space-y-2">
          {[
            { value: 'invite-only' as const, label: '仅受邀者可访问', desc: '只有被邀请的参会人可以查看' },
            { value: 'team' as const, label: '团队内可访问', desc: '团队内所有成员可以查看' },
            { value: 'public' as const, label: '公开链接', desc: '拥有链接的任何人都可以查看' },
          ].map((opt) => (
            <label key={opt.value} className={cn('flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border px-4 py-3 transition-colors',
              form.accessPermission === opt.value ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'bg-[var(--bg-card)] hover:border-[var(--text-muted)]')}>
              <input type="radio" name="accessPermission" value={opt.value} checked={form.accessPermission === opt.value}
                onChange={() => onChange({ accessPermission: opt.value })} className="h-4 w-4 accent-[var(--color-primary)]" />
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{opt.label}</div>
                <div className="text-xs text-[var(--text-muted)]">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Collaboration Role */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">协作角色权限</h3>
        <div className="flex gap-2">
          {[
            { value: 'view', label: '查看', desc: '仅可查看纪要和转写' },
            { value: 'edit', label: '编辑', desc: '可编辑纪要和添加评论' },
            { value: 'manage', label: '管理', desc: '可管理会议设置和权限' },
          ].map((opt) => (
            <label key={opt.value} className={cn('flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-[var(--radius-sm)] border px-3 py-3 text-center transition-colors',
              form.collaborationRole === opt.value ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--text-muted)]')}>
              <input type="radio" name="collaborationRole" value={opt.value} checked={form.collaborationRole === opt.value}
                onChange={() => onChange({ collaborationRole: opt.value as 'view' | 'edit' | 'manage' })} className="sr-only" />
              <div className={cn('text-sm font-medium', form.collaborationRole === opt.value ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]')}>{opt.label}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{opt.desc}</div>
            </label>
          ))}
        </div>
      </div>

      {/* Collaborator Invite */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">邀请协作成员</h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" value={collabSearch} onChange={(e) => setCollabSearch(e.target.value)}
            placeholder="搜索成员邀请协作…"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)]" />
        </div>
        {form.collaborators.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {form.collaborators.map((uid) => {
              const u = users.find((x) => x.id === uid)
              if (!u) return null
              return (
                <span key={uid} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] pl-1.5 pr-1 py-0.5 text-sm shadow-sm">
                  <Avatar name={u.name} size="sm" />
                  <span className="max-w-[80px] truncate text-[var(--text-primary)]">{u.name}</span>
                  <button type="button" onClick={() => onChange({ collaborators: form.collaborators.filter((c) => c !== uid) })}
                    className="rounded-full p-0.5 text-[var(--text-muted)] hover:text-[var(--color-danger)]"><X className="h-3 w-3" /></button>
                </span>
              )
            })}
          </div>
        )}
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-card)] p-1">
          {filteredCollabUsers.length === 0 ? (
            <div className="py-4 text-center text-sm text-[var(--text-muted)]">{users.length === 0 ? '暂无可用成员' : '已邀请所有成员'}</div>
          ) : (
            filteredCollabUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size="sm" />
                  <div className="text-sm text-[var(--text-primary)]">{u.name}</div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => onChange({ collaborators: [...form.collaborators, u.id] })}>邀请</Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ======================================================================== */
/*  Main Component                                                           */
/* ======================================================================== */

export default function CreateMeeting() {
  const navigate = useNavigate()
  const createMeeting = useMeetingStore((s) => s.createMeeting)
  const [currentStep, setCurrentStep] = useState<StepId>(1)
  const [isCreating, setIsCreating] = useState(false)
  const [direction, setDirection] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [showSuccess, setShowSuccess] = useState(false)
  const [realUsers, setRealUsers] = useState<{ id: string; name: string; email: string }[]>([])

  useEffect(() => {
    apiFetch<{ id: string; name: string; email: string }[]>('/auth/users')
      .then(setRealUsers)
      .catch(() => { /* 静默失败，列表保持空 */ })
  }, [])

  const updateForm = (patch: Partial<FormData>) => setForm((prev) => ({ ...prev, ...patch }))

  const goNext = () => {
    if (currentStep < 4) { setDirection(1); setCurrentStep((s) => (s + 1) as StepId) }
  }
  const goBack = () => {
    if (currentStep > 1) { setDirection(-1); setCurrentStep((s) => (s - 1) as StepId) }
  }

  const genId = () => `meeting-${Date.now()}`

  const isInstant = useMemo(() => {
    if (!form.date || !form.startTime) return true
    const now = new Date()
    const meetingDate = new Date(`${form.date}T${form.startTime}`)
    return meetingDate <= now
  }, [form.date, form.startTime])

  const handleCreate = async (mode: 'instant' | 'schedule') => {
    if (isCreating) return
    setIsCreating(true)
    try {
      // 清洗表单数据：去掉 undefined / null / 空字符串字段
      const cleanedData: Record<string, unknown> = {}
      const raw: Record<string, unknown> = {
        title: form.title || '未命名会议',
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        agenda: form.agenda.length > 0 ? form.agenda : undefined,
        participants: form.attendees.length > 0 ? form.attendees : undefined,
        status: mode === 'instant' ? 'ongoing' : 'scheduled',
      }
      Object.entries(raw).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanedData[key] = value
        }
      })
      // 确保 status 始终存在且为后端可识别的值
      cleanedData.status = mode === 'instant' ? 'ongoing' : 'scheduled'

      const meeting = await createMeeting(cleanedData)
      
      if (meeting.endTime) {
        scheduleEndReminder(meeting.id, meeting.endTime, meeting.title)
      }
      
      if (mode === 'instant') {
        navigate(`/meeting/${meeting.id}/room`)
      } else {
        navigate('/')
      }
    } catch (e) {
      console.error('创建会议失败:', e)
      setIsCreating(false)
    }
  }

  const suggestions = useMemo(() => {
    const title = form.title
    if (!title) return []
    const keywords = ['周会', '周报', '评审', '复盘', '站会', '需求', 'sync', '复盘', '1v1']
    const matchedKeyword = keywords.find((k) => title.includes(k))
    if (!matchedKeyword) return []
    return mockMeetings.filter((m) => m.title.includes(matchedKeyword) || m.tags?.some((t) => t.includes(matchedKeyword)))
  }, [form.title])

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 120 : -120, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -120 : 120, opacity: 0 }),
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">创建新会议</h1>
      <StepIndicator currentStep={currentStep} />

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] bg-[var(--bg-card)] px-12 py-10 shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)]">
                <Check className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">会议创建成功</h2>
              <p className="text-sm text-[var(--text-secondary)]">正在跳转到仪表盘…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Suggestion */}
      {suggestions.length > 0 && (
        <Card variant="glow" className="mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)]">检测到相似历史会议</p>
              <div className="mt-1 space-y-1">
                {suggestions.slice(0, 2).map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-white/50 px-3 py-1.5 dark:bg-slate-800/50">
                    <span className="text-sm text-[var(--text-secondary)] truncate">{m.title}</span>
                    <Badge variant="info" size="sm">{m.tags?.[0] ?? '会议'}</Badge>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => {
                const s = suggestions[0]; if (!s) return
                setForm((prev) => ({
                  ...prev,
                  date: s.startTime.slice(0, 10), startTime: s.startTime.slice(11, 16), endTime: s.endTime.slice(11, 16),
                  attendees: s.attendees.map((id) => ({ userId: id, role: 'guest' as const, isSpeaker: false })),
                }))
              }} className="mt-2 text-xs font-medium text-[var(--color-primary)] hover:underline">
                快速填充
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Step content */}
      <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentStep} custom={direction} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
            {currentStep === 1 && <StepBasicInfo form={form} onChange={updateForm} />}
            {currentStep === 2 && <StepAttendees form={form} onChange={updateForm} users={realUsers} />}
            {currentStep === 3 && <StepAgenda form={form} onChange={updateForm} />}
            {currentStep === 4 && <StepAIAndPermissions form={form} onChange={updateForm} users={realUsers} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" size="md" disabled={currentStep === 1} onClick={goBack} icon={<ChevronLeft className="h-4 w-4" />}>上一步</Button>
        <div className="hidden items-center gap-1.5 sm:flex">
          {[1, 2, 3, 4].map((s) => (
            <span key={s} className={cn('h-1.5 w-1.5 rounded-full transition-colors',
              currentStep === s ? 'bg-[var(--color-primary)]' : currentStep > s ? 'bg-[var(--color-primary)]/40' : 'bg-[var(--border-color)]')} />
          ))}
        </div>
        {currentStep === 4 ? (
          <div className="flex gap-3">
            <Button variant="secondary" size="md" disabled={isCreating} onClick={() => handleCreate('schedule')} icon={<Calendar className="h-4 w-4" />}>预约</Button>
            <Button variant="primary" size="md" disabled={isCreating} onClick={() => handleCreate('instant')} icon={<Video className="h-4 w-4" />}>
              {isInstant ? '现在开始' : '创建并开始'}
            </Button>
          </div>
        ) : (
          <Button variant="primary" size="md" onClick={goNext} icon={<ChevronRight className="h-4 w-4" />}>下一步</Button>
        )}
      </div>
    </div>
  )
}
