# Starfield Companion (Next.js Monorepo)

This repository now runs entirely on **Next.js 14 (App Router)** from the project root. The legacy React/Flask code is preserved only for reference so you can compare contracts and UI behavior, but it is not part of the active build or runtime.

## Active runtime
- **Next.js app:** `/app` routes with shared UI in `/components` and data/utilities in `/lib`.
- **API routes:** Implemented as Next.js route handlers under `/app/api` (mirror of the former Flask endpoints).
- **Styling:** Tailwind CSS configured at the root; `app/globals.css` is imported by the root layout.

## Legacy directories (reference only)
- **`frontend/`** – the prior Vite/CRA-style React project. Kept intact for historical reference; not invoked by `npm run dev/build/start`.
- **`backend/`** – the former Flask API. Retained to document original routes and logic; no Next.js code imports or executes it.

## Running the Next.js app
1. Install dependencies at the repo root: `npm install` (uses `package.json` in this directory).
2. Start the dev server: `npm run dev` (Next.js only).

> Note: The `frontend/` and `backend/` folders are excluded from the Next.js toolchain and are safe to ignore unless you need to inspect the legacy implementations.
