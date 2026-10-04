# Starfield Companion — Codex Mission Brief (Single-Run Maximum Impact)

> **How to use:** Tell Codex: *"Read `CODEX_MISSION_BRIEF.md` in the repo root and execute it end-to-end."*
> This is the only document Codex needs. Everything else is linked from here.

---

## 0. Role & Operating Mode

You are a senior full-stack engineer (React 19 / Vite 7 / Tailwind CSS v4 / Python Flask / SQLAlchemy / SQLite / Electron) and a product-minded UX designer who knows **Starfield** (Bethesda, 2023, incl. *Shattered Space* DLC) deeply.

You have **direct write access to this repository and a shell**. This is an autonomous, single-session run. The goal is to ship **as much verified, working improvement as possible** in one run.

**Operating rules:**

- **Act, don't propose.** Edit files directly. Do NOT paste full file contents into chat — that wastes your budget. Report via the final report file (Section 9).
- **Don't stop to ask permission.** Use professional judgment. If something is ambiguous, pick the most reasonable option, write it down in the decision log, and keep going.
- **Work in vertical slices.** Each slice = backend + frontend + test + verification, then a git commit. Never leave the app in a broken state between slices.
- **Verify, don't assume.** A slice is only "done" when the commands in Section 8 pass. Never claim something works without running it.
- **Use web search** to check Starfield game facts (resources, skills, companions, research projects, planet traits, etc.) instead of relying on memory. Put a source URL next to any seeded game data in a `_sources` field or a `backend/data/SOURCES.md` file.

---

## 1. Project Vision

A **"NASApunk"** companion app for Starfield players focused on:
1. **Immersion** — feels like an in-game terminal / ship computer.
2. **Narrative** — AI turns raw player notes into Captain's Logs.
3. **Logistics** — planning tools for resources, crew, outposts, research, and travel.

Aesthetic reference: Starfield's in-game UI — near-black backgrounds, off-white text, clean geometric sans-serif typography (think *DIN / Eurostile / Rajdhani / Barlow* style), thin 1px holographic borders, corner brackets, subtle scanlines, and the Constellation **stripe palette** (red → orange → yellow → blue) used sparingly as accents. Minimal, functional, high-contrast. Avoid generic "cyberpunk neon."

Background reading: [`STARFIELD_PROJECT_CONTEXT.md`](STARFIELD_PROJECT_CONTEXT.md), [`AGENT_HARNESS_INSTRUCTIONS.md`](AGENT_HARNESS_INSTRUCTIONS.md).

---

## 2. Ground Truth — What Actually Exists (verified audit)

Do not trust older descriptions over this table. Re-verify anything you depend on.

### Stack facts
| Area | Reality |
|---|---|
| Frontend | React 19, Vite 7, react-router-dom 7, **Tailwind v4 via `@tailwindcss/vite`** (theme tokens live in `frontend/src/index.css` under `@theme` — **there is no `tailwind.config.js`; do not create one**), `styled-components` also present (used by `ContextMenu.styles.jsx`). |
| Backend | Flask + Flask-SQLAlchemy + Flask-CORS. `backend/main.py` (all routes), `backend/models.py`, `backend/config.py`. DB = `backend/starfield.db` (created via `db.create_all()`, no migrations). |
| Desktop | `desktop-shell/` Electron 29 wrapper: spawns `python main.py` in `backend/` and loads `http://localhost:5173` (dev server only). `launch_starfield.bat` starts it. |
| Tests | `backend/test_backend.py` (unittest). No frontend tests. |
| AI | `/api/generate_narrative` returns a hard-coded mock. No OpenAI dependency installed. |

