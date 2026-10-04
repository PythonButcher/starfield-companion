# Starfield Companion — Codex Mission Brief (Resumption & Completion)

> **Instruction for Codex:**
> Read this file in full. Codex already executed Slices 1–3 on branch `codex/mission-run-1` (commits `b64422f` through `96e5e9d`).
> Your task in this session is to **resume from the checkpoint below**, complete the remaining core modules, implement the **6 approved high-value player tools**, connect them into the Explorer's Hub, verify everything end-to-end, and output the final deliverables.
> **Act directly on the codebase. Do not stop to ask permission.**

---

## 0. Current Checkpoint & Verified Ground Truth

### What is ALREADY completed and committed on this branch:
1. **Agent Harness & Safety**:
   - `AGENTS.md`, `.codex/hooks/pre_tool_use_policy.py` (passes 12 self-test cases).
   - `project_docs/INDEX.md`, `project_docs/active/active_gate/README.md`, `project_docs/active/architecture/API_CONTRACT.md`, `project_docs/active/status/project_execution_status.md`.
2. **Foundation & API Client**:
   - App factory in `backend/main.py`, blueprints in `backend/routes/`.
   - Error handling conventions, UTC timestamps, `python-dotenv`, mock AI provider.
   - Frontend API client in `frontend/src/api/client.js` with domain modules.
3. **Quantum Journal**:
   - `ExpeditionLog` model with tags, stardates, notes, tone/length options.
   - AI narrative generation via `/api/generate_narrative` (mock & live provider).
   - Full CRUD UI with autosave and Markdown export.
4. **PlanetPulse**:
   - `PlanetProfile` with survey percent, hazards, resources, user notes, and favorites.
   - Deterministic multi-resource hunt via `POST /api/resourcehunt`.
   - Sourced survey database with server-side filtering and deep-links.
5. **Crew Command**:
   - Real Starfield companion skills and ranks, roster assignment board.
   - Explainable crew optimizer via `/api/crew/optimize`.
6. **Data Pipeline Scaffold**:
   - `backend/data_pipeline/sources/starfield_wiki.py` with caching and MediaWiki API integration.
7. **Current Test Status**:
   - 56 backend tests passing (`python -m pytest -q backend`).
   - Frontend lint (`eslint .`) and build (`vite build`) passing with 0 errors.

---

## 0.5 Mission Objectives for This Run

1. **Complete Remaining Core Modules**:
   - **CosmoDrag (Media Manager)**: persistence, uploads, gallery UI, drag attachment.
   - **Explorer's Hub (Dashboard)**: connect live data, star map, and widget panels.
2. **Deliver the 6 Approved High-Value Player Tools** (from [`FEATURE_IDEAS.md`](project_docs/active/active_gate/FEATURE_IDEAS.md)):
   - 3 Suggested: Outpost Power Planner, Recursive Crafting Resolver, Mission Tracker.
   - 3 Original: Resource Coverage Portfolio, Survey Gap Ledger, Session Resume Radar.
3. **Cross-Module Interconnection**:
   - Make the companion feel like an integrated ship terminal. Outposts connect to planets; crafting needs link to planetary resources; missions link to systems; the Session Resume Radar synthesizes everything for session start.
4. **Complete Verification & Deliverables**:
   - All tests passing, `API_CONTRACT.md` updated, `RUN_REPORT.md` written, `README.md` updated.

---

## 1. Remaining Core Modules (P0)

### 1.1 CosmoDrag (Media Manager)
- **Data Model (`MediaItem`)**:
  - `id`, `filename`, `original_name`, `mime_type`, `size`, `caption`, `tags` (JSON/list), `planet_id` (FK optional), `log_id` (FK optional), `created_at` (UTC).
