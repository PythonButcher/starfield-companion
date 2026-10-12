Goal: Review extracted save data and choose the first app connection.

## User Outcome
The player can inspect readable data from their copied saves and choose which information should appear in the companion app.

## Scope
- Review player details, save timestamps, game versions and plugin lists using the extractor.
- Confirm the separate copy-folder process publishes complete `.sfs` files with preserved modification times.
- Capture a bounded request for the app surface, refresh behavior and handling of stale or unreadable saves.
- Preserve player records and copied saves. Inventory, ship builds and other undecoded gameplay require their own feasibility investigation.

## Contracts
- [Application setup](../../../README.md)
- [API contract](../architecture/API_CONTRACT.md)
- [Architecture](../architecture/README.md)
- [Extractor guide and data contract](../../../backend/save_reader/README.md)

## Acceptance
- The user can distinguish decoded metadata from undecoded gameplay records.
- The requested app display and refresh behavior have observable acceptance criteria.
- Any implementation scope has proportionate verification and preserves player data.

## Verification
- `.venv/Scripts/python.exe -m pytest -q backend/test_save_reader.py --basetemp=backend/instance/save-reader-review-tests`
- `.venv/Scripts/python.exe scripts/extract_save.py --latest "D:\Starfield\StarfieldCompanionSaves"`
- `.venv/Scripts/python.exe .codex/hooks/pre_tool_use_policy.py --self-test`
- Run `.venv/Scripts/python.exe C:/Users/18022/.codex/skills/active-gate-governance/scripts/check_active_gate.py project_docs/active/active_gate .` after changing this gate.
- Run `git diff --check` before committing.

## Owner
The user selects the first app connection. Codex scopes a concrete implementation request and its verification.
