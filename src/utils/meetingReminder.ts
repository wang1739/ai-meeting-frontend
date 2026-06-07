const timers = new Map<string, ReturnType<typeof setTimeout>>();
let notificationPermissionDenied = false;

async function requestNotificationPermission(): Promise<boolean> {
  if (notificationPermissionDenied) {
    return false;
  }

  if (!('Notification' in window)) {
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'denied') {
    notificationPermissionDenied = true;
    return false;
  }

  return permission === 'granted';
}

export function scheduleEndReminder(meetingId: string, endTime: string | Date, title: string): void {
  const endDate = typeof endTime === 'string' ? new Date(endTime) : endTime;
  const now = new Date();
  const delay = endDate.getTime() - now.getTime();

  if (delay <= 0) {
    return;
  }

  const timer = setTimeout(async () => {
    timers.delete(meetingId);

    const hasPermission = await requestNotificationPermission();

    if (hasPermission) {
      new Notification('会议结束提醒', {
        body: `会议「${title}」已到结束时间`,
        icon: '/favicon.ico',
        tag: `meeting-reminder-${meetingId}`,
      });
    } else {
      alert(`会议结束提醒：会议「${title}」已到结束时间`);
    }
  }, delay);

  timers.set(meetingId, timer);
}

export function cancelReminder(meetingId: string): void {
  const timer = timers.get(meetingId);
  if (timer) {
    clearTimeout(timer);
    timers.delete(meetingId);
  }
}

export function hasPendingReminder(meetingId: string): boolean {
  return timers.has(meetingId);
}
