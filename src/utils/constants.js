export const STATUSES = ['pending', 'in_progress', 'completed'];
// Display labels follow the design ("To do / Doing"); the API values stay as they are
export const STATUS_LABELS = { pending: 'To do', in_progress: 'Doing', completed: 'Completed' };

export const PRIORITIES = ['high', 'medium', 'low'];
export const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
];

// Insights time ranges (the 7 days / 30 days switch)
export const RANGES = {
  week: { days: 7, label: '7 days', title: 'This week' },
  month: { days: 30, label: '30 days', title: 'Last 30 days' },
};
