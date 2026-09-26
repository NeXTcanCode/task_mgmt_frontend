import { useQuery } from '@tanstack/react-query';
import { getInsights, getTaskInsights } from '../api/insights';

// LLM calls are slow and cost money: cache them, never refetch on focus, never auto-retry.
// Mutations don't invalidate these; the user presses Regenerate (refetch).
const aiQueryOptions = { staleTime: 5 * 60_000, refetchOnWindowFocus: false, retry: false };

export function useInsights(range) {
  return useQuery({ queryKey: ['insights', 'all', range], queryFn: () => getInsights(range), ...aiQueryOptions });
}

export function useTaskInsights(taskId) {
  return useQuery({ queryKey: ['insights', 'task', taskId], queryFn: () => getTaskInsights(taskId), enabled: Boolean(taskId), ...aiQueryOptions });
}
