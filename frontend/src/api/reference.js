import { request } from './client';
export const reference = { systems: () => request('/api/systems?limit=200'), research: () => request('/api/research?limit=200') };
