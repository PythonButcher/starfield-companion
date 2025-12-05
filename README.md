# Starfield Companion (Next.js)

A monolithic Next.js 14+ companion app styled with Tailwind CSS. It combines a star map hub, expedition journal, and crew manifest in a single App Router project.

## Project Structure
- `app/` – App Router pages and API route handlers
  - `app/api/health` – uptime check
  - `app/api/logs` – in-memory expedition log store (GET/POST)
  - `app/api/generate_narrative` – mock narrative generator
- `components/` – shared UI (navbar, map, cards)
- `lib/data/` – local seed data (crew roster, systems, initial logs)

## Getting Started
1. Install dependencies
   ```bash
   npm install
   ```
2. Run the dev server
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000 to explore the hub.

## Styling
Tailwind is configured in `tailwind.config.js` to scan `app/`, `components/`, and `lib/`. Global styles live in `app/globals.css`.

## Notes
- API routes use in-memory data today; swap in a database as needed.
- Components that rely on hooks declare the `"use client"` directive.
