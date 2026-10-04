# Starfield frontend

React 19, Vite and Tailwind v4. See the [root README](../README.md) for installation, routes, persistence, API setup and verification.

Run `npm run dev` here while Flask listens on port 5000. For production, `npm run build` emits dist, served by Flask and the Electron wrapper. `npm run lint` checks the frontend. `npm test` runs Playwright with Edge and isolated backend/frontend servers on ports 5001/5174.
