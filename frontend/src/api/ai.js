import { request } from './client';
export const ai = {
  narrative: (body) => request('/api/generate_narrative', { method: 'POST', body }),
  strategize: (body) => request('/api/strategize', { method: 'POST', body }),
  resourceHunt: (body) => request('/api/resourcehunt', { method: 'POST', body }),
  briefing: () => request('/api/briefing'),
};
