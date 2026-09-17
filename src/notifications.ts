import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Goal, SavingsDay } from './database';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

export async function ensureNotificationsAllowed() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true } });
  return requested.granted;
}

/** iOS only guarantees a limited number of pending local notifications; keep the nearest 60. */
export async function scheduleGoalDays(goal: Goal, days: SavingsDay[]) {
  if (!goal.reminderEnabled || !(await ensureNotificationsAllowed())) return new Map<number, string>();
  const now = Date.now();
  const eligible = days.filter(day => !day.isResolved && day.possibleAmount > 0 && new Date(`${day.date}T${String(goal.reminderHour).padStart(2, '0')}:${String(goal.reminderMinute).padStart(2, '0')}:00`).getTime() > now).slice(0, 60);
  const ids = new Map<number, string>();
  for (const day of eligible) {
    const when = new Date(`${day.date}T${String(goal.reminderHour).padStart(2, '0')}:${String(goal.reminderMinute).padStart(2, '0')}:00`);
    const id = await Notifications.scheduleNotificationAsync({ content: { title: `Heo Đất · ${goal.name}`, body: 'Hôm nay bạn đã cất tiền vào Heo Đất chưa?', data: { goalId: goal.id, dayId: day.id } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when } });
    ids.set(day.id, id);
  }
  return ids;
}

export async function cancelReminder(notificationId: string | null) {
  if (notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId);
}
