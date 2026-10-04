# Architecture

Flask's `create_app(config)` applies configuration before SQLAlchemy initialization. Domain blueprints expose JSON APIs; services implement crafting expansion, outpost estimates and cross-module summaries. Shared validators reject unknown fields and invalid types. Lists return arrays with X-Total-Count, limit and offset. Some filters operate on in-memory lists; full-game planet ingestion requires indexed queries and paginated pickers.

SQLite defaults to `backend/starfield.db`. Startup creates missing tables and refreshes reference catalogs by content digest; player tables are never dropped or replaced. The checkpoint migration uses SQLite backup transactions, retains the original companion database, backs up an empty legacy destination and refuses any populated destination. Back up the database and uploads together with servers stopped.

Player models are ExpeditionLog, PlanetProfile, CrewMember, MediaItem, OutpostPlan, PlayerObjective and SurveyProgress. Planet/log foreign keys use SET NULL for attachments and linked plans/objectives; planet survey counters cascade on deletion. Mission journal links are maintained in the same transaction as log creation/deletion. Planet and crew starter rows remain editable overlays; a dedicated immutable planet reference layer is the next bounded data change.

ReferenceRecord contains read-only imported recipe, module, resource and system payloads. The Wiki pipeline stores revision/URL/license/fetch provenance in generated JSON. System positions are schematic. Player-derived calculations expose their assumptions and unknowns instead of inventing game mechanics.

Media is stored under generated UUID names outside source control. Raster images are verified with Pillow; MP4 gets bounded container checks. The file-serving route resolves a registered filename only. Gallery metadata persists in SQLite; planet/log deletion detaches media without removing the file.

AI providers share narrative/strategy interfaces. Mock mode is deterministic and default; live mode requires an environment key and uses a versioned prompt with bounded timeout. Generated narrative remains a draft until the player accepts it.

React uses a centralized JSON client plus an XHR multipart transport for upload progress. useResource cancels obsolete reads and exposes retry/loading/error state. Tailwind v4 tokens and shared primitives govern layout, focus, dialogs, status and panels. New views connect through stable record IDs and query parameters; locally saved journal drafts are scoped to their mission/expedition context.

The Electron shell uses the repository virtual environment, waits for backend health and loads Flask's built frontend by default. An existing healthy companion process is reused; only a child it owns is stopped on exit. Native packaging/window behavior requires a separate platform smoke test.
