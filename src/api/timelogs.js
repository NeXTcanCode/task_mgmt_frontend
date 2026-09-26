import { apiFetch } from './client';

export const listTimeLogs = (query) => apiFetch('/timelogs', { query });
export const getActiveTimeLog = () => apiFetch('/timelogs/active');
export const deleteTimeLog = (id) => apiFetch(`/timelogs/${id}`, { method: 'DELETE' });
