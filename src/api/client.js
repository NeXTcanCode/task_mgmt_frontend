export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Every request goes through here: cookie auth, JSON in/out, { success, data } unwrapped
export async function apiFetch(path, { method = 'GET', body, query } = {}) {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const params = new URLSearchParams(Object.entries(query || {}).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  const url = `${baseUrl}/api${path}${params.toString() ? `?${params}` : ''}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Network error. Check your connection and try again.');
  }

  const json = await response.json().catch(() => null);
  if (response.ok && json?.success) return json.data;
  throw new ApiError(response.status, json?.error?.message || 'Something went wrong', json?.error?.details);
}
