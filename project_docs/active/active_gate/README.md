Goal: Review the terminal workflows and identify the next concrete user request.

## User Outcome
The player can assess cargo planning, ship loadouts, exploration and session tracking using their own playthrough.

## Scope
- User workflow review of the five workspaces, Cargo Link Mapper and Ship Forge.
- Capture a specific requested behavior before authorizing a new implementation scope.
- Preserve player records, saved designs and uploaded media.

## Contracts
- [Application setup](../../../README.md)
- [API contract](../architecture/API_CONTRACT.md)
- [Architecture](../architecture/README.md)

## Acceptance
- The user can describe the desired outcome and the affected workspace.
- Any implementation request has bounded acceptance criteria and proportionate verification.

## Verification
- Start the local terminal with `.venv/Scripts/python.exe backend/main.py` and inspect the relevant workflow.
- For a code change, run `.venv/Scripts/python.exe -m pytest -q backend`, `npm --prefix frontend run lint`, `npm --prefix frontend run build` and relevant browser tests.
- Run `.venv/Scripts/python.exe C:/Users/18022/.codex/skills/active-gate-governance/scripts/check_active_gate.py project_docs/active/active_gate .` after changing this gate.
- Run `git diff --check` before committing.

## Owner
The user chooses the next outcome. Codex scopes and implements a concrete request, then returns control after verification and documentation.