- **Backend Endpoints**:
  - `POST /api/media` (multipart upload: validate images/videos, limit 10MB, sanitize filenames via UUID, save to `backend/uploads/` which is gitignored).
  - `GET /api/media` (filter by `planet_id`, `log_id`, `tag`, with pagination).
  - `GET /api/media/<id>`, `PATCH /api/media/<id>` (edit caption/tags/associations), `DELETE /api/media/<id>` (unlinks and deletes file).
  - `GET /media/<filename>` (serve uploaded files safely).
- **Frontend UI & Dispatcher**:
  - Fix and standardize `frontend/src/cosmodrag/cosmoDragDispatcher.js` and handlers.
  - Dedicated `/media` gallery page: drag-and-drop zone with preview, upload progress, filter by tags/planets, lightbox view, caption editor.
  - Drag-to-attach onto Journal entries and Planet cards.

### 1.2 Data Pipeline Expansion & Seeding
- Complete reference datasets in `backend/data/reference/`:
  - `recipes.json`: crafting recipes, manufactured components (e.g. Adaptive Frame, Comm Relay, Indicite Wafer) with required ingredients.
  - `outpost_modules.json`: extractors, power generators (Solar, Wind, Fueled, Nuclear), storage containers, and build costs.
  - `systems.json`: expand system coordinates and metadata for map integration.
- Ensure `seed.py` loads these cleanly and idempotently into SQLite without overwriting user data.

---

## 2. The 6 Approved High-Value Player Tools (P1 — MANDATORY)

These 6 tools were selected based on real community pain points (cited in `FEATURE_IDEAS.md`). Every tool must be a **complete vertical slice**: DB model or algorithmic logic, API endpoint(s), responsive UI, and backend tests.

---

### Tool 1: Outpost Power & Logistics Planner (Suggested)
- **Problem Solved**: Players struggle to balance power requirements for extractors across diverse planetary environments (e.g., wind depends on atmosphere, solar depends on sun proximity) and keep track of storage capacity.
- **Backend**:
  - Model `OutpostPlan`: `id`, `name`, `planet_id`, `planet_name`, `modules` (JSON array of `{module_id, count}`), `notes`, `created_at`, `updated_at`.
  - Endpoint `POST /api/outposts/plan`: calculates power generation vs consumption, net power surplus/deficit, storage limits, and extracted resource rates based on planet attributes.
  - CRUD endpoints: `GET/POST /api/outposts`, `GET/PATCH/DELETE /api/outposts/<id>`.
- **Frontend**:
  - Outpost Planner view (under navigation `/outposts` or tab in PlanetPulse).
  - Module selector (Extractors, Power, Storage, Fabricators).
  - Real-time power balance gauge (HUD-styled red warning on deficit).
  - "Save Plan" and "Export Shopping List" buttons.
- **Cross-module link**: Accessible directly from any planet detail in PlanetPulse ("Build Outpost Here").

---

### Tool 2: Recursive Crafting & Research Resolver (Suggested)
- **Problem Solved**: Advanced research projects and weapon/space suit mods require manufactured components (e.g., Reactive Gauge, Tau Grade Rheostat), which require sub-components, which require base elements. Players lose track of the raw shopping list.
- **Backend**:
  - Endpoint `POST /api/crafting/resolve`:
    - Input: target item/research name, target quantity, optional user current inventory `{ "Iron": 10, ... }`.
    - Logic: recursively traverses recipe dependency tree down to raw periodic table elements / organic resources.
    - Output:
      - Flattened raw material totals required.
      - Net deficit after applying user inventory.
      - **Best supplier planets**: queries `PlanetProfile` to list planets in the Settled Systems where each missing raw element can be mined/gathered.
  - Endpoint `GET /api/crafting/recipes`: lists all craftable components and research projects.
- **Frontend**:
  - Resolver interface within R.A.M. (`/ram`) or dedicated tab.
  - Searchable recipe picker + quantity counter.
  - Visual dependency tree (interactive node or indented breakdown).
  - "Raw Materials Shopping List" with direct links to "Find on Planets" (pre-populates Resource Hunt).

---