### Module status
| Module | Route / File | Status |
|---|---|---|
| **Explorer's Hub** | `/` → `pages/Hub.jsx` + `components/InteractiveMap.jsx` (pan/zoom star map, minimap, context menu, system search) | Map works against `/api/systems` (only a small hand-made `starfield_universe.json`). No recent-logs panel, no AI briefing panel. Uses inline styles. |
| **Quantum Journal** | `/journal` → `Journal.jsx` (lists logs via GET), `/journal/new` → `LogEntry.jsx` | **`LogEntry` never POSTs** — it only `console.log`s. Field names (`planet`, `notes`) don't match the API (`planet_name`, `raw_notes`). No edit/delete/view-detail, no "Generate Narrative" button, no tags. |
| **PlanetPulse** | `/planet-pulse` | **Placeholder text only.** `PlanetProfile` model exists but has **zero endpoints**. Not in the navbar. |
| **Crew Command** | `/crew` → `Crew.jsx`, `CrewCard.jsx` | Imports `../../../backend/data/crew_data.json` **directly across the frontend/backend boundary** (fragile). **No `CrewMember` model, no endpoints.** Data has generic fields (email, photo) rather than Starfield skills/traits. |
| **CosmoDrag** | `components/CosmoDropZone.jsx`, `cosmodrag/cosmoDragDispatcher.js` | **Broken import:** dispatcher imports `./handlers/journalImportHandler.js` but the file on disk is `journalImportHandler.js.js`. Handler only splits text by line and logs it. No `MediaItem` model, no upload endpoint, no media storage. |
| R.A.M. (Research) | `/ram` → `RamManager.jsx`, `/api/research` | Research-lab browser reading `research_clean.json`. Works; keep and improve. |
| Drive-By | `pages/DriveBy.jsx` (rendered as a navbar dropdown, not a route) | Contextual quick-action menu. Keep. |

### Known defects (fix these first)
1. `cosmoDragDispatcher.js` import path mismatch (`.js.js` file name) — rename the file.
2. `LogEntry.jsx` does not submit; payload keys mismatch backend.
3. API base URL `http://127.0.0.1:5000` hard-coded in components → centralize in `frontend/src/api/client.js` and add a Vite dev proxy for `/api`.
4. `Crew.jsx` imports backend JSON directly → serve via API.
5. `backend/starfield.db` is **tracked in git** → untrack it, add to `.gitignore`, seed on startup instead.
6. `datetime.utcnow` is deprecated → use timezone-aware UTC.
7. `/api/systems` opens JSON without `encoding='utf-8'`; no 404/400/validation handling on POST routes; no global JSON error handler.
8. `Navbar.jsx` logo glyph renders as `?` (encoding issue); PlanetPulse missing from nav.
9. `cosmoDragDispatcher.dispatch` has a debug `console.log` that prints functions.
10. `requirements.txt` is unpinned and missing `openai`, `python-dotenv`, `pytest`.
11. `App.css` is leftover Vite boilerplate; `Hub.jsx` uses inline styles inconsistent with the Tailwind design system.

---

## 3. Phase 0 — Bootstrap the Agent Harness (do this first, keep it short: ≤ 10% of effort)

`AGENT_HARNESS_INSTRUCTIONS.md` is a **proposal that has not been implemented** — `project_docs/` and `.codex/` do not exist yet. Create the minimal working version so this and future runs are traceable:

```text
AGENTS.md                                   # Root entry point Codex auto-reads: points to project_docs/INDEX.md, lists run/test commands & repo rules
.codex/hooks/README.md
.codex/hooks/pre_tool_use_policy.py         # Blocks: git restore/checkout/reset --hard/clean -f, rm -rf outside build dirs, blind `> file` redirection, force-push
project_docs/INDEX.md                       # Shortest route to current truth → active gate
project_docs/active/active_gate/README.md   # Starts with "Goal:"; scope; verification commands. Set it to THIS mission.
project_docs/active/status/project_execution_status.md   # Phase, current slice, done/blocked list — update after every slice
project_docs/active/architecture/README.md  # Durable decisions: API contract, data model, design tokens, AI provider abstraction
project_docs/active/architecture/API_CONTRACT.md         # Every endpoint: method, path, request JSON, response JSON, error shape, example fixture
project_docs/active/agent_harness/templates/SPECIALIST_HANDOFF_TEMPLATE.md
project_docs/archive/README.md
```

- Move `AGENT_HARNESS_INSTRUCTIONS.md` and this brief into `project_docs/archive/` **only at the very end** of the run (after writing the final report), and leave a one-line pointer in `INDEX.md`.
- The hook script must be a real, runnable Python script that reads the tool-call JSON from stdin and exits non-zero with a reason on denied commands. Include a tiny test for it.
- Keep `API_CONTRACT.md` updated as you add endpoints — it is the contract between frontend and backend.

---

## 4. Phase 1 — Foundation & Fix-Ups (P0, must complete)

