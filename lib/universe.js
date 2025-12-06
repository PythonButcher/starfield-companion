import fs from 'fs';
import path from 'path';

const universePath = path.join(process.cwd(), 'lib', 'data', 'starfield_universe.json');

// Load Starfield systems data from disk for API routes or server components
export function getUniverseSystems() {
  const raw = fs.readFileSync(universePath, 'utf-8');
  return JSON.parse(raw);
}
