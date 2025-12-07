# Starfield Companion (Next.js)

This branch contains the Next.js 14 App Router version of Starfield Companion. It ships a Prisma + SQLite backend implemented with Route Handlers and a Tailwind-powered UI.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Prepare the database (SQLite via Prisma):

   ```bash
   npx prisma migrate dev --name init
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

The app exposes APIs at `/api/health`, `/api/logs`, `/api/generate_narrative`, and `/api/universe`.

## Environment

Copy `.env.example` to `.env` and ensure `DATABASE_URL="file:./prisma/dev.db"`.
