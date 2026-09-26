import { apiFetch } from './client';

export const getTodaySummary = (tzOffset) => apiFetch('/summary/today', { query: { tzOffset } });
