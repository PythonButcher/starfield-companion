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

## 0.5 Success Criteria — This Is a Product Run, Not a Facelift

> [!IMPORTANT]
> This run is judged mainly on **new, useful player-facing capability**. Visual polish alone counts for almost nothing. A run that re-skins the UI and finishes the existing modules but adds no new features has **failed**.

**Hard requirements:**

1. **Finish what exists.** All Big 5 modules work end-to-end with real persisted data (Sections 4–5).
2. **Ship at least 6 NEW features** that don't exist in the repo today. Each must be a full vertical slice: data model and/or real logic, API endpoint(s), UI, tests, and an entry in `API_CONTRACT.md`. At least **3** of the 6 must be **your own ideas**, not taken from the suggestion list in Section 6.
3. **Every new feature must have real logic or real data behind it**, such as a calculation, recommendation, search, simulation, AI generation, or cross-module link. Static pages, mock screens, and "coming soon" panels **do not count**.
4. **Make the modules work together.** The app should feel like one connected tool, not five separate pages. Examples: logs link to planets, planets link to outposts and research, crew link to ships and outposts, media attach to anything, and the Hub summarizes everything.

**Effort split (rough guide):**

| Work | Share of effort |
|---|---|
| Harness bootstrap + P0 fixes | ~10% |
| **Real game-data pipeline (Section 2.5)** | **~15%** |
| Completing the Big 5 | ~30% |
| **New features (Section 6)** | **~40%** |
| Visual design system & polish | ≤5–10% (build it once as reusable primitives, then move on) |

**Required ideation step (do this before writing code, ~5 min):**

