import { apiFetch } from './client';

export const getMe = () => apiFetch('/auth/me');
export const logout = () => apiFetch('/auth/logout', { method: 'POST' });
export const login = ({ email, password }) => apiFetch('/auth/login', { method: 'POST', body: { email: email.trim(), password } });
export const signup = ({ name, email, password }) => apiFetch('/auth/signup', { method: 'POST', body: { name: name.trim(), email: email.trim(), password } });
