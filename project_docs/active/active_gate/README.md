Goal: Deliver a verified Starfield companion with persistent journal, planet, crew, media, AI assistance, and a connected explorer dashboard.

## User Outcome
Players can record expeditions, generate and accept captain's logs, survey planets, plan crew assignments, organize screenshots, and navigate their data from the Hub.

## Scope
Foundation and core modules across `backend/`, `frontend/`, the agent harness, and documentation. Optional enhancements are eligible only after core verification.

## Contracts
- [API contract](../architecture/API_CONTRACT.md)
- [Architecture](../architecture/README.md)

## Acceptance
Domain CRUD, validation and missing-record errors are tested. Mock AI needs no key. Frontend handles loading, empty and error states. Map controls, R.A.M. and Drive-By remain usable. User data survives startup. Source data has provenance.

## Verification
- `.venv/Scripts/python -m pytest -q backend`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `python .codex/hooks/pre_tool_use_policy.py --self-test`
- Start backend and frontend; exercise journal generation/edit/delete, planet filtering, resource hunt, crew optimization, media attachment, and Hub panels.
- `git diff --check`

## Owner
Codex implements and verifies each slice, then returns evidence and remaining scope to the user.