1. Web-search what Starfield players actually struggle with and wish they had. Good places to look: r/Starfield and r/starfieldmods threads, Steam discussions, popular community tools and wikis, and patch notes for newer systems (e.g., Shattered Space, Creations, surface vehicles/REV-8, Terran Armada).
2. Write **10–15 candidate feature ideas** into `project_docs/active/active_gate/FEATURE_IDEAS.md`. For each idea, record:
   - **Evidence of player demand:** at least one link to a real thread, review, or popular community tool that shows players want it. If you can't find evidence, the idea scores low.
   - **Data it needs**, and whether Section 2.5 sources can provide that data.
   - Scores (1–5) for **player value**, **data availability**, **feasibility this run**, and **novelty** (does it beat what INARA or the wiki already offer, e.g., by combining the player's *own* progress with game data?).
3. Pick the top ones (at least 6, with at least 3 original), record why, and build them. Update the file as features ship.

**Creativity guidance.** Think about what a dedicated player would keep open on a second monitor or tablet while playing. Some directions to spark ideas (don't copy them blindly):
- **Decision support:** "where should I go next for X," best outpost site, cheapest way to level a skill.
- **Memory aids:** "what was I doing on this planet," unfinished business, NPCs and vendors I met.
- **Narrative play:** AI-generated side missions or rumors from my own logs, a "ship computer" that answers questions about my playthrough (RAG over the user's own logs/planets/crew), a captain's-log timeline or "season recap."
- **Planning and optimization:** builds, crafting chains, outpost logistics, crew synergy, ship configurations.
- **Playthrough meta:** NG+ universe tracking (what carries over), multiple character profiles, achievement/challenge tracking.

**Budget rule:** if you run short, finish fewer new features *completely* rather than many halfway. But do **not** spend new-feature time on extra styling. Polish only after the 6-feature minimum is met.

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

## 2.5 Real Game Data Strategy (MANDATORY — features must run on real data)

> [!IMPORTANT]
> The current data is toy-sized: `starfield_universe.json` has a handful of hand-made systems with invented coordinates, and `crew_data.json` is placeholder people. Features like resource hunting, outpost planning, crafting chains, and crew optimization are only useful with **complete, accurate game data**. Building a reproducible, license-clean data pipeline is a core deliverable of this run.

### Source tiers (use in this order)

| Tier | Source | How to use | Notes |
|---|---|---|---|
| **A — Preferred API** | **Starfield Wiki** (`https://starfieldwiki.net/w/api.php`, MediaWiki 1.38, run by the UESP team). Content license **CC BY-SA 4.0** (checked via `meta=siteinfo&siprop=rightsinfo`). | Use the MediaWiki API: `action=query&list=categorymembers` to enumerate pages (planets, systems, resources, skills, research projects, crafting recipes, companions, outpost modules, ship parts), then `action=parse&prop=wikitext` or `action=query&prop=revisions&rvprop=content` to fetch infobox templates. Parse the wikitext with `mwparserfromhell`. | Batch titles (up to 50 per request), send `maxlag=5`, set a descriptive `User-Agent` (e.g., `StarfieldCompanion/0.1 (personal project; contact in repo)`), throttle to about 1 request/second, and cache raw responses. |
| **A — Alternate API** | Starfield Fandom wiki (`https://starfield.fandom.com/api.php`), CC BY-SA. | Same MediaWiki approach; use it to cross-check or fill gaps. | Same politeness rules. |
| **B — Open datasets** | GitHub repos, gists, or Kaggle datasets with game data extracted to JSON/CSV. | Use **only if the repo has an explicit license** that allows reuse. Record repo URL, commit SHA, and license. | Search GitHub (`starfield planets json`, `starfield data`), and look for the community "Starfield data repository / complete list of everything" threads on r/Starfield. |
| **C — Reference only (do NOT scrape)** | INARA (`inara.cz/starfield`), Starfield Compendium, StarfieldDB, Fextralife, mattgyver.com outpost guides. | Use for **manual spot-checks** of your pipeline output, and as **deep-link targets** in the UI (e.g., an "Open on INARA / Wiki" button next to a planet or resource). | Proprietary or unclear terms. Do not bulk-download, scrape HTML, or copy their tables. |
| **D — The user's own game files (optional importer)** | The player's installed `Starfield.esm`, exported locally by the user with xEdit/SF1Edit into CSV/JSON. | Build an **import endpoint + UI** that accepts those exports, validates them against the same schema, and overrides or enriches reference data **locally**. | Never commit extracted game files. This is the most accurate source and also works after patches, Creations, and DLC. |

Never use or commit Bethesda images, audio, fonts, or 3D models. Text facts (names, numbers, relationships) from Tier A/B with attribution are fine.

### Pipeline requirements

Build `backend/data_pipeline/` as a reproducible, testable package:

```text
backend/data_pipeline/
  sources/        # starfield_wiki.py, fandom_wiki.py, github_dataset.py, local_import.py
  parsers/        # infobox → dict, one module per entity type
  normalize.py    # canonical names, units (gravity in g, temp class), resource symbols, slug IDs
  validate.py     # schema checks (pydantic or jsonschema), referential integrity (planet→system, recipe→resource)
  build.py        # CLI: python -m data_pipeline.build [--only planets] [--offline]
  cache/          # raw API responses (gitignored)
backend/data/reference/
  systems.json  planets.json  resources.json  research.json  recipes.json
  skills.json   crew.json     outpost_modules.json  ship_parts.json  factions.json
  manifest.json   # per file: source(s), fetch timestamp (UTC), record count, license, pipeline version
backend/data/SOURCES.md      # human-readable attribution + license notes (CC BY-SA ShareAlike applies to derived data files)
```

- **Coverage target:** aim for **complete** coverage of systems, planets/moons (with resources, traits, gravity, temperature, atmosphere, magnetosphere, flora/fauna counts), resources (type, rarity, symbol), research projects, crafting/outpost recipes, skills (tree, tier, ranks, rank challenges), and companions/crew (skills). Report the actual counts in the manifest. Do not claim completeness you didn't verify.
- **Star map coordinates:** if real coordinates are available from a Tier A/B source, use them. Otherwise keep layout coordinates and mark them `"layout_only": true`.
- **Quality gate:** `build.py` prints a data-quality report: counts per entity, % missing per field, broken references, and duplicates. **Spot-check at least 10 random records** against a Tier C site by hand and log any mismatches in `SOURCES.md`.
- **Tests:** parser tests use saved wikitext fixtures in `backend/tests/fixtures/`. **No network calls in tests.**
- **Seeding:** `seed.py` loads `backend/data/reference/*.json` into the DB idempotently. User-created data (logs, notes, favorites, crew assignments) is stored separately from reference data and is **never overwritten** by a re-seed.
- **Existing files:** check where `research_clean.json` / `research_laboratory.json` came from. Keep them if they're verifiable; otherwise replace them with pipeline output and note it.
- **Freshness:** add `GET /api/reference/meta` (returns the manifest) and show "Data as of <date> · Sources" in the app footer, with attribution links.
- **If network access is unavailable** during the run, build the pipeline and parsers against fixtures anyway, commit the best verified seed data you can, and flag it clearly in `RUN_REPORT.md`.

### Data → feature mandate

Every feature in Sections 5–6 that touches game facts must query this reference data, not hard-coded arrays. In `RUN_REPORT.md`, list for each feature which reference datasets it uses.

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
- Data comes from the **reference pipeline (Section 2.5)**, covering every planet and moon, not a hand-picked sample. Keep reference fields read-only and store player fields (`user_notes`, `surveyed_percent`, `favorite`, `outpost_candidate`, `visited`) in a separate user-overlay table keyed by planet ID.
- Endpoints: list/detail with server-side filtering, sorting, and pagination over the full dataset (`?resource=` (multiple values allowed, AND/OR), `?hazard=`, `?system=`, `?trait=`, `?min_gravity=`, `?max_gravity=`, `?has_flora=`, `?habitable=`), plus PATCH for the user overlay. Index the DB columns used for filtering so queries stay fast.
- UI: searchable/filterable grid + detail panel with hazard analysis badges, resource chips, survey progress bar, user notes editor, "Strategize" button (calls `/api/strategize`), a **Resource Hunt** tool (calls `/api/resourcehunt`), and "Open on Starfield Wiki / INARA" deep links. Link a planet to its system on the Hub map and to related journal logs.

### 5.4 Crew Command
- `CrewMember` model: `name`, `role`/`faction`, `is_companion`, `skills` (name + rank 1–4), `traits`, `assigned_ship`/`assigned_outpost`, `affinity`/notes, `portrait_url` (optional, no copyrighted image scraping — use initials/generated avatars).
- Seed **all** companions and recruitable crew, with their real skills and ranks, from the reference pipeline (`crew.json`, sourced from the Starfield Wiki). Retire the placeholder `crew_data.json` (or regenerate it from the pipeline). Players can add custom crew and track which crew they've actually recruited.
- Endpoints: full CRUD + `GET /api/crew/optimize?goal=ship|outpost|combat&slots=N` — a transparent, deterministic scoring algorithm that picks the best crew combo for the goal and explains why.
- UI: roster grid with skill-rank pips, filters, assignment board (drag crew to Ship / Outpost slots — reuse CosmoDrag patterns), optimizer panel with explanation.

### 5.5 CosmoDrag (Media Manager)
- `MediaItem` model: `filename`, `original_name`, `mime_type`, `size`, `caption`, `tags`, `created_at`, optional FK to `ExpeditionLog` and/or `PlanetProfile`.
- `POST /api/media` (multipart upload, validate type: png/jpg/webp/gif/mp4; size limit; safe filenames via `secure_filename` + uuid), `GET /api/media`, `GET /api/media/<id>`, `PATCH`, `DELETE`, and `GET /media/<filename>` to serve files. Store under `backend/uploads/` (gitignored).
- UI: dedicated `/media` page — drag-and-drop zone (multi-file, progress), gallery grid, lightbox, tag/caption editing, drag a media item onto a log or planet to attach it. Make the dispatcher pattern real: handlers for image files, text drops (journal import), and JSON drops (bulk import logs/planets).

### 5.6 Explorer's Hub (Dashboard)
- Keep and polish the interactive star map, but drive it from pipeline `systems.json` (every system, with star class, level range, faction, planet count). Add map filters, e.g., "systems containing resource X" or "systems with my outposts or logs," and link systems → planets in PlanetPulse.
- Dashboard panels around/over the map: **Recent Logs**, **AI Ship-Computer Briefing**, **Quick Stats** (logs, planets surveyed, crew, media count), **Favorite Planets**, **Active Research** (from R.A.M.).

---

## 6. Phase 3 — NEW Features (P1, MANDATORY: at least 6, at least 3 of your own design)

This phase is required, not a bonus. See Section 0.5. Use web search to base each feature on real game mechanics. Each must ship as a complete vertical slice and be listed in `FEATURE_IDEAS.md` with its score.

### 6A. Suggested features (count toward the 6; maximum 3 from this list)
1. **Outpost Planner** — choose a planet, pick resources/extractors, compute power budget & storage, and flag missing resources for production chains (e.g., which planets supply the inputs for common manufactured components). Save outpost plans.
2. **Crafting / Research Chain Resolver** — extend R.A.M.: pick a research project or craftable item → full recursive tree of required resources, highlighting what the player already tracks as available and *which known planets supply the rest*.
3. **Skill Tree Planner** — the five skill trees (Physical, Social, Combat, Science, Tech) with tiers & ranks; plan a build, save builds, show which challenges unlock the next rank, and recommend crew whose skills fill your gaps.
4. **Ship Registry & Loadout** — ship records (class A/B/C, reactor, grav jump range, cargo, crew slots) linked to Crew Command assignments, with a jump-range check against the star map.
5. **Mission / Quest Tracker** — lightweight quests with faction (UC Vanguard, Freestar Rangers, Ryujin, Crimson Fleet, House Va'ruun), status, and linked logs/planets. Spoiler-safe toggle.
6. **"Ship Computer" Q&A** — ask natural-language questions about *your own* playthrough ("where did I find Aluminum?", "which crew is best for my outpost on Jemison?"), answered from the user's logs/planets/crew (retrieval + AI, with a mock mode).
7. **AI Rumor / Side-Mission Generator** — generates in-universe leads from the player's logs and planets that can be accepted into the quest tracker.
8. **Playthrough / NG+ Profiles** — multiple characters or universes, each with its own data, and a summary of what carries over.
9. **Faction Reputation & Bounties**, **Temple / Starborn Power Tracker** (spoiler-gated), **Trade & Vendor Notes** (credit caps, contraband).

### 6B. Your own ideas (at least 3 required)
Come up with these during the ideation step (Section 0.5). Prefer features that **connect multiple modules** and that a player would actually use mid-session. In `RUN_REPORT.md`, explain the player problem each one solves and how you validated that it's a real need (e.g., links to community threads).

### 6C. Infrastructure & polish (valuable, but does NOT count toward the 6)
- **Data portability:** full JSON export/import; Markdown export of the journal.
- **Electron production mode:** serve the built frontend, detect venv/`py`, wait for the backend health check before showing the window, shut the backend down cleanly on quit.
- **Accessibility & responsiveness:** keyboard nav, focus rings, ARIA, WCAG AA contrast, tablet/second-screen layout.
- **Ambient immersion:** optional UI sounds (muted by default), boot splash, starfield background canvas.

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
   - **New Features Showcase** (first section): for each new feature, give its name, the player problem it solves, how to try it (route + steps), whether it is original or from the suggested list, and its key endpoints.
   - Summary of what shipped, by phase, with commit hashes.
   - Verification output (pytest summary, lint, build).
   - **Decision log** — each non-obvious choice and why.
   - What's incomplete / known issues / tech debt, ranked.
   - Recommended next 5 slices for the next run (and update `active_gate/README.md` to the next goal).
   - Sources used for game data.
2. Update root `README.md` (create if missing) with: what the app is, screenshots/description of modules, setup (backend venv, `.env`, frontend, Electron), and test commands.
3. Ensure `AGENTS.md` and `project_docs/INDEX.md` reflect the new state.
4. Archive this brief and `AGENT_HARNESS_INSTRUCTIONS.md` into `project_docs/archive/`.

**Priority order:** P0 foundation → **data pipeline (systems, planets, resources first; then skills, crew, research, recipes)** → Journal + AI → **2 new features** → PlanetPulse → Crew → **2 more new features** → CosmoDrag → Hub panels → **remaining new features (to reach ≥6)** → 6C infra/polish. New features are interleaved on purpose so they can't be squeezed out at the end. A smaller number of fully verified slices beats many half-finished ones. Always leave the repo building, tested, committed, and documented.