1. Fix every defect in Section 2 "Known defects".
2. **Backend structure:** refactor `main.py` into an app factory (`create_app(config)`) with Flask **Blueprints** per domain (`logs`, `planets`, `crew`, `media`, `ai`, `reference` for systems/research). Keep `python main.py` working (Electron depends on it).
3. **Consistent API conventions:** JSON everywhere; errors as `{"error": {"code": str, "message": str, "details"?: any}}`; 400 on validation failure, 404 on missing; pagination/filter query params on list endpoints (`?q=`, `?tag=`, `?limit=`, `?offset=`).
4. **Config:** load `.env` with `python-dotenv`. Add `.env.example` (`OPENAI_API_KEY=`, `OPENAI_MODEL=`, `AI_MODE=mock|live`, `DATABASE_URL=`). Never commit real keys.
5. **Seeding:** idempotent `backend/seed.py` (also callable on startup when DB is empty) that loads reference JSON into tables.
6. **Frontend API layer:** `frontend/src/api/client.js` (fetch wrapper with error normalization) + one module per domain (`logs.js`, `planets.js`, `crew.js`, `media.js`, `ai.js`). Every page must handle **loading / empty / error** states.
7. **Design system (Tailwind v4 `@theme` in `index.css`):** define tokens for colors (space-black, panel, hairline border, star-white, muted, hud-blue, accent orange, warning red, success, the 4 Constellation stripe colors), font families (import a free Google font that fits — e.g. Rajdhani/Barlow/Inter for UI, JetBrains Mono for data readouts), spacing, glow shadows. Build reusable primitives in `frontend/src/components/ui/`: `Panel` (corner brackets + hairline border), `Button` (primary/ghost/danger), `Input`, `TextArea`, `Select`, `Tag`, `StatBar`, `Modal`, `Toast`, `EmptyState`, `Spinner/ScanLoader`, `SectionHeader`, `StripeAccent`. Replace inline styles. Respect `prefers-reduced-motion`.
8. **Layout:** persistent left or top nav with all modules (Hub, Journal, PlanetPulse, Crew, CosmoDrag/Media, R.A.M.), active-route highlighting, a 404 route, and keyboard shortcuts (e.g. `Ctrl+K` command palette / system search, `N` new log).

---

## 5. Phase 2 — Complete the Big 5 (P1, must complete)

Each module needs: model(s) → endpoints → tests → API module → UI with loading/empty/error states → entry in `API_CONTRACT.md`.

### 5.1 Quantum Journal
- `ExpeditionLog`: add `tags` (many-to-many `Tag` table or JSON list), `system_name`, `location` (optional), `mood`/`log_type` (Exploration, Combat, Trade, Faction, Personal), `stardate` display, `updated_at`, optional FK to `PlanetProfile`.
- Full CRUD: `GET/POST /api/logs`, `GET/PUT/PATCH/DELETE /api/logs/<id>`, search + tag filter.
- UI: list with search/filter, detail view, editor (create + edit), delete with confirm, **"Generate Captain's Log" button** that calls the AI endpoint and shows raw notes vs narrative side by side; user can accept/regenerate/edit before saving. Autosave draft to `localStorage`. Markdown export of a log.

### 5.2 AI Layer
- Provider abstraction in `backend/services/ai/` with `MockProvider` (deterministic, used in tests and when no key) and `OpenAIProvider` (official `openai` Python SDK, model from `OPENAI_MODEL` env, sensible timeout, error → clean 502 JSON).
- `POST /api/generate_narrative` — input: `{raw_notes, title?, planet_name?, tone?: "stoic"|"dramatic"|"noir"|"scientific", length?: "short"|"medium"|"long"}` → `{narrative, model, mode}`. Prompt in a versioned template file; stays in-universe (Constellation explorer, Settled Systems), no fabricated plot-critical spoilers unless notes mention them.
- `POST /api/strategize` — input: planet hazards/environment + player loadout/skills/crew → structured JSON recommendations (gear, skills, crew picks, risk level).
- `POST /api/resourcehunt` — **deterministic, non-AI** search over planet/resource data: given resource(s), return matching planets ranked (e.g., most target resources, fewest hazards); optional AI summary on top.
- `GET /api/briefing` — short AI "ship computer" briefing synthesized from the latest logs (mock-safe).

