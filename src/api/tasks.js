import { apiFetch } from './client';

export const listTasks = () => apiFetch('/tasks');
export const getTask = (id) => apiFetch(`/tasks/${id}`);
export const createTask = (body) => apiFetch('/tasks', { method: 'POST', body });
export const updateTask = (id, changes) => apiFetch(`/tasks/${id}`, { method: 'PATCH', body: changes });
export const deleteTask = (id) => apiFetch(`/tasks/${id}`, { method: 'DELETE' });
export const aiSuggest = (input) => apiFetch('/tasks/ai-suggest', { method: 'POST', body: { input } });
export const startTimer = (id) => apiFetch(`/tasks/${id}/timer/start`, { method: 'POST' });
export const stopTimer = (id) => apiFetch(`/tasks/${id}/timer/stop`, { method: 'POST' });
