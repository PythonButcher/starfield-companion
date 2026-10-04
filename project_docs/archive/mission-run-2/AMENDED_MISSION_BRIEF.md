> Completed reference: amended Mission Run 2 request, executed 2026-10-04. Use the active gate for new work.

# Starfield Companion — Codex Mission Run 2: Experience & Immersion Overhaul

> **How to execute:** Tell Codex:
> *"Read `CODEX_MISSION_BRIEF.md` and execute Mission Run 2 end-to-end: implement the new Inter-System Supply Chain Visualizer and Fleet Blueprint Manager, consolidate the navbar into 5 unified workspaces, seed the Constellation starter state, connect star systems to orbiting planets, expand planetary coverage, and eliminate empty-state friction."*

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
6. **Missing "Killer" Features**: The app lacks standout features that solve the most complex, frustrating parts of the actual game (like tracking complex cargo networks or saving ship builds).

**Run 2 Goal**: Transform the app from a collection of isolated administrative forms into a **living, intuitive, and connected NASApunk ship terminal**, highlighted by truly incredible standout features.

---

## 1. Scope & Deliverables

### Slice 1: The "Killer" Standout Features
Based on deep research into the Starfield community's most requested tools for 2024–2026, implement these two major standout capabilities:

1. **Inter-System Supply Chain Visualizer (Cargo Link Mapper)**:
   - **Problem**: Players struggle to manage complex crafting chains across multiple star systems, often resorting to pen-and-paper or Draw.io to track Helium-3 fuel routes and cargo links.
   - **Feature**: An interactive, node-based visual canvas (using a library like React Flow, Mermaid, or a custom HTML5 canvas) inside the *Logistics* workspace.
   - **Mechanics**: Players can place outposts as nodes, draw directed "Cargo Link" edges between them, and visualize the flow of extracted resources. The system should highlight broken links or fuel shortages.

2. **Fleet Blueprint & Loadout Manager (Ship Forge)**:
   - **Problem**: The game lacks a way to save ship blueprints or view ship stats outside of a shipyard.
   - **Feature**: A dedicated module inside the *Fleet & Crew* workspace where players can log and save their custom ship builds.
   - **Mechanics**: A builder form where players can add modules (Reactors, Engines, Grav Drives, Habs) to a loadout list. The app calculates and displays aggregated stats: Total Mass, Mobility, Top Speed, Jump Range (LY), Hull, Shield, and Crew Capacity based on the sum of the modules.

---

### Slice 2: Consolidate Navigation into 5 Purpose-Driven Workspaces
Replace the flat 10-button navbar with 5 structured workspaces that group related tools:

1. **Command Hub** (`/`):
   - Integrated dashboard: Session Resume Radar + AI Ship Briefing + Fleet/Outpost Telemetry + Recent Captain's Logs.
   - Quick Action bar: `+ Record Log`, `+ Plan Outpost`, `+ New Mission`.
2. **Galaxy & Surveys** (`/galaxy`):
   - Replaces isolated `/planet-pulse` and `/surveys`.
   - **Interactive Galaxy Map**: Systems laid out by sector coordinates (Sol and Alpha Centauri near center, Cheyenne NW, Volii SW, Kryx NE).
   - **System Drawer / Detail**: Clicking a system opens an inspector showing: Star class, Level, Faction, and **List of Orbiting Worlds & Moons**.
   - **Planet & Survey Inspector**: Selecting any planet displays its resources, hazards, survey progress (with Survey Gap breakdown).
3. **Logistics & Industry** (`/logistics`):
   - Merges Outpost Planner, Resource Portfolio, Crafting Resolver, and the new **Supply Chain Visualizer**.
   - Form UX polish: **Zero initial error messages**—validate only on submit or blur.
4. **Fleet & Crew** (`/crew`):
   - Constellation roster, Outpost assignments, and the new **Fleet Blueprint Manager**.
5. **Logbook & Archives** (`/journal`):
   - Combines Quantum Journal, Mission Objectives checklist, and CosmoDrag Media Gallery.

---

### Slice 3: The "Constellation Starter State" (Living Game State)
Add an automatic starter seed so first-time users experience a living, functional terminal:
- **Ship**: *The Frontier* (home ship).
- **Assigned Crew**: Barrett (Ship) and VASCO (Ship).
- **Current Position**: Vectera (Narion system).
- **Recent Captain's Log**: *"Vectera Excavation: Artifact Discovery"*
- **Active Missions**: *"One Small Step"* and *"Survey the Narion System"*.
- **Starter Outpost**: *"Luna Extraction Post"* (Luna, Sol system).
- **Initial Survey Progress**: Vectera: 100% surveyed. Jemison: 65% surveyed.

---

### Slice 4: Planetary Coverage Expansion
Expand `backend/data/planets.json` from 7 planets to **at least 40–60 major canonical worlds and moons** across the primary Settled Systems (Sol, Alpha Centauri, Cheyenne, Volii, Narion, Kryx, Porrima, Olympus, Bessel). Ensure each planet is linked to its `system_name` and contains accurate resource symbols and hazard ratings.

---

### Slice 5: Terminal Immersion & Language Polish
Replace sterile developer terminology with authentic Bethesda / Constellation ship terminal language:
- Change `"Environment assumptions"` → `"Atmospheric & Orbital Calibration"`.
- Style system danger and level tags with visual indicators (e.g. Level 1–15 Safe/Green, Level 15–40 Caution/Amber, Level 40+ Danger/Red).

---

## 2. Technical Contracts & Guardrails

- **Preserve Existing Backend Logic**: Do not break the existing 71 tests!
- **Redirects / Compatibility**: Keep old route URLs redirecting cleanly.
- **Tests**: Add/update Playwright and pytest suites to reflect the consolidated workspaces, the new visualizer tools, and starter data.

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
```

---

## 4. Final Deliverables

1. Commit changes on `codex/mission-run-1` with clean semantic commits (`feat(nav): consolidate workspaces`, `feat(logistics): add supply chain visualizer`, `feat(fleet): add ship blueprint manager`).
2. Update `project_docs/active/status/RUN_REPORT.md` with Run 2 accomplishments.
3. Update `project_docs/active/status/project_execution_status.md` and `project_docs/active/architecture/API_CONTRACT.md`.
4. Ensure root `README.md` reflects the 5 consolidated workspaces.
