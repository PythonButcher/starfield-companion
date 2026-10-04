# Starfield Companion

A local NASApunk ship terminal for expedition journals, planet surveys, crew assignments, media and industrial planning. React 19/Vite/Tailwind v4 provides the interface; Flask/SQLAlchemy stores player records in SQLite. AI defaults to deterministic mock mode and needs no account or key.

## Explore the terminal

| Route | Module |
|---|---|
| `/` | Explorer's Hub: interactive map, resume radar, briefing, fleet statistics, recent logs, favorites and milestones |
| `/journal` | Quantum Journal: drafts, narrative generation/review, CRUD, Markdown export and attached media |
| `/planet-pulse` | PlanetPulse: environmental filters, resource hunt, surveys, favorites and outpost links |
| `/crew` | Crew Command: roster, assignments and explainable skill ranking |
| `/media` | CosmoDrag: validated uploads, gallery, caption/tag editing, log/planet attachments |
| `/outposts` | Power & Logistics Planner: saved module plans, environment assumptions, power/storage alerts and shopping lists |
| `/crafting` | Recursive Crafting Resolver: component/research dependency trees, inventory deficits and supplier worlds |
| `/missions` | Mission Command: persistent objectives, checklists, priorities, factions and linked logs |
| `/portfolio` | Resource Coverage Portfolio: powered extraction coverage and three greedy site recommendations |
| `/surveys` | Survey Gap Ledger: player counters, missing categories and system completion |
| `/radar` | Session Resume Radar: last position, urgent missions, outpost alerts and same-system survey targets |
| `/ram` | Research board: pinned projects and procurement totals |

## Install and run (PowerShell, repository root)

Requires Python 3.11+ and Node/npm. Dependencies are installed into the repository's virtual environment.

```powershell
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
npm --prefix frontend ci
npm --prefix frontend run build
./.venv/Scripts/python.exe backend/main.py
```

Open [the local terminal](http://127.0.0.1:5000). Flask serves the production frontend and API from one origin. For frontend development, leave Flask running and run `npm --prefix frontend run dev` in another terminal; Vite proxies API/media requests.

Optional Electron wrapper: install with `npm --prefix desktop-shell ci`, build the frontend, then `npm --prefix desktop-shell start`. The wrapper uses the local Python environment, waits for backend health and opens the built app. It reuses an existing healthy backend and only stops a process it launched. `STARFIELD_DEV_URL=http://localhost:5173` opts into a separately running Vite server. Electron startup syntax is checked; its native window was not exercised in this run.

Copy `.env.example` to `.env` for optional configuration. Set `AI_MODE=live` and `OPENAI_API_KEY` only for live generation. Live paid-provider calls are not part of tests.

## Persistence and backups

The default database is **backend/starfield.db**; uploads live in **backend/uploads/**. Back up both while the app is stopped. Startup creates missing tables and seeds reference records without resetting player data. `DATABASE_URL` overrides the database location.

This workspace's empty legacy database was backed up and the checkpoint's `backend/instance/companion.db` copied to the canonical path on 2026-10-04. Both the source and timestamped legacy backup remain local and ignored by Git.

For another checkout still using that checkpoint path, stop its servers and run `./.venv/Scripts/python.exe scripts/migrate_database.py`. This command refuses to overwrite any populated destination. If it refuses, retain the existing database setting and merge records explicitly; do not delete either database. The existing Flask `import-legacy` command reads old logs without modifying their source.

Media accepts JPEG, PNG, WebP, GIF and MP4, up to 10 MB per file. Images are decoded/verified; MP4 container boundaries are checked without transcoding or promising codec compatibility. Stored filenames are UUIDs. Deleting a planet/log detaches its media; deleting media removes the stored file.

## Reference data and limits

The reproducible Wiki builder supplies **128 systems, 109 resources, 112 recipes/research projects and 44 outpost modules**. Read [provenance](backend/data/SOURCES.md) and the [builder instructions](backend/data_pipeline/README.md). Adapted Wiki datasets retain contributor attribution and CC-BY-SA-4.0 licensing. The footer exposes reference freshness.

Planet supplier searches currently cover seven starter worlds plus player additions; crew starts with nine entries. System positions are schematic, never physical distances. Outpost power uses explicit assumptions; storage capacity and extraction rates require player measurements. Survey progress is player-entered. Coverage recommendations do not guarantee that all deposits share one landing site. Crafting excludes skill discounts and research prerequisites, and reports unresolved leaves as purchase requirements.

## Verify

```powershell
./.venv/Scripts/python.exe -m pytest -q backend
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend test
python .codex/hooks/pre_tool_use_policy.py --self-test
git diff --check
```

Browser tests use installed Microsoft Edge, ports 5001/5174, an in-memory database and temporary uploads. They never touch player records. The policy hook is self-tested but is not claimed to be automatically registered in the host.

See the [run report](project_docs/active/status/RUN_REPORT.md), [API contract](project_docs/active/architecture/API_CONTRACT.md), and [active gate](project_docs/active/active_gate/README.md).
