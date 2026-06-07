import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGuestStore } from '@/stores/guestStore';
import GuestJoinForm from '@/components/meeting/GuestJoinForm';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { ShieldAlert, FileQuestion } from 'lucide-react';

type AuthState = 'loading' | 'authorized' | 'guest_required' | 'forbidden' | 'not_found';

/** 会议入口守卫组件：请求后端 API 校验权限 → 分流到会议室 / 访客表单 / 拒绝页 */
export default function MeetingEntrance() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, guestInfo } = useGuestStore();
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [meetingTitle, setMeetingTitle] = useState('');

  // 第一步：调后端 API 校验权限
  useEffect(() => {
    if (!meetingId) {
      setAuthState('not_found');
      return;
    }

    // 已有访客 token 且匹配当前会议 → 直接放行
    if (guestInfo && guestInfo.meetingId === meetingId) {
      setAuthState('authorized');
      navigate(`/meeting/${meetingId}/room`, { replace: true });
      return;
    }

    const checkAccess = async () => {
      try {
        const headers: Record<string, string> = {};
        if (isLoggedIn) {
          const token = localStorage.getItem('token');
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/meetings/${meetingId}/join`, {
          credentials: 'include',
          headers,
        });

        if (res.status === 404) {
          setAuthState('not_found');
          return;
        }

        if (res.status === 403) {
          setAuthState('forbidden');
          return;
        }

        if (res.status === 401) {
          setAuthState('guest_required');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.meeting?.title) setMeetingTitle(data.meeting.title);
          if (data.canJoin) {
            setAuthState('authorized');
            navigate(`/meeting/${meetingId}/room`, { replace: true });
            return;
          }
        }

        // 其他异常 → 无权
        setAuthState('forbidden');
      } catch (error) {
        console.error('[MeetingEntrance] /api/meetings/:id/join 请求失败，降级为访客模式', error);
        // 网络不可达时降级为访客模式（方便纯前端开发）
        setAuthState('guest_required');
      }
    };

    checkAccess();
  }, [meetingId, isLoggedIn, guestInfo, navigate]);

  // 加载中
  if (authState === 'loading') {
    return (
      <div className="mx-auto max-w-md py-20">
        <Card className="space-y-4 p-8">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    );
  }

  // 访客加入表单
  if (authState === 'guest_required') {
    return (
      <GuestJoinForm meetingId={meetingId!} meetingTitle={meetingTitle || undefined} />
    );
  }

  // 403 无权限
  if (authState === 'forbidden') {
    return (
      <div className="mx-auto max-w-md py-20">
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <ShieldAlert className="h-16 w-16 text-[var(--color-danger)]" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">无权访问此会议</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            该会议已结束或你没有访问权限，请联系主持人邀请你加入。
          </p>
        </Card>
      </div>
    );
  }

  // 404 不存在
  if (authState === 'not_found') {
    return (
      <div className="mx-auto max-w-md py-20">
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <FileQuestion className="h-16 w-16 text-[var(--text-muted)]" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">会议不存在</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            请检查链接是否正确，或联系会议发起人获取新的邀请。
          </p>
        </Card>
      </div>
    );
  }

  // authorized 状态在 useEffect 中已跳转，无需渲染
  return null;
}
