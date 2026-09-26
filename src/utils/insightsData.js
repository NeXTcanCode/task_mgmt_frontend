// Pure helpers that turn tasks + time logs into chart data and reminders.
// `now` (ms) is always passed in so these stay pure and testable.
import { addDays, daysBetween, formatDueDate, formatShortDay, parseDateKey, toDateKey } from './formatDate';
import { isOverdue } from './taskStats';

const dayKeyOf = (iso) => toDateKey(new Date(iso));

// A running log (no endTime) counts up to now
export const logSeconds = (log, now) => (log.endTime ? log.duration : Math.max(0, Math.round((now - new Date(log.startTime)) / 1000)));

// The last `days` local days, oldest first, ending today
export function lastDays(days, now) {
  const today = toDateKey(new Date(now));
  return Array.from({ length: days }, (_, index) => addDays(today, index - days + 1));
}

// A session that crosses midnight counts on the day it started (same as the backend summary)
export function secondsPerDay(logs, days, now) {
  const totals = Object.fromEntries(lastDays(days, now).map((key) => [key, 0]));
  logs.forEach((log) => {
    const key = dayKeyOf(log.startTime);
    if (key in totals) totals[key] += logSeconds(log, now);
  });
  return Object.entries(totals).map(([key, seconds]) => ({ key, seconds }));
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Per-day totals (from secondsPerDay) added up by weekday, Monday first
export function secondsByWeekday(perDay) {
  const totals = WEEKDAYS.map(() => 0);
  perDay.forEach(({ key, seconds }) => { totals[(parseDateKey(key).getDay() + 6) % 7] += seconds; });
  return WEEKDAYS.map((label, index) => ({ label, seconds: totals[index] }));
}

// Newest `limit` sessions, returned oldest → newest for the chart
export function recentSessions(logs, now, limit = 10) {
  return [...logs]
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    .slice(0, limit)
    .reverse()
    .map((log) => ({ id: log.id, startTime: log.startTime, seconds: logSeconds(log, now), running: !log.endTime }));
}

export function sessionStats(logs) {
  const finished = logs.filter((log) => log.endTime);
  const durations = finished.map((log) => log.duration);
  return {
    count: logs.length,
    average: durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 0,
    longest: durations.length ? Math.max(...durations) : 0,
  };
}

export const totalSeconds = (logs, now) => logs.reduce((sum, log) => sum + logSeconds(log, now), 0);

// Top tasks by time plus one "Other" bucket
export function secondsByTask(logs, now, top = 5) {
  const byTask = {};
  logs.forEach((log) => {
    const id = String(log.taskId);
    if (!byTask[id]) byTask[id] = { id, title: log.task?.title || 'Deleted task', seconds: 0 };
    byTask[id].seconds += logSeconds(log, now);
  });
  const sorted = Object.values(byTask).filter((row) => row.seconds > 0).sort((a, b) => b.seconds - a.seconds);
  const rest = sorted.slice(top).reduce((sum, row) => sum + row.seconds, 0);
  return rest ? [...sorted.slice(0, top), { id: null, title: 'Other', seconds: rest }] : sorted;
}

export function completedPerDay(tasks, days, now) {
  const counts = Object.fromEntries(lastDays(days, now).map((key) => [key, 0]));
  tasks.forEach((task) => {
    if (task.status !== 'completed' || !task.completedAt) return;
    const key = dayKeyOf(task.completedAt);
    if (key in counts) counts[key] += 1;
  });
  return Object.entries(counts).map(([key, count]) => ({ key, count }));
}

export function statusCounts(tasks) {
  const counts = { pending: 0, in_progress: 0, completed: 0 };
  tasks.forEach((task) => { counts[task.status] += 1; });
  return counts;
}

export function priorityOpenDone(tasks) {
  const rows = { high: { open: 0, done: 0 }, medium: { open: 0, done: 0 }, low: { open: 0, done: 0 } };
  tasks.forEach((task) => { rows[task.priority][task.status === 'completed' ? 'done' : 'open'] += 1; });
  return rows;
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

// Most recent local day with a session, or null
const lastWorkedKey = (logs) => (logs.length ? dayKeyOf(logs.reduce((latest, log) => (log.startTime > latest ? log.startTime : latest), logs[0].startTime)) : null);

// In-app reminders for one task, most urgent first
export function buildTaskReminders(task, logs, now) {
  const today = toDateKey(new Date(now));
  if (task.status === 'completed') {
    return task.completedAt ? [{ key: 'done', tone: 'success', icon: 'check-circle', text: `Completed on ${formatShortDay(dayKeyOf(task.completedAt))}` }] : [];
  }

  const reminders = [];
  if (task.dueDate) {
    const daysLeft = daysBetween(today, task.dueDate);
    if (daysLeft < 0) reminders.push({ key: 'overdue', tone: 'danger', icon: 'alert', text: `Overdue by ${plural(-daysLeft, 'day')}` });
    else if (daysLeft === 0) reminders.push({ key: 'today', tone: 'warning', icon: 'calendar', text: 'Due today' });
    else if (daysLeft <= 3) reminders.push({ key: 'soon', tone: 'info', icon: 'clock', text: `Due in ${plural(daysLeft, 'day')}` });
  }

  if (task.status === 'in_progress') {
    const lastKey = lastWorkedKey(logs);
    if (!lastKey) reminders.push({ key: 'idle', tone: 'muted', icon: 'moon', text: 'No time tracked yet' });
    else if (daysBetween(lastKey, today) >= 3) reminders.push({ key: 'idle', tone: 'muted', icon: 'moon', text: `No time tracked in ${plural(daysBetween(lastKey, today), 'day')}` });
  }

  if (task.priority === 'high' && task.status === 'pending' && logs.length === 0) {
    reminders.push({ key: 'not-started', tone: 'warning', icon: 'flag', text: 'High priority and not started yet' });
  }
  return reminders;
}

// Reminder groups for the insights page; each group lists its tasks
export function buildOverviewReminders(tasks, logs, now) {
  const today = toDateKey(new Date(now));
  const soonLimit = addDays(today, 3);
  const open = tasks.filter((task) => task.status !== 'completed');
  const loggedIds = new Set(logs.map((log) => String(log.taskId)));
  const withDue = (task) => ({ id: task.id, title: task.title, note: task.dueDate ? formatDueDate(task.dueDate) : '' });

  return [
    { key: 'overdue', tone: 'danger', icon: 'alert', label: 'Overdue', tasks: open.filter((task) => isOverdue(task, today)).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)).map(withDue) },
    { key: 'today', tone: 'warning', icon: 'calendar', label: 'Due today', tasks: open.filter((task) => task.dueDate === today).map(withDue) },
    { key: 'soon', tone: 'info', icon: 'clock', label: 'Due in the next 3 days', tasks: open.filter((task) => task.dueDate > today && task.dueDate <= soonLimit).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)).map(withDue) },
    { key: 'stalled', tone: 'muted', icon: 'moon', label: 'Stalled (no time tracked in this period)', tasks: open.filter((task) => task.status === 'in_progress' && !loggedIds.has(task.id)).map(withDue) },
  ].filter((group) => group.tasks.length);
}
