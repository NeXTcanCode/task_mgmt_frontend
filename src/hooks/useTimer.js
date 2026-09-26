import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startTimer, stopTimer } from '../api/tasks';
import { getActiveTimeLog } from '../api/timelogs';
import { invalidate } from './invalidate';

export function useActiveTimer() {
  return useQuery({ queryKey: ['timelogs', 'active'], queryFn: async () => (await getActiveTimeLog()).timeLog });
}

export function useStartTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => startTimer(taskId),
    // Start may flip pending → in_progress, and a 409 means our active timer is out of date
    onSettled: (data, error, taskId) => invalidate(queryClient, [['timelogs'], ['tasks'], ['task', taskId], ['summary']]),
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => stopTimer(taskId),
    onSettled: (data, error, taskId) => invalidate(queryClient, [['timelogs'], ['tasks'], ['task', taskId], ['summary']]),
  });
}

export const isRunningTask = (activeLog, taskId) => Boolean(activeLog) && String(activeLog.taskId) === String(taskId);
