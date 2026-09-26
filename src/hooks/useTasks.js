import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiSuggest, createTask, deleteTask, getTask, listTasks, updateTask } from '../api/tasks';
import { invalidate } from './invalidate';

// All of the user's tasks, newest first. Pages filter and sort this list themselves.
export function useTasks() {
  return useQuery({ queryKey: ['tasks'], queryFn: async () => (await listTasks()).tasks });
}

export function useTask(id) {
  return useQuery({ queryKey: ['task', id], queryFn: async () => (await getTask(id)).task, enabled: Boolean(id) });
}

export function useAiSuggest() {
  return useMutation({ mutationFn: (input) => aiSuggest(input) });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => createTask(body),
    onSuccess: () => invalidate(queryClient, [['tasks'], ['summary']]),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }) => updateTask(id, changes),
    onSettled: (data, error, { id }) => invalidate(queryClient, [['tasks'], ['task', id], ['summary']]),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteTask(id),
    onSuccess: async (data, id) => {
      queryClient.removeQueries({ queryKey: ['task', id] });
      queryClient.removeQueries({ queryKey: ['insights', 'task', id] });
      // ['timelogs'] also covers ['timelogs', 'active'] in case the running task was deleted
      await invalidate(queryClient, [['tasks'], ['timelogs'], ['summary']]);
    },
  });
}

// No bulk endpoint: one request per task, then a single invalidation.
// `changes` = PATCH body, or null to delete.
export function useBulkTaskAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, changes }) => {
      const results = await Promise.allSettled(ids.map((id) => (changes ? updateTask(id, changes) : deleteTask(id))));
      const ok = [];
      const failed = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') ok.push(ids[index]);
        else failed.push({ id: ids[index], message: result.reason?.message || 'Request failed' });
      });
      return { ok, failed };
    },
    onSettled: async (result, error, { changes }) => {
      if (!changes) result?.ok.forEach((id) => queryClient.removeQueries({ queryKey: ['task', id] }));
      await invalidate(queryClient, changes ? [['tasks'], ['task'], ['summary']] : [['tasks'], ['task'], ['timelogs'], ['summary']]);
    },
  });
}
