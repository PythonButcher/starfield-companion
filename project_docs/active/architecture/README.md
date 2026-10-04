# Architecture

Flask's `create_app(config)` owns configuration before database initialization. Domain blueprints expose JSON endpoints. A central validator rejects unknown fields and invalid types. Lists return arrays with `X-Total-Count`, `limit` and `offset`; filters are applied before pagination. Frontend uses relative `/api` through one fetch client; Vite proxies API and uploads in development.

SQLite uses `backend/instance/companion.db`. This intentionally separate schema preserves the legacy `backend/starfield.db`. Startup creates missing tables and seeds reference data exactly once; it never drops tables. Explicit CLI commands handle reset (confirmation required) and legacy log import. Back up the database and uploads together.

AI providers share narrative and strategy methods. Mock is deterministic and default; live mode requires an environment key and uses a versioned prompt and bounded timeout. Generated content is a draft requiring user acceptance. Resource ranking and crew optimization are transparent local heuristics, not game simulation.

Tailwind v4 tokens live in `frontend/src/index.css`; shared primitives implement focus states, dialogs, status and panels. The palette uses charcoal, warm white, blue and restrained Constellation stripes. Dynamic SVG coordinates and progress geometry may use attributes/styles; layout uses classes.
