Goal: Expand licensed planet and moon reference coverage while preserving every player's survey, note, favorite, mission and outpost association.

## User Outcome
Players can search a broader planetary catalog, resolve more material suppliers and compare survey gaps without losing their own records.

## Scope
Add an immutable planet/moon reference layer and explicit player overlays in backend models, the Wiki pipeline and PlanetPulse APIs. Add indexed server filtering and paginated selection controls before increasing record counts. Keep provenance and coverage limitations visible.

## Contracts
- [API contract](../architecture/API_CONTRACT.md)
- [Architecture](../architecture/README.md)
- [Reference builder](../../../backend/data_pipeline/README.md)

## Acceptance
Reference refreshes preserve player records and stable associations. Unknown data remains unknown. Catalog counts, missing fields and broken references are reported. Large lists are filtered and paginated on the server. Existing cross-module behavior remains usable.

## Verification
- `./.venv/Scripts/python.exe -m pytest -q backend`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `npm --prefix frontend test`
- `python .codex/hooks/pre_tool_use_policy.py --self-test`
- `git diff --check`
- Verify refresh preservation and resource/survey searches against sampled Wiki revisions.

## Owner
Codex implements this bounded data expansion when requested and returns verified results to the user.
