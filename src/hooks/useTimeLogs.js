import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteTimeLog, listTimeLogs } from '../api/timelogs';
import { invalidate } from './invalidate';

const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, value]) => value));

export function useTimeLogs(params = {}, { enabled = true } = {}) {
  const query = clean(params);
  return useQuery({ queryKey: ['timelogs', query], queryFn: async () => (await listTimeLogs(query)).timeLogs, enabled });
}

export function useDeleteTimeLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteTimeLog(id),
    onSettled: () => invalidate(queryClient, [['timelogs'], ['tasks'], ['task'], ['summary']]),
  });
}
