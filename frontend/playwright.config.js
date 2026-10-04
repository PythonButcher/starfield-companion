import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:5174', headless: true, channel: 'msedge', viewport: { width: 1280, height: 900 } },
  webServer: [
    { command: '"../.venv/Scripts/python.exe" "../backend/tests/serve_smoke.py"', url: 'http://127.0.0.1:5001/api/health', reuseExistingServer: false },
    { command: 'npm run dev -- --port 5174 --strictPort', url: 'http://127.0.0.1:5174', env: { BACKEND_URL: 'http://127.0.0.1:5001' }, reuseExistingServer: false },
  ],
});
