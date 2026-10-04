import { crud, query, request } from './client';
export const crew = { ...crud('/api/crew'), optimize: (params) => request('/api/crew/optimize' + query(params)) };
