// Due dates are "YYYY-MM-DD" calendar days. Never pass them to new Date("YYYY-MM-DD"):
// that is UTC midnight and shows the previous day west of UTC.
const pad = (value) => String(value).padStart(2, '0');

export const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const todayLocal = () => toDateKey(new Date());

export function isValidDateKey(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function parseDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(key, days) {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

// Whole days from one key to another (rounding absorbs 23h/25h DST days)
export const daysBetween = (fromKey, toKey) => Math.round((parseDateKey(toKey) - parseDateKey(fromKey)) / 86400000);

export const formatDueDate = (key) => parseDateKey(key).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
export const formatDayLabel = (key) => parseDateKey(key).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
export const formatShortDay = (key) => parseDateKey(key).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
export const formatDateTime = (iso) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const formatTime = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
