const BASE = import.meta.env.VITE_API_BASE || '';
export class ApiError extends Error {
  constructor(message, status = 0, code = 'network_error') { super(message); this.status = status; this.code = code; }
}
/** One JSON transport; raw server tracebacks never become UI errors. */
export async function request(path, { body, meta = false, ...options } = {}) {
  let response;
  try {
    response = await fetch(BASE + path, {
      ...options, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Connection lost. Check that the ship computer backend is running.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.error?.message || 'The request could not be completed.', response.status, data?.error?.code);
  if (data === null) throw new ApiError('The server returned an unreadable response.');
  return meta ? { data, total: Number(response.headers.get('X-Total-Count') || 0) } : data;
}
export function query(values = {}) {
  const params = new URLSearchParams(Object.entries(values).filter(([, value]) => value !== '' && value != null));
  return params.size ? '?' + params : '';
}
export function crud(path) {
  return {
    path, list: (params) => request(path + query(params)), get: (id) => request(path + '/' + id),
    create: (body) => request(path, { method: 'POST', body }),
    update: (id, body) => request(path + '/' + id, { method: 'PATCH', body }),
    remove: (id) => request(path + '/' + id, { method: 'DELETE' }),
  };
}
export const mediaUrl = (path) => BASE + path;
