Goal: Evaluate the five-workspace terminal against the player's preferred exploration workflow.

## User Outcome
The player can inspect Command Hub, Galaxy & Surveys, Logistics & Industry, Fleet & Crew, and Logbook & Archives, then identify any specific adjustment they want.

## Scope
- User review of the local terminal and its example playthrough.
- Treat a new user request as the boundary for any implementation.
- Preserve player records, assignments, media and reference provenance.

## Contracts
- [Application setup](../../../README.md)
- [API contract](../architecture/API_CONTRACT.md)
- [Architecture](../architecture/README.md)

## Acceptance
- The player can identify the workspace for each intended action.
- Any requested adjustment has a concrete affected surface and observable outcome.

## Verification
- Open the local terminal with the documented setup and inspect the desired workflow.
- For an authorized code change: `.venv/Scripts/python.exe -m pytest -q backend`, `npm --prefix frontend run lint`, `npm --prefix frontend run build`, `npm --prefix frontend test`, and `git diff --check`.

## Owner
The user owns workflow review and selection of additional work. Codex acts on a concrete request and returns control after verification and documentation.