### Tool 3: Mission & Objective Tracker (Suggested)
- **Problem Solved**: Starfield quests and personal player goals (e.g., "Find temple on Bessel III", "Survey Kryx system", "UC Vanguard progression") get lost between gaming sessions.
- **Backend**:
  - Model `PlayerObjective`: `id`, `title`, `faction` (Constellation, UC Vanguard, Freestar, Ryujin, Crimson Fleet, Independent), `category` (Main, Faction, Survey, Outpost, Personal), `status` (Active, Completed, Paused), `priority` (High, Medium, Low), `target_planet_id` (FK), `target_system` (string), `notes`, `checklist` (JSON array of `{id, text, done}`), `linked_log_ids` (JSON), `created_at`, `completed_at`.
  - CRUD endpoints: `GET/POST /api/missions`, `GET/PATCH/DELETE /api/missions/<id>`.
  - Query filters: `?faction=`, `?status=`, `?planet_id=`.
- **Frontend**:
  - Mission Command view (`/missions` in nav).
  - High-contrast HUD checklist with filterable faction tabs.
  - Quick action: "Log Entry for Mission" (pre-fills title & planet into Journal).
  - Spoiler-safe toggle (hides story details if user wants pure objective checklists).

---

### Tool 4: Resource Coverage Portfolio (Original)
- **Problem Solved**: Players building industrial supply networks want to know which resources their outposts collectively produce, what gaps remain across the periodic table, and where the single best next outpost site should be.
- **Backend**:
  - Endpoint `GET /api/portfolio/coverage`:
    - Aggregates all user outposts and their extracted resources.
    - Compares against the master catalog of Settled Systems resources (common, uncommon, rare, exotic, unique).
    - Calculates portfolio coverage percentage (% of inorganic elements extracted).
    - **Greedy Optimization Recommendation**: runs a set-cover algorithm over candidate planets to identify the top 3 recommended planets that would extract the highest number of *currently unharvested* resources in a single new outpost.
- **Frontend**:
  - Portfolio Dashboard view (`/portfolio` or sub-view in Outpost Planner).
  - Periodic table / Resource Matrix heat map (harvested vs missing).
  - "Next Best Outpost Recommendation" card with explanation and "Plan Outpost" button.

---

### Tool 5: Survey Gap Ledger (Original)
- **Problem Solved**: 100% surveying planets is rewarding but frustrating when stuck at 85% with 1 missing fauna or 1 undiscovered planetary trait. Players cannot remember what specific category is missing.
- **Backend**:
  - Endpoint `GET /api/surveys/gaps`:
    - Evaluates all planets with survey progress > 0% and < 100%.
    - Pinpoints exact missing items: missing resource count, remaining flora/fauna to catalogue, and uninspected traits.
    - Computes system survey completion rates (e.g. "Cheyenne: 8/10 planets fully surveyed").
  - `PATCH /api/surveys/<planet_id>/counters`: updates player progress counters (`scanned_flora`, `scanned_fauna`, `discovered_traits`).
- **Frontend**:
  - Survey Gap Ledger view (in PlanetPulse or standalone tab).
  - Filter by system or completion tier (e.g. "Nearly Done (>75%)").
  - Breakdown badges per planet: `Flora: 3/4`, `Fauna: 2/5 (Ocean biomes likely)`, `Traits: 1/2`.
  - "Launch Expedition" action button creating a draft survey log in Journal.

---

### Tool 6: Session Resume Radar (Original)
- **Problem Solved**: Returning to Starfield after days or weeks leads to "Where was I and what was I doing?" disorientation. Players need an immediate, actionable ship-computer handover.
- **Backend**:
  - Endpoint `GET /api/radar/session_handover`:
    - Synthesizes state across all modules:
      - **Last Known Position**: planet/system from the most recent journal log or survey.
      - **Unfinished Missions**: active high-priority objectives with checklist progress.
      - **Critical Outpost Alerts**: any outpost with power deficits or storage overflows.
      - **Nearby Survey Targets**: incomplete planets in or near the current star system.
      - **Recent Captain's Log**: snippet of last written narrative to re-immerse in character.
