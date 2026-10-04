Goal: Execute Mission Run 2 to overhaul app experience, consolidate navigation into 5 unified workspaces, seed a rich Constellation starter state, and connect star systems to orbiting planets.

## User Outcome
Players open a living, authentic NASApunk ship terminal that immediately provides context on their playthrough, seamlessly connects star systems to their planets and outposts, and eliminates the overwhelming 10-tab navbar.

## Scope
- Consolidate navigation into 5 purpose-driven workspaces: Command Hub, Galaxy & Surveys, Logistics & Industry, Fleet & Crew, and Logbook & Archives.
- Seed a rich default "Constellation Starter State" (The Frontier, Barrett & Vasco, Vectera artifact log, initial missions, Luna outpost, partial survey data).
- Expand planetary database from 7 planets to 40-60 core Settled Systems worlds across Sol, Alpha Centauri, Cheyenne, Volii, Narion, etc.
- Connect star systems on the map to an inspector showing orbiting worlds, local outposts, and missions.
- Refine terminal language and polish form validation UX (no instant red errors on empty forms).

## Contracts
- [API contract](../architecture/API_CONTRACT.md)
- [Architecture](../architecture/README.md)
- [Mission Brief](../../../CODEX_MISSION_BRIEF.md)

## Acceptance
- Existing 71 backend tests continue to pass with 0 regressions.
- Frontend lint and production build pass with 0 errors.
- New users immediately see a populated, interactive terminal instead of empty cards and zeros.
- Navigation has only 5 clean primary workspaces with sub-tabs for specific tools.
- Selecting a star system on the map displays its orbiting planets and local assets.

## Verification
- `python -m pytest -q backend`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `python .codex/hooks/pre_tool_use_policy.py --self-test`
- `git diff --check`

## Owner
Codex implements Mission Run 2 slice-by-slice, verifies each slice, and updates the run report and execution status.
