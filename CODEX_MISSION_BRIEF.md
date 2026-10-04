# Starfield Companion — Codex Mission Run 2: Experience & Immersion Overhaul

> **How to execute:** Tell Codex:
> *"Read `CODEX_MISSION_BRIEF.md` and execute Mission Run 2 end-to-end: consolidate the 10-tab navbar into 5 unified workspaces, seed the Constellation starter state, connect star systems to orbiting planets, expand planetary coverage, and eliminate empty-state friction."*

---

## 0. Context & Ground Truth (Where We Stand)

In Mission Run 1, Codex successfully built:
- Full backend architecture (Flask app factory, Blueprints, SQLite persistence).
- All 6 requested player tools (Outpost Planner, Crafting Resolver, Mission Tracker, Portfolio Coverage, Survey Gap Ledger, Session Resume Radar).
- Media uploads (CosmoDrag) and MediaWiki reference ingestion pipeline.
- 71 backend tests passing, 10 browser tests passing, 0 ESLint errors, clean build.

**The Problem to Solve in Run 2:**
While technically complete, the app currently feels **confusing, disjointed, and empty**:
1. **Navigation Overload**: A flat row of 10–12 disconnected tabs with no workflow hierarchy.
2. **Ghost-Town Void**: On a fresh launch, 90% of screens show `"0 records on file"`, `"Unrecorded"`, or `"No outposts planned"`.
3. **Only 7 Planets**: The DB only has 7 planets, despite having 128 systems.
4. **Spreadsheet Star Map**: The map displays 128 systems in an alphabetical rectangular grid rather than a galactic coordinate layout, and clicking a system doesn't show its orbiting planets.
5. **Harsh Form UX**: Opening forms immediately triggers red error banners before typing.

**Run 2 Goal**: Transform the app from a collection of isolated administrative forms into a **living, intuitive, and connected NASApunk ship terminal**.

---

## 1. Scope & Deliverables

### Slice 1: Consolidate Navigation into 5 Purpose-Driven Workspaces
Replace the flat 10-button navbar with 5 structured workspaces that group related tools:

1. **Command Hub** (`/`):
   - Integrated dashboard: Session Resume Radar + AI Ship Briefing + Fleet/Outpost Telemetry + Recent Captain's Logs.
   - Quick Action bar: `+ Record Log`, `+ Plan Outpost`, `+ New Mission`.
2. **Galaxy & Surveys** (`/galaxy`):
   - Replaces isolated `/planet-pulse` and `/surveys`.
   - **Interactive Galaxy Map**: Systems laid out by sector coordinates (Sol and Alpha Centauri near center, Cheyenne NW, Volii SW, Kryx NE).
   - **System Drawer / Detail**: Clicking a system opens an inspector showing:
     - Star class (G2V, M, etc.), Level, Faction.
     - **List of Orbiting Worlds & Moons** in that system.
     - Active outposts and missions in this system.
   - **Planet & Survey Inspector**: Selecting any planet displays its resources, hazards, survey progress (with Survey Gap breakdown), notes, and a direct button to "Build Outpost" or "Launch Expedition Log".
   - Includes the deterministic **Resource Hunt** bar.
3. **Logistics & Industry** (`/logistics`):
   - Merges Outpost Planner (`/outposts`), Resource Portfolio (`/portfolio`), and Crafting Resolver (`/crafting` & `/ram`).
   - Clean sub-navigation: `[ Outpost Planner | Resource Coverage Matrix | Crafting & Research Trees ]`.
   - Form UX polish: **Zero initial error messages**—validate only on submit or blur.
4. **Crew Command** (`/crew`):
   - Constellation roster, Ship assignments (*The Frontier*, etc.), Outpost assignments, and explainable crew optimization.
5. **Logbook & Archives** (`/journal`):
   - Combines Quantum Journal (`/journal`), Mission Objectives checklist (`/missions`), and CosmoDrag Media Gallery (`/media`).
   - Sub-navigation: `[ Captain's Logs | Mission Checklists | Media Archive ]`.

*Note: Drive-By remains accessible from anywhere via hotkey or quick-action drawer.*

---