### 5.3 PlanetPulse
- `PlanetProfile` expansion: `system_name`, `type`, `gravity`, `temperature`, `atmosphere`, `magnetosphere`, `water`, `biomes`, `planetary_traits`, `resources` (normalized `Resource` table: name, symbol, type inorganic/organic, rarity), `flora`/`fauna` counts, `hazards`, `user_notes`, `surveyed_percent`, `favorite`, `outpost_candidate`.
- Seed a realistic starter dataset of well-known planets (e.g., Jemison, Mars, Luna, Akila, Neon/Volii, Niira, Earth, etc.) — **verify values via web search** and record sources. Mark anything uncertain as `"approximate": true`.
- Endpoints: full CRUD + filters (`?resource=`, `?hazard=`, `?system=`, `?min_gravity=`, `?max_gravity=`).
- UI: searchable/filterable grid + detail panel with hazard analysis badges, resource chips, survey progress bar, user notes editor, "Strategize" button (calls `/api/strategize`), and a **Resource Hunt** tool (calls `/api/resourcehunt`). Link a planet to its system on the Hub map and to related journal logs.

### 5.4 Crew Command
- `CrewMember` model: `name`, `role`/`faction`, `is_companion`, `skills` (name + rank 1–4), `traits`, `assigned_ship`/`assigned_outpost`, `affinity`/notes, `portrait_url` (optional, no copyrighted image scraping — use initials/generated avatars).
- Seed with real Starfield crew (Constellation companions like Sarah Morgan, Sam Coe, Barrett, Andreja, VASCO, plus several recruitable crew) — **verify skills via web search**. Replace current `crew_data.json` contents (keep the file as a seed source, fed through the API, not imported by the frontend).
- Endpoints: full CRUD + `GET /api/crew/optimize?goal=ship|outpost|combat&slots=N` — a transparent, deterministic scoring algorithm that picks the best crew combo for the goal and explains why.
- UI: roster grid with skill-rank pips, filters, assignment board (drag crew to Ship / Outpost slots — reuse CosmoDrag patterns), optimizer panel with explanation.

### 5.5 CosmoDrag (Media Manager)
- `MediaItem` model: `filename`, `original_name`, `mime_type`, `size`, `caption`, `tags`, `created_at`, optional FK to `ExpeditionLog` and/or `PlanetProfile`.
- `POST /api/media` (multipart upload, validate type: png/jpg/webp/gif/mp4; size limit; safe filenames via `secure_filename` + uuid), `GET /api/media`, `GET /api/media/<id>`, `PATCH`, `DELETE`, and `GET /media/<filename>` to serve files. Store under `backend/uploads/` (gitignored).
- UI: dedicated `/media` page — drag-and-drop zone (multi-file, progress), gallery grid, lightbox, tag/caption editing, drag a media item onto a log or planet to attach it. Make the dispatcher pattern real: handlers for image files, text drops (journal import), and JSON drops (bulk import logs/planets).

