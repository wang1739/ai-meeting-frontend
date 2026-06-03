import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  User,
  Palette,
  Globe,
  Monitor,
  Sun,
  Moon,
  Shield,
  BookOpen,
  Bell,
  Sliders,
  CreditCard,
  ChevronRight,
  Save,
  FileJson,
} from 'lucide-react'
import { mockUsers } from '@/data/mockData'
import { useAppStore } from '@/stores/appStore'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Tabs from '@/components/ui/Tabs'

// ---------- Types ----------

type ThemeMode = 'light' | 'dark' | 'system'
type SubtitleSize = 'small' | 'medium' | 'large'
type SummaryStyle = 'concise' | 'standard' | 'detailed'

interface PersonalSettings {
  displayName: string
  email: string
  language: string
  timezone: string
  theme: ThemeMode
  subtitleFontSize: SubtitleSize
  subtitleBgOpacity: number
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  status: 'active' | 'inactive'
}

interface GlossaryTerm {
  id: string
  term: string
  translation: string
}

interface Integration {
  id: string
  name: string
  icon: string
  connected: boolean
}

interface MonthlyUsage {
  month: string
  hours: number
}

// ---------- Mock Data ----------

const initialPersonalSettings: PersonalSettings = {
  displayName: '张明',
  email: 'zhangming@team.com',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  theme: 'system',
  subtitleFontSize: 'medium',
  subtitleBgOpacity: 40,
}

const initialTeamMembers: TeamMember[] = mockUsers.map((u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: 'active' as const,
}))

const initialGlossary: GlossaryTerm[] = [
  { id: 'g1', term: 'LCP', translation: '最大内容绘制' },
  { id: 'g2', term: 'SLA', translation: '服务等级协议' },
  { id: 'g3', term: 'MVP', translation: '最小可行产品' },
  { id: 'g4', term: 'OKR', translation: '目标与关键结果' },
  { id: 'g5', term: 'KPI', translation: '关键绩效指标' },
]

const initialSensitiveWords = '发票\n退款\n投诉\n离职\n机密\n内部资料'

const integrationsList: Integration[] = [
  { id: 'i1', name: '谷歌日历', icon: '📅', connected: true },
  { id: 'i2', name: 'Zoom', icon: '🎥', connected: true },
  { id: 'i3', name: 'Slack', icon: '💬', connected: false },
  { id: 'i4', name: 'Notion', icon: '📝', connected: false },
]

const monthlyUsage: MonthlyUsage[] = [
  { month: '1月', hours: 28 },
  { month: '2月', hours: 35 },
  { month: '3月', hours: 42 },
  { month: '4月', hours: 38 },
  { month: '5月', hours: 52 },
  { month: '6月', hours: 46 },
]

const languages = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
]

const timezones = [
  { value: 'Asia/Shanghai', label: '中国标准时间 (UTC+8)' },
  { value: 'Asia/Tokyo', label: '日本标准时间 (UTC+9)' },
  { value: 'America/New_York', label: '美国东部时间 (UTC-5)' },
  { value: 'America/Los_Angeles', label: '美国太平洋时间 (UTC-8)' },
  { value: 'Europe/London', label: '英国时间 (UTC+0)' },
  { value: 'Europe/Berlin', label: '欧洲中部时间 (UTC+1)' },
]

const tabs = [
  { id: 'personal', label: '个人设置' },
  { id: 'team', label: '团队设置' },
]

// ---------- Sub-components ----------

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[var(--text-primary)] px-5 py-3 text-sm text-[var(--bg-primary)] shadow-custom-lg"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
    </div>
  )
}

