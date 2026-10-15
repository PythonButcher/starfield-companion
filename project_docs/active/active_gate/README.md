Goal: Review the copied-save display and define the fresh-save copy workflow.

## User Outcome
The player can assess the Current playthrough panel and describe how fresh saves should reach the separate copy folder.

## Scope
- Review Current playthrough on Command Hub with the real copied save and manual refresh.
- Confirm the display and error labels satisfy the user's needs.
- Define the source save directory, copy trigger, completion signal and retention rules for a copy process.
- Scope automatic copying and any app refresh changes only after the user's review.
- Preserve player records and original/copy save files.

## Contracts
- [API contract](../architecture/API_CONTRACT.md)
- [Architecture](../architecture/README.md)
- [Extractor guide](../../../backend/save_reader/README.md)

## Acceptance
- The user can identify the save date and distinguish copied-save details from app notes and plans.
- The requested fresh-save workflow has an explicit source/destination and observable acceptance criteria.
- Implementation scope preserves source files and has proportionate verification.

## Verification
- `.venv/Scripts/python.exe -m pytest -q backend --basetemp=backend/instance/playthrough-tests`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `npm --prefix frontend test`
- Read the real copied folder through the endpoint and inspect desktop/mobile layouts.
- `.venv/Scripts/python.exe .codex/hooks/pre_tool_use_policy.py --self-test`
- `.venv/Scripts/python.exe C:/Users/18022/.codex/skills/active-gate-governance/scripts/check_active_gate.py project_docs/active/active_gate .`
- `git diff --check`

## Owner
The user reviews the panel and chooses the fresh-save workflow. Codex scopes the next concrete request.