### 5.6 Explorer's Hub (Dashboard)
- Keep and polish the interactive star map; expand `starfield_universe.json` with more real systems (verified positions are approximate — that's fine, mark them), and link systems → planets in PlanetPulse.
- Dashboard panels around/over the map: **Recent Logs**, **AI Ship-Computer Briefing**, **Quick Stats** (logs, planets surveyed, crew, media count), **Favorite Planets**, **Active Research** (from R.A.M.).

---

## 6. Phase 3 — High-Value Enhancements (P2, do as many as possible, in this order)

Pick from this list after P0/P1 are verified. Use web search to ground each feature in real game mechanics. Each must ship as a complete vertical slice.

1. **Outpost Planner** — choose a planet, pick resources/extractors, compute power budget & storage, flag missing resources for chains (e.g., which planets supply the inputs for common manufactured components). Save outpost plans.
2. **Crafting / Research Chain Resolver** — extend R.A.M.: pick a research project or craftable item → full recursive tree of required resources, highlighting what the player already tracks as available.
3. **Skill Tree Planner** — the five skill trees (Physical, Social, Combat, Science, Tech) with tiers & ranks; plan a build, save builds, show which challenges unlock the next rank.
4. **Ship Loadout Notes** — ship records (class A/B/C, reactor, grav jump range, cargo, crew slots) linked to Crew Command assignments.
5. **Mission / Quest Tracker** — lightweight quests with faction (UC Vanguard, Freestar Rangers, Ryujin, Crimson Fleet, House Va'ruun), status, linked logs. Spoiler-safe toggle.
6. **Faction Reputation & Bounties panel**.
7. **Temple / Starborn Power Tracker** (spoiler-gated behind a toggle).
8. **Trade Route & Vendor Notes** — where to sell, credits caps, contraband notes.
9. **Data portability** — full JSON export/import of the user's data; Markdown/PDF export of the journal.
10. **Ambient immersion** — optional ship-computer UI sounds (muted by default), boot-sequence splash, stardate clock, subtle starfield background canvas.
11. **Electron improvements** — production mode that serves the built frontend (`vite build`) instead of the dev server, use `python`/`py`/venv detection, graceful backend shutdown on quit, wait-for-health before showing window.
12. **Accessibility & responsiveness** — keyboard nav, focus rings, ARIA labels, WCAG AA contrast, works at 1280px and on a tablet-width second screen (players often use a companion app on a tablet/second monitor).

Feel free to add other features you judge more valuable; record why in the decision log.

---

## 7. Constraints & Guardrails

- **Branching:** work on a new branch `codex/mission-run-1`. Commit after every verified slice with a conventional message (`feat(journal): ...`, `fix(cosmodrag): ...`). Never force-push, never rewrite history, never `git reset --hard` / `git checkout -- <file>` / `git clean`.
- **Don't break existing working features** (star map pan/zoom, context menu, system search, R.A.M., Drive-By, Electron launch).
- **No secrets in git.** AI must work in `mock` mode with no API key — all tests run in mock mode.
- **No copyrighted asset scraping** (no Bethesda images/fonts/audio). Use free fonts, SVG icons (e.g., `lucide-react`), and generated visuals.
- **Dependencies:** add only what pays for itself; pin versions in `requirements.txt`. Prefer the existing stack. JavaScript (no TS migration this run), but add JSDoc typedefs in `frontend/src/api/types.js` mirroring `API_CONTRACT.md`.
- **Schema changes:** since there are no migrations, either add Flask-Migrate (preferred) or make `seed.py` + a documented `reset_db` command; never silently drop user data on startup.
- **Code quality:** small modules, no dead code, no stray `console.log`, ESLint clean.

---

## 8. Definition of Done & Verification (run these; paste results into the final report)

Every slice must pass before commit; the full set must pass at the end:

```bash
# Backend
cd backend
python -m pip install -r requirements.txt
python -m pytest -q                      # convert/extend test_backend.py; cover every endpoint incl. 400/404 paths and AI mock mode
python main.py                           # boots on :5000; GET /api/health → {"status":"systems_nominal"}

# Frontend
cd frontend
npm install
npm run lint                             # zero errors
npm run build                            # succeeds
# Optional but encouraged: add Vitest + React Testing Library smoke tests for each page and `npm test`

# Harness
python .codex/hooks/pre_tool_use_policy.py --self-test   # or its pytest equivalent
```

Also do a **manual smoke pass** (or Playwright script if you add one): start backend + `npm run dev`, then create a log → generate narrative (mock) → save → edit → delete; create/filter a planet; run resource hunt; add/optimize crew; upload/attach/delete a media file; confirm Hub panels show real data.

A feature is **not done** if: it only works with hard-coded data, it lacks error/empty states, it has no test, or it isn't in `API_CONTRACT.md`.

---

## 9. Final Deliverables (end of run)

1. Write `project_docs/active/status/RUN_REPORT.md` containing:
   - Summary of what shipped, by phase, with commit hashes.
   - Verification output (pytest summary, lint, build).
   - **Decision log** — each non-obvious choice and why.
   - What's incomplete / known issues / tech debt, ranked.
   - Recommended next 5 slices for the next run (and update `active_gate/README.md` to the next goal).
   - Sources used for game data.
2. Update root `README.md` (create if missing) with: what the app is, screenshots/description of modules, setup (backend venv, `.env`, frontend, Electron), and test commands.
3. Ensure `AGENTS.md` and `project_docs/INDEX.md` reflect the new state.
4. Archive this brief and `AGENT_HARNESS_INSTRUCTIONS.md` into `project_docs/archive/`.

**Priority if you run low on budget:** P0 foundation → Journal + AI → PlanetPulse → Crew → CosmoDrag → Hub panels → P2 list. A smaller number of fully verified slices beats many half-finished ones. Always leave the repo building, tested, committed, and documented.
