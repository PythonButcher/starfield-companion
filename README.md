# Starfield Companion

A local NASApunk ship terminal for expedition journals, planet surveys, crew assignments, media and industrial planning. React 19/Vite/Tailwind v4 provides the interface; Flask/SQLAlchemy stores player records in SQLite. AI defaults to deterministic mock mode and needs no account or key.

## Explore the terminal

| Route | Workspace |
|---|---|
| `/` | **Command Hub**: resume radar, ship briefing, home ship, crew/outpost telemetry, recent logs and quick actions |
| `/galaxy` | **Galaxy & Surveys**: sector map, system inspector, 47 sourced worlds, resource hunt, planetary details and `/galaxy/surveys` ledger |
| `/logistics` | **Logistics & Industry**: outposts, coverage matrix and crafting sub-tabs; research board under `/logistics/crafting/research` |
| `/crew` | **Fleet & Crew**: The Frontier registry, roster, ship/outpost assignments and explainable skill ranking |
| `/journal` | **Logbook & Archives**: Captain's Logs, `/journal/missions` checklists and `/journal/media` archive |

The Drive-By quick-action drawer is available throughout the terminal. `N` opens a log, `Ctrl/Cmd+K` searches systems. Legacy module URLs redirect into these workspaces, retaining queries and anchors.

## Constellation starter state

A fresh database opens at **Vectera / Narion** with **The Frontier**, Barrett and VASCO assigned, the artifact-discovery log (stardate 2330.134), One Small Step and a Narion survey mission. Luna Extraction Post has one iron extractor, two solar arrays and solid storage. Its explicit sample solar factor produces **+3 net power**; replace that assumption with your own readings. Vectera is fully surveyed; Jemison is at 65% and Kreet at 25%.

The starter playthrough is illustrative, not an imported game save. The footer's **Constellation starter settings** can clear unchanged samples after typed confirmation. Edited records, attached media, referenced logs and player additions are preserved. Cleared samples never reappear automatically. Existing databases receive missing new catalog worlds once, without replacing player edits or resurrecting deleted legacy worlds; they do not receive sample playthrough records.

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

The reproducible Wiki builders supply **47 worlds, 128 systems, 109 resources, 112 recipes/research projects and 44 outpost modules**. Read [provenance](backend/data/SOURCES.md) and the [builder instructions](backend/data_pipeline/README.md). Adapted Wiki datasets retain contributor attribution and CC-BY-SA-4.0 licensing. The footer exposes reference freshness.

Planet supplier searches cover 47 worlds in Sol, Alpha Centauri, Cheyenne, Volii, Narion, Kryx, Porrima, Olympus and Bessel, plus player additions. Crew starts with nine entries. System positions are schematic sector coordinates, never physical distances. Hazard labels are inferred preparation cautions, not game danger ratings. Outpost power uses explicit assumptions; storage capacity and extraction rates require player measurements. Survey progress is player-entered after the illustrative starter state. Jemison uses sourced totals (8 flora, 9 fauna, 3 traits); The Lock is a location on Suvorov, not a separate world. Coverage recommendations do not guarantee co-located deposits. Crafting excludes skill discounts and research prerequisites, and reports unresolved leaves as purchase requirements.

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
