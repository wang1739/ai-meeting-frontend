import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGuestStore } from '@/stores/guestStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { LogIn, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuestJoinFormProps {
  meetingId: string;
  meetingTitle?: string;
}

/** 访客加入会议表单卡片 */
export default function GuestJoinForm({ meetingId, meetingTitle }: GuestJoinFormProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setGuestInfo } = useGuestStore();

  const handleJoin = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请输入你的姓名');
      return;
    }
    if (trimmed.length > 20) {
      setError('姓名不能超过20个字符');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/meetings/${meetingId}/join-as-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: trimmed }),
      });

      if (res.ok) {
        const data = await res.json();
        const token = data.token || `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        setGuestInfo({
          token,
          displayName: trimmed,
          meetingId,
          role: 'guest',
        });

        navigate(`/meeting/${meetingId}/room`, { replace: true });
      } else {
        setError('加入失败，请重试');
      }
    } catch {
      // 后端不可达时本地降级处理（纯前端开发用）
      const token = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setGuestInfo({
        token,
        displayName: trimmed,
        meetingId,
        role: 'guest',
      });
      navigate(`/meeting/${meetingId}/room`, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-sm py-20"
    >
      <Card className="p-8">
        {/* 头部 */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-7 w-7 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">加入会议</h2>
          {meetingTitle && (
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{meetingTitle}</p>
          )}
        </div>

        {/* 姓名输入 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-primary)]">你的姓名</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoin();
              }}
              placeholder="输入你的姓名"
              maxLength={20}
              className={cn(
                'h-10 w-full rounded-[8px] border bg-[var(--bg-card)] py-2 pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                'transition-all duration-150',
                'focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
                error ? 'border-[var(--color-danger)]' : 'border-[var(--border-color)]',
              )}
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-[var(--color-danger)]">{error}</p>
          )}
        </div>

        {/* 加入按钮 */}
        <Button
          variant="primary"
          size="lg"
          className="mt-5 w-full"
          loading={loading}
          onClick={handleJoin}
        >
          加入
        </Button>

        {/* 说明 */}
        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          以访客身份加入，仅限本次会议使用
        </p>
      </Card>
    </motion.div>
  );
}
