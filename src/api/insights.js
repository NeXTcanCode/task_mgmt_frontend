import { apiFetch } from './client';

// The LLM runs on the server; these only fetch its result
const tzOffset = () => new Date().getTimezoneOffset();

export const getInsights = (range) => apiFetch('/insights', { query: { range, tzOffset: tzOffset() } });
export const getTaskInsights = (id) => apiFetch(`/tasks/${id}/insights`, { query: { tzOffset: tzOffset() } });