// ---------- Main Component ----------

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('personal')

  // Personal settings state
  const storeTheme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const [personal, setPersonal] = useState<PersonalSettings>(() => ({
    ...initialPersonalSettings,
    theme: storeTheme,
  }))
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers)
  const [sensitiveWords, setSensitiveWords] = useState(initialSensitiveWords)
  const [glossary, setGlossary] = useState<GlossaryTerm[]>(initialGlossary)
  const [summaryStyle, setSummaryStyle] = useState<SummaryStyle>('standard')
  const [integrations, setIntegrations] = useState<Integration[]>(integrationsList)

  const [newGlossaryTerm, setNewGlossaryTerm] = useState('')
  const [newGlossaryTranslation, setNewGlossaryTranslation] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2000)
  }

  // Cleanup toast timeout on unmount
  useEffect(() => {
    const timer = setTimeout(() => {})
    return () => clearTimeout(timer)
  }, [])

  // ---------- Personal Handlers ----------

  const handlePersonalChange = (field: keyof PersonalSettings, value: string | ThemeMode | SubtitleSize | number) => {
    setPersonal((prev) => ({ ...prev, [field]: value }))
  }

  const handleSavePersonal = () => {
    setTheme(personal.theme)
    showToast('个人设置已保存')
  }

  // ---------- Team Handlers ----------

  const handleRoleChange = (memberId: string, role: 'admin' | 'member') => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role } : m)),
    )
  }

  const handleSaveSensitiveWords = () => {
    showToast('敏感词库已保存')
  }

  const handleAddGlossary = () => {
    if (!newGlossaryTerm.trim() || !newGlossaryTranslation.trim()) return
    setGlossary((prev) => [
      ...prev,
      { id: `g${Date.now()}`, term: newGlossaryTerm.trim(), translation: newGlossaryTranslation.trim() },
    ])
    setNewGlossaryTerm('')
    setNewGlossaryTranslation('')
    showToast('术语已添加')
  }

  const handleSaveGlossary = () => {
    showToast('术语表已保存')
  }

  const handleSaveSummaryStyle = () => {
    showToast('摘要风格偏好已保存')
  }

  const handleToggleIntegration = (integrationId: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === integrationId ? { ...i, connected: !i.connected } : i)),
    )
  }

  const handleSaveTeam = () => {
    showToast('团队设置已保存')
  }

  // ---------- Render helpers ----------

  const maxUsage = Math.max(...monthlyUsage.map((u) => u.hours), 1)

  return (
    <motion.div
      className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">设置</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          管理你的个人偏好和团队配置
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'personal' ? (
          <motion.div
            key="personal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Avatar Section */}
            <Card>
              <SectionTitle icon={<User className="h-4 w-4" />} title="头像" />
              <div className="flex items-center gap-5">
                <Avatar name={personal.displayName} size="lg" />
                <Button variant="secondary" size="sm">
                  更换头像
                </Button>
              </div>
            </Card>

            {/* Profile Form */}
            <Card>
              <SectionTitle icon={<User className="h-4 w-4" />} title="基本信息" />
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    显示名称
                  </label>
                  <input
                    type="text"
                    value={personal.displayName}
                    onChange={(e) => handlePersonalChange('displayName', e.target.value)}
                    className="h-10 w-full rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    邮箱
                  </label>
                  <input
                    type="text"
                    value={personal.email}
                    disabled
                    className="h-10 w-full rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-muted)] opacity-60 outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                      默认语言
                    </label>
                    <select
                      value={personal.language}
                      onChange={(e) => handlePersonalChange('language', e.target.value)}
                      className="h-10 w-full rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    >
                      {languages.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                      时区
                    </label>
                    <select
                      value={personal.timezone}
                      onChange={(e) => handlePersonalChange('timezone', e.target.value)}
                      className="h-10 w-full rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    >
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button size="sm" icon={<Save className="h-4 w-4" />} onClick={handleSavePersonal}>
                  保存
                </Button>
              </div>
            </Card>

            {/* Theme Section */}
            <Card>
              <SectionTitle icon={<Palette className="h-4 w-4" />} title="主题" />
              <div className="grid grid-cols-3 gap-3">
                {([
                  { mode: 'light', label: '浅色', icon: Sun, preview: 'bg-white border border-gray-200' },
                  { mode: 'dark', label: '深色', icon: Moon, preview: 'bg-slate-800 border border-slate-600' },
                  { mode: 'system', label: '跟随系统', icon: Monitor, preview: 'bg-gradient-to-r from-white to-slate-800 border border-gray-200' },
                ] as const).map(({ mode, label, icon: Icon, preview }) => {
                  const isActive = personal.theme === mode
                  return (
                    <button
                      key={mode}
                      onClick={() => handlePersonalChange('theme', mode)}
                      className={cn(
                        'relative rounded-lg border-2 p-4 text-center transition-all',
                        isActive
                          ? 'border-primary shadow-custom-sm'
                          : 'border-[var(--border-color)] hover:border-primary/30',
                      )}
                    >
                      {isActive && (
                        <span className="absolute inset-0 rounded-lg ring-1 ring-primary/20" />
                      )}
                      <div className={cn('mx-auto mb-3 h-10 w-full rounded-md', preview)} />
                      <div className="flex items-center justify-center gap-1.5">
                        <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
                        <span className="text-xs font-medium text-[var(--text-primary)]">{label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Subtitle Style Section */}
            <Card>
              <SectionTitle icon={<Sliders className="h-4 w-4" />} title="字幕样式" />
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                    字体大小
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)]">小</span>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      value={
                        personal.subtitleFontSize === 'small'
                          ? 0
                          : personal.subtitleFontSize === 'medium'
                            ? 1
                            : 2
                      }
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        const sizes: SubtitleSize[] = ['small', 'medium', 'large']
                        handlePersonalChange('subtitleFontSize', sizes[val])
                      }}
                      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--border-color)] accent-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
                    />
                    <span className="text-xs text-[var(--text-muted)]">大</span>
                  </div>
                  <div className="mt-1 flex justify-between px-1 text-[10px] text-[var(--text-muted)]">
                    <span>小</span>
                    <span>中</span>
                    <span>大</span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                    背景不透明度
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)]">0%</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={personal.subtitleBgOpacity}
                      onChange={(e) => handlePersonalChange('subtitleBgOpacity', Number(e.target.value))}
                      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--border-color)] accent-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
                    />
                    <span className="text-xs text-[var(--text-muted)]">100%</span>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                    预览
                  </label>
                  <div className="overflow-hidden rounded-md bg-slate-900 px-4 py-3">
                    <p
                      className={cn(
                        'rounded-md bg-black/40 px-3 py-2 text-center text-white',
                        personal.subtitleFontSize === 'small' && 'text-xs',
                        personal.subtitleFontSize === 'medium' && 'text-sm',
                        personal.subtitleFontSize === 'large' && 'text-base',
                      )}
                      style={{ backgroundColor: `rgba(0,0,0,${personal.subtitleBgOpacity / 100})` }}
                    >
                      大家好，今天的技术周会我们主要讨论三个议题...
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button size="sm" icon={<Save className="h-4 w-4" />} onClick={handleSavePersonal}>
                  保存
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Member Management */}
            <Card>
              <SectionTitle icon={<Shield className="h-4 w-4" />} title="成员管理" />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                      <th className="pb-2 pr-4 font-medium">成员</th>
                      <th className="pb-2 pr-4 font-medium">邮箱</th>
                      <th className="pb-2 pr-4 font-medium">角色</th>
                      <th className="pb-2 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="border-b border-[var(--border-color)] last:border-b-0">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={member.name} size="sm" />
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {member.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-[var(--text-secondary)]">
                          {member.email}
                        </td>
                        <td className="py-2.5 pr-4">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.id, e.target.value as 'admin' | 'member')
                            }
                            className="h-8 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 text-xs text-[var(--text-primary)] outline-none focus:border-primary/50"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </select>
                        </td>
                        <td className="py-2.5">
                          <Badge
                            variant={member.status === 'active' ? 'success' : 'default'}
                            size="sm"
                            dot
                          >
                            {member.status === 'active' ? '活跃' : '未激活'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="secondary" size="sm">
                  邀请成员
                </Button>
              </div>
            </Card>

            {/* Sensitive Words */}
            <Card>
              <SectionTitle icon={<FileJson className="h-4 w-4" />} title="敏感词库" />
              <textarea
                value={sensitiveWords}
                onChange={(e) => setSensitiveWords(e.target.value)}
                rows={5}
                className="w-full rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="每行一个敏感词"
              />
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">每行一个敏感词，保存后将在转写内容中自动过滤</p>
              <div className="mt-4 flex justify-end">
                <Button size="sm" icon={<Save className="h-4 w-4" />} onClick={handleSaveSensitiveWords}>
                  保存
                </Button>
              </div>
            </Card>

            {/* Glossary */}
            <Card>
              <SectionTitle icon={<BookOpen className="h-4 w-4" />} title="术语表" />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                      <th className="pb-2 pr-4 font-medium">术语</th>
                      <th className="pb-2 font-medium">翻译</th>
                    </tr>
                  </thead>
                  <tbody>
                    {glossary.map((g) => (
                      <tr key={g.id} className="border-b border-[var(--border-color)] last:border-b-0">
                        <td className="py-2 pr-4 text-sm font-medium text-[var(--text-primary)]">
                          {g.term}
                        </td>
                        <td className="py-2 text-sm text-[var(--text-secondary)]">{g.translation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newGlossaryTerm}
                    onChange={(e) => setNewGlossaryTerm(e.target.value)}
                    placeholder="术语"
                    className="h-9 w-full rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary/50"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={newGlossaryTranslation}
                    onChange={(e) => setNewGlossaryTranslation(e.target.value)}
                    placeholder="翻译"
                    className="h-9 w-full rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary/50"
                  />
                </div>
                <Button variant="secondary" size="sm" onClick={handleAddGlossary}>
                  添加术语
                </Button>
              </div>
              <div className="mt-4 flex justify-end">
                <Button size="sm" icon={<Save className="h-4 w-4" />} onClick={handleSaveGlossary}>
                  保存
                </Button>
              </div>
            </Card>

            {/* Summary Style */}
            <Card>
              <SectionTitle icon={<Sliders className="h-4 w-4" />} title="摘要风格偏好" />
              <div className="flex flex-wrap gap-4">
                {([
                  { value: 'concise', label: '简洁', desc: '仅保留核心结论' },
                  { value: 'standard', label: '标准', desc: '包含讨论要点和结论' },
                  { value: 'detailed', label: '详细', desc: '完整记录讨论过程' },
                ] as const).map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all',
                      summaryStyle === opt.value
                        ? 'border-primary bg-primary/5 shadow-custom-sm'
                        : 'border-[var(--border-color)] hover:border-primary/30',
                    )}
                  >
                    <input
                      type="radio"
                      name="summaryStyle"
                      value={opt.value}
                      checked={summaryStyle === opt.value}
                      onChange={(e) => setSummaryStyle(e.target.value as SummaryStyle)}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{opt.label}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <Button size="sm" icon={<Save className="h-4 w-4" />} onClick={handleSaveSummaryStyle}>
                  保存
                </Button>
              </div>
            </Card>

            {/* Integrations */}
            <Card>
              <SectionTitle icon={<Bell className="h-4 w-4" />} title="集成授权" />
              <div className="space-y-3">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border-color)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{integration.icon}</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {integration.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Toggle switch */}
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={integration.connected}
                          onChange={() => handleToggleIntegration(integration.id)}
                          className="peer sr-only"
                        />
                        <span className="h-5 w-9 rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full dark:after:bg-slate-300" />
                      </label>
                      <Button
                        variant={integration.connected ? 'ghost' : 'secondary'}
                        size="sm"
                      >
                        {integration.connected ? '断开' : '连接'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Usage Stats */}
            <Card>
              <SectionTitle icon={<CreditCard className="h-4 w-4" />} title="用量统计" />
              <div className="mb-4">
                <p className="text-xs text-[var(--text-muted)]">当前计划：<span className="font-medium text-[var(--text-primary)]">专业版</span></p>
                <p className="text-xs text-[var(--text-muted)]">本月已使用：<span className="font-medium text-[var(--text-primary)]">46 小时</span></p>
              </div>
              <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
                {monthlyUsage.map((u) => {
                  const heightPct = (u.hours / maxUsage) * 100
                  return (
                    <div key={u.month} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] text-[var(--text-muted)]">{u.hours}h</span>
                      <div
                        className="w-full rounded-t-sm bg-gradient-to-t from-primary/60 to-primary transition-all"
                        style={{ height: `${heightPct}%`, minHeight: 4 }}
                      />
                      <span className="text-[10px] text-[var(--text-muted)]">{u.month}</span>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Save all team settings */}
            <div className="flex justify-end">
              <Button icon={<Save className="h-4 w-4" />} onClick={handleSaveTeam}>
                保存所有设置
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast message={toastMessage} visible={toastVisible} />
    </motion.div>
  )
}