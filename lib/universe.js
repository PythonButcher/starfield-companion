import universeData from './data/starfield_universe.json';

// Simple loader so route handlers and server components can read the static universe data.
export function getUniverseSystems() {
  return universeData;
}