- **Frontend**:
  - "Session Radar" panel featured prominently on the **Explorer's Hub Dashboard (`/`)** and available in the navbar.
  - Tactical terminal aesthetic: "CHRONO LOG: RESUMING COMMAND".
  - Actionable one-click resume shortcuts: "Jump to Active Mission", "Log Current Activity", "Fix Outpost Power".

---

## 3. Explorer's Hub Integration (P1)

Connect the Explorer's Hub (`/`) so it serves as the operational nerve center of the entire companion:
- **Interactive Star Map**: rendered with systems, filterable by faction, outposts, and active missions.
- **Tactical Dashboard Overlay / Grid**:
  - **Widget 1: Session Resume Radar** (summarized handover card).
  - **Widget 2: AI Ship Briefing** (connected to `/api/briefing`).
  - **Widget 3: Fleet & Outpost Stats** (active crew, total outposts, overall resource coverage %).
  - **Widget 4: Recent Captain's Logs** (latest 3 logs with quick read modal).
  - **Widget 5: Favorite Worlds & Survey Milestones**.

---

## 4. Technical Constraints & Quality Standards

1. **Stack Conventions**:
   - Frontend: React 19, Vite, Tailwind v4 theme tokens in `frontend/src/index.css` (no `tailwind.config.js`).
   - Backend: Flask app factory, SQLAlchemy models, Blueprints in `backend/routes/`.
   - Desktop: Keep Electron wrapper working (`desktop-shell/main.js`).
2. **Persistence & Data Safety**:
   - All models persist to SQLite `backend/starfield.db`.
   - Never overwrite user data when seeding reference data.
   - Use ISO 8601 UTC timestamps everywhere.
3. **Frontend UI States**:
   - Every view and widget must have clean **Loading**, **Empty**, and **Error** states.
   - Consistent NASApunk aesthetic: dark backgrounds (`#0b0c15`), HUD borders (`#5bc0de`), Constellation stripe accents (`#d9534f`, `#f0ad4e`, `#5bc0de`).
4. **Git Discipline**:
   - Stay on branch `codex/mission-run-1`.
   - Work in verified vertical slices: backend logic + test + frontend UI + validation.
   - Commit after each slice with conventional commit format (e.g., `feat(outposts): ...`, `feat(media): ...`).
   - Never use destructive git commands (`git reset --hard`, `git clean -f`, `git restore`).

---

## 5. Verification Gate (Run Before Completing)

Execute these commands from PowerShell at repo root:

```powershell
# 1. Backend tests (all tests must pass, 0 failures)
python -m pytest -q backend

# 2. Frontend lint & build (0 errors)
npm --prefix frontend run lint
npm --prefix frontend run build

# 3. Policy hook verification
python .codex/hooks/pre_tool_use_policy.py --self-test

# 4. Git diff check
git diff --check
```

---

## 6. Final Deliverables (End of Mission)

Upon completing all slices and passing verification:

1. **`project_docs/active/status/RUN_REPORT.md`**:
   - **New Features Showcase**: detailed section highlighting each of the 6 tools (name, player problem, route/UI, API endpoints, key logic, test coverage).
   - **Completed Core Modules**: CosmoDrag, Hub, Journal, PlanetPulse, Crew, Pipeline.
   - **Verification Summary**: pytest output, lint/build outputs.
   - **Decision Log**: key design choices made during implementation.
   - **Recommended Next Slices**: forward-looking roadmap for future runs.
2. **`project_docs/active/architecture/API_CONTRACT.md`**:
   - Document all newly added endpoints (outposts, crafting, missions, portfolio, surveys, radar, media).
3. **`project_docs/active/status/project_execution_status.md`**:
   - Update phase, slices, and marks as complete.
4. **Root `README.md`**:
   - Update with complete overview of the application, architecture, new modules, and launch instructions.
