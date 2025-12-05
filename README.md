# Starfield Companion (Next.js Monorepo)

This repository now runs entirely on **Next.js 14 (App Router)** from the project root. The legacy React/Flask code is preserved only for reference so you can compare contracts and UI behavior, but it is not part of the active build or runtime.

## Active runtime
- **Next.js app:** `/app` routes with shared UI in `/components` and data/utilities in `/lib`.
- **Shared components:** The `components/` directory is the active library used by the App Router pages (for example `app/page.jsx` imports `components/Navbar`). These files are the ported versions of the old CRA components and are safe to edit; they are not tied to the legacy `frontend/` code.
- **API routes:** Implemented as Next.js route handlers under `/app/api` (mirror of the former Flask endpoints).
- **Styling:** Tailwind CSS configured at the root; `app/globals.css` is imported by the root layout.

## Legacy directories (reference only)
- **`frontend/`** – the prior Vite/CRA-style React project (including its original `frontend/src/components`); kept intact for historical reference and comparison only. None of these files are imported by the Next.js build or scripts.
- **`backend/`** – the former Flask API. Retained to document original routes and logic; no Next.js code imports or executes it.

## Running the Next.js app
1. Install dependencies at the repo root: `npm install` (uses `package.json` in this directory).
2. Start the dev server: `npm run dev` (Next.js only).

> Note: The `frontend/` and `backend/` folders are excluded from the Next.js toolchain and are safe to ignore unless you need to inspect the legacy implementations.
