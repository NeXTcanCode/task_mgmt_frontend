export const isOverdue = (task, today) => Boolean(task.dueDate) && task.status !== 'completed' && task.dueDate < today;

// Numbers for the stat tiles: always computed from the unfiltered task list
export function getTaskStats(tasks, today) {
  const stats = { low: 0, medium: 0, high: 0, total: tasks.length, done: 0, overdue: 0 };
  tasks.forEach((task) => {
    stats[task.priority] += 1;
    if (task.status === 'completed') stats.done += 1;
    if (isOverdue(task, today)) stats.overdue += 1;
  });
  return stats;
}
