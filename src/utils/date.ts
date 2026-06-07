/**
 * 安全解析日期字符串，失败时返回 null
 */
function safeParse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * 格式化日期: "6月5日 14:30"
 * 解析失败返回 "时间待定"
 */
export function formatDate(iso: string | null | undefined): string {
  const d = safeParse(iso);
  if (!d) return '时间待定';

  return `${d.getMonth() + 1}月${d.getDate()}日 ${d
    .getHours()
    .toString()
    .padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

/**
 * 格式化会议时间: "6月5日 14:30"
 * 和 formatDate 行为一致，统一所有页面使用此函数
 * 解析失败返回 "时间待定"
 */
export function formatMeetingTime(iso: string | null | undefined): string {
  return formatDate(iso);
}

/**
 * 格式化时间: "14:30"
 * 解析失败返回 "--:--"
 */
export function formatTime(iso: string | null | undefined): string {
  const d = safeParse(iso);
  if (!d) return '--:--';

  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

/**
 * 格式化时长: "1.5h" 或 "45min"
 * 0 或负数返回 "--"
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '--';
  if (minutes >= 60) return `${(minutes / 60).toFixed(1)}h`;
  return `${minutes}min`;
}

/**
 * 判断两个日期是否为同一天
 */
export function isSameDay(
  a: string | Date | null | undefined,
  b: string | Date | null | undefined,
): boolean {
  const da = a instanceof Date ? a : safeParse(a);
  const db = b instanceof Date ? b : safeParse(b);
  if (!da || !db) return false;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/**
 * 判断日期是否在本周内
 */
export function isThisWeek(iso: string | null | undefined): boolean {
  const d = safeParse(iso);
  if (!d) return false;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return d >= weekStart && d < weekEnd;
}