### Slice 2: The "Constellation Starter State" (Living Game State)
Add an automatic starter seed (with a reset/wipe option in settings or footer) so first-time users experience a living, functional terminal:
- **Ship**: *The Frontier* (home ship).
- **Assigned Crew**: Barrett (Ship) and VASCO (Ship).
- **Current Position**: Vectera (Narion system).
- **Recent Captain's Log**:
  - Title: *"Vectera Excavation: Artifact Discovery"*
  - Planet: Vectera (Narion) / Stardate: 2330.134
  - AI Narrative: In-universe Constellation log describing the strange mineral anomaly and Crimson Fleet encounter.
- **Active Missions**:
  - *"One Small Step"* (Main / Constellation): Checklist steps: `[x] Extract artifact`, `[x] Defeat Crimson Fleet raiders`, `[ ] Deliver artifact to the Lodge on Jemison`.
  - *"Survey the Narion System"* (Survey): In-progress checklist.
- **Starter Outpost**:
  - Name: *"Luna Extraction Post"* (Luna, Sol system).
  - Modules: Iron Extractor (1), Solar Array (2), Solid Storage (1). Net power: +3 surplus.
- **Initial Survey Progress**:
  - Vectera: 100% surveyed.
  - Jemison: 65% surveyed (Flora: 3/5, Fauna: 2/4, Traits: 1/1).

---

### Slice 3: Planetary Coverage Expansion
Expand `backend/data/planets.json` (via the MediaWiki pipeline or curated reference seed) from 7 planets to **at least 40–60 major canonical worlds and moons across the primary Settled Systems**:
- **Sol**: Mercury, Venus, Earth, Luna, Mars, Phobos, Deimos, Titan, Ganymede.
- **Alpha Centauri**: Jemison, Gagarin, Olivas, Chawla, Kurtz.
- **Cheyenne**: Akila, Codos, Montara, Montara Luna, Bindi.
- **Volii**: Volii Alpha (Neon), Volii Beta, Volii Epsilon.
- **Narion**: Vectera, Kreet, Anselon, Niira, Sumati.
- **Kryx**: Suvorov, The Lock.
- **Porrima**: Porrima II (Paradiso), Porrima III.
- **Olympus**: Nesoi, Ananke.
- **Bessel**: Bessel III.

Ensure each planet is linked to its `system_name` and contains accurate resource symbols and hazard ratings.

---

### Slice 4: Terminal Immersion & Language Polish
Replace sterile developer terminology with authentic Bethesda / Constellation ship terminal language:
- Change `"Environment assumptions (Factor 1 uses Wiki baseline)"` → `"Atmospheric & Orbital Calibration"`.
- Change `"Greedy set cover calculation"` → `"Optimal Resource Prospecting Model"`.
- Change `"wind is zero in recorded vacuum"` → `"Atmospheric Status: Vacuum (Wind Turbines Inactive)"`.
- Style system danger and level tags with visual indicators (e.g. Level 1–15 Safe/Green, Level 15–40 Caution/Amber, Level 40+ Danger/Red).

---

## 2. Technical Contracts & Guardrails

- **Preserve Existing Backend Logic**: Do not break the existing 71 tests! All endpoints (`/api/outposts`, `/api/missions`, `/api/crafting/resolve`, `/api/surveys/gaps`, `/api/radar/session_handover`, etc.) must remain functional; frontend routes are being reorganized into unified layouts.
- **Redirects / Compatibility**: Keep old route URLs redirecting cleanly (e.g., `/planet-pulse` → `/galaxy`, `/outposts` → `/logistics/outposts`, `/missions` → `/journal/missions`).
- **Tests**: Add/update Playwright and pytest suites to reflect the consolidated workspaces and starter data.

---

## 3. Definition of Done & Verification

Run and pass all of the following:

```powershell
# 1. Backend tests (all passing)
python -m pytest -q backend

# 2. Frontend lint & build (0 errors)
npm --prefix frontend run lint
npm --prefix frontend run build

# 3. Policy hook verification
python .codex/hooks/pre_tool_use_policy.py --self-test

# 4. Browser smoke test (Playwright)
npx playwright test --config frontend/playwright.config.js
```

---

## 4. Final Deliverables

1. Commit changes on `codex/mission-run-1` with clean semantic commits (`feat(nav): consolidate workspaces`, `feat(seed): add constellation starter manifest`, `feat(galaxy): map system-to-planet hierarchy`).
2. Update `project_docs/active/status/RUN_REPORT.md` with Run 2 accomplishments.
3. Update `project_docs/active/status/project_execution_status.md` and `project_docs/active/architecture/API_CONTRACT.md`.
4. Ensure root `README.md` reflects the 5 consolidated workspaces.
